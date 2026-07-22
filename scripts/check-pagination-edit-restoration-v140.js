const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => {
  const full = join(root, relative);
  expect(existsSync(full), `Missing file: ${relative}`);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
};

const registry = read('assets/js/registry-query-state.ts');
const css = read('assets/css/src/80-auth-and-api-console.css');
const permissions = read('assets/js/action-permissions.ts');
const hierarchy = read('assets/js/client-hierarchy.ts');
const tenants = read('assets/js/tenants.ts');
const integrations = read('assets/js/integrations.ts');
const pkg = JSON.parse(read('package.json') || '{}');

[
  'registry-page-size-group',
  'registry-pagination-nav-start',
  'registry-page-jump-group',
  'registry-pagination-nav-end'
].forEach(token => expect(registry.includes(token), `Pagination markup group is missing: ${token}`));
[
  '.registry-pagination-group',
  'isolation:isolate',
  'position:static!important',
  'min-width:40px',
  '.registry-page-size-group',
  'width:72px',
  'padding-inline-end:26px'
].forEach(token => expect(css.includes(token), `Pagination collision guard is missing: ${token}`));
expect(!registry.includes('<label class="registry-page-size"><span>Rows</span><select data-registry-page-size="${entity}" aria-label="Rows per page">${pageOptions}</select></label>\n        <button type="button" data-registry-page="first"'), 'First-page button must not be a direct sibling that can collide with the Rows select.');

[
  'localOverride?: boolean',
  'context.localOverride === true',
  'permissionLocalOverride',
  'permits a local browser override'
].forEach(token => expect(permissions.includes(token), `Local edit permission token is missing: ${token}`));

expect(hierarchy.includes('return !clientDetailIsArchived(record) && clientDetailEditableTab(tab);'), 'Client live records must permit local override editing on editable tabs.');
expect(hierarchy.includes('return !plantDetailArchived(record) && plantDetailEditableTab(tab);'), 'Plant live records must permit local override editing on editable tabs.');
expect(tenants.includes('return !tenantDetailIsArchived(record) && tenantDetailTabEditable(tab);'), 'Tenant live records must permit local override editing on editable tabs.');
expect(integrations.includes('return !integrationDetailIsArchived(record);'), 'Integration live records must permit local override editing.');

[
  [hierarchy, "resource:'client'", 'localOverride:true'],
  [hierarchy, "resource:'plant'", 'localOverride:true'],
  [tenants, "resource:'tenant'", 'localOverride:true'],
  [integrations, "resource:'integration'", 'localOverride:true']
].forEach(([source, resource, override]) => {
  expect(source.includes(resource) && source.includes(override), `Handler guard is missing local override support for ${resource}.`);
});


[
  [hierarchy, 'zentrid_client_detail_edit', 'identity'],
  [tenants, 'zentrid_tenant_detail_edit', 'general'],
  [read('assets/js/plants.ts'), 'zentrid_plant_detail_edit', 'overview'],
  [integrations, 'zentrid_integration_detail_edit', 'general']
].forEach(([source, key, tab]) => {
  expect(source.includes(key) && source.includes(tab), `Registry direct-edit handoff is missing for ${key}.`);
});
expect(hierarchy.includes("['overview','identity','location','portal','users','commercial']"), 'Client Overview must expose an Edit shortcut into Identity.');

const attrCount = [hierarchy, tenants, integrations].reduce((sum, source) => sum + (source.match(/data-permission-local-override="true"/g) || []).length, 0);
expect(attrCount >= 8, `Expected local override attributes on edit controls, found ${attrCount}.`);
expect(pkg.version === '1.40.0' && pkg.zentridRelease === 'v140', 'Package release metadata must be v140 / 1.40.0.');
expect(pkg.scripts?.['check:pagination-edit-restoration'] === 'node scripts/check-pagination-edit-restoration-v140.js', 'v140 regression command is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:pagination-edit-restoration'), 'verify must run the v140 regression check.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:pagination-edit-restoration'), 'verify:vercel must run the v140 regression check.');

if (failures.length) {
  console.error('Pagination and edit restoration v140 check failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`Pagination and edit restoration v140 OK: grouped controls prevent overlap and ${attrCount} edit controls support local overrides.`);
