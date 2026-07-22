const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const sourcePath = join(root, 'assets/js/live-api-ui.ts');
const cssPath = join(root, 'assets/css/src/components/live-data-states.css');
const manifestPath = join(root, 'assets/css/src/manifest.json');
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(existsSync(sourcePath), 'Live API UI source is missing.');
expect(existsSync(cssPath), 'Live data state CSS component is missing.');
expect(existsSync(manifestPath), 'CSS manifest is missing.');

const source = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : '';
const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { sources: [] };

const requiredStates = ['loading', 'live', 'partial', 'empty', 'timeout', 'unauthorized', 'forbidden', 'unavailable', 'fallback'];
requiredStates.forEach(state => {
  expect(source.includes(`${state}:`), `Live data state title/icon mapping is missing: ${state}.`);
  expect(css.includes(`.live-data-state.${state}`), `Live data state CSS is missing: ${state}.`);
});

expect(/function setLiveDataState\(/.test(source), 'Shared live data state renderer is missing.');
expect(/function setRequestFailure\(/.test(source), 'Request failure classifier is missing.');
expect(/code === 'TIMEOUT'/.test(source), 'TIMEOUT classification is missing.');
expect(/status === 401/.test(source), 'Unauthorized classification is missing.');
expect(/status === 403/.test(source), 'Forbidden classification is missing.');
expect(/aria-live/.test(source) && /aria-busy/.test(source), 'Live data state accessibility attributes are missing.');
expect(!/insertBanner\(/.test(source), 'Legacy insertBanner helper is still used.');
expect(!/live-api-banner/.test(source), 'Legacy live-api-banner class is still used in TypeScript.');
expect(!/\.live-api-banner/.test(css), 'Legacy live-api-banner CSS is still present in the shared state module.');

const component = 'components/live-data-states.css';
const componentIndex = manifest.sources.indexOf(component);
const authCssIndex = manifest.sources.indexOf('80-auth-and-api-console.css');
expect(componentIndex >= 0, `${component} is missing from CSS manifest.`);
expect(authCssIndex >= 0, '80-auth-and-api-console.css is missing from CSS manifest.');
expect(componentIndex >= 0 && authCssIndex >= 0 && componentIndex < authCssIndex, `${component} must load before 80-auth-and-api-console.css.`);

const activePages = [
  'index.html',
  'pages/clients.html',
  'pages/client-detail.html',
  'pages/tenants.html',
  'pages/tenant-detail.html',
  'pages/plants.html',
  'pages/plant-detail.html',
  'pages/devices.html',
  'pages/device-detail.html',
  'pages/alerts.html',
  'pages/telemetry.html',
  'pages/alert-detail.html',
  'pages/integrations.html',
  'pages/integration-detail.html'
];
activePages.forEach(relativePath => {
  const pagePath = join(root, relativePath);
  expect(existsSync(pagePath), `Active API page is missing: ${relativePath}.`);
  if (existsSync(pagePath)) {
    expect(/live-api-ui\.js/.test(readFileSync(pagePath, 'utf8')), `Active API page does not load live-api-ui.js: ${relativePath}.`);
  }
});

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.className = '';
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.textContent = '';
    this.parent = null;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  replaceChildren(...children) {
    this.children = children;
    children.forEach(child => { child.parent = this; });
  }
  append(...children) {
    this.children.push(...children);
    children.forEach(child => { child.parent = this; });
  }
  prepend(child) {
    this.children.unshift(child);
    child.parent = this;
  }
  insertAdjacentElement(_position, element) {
    if (this.parent) this.parent.prepend(element);
    return element;
  }
  querySelector(selector) {
    if (selector === '.page-hero') return this.children.find(child => child.className === 'page-hero') || null;
    if (selector === '.live-data-state') return this.children.find(child => String(child.className).split(/\s+/).includes('live-data-state')) || null;
    if (selector === '.data-source-summary') return this.children.find(child => String(child.className).split(/\s+/).includes('data-source-summary')) || null;
    return null;
  }
  closest() { return null; }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = null;
  }
}

async function renderStateScenario(mode) {
  const main = new FakeElement('main');
  main.className = 'main-content';
  const hero = new FakeElement('section');
  hero.className = 'page-hero';
  hero.parent = main;
  main.children.push(hero);

  const document = {
    readyState: 'complete',
    querySelector(selector) {
      if (selector === '.main-content') return main;
      if (selector === '.data-source-summary') return main.querySelector(selector);
      return null;
    },
    querySelectorAll() { return []; },
    createElement(tagName) { return new FakeElement(tagName); },
    addEventListener() {}
  };

  const timeoutError = Object.assign(new Error('Request timed out after 15000 ms.'), { code: 'TIMEOUT', status: 0, path: '/api/devices' });
  const response = mode === 'empty' ? { items: [] } : null;
  const request = async () => {
    if (mode === 'timeout') throw timeoutError;
    return response;
  };
  const platform = { live: { devices: request } };
  const emptyRepository = { async list() { return { entity: 'devices', items: [], rawItems: [], source: '/api/devices', errors: [] }; } };
  const deviceRepository = {
    async list() {
      if (mode === 'timeout') throw timeoutError;
      return { entity: 'devices', items: [], rawItems: [], source: '/api/devices', errors: [] };
    }
  };
  const repositories = {
    configure() {},
    isConfigured() { return true; },
    clients: emptyRepository,
    tenants: emptyRepository,
    plants: emptyRepository,
    devices: deviceRepository,
    alerts: emptyRepository,
    integrations: emptyRepository
  };
  const windowObject = {
    ZentridPlatformAPI: platform,
    ZentridAPI: { request },
    ZentridAPIRepositories: repositories,
    ZentridDataSource: { label: value => ({ live: 'Live API', mock: 'Unavailable', local: 'Disabled', mixed: 'Live API' })[value] || value },
    ZentridLayout: { mount() {}, toast() {} },
    ZentridApiOnly: { mountEmpty() {} },
    setTimeout,
    clearTimeout
  };
  const context = vm.createContext({
    window: windowObject,
    document,
    location: { pathname: '/pages/devices.html', search: '' },
    ZentridPlatformAPI: platform,
    ZentridAPI: windowObject.ZentridAPI,
    ZentridAPIRepositories: repositories,
    ZentridDataSource: windowObject.ZentridDataSource,
    ZentridLayout: windowObject.ZentridLayout,
    renderDevices: () => '',
    wireDevices: () => {},
    console,
    setTimeout,
    clearTimeout,
    URLSearchParams,
    Promise,
    Error,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    Date,
    Math
  });
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText;
  vm.runInContext(compiled, context, { filename: 'live-api-ui.js' });
  await new Promise(resolve => setTimeout(resolve, 20));
  return { state: main.querySelector('.live-data-state'), source: main.querySelector('.data-source-summary') };
}

async function runBehaviorChecks() {
  const empty = await renderStateScenario('empty');
  expect(empty.state?.dataset?.liveState === 'empty', 'A successful empty device response is not rendered as the empty state.');
  expect(empty.state?.attributes?.role === 'status', 'Empty state must use role=status.');
  expect(empty.source?.dataset?.dataOrigin === 'live', 'An empty live response must remain identified as an API response, not mock fallback data.');

  const timeout = await renderStateScenario('timeout');
  expect(timeout.state?.dataset?.liveState === 'timeout', 'A TIMEOUT request error is not rendered as the timeout state.');
  expect(timeout.state?.attributes?.role === 'alert', 'Timeout state must use role=alert.');
  expect(timeout.source?.dataset?.dataOrigin === 'live', 'A timeout must not claim that mock fallback records are displayed.');
}

runBehaviorChecks().then(() => {
  if (failures.length) {
    console.error('Live data state checks failed.');
    failures.forEach(failure => console.error(`  ${failure}`));
    process.exit(1);
  }

  console.log(`Live data state checks OK: ${requiredStates.length} states, ${activePages.length} active API pages, API-only empty/timeout behavior verified.`);
}).catch(error => {
  console.error('Live data state checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
