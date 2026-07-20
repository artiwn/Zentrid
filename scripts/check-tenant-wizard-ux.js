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

const formUx = read('assets/js/form-ux.ts');
const tenants = read('assets/js/tenants.ts');
const tenantsHtml = read('pages/tenants.html');
const css = read('assets/css/src/05-platform-core-patches.css');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'ZentridFormUX', 'validate(root', 'setControlError', 'renderSummary', 'focusFirst',
  'snapshot(form', 'bindClearOnInput', 'setBusy'
].forEach(token => expect(formUx.includes(token), `Shared form UX token is missing: ${token}.`));

[
  'tenantValidationSummary', 'validateStep', 'validateBeforeStep', 'customStepIssues',
  'attemptCloseWizard', 'window.confirm', 'normalizeDuplicateValue',
  'Add at least one contact person', 'Primary contact', 'ZentridFormUX.setBusy',
  "tenantForm.onsubmit", "window.tenantWizardDocuments = []"
].forEach(token => expect(tenants.includes(token), `Tenant wizard UX token is missing: ${token}.`));

expect(tenantsHtml.includes('form-ux.js'), 'Tenant Registry does not load form-ux.js.');
expect(tenantsHtml.indexOf('layout.js') < tenantsHtml.indexOf('form-ux.js'), 'layout.js must load before form-ux.js.');
expect(tenantsHtml.indexOf('form-ux.js') < tenantsHtml.indexOf('tenants.js'), 'form-ux.js must load before tenants.js.');
expect(css.includes('.form-validation-summary'), 'Validation summary styles are missing.');
expect(css.includes('.setup-rail button.completed'), 'Completed wizard step styles are missing.');
expect(css.includes('.setup-rail button.has-error'), 'Invalid wizard step styles are missing.');
expect(packageJson.scripts?.['check:tenant-wizard-ux'] === 'node scripts/check-tenant-wizard-ux.js', 'Package script check:tenant-wizard-ux is missing.');
expect(String(packageJson.scripts?.verify || '').includes('check:tenant-wizard-ux'), 'verify does not run Tenant wizard UX checks.');
expect(String(packageJson.scripts?.['verify:vercel'] || '').includes('check:tenant-wizard-ux'), 'verify:vercel does not run Tenant wizard UX checks.');

if (failures.length) {
  console.error('Tenant wizard UX checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log('Tenant wizard UX checks OK: validation, step gating, duplicate prevention, discard confirmation and accessibility wiring verified.');
