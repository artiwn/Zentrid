const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) {
  const absolute = join(root, path);
  expect(existsSync(absolute), `Missing file: ${path}`);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
}
function json(path) {
  try { return JSON.parse(read(path)); } catch (error) { failures.push(`Invalid JSON fixture ${path}: ${error.message}`); return {}; }
}

const diagnosticSource = read('assets/js/api-diagnostics.ts');
const platformSource = read('assets/js/platform-api.ts');
const consoleSource = read('assets/js/api-console.ts');
const page = read('pages/api-console.html');
const css = read('assets/css/src/80-auth-and-api-console.css');
const globals = read('types/zentrid-globals.d.ts');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'captureRun', 'safeSnapshot', 'diagnosticsText', 'response shape changed', 'sessionStorage',
  'responseBytes', 'requestId', 'contractCatalog', '[redacted]'
].forEach(token => expect(diagnosticSource.includes(token), `Missing API diagnostics token: ${token}.`));
[
  'response.headers.get', 'x-request-id', 'responseBytes', 'contentType', 'pagination: responsePagination'
].forEach(token => expect(platformSource.includes(token), `Missing raw request diagnostic metadata token: ${token}.`));
[
  'Copy response', 'Copy diagnostics', 'Copy safe snapshot', 'Compared with previous run',
  'Contract Snapshot Coverage', 'api-diagnostic-metrics'
].forEach(token => expect(consoleSource.includes(token), `Missing API Console diagnostic UI token: ${token}.`));
[
  '.api-comparison', '.api-diagnostic-metrics', '.api-contract-snapshot-table', '.api-card-actions'
].forEach(token => expect(css.includes(token), `Missing API diagnostic CSS selector: ${token}.`));
expect(page.indexOf('api-diagnostics.js') < page.indexOf('platform-api.js'), 'api-diagnostics.js must load before platform-api.js.');
expect(page.indexOf('api-contracts.js') < page.indexOf('api-console.js'), 'api-contracts.js must load before api-console.js.');
expect(globals.includes('interface ZentridApiDiagnosticsApi'), 'Missing ZentridApiDiagnosticsApi global type.');
expect(packageJson.scripts?.['check:api-diagnostics-contract-snapshots'] === 'node scripts/check-api-diagnostics-contract-snapshots.js', 'Missing package check script.');
expect(consoleSource.includes("return 'telemetry';"), 'API Console field audit does not classify /api/telemetry responses.');
['telemetry', 'measurements', 'points', 'samples'].forEach(token => expect(consoleSource.includes(`'${token}'`), `API Console collection extraction is missing telemetry envelope: ${token}.`));

const fixturePaths = {
  clients: 'assets/fixtures/api-contracts/clients-list.json',
  tenants: 'assets/fixtures/api-contracts/tenants-list.json',
  plants: 'assets/fixtures/api-contracts/plants-list.json',
  devices: 'assets/fixtures/api-contracts/devices-list.json',
  alerts: 'assets/fixtures/api-contracts/alerts-list.json',
  telemetry: 'assets/fixtures/api-contracts/telemetry-list.json',
  integrations: 'assets/fixtures/api-contracts/integrations-list.json'
};
const fixtures = Object.fromEntries(Object.entries(fixturePaths).map(([entity, path]) => [entity, json(path)]));
Object.entries(fixtures).forEach(([entity, fixture]) => {
  expect(Array.isArray(fixture.items) && fixture.items.length === 1, `${entity} snapshot must contain exactly one sanitized item.`);
  expect(fixture.page === 1 && fixture.totalPages === 1, `${entity} snapshot pagination metadata is invalid.`);
  const text = JSON.stringify(fixture);
  expect(!/(accessToken|refreshToken|password|apiKey|clientSecret)/i.test(text), `${entity} snapshot contains a sensitive key.`);
});

