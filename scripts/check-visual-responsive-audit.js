const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const { viewports, scenarios } = require('./browser-visual-manifest');
const root = process.cwd();
const failures = [];
const requiredWidths = [1440,1280,1024,768,390];
if (JSON.stringify(viewports.map(item=>item.width)) !== JSON.stringify(requiredWidths)) failures.push(`Visual viewport widths must be ${requiredWidths.join(', ')}.`);
if (scenarios.length < 8) failures.push('At least eight critical visual scenarios are required.');
for (const scenario of scenarios) {
  if (!scenario.id || !scenario.route || !scenario.ready || !Array.isArray(scenario.fingerprint) || !scenario.fingerprint.length) failures.push(`Incomplete visual scenario: ${scenario.id || '(unnamed)'}`);
  const relativePath = scenario.route.split('?')[0].replace(/^\//,'');
  if (!existsSync(join(root, relativePath))) failures.push(`Visual route file missing: ${relativePath}`);
  for (const [file, needle] of scenario.sourceHints || []) {
    const path = join(root,file); if(!existsSync(path)){failures.push(`Visual source hint file missing: ${file}`);continue;} const text=readFileSync(path,'utf8'); if(!text.includes(needle)) failures.push(`Visual source hint missing in ${file}: ${needle}`);
  }
}
const runner = readFileSync(join(root,'scripts/browser-visual-regression.js'),'utf8');
for (const needle of ['Page.captureScreenshot','documentOverflow','tinyTargets','stateCopies','ZENTRID_VISUAL_UPDATE','tests/visual-baselines','compareFingerprint','Emulation.setDeviceMetricsOverride']) if(!runner.includes(needle)) failures.push(`Visual runner missing capability: ${needle}`);
const packageJson=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
for(const script of ['check:visual-responsive-audit','visual:browser','visual:update']) if(!packageJson.scripts?.[script]) failures.push(`package.json script missing: ${script}`);
if(!String(packageJson.scripts.verify||'').includes('check:visual-responsive-audit')) failures.push('verify does not include visual responsive audit contract.');
if(!String(packageJson.scripts['verify:vercel']||'').includes('check:visual-responsive-audit')) failures.push('verify:vercel does not include visual responsive audit contract.');
const workflow=readFileSync(join(root,'.github/workflows/ci.yml'),'utf8');
for(const needle of ['npm run visual:browser','actions/upload-artifact@v4','visual-regression']) if(!workflow.includes(needle)) failures.push(`CI visual workflow missing: ${needle}`);
for(const path of ['tests/visual-baselines/README.md','docs/VISUAL_REGRESSION_RESPONSIVE_AUDIT_V134.md']) if(!existsSync(join(root,path))) failures.push(`Visual documentation missing: ${path}`);
const htmlFiles=['login.html', ...scenarios.map(item=>item.route.split('?')[0].replace(/^\//,'')).filter((value,index,array)=>array.indexOf(value)===index)];
for(const file of htmlFiles){const text=readFileSync(join(root,file),'utf8');if(!/<meta\s+name=["']viewport["']/i.test(text))failures.push(`Viewport meta missing: ${file}`);}
if(failures.length){console.error('Visual regression & responsive audit check failed.');failures.forEach(item=>console.error(`  - ${item}`));process.exit(1);}console.log(`Visual regression & responsive audit contract OK: ${scenarios.length} pages × ${viewports.length} viewports (${scenarios.length*viewports.length} captures).`);
