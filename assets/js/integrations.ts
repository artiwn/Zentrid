type IntegrationStatusTone = 'success' | 'warning' | 'danger' | 'neutral';

function integrationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type IntegrationTemplateDiscovery = {
  plants: number;
  devices: number;
  metrics: number;
  alerts: number;
};

type IntegrationVendorTemplate = {
  software: string;
  method: string;
  protocol: string;
  auth: string;
  base: string;
  port: string;
  format: string;
  sync: string;
  direction: string;
  regionOptions: string[];
  toggles: string[];
  connection: string[];
  credentials: string[];
  discovery: IntegrationTemplateDiscovery;
  scope: string;
  liveProviderTemplate?: boolean;
  templateName?: string;
  templateDetail?: Record<string, unknown>;
  rateLimit?: string | number;
  rateLimitPeriod?: string;
  syncFrequency?: string;
  syncStartTime?: string;
  lastSyncTimestampField?: string;
  vendorName?: string;
  integrationStatus?: string;
  connectionStatus?: string;
  sampleDataStatus?: string;
  authenticationStatus?: string;
  [key: string]: unknown;
};

type IntegrationVendorKey = keyof typeof vendorTemplates | string;

type LiveProviderTemplateState = {
  loaded: boolean;
  loading: boolean;
  names: string[];
  details: Record<string, Record<string, unknown>>;
  errors: Record<string, string>;
};

type IntegrationTenantOption = {
  id: string;
  name: string;
  [key: string]: unknown;
};

type IntegrationRecord = {
  id?: string;
  code?: string;
  name?: string;
  tenant?: string;
  vendor?: string;
  software?: string;
  status?: string;
  health?: string;
  auth?: string;
  discovery?: string;
  plants?: number;
  devices?: number;
  metrics?: number;
  alerts?: number;
  lastSync?: string;
  assignedTenants?: string;
  activeIntegrations?: number;
  version?: string;
  apiVersion?: string;
  mappingVersion?: string;
  authType?: string;
  discoveryEnabled?: string;
  baseUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  lastActivity?: string;
  lastSuccessfulSync?: string;
  vendorName?: string;
  allowedIpWhitelist?: string;
  domainWhitelist?: string;
  rateLimit?: string | number;
  rateLimitPeriod?: string;
  syncFrequency?: string;
  syncStartTime?: string;
  lastSyncTimestampField?: string;
  partnerVendorId?: string;
  accountId?: string;
  contactPhoneNumber?: string;
  contactName?: string;
  contactRole?: string;
  technicalContactEmail?: string;
  technicalContactPhone?: string;
  supportEmail?: string;
  archived?: boolean;
  archivedAt?: string;
  archiveReason?: string;
  archivedBy?: string;
  credentials?: Record<string, unknown>;
  [key: string]: unknown;
};

type IntegrationArchiveRecord = IntegrationRecord & {
  archived?: boolean;
  archivedAt?: string;
  archiveReason?: string;
  archivedBy?: string;
};

type IntegrationConfig = {
  authType: string;
  baseUrl: string;
  apiVersion: string;
  mappingVersion: string;
  discoveryEnabled: string;
};

type DetailGridItem = [string, unknown, string?];

function integrationElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function requireIntegrationElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = integrationElement<T>(id);
  if (!element) throw new Error(`Required integration element not found: ${id}`);
  return element;
}

var vendorTemplates: Record<string, IntegrationVendorTemplate> = {
  Huawei: {
    software: 'FusionSolar', method: 'API', protocol: 'REST / HTTPS', auth: 'OAuth 2.0 + Account', base: 'https://eu5.fusionsolar.huawei.com', port: '443', format: 'JSON', sync: 'Scheduled', direction: 'Inbound',
    regionOptions: ['Europe', 'Asia Pacific', 'Middle East', 'Global'],
    toggles: ['Northbound API Access', 'Historical Import', 'Data Scope'],
    connection: ['Region', 'Northbound API Access'],
    credentials: ['API Account Username', 'API Account Password', 'OAuth Tenant ID', 'OAuth Tenant Secret'],
    discovery: { plants: 14, devices: 126, metrics: 215, alerts: 58 },
    scope: 'Standard telemetry + critical/standard alert profile'
  },
  Solis: {
    software: 'SolisCloud', method: 'API', protocol: 'REST / HTTPS', auth: 'API Key Authentication', base: 'https://www.soliscloud.com', port: '443', format: 'JSON', sync: 'Scheduled', direction: 'Inbound',
    regionOptions: ['Global', 'Europe', 'Asia', 'US'],
    toggles: ['Historical Import', 'Data Scope'],
    connection: ['Region'],
    credentials: ['API Key', 'API Secret'],
    discovery: { plants: 5, devices: 35, metrics: 112, alerts: 24 },
    scope: 'Solar plant telemetry + inverter alerts'
  },
  GoodWe: {
    software: 'SEMS Portal', method: 'API', protocol: 'REST / HTTPS', auth: 'SEMS Account / OpenAPI', base: 'https://eu.semsportal.com', port: '443', format: 'JSON', sync: 'Scheduled', direction: 'Inbound',
    regionOptions: ['Europe', 'Global', 'China', 'Australia'],
    toggles: ['OpenAPI Access', 'API Credentials', 'Historical Import', 'Data Scope'],
    connection: ['Region', 'OpenAPI Access'],
    credentials: ['SEMS Account', 'SEMS Password', 'API Key', 'API Secret'],
    discovery: { plants: 9, devices: 84, metrics: 176, alerts: 39 },
    scope: 'SEMS account plants + OpenAPI metrics'
  },
  Deye: {
    software: 'DeyeCloud / Solarman', method: 'API', protocol: 'REST / HTTPS', auth: 'App ID / App Secret', base: 'https://global.solarmanpv.com', port: '443', format: 'JSON', sync: 'Scheduled', direction: 'Inbound',
    regionOptions: ['Global', 'Europe', 'Asia'],
    toggles: ['Historical Import', 'Data Scope'],
    connection: ['Region', 'Device Serial Number optional'],
    credentials: ['BaseURL', 'AppId', 'AppSecret', 'Email', 'Password', 'CompanyId'],
    discovery: { plants: 7, devices: 61, metrics: 142, alerts: 22 },
    scope: 'Cloud account + optional serial-filtered devices'
  },
  SolaX: {
    software: 'SolaX Cloud', method: 'API', protocol: 'REST / HTTPS', auth: 'Token Authentication', base: 'https://www.solaxcloud.com/proxyApp', port: '443', format: 'JSON', sync: 'Scheduled', direction: 'Inbound',
    regionOptions: ['Global', 'Europe', 'US'],
    toggles: ['Historical Import', 'Data Scope'],
    connection: ['Region', 'Registration Number / Device Serial Number'],
    credentials: ['BaseURL', 'Login', 'Password', 'ClientId', 'ClientSecret', 'TokenEndpoint'],
    discovery: { plants: 4, devices: 29, metrics: 96, alerts: 18 },
    scope: 'Token-linked plant and device telemetry'
  },
  Sungrow: {
    software: 'iSolarCloud', method: 'API', protocol: 'REST / HTTPS', auth: 'App Key Authentication', base: 'https://gateway.isolarcloud.com', port: '443', format: 'JSON', sync: 'Scheduled', direction: 'Inbound',
    regionOptions: ['Europe', 'Global', 'China', 'Australia'],
    toggles: ['Historical Import', 'Data Scope'],
    connection: ['Region', 'Plant ID optional'],
    credentials: ['App Key', 'Access Key'],
    discovery: { plants: 11, devices: 98, metrics: 174, alerts: 31 },
    scope: 'iSolarCloud plant list + optional plant filter'
  },
  Peimar: {
    software: 'Peimar X Portal', method: 'API', protocol: 'REST / HTTPS', auth: 'Portal Account / API Token', base: 'https://portal.peimar.com', port: '443', format: 'JSON', sync: 'Scheduled', direction: 'Inbound',
    regionOptions: ['Europe', 'Global'],
    toggles: ['Historical Import', 'Data Scope'],
    connection: ['Portal URL', 'Device Serial Number optional'],
    credentials: ['Portal Account', 'Portal Password', 'API Token'],
    discovery: { plants: 3, devices: 18, metrics: 82, alerts: 12 },
    scope: 'Portal account plants + optional API token access'
  },
  Other: {
    software: 'Custom Platform', method: 'Custom', protocol: 'Custom', auth: 'Dynamic Authentication', base: 'Defined manually', port: 'Custom', format: 'JSON / XML / CSV', sync: 'Manual', direction: 'Inbound',
    regionOptions: ['Custom / Global'],
    toggles: ['Historical Import', 'Data Scope'],
    connection: ['Platform Name', 'Integration Method', 'Connection Parameters'],
    credentials: ['Credential Name', 'Credential Value', 'Additional Parameters'],
    discovery: { plants: 0, devices: 0, metrics: 0, alerts: 0 },
    scope: 'Custom mapping based on provided parameters'
  }
};

const liveProviderTemplateState: LiveProviderTemplateState = {
  loaded: false,
  loading: false,
  names: [],
  details: {},
  errors: {}
};

function templateVendorKey(name: unknown): string{
  const text = String(name || '').trim();
  if (!text) return 'Other';
  if (/deye/i.test(text)) return 'DeyeCloud';
  if (/solarx|solax/i.test(text)) return 'Solarx';
  return text;
}
const fallbackIntegrationVendorTemplate: IntegrationVendorTemplate = vendorTemplates.Other ?? {
  software:'Custom Platform', method:'Custom', protocol:'Custom', auth:'Dynamic Authentication', base:'Defined manually', port:'Custom', format:'JSON / XML / CSV', sync:'Manual', direction:'Inbound',
  regionOptions:['Custom / Global'], toggles:['Historical Import', 'Data Scope'], connection:['Platform Name', 'Integration Method', 'Connection Parameters'], credentials:['Credential Name', 'Credential Value'],
  discovery:{ plants:0, devices:0, metrics:0, alerts:0 }, scope:'Custom mapping based on provided parameters'
};
function resolveIntegrationVendorTemplate(name: unknown): IntegrationVendorTemplate {
  const key = String(name || 'Other');
  return vendorTemplates[key] || vendorTemplates[templateVendorKey(key)] || fallbackIntegrationVendorTemplate;
}

