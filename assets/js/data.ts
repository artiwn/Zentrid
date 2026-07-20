type ZentridMockKpi = {
  label: string;
  value: string;
  delta: string;
  icon: string;
  tone: string;
  route: string;
};

type ZentridMockHealthItem = {
  label: string;
  value: number;
};

type ZentridMockQualityItem = {
  label: string;
  value: string;
};

type ZentridMockAlert = {
  title: string;
  tenant: string;
  plant: string;
  severity: string;
  time: string;
};

type ZentridMockIntegration = {
  name: string;
  status: string;
  sync: string;
  errors: number;
};

type ZentridMockTenant = {
  name: string;
  plants: number;
  revenue: string;
  health: string;
};

type ZentridMockData = {
  kpis: ZentridMockKpi[];
  zentridHealth: ZentridMockHealthItem[];
  quality: ZentridMockQualityItem[];
  alerts: ZentridMockAlert[];
  integrations: ZentridMockIntegration[];
  tenants: ZentridMockTenant[];
  activity: string[];
};

type ZentridStoreKeyMap = {
  tenants: string;
  clients: string;
  plants: string;
  clientPlants: string;
  devices: string;
  clientDevices: string;
  integrations: string;
};

type ZentridStoreRecord = Record<string, unknown>;

type ZentridStoreIdField = string;

type ZentridLocalStoreApi = {
  KEYS: ZentridStoreKeyMap;
  read: (key: string, fallback?: ZentridStoreRecord[]) => ZentridStoreRecord[];
  write: (key: string, rows: ZentridStoreRecord[]) => void;
  upsert: (key: string, item: ZentridStoreRecord, idField?: ZentridStoreIdField) => ZentridStoreRecord[];
  remove: (key: string, id: unknown, idField?: ZentridStoreIdField) => void;
  byId: (key: string, id: unknown, idField?: ZentridStoreIdField) => ZentridStoreRecord | null;
  addTenant: (item: ZentridStoreRecord) => ZentridStoreRecord[];
  addClient: (item: ZentridStoreRecord) => ZentridStoreRecord[];
  addPlant: (item: ZentridStoreRecord) => void;
  addDevice: (item: ZentridStoreRecord) => void;
  addIntegration: (item: ZentridStoreRecord) => ZentridStoreRecord[];
  normalizePlantForClientModel: (plant?: ZentridStoreRecord) => ZentridStoreRecord;
  normalizeDeviceForClientModel: (device?: ZentridStoreRecord) => ZentridStoreRecord;
};

type ZentridDataOrigin = 'live' | 'mock' | 'local' | 'mixed';

type ZentridDataSourceSummary = {
  origin: ZentridDataOrigin;
  counts: Record<ZentridDataOrigin, number>;
  total: number;
};

type ZentridDataSourceApi = {
  origin(record: unknown, entity?: string): ZentridDataOrigin;
  label(origin: ZentridDataOrigin): string;
  badge(recordOrOrigin: unknown, entity?: string, compact?: boolean): string;
  summary(records: unknown[], entity?: string): ZentridDataSourceSummary;
  markLocal<T extends Record<string, unknown>>(record: T): T & { dataOrigin: 'local' };
  markChanged<T extends Record<string, unknown>>(record: T, entity?: string): T & { dataOrigin: 'local' | 'mixed' };
};

