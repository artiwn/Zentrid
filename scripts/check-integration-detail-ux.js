const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { const full = join(root, path); expect(existsSync(full), `Missing file: ${path}`); return existsSync(full) ? readFileSync(full, 'utf8') : ''; }
const integrations = read('assets/js/integrations.ts');
const detailFoundation = read('assets/js/entity-detail-ux.ts');
const liveBridge = read('assets/js/live-api-ui.ts');
const repositorySource = read('assets/js/api-repositories.ts');
const platformSource = read('assets/js/platform-api.ts');
const detailSource = integrations + '\n' + detailFoundation;
const page = read('pages/integration-detail.html');
const css = read('assets/css/src/05-platform-core-patches.css');
const pkg = JSON.parse(read('package.json') || '{}');
[
  'renderIntegrationDetailControls', 'integrationDetailBackendManaged', 'integrationDetailCanEdit',
  'Live connector configuration can be edited as a browser-only override',
  'Archived connector configuration is read-only',
  'runIntegrationDetailAction', 'executeBackendIntegrationDetailAction',
  'ZentridAPIMutations.integrations.activate', 'ZentridAPIMutations.integrations.suspend',
  'ZentridAPIMutations.integrations.archive', 'ZentridAPIMutations.integrations.testConnection',
  'ZentridAPIRepositories.integrations.get(id, { forceRefresh: true })',
  'Discard unsaved changes and open another connector section?',
  'A connector named', 'Base URL must use HTTP or HTTPS',
  'data-credential-sensitive', "x.credentials[label] = input.dataset.credentialSensitive === 'true' ? 'Configured' : value",
  'This prototype operation was stored only in the current browser. No backend request was sent.',
  'role="status"', 'aria-live="polite"', 'aria-busy="false"'
].forEach(token => expect(detailSource.includes(token), `Integration Detail UX token is missing: ${token}`));
expect(!integrations.includes("['Integration Status', x.status || status, 'status']"), 'Lifecycle status must not be editable as a regular form field.');
expect(!integrations.includes("x.credentials[key.replace('credentials::','')] = value"), 'Integration Detail must not store raw secret values using the legacy edit path.');
expect(liveBridge.includes("ZentridAPIRepositories.integrations.get(selectedId"), 'Integration Detail must load the selected registry record through the direct repository get().');
expect(liveBridge.includes("const detailSource = selectedId") && liveBridge.includes("Fallback list lookup"), 'Integration Detail direct source and bounded fallback state are missing.');
expect(liveBridge.includes("sessionStorage.getItem('zentrid_integration_create_fallback')"), 'Integration Detail must resolve the session-only create fallback before sending a backend detail request.');
expect(liveBridge.includes('Credential values were not stored.'), 'Integration Detail fallback must state that credential values were not persisted.');
expect(repositorySource.includes('ZentridPlatformAPI.providerIntegrations.get(id, requestOptions)'), 'Integration repository does not call the direct provider integration endpoint.');
expect(platformSource.includes("used: true, notes: 'Used by Integration Detail. Requires provider integration id.'"), 'Provider integration detail endpoint is not marked as used in the API catalog.');
expect(page.includes('form-ux.js'), 'Integration Detail page must load shared form UX.');
expect(page.includes('entity-detail-ux.js'), 'Detail page must load the shared Entity Detail UX foundation.');
expect(page.indexOf('form-ux.js') < page.indexOf('entity-detail-ux.js'), 'Entity Detail UX must load after form-ux.js.');
expect(page.indexOf('form-ux.js') < page.indexOf('integrations.js'), 'form-ux.js must load before integrations.js on Integration Detail.');
expect(css.includes('.integration-detail-control-v116'), 'Integration Detail control styles are missing.');
expect(css.includes('.integration-detail-feedback-v116'), 'Integration Detail feedback styles are missing.');
expect(pkg.scripts?.['check:integration-detail-ux'] === 'node scripts/check-integration-detail-ux.js', 'Package script check:integration-detail-ux is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:integration-detail-ux'), 'verify does not run Integration Detail UX checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:integration-detail-ux'), 'verify:vercel does not run Integration Detail UX checks.');
if (failures.length) { console.error('Integration Detail UX checks failed.'); failures.forEach(message => console.error(`  ${message}`)); process.exit(1); }
console.log('Integration Detail UX checks OK: source-aware editing, lifecycle commands, validation, secret safety, confirmations, retry feedback and accessibility verified.');