function titleFromCamel(key: unknown): string{
  return String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function objectValueAt(obj: unknown, paths: string[], fallback = ''): string{
  for (const path of paths) {
    let cursor: unknown = obj;
    String(path).split('.').forEach((part) => { cursor = toRecord(cursor)[part]; });
    if (cursor !== undefined && cursor !== null && cursor !== '') return String(cursor);
  }
  return fallback;
}
function liveTemplateCredentials(detail: Record<string, unknown>): string[] | null{
  const source = toRecord(detail.connectionAuthentication || detail.authentication || detail.credentials);
  const blacklist = new Set(['connectionStatus','sampleDataStatus','authenticationStatus','notes']);
  const keys = Object.keys(source || {}).filter(k => !blacklist.has(k));
  if (!keys.length) return null;
  return keys.map(titleFromCamel);
}
function mergeLiveVendorTemplate(name: string, detail: Record<string, unknown> = {}): IntegrationVendorTemplate{
  const key = templateVendorKey(name);
  const lower = key.toLowerCase();
  const fallbackKey = /deye/.test(lower) ? 'Deye' : /solarx|solax/.test(lower) ? 'SolaX' : key;
  const base = vendorTemplates[key] || vendorTemplates[fallbackKey] || fallbackIntegrationVendorTemplate;
  const credentials = liveTemplateCredentials(detail);
  const general = toRecord(detail.general);
  const apiRequest = toRecord(detail.apiRequest);
  const sync = toRecord(detail.synchronization);
  const connection = toRecord(detail.connectionAuthentication);

  const mergedTemplate: IntegrationVendorTemplate = {
    ...base,
    software: objectValueAt(detail, ['software','displayName','general.integrationName','general.producerVendorTemplate'], base.software || key),
    method: objectValueAt(detail, ['method','general.integrationMethod'], base.method || 'API'),
    protocol: objectValueAt(detail, ['protocol','apiRequest.protocol'], base.protocol || 'REST / HTTPS'),
    auth: objectValueAt(detail, ['auth','authType','connectionAuthentication.authenticationStatus'], base.auth || 'Backend template auth'),
    base: objectValueAt(detail, ['baseUrl','host','endpoint','connectionAuthentication.baseUrl','general.baseUrl'], base.base || 'Managed by backend template'),
    port: objectValueAt(detail, ['port','apiRequest.port'], base.port || '443'),
    format: objectValueAt(detail, ['format','dataFormat','apiRequest.format'], base.format || 'JSON'),
    sync: objectValueAt(sync, ['syncFrequency'], String(sync.syncFrequency || base.sync || 'Scheduled')),
    direction: objectValueAt(detail, ['direction','apiRequest.direction'], base.direction || 'Inbound'),
    credentials: credentials || base.credentials || ['API Account Username', 'API Account Password'],
    discovery: base.discovery || { plants: 0, devices: 0, metrics: 0, alerts: 0 },
    scope: 'Backend provider template loaded from Swagger API',
    liveProviderTemplate: true,
    templateName: name,
    templateDetail: detail,
    rateLimit: String(apiRequest.rateLimit || ''),
    rateLimitPeriod: String(apiRequest.rateLimitPeriod || ''),
    syncFrequency: String(sync.syncFrequency || ''),
    syncStartTime: String(sync.syncStartTime || ''),
    lastSyncTimestampField: String(sync.lastSyncTimestampField || ''),
    vendorName: String(general.vendorName || ''),
    integrationStatus: String(general.integrationStatus || ''),
    connectionStatus: String(connection.connectionStatus || ''),
    sampleDataStatus: String(connection.sampleDataStatus || ''),
    authenticationStatus: String(connection.authenticationStatus || '')
  };
  vendorTemplates[key] = mergedTemplate;
  return mergedTemplate;
}
function allVendorTemplateKeys(): string[]{
  const live = liveProviderTemplateState.names.map(templateVendorKey);
  const mock = Object.keys(vendorTemplates);
  return Array.from(new Set([...live, ...mock]));
}

function refreshVendorFilterOptions(): void{
  const filter = integrationElement<HTMLSelectElement>('vendorFilter');
  if (!filter) return;
  const current = filter.value || 'All Vendors';
  filter.innerHTML = `<option>All Vendors</option>${allVendorTemplateKeys().map(v=>`<option>${v}</option>`).join('')}`;
  if (Array.from(filter.options).some(option => option.value === current)) filter.value = current;
}

function vendorOptionsHtml(selected?: string): string{
  const live = liveProviderTemplateState.names.map(templateVendorKey);
  const liveSet = new Set(live);
  const mock = Object.keys(vendorTemplates).filter(k => !liveSet.has(k));
  const option = (key: string) => `<option value="${key}" ${key === selected ? 'selected' : ''}>${key}${liveSet.has(key) ? ' · live template' : ''}</option>`;
  const livePart = live.length ? `<optgroup label="Backend provider templates">${live.map(option).join('')}</optgroup>` : '';
  const mockPart = mock.length ? `<optgroup label="Mock fallback templates">${mock.map(option).join('')}</optgroup>` : '';
  return livePart + mockPart;
}
function renderLiveTemplateStatus(vendor: string, state: 'idle' | 'loading' | 'success' | 'error' = 'idle', detail: Record<string, unknown> | null = null, message = ''): void{
  const box = document.getElementById('liveTemplateStatus');
  if (!box) return;
  const tpl = vendorTemplates[vendor] || vendorTemplates[templateVendorKey(vendor)] || null;
  const isLive = Boolean(tpl?.liveProviderTemplate || detail);
  const cls = state === 'error' ? 'danger' : isLive ? 'success' : state === 'loading' ? 'warning' : 'neutral';
  const label = state === 'loading' ? 'Loading provider template…' : state === 'error' ? 'Template unavailable' : isLive ? 'Live template applied' : 'Mock fallback template';
  const meta = message || (isLive ? `Loaded from /api/admin/provider-integrations/templates/${tpl?.templateName || vendor}` : 'Backend template is not available yet. Existing mock template remains active.');
  box.innerHTML = `<span class="badge ${cls}">${label}</span><small>${meta}</small>`;
}
function applyTemplateDetailToForm(vendor: string): void{
  const tpl = vendorTemplates[vendor] || vendorTemplates[templateVendorKey(vendor)];
  if (!tpl) return;
  const setIfEmpty = (id: string, value: unknown) => {
    const el = document.getElementById(id);
    if (!el || value === undefined || value === null || value === '') return;
    if (!el.value || el.disabled) el.value = String(value);
  };
  setIfEmpty('rateLimit', tpl.rateLimit);
  setIfEmpty('rateLimitPeriod', tpl.rateLimitPeriod);
  setIfEmpty('syncFrequency', tpl.syncFrequency);
  setIfEmpty('syncStartTime', tpl.syncStartTime);
  setIfEmpty('lastSyncTimestampField', tpl.lastSyncTimestampField);
  setIfEmpty('vendorName', tpl.vendorName || vendor);
  const statusEl = integrationElement<HTMLInputElement>('integrationStatus');
  if (statusEl && tpl.integrationStatus) statusEl.value = tpl.integrationStatus;
  const connectionResult = document.getElementById('connectionResult');
  const discoveryStatus = document.getElementById('discoveryStatus');
  const readyAuth = document.getElementById('readyAuth');
  if (tpl.connectionStatus && connectionResult) connectionResult.textContent = tpl.connectionStatus;
  if (tpl.sampleDataStatus && discoveryStatus) discoveryStatus.textContent = tpl.sampleDataStatus;
  if (tpl.authenticationStatus && readyAuth) readyAuth.textContent = tpl.authenticationStatus;
}
async function fetchProviderTemplateDetail(vendor: string): Promise<Record<string, unknown> | null>{
  const key = templateVendorKey(vendor);
  const apiName = liveProviderTemplateState.names.find(n => templateVendorKey(n) === key) || key;
  const cached = liveProviderTemplateState.details[key];
  if (cached) return cached;

  // The active backend currently exposes only GET /templates (the provider-name list).
  // GET /templates/{providerType} is catalogued as manual/unsupported and returns 404,
  // so the UI must not call it automatically. Keep the vendor-specific local field
  // template as a transparent fallback until the backend publishes a detail contract.
  mergeLiveVendorTemplate(apiName, {});
  renderLiveTemplateStatus(
    key,
    'idle',
    null,
    `Provider “${apiName}” is available in the backend template list. Detailed fields use the local UX template because the template-detail endpoint is not available.`
  );
  applyTemplateDetailToForm(key);
  return null;
}
async function loadLiveProviderTemplates(): Promise<void>{
  if (liveProviderTemplateState.loading || liveProviderTemplateState.loaded) return;
  if (!window.ZentridPlatformAPI?.providerIntegrations?.templates) return;
  liveProviderTemplateState.loading = true;
  const select = integrationElement<HTMLSelectElement>('vendorSelect');
  renderLiveTemplateStatus(select?.value || 'Other', 'loading', null, 'Loading available provider templates…');
  try {
    const names = await ZentridPlatformAPI.providerIntegrations.templates();
    liveProviderTemplateState.names = Array.isArray(names) ? names : [];
    liveProviderTemplateState.loaded = true;
    liveProviderTemplateState.names.forEach(name => mergeLiveVendorTemplate(name, {}));
    refreshVendorFilterOptions();
    if (select) {
      const previous = select.value || templateVendorKey(liveProviderTemplateState.names[0] || 'Other') || 'Other';
      select.innerHTML = vendorOptionsHtml(previous);
      if (!select.value && select.options.length) select.selectedIndex = 0;
      hydrateVendor();
      await fetchProviderTemplateDetail(select.value || 'Other');
    }
    const count = liveProviderTemplateState.names.length;
    renderLiveTemplateStatus(select?.value || 'Other', count ? 'success' : 'idle', null, count ? `${count} backend provider template(s) available. Mock templates are preserved as fallback.` : 'No backend templates returned. Mock templates remain active.');
  } catch (error) {
    renderLiveTemplateStatus(select?.value || 'Other', 'error', null, 'Unable to load provider template list. Mock templates remain active.');
  } finally {
    liveProviderTemplateState.loading = false;
  }
}


var integrations: IntegrationRecord[] = JSON.parse(localStorage.getItem('zentrid_demo_integrations') || 'null') || [
  {id:'INT-00091',code:'INT-HUAWEI-001',name:'Tenant Alpha Energy — Huawei FusionSolar',tenant:'Tenant Alpha Energy',vendor:'Huawei',software:'FusionSolar',status:'Active',health:'Healthy',auth:'Valid',discovery:'Completed',plants:142,devices:1840,metrics:215,alerts:58,lastSync:'2 min ago',assignedTenants:'Global',activeIntegrations:18,version:'v2.4.1',apiVersion:'2024-11',mappingVersion:'Solar Core v1.8',authType:'OAuth 2.0 + Account',discoveryEnabled:'Yes',baseUrl:'https://eu5.fusionsolar.huawei.com',createdBy:'Global Admin',createdAt:'2026-05-12',updatedBy:'Integration Admin',updatedAt:'2026-06-04',lastActivity:'2 min ago',lastSuccessfulSync:'2 min ago',vendorName:'Huawei FusionSolar',allowedIpWhitelist:'203.0.113.10, 203.0.113.24',domainWhitelist:'eu5.fusionsolar.huawei.com, api.fusionsolar.huawei.com',rateLimit:'1000',rateLimitPeriod:'Hour',syncFrequency:'5 min',syncStartTime:'00:00',lastSyncTimestampField:'updated_at',partnerVendorId:'HUA-EU-2048',accountId:'FS-OPS-7712',contactPhoneNumber:'+49 30 5557 1400',contactName:'Martin Keller',contactRole:'Mr.',technicalContactEmail:'fusion.support@vendorcloud.example',technicalContactPhone:'+49 30 5557 1401',supportEmail:'support@vendorcloud.example'},
  {id:'INT-00092',code:'INT-SUNGROW-002',name:'Tenant North Operations — Sungrow iSolarCloud',tenant:'Tenant North Operations',vendor:'Sungrow',software:'iSolarCloud',status:'Inactive',health:'Warning',auth:'Valid',discovery:'Completed With Warnings',plants:58,devices:790,metrics:174,alerts:31,lastSync:'18 min ago',assignedTenants:'12 Tenants',activeIntegrations:12,version:'v1.9.0',apiVersion:'2024-08',mappingVersion:'Solar Core v1.7',authType:'App Key Authentication',discoveryEnabled:'Yes',baseUrl:'https://gateway.isolarcloud.com',createdBy:'Global Admin',createdAt:'2026-05-18',updatedBy:'Integration Admin',updatedAt:'2026-06-03',lastActivity:'18 min ago',lastSuccessfulSync:'18 min ago',vendorName:'Sungrow iSolarCloud',allowedIpWhitelist:'198.51.100.12, 198.51.100.44',domainWhitelist:'gateway.isolarcloud.com',rateLimit:'800',rateLimitPeriod:'Hour',syncFrequency:'15 min',syncStartTime:'00:10',lastSyncTimestampField:'timestamp',partnerVendorId:'SUN-GLB-1180',accountId:'ISC-442918',contactPhoneNumber:'+44 20 5550 9182',contactName:'Emily Carter',contactRole:'Ms.',technicalContactEmail:'isolar.support@vendorcloud.example',technicalContactPhone:'+44 20 5550 9183',supportEmail:'support@vendorcloud.example'},
  {id:'INT-00093',code:'INT-SOLIS-003',name:'Tenant Gamma Grid — Solis SolisCloud',tenant:'Tenant Gamma Grid',vendor:'Solis',software:'SolisCloud',status:'Inactive',health:'Failed',auth:'Expired',discovery:'Failed',plants:0,devices:0,metrics:0,alerts:0,lastSync:'54 min ago',assignedTenants:'4 Tenants',activeIntegrations:4,version:'v1.3.6',apiVersion:'2024-03',mappingVersion:'Solar Core v1.5',authType:'API Key Authentication',discoveryEnabled:'No',baseUrl:'https://www.soliscloud.com',createdBy:'Global Admin',createdAt:'2026-04-28',updatedBy:'Integration Admin',updatedAt:'2026-05-29',lastActivity:'54 min ago',lastSuccessfulSync:'Previous period',vendorName:'SolisCloud',allowedIpWhitelist:'192.0.2.15, 192.0.2.29',domainWhitelist:'www.soliscloud.com',rateLimit:'500',rateLimitPeriod:'Hour',syncFrequency:'30 min',syncStartTime:'00:20',lastSyncTimestampField:'lastUpdateTime',partnerVendorId:'SOLIS-OPS-5031',accountId:'SC-907144',contactPhoneNumber:'+1 555 672 4400',contactName:'Laura Smith',contactRole:'Ms.',technicalContactEmail:'solis.support@vendorcloud.example',technicalContactPhone:'+1 555 672 4401',supportEmail:'support@vendorcloud.example'}
];
function saveInts(): void{ if (window.ZentridLiveIntegrations === integrations) { window.ZentridLiveIntegrations = integrations; return; } if (window.ZentridLocalStore) ZentridLocalStore.write(ZentridLocalStore.KEYS.integrations, integrations); else localStorage.setItem('zentrid_demo_integrations', JSON.stringify(integrations)); }

function integrationTenants(): IntegrationTenantOption[]{
  const stored = JSON.parse(localStorage.getItem('zentrid_demo_tenants') || 'null');
  if (stored && stored.length) return stored;
  return [
    {id:'CLT-000125', name:'Tenant Alpha Energy'},
    {id:'CLT-000126', name:'Tenant North Operations'},
    {id:'CLT-000127', name:'Tenant Gamma Grid'},
    {id:'CLT-000128', name:'Tenant Delta Enterprise'}
  ];
}
function selectedIntegrationTenantName(): string{
  const scoped = localStorage.getItem('zentrid_integration_tenant') || '';
  const tenants = integrationTenants();
  if (scoped && scoped !== 'All Tenants') return scoped;
  return tenants[0]?.name || '';
}
function tenantOptions(selected?: string): string{
  return integrationTenants().map(c => `<option value="${c.name}" ${c.name === selected ? 'selected' : ''}>${c.name}</option>`).join('');
}
function autoIntegrationName(): string{
  const tenant = document.getElementById('tenantSelect')?.value || '';
  const vendor = document.getElementById('vendorSelect')?.value || 'Huawei';
  const tpl = resolveIntegrationVendorTemplate(vendor);
  return tenant ? `${tenant} — ${vendor} ${tpl.software}` : `${vendor} ${tpl.software}`;
}
function updateIntegrationName(force = false): void{
  const input = integrationElement<HTMLInputElement>('integrationName');
  if (!input) return;
  if (force || !input.dataset.touched || !input.value.trim()) input.value = autoIntegrationName();
}
function statusCls(v: unknown): IntegrationStatusTone{
  const text = String(v).toLowerCase();
  if (text.includes('fail') || text.includes('expired') || text.includes('critical')) return 'danger';
  if (text.includes('archived') || text.includes('disabled')) return 'neutral';
  if (text.includes('warning') || text.includes('testing') || text.includes('draft') || text.includes('inactive')) return 'warning';
  return 'success';
}
function connectorStatus(x: Partial<IntegrationRecord>): string{
  const value = String(x?.status || '').toLowerCase();
  if (value === 'active') return 'Active';
  if (value === 'archived') return 'Archived';
  return 'Inactive';
}

function assignedTenantsLabel(x: Partial<IntegrationRecord>): string{
  return x?.assignedTenants || (x?.tenant === 'All Tenants' ? 'Global' : '1 Tenant');
}
function connectorConfig(x: Partial<IntegrationRecord>): IntegrationConfig{
  const vendor = x?.vendor || 'Other';
  const tpl = resolveIntegrationVendorTemplate(vendor);
  return {
    authType: x?.authType || tpl.auth || 'Dynamic Authentication',
    baseUrl: x?.baseUrl || tpl.base || 'Defined manually',
    apiVersion: x?.apiVersion || 'Vendor API',
    mappingVersion: x?.mappingVersion || 'Solar Core v1.0',
    discoveryEnabled: x?.discoveryEnabled || (String(x?.discovery || '').toLowerCase().includes('completed') ? 'Yes' : 'No')
  };
}
function integrationRowActions(record: IntegrationRecord): string{
  const id = record.id;
  const status = connectorStatus(record);
  const origin = ZentridDataSource.origin(record, 'integration');
  return `<div class="archive-actions-cell integration-row-actions">
    <div class="kebab-wrap">
      <button class="kebab-btn" data-action="menu" aria-label="Open connector actions" title="Actions">⋮</button>
      <div class="kebab-menu" data-menu-for="${id}">
        <button data-int-action="edit" data-permission-action="edit" data-permission-resource="integration" data-permission-status="${status}" data-permission-origin="${origin}" data-permission-update-available="false" data-permission-local-override="true">Edit</button>
        <button data-int-action="archive" data-permission-action="archive" data-permission-resource="integration" data-permission-status="${status}" data-permission-origin="${origin}">Archive</button>
      </div>
    </div>
  </div>`;
}
function integrationRows(rows: IntegrationRecord[]): string{
  return `<div class="data-table integration-table integration-table-actions"><div class="data-head"><span>Connector</span><span>Vendor / Type</span><span>Assigned Tenants</span><span>Status</span><span>Last Activity</span><span>Actions</span></div>${rows.map(x => { const cStatus = connectorStatus(x); return `<div class="data-row clickable-row" data-id="${x.id}" role="button" tabindex="0"><div>${ZentridDataSource.badge(x, 'integration')}<strong>${x.vendor} ${x.software}</strong><small>${x.code}<br>${x.id}</small></div><div><strong>${x.vendor}</strong><small>${resolveIntegrationVendorTemplate(x.vendor || 'Other').method}</small></div><div><strong>${assignedTenantsLabel(x)}</strong><small>${x.tenant || 'Platform scope'}</small></div><div class="integration-health-cell"><span class="badge ${statusCls(cStatus)}">${cStatus}</span><small>Lifecycle controlled by Global Admin</small></div><div><strong>${x.lastActivity || x.lastSync || '—'}</strong><small>Last successful sync: ${x.lastSuccessfulSync || x.lastSync || '—'}</small></div>${integrationRowActions(x)}</div>`; }).join('')}</div>`;
}
function renderIntegrations(): string{
  const tenant = localStorage.getItem('zentrid_integration_tenant') || 'All Tenants';
  return `<section class="page-hero"><div><p class="eyebrow">Global Admin · Connector Registry</p><h1>Connector Registry</h1><p class="muted">Reusable vendor connector definitions with status, tenant assignment and registry metadata.</p></div><button class="create-action" id="openIntegrationWizard" type="button" data-permission-action="create" data-permission-resource="integration"><span class="pulse"></span><div><strong>+ New Connector</strong><small>${tenant}</small></div></button></section><section class="context-bar glass-card"><button class="ctx-item"><span>Visible Integrations</span><strong>${integrations.filter(x=>!isArchivedIntegration(x)).length}</strong></button><button class="ctx-item"><span>Active</span><strong>${integrations.filter(x=>!isArchivedIntegration(x) && connectorStatus(x)==='Active').length}</strong></button><button class="ctx-item"><span>Inactive</span><strong>${integrations.filter(x=>!isArchivedIntegration(x) && connectorStatus(x)==='Inactive').length}</strong></button><button class="ctx-item"><span>Tenant Scope</span><strong>${tenant}</strong></button></section><section class="panel glass-card"><div class="panel-head"><div><h2>Vendor Connectors</h2><p>Click a connector row to open registry details. Operational sync monitoring belongs to Connector Operations.</p></div><div class="toolbar"><input id="intSearch" placeholder="Search connector, vendor, tenant..."/><select id="vendorFilter"><option>All Vendors</option>${allVendorTemplateKeys().map(v=>`<option>${v}</option>`).join('')}</select></div></div><div id="integrationTable">${integrationRows(integrations.filter(x=>!isArchivedIntegration(x)))}</div></section>${integrationWizard(tenant)}`;
}
function integrationWizard(_tenant?: string): string{
  const steps = ['General','Connection & Authentication','API Request','Synchronization','Partner Account'];
  const stepDescriptions: Record<string, string> = {
    'General': 'Define the connector identity, vendor name and intended lifecycle status. New connectors start Inactive until validation is complete.',
    'Connection & Authentication': 'Configure the vendor host, whitelist rules and credentials. Local prototype checks never send credentials to a backend.',
    'API Request': 'Define request limits and throttling parameters used by the connector adapter.',
    'Synchronization': 'Define the schedule and timestamp field used by the sync pipeline. Failed-sync handling belongs to Connector Operations.',
    'Partner Account': 'Capture optional vendor-side account and support contacts, then review the connector before local creation.'
  };
  const stepIntro = (name: string) => `<div class="wizard-description full"><strong>${name}</strong><p>${stepDescriptions[name] || ''}</p><textarea name="${name.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_notes" placeholder="Notes for ${name}..."></textarea></div>`;
  return `<aside class="modal" id="intModal" role="dialog" aria-modal="true" aria-labelledby="integrationWizardTitle">
  <div class="modal-card wide-modal">
    <button class="modal-close" id="closeIntModal" type="button" aria-label="Close connector wizard">×</button>
    <p class="eyebrow">Integration Parameters</p>
    <h2 id="integrationWizardTitle">Connect Vendor Platform</h2>
    <p class="muted">Admin-facing setup only: identity, connection address, vendor credentials, API limits, synchronization and partner/account contact context.</p>
    <div class="integration-prototype-note"><span class="badge warning">Local prototype</span><small>Configuration and checks remain in this browser until backend write contracts are available. Credential values are not stored.</small></div>
    <div id="integrationValidationSummary" class="form-validation-summary" role="alert" tabindex="-1" hidden></div>
    <div class="setup-layout">
      <div class="setup-rail" aria-label="Connector setup steps">${steps.map((name,index)=>`<button type="button" class="${index===0?'active':''}" data-step="${index}" ${index===0?'aria-current="step"':''}><b>${index+1}</b><span>${name}</span></button>`).join('')}</div>
      <form id="intForm" class="form-grid setup-form" novalidate data-zentrid-form-readiness="local" data-zentrid-form-contract="ProviderIntegrationCreateDraft" data-zentrid-form-endpoint="/api/admin/provider-integrations" data-zentrid-form-method="POST" data-zentrid-form-api-note="Credentials are redacted in preview; the current wizard continues to create a local connector draft.">
        <div class="wizard-step active" data-integration-step="general">
          <label class="full">Integration Name *<input name="name" id="integrationName" required minlength="3" maxlength="120" placeholder="Auto-generated from Vendor"></label>
          <label>Integration Code <input id="integrationCode" disabled value="Auto-generated"></label>
          <label>Producer / Vendor Template *<select name="vendor" id="vendorSelect" required>${vendorOptionsHtml('Huawei')}</select></label>
          <div class="wizard-live-template full" id="liveTemplateStatus"><span class="badge neutral">Template source</span><small>Mock fallback template is active until backend templates load.</small></div>
          <label>Vendor Name *<input name="vendorName" id="vendorName" required minlength="2" maxlength="100" placeholder="Vendor company name"></label>
          <label>Integration Status <input id="integrationStatus" disabled value="Inactive"></label>
          <div class="integration-page-actions full" aria-label="Desired connector lifecycle status"><button type="button" class="primary-action" id="activateIntegration">Activate Integration</button><button type="button" id="suspendIntegration">Keep Inactive</button><button type="button" id="archiveIntegration">Archive</button></div>
          <div class="integration-lifecycle-hint full" id="integrationLifecycleHint" aria-live="polite">New connectors remain Inactive until connection and sample-data checks pass.</div>
          ${stepIntro('General')}
        </div>
        <div class="wizard-step" data-integration-step="connection">
          <label class="full">Base URL / Host Address *<input id="baseUrl" name="baseUrl" type="url" required placeholder="https://vendor.example.com"></label>
          <label class="full">Callback URL <input id="callbackUrl" disabled value="Auto-generated when needed"></label>
          <label class="full">Allowed IP Whitelist <textarea name="allowedIpWhitelist" placeholder="One IPv4 address or CIDR per line"></textarea></label>
          <label class="full">Domain Whitelist <textarea name="domainWhitelist" placeholder="One domain or wildcard domain per line"></textarea></label>
          <div class="full dynamic-fields" id="credentialFields"></div>
          <div class="timeline-mini full" id="authResult" aria-live="polite">Status: Not Tested</div>
          <div class="readiness full"><h3>Connection Checks</h3><p>Connection <b id="connectionResult" data-state="pending">Not tested</b></p><p>Sample Data <b id="discoveryStatus" data-state="pending">Not tested</b></p><p>Authentication <b id="readyAuth" data-state="pending">Pending</b></p></div>
          <div class="integration-page-actions full"><button type="button" class="primary-action" id="connectionTest">Test Connection</button><button type="button" id="authTest">Test Sample Data</button></div>
          ${stepIntro('Connection & Authentication')}
        </div>
        <div class="wizard-step" data-integration-step="api">
          <label>Rate Limit <input id="rateLimit" name="rateLimit" type="number" min="1" step="1" placeholder="Example: 1000"></label>
          <label>Rate Limit Period <select id="rateLimitPeriod" name="rateLimitPeriod"><option>Minute</option><option selected>Hour</option><option>Day</option></select></label>
          ${stepIntro('API Request')}
        </div>
        <div class="wizard-step" data-integration-step="synchronization">
          <label>Sync Frequency *<select id="syncFrequency" name="syncFrequency" required><option>1 min</option><option selected>5 min</option><option>15 min</option><option>Hourly</option><option>Daily</option></select></label>
          <label>Sync Start Time *<input id="syncStartTime" name="syncStartTime" type="time" required value="00:00"></label>
          <label class="full">Last Sync Timestamp Field <input id="lastSyncTimestampField" name="lastSyncTimestampField" maxlength="120" placeholder="Example: lastSyncAt / updated_at / timestamp"></label>
          ${stepIntro('Synchronization')}
        </div>
        <div class="wizard-step" data-integration-step="partner">
          <label>Partner ID in Vendor System <input name="partnerVendorId" maxlength="100" placeholder="Vendor partner ID"></label>
          <label>Account ID <input name="accountId" maxlength="100" placeholder="Vendor account ID"></label>
          <label>Contact Phone Number <input name="contactPhoneNumber" type="tel" inputmode="tel" maxlength="30" placeholder="+374 XX XXX XXX"></label>
          <label>Contact Name <input name="contactName" maxlength="100" placeholder="Contact full name"></label>
          <label>Contact Role <select name="contactRole"><option value="">Not specified</option><option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option><option>Prof.</option><option>Other</option></select></label>
          <label>Technical Contact Email <input name="technicalContactEmail" type="email" maxlength="160" placeholder="technical@example.com"></label>
          <label>Technical Contact Phone <input name="technicalContactPhone" type="tel" inputmode="tel" maxlength="30" placeholder="+374 XX XXX XXX"></label>
          <label>Support Email <input name="supportEmail" type="email" maxlength="160" placeholder="support@example.com"></label>
          <div class="integration-review-card full" aria-live="polite">
            <h3>Connector Review</h3>
            <div class="integration-review-grid">
              <div><span>Name</span><strong id="reviewIntegrationName">—</strong></div>
              <div><span>Vendor</span><strong id="reviewIntegrationVendor">—</strong></div>
              <div><span>Status</span><strong id="reviewIntegrationStatus">Inactive</strong></div>
              <div><span>Endpoint</span><strong id="reviewIntegrationEndpoint">—</strong></div>
              <div><span>Synchronization</span><strong id="reviewIntegrationSync">—</strong></div>
              <div><span>Checks</span><strong id="reviewIntegrationChecks">Not tested</strong></div>
            </div>
          </div>
          ${stepIntro('Partner Account')}
        </div>
        <div class="integration-hidden-state" aria-hidden="true"><input id="softwareName" type="hidden"><input id="protocol" type="hidden"><input id="portNumber" type="hidden"><input id="endpointInfo" type="hidden"><input id="methodSelect" type="hidden"><input id="directionSelect" type="hidden"><input id="syncMode" type="hidden"><input id="dataFormat" type="hidden"><span id="readyDiscovery">Pending</span><span id="plantsFound">0</span><span id="devicesFound">0</span><span id="metricsFound">0</span><span id="alertsFound">0</span><button type="button" id="runDiscovery"></button><button type="button" id="approveDiscovery"></button></div>
      </form>
    </div>
    <div class="modal-actions integration-wizard-actions"><span class="wizard-progress" id="integrationWizardProgress">Step 1 of ${steps.length}</span><button id="prevIntStep" type="button">Back</button><button id="nextIntStep" type="button">Save & Continue</button><button class="primary-action hidden" id="saveIntegration" type="button" data-permission-action="create" data-permission-resource="integration">Create Connector</button></div>
  </div>
</aside>`;
}
function fieldType(name: string): string{
  const lower = name.toLowerCase();
  if (lower.includes('password') || lower.includes('secret') || lower.includes('token') || lower.includes('key')) return 'password';
  return 'text';
}
function selectOptions(options: string[]): string{ return options.map(x => `<option>${x}</option>`).join(''); }
function hydrateVendor(): void{
  const vendor = document.getElementById('vendorSelect')?.value || 'Huawei';
  const tpl = resolveIntegrationVendorTemplate(vendor);
  renderLiveTemplateStatus(vendor);
  const byId = <T extends HTMLElement = HTMLElement>(id: string): T | null => integrationElement<T>(id);
  if (!byId('softwareName')) return;

  const setValue = (id: string, value: string) => { const el = byId<HTMLInputElement>(id); if (el) el.value = value; };
  setValue('softwareName', tpl.software);
  setValue('protocol', tpl.protocol);
  setValue('baseUrl', tpl.base === 'Defined manually' ? '' : tpl.base);
  setValue('portNumber', tpl.port);
  setValue('endpointInfo', vendor === 'Other' ? 'Manual / Advanced details' : `${tpl.base} / vendor API template`);
  setValue('callbackUrl', tpl.method === 'Webhook' ? 'https://api.zentrid.com/webhooks/auto-generated' : 'Auto-generated by Zentrid when callback is required');
  setValue('methodSelect', tpl.method);
  setValue('directionSelect', tpl.direction);
  setValue('syncMode', tpl.sync);
  setValue('dataFormat', tpl.format.includes('JSON') ? 'JSON' : 'CSV');

  const credentialFields = byId('credentialFields');
  if (credentialFields) {
    credentialFields.innerHTML = tpl.credentials.map(f => { const key = f.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); const secret = fieldType(f) === 'password'; return `<label>${f} *<input name="credential_${key}" type="${secret ? 'password' : 'text'}" required autocomplete="${secret ? 'new-password' : 'off'}" placeholder="${f}"></label>`; }).join('');
  }
  applyTemplateDetailToForm(vendor);


  const estimated = byId('estimatedLoad');
  if (estimated) estimated.textContent = `${tpl.discovery.plants || 'Custom'} plants · ${tpl.discovery.devices || 'Custom'} devices · ${tpl.discovery.metrics || 'Custom'} metrics · ${tpl.scope}`;
}
function setWizardIntegrationStatus(status: string): void{
  const general = integrationElement<HTMLInputElement>('integrationStatus');
  if (general) general.value = status;
}
function isArchivedIntegration(x: Partial<IntegrationRecord>): boolean{
  return String(x?.status || '').toLowerCase() === 'archived';
}
const archivedIntegrationMocks = [
  {id:'ARCH-INT-00012', code:'INT-HUAWEI-OLD-001', name:'Arpi Solar Group — Huawei FusionSolar Legacy', tenant:'Arpi Solar Group', vendor:'Huawei', software:'FusionSolar', status:'Archived', health:'Archived', auth:'Expired', discovery:'Completed', plants:42, devices:612, inverters:94, meters:38, weatherPlants:7, bess:2, metrics:184, alerts:37, archivedAt:'2026-04-12', archivedBy:'Integration Admin', archiveReason:'Replaced by FusionSolar v2 connector', lastSuccessfulSync:'2026-04-11 23:45', retention:'Preserve raw + normalized history', restore:'Available', endpoint:'https://eu5.fusionsolar.huawei.com', authType:'OAuth 2.0 + Account', connectorVersion:'v1.8.3', apiVersion:'2024-05', mappingVersion:'Solar Core v1.6', discoveryMode:'Full discovery', syncInterval:'5 min', firstConnected:'2025-08-14', totalSyncJobs:'18,420', successfulJobs:'18,102', failedJobs:'318', avgDuration:'12.4s'},
  {id:'ARCH-INT-00018', code:'INT-SUNGROW-DEMO-004', name:'SolarPark East — Sungrow iSolarCloud', tenant:'SolarPark East', vendor:'Sungrow', software:'iSolarCloud', status:'Archived', health:'Archived', auth:'Revoked', discovery:'Completed', plants:18, devices:244, inverters:51, meters:21, weatherPlants:4, bess:0, metrics:156, alerts:21, archivedAt:'2026-03-28', archivedBy:'Global Admin', archiveReason:'Plant portfolio decommissioned', lastSuccessfulSync:'2026-03-27 18:10', retention:'Audit + reporting snapshots', restore:'Restricted', endpoint:'https://gateway.isolarcloud.com', authType:'App Key Authentication', connectorVersion:'v1.5.0', apiVersion:'2024-02', mappingVersion:'Solar Core v1.5', discoveryMode:'Portfolio discovery', syncInterval:'15 min', firstConnected:'2025-10-02', totalSyncJobs:'9,870', successfulJobs:'9,640', failedJobs:'230', avgDuration:'9.1s'},
  {id:'ARCH-INT-00027', code:'INT-SOLAREDGE-ARM-002', name:'GreenVolt Armenia — SolarEdge Monitoring', tenant:'GreenVolt Armenia', vendor:'SolarEdge', software:'Monitoring Platform', status:'Archived', health:'Archived', auth:'Valid at archive', discovery:'Completed', plants:9, devices:138, inverters:36, meters:9, weatherPlants:3, bess:1, metrics:129, alerts:14, archivedAt:'2026-02-15', archivedBy:'Tenant Operations', archiveReason:'Archived by tenant request', lastSuccessfulSync:'2026-02-15 12:30', retention:'Full metadata retained', restore:'Available', endpoint:'https://monitoringapi.solaredge.com', authType:'API Key Authentication', connectorVersion:'v1.4.2', apiVersion:'2023-12', mappingVersion:'Solar Core v1.4', discoveryMode:'Tenant-scoped discovery', syncInterval:'10 min', firstConnected:'2025-06-21', totalSyncJobs:'11,208', successfulJobs:'11,044', failedJobs:'164', avgDuration:'7.8s'},
  {id:'ARCH-INT-00031', code:'INT-HUAWEI-BESS-009', name:'MegaSolar BESS — Huawei NetEco', tenant:'MegaSolar BESS', vendor:'Huawei', software:'NetEco', status:'Archived', health:'Archived', auth:'Disabled', discovery:'Partial', plants:3, devices:71, inverters:12, meters:6, weatherPlants:2, bess:8, metrics:208, alerts:46, archivedAt:'2026-01-04', archivedBy:'Data Governance', archiveReason:'Duplicate connection merged into canonical connector', lastSuccessfulSync:'2026-01-03 09:20', retention:'Merged lineage retained', restore:'Not recommended', endpoint:'https://netecomock.huawei.example', authType:'Service Account', connectorVersion:'v0.9.8', apiVersion:'2023-09', mappingVersion:'Storage Core v0.9', discoveryMode:'BESS device discovery', syncInterval:'5 min', firstConnected:'2025-04-18', totalSyncJobs:'7,442', successfulJobs:'7,008', failedJobs:'434', avgDuration:'16.6s'},
  {id:'ARCH-INT-00034', code:'INT-TESLA-BESS-001', name:'EcoStorage One — Tesla PowerHub', tenant:'EcoStorage One', vendor:'Tesla', software:'PowerHub', status:'Archived', health:'Archived', auth:'Expired', discovery:'Completed', plants:1, devices:24, inverters:4, meters:3, weatherPlants:1, bess:4, metrics:96, alerts:12, archivedAt:'2025-12-22', archivedBy:'Platform Support', archiveReason:'Migration completed to BESS normalization adapter', lastSuccessfulSync:'2025-12-21 17:05', retention:'Cold storage after 12 months', restore:'Available', endpoint:'https://powerhub.tesla.example', authType:'Token Authentication', connectorVersion:'v1.0.1', apiVersion:'2023-10', mappingVersion:'Storage Core v1.0', discoveryMode:'Storage-plant discovery', syncInterval:'15 min', firstConnected:'2025-02-12', totalSyncJobs:'5,018', successfulJobs:'4,966', failedJobs:'52', avgDuration:'6.3s'}
];