window.ZentridDataSource = window.ZentridDataSource || (() => {
  const labels: Record<ZentridDataOrigin, string> = {
    live: 'Live API',
    mock: 'Mock data',
    local: 'Local changes',
    mixed: 'Mixed sources'
  };

  function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : {};
  }

  function normalizedText(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }

  function explicitOrigin(record: Record<string, unknown>): ZentridDataOrigin | null {
    const candidate = normalizedText(record.dataOrigin || record.sourceOrigin || record._dataOrigin);
    return candidate === 'live' || candidate === 'mock' || candidate === 'local' || candidate === 'mixed'
      ? candidate
      : null;
  }

  function origin(record: unknown, entity = 'record'): ZentridDataOrigin {
    if (typeof record === 'string') {
      const value = normalizedText(record);
      if (value === 'live' || value === 'mock' || value === 'local' || value === 'mixed') return value;
    }

    const row = asRecord(record);
    const explicit = explicitOrigin(row);
    if (explicit) return explicit;

    const id = normalizedText(row.id);
    const externalId = normalizedText(row.externalId);
    const source = [row.source, row.sourceStatus, row.verification, row.tier, row.integration, row.accessScope]
      .map(normalizedText)
      .join(' ');
    const localSignals = [row.lastActivity, row.onboarding, row.account]
      .map(normalizedText)
      .join(' ');

    if (row.raw || id.startsWith('live-') || source.includes('live api') || source.includes('backend live')) return 'live';
    if (
      id.includes('-local-') ||
      externalId === 'manual' ||
      externalId === 'local-storage' ||
      source.includes('local draft') ||
      source.includes('manual / local') ||
      source.includes('manual entry') ||
      localSignals.includes('created now') ||
      localSignals.includes('client profile created') ||
      localSignals.includes('global admin intake')
    ) return 'local';

    const entityKey = normalizedText(entity);
    if (row.createdAt && ['tenant', 'client', 'plant', 'device'].includes(entityKey)) return 'local';
    return 'mock';
  }

  function label(value: ZentridDataOrigin): string {
    return labels[value];
  }

  function badge(recordOrOrigin: unknown, entity = 'record', compact = false): string {
    const value = origin(recordOrOrigin, entity);
    const compactClass = compact ? ' compact' : '';
    return `<span class="record-origin-chip ${value}${compactClass}" data-record-origin="${value}" title="Data source: ${labels[value]}">${labels[value]}</span>`;
  }

  function summary(records: unknown[], entity = 'record'): ZentridDataSourceSummary {
    const counts: Record<ZentridDataOrigin, number> = { live: 0, mock: 0, local: 0, mixed: 0 };
    for (const record of Array.isArray(records) ? records : []) counts[origin(record, entity)] += 1;
    const active = (Object.keys(counts) as ZentridDataOrigin[]).filter(key => counts[key] > 0);
    const resolved: ZentridDataOrigin = active.length > 1 ? 'mixed' : active[0] || 'mock';
    return { origin: resolved, counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
  }

  function markLocal<T extends Record<string, unknown>>(record: T): T & { dataOrigin: 'local' } {
    return { ...record, dataOrigin: 'local' };
  }

  function markChanged<T extends Record<string, unknown>>(record: T, entity = 'record'): T & { dataOrigin: 'local' | 'mixed' } {
    const dataOrigin = origin(record, entity) === 'live' ? 'mixed' : 'local';
    return { ...record, dataOrigin };
  }

  return { origin, label, badge, summary, markLocal, markChanged } satisfies ZentridDataSourceApi;
})();

