type ZentridOverviewKpiData = {
  label: string;
  value: string;
  delta: string;
  icon: string;
  tone: string;
  route: string;
};

type ZentridOverviewHealthData = {
  label: string;
  value: number;
};

type ZentridOverviewQualityData = {
  label: string;
  value: string;
};

type ZentridOverviewAlertData = {
  title: string;
  tenant: string;
  plant: string;
  severity: string;
  time: string;
};

type ZentridOverviewIntegrationData = {
  name: string;
  status: string;
  sync: string;
  errors: number;
};

type ZentridOverviewTenantData = {
  name: string;
  plants: number;
  revenue: string;
  health: string;
};

type ZentridOverviewRuntimeStore = {
  kpis: ZentridOverviewKpiData[];
  zentridHealth: ZentridOverviewHealthData[];
  quality: ZentridOverviewQualityData[];
  alerts: ZentridOverviewAlertData[];
  integrations: ZentridOverviewIntegrationData[];
  tenants: ZentridOverviewTenantData[];
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

type ZentridDataOrigin = 'live' | 'unavailable' | 'local' | 'mixed';

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
    unavailable: 'Unavailable',
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
    return candidate === 'live' || candidate === 'unavailable' || candidate === 'local' || candidate === 'mixed'
      ? candidate
      : null;
  }

  function origin(record: unknown, entity = 'record'): ZentridDataOrigin {
    if (typeof record === 'string') {
      const value = normalizedText(record);
      if (value === 'live' || value === 'unavailable' || value === 'local' || value === 'mixed') return value;
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
    return 'unavailable';
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
    const counts: Record<ZentridDataOrigin, number> = { live: 0, unavailable: 0, local: 0, mixed: 0 };
    for (const record of Array.isArray(records) ? records : []) counts[origin(record, entity)] += 1;
    const active = (Object.keys(counts) as ZentridDataOrigin[]).filter(key => counts[key] > 0);
    const resolved: ZentridDataOrigin = active.length > 1 ? 'mixed' : active[0] || 'unavailable';
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

window.ZentridOverviewData = {
  kpis: [],
  zentridHealth: [],
  quality: [],
  alerts: [],
  integrations: [],
  tenants: [],
  activity: []
} satisfies ZentridOverviewRuntimeStore;

type ZentridApiOnlyApi = {
  enabled: true;
  legacyBusinessKeys: readonly string[];
  clearLegacyBusinessData(): void;
  emptyState(title: string, message: string, source?: string, actionHtml?: string): string;
  mountEmpty(title: string, message: string, source?: string, actionHtml?: string): void;
  guardUnsupportedPage(): void;
  disableUnconfirmedWrites(): void;
  isRouteSupported(route?: string): boolean;
  contentForCurrentRoute(content: string): string;
};

window.ZentridApiOnly = window.ZentridApiOnly || (() => {
  const legacyBusinessKeys = [
    'zentrid_demo_tenants',
    'zentrid_custom_clients',
    'zentrid_demo_plants',
    'zentrid_custom_plants',
    'zentrid_demo_devices',
    'zentrid_custom_devices',
    'zentrid_demo_integrations',
    'zentrid_tasks_v62',
    'zentrid_work_orders_v51',
    'zentrid_sop_templates_v51',
    'zentrid_incidents_v51',
    'zentrid_billing_payments_v1',
    'zentrid_financial_operations_v1'
  ] as const;

  const liveRoutes = new Set([
    '', 'index.html', 'tenants.html', 'tenant-detail.html', 'clients.html', 'client-detail.html',
    'plants.html', 'plant-detail.html', 'devices.html', 'device-detail.html', 'alerts.html',
    'alert-detail.html', 'integrations.html', 'integration-detail.html', 'api-console.html',
    'vendor-api-console.html'
  ]);

  const referenceRoutes = new Set([
    'alert-dictionary.html', 'alert-normalization.html', 'data-quality.html',
    'production-normalization.html', 'storage-normalization.html', 'ui-field-dictionary.html'
  ]);

  const routeLabels: Record<string, string> = {
    'admin-console.html': 'Admin Console',
    'analytics.html': 'Analytics',
    'asset-registry.html': 'Asset Registry',
    'asset-topology.html': 'Asset Topology',
    'audit-center.html': 'Audit Center',
    'audit.html': 'Audit',
    'billing-management.html': 'Billing Management',
    'billing-payments.html': 'Billing & Payments',
    'client-onboarding.html': 'Client Onboarding',
    'client-plant-assignment.html': 'Client Plant Assignment',
    'client-users-permissions.html': 'Client Users & Permissions',
    'command-center.html': 'Command Center',
    'commercial-agreements.html': 'Commercial Agreements',
    'commercial-models.html': 'Commercial Models',
    'crm-service.html': 'CRM Service',
    'data-governance.html': 'Data Governance',
    'energy-accounting.html': 'Energy Accounting',
    'exception-center.html': 'Exception Center',
    'finance.html': 'Finance',
    'group-detail.html': 'Group Detail',
    'groups.html': 'Groups',
    'incident-center.html': 'Incident Center',
    'incident-detail.html': 'Incident Detail',
    'integration-archive.html': 'Integration Archive',
    'integration-operations.html': 'Integration Operations',
    'invoice-center.html': 'Invoice Center',
    'licenses-subscriptions.html': 'Licenses & Subscriptions',
    'mapping-rules.html': 'Mapping Rules',
    'payment-settings.html': 'Payment Settings',
    'platform-operations.html': 'Platform Operations',
    'production.html': 'Production',
    'reports.html': 'Reports',
    'revenue-analytics.html': 'Revenue Analytics',
    'revenue-settlements.html': 'Revenue Settlements',
    'service-catalog.html': 'Service Catalog',
    'service-desk.html': 'Service Desk',
    'settings.html': 'Settings',
    'settlement-center.html': 'Settlement Center',
    'sop-center.html': 'SOP Center',
    'sop-detail.html': 'SOP Detail',
    'tariff-management.html': 'Tariff Management',
    'tariff-plans.html': 'Tariff Plans',
    'task-detail.html': 'Task Detail',
    'tasks-work-orders.html': 'Tasks & Work Orders',
    'telemetry.html': 'Telemetry',
    'tenant-provisioning.html': 'Tenant Provisioning',
    'user-access-detail.html': 'User Access Detail',
    'users.html': 'Users & Access',
    'work-order-detail.html': 'Work Order Detail',
    'work-orders.html': 'Work Orders'
  };

  function clearLegacyBusinessData(): void {
    for (const key of legacyBusinessKeys) {
      try { localStorage.removeItem(key); } catch (error) { /* storage may be blocked */ }
    }
  }

  function escapeHtml(value: unknown): string {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char] || char));
  }

  function emptyState(title: string, message: string, source = 'Backend API', actionHtml = ''): string {
    return `<section class="page-hero api-only-page-hero"><div><p class="eyebrow">API-only mode</p><h1>${escapeHtml(title)}</h1><p class="muted">Only records returned by the backend are displayed.</p></div></section>
      <section class="panel glass-card api-only-empty-panel" data-api-only-empty="true">
        <div class="empty-state zentrid-ux-state zentrid-ux-state-empty" role="status" aria-live="polite">
          <strong>No API data available</strong>
          <small>${escapeHtml(message)}</small>
          <small>Source: ${escapeHtml(source)}</small>
          ${actionHtml}
        </div>
      </section>`;
  }

  function mountEmpty(title: string, message: string, source = 'Backend API', actionHtml = ''): void {
    const html = emptyState(title, message, source, actionHtml);
    if (window.ZentridLayout && typeof window.ZentridLayout.mount === 'function') {
      window.ZentridLayout.mount(html);
      return;
    }
    const app = document.getElementById('app');
    if (app) app.innerHTML = html;
  }


  function disableUnconfirmedWrites(): void { /* UI structure and controls remain unchanged. */ }

  function currentRoute(): string {
    const path = location.pathname.split('/').filter(Boolean).pop() || '';
    return path.toLowerCase();
  }

  function isRouteSupported(route = currentRoute()): boolean {
    const normalized = String(route || '').toLowerCase();
    return normalized === 'login.html' || liveRoutes.has(normalized) || referenceRoutes.has(normalized);
  }

  function contentForCurrentRoute(content: string): string { return content; }

  function guardUnsupportedPage(): void { /* Never replace existing page structure. */ }

  clearLegacyBusinessData();
  // Existing page structure, tabs and actions are preserved.
  // Only legacy browser-stored business records are cleared.

  return { enabled: true, legacyBusinessKeys, clearLegacyBusinessData, emptyState, mountEmpty, guardUnsupportedPage, disableUnconfirmedWrites, isRouteSupported, contentForCurrentRoute } satisfies ZentridApiOnlyApi;
})();