function archivedIntegrationRecords(): IntegrationArchiveRecord[]{
  const existing = integrations.filter(isArchivedIntegration);
  const ids = new Set(existing.map(x => x.id));
  return [...existing, ...archivedIntegrationMocks.filter(x => !ids.has(x.id))];
}

function archiveActionMenu(id: unknown): string{
  return `<div class="kebab-wrap archive-actions-menu">
    <button class="kebab-btn" data-action="menu" aria-label="Open archive actions" title="Actions">⋮</button>
    <div class="kebab-menu" data-menu-for="${id}">
      <button data-action="view">View archive record</button>
      <button data-action="restore">Restore request</button>
      <button data-action="export" data-permission-action="export" data-permission-resource="integration">Export metadata</button>
    </div>
  </div>`;
}

function archivedIntegrationRows(rows: IntegrationArchiveRecord[]): string{
  return `<div class="data-table archive-integration-table"><div class="data-head archive-row-v56"><span>Archived Integration</span><span>Tenant / Vendor</span><span>Archived</span><span>Reason</span><span>Data Retention</span><span></span></div>${rows.map(x => `<div class="data-row archive-row-v56 clickable-row" data-id="${x.id}">
    <div><strong>${x.name}</strong><small>${x.code || 'ARCHIVE'}<br>${x.id}</small></div>
    <div><strong>${x.tenant || 'Platform scope'}</strong><small>${x.vendor} · ${x.software || 'Connector'}</small></div>
    <div><strong>${x.archivedAt || x.updatedAt || 'Archived'}</strong><small>By ${x.archivedBy || x.updatedBy || 'Global Admin'}</small></div>
    <div><strong>${x.archiveReason || 'Lifecycle archived'}</strong><small>Last sync: ${x.lastSuccessfulSync || x.lastSync || '—'}</small></div>
    <div><strong>${x.retention || 'Preserve history'}</strong><small>Restore: ${x.restore || 'Available'}</small></div>
    <div class="archive-actions-cell">${archiveActionMenu(x.id)}</div>
  </div>`).join('')}</div>`;
}

