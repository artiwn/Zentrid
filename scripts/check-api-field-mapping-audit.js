const { existsSync, readFileSync } = require('fs');
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

const source = read('assets/js/api-contracts.ts');
const consoleSource = read('assets/js/api-console.ts');
const css = read('assets/css/src/80-auth-and-api-console.css');
const globals = read('types/zentrid-globals.d.ts');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'FleetFieldMappingDefinition', 'FleetFieldAuditRecord', 'FleetFieldAuditSummary', 'FleetFieldAuditApi'
].forEach(name => expect(globals.includes(`interface ${name}`), `Missing global field-audit type: ${name}.`));
[
  'FIELD_MAPPING_MANIFEST', 'auditFieldMapping', 'flattenLeafPaths', 'sourceByCanonical',
  'missingExpectedFields', 'unmappedFields', 'fieldAudit'
].forEach(token => expect(source.includes(token), `Missing field-audit implementation token: ${token}.`));
[
  'API Field Mapping Audit', 'runApiFieldAudit', 'apiFieldAuditPanel', 'apiFieldAuditEntity',
  'Mapped / Raw', 'UI targets', 'Unmapped source fields'
].forEach(token => expect(consoleSource.includes(token), `Missing API Console field-audit token: ${token}.`));
[
  '.api-field-audit-summary', '.api-field-map-table', '.api-audit-metrics', '.api-field-audit-details'
].forEach(selector => expect(css.includes(selector), `Missing field-audit CSS selector: ${selector}.`));
expect(packageJson.scripts?.['check:api-field-mapping-audit'] === 'node scripts/check-api-field-mapping-audit.js', 'Missing check:api-field-mapping-audit package script.');

function firstOf(row, keys, fallback = '') {
  for (const key of keys) {
    let value = row;
    for (const part of String(key).split('.')) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) { value = undefined; break; }
      value = value[part];
    }
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}
const context = {
  safeText(value, fallback = '—') { return value === undefined || value === null || value === '' ? String(fallback) : String(value); },
  firstOf,
  displayName(row, keys, entityLabel, index, typeHint) { return String(firstOf(row, keys, `${typeHint || entityLabel} ${index + 1}`)); },
  formatDate(value, fallback = 'No data') { return value ? String(value) : fallback; },
  integrationVendor(value) {
    const text = String(value || '').trim();
    if (/deye/i.test(text)) return 'DeyeCloud';
    if (/solax/i.test(text)) return 'SolaX';
    return text || 'Unknown';
  },
  integrationSoftware(value) { return /solax/i.test(String(value || '')) ? 'SolaX Cloud' : String(value || 'Unknown'); }
};

const sandbox = { window: {}, console, String, Number, Boolean, Array, Object, Math, Set, Map, Date };
vm.createContext(sandbox);
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;
vm.runInContext(compiled, sandbox, { filename: 'api-contracts.js' });
const contracts = sandbox.window.FleetAPIContracts;
expect(Boolean(contracts?.fieldAudit), 'FleetAPIContracts.fieldAudit did not initialize.');

