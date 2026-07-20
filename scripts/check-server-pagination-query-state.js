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

const query = read('assets/js/registry-query-state.ts');
const repositories = read('assets/js/api-repositories.ts');
const live = read('assets/js/live-api-ui.ts');
const globals = read('types/zentrid-globals.d.ts');
const clients = read('assets/js/client-hierarchy.ts');
const plants = read('assets/js/plants.ts');
const devices = read('assets/js/devices.ts');
const alerts = read('assets/js/alerts.ts');
const css = read('assets/css/src/80-auth-and-api-console.css');

[
  "type ZentridRegistryEntity = 'clients' | 'plants' | 'devices' | 'alerts'",
  "search.get('page')", "search.get('pageSize')", "history[method]",
  "zentrid:registry-query-change", "window.addEventListener('popstate'",
  'data-registry-page-size', 'data-registry-page-jump', 'filterScopeHtml'
].forEach(token => expect(query.includes(token), `Registry query-state token missing: ${token}`));

[
  'page?: number;', 'pageSize?: number;', 'pagination: ZentridRepositoryPagination;',
  'requestCacheKey', 'fetchCollectionPage', 'paginationFromPayload',
  '?page=${page}&size=${pageSize}'
].forEach(token => expect(repositories.includes(token), `Repository pagination token missing: ${token}`));
expect(repositories.includes("new Map<string, RepositoryCacheEntry>()"), 'Repository cache is not keyed per server page.');

['clients', 'plants', 'devices', 'alerts'].forEach(entity => {
  expect(live.includes(`registryReadOptions('${entity}', forceRefresh)`) || live.includes(`registryReadOptions('${entity}')`), `Live bridge pagination token missing: registryReadOptions('${entity}')`);
});
[
  'publishRegistryPagination', 'beginRegistryRequest', 'isCurrentRegistryRequest',
  "window.addEventListener('zentrid:registry-query-change'"
].forEach(token => expect(live.includes(token), `Live bridge pagination token missing: ${token}`));

expect(clients.includes("pagerHtml('clients'"), 'Client Registry does not render server pager.');
expect(clients.includes("update('clients'"), 'Client Registry does not persist filters in URL state.');
expect(plants.includes("pagination('plants')"), 'Plant Registry does not switch to server pagination.');
expect(plants.includes("update('plants'"), 'Plant Registry does not persist filters in URL state.');
expect(devices.includes("pagination('devices')"), 'Device Registry does not switch to server pagination.');
expect(devices.includes("update('devices'"), 'Device Registry does not persist filters in URL state.');
expect(alerts.includes("pagination('alerts')"), 'Alert Registry does not switch to server pagination.');
expect(alerts.includes("update('alerts'"), 'Alert Registry does not persist filters in URL state.');

['pages/clients.html','pages/plants.html','pages/devices.html','pages/alerts.html'].forEach(file => {
  const html = read(file);
  const queryIndex = html.indexOf('registry-query-state.js');
  expect(queryIndex >= 0, `${file} is missing registry-query-state.js.`);
  const consumer = file.includes('clients') ? 'client-hierarchy.js' : file.includes('plants') ? 'plants.js' : file.includes('devices') ? 'devices.js' : 'alerts.js';
  expect(queryIndex < html.indexOf(consumer), `${file} must load registry query state before ${consumer}.`);
});

expect(globals.includes('interface ZentridRegistryQueryApi'), 'Global ZentridRegistryQuery API type is missing.');
expect(globals.includes('interface ZentridRepositoryPagination'), 'Global repository pagination type is missing.');
expect(css.includes('.registry-pagination-actions'), 'Registry pagination CSS is missing.');
expect(css.includes('.registry-filter-scope'), 'Current-page filter scope CSS is missing.');

if (failures.length) {
  console.error('Server pagination and query-state checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Server pagination and query-state checks OK: URL state, paged repository reads, race guards and four registry integrations verified.');
