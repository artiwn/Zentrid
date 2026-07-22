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

const contractSource = read('assets/js/api-contracts.ts');
const repositorySource = read('assets/js/api-repositories.ts');
const globals = read('types/zentrid-globals.d.ts');

[
  'DEFAULT_CACHE_TTL_MS', 'cacheEntries', 'inFlightReads', 'readThroughCache',
  'forceRefresh', 'maxAgeMs', 'cloneListResult', 'invalidateCache', 'cacheSnapshot',
  "window.addEventListener('zentrid:auth'", "window.addEventListener('zentrid:session-expired'"
].forEach(token => expect(repositorySource.includes(token), `Repository cache token is missing: ${token}.`));

[
  'ZentridRepositoryReadOptions', 'ZentridRepositoryCacheSnapshotEntry', 'ZentridRepositoryCacheApi'
].forEach(name => expect(globals.includes(`interface ${name}`), `Global cache type is missing: ${name}.`));
expect(globals.includes('cache: ZentridRepositoryCacheApi'), 'ZentridAPIRepositoriesApi does not expose the cache API.');

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

let releaseClients;
let releaseAlerts;
let clientCalls = 0;
let clientDetailCalls = 0;
let tenantCalls = 0;
let tenantDetailCalls = 0;
let plantDetailCalls = 0;
let integrationDetailCalls = 0;
let alertCalls = 0;
const listeners = new Map();
const clientGate = new Promise(resolve => { releaseClients = resolve; });
const alertGate = new Promise(resolve => { releaseAlerts = resolve; });
const sandbox = {
  AbortController,
  window: {
    addEventListener(name, listener) { listeners.set(name, listener); }
  },
  console,
  setTimeout,
  clearTimeout,
  ZentridAPI: {
    async request(path) {
      if (path.startsWith('/api/admin/clients?')) {
        clientCalls += 1;
        if (clientCalls === 1) await clientGate;
        return { items: [{ clientId: 'C-1', clientName: 'Client One', nested: { source: 'backend' } }], page: 1, pageSize: 50, totalCount: 1, totalPages: 1 };
      }
      if (path.startsWith('/api/admin/tenants?')) {
        tenantCalls += 1;
        if (tenantCalls === 1) throw new Error('temporary tenant failure');
        return { items: [{ tenantId: 'T-1', tenantName: 'Tenant One' }], page: 1, pageSize: 50, totalCount: 1, totalPages: 1 };
      }
      if (path.startsWith('/api/alerts?')) {
        alertCalls += 1;
        if (alertCalls === 1) await alertGate;
        return { items: [{ id: 'A-1', title: 'Alert One', provider: 'Huawei', severity: 'Warning' }], page: 1, pageSize: 50, totalCount: 1, totalPages: 1 };
      }
      if (path.startsWith('/api/plants?')) return { items: [] };
      if (path.startsWith('/api/admin/plants?')) return { items: [] };
      if (path.startsWith('/api/devices?')) return { items: [] };
      throw new Error(`Unexpected ZentridAPI path: ${path}`);
    }
  },
  ZentridPlatformAPI: {
    clients: {
      async list() {
        return { items: [{ clientId: 'C-1', clientName: 'Client One', nested: { source: 'backend' } }] };
      },
      async get(id) {
        clientDetailCalls += 1;
        return { data: { clientId: id, clientName: 'Client One', nested: { source: 'detail' } } };
      }
    },
    tenants: {
      async list() {
        if (tenantCalls === 1) throw new Error('temporary tenant failure');
        return { items: [{ tenantId: 'T-1', tenantName: 'Tenant One' }] };
      },
      async get(id) {
        tenantDetailCalls += 1;
        return { data: { tenantId: id, tenantName: 'Tenant One', nested: { source: 'detail' } } };
      }
    },
    plantRegistry: {
      async list() { return { items: [] }; },
      async get(id) {
        plantDetailCalls += 1;
        return { data: { id, sourcePlantId: 'EXT-P-1', plantName: 'Plant One', installedPowerKw: 1000, nested: { source: 'detail' } } };
      }
    },
    live: {
      async plants() { return { items: [] }; },
      async devices() { return { items: [] }; },
      async alerts() {
        return { items: [{ id: 'A-1', title: 'Alert One', provider: 'Huawei', severity: 'Warning' }] };
      },
      async integrations() { return { items: [] }; }
    },
    providerIntegrations: {
      async list() { return { items: [] }; },
      async get(id) {
        integrationDetailCalls += 1;
        return { data: { id, provider: 'Huawei', integrationName: 'Integration One', status: 'Active', nested: { source: 'detail' } } };
      }
    }
  }
};
sandbox.window.ZentridAPI = sandbox.ZentridAPI;
sandbox.window.ZentridPlatformAPI = sandbox.ZentridPlatformAPI;
vm.createContext(sandbox);
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None };
vm.runInContext(ts.transpileModule(contractSource, { compilerOptions }).outputText, sandbox, { filename: 'api-contracts.js' });
sandbox.ZentridAPIContracts = sandbox.window.ZentridAPIContracts;
vm.runInContext(ts.transpileModule(repositorySource, { compilerOptions }).outputText, sandbox, { filename: 'api-repositories.js' });
const repositories = sandbox.window.ZentridAPIRepositories;
expect(Boolean(repositories), 'ZentridAPIRepositories did not initialize.');