function archivedIntegrationById(id: unknown): IntegrationArchiveRecord | undefined{
  return archivedIntegrationRecords().find(x => x.id === id);
}

function archiveField(label: string, value: unknown, note = ''): string{
  return `<div><span>${label}</span><strong>${value ?? '—'}</strong>${note ? `<small>${note}</small>` : ''}</div>`;
}

function openArchivedIntegrationDetail(id: unknown): void{
  const x = archivedIntegrationById(id);
  if (!x) return;
  const old = document.getElementById('archiveDetailModal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.className = 'modal open archive-detail-modal';
  modal.id = 'archiveDetailModal';
  const status = x.status || 'Archived';
  const docs = [
    `${x.vendor || 'Connector'} migration report.pdf`,
    `${x.tenant || 'Tenant'} archive approval.pdf`,
    `${x.code || x.id} metadata export.zip`
  ];
  modal.innerHTML = `<div class="modal-card archive-detail-card">
    <button class="modal-close" type="button" data-close="archive-detail">x</button>

    <div class="archive-detail-head archive-detail-head-v58">
      <div>
        <p class="eyebrow">Archived integration record</p>
        <h2>${x.name}</h2>
        <p class="muted">${x.id} · ${x.code || 'ARCHIVE'} · ${x.vendor} ${x.software || ''}</p>
      </div>
    </div>
    <div class="archive-status-line-v58"><span class="badge warn">${status}</span><small>Read-only historical snapshot · live sync disabled</small></div>

    <section class="kpi-grid detail-kpis archive-detail-kpis">
      <article class="kpi-card"><span>Plants</span><strong>${x.plants ?? '—'}</strong><small>historical scope</small></article>
      <article class="kpi-card"><span>Devices</span><strong>${x.devices ?? '—'}</strong><small>last discovered devices</small></article>
      <article class="kpi-card"><span>Sync Jobs</span><strong>${x.totalSyncJobs ?? '—'}</strong><small>${x.failedJobs ?? '—'} failed</small></article>
      <article class="kpi-card"><span>Restore</span><strong>${x.restore || 'Available'}</strong><small>reactivation policy</small></article>
    </section>

    <section class="archive-detail-section-v58">
      <div class="section-title-v58"><h3>Overview</h3><p>Core archive identity and lifecycle context.</p></div>
      <div class="info-grid archive-detail-grid">
        ${archiveField('Integration Name', x.name, 'Archived connector display name')}
        ${archiveField('Integration ID', x.id, x.code || 'Archive record')}
        ${archiveField('Tenant', x.tenant || 'Platform scope', 'Client / organization context')}
        ${archiveField('Vendor / Platform', `${x.vendor || '—'} · ${x.software || 'Connector'}`, 'Source platform')}
        ${archiveField('Archive Date', x.archivedAt || x.updatedAt || 'Archived', `By ${x.archivedBy || x.updatedBy || 'Global Admin'}`)}
        ${archiveField('Archive Reason', x.archiveReason || 'Lifecycle archived', 'Why this connection was removed from live operations')}
        ${archiveField('Auth State', x.auth || 'Archived', 'Credential state at archive time')}
        ${archiveField('Discovery State', x.discovery || '—', 'Last known discovery result')}
      </div>
    </section>

    <section class="archive-detail-section-v58">
      <div class="section-title-v58"><h3>Configuration Snapshot</h3><p>Read-only connector configuration captured at the time of archive.</p></div>
      <div class="info-grid archive-detail-grid">
        ${archiveField('API Endpoint', x.endpoint || x.baseUrl || 'Endpoint unavailable', 'Source API base URL')}
        ${archiveField('Connector Version', x.connectorVersion || x.version || '—', 'Adapter release')}
        ${archiveField('API Version', x.apiVersion || '—', 'Vendor API contract')}
        ${archiveField('Mapping Version', x.mappingVersion || '—', 'Canonical normalization mapping')}
        ${archiveField('Discovery Mode', x.discoveryMode || x.discovery || '—', 'How devices were discovered')}
        ${archiveField('Sync Interval', x.syncInterval || x.syncFrequency || '—', 'Last active schedule')}
        ${archiveField('Retention Policy', x.retention || 'Preserve history', 'Raw payloads, normalized records and lineage')}
      </div>
    </section>

    <section class="archive-detail-section-v58">
      <div class="section-title-v58"><h3>Connected Devices</h3><p>Last known asset scope before the connector was archived.</p></div>
      <div class="asset-snapshot-grid-v58">
        <article><span>Plants</span><strong>${x.plants ?? '—'}</strong></article>
        <article><span>Devices</span><strong>${x.devices ?? '—'}</strong></article>
        <article><span>Inverters</span><strong>${x.inverters ?? '—'}</strong></article>
        <article><span>Meters</span><strong>${x.meters ?? '—'}</strong></article>
        <article><span>Weather Stations</span><strong>${x.weatherPlants ?? '—'}</strong></article>
        <article><span>BESS Systems</span><strong>${x.bess ?? '—'}</strong></article>
        <article><span>Metrics</span><strong>${x.metrics ?? '—'}</strong></article>
        <article><span>Alerts</span><strong>${x.alerts ?? '—'}</strong></article>
      </div>
    </section>

    <section class="archive-detail-section-v58">
      <div class="section-title-v58"><h3>Historical Statistics</h3><p>Operational sync statistics preserved for audit and restore decisions.</p></div>
      <div class="info-grid archive-detail-grid">
        ${archiveField('First Connected', x.firstConnected || '—', 'Initial activation date')}
        ${archiveField('Last Successful Sync', x.lastSuccessfulSync || x.lastSync || '—', 'Last trusted source-to-core event')}
        ${archiveField('Total Sync Jobs', x.totalSyncJobs || '—', 'Historical job count')}
        ${archiveField('Successful Jobs', x.successfulJobs || '—', 'Completed jobs')}
        ${archiveField('Failed Jobs', x.failedJobs || '—', 'Failed or dead-lettered jobs')}
        ${archiveField('Average Sync Duration', x.avgDuration || '—', 'Mean job execution time')}
      </div>
    </section>

    <section class="archive-detail-section-v58 archive-history-panel">
      <div class="section-title-v58"><h3>Archive Timeline</h3><p>Lifecycle events for the archived integration.</p></div>
      <div class="ops-timeline-v56">
        <div><span>${x.archivedAt || 'Archive'}</span><strong>Connection archived</strong><small>${x.archiveReason || 'Lifecycle archive completed'}</small></div>
        <div><span>${x.lastSuccessfulSync || 'Sync'}</span><strong>Last successful sync preserved</strong><small>Final trusted dataset retained for audit and reporting</small></div>
        <div><span>Mapping</span><strong>${x.mappingVersion || 'Canonical mapping'} locked</strong><small>Normalization configuration saved as read-only snapshot</small></div>
        <div><span>Data</span><strong>Retention policy applied</strong><small>${x.retention || 'Preserve raw + normalized history'}</small></div>
        <div><span>Created</span><strong>Integration connected</strong><small>${x.firstConnected || 'Historical activation date not available'}</small></div>
      </div>
    </section>

    <section class="archive-detail-section-v58">
      <div class="section-title-v58"><h3>Related Documents</h3><p>Mock archive evidence and export artifacts.</p></div>
      <div class="archive-doc-list-v58">
        ${docs.map((d, i) => `<article><strong>${d}</strong><small>${i === 0 ? 'Migration / archive evidence' : i === 1 ? 'Approval record' : 'Technical export package'}</small><button onclick="ZentridLayout.toast('Opening ${d}')">Open</button></article>`).join('')}
      </div>
    </section>

    <div class="modal-actions row-actions archive-detail-actions">
      <button type="button" data-archive-action="history">View History</button>
      <button type="button" data-archive-action="export" data-permission-action="export" data-permission-resource="integration">Export Metadata</button>
      <button type="button" data-archive-action="restore">Create Restore Request</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  ZentridLayout.enhanceActionMenus?.(modal);
}
function closeArchiveMenus(): void{
  document.querySelectorAll('.kebab-menu.open').forEach(m => m.classList.remove('open'));
}

function renderArchivedIntegrations(): string{
  const archived = archivedIntegrationRecords();
  const restored = 11;
  const permanent = 3;
  const thisMonth = archived.filter(x => String(x.archivedAt || '').startsWith('2026-06')).length || 6;
  return `<section class="page-hero"><div><p class="eyebrow">Global Admin · Integration Governance</p><h1>Integration Archive</h1><p class="muted">Historical connector records preserved for audit, lineage, restore decisions and metadata export. This is not live monitoring.</p></div><div class="hero-actions"><button class="freshness-card" onclick="ZentridLayout.toast('Archive export prepared')" data-permission-action="export" data-permission-resource="integration"><span class="pulse"></span><div><strong>Export Archive</strong><small>CSV + metadata</small></div></button></div></section>
  <section class="kpi-grid detail-kpis"><article class="kpi-card"><span>Archived Integrations</span><strong>${archived.length}</strong><small>Inactive preserved connectors</small></article><article class="kpi-card"><span>Archived This Month</span><strong>${thisMonth}</strong><small>Lifecycle changes</small></article><article class="kpi-card"><span>Restored</span><strong>${restored}</strong><small>Previously reactivated</small></article><article class="kpi-card"><span>Permanent Removals</span><strong>${permanent}</strong><small>Approved purge events</small></article></section>
  <section class="panel glass-card"><div class="panel-head"><div><h2>Archived Connector Records</h2><p>Each record keeps tenant, vendor, archive reason, last successful sync, retention policy and restore availability.</p></div><div class="toolbar"><input id="archiveSearch" placeholder="Search archived integration, vendor, tenant, reason..."/><select id="archiveVendorFilter"><option>All Vendors</option><option>Huawei</option><option>Sungrow</option><option>SolarEdge</option><option>Tesla</option><option>GoodWe</option></select></div></div><div id="archivedIntegrationTable">${archivedIntegrationRows(archived)}</div></section>`;
}
function renderIntegrationArchive(): string{ return renderArchivedIntegrations(); }

function wireArchivedIntegrations(): void{
  const search = integrationElement<HTMLInputElement>('archiveSearch');
  const vendor = integrationElement<HTMLSelectElement>('archiveVendorFilter');
  const table = document.getElementById('archivedIntegrationTable');
  const apply = () => {
    const q = (search?.value || '').toLowerCase();
    const v = vendor?.value || 'All Vendors';
    const rows = archivedIntegrationRecords().filter(x => (v === 'All Vendors' || x.vendor === v) && `${x.name} ${x.vendor} ${x.tenant} ${x.archiveReason || ''}`.toLowerCase().includes(q));
    if (table) table.innerHTML = rows.length ? archivedIntegrationRows(rows) : '<div class="empty-state"><strong>No matching archived integrations</strong><span>Try another keyword or vendor.</span></div>';
  };
  if (search) search.oninput = apply;
  if (vendor) vendor.onchange = apply;
  table?.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest<HTMLElement>('button');
    const row = target.closest<HTMLElement>('.data-row');
    const id = row?.dataset.id;
    if (!row || !id) return;
    const action = btn?.dataset.action || 'view';

    if (action === 'menu') {
      e.stopPropagation();
      const menu = btn?.closest('.kebab-wrap')?.querySelector('.kebab-menu');
      const alreadyOpen = menu?.classList.contains('open');
      closeArchiveMenus();
      if (menu && !alreadyOpen) menu.classList.add('open');
      return;
    }

    closeArchiveMenus();
    if (action === 'restore') { e.stopPropagation(); ZentridLayout.toast('Restore request created for archived integration'); return; }
    if (action === 'export') { e.stopPropagation(); ZentridLayout.toast('Archive metadata export prepared'); return; }
    localStorage.setItem('zentrid_selected_integration', id);
    openArchivedIntegrationDetail(id);
  });

  document.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('.kebab-wrap')) closeArchiveMenus();
    if (target.closest('[data-close="archive-detail"]')) document.getElementById('archiveDetailModal')?.remove();
    if (target.closest('[data-archive-action="restore"]')) ZentridLayout.toast('Restore request created for archived integration');
    if (target.closest('[data-archive-action="export"]')) ZentridLayout.toast('Archive metadata export prepared');
    if (target.closest('[data-archive-action="history"]')) ZentridLayout.toast('Opening archive history');
  });
}
function wireIntegrationArchive(): void{ return wireArchivedIntegrations(); }

function wireIntegrations(): void{
  let step = 0;
  let initialSnapshot = '';
  let connectionPassed = false;
  let sampleDataPassed = false;
  let wizardBusy = false;
  const modal = requireIntegrationElement<HTMLElement>('intModal');
  const steps = Array.from(document.querySelectorAll<HTMLElement>('#intModal .wizard-step'));
  const rails = Array.from(document.querySelectorAll<HTMLButtonElement>('#intModal .setup-rail button'));
  const vendorSelect = requireIntegrationElement<HTMLSelectElement>('vendorSelect');
  const integrationName = requireIntegrationElement<HTMLInputElement>('integrationName');
  const integrationTable = requireIntegrationElement<HTMLElement>('integrationTable');
  const intSearch = requireIntegrationElement<HTMLInputElement>('intSearch');
  const vendorFilter = requireIntegrationElement<HTMLSelectElement>('vendorFilter');
  const intForm = requireIntegrationElement<HTMLFormElement>('intForm');
  const summary = requireIntegrationElement<HTMLElement>('integrationValidationSummary');
  const progress = requireIntegrationElement<HTMLElement>('integrationWizardProgress');
  const prevButton = requireIntegrationElement<HTMLButtonElement>('prevIntStep');
  const nextButton = requireIntegrationElement<HTMLButtonElement>('nextIntStep');
  const saveButton = requireIntegrationElement<HTMLButtonElement>('saveIntegration');
  const connectionButton = requireIntegrationElement<HTMLButtonElement>('connectionTest');
  const sampleButton = requireIntegrationElement<HTMLButtonElement>('authTest');
  const activateButton = requireIntegrationElement<HTMLButtonElement>('activateIntegration');
  const suspendButton = requireIntegrationElement<HTMLButtonElement>('suspendIntegration');
  const archiveButton = requireIntegrationElement<HTMLButtonElement>('archiveIntegration');

  const textValue = (name: string): string => {
    const control = intForm.elements.namedItem(name);
    return control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement ? control.value.trim() : '';
  };
  const setCheckState = (id: string, value: string, state: 'pending' | 'testing' | 'passed' | 'failed' = 'pending') => {
    const element = requireIntegrationElement<HTMLElement>(id);
    element.textContent = value;
    element.dataset.state = state;
  };
  const updateReview = () => {
    requireIntegrationElement('reviewIntegrationName').textContent = integrationName.value.trim() || autoIntegrationName() || '—';
    requireIntegrationElement('reviewIntegrationVendor').textContent = `${vendorSelect.value || 'Other'} · ${resolveIntegrationVendorTemplate(vendorSelect.value || 'Other').software}`;
    requireIntegrationElement('reviewIntegrationStatus').textContent = integrationElement<HTMLInputElement>('integrationStatus')?.value || 'Inactive';
    requireIntegrationElement('reviewIntegrationEndpoint').textContent = textValue('baseUrl') || 'Not provided';
    requireIntegrationElement('reviewIntegrationSync').textContent = `${textValue('syncFrequency') || 'Not set'} · ${textValue('syncStartTime') || 'No start time'}`;
    requireIntegrationElement('reviewIntegrationChecks').textContent = connectionPassed && sampleDataPassed ? 'Connection and sample data passed' : connectionPassed ? 'Connection passed · sample data pending' : 'Not tested';
  };
  const updateLifecycleButtons = () => {
    const status = integrationElement<HTMLInputElement>('integrationStatus')?.value || 'Inactive';
    activateButton.disabled = status === 'Active';
    suspendButton.disabled = status === 'Inactive';
    archiveButton.disabled = status === 'Archived';
    requireIntegrationElement('integrationLifecycleHint').textContent = status === 'Active'
      ? 'Connector will be created as Active. Connection and sample-data checks must remain valid.'
      : status === 'Archived'
        ? 'Connector will be created as Archived and will appear only in Integration Archive.'
        : 'Connector will be created Inactive and can be activated later.';
    updateReview();
  };
  const resetChecks = (message = 'Connection settings changed. Run the checks again before activation.') => {
    const wasTested = connectionPassed || sampleDataPassed;
    connectionPassed = false;
    sampleDataPassed = false;
    requireIntegrationElement('authResult').textContent = 'Status: Not Tested';
    setCheckState('connectionResult', 'Not tested');
    setCheckState('discoveryStatus', 'Not tested');
    setCheckState('readyAuth', 'Pending');
    if (wasTested) ZentridLayout.toast(message);
    if (integrationElement<HTMLInputElement>('integrationStatus')?.value === 'Active') setWizardIntegrationStatus('Inactive');
    updateLifecycleButtons();
  };
  const updateNavigation = () => {
    steps.forEach((section, index) => section.classList.toggle('active', index === step));
    rails.forEach((rail, index) => {
      rail.classList.toggle('active', index === step);
      if (index === step) rail.setAttribute('aria-current', 'step');
      else rail.removeAttribute('aria-current');
    });
    progress.textContent = `Step ${step + 1} of ${steps.length}`;
    prevButton.disabled = step === 0;
    nextButton.classList.toggle('hidden', step === steps.length - 1);
    saveButton.classList.toggle('hidden', step !== steps.length - 1);
    updateReview();
  };
  const show = (index: number) => {
    step = Math.max(0, Math.min(steps.length - 1, index));
    updateNavigation();
  };
  const whitelistIssues = (control: HTMLTextAreaElement | null, type: 'ip' | 'domain'): ZentridFormIssue[] => {
    if (!control || !control.value.trim()) return [];
    const entries = control.value.split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
    const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/(?:[0-9]|[12][0-9]|3[0-2]))?$/;
    const domain = /^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
    const invalid = entries.find(value => {
      if (type === 'domain') return !domain.test(value);
      if (!ipv4.test(value)) return true;
      const address = value.split('/')[0] || '';
      return address.split('.').some(part => Number(part) > 255);
    });
    return invalid ? [{ control, message: type === 'ip' ? `“${invalid}” is not a valid IPv4 address or CIDR.` : `“${invalid}” is not a valid domain or wildcard domain.` }] : [];
  };
  const stepIssues = (index: number): ZentridFormIssue[] => {
    const issues: ZentridFormIssue[] = [];
    if (index === 0) {
      const name = integrationName.value.trim().toLowerCase();
      if (name && integrations.some(item => !isArchivedIntegration(item) && String(item.name || '').trim().toLowerCase() === name)) {
        issues.push({ control: integrationName, message: `A connector named “${integrationName.value.trim()}” already exists.` });
      }
    }
    if (index === 1) {
      const baseUrl = integrationElement<HTMLInputElement>('baseUrl');
      if (baseUrl?.value.trim()) {
        try {
          const parsed = new URL(baseUrl.value.trim());
          if (!['http:', 'https:'].includes(parsed.protocol)) issues.push({ control: baseUrl, message: 'Base URL must use HTTP or HTTPS.' });
        } catch {
          issues.push({ control: baseUrl, message: 'Enter a complete Base URL, for example https://vendor.example.com.' });
        }
      }
      issues.push(...whitelistIssues(intForm.elements.namedItem('allowedIpWhitelist') as HTMLTextAreaElement | null, 'ip'));
      issues.push(...whitelistIssues(intForm.elements.namedItem('domainWhitelist') as HTMLTextAreaElement | null, 'domain'));
    }
    if (index === 2) {
      const rate = integrationElement<HTMLInputElement>('rateLimit');
      if (rate?.value && (!Number.isInteger(Number(rate.value)) || Number(rate.value) < 1)) issues.push({ control: rate, message: 'Rate Limit must be a positive whole number.' });
    }
    if (index === 3) {
      const timestamp = integrationElement<HTMLInputElement>('lastSyncTimestampField');
      if (timestamp?.value && !/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(timestamp.value.trim())) issues.push({ control: timestamp, message: 'Last Sync Timestamp Field may contain letters, numbers, dots, underscores and hyphens.' });
    }
    return issues;
  };
  const validateStep = (index: number, focus = true): ZentridFormValidationResult => {
    const section = steps[index];
    if (!section) return { valid: true, issues: [] };
    const result = ZentridFormUX.validate(section, stepIssues(index), summary, `Complete ${rails[index]?.textContent?.trim() || 'this step'} before continuing`);
    rails[index]?.classList.toggle('has-error', !result.valid);
    rails[index]?.classList.toggle('completed', result.valid);
    if (!result.valid && focus) ZentridFormUX.focusFirst(result, summary);
    return result;
  };
  const validateAll = (): ZentridFormValidationResult => {
    const allIssues: ZentridFormIssue[] = [];
    steps.forEach((section, index) => {
      const result = ZentridFormUX.validate(section, stepIssues(index));
      rails[index]?.classList.toggle('has-error', !result.valid);
      rails[index]?.classList.toggle('completed', result.valid);
      allIssues.push(...result.issues);
    });
    ZentridFormUX.renderSummary(summary, allIssues, 'Complete the connector configuration before creating it');
    const firstInvalid = steps.findIndex((_, index) => rails[index]?.classList.contains('has-error'));
    const result = { valid: allIssues.length === 0, issues: allIssues };
    if (!result.valid) {
      show(Math.max(0, firstInvalid));
      ZentridFormUX.focusFirst(result, summary);
    }
    return result;
  };
  const canCloseWizard = (): boolean => {
    if (wizardBusy || ZentridFormUX.snapshot(intForm) === initialSnapshot) return true;
    return window.confirm('Discard the connector information entered in this wizard?');
  };
  const closeWizard = () => {
    if (!canCloseWizard()) return;
    modal.classList.remove('open');
    ZentridFormUX.clearErrors(intForm, summary);
  };
  const resetWizard = async () => {
    intForm.reset();
    integrationName.dataset.touched = '';
    setWizardIntegrationStatus('Inactive');
    show(0);
    hydrateVendor();
    await fetchProviderTemplateDetail(vendorSelect.value || 'Other');
    hydrateVendor();
    updateIntegrationName(true);
    resetChecks('');
    ZentridFormUX.clearErrors(intForm, summary);
    rails.forEach(rail => rail.classList.remove('completed', 'has-error'));
    updateNavigation();
    initialSnapshot = ZentridFormUX.snapshot(intForm);
  };
  const setDesiredStatus = (status: 'Active' | 'Inactive' | 'Archived') => {
    setWizardIntegrationStatus(status);
    updateLifecycleButtons();
    ZentridLayout.toast(`Connector will be created as ${status}`);
  };
  const renderFilteredRows = () => {
    const query = intSearch.value.toLowerCase().trim();
    const vendor = vendorFilter.value;
    const rows = integrations.filter(item => !isArchivedIntegration(item)).filter(item => (vendor === 'All Vendors' || item.vendor === vendor) && `${item.name} ${item.vendor} ${item.tenant}`.toLowerCase().includes(query));
    ZentridRuntimeStability.replaceHtml(integrationTable, rows.length ? integrationRows(rows) : '<div class="empty-state"><strong>No matching connectors</strong><span>Try another keyword or vendor.</span></div>');
  };
  const openIntegrationDetail = (id: string) => {
    localStorage.setItem('zentrid_selected_integration', id);
    location.href = 'integration-detail.html';
  };

  loadLiveProviderTemplates();
  ZentridFormUX.bindClearOnInput(intForm, summary);
  requireIntegrationElement<HTMLButtonElement>('openIntegrationWizard').onclick = async () => {
    if (!ZentridActionPermissions.guard({ action:'create', resource:'integration' })) return;
    modal.classList.add('open');
    await resetWizard();
    integrationName.focus();
  };
  requireIntegrationElement<HTMLButtonElement>('closeIntModal').onclick = closeWizard;
  rails.forEach(rail => rail.onclick = () => {
    const target = Number(rail.dataset.step || 0);
    if (target <= step) { show(target); return; }
    for (let index = step; index < target; index += 1) {
      if (!validateStep(index)) { show(index); return; }
    }
    show(target);
  });
  prevButton.onclick = () => show(step - 1);
  nextButton.onclick = () => {
    if (!validateStep(step)) return;
    show(step + 1);
  };
  vendorSelect.onchange = async () => {
    hydrateVendor();
    await fetchProviderTemplateDetail(vendorSelect.value || 'Other');
    hydrateVendor();
    updateIntegrationName(true);
    resetChecks('Vendor template changed. Run the connection checks again.');
    updateReview();
    ZentridLayout.toast('Vendor template applied');
  };
  integrationName.addEventListener('input', () => { integrationName.dataset.touched = '1'; updateReview(); });
  intForm.addEventListener('input', event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
    if (target.closest('[data-integration-step="connection"]')) resetChecks();
    updateReview();
  });
  intForm.addEventListener('change', updateReview);

  connectionButton.onclick = async () => {
    const result = validateStep(1);
    if (!result.valid || wizardBusy) return;
    wizardBusy = true;
    ZentridFormUX.setBusy(connectionButton, true, 'Testing…');
    setCheckState('connectionResult', 'Testing locally…', 'testing');
    try {
      await new Promise(resolve => window.setTimeout(resolve, 250));
      const vendor = vendorSelect.value || 'Other';
      const template = resolveIntegrationVendorTemplate(vendor);
      connectionPassed = true;
      setCheckState('connectionResult', `Passed · endpoint reachable · port ${template.port}`, 'passed');
      requireIntegrationElement('authResult').textContent = `Status: Connection passed locally for ${vendor}`;
      ZentridLayout.toast('Local connection check passed');
    } finally {
      wizardBusy = false;
      ZentridFormUX.setBusy(connectionButton, false);
      updateReview();
    }
  };
  sampleButton.onclick = async () => {
    if (!connectionPassed) {
      const issue: ZentridFormIssue = { message: 'Run and pass Test Connection before testing sample data.' };
      ZentridFormUX.renderSummary(summary, [issue], 'Connection check required');
      show(1);
      ZentridFormUX.focusFirst({ valid: false, issues: [issue] }, summary);
      return;
    }
    if (wizardBusy) return;
    wizardBusy = true;
    ZentridFormUX.setBusy(sampleButton, true, 'Testing…');
    setCheckState('discoveryStatus', 'Testing locally…', 'testing');
    setCheckState('readyAuth', 'Testing…', 'testing');
    try {
      await new Promise(resolve => window.setTimeout(resolve, 250));
      const vendor = vendorSelect.value || 'Other';
      sampleDataPassed = true;
      setCheckState('discoveryStatus', 'Passed · sample payload available', 'passed');
      setCheckState('readyAuth', 'Passed', 'passed');
      requireIntegrationElement('authResult').textContent = `Status: Valid · ${vendor} sample data received locally`;
      ZentridLayout.toast('Local sample-data check passed');
    } finally {
      wizardBusy = false;
      ZentridFormUX.setBusy(sampleButton, false);
      updateReview();
    }
  };
  requireIntegrationElement<HTMLButtonElement>('runDiscovery').onclick = () => {
    const discovery = resolveIntegrationVendorTemplate(vendorSelect.value || 'Other').discovery;
    requireIntegrationElement('plantsFound').textContent = String(discovery.plants);
    requireIntegrationElement('devicesFound').textContent = String(discovery.devices);
    requireIntegrationElement('metricsFound').textContent = String(discovery.metrics);
    requireIntegrationElement('alertsFound').textContent = String(discovery.alerts);
    requireIntegrationElement('readyDiscovery').textContent = 'Local preview';
  };
  requireIntegrationElement<HTMLButtonElement>('approveDiscovery').onclick = () => ZentridLayout.toast('Discovery approval remains local until backend onboarding APIs are available.');
  activateButton.onclick = () => {
    const validation = validateAll();
    if (!validation.valid) return;
    if (!connectionPassed || !sampleDataPassed) {
      const issue: ZentridFormIssue = { message: 'Activation requires passed Connection and Sample Data checks.' };
      ZentridFormUX.renderSummary(summary, [issue], 'Connector is not ready for activation');
      show(1);
      ZentridFormUX.focusFirst({ valid: false, issues: [issue] }, summary);
      return;
    }
    setDesiredStatus('Active');
  };
  suspendButton.onclick = () => {
    const current = integrationElement<HTMLInputElement>('integrationStatus')?.value || 'Inactive';
    if (current === 'Active' && !window.confirm('Keep this connector Inactive instead of Active?')) return;
    setDesiredStatus('Inactive');
  };
  archiveButton.onclick = () => {
    if (!window.confirm('Create this connector directly in Archived state? It will not appear in the active Connector Registry.')) return;
    setDesiredStatus('Archived');
  };

  intSearch.oninput = () => ZentridRuntimeStability.debounce('registry:integrations:search', renderFilteredRows, 220);
  vendorFilter.onchange = renderFilteredRows;
  integrationTable.onclick = event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>('button');
    const row = target.closest<HTMLElement>('.data-row');
    const id = row?.dataset.id;
    if (!row || !id) return;
    if (button?.dataset.action === 'menu') {
      event.preventDefault();
      event.stopPropagation();
      const menu = button.closest('.kebab-wrap')?.querySelector('.kebab-menu');
      const alreadyOpen = menu?.classList.contains('open');
      closeArchiveMenus();
      if (menu && !alreadyOpen) menu.classList.add('open');
      return;
    }
    const action = button?.dataset.intAction;
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      closeArchiveMenus();
      const item = integrations.find(candidate => candidate.id === id);
      if (!item) return;
      if (action === 'edit') {
        localStorage.setItem('zentrid_selected_integration', id);
        localStorage.setItem('zentrid_integration_detail_edit', 'general');
        location.href = 'integration-detail.html';
        return;
      }
      if (action === 'archive') {
        const origin = ZentridDataSource.origin(item, 'integration');
        if (origin === 'live' || origin === 'mixed') {
          ZentridLayout.toast('Backend archive is not available yet. Live connector was not changed.');
          return;
        }
        if (!window.confirm(`Archive “${item.name || item.id}”? The connector will move to Integration Archive.`)) return;
        item.status = 'Archived';
        item.archived = true;
        item.archivedAt = new Date().toISOString().slice(0,10);
        item.archivedBy = 'Global Admin';
        item.archiveReason = 'Archived from Connector Registry';
        Object.assign(item, ZentridDataSource.markChanged(item, 'integration'));
        saveInts();
        renderFilteredRows();
        ZentridLayout.toast('Connector archived locally');
      }
      return;
    }
    openIntegrationDetail(id);
  };
  integrationTable.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest('button')) return;
    const row = target.closest<HTMLElement>('.data-row');
    const id = row?.dataset.id;
    if (!id) return;
    event.preventDefault();
    openIntegrationDetail(id);
  });

  saveButton.onclick = () => {
    if (!ZentridActionPermissions.guard({ action:'create', resource:'integration' })) return;
    const validation = validateAll();
    if (!validation.valid || wizardBusy) return;
    const status = integrationElement<HTMLInputElement>('integrationStatus')?.value || 'Inactive';
    if (status === 'Active' && (!connectionPassed || !sampleDataPassed)) {
      const issue: ZentridFormIssue = { message: 'An Active connector requires passed Connection and Sample Data checks.' };
      ZentridFormUX.renderSummary(summary, [issue], 'Connector is not ready for activation');
      show(1);
      ZentridFormUX.focusFirst({ valid: false, issues: [issue] }, summary);
      return;
    }
    wizardBusy = true;
    ZentridFormUX.setBusy(saveButton, true, 'Creating Connector…');
    try {
      const formData = new FormData(intForm);
      const formText = (key: string): string => {
        const value = formData.get(key);
        return typeof value === 'string' ? value.trim() : '';
      };
      const vendor = formText('vendor') || 'Other';
      const template = resolveIntegrationVendorTemplate(vendor);
      const id = 'INT-LOCAL-' + Math.floor(10000 + Math.random() * 89999);
      const credentialNames = Array.from(formData.entries())
        .filter(([key, value]) => key.startsWith('credential_') && typeof value === 'string' && value.trim())
        .map(([key]) => key.replace('credential_','').replaceAll('_',' '));
      const today = new Date().toISOString().slice(0,10);
      const record: IntegrationRecord = {
        dataOrigin: 'local',
        id,
        code: 'INT-' + vendor.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0,12) + '-' + Math.floor(100 + Math.random() * 899),
        name: formText('name') || autoIntegrationName(),
        tenant: 'Platform scope',
        vendor,
        software: template.software,
        status,
        health: status === 'Active' ? 'Healthy' : status === 'Archived' ? 'Archived' : 'Inactive',
        auth: sampleDataPassed ? 'Valid' : connectionPassed ? 'Connection Passed' : 'Not Tested',
        discovery: sampleDataPassed ? 'Sample Data Passed' : 'Not Tested',
        plants: 0,
        devices: 0,
        metrics: 0,
        alerts: 0,
        lastSync: 'Not synced',
        assignedTenants: 'Global',
        activeIntegrations: status === 'Active' ? 1 : 0,
        version: 'v1.0.0',
        apiVersion: 'Vendor API',
        mappingVersion: 'Solar Core v1.0',
        authType: template.auth,
        discoveryEnabled: 'No',
        createdBy: 'Global Admin',
        createdAt: today,
        updatedBy: 'Global Admin',
        updatedAt: today,
        lastActivity: 'Created now',
        lastSuccessfulSync: 'Not synced',
        vendorName: formText('vendorName'),
        baseUrl: formText('baseUrl'),
        allowedIpWhitelist: formText('allowedIpWhitelist'),
        domainWhitelist: formText('domainWhitelist'),
        rateLimit: formText('rateLimit'),
        rateLimitPeriod: formText('rateLimitPeriod'),
        syncFrequency: formText('syncFrequency'),
        syncStartTime: formText('syncStartTime'),
        lastSyncTimestampField: formText('lastSyncTimestampField'),
        partnerVendorId: formText('partnerVendorId'),
        accountId: formText('accountId'),
        contactPhoneNumber: formText('contactPhoneNumber'),
        contactName: formText('contactName'),
        contactRole: formText('contactRole'),
        technicalContactEmail: formText('technicalContactEmail'),
        technicalContactPhone: formText('technicalContactPhone'),
        supportEmail: formText('supportEmail'),
        connectionResult: connectionPassed ? 'Passed locally' : 'Not Tested',
        sampleDataStatus: sampleDataPassed ? 'Passed locally' : 'Not Tested',
        credentials: Object.fromEntries(credentialNames.map(name => [titleFromCamel(name), 'Configured']))
      };
      ['general_notes','connection_authentication_notes','api_request_notes','synchronization_notes','partner_account_notes'].forEach(key => { record[key] = formText(key); });
      if (status === 'Archived') {
        record.archived = true;
        record.archivedAt = today;
        record.archivedBy = 'Global Admin';
        record.archiveReason = 'Created in archived state';
      }
      integrations.unshift(record);
      saveInts();
      initialSnapshot = ZentridFormUX.snapshot(intForm);
      window.ZentridFormReadiness?.markCommitted(intForm);
      localStorage.setItem('zentrid_selected_integration', id);
      modal.classList.remove('open');
      ZentridLayout.toast('Connector created locally');
      location.href = 'integration-detail.html';
    } finally {
      wizardBusy = false;
      ZentridFormUX.setBusy(saveButton, false);
    }
  };

  modal.addEventListener('click', event => { if (event.target === modal) closeWizard(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeWizard(); });
  updateNavigation();
  updateLifecycleButtons();
}



function selectedIntegration(): IntegrationRecord{
  const id = localStorage.getItem('zentrid_selected_integration');
  return integrations.find(x => x.id === id) || integrations[0] || {};
}

type IntegrationDetailAction = 'validate' | 'testConnection' | 'testSampleData' | 'activate' | 'suspend' | 'archive';
type IntegrationDetailFeedbackTone = 'success' | 'warning' | 'danger' | 'neutral';

let integrationDetailEditMode = false;
let integrationDetailActiveTab = 'general';
let integrationDetailEditSnapshot = '';
let integrationDetailBusy = false;
let integrationDetailRetryAction: (() => void) | null = null;

function integrationDetailEscape(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function integrationDetailOrigin(record: IntegrationRecord): ZentridDataOrigin {
  return ZentridEntityDetailUX.origin(record, 'integration');
}

function integrationDetailBackendManaged(record: IntegrationRecord): boolean {
  return ZentridEntityDetailUX.backendManaged(record, 'integration');
}

function integrationDetailStatus(record: IntegrationRecord): string {
  return connectorStatus(record) || String(record.status || 'Inactive');
}

function integrationDetailIsArchived(record: IntegrationRecord): boolean {
  return ZentridEntityDetailUX.archived(integrationDetailStatus(record)) || Boolean(record.archived);
}

function integrationDetailPassed(value: unknown): boolean {
  const normalized = String(value || '').trim().toLowerCase();
  return ['passed', 'valid', 'validated', 'completed', 'success', 'healthy'].some(token => normalized.includes(token));
}

function integrationDetailConnectionPassed(record: IntegrationRecord): boolean {
  return integrationDetailPassed(record.connectionResult) || integrationDetailPassed(record.auth);
}

function integrationDetailSamplePassed(record: IntegrationRecord): boolean {
  return integrationDetailPassed(record.sampleDataStatus) || integrationDetailPassed(record.discovery);
}

function integrationDetailReady(record: IntegrationRecord): boolean {
  return integrationDetailConnectionPassed(record) && integrationDetailSamplePassed(record);
}

function integrationDetailCanEdit(record: IntegrationRecord): boolean {
  return !integrationDetailIsArchived(record);
}

function integrationDetailActionLabel(action: IntegrationDetailAction): string {
  return ({
    validate: 'Validate Configuration',
    testConnection: 'Test Connection',
    testSampleData: 'Test Sample Data',
    activate: 'Activate',
    suspend: 'Suspend',
    archive: 'Archive'
  })[action];
}

function integrationDetailActionBusyLabel(action: IntegrationDetailAction): string {
  return ({
    validate: 'Validating…',
    testConnection: 'Testing…',
    testSampleData: 'Testing…',
    activate: 'Activating…',
    suspend: 'Suspending…',
    archive: 'Archiving…'
  })[action];
}

function integrationDetailActionDisabled(record: IntegrationRecord, action: IntegrationDetailAction): boolean {
  const status = integrationDetailStatus(record).toLowerCase();
  const archived = integrationDetailIsArchived(record);
  if (archived) return true;
  if (action === 'testSampleData') return !integrationDetailConnectionPassed(record);
  if (action === 'activate') return status === 'active' || !integrationDetailReady(record);
  if (action === 'suspend') return status !== 'active';
  if (action === 'archive') return status === 'archived';
  return false;
}

function renderIntegrationDetailControls(record: IntegrationRecord): string {
  const status = integrationDetailStatus(record);
  const backendManaged = integrationDetailBackendManaged(record);
  const archived = integrationDetailIsArchived(record);
  const policy = backendManaged
    ? 'Live connector configuration can be edited as a browser-only override. No backend update request is sent; diagnostic and lifecycle actions continue to use existing backend commands.'
    : 'This is prototype data. Configuration edits, checks and lifecycle actions are stored only in this browser and remain clearly marked as local changes.';
  const actionButton = (action: IntegrationDetailAction, className = '') => {
    const disabled = integrationDetailActionDisabled(record, action);
    const permissionAction = action === 'testConnection' || action === 'testSampleData' || action === 'validate' ? 'view' : action;
    return `<button type="button" class="${className}" data-integration-detail-action="${action}" data-default-disabled="${disabled ? 'true' : 'false'}" data-permission-action="${permissionAction}" data-permission-resource="integration" data-permission-status="${integrationDetailEscape(status)}" data-permission-origin="${integrationDetailEscape(integrationDetailOrigin(record))}" ${disabled ? 'disabled' : ''}>${integrationDetailActionLabel(action)}</button>`;
  };
  return `<section class="panel glass-card integration-detail-control-v116" id="integrationDetailControl" aria-busy="false">
    <div class="panel-head">
      <div><h2>Connector Controls</h2><p>Run configuration checks and permitted lifecycle transitions without changing the connector setup form.</p></div>
      <div class="integration-detail-state-v116"><span class="badge ${statusCls(status)}">${integrationDetailEscape(status)}</span>${ZentridDataSource.badge(record, 'integration', true)}<span class="permission-profile-v121" data-permission-summary data-permission-resource="integration"></span></div>
    </div>
    <div id="integrationDetailFeedback" class="integration-detail-feedback-v116" role="status" aria-live="polite" tabindex="-1" hidden></div>
    <div class="integration-detail-control-grid-v116">
      <div class="panel-lite">
        <h3>Diagnostics</h3>
        <p>Validation and tests never expose stored secret values in the interface.</p>
        <div class="row-actions">${actionButton('validate')}${actionButton('testConnection')}${actionButton('testSampleData')}</div>
        <div class="integration-check-summary-v116">
          <span>Connection <strong>${integrationDetailConnectionPassed(record) ? 'Passed' : 'Not passed'}</strong></span>
          <span>Sample Data <strong>${integrationDetailSamplePassed(record) ? 'Passed' : 'Not passed'}</strong></span>
        </div>
      </div>
      <div class="panel-lite">
        <h3>Lifecycle</h3>
        <p>${archived ? 'Archived connectors are read-only.' : 'Only valid transitions are enabled for the current status.'}</p>
        <div class="row-actions">${actionButton('activate', 'primary-action')}${actionButton('suspend')}${actionButton('archive', 'danger-action')}</div>
      </div>
    </div>
    <p class="integration-detail-policy-v116" id="integrationDetailEditPolicy">${policy}</p>
  </section>`;
}

function renderIntegrationDetail(): string{
  const x = selectedIntegration();
  const cfg = connectorConfig(x);
  const status = integrationDetailStatus(x);
  const canEdit = integrationDetailCanEdit(x);
  return `<section class="page-hero"><div><p class="eyebrow">Global Admin · Connector Registry <span id="integrationDetailOriginBadge">${ZentridDataSource.badge(x, 'integration', true)}</span></p><h1 id="integrationDetailHeroTitle">${x.vendor} ${x.software}</h1><p class="muted">Connector detail mirrors Integration Parameters. The same sections and field names are used so Global Admin can review what was configured without switching mental models.</p></div><div class="hero-actions"><button class="freshness-card" id="backIntegrationRegistry" type="button"><span class="pulse"></span><div><strong>Back to Registry</strong><small>Connector list</small></div></button></div></section>
  <section class="kpi-grid detail-kpis"><article class="kpi-card"><span>Status</span><strong id="integrationDetailStatusValue">${status}</strong><small>Registry lifecycle state</small></article><article class="kpi-card"><span>Vendor Name</span><strong id="integrationDetailVendorValue">${x.vendorName || x.vendor}</strong><small>${x.software}</small></article><article class="kpi-card"><span>Base URL / Host Address</span><strong id="integrationDetailBaseUrlValue">${cfg.baseUrl}</strong><small>Connection endpoint</small></article><article class="kpi-card"><span>Sync Frequency</span><strong id="integrationDetailSyncValue">${x.syncFrequency || '5 min'}</strong><small>Starts ${x.syncStartTime || '00:00'}</small></article><article class="kpi-card"><span>Contact Name</span><strong id="integrationDetailContactValue">${x.contactName || 'Not configured'}</strong><small>${x.contactPhoneNumber || 'No contact phone'}</small></article></section>
  <div id="integrationDetailControlHost">${renderIntegrationDetailControls(x)}</div>
  <section class="client-layout-v17 detail-layout-standard">
    <aside class="glass-card client-side-card-v17">
      <h3>Integration Navigation</h3>
      <button class="${integrationDetailActiveTab === 'general' ? 'active' : ''}" data-integration-tab="general" ${integrationDetailActiveTab === 'general' ? 'aria-current="page"' : ''}>General</button>
      <button class="${integrationDetailActiveTab === 'connection' ? 'active' : ''}" data-integration-tab="connection" ${integrationDetailActiveTab === 'connection' ? 'aria-current="page"' : ''}>Connection & Authentication</button>
      <button class="${integrationDetailActiveTab === 'api' ? 'active' : ''}" data-integration-tab="api" ${integrationDetailActiveTab === 'api' ? 'aria-current="page"' : ''}>API Request</button>
      <button class="${integrationDetailActiveTab === 'synchronization' ? 'active' : ''}" data-integration-tab="synchronization" ${integrationDetailActiveTab === 'synchronization' ? 'aria-current="page"' : ''}>Synchronization</button>
      <button class="${integrationDetailActiveTab === 'partner' ? 'active' : ''}" data-integration-tab="partner" ${integrationDetailActiveTab === 'partner' ? 'aria-current="page"' : ''}>Partner Account</button>
    </aside>
    <section class="glass-card client-main-card-v17">
      <div class="detail-content-head-v32"><div><h2 id="integrationDetailTitle">${integrationTabLabel(integrationDetailActiveTab)}</h2><p class="muted">Integration detail uses the same left-navigation detail layout as Client Detail.</p></div><div class="detail-tab-actions"><button id="editIntegrationTab" class="small-btn primary" type="button" aria-describedby="integrationDetailEditPolicy" data-permission-action="edit" data-permission-resource="integration" data-permission-status="${integrationDetailEscape(status)}" data-permission-origin="${integrationDetailEscape(integrationDetailOrigin(x))}" data-permission-update-available="false" data-permission-local-override="true" data-permission-base-disabled="${canEdit ? 'false' : 'true'}" ${canEdit ? '' : 'disabled'} title="${canEdit ? (integrationDetailBackendManaged(x) ? 'Edit as a local browser override' : 'Edit this local connector section') : 'Archived connector configuration is read-only'}">Edit</button><button id="cancelIntegrationEdit" class="small-btn ghost hidden" type="button">Cancel</button><button id="saveIntegrationEdit" class="small-btn success hidden" type="button" data-permission-action="edit" data-permission-resource="integration" data-permission-status="${integrationDetailEscape(status)}" data-permission-origin="${integrationDetailEscape(integrationDetailOrigin(x))}" data-permission-update-available="false" data-permission-local-override="true">Save Changes</button></div></div>
      <div id="integrationDetailEditSummary" class="form-validation-summary" role="alert" tabindex="-1" hidden></div>
      <div id="integrationDetailContent">${integrationDetailTab(x,integrationDetailActiveTab)}</div>
    </section>
  </section>`;
}

function integrationTabLabel(tab: string): string{
  return ({general:'General',connection:'Connection & Authentication',api:'API Request',synchronization:'Synchronization',partner:'Partner Account'})[tab] || 'Integration Detail';
}

function displayValue(value: unknown, fallback = 'Configured value'): string{
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value);
}

function isSensitiveIntegrationCredential(label: string): boolean {
  return /password|secret|token|key/i.test(label);
}

function maskSecret(label: string, value: unknown): string{
  const raw = displayValue(value);
  if (raw === 'Configured value' || raw === 'Configured') return raw;
  return isSensitiveIntegrationCredential(label) ? '••••••••' : raw;
}

function connectorCredentialMap(x: Partial<IntegrationRecord>): Record<string, unknown>{
  const vendor = x.vendor || 'Other';
  const tpl = resolveIntegrationVendorTemplate(vendor);
  const stored: Record<string, unknown> = x.credentials || {};
  return Object.fromEntries(tpl.credentials.map((name: string) => [name, stored[name] || stored[name.toLowerCase()] || 'Configured value']));
}

function editableControl(key: string, value: unknown, label: string): string{
  const raw = displayValue(value, '');
  const safe = integrationDetailEscape(raw === 'Configured value' ? '' : raw);
  const required = ['name', 'code', 'baseUrl'].includes(key) ? ' required' : '';
  if (key.startsWith('credentials::')) {
    const sensitive = isSensitiveIntegrationCredential(label);
    const existing = raw && raw !== 'Configured value';
    const inputValue = sensitive ? '' : safe === 'Configured' ? '' : safe;
    const placeholder = existing || raw === 'Configured' ? 'Leave blank to keep configured value' : `Enter ${integrationDetailEscape(label)}`;
    return `<input data-edit-key="${integrationDetailEscape(key)}" type="${sensitive ? 'password' : 'text'}" value="${inputValue}" placeholder="${placeholder}" autocomplete="${sensitive ? 'new-password' : 'off'}" data-credential-sensitive="${sensitive ? 'true' : 'false'}">`;
  }
  if (key === 'baseUrl') return `<input data-edit-key="${key}" type="url" value="${safe}"${required}>`;
  if (/Email$/i.test(key)) return `<input data-edit-key="${key}" type="email" value="${safe}">`;
  if (/Phone|contactPhoneNumber/i.test(key)) return `<input data-edit-key="${key}" type="tel" value="${safe}">`;
  if (key === 'rateLimit') return `<input data-edit-key="${key}" type="number" min="1" step="1" value="${safe}">`;
  if (key === 'syncStartTime') return `<input data-edit-key="${key}" type="time" value="${safe}">`;
  const long = safe.length > 45 || /notes|whitelist|domain/i.test(key + ' ' + label);
  if (long) return `<textarea data-edit-key="${integrationDetailEscape(key)}">${safe}</textarea>`;
  return `<input data-edit-key="${integrationDetailEscape(key)}" value="${safe}"${required}>`;
}

function detailInfoGrid(items: DetailGridItem[], editable = false): string{
  return `<div class="info-grid ${editable ? 'editing-grid' : ''}">${items.map(([label, value, key]) => `<div><span>${label}</span>${editable && key ? editableControl(key, value, label) : `<strong>${integrationDetailEscape(displayValue(value))}</strong>`}</div>`).join('')}</div>`;
}

function detailNote(title: string, copy: unknown): string{
  return `<div class="panel-lite full"><h3>${title}</h3><p class="detail-copy">${integrationDetailEscape(copy)}</p></div>`;
}

function integrationLazyTab(tab: string, content: string): string {
  return window.ZentridDetailLazyTabs?.panel('integration', tab, content) || content;
}

function integrationDetailTab(x: IntegrationRecord, tab: string, editable = integrationDetailEditMode): string{
  const cfg = connectorConfig(x);
  const status = integrationDetailStatus(x);
  if(tab === 'connection') {
    const credentials = connectorCredentialMap(x);
    return `<div class="split-grid"><div class="panel-lite"><h3>Connection</h3>${detailInfoGrid([
      ['Base URL / Host Address', cfg.baseUrl, 'baseUrl'],
      ['Callback URL', x.callbackUrl || 'Auto-generated when needed', 'callbackUrl'],
      ['Allowed IP Whitelist', x.allowedIpWhitelist || '', 'allowedIpWhitelist'],
      ['Domain Whitelist', x.domainWhitelist || '', 'domainWhitelist']
    ], editable)}</div><div class="panel-lite"><h3>Authentication</h3>${detailInfoGrid([
      ['Connection Check', x.connectionResult || 'Not tested'],
      ['Sample Data Check', x.sampleDataStatus || x.discovery || 'Not tested'],
      ['Authentication', x.auth || 'Not tested']
    ], false)}</div><div class="panel-lite full"><h3>Credential Fields</h3><div class="info-grid ${editable ? 'editing-grid' : ''}">${Object.entries(credentials).map(([label, value]) => `<div><span>${integrationDetailEscape(label)}</span>${editable ? editableControl(`credentials::${label}`, value, label) : `<strong>${integrationDetailEscape(maskSecret(label, value))}</strong>`}</div>`).join('')}</div><small class="credential-safety-note-v116">Secret fields are never prefilled. Leaving a credential blank keeps the existing configured state.</small></div>${detailNote('Connection & Authentication Notes', x.connection_authentication_notes || 'Shows only the connection, endpoint, whitelist, validation and credential context entered in Integration Parameters. Sensitive values are masked.')}</div>`;
  }
  if(tab === 'api') return `<div class="split-grid"><div class="panel-lite"><h3>API Request</h3>${detailInfoGrid([
    ['Rate Limit', x.rateLimit || '1000', 'rateLimit'],
    ['Rate Limit Period', x.rateLimitPeriod || 'Hour', 'rateLimitPeriod']
  ], editable)}</div>${detailNote('API Request Notes', x.api_request_notes || 'Shows the same request-limit fields configured in the API Request step.')}</div>`;
  if(tab === 'synchronization') return integrationLazyTab(tab, `<div class="split-grid"><div class="panel-lite"><h3>Synchronization</h3>${detailInfoGrid([
    ['Sync Frequency', x.syncFrequency || '5 min', 'syncFrequency'],
    ['Sync Start Time', x.syncStartTime || '00:00', 'syncStartTime'],
    ['Last Sync Timestamp Field', x.lastSyncTimestampField || 'updated_at', 'lastSyncTimestampField'],
    ['Last Operational Sync', x.lastSync || x.lastSuccessfulSync || 'Not loaded'],
    ['Operational Health', x.operationalStatus || x.health || 'Not loaded'],
    ['Active Alerts', x.alerts || 0]
  ], editable)}</div>${detailNote('Synchronization Notes', x.synchronization_notes || 'Operational summary is requested only when this tab is opened. Failed sync actions remain in Connector Operations.')}</div>`);
  if(tab === 'partner') return `<div class="split-grid"><div class="panel-lite"><h3>Partner Account</h3>${detailInfoGrid([
    ['Partner ID in Vendor System', x.partnerVendorId || '', 'partnerVendorId'],
    ['Account ID', x.accountId || '', 'accountId'],
    ['Contact Phone Number', x.contactPhoneNumber || '', 'contactPhoneNumber'],
    ['Contact Name', x.contactName || '', 'contactName'],
    ['Contact Role', x.contactRole || '', 'contactRole'],
    ['Technical Contact Email', x.technicalContactEmail || '', 'technicalContactEmail'],
    ['Technical Contact Phone', x.technicalContactPhone || '', 'technicalContactPhone'],
    ['Support Email', x.supportEmail || '', 'supportEmail']
  ], editable)}</div>${detailNote('Partner Account Notes', x.partner_account_notes || 'Partner Account displays vendor-side account and contact context only. Tenant ownership fields are intentionally removed from Global Admin Integration Parameters.')}</div>`;
  return `<div class="split-grid"><div class="panel-lite"><h3>General</h3>${detailInfoGrid([
    ['Integration Name', x.name || `${x.vendor} ${x.software}`, 'name'],
    ['Integration Code', x.code || '', 'code'],
    ['Producer / Vendor Template', x.vendor],
    ['Vendor Name', x.vendorName || x.vendor, 'vendorName'],
    ['Integration Status', x.status || status]
  ], editable)}</div>${detailNote('General Notes', x.general_notes || 'This page uses the same section names and field names as Integration Parameters so the setup form and read-only detail remain aligned.')}</div>`;
}

function activeIntegrationDetailTab(): string{
  return document.querySelector<HTMLElement>('[data-integration-tab].active')?.dataset.integrationTab || integrationDetailActiveTab || 'general';
}

function integrationDetailCurrentEditSnapshot(): string {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('#integrationDetailContent [data-edit-key]'))
    .map(control => `${control.dataset.editKey || ''}:${control.value}`)
    .join('\n');
}

function integrationDetailHasUnsavedEdits(): boolean {
  return integrationDetailEditMode && integrationDetailEditSnapshot !== integrationDetailCurrentEditSnapshot();
}

function integrationDetailConfirmDiscard(message = 'Discard unsaved connector changes?'): boolean {
  return ZentridEntityDetailUX.confirmDiscard(integrationDetailHasUnsavedEdits(), message);
}

function setIntegrationDetailEditMode(enabled: boolean, force = false): void{
  const record = selectedIntegration();
  if (enabled && !integrationDetailCanEdit(record)) {
    setIntegrationDetailFeedback('warning', 'Configuration is read-only', integrationDetailBackendManaged(record)
      ? 'The backend does not expose an Integration update endpoint. No local override was created for this live connector.'
      : 'Archived connector configuration cannot be edited.');
    return;
  }
  if (!enabled && !force && !integrationDetailConfirmDiscard()) return;
  integrationDetailEditMode = enabled;
  const tab = activeIntegrationDetailTab();
  const content = document.getElementById('integrationDetailContent');
  if (content) content.innerHTML = integrationDetailTab(record, tab, enabled);
  const title = document.getElementById('integrationDetailTitle');
  if (title) title.textContent = integrationTabLabel(tab);
  const editButton = integrationElement<HTMLButtonElement>('editIntegrationTab');
  if (editButton) {
    editButton.classList.toggle('hidden', enabled);
    editButton.disabled = !integrationDetailCanEdit(record) || integrationDetailBusy;
  }
  document.getElementById('cancelIntegrationEdit')?.classList.toggle('hidden', !enabled);
  document.getElementById('saveIntegrationEdit')?.classList.toggle('hidden', !enabled);
  const summary = document.getElementById('integrationDetailEditSummary');
  if (summary) { summary.hidden = true; summary.innerHTML = ''; }
  integrationDetailEditSnapshot = enabled ? integrationDetailCurrentEditSnapshot() : '';
}

function integrationDetailControl(key: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  return document.querySelector(`#integrationDetailContent [data-edit-key="${CSS.escape(key)}"]`);
}

function integrationDetailWhitelistIssues(control: HTMLTextAreaElement | null, type: 'ip' | 'domain'): ZentridFormIssue[] {
  if (!control || !control.value.trim()) return [];
  const entries = control.value.split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/(?:[0-9]|[12][0-9]|3[0-2]))?$/;
  const domain = /^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  const invalid = entries.find(value => {
    if (type === 'domain') return !domain.test(value);
    if (!ipv4.test(value)) return true;
    const address = value.split('/')[0] || '';
    return address.split('.').some(part => Number(part) > 255);
  });
  return invalid ? [{ control, message: type === 'ip' ? `“${invalid}” is not a valid IPv4 address or CIDR.` : `“${invalid}” is not a valid domain or wildcard domain.` }] : [];
}