/* Compatibility surface for legacy forms. Business records are no longer persisted locally.
   Create/update actions must use confirmed backend mutations or remain disabled/read-only. */
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
  const read: ZentridLocalStoreApi['read'] = () => [];
  const write: ZentridLocalStoreApi['write'] = key => {
    window.dispatchEvent(new CustomEvent('zentrid:local-store-blocked', { detail: { key, reason: 'api-only-mode' } }));
  };
  const upsert: ZentridLocalStoreApi['upsert'] = () => [];
  const remove: ZentridLocalStoreApi['remove'] = () => undefined;
  const byId: ZentridLocalStoreApi['byId'] = () => null;
  const addTenant: ZentridLocalStoreApi['addTenant'] = () => [];
  const addClient: ZentridLocalStoreApi['addClient'] = () => [];
  const addPlant: ZentridLocalStoreApi['addPlant'] = () => undefined;
  const addDevice: ZentridLocalStoreApi['addDevice'] = () => undefined;
  const addIntegration: ZentridLocalStoreApi['addIntegration'] = () => [];
  function normalizePlantForClientModel(p: ZentridStoreRecord = {}): ZentridStoreRecord {
    return {
      id: p.id || '',
      code: p.code || p.plantCode || p.id || '—',
      externalId: p.externalId || '—',
      name: p.name || p.plantName || '—',
      clientId: p.clientId || p.ownerClientId || p.client || '',
      tenantId: p.tenantId || p.managingTenantId || '',
      portfolio: p.portfolio || '—',
      status: p.status || p.health || 'Draft',
      type: p.type || '—',
      country: p.country || '—',
      region: p.region || '—',
      city: p.city || '—',
      address: p.address || '—',
      timezone: p.timezone || '—',
      capacityDc: typeof p.capacityDc === 'number' ? `${p.capacityDc} MWp` : (p.capacityDc || '0 MWp'),
      capacityAc: typeof p.capacityAc === 'number' ? `${p.capacityAc} MW` : (p.capacityAc || '0 MW'),
      gridCapacity: typeof p.gridCapacity === 'number' ? `${p.gridCapacity} MW` : (p.gridCapacity || '0 MW'),
      commissioning: p.commissioning || p.commissioned || '—',
      owner: p.owner || p.clientName || p.ownerName || '—',
      operator: p.operator || p.tenant || '—',
      om: p.om || p.serviceProvider || p.operator || p.tenant || '—',
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
      sourceSystem: p.sourceSystem || p.vendor || '',
      integration: p.integration || p.sourceSystem || p.vendor || '—',
      latitude: p.latitude || p.lat || '',
      longitude: p.longitude || p.lng || '',
      raw: p.raw || undefined
    };
  }
  function normalizeDeviceForClientModel(d: ZentridStoreRecord = {}): ZentridStoreRecord {
    return {
      id: d.id || '',
      plantId: d.plantId || '',
      type: d.type || d.deviceType || '—',
      name: d.name || d.deviceName || '—',
      vendor: d.vendor || d.manufacturer || '—',
      manufacturer: d.manufacturer || d.vendor || 'Manual',
      model: d.model || '—',
      serial: d.serial || d.serialNumber || d.sn || d.id || '—',
      capacity: d.capacity || d.ratedPower || '—',
      firmware: d.firmware || '—',
      status: d.status || '—',
      location: d.location || d.parent || '—',
      lastSeen: d.lastSeen || '—',
      children: d.children || '—'
    };
  }
  return { KEYS, read, write, upsert, remove, byId, addTenant, addClient, addPlant, addDevice, addIntegration, normalizePlantForClientModel, normalizeDeviceForClientModel } satisfies ZentridLocalStoreApi;
})();