const storage = new Map();
const sandbox = {
  window: {}, console, String, Number, Boolean, Array, Object, Math, Set, Map, Date, JSON,
  TextEncoder, sessionStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  }
};
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(diagnosticSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText, sandbox, { filename: 'api-diagnostics.js' });
const diagnostics = sandbox.window.ZentridAPIDiagnostics;
expect(Boolean(diagnostics), 'ZentridAPIDiagnostics did not initialize.');
if (diagnostics) {
  const nestedPagination = diagnostics.pagination({ data: { pagination: { page: 3, pageSize: 25, totalCount: 70, totalPages: 3 } } });
  expect(nestedPagination.page === 3 && nestedPagination.pageSize === 25, 'Nested pagination page metadata is incorrect.');
  expect(nestedPagination.totalCount === 70 && nestedPagination.totalPages === 3, 'Nested pagination totals are incorrect.');
  const base = { ok: true, status: 200, statusText: 'OK', ms: 100, path: '/api/devices', method: 'GET', source: 'test', count: 1, data: fixtures.devices, bodyText: JSON.stringify(fixtures.devices), error: '', responseBytes: 900, contentType: 'application/json', requestId: 'req-1', pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 } };
  const first = diagnostics.captureRun([base]);
  expect(first['GET /api/devices']?.available === false, 'First diagnostic run should not have a previous comparison.');
  const second = diagnostics.captureRun([{ ...base, ms: 500, responseBytes: 1000 }]);
  expect(second['GET /api/devices']?.available === true, 'Second diagnostic run did not compare with previous result.');
  expect(second['GET /api/devices']?.durationDeltaMs === 400, 'Duration delta is incorrect.');
  const third = diagnostics.captureRun([{ ...base, data: { ...fixtures.devices, newBackendEnvelope: true } }]);
  expect(third['GET /api/devices']?.shapeChanged === true, 'Response shape change was not detected.');
  const safe = diagnostics.safeSnapshot({ ...base, data: { accessToken: 'secret', nested: { password: 'hidden', value: 1 } } });
  expect(safe.response.body.accessToken === '[redacted]', 'Top-level sensitive value was not redacted.');
  expect(safe.response.body.nested.password === '[redacted]', 'Nested sensitive value was not redacted.');
  expect(diagnostics.contractCatalog.length === 7, 'Contract snapshot catalog must contain seven entities.');
}

const contractSource = read('assets/js/api-contracts.ts');
const contractSandbox = { window: {}, console, String, Number, Boolean, Array, Object, Math, Set, Map, Date };
vm.createContext(contractSandbox);
vm.runInContext(ts.transpileModule(contractSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText, contractSandbox, { filename: 'api-contracts.js' });
const contracts = contractSandbox.window.ZentridAPIContracts;
const firstOf = (row, keys, fallback = '') => {
  for (const key of keys) {
    let value = row;
    for (const part of String(key).split('.')) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) { value = undefined; break; }
      value = value[part];
    }
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};
const context = {
  safeText(value, fallback = '—') { return value === undefined || value === null || value === '' ? String(fallback) : String(value); },
  firstOf,
  displayName(row, keys, entityLabel, index, typeHint) { return String(firstOf(row, keys, `${typeHint || entityLabel} ${index + 1}`)); },
  formatDate(value, fallback = 'No data') { return value ? String(value) : fallback; },
  integrationVendor(value) { return String(value || 'Unknown'); },
  integrationSoftware(value) { return String(value || 'Unknown'); }
};
if (contracts?.fieldAudit) {
  contracts.fieldAudit.clear();
  Object.entries(fixtures).forEach(([entity, fixture]) => contracts[entity].map(fixture.items[0], 0, context));
  const summary = contracts.fieldAudit.summary();
  expect(summary.records === 7, `Expected seven contract snapshot records, received ${summary.records}.`);
  expect(summary.missingExpectedFields === 0, `Contract snapshots have ${summary.missingExpectedFields} missing expected field(s).`);
  expect(summary.unmappedFields === 0, `Contract snapshots have ${summary.unmappedFields} unmapped field(s).`);
} else {
  failures.push('ZentridAPIContracts.fieldAudit did not initialize for snapshot validation.');
}

if (failures.length) {
  console.error('API diagnostics and contract snapshot checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('API diagnostics and contract snapshots OK: metadata, nested pagination, previous-run comparison, secret redaction, seven sanitized fixtures and contract mappings verified.');
