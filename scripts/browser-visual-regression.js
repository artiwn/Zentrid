const { spawn } = require('child_process');
const { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } = require('fs');
const { tmpdir } = require('os');
const { dirname, join, relative } = require('path');
const { mockApi } = require('./browser-e2e');
const { viewports, scenarios } = require('./browser-visual-manifest');

const root = process.cwd();
const port = Number(process.env.ZENTRID_VISUAL_PORT || 5183);
const host = process.env.ZENTRID_VISUAL_HOST || '127.0.0.1';
const baseUrl = `http://${host}:${port}`;
const outputRoot = join(root, process.env.ZENTRID_VISUAL_OUTPUT || 'artifacts/visual-regression');
const baselineRoot = join(root, 'tests/visual-baselines', process.platform);
const updateBaselines = process.env.ZENTRID_VISUAL_UPDATE === '1';
const requireBaselines = process.env.ZENTRID_VISUAL_REQUIRE_BASELINES === '1';
const scenarioFilter = String(process.env.ZENTRID_VISUAL_SCENARIOS || '').split(',').map(value => value.trim()).filter(Boolean);
const viewportFilter = String(process.env.ZENTRID_VISUAL_VIEWPORTS || '').split(',').map(value => value.trim()).filter(Boolean);
const activeScenarios = scenarioFilter.length ? scenarios.filter(item => scenarioFilter.includes(item.id)) : scenarios;
const activeViewports = viewportFilter.length ? viewports.filter(item => viewportFilter.includes(item.id)) : viewports;

function browserCandidates() {
  const candidates = [];
  if (process.env.ZENTRID_BROWSER_PATH) candidates.push(process.env.ZENTRID_BROWSER_PATH);
  if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean)) {
      candidates.push(join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium');
  } else {
    candidates.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/microsoft-edge');
  }
  return [...new Set(candidates)].filter(candidate => candidate && existsSync(candidate));
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitForFile(path, timeoutMs = 15000) { const end = Date.now() + timeoutMs; while (Date.now() < end) { if (existsSync(path)) return; await wait(100); } throw new Error(`Timed out waiting for ${path}`); }
async function waitForHttp(url, timeoutMs = 15000) { const end = Date.now() + timeoutMs; let last; while (Date.now() < end) { try { const response = await fetch(url); if (response.ok) return; last = `${response.status}`; } catch (error) { last = error instanceof Error ? error.message : String(error); } await wait(150); } throw new Error(`Timed out waiting for ${url}: ${last || 'unavailable'}`); }

class CdpConnection {
  constructor(url) { this.url = url; this.socket = null; this.nextId = 1; this.pending = new Map(); this.handlers = new Map(); }
  async connect() { await new Promise((resolve, reject) => { const socket = new WebSocket(this.url); this.socket = socket; socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); socket.addEventListener('message', event => this.onMessage(event.data)); socket.addEventListener('close', () => { for (const item of this.pending.values()) item.reject(new Error('CDP closed.')); this.pending.clear(); }); }); }
  onMessage(raw) { const message = JSON.parse(String(raw)); if (message.id) { const item = this.pending.get(message.id); if (!item) return; this.pending.delete(message.id); message.error ? item.reject(new Error(message.error.message || 'CDP failed.')) : item.resolve(message.result || {}); return; } for (const handler of this.handlers.get(message.method) || []) handler(message.params || {}); }
  send(method, params = {}) { if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error('CDP is not open.')); const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); }); }
  on(method, handler) { const list = this.handlers.get(method) || []; list.push(handler); this.handlers.set(method, list); }
  close() { if (this.socket) this.socket.close(); }
}

