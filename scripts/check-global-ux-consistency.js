const { existsSync, readFileSync, readdirSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) {
  const full = join(root, path);
  expect(existsSync(full), `Missing file: ${path}`);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

const foundation = read('assets/js/ux-consistency.ts');
const layout = read('assets/js/layout.ts');
const lifecycle = read('assets/js/tenant-lifecycle.ts');
const integrations = read('assets/js/integrations.ts');
const css = read('assets/css/src/components/ux-consistency.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json') || '{}');
const pkg = JSON.parse(read('package.json') || '{}');

[
  'const FleetUX', 'statusDefinitions', 'statusTone', 'statusLabel', 'applyStatuses',
  'enhanceStates', 'stateMarkup', 'renderState', 'inferTone', 'confirmAction',
  'role="alertdialog"', 'aria-modal="true"', 'trapConfirmFocus', 'MutationObserver',
  'Object.assign(window, { FleetUX })'
].forEach(token => expect(foundation.includes(token), `Global UX foundation token is missing: ${token}`));

for (const status of ['Active', 'Inactive', 'Suspended', 'Archived', 'Normal', 'Warning', 'Fault', 'Offline', 'In Progress', 'Completed', 'Failed']) {
  expect(foundation.includes(`label: '${status}'`), `Canonical status is missing: ${status}`);
}

[
  'toast(message: string, requestedTone?: FleetUXTone)', 'FleetUX.inferTone(message)',
  "t.setAttribute('role', tone === 'danger' ? 'alert' : 'status')", 'toast-close',
  "tone === 'danger' ? 5200 : 3200"
].forEach(token => expect(layout.includes(token), `Semantic toast token is missing: ${token}`));

expect(lifecycle.includes('await FleetUX.confirmAction'), 'Tenant lifecycle does not use the shared confirmation dialog.');
expect(integrations.includes('async function confirmIntegrationDetailAction'), 'Integration lifecycle confirmation is not asynchronous.');
expect(integrations.includes('return FleetUX.confirmAction'), 'Integration lifecycle does not use the shared confirmation dialog.');
expect(integrations.includes('await confirmIntegrationDetailAction(record, action)'), 'Integration action handler does not await confirmation.');

for (const token of ['.fleet-ux-state', '.fleet-ux-confirm-overlay', '.toast.success', '.toast.warning', '.toast.danger', '[data-fleet-status]']) {
  expect(css.includes(token), `Global UX style is missing: ${token}`);
}
expect(Array.isArray(manifest.sources) && manifest.sources.includes('components/ux-consistency.css'), 'Global UX stylesheet is missing from the CSS manifest.');

const pages = [join(root, 'index.html'), ...readdirSync(join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => join(root, 'pages', name))];
let integrated = 0;
for (const pagePath of pages) {
  const source = readFileSync(pagePath, 'utf8');
  if (!source.includes('layout.js')) continue;
  const name = pagePath.replace(`${root}/`, '');
  expect(source.includes('ux-consistency.js'), `${name} does not load ux-consistency.js.`);
  expect(source.indexOf('layout.js') < source.indexOf('ux-consistency.js'), `${name} must load ux-consistency.js after layout.js.`);
  if (source.includes('action-permissions.js')) {
    expect(source.indexOf('ux-consistency.js') < source.indexOf('action-permissions.js'), `${name} must load ux-consistency.js before action-permissions.js.`);
  }
  integrated += 1;
}
expect(integrated >= 70, `Expected Global UX consistency on at least 70 pages, found ${integrated}.`);

expect(pkg.scripts?.['check:global-ux-consistency'] === 'node scripts/check-global-ux-consistency.js', 'Package script check:global-ux-consistency is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:global-ux-consistency'), 'verify does not run Global UX consistency checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:global-ux-consistency'), 'verify:vercel does not run Global UX consistency checks.');

if (failures.length) {
  console.error('Global UX Consistency checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`Global UX Consistency checks OK: canonical statuses, semantic toast, shared states, accessible confirmations and ${integrated} page integrations verified.`);
