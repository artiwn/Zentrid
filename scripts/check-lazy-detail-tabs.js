const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(relativePath) {
  const path = join(root, relativePath);
  expect(existsSync(path), `Missing file: ${relativePath}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const source = read('assets/js/detail-lazy-tabs.ts');
const live = read('assets/js/live-api-ui.ts');
const plants = read('assets/js/client-hierarchy.ts');
const devices = read('assets/js/devices.ts');
const integrations = read('assets/js/integrations.ts');
const css = read('assets/css/src/components/detail-lazy-tabs.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json') || '{}');
const globals = read('types/zentrid-globals.d.ts');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'ZentridDetailLazySnapshot', 'ZentridDetailLazyResourceDefinition', 'ZentridDetailLazyTabsApi'
].forEach(token => expect(globals.includes(`interface ${token}`), `Missing lazy-detail global type: ${token}.`));
[
  "type DetailLazyStatus = 'idle' | 'loading' | 'loaded' | 'error'", 'function register(', 'function activate(',
  'function load(', 'function panel(', 'function observe(', 'data-detail-lazy-retry', 'zentrid:detail-lazy-state'
].forEach(token => expect(source.includes(token), `Missing lazy-detail implementation token: ${token}.`));
[
  "register('plant'", "key: 'devices'", "key: 'alerts'", "key: 'telemetry'",
  "register('device'", "key: 'parent-plant'", "register('integration'", "key: 'operational-summary'",
  'remain idle until their tabs are opened', 'loaded only after'
].forEach(token => expect(live.includes(token), `Missing live lazy-loading token: ${token}.`));
const deviceDetailSection = live.slice(live.indexOf('async function applyDeviceDetail'), live.indexOf('async function applyPlantDetail'));
const plantDetailSection = live.slice(live.indexOf('async function applyPlantDetail'), live.indexOf('async function applyAlertDetail'));
const integrationDetailSection = live.slice(live.indexOf('async function applyIntegrationDetail'), live.indexOf('async function applyClients'));
expect(!deviceDetailSection.includes('void ZentridAPIRepositories.plants.list'), 'Device Detail still starts the old eager parent-plant request.');
expect(!deviceDetailSection.includes('void ZentridAPIRepositories.alerts.list'), 'Device Detail still starts the old eager alert request.');
expect(!plantDetailSection.includes('void ZentridAPIRepositories.devices.list'), 'Plant Detail still starts the old eager device relation request.');
expect(!plantDetailSection.includes('void ZentridAPIRepositories.alerts.list'), 'Plant Detail still starts the old eager alert relation request.');
expect(!integrationDetailSection.includes('void ZentridAPIRepositories.integrations.summary'), 'Integration Detail still starts the old eager operational summary request.');
[
  "ZentridDetailLazyTabs?.panel('plant'", "ZentridDetailLazyTabs?.activate('plant'", "ZentridDetailLazyTabs?.observe('plant'"
].forEach(token => expect(plants.includes(token), `Plant Detail is missing lazy integration: ${token}.`));
[
  "ZentridDetailLazyTabs?.panel('device'", "ZentridDetailLazyTabs?.activate('device'", "ZentridDetailLazyTabs?.observe('device'", 'deviceDetailActiveTab'
].forEach(token => expect(devices.includes(token), `Device Detail is missing lazy integration: ${token}.`));
[
  "ZentridDetailLazyTabs?.panel('integration'", "ZentridDetailLazyTabs?.activate('integration'", "ZentridDetailLazyTabs?.observe('integration'", 'integrationDetailActiveTab'
].forEach(token => expect(integrations.includes(token), `Integration Detail is missing lazy integration: ${token}.`));
[
  '.detail-lazy-panel', '.detail-lazy-state-card', '.detail-lazy-spinner', 'prefers-reduced-motion'
].forEach(token => expect(css.includes(token), `Missing lazy-detail CSS token: ${token}.`));
expect(Array.isArray(manifest.sources) && manifest.sources.includes('components/detail-lazy-tabs.css'), 'Lazy-detail CSS is missing from the CSS manifest.');

['plant-detail.html','device-detail.html','client-detail.html','tenant-detail.html','integration-detail.html'].forEach(page => {
  const html = read(`pages/${page}`);
  const lazyIndex = html.indexOf('../assets/js/detail-lazy-tabs.js');
  expect(lazyIndex >= 0, `${page} does not load detail-lazy-tabs.js.`);
  const domainCandidates = ['client-hierarchy.js','devices.js','tenants.js','integrations.js'];
  const domainIndex = domainCandidates.map(name => html.indexOf(name)).filter(index => index >= 0).sort((a,b) => a-b)[0];
  expect(domainIndex === undefined || lazyIndex < domainIndex, `${page} loads the lazy foundation after its domain script.`);
});
expect(packageJson.scripts?.['check:lazy-detail-tabs'] === 'node scripts/check-lazy-detail-tabs.js', 'Missing check:lazy-detail-tabs package script.');
expect(String(packageJson.scripts?.verify || '').includes('check:lazy-detail-tabs'), 'verify does not include check:lazy-detail-tabs.');
expect(String(packageJson.scripts?.['verify:vercel'] || '').includes('check:lazy-detail-tabs'), 'verify:vercel does not include check:lazy-detail-tabs.');

async function runtimeCheck() {
  const listeners = new Map();
  class FakeElement {}
  class FakeCustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }
  const document = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    dispatchEvent() { return true; }
  };
  const sandbox = {
    window: {}, document, console, Promise, Map, Set, String, Object, Array, Error,
    CustomEvent: FakeCustomEvent, Element: FakeElement
  };
  vm.createContext(sandbox);
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText;
  vm.runInContext(compiled, sandbox, { filename: 'detail-lazy-tabs.js' });
  const api = sandbox.window.ZentridDetailLazyTabs;
  expect(Boolean(api), 'ZentridDetailLazyTabs did not initialize.');
  if (!api) return;

  let loads = 0;
  let release;
  api.register('plant', [{ key: 'devices', tabs: ['device'], label: 'Devices', loader: () => {
    loads += 1;
    return new Promise(resolve => { release = resolve; });
  }}]);
  expect(api.snapshot('plant','device')?.status === 'idle', 'Registered lazy resource did not start idle.');
  expect(api.panel('plant','device','CONTENT').includes('loads when opened'), 'Idle panel does not explain on-demand loading.');
  api.activate('plant','device');
  api.activate('plant','device');
  await Promise.resolve();
  expect(loads === 1, `Concurrent activation was not deduplicated; loader ran ${loads} times.`);
  expect(api.snapshot('plant','device')?.status === 'loading', 'Lazy resource did not enter loading state.');
  release();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(api.snapshot('plant','device')?.status === 'loaded', 'Lazy resource did not enter loaded state.');
  expect(api.panel('plant','device','CONTENT').includes('CONTENT'), 'Loaded panel does not reveal section content.');

  api.register('device', [{ key: 'alerts', tabs: ['alerts'], label: 'Alerts', loader: async () => { throw new Error('test failure'); } }]);
  await api.load('device','alerts');
  expect(api.snapshot('device','alerts')?.status === 'error', 'Rejected loader did not enter error state.');
  expect(api.panel('device','alerts','CONTENT').includes('Retry'), 'Error panel does not expose Retry.');
}

runtimeCheck().then(() => {
  if (failures.length) {
    console.error('Lazy Detail Tabs checks failed.');
    failures.forEach(message => console.error(`  ${message}`));
    process.exit(1);
  }
  console.log('Lazy Detail Tabs OK: idle/loading/loaded/error states, deduplication, retry UI, script order and on-demand Plant/Device/Integration relations verified.');
}).catch(error => {
  console.error(error);
  process.exit(1);
});
