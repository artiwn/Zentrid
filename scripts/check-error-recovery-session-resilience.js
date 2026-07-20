const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const apiSource = read('assets/js/api-client.ts');
const sessionSource = read('assets/js/session-resilience.ts');
const authGuard = read('assets/js/auth-guard.ts');
const repositorySource = read('assets/js/api-repositories.ts');
const css = read('assets/css/src/components/session-resilience.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json'));
const packageJson = JSON.parse(read('package.json'));

[
  'DEFAULT_SAFE_RETRIES', 'DEFAULT_RETRY_STATUSES', 'retryAfterMs', 'safeMethod',
  "'zentrid:request-retry'", "'zentrid:request-success'", "'OFFLINE'",
  'REFRESH_LOCK_KEY', 'coordinatedRefresh', 'waitForPeerRefresh'
].forEach(token => assert(apiSource.includes(token), `API recovery token is missing: ${token}`));
[
  'BroadcastChannel', 'STORAGE_MESSAGE_KEY', "'zentrid:data-mutated'", "'storage'",
  "'offline'", "'online'", 'broadcastInvalidation', 'clearPersistedRepositoryCache'
].forEach(token => assert(sessionSource.includes(token), `Session resilience token is missing: ${token}`));
assert(authGuard.includes("window.addEventListener('zentrid:session-sync'"), 'Auth guard must react to cross-tab session synchronization.');
assert(authGuard.includes("window.addEventListener('pageshow'"), 'Auth guard must revalidate sessions restored from back-forward cache.');
assert(repositorySource.includes("'zentrid:cache-recovered'"), 'Repository cache must report corrupt/expired persistent recovery.');
assert(repositorySource.includes('validPersistedResult'), 'Repository cache must validate persisted result shape.');
assert(manifest.sources.includes('components/session-resilience.css'), 'Session resilience CSS is missing from the CSS manifest.');
['.fleet-recovery-banner', '[data-state="offline"]', '@media (max-width: 640px)'].forEach(token => {
  assert(css.includes(token), `Session resilience CSS is missing ${token}.`);
});
assert(packageJson.scripts['check:error-recovery-session-resilience'], 'package.json must expose the v137 regression check.');
assert(String(packageJson.scripts.verify || '').includes('check:error-recovery-session-resilience'), 'verify must run the v137 regression check.');
assert(String(packageJson.scripts['verify:vercel'] || '').includes('check:error-recovery-session-resilience'), 'verify:vercel must run the v137 regression check.');

const htmlFiles = ['index.html', 'login.html', 'client-onboarding.html', ...fs.readdirSync(path.join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => `pages/${name}`)];
let guardedPages = 0;
htmlFiles.forEach(relative => {
  const html = read(relative);
  if (!html.includes('api-client.js')) return;
  const apiIndex = html.indexOf('api-client.js');
  const resilienceIndex = html.indexOf('session-resilience.js');
  const guardIndex = html.indexOf('auth-guard.js');
  assert(resilienceIndex > apiIndex, `${relative}: session-resilience.js must load after api-client.js.`);
  if (guardIndex >= 0) {
    guardedPages += 1;
    assert(resilienceIndex < guardIndex, `${relative}: session-resilience.js must load before auth-guard.js.`);
  }
});

function createStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    get length() { return map.size; },
    key(index) { return [...map.keys()][index] ?? null; },
    getItem(key) { return map.has(String(key)) ? map.get(String(key)) : null; },
    setItem(key, value) { map.set(String(key), String(value)); },
    removeItem(key) { map.delete(String(key)); },
    clear() { map.clear(); }
  };
}

class TestCustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
}

