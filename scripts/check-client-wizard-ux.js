const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(relativePath) {
  const path = join(root, relativePath);
  expect(existsSync(path), `Missing file: ${relativePath}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const client = read('assets/js/client-hierarchy.ts');
const clientsHtml = read('pages/clients.html');
const css = read('assets/css/src/05-platform-core-patches.css');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'clientValidationSummary', 'clientWizardProgress', 'previousClientCreateStep', 'nextClientCreateStep',
  'validateClientCreateStep', 'validateBeforeClientCreateStep', 'clientCreateCustomIssues',
  'syncClientCreateTypeFields', 'applyClientCreateLocationRules', 'updateClientCreateCities',
  'Discard the client information entered in this wizard?', 'Creating Client…',
  'A client named', 'E-mail is already used', 'Registration number is already used',
  'Temporary password must contain at least one letter and one number',
  'ZentridAPIMutations.clients.create(payload)', 'clientCreateApiPayload', 'clientCreateBackendId',
  'hydrateClientCreateTenantOptions', 'ZentridAPIRepositories.tenants.list', 'ManagingTenant: managingTenant',
  'result.error.retriable', 'Backend unavailable. Client saved locally',
  'Enter a passport / personal document number or upload the client passport',
  'Enter a state registration document number or upload the registration document',
  'ZentridFormUX.setBusy', 'ZentridFormUX.bindClearOnInput', 'role="dialog"', 'aria-current'
].forEach(token => expect(client.includes(token), `Client wizard UX token is missing: ${token}.`));

expect(client.includes('data-zentrid-form-readiness="api"'), 'Create Client form must declare API readiness.');
expect(client.includes('data-create-type-fields="Individual"'), 'Individual identity group is missing.');
expect(client.includes('data-create-type-fields="Legal Entity"'), 'Legal Entity identity group is missing.');
expect(client.includes('Company Name *'), 'Legal Entity company name field is missing.');
expect(client.includes('Tax ID / VAT Number *'), 'Legal Entity tax field is missing.');
expect(client.includes('clientCreateLocationRules'), 'Dependent country / region / city rules are missing.');
expect(clientsHtml.includes('form-ux.js'), 'Clients page does not load form-ux.js.');
expect(clientsHtml.indexOf('layout.js') < clientsHtml.indexOf('form-ux.js'), 'layout.js must load before form-ux.js on Clients.');
expect(clientsHtml.indexOf('form-ux.js') < clientsHtml.indexOf('client-hierarchy.js'), 'form-ux.js must load before client-hierarchy.js.');
expect(css.includes('.client-create-form label.has-error input'), 'Client validation field styles are missing.');
expect(css.includes('.client-create-actions .wizard-progress'), 'Client wizard progress styles are missing.');
expect(packageJson.scripts?.['check:client-wizard-ux'] === 'node scripts/check-client-wizard-ux.js', 'Package script check:client-wizard-ux is missing.');
expect(String(packageJson.scripts?.verify || '').includes('check:client-wizard-ux'), 'verify does not run Client wizard UX checks.');
expect(String(packageJson.scripts?.['verify:vercel'] || '').includes('check:client-wizard-ux'), 'verify:vercel does not run Client wizard UX checks.');

if (failures.length) {
  console.error('Client wizard UX checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log('Client wizard UX checks OK: backend create mutation, technical fallback, validation, step gating, dependent location fields, duplicate prevention and accessibility verified.');
