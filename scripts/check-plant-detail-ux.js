const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { const full = join(root, path); expect(existsSync(full), `Missing file: ${path}`); return existsSync(full) ? readFileSync(full, 'utf8') : ''; }
const hierarchy = read('assets/js/client-hierarchy.ts');
const detailFoundation = read('assets/js/entity-detail-ux.ts');
const detailSource = hierarchy + '\n' + detailFoundation;
const live = read('assets/js/live-api-ui.ts');
const plantsPage = read('assets/js/plants.ts');
const repositories = read('assets/js/api-repositories.ts');
const platform = read('assets/js/platform-api.ts');
const data = read('assets/js/data.ts');
const page = read('pages/plant-detail.html');
const css = read('assets/css/src/20-governance-and-client-flows.css');
const pkg = JSON.parse(read('package.json') || '{}');
[
  'renderPlantDetailControl', 'plantDetailBackendManaged', 'plantDetailCanEdit',
  'Live plant · local override available',
  'Edit creates a browser-only override for configuration fields',
  'plantDetailConfirmDiscard', 'Discard unsaved changes and open another plant section?',
  'plantDetailValidationIssues', 'Installed AC capacity cannot exceed installed DC capacity',
  'Grid connection capacity cannot exceed installed AC capacity',
  'Another plant already uses the name', 'External Plant ID',
  'plantDetailSourceChanged', 'Source System, Integration or External Plant ID changed',
  'plantDetailAssignmentChanged', 'Client or Managing Tenant assignment changed',
  'Plant section saved locally', 'No backend request was sent',
  'plantDetailFreshness', 'Last backend sync', 'plantTelemetryState',
  'No telemetry available', 'No device records',
  'role="status"', 'aria-live="polite"', 'aria-busy="false"', 'beforeunload'
].forEach(token => expect(detailSource.includes(token), `Plant Detail UX token is missing: ${token}`));
expect(!hierarchy.includes('<span>Last Data</span><strong>2 min ago</strong>'), 'Plant Detail must not show fixed 2 min freshness.');
expect(!hierarchy.includes('<span>Last Sync</span><strong>2 min ago</strong>'), 'Plant Detail source tab must not show fixed sync time.');
expect(hierarchy.includes('Lifecycle Status') && hierarchy.includes('Status is not editable through the generic form'), 'Plant lifecycle status must remain read-only.');
expect(page.includes('form-ux.js'), 'Plant Detail page must load shared form UX.');
expect(page.includes('entity-detail-ux.js'), 'Detail page must load the shared Entity Detail UX foundation.');
expect(page.indexOf('form-ux.js') < page.indexOf('entity-detail-ux.js'), 'Entity Detail UX must load after form-ux.js.');
expect(page.indexOf('form-ux.js') < page.indexOf('client-hierarchy.js'), 'form-ux.js must load before client-hierarchy.js on Plant Detail.');
expect(live.includes("dataOrigin: 'live'") && live.includes('lastSyncAt: plant.lastSyncAt'), 'Live Plant Detail records must preserve origin and freshness.');
expect(live.includes('ZentridAPIRepositories.plants.get(selectedAdminId'), 'Plant Detail must call GET by ID only with a confirmed administrative plant ID.');
expect(live.includes('selectedPlantAdministrativeId') && live.includes('zentrid_selected_plant_context'), 'Plant Detail must keep live and administrative plant identities paired.');
expect(live.includes("sessionStorage.getItem('zentrid_plant_create_fallback')") && live.includes('No backend detail request was sent for the temporary local identifier.'), 'Plant Detail must open a temporary create fallback without sending its local ID to the backend.');
expect(live.includes("localStorage.setItem('zentrid_selected_plant', renderedId)"), 'Plant Detail must retain the rendered plant identity without replacing it with an incompatible admin ID.');
expect(plantsPage.includes('function rememberPlantSelection') && plantsPage.includes('plantAdministrativeId') && plantsPage.includes('zentrid_selected_plant_context'), 'Plant Registry must store a paired live/admin identity before opening Plant Detail.');
expect(repositories.includes('ZentridPlatformAPI.plantRegistry.get(id, requestOptions)'), 'Plant repository does not use the backend administrative detail endpoint.');
expect(repositories.includes("'/api/plants'") && repositories.includes('mergePlantSources(liveRecord ? [liveRecord] : [], [adminRecord])'), 'Plant Detail must preserve live operational enrichment after the direct administrative read.');
expect(platform.includes("path: '/api/admin/plants/{id}'") && platform.includes("used: true") && platform.includes('Used by Plant Detail'), 'API Console must mark the Plant Detail endpoint as used.');
expect(platform.includes("label: 'Create Admin Plant'") && platform.includes("path: '/api/admin/plants'") && platform.includes("used: true") && platform.includes('Used by the existing Create Plant wizard'), 'API Console must mark the Create Plant endpoint as used.');
expect(data.includes("dataOrigin: p.dataOrigin || 'local'") && data.includes('sourceSystem: p.sourceSystem'), 'Local plant normalization must preserve source-aware metadata.');
expect(hierarchy.includes('ZentridClientModel.plants[existingIndex] = { ...ZentridClientModel.plants[existingIndex]!, ...p }'), 'Saved local plant overrides must replace built-in records after reload.');
[
  '.plant-detail-control-v119', '.plant-detail-feedback-v119', '.plant-section-context-v119',
  '.plant-edit-grid-v119', '.plant-readonly-status-v119', '.plant-data-state-v119'
].forEach(token => expect(css.includes(token), `Plant Detail style is missing: ${token}`));
expect(pkg.scripts?.['check:plant-detail-ux'] === 'node scripts/check-plant-detail-ux.js', 'Package script check:plant-detail-ux is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:plant-detail-ux'), 'verify does not run Plant Detail UX checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:plant-detail-ux'), 'verify:vercel does not run Plant Detail UX checks.');
if (failures.length) {
  console.error('Plant Detail UX checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Plant Detail UX checks OK: source-aware editing, local persistence, capacity and relationship validation, mapping confirmations, honest telemetry/device states, freshness and accessibility verified.');
