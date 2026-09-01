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
  'ZentridFieldMappingDefinition', 'ZentridFieldAuditRecord', 'ZentridFieldAuditSummary', 'ZentridFieldAuditApi'
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
const contracts = sandbox.window.ZentridAPIContracts;
expect(Boolean(contracts?.fieldAudit), 'ZentridAPIContracts.fieldAudit did not initialize.');

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
    telemetry: { telemetryId: 'TM-001', metricName: 'Current Power', value: 1250, unit: 'kW', measuredAtUtc: '2026-07-22T08:00:00Z', sourcePlantId: 'PLANT-001', sourceDeviceId: 'INV-001', dataQualityStatus: 'Fresh', provider: 'DeyeCloud' },
    integrations: {
      provider: 'DeyeCloud', displayName: 'DeyeCloud', status: 'Warning', plantsCount: 50000, plantsWithDataCount: 50000,
      stalePlantsCount: 50000, devicesCount: 100000, alertsCount: 2500000, errorRatePct: 100, lastSyncAtUtc: '2026-07-14T15:45:00Z',
      lastSyncText: '1 d ago', lastErrorMessage: 'Stale data', vendorExtensions: { provider: 'DeyeCloud', displayName: 'DeyeCloud',
        plantsCount: 50000, plantsWithDataCount: 50000, plantsWithoutDataCount: 0, stalePlantsCount: 50000, devicesCount: 100000,
        activeAlertsCount: 2500000 }
    }
  };

  // Current 2026-08-31 backend shapes observed by the live API Field Mapping Audit.
  Object.assign(fixtures.clients, {
    tenantLink: { clientType: 'Legal Entity', status: 'Active', activationAt: '2026-08-01T08:00:00Z' },
    identity: { firstName: 'Ani', lastName: 'Example', middleName: 'A', companyName: 'Client One LLC', legalForm: 'LLC', registrationNumber: 'REG-1', taxIdVatNumber: 'VAT-1', role: 'Owner Viewer', preferredLanguage: 'EN', dateOfBirth: '1990-01-01' },
    preferences: { timeZone: 'Asia/Yerevan', temperatureUnit: '°C', currency: 'AMD', irradiationUnit: 'kWh/m2', language: 'EN' },
    primaryContact: { phoneNumber1: '+374111111', email: 'primary@example.invalid', fullName: 'Primary Contact' },
    portalAccount: { username: 'client-one', role: 'End User' },
    documentation: { identityDocument: true, registrationDocument: true },
    bankAccounts: [{ bankName: 'Bank' }], verification: 'Verified', accessScope: 'Assigned plants', exportPolicy: 'Allowed',
    documentRecords: [{ id: 'DOC-1', name: 'Registration' }], portalUsers: [{ username: 'client-one' }], accountManager: 'Manager One'
  });
  Object.assign(fixtures.tenants, {
    generalInformation: { tenantId: 'T-1', tenantCode: 'TENANT-001', entityType: 'Legal Entity', tenantName: 'Tenant One', displayName: 'Tenant One', legalName: 'Tenant One LLC', tradeName: 'Tenant', registrationNumber: 'REG-T1', taxIdVatNumber: 'VAT-T1', tenantStatus: 'Active', tenantType: 'Owner', accountManager: 'Manager', industrySector: 'Solar', businessCategory: 'Energy', parentCompany: 'Parent Co', numberOfEmployees: 20, annualRevenueRange: '1M-5M', website: 'example.invalid', country: 'AM', notes: 'General notes' },
    addressInformation: { legalAddress: { country: 'AM', stateRegion: 'Yerevan', city: 'Yerevan', streetAddress: '1 Main St', buildingNumber: '1', postalCode: '0001' }, businessAddressSameAsLegalAddress: false, businessAddress: { country: 'AM', stateRegion: 'Yerevan', city: 'Yerevan', streetAddress: '2 Main St', buildingNumber: '2', postalCode: '0002' }, notes: 'Address notes' },
    contactPersons: { contacts: [{ fullName: 'Tenant Contact', mobilePhone: '+374222222' }], notes: 'Contact notes' },
    tenantClassification: { tenantCategory: 'Enterprise', accountTier: 'Gold', tenantPriority: 'High', riskCategory: 'Low', acquisitionSource: 'Direct', notes: 'Classification notes' },
    communicationPreferences: { preferredLanguage: 'EN', preferredTimeZone: 'Asia/Yerevan', preferredCommunicationChannel: 'Email', businessHours: '09:00-18:00', receivePlatformNotifications: true, receiveServiceNotifications: true, receiveInvoiceNotifications: true, receiveSecurityNotifications: true, notificationRecipients: ['ops@example.invalid'], notes: 'Communication notes' },
    legalCompliance: { dataProcessingAgreement: 'Signed', ndaStatus: 'Signed', complianceStatus: 'Compliant', confidentialityLevel: 'Internal', dataControllerType: 'Controller', consentStatus: 'Valid', consentExpiryDate: '2027-08-31', documents: [{ id: 'TDOC-1' }], notes: 'Legal notes' }
  });
  Object.assign(fixtures.plants, { creationMode: 'ProviderImport' });
  Object.assign(fixtures.plants.vendorExtensions, { address: 'Plant address', latitude: 40.1, longitude: 44.5 });
  Object.assign(fixtures.devices, { tenantId: 'T-1', tenant: 'Tenant One', integration: 'Deye Integration', subtype: 'String Inverter', alertsCount: 2, parentDeviceName: 'Logger 1', childCount: 3 });
  Object.assign(fixtures.devices.vendorExtensions, { productId: 'PRODUCT-1', connectStatus: 'Connected', collectionTime: '2026-08-31T12:00:00Z', childCount: 3, rawPayloadRef: 'raw://device/1' });
  Object.assign(fixtures.alerts, { plantId: 'P-1', deviceId: 'D-1', plant: 'Plant One', device: 'Inverter One', tenant: 'Tenant One', tenantId: 'T-1', category: 'Operational', canonicalCode: 'FL-001', canonicalName: 'Canonical Alarm', canonicalCategory: 'Operational', canonicalSeverity: 'Critical', mappingStatus: 'Mapped', priority: 'P1', occurrenceStatus: 'Open', created: '2026-07-14T14:45:00Z', updated: '2026-07-14T14:55:00Z', zentridCode: 'FL-001', vendorRawCode: 'RAW-001', vendorMessage: 'Vendor message', vendorSeverity: 'High', source: 'DeyeCloud', owner: 'Operator', sla: '2h' });
  fixtures.telemetry = { telemetryId: 'TM-001', metricCode: 'Current Power', textValue: '1250', booleanValue: true, unit: 'kW', timestampUtc: '2026-07-22T08:00:00Z', sourcePlantId: 'PLANT-001', sourceDeviceId: 'INV-001', dataQualityStatus: 'Fresh', provider: 'DeyeCloud', granularity: '5m' };

  contracts.fieldAudit.clear();
  Object.entries(fixtures).forEach(([entity, fixture]) => contracts[entity].map(fixture, 0, context));
  const summary = contracts.fieldAudit.summary();
  expect(summary.records === 7, `Expected 7 audited records, received ${summary.records}.`);
  expect(summary.missingExpectedFields === 0, `Known backend fixtures produced ${summary.missingExpectedFields} missing expected field(s).`);
  expect(summary.unmappedFields === 0, `Known backend fixtures produced ${summary.unmappedFields} unmapped field(s).`);

  const manifest = contracts.fieldAudit.manifest();
  ['clients', 'tenants', 'plants', 'devices', 'alerts', 'telemetry', 'integrations'].forEach(entity => {
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

  const mappedTelemetry = contracts.telemetry.map(fixtures.telemetry, 1, context);
  expect(mappedTelemetry.metric === 'Current Power' && mappedTelemetry.displayValue === '1250 kW' && mappedTelemetry.granularity === '5m', 'Telemetry metric/value/unit/granularity were not mapped.');
  expect(mappedTelemetry.plantId === 'PLANT-001' && mappedTelemetry.deviceId === 'INV-001', 'Telemetry relations were not mapped.');

  // 2026-08-31 backend Mapping Report: providerData + operationalData must enrich the Registry Plant without being lost.
  const backendPlant = {
    id: 'REG-P-1',
    plantCode: 'provider-sungrow-hash',
    plantName: 'Backend Sungrow Plant',
    clientAssignment: { clientId: 'C-1', client: 'CLIENT-001', managingTenant: 'Tenant One' },
    vendorPlatform: { sourceScheme: 'Provider synchronization', recordStatus: 'Draft', creationMode: 'Automatic provider provisioning', payloadStrategy: null },
    location: { address: 'F94H+7C Ara, Armenia', plantTimeZone: 'GMT+4', latitude: '40.4554756', longitude: '44.3853467' },
    technical: { plantName: 'Backend Sungrow Plant', installedCapacityDcMw: 0.0048, installedCapacityAcMw: null, gridConnectionCapacityMw: null, batteryCapacityKwh: null, commissioningDate: null, serviceProvider: null, externalReference: 'sungrow:account:1689175' },
    commercial: { currency: null, unitPrice: null, tariffType: null, totalCost: null, subsidy: null, dailyRepayment: null, ownerEmail: null },
    devices: [{ id: 'D-1' }, { id: 'D-2' }],
    stringCapacity: { stringCapacities: [] },
    otherInfo: { plantLogoFileName: null, safeRunningStartDate: null, totalYieldStatistics: null },
    providerData: { provider: 'sungrow', providerAccount: 'pv.monitoring@example.invalid', sourceEntityId: '1689175', sourcePlantCode: '1689175_11_0_0', providerStatus: 'Offline', currentPowerKw: null, rawPayloadRef: 'raw-plant-1', lastSyncAtUtc: '2026-08-26T17:30:48Z', extensions: { ps_type: 4 } },
    operationalData: { canonicalPlantId: 'LIVE-P-1', clientId: 'C-1', clientName: 'Client One', tenantId: 'T-1', tenantName: 'Tenant One', status: 'Offline', communicationStatus: null, dataQualityStatus: 'RawMapped', dataFreshness: 'Current', installedCapacityKwp: 4.8, batteryCapacityKwh: null, currentPowerKw: null, todayEnergyKwh: null, totalEnergyKwh: 3573.5, deviceCount: 2, openAlertCount: 0, lastDataAtUtc: '2026-08-25T20:00:23Z', lastSyncAtUtc: '2026-08-26T17:30:48Z' },
    documents: null,
    createdAtUtc: '2026-08-26T17:17:57Z',
    updatedAtUtc: '2026-08-26T17:31:12Z'
  };
  const mappedBackendPlant = contracts.plants.map(backendPlant, 7, context);
  expect(mappedBackendPlant.vendor === 'Sungrow', 'Plant providerData.provider was not mapped to vendor.');
  expect(mappedBackendPlant.sourcePlantId === '1689175', 'Plant providerData.sourceEntityId was not mapped to sourcePlantId.');
  expect(mappedBackendPlant.providerAccount === 'pv.monitoring@example.invalid', 'Plant providerData.providerAccount was not mapped.');
  expect(mappedBackendPlant.canonicalPlantId === 'LIVE-P-1' && mappedBackendPlant.registryPlantId === 'REG-P-1', 'Plant Registry/operational identity split was not preserved.');
  expect(mappedBackendPlant.health === 'Offline', 'Plant operationalData.status was not mapped to health.');
  expect(mappedBackendPlant.creationMode === 'Automatic provider provisioning', 'Plant vendorPlatform.creationMode was not mapped.');
  expect(mappedBackendPlant.capacityDc === 0.0048, 'Plant installed DC capacity was not mapped from backend detail.');
  expect(mappedBackendPlant.devices === 2 && mappedBackendPlant.alerts === 0, 'Plant operational device/alert counts were not mapped.');
  expect(mappedBackendPlant.totalEnergy === 3573.5, 'Plant operationalData.totalEnergyKwh was not mapped.');
  expect(mappedBackendPlant.lastDataAt === '2026-08-25T20:00:23Z' && mappedBackendPlant.lastSyncAt === '2026-08-26T17:30:48Z', 'Plant operational freshness timestamps were not mapped.');
  expect(mappedBackendPlant.dataQualityStatus === 'RawMapped' && mappedBackendPlant.dataFreshness === 'Current', 'Plant backend quality/freshness states were not mapped.');
  const backendPlantAudit = contracts.fieldAudit.list('plants').find(item => item.index === 7);
  expect((backendPlantAudit?.unmappedFields || []).length === 0, `Backend Plant fixture contains unmapped fields: ${(backendPlantAudit?.unmappedFields || []).join(', ')}`);

  const deviceWithoutManufacturer = contracts.devices.map({ ...fixtures.devices, identity: { deviceName: 'Inverter', deviceType: 'Inverter', serialNumber: 'SN-1', manufacturer: null, model: 'SG3.0RS' }, source: { provider: 'sungrow', sourceDeviceId: 'SRC-D-1' } }, 8, context);
  expect(deviceWithoutManufacturer.manufacturer === '—', 'Device provider must not be substituted as manufacturer when backend manufacturer is empty.');
  expect(deviceWithoutManufacturer.vendor === 'Sungrow', 'Device provider must remain available separately from manufacturer.');

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
