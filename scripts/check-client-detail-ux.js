const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { const full = join(root, path); expect(existsSync(full), `Missing file: ${path}`); return existsSync(full) ? readFileSync(full, 'utf8') : ''; }
const clients = read('assets/js/client-hierarchy.ts');
const detailFoundation = read('assets/js/entity-detail-ux.ts');
const detailSource = clients + '\n' + detailFoundation;
const page = read('pages/client-detail.html');
const css = read('assets/css/src/20-governance-and-client-flows.css');
const pkg = JSON.parse(read('package.json') || '{}');
[
  'renderClientDetailControl', 'clientDetailBackendManaged', 'clientDetailCanEdit',
  'Live client · local override available',
  'Edit creates a browser-only override for this live record',
  'clientDetailConfirmDiscard', 'Discard unsaved changes and open another client section?',
  'clientDetailValidationIssues', 'Another client already uses this name',
  'Another client already uses this contact email', 'Portal user emails must be unique',
  'Bank account numbers must be unique', 'Select one primary bank account',
  'addClientDetailDocument', 'removeClientDetailDocument',
  'addClientDetailUser', 'removeClientDetailUser',
  'addClientDetailBank', 'removeClientDetailBank',
  'Client section saved locally', 'No backend request was sent',
  'clientDetailFreshness', 'Last backend sync',
  'role="status"', 'aria-live="polite"', 'aria-busy="false"',
  'beforeunload', 'documentRecords', 'portalUsers'
].forEach(token => expect(detailSource.includes(token), `Client Detail UX token is missing: ${token}`));
expect(!clients.includes("onclick=\"ZentridLayout.toast('Add portal user mock')\""), 'Client Detail must not use a fake Add User success action.');
expect(!clients.includes("onclick=\"ZentridLayout.toast('Commercial model edit mock')\""), 'Client Detail must not use a fake commercial edit success action.');
expect(clients.includes("clients[existingIndex] = { ...clients[existingIndex]!, ...client }"), 'Saved local overrides must replace built-in mock client records after reload.');
expect(page.includes('form-ux.js'), 'Client Detail page must load shared form UX.');
expect(page.includes('entity-detail-ux.js'), 'Detail page must load the shared Entity Detail UX foundation.');
expect(page.indexOf('form-ux.js') < page.indexOf('entity-detail-ux.js'), 'Entity Detail UX must load after form-ux.js.');
expect(page.indexOf('form-ux.js') < page.indexOf('client-hierarchy.js'), 'form-ux.js must load before client-hierarchy.js on Client Detail.');
[
  '.client-detail-control-v118', '.client-detail-feedback-v118', '.client-section-context-v118',
  '.client-edit-grid-v118', '.client-document-editor-v118', '.client-user-editor-v118', '.client-bank-editor-v118'
].forEach(token => expect(css.includes(token), `Client Detail style is missing: ${token}`));
expect(pkg.scripts?.['check:client-detail-ux'] === 'node scripts/check-client-detail-ux.js', 'Package script check:client-detail-ux is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:client-detail-ux'), 'verify does not run Client Detail UX checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:client-detail-ux'), 'verify:vercel does not run Client Detail UX checks.');
if (failures.length) {
  console.error('Client Detail UX checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Client Detail UX checks OK: source-aware editing, local persistence, duplicate prevention, documents, portal users, banking, unsaved-change protection, freshness and accessibility verified.');
