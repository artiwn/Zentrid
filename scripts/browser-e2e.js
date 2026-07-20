const { spawn } = require('child_process');
const { existsSync, mkdtempSync, readFileSync, rmSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');
const { scenarios } = require('./browser-e2e-manifest');

const root = process.cwd();
const port = Number(process.env.ZENTRID_E2E_PORT || process.env.ZENTRID_SMOKE_PORT || 5177);
const smokeHost = process.env.ZENTRID_E2E_HOST || process.env.ZENTRID_SMOKE_HOST || '127.0.0.1';
const baseUrl = `http://${smokeHost}:${port}`;
const scenarioFilter = String(process.env.ZENTRID_E2E_SCENARIOS || '').split(',').map(value => value.trim()).filter(Boolean);
const activeScenarios = scenarioFilter.length ? scenarios.filter(item => scenarioFilter.includes(item.id)) : scenarios;

function browserCandidates() {
  const candidates = [];
  if (process.env.ZENTRID_BROWSER_PATH) candidates.push(process.env.ZENTRID_BROWSER_PATH);
  if (process.platform === 'win32') {
    const roots = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    for (const base of roots) {
      candidates.push(
        join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        join(base, 'Chromium', 'Application', 'chrome.exe')
      );
    }
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else {
    candidates.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable');
  }
  return [...new Set(candidates)].filter(candidate => candidate && existsSync(candidate));
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function waitForHttp(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) { lastError = error; }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function waitForFile(path, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(path)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${path}`);
}

class CdpConnection {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }
  async connect() {
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url);
      this.socket = socket;
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
      socket.addEventListener('message', event => this.onMessage(event.data));
      socket.addEventListener('close', () => {
        for (const pending of this.pending.values()) pending.reject(new Error('Chrome DevTools connection closed.'));
        this.pending.clear();
      });
    });
  }
  onMessage(raw) {
    const message = JSON.parse(String(raw));
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message || 'CDP command failed.'));
      else pending.resolve(message.result || {});
      return;
    }
    if (!message.method) return;
    for (const handler of this.handlers.get(message.method) || []) handler(message.params || {});
  }
  send(method, params = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error('Chrome DevTools connection is not open.'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, handler) {
    const list = this.handlers.get(method) || [];
    list.push(handler);
    this.handlers.set(method, list);
  }
  close() { if (this.socket) this.socket.close(); }
}

function paged(items, page, pageSize, totalCount) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { items, page, pageSize, totalCount, totalPages, hasPreviousPage: page > 1, hasNextPage: page < totalPages };
}

function listParams(url) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.max(1, Number(url.searchParams.get('size') || url.searchParams.get('pageSize') || 20));
  return { page, pageSize };
}

function smokeClients(page) {
  return [1, 2, 3].map(index => ({
    id: `client-${page}-${index}`,
    clientCode: `SMOKE-CLIENT-${page}-${index}`,
    clientName: `Smoke Client ${page}-${index}`,
    managingTenant: 'Smoke Tenant',
    clientType: index % 2 ? 'Legal Entity' : 'Individual',
    accountActivation: 'Active',
    status: 'Active',
    country: 'AM', region: 'Yerevan', city: 'Yerevan',
    email: `client-${page}-${index}@example.invalid`, phoneNumber1: '+374000000', username: `smoke-client-${page}-${index}`,
    hasClientPassportFile: false, hasStateRegistrationDocumentFile: false, hasProjectDocFile: false,
    createdAtUtc: '2026-07-16T08:00:00Z', updatedAtUtc: null
  }));
}

function smokePlants(page, live = false) {
  return [1, 2, 3].map(index => live ? {
    id: index === 1 ? 'plant-1' : `live-plant-${page}-${index}`,
    provider: index % 2 ? 'DeyeCloud' : 'SolaX',
    sourcePlantId: `PLANT-SMOKE-${page}-${index}`,
    name: `Smoke Solar Plant ${page}-${index}`,
    status: 'Online', country: 'AM', city: 'Yerevan', timezone: 'Asia/Yerevan',
    currentPowerKw: 1250 + index, installedPowerKw: 2000, todayEnergyKwh: 4200, totalEnergyKwh: 520000,
    lastDataAt: '2026-07-16T08:00:00Z', lastSyncAt: '2026-07-16T08:00:00Z', dataQualityStatus: 'Complete',
    vendorExtensions: { managingTenant: 'Smoke Tenant', client: 'Smoke Client 1-1', address: 'Yerevan', dataFreshness: 'Fresh' }
  } : {
    id: index === 1 ? 'plant-1' : `plant-${page}-${index}`,
    plantCode: `SMOKE-PLANT-${page}-${index}`,
    plantName: `Smoke Solar Plant ${page}-${index}`,
    clientId: 'client-1-1', client: 'Smoke Client 1-1', managingTenant: 'Smoke Tenant',
    sourceScheme: 'Manual', recordStatus: 'Active', plantType: 'Solar', countryRegion: 'AM', plantTimeZone: 'Asia/Yerevan', devicesCount: 3,
    createdAtUtc: '2026-07-16T08:00:00Z', updatedAtUtc: null
  });
}

function smokeDevices(page) {
  return [1, 2, 3].map(index => ({
    id: index === 1 ? 'device-1' : `device-${page}-${index}`,
    provider: index % 2 ? 'DeyeCloud' : 'SolaX',
    sourceDeviceId: `INV-SMOKE-${page}-${index}`,
    sourcePlantId: 'PLANT-SMOKE-1-1',
    name: `Smoke Inverter ${page}-${index}`,
    deviceType: 'Inverter', status: 'Online', serialNumber: `SN-SMOKE-${page}-${index}`,
    plantName: 'Smoke Solar Plant 1-1', lastSeenAt: '2026-07-16T08:00:00Z', lastSyncAt: '2026-07-16T08:00:00Z', dataQualityStatus: 'Complete',
    vendorExtensions: { vendorModel: 'Smoke-100K', productModel: 'Inverter', ratedPowerKw: 100, firmwareVersion: '1.0.0', protocolVersion: '1', dataFreshness: 'Fresh', alarmStatus: 'Normal', sourceSystem: 'E2E' }
  }));
}

function smokeAlerts(page) {
  return [1, 2, 3].map(index => ({
    id: `alert-${page}-${index}`, provider: index % 2 ? 'DeyeCloud' : 'SolaX', sourceAlertId: `ALARM-SMOKE-${page}-${index}`,
    sourcePlantId: 'PLANT-SMOKE-1-1', sourceDeviceId: 'INV-SMOKE-1-1', plantName: 'Smoke Solar Plant 1-1', deviceName: 'Smoke Inverter 1-1',
    title: `Smoke Alert ${page}-${index}`, message: 'Deterministic browser E2E alert.', severity: index === 1 ? 'Critical' : 'Warning', status: 'Active',
    occurredAtUtc: '2026-07-16T08:00:00Z', lastSyncAt: '2026-07-16T08:00:00Z',
    vendorExtensions: { alarmCode: `A-${index}`, alarmType: 'Operational', reason: 'E2E fixture', solution: 'No action required', acknowledgedAtUtc: null }
  }));
}

function smokeIntegrationRegistry() {
  return [{
    id: 'integration-1', integrationName: 'Smoke DeyeCloud Connector', integrationCode: 'INT-SMOKE-001', providerName: 'DeyeCloud', vendorName: 'Deye',
    producerVendorTemplate: 'DeyeCloud', integrationStatus: 'Active', createdAtUtc: '2026-07-16T08:00:00Z', updatedAtUtc: '2026-07-16T08:00:00Z'
  }];
}

function smokeIntegrationSummary() {
  return [{
    id: 'integration-1', provider: 'DeyeCloud', name: 'Smoke DeyeCloud Connector', status: 'Active', plantsCount: 3, devicesCount: 9, alertsCount: 2,
    lastSyncAtUtc: '2026-07-16T08:00:00Z', errorRatePct: 0, vendorExtensions: { activeAlertsCount: 2, stalePlantsCount: 0, plantsWithoutDataCount: 0 }
  }];
}

function mockApi(urlText, method) {
  const url = new URL(urlText);
  const path = url.pathname;
  const { page, pageSize } = listParams(url);
  if (path === '/api/Auth/login') return { accessToken: 'zentrid-e2e-token', refreshToken: 'zentrid-e2e-refresh', expiresIn: 3600, user: { userId: 'e2e-user', username: 'globaladmin', role: 'GlobalAdmin' } };
  if (path === '/api/Auth/me') return { userId: 'e2e-user', username: 'globaladmin', role: 'GlobalAdmin' };
  if (path === '/api/Auth/validate') return { isValid: true, userId: 'e2e-user', username: 'globaladmin', role: 'GlobalAdmin' };
  if (path === '/api/Auth/refresh') return { accessToken: 'zentrid-e2e-token', refreshToken: 'zentrid-e2e-refresh', expiresIn: 3600, user: { username: 'globaladmin', role: 'GlobalAdmin' } };
  if (path === '/.well-known/jwks.json') return { keys: [{ alg: 'RS256', kid: 'zentrid-e2e', kty: 'RSA', use: 'sig', e: 'AQAB', n: 'e2e' }] };
  if (path === '/api/admin/clients') return paged(smokeClients(page), page, pageSize, 45);
  if (/^\/api\/admin\/clients\//.test(path)) return smokeClients(1)[0];
  if (path === '/api/admin/tenants') return paged([{ id: 'tenant-1', tenantCode: 'TENANT-SMOKE', tenantName: 'Smoke Tenant', legalName: 'Smoke Tenant LLC', country: 'AM', tenantStatus: 'Active', tenantType: 'Operator', createdAtUtc: '2026-07-16T08:00:00Z', updatedAtUtc: null }], page, pageSize, 1);
  if (/^\/api\/admin\/tenants\//.test(path)) return { id: 'tenant-1', tenantCode: 'TENANT-SMOKE', tenantName: 'Smoke Tenant', legalName: 'Smoke Tenant LLC', country: 'AM', tenantStatus: 'Active', tenantType: 'Operator' };
  if (path === '/api/admin/plants') return paged(smokePlants(page, false), page, pageSize, 42);
  if (/^\/api\/admin\/plants\//.test(path)) return smokePlants(1, false)[0];
  if (path === '/api/plants') return paged(smokePlants(page, true), page, pageSize, 40);
  if (path === '/api/devices') return paged(smokeDevices(page), page, pageSize, 60);
  if (path === '/api/alerts') return paged(smokeAlerts(page), page, pageSize, 80);
  if (path === '/api/admin/provider-integrations/templates') return ['DeyeCloud', 'Solarx'];
  if (/^\/api\/admin\/provider-integrations\/templates\//.test(path)) return { providerType: path.split('/').pop(), fields: [] };
  if (path === '/api/admin/provider-integrations') return paged(smokeIntegrationRegistry(), page, pageSize, 1);
  if (/^\/api\/admin\/provider-integrations\/[^/]+$/.test(path)) return smokeIntegrationRegistry()[0];
  if (path === '/api/integrations') return paged(smokeIntegrationSummary(), page, pageSize, 1);
  if (path === '/api/Providers') return ['deyecloud', 'solarx', 'huawei'];
  if (method === 'POST') return { ok: true, status: 'Success' };
  return { items: [], page, pageSize, totalCount: 0, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
}

async function createPage(debugPort) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create browser page: ${response.status}`);
  return response.json();
}

function exceptionText(details) { return details?.exception?.description || details?.text || 'Unknown JavaScript exception'; }
function consoleText(params) { return (params.args || []).map(arg => arg.value !== undefined ? String(arg.value) : String(arg.description || arg.type || '')).join(' '); }

async function evaluate(cdp, expression) {
  const response = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(exceptionText(response.exceptionDetails));
  return response.result?.value;
}

async function waitForCondition(cdp, expression, label, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  while (Date.now() < deadline) {
    try {
      lastValue = await evaluate(cdp, expression);
      if (lastValue) return lastValue;
    } catch { /* Page may be navigating. */ }
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}${lastValue !== undefined ? ` (last=${JSON.stringify(lastValue)})` : ''}.`);
}

function selectorExpression(selector) { return `document.querySelector(${JSON.stringify(selector)})`;} 

async function performAction(cdp, action, requests) {
  const timeout = Number(action.timeoutMs || 12000);
  if (action.type === 'fill') {
    const result = await evaluate(cdp, `(() => { const el=${selectorExpression(action.selector)}; if(!el) return false; el.focus(); el.value=${JSON.stringify(action.value || '')}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
    if (!result) throw new Error(`Fill target not found: ${action.selector}`);
    return;
  }
  if (action.type === 'click') {
    const result = await evaluate(cdp, `(() => { const el=${selectorExpression(action.selector)}; if(!el) return false; el.click(); return true; })()`);
    if (!result) throw new Error(`Click target not found: ${action.selector}`);
    return;
  }
  if (action.type === 'wait-url') {
    await waitForCondition(cdp, `location.href.includes(${JSON.stringify(action.includes)})`, `URL containing ${action.includes}`, timeout);
    return;
  }
  if (action.type === 'wait-selector') {
    await waitForCondition(cdp, `Boolean(${selectorExpression(action.selector)})`, `selector ${action.selector}`, timeout);
    return;
  }
  if (action.type === 'wait-selector-count') {
    await waitForCondition(cdp, `document.querySelectorAll(${JSON.stringify(action.selector)}).length >= ${Number(action.min || 1)}`, `${action.min || 1} × ${action.selector}`, timeout);
    return;
  }
  if (action.type === 'assert-selector') {
    const found = await evaluate(cdp, `Boolean(${selectorExpression(action.selector)})`);
    if (!found) throw new Error(`Expected selector is missing: ${action.selector}`);
    return;
  }
  if (action.type === 'assert-text' || action.type === 'assert-no-text') {
    const text = await evaluate(cdp, `(${selectorExpression(action.selector)})?.textContent || ''`);
    const contains = String(text).toLowerCase().includes(String(action.includes || '').toLowerCase());
    if (action.type === 'assert-text' && !contains) throw new Error(`Expected text “${action.includes}” in ${action.selector}.`);
    if (action.type === 'assert-no-text' && contains) throw new Error(`Unexpected text “${action.includes}” in ${action.selector}.`);
    return;
  }
  if (action.type === 'assert-class' || action.type === 'assert-not-class') {
    const hasClass = await evaluate(cdp, `Boolean((${selectorExpression(action.selector)})?.classList.contains(${JSON.stringify(action.className)}))`);
    if (action.type === 'assert-class' && !hasClass) throw new Error(`${action.selector} does not have class ${action.className}.`);
    if (action.type === 'assert-not-class' && hasClass) throw new Error(`${action.selector} still has class ${action.className}.`);
    return;
  }
  if (action.type === 'assert-storage') {
    const area = action.area === 'session' ? 'sessionStorage' : 'localStorage';
    const value = await evaluate(cdp, `${area}.getItem(${JSON.stringify(action.key)})`);
    if (String(value || '') !== String(action.equals || '')) throw new Error(`${area} ${action.key} expected ${action.equals}, received ${value}.`);
    return;
  }
  if (action.type === 'wait-query') {
    const values = action.equalsAny || [action.equals];
    await waitForCondition(cdp, `${JSON.stringify(values.map(String))}.includes(new URLSearchParams(location.search).get(${JSON.stringify(action.key)}) || '')`, `query ${action.key}`, timeout);
    return;
  }
  if (action.type === 'wait-request') {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const found = requests.some(item => {
        if (item.path !== action.path) return false;
        return Object.entries(action.query || {}).every(([key, value]) => item.query[key] === String(value));
      });
      if (found) return;
      await wait(100);
    }
    throw new Error(`Expected API request not observed: ${action.path}`);
  }
  if (action.type === 'assert-no-request') {
    if (requests.some(item => item.path === action.path)) throw new Error(`API request occurred before lazy activation: ${action.path}`);
    return;
  }
  if (action.type === 'history-back') {
    await evaluate(cdp, 'history.back()');
    await wait(250);
    return;
  }
  if (action.type === 'history-forward') {
    await evaluate(cdp, 'history.forward()');
    await wait(250);
    return;
  }
  throw new Error(`Unsupported E2E action: ${action.type}`);
}

async function testScenario(debugPort, scenario) {
  const target = await createPage(debugPort);
  const cdp = new CdpConnection(target.webSocketDebuggerUrl);
  await cdp.connect();
  const failures = [];
  const requests = [];
  const requestUrls = new Map();
  const expectedUrl = new URL(scenario.route, baseUrl);

  cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => failures.push(`JavaScript exception: ${exceptionText(exceptionDetails)}`));
  cdp.on('Runtime.consoleAPICalled', params => {
    if (params.type !== 'error' && params.type !== 'assert') return;
    const text = consoleText(params);
    failures.push(`console.${params.type}: ${text || '(no message)'}`);
  });
  cdp.on('Log.entryAdded', ({ entry }) => {
    if (entry?.level === 'error' && !String(entry.text || '').includes('favicon')) failures.push(`browser log: ${entry.text}`);
  });
  cdp.on('Network.requestWillBeSent', ({ requestId, request }) => requestUrls.set(requestId, request.url));
  cdp.on('Network.responseReceived', ({ response, type }) => {
    try {
      const url = new URL(response.url);
      if (url.origin === baseUrl && response.status >= 400 && ['Document', 'Script', 'Stylesheet'].includes(type)) failures.push(`${type} returned HTTP ${response.status}: ${response.url}`);
    } catch { /* ignore non-URL */ }
  });
  cdp.on('Network.loadingFailed', ({ requestId, errorText, canceled }) => {
    const urlText = requestUrls.get(requestId) || '';
    try {
      const url = new URL(urlText);
      if (!canceled && url.origin === baseUrl && !url.pathname.startsWith('/api/')) failures.push(`Local resource failed: ${urlText} — ${errorText}`);
    } catch { /* ignore */ }
  });
  cdp.on('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      const query = Object.fromEntries(url.searchParams.entries());
      requests.push({ method: request.method, path: url.pathname, query, url: request.url });
      const payload = mockApi(request.url, request.method);
      await cdp.send('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json; charset=utf-8' },
          { name: 'X-Request-ID', value: `e2e-${scenario.id}-${requests.length}` },
          { name: 'Cache-Control', value: 'no-store' }
        ],
        body: Buffer.from(JSON.stringify(payload)).toString('base64')
      });
    } catch (error) {
      failures.push(`API interception failed: ${error instanceof Error ? error.message : String(error)}`);
      try { await cdp.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); } catch { /* page may be closing */ }
    }
  });

  await Promise.all([
    cdp.send('Page.enable'), cdp.send('Runtime.enable'), cdp.send('Network.enable'), cdp.send('Log.enable'),
    cdp.send('Fetch.enable', { patterns: [
      { urlPattern: `${baseUrl}/api/*`, requestStage: 'Request' },
      { urlPattern: `${baseUrl}/.well-known/*`, requestStage: 'Request' }
    ] })
  ]);

  const storage = { ...(scenario.storage || {}) };
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      try {
        const marker = 'zentrid_e2e_bootstrapped_${scenario.id}';
        if (sessionStorage.getItem(marker) !== '1') {
          localStorage.clear(); sessionStorage.clear();
          localStorage.setItem('zentrid_auth_base_url', ${JSON.stringify(baseUrl)});
          localStorage.setItem('zentrid_api_base_url', ${JSON.stringify(baseUrl)});
          ${scenario.bootstrapAuth === false ? '' : `sessionStorage.setItem('zentrid_access_token','zentrid-e2e-token'); sessionStorage.setItem('zentrid_refresh_token','zentrid-e2e-refresh'); sessionStorage.setItem('zentrid_auth_user', JSON.stringify({ userId:'e2e-user', username:'globaladmin', role:'GlobalAdmin' }));`}
          const values=${JSON.stringify(storage)}; Object.entries(values).forEach(([key,value])=>localStorage.setItem(key,String(value)));
          sessionStorage.setItem(marker, '1');
        }
        window.confirm = () => true;
      } catch (error) { console.error('Zentrid E2E bootstrap failed', error); }
    })();`
  });

  try {
    const navigation = await cdp.send('Page.navigate', { url: expectedUrl.href });
    if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`);
    await waitForCondition(cdp, `document.readyState === 'complete' && location.protocol !== 'chrome-error:' && Boolean(${selectorExpression(scenario.ready)})`, `${scenario.label} readiness`, 15000);
    const scriptCount = await evaluate(cdp, 'Array.from(document.scripts).filter(script => script.src).length');
    if (!scriptCount) throw new Error('No external runtime scripts loaded.');
    for (const action of scenario.actions) {
      await performAction(cdp, action, requests);
      if (failures.length) break;
    }
    await wait(150);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  const state = await evaluate(cdp, `({ url: location.href, title: document.title, readyState: document.readyState })`).catch(() => ({ url: expectedUrl.href, title: '', readyState: 'unknown' }));
  cdp.close();
  try { await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`); } catch { /* browser process will close it */ }
  return { scenario, state, requests, failures: [...new Set(failures)] };
}

async function main() {
  if (!activeScenarios.length) throw new Error('No browser E2E scenarios matched ZENTRID_E2E_SCENARIOS.');
  const browsers = browserCandidates();
  if (!browsers.length) throw new Error('Chrome, Edge or Chromium was not found. Set ZENTRID_BROWSER_PATH.');
  const browserPath = browsers[0];
  const profileDir = mkdtempSync(join(tmpdir(), 'zentrid-e2e-browser-'));
  const devToolsFile = join(profileDir, 'DevToolsActivePort');
  const server = spawn(process.execPath, [join(root, 'dist', 'proxy-server.js')], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  const browser = spawn(browserPath, [
    '--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--disable-extensions', '--disable-background-networking', '--disable-component-update',
    '--no-first-run', '--no-default-browser-check', '--no-sandbox', '--no-proxy-server', '--remote-debugging-port=0', `--user-data-dir=${profileDir}`, 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let serverError = '';
  let browserError = '';
  server.stderr.on('data', chunk => { serverError += String(chunk); });
  browser.stderr.on('data', chunk => { browserError += String(chunk); });

  try {
    await Promise.all([waitForHttp(`${baseUrl}/health`), waitForFile(devToolsFile)]);
    const [debugPortText] = readFileSync(devToolsFile, 'utf8').trim().split(/\r?\n/);
    const debugPort = Number(debugPortText);
    if (!Number.isFinite(debugPort)) throw new Error(`Invalid browser debug port: ${debugPortText}`);
    console.log(`Zentrid browser E2E: ${browserPath}`);
    console.log(`Application: ${baseUrl}`);
    const results = [];
    for (const scenario of activeScenarios) {
      const result = await testScenario(debugPort, scenario);
      results.push(result);
      if (result.failures.length) {
        console.error(`FAIL ${scenario.id} — ${scenario.label}`);
        result.failures.forEach(failure => console.error(`  - ${failure}`));
      } else {
        console.log(`PASS ${scenario.id} — ${scenario.label}`);
      }
    }
    const failed = results.filter(item => item.failures.length);
    if (failed.length) throw new Error(`Browser E2E failed for ${failed.length}/${results.length} scenario(s).`);
    console.log(`Browser E2E OK: ${results.length}/${results.length} critical scenario(s).`);
  } finally {
    browser.kill('SIGTERM'); server.kill('SIGTERM');
    await wait(350);
    if (!browser.killed) browser.kill('SIGKILL');
    if (!server.killed) server.kill('SIGKILL');
    try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { /* Windows may keep profile handles briefly. */ }
  }

  const unexpectedServer = serverError.split(/\r?\n/).filter(line => line.trim() && !line.includes('ExperimentalWarning'));
  if (unexpectedServer.length) console.warn(unexpectedServer.join('\n'));
  if (process.env.ZENTRID_E2E_DEBUG_BROWSER === '1' && browserError.trim()) console.warn(browserError.trim());
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) void run();

module.exports = { run, mockApi };