function validateIntegrationDetailEdits(): ZentridFormValidationResult {
  const root = requireIntegrationElement('integrationDetailContent');
  const summary = integrationElement('integrationDetailEditSummary');
  const tab = activeIntegrationDetailTab();
  const issues: ZentridFormIssue[] = [];
  if (tab === 'general') {
    const name = integrationDetailControl('name') as HTMLInputElement | null;
    const normalizedName = name?.value.trim().toLowerCase() || '';
    const currentId = selectedIntegration().id;
    if (normalizedName && integrations.some(item => item.id !== currentId && !integrationDetailIsArchived(item) && String(item.name || '').trim().toLowerCase() === normalizedName)) {
      issues.push({ control: name, message: `A connector named “${name?.value.trim()}” already exists.` });
    }
  }
  if (tab === 'connection') {
    const baseUrl = integrationDetailControl('baseUrl') as HTMLInputElement | null;
    if (baseUrl?.value.trim()) {
      try {
        const parsed = new URL(baseUrl.value.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) issues.push({ control: baseUrl, message: 'Base URL must use HTTP or HTTPS.' });
      } catch {
        issues.push({ control: baseUrl, message: 'Enter a complete Base URL, for example https://vendor.example.com.' });
      }
    }
    issues.push(...integrationDetailWhitelistIssues(integrationDetailControl('allowedIpWhitelist') as HTMLTextAreaElement | null, 'ip'));
    issues.push(...integrationDetailWhitelistIssues(integrationDetailControl('domainWhitelist') as HTMLTextAreaElement | null, 'domain'));
  }
  if (tab === 'api') {
    const rate = integrationDetailControl('rateLimit') as HTMLInputElement | null;
    if (rate?.value && (!Number.isInteger(Number(rate.value)) || Number(rate.value) < 1)) issues.push({ control: rate, message: 'Rate Limit must be a positive whole number.' });
  }
  if (tab === 'synchronization') {
    const timestamp = integrationDetailControl('lastSyncTimestampField') as HTMLInputElement | null;
    if (timestamp?.value && !/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(timestamp.value.trim())) issues.push({ control: timestamp, message: 'Last Sync Timestamp Field may contain letters, numbers, dots, underscores and hyphens.' });
  }
  const result = ZentridFormUX.validate(root, issues, summary, `Review ${integrationTabLabel(tab)} before saving`);
  if (!result.valid) ZentridFormUX.focusFirst(result, summary);
  return result;
}

