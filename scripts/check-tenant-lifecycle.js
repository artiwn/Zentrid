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

const source = read('assets/js/tenant-lifecycle.ts');
const tenantSource = read('assets/js/tenants.ts');
const tenantDetailHtml = read('pages/tenant-detail.html');
const css = read('assets/css/src/components/tenant-lifecycle.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json') || '{}');
const globals = read('types/zentrid-globals.d.ts');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'FleetTenantLifecycle', 'data-tenant-lifecycle-action', 'FleetAPIMutations.tenants.activate',
  'FleetAPIMutations.tenants.deactivate', 'FleetAPIMutations.tenants.archive',
  'Live API tenant records', 'result.error.retriable', 'window.confirm', 'window.location.reload()'
].forEach(token => expect(source.includes(token), `Tenant lifecycle token is missing: ${token}.`));
expect(tenantSource.includes("window.FleetTenantLifecycle?.render(c)"), 'Tenant Detail does not render the lifecycle module.');
expect(tenantSource.includes('window.FleetTenantLifecycle?.wire(tenant)'), 'Tenant Detail does not wire the lifecycle module.');
expect(tenantDetailHtml.includes('tenant-lifecycle.js'), 'Tenant Detail does not load tenant-lifecycle.js.');
expect(tenantDetailHtml.indexOf('api-mutations.js') < tenantDetailHtml.indexOf('tenant-lifecycle.js'), 'api-mutations.js must load before tenant-lifecycle.js.');
expect(tenantDetailHtml.indexOf('layout.js') < tenantDetailHtml.indexOf('tenant-lifecycle.js'), 'layout.js must load before tenant-lifecycle.js.');
expect(tenantDetailHtml.indexOf('tenant-lifecycle.js') < tenantDetailHtml.indexOf('tenants.js'), 'tenant-lifecycle.js must load before tenants.js.');
expect(Array.isArray(manifest.sources) && manifest.sources.includes('components/tenant-lifecycle.css'), 'Tenant lifecycle CSS is missing from the manifest.');
expect(css.includes('.tenant-lifecycle-v111') && css.includes('@media (max-width: 760px)'), 'Tenant lifecycle responsive styles are incomplete.');
expect(globals.includes('interface FleetTenantLifecycleApi'), 'FleetTenantLifecycle global type is missing.');
expect(packageJson.scripts?.['check:tenant-lifecycle'] === 'node scripts/check-tenant-lifecycle.js', 'Package script check:tenant-lifecycle is missing.');
expect(String(packageJson.scripts?.verify || '').includes('check:tenant-lifecycle'), 'verify does not run Tenant lifecycle checks.');
expect(String(packageJson.scripts?.['verify:vercel'] || '').includes('check:tenant-lifecycle'), 'verify:vercel does not run Tenant lifecycle checks.');

class FakeElement {
  constructor() {
    this.dataset = {};
    this.disabled = false;
    this.textContent = '';
    this.hidden = false;
    this.className = '';
    this.children = [];
    this.listeners = {};
    this.attributes = {};
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  querySelectorAll() { return this.buttons || []; }
  replaceChildren() { this.children = []; }
  appendChild(child) { this.children.push(child); }
  closest(selector) {
    if (selector === '[data-tenant-lifecycle-action]' && this.dataset.tenantLifecycleAction) return this;
    if (selector === '[data-tenant-lifecycle-retry]' && this.dataset.tenantLifecycleRetry) return this;
    return null;
  }
}

const container = new FakeElement();
const deactivateButton = new FakeElement();
deactivateButton.dataset.tenantLifecycleAction = 'deactivate';
deactivateButton.dataset.label = 'Deactivate';
deactivateButton.textContent = 'Deactivate';
const archiveButton = new FakeElement();
archiveButton.dataset.tenantLifecycleAction = 'archive';
archiveButton.dataset.label = 'Archive';
archiveButton.textContent = 'Archive';
container.buttons = [deactivateButton, archiveButton];
const message = new FakeElement();
const dom = { tenantLifecycleActions: container, tenantLifecycleMessage: message };
const storage = new Map();
const mutationCalls = [];
const toasts = [];
const confirmations = [];
let reloadScheduled = false;
let mutationMode = 'success';

const sessionStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const windowObject = {
  FleetDataSource: {
    origin(record) { return String(record?.dataOrigin || 'mock'); }
  },
  FleetAPIMutations: null,
  confirm(messageText) { confirmations.push(messageText); return true; },
  setTimeout(callback) { reloadScheduled = true; windowObject.pendingReload = callback; return 1; },
  location: { reload() {} }
};

const mutationApi = {
  tenants: {
    async activate(id) { mutationCalls.push(['activate', id]); return { ok: true, data: { id }, message: 'Tenant activated successfully.', meta: {} }; },
    async deactivate(id) {
      mutationCalls.push(['deactivate', id]);
      if (mutationMode === 'failure') return { ok: false, data: null, message: 'Backend unavailable.', error: { retriable: true }, meta: {} };
      return { ok: true, data: { id }, message: 'Tenant deactivated successfully.', meta: {} };
    },
    async archive(id) { mutationCalls.push(['archive', id]); return { ok: true, data: { id }, message: 'Tenant archived successfully.', meta: {} }; }
  }
};
windowObject.FleetAPIMutations = mutationApi;

const documentObject = {
  getElementById(id) { return dom[id] || null; },
  createElement() { return new FakeElement(); }
};
const FleetLayout = { toast(messageText) { toasts.push(messageText); } };
const sandbox = {
  window: windowObject,
  document: documentObject,
  sessionStorage,
  FleetAPIMutations: mutationApi,
  FleetLayout,
  Element: FakeElement,
  HTMLElement: FakeElement,
  HTMLButtonElement: FakeElement,
  console,
  String,
  Boolean,
  Object,
  Array,
  Promise,
  Error,
  Set,
  Map,
  Date,
  encodeURIComponent
};
vm.createContext(sandbox);
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None };
vm.runInContext(ts.transpileModule(source, { compilerOptions }).outputText, sandbox, { filename: 'tenant-lifecycle.js' });
const lifecycle = windowObject.FleetTenantLifecycle;
expect(Boolean(lifecycle), 'FleetTenantLifecycle did not initialize.');

