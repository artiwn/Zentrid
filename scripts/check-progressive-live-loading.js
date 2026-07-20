const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = relativePath => {
  const path = join(root, relativePath);
  expect(existsSync(path), `Missing file: ${relativePath}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const repositories = read('assets/js/api-repositories.ts');
const liveBridge = read('assets/js/live-api-ui.ts');
const contracts = read('assets/js/api-contracts.ts');
const platformApi = read('assets/js/platform-api.ts');
const globals = read('types/zentrid-globals.d.ts');

expect(repositories.includes('const pageSize = [20, 50, 100].includes(requestedSize)'), 'Repository page sizes must be bounded to 20/50/100 records.');
expect(!repositories.includes('pageRequests.push'), 'Initial repositories must not fan out across many pages.');
expect(!repositories.includes('Math.min(collectionTotalPages'), 'Initial repositories still try to load all collection pages.');
expect(repositories.includes("fetchCollectionPage('/api/admin/provider-integrations'"), 'Fast integration registry endpoint is not paged through the repository.');
expect(repositories.includes('async summary(options: ZentridRepositoryReadOptions'), 'Slow integration summary is not exposed separately.');
expect(repositories.includes("'/api/integrations'") && repositories.includes("cacheVariant: 'summary'"), 'Integration summary does not accept paged cached background reads.');
expect(globals.includes('interface ZentridIntegrationReadRepositoryApi'), 'Global integration summary repository type is missing.');
expect(globals.includes('timeoutMs?: number;'), 'Repository read options do not expose timeoutMs.');

expect(platformApi.includes('alerts(options?: ZentridRequestOptions)'), 'Live API alert method does not accept request options.');
expect(platformApi.includes("alerts: (options: ZentridRequestOptions = {})"), 'Live API alert implementation does not forward request options.');
expect(platformApi.includes("integrations: (options: ZentridRequestOptions = {})"), 'Live API integration implementation does not forward request options.');

expect(liveBridge.includes('const SLOW_ENDPOINT_TIMEOUT_MS = 90_000;'), 'Slow background timeout is missing.');
expect(liveBridge.includes('Core dashboard data is ready.'), 'Overview progressive state message is missing.');
expect(liveBridge.includes('without blocking the registry'), 'Registry progressive loading message is missing.');
expect(liveBridge.includes('ZentridAPIRepositories.integrations.summary({ ...detailReadOptions') && liveBridge.includes('timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS'), 'Slow integration summary is not loaded in the background.');
expect(liveBridge.includes("detailReadOptions('overview:alerts', 100, forceRefresh)") && liveBridge.includes('timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS'), 'Slow alerts are not loaded in the background.');
expect(liveBridge.includes('mergeIntegrationSummaries'), 'Integration registry is not enriched progressively.');
expect(liveBridge.includes('renderOverviewLiveSnapshot(payload);'), 'Overview is not rerendered as background data arrives.');

const plantsStart = liveBridge.indexOf('async function applyPlants');
const plantsEnd = liveBridge.indexOf('async function applyDevices', plantsStart);
const plantsBlock = liveBridge.slice(plantsStart, plantsEnd);
expect(plantsBlock.indexOf('render();') < plantsBlock.indexOf('ZentridAPIRepositories.alerts.list'), 'Plant Registry still waits for alerts before first render.');
expect(plantsBlock.indexOf('render();') < plantsBlock.indexOf('ZentridAPIRepositories.devices.list'), 'Plant Registry still waits for devices before first render.');

const devicesStart = liveBridge.indexOf('async function applyDevices');
const devicesEnd = liveBridge.indexOf('async function applyAlerts', devicesStart);
const devicesBlock = liveBridge.slice(devicesStart, devicesEnd);
expect(devicesBlock.indexOf('render();') < devicesBlock.indexOf('ZentridAPIRepositories.alerts.list'), 'Device Registry still waits for alerts before first render.');
expect(devicesBlock.indexOf('render();') < devicesBlock.indexOf('ZentridAPIRepositories.plants.list'), 'Device Registry still waits for plants before first render.');

[
  'managingTenant', 'phoneNumber1', 'accountActivation',
  'recordStatus', 'plantTimeZone', 'countryRegion', 'devicesCount',
  'vendorModel', 'ratedPowerKw', 'firmwareVersion', 'parentDeviceId',
  'alarmType', 'reason', 'solution',
  'providerName', 'integrationStatus', 'integrationCode'
].forEach(alias => expect(contracts.includes(alias), `Actual backend field alias is missing from contracts: ${alias}.`));

if (failures.length) {
  console.error('Progressive live loading checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Progressive live loading checks OK: bounded previews, non-blocking background relations and actual API field aliases verified.');
