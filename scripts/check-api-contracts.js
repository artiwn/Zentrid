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
  'FleetClientDto', 'FleetTenantDto', 'FleetPlantDto', 'FleetDeviceDto',
  'FleetAlertDto', 'FleetIntegrationDto', 'FleetContractMapperContext'
].forEach(name => expect(contractSource.includes(`interface ${name}`) || contractSource.includes(`type ${name}`), `Contract type is missing: ${name}.`));

['clients', 'tenants', 'plants', 'devices', 'alerts', 'integrations'].forEach(entity => {
  expect(new RegExp(`const ${entity}\\s*=\\s*createContract`).test(contractSource), `Entity contract is missing: ${entity}.`);
  expect(liveBridge.includes(`FleetAPIRepositories.${entity}.list(`), `Live bridge does not delegate ${entity} reads to FleetAPIRepositories.`);
});
expect(repositorySource.includes('const contract = FleetAPIContracts[entity]'), 'Repository layer does not delegate mapping to FleetAPIContracts.');
expect(!/function normalizeId\(/.test(liveBridge), 'Legacy normalizeId helper still exists in the live bridge.');
expect(globals.includes('interface FleetAPIContractsApi'), 'Global FleetAPIContracts type is missing.');
expect(globals.includes('declare const FleetAPIContracts'), 'FleetAPIContracts global declaration is missing.');

function htmlFiles() {
  const files = ['index.html'];
  const pageDir = join(root, 'pages');
  for (const name of readdirSync(pageDir)) if (name.endsWith('.html')) files.push(`pages/${name}`);
  return files;
}
let contractPages = 0;
for (const relativePath of htmlFiles()) {
  const html = read(relativePath);
  const liveIndex = html.indexOf('live-api-ui.js');
  if (liveIndex < 0) continue;
  contractPages += 1;
  const contractIndex = html.indexOf('api-contracts.js');
  const repositoryIndex = html.indexOf('api-repositories.js');
  expect(contractIndex >= 0, `${relativePath} is missing api-contracts.js.`);
  expect(repositoryIndex >= 0, `${relativePath} is missing api-repositories.js.`);
  expect(contractIndex < repositoryIndex && repositoryIndex < liveIndex, `${relativePath} must load contracts, repositories and live bridge in that order.`);
}
expect(contractPages === 13, `Expected 13 active live API pages, found ${contractPages}.`);

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
function displayName(row, keys, entityLabel, index, typeHint) {
  return safeText(firstOf(row, keys, ''), `${typeHint || entityLabel} ${index + 1}`);
}
function formatDate(value, fallback = 'No data') { return value ? `DATE:${value}` : fallback; }
function integrationVendor(value) {
  const text = String(value || '').trim();
  if (/deye/i.test(text)) return 'DeyeCloud';
  if (/solax/i.test(text)) return 'SolaX';
  return text || 'Unknown';
}
function integrationSoftware(value) { return integrationVendor(value) === 'SolaX' ? 'SolaX Cloud' : integrationVendor(value); }
const context = { safeText, firstOf, displayName, formatDate, integrationVendor, integrationSoftware };

const sandbox = { window: {}, console, String, Number, Boolean, Array, Object, Math };
vm.createContext(sandbox);
const compiled = ts.transpileModule(contractSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;
vm.runInContext(compiled, sandbox, { filename: 'api-contracts.js' });
const contracts = sandbox.window.FleetAPIContracts;
expect(Boolean(contracts), 'FleetAPIContracts did not initialize.');

if (contracts) {
  expect(contracts.clients.parse(null) === null, 'Client parser must reject null.');
  expect(contracts.devices.parse([]) === null, 'Device parser must reject arrays.');

  const clientRaw = { clientId: 'CL-1', clientName: 'Arpi Solar', plantsCount: 2, devicesCount: 8, address: { country: 'AM', city: 'Yerevan' } };
  const client = contracts.clients.map(clientRaw, 0, context);
  expect(client.id === 'CL-1' && client.name === 'Arpi Solar', 'Client ID/name mapping is incorrect.');
  expect(client.plantCount === 2 && client.deviceCount === 8, 'Client count mapping is incorrect.');
  expect(client.country === 'AM' && client.city === 'Yerevan', 'Client nested address mapping is incorrect.');
  expect(client.dataOrigin === 'live' && client.raw === clientRaw, 'Client provenance/raw payload is not preserved.');

  const tenant = contracts.tenants.map({ organizationCode: 'TN-2', organizationName: 'Sunridge', onboardingProgress: 65, contact: { email: 'ops@example.com' } }, 0, context);
  expect(tenant.id === 'LIVE-TENANT-1' && tenant.code === 'TN-2' && tenant.name === 'Sunridge', 'Tenant identity/code mapping is incorrect.');
  expect(tenant.setup === 65 && tenant.email === 'ops@example.com', 'Tenant progress/contact mapping is incorrect.');

  const plant = contracts.plants.map({ id: 'P-1', sourcePlantId: 'EXT-P-1', plantName: 'North Plant', provider: 'Huawei', installedPowerKw: 2500, currentPowerKw: 1250, todayEnergyKwh: 900 }, 0, context);
  expect(plant.externalId === 'EXT-P-1' && plant.name === 'North Plant', 'Plant identity mapping is incorrect.');
  expect(plant.capacityDc === 2.5 && plant.livePower === '1.25 MW' && plant.today === '900.0 kWh', 'Plant energy mapping is incorrect.');

  const device = contracts.devices.map({ id: 'D-1', sourceDeviceId: 'INV-1', sourcePlantId: 'EXT-P-1', deviceName: 'Inverter A', deviceType: 'Inverter', provider: 'Huawei', serialNumber: 'SN-1' }, 0, context);
  expect(device.externalId === 'INV-1' && device.plantId === 'EXT-P-1', 'Device identity relation mapping is incorrect.');
  expect(device.name === 'Inverter A' && device.type === 'Inverter' && device.serial === 'SN-1', 'Device display mapping is incorrect.');

  const alert = contracts.alerts.map({ id: 'A-1', sourceAlertId: 'V-77', title: 'Low Performance', severity: 'Critical', provider: 'Huawei', sourcePlantId: 'EXT-P-1', occurredAtUtc: '2026-07-15T08:00:00Z' }, 0, context);
  expect(alert.vendorCode === 'V-77' && alert.priority === 'P1', 'Alert code/priority mapping is incorrect.');
  expect(alert.created === 'DATE:2026-07-15T08:00:00Z' && alert.dataOrigin === 'live', 'Alert date/provenance mapping is incorrect.');

  const integration = contracts.integrations.map({ provider: 'solarx', displayName: 'Solarx Main', status: 'Active', plantsCount: 4, devicesCount: 20, alertsCount: 1 }, 0, context);
  expect(integration.vendor === 'solarx' && integration.software === 'solarx', 'Integration provider compatibility mapping is incorrect.');
  expect(integration.plants === 4 && integration.devices === 20 && integration.alerts === 1, 'Integration counts are incorrect.');

  const realClient = contracts.clients.map({ id: 'C-LIVE', clientCode: 'CLIENT-001', clientName: 'Live Client', managingTenant: 'TENANT-001', clientType: 'Commercial', accountActivation: 'Active', country: 'AM', region: 'Yerevan', city: 'Yerevan', email: 'live@example.invalid', phoneNumber1: '+374000000', username: 'live-portal' }, 0, context);
  expect(realClient.tenant === 'TENANT-001' && realClient.contactPhone === '+374000000' && realClient.username === 'live-portal', 'Actual Client API aliases are not mapped.');

  const realPlant = contracts.plants.map({ id: 'P-LIVE', plantCode: 'PLANT-001', plantName: 'Live Plant', clientId: 'C-LIVE', client: 'CLIENT-001', managingTenant: 'TENANT-001', sourceScheme: 'Manual', recordStatus: 'Draft', plantType: 'Solar', countryRegion: 'AM', plantTimeZone: 'Asia/Yerevan', devicesCount: 3 }, 0, context);
  expect(realPlant.code === 'PLANT-001' && realPlant.status === 'Draft' && realPlant.timezone === 'Asia/Yerevan' && realPlant.devices === 3, 'Actual Plant Registry aliases are not mapped.');

  const realDevice = contracts.devices.map({ id: 'D-LIVE', provider: 'DeyeCloud', sourceDeviceId: 'INV-001', sourcePlantId: 'PLANT-001', name: 'Inverter 1', deviceType: 'Inverter', serialNumber: 'INV-001', dataQualityStatus: 'Complete', vendorExtensions: { vendorModel: 'Generated-DeyeCloud-Inverter', ratedPowerKw: 50, firmwareVersion: 'generated-1.0.0', parentDeviceId: 'LOGGER-1', dataFreshness: 'Fresh' } }, 0, context);
  expect(realDevice.model === 'Generated-DeyeCloud-Inverter' && realDevice.capacity === '50 kW' && realDevice.firmware === 'generated-1.0.0' && realDevice.parent === 'LOGGER-1', 'Actual Device vendorExtensions aliases are not mapped.');

  const realAlert = contracts.alerts.map({ id: 'A-LIVE', provider: 'DeyeCloud', sourceAlertId: 'ALARM-1', title: 'Alarm 1', message: 'Generated alarm', severity: 'Critical', vendorExtensions: { alarmCode: 'ALARM-1', alarmType: 'Operational', reason: 'Generated reason', solution: 'Inspect source' } }, 0, context);
  expect(realAlert.fleetCode === 'ALARM-1' && realAlert.category === 'Operational' && realAlert.probableCause === 'Generated reason' && realAlert.recommendation === 'Inspect source', 'Actual Alert vendorExtensions aliases are not mapped.');

  const registryIntegration = contracts.integrations.map({ id: 'I-LIVE', integrationName: 'Deye Registry', integrationCode: 'INT-001', providerName: 'DeyeCloud', vendorName: 'DeyeCloud', integrationStatus: 'Failed', createdAtUtc: '2026-07-14T10:18:55Z' }, 0, context);
  expect(registryIntegration.id === 'I-LIVE' && registryIntegration.code === 'INT-001' && registryIntegration.status === 'Failed' && registryIntegration.vendor === 'DeyeCloud', 'Actual Provider Integration registry aliases are not mapped.');

  const list = contracts.devices.mapList([{ id: 'D-1' }, { id: 'D-2' }], context);
  expect(list.length === 2 && list[1].id === 'D-2', 'Contract mapList is incorrect.');
}

if (failures.length) {
  console.error('API contract checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`API contract checks OK: 6 DTO contracts, 6 mapper contracts and ${contractPages} active repository page load orders verified.`);