async function createPage(debugPort) { const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' }); if (!response.ok) throw new Error(`Unable to create visual page: ${response.status}`); return response.json(); }
async function evaluate(cdp, expression) { const response = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Browser evaluation failed.'); return response.result?.value; }
async function waitForCondition(cdp, expression, label, timeoutMs = 15000) { const end = Date.now() + timeoutMs; while (Date.now() < end) { try { if (await evaluate(cdp, expression)) return; } catch { /* navigation */ } await wait(100); } throw new Error(`Timed out waiting for ${label}.`); }
function selectorExpression(selector) { return `document.querySelector(${JSON.stringify(selector)})`; }

async function prepareScenario(cdp, actions = []) {
  for (const action of actions) {
    if (action.type === 'click') {
      const ok = await evaluate(cdp, `(() => { const el=${selectorExpression(action.selector)}; if(!el)return false; el.click(); return true; })()`);
      if (!ok) throw new Error(`Visual prepare click target missing: ${action.selector}`);
    } else if (action.type === 'wait-count') {
      await waitForCondition(cdp, `document.querySelectorAll(${JSON.stringify(action.selector)}).length >= ${Number(action.min || 1)}`, `${action.min || 1} × ${action.selector}`, Number(action.timeoutMs || 15000));
    } else if (action.type === 'wait-selector') {
      await waitForCondition(cdp, `Boolean(${selectorExpression(action.selector)})`, action.selector, Number(action.timeoutMs || 15000));
    } else throw new Error(`Unsupported visual prepare action: ${action.type}`);
  }
}

const auditExpression = `(() => {
  const viewport = { width: innerWidth, height: innerHeight };
  const visible = el => { const s=getComputedStyle(el); const r=el.getBoundingClientRect(); return s.display!=='none' && s.visibility!=='hidden' && Number(s.opacity)!==0 && r.width>0 && r.height>0; };
  const label = el => el.id ? '#'+el.id : el.classList.length ? el.tagName.toLowerCase()+'.'+[...el.classList].slice(0,3).join('.') : el.tagName.toLowerCase();
  const allowedOverflow = el => Boolean(el.closest('.data-table,.api-field-map-table,.api-contract-snapshot-table,pre,code,[data-visual-allow-overflow],.sidebar,.detail-drawer,.modal-backdrop'));
  const overflow = [];
  const clipped = [];
  const tinyTargets = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const r=el.getBoundingClientRect(); const s=getComputedStyle(el);
    if (!allowedOverflow(el) && (r.left < -2 || r.right > innerWidth + 2)) overflow.push({ element:label(el), left:Math.round(r.left), right:Math.round(r.right), width:Math.round(r.width) });
    if (el.children.length===0 && (el.textContent||'').trim().length>12 && el.scrollWidth > el.clientWidth + 3 && s.overflowX==='hidden' && s.textOverflow!=='ellipsis') clipped.push({ element:label(el), text:(el.textContent||'').trim().slice(0,80), clientWidth:el.clientWidth, scrollWidth:el.scrollWidth });
    if (innerWidth <= 768 && el.matches('button,a[href],input,select,textarea,[role="button"]') && !el.hasAttribute('disabled') && r.width < 30 && r.height < 30) tinyTargets.push({ element:label(el), width:Math.round(r.width), height:Math.round(r.height) });
  }
  const stateCopies=[...document.querySelectorAll('.fleet-ux-state-copy')].filter(visible).map(el=>({element:label(el),width:Math.round(el.getBoundingClientRect().width)})).filter(item=>item.width < (innerWidth<=480?110:150));
  const sidebar=document.querySelector('.sidebar'); const main=document.querySelector('.main-content'); let shellOverlap=null;
  if (sidebar && main && visible(sidebar) && visible(main) && innerWidth>980) { const a=sidebar.getBoundingClientRect(), b=main.getBoundingClientRect(); if (a.right > b.left + 2) shellOverlap={sidebarRight:Math.round(a.right),mainLeft:Math.round(b.left)}; }
  return {
    viewport,
    document: { scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth, scrollHeight:document.documentElement.scrollHeight },
    documentOverflow: document.documentElement.scrollWidth > innerWidth + 2,
    overflow: overflow.slice(0,25), clipped: clipped.slice(0,25), tinyTargets: tinyTargets.slice(0,25), stateCopies, shellOverlap,
    visibleDialogs: [...document.querySelectorAll('[role="dialog"],.modal-backdrop.open,.detail-drawer.open')].filter(visible).length
  };
})()`;

function fingerprintExpression(selectors) {
  return `(() => {
    const round=value=>Math.round(value*2)/2;
    const result={ url:location.pathname+location.search, title:document.title, viewport:{width:innerWidth,height:innerHeight}, bodyClass:document.body.className, elements:[] };
    const selectors=${JSON.stringify(selectors)};
    for (const selector of selectors) {
      const elements=[...document.querySelectorAll(selector)].slice(0,6);
      elements.forEach((el,index)=>{ const r=el.getBoundingClientRect(), s=getComputedStyle(el); result.elements.push({selector,index,tag:el.tagName.toLowerCase(),rect:{x:round(r.x),y:round(r.y),width:round(r.width),height:round(r.height)},display:s.display,position:s.position,gridTemplateColumns:s.gridTemplateColumns,fontSize:s.fontSize,overflowX:s.overflowX,visible:!(s.display==='none'||s.visibility==='hidden'||r.width===0||r.height===0)}); });
    }
    return result;
  })()`;
}

function compareFingerprint(actual, baseline, tolerance = 4) {
  const failures = [];
  const baselineMap = new Map((baseline.elements || []).map(item => [`${item.selector}#${item.index}`, item]));
  for (const item of actual.elements || []) {
    const key = `${item.selector}#${item.index}`; const expected = baselineMap.get(key); if (!expected) { failures.push(`New fingerprint element: ${key}`); continue; }
    for (const field of ['x','y','width','height']) { const delta=Math.abs(Number(item.rect[field])-Number(expected.rect[field])); if (delta>tolerance) failures.push(`${key} ${field} changed by ${delta}px (${expected.rect[field]} → ${item.rect[field]})`); }
    if (item.display !== expected.display) failures.push(`${key} display changed (${expected.display} → ${item.display})`);
  }
  for (const item of baseline.elements || []) { const key=`${item.selector}#${item.index}`; if (!(actual.elements||[]).some(candidate=>`${candidate.selector}#${candidate.index}`===key)) failures.push(`Missing fingerprint element: ${key}`); }
  return failures;
}

async function testVisual(debugPort, scenario, viewport) {
  const target = await createPage(debugPort); const cdp = new CdpConnection(target.webSocketDebuggerUrl); await cdp.connect();
  const failures = []; const requests = []; const expected = new URL(scenario.route, baseUrl);
  cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => failures.push(`JavaScript exception: ${exceptionDetails?.exception?.description || exceptionDetails?.text || 'unknown'}`));
  cdp.on('Runtime.consoleAPICalled', params => { if (params.type === 'error' || params.type === 'assert') failures.push(`console.${params.type}: ${(params.args||[]).map(arg=>arg.value ?? arg.description ?? '').join(' ')}`); });
  cdp.on('Fetch.requestPaused', async ({ requestId, request }) => { try { const url=new URL(request.url); requests.push({method:request.method,path:url.pathname}); const payload=mockApi(request.url,request.method); await cdp.send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json; charset=utf-8'},{name:'X-Request-ID',value:`visual-${scenario.id}-${requests.length}`},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(JSON.stringify(payload)).toString('base64')}); } catch (error) { failures.push(`API mock failed: ${error instanceof Error?error.message:String(error)}`); try{await cdp.send('Fetch.failRequest',{requestId,errorReason:'Failed'});}catch{} } });
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable'),cdp.send('Log.enable'),cdp.send('Fetch.enable',{patterns:[{urlPattern:`${baseUrl}/api/*`,requestStage:'Request'},{urlPattern:`${baseUrl}/.well-known/*`,requestStage:'Request'}]}),cdp.send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:viewport.width<=480,screenWidth:viewport.width,screenHeight:viewport.height}),cdp.send('Emulation.setTimezoneOverride',{timezoneId:'Asia/Yerevan'})]);
  const storage={...(scenario.storage||{})};
  await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`(() => { try { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('zentrid_auth_base_url',${JSON.stringify(baseUrl)}); localStorage.setItem('zentrid_api_base_url',${JSON.stringify(baseUrl)}); ${scenario.bootstrapAuth===false?'':"sessionStorage.setItem('zentrid_access_token','zentrid-visual-token'); sessionStorage.setItem('zentrid_refresh_token','zentrid-visual-refresh'); sessionStorage.setItem('zentrid_auth_user',JSON.stringify({userId:'visual-user',username:'globaladmin',role:'GlobalAdmin'}));"} const values=${JSON.stringify(storage)}; Object.entries(values).forEach(([key,value])=>localStorage.setItem(key,String(value))); window.confirm=()=>true; const NativeDate=Date; const fixed=Date.parse('2026-07-16T12:00:00+04:00'); class FixedDate extends NativeDate { constructor(...args){ super(...(args.length?args:[fixed])); } static now(){return fixed;} } FixedDate.parse=NativeDate.parse; FixedDate.UTC=NativeDate.UTC; window.Date=FixedDate; } catch(error){ console.error('Visual bootstrap failed',error); } })();`});
  try {
    const nav=await cdp.send('Page.navigate',{url:expected.href}); if(nav.errorText) throw new Error(`Navigation failed: ${nav.errorText}`);
    await waitForCondition(cdp,`document.readyState==='complete' && Boolean(${selectorExpression(scenario.ready)})`,`${scenario.label} ready`,20000);
    await prepareScenario(cdp,scenario.prepare||[]);
    await evaluate(cdp,`(() => { const style=document.createElement('style'); style.id='zentrid-visual-stability'; style.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'; document.head.appendChild(style); return document.fonts?.ready || true; })()`);
    await wait(250);
    const audit=await evaluate(cdp,auditExpression);
    if(audit.documentOverflow) failures.push(`Document overflow: ${audit.document.scrollWidth}px > ${audit.viewport.width}px`);
    if(audit.overflow.length) failures.push(`Viewport overflow elements: ${audit.overflow.map(item=>item.element).join(', ')}`);
    if(audit.clipped.length) failures.push(`Unexpected clipped text: ${audit.clipped.map(item=>item.element).join(', ')}`);
    if(audit.tinyTargets.length) failures.push(`Tiny interactive targets: ${audit.tinyTargets.map(item=>item.element).join(', ')}`);
    if(audit.stateCopies.length) failures.push(`Narrow UX state copy: ${audit.stateCopies.map(item=>item.element).join(', ')}`);
    if(audit.shellOverlap) failures.push(`Sidebar/main overlap: ${JSON.stringify(audit.shellOverlap)}`);
    const fingerprint=await evaluate(cdp,fingerprintExpression(scenario.fingerprint||[scenario.main]));
    const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    const dir=join(outputRoot,scenario.id); mkdirSync(dir,{recursive:true});
    const stem=`${viewport.id}-${viewport.width}x${viewport.height}`; const screenshotPath=join(dir,`${stem}.png`); const jsonPath=join(dir,`${stem}.json`);
    writeFileSync(screenshotPath,Buffer.from(shot.data,'base64')); writeFileSync(jsonPath,JSON.stringify({scenario:{id:scenario.id,label:scenario.label,route:scenario.route},viewport,audit,fingerprint,requests},null,2));
    const baseDir=join(baselineRoot,scenario.id); const baselinePng=join(baseDir,`${stem}.png`); const baselineJson=join(baseDir,`${stem}.json`);
    if(updateBaselines){mkdirSync(baseDir,{recursive:true});copyFileSync(screenshotPath,baselinePng);copyFileSync(jsonPath,baselineJson);} else if(existsSync(baselineJson)){const baseline=JSON.parse(readFileSync(baselineJson,'utf8'));failures.push(...compareFingerprint(fingerprint,baseline.fingerprint||baseline));} else if(requireBaselines){failures.push(`Missing visual baseline: ${relative(root,baselineJson)}`);}
    cdp.close(); try{await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`);}catch{}
    return {scenario:scenario.id,viewport:viewport.id,screenshot:relative(root,screenshotPath),baseline:existsSync(baselineJson),audit,failures:[...new Set(failures)]};
  } catch(error){failures.push(error instanceof Error?error.message:String(error));cdp.close();return {scenario:scenario.id,viewport:viewport.id,failures:[...new Set(failures)]};}
}

async function main(){
  if(!activeScenarios.length||!activeViewports.length) throw new Error('No visual scenarios or viewports selected.');
  const browsers=browserCandidates(); if(!browsers.length) throw new Error('Chrome, Edge or Chromium not found. Set ZENTRID_BROWSER_PATH.');
  rmSync(outputRoot,{recursive:true,force:true});mkdirSync(outputRoot,{recursive:true});
  const profile=mkdtempSync(join(tmpdir(),'zentrid-visual-')); const devToolsFile=join(profile,'DevToolsActivePort');
  const server=spawn(process.execPath,[join(root,'dist','proxy-server.js')],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
  const browser=spawn(browsers[0],['--headless=new','--disable-gpu','--disable-dev-shm-usage','--disable-extensions','--disable-background-networking','--disable-component-update','--no-first-run','--no-default-browser-check','--no-sandbox','--no-proxy-server','--hide-scrollbars','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  let serverError='';server.stderr.on('data',chunk=>{serverError+=String(chunk)});
  try{
    await Promise.all([waitForHttp(`${baseUrl}/health`),waitForFile(devToolsFile)]);const debugPort=Number(readFileSync(devToolsFile,'utf8').trim().split(/\r?\n/)[0]);if(!Number.isFinite(debugPort))throw new Error('Invalid browser debug port.');
    console.log(`Zentrid visual audit: ${browsers[0]}`); const results=[];
    for(const viewport of activeViewports){for(const scenario of activeScenarios){const result=await testVisual(debugPort,scenario,viewport);results.push(result);if(result.failures.length){console.error(`FAIL ${scenario.id} @ ${viewport.id}`);result.failures.forEach(item=>console.error(`  - ${item}`));}else console.log(`PASS ${scenario.id} @ ${viewport.id}${result.baseline?' · baseline compared':' · candidate captured'}`);}}
    writeFileSync(join(outputRoot,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),platform:process.platform,browser:browsers[0],results},null,2));
    const failed=results.filter(item=>item.failures.length);if(failed.length)throw new Error(`Visual responsive audit failed for ${failed.length}/${results.length} capture(s).`);
    console.log(`Visual responsive audit OK: ${results.length} capture(s), ${activeScenarios.length} pages × ${activeViewports.length} viewports.`);
  }finally{browser.kill('SIGTERM');server.kill('SIGTERM');await wait(350);try{rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100});}catch{}}
  if(serverError.trim()&&process.env.ZENTRID_VISUAL_DEBUG==='1')console.warn(serverError.trim());
}

if(require.main===module){main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});}
module.exports={main,compareFingerprint,auditExpression};
