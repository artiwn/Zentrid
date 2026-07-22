/* Zentrid API contract and mapping layer.
   Backend DTO compatibility belongs here; page renderers consume normalized view models. */
(function () {
  type ContractRecord = Record<string, ZentridLegacyCompat>;

  interface ZentridApiBaseDto extends ContractRecord {
    id?: unknown;
    status?: unknown;
    provider?: unknown;
    vendorExtensions?: ContractRecord;
  }

  interface ZentridClientDto extends ZentridApiBaseDto { plants?: unknown[]; }
  interface ZentridTenantDto extends ZentridApiBaseDto {}
  interface ZentridPlantDto extends ZentridApiBaseDto {
    sourcePlantId?: unknown;
    currentPowerKw?: unknown;
    installedPowerKw?: unknown;
    todayEnergyKwh?: unknown;
    totalEnergyKwh?: unknown;
    lastDataAt?: unknown;
    dataQualityStatus?: unknown;
  }
  interface ZentridDeviceDto extends ZentridApiBaseDto {
    sourceDeviceId?: unknown;
    sourcePlantId?: unknown;
    serialNumber?: unknown;
    lastSeenAt?: unknown;
    dataQualityStatus?: unknown;
  }
  interface ZentridAlertDto extends ZentridApiBaseDto {
    sourceAlertId?: unknown;
    sourcePlantId?: unknown;
    sourceDeviceId?: unknown;
    title?: unknown;
    message?: unknown;
    severity?: unknown;
    occurredAtUtc?: unknown;
    lastSyncAt?: unknown;
  }
  interface ZentridTelemetryDto extends ZentridApiBaseDto {
    telemetryId?: unknown;
    metric?: unknown;
    metricName?: unknown;
    value?: unknown;
    unit?: unknown;
    timestamp?: unknown;
    sourcePlantId?: unknown;
    sourceDeviceId?: unknown;
    dataQualityStatus?: unknown;
  }
  interface ZentridIntegrationDto extends ZentridApiBaseDto {
    providerType?: unknown;
    vendor?: unknown;
    displayName?: unknown;
    name?: unknown;
    integrationName?: unknown;
    plantsCount?: unknown;
    plantCount?: unknown;
    plants?: unknown;
    devicesCount?: unknown;
    deviceCount?: unknown;
    devices?: unknown;
    alertsCount?: unknown;
    alertCount?: unknown;
    alerts?: unknown;
    plantsWithDataCount?: unknown;
    lastSyncText?: unknown;
    lastSyncAtUtc?: unknown;
    lastErrorMessage?: unknown;
  }

  type ZentridContractMapperContext = {
    safeText(value: unknown, fallback?: unknown): string;
    firstOf(row: ContractRecord, keys: string[], fallback?: unknown): unknown;
    displayName(row: ContractRecord, keys: string[], entityLabel: string, index: number, typeHint?: unknown): string;
    formatDate(value: unknown, fallback?: string): string;
    integrationVendor(value: unknown): string;
    integrationSoftware(value: unknown): string;
  };

  type ZentridContractEntity = 'clients' | 'tenants' | 'plants' | 'devices' | 'alerts' | 'telemetry' | 'integrations';
  type ZentridContractSeverity = 'error' | 'warning';
  type ZentridContractExpectedType = 'scalar' | 'number';
  type ZentridContractIssueCode = 'INVALID_RECORD' | 'MISSING_REQUIRED_FIELD' | 'INVALID_FIELD_TYPE';

  type ZentridContractIssue = {
    entity: ZentridContractEntity;
    entityLabel: string;
    index: number;
    severity: ZentridContractSeverity;
    code: ZentridContractIssueCode;
    field: string;
    aliases: string[];
    message: string;
  };

  type ZentridContractValidation = {
    entity: ZentridContractEntity;
    valid: boolean;
    issues: ZentridContractIssue[];
  };

  type ZentridContractRequirement = {
    field: string;
    aliases: string[];
    severity: ZentridContractSeverity;
    expected: ZentridContractExpectedType;
  };

  type ZentridContractDefinition = {
    entity: ZentridContractEntity;
    label: string;
    requirements: ZentridContractRequirement[];
    optionalNumbers?: string[];
  };

  type ZentridContractDiagnosticSummary = {
    total: number;
    errors: number;
    warnings: number;
    affectedEntities: ZentridContractEntity[];
  };


  type ZentridFieldFormat = 'identifier' | 'text' | 'status' | 'date' | 'count' | 'email' | 'phone' | 'relation' | 'power' | 'energy' | 'boolean' | 'raw';

  type ZentridFieldMappingDefinition = {
    canonicalField: string;
    aliases: string[];
    uiTargets: string[];
    format: ZentridFieldFormat;
    fallback: string;
    required?: ZentridContractSeverity;
  };

  type ZentridFieldAuditRecord = {
    entity: ZentridContractEntity;
    index: number;
    mappedFields: string[];
    fallbackFields: string[];
    missingExpectedFields: string[];
    unmappedFields: string[];
    sourceByCanonical: Record<string, string>;
    rawFieldCount: number;
  };

  type ZentridFieldAuditEntitySummary = {
    entity: ZentridContractEntity;
    records: number;
    rawFields: number;
    mappedFields: number;
    fallbackFields: number;
    missingExpectedFields: number;
    unmappedFields: number;
  };

  type ZentridFieldAuditSummary = {
    records: number;
    rawFields: number;
    mappedFields: number;
    fallbackFields: number;
    missingExpectedFields: number;
    unmappedFields: number;
    affectedEntities: ZentridContractEntity[];
    byEntity: ZentridFieldAuditEntitySummary[];
  };

  type ZentridEntityContract<TDto extends ZentridApiBaseDto> = {
    parse(value: unknown): TDto | null;
    validate(value: unknown, index?: number): ZentridContractValidation;
    map(value: unknown, index: number, context: ZentridContractMapperContext): ContractRecord;
    mapList(values: unknown[], context: ZentridContractMapperContext): ContractRecord[];
  };

  function isRecord(value: unknown): value is ContractRecord {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  function parseDto<TDto extends ZentridApiBaseDto>(value: unknown): TDto | null {
    return isRecord(value) ? value as TDto : null;
  }

  function pathValue(row: ContractRecord, path: string): unknown {
    let current: unknown = row;
    for (const part of path.split('.')) {
      if (!isRecord(current) || !(part in current)) return undefined;
      current = current[part];
    }
    return current;
  }

  function firstAlias(row: ContractRecord, aliases: string[]): { alias: string; value: unknown } | null {
    for (const alias of aliases) {
      const value = pathValue(row, alias);
      if (value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')) return { alias, value };
    }
    return null;
  }

  function matchesExpectedType(value: unknown, expected: ZentridContractExpectedType): boolean {
    if (expected === 'number') {
      if (typeof value === 'number') return Number.isFinite(value);
      return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
    }
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  }

  const diagnosticIssues: ZentridContractIssue[] = [];
  const diagnosticFingerprints = new Set<string>();

  const diagnostics = {
    clear(entity?: ZentridContractEntity): void {
      if (!entity) {
        diagnosticIssues.splice(0, diagnosticIssues.length);
        diagnosticFingerprints.clear();
        return;
      }
      for (let index = diagnosticIssues.length - 1; index >= 0; index -= 1) {
        if (diagnosticIssues[index]!.entity === entity) diagnosticIssues.splice(index, 1);
      }
      diagnosticFingerprints.clear();
      diagnosticIssues.forEach(issue => diagnosticFingerprints.add(`${issue.entity}|${issue.index}|${issue.code}|${issue.field}|${issue.message}`));
    },
    report(issues: ZentridContractIssue[]): void {
      issues.forEach(issue => {
        const fingerprint = `${issue.entity}|${issue.index}|${issue.code}|${issue.field}|${issue.message}`;
        if (diagnosticFingerprints.has(fingerprint)) return;
        diagnosticFingerprints.add(fingerprint);
        diagnosticIssues.push(issue);
      });
    },
    list(entity?: ZentridContractEntity): ZentridContractIssue[] {
      return diagnosticIssues.filter(issue => !entity || issue.entity === entity).map(issue => ({ ...issue, aliases: [...issue.aliases] }));
    },
    summary(entity?: ZentridContractEntity): ZentridContractDiagnosticSummary {
      const issues = diagnosticIssues.filter(issue => !entity || issue.entity === entity);
      return {
        total: issues.length,
        errors: issues.filter(issue => issue.severity === 'error').length,
        warnings: issues.filter(issue => issue.severity === 'warning').length,
        affectedEntities: Array.from(new Set(issues.map(issue => issue.entity)))
      };
    }
  };

  function validateContract(value: unknown, index: number, definition: ZentridContractDefinition): ZentridContractValidation {
    if (!isRecord(value)) {
      return {
        entity: definition.entity,
        valid: false,
        issues: [{
          entity: definition.entity,
          entityLabel: definition.label,
          index,
          severity: 'error',
          code: 'INVALID_RECORD',
          field: 'record',
          aliases: [],
          message: `${definition.label} record must be a JSON object.`
        }]
      };
    }

    const issues: ZentridContractIssue[] = [];
    definition.requirements.forEach(requirement => {
      const matched = firstAlias(value, requirement.aliases);
      if (!matched) {
        issues.push({
          entity: definition.entity,
          entityLabel: definition.label,
          index,
          severity: requirement.severity,
          code: 'MISSING_REQUIRED_FIELD',
          field: requirement.field,
          aliases: [...requirement.aliases],
          message: `${definition.label} record is missing ${requirement.field}. Accepted fields: ${requirement.aliases.join(', ')}.`
        });
        return;
      }
      if (!matchesExpectedType(matched.value, requirement.expected)) {
        issues.push({
          entity: definition.entity,
          entityLabel: definition.label,
          index,
          severity: requirement.severity,
          code: 'INVALID_FIELD_TYPE',
          field: requirement.field,
          aliases: [...requirement.aliases],
          message: `${definition.label} field ${matched.alias} must be ${requirement.expected === 'number' ? 'numeric' : 'a scalar value'}.`
        });
      }
    });

    (definition.optionalNumbers || []).forEach(field => {
      const valueAtPath = pathValue(value, field);
      if (valueAtPath === undefined || valueAtPath === null || valueAtPath === '') return;
      if (!matchesExpectedType(valueAtPath, 'number')) {
        issues.push({
          entity: definition.entity,
          entityLabel: definition.label,
          index,
          severity: 'warning',
          code: 'INVALID_FIELD_TYPE',
          field,
          aliases: [field],
          message: `${definition.label} field ${field} should be numeric when provided.`
        });
      }
    });

    return { entity: definition.entity, valid: !issues.some(issue => issue.severity === 'error'), issues };
  }

  function createContract<TDto extends ZentridApiBaseDto>(definition: ZentridContractDefinition, mapper: (dto: TDto, index: number, context: ZentridContractMapperContext) => ContractRecord): ZentridEntityContract<TDto> {
    return {
      parse: parseDto<TDto>,
      validate(value, index = 0) {
        return validateContract(value, index, definition);
      },
      map(value, index, context) {
        const dto = parseDto<TDto>(value);
        const validation = validateContract(value, index, definition);
        diagnostics.report(validation.issues);
        const mappingAudit = auditFieldMapping(definition.entity, value, index);
        const mapped = mapper(dto || {} as TDto, index, context);
        mapped.contractEntity = definition.entity;
        mapped.contractValid = validation.valid;
        mapped.contractIssues = validation.issues;
        mapped.fieldAudit = mappingAudit;
        return mapped;
      },
      mapList(values, context) {
        diagnostics.clear(definition.entity);
        fieldAudit.clear(definition.entity);
        return (Array.isArray(values) ? values : []).map((value, index) => this.map(value, index, context));
      }
    };
  }

  function requirement(field: string, aliases: string[], severity: ZentridContractSeverity = 'error', expected: ZentridContractExpectedType = 'scalar'): ZentridContractRequirement {
    return { field, aliases, severity, expected };
  }

  const CONTRACT_DEFINITIONS: Record<ZentridContractEntity, ZentridContractDefinition> = {
    clients: {
      entity: 'clients', label: 'Client',
      requirements: [
        requirement('identity', ['id', 'clientId', 'canonicalId', 'sourceEntityId', 'externalId'], 'warning'),
        requirement('display name', ['vendorExtensions.clientName', 'sourceClientName', 'clientName', 'displayName', 'legalName', 'companyName', 'fullName', 'name'])
      ],
      optionalNumbers: ['plantCount', 'plantsCount', 'assignedPlantCount', 'deviceCount', 'devicesCount']
    },
    tenants: {
      entity: 'tenants', label: 'Tenant',
      requirements: [
        requirement('identity', ['id', 'tenantId', 'canonicalId', 'sourceEntityId'], 'warning'),
        requirement('display label', ['vendorExtensions.tenantName', 'vendorExtensions.organizationName', 'vendorExtensions.displayName', 'vendorExtensions.name', 'tenant.name', 'tenant.tenantName', 'organization.name', 'organization.organizationName', 'company.name', 'profile.displayName', 'sourceTenantName', 'tenantName', 'organizationName', 'displayName', 'legalName', 'companyName', 'name', 'tenantCode', 'organizationCode', 'externalId', 'tenantId', 'sourceEntityId', 'id'])
      ],
      optionalNumbers: ['setup', 'setupPct', 'onboardingProgress']
    },
    plants: {
      entity: 'plants', label: 'Plant',
      requirements: [
        requirement('identity', ['id', 'plantId', 'canonicalId', 'sourcePlantId']),
        requirement('display name', ['vendorExtensions.plantName', 'sourcePlantName', 'plantName', 'stationName', 'siteName', 'displayName', 'name']),
        requirement('provider', ['provider', 'sourceScheme', 'adminRecord.sourceScheme'], 'warning')
      ],
      optionalNumbers: ['currentPowerKw', 'installedPowerKw', 'todayEnergyKwh', 'totalEnergyKwh']
    },
    devices: {
      entity: 'devices', label: '—',
      requirements: [
        requirement('identity', ['id', 'deviceId', 'canonicalId', 'sourceDeviceId', 'serialNumber']),
        requirement('display name', ['vendorExtensions.deviceName', 'sourceDeviceName', 'deviceName', 'equipmentName', 'displayName', 'sourceEntityName', 'name']),
        requirement('provider', ['provider'], 'warning'),
        requirement('plant relation', ['sourcePlantId', 'plantId'], 'warning')
      ]
    },
    alerts: {
      entity: 'alerts', label: 'Alert',
      requirements: [
        requirement('identity', ['id', 'alertId', 'sourceAlertId']),
        requirement('display text', ['vendorExtensions.alertName', 'sourceAlertName', 'alertName', 'title', 'message', 'name']),
        requirement('severity', ['severity'], 'warning'),
        requirement('provider', ['provider'], 'warning')
      ]
    },
    telemetry: {
      entity: 'telemetry', label: 'Telemetry',
      requirements: [
        requirement('metric', ['metric', 'metricName', 'name', 'key', 'parameter', 'measurement', 'field'], 'warning'),
        requirement('value', ['value', 'metricValue', 'numericValue', 'reading', 'currentValue'], 'warning')
      ]
    },
    integrations: {
      entity: 'integrations', label: 'Integration',
      requirements: [
        requirement('provider', ['provider', 'providerType', 'vendor', 'providerName', 'vendorName', 'producerVendorTemplate', 'vendorExtensions.provider', 'vendorExtensions.providerType', 'vendorExtensions.providerName', 'vendorExtensions.vendorName', 'source.provider', 'source.vendor', 'connector.provider', 'connector.vendor', 'integration.provider', 'integration.vendor', 'providerIntegration.providerType', 'sourceScheme'], 'error'),
        requirement('display name', ['displayName', 'name', 'integrationName', 'vendorExtensions.displayName', 'vendorExtensions.integrationName', 'connector.displayName', 'connector.name', 'integration.displayName', 'integration.name', 'providerIntegration.displayName', 'provider', 'providerType', 'providerName', 'vendorName', 'vendorExtensions.provider'], 'warning'),
        requirement('status', ['status', 'integrationStatus', 'vendorExtensions.status', 'vendorExtensions.integrationStatus', 'health', 'healthStatus', 'connectionStatus', 'lifecycleStatus', 'state', 'connector.status', 'integration.status', 'providerIntegration.status'], 'warning')
      ],
      optionalNumbers: ['plantsCount', 'plantCount', 'plants', 'devicesCount', 'deviceCount', 'devices', 'alertsCount', 'alertCount', 'alerts', 'plantsWithDataCount']
    }
  };

  function field(canonicalField: string, aliases: string[], uiTargets: string[], format: ZentridFieldFormat, fallback = '—', required?: ZentridContractSeverity): ZentridFieldMappingDefinition {
    return { canonicalField, aliases, uiTargets, format, fallback, ...(required ? { required } : {}) };
  }

  const FIELD_MAPPING_MANIFEST: Record<ZentridContractEntity, ZentridFieldMappingDefinition[]> = {
    clients: [
      field('id', ['id', 'clientId', 'canonicalId', 'sourceEntityId', 'externalId'], ['Client Registry row ID', 'Client Detail identity'], 'identifier', '—', 'warning'),
      field('code', ['clientCode', 'code', 'externalId'], ['Client Registry code', 'Client Detail code'], 'identifier', 'ID'),
      field('name', ['vendorExtensions.clientName', 'sourceClientName', 'clientName', 'displayName', 'legalName', 'companyName', 'fullName', 'name'], ['Client Registry name', 'Client Detail heading'], 'text', '—', 'error'),
      field('managingTenant', ['managingTenant', 'tenant', 'tenantName', 'organizationName'], ['Client Registry tenant', 'Client Detail tenant'], 'relation', '—'),
      field('clientType', ['clientType', 'type', 'entityType'], ['Client Registry type', 'Client Detail identity'], 'text', '—'),
      field('accountActivation', ['accountActivation', 'status', 'accountStatus', 'lifecycleStatus'], ['Client Registry status', 'Client Detail status'], 'status', '—'),
      field('country', ['country', 'address.country'], ['Client Registry location', 'Client Detail location'], 'text', '—'),
      field('region', ['region', 'address.region'], ['Client Detail location'], 'text', '—'),
      field('city', ['city', 'address.city'], ['Client Registry city', 'Client Detail location'], 'text', '—'),
      field('address', ['address', 'detailedAddress', 'addressLine'], ['Client Detail address'], 'text', '—'),
      field('email', ['email', 'contactEmail', 'contact.email'], ['Client Registry contact', 'Client Detail contacts'], 'email', '—'),
      field('phoneNumber1', ['phoneNumber1', 'contactPhone', 'phone1', 'phone', 'contact.phone'], ['Client Detail primary phone'], 'phone', '—'),
      field('phoneNumber2', ['phoneNumber2', 'phone2', 'secondaryPhone'], ['Client Detail secondary phone'], 'phone', ''),
      field('username', ['username', 'portalUsername'], ['Client Detail portal access'], 'identifier', ''),
      field('documents', ['hasClientPassportFile', 'hasStateRegistrationDocumentFile', 'hasProjectDocFile', 'documents', 'documentCount'], ['Client Detail documents KPI'], 'boolean', '0'),
      field('createdAt', ['createdAtUtc'], ['Client Detail source/freshness'], 'date', 'No backend timestamp'),
      field('updatedAt', ['updatedAtUtc'], ['Client Registry updated', 'Client Detail source/freshness'], 'date', 'createdAtUtc'),
      field('plants', ['plants', 'plantCount', 'plantsCount', 'assignedPlantCount'], ['Client Registry plants', 'Client Detail assigned plants'], 'count', '0'),
      field('devices', ['deviceCount', 'devicesCount'], ['Client Registry devices'], 'count', '0')
    ],
    tenants: [
      field('id', ['id', 'tenantId', 'canonicalId', 'sourceEntityId'], ['Tenant Registry row ID', 'Tenant Detail identity'], 'identifier', '—', 'warning'),
      field('tenantCode', ['tenantCode', 'code', 'organizationCode', 'externalId'], ['Tenant Registry code', 'Tenant Detail code'], 'identifier', 'ID'),
      field('tenantName', ['vendorExtensions.tenantName', 'vendorExtensions.organizationName', 'vendorExtensions.displayName', 'vendorExtensions.name', 'tenant.name', 'tenant.tenantName', 'organization.name', 'organization.organizationName', 'company.name', 'profile.displayName', 'sourceTenantName', 'tenantName', 'organizationName', 'displayName', 'legalName', 'companyName', 'name', 'tenantCode', 'organizationCode', 'externalId', 'tenantId', 'sourceEntityId', 'id'], ['Tenant Registry name', 'Tenant Detail heading'], 'text', '—', 'warning'),
      field('legalName', ['legalName', 'companyName', 'organizationName'], ['Tenant Detail legal name'], 'text', '—'),
      field('country', ['country', 'address.country', 'vendorExtensions.country'], ['Tenant Registry country', 'Tenant Detail location'], 'text', '—'),
      field('region', ['region', 'address.region', 'vendorExtensions.region'], ['Tenant Detail location'], 'text', '—'),
      field('city', ['city', 'address.city', 'vendorExtensions.city'], ['Tenant Detail location'], 'text', '—'),
      field('tenantStatus', ['tenantStatus', 'status', 'lifecycleStatus', 'accountStatus'], ['Tenant Registry status', 'Tenant lifecycle'], 'status', '—'),
      field('entityType', ['entityType', 'legalEntityType', 'personType'], ['Tenant Detail entity type'], 'text', '—'),
      field('tenantType', ['tenantType', 'type', 'organizationType'], ['Tenant Registry type', 'Tenant Detail tenant type'], 'text', '—'),
      field('createdAt', ['createdAtUtc'], ['Tenant Detail source/freshness'], 'date', 'No backend timestamp'),
      field('updatedAt', ['updatedAtUtc'], ['Tenant Registry updated', 'Tenant Detail source/freshness'], 'date', 'createdAtUtc'),
      field('contact', ['contactName', 'primaryContact', 'contact.name'], ['Tenant Detail contacts'], 'text', '—'),
      field('email', ['contactEmail', 'email', 'contact.email'], ['Tenant Detail contacts'], 'email', '—'),
      field('phone', ['contactPhone', 'phone', 'contact.phone'], ['Tenant Detail contacts'], 'phone', '—')
    ],
    plants: [
      field('id', ['id', 'plantId', 'canonicalId', 'adminRecord.id'], ['Plant Registry row ID', 'Plant Detail identity'], 'identifier', '—', 'error'),
      field('plantCode', ['plantCode', 'sourcePlantId', 'code', 'adminRecord.plantCode', 'vendorExtensions.plantCode'], ['Plant Registry code', 'Plant Detail code'], 'identifier', '—'),
      field('plantName', ['adminName', 'liveName', 'sourcePlantName', 'plantName', 'stationName', 'siteName', 'displayName', 'sourceEntityName', 'name', 'adminRecord.plantName', 'liveRecord.plantName'], ['Plant Registry name', 'Plant Detail heading'], 'text', '—', 'error'),
      field('provider', ['provider', 'sourceScheme', 'adminRecord.sourceScheme'], ['Plant Registry provider', 'Plant Detail source'], 'text', '—', 'warning'),
      field('clientId', ['clientId', 'adminRecord.clientId'], ['Plant Detail client relation'], 'relation', ''),
      field('client', ['client', 'clientName', 'adminRecord.client'], ['Plant Registry owner', 'Plant Detail client'], 'relation', '—'),
      field('managingTenant', ['managingTenant', 'tenantName', 'tenant', 'adminRecord.managingTenant'], ['Plant Registry tenant', 'Plant Detail operator'], 'relation', '—'),
      field('recordStatus', ['recordStatus', 'status', 'adminRecord.recordStatus'], ['Plant Registry status', 'Plant Detail lifecycle'], 'status', '—'),
      field('plantType', ['plantType', 'type', 'adminRecord.plantType'], ['Plant Registry type', 'Plant Detail type'], 'text', '—'),
      field('countryRegion', ['countryRegion', 'country', 'vendorExtensions.country', 'adminRecord.countryRegion'], ['Plant Registry country', 'Plant Detail location'], 'text', '—'),
      field('region', ['region', 'vendorExtensions.region', 'adminRecord.region'], ['Plant Detail location'], 'text', '—'),
      field('city', ['city', 'vendorExtensions.city', 'adminRecord.city'], ['Plant Detail location'], 'text', '—'),
      field('plantTimeZone', ['plantTimeZone', 'timezone', 'vendorExtensions.timezone', 'adminRecord.plantTimeZone'], ['Plant Detail timezone'], 'text', '—'),
      field('devicesCount', ['devicesCount', 'vendorExtensions.devicesCount', 'adminRecord.devicesCount', 'vendorExtensions.onlineDeviceCount'], ['Plant Registry devices', 'Plant Detail devices KPI'], 'count', '0'),
      field('alertsCount', ['vendorExtensions.alertsCount', 'vendorExtensions.alarmCount'], ['Plant Registry alerts', 'Plant Detail alerts KPI'], 'count', '0'),
      field('currentPowerKw', ['currentPowerKw'], ['Plant Registry live power', 'Plant Detail telemetry'], 'power', '—'),
      field('installedPowerKw', ['installedPowerKw'], ['Plant Detail installed capacity'], 'power', '0'),
      field('todayEnergyKwh', ['todayEnergyKwh'], ['Plant Registry today energy', 'Plant Detail telemetry'], 'energy', '—'),
      field('totalEnergyKwh', ['totalEnergyKwh'], ['Plant Detail lifetime energy'], 'energy', '—'),
      field('lastDataAt', ['lastDataAt', 'lastSyncAt'], ['Plant Registry freshness', 'Plant Detail telemetry freshness'], 'date', 'No live data'),
      field('dataQualityStatus', ['dataQualityStatus', 'vendorExtensions.dataFreshness'], ['Plant Registry quality', 'Plant Detail freshness'], 'status', '—'),
      field('batteryCapacityKwh', ['vendorExtensions.batteryCapacityKwh'], ['Plant Detail storage metadata'], 'energy', '—'),
      field('monthlyYieldKwh', ['vendorExtensions.monthlyYieldKwh'], ['Plant Detail telemetry metadata'], 'energy', '—'),
      field('yearlyYieldKwh', ['vendorExtensions.yearlyYieldKwh'], ['Plant Detail telemetry metadata'], 'energy', '—'),
      field('warningCount', ['vendorExtensions.warningCount'], ['Plant Detail alert metadata'], 'count', '0'),
      field('offlineDeviceCount', ['vendorExtensions.offlineDeviceCount'], ['Plant Detail device metadata'], 'count', '0'),
      field('createdAt', ['createdAtUtc', 'adminRecord.createdAtUtc'], ['Plant Detail source/freshness'], 'date', '—'),
      field('updatedAt', ['updatedAtUtc', 'adminRecord.updatedAtUtc'], ['Plant Registry updated', 'Plant Detail source/freshness'], 'date', 'createdAtUtc'),
      field('sourceMetadata', ['vendorExtensions.runId', 'vendorExtensions.ordinal', 'vendorExtensions.seedMode', 'vendorExtensions.sourceSystem', 'vendorExtensions.sourceEntityType', 'vendorExtensions.communicationStatus', 'vendorExtensions.canonicalSource'], ['Raw payload diagnostics'], 'raw', '')
    ],
    devices: [
      field('id', ['id', 'deviceId', 'canonicalId'], ['Device Registry row ID', 'Device Detail identity'], 'identifier', '—', 'error'),
      field('provider', ['provider', 'vendorExtensions.provider'], ['Device Registry provider', 'Device Detail source'], 'text', '—', 'warning'),
      field('sourceDeviceId', ['sourceDeviceId', 'deviceId', 'serialNumber'], ['Device Registry code', 'Device Detail external ID'], 'identifier', '—', 'error'),
      field('sourcePlantId', ['sourcePlantId', 'plantId', 'vendorExtensions.sourcePlantId'], ['Device Registry plant relation', 'Device Detail plant'], 'relation', '—', 'warning'),
      field('deviceName', ['vendorExtensions.deviceName', 'sourceDeviceName', 'deviceName', 'equipmentName', 'displayName', 'sourceEntityName', 'name'], ['Device Registry name', 'Device Detail heading'], 'text', '—', 'error'),
      field('deviceType', ['deviceType', 'vendorExtensions.deviceType', 'vendorExtensions.rawDeviceType', 'type'], ['Device Registry type', 'Device Detail type'], 'text', '—'),
      field('status', ['status', 'vendorExtensions.onlineStatus', 'vendorExtensions.rawStatus'], ['Device Registry status', 'Device Detail status'], 'status', '—'),
      field('serialNumber', ['serialNumber'], ['Device Registry serial', 'Device Detail serial'], 'identifier', '—'),
      field('plantName', ['plantName', 'sourcePlantName', 'stationName', 'siteName', 'vendorExtensions.plantName'], ['Device Registry plant', 'Device Detail plant'], 'relation', '—'),
      field('lastSeenAt', ['lastSeenAt'], ['Device Registry last seen', 'Device Detail freshness'], 'date', 'No live data'),
      field('lastSyncAt', ['lastSyncAt'], ['Device Detail sync metadata'], 'date', 'No sync'),
      field('dataQualityStatus', ['dataQualityStatus', 'vendorExtensions.dataFreshness'], ['Device Registry data quality', 'Device Detail source status'], 'status', '—'),
      field('alarmStatus', ['vendorExtensions.alarmStatus', 'alarmStatus'], ['Device Detail alarm state'], 'status', '—'),
      field('vendorModel', ['vendorExtensions.vendorModel', 'vendorExtensions.model', 'model'], ['Device Registry model', 'Device Detail model'], 'text', '—'),
      field('productModel', ['vendorExtensions.productModel'], ['Device Detail product model'], 'text', '—'),
      field('ratedPowerKw', ['vendorExtensions.ratedPowerKw', 'ratedPowerKw'], ['Device Registry capacity', 'Device Detail rated power'], 'power', '—'),
      field('firmwareVersion', ['vendorExtensions.firmwareVersion', 'vendorExtensions.firmware', 'firmwareVersion'], ['Device Registry firmware', 'Device Detail firmware'], 'text', '—'),
      field('protocolVersion', ['vendorExtensions.protocolVersion'], ['Device Detail protocol'], 'text', '—'),
      field('parentDeviceId', ['vendorExtensions.parentDeviceId', 'parentDeviceId'], ['Device Detail topology'], 'relation', '—'),
      field('sourceSystem', ['vendorExtensions.sourceSystem', 'sourceSystem'], ['Device Detail source'], 'text', 'Provider'),
      field('sourceMetadata', ['vendorExtensions.runId', 'vendorExtensions.ordinal', 'vendorExtensions.seedMode', 'vendorExtensions.sourceEntityType', 'vendorExtensions.canonicalSource'], ['Raw payload diagnostics'], 'raw', '')
    ],
    alerts: [
      field('id', ['id', 'alertId'], ['Alert Registry row ID', 'Alert Detail identity'], 'identifier', '—', 'error'),
      field('provider', ['provider'], ['Alert Registry provider', 'Alert Detail source'], 'text', '—', 'warning'),
      field('sourceAlertId', ['sourceAlertId', 'vendorExtensions.alarmCode'], ['Alert Registry vendor code', 'Alert Detail source code'], 'identifier', '—', 'error'),
      field('sourcePlantId', ['sourcePlantId'], ['Alert Registry plant relation', 'Alert Detail plant'], 'relation', '—'),
      field('sourceDeviceId', ['sourceDeviceId', 'vendorExtensions.deviceSn'], ['Alert Registry device relation', 'Alert Detail device'], 'relation', '—'),
      field('plantName', ['plantName', 'sourcePlantName', 'vendorExtensions.plantName'], ['Alert Registry plant', 'Alert Detail plant'], 'relation', '—'),
      field('deviceName', ['deviceName', 'vendorExtensions.deviceName'], ['Alert Registry device', 'Alert Detail device'], 'relation', '—'),
      field('title', ['title', 'vendorExtensions.alertName', 'sourceAlertName', 'alertName', 'name'], ['Alert Registry title', 'Alert Detail heading'], 'text', '—', 'error'),
      field('message', ['message'], ['Alert Registry message', 'Alert Detail description'], 'text', '—'),
      field('severity', ['severity'], ['Alert Registry severity', 'Alert Detail severity'], 'status', '—', 'warning'),
      field('status', ['status'], ['Alert Registry status', 'Alert Detail status'], 'status', '—'),
      field('occurredAtUtc', ['occurredAtUtc'], ['Alert Registry occurred', 'Alert Detail timeline'], 'date', 'No occurrence time'),
      field('lastSyncAt', ['lastSyncAt'], ['Alert Registry updated', 'Alert Detail timeline'], 'date', 'No sync'),
      field('alarmType', ['vendorExtensions.alarmType', 'vendorExtensions.category'], ['Alert Registry category', 'Alert Detail category'], 'text', '—'),
      field('reason', ['vendorExtensions.reason', 'vendorExtensions.probableCause'], ['Alert Detail probable cause'], 'text', 'No backend probable cause'),
      field('solution', ['vendorExtensions.solution', 'vendorExtensions.recommendation'], ['Alert Detail recommendation'], 'text', 'Review source data'),
      field('acknowledgedAtUtc', ['vendorExtensions.acknowledgedAtUtc'], ['Alert Detail timeline metadata'], 'date', '—'),
      field('sourceMetadata', ['vendorExtensions.runId', 'vendorExtensions.ordinal', 'vendorExtensions.seedMode', 'vendorExtensions.canonicalSource'], ['Raw payload diagnostics'], 'raw', '')
    ],
    telemetry: [
      field('id', ['id', 'telemetryId', 'metricId', 'canonicalId', 'sourceEntityId', 'telemetry.id', 'measurement.id', 'reading.id', 'data.id', 'payload.id'], ['Telemetry record identity', 'Raw payload diagnostics'], 'identifier', ''),
      field('metric', ['metricName', 'metric.name', 'metric.key', 'metric.code', 'measurement.name', 'measurement.metricName', 'reading.metricName', 'telemetry.metricName', 'data.metricName', 'payload.metricName', 'name', 'key', 'parameter', 'measurementName', 'field', 'metric'], ['Telemetry metric label', 'Telemetry filters'], 'text', '—', 'warning'),
      field('value', ['value.value', 'measurement.value', 'reading.value', 'telemetry.value', 'data.value', 'payload.value', 'metric.value', 'latest.value', 'point.value', 'sample.value', 'metricValue', 'numericValue', 'currentValue', 'rawValue', 'reading', 'value'], ['Telemetry value', 'Telemetry stream preview'], 'raw', '—', 'warning'),
      field('unit', ['value.unit', 'measurement.unit', 'reading.unit', 'telemetry.unit', 'data.unit', 'payload.unit', 'metric.unit', 'latest.unit', 'point.unit', 'sample.unit', 'unit', 'unitSymbol', 'uom', 'measurementUnit'], ['Telemetry value unit', 'Telemetry stream preview'], 'text', ''),
      field('timestamp', ['measurement.timestamp', 'measurement.measuredAtUtc', 'reading.timestamp', 'reading.measuredAtUtc', 'telemetry.timestamp', 'data.timestamp', 'payload.timestamp', 'latest.timestamp', 'point.timestamp', 'sample.timestamp', 'timestamp', 'occurredAtUtc', 'measuredAtUtc', 'recordedAtUtc', 'collectedAtUtc', 'capturedAtUtc', 'createdAtUtc', 'lastDataAt', 'lastSyncAt'], ['Telemetry timestamp', 'Telemetry freshness'], 'date', 'No timestamp'),
      field('quality', ['quality.status', 'measurement.quality', 'reading.quality', 'telemetry.quality', 'data.quality', 'payload.quality', 'dataQualityStatus', 'quality', 'qualityStatus', 'freshness', 'status'], ['Telemetry quality', 'Telemetry freshness'], 'status', '—'),
      field('provider', ['source.provider', 'source.vendor', 'source.system', 'integration.provider', 'telemetry.provider', 'data.provider', 'payload.provider', 'provider', 'vendor', 'sourceSystem', 'providerName', 'vendorExtensions.provider'], ['Telemetry source provider'], 'text', '—'),
      field('tenantId', ['tenant.id', 'tenant.tenantId', 'telemetry.tenantId', 'data.tenantId', 'payload.tenantId', 'tenantId', 'sourceTenantId'], ['Telemetry tenant relation'], 'relation', ''),
      field('tenantName', ['tenant.name', 'tenant.tenantName', 'telemetry.tenantName', 'data.tenantName', 'payload.tenantName', 'tenantName', 'tenant', 'managingTenant', 'vendorExtensions.tenantName'], ['Telemetry tenant relation'], 'relation', '—'),
      field('plantId', ['plant.id', 'plant.plantId', 'plant.sourcePlantId', 'telemetry.plantId', 'data.plantId', 'payload.plantId', 'sourcePlantId', 'plantId'], ['Telemetry plant relation'], 'relation', ''),
      field('plantName', ['plant.name', 'plant.plantName', 'plant.stationName', 'telemetry.plantName', 'data.plantName', 'payload.plantName', 'plantName', 'sourcePlantName', 'stationName', 'siteName', 'vendorExtensions.plantName'], ['Telemetry plant relation'], 'relation', '—'),
      field('deviceId', ['device.id', 'device.deviceId', 'device.sourceDeviceId', 'device.serialNumber', 'telemetry.deviceId', 'data.deviceId', 'payload.deviceId', 'sourceDeviceId', 'deviceId', 'serialNumber'], ['Telemetry device relation'], 'relation', ''),
      field('deviceName', ['device.name', 'device.deviceName', 'device.equipmentName', 'telemetry.deviceName', 'data.deviceName', 'payload.deviceName', 'deviceName', 'sourceDeviceName', 'equipmentName', 'vendorExtensions.deviceName'], ['Telemetry device relation'], 'relation', '—'),
      field('deviceType', ['device.type', 'device.deviceType', 'telemetry.deviceType', 'data.deviceType', 'payload.deviceType', 'deviceType', 'type', 'vendorExtensions.deviceType'], ['Telemetry device type'], 'text', '—'),
      field('sourceMetadata', ['metadata', 'tags', 'dimensions', 'source', 'vendorExtensions', 'telemetry.metadata', 'data.metadata', 'payload.metadata'], ['Raw payload diagnostics'], 'raw', '')
    ],
    integrations: [
      field('id', ['id', 'integrationId'], ['Integration Registry row ID', 'Integration Detail identity'], 'identifier', 'Provider-derived live ID'),
      field('integrationCode', ['integrationCode', 'code'], ['Integration Registry code', 'Integration Detail code'], 'identifier', 'Generated live code'),
      field('integrationName', ['integrationName', 'displayName', 'name', 'vendorExtensions.displayName', 'vendorExtensions.integrationName', 'connector.displayName', 'connector.name', 'integration.displayName', 'integration.name', 'providerIntegration.displayName', 'provider', 'providerType', 'providerName', 'vendorName', 'vendorExtensions.provider'], ['Integration Registry name', 'Integration Detail heading'], 'text', 'Provider', 'warning'),
      field('provider', ['provider', 'providerType', 'providerName', 'vendorName', 'vendor', 'producerVendorTemplate', 'vendorExtensions.provider', 'vendorExtensions.providerType', 'vendorExtensions.providerName', 'vendorExtensions.vendorName', 'source.provider', 'source.vendor', 'connector.provider', 'connector.vendor', 'integration.provider', 'integration.vendor', 'providerIntegration.providerType', 'sourceScheme'], ['Integration Registry provider', 'Integration Detail vendor'], 'text', '—', 'error'),
      field('producerVendorTemplate', ['producerVendorTemplate'], ['Integration Detail template'], 'text', '—'),
      field('integrationStatus', ['integrationStatus', 'status', 'vendorExtensions.status', 'vendorExtensions.integrationStatus', 'health', 'healthStatus', 'connectionStatus', 'lifecycleStatus', 'state', 'connector.status', 'integration.status', 'providerIntegration.status'], ['Integration Registry status', 'Integration Detail lifecycle'], 'status', '—', 'warning'),
      field('plantsCount', ['plantsCount', 'plantCount', 'plants', 'vendorExtensions.plantsCount'], ['Integration Registry plants KPI', 'Integration Detail discovery'], 'count', '0'),
      field('plantsWithDataCount', ['plantsWithDataCount', 'vendorExtensions.plantsWithDataCount'], ['Integration operational coverage'], 'count', '0'),
      field('plantsWithoutDataCount', ['plantsWithoutDataCount', 'vendorExtensions.plantsWithoutDataCount'], ['Integration operational coverage'], 'count', '0'),
      field('stalePlantsCount', ['stalePlantsCount', 'vendorExtensions.stalePlantsCount'], ['Integration operational health'], 'count', '0'),
      field('devicesCount', ['devicesCount', 'deviceCount', 'devices', 'vendorExtensions.devicesCount'], ['Integration Registry devices KPI', 'Integration Detail discovery'], 'count', '0'),
      field('alertsCount', ['alertsCount', 'alertCount', 'alerts', 'vendorExtensions.activeAlertsCount'], ['Integration Registry alerts KPI', 'Integration Detail discovery'], 'count', '0'),
      field('errorRatePct', ['errorRatePct'], ['Integration operational health'], 'count', '0'),
      field('lastSyncAtUtc', ['lastSyncAtUtc'], ['Integration Registry last sync', 'Integration Detail freshness'], 'date', 'No sync'),
      field('lastSyncText', ['lastSyncText'], ['Integration Registry last activity'], 'text', 'No data'),
      field('lastErrorMessage', ['lastErrorMessage'], ['Integration Detail last error'], 'text', ''),
      field('createdAtUtc', ['createdAtUtc'], ['Integration Detail created'], 'date', '—'),
      field('updatedAtUtc', ['updatedAtUtc'], ['Integration Detail updated'], 'date', 'createdAtUtc'),
      field('sourceMetadata', ['vendorExtensions.provider', 'vendorExtensions.displayName'], ['Raw payload diagnostics'], 'raw', '')
    ]
  };

  const fieldAuditRecords = new Map<string, ZentridFieldAuditRecord>();

  function flattenLeafPaths(value: unknown, prefix = '', output: string[] = []): string[] {
    if (!isRecord(value)) return output;
    Object.entries(value).forEach(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (isRecord(child)) flattenLeafPaths(child, path, output);
      else output.push(path);
    });
    return output;
  }

  function aliasCoversPath(alias: string, path: string): boolean {
    return alias === path || path.startsWith(`${alias}.`) || alias.startsWith(`${path}.`);
  }

  function auditFieldMapping(entity: ZentridContractEntity, value: unknown, index: number): ZentridFieldAuditRecord {
    const row = isRecord(value) ? value : {};
    const definitions = FIELD_MAPPING_MANIFEST[entity];
    const rawFields = flattenLeafPaths(row);
    const sourceByCanonical: Record<string, string> = {};
    const mappedFields: string[] = [];
    const fallbackFields: string[] = [];
    const missingExpectedFields: string[] = [];

    definitions.forEach(definition => {
      const matched = firstAlias(row, definition.aliases);
      if (matched) {
        mappedFields.push(definition.canonicalField);
        sourceByCanonical[definition.canonicalField] = matched.alias;
      } else {
        if (definition.fallback !== '') fallbackFields.push(definition.canonicalField);
        if (definition.required) missingExpectedFields.push(definition.canonicalField);
      }
    });

    const knownAliases = definitions.flatMap(definition => definition.aliases);
    const unmappedFields = rawFields.filter(path => !knownAliases.some(alias => aliasCoversPath(alias, path)));
    const record: ZentridFieldAuditRecord = {
      entity,
      index,
      mappedFields,
      fallbackFields,
      missingExpectedFields,
      unmappedFields,
      sourceByCanonical,
      rawFieldCount: rawFields.length
    };
    fieldAuditRecords.set(`${entity}|${index}`, record);
    return record;
  }

  const fieldAudit = {
    clear(entity?: ZentridContractEntity): void {
      if (!entity) {
        fieldAuditRecords.clear();
        return;
      }
      [...fieldAuditRecords.keys()].forEach(key => {
        if (key.startsWith(`${entity}|`)) fieldAuditRecords.delete(key);
      });
    },
    manifest(entity?: ZentridContractEntity): Record<ZentridContractEntity, ZentridFieldMappingDefinition[]> | ZentridFieldMappingDefinition[] {
      if (entity) return FIELD_MAPPING_MANIFEST[entity].map(item => ({ ...item, aliases: [...item.aliases], uiTargets: [...item.uiTargets] }));
      return Object.fromEntries((Object.keys(FIELD_MAPPING_MANIFEST) as ZentridContractEntity[]).map(name => [name, FIELD_MAPPING_MANIFEST[name].map(item => ({ ...item, aliases: [...item.aliases], uiTargets: [...item.uiTargets] }))])) as Record<ZentridContractEntity, ZentridFieldMappingDefinition[]>;
    },
    list(entity?: ZentridContractEntity): ZentridFieldAuditRecord[] {
      return [...fieldAuditRecords.values()]
        .filter(record => !entity || record.entity === entity)
        .map(record => ({
          ...record,
          mappedFields: [...record.mappedFields],
          fallbackFields: [...record.fallbackFields],
          missingExpectedFields: [...record.missingExpectedFields],
          unmappedFields: [...record.unmappedFields],
          sourceByCanonical: { ...record.sourceByCanonical }
        }));
    },
    summary(entity?: ZentridContractEntity): ZentridFieldAuditSummary {
      const records = [...fieldAuditRecords.values()].filter(record => !entity || record.entity === entity);
      const entities = [...new Set(records.map(record => record.entity))];
      const byEntity = entities.map(name => {
        const scoped = records.filter(record => record.entity === name);
        return {
          entity: name,
          records: scoped.length,
          rawFields: scoped.reduce((sum, record) => sum + record.rawFieldCount, 0),
          mappedFields: scoped.reduce((sum, record) => sum + record.mappedFields.length, 0),
          fallbackFields: scoped.reduce((sum, record) => sum + record.fallbackFields.length, 0),
          missingExpectedFields: scoped.reduce((sum, record) => sum + record.missingExpectedFields.length, 0),
          unmappedFields: scoped.reduce((sum, record) => sum + record.unmappedFields.length, 0)
        };
      });
      return {
        records: records.length,
        rawFields: byEntity.reduce((sum, item) => sum + item.rawFields, 0),
        mappedFields: byEntity.reduce((sum, item) => sum + item.mappedFields, 0),
        fallbackFields: byEntity.reduce((sum, item) => sum + item.fallbackFields, 0),
        missingExpectedFields: byEntity.reduce((sum, item) => sum + item.missingExpectedFields, 0),
        unmappedFields: byEntity.reduce((sum, item) => sum + item.unmappedFields, 0),
        affectedEntities: entities,
        byEntity
      };
    }
  };

  function normalizedId(row: ContractRecord, context: ZentridContractMapperContext): string {
    return context.safeText(context.firstOf(row, [
      'id', 'tenantId', 'clientId', 'plantId', 'deviceId', 'integrationId', 'telemetryId', 'metricId',
      'canonicalId', 'sourceEntityId', 'sourcePlantId', 'sourceDeviceId', 'sourceAlertId'
    ], ''), '');
  }

  function optionalNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  type ZentridNormalizationDomain =
    | 'country'
    | 'clientType'
    | 'entityType'
    | 'tenantType'
    | 'provider'
    | 'integrationProvider'
    | 'clientStatus'
    | 'tenantStatus'
    | 'plantStatus'
    | 'deviceStatus'
    | 'alertStatus'
    | 'alertSeverity'
    | 'integrationStatus';

  function sourceValue(value: unknown, fallback = '—'): string {
    if (value === undefined || value === null) return fallback;
    const text = String(value).trim();
    return text || fallback;
  }

  function normalizationKey(value: unknown): string {
    const text = sourceValue(value, '');
    if (!text) return '';
    return text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function aliasValue(value: unknown, aliases: Record<string, string>, fallback = '—'): string {
    const text = sourceValue(value, fallback);
    if (text === fallback) return fallback;
    return aliases[normalizationKey(text)] || text;
  }

  const countryAliases: Record<string, string> = {
    am: 'Armenia', arm: 'Armenia', armenia: 'Armenia',
    us: 'United States', usa: 'United States', 'united states of america': 'United States', 'united states': 'United States',
    gb: 'United Kingdom', gbr: 'United Kingdom', uk: 'United Kingdom', 'great britain': 'United Kingdom', 'united kingdom': 'United Kingdom',
    ge: 'Georgia', geo: 'Georgia', georgia: 'Georgia',
    de: 'Germany', deu: 'Germany', germany: 'Germany',
    fr: 'France', fra: 'France', france: 'France',
    it: 'Italy', ita: 'Italy', italy: 'Italy',
    es: 'Spain', esp: 'Spain', spain: 'Spain',
    nl: 'Netherlands', nld: 'Netherlands', netherlands: 'Netherlands',
    ru: 'Russia', rus: 'Russia', russia: 'Russia',
    ua: 'Ukraine', ukr: 'Ukraine', ukraine: 'Ukraine',
    kz: 'Kazakhstan', kaz: 'Kazakhstan', kazakhstan: 'Kazakhstan',
    ae: 'United Arab Emirates', are: 'United Arab Emirates', uae: 'United Arab Emirates', 'united arab emirates': 'United Arab Emirates',
    in: 'India', ind: 'India', india: 'India',
    cn: 'China', chn: 'China', china: 'China',
    jp: 'Japan', jpn: 'Japan', japan: 'Japan',
    au: 'Australia', aus: 'Australia', australia: 'Australia',
    ca: 'Canada', can: 'Canada', canada: 'Canada'
  };

  function normalizeCountry(value: unknown): string {
    const text = sourceValue(value);
    if (text === '—') return text;
    const direct = countryAliases[normalizationKey(text)];
    if (direct) return direct;
    const regionCode = text.toUpperCase();
    if (/^[A-Z]{2}$/.test(regionCode) && typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      try {
        const display = new Intl.DisplayNames(['en'], { type: 'region' }).of(regionCode);
        if (display && display !== regionCode) return display;
      } catch {
        // Preserve an unknown backend value instead of fabricating a country.
      }
    }
    return text;
  }

  function normalizeClientType(value: unknown): string {
    return aliasValue(value, {
      commercial: 'Legal Entity', corporate: 'Legal Entity', company: 'Legal Entity', business: 'Legal Entity',
      organization: 'Legal Entity', organisation: 'Legal Entity', 'legal entity': 'Legal Entity', legalentity: 'Legal Entity',
      juridical: 'Legal Entity', 'juridical person': 'Legal Entity', llc: 'Legal Entity', jsc: 'Legal Entity', cjsc: 'Legal Entity',
      individual: 'Individual', person: 'Individual', personal: 'Individual', private: 'Individual',
      'natural person': 'Individual', naturalperson: 'Individual'
    });
  }

  function normalizeTenantType(value: unknown): string {
    return aliasValue(value, {
      owner: 'Owner', assetowner: 'Owner', 'asset owner': 'Owner', plantowner: 'Owner', 'plant owner': 'Owner',
      operator: 'Operator', operatorcompany: 'Operator', 'operator company': 'Operator',
      investor: 'Investor', investment: 'Investor',
      epc: 'EPC', contractor: 'EPC', 'epc contractor': 'EPC',
      om: 'O&M', 'o and m': 'O&M', operationsandmaintenance: 'O&M', 'operations and maintenance': 'O&M',
      utility: 'Utility', gridoperator: 'Utility', 'grid operator': 'Utility'
    });
  }

  function normalizeEntityType(value: unknown): string {
    const text = sourceValue(value);
    if (text === '—') return text;
    const key = normalizationKey(text);
    const mapped = {
      commercial: 'Legal Entity', corporate: 'Legal Entity', company: 'Legal Entity', business: 'Legal Entity',
      organization: 'Legal Entity', organisation: 'Legal Entity', 'legal entity': 'Legal Entity', legalentity: 'Legal Entity',
      juridical: 'Legal Entity', 'juridical person': 'Legal Entity', llc: 'Legal Entity', jsc: 'Legal Entity', cjsc: 'Legal Entity',
      nonprofit: 'Legal Entity', 'non profit': 'Legal Entity',
      individual: 'Individual', person: 'Individual', personal: 'Individual', private: 'Individual',
      'natural person': 'Individual', naturalperson: 'Individual'
    }[key];
    if (mapped) return mapped;
    const tenantType = normalizeTenantType(text);
    return tenantType !== text ? '—' : text;
  }

  function normalizeProvider(value: unknown): string {
    const text = sourceValue(value);
    if (text === '—') return text;
    const key = normalizationKey(text);
    if (/huawei|fusion solar|fusionsolar/.test(key)) return 'Huawei';
    if (/deye|solarman/.test(key)) return 'Deye';
    if (/goodwe|sems/.test(key)) return 'GoodWe';
    if (/solis/.test(key)) return 'Solis';
    if (/solax|solarx/.test(key)) return 'SolaX';
    if (/sungrow|isolarcloud/.test(key)) return 'Sungrow';
    if (/growatt|shine server|shineserver/.test(key)) return 'Growatt';
    if (/fronius|solar web/.test(key)) return 'Fronius';
    if (/\bsma\b|sunny portal/.test(key)) return 'SMA';
    if (/sofar/.test(key)) return 'Sofar';
    if (/peimar/.test(key)) return 'Peimar';
    return text;
  }

  function normalizeIntegrationProvider(value: unknown): string {
    const family = normalizeProvider(value);
    if (family === 'Deye') return 'DeyeCloud';
    if (family === 'SolaX') return 'SolaX';
    return family;
  }

  function normalizeClientStatus(value: unknown): string {
    return aliasValue(value, {
      online: 'Active', active: 'Active', enabled: 'Active', activated: 'Active', verified: 'Active',
      review: 'Review', 'under review': 'Review', pendingreview: 'Review', 'pending review': 'Review', verification: 'Review',
      pending: 'Pending', draft: 'Pending', inactive: 'Pending', invited: 'Pending', onboarding: 'Pending'
    });
  }

  function normalizeTenantStatus(value: unknown): string {
    return aliasValue(value, {
      online: 'Active', active: 'Active', enabled: 'Active', activated: 'Active',
      inactive: 'Inactive', disabled: 'Inactive', deactivated: 'Inactive',
      suspended: 'Suspended', blocked: 'Suspended',
      archived: 'Archived', deleted: 'Archived',
      pending: 'Inactive', draft: 'Inactive'
    });
  }

  function normalizePlantStatus(value: unknown): string {
    return aliasValue(value, {
      online: 'Normal', active: 'Normal', operational: 'Normal', normal: 'Normal', healthy: 'Normal', ok: 'Normal', running: 'Normal', connected: 'Normal',
      warning: 'Warning', degraded: 'Warning', attention: 'Warning', alarm: 'Warning', partial: 'Warning', stale: 'Warning',
      fault: 'Fault', error: 'Fault', failed: 'Fault', critical: 'Fault',
      offline: 'Offline', disconnected: 'Offline', unavailable: 'Offline', 'no data': 'Offline', lost: 'Offline',
      pending: 'Pending Review', review: 'Pending Review', pendingreview: 'Pending Review', 'pending review': 'Pending Review',
      draft: 'Draft', new: 'Draft', inactive: 'Inactive', disabled: 'Inactive', archived: 'Archived'
    });
  }

  function normalizeDeviceStatus(value: unknown): string {
    return aliasValue(value, {
      online: 'Online', active: 'Online', operational: 'Online', normal: 'Online', healthy: 'Online', ok: 'Online', running: 'Online', connected: 'Online',
      warning: 'Warning', degraded: 'Warning', delayed: 'Warning', attention: 'Warning', stale: 'Warning',
      fault: 'Fault', error: 'Fault', failed: 'Fault', critical: 'Fault', alarm: 'Fault',
      offline: 'Offline', disconnected: 'Offline', inactive: 'Offline', disabled: 'Offline', unavailable: 'Offline', 'no data': 'Offline',
      pending: 'Draft', draft: 'Draft', new: 'Draft'
    });
  }

  function normalizeAlertStatus(value: unknown): string {
    return aliasValue(value, {
      active: 'Open', open: 'Open', new: 'Open', raised: 'Open', triggered: 'Open', unacknowledged: 'Open',
      acknowledged: 'Acknowledged', ack: 'Acknowledged', confirmed: 'Acknowledged', assigned: 'Acknowledged',
      escalated: 'Escalated', escalation: 'Escalated',
      resolved: 'Resolved', closed: 'Resolved', clear: 'Resolved', cleared: 'Resolved', recovered: 'Resolved'
    });
  }

  function normalizeAlertSeverity(value: unknown): string {
    return aliasValue(value, {
      critical: 'Critical', emergency: 'Critical', fatal: 'Critical', p1: 'Critical', severity1: 'Critical',
      high: 'High', major: 'High', p2: 'High', severity2: 'High',
      warning: 'Warning', medium: 'Warning', minor: 'Warning', p3: 'Warning', severity3: 'Warning',
      info: 'Info', informational: 'Info', low: 'Info', p4: 'Info', severity4: 'Info'
    });
  }

  function normalizeIntegrationStatus(value: unknown): string {
    return aliasValue(value, {
      online: 'Active', active: 'Active', enabled: 'Active', activated: 'Active', healthy: 'Active',
      suspended: 'Suspended', inactive: 'Suspended', disabled: 'Suspended', paused: 'Suspended',
      archived: 'Archived', deleted: 'Archived',
      failed: 'Failed', fault: 'Failed', error: 'Failed', unhealthy: 'Failed',
      draft: 'Draft', pending: 'Draft', new: 'Draft'
    });
  }

  const normalization = {
    country: normalizeCountry,
    clientType: normalizeClientType,
    entityType: normalizeEntityType,
    tenantType: normalizeTenantType,
    provider: normalizeProvider,
    integrationProvider: normalizeIntegrationProvider,
    clientStatus: normalizeClientStatus,
    tenantStatus: normalizeTenantStatus,
    plantStatus: normalizePlantStatus,
    deviceStatus: normalizeDeviceStatus,
    alertStatus: normalizeAlertStatus,
    alertSeverity: normalizeAlertSeverity,
    integrationStatus: normalizeIntegrationStatus,
    normalize(domain: ZentridNormalizationDomain, value: unknown): string {
      return this[domain](value);
    }
  };

  function strictDisplayName(row: ContractRecord, context: ZentridContractMapperContext, keys: string[], identityKeys: string[]): string {
    const named = context.safeText(context.firstOf(row, keys, ''), '').trim();
    if (named) return named;
    const identity = context.safeText(context.firstOf(row, identityKeys, ''), '').trim();
    return identity || '—';
  }

  const clients = createContract<ZentridClientDto>(CONTRACT_DEFINITIONS.clients, (row, _index, context) => {
    const id = normalizedId(row, context);
    const name = strictDisplayName(row, context, [
      'vendorExtensions.clientName', 'vendorExtensions.displayName', 'vendorExtensions.name',
      'sourceClientName', 'clientName', 'displayName', 'legalName', 'companyName', 'fullName', 'name'
    ], ['clientId', 'sourceEntityId', 'externalId', 'id']);
    const explicitDocuments = context.firstOf(row, ['documents', 'documentCount'], undefined);
    const documentFlags = ['hasClientPassportFile', 'hasStateRegistrationDocumentFile', 'hasProjectDocFile']
      .filter(key => row[key] !== undefined && row[key] !== null);
    return {
      dataOrigin: 'live', id,
      code: context.safeText(context.firstOf(row, ['code', 'clientCode', 'externalId'], ''), ''),
      name, vendorDisplayName: name,
      registeredName: context.safeText(context.firstOf(row, ['name', 'clientName', 'displayName', 'sourceEntityId', 'id'], ''), ''),
      plantCount: Array.isArray(row.plants) ? row.plants.length : optionalNumber(context.firstOf(row, ['plantCount', 'plantsCount', 'assignedPlantCount'], undefined)),
      deviceCount: optionalNumber(context.firstOf(row, ['deviceCount', 'devicesCount'], undefined)),
      totalCapacity: context.safeText(context.firstOf(row, ['totalCapacity', 'capacity', 'capacityDc', 'installedCapacity'], '—')),
      type: normalization.clientType(context.firstOf(row, ['type', 'clientType', 'entityType'], '—')),
      legalForm: context.safeText(context.firstOf(row, ['legalForm', 'companyType'], '—')),
      registrationNo: context.safeText(context.firstOf(row, ['registrationNo', 'registrationNumber', 'registryNumber'], '—')),
      taxId: context.safeText(context.firstOf(row, ['taxId', 'tin', 'vat', 'taxNumber'], '—')),
      country: normalization.country(context.firstOf(row, ['country', 'address.country'], '—')),
      region: context.safeText(context.firstOf(row, ['region', 'address.region'], '—')),
      city: context.safeText(context.firstOf(row, ['city', 'address.city'], '—')),
      address: context.safeText(context.firstOf(row, ['address', 'detailedAddress', 'addressLine'], '—')),
      status: normalization.clientStatus(context.firstOf(row, ['status', 'accountActivation', 'accountStatus', 'lifecycleStatus'], '—')),
      verification: context.safeText(context.firstOf(row, ['verification', 'verificationStatus', 'kycStatus'], '—')),
      account: context.safeText(context.firstOf(row, ['account', 'accountManager', 'manager'], '—')),
      primaryContact: context.safeText(context.firstOf(row, ['primaryContact', 'contactName', 'contact.name'], '—')),
      contactEmail: context.safeText(context.firstOf(row, ['contactEmail', 'email', 'contact.email'], '—')),
      contactPhone: context.safeText(context.firstOf(row, ['contactPhone', 'phoneNumber1', 'phone1', 'phone', 'contact.phone'], '—')),
      phone2: context.safeText(context.firstOf(row, ['phoneNumber2', 'phone2', 'secondaryPhone'], '')),
      username: context.safeText(context.firstOf(row, ['username', 'portalUsername'], '')),
      portalUsername: context.safeText(context.firstOf(row, ['username', 'portalUsername'], '')),
      tenant: context.safeText(context.firstOf(row, ['managingTenant', 'tenant', 'tenantName', 'organizationName'], '—')),
      plants: Array.isArray(row.plants) ? row.plants : [],
      users: optionalNumber(context.firstOf(row, ['users', 'userCount'], undefined)),
      documents: explicitDocuments !== undefined
        ? optionalNumber(explicitDocuments)
        : (documentFlags.length ? documentFlags.reduce((count, key) => count + Number(Boolean(row[key])), 0) : null),
      billing: context.safeText(context.firstOf(row, ['billing', 'billingPlan', 'servicePlan'], '—')),
      supportTier: context.safeText(context.firstOf(row, ['supportTier', 'supportPlan'], '—')),
      accessScope: context.safeText(context.firstOf(row, ['accessScope', 'dataScope'], '—')),
      exportPolicy: context.safeText(context.firstOf(row, ['exportPolicy'], '—')),
      assignmentRole: context.safeText(context.firstOf(row, ['assignmentRole', 'role'], '—')),
      onboarding: context.safeText(context.firstOf(row, ['onboarding', 'onboardingStatus', 'accountActivation'], '—')),
      updated: context.formatDate(context.firstOf(row, ['updatedAtUtc', 'createdAtUtc'], undefined), '—'),
      lastSyncAt: context.safeText(context.firstOf(row, ['updatedAtUtc', 'createdAtUtc'], ''), ''),
      raw: row
    };
  });

  const tenants = createContract<ZentridTenantDto>(CONTRACT_DEFINITIONS.tenants, (row, _index, context) => {
    const id = normalizedId(row, context);
    const name = strictDisplayName(row, context, [
      'vendorExtensions.tenantName', 'vendorExtensions.organizationName', 'vendorExtensions.displayName', 'vendorExtensions.name',
      'tenant.name', 'tenant.tenantName', 'organization.name', 'organization.organizationName',
      'company.name', 'profile.displayName', 'sourceTenantName', 'tenantName', 'organizationName',
      'displayName', 'legalName', 'companyName', 'name', 'tenantCode', 'organizationCode', 'externalId'
    ], ['tenantId', 'sourceEntityId', 'id']);
    const rawTenantType = context.firstOf(row, ['tenantType', 'type', 'organizationType'], '—');
    const rawEntityType = context.firstOf(row, ['entityType', 'legalEntityType', 'personType', 'organizationType', 'tenantType', 'type'], '—');
    const tenantType = normalization.tenantType(rawTenantType);
    return {
      dataOrigin: 'live', id,
      code: context.safeText(context.firstOf(row, ['code', 'tenantCode', 'organizationCode', 'externalId'], ''), ''),
      name, vendorDisplayName: name,
      registeredName: context.safeText(context.firstOf(row, ['name', 'tenantName', 'organizationName', 'displayName', 'sourceEntityId', 'id'], ''), ''),
      legal: context.safeText(context.firstOf(row, ['legalName', 'companyName', 'organizationName'], '—')),
      entityType: normalization.entityType(rawEntityType),
      types: tenantType === '—' ? [] : [tenantType],
      country: normalization.country(context.firstOf(row, ['country', 'address.country', 'vendorExtensions.country'], '—')),
      region: context.safeText(context.firstOf(row, ['region', 'address.region', 'vendorExtensions.region'], '—')),
      city: context.safeText(context.firstOf(row, ['city', 'address.city', 'vendorExtensions.city'], '—')),
      address: context.safeText(context.firstOf(row, ['address', 'detailedAddress', 'addressLine', 'vendorExtensions.address'], '—')),
      registration: context.safeText(context.firstOf(row, ['registrationNo', 'registrationNumber', 'registration', 'registryNumber'], '—')),
      tax: context.safeText(context.firstOf(row, ['taxId', 'tin', 'vat', 'taxNumber'], '—')),
      tier: context.safeText(context.firstOf(row, ['servicePlan', 'supportTier', 'tier'], '—')),
      category: context.safeText(context.firstOf(row, ['category', 'businessArea', 'tenantCategory'], '—')),
      risk: context.safeText(context.firstOf(row, ['risk', 'riskLevel'], '—')),
      status: normalization.tenantStatus(context.firstOf(row, ['status', 'tenantStatus', 'lifecycleStatus', 'accountStatus'], '—')),
      compliance: context.safeText(context.firstOf(row, ['compliance', 'complianceStatus', 'certificationState'], '—')),
      setup: optionalNumber(context.firstOf(row, ['setup', 'setupPct', 'onboardingProgress'], undefined)),
      contact: context.safeText(context.firstOf(row, ['contactName', 'primaryContact', 'contact.name'], '—')),
      email: context.safeText(context.firstOf(row, ['contactEmail', 'email', 'contact.email'], '—')),
      phone: context.safeText(context.firstOf(row, ['contactPhone', 'phone', 'contact.phone'], '—')),
      updated: context.formatDate(context.firstOf(row, ['updatedAtUtc', 'createdAtUtc'], undefined), '—'),
      lastSyncAt: context.safeText(context.firstOf(row, ['updatedAtUtc', 'createdAtUtc'], ''), ''),
      source: 'Live API', raw: row
    };
  });

  const plants = createContract<ZentridPlantDto>(CONTRACT_DEFINITIONS.plants, (row, _index, context) => {
    const id = normalizedId(row, context);
    const provider = normalization.provider(context.firstOf(row, ['provider', 'sourceScheme', 'adminRecord.sourceScheme'], '—'));
    const name = strictDisplayName(row, context, [
      'adminName', 'liveName', 'vendorExtensions.plantName', 'vendorExtensions.stationName',
      'vendorExtensions.siteName', 'vendorExtensions.displayName', 'vendorExtensions.name',
      'adminRecord.plantName', 'adminRecord.stationName', 'adminRecord.siteName',
      'adminRecord.displayName', 'adminRecord.name', 'liveRecord.plantName',
      'liveRecord.stationName', 'liveRecord.siteName', 'liveRecord.displayName', 'liveRecord.name',
      'sourcePlantName', 'plantName', 'stationName', 'siteName', 'displayName', 'sourceEntityName', 'name'
    ], ['plantId', 'sourcePlantId', 'plantCode', 'id']);
    const powerKw = optionalNumber(row.currentPowerKw);
    const installedKw = optionalNumber(row.installedPowerKw);
    const todayEnergy = optionalNumber(row.todayEnergyKwh);
    const integration = context.safeText(context.firstOf(row, ['integrationName', 'integration', 'sourceIntegrationName', 'adminRecord.integration'], '—'));
    return {
      dataOrigin: 'live', id,
      adminId: context.safeText(context.firstOf(row, ['adminRecord.id', 'adminRecord.plantId', 'adminRecord.canonicalId', 'adminRecord.sourceEntityId'], ''), ''),
      externalId: context.safeText(context.firstOf(row, ['sourcePlantId', 'plantCode', 'externalId', 'adminRecord.plantCode'], '—')),
      code: context.safeText(context.firstOf(row, ['plantCode', 'sourcePlantId', 'code', 'adminRecord.plantCode'], ''), ''),
      name, vendorDisplayName: name,
      registeredName: context.safeText(context.firstOf(row, ['sourcePlantId', 'plantId', 'code', 'id'], ''), ''),
      tenant: context.safeText(context.firstOf(row, ['managingTenant', 'tenantName', 'tenant', 'adminRecord.managingTenant'], '—')),
      clientId: context.safeText(context.firstOf(row, ['clientId', 'adminRecord.clientId'], ''), ''),
      portfolio: context.safeText(context.firstOf(row, ['portfolio', 'portfolioName', 'groupName'], '—')),
      integration, vendor: provider,
      status: normalization.plantStatus(context.firstOf(row, ['status', 'recordStatus', 'adminRecord.recordStatus'], '—')),
      health: normalization.plantStatus(context.firstOf(row, ['health', 'status', 'recordStatus', 'adminRecord.recordStatus'], '—')),
      type: context.safeText(context.firstOf(row, ['plantType', 'type', 'adminRecord.plantType'], '—')),
      country: normalization.country(context.firstOf(row, ['countryRegion', 'country', 'vendorExtensions.country', 'adminRecord.countryRegion'], '—')),
      region: context.safeText(context.firstOf(row, ['region', 'vendorExtensions.region', 'adminRecord.region'], '—')),
      city: context.safeText(context.firstOf(row, ['city', 'vendorExtensions.city', 'adminRecord.city'], '—')),
      address: context.safeText(context.firstOf(row, ['address', 'vendorExtensions.address', 'adminRecord.address'], '—')),
      lat: context.safeText(context.firstOf(row, ['latitude', 'vendorExtensions.latitude'], '—')),
      lng: context.safeText(context.firstOf(row, ['longitude', 'vendorExtensions.longitude'], '—')),
      timezone: context.safeText(context.firstOf(row, ['plantTimeZone', 'timezone', 'vendorExtensions.timezone', 'adminRecord.plantTimeZone'], '—')),
      capacityDc: installedKw === null ? null : Number((installedKw / 1000).toFixed(2)),
      capacityAc: optionalNumber(context.firstOf(row, ['capacityAc', 'installedPowerAcKw', 'vendorExtensions.capacityAc'], undefined)),
      gridCapacity: optionalNumber(context.firstOf(row, ['gridCapacity', 'gridCapacityKw', 'vendorExtensions.gridCapacity'], undefined)),
      panels: optionalNumber(context.firstOf(row, ['panels', 'panelCount', 'vendorExtensions.panelCount'], undefined)),
      inverters: optionalNumber(context.firstOf(row, ['inverters', 'inverterCount', 'vendorExtensions.inverterCount'], undefined)),
      strings: optionalNumber(context.firstOf(row, ['strings', 'stringCount', 'vendorExtensions.stringCount'], undefined)),
      transformers: optionalNumber(context.firstOf(row, ['transformers', 'transformerCount', 'vendorExtensions.transformerCount'], undefined)),
      meters: optionalNumber(context.firstOf(row, ['meters', 'meterCount', 'vendorExtensions.meterCount'], undefined)),
      battery: context.safeText(context.firstOf(row, ['battery', 'batteryInstalled', 'vendorExtensions.batteryInstalled'], '—')),
      devices: optionalNumber(context.firstOf(row, ['devicesCount', 'vendorExtensions.devicesCount', 'adminRecord.devicesCount'], undefined)),
      alerts: optionalNumber(context.firstOf(row, ['alertsCount', 'vendorExtensions.alertsCount', 'vendorExtensions.alarmCount'], undefined)),
      livePower: powerKw === null ? '—' : `${powerKw} kW`,
      today: todayEnergy === null ? '—' : `${todayEnergy} kWh`,
      month: context.safeText(context.firstOf(row, ['monthEnergy', 'monthlyEnergyKwh', 'vendorExtensions.monthlyEnergyKwh'], '—')),
      pr: context.safeText(context.firstOf(row, ['performanceRatio', 'pr', 'vendorExtensions.performanceRatio'], '—')),
      lastData: context.formatDate(row.lastDataAt, '—'),
      freshness: context.safeText(row.dataQualityStatus, '—'),
      commissioned: context.formatDate(context.firstOf(row, ['commissioningDate', 'createdAtUtc', 'adminRecord.createdAtUtc'], undefined), '—'),
      owner: context.safeText(context.firstOf(row, ['client', 'clientName', 'ownerName', 'adminRecord.client'], '—')),
      operator: context.safeText(context.firstOf(row, ['managingTenant', 'operatorName', 'adminRecord.managingTenant'], '—')),
      om: context.safeText(context.firstOf(row, ['serviceProvider', 'omProvider'], '—')),
      sourceSystem: context.safeText(context.firstOf(row, ['sourceScheme', 'adminRecord.sourceScheme', 'sourceSystem'], provider), provider),
      updated: context.formatDate(context.firstOf(row, ['updatedAtUtc', 'createdAtUtc', 'adminRecord.updatedAtUtc', 'adminRecord.createdAtUtc'], undefined), '—'),
      lastSyncAt: context.safeText(context.firstOf(row, ['lastDataAt', 'updatedAtUtc', 'createdAtUtc'], ''), ''),
      totalEnergy: optionalNumber(row.totalEnergyKwh), raw: row
    };
  });

  const devices = createContract<ZentridDeviceDto>(CONTRACT_DEFINITIONS.devices, (row, _index, context) => {
    const id = normalizedId(row, context);
    const provider = normalization.provider(context.firstOf(row, ['provider', 'vendorExtensions.provider'], '—'));
    const deviceType = context.safeText(context.firstOf(row, ['deviceType', 'vendorExtensions.deviceType', 'type'], '—'));
    const name = strictDisplayName(row, context, [
      'vendorExtensions.deviceName', 'vendorExtensions.equipmentName', 'vendorExtensions.displayName',
      'vendorExtensions.name', 'sourceDeviceName', 'deviceName', 'equipmentName',
      'displayName', 'sourceEntityName', 'name'
    ], ['deviceId', 'sourceDeviceId', 'serialNumber', 'id']);
    const ratedPower = optionalNumber(context.firstOf(row, ['vendorExtensions.ratedPowerKw', 'ratedPowerKw'], undefined));
    return {
      dataOrigin: 'live', id,
      externalId: context.safeText(row.sourceDeviceId, '—'),
      name, vendorDisplayName: name,
      registeredName: context.safeText(context.firstOf(row, ['sourceDeviceId', 'deviceId', 'serialNumber', 'code', 'id'], ''), ''),
      type: deviceType,
      subtype: context.safeText(context.firstOf(row, ['vendorExtensions.subtype', 'vendorExtensions.rawDeviceType'], '—')),
      manufacturer: provider,
      model: context.safeText(context.firstOf(row, ['vendorExtensions.vendorModel', 'vendorExtensions.productModel', 'vendorExtensions.model', 'model'], '—')),
      serial: context.safeText(row.serialNumber, '—'),
      firmware: context.safeText(context.firstOf(row, ['vendorExtensions.firmwareVersion', 'vendorExtensions.firmware', 'firmwareVersion'], '—')),
      ip: context.safeText(row.vendorExtensions?.ip, '—'),
      mac: context.safeText(row.vendorExtensions?.mac, '—'),
      plantId: context.safeText(row.sourcePlantId, ''),
      plant: context.safeText(context.firstOf(row, ['plantName', 'sourcePlantName', 'stationName', 'siteName', 'vendorExtensions.plantName', 'vendorExtensions.stationName'], '—')),
      tenant: context.safeText(context.firstOf(row, ['tenant', 'tenantName', 'managingTenant', 'vendorExtensions.tenantName'], '—')),
      vendor: provider,
      integration: context.safeText(context.firstOf(row, ['integration', 'integrationName', 'sourceIntegrationName'], '—')),
      status: normalization.deviceStatus(row.status),
      lifecycle: context.safeText(context.firstOf(row, ['lifecycle', 'lifecycleStatus'], '—')),
      capacity: ratedPower === null
        ? context.safeText(context.firstOf(row, ['vendorExtensions.capacity', 'capacity'], '—'))
        : `${ratedPower} kW`,
      installation: context.formatDate(context.firstOf(row, ['installationDate', 'installDate'], undefined), '—'),
      warranty: context.safeText(context.firstOf(row, ['warranty', 'warrantyStatus', 'warrantyEndDate'], '—')),
      lastSeen: context.formatDate(row.lastSeenAt, '—'),
      alerts: optionalNumber(context.firstOf(row, ['alertsCount', 'vendorExtensions.alertsCount'], undefined)),
      power: context.safeText(context.firstOf(row, ['power', 'currentPowerKw', 'vendorExtensions.power'], '—')),
      voltage: context.safeText(context.firstOf(row, ['voltage', 'vendorExtensions.voltage'], '—')),
      current: context.safeText(context.firstOf(row, ['current', 'vendorExtensions.current'], '—')),
      temperature: context.safeText(context.firstOf(row, ['temperature', 'vendorExtensions.temperature'], '—')),
      sourceStatus: context.safeText(context.firstOf(row, ['vendorExtensions.dataFreshness', 'dataQualityStatus'], '—')),
      dataQualityStatus: context.safeText(row.dataQualityStatus, '—'),
      alarmStatus: context.safeText(context.firstOf(row, ['vendorExtensions.alarmStatus', 'alarmStatus'], '—')),
      sourceSystem: context.safeText(context.firstOf(row, ['vendorExtensions.sourceSystem', 'sourceSystem'], provider), provider),
      parent: context.safeText(context.firstOf(row, ['vendorExtensions.parentDeviceId', 'vendorExtensions.parent', 'parentDeviceId'], '—')),
      children: context.firstOf(row, ['vendorExtensions.children', 'children'], null), raw: row
    };
  });

  const alerts = createContract<ZentridAlertDto>(CONTRACT_DEFINITIONS.alerts, (row, _index, context) => {
    const id = normalizedId(row, context);
    const provider = normalization.provider(row.provider);
    const severity = normalization.alertSeverity(row.severity);
    const title = strictDisplayName(row, context, [
      'vendorExtensions.alertName', 'vendorExtensions.displayName', 'vendorExtensions.name',
      'sourceAlertName', 'alertName', 'title', 'message', 'name'
    ], ['alertId', 'sourceAlertId', 'id']);
    const occurredAt = context.formatDate(row.occurredAtUtc, '—');
    const lastSync = context.formatDate(row.lastSyncAt, '—');
    const timeline: string[] = [];
    if (row.occurredAtUtc) timeline.push(`${occurredAt} · Alert received`);
    if (row.lastSyncAt) timeline.push(`${lastSync} · Last synchronized`);
    return {
      dataOrigin: 'live', id,
      zentridCode: context.safeText(context.firstOf(row, ['vendorExtensions.zentridCode', 'vendorExtensions.alarmCode'], ''), ''),
      vendorRawCode: context.safeText(row.sourceAlertId, ''),
      vendorCode: context.safeText(row.sourceAlertId, ''),
      vendorMessage: context.safeText(row.message, ''),
      severity,
      priority: context.safeText(context.firstOf(row, ['priority', 'vendorExtensions.priority'], '—')),
      title, vendorDisplayName: title,
      registeredName: context.safeText(context.firstOf(row, ['sourceAlertId', 'id', 'title'], ''), ''),
      status: normalization.alertStatus(row.status),
      category: context.safeText(context.firstOf(row, ['vendorExtensions.alarmType', 'vendorExtensions.category', 'category'], '—')),
      tenant: context.safeText(context.firstOf(row, ['tenant', 'tenantName', 'managingTenant', 'vendorExtensions.tenantName'], '—')),
      plantId: context.safeText(row.sourcePlantId, ''),
      plant: context.safeText(context.firstOf(row, ['plantName', 'sourcePlantName', 'stationName', 'siteName', 'vendorExtensions.plantName', 'vendorExtensions.stationName'], '—')),
      deviceId: context.safeText(row.sourceDeviceId, ''),
      device: context.safeText(context.firstOf(row, ['deviceName', 'sourceDeviceName', 'vendorExtensions.deviceName'], '—')),
      deviceType: context.safeText(context.firstOf(row, ['deviceType', 'vendorExtensions.deviceType'], '—')),
      vendor: provider, source: provider,
      integration: context.safeText(context.firstOf(row, ['integration', 'integrationName', 'sourceIntegrationName'], '—')),
      created: occurredAt,
      updated: lastSync,
      age: context.safeText(context.firstOf(row, ['age', 'ageText'], '—')),
      sla: context.safeText(context.firstOf(row, ['sla', 'slaStatus', 'vendorExtensions.sla'], '—')),
      owner: context.safeText(context.firstOf(row, ['owner', 'assignee', 'assignedTo'], '—')),
      telemetry: context.safeText(context.firstOf(row, ['telemetry', 'vendorExtensions.telemetry'], '—')),
      description: context.safeText(context.firstOf(row, ['message', 'description', 'title'], '—')),
      probableCause: context.safeText(context.firstOf(row, ['vendorExtensions.reason', 'vendorExtensions.probableCause', 'probableCause'], '—')),
      recommendation: context.safeText(context.firstOf(row, ['vendorExtensions.solution', 'vendorExtensions.recommendation', 'recommendation'], '—')),
      timeline,
      related: {
        telemetryMetric: context.safeText(context.firstOf(row, ['telemetryMetric', 'vendorExtensions.telemetryMetric'], '—')),
        caseId: context.safeText(context.firstOf(row, ['caseId', 'vendorExtensions.caseId'], '—')),
        taskId: context.safeText(context.firstOf(row, ['taskId', 'vendorExtensions.taskId'], '—'))
      },
      raw: row
    };
  });

  const telemetry = createContract<ZentridTelemetryDto>(CONTRACT_DEFINITIONS.telemetry, (row, _index, context) => {
    const rawValue = context.firstOf(row, ['value.value', 'measurement.value', 'reading.value', 'telemetry.value', 'data.value', 'payload.value', 'metric.value', 'latest.value', 'point.value', 'sample.value', 'metricValue', 'numericValue', 'currentValue', 'rawValue', 'reading', 'value'], null);
    const metric = context.safeText(context.firstOf(row, ['metricName', 'metric.name', 'metric.key', 'metric.code', 'measurement.name', 'measurement.metricName', 'reading.metricName', 'telemetry.metricName', 'data.metricName', 'payload.metricName', 'name', 'key', 'parameter', 'measurementName', 'field', 'metric'], '—'));
    const unit = context.safeText(context.firstOf(row, ['value.unit', 'measurement.unit', 'reading.unit', 'telemetry.unit', 'data.unit', 'payload.unit', 'metric.unit', 'latest.unit', 'point.unit', 'sample.unit', 'unit', 'unitSymbol', 'uom', 'measurementUnit'], ''), '');
    const timestampRaw = context.firstOf(row, ['measurement.timestamp', 'measurement.measuredAtUtc', 'reading.timestamp', 'reading.measuredAtUtc', 'telemetry.timestamp', 'data.timestamp', 'payload.timestamp', 'latest.timestamp', 'point.timestamp', 'sample.timestamp', 'timestamp', 'occurredAtUtc', 'measuredAtUtc', 'recordedAtUtc', 'collectedAtUtc', 'capturedAtUtc', 'createdAtUtc', 'lastDataAt', 'lastSyncAt'], undefined);
    const quality = context.safeText(context.firstOf(row, ['quality.status', 'measurement.quality', 'reading.quality', 'telemetry.quality', 'data.quality', 'payload.quality', 'dataQualityStatus', 'quality', 'qualityStatus', 'freshness', 'status'], '—'));
    return {
      dataOrigin: 'live',
      id: context.safeText(context.firstOf(row, ['id', 'telemetryId', 'metricId', 'canonicalId', 'sourceEntityId', 'telemetry.id', 'measurement.id', 'reading.id', 'data.id', 'payload.id'], ''), ''),
      metric,
      value: rawValue,
      valueText: rawValue === undefined || rawValue === null || rawValue === '' ? '—' : context.safeText(rawValue, '—'),
      numericValue: optionalNumber(rawValue),
      unit,
      displayValue: rawValue === undefined || rawValue === null || rawValue === ''
        ? '—'
        : `${context.safeText(rawValue, '—')}${unit ? ` ${unit}` : ''}`,
      timestamp: context.formatDate(timestampRaw, '—'),
      timestampRaw: timestampRaw === undefined || timestampRaw === null ? '' : context.safeText(timestampRaw, ''),
      quality,
      status: context.safeText(context.firstOf(row, ['status', 'quality.status', 'dataQualityStatus', 'qualityStatus', 'measurement.status', 'reading.status'], quality)),
      provider: normalization.provider(context.firstOf(row, ['source.provider', 'source.vendor', 'source.system', 'integration.provider', 'telemetry.provider', 'data.provider', 'payload.provider', 'provider', 'vendor', 'sourceSystem', 'providerName', 'vendorExtensions.provider'], '—')),
      tenantId: context.safeText(context.firstOf(row, ['tenant.id', 'tenant.tenantId', 'telemetry.tenantId', 'data.tenantId', 'payload.tenantId', 'tenantId', 'sourceTenantId'], ''), ''),
      tenant: context.safeText(context.firstOf(row, ['tenant.name', 'tenant.tenantName', 'telemetry.tenantName', 'data.tenantName', 'payload.tenantName', 'tenantName', 'tenant', 'managingTenant', 'vendorExtensions.tenantName'], '—')),
      plantId: context.safeText(context.firstOf(row, ['plant.id', 'plant.plantId', 'plant.sourcePlantId', 'telemetry.plantId', 'data.plantId', 'payload.plantId', 'sourcePlantId', 'plantId'], ''), ''),
      plant: context.safeText(context.firstOf(row, ['plant.name', 'plant.plantName', 'plant.stationName', 'telemetry.plantName', 'data.plantName', 'payload.plantName', 'plantName', 'sourcePlantName', 'stationName', 'siteName', 'vendorExtensions.plantName'], '—')),
      deviceId: context.safeText(context.firstOf(row, ['device.id', 'device.deviceId', 'device.sourceDeviceId', 'device.serialNumber', 'telemetry.deviceId', 'data.deviceId', 'payload.deviceId', 'sourceDeviceId', 'deviceId', 'serialNumber'], ''), ''),
      device: context.safeText(context.firstOf(row, ['device.name', 'device.deviceName', 'device.equipmentName', 'telemetry.deviceName', 'data.deviceName', 'payload.deviceName', 'deviceName', 'sourceDeviceName', 'equipmentName', 'vendorExtensions.deviceName'], '—')),
      deviceType: context.safeText(context.firstOf(row, ['device.type', 'device.deviceType', 'telemetry.deviceType', 'data.deviceType', 'payload.deviceType', 'deviceType', 'type', 'vendorExtensions.deviceType'], '—')),
      metadata: context.firstOf(row, ['metadata', 'tags', 'dimensions', 'source', 'vendorExtensions', 'telemetry.metadata', 'data.metadata', 'payload.metadata'], null),
      raw: row
    };
  });

  const integrations = createContract<ZentridIntegrationDto>(CONTRACT_DEFINITIONS.integrations, (row, _index, context) => {
    const rawProvider = context.firstOf(row, ['provider', 'providerType', 'providerName', 'vendorName', 'vendor', 'producerVendorTemplate', 'vendorExtensions.provider', 'vendorExtensions.providerType', 'vendorExtensions.providerName', 'vendorExtensions.vendorName', 'source.provider', 'source.vendor', 'connector.provider', 'connector.vendor', 'integration.provider', 'integration.vendor', 'providerIntegration.providerType', 'sourceScheme'], '');
    const provider = rawProvider ? normalization.integrationProvider(rawProvider) : '—';
    const id = normalizedId(row, context);
    const name = context.safeText(context.firstOf(row, ['displayName', 'integrationName', 'name', 'vendorExtensions.displayName', 'vendorExtensions.integrationName', 'connector.displayName', 'connector.name', 'integration.displayName', 'integration.name', 'providerIntegration.displayName'], provider));
    const status = normalization.integrationStatus(context.firstOf(row, ['status', 'integrationStatus', 'vendorExtensions.status', 'vendorExtensions.integrationStatus', 'health', 'healthStatus', 'connectionStatus', 'lifecycleStatus', 'state', 'connector.status', 'integration.status', 'providerIntegration.status'], '—'));
    return {
      dataOrigin: 'live', id,
      code: context.safeText(context.firstOf(row, ['integrationCode', 'code'], ''), ''),
      name,
      tenant: context.safeText(context.firstOf(row, ['tenant', 'tenantName', 'managingTenant'], '—')),
      vendor: provider,
      software: context.safeText(context.firstOf(row, ['software', 'softwareName'], provider === '—' ? '—' : context.integrationSoftware(provider))),
      status, health: context.safeText(context.firstOf(row, ['health', 'healthStatus', 'connectionStatus', 'vendorExtensions.health', 'vendorExtensions.healthStatus', 'status', 'integrationStatus', 'vendorExtensions.status', 'vendorExtensions.integrationStatus'], status)),
      auth: context.safeText(context.firstOf(row, ['auth', 'authStatus', 'authenticationStatus'], '—')),
      discovery: context.safeText(context.firstOf(row, ['discovery', 'discoveryStatus'], '—')),
      plants: optionalNumber(context.firstOf(row, ['plantsCount', 'plantCount', 'plants'], undefined)),
      devices: optionalNumber(context.firstOf(row, ['devicesCount', 'deviceCount', 'devices'], undefined)),
      metrics: optionalNumber(context.firstOf(row, ['metricsCount', 'vendorExtensions.metricsCount'], undefined)),
      alerts: optionalNumber(context.firstOf(row, ['alertsCount', 'alertCount', 'alerts', 'vendorExtensions.activeAlertsCount'], undefined)),
      lastSync: context.safeText(row.lastSyncText, context.formatDate(row.lastSyncAtUtc, '—')),
      assignedTenants: context.safeText(context.firstOf(row, ['assignedTenants', 'tenantCount'], '—')),
      activeIntegrations: optionalNumber(context.firstOf(row, ['plantsWithDataCount', 'vendorExtensions.plantsWithDataCount'], undefined)),
      plantsWithoutData: optionalNumber(context.firstOf(row, ['plantsWithoutDataCount', 'vendorExtensions.plantsWithoutDataCount'], undefined)),
      stalePlants: optionalNumber(context.firstOf(row, ['stalePlantsCount', 'vendorExtensions.stalePlantsCount'], undefined)),
      errorRate: optionalNumber(context.firstOf(row, ['errorRatePct'], undefined)),
      version: context.safeText(context.firstOf(row, ['version', 'connectorVersion'], '—')),
      apiVersion: context.safeText(context.firstOf(row, ['apiVersion'], '—')),
      mappingVersion: context.safeText(context.firstOf(row, ['mappingVersion'], '—')),
      authType: context.safeText(context.firstOf(row, ['authType'], '—')),
      discoveryEnabled: context.safeText(context.firstOf(row, ['discoveryEnabled'], '—')),
      baseUrl: context.safeText(context.firstOf(row, ['baseUrl'], '—')),
      createdBy: context.safeText(context.firstOf(row, ['createdBy'], '—')),
      createdAt: context.formatDate(row.createdAtUtc, '—'),
      updatedBy: context.safeText(context.firstOf(row, ['updatedBy'], '—')),
      updatedAt: context.formatDate(context.firstOf(row, ['lastSyncAtUtc', 'updatedAtUtc', 'createdAtUtc'], undefined), '—'),
      lastActivity: context.safeText(context.firstOf(row, ['lastActivity', 'lastSyncText'], '—')),
      lastSuccessfulSync: context.safeText(context.firstOf(row, ['lastSuccessfulSync', 'lastSyncText'], '—')),
      vendorName: context.safeText(context.firstOf(row, ['vendorName', 'providerName', 'vendorExtensions.vendorName', 'vendorExtensions.providerName'], provider)),
      producerVendorTemplate: context.safeText(context.firstOf(row, ['producerVendorTemplate', 'vendorExtensions.producerVendorTemplate', 'providerTemplate', 'templateName'], ''), ''),
      lastErrorMessage: context.safeText(row.lastErrorMessage, ''),
      vendorExtensions: row.vendorExtensions || {}, raw: row
    };
  });

  window.ZentridAPIContracts = { clients, tenants, plants, devices, alerts, telemetry, integrations, diagnostics, fieldAudit, normalization };
})();