window.ZentridMock = {
  kpis: [
    { label: 'Tenants', value: '124', delta: '+8 this month', icon: '🏢', tone: 'cyan', route: 'tenants' },
    { label: 'Plants', value: '4,285', delta: '+142 active', icon: '🏭', tone: 'green', route: 'asset-registry' },
    { label: 'Devices', value: '68,521', delta: '99.1% online', icon: '🔌', tone: 'blue', route: 'devices' },
    { label: 'Live Power', value: '1.24 GW', delta: '+2.1% vs yesterday', icon: '⚡', tone: 'yellow', route: 'telemetry' },
    { label: 'Active Incidents', value: '187', delta: '15 critical', icon: '🚨', tone: 'red', route: 'incident-center' },
    { label: 'Commercial Models', value: '€1.2M', delta: 'Financial Operations', icon: '💰', tone: 'violet', route: 'commercial-models' }
  ],
  zentridHealth: [
    { label: 'Normal', value: 81 },
    { label: 'Warning', value: 12 },
    { label: 'Fault', value: 5 },
    { label: 'Offline', value: 2 }
  ],
  quality: [
    { label: 'Telemetry', value: '98.7%' },
    { label: 'Alerts', value: '95.2%' },
    { label: 'Devices', value: '99.1%' },
    { label: 'Mappings', value: '97.4%' }
  ],
  alerts: [
    { title: 'Plant offline', tenant: 'Tenant Alpha Energy', plant: 'Plant A', severity: 'Critical', time: '4 min ago' },
    { title: 'BESS temperature warning', tenant: 'Tenant North Operations', plant: 'Armavir BESS', severity: 'High', time: '12 min ago' },
    { title: 'Telemetry Missing', tenant: 'Tenant Gamma Grid', plant: 'Madrid East', severity: 'Medium', time: '21 min ago' },
    { title: 'Inverter Fault Detected', tenant: 'Tenant Delta Enterprise', plant: 'Lyon PV Park', severity: 'Critical', time: '29 min ago' }
  ],
  integrations: [
    { name: 'Huawei FusionSolar', status: 'Healthy', sync: '1 min ago', errors: 0 },
    { name: 'Sungrow iSolarCloud', status: 'Delayed', sync: '18 min ago', errors: 4 },
    { name: 'SolarEdge', status: 'Healthy', sync: '2 min ago', errors: 0 },
    { name: 'Solis Cloud', status: 'Failed', sync: '54 min ago', errors: 12 }
  ],
  tenants: [
    { name: 'Tenant Alpha Energy', plants: 318, revenue: '€248k', health: 'Warning' },
    { name: 'Tenant North Operations', plants: 274, revenue: '€211k', health: 'Normal' },
    { name: 'Tenant Gamma Grid', plants: 195, revenue: '€174k', health: 'Fault' },
    { name: 'Tenant Delta Enterprise', plants: 166, revenue: '€132k', health: 'Normal' }
  ],
  activity: [
    'Tenant Tenant Alpha Energy changed integration credentials',
    'Critical alert assigned to Operations Team',
    'Huawei connector recovered after retry',
    'New plant commissioned: Gyumri Solar West',
    'Report exported by Global Admin',
    'User access policy updated for Tenant Admin role'
  ]
} satisfies ZentridMockData;


/* Zentrid local persistence layer for prototype CRUD.
   This keeps UI-created records visible after closing drawers, changing pages, or refreshing. */
