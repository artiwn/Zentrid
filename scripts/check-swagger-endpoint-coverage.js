const { readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { return readFileSync(join(root, path), 'utf8'); }

const manifest = JSON.parse(read('fixtures/swagger/platform-endpoints.json'));
const platformSource = read('assets/js/platform-api.ts');
const diagnosticsSource = read('assets/js/api-diagnostics.ts');
const packageJson = JSON.parse(read('package.json'));

expect(manifest.operationCount === 37, `Swagger manifest must contain 37 operations, received ${manifest.operationCount}.`);
expect(Array.isArray(manifest.operations) && manifest.operations.length === manifest.operationCount, 'Swagger operation manifest count is inconsistent.');

const storage = new Map();
const sandbox = {
  window: { dispatchEvent() {} },
  console, String, Number, Boolean, Array, Object, Math, Set, Map, Date, JSON,
  Headers, URLSearchParams, TextEncoder, Response, performance,
  CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
  sessionStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  },
  ZentridConfig: { apiBaseUrl: '', isLocalFrontend() { return true; } },
  ZentridAuth: {
    getAccessToken() { return 'audit-token'; },
    me() { return Promise.resolve({}); }, validate() { return Promise.resolve({}); }, refresh() { return Promise.resolve({}); },
    request() { return Promise.resolve({}); }, getSession() { return {}; }
  },
  ZentridAPI: { request() { return Promise.resolve({}); } },
  fetch: async () => new Response(JSON.stringify({
    data: {
      measurements: [
        { telemetryId: 'TM-A', metricName: 'Voltage', value: 380, unit: 'V' },
        { telemetryId: 'TM-B', metricName: 'Current', value: 15, unit: 'A' }
      ],
      pagination: { page: 2, pageSize: 2, totalCount: 8, totalPages: 4 }
    }
  }), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'audit-request' } })
};
vm.createContext(sandbox);
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None };
vm.runInContext(ts.transpileModule(diagnosticsSource, { compilerOptions }).outputText, sandbox, { filename: 'api-diagnostics.js' });
sandbox.ZentridAPIDiagnostics = sandbox.window.ZentridAPIDiagnostics;
vm.runInContext(ts.transpileModule(platformSource, { compilerOptions }).outputText, sandbox, { filename: 'platform-api.js' });
const api = sandbox.window.ZentridPlatformAPI;
expect(Boolean(api), 'ZentridPlatformAPI did not initialize.');

if (api) {
  const expected = new Map(manifest.operations.map(item => [`${item.method} ${item.path}`, item]));
  const actual = new Map(api.endpointCatalog.map(item => [`${String(item.method).toUpperCase()} ${item.path}`, item]));
  expect(actual.size === expected.size, `Endpoint catalog contains ${actual.size} operations; Swagger contains ${expected.size}.`);
  expected.forEach((item, key) => {
    const catalog = actual.get(key);
    expect(Boolean(catalog), `Swagger operation missing from endpoint catalog: ${key}.`);
    if (!catalog) return;
    expect(catalog.used === item.expectedUsed, `Incorrect runtime usage flag for ${key}: expected ${item.expectedUsed}, received ${catalog.used}.`);
    const concretePath = item.path.replaceAll('{id}', 'audit-id').replaceAll('{providerType}', 'DeyeCloud');
    expect(api.isAllowedPath(concretePath), `Allowed endpoint patterns reject Swagger operation: ${key}.`);
    expect(api.isAllowedPath(`${concretePath}?page=1&size=20`), `Allowed endpoint patterns reject query string for: ${key}.`);
  });
  actual.forEach((_item, key) => expect(expected.has(key), `Endpoint catalog contains operation outside active Swagger: ${key}.`));
  expect(!api.isAllowedPath('/api/not-in-swagger'), 'Unsupported endpoint passed the active Swagger allow-list.');
  expect(!api.isAllowedPath('/api/admin/clients/a/b'), 'Over-broad client endpoint allow-list accepted an invalid path.');

  Promise.resolve(api.rawRequest('/api/telemetry', { method: 'GET' })).then(result => {
    expect(result.ok === true, 'Nested telemetry diagnostic request did not succeed.');
    expect(result.count === 2, `Nested telemetry row count must be 2, received ${result.count}.`);
    expect(result.pagination?.page === 2 && result.pagination?.pageSize === 2, 'Nested telemetry page metadata was not detected.');
    expect(result.pagination?.totalCount === 8 && result.pagination?.totalPages === 4, 'Nested telemetry totals were not detected.');
    expect(result.requestId === 'audit-request', 'Diagnostic request ID was not preserved.');
    finish();
  }).catch(error => {
    failures.push(`Nested telemetry raw request test failed: ${error.message}`);
    finish();
  });
} else {
  finish();
}

function finish() {
  expect(packageJson.scripts?.['check:swagger-endpoint-coverage'] === 'node scripts/check-swagger-endpoint-coverage.js', 'Missing Swagger endpoint coverage package script.');
  if (failures.length) {
    console.error('Swagger endpoint coverage checks failed.');
    failures.forEach(message => console.error(`  ${message}`));
    process.exitCode = 1;
    return;
  }
  console.log('Swagger endpoint coverage OK: 37 operations, exact allow-list coverage, runtime usage flags and nested telemetry diagnostics verified.');
}
