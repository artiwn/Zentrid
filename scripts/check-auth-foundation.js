const { readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const apiSource = readFileSync(join(root, 'assets/js/api-client.ts'), 'utf8');
const loginSource = readFileSync(join(root, 'assets/js/login.ts'), 'utf8');
const guardSource = readFileSync(join(root, 'assets/js/auth-guard.ts'), 'utf8');
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(!/GlobalAdmin123|DEFAULT_PASSWORD|Ready:\s*globaladmin/i.test(loginSource), 'Login source still contains test credentials.');
expect(/timeoutMs\?: number/.test(apiSource), 'API client does not expose request timeout configuration.');
expect(/retryAuth\?: boolean/.test(apiSource), 'API client does not expose one-time auth retry configuration.');
expect(/zentrid:session-expired/.test(apiSource) && /zentrid:session-expired/.test(guardSource), 'Session-expired event is not connected to auth guard.');
expect(/hasRole\(role: string\)/.test(apiSource), 'Role helper is missing from auth contract.');
expect(/ensureSession\(requiredRole\?: string\)/.test(apiSource), 'Session validation helper is missing from auth contract.');
expect(/GlobalAdmin/.test(guardSource), 'Global Admin role is not enforced by auth guard.');

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function token(payload) {
  return `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url(payload)}.`;
}

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

class TestCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}

async function runBehaviorChecks() {
  const storage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const events = [];
  let fetchHandler = async () => new Response(null, { status: 404 });
  const windowObject = {
    location: {
      hostname: 'localhost',
      pathname: '/index.html',
      search: '',
      hash: '',
      href: '',
      replace() {}
    },
    setTimeout,
    clearTimeout,
    dispatchEvent(event) { events.push(event); return true; },
    addEventListener() {},
    removeEventListener() {}
  };

  const context = vm.createContext({
    window: windowObject,
    localStorage: storage,
    sessionStorage,
    fetch: (...args) => fetchHandler(...args),
    Headers,
    Response,
    AbortController,
    TextDecoder,
    Uint8Array,
    CustomEvent: TestCustomEvent,
    atob: value => Buffer.from(value, 'base64').toString('binary'),
    console,
    setTimeout,
    clearTimeout,
    URLSearchParams,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Error,
    Promise,
    Map,
    Set
  });

  const compiled = ts.transpileModule(apiSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText;
  vm.runInContext(compiled, context, { filename: 'api-client.js' });

  const auth = windowObject.ZentridAuth;
  const api = windowObject.FleetAPI;
  expect(Boolean(auth && api), 'API client globals were not initialized.');
  if (!auth || !api) return;

  const future = Math.floor(Date.now() / 1000) + 3600;
  const firstToken = token({ sub: 'user-1', role: 'GlobalAdmin', exp: future });
  fetchHandler = async url => {
    if (String(url).endsWith('/api/Auth/login')) {
      return new Response(JSON.stringify({ accessToken: firstToken, refreshToken: 'refresh-1', role: 'GlobalAdmin' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(null, { status: 404 });
  };

  await auth.login('globaladmin', 'secret');
  expect(auth.isAuthenticated(), 'A valid non-expired token is not recognized as authenticated.');
  expect(sessionStorage.getItem('zentrid_access_token') === firstToken, 'Access token must be stored in tab-scoped sessionStorage.');
  expect(storage.getItem('zentrid_access_token') === null, 'Access token must not remain in persistent localStorage.');
  expect(auth.hasRole('GlobalAdmin'), 'GlobalAdmin role was not read from session claims.');
  expect(!auth.isTokenExpired(), 'Fresh token is incorrectly marked as expired.');

  const refreshedToken = token({ sub: 'user-1', role: 'GlobalAdmin', exp: future + 3600 });
  let deviceCalls = 0;
  let refreshCalls = 0;
  fetchHandler = async (url, init) => {
    const target = String(url);
    if (target.endsWith('/api/devices')) {
      deviceCalls += 1;
      if (deviceCalls === 1) return new Response(JSON.stringify({ message: 'expired' }), { status: 401 });
      const header = new Headers(init.headers).get('Authorization');
      expect(header === `Bearer ${refreshedToken}`, 'Retried request did not use refreshed access token.');
      return new Response(JSON.stringify({ items: [{ id: 'D-1' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (target.endsWith('/api/Auth/refresh')) {
      refreshCalls += 1;
      return new Response(JSON.stringify({ accessToken: refreshedToken }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(null, { status: 404 });
  };

  const devices = await api.request('/api/devices');
  expect(deviceCalls === 2, '401 request was not retried exactly once.');
  expect(refreshCalls === 1, 'Refresh endpoint was not called exactly once.');
  expect(Array.isArray(devices.items) && devices.items.length === 1, 'Retried request did not return parsed response.');

  fetchHandler = async (url, init) => new Promise((resolve, reject) => {
    const signal = init.signal;
    if (signal?.aborted) reject(new Error('aborted'));
    signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });

  try {
    await api.request('/api/slow', { auth: false, timeoutMs: 5 });
    failures.push('Timed-out request unexpectedly resolved.');
  } catch (error) {
    expect(error && error.code === 'TIMEOUT', 'Timed-out request did not expose TIMEOUT error code.');
  }

  sessionStorage.setItem('zentrid_access_token', token({ role: 'GlobalAdmin', exp: Math.floor(Date.now() / 1000) - 60 }));
  sessionStorage.removeItem('zentrid_token_expires_at');
  expect(auth.isTokenExpired(0), 'Expired JWT is not recognized as expired.');
  expect(!auth.isAuthenticated(), 'Expired JWT is incorrectly recognized as authenticated.');

  expect(events.some(event => event.type === 'zentrid:auth'), 'Auth lifecycle events were not dispatched.');
}

runBehaviorChecks().then(() => {
  if (failures.length) {
    console.error('Auth/API foundation checks failed.');
    failures.forEach(failure => console.error(`  ${failure}`));
    process.exit(1);
  }
  console.log('Auth/API foundation checks OK: credentials removed, role/expiry enforced, 401 refresh retry and timeout verified.');
}).catch(error => {
  console.error('Auth/API foundation checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
