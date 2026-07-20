const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => {
  const path = join(root, relative);
  expect(existsSync(path), `Missing file: ${relative}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const ux = read('assets/js/ux-consistency.ts');
const registry = read('assets/js/registry-query-state.ts');
const uxCss = read('assets/css/src/components/ux-consistency.css');
const resilienceCss = read('assets/css/src/components/content-resilience.css');
const apiCss = read('assets/css/src/80-auth-and-api-console.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json') || '{}');
const pkg = JSON.parse(read('package.json') || '{}');

[
  'function ensureStateCopy',
  "copy.className = 'fleet-ux-state-copy'",
  'Array.from(element.childNodes)',
  "element.dataset.fleetUxStateCopyWrapped = 'true'",
  'ensureStateCopy(element, icon)'
].forEach(token => expect(ux.includes(token), `State content wrapper token missing: ${token}`));

expect(registry.includes('<span>Rows</span><select'), 'Rows page-size label is not structurally separated from its select.');
expect(registry.includes('<span>Page</span><input'), 'Page jump label is not structurally separated from its input.');
expect(registry.includes('aria-label="Rows per page"'), 'Rows-per-page select is missing an accessible name.');

[
  '.fleet-ux-state-copy small',
  'align-self: center',
  'overflow-wrap: anywhere'
].forEach(token => expect(uxCss.includes(token), `State copy CSS token missing: ${token}`));

[
  '.panel-head > div',
  '.metric-grid > div',
  '.panel-head h1',
  '.fleet-ux-state-copy'
].forEach(token => expect(resilienceCss.includes(token), `Content resilience CSS token missing: ${token}`));

[
  'minmax(min(100%,360px),1fr)',
  'repeat(auto-fit,minmax(132px,1fr))',
  '.registry-pagination-actions label>span',
  'min-width:max-content',
  '.registry-pagination-actions select{width:72px;min-width:72px'
].forEach(token => expect(apiCss.includes(token), `Content-aware API/pagination CSS token missing: ${token}`));

expect(Array.isArray(manifest.sources) && manifest.sources.includes('components/content-resilience.css'), 'Content resilience stylesheet is missing from CSS manifest.');
expect(manifest.sources.indexOf('components/ux-consistency.css') < manifest.sources.indexOf('components/content-resilience.css'), 'Content resilience CSS must load after UX consistency CSS.');
expect(manifest.sources.indexOf('components/content-resilience.css') < manifest.sources.indexOf('80-auth-and-api-console.css'), 'API Console CSS must load after shared content resilience CSS.');

expect(pkg.scripts?.['check:layout-content-resilience'] === 'node scripts/check-layout-content-resilience.js', 'Package script check:layout-content-resilience is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:layout-content-resilience'), 'verify does not run layout content resilience checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:layout-content-resilience'), 'verify:vercel does not run layout content resilience checks.');

if (failures.length) {
  console.error('Layout content resilience checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Layout content resilience checks OK: state copy wrapping, content-aware metrics, stable pagination labels and shared overflow safeguards verified.');
