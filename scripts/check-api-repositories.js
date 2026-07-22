const { existsSync, readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(relativePath) {
  const path = join(root, relativePath);
  expect(existsSync(path), `Missing file: ${relativePath}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const contractSource = read('assets/js/api-contracts.ts');
const repositorySource = read('assets/js/api-repositories.ts');
const liveBridge = read('assets/js/live-api-ui.ts');
const globals = read('types/zentrid-globals.d.ts');

[
  'ZentridRepositoryMapperContext', 'ZentridRepositoryListResult', 'ZentridRepositoryItemResult',
  'ZentridEntityReadRepositoryApi', 'ZentridAPIRepositoriesApi'
].forEach(name => expect(globals.includes(`interface ${name}`), `Global repository type is missing: ${name}.`));
expect(globals.includes('declare const ZentridAPIRepositories'), 'ZentridAPIRepositories global declaration is missing.');

[
  'fetchCollectionPage', 'paginationFromPayload', 'mergePlantSources', 'uniqueByIdentity', 'mappedResult',
  'directRecord', 'itemCacheVariant', 'ZentridPlatformAPI.clients.get(id, requestOptions)', 'ZentridPlatformAPI.tenants.get(id, requestOptions)',
  'ZentridPlatformAPI.plantRegistry.get(id, requestOptions)', 'ZentridPlatformAPI.providerIntegrations.get(id, requestOptions)',
  "fetchCollectionPage('/api/admin/clients'", "fetchCollectionPage('/api/admin/tenants'",
  "fetchCollectionPage('/api/plants'", "fetchCollectionPage('/api/devices'",
  "fetchCollectionPage('/api/alerts'", "fetchCollectionPage('/api/telemetry'", "'/api/integrations'",
  "fetchCollectionPage('/api/admin/provider-integrations'", 'contract.mapList'
].forEach(token => expect(repositorySource.includes(token), `Repository implementation token is missing: ${token}.`));

['clients', 'tenants', 'plants', 'devices', 'alerts', 'telemetry', 'integrations'].forEach(entity => {
  expect(liveBridge.includes(`ZentridAPIRepositories.${entity}.list(`), `Live bridge does not read ${entity} through ZentridAPIRepositories.`);
});

const forbiddenLiveBridgeTokens = [
  'ZentridAPIContracts.clients.map', 'ZentridAPIContracts.tenants.map', 'ZentridAPIContracts.plants.map',
  'ZentridAPIContracts.devices.map', 'ZentridAPIContracts.alerts.map', 'ZentridAPIContracts.integrations.map',
  'ZentridPlatformAPI.clients.list()', 'ZentridPlatformAPI.tenants.list()',
  'ZentridPlatformAPI.live.plants()', 'ZentridPlatformAPI.live.devices()',
  'ZentridPlatformAPI.live.alerts(', 'ZentridPlatformAPI.live.integrations(',
  'ZentridPlatformAPI.plantRegistry.list()', 'ZentridPlatformAPI.providerIntegrations.list()'
];
forbiddenLiveBridgeTokens.forEach(token => expect(!liveBridge.includes(token), `Live bridge still bypasses repositories: ${token}.`));
expect(!liveBridge.includes('function fetchCollectionPage'), 'Live bridge still owns collection pagination logic.');
expect(!liveBridge.includes('function mergePlantSources'), 'Live bridge still owns Plant source merging.');

function htmlFiles() {
  const files = ['index.html'];
  const pageDir = join(root, 'pages');
  for (const name of readdirSync(pageDir)) if (name.endsWith('.html')) files.push(`pages/${name}`);
  return files;
}
let repositoryPages = 0;
for (const relativePath of htmlFiles()) {
  const html = read(relativePath);
  const liveIndex = html.indexOf('live-api-ui.js');
  if (liveIndex < 0) continue;
  repositoryPages += 1;
  const contractIndex = html.indexOf('api-contracts.js');
  const repositoryIndex = html.indexOf('api-repositories.js');
  expect(contractIndex >= 0, `${relativePath} is missing api-contracts.js.`);
  expect(repositoryIndex >= 0, `${relativePath} is missing api-repositories.js.`);
  expect(contractIndex < repositoryIndex && repositoryIndex < liveIndex, `${relativePath} must load contracts, repositories and live bridge in that order.`);
}
expect(repositoryPages === 14, `Expected 14 repository-enabled live API pages, found ${repositoryPages}.`);

function firstOf(row, keys, fallback = '') {
  for (const key of keys) {
    let value = row;
    for (const part of String(key).split('.')) {
      if (!value || typeof value !== 'object') { value = undefined; break; }
      value = value[part];
    }
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}
function safeText(value, fallback = '—') { return value === undefined || value === null || value === '' ? String(fallback) : String(value); }
function displayName(row, keys, entityLabel, index, typeHint) { return safeText(firstOf(row, keys, ''), `${typeHint || entityLabel} ${index + 1}`); }
function formatDate(value, fallback = 'No data') { return value ? `DATE:${value}` : fallback; }
function integrationVendor(value) {
  const text = String(value || '').trim();
  if (/deye/i.test(text)) return 'DeyeCloud';
  if (/solax/i.test(text)) return 'SolaX';
  return text || 'Unknown';
}
function integrationSoftware(value) { return integrationVendor(value) === 'SolaX' ? 'SolaX Cloud' : integrationVendor(value); }
const context = {
  safeText, firstOf, displayName, formatDate, integrationVendor, integrationSoftware,
  realDisplayName(row) { return String(row.plantName || row.stationName || row.displayName || row.name || ''); }
};

const livePlant = { id: 'P-1', sourcePlantId: 'EXT-P-1', provider: 'Huawei', currentPowerKw: 1200 };
const adminPlant = { id: 'ADMIN-P-1', sourcePlantId: 'EXT-P-1', plantName: 'Yerevan North', installedPowerKw: 2500 };
const requests = [];
const sandbox = {
  AbortController,
  window: {}, console, String, Number, Boolean, Array, Object, Math, Set, Promise,
  ZentridAPI: {
    async request(path) {
      requests.push(path);
      if (path.startsWith('/api/plants?')) return { items: [livePlant], page: 1, pageSize: 50, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
      if (path.startsWith('/api/admin/plants?')) return { items: [adminPlant], page: 1, pageSize: 50, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
      if (path.startsWith('/api/devices?')) return { items: [{ id: 'D-1', sourceDeviceId: 'INV-1', sourcePlantId: 'EXT-P-1', deviceName: 'Inverter A', provider: 'Huawei' }], page: 1, pageSize: 50, totalCount: 1, totalPages: 1 };
      if (path.startsWith('/api/alerts?')) return { items: [{ id: 'A-1', sourceAlertId: 'AL-1', title: 'Low Output', provider: 'Huawei', severity: 'Warning' }], page: 1, pageSize: 50, totalCount: 1, totalPages: 1 };
      if (path.startsWith('/api/telemetry?')) return { telemetry: [{ metricName: 'Current Power', value: 1200, unit: 'kW', sourcePlantId: 'EXT-P-1', sourceDeviceId: 'INV-1', measuredAtUtc: '2026-07-22T08:00:00Z', dataQualityStatus: 'Fresh' }, { telemetry: { id: 'TM-2', metricName: 'Voltage' }, measurement: { value: 380, unit: 'V', measuredAtUtc: '2026-07-22T08:00:00Z', quality: 'Fresh' }, plant: { id: 'EXT-P-1', name: 'Yerevan North' }, device: { id: 'INV-1', name: 'Inverter A', type: 'Inverter' }, source: { provider: 'Huawei' } }], page: 1, pageSize: 50, totalCount: 2, totalPages: 1 };
      throw new Error(`Unexpected ZentridAPI path: ${path}`);
    }
  },
  ZentridPlatformAPI: {
    clients: {
      async list() { return { items: [{ clientId: 'C-1', clientName: 'Client One' }] }; },
      async get(id) { requests.push(`/api/admin/clients/${id}`); return { data: { clientId: id, clientName: 'Direct Client' } }; }
    },
    tenants: {
      async list() { return { items: [{ tenantId: 'T-1', tenantName: 'Tenant One' }] }; },
      async get(id) { requests.push(`/api/admin/tenants/${id}`); return { result: { tenantId: id, tenantName: 'Direct Tenant' } }; }
    },
    plantRegistry: {
      async list() { return { items: [adminPlant] }; },
      async get(id) {
        requests.push(`/api/admin/plants/${id}`);
        return { data: { ...adminPlant, id } };
      }
    },
    live: {
      async plants() { return { items: [livePlant] }; },
      async devices() { return { items: [] }; },
      async alerts() { return { items: [{ id: 'A-1', sourceAlertId: 'AL-1', title: 'Low Output', provider: 'Huawei', severity: 'Warning' }] }; },
      async telemetry() { return { items: [{ telemetryId: 'TM-1', metricName: 'Current Power', value: 1200, unit: 'kW' }] }; },
      async integrations() { return { items: [{ provider: 'DeyeCloud', displayName: 'DeyeCloud', status: 'Warning', plantsCount: 10 }] }; }
    },
    providerIntegrations: {
      async list() { return { items: [{ id: 'I-1', provider: 'DeyeCloud', integrationName: 'Deye Main', status: 'Active' }] }; },
      async get(id) { requests.push(`/api/admin/provider-integrations/${id}`); return { data: { id, provider: 'DeyeCloud', integrationName: 'Direct Integration', status: 'Active' } }; }
    }
  }
};
sandbox.window.ZentridAPI = sandbox.ZentridAPI;
sandbox.window.ZentridPlatformAPI = sandbox.ZentridPlatformAPI;
vm.createContext(sandbox);
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None };
vm.runInContext(ts.transpileModule(contractSource, { compilerOptions }).outputText, sandbox, { filename: 'api-contracts.js' });
sandbox.ZentridAPIContracts = sandbox.window.ZentridAPIContracts;
vm.runInContext(ts.transpileModule(repositorySource, { compilerOptions }).outputText, sandbox, { filename: 'api-repositories.js' });
const repositories = sandbox.window.ZentridAPIRepositories;
expect(Boolean(repositories), 'ZentridAPIRepositories did not initialize.');

(async () => {
  if (repositories) {
    expect(repositories.isConfigured() === false, 'Repositories must start unconfigured.');
    repositories.configure(context);
    expect(repositories.isConfigured() === true, 'Repository mapper context was not configured.');

    const clients = await repositories.clients.list();
    expect(clients.items.length === 1 && clients.items[0].id === 'C-1', 'Client repository did not map the list response.');
    expect(clients.source === '/api/admin/clients' && clients.rawItems.length === 1, 'Client repository metadata is incorrect.');

    const directClient = await repositories.clients.get('C-99', { forceRefresh: true });
    expect(directClient.item && directClient.item.id === 'C-99' && directClient.item.name === 'Direct Client', 'Client repository did not map the direct detail response.');
    expect(directClient.source === '/api/admin/clients/C-99', 'Client detail repository source is incorrect.');
    expect(requests.includes('/api/admin/clients/C-99'), 'Client repository did not call the direct detail endpoint.');

    const tenants = await repositories.tenants.list();
    expect(tenants.items[0].id === 'T-1', 'Tenant repository did not map the list response.');

    const directTenant = await repositories.tenants.get('T-99', { forceRefresh: true });
    expect(directTenant.item && directTenant.item.id === 'T-99' && directTenant.item.name === 'Direct Tenant', 'Tenant repository did not map the direct detail response.');
    expect(directTenant.source === '/api/admin/tenants/T-99', 'Tenant detail repository source is incorrect.');
    expect(requests.includes('/api/admin/tenants/T-99'), 'Tenant repository did not call the direct detail endpoint.');

    const plants = await repositories.plants.list();
    expect(plants.items.length === 1, 'Plant repository did not deduplicate merged sources.');
    expect(plants.items[0].name === 'Yerevan North', 'Plant repository did not preserve the administrative display name.');
    expect(plants.items[0].capacityDc === 2.5 && plants.items[0].livePower === '1200 kW', 'Plant repository did not merge the exact live and administrative API metrics.');
    expect(plants.source === '/api/plants + /api/admin/plants', 'Plant repository source metadata is incorrect.');

    const directPlant = await repositories.plants.get('ADMIN-P-1', { forceRefresh: true });
    expect(directPlant.item && directPlant.item.name === 'Yerevan North', 'Plant repository did not map the direct administrative detail response.');
    expect(directPlant.item && directPlant.item.livePower === '1200 kW' && directPlant.item.capacityDc === 2.5, 'Plant detail did not preserve live operational enrichment.');
    expect(directPlant.source === '/api/admin/plants/ADMIN-P-1 + /api/plants', 'Plant detail repository source is incorrect.');
    expect(requests.includes('/api/admin/plants/ADMIN-P-1'), 'Plant repository did not call the direct detail endpoint.');

    const devices = await repositories.devices.list();
    expect(devices.items[0].externalId === 'INV-1' && devices.items[0].plantId === 'EXT-P-1', 'Device repository mapping is incorrect.');

    const alerts = await repositories.alerts.list();
    expect(alerts.items[0].vendorCode === 'AL-1', 'Alert repository mapping is incorrect.');

    const telemetry = await repositories.telemetry.list();
    expect(telemetry.items.length === 2 && telemetry.items[0].metric === 'Current Power' && telemetry.items[0].displayValue === '1200 kW', 'Telemetry repository mapping is incorrect.');
    expect(telemetry.items[1].metric === 'Voltage' && telemetry.items[1].displayValue === '380 V' && telemetry.source === '/api/telemetry', 'Nested telemetry envelope/record mapping is incorrect or records sharing one device were deduplicated.');
    expect(telemetry.items[1].id === 'TM-2' && telemetry.items[1].plant === 'Yerevan North' && telemetry.items[1].device === 'Inverter A' && telemetry.items[1].provider === 'Huawei', 'Nested telemetry relationships are not preserved by the repository.');
    expect(telemetry.items[0].raw.metricName === telemetry.rawItems[0].metricName, 'Telemetry repository provenance is incorrect.');

    const integrations = await repositories.integrations.list();
    expect(integrations.items.length === 1 && integrations.source === '/api/admin/provider-integrations', 'Integration registry repository is incorrect.');
    const directIntegration = await repositories.integrations.get('I-99', { forceRefresh: true });
    expect(directIntegration.item && directIntegration.item.id === 'I-99' && directIntegration.item.name === 'Direct Integration', 'Integration repository did not map the direct detail response.');
    expect(directIntegration.source === '/api/admin/provider-integrations/I-99', 'Integration detail repository source is incorrect.');
    expect(requests.includes('/api/admin/provider-integrations/I-99'), 'Integration repository did not call the direct detail endpoint.');
    const integrationSummary = await repositories.integrations.summary({ timeoutMs: 90000 });
    expect(integrationSummary.items.length === 1 && integrationSummary.source === '/api/integrations', 'Integration summary repository is incorrect.');

    const item = await repositories.devices.get('INV-1');
    expect(item.item && item.item.id === 'D-1', 'Repository get() did not resolve an external identity.');
    expect(requests.some(path => path.startsWith('/api/plants?page=1&size=50')), 'Plant repository did not use server-paged collection loading.');
    expect(plants.pagination.totalCount === 1 && plants.pagination.page === 1, 'Plant repository pagination metadata is incorrect.');
  }

  if (failures.length) {
    console.error('API repository checks failed.');
    failures.forEach(message => console.error(`  ${message}`));
    process.exit(1);
  }
  console.log(`API repository checks OK: 7 typed repositories, direct Client/Tenant/Plant/Integration Detail lookup, bounded preview/merge behavior and ${repositoryPages} page load orders verified.`);
})().catch(error => {
  console.error('API repository checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