function updateIntegrationDetailView(feedback?: { tone: IntegrationDetailFeedbackTone; title: string; message: string }): void {
  const record = selectedIntegration();
  const tab = activeIntegrationDetailTab();
  integrationDetailEditMode = false;
  integrationDetailEditSnapshot = '';
  const cfg = connectorConfig(record);
  const setText = (id: string, value: unknown) => { const element = document.getElementById(id); if (element) element.textContent = String(value ?? ''); };
  setText('integrationDetailHeroTitle', `${record.vendor || ''} ${record.software || ''}`.trim());
  setText('integrationDetailStatusValue', integrationDetailStatus(record));
  setText('integrationDetailVendorValue', record.vendorName || record.vendor || 'Not configured');
  setText('integrationDetailBaseUrlValue', cfg.baseUrl);
  setText('integrationDetailSyncValue', record.syncFrequency || '5 min');
  setText('integrationDetailContactValue', record.contactName || 'Not configured');
  const originHost = document.getElementById('integrationDetailOriginBadge');
  if (originHost) originHost.innerHTML = ZentridDataSource.badge(record, 'integration', true);
  const controls = document.getElementById('integrationDetailControlHost');
  if (controls) controls.innerHTML = renderIntegrationDetailControls(record);
  const content = document.getElementById('integrationDetailContent');
  if (content) content.innerHTML = integrationDetailTab(record, tab, false);
  setText('integrationDetailTitle', integrationTabLabel(tab));
  const edit = integrationElement<HTMLButtonElement>('editIntegrationTab');
  if (edit) {
    edit.classList.remove('hidden');
    edit.disabled = !integrationDetailCanEdit(record);
    edit.title = integrationDetailCanEdit(record) ? (integrationDetailBackendManaged(record) ? 'Edit as a local browser override' : 'Edit this local connector section') : 'Archived connector configuration is read-only';
  }
  document.getElementById('cancelIntegrationEdit')?.classList.add('hidden');
  document.getElementById('saveIntegrationEdit')?.classList.add('hidden');
  wireIntegrationDetailControls();
  if (feedback) setIntegrationDetailFeedback(feedback.tone, feedback.title, feedback.message);
}