async function verifyApiRecovery() {
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const events = [];
  let fetchCalls = 0;
  let getFailuresRemaining = 2;
  let postFailuresRemaining = 1;
  const navigatorObject = { onLine: true };
  const windowObject = {
    location: { hostname: 'zentrid.test', pathname: '/pages/clients.html', href: '' },
    addEventListener() {},
    dispatchEvent(event) { events.push(event); return true; },
    setTimeout,
    clearTimeout
  };
  const fetchMock = async (_url, init = {}) => {
    fetchCalls += 1;
    const method = String(init.method || 'GET').toUpperCase();
    if (method === 'GET' && getFailuresRemaining > 0) {
      getFailuresRemaining -= 1;
      return new Response(JSON.stringify({ message: 'temporary' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '0' } });
    }
    if (method === 'POST' && postFailuresRemaining > 0) {
      postFailuresRemaining -= 1;
      return new Response(JSON.stringify({ message: 'temporary mutation failure' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const sandbox = {
    window: windowObject,
    localStorage,
    sessionStorage,
    navigator: navigatorObject,
    fetch: fetchMock,
    Headers,
    Response,
    AbortController,
    CustomEvent: TestCustomEvent,
    TextDecoder,
    Uint8Array,
    atob,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    Promise,
    console
  };
  windowObject.window = windowObject;
  vm.createContext(sandbox);
  const js = ts.transpileModule(apiSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInContext(js, sandbox, { filename: 'api-client.js' });
  const api = windowObject.FleetAPI;
  assert(api && typeof api.request === 'function', 'FleetAPI must initialize in the recovery harness.');

  const beforeGet = fetchCalls;
  const getResult = await api.request('/api/test', { method: 'GET', auth: false, retryDelayMs: 1, retry: 2 });
  assert(getResult.ok === true, 'Safe GET did not recover after transient 503 responses.');
  assert(fetchCalls - beforeGet === 3, 'Safe GET must retry exactly twice before succeeding.');
  assert(events.filter(event => event.type === 'zentrid:request-retry').length === 2, 'Safe GET retries must emit retry events.');

  const beforePost = fetchCalls;
  let postFailed = false;
  try { await api.request('/api/test-mutation', { method: 'POST', auth: false, body: '{}', retryDelayMs: 1 }); }
  catch (error) { postFailed = error && error.status === 503; }
  assert(postFailed, 'POST transient failure must be surfaced.');
  assert(fetchCalls - beforePost === 1, 'POST requests must never retry automatically.');

  navigatorObject.onLine = false;
  const beforeOffline = fetchCalls;
  let offlineCode = '';
  try { await api.request('/api/offline', { method: 'GET', auth: false, retryDelayMs: 1 }); }
  catch (error) { offlineCode = error && error.code; }
  assert(offlineCode === 'OFFLINE', 'Offline requests must fail with OFFLINE code.');
  assert(fetchCalls === beforeOffline, 'Offline mode must fail before calling fetch.');
}

function verifySessionRuntime() {
  const listeners = new Map();
  const localStorage = createStorage();
  const sessionStorage = createStorage({ 'zentrid_repository_cache_v127:clients|variant=list|page=1|pageSize=50': '{}' });
  const invalidations = [];
  const channelMessages = [];
  class FakeBroadcastChannel {
    constructor() { this.listeners = []; }
    postMessage(value) { channelMessages.push(value); }
    addEventListener(_type, handler) { this.listeners.push(handler); }
    close() {}
  }
  const windowObject = {
    ZentridAuth: { getSession: () => ({ accessToken: '', roles: [], expiresAt: '', user: null }) },
    FleetAPIRepositories: {
      cache: {
        invalidate() { invalidations.push('all'); },
        invalidateMany(entities) { invalidations.push([...entities]); }
      },
      coordinator: { cancelAll() {} }
    },
    addEventListener(type, handler) {
      const list = listeners.get(type) || [];
      list.push(handler);
      listeners.set(type, list);
    },
    dispatchEvent(event) {
      (listeners.get(event.type) || []).forEach(handler => handler(event));
      return true;
    },
    setTimeout,
    clearTimeout
  };
  const sandbox = {
    window: windowObject,
    document: { body: null, readyState: 'complete', querySelector() { return null; }, addEventListener() {} },
    navigator: { onLine: true },
    localStorage,
    sessionStorage,
    BroadcastChannel: FakeBroadcastChannel,
    CustomEvent: TestCustomEvent,
    queueMicrotask,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    Set,
    Map,
    console
  };
  windowObject.window = windowObject;
  vm.createContext(sandbox);
  const js = ts.transpileModule(sessionSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInContext(js, sandbox, { filename: 'session-resilience.js' });
  const runtime = windowObject.FleetSessionResilience;
  assert(runtime && typeof runtime.snapshot === 'function', 'FleetSessionResilience must initialize.');
  runtime.broadcastInvalidation(['clients']);
  assert(invalidations.some(value => Array.isArray(value) && value.includes('clients')), 'Manual cross-tab invalidation must invalidate local cache.');
  assert(channelMessages.some(value => value.type === 'cache-invalidate'), 'Manual invalidation must publish a cross-tab message.');
  assert(sessionStorage.getItem('zentrid_repository_cache_v127:clients|variant=list|page=1|pageSize=50') === null, 'Manual invalidation must clear matching persisted session cache.');
  const mutationEvent = new TestCustomEvent('zentrid:data-mutated', { detail: { entities: ['plants'], action: 'plant.create', path: '/api/admin/plants', method: 'POST', completedAt: new Date().toISOString() } });
  windowObject.dispatchEvent(mutationEvent);
  assert(channelMessages.some(value => value.type === 'cache-invalidate' && value.entities.includes('plants')), 'Successful mutation must publish dependent cache invalidation.');
  assert(runtime.snapshot().channel === 'broadcast-channel', 'Runtime snapshot must expose the active synchronization transport.');
}

(async () => {
  await verifyApiRecovery();
  verifySessionRuntime();
  if (failures.length) {
    console.error('Error recovery and session resilience check failed.');
    failures.forEach(failure => console.error(`  ${failure}`));
    process.exit(1);
  }
  console.log(`Error recovery and session resilience OK: ${htmlFiles.length} HTML pages, ${guardedPages} guarded pages, safe GET retries, offline fail-fast, cross-tab auth/cache synchronization.`);
})().catch(error => {
  console.error('Error recovery and session resilience check failed unexpectedly.');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
