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

const platformSource = read('assets/js/platform-api.ts');
const contractSource = read('assets/js/api-contracts.ts');
const repositorySource = read('assets/js/api-repositories.ts');
const globals = read('types/zentrid-globals.d.ts');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'mutationRequest', "'zentrid:data-mutated'", 'tenant.create', 'tenant.activate',
  'client.create', 'plant.create', 'integration.activate', 'integration.archive'
].forEach(token => expect(platformSource.includes(token), `Platform mutation token is missing: ${token}.`));
[
  'invalidateMany', 'mutationEntities', "window.addEventListener('zentrid:data-mutated'"
].forEach(token => expect(repositorySource.includes(token), `Repository mutation invalidation token is missing: ${token}.`));
expect(globals.includes('interface ZentridDataMutationDetail'), 'Global mutation detail contract is missing.');
expect(globals.includes('invalidateMany(entities: ZentridContractEntity[])'), 'Repository cache API does not expose invalidateMany().');
expect(packageJson.scripts?.['check:mutation-invalidation'] === 'node scripts/check-mutation-cache-invalidation.js', 'Package script check:mutation-invalidation is missing.');
expect(String(packageJson.scripts?.verify || '').includes('check:mutation-invalidation'), 'verify does not run mutation invalidation checks.');
expect(String(packageJson.scripts?.['verify:vercel'] || '').includes('check:mutation-invalidation'), 'verify:vercel does not run mutation invalidation checks.');

const directWritePatterns = [
  /create:\s*\([^)]*\)\s*=>\s*ZentridAPI\.request/,
  /activate:\s*\([^)]*\)\s*=>\s*ZentridAPI\.request/,
  /deactivate:\s*\([^)]*\)\s*=>\s*ZentridAPI\.request/,
  /suspend:\s*\([^)]*\)\s*=>\s*ZentridAPI\.request/,
  /archive:\s*\([^)]*\)\s*=>\s*ZentridAPI\.request/,
  /failed:\s*\([^)]*\)\s*=>\s*ZentridAPI\.request/
];
directWritePatterns.forEach(pattern => expect(!pattern.test(platformSource), `A platform write method bypasses mutationRequest(): ${pattern}.`));

function firstOf(row, keys, fallback = '') {
  for (const key of keys) {
    let value = row;
    for (const part of String(key).split('.')) {
      if (!value || typeof value !== 'object') { value = undefined; break; }
      value = value[part];
    }
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}
function safeText(value, fallback = '—') { return value === undefined || value === null || value === '' ? String(fallback) : String(value); }
function displayName(row, keys, entityLabel, index, typeHint) { return safeText(firstOf(row, keys, ''), `${typeHint || entityLabel} ${index + 1}`); }
function formatDate(value, fallback = 'No data') { return value ? `DATE:${value}` : fallback; }
function integrationVendor(value) { return String(value || '').trim() || 'Unknown'; }
function integrationSoftware(value) { return integrationVendor(value); }
const context = { safeText, firstOf, displayName, formatDate, integrationVendor, integrationSoftware };

const listeners = new Map();
const mutationEvents = [];
const calls = [];
let failedPath = '';
const windowObject = {
  addEventListener(name, listener) {
    const group = listeners.get(name) || [];
    group.push(listener);
    listeners.set(name, group);
  },
  dispatchEvent(event) {
    if (event.type === 'zentrid:data-mutated') mutationEvents.push(event.detail);
    (listeners.get(event.type) || []).forEach(listener => listener(event));
    return true;
  }
};
class TestCustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
}

const ZentridAPI = {
  async request(path, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    calls.push({ path, method });
    if (failedPath && path === failedPath) {
      failedPath = '';
      throw new Error(`forced failure: ${path}`);
    }
    if (method !== 'GET') return { ok: true, path, method };
    if (path === '/api/admin/clients') return { items: [{ clientId: 'C-1', clientName: 'Client One' }] };
    if (path === '/api/admin/tenants') return { items: [{ tenantId: 'T-1', tenantName: 'Tenant One' }] };
    if (path.startsWith('/api/plants?')) return { items: [{ id: 'P-1', plantName: 'Plant One', provider: 'Huawei' }], totalPages: 1 };
    if (path.startsWith('/api/admin/plants?')) return { items: [{ id: 'P-1', plantName: 'Plant One', provider: 'Huawei' }], totalPages: 1 };
    if (path.startsWith('/api/devices?')) return { items: [{ id: 'D-1', deviceName: 'Device One', provider: 'Huawei', sourcePlantId: 'P-1' }], totalPages: 1 };
    if (path.startsWith('/api/telemetry?')) return { items: [{ telemetryId: 'TM-1', metricName: 'Current Power', value: 1200, unit: 'kW' }], totalPages: 1 };
    if (path === '/api/alerts') return { items: [{ id: 'A-1', title: 'Alert One', provider: 'Huawei', severity: 'Warning' }] };
    if (path === '/api/integrations') return { items: [{ id: 'I-1', integrationName: 'Integration One', provider: 'Huawei', status: 'Active' }] };
    if (path === '/api/admin/provider-integrations') return { items: [] };
    if (path === '/api/plants') return { items: [] };
    if (path === '/api/devices') return { items: [] };
    throw new Error(`Unexpected request: ${method} ${path}`);
  }
};
const sandbox = {
  AbortController,
  window: windowObject,
  CustomEvent: TestCustomEvent,
  ZentridAPI,
  ZentridAuth: {
    me: async () => ({}), validate: async () => ({}), refresh: async () => ({}),
    request: async () => ({}), getSession: () => ({}), getAccessToken: () => ''
  },
  ZentridConfig: { isLocalFrontend: () => true, apiBaseUrl: '' },
  Headers,
  URLSearchParams,
  performance,
  fetch: async () => { throw new Error('raw fetch is not expected'); },
  console,
  setTimeout,
  clearTimeout,
  Date,
  String,
  Number,
  Boolean,
  Array,
  Object,
  Math,
  Set,
  Map,
  WeakMap,
  Promise,
  encodeURIComponent
};
sandbox.window.ZentridAPI = ZentridAPI;
vm.createContext(sandbox);
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None };
vm.runInContext(ts.transpileModule(platformSource, { compilerOptions }).outputText, sandbox, { filename: 'platform-api.js' });
sandbox.ZentridPlatformAPI = sandbox.window.ZentridPlatformAPI;
vm.runInContext(ts.transpileModule(contractSource, { compilerOptions }).outputText, sandbox, { filename: 'api-contracts.js' });
sandbox.ZentridAPIContracts = sandbox.window.ZentridAPIContracts;
vm.runInContext(ts.transpileModule(repositorySource, { compilerOptions }).outputText, sandbox, { filename: 'api-repositories.js' });
const platform = sandbox.window.ZentridPlatformAPI;
const repositories = sandbox.window.ZentridAPIRepositories;

