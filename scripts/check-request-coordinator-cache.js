const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => {
  const path = join(root, relative);
  expect(existsSync(path), `Missing file: ${relative}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const repositorySource = read('assets/js/api-repositories.ts');
const liveSource = read('assets/js/live-api-ui.ts');
const globals = read('types/zentrid-globals.d.ts');
const packageJson = read('package.json');

[
  'DEFAULT_STALE_MAX_AGE_MS', 'PERSISTENT_CACHE_PREFIX', 'sessionStorage',
  'staleWhileRevalidate', 'hydratePersistentEntry', 'persistCacheEntry',
  'activeRequests', 'requestGroup', 'supersede', 'AbortController',
  "zentrid:repository-updated", 'cacheVariant'
].forEach(token => expect(repositorySource.includes(token), `Request coordinator/cache token is missing: ${token}.`));
[
  "requestGroup: `registry:${entity}`", 'staleWhileRevalidate: true',
  'repositoryCachePresentation', "window.addEventListener('zentrid:repository-updated'",
  'applyClients(true)', 'applyPlants(true)', 'applyDevices(true)', 'applyAlerts(true)'
].forEach(token => expect(liveSource.includes(token), `Live cache integration token is missing: ${token}.`));
[
  'ZentridRepositoryCacheMeta', 'staleMaxAgeMs?: number;', 'requestGroup?: string;',
  'coordinator: ZentridRepositoryCoordinatorApi', 'clearPersistent'
].forEach(token => expect(globals.includes(token), `Global request/cache type is missing: ${token}.`));
expect(packageJson.includes('check:request-coordinator-cache'), 'Package scripts do not expose check:request-coordinator-cache.');

function createStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    clear() { values.clear(); },
    snapshot() { return Object.fromEntries(values); }
  };
}

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

class TestCustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
}

function createSandbox(storage, requestHandler, directHandler = requestHandler) {
  const listeners = new Map();
  const window = {
    addEventListener(name, listener) {
      const current = listeners.get(name) || [];
      current.push(listener);
      listeners.set(name, current);
    },
    dispatchEvent(event) {
      (listeners.get(event.type) || []).forEach(listener => listener(event));
      return true;
    }
  };
  const ZentridAPI = { request: requestHandler };
  const ZentridPlatformAPI = {
    clients: { list: directHandler },
    tenants: { list: directHandler },
    plantRegistry: { list: directHandler },
    providerIntegrations: { list: directHandler },
    live: {
      plants: directHandler,
      devices: directHandler,
      alerts: directHandler,
      integrations: directHandler
    }
  };
  Object.assign(window, { ZentridAPI, ZentridPlatformAPI });
  return {
    sandbox: {
      window,
      sessionStorage: storage,
      AbortController,
      CustomEvent: TestCustomEvent,
      console,
      setTimeout,
      clearTimeout,
      ZentridAPI,
      ZentridPlatformAPI
    },
    listeners
  };
}

function loadRepositories(environment) {
  const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None };
  vm.createContext(environment.sandbox);
  vm.runInContext(ts.transpileModule(read('assets/js/api-contracts.ts'), { compilerOptions }).outputText, environment.sandbox, { filename: 'api-contracts.js' });
  environment.sandbox.ZentridAPIContracts = environment.sandbox.window.ZentridAPIContracts;
  vm.runInContext(ts.transpileModule(repositorySource, { compilerOptions }).outputText, environment.sandbox, { filename: 'api-repositories.js' });
  const repositories = environment.sandbox.window.ZentridAPIRepositories;
  repositories.configure(context);
  return repositories;
}

function payload(page, name = `Client ${page}`) {
  return {
    items: [{ clientId: `C-${page}`, clientName: name }],
    page,
    pageSize: 50,
    totalCount: 100,
    totalPages: 2,
    hasPreviousPage: page > 1,
    hasNextPage: page < 2
  };
}

function abortError() {
  const error = new Error('Request was cancelled.');
  error.code = 'ABORTED';
  return error;
}

(async () => {
  const storage = createStorage();
  let calls = 0;
  let releaseRefresh;
  let holdRefresh = false;
  const updatedEvents = [];
  const firstEnvironment = createSandbox(storage, async (path, options = {}) => {
    calls += 1;
    if (holdRefresh) {
      await new Promise((resolve, reject) => {
        releaseRefresh = resolve;
        options.signal?.addEventListener('abort', () => reject(abortError()), { once: true });
      });
    }
    const page = Number(new URL(`https://zentrid.test${path}`).searchParams.get('page') || 1);
    return payload(page, calls > 1 ? 'Client Refreshed' : 'Client Initial');
  });
  firstEnvironment.sandbox.window.addEventListener('zentrid:repository-updated', event => updatedEvents.push(event.detail));
  const firstRepositories = loadRepositories(firstEnvironment);

  const initial = await firstRepositories.clients.list({ page: 1, pageSize: 50, persist: true });
  expect(initial.cache?.state === 'network', 'Initial repository read was not marked as a network result.');
  expect(Object.keys(storage.snapshot()).some(key => key.includes('clients|variant=list|page=1|pageSize=50')), 'Successful Client page was not persisted in sessionStorage.');

  await new Promise(resolve => setTimeout(resolve, 3));
  holdRefresh = true;
  const stale = await firstRepositories.clients.list({
    page: 1,
    pageSize: 50,
    maxAgeMs: 0,
    staleMaxAgeMs: 60_000,
    staleWhileRevalidate: true,
    persist: true,
    requestGroup: 'registry:clients',
    supersede: true
  });
  expect(stale.cache?.state === 'stale' && stale.cache.revalidating === true, 'Stale-while-revalidate did not return cached Client data immediately.');
  expect(stale.items[0].name === 'Client Initial', 'Stale-while-revalidate did not preserve the last successful data while refreshing.');
  releaseRefresh?.();
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(updatedEvents.some(detail => detail?.reason === 'revalidated' && detail?.entity === 'clients'), 'Background revalidation did not publish zentrid:repository-updated.');

  let reloadCalls = 0;
  let releaseReload;
  const reloadEnvironment = createSandbox(storage, async (path, options = {}) => {
    reloadCalls += 1;
    await new Promise((resolve, reject) => {
      releaseReload = resolve;
      options.signal?.addEventListener('abort', () => reject(abortError()), { once: true });
    });
    return payload(1, 'Client After Reload');
  });
  const reloadRepositories = loadRepositories(reloadEnvironment);
  const restored = await reloadRepositories.clients.list({
    page: 1,
    pageSize: 50,
    staleWhileRevalidate: true,
    persist: true,
    requestGroup: 'registry:clients',
    supersede: true
  });
  expect(restored.cache?.state === 'persistent' && restored.cache.revalidating === true, 'Reload did not restore the last successful page from sessionStorage and refresh it in the background.');
  expect(restored.items[0].name === 'Client Refreshed', 'Persistent cache did not contain the latest successful background refresh.');
  expect(reloadCalls === 1, 'Persistent cache did not start exactly one background refresh.');
  releaseReload?.();
  await new Promise(resolve => setTimeout(resolve, 5));

  const cancelStorage = createStorage();
  let pageOneAborted = false;
  const cancelEnvironment = createSandbox(cancelStorage, async (path, options = {}) => {
    const page = Number(new URL(`https://zentrid.test${path}`).searchParams.get('page') || 1);
    if (page === 1) {
      await new Promise((resolve, reject) => {
        options.signal?.addEventListener('abort', () => {
          pageOneAborted = true;
          reject(abortError());
        }, { once: true });
      });
    }
    return payload(page);
  }, async options => {
    if (options?.signal?.aborted) throw abortError();
    return payload(1);
  });
  const cancelRepositories = loadRepositories(cancelEnvironment);
  const oldPage = cancelRepositories.clients.list({ page: 1, pageSize: 50, requestGroup: 'registry:clients', supersede: true, persist: false });
  await new Promise(resolve => setTimeout(resolve, 1));
  const newPage = cancelRepositories.clients.list({ page: 2, pageSize: 50, requestGroup: 'registry:clients', supersede: true, persist: false });
  let oldRejected = false;
  try { await oldPage; } catch (error) { oldRejected = error?.code === 'ABORTED' || /cancel/i.test(String(error?.message)); }
  const pageTwo = await newPage;
  const coordinatorStats = cancelRepositories.cache.snapshot('clients')[0];
  expect(pageOneAborted && oldRejected, 'Superseding a registry request did not abort the previous HTTP request.');
  expect(pageTwo.pagination.page === 2 && pageTwo.items[0].id === 'C-2', 'The newest registry request did not complete after cancelling the old page.');
  expect(coordinatorStats.cancellations >= 1, 'Request cancellation was not recorded in coordinator statistics.');
  expect(cancelRepositories.coordinator.snapshot().length === 0, 'Coordinator retained completed requests.');

  if (failures.length) {
    console.error('Request coordinator and cache checks failed.');
    failures.forEach(message => console.error(`  ${message}`));
    process.exit(1);
  }
  console.log('Request coordinator and cache checks OK: persistent restore, stale-while-revalidate, background refresh events, request superseding and cancellation verified.');
})().catch(error => {
  console.error('Request coordinator and cache checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
