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
  'ZentridClientDto', 'ZentridTenantDto', 'ZentridPlantDto', 'ZentridDeviceDto',
  'ZentridAlertDto', 'ZentridTelemetryDto', 'ZentridIntegrationDto', 'ZentridContractMapperContext'
].forEach(name => expect(contractSource.includes(`interface ${name}`) || contractSource.includes(`type ${name}`), `Contract type is missing: ${name}.`));

['clients', 'tenants', 'plants', 'devices', 'alerts', 'telemetry', 'integrations'].forEach(entity => {
  expect(new RegExp(`const ${entity}\\s*=\\s*createContract`).test(contractSource), `Entity contract is missing: ${entity}.`);
  expect(liveBridge.includes(`ZentridAPIRepositories.${entity}.list(`), `Live bridge does not delegate ${entity} reads to ZentridAPIRepositories.`);
});
expect(repositorySource.includes('const contract = ZentridAPIContracts[entity]'), 'Repository layer does not delegate mapping to ZentridAPIContracts.');
expect(!/function normalizeId\(/.test(liveBridge), 'Legacy normalizeId helper still exists in the live bridge.');
expect(globals.includes('interface ZentridAPIContractsApi'), 'Global ZentridAPIContracts type is missing.');
expect(globals.includes('declare const ZentridAPIContracts'), 'ZentridAPIContracts global declaration is missing.');

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
expect(contractPages === 14, `Expected 14 active live API pages, found ${contractPages}.`);

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
const contracts = sandbox.window.ZentridAPIContracts;
expect(Boolean(contracts), 'ZentridAPIContracts did not initialize.');

if (contracts) {
  expect(contracts.clients.parse(null) === null, 'Client parser must reject null.');
  expect(contracts.devices.parse([]) === null, 'Device parser must reject arrays.');

  const clientRaw = { clientId: 'CL-1', clientName: 'Arpi Solar', plantsCount: 2, devicesCount: 8, address: { country: 'AM', city: 'Yerevan' } };
  const client = contracts.clients.map(clientRaw, 0, context);
  expect(client.id === 'CL-1' && client.name === 'Arpi Solar', 'Client ID/name mapping is incorrect.');
  expect(client.plantCount === 2 && client.deviceCount === 8, 'Client count mapping is incorrect.');
  expect(client.country === 'Armenia' && client.city === 'Yerevan', 'Client nested address/country normalization is incorrect.');
  expect(client.dataOrigin === 'live' && client.raw === clientRaw, 'Client provenance/raw payload is not preserved.');

  const tenant = contracts.tenants.map({ organizationCode: 'TN-2', organizationName: 'Sunridge', onboardingProgress: 65, contact: { email: 'ops@example.com' } }, 0, context);
  expect(tenant.id === '' && tenant.code === 'TN-2' && tenant.name === 'Sunridge', 'Tenant identity/code mapping is incorrect or a missing ID was fabricated.');
  expect(tenant.setup === 65 && tenant.email === 'ops@example.com', 'Tenant progress/contact mapping is incorrect.');

  const plant = contracts.plants.map({ id: 'P-1', sourcePlantId: 'EXT-P-1', plantName: 'North Plant', provider: 'Huawei', installedPowerKw: 2500, currentPowerKw: 1250, todayEnergyKwh: 900 }, 0, context);
  expect(plant.externalId === 'EXT-P-1' && plant.name === 'North Plant', 'Plant identity mapping is incorrect.');
  expect(plant.capacityDc === 2.5 && plant.livePower === '1250 kW' && plant.today === '900 kWh', 'Plant energy mapping is incorrect or values were cosmetically fabricated.');

  const device = contracts.devices.map({ id: 'D-1', sourceDeviceId: 'INV-1', sourcePlantId: 'EXT-P-1', deviceName: 'Inverter A', deviceType: 'Inverter', provider: 'Huawei', serialNumber: 'SN-1' }, 0, context);
  expect(device.externalId === 'INV-1' && device.plantId === 'EXT-P-1', 'Device identity relation mapping is incorrect.');
  expect(device.name === 'Inverter A' && device.type === 'Inverter' && device.serial === 'SN-1', 'Device display mapping is incorrect.');

  const alert = contracts.alerts.map({ id: 'A-1', sourceAlertId: 'V-77', title: 'Low Performance', severity: 'Critical', provider: 'Huawei', sourcePlantId: 'EXT-P-1', occurredAtUtc: '2026-07-15T08:00:00Z' }, 0, context);
  expect(alert.vendorCode === 'V-77' && alert.priority === '—', 'Alert code mapping is incorrect or priority was derived without an API field.');
  expect(alert.created === 'DATE:2026-07-15T08:00:00Z' && alert.dataOrigin === 'live', 'Alert date/provenance mapping is incorrect.');

  const telemetry = contracts.telemetry.map({ telemetryId: 'TM-1', metricName: 'Current Power', value: 1250.5, unit: 'kW', measuredAtUtc: '2026-07-22T08:00:00Z', sourcePlantId: 'P-1', sourceDeviceId: 'D-1', dataQualityStatus: 'Fresh' }, 0, context);
  expect(telemetry.id === 'TM-1' && telemetry.metric === 'Current Power', 'Telemetry identity/metric mapping is incorrect.');
  expect(telemetry.numericValue === 1250.5 && telemetry.displayValue === '1250.5 kW', 'Telemetry numeric value/unit mapping is incorrect.');
  expect(telemetry.plantId === 'P-1' && telemetry.deviceId === 'D-1' && telemetry.quality === 'Fresh', 'Telemetry relation/quality mapping is incorrect.');

  const nestedTelemetryRaw = {
    telemetry: { id: 'TM-NESTED', metricName: 'AC Voltage' },
    measurement: { value: 380.4, unit: 'V', measuredAtUtc: '2026-07-22T08:05:00Z', quality: 'Valid' },
    source: { provider: 'Huawei' },
    tenant: { id: 'T-1', name: 'Tenant One' },
    plant: { id: 'P-1', name: 'North Plant' },
    device: { id: 'D-1', name: 'Inverter A', type: 'Inverter' }
  };
  const nestedTelemetry = contracts.telemetry.map(nestedTelemetryRaw, 1, context);
  expect(nestedTelemetry.id === 'TM-NESTED' && nestedTelemetry.metric === 'AC Voltage', 'Nested telemetry identity/metric aliases are not mapped.');
  expect(nestedTelemetry.numericValue === 380.4 && nestedTelemetry.unit === 'V' && nestedTelemetry.displayValue === '380.4 V', 'Nested telemetry value/unit aliases are not mapped.');
  expect(nestedTelemetry.provider === 'Huawei' && nestedTelemetry.tenantId === 'T-1' && nestedTelemetry.tenant === 'Tenant One', 'Nested telemetry source/tenant aliases are not mapped.');
  expect(nestedTelemetry.plantId === 'P-1' && nestedTelemetry.plant === 'North Plant' && nestedTelemetry.deviceId === 'D-1' && nestedTelemetry.device === 'Inverter A' && nestedTelemetry.deviceType === 'Inverter', 'Nested telemetry plant/device aliases are not mapped.');
  expect(nestedTelemetry.quality === 'Valid' && nestedTelemetry.timestampRaw === '2026-07-22T08:05:00Z' && nestedTelemetry.raw === nestedTelemetryRaw, 'Nested telemetry quality/timestamp provenance is incorrect.');

  const integration = contracts.integrations.map({ provider: 'solarx', displayName: 'Solarx Main', status: 'Active', plantsCount: 4, devicesCount: 20, alertsCount: 1 }, 0, context);
  expect(integration.vendor === 'SolaX' && integration.software === 'SolaX Cloud', 'Integration provider compatibility mapping is incorrect.');
  expect(integration.plants === 4 && integration.devices === 20 && integration.alerts === 1, 'Integration counts are incorrect.');

  const nestedIntegrationRaw = {
    vendorExtensions: { provider: 'DeyeCloud', displayName: 'Deye Main', integrationStatus: 'Active' },
    plantsCount: 2,
    devicesCount: 5
  };
  const nestedIntegration = contracts.integrations.map(nestedIntegrationRaw, 1, context);
  expect(nestedIntegration.vendor === 'DeyeCloud' && nestedIntegration.name === 'Deye Main', 'Nested integration provider/display-name aliases are not mapped.');
  expect(nestedIntegration.status === 'Active' && nestedIntegration.contractValid === true, 'Nested integration status aliases produced a false contract mismatch.');

  const realClient = contracts.clients.map({ id: 'C-LIVE', clientCode: 'CLIENT-001', clientName: 'Live Client', managingTenant: 'TENANT-001', clientType: 'Commercial', accountActivation: 'Active', country: 'AM', region: 'Yerevan', city: 'Yerevan', email: 'live@example.invalid', phoneNumber1: '+374000000', username: 'live-portal' }, 0, context);
  expect(realClient.tenant === 'TENANT-001' && realClient.contactPhone === '+374000000' && realClient.username === 'live-portal', 'Actual Client API aliases are not mapped.');
  expect(realClient.type === 'Legal Entity' && realClient.country === 'Armenia' && realClient.status === 'Active', 'Client type/country/status normalization is incorrect.');

  const normalizedTenant = contracts.tenants.map({ id: 'T-NORM', tenantName: 'Owner Tenant', tenantType: 'asset_owner', entityType: 'commercial', country: 'AM', tenantStatus: 'enabled' }, 0, context);
  expect(normalizedTenant.entityType === 'Legal Entity', 'Tenant legal entity type normalization is incorrect.');
  expect(Array.isArray(normalizedTenant.types) && normalizedTenant.types[0] === 'Owner', 'Tenant business type must remain separate from legal entity type.');
  expect(normalizedTenant.country === 'Armenia' && normalizedTenant.status === 'Active', 'Tenant country/status normalization is incorrect.');

  const realPlant = contracts.plants.map({ id: 'P-LIVE', plantCode: 'PLANT-001', plantName: 'Live Plant', clientId: 'C-LIVE', client: 'CLIENT-001', managingTenant: 'TENANT-001', sourceScheme: 'Manual', recordStatus: 'Draft', plantType: 'Solar', countryRegion: 'AM', plantTimeZone: 'Asia/Yerevan', devicesCount: 3 }, 0, context);
  expect(realPlant.code === 'PLANT-001' && realPlant.status === 'Draft' && realPlant.timezone === 'Asia/Yerevan' && realPlant.devices === 3, 'Actual Plant Registry aliases are not mapped.');
  expect(realPlant.country === 'Armenia', 'Plant country normalization is incorrect.');

  const normalizedPlant = contracts.plants.map({ id: 'P-NORM', plantName: 'Normalized Plant', provider: 'Huawei FusionSolar', status: 'Online', country: 'AM' }, 0, context);
  expect(normalizedPlant.vendor === 'Huawei' && normalizedPlant.status === 'Normal' && normalizedPlant.country === 'Armenia', 'Plant provider/status/country normalization is incorrect.');

  const realDevice = contracts.devices.map({ id: 'D-LIVE', provider: 'DeyeCloud', sourceDeviceId: 'INV-001', sourcePlantId: 'PLANT-001', name: 'Inverter 1', deviceType: 'Inverter', serialNumber: 'INV-001', dataQualityStatus: 'Complete', vendorExtensions: { vendorModel: 'Generated-DeyeCloud-Inverter', ratedPowerKw: 50, firmwareVersion: 'generated-1.0.0', parentDeviceId: 'LOGGER-1', dataFreshness: 'Fresh' } }, 0, context);
  expect(realDevice.model === 'Generated-DeyeCloud-Inverter' && realDevice.capacity === '50 kW' && realDevice.firmware === 'generated-1.0.0' && realDevice.parent === 'LOGGER-1', 'Actual Device vendorExtensions aliases are not mapped.');

  const normalizedDevice = contracts.devices.map({ id: 'D-NORM', deviceName: 'Normalized Device', provider: 'GoodWe SEMS', status: 'healthy' }, 0, context);
  expect(normalizedDevice.vendor === 'GoodWe' && normalizedDevice.status === 'Online', 'Device provider/status normalization is incorrect.');

  const realAlert = contracts.alerts.map({ id: 'A-LIVE', provider: 'DeyeCloud', sourceAlertId: 'ALARM-1', title: 'Alarm 1', message: 'Generated alarm', severity: 'Critical', vendorExtensions: { alarmCode: 'ALARM-1', alarmType: 'Operational', reason: 'Generated reason', solution: 'Inspect source' } }, 0, context);
  expect(realAlert.zentridCode === 'ALARM-1' && realAlert.category === 'Operational' && realAlert.probableCause === 'Generated reason' && realAlert.recommendation === 'Inspect source', 'Actual Alert vendorExtensions aliases are not mapped.');

  const normalizedAlert = contracts.alerts.map({ id: 'A-NORM', title: 'Normalized Alert', provider: 'Sungrow iSolarCloud', status: 'raised', severity: 'major' }, 0, context);
  expect(normalizedAlert.vendor === 'Sungrow' && normalizedAlert.status === 'Open' && normalizedAlert.severity === 'High', 'Alert provider/status/severity normalization is incorrect.');

  const registryIntegration = contracts.integrations.map({ id: 'I-LIVE', integrationName: 'Deye Registry', integrationCode: 'INT-001', providerName: 'DeyeCloud', vendorName: 'DeyeCloud', integrationStatus: 'Failed', createdAtUtc: '2026-07-14T10:18:55Z' }, 0, context);
  expect(registryIntegration.id === 'I-LIVE' && registryIntegration.code === 'INT-001' && registryIntegration.status === 'Failed' && registryIntegration.vendor === 'DeyeCloud', 'Actual Provider Integration registry aliases are not mapped.');

  expect(contracts.normalization.country('AM') === 'Armenia', 'Public country normalization contract is unavailable.');
  expect(contracts.normalization.clientType('Commercial') === 'Legal Entity', 'Public client type normalization contract is unavailable.');
  expect(contracts.normalization.plantStatus('Online') === 'Normal', 'Public plant status normalization contract is unavailable.');

  const list = contracts.devices.mapList([{ id: 'D-1' }, { id: 'D-2' }], context);
  expect(list.length === 2 && list[1].id === 'D-2', 'Contract mapList is incorrect.');
}

if (failures.length) {
  console.error('API contract checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`API contract checks OK: 7 DTO contracts, 7 mapper contracts and ${contractPages} active repository page load orders verified.`);