(async () => {
  expect(Boolean(platform), 'ZentridPlatformAPI did not initialize.');
  expect(Boolean(repositories), 'ZentridAPIRepositories did not initialize.');
  if (platform && repositories) {
    repositories.configure(context);

    await Promise.all([
      repositories.clients.list(), repositories.tenants.list(), repositories.plants.list(),
      repositories.devices.list(), repositories.alerts.list(), repositories.telemetry.list(), repositories.integrations.list()
    ]);
    expect(repositories.cache.snapshot().every(entry => entry.cached), 'Initial repository caches were not primed.');

    await platform.tenants.activate('T-1');
    expect(repositories.cache.snapshot('tenants')[0].cached === false, 'Tenant mutation did not invalidate Tenant cache.');
    expect(repositories.cache.snapshot('clients')[0].cached === true, 'Tenant mutation invalidated unrelated Client cache.');
    const tenantEvent = mutationEvents.at(-1);
    expect(tenantEvent?.action === 'tenant.activate', 'Tenant mutation action metadata is incorrect.');
    expect(tenantEvent?.entities?.length === 1 && tenantEvent.entities[0] === 'tenants', 'Tenant mutation entity metadata is incorrect.');

    await repositories.tenants.list();
    const tenantGetCalls = calls.filter(call => call.path === '/api/admin/tenants' && call.method === 'GET').length;
    expect(tenantGetCalls === 2, 'Tenant read after mutation did not reach the backend.');

    await platform.providerIntegrations.activate('I-1');
    const integrationAffected = ['integrations', 'plants', 'devices', 'alerts'];
    expect(integrationAffected.every(entity => repositories.cache.snapshot(entity)[0].cached === false), 'Integration lifecycle mutation did not invalidate all dependent live caches.');
    expect(repositories.cache.snapshot('clients')[0].cached === true, 'Integration mutation invalidated unrelated Client cache.');
    const integrationEvent = mutationEvents.at(-1);
    expect(integrationEvent?.action === 'integration.activate', 'Integration mutation action metadata is incorrect.');
    expect(integrationAffected.every(entity => integrationEvent?.entities?.includes(entity)), 'Integration mutation event is missing dependent entities.');

    await repositories.clients.list();
    failedPath = '/api/admin/clients';
    let failed = false;
    try { await platform.clients.create({ name: 'Broken Client' }); } catch (_error) { failed = true; }
    expect(failed, 'Expected failed Client mutation did not reject.');
    expect(repositories.cache.snapshot('clients')[0].cached === true, 'Failed Client mutation invalidated the cache.');
    const eventsAfterFailure = mutationEvents.length;

    await platform.clients.create({ name: 'New Client' });
    expect(repositories.cache.snapshot('clients')[0].cached === false, 'Successful Client mutation did not invalidate Client cache.');
    expect(mutationEvents.length === eventsAfterFailure + 1, 'Successful Client mutation did not emit exactly one mutation event.');
    const clientEvent = mutationEvents.at(-1);
    expect(clientEvent?.path === '/api/admin/clients' && clientEvent?.method === 'POST', 'Client mutation path or method metadata is incorrect.');
    expect(typeof clientEvent?.completedAt === 'string' && !Number.isNaN(Date.parse(clientEvent.completedAt)), 'Mutation completion timestamp is invalid.');

    repositories.cache.invalidateMany(['tenants', 'clients', 'clients']);
    expect(repositories.cache.snapshot('tenants')[0].cached === false, 'invalidateMany() did not invalidate Tenants.');
  }

  if (failures.length) {
    console.error('Mutation cache invalidation checks failed.');
    failures.forEach(message => console.error(`  ${message}`));
    process.exit(1);
  }
  console.log('Mutation cache invalidation checks OK: successful writes emit typed events, targeted caches invalidate, dependent integration caches reset, failures preserve cache and invalidateMany is available.');
})().catch(error => {
  console.error('Mutation cache invalidation checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