if (contracts?.fieldAudit) {
  const fixtures = {
    clients: {
      id: 'C-1', clientCode: 'CLIENT-001', clientName: 'Client One', managingTenant: 'Tenant One', clientType: 'Commercial',
      accountActivation: 'Active', status: 'Active', country: 'AM', region: 'Yerevan', city: 'Yerevan', email: 'client@example.invalid',
      phoneNumber1: '+374000000', username: 'client-one', hasClientPassportFile: false, hasStateRegistrationDocumentFile: false,
      hasProjectDocFile: false, createdAtUtc: '2026-07-15T00:00:00Z', updatedAtUtc: null
    },
    tenants: {
      id: 'T-1', tenantCode: 'TENANT-001', tenantName: 'Tenant One', legalName: 'Tenant One LLC', country: 'AM',
      tenantStatus: 'Active', tenantType: 'Owner', createdAtUtc: '2026-07-14T00:00:00Z', updatedAtUtc: null
    },
    plants: {
      id: 'P-1', provider: 'DeyeCloud', sourcePlantId: 'SRC-P-1', name: 'Plant One', status: 'Online', currentPowerKw: 9,
      todayEnergyKwh: 121, totalEnergyKwh: 80080, installedPowerKw: 41, lastDataAt: '2026-07-14T15:45:00Z',
      lastSyncAt: '2026-07-14T15:45:00Z', dataQualityStatus: 'Complete', vendorExtensions: {
        runId: 'run-1', ordinal: 1, seedMode: 'generated-count', sourceSystem: 'Seeder', sourceEntityType: 'Plant', plantCode: 'SRC-P-1',
        communicationStatus: 'Connected', batteryCapacityKwh: 16, monthlyYieldKwh: 3601, yearlyYieldKwh: 42003, alarmCount: 100,
        warningCount: 1, onlineDeviceCount: 2, offlineDeviceCount: 0, dataFreshness: 'Fresh', canonicalSource: 'CanonicalPlants'
      }
    },
    devices: {
      id: 'D-1', provider: 'DeyeCloud', sourceDeviceId: 'INV-1', sourcePlantId: 'SRC-P-1', name: 'Inverter One', deviceType: 'Inverter',
      status: 'Online', serialNumber: 'INV-1', plantName: 'Plant One', lastSeenAt: '2026-07-14T15:45:00Z', lastSyncAt: '2026-07-14T15:45:00Z',
      dataQualityStatus: 'Complete', vendorExtensions: { runId: 'run-1', ordinal: 1, seedMode: 'generated-count', rawStatus: 'Online',
        onlineStatus: 'Online', alarmStatus: 'Normal', rawDeviceType: 'Inverter', sourcePlantId: 'SRC-P-1', plantName: 'Plant One',
        sourceSystem: 'Seeder', sourceEntityType: 'Device', vendorModel: 'Deye Model', productModel: 'Inverter', ratedPowerKw: 50,
        firmwareVersion: '1.0.0', protocolVersion: '1', parentDeviceId: 'LOGGER-1', dataFreshness: 'Fresh', canonicalSource: 'CanonicalDevices' }
    },
    alerts: {
      id: 'A-1', provider: 'DeyeCloud', sourceAlertId: 'ALARM-1', sourcePlantId: 'SRC-P-1', sourceDeviceId: 'INV-1', plantName: 'Plant One',
      deviceName: 'Inverter One', title: 'Alarm One', message: 'Generated alarm.', severity: 'Critical', status: 'Active',
      occurredAtUtc: '2026-07-14T14:45:00Z', lastSyncAt: '2026-07-14T14:45:00Z', vendorExtensions: {
        runId: 'run-1', ordinal: 1, seedMode: 'generated-count', alarmCode: 'ALARM-1', alarmType: 'Operational', reason: 'Reason',
        solution: 'Solution', deviceSn: 'INV-1', acknowledgedAtUtc: '2026-07-14T14:55:00Z', canonicalSource: 'CanonicalAlarms'
      }
    },
    integrations: {
      provider: 'DeyeCloud', displayName: 'DeyeCloud', status: 'Warning', plantsCount: 50000, plantsWithDataCount: 50000,
      stalePlantsCount: 50000, devicesCount: 100000, alertsCount: 2500000, errorRatePct: 100, lastSyncAtUtc: '2026-07-14T15:45:00Z',
      lastSyncText: '1 d ago', lastErrorMessage: 'Stale data', vendorExtensions: { provider: 'DeyeCloud', displayName: 'DeyeCloud',
        plantsCount: 50000, plantsWithDataCount: 50000, plantsWithoutDataCount: 0, stalePlantsCount: 50000, devicesCount: 100000,
        activeAlertsCount: 2500000 }
    }
  };

  contracts.fieldAudit.clear();
  Object.entries(fixtures).forEach(([entity, fixture]) => contracts[entity].map(fixture, 0, context));
  const summary = contracts.fieldAudit.summary();
  expect(summary.records === 6, `Expected 6 audited records, received ${summary.records}.`);
  expect(summary.missingExpectedFields === 0, `Known backend fixtures produced ${summary.missingExpectedFields} missing expected field(s).`);
  expect(summary.unmappedFields === 0, `Known backend fixtures produced ${summary.unmappedFields} unmapped field(s).`);

  const manifest = contracts.fieldAudit.manifest();
  ['clients', 'tenants', 'plants', 'devices', 'alerts', 'integrations'].forEach(entity => {
    expect(Array.isArray(manifest[entity]) && manifest[entity].length >= 10, `${entity} mapping manifest is incomplete.`);
    expect(manifest[entity].every(item => item.uiTargets.length > 0), `${entity} contains mapping entries without UI targets.`);
  });

  const deviceAudit = contracts.fieldAudit.list('devices')[0];
  expect(deviceAudit.sourceByCanonical.ratedPowerKw === 'vendorExtensions.ratedPowerKw', 'Device ratedPowerKw source alias was not recorded.');
  const mappedDevice = contracts.devices.map(fixtures.devices, 1, context);
  expect(mappedDevice.capacity === '50 kW', 'Device ratedPowerKw was not mapped into capacity.');
  expect(mappedDevice.firmware === '1.0.0', 'Device firmwareVersion was not mapped.');

  const mappedAlert = contracts.alerts.map(fixtures.alerts, 1, context);
  expect(mappedAlert.probableCause === 'Reason', 'Alert reason was not mapped to probableCause.');
  expect(mappedAlert.recommendation === 'Solution', 'Alert solution was not mapped to recommendation.');

  const mappedIntegration = contracts.integrations.map(fixtures.integrations, 1, context);
  expect(mappedIntegration.stalePlants === 50000, 'Integration stalePlantsCount was not mapped.');
  expect(mappedIntegration.errorRate === 100, 'Integration errorRatePct was not mapped.');

  contracts.devices.map({ ...fixtures.devices, newlyAddedBackendField: 'new-value' }, 2, context);
  const changed = contracts.fieldAudit.list('devices').find(item => item.index === 2);
  expect(changed?.unmappedFields.includes('newlyAddedBackendField'), 'New backend fields are not reported as unmapped.');

  contracts.clients.map({ id: 'C-MISSING' }, 4, context);
  const missing = contracts.fieldAudit.list('clients').find(item => item.index === 4);
  expect(missing?.missingExpectedFields.includes('name'), 'Missing expected canonical fields are not reported.');
}

if (failures.length) {
  console.error('API field mapping audit checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('API field mapping audit OK: manifests, real DTO aliases, UI targets, fallback tracking, unmapped-field detection and normalized output verified.');
