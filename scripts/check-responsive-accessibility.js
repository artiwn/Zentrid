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

const runtime = read('assets/js/responsive-accessibility.ts');
const css = [
  read('assets/css/src/components/responsive-accessibility.css'),
  read('assets/css/src/components/modal-drawer-shells.css'),
  read('assets/css/src/components/action-layouts.css'),
  read('assets/css/src/components/form-primitives.css'),
  read('assets/css/src/components/card-surfaces.css')
].join('\n');
const manifest = JSON.parse(read('assets/css/src/manifest.json') || '{}');
const pkg = JSON.parse(read('package.json') || '{}');

[
  'const ZentridResponsiveAccessibility', 'ensureSkipLink', 'zentridMainContent',
  'enhanceTables', 'zentrid-responsive-table', 'cell.dataset.label',
  'enhanceInteractiveRows', 'enhanceTablists', 'ArrowRight', 'ArrowLeft',
  'enhanceMenus', 'aria-haspopup', 'aria-expanded', 'role',
  'enhanceSidebar', 'zentrid-sidebar-backdrop', 'closeSidebar',
  'enhanceDialogs', 'trapDialogFocus', 'aria-modal', 'closeActiveDialog',
  'enhanceForms', 'aria-required', 'aria-invalid', 'MutationObserver',
  'Object.assign(window, { ZentridResponsiveAccessibility })'
].forEach(token => expect(runtime.includes(token), `Responsive/accessibility runtime token is missing: ${token}`));

[
  '.zentrid-skip-link', ':focus-visible', '.zentrid-sidebar-backdrop',
  '.zentrid-responsive-table', 'content: attr(data-label)',
  '@media (max-width: 920px)', '@media (max-width: 768px)', '@media (max-width: 620px)',
  '100dvh', 'env(safe-area-inset-bottom)', 'min-height: 44px',
  '@media (pointer: coarse)', '@media (prefers-reduced-motion: reduce)',
  '.commercial-modal-backdrop', '.detail-tabs'
].forEach(token => expect(css.includes(token), `Responsive/accessibility style is missing: ${token}`));

expect(Array.isArray(manifest.sources) && manifest.sources.includes('components/responsive-accessibility.css'), 'Responsive/accessibility stylesheet is missing from CSS manifest.');
expect(manifest.sources.at(-1) === 'components/responsive-accessibility.css', 'Responsive/accessibility stylesheet must be the final CSS layer.');

const pages = [join(root, 'index.html'), ...readdirSync(join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => join(root, 'pages', name))];
let integrated = 0;
for (const pagePath of pages) {
  const source = readFileSync(pagePath, 'utf8');
  if (!source.includes('layout.js')) continue;
  const name = pagePath.replace(`${root}/`, '');
  expect(source.includes('responsive-accessibility.js'), `${name} does not load responsive-accessibility.js.`);
  expect(source.indexOf('ux-consistency.js') < source.indexOf('responsive-accessibility.js'), `${name} must load responsive-accessibility.js after ux-consistency.js.`);
  if (source.includes('action-permissions.js')) {
    expect(source.indexOf('responsive-accessibility.js') < source.indexOf('action-permissions.js'), `${name} must load responsive-accessibility.js before action-permissions.js.`);
  }
  integrated += 1;
}
expect(integrated >= 70, `Expected responsive/accessibility layer on at least 70 pages, found ${integrated}.`);

expect(pkg.scripts?.['check:responsive-accessibility'] === 'node scripts/check-responsive-accessibility.js', 'Package script check:responsive-accessibility is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:responsive-accessibility'), 'verify does not run responsive/accessibility checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:responsive-accessibility'), 'verify:vercel does not run responsive/accessibility checks.');

if (failures.length) {
  console.error('Responsive & Accessibility checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`Responsive & Accessibility checks OK: mobile tables, dialogs, navigation, keyboard controls and ${integrated} page integrations verified.`);
