const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const source = read('assets/js/data-freshness-controls.ts');
const liveUi = read('assets/js/live-api-ui.ts');
const css = read('assets/css/src/components/data-freshness-controls.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json'));
const packageJson = JSON.parse(read('package.json'));

['live', 'cached', 'refreshing', 'stale', 'partial', 'unavailable'].forEach(status => {
  assert(source.includes(`'${status}'`), `Freshness runtime is missing status: ${status}`);
});
assert(source.includes("zentrid:data-refresh-request"), 'Freshness runtime must dispatch refresh requests.');
assert(source.includes("visibilitychange"), 'Freshness runtime must pause/resume around hidden tabs.');
assert(source.includes("window.addEventListener('offline'"), 'Freshness runtime must handle offline mode.');
assert(source.includes('AUTO_OPTIONS = [0, 30_000, 60_000, 300_000]'), 'Safe auto-refresh intervals must remain explicit.');
assert(source.includes('snapshot(resource?'), 'Freshness runtime must expose diagnostics snapshot.');
assert(liveUi.includes("window.addEventListener('zentrid:data-refresh-request', handleDataRefreshRequest)"), 'Live API UI must consume refresh requests.');
assert(liveUi.includes('registryReadOptions(\'plants\', forceRefresh)'), 'Plant refresh must bypass repository cache when requested.');
assert(liveUi.includes('registryReadOptions(\'devices\', forceRefresh)'), 'Device refresh must bypass repository cache when requested.');
assert(liveUi.includes('registryReadOptions(\'alerts\', forceRefresh)'), 'Alert refresh must bypass repository cache when requested.');
assert(liveUi.includes('registryReadOptions(\'clients\', forceRefresh)'), 'Client refresh must bypass repository cache when requested.');
assert(liveUi.includes('cacheFreshnessOptions(cacheInfo)'), 'Repository cache metadata must feed freshness state.');

const pages = ['index.html', 'pages/clients.html', 'pages/client-detail.html', 'pages/tenants.html', 'pages/tenant-detail.html', 'pages/plants.html', 'pages/plant-detail.html', 'pages/devices.html', 'pages/device-detail.html', 'pages/alerts.html', 'pages/alert-detail.html', 'pages/integrations.html', 'pages/integration-detail.html'];
pages.forEach(relative => {
  const html = read(relative);
  const freshnessIndex = html.indexOf('data-freshness-controls.js');
  const liveIndex = html.indexOf('live-api-ui.js');
  assert(freshnessIndex >= 0, `${relative} must load data-freshness-controls.js.`);
  assert(liveIndex > freshnessIndex, `${relative} must load freshness controls before live-api-ui.js.`);
});

const indicatorIndex = manifest.sources.indexOf('components/data-source-indicators.css');
const freshnessCssIndex = manifest.sources.indexOf('components/data-freshness-controls.css');
assert(freshnessCssIndex === indicatorIndex + 1, 'Freshness CSS must load immediately after data-source indicators.');
['.fleet-freshness-controls', '.fleet-freshness-badge.cached', '.fleet-auto-refresh', '@media (max-width: 640px)'].forEach(token => {
  assert(css.includes(token), `Freshness CSS is missing ${token}.`);
});
assert(packageJson.scripts['check:data-freshness-refresh-controls'], 'package.json must expose the v135 regression check.');

// Execute the browser runtime in a deterministic lightweight DOM harness.
class FakeElement {
  constructor() { this.dataset = {}; this.children = []; this.innerHTML = ''; this.disabled = false; }
  querySelector(selector) { return selector === '.fleet-freshness-controls' ? this.children.find(item => item.className === 'fleet-freshness-controls') || null : null; }
  append(child) { this.children.push(child); }
  closest() { return null; }
}
class FakeCustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
}
const banner = new FakeElement();
const listeners = new Map();
const dispatched = [];
const storageMap = new Map();
const documentListeners = new Map();
const document = {
  visibilityState: 'visible',
  querySelector(selector) { return selector === '.live-data-state' ? banner : null; },
  createElement() { return new FakeElement(); },
  addEventListener(type, handler) { documentListeners.set(type, handler); }
};
const windowObject = {
  addEventListener(type, handler) { listeners.set(type, handler); },
  dispatchEvent(event) { dispatched.push(event); const handler = listeners.get(event.type); if (handler) handler(event); return true; },
  setTimeout() { return 1; },
  clearTimeout() {},
  setInterval() { return 2; },
  clearInterval() {}
};
const context = {
  window: windowObject,
  document,
  location: { pathname: '/pages/plants.html' },
  navigator: { onLine: true },
  sessionStorage: {
    getItem(key) { return storageMap.get(key) || null; },
    setItem(key, value) { storageMap.set(key, String(value)); },
    removeItem(key) { storageMap.delete(key); }
  },
  CustomEvent: FakeCustomEvent,
  Element: FakeElement,
  HTMLSelectElement: FakeElement,
  Date,
  Number,
  Math,
  Map,
  console
};
windowObject.window = windowObject;
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
try {
  vm.runInNewContext(js, context, { filename: 'data-freshness-controls.js' });
  const api = windowObject.FleetDataFreshness;
  assert(api && typeof api.sync === 'function', 'Freshness browser API must initialize.');
  const snapshot = api.sync({ liveState: 'partial', message: 'Saved page is visible', details: 'persistent cache', status: 'cached', cacheAgeMs: 12_000 });
  assert(snapshot.status === 'cached', 'Cache-backed sync must remain cached.');
  assert(snapshot.ageMs >= 11_000, 'Cache age must be preserved.');
  assert(banner.children.some(item => item.className === 'fleet-freshness-controls'), 'Freshness controls must be attached to the live banner.');
  api.requestRefresh('manual');
  assert(dispatched.some(event => event.type === 'zentrid:data-refresh-request' && event.detail.forceRefresh === true), 'Manual refresh must request forceRefresh.');
  api.markRefreshComplete(true);
  api.setAutoRefresh(60_000);
  assert(api.snapshot().autoRefreshMs === 60_000, 'Auto-refresh interval must be persisted in runtime state.');
} catch (error) {
  failures.push(`Freshness runtime harness failed: ${error && error.stack ? error.stack : error}`);
}

if (failures.length) {
  console.error('Data freshness and refresh controls check failed.');
  failures.forEach(failure => console.error(`  ${failure}`));
  process.exit(1);
}
console.log(`Data freshness and refresh controls OK: ${pages.length} live screen(s), 6 freshness states, safe manual/auto refresh.`);
