const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const { scenarios } = require('./browser-e2e-manifest');

const root = process.cwd();
const failures = [];
const ids = new Set();
const allowedActionTypes = new Set([
  'fill', 'click', 'wait-url', 'wait-selector', 'wait-selector-count',
  'assert-selector', 'assert-text', 'assert-no-text', 'assert-class',
  'assert-not-class', 'assert-storage', 'wait-query', 'wait-request',
  'assert-no-request', 'history-back', 'history-forward'
]);

if (!Array.isArray(scenarios) || scenarios.length < 6) {
  failures.push('Browser E2E manifest must contain at least six critical scenarios.');
}

for (const scenario of scenarios) {
  if (!scenario.id || ids.has(scenario.id)) failures.push(`Scenario id is missing or duplicated: ${scenario.id || '(empty)'}`);
  ids.add(scenario.id);
  if (!scenario.route || !scenario.route.startsWith('/')) failures.push(`${scenario.id}: route must be root-relative.`);
  if (!scenario.ready) failures.push(`${scenario.id}: ready selector is required.`);
  const pathname = String(scenario.route || '').split('?')[0];
  const sourcePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  if (!existsSync(join(root, sourcePath))) failures.push(`${scenario.id}: route source is missing: ${sourcePath}`);
  if (!Array.isArray(scenario.actions) || !scenario.actions.length) failures.push(`${scenario.id}: actions are required.`);
  for (const action of scenario.actions || []) {
    if (!allowedActionTypes.has(action.type)) failures.push(`${scenario.id}: unsupported action type ${action.type}.`);
    if (['fill', 'click', 'wait-selector', 'wait-selector-count', 'assert-selector', 'assert-text', 'assert-no-text', 'assert-class', 'assert-not-class'].includes(action.type) && !action.selector) {
      failures.push(`${scenario.id}: ${action.type} requires selector.`);
    }
  }
  for (const [file, needle] of scenario.sourceHints || []) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`${scenario.id}: source hint file is missing: ${file}`);
      continue;
    }
    const source = readFileSync(path, 'utf8');
    if (!source.includes(needle)) failures.push(`${scenario.id}: source hint not found in ${file}: ${needle}`);
  }
}


const { mockApi } = require('./browser-e2e');
const mockCases = [
  ['/api/Auth/login', 'POST', value => value.accessToken === 'zentrid-e2e-token'],
  ['/api/admin/clients?page=2&size=20', 'GET', value => Array.isArray(value.items) && value.page === 2 && value.totalCount > 20],
  ['/api/admin/plants?page=1&size=20', 'GET', value => Array.isArray(value.items) && value.items[0]?.plantCode],
  ['/api/plants?page=1&size=20', 'GET', value => Array.isArray(value.items) && value.items[0]?.sourcePlantId],
  ['/api/devices?page=1&size=20', 'GET', value => Array.isArray(value.items) && value.items[0]?.sourceDeviceId],
  ['/api/alerts?page=1&size=20', 'GET', value => Array.isArray(value.items) && value.items[0]?.sourceAlertId],
  ['/api/admin/provider-integrations?page=1&size=20', 'GET', value => Array.isArray(value.items) && value.items[0]?.integrationCode],
  ['/api/integrations?page=1&size=20', 'GET', value => Array.isArray(value.items) && value.items[0]?.plantsCount],
  ['/api/Providers', 'GET', value => Array.isArray(value) && value.includes('huawei')]
];
for (const [path, method, validate] of mockCases) {
  const payload = mockApi(`http://127.0.0.1:5177${path}`, method);
  if (!validate(payload)) failures.push(`Browser E2E mock contract is invalid: ${method} ${path}`);
}

const runner = join(root, 'scripts', 'browser-e2e.js');
if (!existsSync(runner)) failures.push('scripts/browser-e2e.js is missing.');
else {
  const source = readFileSync(runner, 'utf8');
  for (const required of ['Runtime.exceptionThrown', 'Runtime.consoleAPICalled', 'Network.loadingFailed', 'Fetch.requestPaused', 'history.back()', 'zentrid-e2e-token']) {
    if (!source.includes(required)) failures.push(`Browser E2E runner is missing required guard: ${required}`);
  }
}

if (failures.length) {
  console.error('Browser E2E smoke contract failed.');
  failures.forEach(failure => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`Browser E2E smoke contract OK: ${scenarios.length} critical scenario(s).`);