function saveIntegrationDetailEdits(): void{
  const x = selectedIntegration();
  if (!ZentridActionPermissions.guard({ action:'edit', resource:'integration', record:x, status:integrationDetailStatus(x), origin:integrationDetailOrigin(x), updateAvailable:false, localOverride:true })) return;
  if (!integrationDetailCanEdit(x)) {
    setIntegrationDetailFeedback('warning', 'Changes were not saved', 'Archived connector configuration is read-only.');
    return;
  }
  const validation = validateIntegrationDetailEdits();
  if (!validation.valid) return;
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('#integrationDetailContent [data-edit-key]').forEach(input => {
    const key = input.dataset.editKey || '';
    const value = input.value.trim();
    if (key.startsWith('credentials::')) {
      if (!value) return;
      x.credentials = x.credentials || {};
      const label = key.replace('credentials::','');
      x.credentials[label] = input.dataset.credentialSensitive === 'true' ? 'Configured' : value;
      return;
    }
    x[key] = value;
  });
  x.updatedBy = 'Global Admin';
  x.updatedAt = new Date().toISOString().slice(0,10);
  Object.assign(x, ZentridDataSource.markChanged(x, 'integration'));
  saveInts();
  updateIntegrationDetailView({ tone: 'success', title: 'Section saved locally', message: 'The connector configuration was updated in prototype storage. No backend update request was sent.' });
}

