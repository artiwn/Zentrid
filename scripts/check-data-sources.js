const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  const path = join(root, relativePath);
  expect(existsSync(path), `Missing file: ${relativePath}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const dataSource = read('assets/js/data.ts');
const liveBridge = read('assets/js/live-api-ui.ts');
const apiContracts = read('assets/js/api-contracts.ts');
const css = read('assets/css/src/components/data-source-indicators.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json') || '{"sources":[]}');

['live', 'unavailable', 'local', 'mixed'].forEach(origin => {
  expect(dataSource.includes(`${origin}:`), `ZentridDataSource label is missing: ${origin}.`);
  expect(css.includes(`.record-origin-chip.${origin}`), `Record origin CSS is missing: ${origin}.`);
});

expect(/window\.ZentridDataSource\s*=/.test(dataSource), 'ZentridDataSource runtime helper is missing.');
expect(/function origin\(/.test(dataSource), 'ZentridDataSource origin classifier is missing.');
expect(/function summary\(/.test(dataSource), 'ZentridDataSource summary classifier is missing.');
expect(/function markLocal</.test(dataSource), 'ZentridDataSource markLocal helper is missing.');
expect(/function markChanged</.test(dataSource), 'ZentridDataSource markChanged helper is missing.');
expect(/function setDataSourceSummary\(/.test(liveBridge), 'Page-level data source summary renderer is missing.');
expect(/function renderedDataOrigin\(/.test(liveBridge), 'Rendered record source inference is missing.');
expect(/data-source-summary/.test(liveBridge), 'Live API bridge does not render the source summary.');
expect(((liveBridge + apiContracts).match(/dataOrigin:\s*'live'/g) || []).length >= 6, 'Not all live entity mappers mark records as live.');

const tenantSetter = liveBridge.match(/function setLiveTenants[\s\S]*?\n  }/i)?.[0] || '';
expect(/window\.ZentridLiveTenants\s*=\s*rows/.test(tenantSetter), 'Live tenants are not stored in the in-memory live layer.');
expect(!/localStorage|ZentridLocalStore\.write/.test(tenantSetter), 'Live tenants must not overwrite localStorage.');
expect(/window\.ZentridLiveIntegrations\s*=\s*integrations/.test(liveBridge), 'Live integrations are not stored in the in-memory live layer.');

const component = 'components/data-source-indicators.css';
const liveStateComponent = 'components/live-data-states.css';
const componentIndex = manifest.sources.indexOf(component);
const liveStateIndex = manifest.sources.indexOf(liveStateComponent);
expect(componentIndex >= 0, `${component} is missing from CSS manifest.`);
expect(liveStateIndex >= 0 && componentIndex === liveStateIndex + 1, `${component} must load immediately after ${liveStateComponent}.`);

const activeRenderers = {
  'assets/js/client-hierarchy.ts': ["ZentridDataSource.badge(c, 'client')", "dataOrigin: 'local'"],
  'assets/js/tenants.ts': ["ZentridDataSource.badge(c, 'tenant')", "dataOrigin:'local'", 'ZentridLiveTenants'],
  'assets/js/plants.ts': ["ZentridDataSource.badge(p, 'plant')", "dataOrigin: 'local'"],
  'assets/js/devices.ts': ["ZentridDataSource.badge(d, 'device')", "dataOrigin:'local'"],
  'assets/js/alerts.ts': ["ZentridDataSource.badge(a, 'alert')", 'dataOrigin?: ZentridDataOrigin'],
  'assets/js/integrations.ts': ["ZentridDataSource.badge(x, 'integration')", "dataOrigin: 'local'", 'ZentridLiveIntegrations']
};
for (const [relativePath, markers] of Object.entries(activeRenderers)) {
  const source = read(relativePath);
  markers.forEach(marker => expect(source.includes(marker), `${relativePath} is missing data source marker: ${marker}`));
}

function createStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function runBehaviorChecks() {
  const localStorage = createStorage();
  const windowObject = { dispatchEvent() {} };
  const context = vm.createContext({
    window: windowObject,
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } },
    location: { pathname: '/pages/devices.html' },
    setTimeout() { return 0; },
    clearTimeout() {},
    localStorage,
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    console,
    Date,
    JSON,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    Math
  });
  const compiled = ts.transpileModule(dataSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText;
  vm.runInContext(compiled, context, { filename: 'data.js' });
  const helper = windowObject.ZentridDataSource;
  expect(helper && typeof helper.origin === 'function', 'ZentridDataSource did not initialize at runtime.');
  if (!helper) return;

  expect(helper.origin({ dataOrigin: 'live' }) === 'live', 'Explicit live origin is not preserved.');
  expect(helper.origin({ raw: { id: 1 } }) === 'live', 'Raw backend records are not classified as live.');
  expect(helper.origin({ id: 'DEV-LOCAL-1' }, 'device') === 'local', 'Local device IDs are not classified as local.');
  expect(helper.origin({ externalId: 'MANUAL' }, 'plant') === 'local', 'Manual plants are not classified as local.');
  expect(helper.origin({ id: 'DEV-INV-00432' }, 'device') === 'unavailable', 'Records without backend provenance are not classified as unavailable.');
  expect(helper.markChanged({ dataOrigin: 'live', id: 'LIVE-1' }, 'device').dataOrigin === 'mixed', 'Changed live records must become mixed.');
  expect(helper.markChanged({ id: 'UNAVAILABLE-1' }, 'device').dataOrigin === 'local', 'Changed unavailable records must become local.');
  const summary = helper.summary([{ dataOrigin: 'live' }, { dataOrigin: 'local' }]);
  expect(summary.origin === 'mixed' && summary.total === 2, 'Mixed source summary is incorrect.');
  expect(/record-origin-chip live/.test(helper.badge('live')), 'Live record badge markup is incorrect.');
}

runBehaviorChecks();

if (failures.length) {
  console.error('Data source checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log('Data source checks OK: 4 origins, 6 active entity renderers, live storage isolation and runtime classification verified.');
