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

const layout = read('assets/js/layout.ts');
const plants = read('assets/js/plants.ts');
const clientCss = read('assets/css/src/20-governance-and-client-flows.css');
const pkg = JSON.parse(read('package.json') || '{}');

[
  'captureOpenOverlays',
  'restoreOpenOverlays',
  "'.modal.open[id], .detail-drawer.open[id]'",
  'syncOverlayControlState',
  'replacement.replaceWith(restored)'
].forEach(token => expect(layout.includes(token), `Overlay remount stability token missing: ${token}`));

[
  'consumePlantCreateQuery',
  "modal.classList.contains('open')",
  "url.searchParams.delete('create')",
  'history.replaceState',
  "plantCreateModalElement?.classList.contains('open')",
  "plantCreateModalElement.removeAttribute('inert')",
  "groupCreateModalElement?.classList.contains('open')",
  "groupCreateModalElement.removeAttribute('inert')"
].forEach(token => expect(plants.includes(token), `Plant create one-shot/interactivity token missing: ${token}`));

expect(!plants.includes("document.getElementById('plantCreateModal')?.setAttribute('inert', '');"), 'Open Plant wizard must not be made inert unconditionally after a live remount.');
expect(!plants.includes("document.getElementById('groupCreateModal')?.setAttribute('inert','');"), 'Open Group modal must not be made inert unconditionally after a live remount.');

[
  '.client-user-editor-v118 input,',
  '.client-user-editor-v118 select {',
  'min-height: 42px',
  'background: rgba(8,18,34,.74)',
  '.client-user-editor-v118 input:focus'
].forEach(token => expect(clientCss.includes(token), `Client user editor control style missing: ${token}`));

expect(pkg.scripts?.['check:overlay-form-stability'] === 'node scripts/check-overlay-form-stability.js', 'Package script check:overlay-form-stability is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:overlay-form-stability'), 'verify does not run overlay/form stability checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:overlay-form-stability'), 'verify:vercel does not run overlay/form stability checks.');

if (failures.length) {
  console.error('Overlay/form stability checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Overlay/form stability checks OK: open modal/drawer state survives live remounts without becoming inert, query create is one-shot, and client user fields use Zentrid controls.');
