const { existsSync, readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { const full = join(root, path); expect(existsSync(full), `Missing file: ${path}`); return existsSync(full) ? readFileSync(full, 'utf8') : ''; }

const permissions = read('assets/js/action-permissions.ts');
const tenants = read('assets/js/tenants.ts');
const lifecycle = read('assets/js/tenant-lifecycle.ts');
const hierarchy = read('assets/js/client-hierarchy.ts');
const plants = read('assets/js/plants.ts');
const integrations = read('assets/js/integrations.ts');
const css = read('assets/css/src/60-licensing-billing-payments-rbac.css');
const pkg = JSON.parse(read('package.json') || '{}');

[
  'const ZentridActionPermissions', 'currentProfile', 'ZentridAuth?.getRoles',
  "'platform-admin'", "'tenant-admin'", "'client-admin'", 'operator', 'finance', 'viewer', 'restricted', 'verifying',
  "action === 'edit' && backendManaged && context.updateAvailable === false",
  'context.localOverride === true', 'permissionLocalOverride',
  "status === 'archived' && mutableActions.has(action)",
  "resource === 'tenant'", "resource === 'integration'",
  "document.addEventListener('click'", 'event.stopImmediatePropagation()',
  'MutationObserver', "window.addEventListener('zentrid:auth'", 'data-permission-action',
  'Permissions are still being verified', 'does not allow', 'Object.assign(window, { ZentridActionPermissions })'
].forEach(token => expect(permissions.includes(token), `Permission foundation token is missing: ${token}`));

expect(!permissions.includes('localStorage.getItem(\'zentrid_role'), 'Permission profile must not come from a local role switcher.');
expect(!permissions.includes('sessionStorage.getItem(\'zentrid_role'), 'Permission profile must not come from session storage.');

[
  [tenants, 'data-permission-resource="tenant"', "ZentridActionPermissions.guard({ action:'create', resource:'tenant' })"],
  [lifecycle, 'data-permission-action="${action}"', "ZentridActionPermissions.guard({ action, resource:'tenant'"],
  [hierarchy, 'data-permission-resource="client"', "ZentridActionPermissions.guard({ action:'create', resource:'client' })"],
  [hierarchy, 'data-permission-resource="plant"', "ZentridActionPermissions.guard({ action:'edit', resource:'plant'"],
  [plants, 'data-permission-resource="plant"', "ZentridActionPermissions.guard({ action:'create', resource:'plant' })"],
  [integrations, 'data-permission-resource="integration"', "ZentridActionPermissions.guard({ action:'create', resource:'integration' })"]
].forEach(([source, attr, guard]) => {
  expect(source.includes(attr), `Action permission attributes are missing: ${attr}`);
  expect(source.includes(guard), `Handler-level permission guard is missing: ${guard}`);
});

for (const token of ['permission-profile-v121', 'permission-denied-v121', '[data-permission-state="denied"]']) {
  expect(css.includes(token), `Permission UX style is missing: ${token}`);
}

const sourcePages = [join(root, 'index.html'), ...readdirSync(join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => join(root, 'pages', name))];
let permissionPageCount = 0;
for (const pagePath of sourcePages) {
  const source = readFileSync(pagePath, 'utf8');
  if (!source.includes('layout.js')) continue;
  const name = pagePath.replace(`${root}/`, '');
  expect(source.includes('action-permissions.js'), `${name} does not load action-permissions.js.`);
  expect(source.indexOf('api-client.js') < source.indexOf('action-permissions.js'), `${name} loads permissions before auth.`);
  expect(source.indexOf('layout.js') < source.indexOf('action-permissions.js'), `${name} must load permissions after layout.js.`);
  permissionPageCount += 1;
}
expect(permissionPageCount >= 70, `Expected permissions on at least 70 source pages, found ${permissionPageCount}.`);

expect(pkg.scripts?.['check:action-permissions-ux'] === 'node scripts/check-action-permissions-ux.js', 'Package script check:action-permissions-ux is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:action-permissions-ux'), 'verify does not run action permission checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:action-permissions-ux'), 'verify:vercel does not run action permission checks.');

if (failures.length) {
  console.error('Role & Action Permissions UX checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`Role & Action Permissions UX checks OK: session-derived profiles, local override permissions, lifecycle constraints, handler guards and ${permissionPageCount} page integrations verified.`);
