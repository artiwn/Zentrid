const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { const full = join(root, path); expect(existsSync(full), `Missing file: ${path}`); return existsSync(full) ? readFileSync(full, 'utf8') : ''; }
const foundation = read('assets/js/entity-detail-ux.ts');
const tenants = read('assets/js/tenants.ts');
const hierarchy = read('assets/js/client-hierarchy.ts');
const integrations = read('assets/js/integrations.ts');
const pkg = JSON.parse(read('package.json') || '{}');
[
  'const ZentridEntityDetailUX', 'backendManaged', 'freshness', 'modeCopy',
  'confirmDiscard', 'bindBeforeUnload', 'setFeedback', 'clearFeedback',
  'sectionMode', 'beforeUnloadGuards', "event.returnValue = ''"
].forEach(token => expect(foundation.includes(token), `Entity Detail UX foundation token is missing: ${token}`));
[
  [tenants, "ZentridEntityDetailUX.origin(record, 'tenant')", "ZentridEntityDetailUX.bindBeforeUnload('tenant-detail'"],
  [hierarchy, "ZentridEntityDetailUX.origin(record, 'client')", "ZentridEntityDetailUX.bindBeforeUnload('client-detail'"],
  [hierarchy, "ZentridEntityDetailUX.origin(record, 'plant')", "ZentridEntityDetailUX.bindBeforeUnload('plant-detail'"],
  [integrations, "ZentridEntityDetailUX.origin(record, 'integration')", "ZentridEntityDetailUX.bindBeforeUnload('integration-detail'"]
].forEach(([source, originToken, guardToken]) => {
  expect(source.includes(originToken), `Detail implementation does not delegate source handling: ${originToken}`);
  expect(source.includes(guardToken), `Detail implementation does not delegate unsaved-change protection: ${guardToken}`);
});
for (const pageName of ['tenant-detail.html','client-detail.html','plant-detail.html','integration-detail.html']) {
  const page = read(`pages/${pageName}`);
  expect(page.includes('entity-detail-ux.js'), `${pageName} does not load entity-detail-ux.js.`);
  expect(page.indexOf('form-ux.js') < page.indexOf('entity-detail-ux.js'), `${pageName} loads entity-detail-ux.js before form-ux.js.`);
  const featureScript = pageName === 'tenant-detail.html' ? 'tenants.js' : pageName === 'integration-detail.html' ? 'integrations.js' : 'client-hierarchy.js';
  expect(page.indexOf('entity-detail-ux.js') < page.indexOf(featureScript), `${pageName} must load entity-detail-ux.js before ${featureScript}.`);
}
expect(pkg.scripts?.['check:entity-detail-ux'] === 'node scripts/check-entity-detail-ux.js', 'Package script check:entity-detail-ux is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:entity-detail-ux'), 'verify does not run Entity Detail UX checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:entity-detail-ux'), 'verify:vercel does not run Entity Detail UX checks.');
if (failures.length) {
  console.error('Entity Detail UX foundation checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Entity Detail UX foundation checks OK: source policy, freshness, mode copy, feedback and unsaved-change guards are shared across Tenant, Client, Plant and Integration details.');