window.ZentridLocalStore = window.ZentridLocalStore || (() => {
  const KEYS: ZentridStoreKeyMap = {
    tenants: 'zentrid_demo_tenants',
    clients: 'zentrid_custom_clients',
    plants: 'zentrid_demo_plants',
    clientPlants: 'zentrid_custom_plants',
    devices: 'zentrid_demo_devices',
    clientDevices: 'zentrid_custom_devices',
    integrations: 'zentrid_demo_integrations'
  };
  const read: ZentridLocalStoreApi['read'] = (key, fallback = []) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(value) ? value : fallback;
    } catch (err) { return fallback; }
  };
  const write: ZentridLocalStoreApi['write'] = (key, rows) => {
    localStorage.setItem(key, JSON.stringify(Array.isArray(rows) ? rows : []));
    window.dispatchEvent(new CustomEvent('zentrid:local-store-updated', { detail: { key } }));
  };
  const upsert: ZentridLocalStoreApi['upsert'] = (key, item, idField = 'id') => {
    const rows = read(key);
    const id = item && item[idField];
    if (!id) return rows;
    const index = rows.findIndex(x => x && x[idField] === id);
    if (index >= 0) rows[index] = { ...rows[index], ...item, updatedAt: new Date().toISOString() };
    else rows.unshift({ ...item, createdAt: item.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    write(key, rows);
    return rows;
  };
  const remove: ZentridLocalStoreApi['remove'] = (key, id, idField = 'id') => write(key, read(key).filter(x => x && x[idField] !== id));
  const byId: ZentridLocalStoreApi['byId'] = (key, id, idField = 'id') => read(key).find(x => x && x[idField] === id) || null;
  const addTenant: ZentridLocalStoreApi['addTenant'] = item => upsert(KEYS.tenants, item);
  const addClient: ZentridLocalStoreApi['addClient'] = item => upsert(KEYS.clients, item);
  const addPlant: ZentridLocalStoreApi['addPlant'] = item => {
    upsert(KEYS.plants, item);
    upsert(KEYS.clientPlants, normalizePlantForClientModel(item));
  };
  const addDevice: ZentridLocalStoreApi['addDevice'] = item => {
    upsert(KEYS.devices, item);
    upsert(KEYS.clientDevices, normalizeDeviceForClientModel(item));
  };
  const addIntegration: ZentridLocalStoreApi['addIntegration'] = item => upsert(KEYS.integrations, item);
  function normalizePlantForClientModel(p: ZentridStoreRecord = {}): ZentridStoreRecord {
    return {
      id: p.id || `PL-${Date.now()}`,
      code: p.code || p.plantCode || p.id || 'MANUAL-PLANT',
      externalId: p.externalId || 'LOCAL-STORAGE',
      name: p.name || p.plantName || 'New Plant',
      clientId: p.clientId || p.ownerClientId || p.client || 'CL-LOCAL',
      tenantId: p.tenantId || p.managingTenantId || '',
      portfolio: p.portfolio || 'Manual Portfolio',
      status: p.status || p.health || 'Draft',
      type: p.type || 'Commercial',
      country: p.country || 'Armenia',
      region: p.region || '—',
      city: p.city || '—',
      address: p.address || '—',
      timezone: p.timezone || 'Asia/Yerevan',
      capacityDc: typeof p.capacityDc === 'number' ? `${p.capacityDc} MWp` : (p.capacityDc || '0 MWp'),
      capacityAc: typeof p.capacityAc === 'number' ? `${p.capacityAc} MW` : (p.capacityAc || '0 MW'),
      gridCapacity: typeof p.gridCapacity === 'number' ? `${p.gridCapacity} MW` : (p.gridCapacity || '0 MW'),
      commissioning: p.commissioning || p.commissioned || '—',
      owner: p.owner || p.clientName || p.ownerName || 'Local Client',
      operator: p.operator || p.tenant || 'Tenant workspace',
      om: p.om || p.serviceProvider || p.operator || p.tenant || 'Tenant workspace',
      powerNow: p.powerNow || p.livePower || '0 kW',
      energyToday: p.energyToday || p.today || '0 kWh',
      alerts: Number(p.alerts || 0),
      health: p.health || p.status || 'Draft',
      panels: Number(p.panels || 0),
      inverters: Number(p.inverters || 0),
      strings: Number(p.strings || 0),
      transformers: Number(p.transformers || 0),
      meters: Number(p.meters || 0),
      battery: p.battery || 'No',
      devices: Array.isArray(p.devices) ? p.devices : [],
      dataOrigin: p.dataOrigin || 'local',
      updated: p.updated || p.updatedAt || '',
      lastSyncAt: p.lastSyncAt || '',
      sourceSystem: p.sourceSystem || p.vendor || (p.externalId === 'LOCAL-STORAGE' ? 'Manual / Local storage' : ''),
      integration: p.integration || p.sourceSystem || p.vendor || 'Manual / Local storage',
      latitude: p.latitude || p.lat || '',
      longitude: p.longitude || p.lng || '',
      raw: p.raw || undefined
    };
  }
  function normalizeDeviceForClientModel(d: ZentridStoreRecord = {}): ZentridStoreRecord {
    return {
      id: d.id || `DEV-${Date.now()}`,
      plantId: d.plantId || '',
      type: d.type || d.deviceType || 'Device',
      name: d.name || d.deviceName || 'New Device',
      vendor: d.vendor || d.manufacturer || 'Manual',
      manufacturer: d.manufacturer || d.vendor || 'Manual',
      model: d.model || 'Manual Model',
      serial: d.serial || d.serialNumber || d.sn || d.id || 'LOCAL-SERIAL',
      capacity: d.capacity || d.ratedPower || '—',
      firmware: d.firmware || '—',
      status: d.status || 'Online',
      location: d.location || d.parent || 'Plant level',
      lastSeen: d.lastSeen || 'Local draft',
      children: d.children || 'No child objects yet'
    };
  }
  return { KEYS, read, write, upsert, remove, byId, addTenant, addClient, addPlant, addDevice, addIntegration, normalizePlantForClientModel, normalizeDeviceForClientModel } satisfies ZentridLocalStoreApi;
})();