function setIntegrationDetailFeedback(tone: IntegrationDetailFeedbackTone, title: string, message: string, retry = false): void {
  const box = document.getElementById('integrationDetailFeedback');
  if (!box) return;
  box.hidden = false;
  box.className = `integration-detail-feedback-v116 ${tone}`;
  box.innerHTML = `<div><strong>${integrationDetailEscape(title)}</strong><span>${integrationDetailEscape(message)}</span></div>${retry ? '<button type="button" id="retryIntegrationDetailAction">Retry</button>' : ''}`;
  if (retry) document.getElementById('retryIntegrationDetailAction')?.addEventListener('click', () => integrationDetailRetryAction?.());
  box.focus({ preventScroll: true });
}

function clearIntegrationDetailFeedback(): void {
  const box = document.getElementById('integrationDetailFeedback');
  if (!box) return;
  box.hidden = true;
  box.innerHTML = '';
  box.className = 'integration-detail-feedback-v116';
}

function setIntegrationDetailBusy(action: IntegrationDetailAction, busy: boolean): void {
  integrationDetailBusy = busy;
  const panel = document.getElementById('integrationDetailControl');
  panel?.setAttribute('aria-busy', busy ? 'true' : 'false');
  document.querySelectorAll<HTMLButtonElement>('[data-integration-detail-action]').forEach(button => {
    const buttonAction = button.dataset.integrationDetailAction as IntegrationDetailAction;
    if (busy && buttonAction === action) {
      if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent || integrationDetailActionLabel(buttonAction);
      button.textContent = integrationDetailActionBusyLabel(action);
    } else if (!busy && button.dataset.idleLabel) {
      button.textContent = button.dataset.idleLabel;
    }
    button.disabled = busy || button.dataset.defaultDisabled === 'true';
  });
  const edit = integrationElement<HTMLButtonElement>('editIntegrationTab');
  if (edit) edit.disabled = busy || !integrationDetailCanEdit(selectedIntegration());
}

async function confirmIntegrationDetailAction(record: IntegrationRecord, action: IntegrationDetailAction): Promise<boolean> {
  const name = record.name || record.id || 'this connector';
  const messages: Partial<Record<IntegrationDetailAction, string>> = {
    activate: `Activate “${name}”? Synchronization may begin immediately.`,
    suspend: `Suspend “${name}”? Scheduled synchronization will stop until reactivated.`,
    archive: `Archive “${name}”? The connector will become read-only and move to the archive lifecycle state.`
  };
  const message = messages[action];
  if (!message) return true;
  if (typeof ZentridUX === 'undefined') return window.confirm(message);
  return ZentridUX.confirmAction({
    title: `${integrationDetailActionLabel(action)} connector?`,
    message,
    confirmLabel: integrationDetailActionLabel(action),
    tone: action === 'archive' ? 'danger' : 'warning'
  });
}

function applyIntegrationDetailActionState(record: IntegrationRecord, action: IntegrationDetailAction, local: boolean): void {
  const suffix = local ? ' locally' : '';
  if (action === 'validate') record.validationResult = `Passed${suffix}`;
  if (action === 'testConnection') {
    record.connectionResult = `Passed${suffix}`;
    record.auth = 'Valid';
  }
  if (action === 'testSampleData') {
    record.sampleDataStatus = `Passed${suffix}`;
    record.discovery = local ? 'Sample Data Passed locally' : 'Sample Data Passed';
  }
  if (action === 'activate') {
    record.status = 'Active';
    record.health = 'Healthy';
    record.archived = false;
  }
  if (action === 'suspend') {
    record.status = 'Inactive';
    record.health = 'Warning';
  }
  if (action === 'archive') {
    record.status = 'Archived';
    record.health = 'Archived';
    record.archived = true;
    record.archivedAt = new Date().toISOString().slice(0,10);
    record.archivedBy = 'Global Admin';
    record.archiveReason = local ? 'Archived locally from Integration Detail' : 'Archived through backend lifecycle command';
  }
  record.updatedBy = 'Global Admin';
  record.updatedAt = new Date().toISOString().slice(0,10);
}

async function refreshIntegrationDetailAfterBackendAction(id: string, action: IntegrationDetailAction): Promise<void> {
  if (!window.ZentridAPIRepositories?.isConfigured()) return;
  try {
    const result = await ZentridAPIRepositories.integrations.get(id, { forceRefresh: true });
    if (!result.item) return;
    const refreshed = result.item as IntegrationRecord;
    applyIntegrationDetailActionState(refreshed, action, false);
    const index = integrations.findIndex(item => item.id === id);
    if (index >= 0) integrations[index] = refreshed;
    else integrations.unshift(refreshed);
    window.ZentridLiveIntegrations = integrations;
  } catch {
    // The mutation is already confirmed. Keep the confirmed state and let the next read refresh the remaining fields.
  }
}

async function executeBackendIntegrationDetailAction(record: IntegrationRecord, action: IntegrationDetailAction): Promise<ZentridMutationResult> {
  const id = String(record.id || '');
  if (action === 'validate') return ZentridAPIMutations.integrations.validate(id);
  if (action === 'testConnection') return ZentridAPIMutations.integrations.testConnection(id);
  if (action === 'testSampleData') return ZentridAPIMutations.integrations.testSampleData(id);
  if (action === 'activate') return ZentridAPIMutations.integrations.activate(id);
  if (action === 'suspend') return ZentridAPIMutations.integrations.suspend(id);
  return ZentridAPIMutations.integrations.archive(id);
}

async function runIntegrationDetailAction(action: IntegrationDetailAction): Promise<void> {
  if (integrationDetailBusy) return;
  const record = selectedIntegration();
  if (!record.id) {
    setIntegrationDetailFeedback('danger', 'Operation unavailable', 'The connector has no stable identifier.');
    return;
  }
  if (integrationDetailActionDisabled(record, action)) {
    const message = action === 'activate' && !integrationDetailReady(record)
      ? 'Run Connection and Sample Data checks before activation.'
      : action === 'testSampleData'
        ? 'Run the Connection check before testing sample data.'
        : 'This transition is not allowed for the current connector status.';
    setIntegrationDetailFeedback('warning', 'Action unavailable', message);
    return;
  }
  if (!(await confirmIntegrationDetailAction(record, action))) return;
  clearIntegrationDetailFeedback();
  integrationDetailRetryAction = null;
  setIntegrationDetailBusy(action, true);
  const backendManaged = integrationDetailBackendManaged(record);
  try {
    if (backendManaged) {
      if (!window.ZentridAPIMutations) {
        setIntegrationDetailFeedback('danger', 'Backend action unavailable', 'The mutation layer is not loaded. The connector was not changed.');
        return;
      }
      const result = await executeBackendIntegrationDetailAction(record, action);
      if (!result.ok) {
        integrationDetailRetryAction = result.error.retriable ? () => { void runIntegrationDetailAction(action); } : null;
        setIntegrationDetailFeedback('danger', `${integrationDetailActionLabel(action)} failed`, result.error.message, result.error.retriable);
        return;
      }
      applyIntegrationDetailActionState(record, action, false);
      await refreshIntegrationDetailAfterBackendAction(String(record.id), action);
      updateIntegrationDetailView({ tone: 'success', title: result.message, message: 'The backend confirmed the operation and the connector view was refreshed.' });
      return;
    }
    if (action === 'testSampleData' && !integrationDetailConnectionPassed(record)) {
      setIntegrationDetailFeedback('warning', 'Connection check required', 'Run Test Connection before testing sample data.');
      return;
    }
    if (action === 'activate' && !integrationDetailReady(record)) {
      setIntegrationDetailFeedback('warning', 'Connector is not ready', 'Connection and Sample Data checks must pass before local activation.');
      return;
    }
    applyIntegrationDetailActionState(record, action, true);
    Object.assign(record, ZentridDataSource.markChanged(record, 'integration'));
    saveInts();
    updateIntegrationDetailView({ tone: 'success', title: `${integrationDetailActionLabel(action)} completed locally`, message: 'This prototype operation was stored only in the current browser. No backend request was sent.' });
  } catch (error) {
    setIntegrationDetailFeedback('danger', `${integrationDetailActionLabel(action)} failed`, integrationErrorMessage(error));
  } finally {
    setIntegrationDetailBusy(action, false);
  }
}

function wireIntegrationDetailControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-integration-detail-action]').forEach(button => {
    button.addEventListener('click', () => void runIntegrationDetailAction(button.dataset.integrationDetailAction as IntegrationDetailAction));
  });
}

function activateIntegrationDetailTab(tab: string): void {
  integrationDetailActiveTab = tab || 'general';
  window.ZentridDetailLazyTabs?.activate('integration', integrationDetailActiveTab);
  document.querySelectorAll<HTMLElement>('[data-integration-tab]').forEach(button => {
    const active = button.dataset.integrationTab === tab;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const title = document.getElementById('integrationDetailTitle');
  if (title) title.textContent = integrationTabLabel(tab);
  const content = document.getElementById('integrationDetailContent');
  if (content) content.innerHTML = integrationDetailTab(selectedIntegration(), tab, false);
}

function wireIntegrationDetail(): void{
  wireIntegrationDetailControls();
  window.ZentridDetailLazyTabs?.observe('integration', 'integration-detail-content', () => {
    const content = document.getElementById('integrationDetailContent');
    if (content) content.innerHTML = integrationDetailTab(selectedIntegration(), integrationDetailActiveTab, false);
  });
  document.querySelectorAll<HTMLElement>('[data-integration-tab]').forEach(button => button.addEventListener('click', () => {
    const nextTab = button.dataset.integrationTab || 'general';
    if (integrationDetailEditMode && !integrationDetailConfirmDiscard('Discard unsaved changes and open another connector section?')) return;
    integrationDetailEditMode = false;
    integrationDetailEditSnapshot = '';
    activateIntegrationDetailTab(nextTab);
    document.getElementById('editIntegrationTab')?.classList.remove('hidden');
    document.getElementById('cancelIntegrationEdit')?.classList.add('hidden');
    document.getElementById('saveIntegrationEdit')?.classList.add('hidden');
    const edit = integrationElement<HTMLButtonElement>('editIntegrationTab');
    if (edit) edit.disabled = !integrationDetailCanEdit(selectedIntegration());
  }));
  document.getElementById('editIntegrationTab')?.addEventListener('click', () => setIntegrationDetailEditMode(true));
  document.getElementById('cancelIntegrationEdit')?.addEventListener('click', () => setIntegrationDetailEditMode(false));
  document.getElementById('saveIntegrationEdit')?.addEventListener('click', saveIntegrationDetailEdits);
  document.getElementById('backIntegrationRegistry')?.addEventListener('click', () => {
    if (!integrationDetailConfirmDiscard('Discard unsaved changes and return to Connector Registry?')) return;
    location.href = 'integrations.html';
  });
  const requested = localStorage.getItem('zentrid_integration_detail_edit');
  if (requested) {
    localStorage.removeItem('zentrid_integration_detail_edit');
    activateIntegrationDetailTab(requested);
    setIntegrationDetailEditMode(true);
  } else {
    activateIntegrationDetailTab(activeIntegrationDetailTab());
  }
  ZentridEntityDetailUX.bindBeforeUnload('integration-detail', integrationDetailHasUnsavedEdits);
}