(async () => {
  if (repositories) {
    repositories.configure(context);

    const first = repositories.clients.list();
    const shared = repositories.clients.list();
    const third = repositories.clients.list();
    expect(clientCalls === 1, 'Concurrent Client reads did not start as one backend request.');
    const pending = repositories.cache.snapshot('clients')[0];
    expect(pending.inFlight === true && pending.deduplicated === 2, 'In-flight Client reads were not recorded as deduplicated.');

    releaseClients();
    const [firstResult, sharedResult, thirdResult] = await Promise.all([first, shared, third]);
    expect(firstResult.items[0].id === 'C-1' && thirdResult.items[0].id === 'C-1', 'Deduplicated Client results are incorrect.');
    expect(firstResult !== sharedResult && firstResult.items !== sharedResult.items, 'Concurrent consumers received the same result references.');

    const detailFirst = repositories.clients.get('C-1');
    const detailShared = repositories.clients.get('C-1');
    const [detailFirstResult, detailSharedResult] = await Promise.all([detailFirst, detailShared]);
    expect(clientDetailCalls === 1, 'Concurrent Client Detail reads did not deduplicate by selected ID.');
    expect(detailFirstResult.item?.id === 'C-1' && detailSharedResult.item?.raw.nested.source === 'detail', 'Direct Client Detail cache results are incorrect.');

    firstResult.items[0].name = 'Mutated by first consumer';
    firstResult.items[0].raw.nested.source = 'mutated';
    const cachedResult = await repositories.clients.list();
    expect(clientCalls === 1, 'A valid Client cache entry triggered another backend request.');
    expect(cachedResult.items[0].name === 'Client One', 'Cached mapped records were mutated by another consumer.');
    expect(cachedResult.items[0].raw.nested.source === 'backend', 'Cached raw records were mutated by another consumer.');

    await repositories.clients.list({ forceRefresh: true });
    expect(clientCalls === 2, 'forceRefresh did not bypass the Client cache.');

    repositories.cache.invalidate('clients');
    expect(repositories.cache.snapshot('clients')[0].cached === false, 'Entity cache invalidation did not clear Clients.');
    await repositories.clients.list();
    expect(clientCalls === 3, 'Client read after invalidation did not reach the backend.');

    await new Promise(resolve => setTimeout(resolve, 2));
    await repositories.clients.list({ maxAgeMs: 0 });
    expect(clientCalls === 4, 'maxAgeMs did not expire the Client cache entry.');

    let tenantFailed = false;
    try { await repositories.tenants.list(); } catch (_error) { tenantFailed = true; }
    expect(tenantFailed, 'The expected temporary Tenant failure was not returned.');
    expect(repositories.cache.snapshot('tenants')[0].cached === false, 'A failed Tenant request was cached.');
    const tenantResult = await repositories.tenants.list();
    expect(tenantCalls === 2 && tenantResult.items[0].id === 'T-1', 'Tenant retry after a failed request did not reach the backend.');

    const tenantDetailFirst = repositories.tenants.get('T-1');
    const tenantDetailShared = repositories.tenants.get('T-1');
    const [tenantDetailFirstResult, tenantDetailSharedResult] = await Promise.all([tenantDetailFirst, tenantDetailShared]);
    expect(tenantDetailCalls === 1, 'Concurrent Tenant Detail reads did not deduplicate by selected ID.');
    expect(tenantDetailFirstResult.item?.id === 'T-1' && tenantDetailSharedResult.item?.raw.nested.source === 'detail', 'Direct Tenant Detail cache results are incorrect.');

    const plantDetailFirst = repositories.plants.get('P-1');
    const plantDetailShared = repositories.plants.get('P-1');
    const [plantDetailFirstResult, plantDetailSharedResult] = await Promise.all([plantDetailFirst, plantDetailShared]);
    expect(plantDetailCalls === 1, 'Concurrent Plant Detail reads did not deduplicate by selected ID.');
    expect(plantDetailFirstResult.item?.id === 'P-1' && plantDetailSharedResult.item?.raw.adminRecord?.nested?.source === 'detail', 'Direct Plant Detail cache results are incorrect.');

    const integrationDetailFirst = repositories.integrations.get('I-1');
    const integrationDetailShared = repositories.integrations.get('I-1');
    const [integrationDetailFirstResult, integrationDetailSharedResult] = await Promise.all([integrationDetailFirst, integrationDetailShared]);
    expect(integrationDetailCalls === 1, 'Concurrent Integration Detail reads did not deduplicate by selected ID.');
    expect(integrationDetailFirstResult.item?.id === 'I-1' && integrationDetailSharedResult.item?.raw.nested.source === 'detail', 'Direct Integration Detail cache results are incorrect.');

    const authListener = listeners.get('zentrid:auth');
    expect(typeof authListener === 'function', 'Repository cache did not subscribe to auth lifecycle changes.');
    const staleAlertRequest = repositories.alerts.list();
    expect(alertCalls === 1 && repositories.cache.snapshot('alerts')[0].inFlight === true, 'Alert request did not enter the in-flight cache.');
    authListener?.({ type: 'zentrid:auth' });
    expect(repositories.cache.snapshot().every(entry => entry.cached === false && entry.inFlight === false), 'Auth lifecycle invalidation did not clear cached and in-flight reads.');
    releaseAlerts();
    await staleAlertRequest;
    expect(repositories.cache.snapshot('alerts')[0].cached === false, 'A pre-auth-change in-flight response repopulated the cache.');
    await repositories.alerts.list();
    expect(alertCalls === 2, 'A post-auth-change Alert read reused the stale in-flight request.');

    const clientStats = repositories.cache.snapshot('clients')[0];
    expect(clientStats.ttlMs === 30000, 'Client cache TTL is incorrect.');
    expect(clientStats.hits >= 1 && clientStats.misses >= 4 && clientStats.invalidations >= 1, 'Client cache statistics are incomplete.');
  }

  if (failures.length) {
    console.error('Repository cache checks failed.');
    failures.forEach(message => console.error(`  ${message}`));
    process.exit(1);
  }
  console.log('Repository cache checks OK: TTL cache, in-flight deduplication, clone isolation, force refresh, invalidation, failure retry and auth reset verified.');
})().catch(error => {
  console.error('Repository cache checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
