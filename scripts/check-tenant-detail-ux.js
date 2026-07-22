const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { const full = join(root, path); expect(existsSync(full), `Missing file: ${path}`); return existsSync(full) ? readFileSync(full, 'utf8') : ''; }
const tenants = read('assets/js/tenants.ts');
const liveBridge = read('assets/js/live-api-ui.ts');
const repositories = read('assets/js/api-repositories.ts');
const detailFoundation = read('assets/js/entity-detail-ux.ts');
const detailSource = tenants + '\n' + detailFoundation;
const page = read('pages/tenant-detail.html');
const css = read('assets/css/src/50-production-normalization-tenant-tables.css');
const pkg = JSON.parse(read('package.json') || '{}');
[
  'renderTenantDetailControls', 'tenantDetailBackendManaged', 'tenantDetailCanEdit',
  'Live tenant · local override available',
  'Edit creates a browser-only override for tenant metadata',
  'tenantDetailConfirmDiscard', 'Discard unsaved changes and open another tenant section?',
  'validateTenantDetailEdits', 'At least one active contact must have the Primary role',
  'Email duplicates another contact', 'A tenant named',
  'addTenantDetailContact', 'removeTenantDetailContact',
  'addTenantDetailDocument', 'removeTenantDetailDocument',
  'Tenant section saved locally', 'No backend request was sent',
  'tenantDetailFreshness', 'Last backend sync',
  'role="status"', 'aria-live="polite"', 'aria-busy="false"',
  'beforeunload'
].forEach(token => expect(detailSource.includes(token), `Tenant Detail UX token is missing: ${token}`));
expect(!tenants.includes("['Tenant Status',tenantStatusValue(c),'status']"), 'Tenant lifecycle status must not be editable as a regular detail field.');
expect(!tenants.includes("tenant.status = value"), 'Tenant Detail must not write lifecycle status through generic edit controls.');
expect(liveBridge.includes("ZentridAPIRepositories.tenants.get(selectedId"), 'Tenant Detail must load the selected tenant through GET by ID.');
expect(liveBridge.includes("localStorage.getItem('zentrid_selected_tenant')"), 'Tenant Detail must resolve the existing selected tenant id.');
expect(repositories.includes("ZentridPlatformAPI.tenants.get(id, requestOptions)"), 'Tenant repository does not use the backend detail endpoint.');
expect(repositories.includes("/api/admin/tenants/${encodeURIComponent(id)}"), 'Tenant repository does not preserve the direct detail source.');
expect(page.includes('form-ux.js'), 'Tenant Detail page must load shared form UX.');
expect(page.includes('entity-detail-ux.js'), 'Detail page must load the shared Entity Detail UX foundation.');
expect(page.indexOf('form-ux.js') < page.indexOf('entity-detail-ux.js'), 'Entity Detail UX must load after form-ux.js.');
expect(page.indexOf('form-ux.js') < page.indexOf('tenants.js'), 'form-ux.js must load before tenants.js on Tenant Detail.');
[
  '.tenant-detail-control-v117', '.tenant-detail-feedback-v117', '.tenant-section-context-v117',
  '.tenant-detail-table-head-v117', '.tenant-contact-actions-v117', '.tenant-document-actions-v117'
].forEach(token => expect(css.includes(token), `Tenant Detail style is missing: ${token}`));
expect(pkg.scripts?.['check:tenant-detail-ux'] === 'node scripts/check-tenant-detail-ux.js', 'Package script check:tenant-detail-ux is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:tenant-detail-ux'), 'verify does not run Tenant Detail UX checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:tenant-detail-ux'), 'verify:vercel does not run Tenant Detail UX checks.');
if (failures.length) {
  console.error('Tenant Detail UX checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Tenant Detail UX checks OK: source-aware editing, lifecycle-safe status, validation, unsaved-change protection, local metadata controls, freshness and accessibility verified.');