(async () => {
  if (lifecycle) {
    const liveActive = { id: 'T-1', name: 'Live Active', status: 'Active', dataOrigin: 'live' };
    const activeHtml = lifecycle.render(liveActive);
    expect(activeHtml.includes('data-tenant-lifecycle-action="deactivate"'), 'Active live tenant is missing Deactivate.');
    expect(activeHtml.includes('data-tenant-lifecycle-action="archive"'), 'Active live tenant is missing Archive.');
    expect(!activeHtml.includes('data-tenant-lifecycle-action="activate"'), 'Active live tenant must not show Activate.');

    const suspendedHtml = lifecycle.render({ id: 'T-2', name: 'Suspended', status: 'Suspended', dataOrigin: 'live' });
    expect(suspendedHtml.includes('data-tenant-lifecycle-action="activate"'), 'Suspended live tenant is missing Activate.');
    expect(!suspendedHtml.includes('data-tenant-lifecycle-action="deactivate"'), 'Suspended live tenant must not show Deactivate.');

    const archivedHtml = lifecycle.render({ id: 'T-3', name: 'Archived', status: 'Archived', dataOrigin: 'live' });
    expect(!archivedHtml.includes('data-tenant-lifecycle-action='), 'Archived tenant must not expose lifecycle buttons.');
    expect(archivedHtml.includes('read-only'), 'Archived tenant does not explain its read-only state.');

    const mockHtml = lifecycle.render({ id: 'T-MOCK', name: 'Mock', status: 'Active', dataOrigin: 'mock' });
    expect(mockHtml.includes('Live API required'), 'Mock tenant does not show Live API requirement.');
    expect(!mockHtml.includes('data-tenant-lifecycle-action='), 'Mock tenant must not expose backend lifecycle buttons.');
    expect(lifecycle.isBackendManaged({ dataOrigin: 'mixed' }) === true, 'Mixed live/local tenant should remain backend managed.');
    expect(lifecycle.isBackendManaged({ dataOrigin: 'local' }) === false, 'Local tenant must not be backend managed.');

    lifecycle.wire(liveActive);
    expect(typeof container.listeners.click === 'function', 'Tenant lifecycle click handler was not wired.');
    await container.listeners.click({ target: deactivateButton });
    await new Promise(resolve => setImmediate(resolve));
    expect(mutationCalls.some(([action, id]) => action === 'deactivate' && id === 'T-1'), 'Deactivate action did not call FleetAPIMutations.');
    expect(confirmations.some(value => value.includes('Deactivate Live Active')), 'Deactivate confirmation was not shown.');
    expect(toasts.includes('Tenant deactivated successfully.'), 'Successful lifecycle result did not show a toast.');
    expect(reloadScheduled, 'Successful lifecycle result did not schedule a backend refresh reload.');
    expect(storage.get('zentrid_tenant_lifecycle_flash') === 'Tenant deactivated successfully.', 'Successful lifecycle flash was not stored.');

    mutationMode = 'failure';
    reloadScheduled = false;
    container.dataset.lifecycleWired = '';
    container.listeners = {};
    lifecycle.wire(liveActive);
    await container.listeners.click({ target: deactivateButton });
    await new Promise(resolve => setImmediate(resolve));
    expect(message.className.includes('error'), 'Failed lifecycle action did not render an error state.');
    expect(message.children.some(child => child.dataset?.tenantLifecycleRetry === 'deactivate'), 'Retriable lifecycle failure did not offer Retry.');
    expect(container.attributes['aria-busy'] === 'false', 'Failed lifecycle action did not clear the busy state.');
  }

  if (failures.length) {
    console.error('Tenant lifecycle checks failed.');
    failures.forEach(messageText => console.error(`  ${messageText}`));
    process.exit(1);
  }
  console.log(`Tenant lifecycle checks OK: live/mock gating, status actions, confirmation, mutation success and retry behavior verified.`);
})().catch(error => {
  console.error('Tenant lifecycle checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
