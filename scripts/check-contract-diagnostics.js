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
const liveBridge = read('assets/js/live-api-ui.ts');
const liveCss = read('assets/css/src/components/live-data-states.css');
const globals = read('types/zentrid-globals.d.ts');

[
  'ZentridContractIssue', 'ZentridContractValidation', 'ZentridContractDiagnosticSummary',
  'ZentridContractDiagnosticsApi'
].forEach(name => expect(globals.includes(`interface ${name}`), `Global diagnostic type is missing: ${name}.`));

[
  'MISSING_REQUIRED_FIELD', 'INVALID_FIELD_TYPE', 'INVALID_RECORD',
  'CONTRACT_DEFINITIONS', 'validateContract', 'diagnostics'
].forEach(token => expect(contractSource.includes(token), `Contract diagnostics token is missing: ${token}.`));

[
  'syncContractDiagnostics', 'contract-diagnostics', 'API contract mismatch',
  'contractDiagnosticsApi()?.clear()', 'const issues = diagnostics.list()'
].forEach(token => expect(liveBridge.includes(token), `Live contract diagnostic UI token is missing: ${token}.`));

[
  '.contract-diagnostics', '.contract-diagnostics.error', '.contract-diagnostics-details',
  '.contract-diagnostics-list'
].forEach(selector => expect(liveCss.includes(selector), `Contract diagnostics CSS selector is missing: ${selector}.`));

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
function integrationVendor(value) {
  const text = String(value || '').trim();
  if (/deye/i.test(text)) return 'DeyeCloud';
  if (/solax/i.test(text)) return 'SolaX';
  return text || 'Unknown';
}
function integrationSoftware(value) { return integrationVendor(value) === 'SolaX' ? 'SolaX Cloud' : integrationVendor(value); }
const context = { safeText, firstOf, displayName, formatDate, integrationVendor, integrationSoftware };

const sandbox = { window: {}, console, String, Number, Boolean, Array, Object, Math, Set };
vm.createContext(sandbox);
const compiled = ts.transpileModule(contractSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;
vm.runInContext(compiled, sandbox, { filename: 'api-contracts.js' });
const contracts = sandbox.window.ZentridAPIContracts;
expect(Boolean(contracts && contracts.diagnostics), 'ZentridAPIContracts diagnostics API did not initialize.');

if (contracts && contracts.diagnostics) {
  const validDevice = contracts.devices.validate({
    id: 'D-1', deviceName: 'Inverter A', provider: 'Huawei', sourcePlantId: 'P-1'
  }, 0);
  expect(validDevice.valid === true, 'Valid device payload was rejected.');
  expect(validDevice.issues.length === 0, 'Valid device payload produced diagnostics.');

  const invalidDevice = contracts.devices.validate({
    id: { nested: true }, provider: 'Huawei', sourcePlantId: 'P-1'
  }, 2);
  expect(invalidDevice.valid === false, 'Invalid device payload must fail required-field validation.');
  expect(invalidDevice.issues.some(issue => issue.code === 'INVALID_FIELD_TYPE' && issue.field === 'identity'), 'Invalid identity type was not diagnosed.');
  expect(invalidDevice.issues.some(issue => issue.code === 'MISSING_REQUIRED_FIELD' && issue.field === 'display name'), 'Missing device display name was not diagnosed.');

  const integrationValidation = contracts.integrations.validate({
    provider: 'DeyeCloud', integrationName: 'Main', status: 'Active', plantsCount: 'not-a-number'
  }, 0);
  expect(integrationValidation.valid === true, 'Optional numeric warning must not invalidate an integration record.');
  expect(integrationValidation.issues.some(issue => issue.severity === 'warning' && issue.field === 'plantsCount'), 'Invalid optional numeric field was not diagnosed.');

  contracts.diagnostics.clear();
  const mapped = contracts.devices.map({ id: { nested: true }, provider: 'Huawei' }, 4, context);
  expect(mapped.contractValid === false, 'Mapped invalid record is missing contractValid=false.');
  expect(Array.isArray(mapped.contractIssues) && mapped.contractIssues.length >= 2, 'Mapped invalid record is missing contractIssues.');
  expect(mapped.raw && mapped.raw.id && mapped.raw.id.nested === true, 'Raw invalid payload was not preserved.');

  const firstSummary = contracts.diagnostics.summary();
  expect(firstSummary.errors >= 1 && firstSummary.total >= 2, 'Diagnostic summary did not count mapped issues.');
  expect(firstSummary.affectedEntities.includes('devices'), 'Diagnostic summary did not include the device entity.');

  contracts.devices.map({ id: { nested: true }, provider: 'Huawei' }, 4, context);
  const dedupedSummary = contracts.diagnostics.summary();
  expect(dedupedSummary.total === firstSummary.total, 'Repeated mapping duplicated identical diagnostics.');

  contracts.diagnostics.clear('devices');
  expect(contracts.diagnostics.summary().total === 0, 'Entity-scoped diagnostic clear failed.');

  contracts.clients.map({ id: 'C-1' }, 0, context);
  contracts.tenants.map({ tenantName: 'Sunridge' }, 0, context);
  const mixedSummary = contracts.diagnostics.summary();
  expect(mixedSummary.affectedEntities.includes('clients') && mixedSummary.affectedEntities.includes('tenants'), 'Cross-entity diagnostic summary is incomplete.');
  expect(contracts.diagnostics.list('clients').every(issue => issue.entity === 'clients'), 'Entity-scoped diagnostic list leaked other entities.');
}

if (failures.length) {
  console.error('Contract diagnostic checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Contract diagnostic checks OK: validation, fallback metadata, deduplication, scoped clearing and UI hooks verified.');
