interface ZentridPlant {
  [key: string]: unknown;
  id?: string | number;
  externalId?: string | number;
  adminId?: string | number;
  raw?: Record<string, unknown>;
  code?: string | number;
  name?: string | number;
  tenant?: string | number;
  portfolio?: string | number;
  integration?: string | number;
  vendor?: string | number;
  status?: string | number;
  type?: string | number;
  country?: string | number;
  region?: string | number;
  city?: string | number;
  address?: string | number;
  lat?: string | number;
  lng?: string | number;
  timezone?: string | number;
  capacityDc?: string | number;
  capacityAc?: string | number;
  gridCapacity?: string | number;
  panels?: number;
  inverters?: string | number;
  strings?: string | number;
  transformers?: string | number;
  meters?: string | number;
  battery?: string | number;
  devices?: string | number | unknown[];
  alerts?: string | number;
  health?: string | number;
  powerNow?: string | number;
  energyToday?: string | number;
  commissioning?: string | number;
  livePower?: string | number;
  today?: string | number;
  month?: string | number;
  pr?: string | number;
  lastData?: string | number;
  freshness?: string | number;
  commissioned?: string | number;
  owner?: string | number;
  operator?: string | number;
  om?: string | number;
}

interface ZentridPlantPagerState {
  page: number;
  size: number;
}

interface ZentridPlantPageSlice {
  total: number;
  pages: number;
  page: number;
  start: number;
  end: number;
  rows: ZentridPlant[];
}

interface ZentridAssetClient {
  id?: string;
  code?: string;
  name: string;
  tenant: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  contact: string;
}

interface ZentridVendorField {
  [key: string]: unknown;
  label?: string;
  name?: string;
  type?: string;
  id?: string;
  condition?: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  value?: string;
  html?: string;
  options?: string[];
}

interface ZentridVendorStep {
  key: string;
  label: string;
  title: string;
  note?: string;
  fields: ZentridVendorField[];
}

interface ZentridVendorFlow {
  hint: string;
  steps: ZentridVendorStep[];
}

interface ZentridPlantSidebarGroup {
  [key: string]: unknown;
  key: string;
  icon?: string;
  name: string;
  type?: string;
  status?: string;
  objects?: number;
  show?: boolean;
  system?: boolean;
  description?: string;
}

function plants(): ZentridPlant[] {
  return Array.isArray(window.ZentridLivePlants) ? window.ZentridLivePlants : [];
}

function savePlants(_list: ZentridPlant[]): void { /* API-only: use a confirmed backend mutation. */ }
function plantStatusCls(v: unknown): string {
  const value = String(v).toLowerCase();
  if (value.includes('fault') || value.includes('offline')) return 'danger';
  if (value.includes('warning') || value.includes('delayed')) return 'warning';
  return 'success';
}
function selectedPlant(): ZentridPlant {
  const list = plants();
  const id = localStorage.getItem('zentrid_selected_plant');
  return list.find(p => String(p.id ?? '') === String(id ?? '')) || list[0] || {};
}

function plantAdministrativeId(plant: ZentridPlant | undefined): string {
  if (!plant) return '';
  const raw = plant.raw && typeof plant.raw === 'object' ? plant.raw : {};
  const adminRecord = raw.adminRecord && typeof raw.adminRecord === 'object' ? raw.adminRecord as Record<string, unknown> : {};
  const candidate = plant.adminId || adminRecord.id || adminRecord.plantId || adminRecord.canonicalId || adminRecord.sourceEntityId;
  return candidate === undefined || candidate === null ? '' : String(candidate).trim();
}

function rememberPlantSelection(plant: ZentridPlant | undefined, selectedId: unknown): void {
  const normalizedSelectedId = selectedId === undefined || selectedId === null ? '' : String(selectedId).trim();
  if (!normalizedSelectedId) return;
  localStorage.setItem('zentrid_selected_plant', normalizedSelectedId);
  const adminId = plantAdministrativeId(plant);
  if (!adminId) {
    localStorage.removeItem('zentrid_selected_plant_context');
    return;
  }
  localStorage.setItem('zentrid_selected_plant_context', JSON.stringify({ selectedId: normalizedSelectedId, adminId }));
}

const PLANT_CREATE_FALLBACK_KEY = 'zentrid_plant_create_fallback';

function plantCreateResponseRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  let row = value as Record<string, unknown>;
  for (const key of ['data', 'plant', 'result', 'item']) {
    const nested = row[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) row = nested as Record<string, unknown>;
  }
  return row;
}

function plantCreateBackendId(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  const row = plantCreateResponseRecord(value);
  for (const key of ['id', 'plantId', 'canonicalId', 'sourceEntityId']) {
    const id = String(row[key] || '').trim();
    if (id) return id;
  }
  return '';
}

function plantCreateText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function plantCreateNumber(value: FormDataEntryValue | null): number | null {
  const text = plantCreateText(value).replace(',', '.');
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function plantCreateVendorPayload(form: HTMLFormElement, formData: FormData): Record<string, unknown> {
  const coreNames = new Set([
    'assetType', 'client', 'tenant', 'clientContact', 'timezone', 'country', 'region', 'sourceScheme', 'status',
    'creationMode', 'name', 'genericName', 'code', 'type', 'countryManual', 'city', 'address', 'timezoneManual',
    'commissioned', 'capacityDc', 'capacityAc', 'gridCapacity', 'modules', 'batteryCapacity', 'serviceProvider'
  ]);
  const vendorPayload: Record<string, unknown> = {};
  for (const [key, rawValue] of formData.entries()) {
    if (coreNames.has(key)) continue;
    if (rawValue instanceof File) {
      if (rawValue.size > 0) vendorPayload[`has${key.charAt(0).toUpperCase()}${key.slice(1)}File`] = true;
      continue;
    }
    const value = rawValue.trim();
    if (!value) continue;
    const existing = vendorPayload[key];
    if (existing === undefined) vendorPayload[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else vendorPayload[key] = [existing, value];
  }
  for (const input of Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'))) {
    if (input.name && input.files?.length) vendorPayload[`has${input.name.charAt(0).toUpperCase()}${input.name.slice(1)}File`] = true;
  }
  return vendorPayload;
}

function plantCreateApiPayload(
  form: HTMLFormElement,
  formData: FormData,
  client: ZentridAssetClient,
  type: string,
  isSolar: boolean
): Record<string, unknown> {
  const plantName = plantCreateText(formData.get(isSolar ? 'name' : 'genericName')) || `New ${type}`;
  const sourceScheme = plantCreateText(formData.get('sourceScheme')) || 'Other / Manual';
  const country = plantCreateText(formData.get('countryManual')) || client.country;
  const timezone = plantCreateText(formData.get('timezoneManual')) || client.timezone;
  const clientId = String(client.id || client.code || client.name).trim();
  const clientReference = String(client.code || client.id || client.name).trim();
  const clientName = String(client.name || clientReference).trim();
  const managingTenant = String(client.tenant || plantCreateText(formData.get('tenant'))).trim();
  const recordStatus = plantCreateText(formData.get('status')) || 'Draft';
  const plantType = plantCreateText(formData.get('type')) || (isSolar ? 'Solar' : type);
  const payload: Record<string, unknown> = {
    plantName,
    PlantName: plantName,
    name: plantName,
    Name: plantName,
    clientId,
    ClientId: clientId,
    client: clientReference,
    Client: clientReference,
    clientName,
    ClientName: clientName,
    managingTenant,
    ManagingTenant: managingTenant,
    sourceScheme,
    SourceScheme: sourceScheme,
    recordStatus,
    RecordStatus: recordStatus,
    plantType,
    PlantType: plantType,
    countryRegion: country,
    CountryRegion: country,
    plantTimeZone: timezone,
    PlantTimeZone: timezone
  };
  const optional = (key: string, value: unknown): void => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && !value.trim()) return;
    if (Array.isArray(value) && !value.length) return;
    if (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value as Record<string, unknown>).length) return;
    payload[key] = value;
  };
  optional('plantCode', plantCreateText(formData.get('code')));
  optional('creationMode', plantCreateText(formData.get('creationMode')));
  optional('region', client.region);
  optional('city', plantCreateText(formData.get('city')) || client.city);
  optional('address', plantCreateText(formData.get('address')));
  optional('commissioningDate', plantCreateText(formData.get('commissioned')));
  optional('serviceProvider', plantCreateText(formData.get('serviceProvider')));
  const capacityDcMw = plantCreateNumber(formData.get('capacityDc'));
  const capacityAcMw = plantCreateNumber(formData.get('capacityAc'));
  const gridCapacityMw = plantCreateNumber(formData.get('gridCapacity'));
  const modulesCount = plantCreateNumber(formData.get('modules'));
  const batteryCapacityKwh = plantCreateNumber(formData.get('batteryCapacity'));
  if (capacityDcMw !== null) {
    optional('installedCapacityDcMw', capacityDcMw);
    optional('installedPowerKw', capacityDcMw * 1000);
  }
  if (capacityAcMw !== null) optional('installedCapacityAcMw', capacityAcMw);
  if (gridCapacityMw !== null) optional('gridConnectionCapacityMw', gridCapacityMw);
  if (modulesCount !== null) optional('modulesCount', modulesCount);
  if (batteryCapacityKwh !== null) optional('batteryCapacityKwh', batteryCapacityKwh);
  optional('vendorPayload', plantCreateVendorPayload(form, formData));
  return payload;
}

function savePlantCreateFallback(plant: ZentridPlant): void {
  sessionStorage.setItem(PLANT_CREATE_FALLBACK_KEY, JSON.stringify(plant));
  localStorage.setItem('zentrid_selected_plant', String(plant.id || ''));
  localStorage.removeItem('zentrid_selected_plant_context');
}

function clearPlantCreateFallback(): void {
  sessionStorage.removeItem(PLANT_CREATE_FALLBACK_KEY);
}
var ZentridPlantPager: ZentridPlantPagerState = window.ZentridPlantPager || (window.ZentridPlantPager = { page: 1, size: 50 });
function plantPageSlice(list: ZentridPlant[]): ZentridPlantPageSlice {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / ZentridPlantPager.size));
  ZentridPlantPager.page = Math.min(Math.max(1, Number(ZentridPlantPager.page) || 1), pages);
  const start = (ZentridPlantPager.page - 1) * ZentridPlantPager.size;
  return { total, pages, page: ZentridPlantPager.page, start, end: Math.min(start + ZentridPlantPager.size, total), rows: list.slice(start, start + ZentridPlantPager.size) };
}
function plantPagerHtml(state: ZentridPlantPageSlice): string {
  if (state.total <= ZentridPlantPager.size) return `<div class="pagination-bar"><span>Showing ${state.total} row(s)</span></div>`;
  return `<div class="pagination-bar"><span>Showing ${state.start + 1}-${state.end} of ${state.total}</span><div class="row-actions"><button data-plant-page="prev" ${state.page<=1?'disabled':''}>Prev</button><strong>Page ${state.page} / ${state.pages}</strong><button data-plant-page="next" ${state.page>=state.pages?'disabled':''}>Next</button></div></div>`;
}
function plantRows(list: ZentridPlant[]): string {
  const serverPagination = window.ZentridRegistryQuery?.pagination('plants');
  const state = serverPagination
    ? { total: serverPagination.totalCount, pages: serverPagination.totalPages, page: serverPagination.page, start: (serverPagination.page - 1) * serverPagination.pageSize, end: Math.min(serverPagination.page * serverPagination.pageSize, serverPagination.totalCount), rows: list }
    : plantPageSlice(list);
  const pager = serverPagination ? window.ZentridRegistryQuery?.pagerHtml('plants', list.length) || '' : plantPagerHtml(state);
  return `${pager}<div class="data-table plant-table"><div class="data-head"><span>Plant</span><span>Tenant / Source</span><span>Location</span><span>Capacity</span><span>Status</span><span>Actions</span></div>${state.rows.map(p => `<div class="data-row" data-id="${p.id}"><div>${ZentridDataSource.badge(p, 'plant')}<strong>${p.name}</strong><small>${p.code}<br>${p.id}</small></div><div><strong>${p.tenant}</strong><small>${p.vendor} · ${p.integration}</small></div><div><strong>${p.country}</strong><small>${p.region} · ${p.city}</small></div><div><strong>${p.capacityDc} MWp DC</strong><small>${p.capacityAc} MW AC · ${p.devices} devices</small></div><div><span class="badge ${plantStatusCls(p.status)}">${p.status}</span><small>${p.alerts} alerts · ${p.lastData}</small></div><div class="row-actions"><button data-action="open" data-permission-action="view" data-permission-resource="plant" data-permission-status="${p.status}" data-permission-origin="${ZentridDataSource.origin(p, 'plant')}">Open</button><button data-action="edit" data-permission-action="edit" data-permission-resource="plant" data-permission-status="${p.status}" data-permission-origin="${ZentridDataSource.origin(p, 'plant')}" data-permission-update-available="false" data-permission-local-override="true">Edit</button><button data-action="devices" data-permission-action="view" data-permission-resource="plant">Devices</button><button data-action="telemetry" data-permission-action="view" data-permission-resource="plant">Telemetry</button><button data-action="alerts" data-permission-action="view" data-permission-resource="plant">Alerts</button></div></div>`).join('')}</div>${pager}`;
}
const fallbackAssetClients: ZentridAssetClient[] = [];
function assetClientRecords(): ZentridAssetClient[] {
  const stored = window.ZentridLocalStore
    ? ZentridLocalStore.read(ZentridLocalStore.KEYS.clients, [])
    : (JSON.parse(localStorage.getItem('zentrid_custom_clients') || '[]') as Record<string, unknown>[]);
  const hydrated = stored.map((row): ZentridAssetClient => ({
    id: String(row.id || row.clientId || row.code || row.name || ''),
    code: String(row.code || row.clientCode || row.externalId || ''),
    name: String(row.name || row.displayName || 'Unnamed Client'),
    tenant: String(row.tenant || row.managingTenant || row.operator || 'Tenant workspace'),
    country: String(row.country || 'Armenia'),
    region: String(row.region || row.state || '—'),
    city: String(row.city || '—'),
    timezone: String(row.timezone || 'Asia/Yerevan'),
    contact: String(row.primaryContact || row.contactName || row.contactEmail || '—')
  }));
  const byKey = new Map<string, ZentridAssetClient>();
  [...hydrated, ...fallbackAssetClients].forEach(client => {
    const key = String(client.id || client.name).trim().toLowerCase();
    if (key && !byKey.has(key)) byKey.set(key, client);
  });
  return Array.from(byKey.values());
}
const assetClientOptions: ZentridAssetClient[] = assetClientRecords();
const defaultAssetClient: ZentridAssetClient = assetClientOptions[0] ?? { id:'CL-UNASSIGNED', name:'Unassigned Client', tenant:'Tenant workspace', country:'Armenia', region:'—', city:'—', timezone:'Asia/Yerevan', contact:'—' };
const assetTypes = ['Plant','Energy Storage System (BESS)','EV Charger','Smart Home','Smart Building','Smart Factory','Smart Kitchen','Other Device'];

const sourceSchemes: string[] = ['Huawei FusionSolar','SolisCloud','GoodWe SEMS','Sungrow iSolarCloud','SolaX Cloud','Deye / Solarman','Sofar','Peimar','Other / Manual'];

const vendorFlowConfig: Record<string, ZentridVendorFlow> = {
  'Huawei FusionSolar': {
    hint: 'Huawei flow is controlled by Plant Type and EV-charger-only flag. Residential EV-only plants skip Set String Capacity; Residential non-EV and C&I include it.',
    steps: [
      { key:'vendor-basic', label:'Set Basic Info', title:'Huawei · Set Basic Info', note:'Huawei requires company, plant identity, plant type, grid date, country, address and timezone before devices are added.', fields:[
        {label:'Company', name:'huaweiCompany', type:'select', required:true, options:['Tenant Alpha Energy','Tenant North Operations','GridOps Partner','Enterprise O&M Tenant']},
        {label:'Plant Name', name:'name', type:'text', required:true, placeholder:'Plant name'},
        {label:'Plant Type', name:'type', type:'select', id:'huaweiPlantType', required:true, options:['Residential','C&I']},
        {label:'EV-charger-only plant', name:'huaweiEvOnly', type:'select', id:'huaweiEvOnly', condition:'huawei-residential', required:true, options:['No','Yes']},
        {label:'Grid Connection Date', name:'commissioned', type:'date', required:true},
        {label:'Country / Region', name:'countryManual', type:'select', id:'assetCountryManual', required:true, options:['Armenia','Germany','Spain','France','United States','Other']},
        {label:'Plant Address', name:'address', type:'text', required:true, placeholder:'Address search / address library'},
        {label:'Plant Time Zone', name:'timezoneManual', type:'select', required:true, options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','Europe/Paris','UTC']},
        {label:'Residential EV-only logic', name:'huaweiEvFlowNote', type:'readonly-note', condition:'huawei-ev-note', value:'EV-only residential plant skips Set String Capacity and goes directly from Add Devices to Other Info.'}
      ]},
      { key:'vendor-devices', label:'Add Devices', title:'Huawei · Add Devices', note:'Add device type, model and serial number. Supported Huawei device categories: inverter, smart logger, dongle, meter, battery and charger.', fields:[
        {label:'Device Type', name:'deviceType', type:'select', required:true, options:['Inverter','Smart Logger','Dongle','Meter','Battery','Charger']},
        {label:'Device Model', name:'deviceModel', type:'select', required:true, options:['SUN2000 inverter','SmartLogger3000A','Smart Dongle','DTSU666-H meter','LUNA battery','EV Charger','Other Huawei model']},
        {label:'Serial Number (S/N)', name:'deviceSn', type:'text', required:true, placeholder:'Device serial number'},
        {label:'Autodetect Rule', name:'huaweiAutodetectNote', type:'readonly-note', value:'Later the adapter can autodetect Device Type and Device Model from S/N when Huawei API supports it.'}
      ]},
      { key:'vendor-string', label:'Set String Capacity', title:'Huawei · Set String Capacity', note:'Visible only for C&I and Residential non-EV-only plants. Huawei rules say only inverter devices appear here; device fields are read-only and string capacity is editable.', fields:[
        {label:'Huawei inverter string table', name:'huaweiStringCapacityTable', type:'html', html:`<div class="data-table compact-table huawei-string-table"><div class="data-head"><span>Device Name</span><span>Device Type</span><span>Device Model</span><span>S/N</span><span>String Capacity</span></div><div class="data-row"><div><strong>Auto-filled inverter</strong><small>From Add Devices step</small></div><div><strong>Inverter</strong><small>Read-only</small></div><div><strong>SUN2000 model</strong><small>Read-only</small></div><div><strong>Entered S/N</strong><small>Read-only</small></div><div><input name="huaweiStringCapacity" type="number" placeholder="kWp"></div></div></div>`}
      ]},
      { key:'vendor-more', label:'Set Other Info', title:'Huawei · Set Other Info', note:'Optional Huawei metadata and yield statistics.', fields:[
        {label:'Plant Logo', name:'image', type:'file'},
        {label:'Safe Running Start Date', name:'huaweiSafeStart', type:'date'},
        {label:'Plant Overview', name:'plantOverview', type:'textarea', placeholder:'Short plant overview'},
        {label:'Total Yield Statistics', name:'yieldStats', type:'select', options:['Based on management system','Based on inverter']}
      ]}
    ]
  },

  'SolisCloud': {
    hint: 'Solis flow follows Basic Information, Tariff Management, Link Account and More Info. Tariff fields change by tariff type; regional NMI/Agent fields appear only for Australia-like region selection.',
    steps: [
      { key:'vendor-basic', label:'Basic Information', title:'Solis · Basic Information', note:'Core Solis fields: plant profile, map/region, currency, organization code, datalogger and optional module settings.', fields:[
        {label:'Plant Name', name:'name', type:'text', required:true, placeholder:'2–60 characters'},
        {label:'Plant Type', name:'type', type:'select', required:true, id:'solisPlantType', options:['Residential','Commercial & Industrial']},
        {label:'PV Capacity (kWp)', name:'capacityDc', type:'number', required:true, placeholder:'Enter PV capacity or set by string'},
        {label:'Region / Map Location', name:'mapRef', type:'text', required:true, placeholder:'Get map location'},
        {label:'Country / Region', name:'countryManual', type:'select', id:'solisCountry', required:true, options:['Spain','Armenia','Germany','France','Australia','Other']},
        {label:'Detailed Address', name:'address', type:'textarea', required:true, placeholder:'Max 256 characters'},
        {label:'Time Zone', name:'timezoneManual', type:'select', required:true, options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','Europe/Paris','Australia/Sydney','UTC']},
        {label:'Currency', name:'currency', type:'select', required:true, options:['AMD','EUR','USD','AUD','GBP']},
        {label:'Organization Code', name:'solisOrgCode', type:'text', readonly:true, value:'Auto-generated'},
        {label:'Datalogger SN', name:'solisDataloggerSn', type:'text', placeholder:'Add datalogger SN · max 60 characters'},
        {label:'Number of Modules', name:'modules', type:'number', placeholder:'Max 10 characters'},
        {label:'Capacity per Module (W)', name:'moduleCapacity', type:'number', placeholder:'Max 10 characters'},
        {label:'Select Module', name:'solisSelectModule', type:'action', value:'Open module catalog'},
        {label:'NMI', name:'solisNmi', type:'text', condition:'solis-australia', placeholder:'Visible for Australia region'},
        {label:'Agent', name:'solisAgent', type:'select', condition:'solis-australia', options:['WA','SAPN','OTHERS','No data']}
      ]},
      { key:'vendor-commercial', label:'Tariff Management', title:'Solis · Tariff Management', note:'Solis feed-in tariff supports company tariff, fixed tariff and peak-valley tariff mode.', fields:[
        {label:'Feed-in Tariff Source', name:'solisTariffSource', type:'select', options:['Use the company tariff','Custom Tariff','Use other company tariffs']},
        {label:'Tariff Type', name:'tariffType', type:'select', id:'solisTariffType', required:true, options:['Fixed Tariff','Peak-valley Tariff']},
        {label:'Tariff', name:'unitPrice', type:'number', condition:'solis-fixed', required:true, placeholder:'Earning per kWh'},
        {label:'Date Range', name:'solisTariffDateRange', type:'text', condition:'solis-peak', placeholder:'Select date range'},
        {label:'Start Time', name:'solisStartTime', type:'time', condition:'solis-peak'},
        {label:'End Time', name:'solisEndTime', type:'time', condition:'solis-peak'},
        {label:'Peak-Valley Tariff', name:'solisPeakTariff', type:'number', condition:'solis-peak', placeholder:'Tariff for selected period'},
        {label:'Other Period Tariff', name:'solisOtherPeriodTariff', type:'number', condition:'solis-peak', placeholder:'Fallback tariff'}
      ]},
      { key:'vendor-account', label:'Link Account', title:'Solis · Link Account', note:'Solis supports one plant owner and multiple guests. Email lookup can show existing user or Sign Up & Link state.', fields:[
        {label:'Plant Owner Mailbox', name:'owner', type:'email', placeholder:"Owner's email"},
        {label:'Owner User Name', name:'solisOwnerName', type:'text', readonly:true, value:'Appears after owner lookup'},
        {label:'Owner Lookup Result', name:'solisOwnerLookup', type:'text', readonly:true, value:'Sign Up & Link if not registered'},
        {label:'Plant Guest Mailbox', name:'solisGuest', type:'email', placeholder:'Guest email'},
        {label:'Guest User Name', name:'solisGuestName', type:'text', readonly:true, value:'Appears after guest lookup'},
        {label:'Guest Lookup Result', name:'solisGuestLookup', type:'text', readonly:true, value:'Registered or unregistered email can be filled in'},
        {label:'Disclaimer State', name:'solisDisclaimer', type:'readonly-note', value:'Solis may show Reject / Agree disclaimer before linking account.'}
      ]},
      { key:'vendor-more', label:'More Info', title:'Solis · More Info', note:'Installer, grid connection, platform access time, plant image, orientation and remarks.', fields:[
        {label:"Installer's Email", name:'solisInstallerEmail', type:'email', placeholder:"Input Installer's Email"},
        {label:"Installer's Phone", name:'solisInstallerPhone', type:'text', placeholder:"Input Installer's Phone"},
        {label:'Grid Connection Type', name:'gridConnectionType', type:'select', options:['Maximum Export','Surplus Export','Off-grid']},
        {label:'Grid Connection Date', name:'commissioned', type:'date'},
        {label:'Plant Contact', name:'phone', type:'text', placeholder:'Plant contact phone'},
        {label:'Access Platform Time', name:'solisAccessDate', type:'date'},
        {label:'Plant Image', name:'image', type:'file'},
        {label:'Azimuth (°)', name:'azimuth', type:'number'},
        {label:'Tilt (°)', name:'tilt', type:'number'},
        {label:'Remark 1', name:'solisRemark1', type:'text'},
        {label:'Remark 2', name:'solisRemark2', type:'text'},
        {label:'Remark 3', name:'solisRemark3', type:'text'}
      ]}
    ]
  },
  'GoodWe SEMS': {
    hint: 'GoodWe starts from Location, then Basic Information. Plant Type controls PV and storage capacity fields.',
    steps: [
      { key:'vendor-location', label:'Location', title:'GoodWe · Location', note:'Google map location and timezone context.', fields:[
        {label:'Address', name:'address', type:'text', required:true, placeholder:'Google Maps Search'},
        {label:'Longitude', name:'lng', type:'text', readonly:true, value:'Auto from geocoder'},
        {label:'Latitude', name:'lat', type:'text', readonly:true, value:'Auto from geocoder'},
        {label:'Detailed Address', name:'detailedAddress', type:'text'},
        {label:'Country / Region', name:'countryManual', type:'text', id:'assetCountryManual'},
        {label:'Time Zone', name:'timezoneManual', type:'select', options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','UTC']},
        {label:'Authorize timezone update', name:'goodweTimezoneAuth', type:'checkbox'}
      ]},
      { key:'vendor-basic', label:'Basic Information', title:'GoodWe · Basic Information', note:'Plant Type changes required capacity fields.', fields:[
        {label:'Plant Type', name:'type', type:'select', id:'goodwePlantType', options:['Residential PV Plant','Residential Storage Plant','C&I PV Plant','C&I Storage Plant']},
        {label:'Name', name:'name', type:'text', required:true, placeholder:'Max 50 characters'},
        {label:'Rated Power (kW)', name:'capacityAc', type:'text', readonly:true, value:'Auto Get'},
        {label:'Commercial Operation Date', name:'commissioned', type:'date'},
        {label:'PV Capacity (kWp)', name:'capacityDc', type:'number', condition:'goodwe-pv'},
        {label:'Energy Storage Capacity (kWh)', name:'batteryCapacity', type:'number', condition:'goodwe-storage'},
        {label:'PV Installation Angle (°)', name:'tilt', type:'number', condition:'goodwe-pv-angle'},
        {label:'Note', name:'plantOverview', type:'textarea', placeholder:'Max 400 characters'}
      ]},
      { key:'vendor-account', label:'Ownership', title:'GoodWe · Ownership & Visitor Access', note:'Owner and visitor access are GoodWe-specific account associations.', fields:[
        {label:'Organization Code', name:'goodweOrgCode', type:'text', readonly:true, value:'Auto-generated'},
        {label:"Owner's Email", name:'owner', type:'email'},
        {label:'Add Visitor User', name:'goodweVisitorUser', type:'email', placeholder:'Visitor user email'},
        {label:'Add Visitor Organization', name:'goodweVisitorOrg', type:'text', placeholder:'Visitor organization'}
      ]}
    ]
  },
  'Sungrow iSolarCloud': {
    hint: 'Sungrow uses Plant Information, Communication Device, and Tariff. Plant Type controls which plant fields are visible: PV, ES/Storage, or PV + Energy Storage.',
    steps: [
      { key:'vendor-basic', label:'Plant Information', title:'Sungrow · Plant Information', note:'Select Plant Type first. The form below follows Sungrow field visibility groups.', fields:[
        {label:'Plant Type', name:'type', type:'select', id:'sungrowPlantType', options:['PV Plant','ES / Storage Plant','PV + Energy Storage']},
        {type:'html', html:'<div class="vendor-subsection-title">Common Plant Fields</div>'},
        {label:'Plant Name', name:'name', type:'text', required:true, placeholder:'Max 100 characters'},
        {label:'Detailed Address', name:'address', type:'text', required:true, placeholder:'Address selector / map picker'},
        {label:'Country / Region', name:'countryManual', type:'text', id:'assetCountryManual', required:true},
        {label:'Time Zone', name:'timezoneManual', type:'select', required:true, options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','UTC']},
        {label:'Plant Image', name:'image', type:'file'},
        {label:"Owner's Email Address", name:'owner', type:'email', required:true},
        {label:'Owner Authorization', name:'sungrowOwnerAuthorization', type:'checkbox'},
        {label:'Remark 1', name:'sungrowRemark1', type:'textarea', placeholder:'Max 100 characters'},
        {type:'html', html:'<div class="vendor-subsection-title">Plant Type Dependent Fields</div>'},
        {label:'PV Installed Power (kWp)', name:'capacityDc', type:'number', required:true},
        {label:'ES Installed Power (kW)', name:'sungrowEsPower', type:'number', condition:'sungrow-storage'},
        {label:'ES Battery Capacity (kWh)', name:'batteryCapacity', type:'number', condition:'sungrow-storage'},
        {label:'Grid Connection Type', name:'gridConnectionType', type:'select', condition:'sungrow-grid', options:['100% feed-in','Self-consumption','Zero export','Off-grid']},
        {label:'Grid Connection Date', name:'commissioned', type:'date', condition:'sungrow-grid'},
        {label:'Energy Storage Solution', name:'sungrowStorageSolution', type:'select', condition:'sungrow-hybrid', options:['AC Coupling','DC Coupling']},
        {label:'Postal Code', name:'postalCode', type:'text', condition:'sungrow-pvmodule'},
        {label:'PV Module Model', name:'sungrowModuleModel', type:'text', condition:'sungrow-pvmodule', placeholder:'PV module model library / dialog'}
      ]},
      { key:'vendor-devices', label:'Communication Device', title:'Sungrow · Add Communication Device', note:'Add communication device manually or recognize QR code image.', fields:[
        {label:'Device Type', name:'deviceType', type:'select', required:true, options:['Logger','Gateway','Communication Module']},
        {label:'Communication Device S/N', name:'deviceSn', type:'text'},
        {label:'Recognize QR Code', name:'sungrowQr', type:'file'},
        {label:'Channel / Partner', name:'sungrowChannel', type:'text'}
      ]},
      { key:'vendor-commercial', label:'Tariff', title:'Sungrow · Tariff', note:'Consumption and feed-in tariff can be Fixed or Time-of-use.', fields:[
        {label:'Currency', name:'currency', type:'select', options:['AMD','EUR','USD','GBP']},
        {type:'html', html:'<div class="vendor-subsection-title">Consumption Tariff</div>'},
        {label:'Consumption Tariff Mode', name:'sungrowConsumptionMode', type:'select', id:'sungrowConsumptionMode', options:['Fixed tariff','Time-of-use tariff']},
        {label:'Consumption Tariff', name:'unitPrice', type:'number', condition:'sungrow-consumption-fixed'},
        {label:'Consumption TOU Start', name:'sungrowConsumptionStart', type:'time', condition:'sungrow-consumption-tou'},
        {label:'Consumption TOU End', name:'sungrowConsumptionEnd', type:'time', condition:'sungrow-consumption-tou'},
        {label:'Consumption TOU Tariff', name:'sungrowConsumptionTouTariff', type:'number', condition:'sungrow-consumption-tou'},
        {label:'Consumption Other Time Period', name:'sungrowConsumptionOtherPeriod', type:'number', condition:'sungrow-consumption-tou'},
        {type:'html', html:'<div class="vendor-subsection-title">Feed-in Tariff</div>'},
        {label:'Feed-in Tariff Mode', name:'sungrowFeedMode', type:'select', id:'sungrowFeedMode', options:['Fixed tariff','Time-of-use tariff']},
        {label:'Feed-in Tariff', name:'sungrowFeedTariff', type:'number', condition:'sungrow-feed-fixed'},
        {label:'Feed-in TOU Start', name:'sungrowFeedStart', type:'time', condition:'sungrow-feed-tou'},
        {label:'Feed-in TOU End', name:'sungrowFeedEnd', type:'time', condition:'sungrow-feed-tou'},
        {label:'Feed-in TOU Tariff', name:'sungrowFeedTouTariff', type:'number', condition:'sungrow-feed-tou'},
        {label:'Feed-in Other Time Period', name:'sungrowFeedOtherPeriod', type:'number', condition:'sungrow-feed-tou'}
      ]}
    ]
  },
  'SolaX Cloud': {
    hint: 'SolaX uses Basic Information and Add Device. Plant Type controls C&I fields; Device Import Method controls manual vs batch inputs.',
    steps: [
      { key:'vendor-basic', label:'Basic Information', title:'SolaX · Basic Information', note:'Residential / C&I plant profile, owner account, map address and capacity parameters.', fields:[
        {label:'Plant Type', name:'type', type:'select', id:'solaxPlantType', options:['Residential','Commercial & Industrial']},
        {label:'Plant Name', name:'name', type:'text', required:true, placeholder:'Free text'},
        {label:'Owner Account', name:'owner', type:'email', placeholder:'Existing user / email'},
        {label:'Add Address', name:'address', type:'text', required:true, placeholder:'Map selector / map search'},
        {label:'Detailed Address', name:'detailedAddress', type:'text', placeholder:'Free text'},
        {label:'Country / Region', name:'countryManual', type:'text', id:'assetCountryManual', readonly:true, placeholder:'Auto from map'},
        {label:'Zip Code', name:'postalCode', type:'text', readonly:true, placeholder:'Auto from geocoder'},
        {label:'Time Zone', name:'timezoneManual', type:'select', options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','Europe/Paris','UTC']},
        {label:'PV Capacity (kWp)', name:'capacityDc', type:'number'},
        {label:'Battery Capacity (kWh)', name:'batteryCapacity', type:'number'},
        {label:'Earnings Calculation Method', name:'solaxEarningsMethod', type:'select', condition:'solax-ci', options:['Standard Mode']},
        {label:'Supported Product Series', name:'solaxProductSeries', type:'select', condition:'solax-ci', options:['X3-AELIO','X3-TRENE','X3-FORTH','X3-FORTH Plus','X3-MEGA G2','X3-GRAND HV','X3-PRO G2']},
        {label:'Integrate inverter historical energy data', name:'solaxHistoricalData', type:'checkbox'}
      ]},
      { key:'vendor-devices', label:'Add Device', title:'SolaX · Add Device', note:'Choose manual device registration or batch import. Only the matching fields are visible.', fields:[
        {label:'Device Import Method', name:'solaxDeviceImport', type:'select', id:'solaxDeviceImport', options:['Manually Add','Batch Import']},
        {label:'Device Registration Number', name:'deviceSn', type:'text', condition:'solax-manual', placeholder:'Registration Number'},
        {label:'Add Device', name:'solaxAddDeviceHint', type:'readonly-note', condition:'solax-manual', value:'After entering registration number, use Add Device in the real integration flow.'},
        {label:'Download Batch Template', name:'solaxTemplateHint', type:'readonly-note', condition:'solax-batch', value:'Download template, fill device records, then upload completed file.'},
        {label:'Batch Import File', name:'solaxBatchFile', type:'file', condition:'solax-batch'}
      ]}
    ]
  },
  'Deye / Solarman': {
    hint: 'Deye creates plant information first, then assigns devices. Location, capacity, grid type and yield info are in the same first step.',
    steps: [
      { key:'vendor-basic', label:'Plant Information', title:'Deye · Plant Information', note:'Basic info, location, system and yield info are completed together before device assignment.', fields:[
        {type:'html', html:'<div class="vendor-subsection-title">Basic Info</div>'},
        {label:'Name', name:'name', type:'text', required:true, placeholder:'Required'},
        {label:'Plant Image Mode', name:'deyeImageMode', type:'select', id:'deyeImageMode', options:['Default Image','Custom Image']},
        {label:'Custom Plant Image', name:'image', type:'file', condition:'deye-custom-image'},
        {type:'html', html:'<div class="vendor-subsection-title">Location</div>'},
        {label:'Plant Address Search', name:'mapRef', type:'text', required:true, placeholder:'Address search'},
        {label:'Region', name:'countryManual', type:'select', id:'assetCountryManual', required:true, options:['Armenia','Germany','Spain','France','United States','Other']},
        {label:'Street', name:'street', type:'text'},
        {label:'Postal Code', name:'postalCode', type:'text'},
        {label:'Address', name:'address', type:'text', required:true},
        {label:'Coordinates', name:'coordinates', type:'text', required:true, placeholder:'Longitude / Latitude'},
        {label:'Time Zone', name:'timezoneManual', type:'select', options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','UTC']},
        {type:'html', html:'<div class="vendor-subsection-title">System Info</div>'},
        {label:'Grid Connection Type', name:'gridConnectionType', type:'select', required:true, options:['Maximum Export','Surplus Export','Off-grid','Self-consumption','Zero export']},
        {label:'Capacity (kWp)', name:'capacityDc', type:'number', required:true},
        {label:'Battery Capacity (kWh)', name:'batteryCapacity', type:'number'},
        {type:'html', html:'<div class="vendor-subsection-title">Yield Info</div>'},
        {label:'Currency', name:'currency', type:'select', required:true, options:['AMD','EUR','USD','GBP']},
        {label:'Unit Price', name:'unitPrice', type:'number', placeholder:'Optional'},
        {label:'Total Cost', name:'totalCost', type:'number', placeholder:'Optional'}
      ]},
      { key:'vendor-devices', label:'Device Assignment', title:'Deye · Device Assignment', note:'Assign inverter / storage devices, or finish plant creation without devices.', fields:[
        {label:'Device Assignment Method', name:'deyeDeviceMethod', type:'select', id:'deyeDeviceMethod', required:true, options:['Add Device','Finish without devices']},
        {label:'Device S/N', name:'deviceSn', type:'text', condition:'deye-add-device', placeholder:'Assign inverter / storage device'}
      ]}
    ]
  },
  'Sofar': {
    hint: 'Sofar/Solarman uses Basic Info, System Info, Yield Info and Owner Info. System Type controls Planned Self-used Rate.',
    steps: [
      { key:'vendor-basic', label:'Basic Info', title:'Sofar · Basic Info', note:'Mapbox location, region, address, D/M/S coordinates and system-generated creation time.', fields:[
        {label:'Name', name:'name', type:'text', required:true, placeholder:'Max 50'},
        {label:'Location', name:'mapRef', type:'text', required:true, placeholder:'Mapbox Search'},
        {label:'Region / Country', name:'countryManual', type:'select', id:'assetCountryManual', options:['Armenia','Germany','Spain','France','United States','Other']},
        {label:'Region Level 1', name:'regionLevel1', type:'select', options:['Yerevan','Armavir','Berlin','Madrid','Auvergne-Rhône-Alpes','Other']},
        {label:'Address', name:'address', type:'text', required:true, placeholder:'Max 200'},
        {label:'Longitude Degrees', name:'lngDeg', type:'number', required:true},
        {label:'Longitude Minutes', name:'lngMin', type:'number', required:true},
        {label:'Longitude Seconds', name:'lngSec', type:'number', required:true},
        {label:'Latitude Degrees', name:'latDeg', type:'number', required:true},
        {label:'Latitude Minutes', name:'latMin', type:'number', required:true},
        {label:'Latitude Seconds', name:'latSec', type:'number', required:true},
        {label:'Time Zone', name:'timezoneManual', type:'select', options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','Europe/Paris','UTC']},
        {label:'Creation Time', name:'sofarCreationTime', type:'text', readonly:true, value:'System generated on save'}
      ]},
      { key:'vendor-technical', label:'System Info', title:'Sofar · System Info', note:'System Type controls whether Planned Self-used Rate is shown.', fields:[
        {label:'Plant Type', name:'type', type:'select', options:['Residential','Commercial','Industrial','Ground Mounted']},
        {label:'System Type', name:'systemType', type:'select', id:'sofarSystemType', options:['PV + Grid','PV + Grid + Consumption','PV + Grid + Consumption + Battery']},
        {label:'Capacity (kWp)', name:'capacityDc', type:'number', required:true, placeholder:'0.001~100000000'},
        {label:'Azimuth (°)', name:'azimuth', type:'number', placeholder:'0~360'},
        {label:'Tilt Angle (°)', name:'tilt', type:'number', placeholder:'0~90'},
        {label:'On-grid Date', name:'commissioned', type:'date'},
        {label:'Planned Self-used Rate (%)', name:'sofarSelfUseRate', type:'number', condition:'sofar-self-use'}
      ]},
      { key:'vendor-commercial', label:'Yield Info', title:'Sofar · Yield Info', note:'Currency is required; yield economics are optional financial inputs.', fields:[
        {label:'Currency', name:'currency', type:'select', required:true, options:['AMD','EUR','USD','GBP']},
        {label:'Unit Price', name:'unitPrice', type:'number', placeholder:'USD/kWh'},
        {label:'Subsidy Income', name:'subsidy', type:'number', placeholder:'USD/kWh'},
        {label:'Total Cost', name:'totalCost', type:'number', placeholder:'USD'},
        {label:'Daily Repayment', name:'dailyRepayment', type:'number', placeholder:'USD'}
      ]},
      { key:'vendor-account', label:'Owner Info', title:'Sofar · Owner Info', note:'Owner contact and business information.', fields:[
        {label:'Contact Person', name:'contactPerson', type:'text', placeholder:'Max 50'},
        {label:'Phone', name:'phone', type:'text', placeholder:'Max 20'},
        {label:'Business Name', name:'businessName', type:'text', placeholder:'Max 50'}
      ]}
    ]
  },
  'Peimar': {
    hint: 'Peimar flow is intentionally compact: Basic Information, optional historical energy import, then Add Device by manual SN or batch import file.',
    steps: [
      { key:'vendor-basic', label:'Basic Information', title:'Peimar · Basic Information', note:'Peimar collects plant identity, optional owner account, location, timezone, PV/Battery capacity and the optional historical energy import flag.', fields:[
        {label:'Plant Name', name:'name', type:'text', required:true, placeholder:'Plant name'},
        {label:'Owner Account', name:'owner', type:'email', placeholder:'Owner email / user selection'},
        {label:'Add Address', name:'address', type:'text', required:true, placeholder:'Map / address picker'},
        {label:'Detailed Address', name:'detailedAddress', type:'text', placeholder:'Optional detailed address'},
        {label:'Country / Region', name:'countryManual', type:'select', id:'assetCountryManual', required:true, options:['Armenia','Germany','Spain','France','United States','Other']},
        {label:'Time Zone', name:'timezoneManual', type:'select', required:true, options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','Europe/Paris','UTC']},
        {label:'PV Capacity (kWp)', name:'capacityDc', type:'number', placeholder:'kWp'},
        {label:'Battery Capacity (kWh)', name:'batteryCapacity', type:'number', placeholder:'kWh'},
        {label:'Integrate inverter historical energy data into new plant statistics', name:'peimarHistoricalData', type:'checkbox'}
      ]},
      { key:'vendor-devices', label:'Add Device', title:'Peimar · Add Device', note:'Choose how devices are added. Manual mode shows Device SN / Identifier. Batch mode shows file upload only.', fields:[
        {label:'Device Addition Method', name:'peimarDeviceMethod', type:'select', id:'peimarDeviceMethod', required:true, options:['Manually Add','Batch Import']},
        {label:'Device SN / Identifier', name:'deviceSn', type:'text', condition:'peimar-manual', placeholder:'Enter Device SN / Device Identifier'},
        {label:'Batch Import File', name:'peimarBatchFile', type:'file', condition:'peimar-batch'}
      ]}
    ]
  },
  'Other / Manual': {
    hint: 'Manual source stores a Zentrid draft record and waits for adapter mapping later.',
    steps: [
      { key:'vendor-basic', label:'Manual Plant', title:'Manual · Plant Profile', note:'No vendor API payload is generated.', fields:[
        {label:'Plant Name', name:'name', type:'text', required:true},
        {label:'External Reference', name:'manualExternalRef', type:'text'},
        {label:'Address', name:'address', type:'text'},
        {label:'Country / Region', name:'countryManual', type:'text', id:'assetCountryManual'},
        {label:'Time Zone', name:'timezoneManual', type:'select', options:['Asia/Yerevan','Europe/Berlin','Europe/Madrid','UTC']},
        {label:'Mapping Notes', name:'manualNotes', type:'textarea'}
      ]}
    ]
  }
};
const defaultVendorFlow: ZentridVendorFlow = vendorFlowConfig['Other / Manual'] ?? { hint:'Manual vendor flow', steps:[] };

function vendorFieldControl(field: ZentridVendorField): string {
  const req = field.required ? ' required' : '';
  const cond = field.condition ? ` data-condition="${field.condition}"` : '';
  const id = field.id ? ` id="${field.id}"` : '';
  const ro = field.readonly ? ' readonly' : '';
  const val = field.value !== undefined ? ` value="${field.value}"` : '';
  const placeholder = field.placeholder ? ` placeholder="${field.placeholder}"` : '';
  const label = field.label || '';

  if (field.type === 'html') return `<div class="vendor-html-field"${cond}>${field.html || ''}</div>`;

  const fallbackName = label ? label.replace(/\s+/g,'_').toLowerCase() : `field_${Math.random().toString(36).slice(2, 8)}`;
  const name = field.name || fallbackName;

  if (field.type === 'select') return `<label${cond}>${label}<select name="${name}"${id}${req}>${(field.options||[]).map((x: string)=>`<option>${x}</option>`).join('')}</select></label>`;
  if (field.type === 'textarea') return `<label${cond}>${label}<textarea name="${name}"${id}${req}${placeholder}></textarea></label>`;
  if (field.type === 'checkbox') return `<label class="checkbox-label checkbox-inline"${cond}><input name="${name}"${id} type="checkbox"><span>${label}</span></label>`;
  if (field.type === 'file') return `<label class="file-field"${cond}>${label}<input name="${name}"${id} type="file"${req}></label>`;
  if (field.type === 'readonly-note') return `<label class="readonly-note-field"${cond}>${label}<span>${field.value || ''}</span></label>`;
  if (field.type === 'action') return `<label class="readonly-note-field action-note-field"${cond}>${label}<button type="button" class="secondary-btn">${field.value || label}</button></label>`;
  return `<label${cond}>${label}<input name="${name}"${id} type="${field.type || 'text'}"${req}${ro}${val}${placeholder}></label>`;
}

function renderVendorStep(step: ZentridVendorStep): string {
  return `<div class="vendor-flow-panel-inner">
    <div class="section-title"><div><h3>${step.title}</h3><p class="muted">${step.note || ''}</p></div><span class="badge success">${step.label}</span></div>
    <div class="client-form-grid two-col">${(step.fields||[]).map(vendorFieldControl).join('')}</div>
  </div>`;
}

function assetStepContent(){
  return `<section class="form-section-card asset-create-step-panel" data-asset-panel="plant-profile">
    <div class="section-title"><div><h3>Vendor Platform</h3><p class="muted">This wizard creates a Plant. Select the vendor/source platform, then Zentrid loads that vendor's own plant creation logic.</p></div><span class="badge success">Required</span></div>
    <input type="hidden" name="assetType" id="assetTypeSelect" value="Plant" />
    <div class="client-form-grid two-col">
      <label>Source Scheme<select name="sourceScheme" id="assetSourceScheme" required>${sourceSchemes.map(x=>`<option>${x}</option>`).join('')}</select></label>
      <label>Record Status<select name="status" required><option>Draft</option><option>Pending Review</option><option>Normal</option><option>Inactive</option></select></label>
      <label>Creation Mode<select name="creationMode" required><option>Manual vendor-driven form</option><option>From Discovery</option><option>Import from vendor source</option></select></label>
      <label>Payload Strategy<input readonly value="Core Zentrid fields + selected vendor fields only"></label>
    </div>
    <div class="empty-state-card asset-type-note source-scheme-note" id="sourceSchemeNote"><strong>Source scheme: Huawei FusionSolar</strong><small>${vendorFlowConfig['Huawei FusionSolar']?.hint || ''}</small></div>
    <div class="info-grid asset-mapping-grid"><div><span>Group</span><strong>Plants</strong><small>This form belongs to the Plant group only</small></div><div><span>Vendor Logic</span><strong>Vendor-driven wizard</strong><small>Visible steps and fields change by selected source scheme</small></div><div><span>API Payload</span><strong>Filtered mapping</strong><small>Only visible/enabled fields are included for the selected vendor</small></div></div>
  </section>`;
}
function clientStepContent(){
  return `<section class="form-section-card asset-create-step-panel" data-asset-panel="client">
    <div class="section-title"><div><h3>Client Assignment</h3><p class="muted">Select the client first. Zentrid auto-fills the managing tenant and default location context from Client Registry.</p></div></div>
    <div class="client-form-grid two-col">
      <label>Client<select name="client" id="assetClientSelect" required>${assetClientOptions.map(c=>`<option value="${c.id || c.name}">${c.name}</option>`).join('')}</select></label>
      <label>Managing Tenant<input name="tenant" id="assetTenantAuto" readonly value="${defaultAssetClient.tenant}"></label>
      <label>Client Contact<input name="clientContact" id="assetContactAuto" readonly value="${defaultAssetClient.contact}"></label>
      <label>Default Time Zone<input name="timezone" id="assetTimezoneAuto" readonly value="${defaultAssetClient.timezone}"></label>
      <label>Default Country<input name="country" id="assetCountryAuto" readonly value="${defaultAssetClient.country}"></label>
      <label>Default Region<input name="region" id="assetRegionAuto" readonly value="${defaultAssetClient.region}"></label>
    </div>
  </section>`;
}
function vendorFlowPanels(){
  const keys = ['vendor-location','vendor-basic','vendor-technical','vendor-devices','vendor-string','vendor-commercial','vendor-account','vendor-more'];
  return keys.map(key => `<section class="form-section-card asset-create-step-panel vendor-flow-panel" data-asset-panel="${key}" data-vendor-step-host="${key}"></section>`).join('');
}
function reviewStepContent(){
  return `<section class="form-section-card asset-create-step-panel" data-asset-panel="review">
    <div class="section-title"><div><h3>Review</h3><p class="muted">Create the Zentrid plant record and selected vendor payload draft. Hidden vendor fields are disabled and excluded.</p></div><span class="badge warning">Draft review</span></div>
    <div class="info-grid asset-create-review"><div><span>Group</span><strong id="reviewAssetType">Plant</strong><small>Created inside Groups → Plants</small></div><div><span>Plant</span><strong id="reviewPlantName">Not entered</strong><small id="reviewPlantLocation">Location pending</small></div><div><span>Client</span><strong id="reviewClient">${defaultAssetClient.name}</strong><small>Selected owner/customer</small></div><div><span>Managing Tenant</span><strong id="reviewTenant">${defaultAssetClient.tenant}</strong><small>Auto-filled from client</small></div><div><span>Source Scheme</span><strong id="reviewSourceScheme">Huawei FusionSolar</strong><small>Selected vendor creation flow</small></div><div><span>Visible Vendor Flow</span><strong id="reviewVendorAllowed">Basic Info · Add Devices · String Capacity · Other Info</strong><small>Only these sections contribute to vendor payload</small></div><div><span>Payload Rule</span><strong>Common Zentrid fields + selected vendor fields only</strong><small>No hidden vendor fields are included in the local draft</small></div></div>
  </section>`;
}
function plantCreateModal(){
  return `<div class="modal plant-create-modal" id="plantCreateModal" aria-hidden="true">
    <div class="modal-card wide-modal client-create-card asset-create-card" role="dialog" aria-modal="true" aria-labelledby="plantCreateTitle">
      <button class="modal-close" id="closePlantCreate" type="button" aria-label="Close Create Plant wizard">x</button>
      <div class="client-create-head">
        <div><p class="eyebrow">Groups · Plants</p><h2 id="plantCreateTitle">Create Plant</h2><p class="muted">Select client and vendor platform. Zentrid then loads the vendor-specific plant creation flow and conditions.</p></div>
        <span class="badge warning">Draft</span>
      </div>
      <form id="plantCreateForm" class="plant-create-form client-create-form setup-layout asset-create-form" novalidate data-zentrid-form-readiness="api" data-zentrid-form-contract="PlantCreateDraft" data-zentrid-form-endpoint="/api/admin/plants" data-zentrid-form-method="POST" data-zentrid-form-api-note="The existing wizard creates the plant through the confirmed Global Admin API and keeps a session-only fallback for temporary backend outages.">
        <aside class="setup-rail client-create-rail asset-create-rail" aria-label="Create plant steps">
          <button class="active" type="button" data-asset-step="client"><b>1</b><span>Client Assignment</span></button>
          <button type="button" data-asset-step="plant-profile"><b>2</b><span>Vendor Platform</span></button>
          <button type="button" data-asset-step="vendor-location"><b>3</b><span>Location</span></button>
          <button type="button" data-asset-step="vendor-basic"><b>4</b><span>Basic Info</span></button>
          <button type="button" data-asset-step="vendor-technical"><b>5</b><span>System Info</span></button>
          <button type="button" data-asset-step="vendor-devices"><b>6</b><span>Devices</span></button>
          <button type="button" data-asset-step="vendor-string"><b>7</b><span>String Capacity</span></button>
          <button type="button" data-asset-step="vendor-commercial"><b>8</b><span>Commercial</span></button>
          <button type="button" data-asset-step="vendor-account"><b>9</b><span>Account</span></button>
          <button type="button" data-asset-step="vendor-more"><b>10</b><span>More Info</span></button>
          <button type="button" data-asset-step="review"><b>11</b><span>Review</span></button>
        </aside>
        <div class="client-create-content asset-create-content">
          <div class="form-validation-summary" id="plantValidationSummary" role="alert" tabindex="-1" hidden></div>
          ${clientStepContent()}${assetStepContent()}${vendorFlowPanels()}${reviewStepContent()}
          <div class="modal-actions client-create-actions"><span class="wizard-progress" id="plantWizardProgress" aria-live="polite">Step 1</span><button class="secondary-btn" type="button" id="cancelPlantCreate">Cancel</button><button class="secondary-btn" type="button" id="prevAssetStep">Back</button><button class="primary-action" type="button" id="nextAssetStep">Next</button><button class="primary-btn hidden" type="submit" id="submitAssetCreate" data-permission-action="create" data-permission-resource="plant">Create Plant</button></div>
        </div>
      </form>
    </div>
  </div>`;
}

const defaultSidebarGroups: ZentridPlantSidebarGroup[] = [
  { key:'plants', icon:'☀️', name:'Plants', type:'Plant', status:'Active', objects:0, show:true, system:true, description:'Solar plant registry with vendor-driven Create Plant wizard.' },
  { key:'chargers', icon:'🔌', name:'Chargers', type:'EV Charging', status:'Draft', objects:0, show:false, description:'Future EV charging registry with its own columns and create form.' },
  { key:'smart-home', icon:'🏠', name:'Smart Home', type:'Smart Home', status:'Draft', objects:0, show:false, description:'Future Smart Home registry and dedicated onboarding flow.' },
  { key:'bess', icon:'🔋', name:'BESS', type:'Storage', status:'Draft', objects:0, show:false, description:'Future storage device group; storage devices remain visible in Device List.' }
];
function getSidebarGroups(): ZentridPlantSidebarGroup[] {
  try {
    const saved = JSON.parse(localStorage.getItem('zentrid_sidebar_groups') || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch(e) {}
  return defaultSidebarGroups.map(g => ({...g, objects:g.key === 'plants' ? plants().length : (g.objects ?? 0)}));
}
function saveSidebarGroups(groups: ZentridPlantSidebarGroup[]): void {
  localStorage.setItem('zentrid_sidebar_groups', JSON.stringify(groups));
}
function groupRows(groups: ZentridPlantSidebarGroup[]): string {
  return `<div class="data-table compact-table groups-management-table">
    <div class="data-head group-row"><span>Group</span><span>Type</span><span>Objects</span><span>Status</span><span>Show in Sidebar</span><span>Actions</span></div>
    ${groups.map(g => `<div class="data-row group-row" data-group-key="${g.key}">
      <div><strong>${g.icon || '🧩'} ${g.name}</strong><small>${g.description || 'Custom group registry placeholder'}</small></div>
      <div><strong>${g.type || 'Custom'}</strong><small>${g.system ? 'System group' : 'Custom group'}</small></div>
      <div><strong>${g.key === 'plants' ? plants().length : (g.objects || 0)}</strong><small>Registry items</small></div>
      <div><span class="badge ${g.status === 'Active' ? 'success' : 'neutral'}">${g.status || 'Draft'}</span><small>${g.show ? 'Visible in sidebar' : 'Hidden from sidebar'}</small></div>
      <div><label class="toggle-switch group-sidebar-toggle"><input type="checkbox" data-group-toggle="${g.key}" ${g.show ? 'checked' : ''}><span></span></label></div>
      <div class="row-actions"><button class="secondary-btn small-btn" type="button" data-group-open="${g.key}">Open</button><button class="secondary-btn small-btn" type="button" data-group-edit="${g.key}">Edit</button></div>
    </div>`).join('')}
  </div>`;
}
function groupCreateModal(){
  return `<div class="modal group-create-modal" id="groupCreateModal" aria-hidden="true" inert>
    <div class="modal-card wide-modal group-create-card">
      <div class="modal-head"><div><p class="eyebrow">Groups</p><h2>Create Group</h2><p class="muted">Create a new typed group. When Show in Sidebar is enabled, it appears under Groups in the main navigation.</p></div><button class="modal-close" id="closeGroupCreate" type="button">x</button></div>
      <div class="setup-layout compact-setup-layout">
        <aside class="setup-rail"><button class="active" type="button"><b>1</b><span>Group Setup</span></button><button type="button"><b>2</b><span>Visibility</span></button><button type="button"><b>3</b><span>Review</span></button></aside>
        <div class="setup-content">
          <section class="form-section-card"><div class="section-title"><div><h3>Group Information</h3><p class="muted">Only basic metadata is required now. Detailed forms will be added later for each group type.</p></div></div>
            <div class="client-form-grid two-col">
              <label>Group Name<input id="newGroupName" placeholder="Smart Home" /></label>
              <label>Group Type<select id="newGroupType"><option>Smart Home</option><option>EV Charging</option><option>BESS</option><option>Smart Kitchen</option><option>Custom</option></select></label>
              <label>Icon / Short Label<select id="newGroupIcon"><option value="🏠">🏠 Home</option><option value="🔌">🔌 Charger</option><option value="🔋">🔋 Battery</option><option value="🍳">🍳 Kitchen</option><option value="🧩">🧩 Custom</option></select></label>
              <label>Status<select id="newGroupStatus"><option>Draft</option><option>Active</option></select></label>
              <label class="full-span">Description<textarea id="newGroupDescription" placeholder="What this group will contain..."></textarea></label>
              <label class="checkbox-label checkbox-inline full-span"><input id="newGroupShow" type="checkbox" checked><span>Show in Sidebar after Groups</span></label>
            </div>
          </section>
          <section class="form-section-card"><div class="section-title"><div><h3>Review</h3><p class="muted">New groups open a placeholder registry until their own form and table are designed.</p></div><span class="badge neutral">Configurable</span></div>
            <div class="info-grid"><div><span>Sidebar Position</span><strong>After Groups</strong><small>Under Tenant Management</small></div><div><span>Registry Status</span><strong>Placeholder</strong><small>Dedicated table later</small></div><div><span>Data Model</span><strong>Separate</strong><small>Not mixed with Plants</small></div></div>
          </section>
        </div>
      </div>
      <div class="modal-actions"><button class="secondary-btn" id="cancelGroupCreate" type="button">Cancel</button><button class="primary-btn" id="saveGroupCreate" type="button">Create Group</button></div>
    </div>
  </div>`;
}

function renderPlants(): string {
  const list = plants();
  const queryState = window.ZentridRegistryQuery?.read('plants');
  const serverPagination = window.ZentridRegistryQuery?.pagination('plants');
  const totalPlantCount = serverPagination?.totalCount || list.length;
  const initialSearch = queryState?.search || '';
  const initialStatus = queryState?.params.plantStatus || 'All Statuses';
  const initialVendor = queryState?.params.plantVendor || 'All Vendors';
  const warnings = list.filter(p => p.status !== 'Normal').length;
  const totalMw = list.reduce((a,p)=>a + Number(p.capacityDc || 0),0).toFixed(1);
  const plantStatuses = Array.from(new Set(['Normal','Warning','Fault','Offline','Pending Review','Draft','Inactive','Archived',...list.map(plant => String(plant.status || '').trim()).filter(Boolean)]));
  const plantVendors = Array.from(new Set(list.map(plant => String(plant.vendor || '').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  const optionText = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character] || character));
  const groups = getSidebarGroups().map(g => g.key === 'plants' ? {...g, objects:list.length, status:'Active'} : g);
  const openSolar = new URLSearchParams(window.location.search).get('view') === 'solar';
  return `<section class="page-hero"><div><p class="eyebrow">Global Admin · Groups</p><h1>${openSolar ? 'Plant Registry' : 'Groups'}</h1><p class="muted">Groups control which typed registries appear in the main sidebar. Each group keeps its own table, filters, detail page and create form.</p></div>${openSolar ? `<button class="create-action" id="openPlantCreate" type="button" data-permission-action="create" data-permission-resource="plant"><span class="pulse"></span><div><strong>+ Add Plant</strong><small>Client → vendor → plant data</small></div></button>` : `<button class="create-action" id="openGroupCreate" type="button"><span class="pulse"></span><div><strong>+ Create Group</strong><small>Show/hide in sidebar</small></div></button>`}</section>
  <section class="context-bar glass-card"><button class="ctx-item"><span>Visible Groups</span><strong>${groups.filter(g => g.show).length}</strong></button><button class="ctx-item"><span>Total Groups</span><strong>${groups.length}</strong></button><button class="ctx-item"><span>Plants</span><strong>${totalPlantCount.toLocaleString()}</strong></button><button class="ctx-item"><span>Attention</span><strong>${warnings}</strong></button><button class="ctx-item"><span>Installed Capacity DC</span><strong>${totalMw} MWp</strong></button></section>
  <section class="panel glass-card ${openSolar ? 'hidden' : ''}" id="groupsCatalogView"><div class="panel-head"><div><h2>Group Management</h2><p>Create groups and decide which ones appear in the main sidebar. This page does not mix Plants, Smart Homes, Chargers and BESS into one table.</p></div><div class="hero-actions"><button class="secondary-btn" id="openSolarPlantsFromGroups" type="button">Open Plants</button><button class="primary-btn" id="openGroupCreateInline" type="button">Create Group</button></div></div><div id="groupsTableHost">${groupRows(groups)}</div></section>
  <section class="panel glass-card ${openSolar ? '' : 'hidden'}" id="solarPlantsRegistryView"><div class="panel-head"><div><p class="eyebrow">Groups · Plants</p><h2>Plant Registry</h2><p>Plants have their own columns, filters, detail page and Create Plant wizard.</p></div><div class="hero-actions"><button class="secondary-btn" id="backToGroups" type="button">Back to Groups</button><button class="create-action" id="openPlantCreateInline" type="button" data-permission-action="create" data-permission-resource="plant"><span class="pulse"></span><div><strong>+ Add Plant</strong><small>Client → vendor → plant data</small></div></button></div></div><div class="toolbar plant-registry-toolbar"><input id="plantSearch" value="${String(initialSearch).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" placeholder="Search current page by plants, tenants, vendors..."/><select id="plantStatusFilter"><option ${initialStatus === 'All Statuses' ? 'selected' : ''}>All Statuses</option>${plantStatuses.map(value => `<option ${value === initialStatus ? 'selected' : ''}>${optionText(value)}</option>`).join('')}</select><select id="plantVendorFilter"><option ${initialVendor === 'All Vendors' ? 'selected' : ''}>All Vendors</option>${plantVendors.map(value => `<option ${value === initialVendor ? 'selected' : ''}>${optionText(value)}</option>`).join('')}</select></div><div id="plantFilterScopeV126">${window.ZentridRegistryQuery?.filterScopeHtml('plants') || ''}</div><div id="plantTable">${plantRows(list)}</div></section>
  ${plantCreateModal()}${groupCreateModal()}`;
}
function plantEventTarget(event: Event): HTMLElement | null {
  return event.target instanceof HTMLElement ? event.target : null;
}
function wirePlants(){
  const table = document.getElementById('plantTable');
  const search = document.getElementById('plantSearch') as HTMLInputElement | null;
  const status = document.getElementById('plantStatusFilter') as HTMLSelectElement | null;
  const vendor = document.getElementById('plantVendorFilter') as HTMLSelectElement | null;
  function apply(resetPage = true){
    if (!table || !search || !status || !vendor) return;
    if (resetPage && !window.ZentridRegistryQuery?.pagination('plants')) ZentridPlantPager.page = 1;
    const q = (search.value || '').toLowerCase();
    const s = status.value;
    const v = vendor.value;
    let list = plants().filter(p => [p.name,p.tenant,p.vendor,p.country,p.region,p.code,p.status].join(' ').toLowerCase().includes(q));
    if (s !== 'All Statuses') list = list.filter(p => p.status === s);
    if (v !== 'All Vendors') list = list.filter(p => p.vendor === v);
    ZentridRuntimeStability.replaceHtml(table, plantRows(list));
    window.ZentridRegistryQuery?.update('plants', { search: q || null, plantStatus: s === 'All Statuses' ? null : s, plantVendor: v === 'All Vendors' ? null : v }, { replace: true, emit: false });
    const scope = document.getElementById('plantFilterScopeV126');
    if (scope) scope.innerHTML = window.ZentridRegistryQuery?.filterScopeHtml('plants') || '';
  }
  search?.addEventListener('input', () => ZentridRuntimeStability.debounce('registry:plants:search', () => apply(true), 220)); status?.addEventListener('change', () => apply(true)); vendor?.addEventListener('change', () => apply(true));
  table?.addEventListener('click', e => {
    const target = plantEventTarget(e);
    const pageBtn = target?.closest<HTMLElement>('[data-plant-page]');
    if (pageBtn && !window.ZentridRegistryQuery?.pagination('plants')) { ZentridPlantPager.page += pageBtn.dataset.plantPage === 'next' ? 1 : -1; apply(false); return; }
    const btn = target?.closest<HTMLButtonElement>('button');
    const row = target?.closest<HTMLElement>('.data-row'); const id = row?.dataset.id;
    const p = plants().find(x => String(x.id ?? '') === String(id ?? ''));
    if (id) rememberPlantSelection(p, id);
    if (!btn && id) { location.href = 'plant-detail.html'; return; }
    if (!btn) return;
    if (btn.dataset.action === 'open') location.href = 'plant-detail.html';
    if (btn.dataset.action === 'edit') { localStorage.setItem('zentrid_plant_detail_edit', 'overview'); location.href = 'plant-detail.html'; }
    if (btn.dataset.action === 'devices') { localStorage.setItem('zentrid_device_filter_plant', id); ZentridLayout.toast('Opening Device Registry for selected plant'); location.href = 'devices.html'; }
    if (btn.dataset.action === 'telemetry' && p) { localStorage.setItem('zentrid_telemetry_context', JSON.stringify({tenant:p.tenant, plant:p.name, device:'All Devices', metric:'Current Power', range:localStorage.getItem('zentrid_time')||'Last 24h', layer:'Normalized'})); location.href = 'telemetry.html'; }
    if (btn.dataset.action === 'alerts' && p) { localStorage.setItem('zentrid_alert_context', JSON.stringify({plantId:p.id, tenant:p.tenant})); location.href = 'alerts.html'; }
  });
  function openSolarPlantsRegistry(){
    document.getElementById('groupsCatalogView')?.classList.add('hidden');
    document.getElementById('solarPlantsRegistryView')?.classList.remove('hidden');
  }
  function backToGroups(){
    if (window.location.pathname.endsWith('/plants.html')) { location.href = 'groups.html'; return; }
    document.getElementById('solarPlantsRegistryView')?.classList.add('hidden');
    document.getElementById('groupsCatalogView')?.classList.remove('hidden');
  }
  function refreshGroupsTable(){
    const host = document.getElementById('groupsTableHost');
    if (host) host.innerHTML = groupRows(getSidebarGroups().map(g => g.key === 'plants' ? {...g, objects:plants().length, status:'Active'} : g));
  }
  function openGroupCreateModal(){
    const modal = document.getElementById('groupCreateModal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    modal.removeAttribute('inert');
    setTimeout(() => document.getElementById('newGroupName')?.focus(), 0);
  }
  function closeGroupCreateModal(){
    const modal = document.getElementById('groupCreateModal');
    if (!modal) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && modal.contains(activeElement)) activeElement.blur?.();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    modal.setAttribute('inert','');
  }
  function slugifyGroupName(name: string): string {
    return String(name || 'custom-group').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'custom-group';
  }
  function saveNewGroup(){
    const name = (document.getElementById('newGroupName')?.value || '').trim();
    if (!name) { ZentridLayout.toast('Enter group name'); return; }
    const groups = getSidebarGroups();
    let key = slugifyGroupName(name);
    if (groups.some(g => g.key === key)) key = `${key}-${Date.now().toString().slice(-4)}`;
    groups.push({
      key,
      icon: document.getElementById('newGroupIcon')?.value || '🧩',
      name,
      type: document.getElementById('newGroupType')?.value || 'Custom',
      status: document.getElementById('newGroupStatus')?.value || 'Draft',
      objects: 0,
      show: !!document.getElementById('newGroupShow')?.checked,
      description: document.getElementById('newGroupDescription')?.value || 'Custom group registry placeholder.'
    });
    saveSidebarGroups(groups);
    closeGroupCreateModal();
    ZentridLayout.toast('Group created');
    location.reload();
  }
  document.getElementById('openSolarPlantsFromGroups')?.addEventListener('click', openSolarPlantsRegistry);
  document.getElementById('backToGroups')?.addEventListener('click', backToGroups);
  document.getElementById('openGroupCreate')?.addEventListener('click', openGroupCreateModal);
  document.getElementById('openGroupCreateInline')?.addEventListener('click', openGroupCreateModal);
  document.getElementById('closeGroupCreate')?.addEventListener('click', closeGroupCreateModal);
  document.getElementById('cancelGroupCreate')?.addEventListener('click', closeGroupCreateModal);
  document.getElementById('saveGroupCreate')?.addEventListener('click', saveNewGroup);
  const groupCreateModalElement = document.getElementById('groupCreateModal');
  if (groupCreateModalElement?.classList.contains('open')) {
    groupCreateModalElement.removeAttribute('inert');
    groupCreateModalElement.setAttribute('aria-hidden', 'false');
  } else {
    groupCreateModalElement?.setAttribute('inert', '');
    groupCreateModalElement?.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('groupCreateModal')?.addEventListener('click', e => { if (plantEventTarget(e)?.id === 'groupCreateModal') closeGroupCreateModal(); });
  document.getElementById('groupsTableHost')?.addEventListener('change', e => {
    const input = plantEventTarget(e)?.closest<HTMLInputElement>('[data-group-toggle]');
    if (!input) return;
    const key = input.dataset.groupToggle;
    const groups = getSidebarGroups().map(g => g.key === key ? {...g, show: input.checked} : g);
    saveSidebarGroups(groups);
    ZentridLayout.toast(input.checked ? 'Group shown in sidebar' : 'Group hidden from sidebar');
    setTimeout(() => location.reload(), 250);
  });
  document.getElementById('groupsTableHost')?.addEventListener('click', e => {
    const target = plantEventTarget(e);
    const open = target?.closest<HTMLElement>('[data-group-open]');
    const edit = target?.closest<HTMLElement>('[data-group-edit]');
    const key = (open || edit)?.dataset.groupOpen || edit?.dataset.groupEdit;
    if (!key) return;
    if (key === 'plants') { openSolarPlantsRegistry(); return; }
    location.href = `group-detail.html?group=${encodeURIComponent(key)}`;
  });
  const plantCreateForm = document.getElementById('plantCreateForm') as HTMLFormElement | null;
  const plantValidationSummary = document.getElementById('plantValidationSummary');
  let plantCreateInitialSnapshot = '';
  let plantCreateSaving = false;
  function queryCreateContext(): URLSearchParams { return new URLSearchParams(window.location.search); }
  function applyCreateContext(): void {
    const params = queryCreateContext();
    const clientValue = params.get('client');
    const tenantValue = params.get('tenant');
    const select = document.getElementById('assetClientSelect') as HTMLSelectElement | null;
    if (!select) return;
    let match = assetClientOptions.find(client =>
      (clientValue && (String(client.id || '') === clientValue || client.name === clientValue)) ||
      (tenantValue && client.tenant === tenantValue)
    );
    const contextName = params.get('clientName');
    if (!match && contextName) {
      match = {
        id: clientValue || contextName,
        name: contextName,
        tenant: tenantValue || 'Tenant workspace',
        country: params.get('country') || 'Armenia',
        region: params.get('region') || '—',
        city: params.get('city') || '—',
        timezone: params.get('timezone') || 'Asia/Yerevan',
        contact: params.get('contact') || '—'
      };
      assetClientOptions.unshift(match);
      const option = document.createElement('option');
      option.value = String(match.id || match.name);
      option.textContent = match.name;
      select.prepend(option);
    }
    if (match) select.value = String(match.id || match.name);
  }

  async function hydratePlantClientOptions(): Promise<void> {
    const select = document.getElementById('assetClientSelect') as HTMLSelectElement | null;
    if (!select || !window.ZentridAPIRepositories?.isConfigured()) return;
    const wasDirty = plantCreateDirty();
    const previousValue = select.value;
    try {
      const result = await ZentridAPIRepositories.clients.list({
        page:1,
        pageSize:100,
        requestGroup:'plant-create:clients',
        cacheVariant:'plant-create-client-options',
        staleWhileRevalidate:true,
        timeoutMs:12000
      });
      const apiClients = result.items.map((row): ZentridAssetClient => ({
        id:String(row.id || row.clientId || row.code || row.name || '').trim(),
        code:String(row.code || row.clientCode || row.externalId || '').trim(),
        name:String(row.name || row.clientName || row.displayName || row.legalName || row.id || 'Unnamed Client'),
        tenant:String(row.tenant || row.managingTenant || row.tenantName || 'Tenant workspace'),
        country:String(row.country || 'Armenia'),
        region:String(row.region || '—'),
        city:String(row.city || '—'),
        timezone:String(row.timezone || 'Asia/Yerevan'),
        contact:String(row.primaryContact || row.contactName || row.contactEmail || row.email || '—')
      })).filter(client => Boolean(client.id));
      if (!apiClients.length) return;
      const merged = new Map<string, ZentridAssetClient>();
      [...apiClients, ...assetClientOptions].forEach(client => {
        const key = String(client.id || client.name).trim().toLowerCase();
        if (key && !merged.has(key)) merged.set(key, client);
      });
      assetClientOptions.splice(0, assetClientOptions.length, ...merged.values());
      select.innerHTML = assetClientOptions.map(client => `<option value="${String(client.id || client.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${String(client.name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`).join('');
      applyCreateContext();
      if (!queryCreateContext().get('client') && assetClientOptions.some(client => String(client.id || client.name) === previousValue)) select.value = previousValue;
      syncClientDefaults();
      if (!wasDirty && plantCreateForm) plantCreateInitialSnapshot = ZentridFormUX.snapshot(plantCreateForm);
    } catch (error) {
      console.info('Plant client options remain limited to the current context because the client endpoint was unavailable.', error);
    }
  }
  function resetPlantCreateForm(): void {
    if (!plantCreateForm) return;
    plantCreateForm.reset();
    ZentridFormUX.clearErrors(plantCreateForm, plantValidationSummary);
    applyCreateContext();
    activeStep = 'client';
    syncClientDefaults();
    renderVendorFlow();
    showAssetStep('client');
    plantCreateInitialSnapshot = ZentridFormUX.snapshot(plantCreateForm);
    plantCreateSaving = false;
    const submit = document.getElementById('submitAssetCreate') as HTMLButtonElement | null;
    if (submit) ZentridFormUX.setBusy(submit, false);
  }
  function plantCreateDirty(): boolean {
    return !!plantCreateForm && ZentridFormUX.snapshot(plantCreateForm) !== plantCreateInitialSnapshot;
  }
  function consumePlantCreateQuery(): void {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('create')) return;
    url.searchParams.delete('create');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
  function openPlantCreateModal(){
    const modal = document.getElementById('plantCreateModal');
    if (!modal || modal.classList.contains('open')) return;
    consumePlantCreateQuery();
    resetPlantCreateForm();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    modal.removeAttribute('inert');
    void hydratePlantClientOptions();
    setTimeout(() => document.getElementById('assetClientSelect')?.focus(), 0);
  }
  function closePlantCreateModal(force = false){
    const modal = document.getElementById('plantCreateModal');
    if (!modal || (plantCreateSaving && !force)) return;
    if (!force && plantCreateDirty() && !window.confirm('Close Create Plant? Unsaved wizard data will be lost.')) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && modal.contains(activeElement)) activeElement.blur?.();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
  }
  const plantCreateModalElement = document.getElementById('plantCreateModal');
  if (plantCreateModalElement?.classList.contains('open')) {
    plantCreateModalElement.removeAttribute('inert');
    plantCreateModalElement.setAttribute('aria-hidden', 'false');
  } else {
    plantCreateModalElement?.setAttribute('inert', '');
    plantCreateModalElement?.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('openPlantCreate')?.addEventListener('click', openPlantCreateModal);
  document.getElementById('openPlantCreateInline')?.addEventListener('click', openPlantCreateModal);
  document.getElementById('closePlantCreate')?.addEventListener('click', () => closePlantCreateModal());
  document.getElementById('cancelPlantCreate')?.addEventListener('click', () => closePlantCreateModal());
  document.getElementById('plantCreateModal')?.addEventListener('click', e => { if (plantEventTarget(e)?.id === 'plantCreateModal') closePlantCreateModal(); });

  const allStepButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-asset-step]'));
  const baseStepKeys: string[] = ['client','plant-profile'];
  let activeStep = 'client';

  function isSolarSelected(){ return (document.getElementById('assetTypeSelect')?.value || 'Plant') === 'Plant'; }
  function selectedSourceScheme(){
    return document.getElementById('assetSourceScheme')?.value || sourceSchemes[0] || 'Other / Manual';
  }
  function selectedFlow(): ZentridVendorFlow {
    return vendorFlowConfig[selectedSourceScheme()] || defaultVendorFlow;
  }
  function flowStepKeys(){
    if (!isSolarSelected()) return ['plant-profile','client','vendor-basic','review'];
    return [...baseStepKeys, ...selectedFlow().steps.map(s => s.key), 'review'];
  }
  function visibleSteps(): string[] {
    return allStepButtons.filter(b => !b.hidden).flatMap(b => b.dataset.assetStep ? [b.dataset.assetStep] : []);
  }
  function setConditionVisible(name: string, visible: boolean): void {
    document.querySelectorAll(`[data-condition="${name}"]`).forEach(el => {
      el.hidden = !visible;
      el.querySelectorAll('input, select, textarea').forEach(control => { control.disabled = !visible; });
    });
  }
  function applyVendorConditionals(){
    const scheme = selectedSourceScheme();
    if (scheme === 'Huawei FusionSolar'){
      const type = document.getElementById('huaweiPlantType')?.value || 'Residential';
      const evSelect = document.getElementById('huaweiEvOnly');
      if (type !== 'Residential' && evSelect) evSelect.value = 'No';
      const ev = evSelect?.value || 'No';
      setConditionVisible('huawei-residential', type === 'Residential');
      setConditionVisible('huawei-ev-note', type === 'Residential' && ev === 'Yes');
      const hideString = type === 'Residential' && ev === 'Yes';
      document.querySelectorAll('[data-asset-step="vendor-string"]').forEach(b => b.hidden = hideString);
      document.querySelectorAll('[data-asset-panel="vendor-string"]').forEach(p => p.hidden = hideString);
      if (hideString && activeStep === 'vendor-string') showAssetStep('vendor-more');
    }
    if (scheme === 'SolisCloud'){
      const tariff = document.getElementById('solisTariffType')?.value || 'Fixed Tariff';
      setConditionVisible('solis-fixed', tariff === 'Fixed Tariff');
      setConditionVisible('solis-peak', tariff === 'Peak-valley Tariff');
      const country = document.getElementById('solisCountry')?.value || '';
      setConditionVisible('solis-australia', country === 'Australia');
    }
    if (scheme === 'GoodWe SEMS'){
      const t = document.getElementById('goodwePlantType')?.value || 'Residential PV Plant';
      const isStorage = t.includes('Storage');
      setConditionVisible('goodwe-pv', true);
      setConditionVisible('goodwe-pv-angle', true);
      setConditionVisible('goodwe-storage', isStorage);
    }
    if (scheme === 'Sungrow iSolarCloud'){
      const t = document.getElementById('sungrowPlantType')?.value || 'PV Plant';
      const isStorage = t === 'ES / Storage Plant';
      const isHybrid = t === 'PV + Energy Storage';
      const isPvOrHybrid = !isStorage;
      setConditionVisible('sungrow-storage', isStorage);
      setConditionVisible('sungrow-grid', isPvOrHybrid);
      setConditionVisible('sungrow-hybrid', isHybrid);
      setConditionVisible('sungrow-pvmodule', isPvOrHybrid);
      const cm = document.getElementById('sungrowConsumptionMode')?.value || 'Fixed tariff';
      setConditionVisible('sungrow-consumption-fixed', cm === 'Fixed tariff');
      setConditionVisible('sungrow-consumption-tou', cm === 'Time-of-use tariff');
      const fm = document.getElementById('sungrowFeedMode')?.value || 'Fixed tariff';
      setConditionVisible('sungrow-feed-fixed', fm === 'Fixed tariff');
      setConditionVisible('sungrow-feed-tou', fm === 'Time-of-use tariff');
    }
    if (scheme === 'SolaX Cloud'){
      const t = document.getElementById('solaxPlantType')?.value || 'Residential';
      setConditionVisible('solax-ci', t === 'Commercial & Industrial');
      const importMethod = document.getElementById('solaxDeviceImport')?.value || 'Manually Add';
      setConditionVisible('solax-manual', importMethod === 'Manually Add');
      setConditionVisible('solax-batch', importMethod === 'Batch Import');
    }
    if (scheme === 'Deye / Solarman'){
      const imageMode = document.getElementById('deyeImageMode')?.value || 'Default Image';
      setConditionVisible('deye-custom-image', imageMode === 'Custom Image');
      const method = document.getElementById('deyeDeviceMethod')?.value || 'Add Device';
      setConditionVisible('deye-add-device', method === 'Add Device');
    }
    if (scheme === 'Sofar'){
      const t = document.getElementById('sofarSystemType')?.value || 'PV + Grid';
      setConditionVisible('sofar-self-use', t !== 'PV + Grid');
    }
    if (scheme === 'Peimar'){
      const method = document.getElementById('peimarDeviceMethod')?.value || 'Manually Add';
      setConditionVisible('peimar-manual', method === 'Manually Add');
      setConditionVisible('peimar-batch', method === 'Batch Import');
    }
    updateAssetReview();
  }
  function bindVendorFlowControls(){
    ['huaweiPlantType','huaweiEvOnly','solisTariffType','solisCountry','solisPlantType','solisCountry','solisPlantType','goodwePlantType','sungrowPlantType','sungrowConsumptionMode','sungrowFeedMode','solaxPlantType','solaxDeviceImport','deyeImageMode','deyeDeviceMethod','sofarSystemType','peimarDeviceMethod'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyVendorConditionals);
    });
  }
  function renderVendorFlow(){
    const flow = selectedFlow();
    document.querySelectorAll('[data-vendor-step-host]').forEach(host => { host.innerHTML = ''; host.hidden = true; });
    flow.steps.forEach(step => {
      const host = document.querySelector(`[data-vendor-step-host="${step.key}"]`);
      if (host) { host.innerHTML = renderVendorStep(step); host.hidden = false; }
    });
    allStepButtons.forEach((btn, index) => {
      const key = btn.dataset.assetStep || '';
      const vendorStep = flow.steps.find(s => s.key === key);
      const allowed = flowStepKeys();
      btn.hidden = !allowed.includes(key);
      const label = key === 'plant-profile' ? 'Vendor Platform' : key === 'client' ? 'Client Assignment' : key === 'review' ? 'Review' : (vendorStep?.label || btn.querySelector('span')?.textContent || key);
      const order = allowed.indexOf(key) + 1;
      const b = btn.querySelector('b'); if (b) b.textContent = String(order);
      const span = btn.querySelector('span'); if (span) span.textContent = label;
    });
    const note = document.getElementById('sourceSchemeNote');
    if (note) note.innerHTML = `<strong>Source scheme: ${selectedSourceScheme()}</strong><small>${flow.hint}</small>`;
    bindVendorFlowControls();
    applyVendorConditionals();
  }
  function plantNameControl(): HTMLInputElement | null {
    return plantCreateForm?.querySelector<HTMLInputElement>('input[name="name"], input[name="genericName"]') || null;
  }
  function plantDuplicateIssues(): ZentridFormIssue[] {
    const nameControl = plantNameControl();
    const name = String(nameControl?.value || '').trim().toLowerCase();
    if (!name) return [];
    const duplicate = plants().some(row => String(row.name || '').trim().toLowerCase() === name);
    return duplicate ? [{ control:nameControl, message:'A plant with this name already exists in the current local/live registry.' }] : [];
  }
  function validateAssetStep(step: string, focus = true): boolean {
    const panel = document.querySelector<HTMLElement>(`[data-asset-panel="${step}"]`);
    if (!panel || panel.hidden) return true;
    const nameControl = plantNameControl();
    const custom = nameControl && panel.contains(nameControl) ? plantDuplicateIssues() : [];
    const result = ZentridFormUX.validate(panel, custom, plantValidationSummary, `${step === 'review' ? 'Review' : 'Current step'} needs attention`);
    const button = document.querySelector<HTMLElement>(`[data-asset-step="${step}"]`);
    button?.classList.toggle('has-error', !result.valid);
    if (!result.valid && focus) ZentridFormUX.focusFirst(result, plantValidationSummary);
    return result.valid;
  }
  function validateAssetRange(targetStep: string): boolean {
    const steps = visibleSteps();
    const currentIndex = Math.max(0, steps.indexOf(activeStep));
    const targetIndex = Math.max(0, steps.indexOf(targetStep));
    if (targetIndex <= currentIndex) return true;
    for (let index = currentIndex; index < targetIndex; index += 1) {
      const step = steps[index];
      if (step && !validateAssetStep(step)) return false;
      if (step) document.querySelector(`[data-asset-step="${step}"]`)?.classList.add('completed');
    }
    return true;
  }
  function validateAllAssetSteps(): boolean {
    const steps = visibleSteps().filter(step => step !== 'review');
    for (const step of steps) {
      if (!validateAssetStep(step, false)) { showAssetStep(step); validateAssetStep(step, true); return false; }
    }
    if (!validateAssetStep('review', true)) { showAssetStep('review'); return false; }
    return true;
  }

  function showAssetStep(step: string): void {
    const allowed = flowStepKeys().filter(key => !document.querySelector(`[data-asset-step="${key}"]`)?.hidden);
    if (!allowed.includes(step)) step = allowed[0] || 'client';
    activeStep = step;
    allStepButtons.forEach(b => {
      const isActive = b.dataset.assetStep === step;
      b.classList.toggle('active', isActive);
      if (isActive) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.asset-create-step-panel').forEach(p => p.classList.remove('active'));
    const panel = document.querySelector(`[data-asset-panel="${step}"]`);
    if (panel) panel.classList.add('active');
    const ix = allowed.indexOf(activeStep);
    const previousButton = document.getElementById('prevAssetStep') as HTMLButtonElement | null;
    const nextButton = document.getElementById('nextAssetStep');
    const submitButton = document.getElementById('submitAssetCreate');
    if (previousButton) previousButton.disabled = ix <= 0;
    nextButton?.classList.toggle('hidden', activeStep === 'review');
    submitButton?.classList.toggle('hidden', activeStep !== 'review');
    const progress = document.getElementById('plantWizardProgress');
    if (progress) progress.textContent = `Step ${Math.max(ix + 1, 1)} of ${allowed.length}`;
    updateAssetReview();
  }
  function selectedClient(): ZentridAssetClient {
    const value = document.getElementById('assetClientSelect')?.value || defaultAssetClient.id || defaultAssetClient.name;
    return assetClientOptions.find(c => String(c.id || c.name) === value || c.name === value) || defaultAssetClient;
  }
  function syncClientDefaults(){
    const c = selectedClient();
    const map = { assetTenantAuto:c.tenant, assetContactAuto:c.contact, assetTimezoneAuto:c.timezone, assetCountryAuto:c.country, assetRegionAuto:c.region, assetCountryManual:c.country, assetCityManual:c.city };
    Object.entries(map).forEach(([id,val]) => { const el = document.getElementById(id); if (el && !el.value) el.value = val; if (el?.readOnly) el.value = val; });
    updateAssetReview();
  }
  function syncSourceScheme(){
    renderVendorFlow();
    showAssetStep(activeStep);
  }

  function updateAssetReview(){
    const c = selectedClient();
    const type = document.getElementById('assetTypeSelect')?.value || 'Plant';
    const note = document.getElementById('assetTypeNote');
    if (note) note.innerHTML = type === 'Plant'
      ? '<strong>Plant selected</strong><small>The selected vendor controls the remaining wizard steps, fields and conditional visibility.</small>'
      : `<strong>${type} selected</strong><small>This version stores a draft plant profile and uses Manual source mapping until that module is defined.</small>`;
    const rType = document.getElementById('reviewAssetType'); if (rType) rType.textContent = type;
    const rClient = document.getElementById('reviewClient'); if (rClient) rClient.textContent = c.name;
    const rTenant = document.getElementById('reviewTenant'); if (rTenant) rTenant.textContent = c.tenant;
    const rScheme = document.getElementById('reviewSourceScheme'); if (rScheme) rScheme.textContent = selectedSourceScheme();
    const rAllowed = document.getElementById('reviewVendorAllowed'); if (rAllowed) rAllowed.textContent = selectedFlow().steps.map(s => s.label).join(' · ');
    const formData = plantCreateForm ? new FormData(plantCreateForm) : null;
    const rName = document.getElementById('reviewPlantName'); if (rName) rName.textContent = String(formData?.get('name') || formData?.get('genericName') || 'Not entered');
    const rLocation = document.getElementById('reviewPlantLocation'); if (rLocation) rLocation.textContent = [formData?.get('countryManual') || c.country, formData?.get('city') || c.city, formData?.get('address')].filter(Boolean).join(' · ') || 'Location pending';
  }
  allStepButtons.forEach(b => b.addEventListener('click', () => {
    const targetStep = b.dataset.assetStep || 'client';
    if (validateAssetRange(targetStep)) showAssetStep(targetStep);
  }));
  document.getElementById('nextAssetStep')?.addEventListener('click', () => {
    if (!validateAssetStep(activeStep)) return;
    document.querySelector(`[data-asset-step="${activeStep}"]`)?.classList.add('completed');
    const allowed = visibleSteps();
    const ix = allowed.indexOf(activeStep);
    showAssetStep(allowed[Math.min(ix + 1, allowed.length - 1)] || 'review');
  });
  document.getElementById('prevAssetStep')?.addEventListener('click', () => {
    const allowed = visibleSteps();
    const ix = allowed.indexOf(activeStep);
    showAssetStep(allowed[Math.max(ix - 1, 0)] || 'client');
  });
  document.getElementById('assetTypeSelect')?.addEventListener('change', () => {
    const sourceScheme = document.getElementById('assetSourceScheme') as HTMLSelectElement | null;
    if (!isSolarSelected() && sourceScheme) sourceScheme.value = 'Other / Manual';
    renderVendorFlow(); showAssetStep(activeStep); updateAssetReview();
  });
  document.getElementById('assetSourceScheme')?.addEventListener('change', syncSourceScheme);
  document.getElementById('assetClientSelect')?.addEventListener('change', syncClientDefaults);
  document.getElementById('plantCreateModal')?.addEventListener('change', e => {
    const targetId = plantEventTarget(e)?.id;
    if (targetId && ['huaweiPlantType','huaweiEvOnly','solisTariffType','solisCountry','solisPlantType','solisCountry','solisPlantType','goodwePlantType','sungrowPlantType','sungrowConsumptionMode','sungrowFeedMode','solaxPlantType','solaxDeviceImport','deyeImageMode','deyeDeviceMethod','deyeImageMode','deyeDeviceMethod','sofarSystemType','peimarDeviceMethod'].includes(targetId)) {
      applyVendorConditionals();
    }
  });
  syncClientDefaults();
  renderVendorFlow();
  showAssetStep('client');
  if (plantCreateForm) {
    ZentridFormUX.bindClearOnInput(plantCreateForm, plantValidationSummary);
    plantCreateForm.addEventListener('input', updateAssetReview);
  }
  if (queryCreateContext().get('create') === '1') window.setTimeout(openPlantCreateModal, 0);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.getElementById('plantCreateModal')?.classList.contains('open')) closePlantCreateModal(); });

  document.getElementById('plantCreateForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!ZentridActionPermissions.guard({ action:'create', resource:'plant' })) return;
    if (plantCreateSaving || !validateAllAssetSteps()) return;
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const now = Date.now();
    const type = plantCreateText(fd.get('assetType')) || 'Plant';
    const client = selectedClient();
    const isSolar = type === 'Plant';
    const newPlant: ZentridPlant = {
      dataOrigin: 'local',
      id: `LOCAL-PLT-${String(now).slice(-8)}`,
      externalId: 'SESSION-FALLBACK',
      assetType: type,
      code: plantCreateText(fd.get('code')) || `AST-${String(now).slice(-4)}`,
      name: plantCreateText(fd.get(isSolar ? 'name' : 'genericName')) || `New ${type}`,
      tenant: client.tenant,
      portfolio: isSolar ? 'Manual Solar Portfolio' : 'Future Device Portfolio',
      integration: `${plantCreateText(fd.get('sourceScheme')) || 'Other / Manual'} · Manual Entry`,
      vendor: plantCreateText(fd.get('sourceScheme')) || 'Other / Manual',
      vendorPayloadRule: 'core + selected vendor fields only',
      status: plantCreateText(fd.get('status')) || 'Draft',
      type: isSolar ? (plantCreateText(fd.get('type')) || 'Commercial') : type,
      country: plantCreateText(fd.get('countryManual')) || client.country,
      region: client.region,
      city: plantCreateText(fd.get('city')) || client.city,
      address: plantCreateText(fd.get('address')) || '—',
      lat:'—', lng:'—', timezone: plantCreateText(fd.get('timezoneManual')) || client.timezone,
      capacityDc: plantCreateNumber(fd.get('capacityDc')) || 0,
      capacityAc: plantCreateNumber(fd.get('capacityAc')) || 0,
      gridCapacity: plantCreateNumber(fd.get('gridCapacity')) || 0,
      panels:plantCreateNumber(fd.get('modules')) || 0,
      inverters:0, strings:0, transformers:0, meters:0,
      battery: (plantCreateNumber(fd.get('batteryCapacity')) || 0) > 0 ? 'Yes' : 'No', devices:0, alerts:0,
      livePower:'—', today:'—', month:'—', pr:'—', lastData:'Temporary session record', freshness:'Pending backend retry', commissioned: plantCreateText(fd.get('commissioned')) || '—',
      clientId: client.id || client.name,
      owner: client.name, operator: client.tenant, om: plantCreateText(fd.get('serviceProvider')) || client.tenant
    };
    const payload = plantCreateApiPayload(form, fd, client, type, isSolar);
    const submitButton = document.getElementById('submitAssetCreate') as HTMLButtonElement | null;
    plantCreateSaving = true;
    if (submitButton) ZentridFormUX.setBusy(submitButton, true, 'Creating Plant…');
    try {
      if (!window.ZentridAPIMutations) throw new Error('Plant mutation runtime is unavailable.');
      const result = await ZentridAPIMutations.plants.create(payload);
      if (result.ok) {
        const backendId = plantCreateBackendId(result.data);
        clearPlantCreateFallback();
        plantCreateInitialSnapshot = ZentridFormUX.snapshot(form);
        window.ZentridFormReadiness?.markCommitted(form);
        closePlantCreateModal(true);
        if (backendId) {
          rememberPlantSelection({ adminId:backendId }, backendId);
          ZentridLayout.toast('Plant created in the backend. Opening Plant Detail.');
          window.setTimeout(() => { location.href = 'plant-detail.html'; }, 450);
        } else {
          console.info('Plant create succeeded without a returned identifier.', plantCreateResponseRecord(result.data));
          ZentridLayout.toast('Plant created in the backend. Refreshing Plant Registry.');
          window.setTimeout(() => { location.href = 'plants.html?view=solar'; }, 450);
        }
        return;
      }

      if (result.error.retriable) {
        savePlantCreateFallback(newPlant);
        plantCreateInitialSnapshot = ZentridFormUX.snapshot(form);
        window.ZentridFormReadiness?.markCommitted(form);
        ZentridLayout.toast('Backend unavailable. Plant saved as a temporary session fallback.');
        closePlantCreateModal(true);
        window.setTimeout(() => { location.href = 'plant-detail.html'; }, 450);
        return;
      }

      plantCreateSaving = false;
      if (submitButton) ZentridFormUX.setBusy(submitButton, false);
      const detail = result.error.status ? `${result.message} (HTTP ${result.error.status})` : result.message;
      ZentridFormUX.renderSummary(plantValidationSummary, [{ message:detail }], 'Plant was not created');
      plantValidationSummary?.focus();
    } catch (error) {
      try {
        savePlantCreateFallback(newPlant);
        plantCreateInitialSnapshot = ZentridFormUX.snapshot(form);
        window.ZentridFormReadiness?.markCommitted(form);
        ZentridLayout.toast('Plant mutation runtime was unavailable. Plant saved as a temporary session fallback.');
        closePlantCreateModal(true);
        window.setTimeout(() => { location.href = 'plant-detail.html'; }, 450);
      } catch (fallbackError) {
        plantCreateSaving = false;
        if (submitButton) ZentridFormUX.setBusy(submitButton, false);
        ZentridFormUX.renderSummary(plantValidationSummary, [{ message:'Unable to create the plant through the backend or save the temporary fallback.' }], 'Plant was not created');
        plantValidationSummary?.focus();
        console.error('Plant create and fallback both failed.', error, fallbackError);
      }
    }
  });
}
function devicePreview(p: ZentridPlant): string {
  const rows = [
    ['Inverters', p.inverters, 'Active power conversion devices'],
    ['Strings', p.strings, 'PV string groups'],
    ['Meters', p.meters, 'Import / export / bidirectional metering'],
    ['Transformers', p.transformers, 'Grid infrastructure'],
    ['Battery Installed', p.battery, 'BESS / hybrid storage availability']
  ];
  return `<div class="data-table compact-table plant-device-preview">${rows.map(r=>`<div class="data-row"><div><strong>${r[0]}</strong><small>${r[2]}</small></div><div><strong>${r[1]}</strong><small>Normalized asset count</small></div></div>`).join('')}</div>`;
}
function plantTab(p: ZentridPlant, tab: string): string {
  if (tab === 'master') return `<div class="split-grid"><div class="panel-lite"><h3>General Information</h3><div class="info-grid"><div><span>Plant ID</span><strong>${p.id}</strong></div><div><span>External Plant ID</span><strong>${p.externalId}</strong></div><div><span>Plant Code</span><strong>${p.code}</strong></div><div><span>Plant Type</span><strong>${p.type}</strong></div><div><span>Tenant</span><strong>${p.tenant}</strong></div><div><span>Portfolio</span><strong>${p.portfolio}</strong></div><div><span>Owner</span><strong>${p.owner}</strong></div><div><span>O&M Provider</span><strong>${p.om}</strong></div></div></div><div class="panel-lite"><h3>Location Information</h3><div class="info-grid"><div><span>Country</span><strong>${p.country}</strong></div><div><span>Region</span><strong>${p.region}</strong></div><div><span>City</span><strong>${p.city}</strong></div><div><span>Time Zone</span><strong>${p.timezone}</strong></div><div><span>Latitude</span><strong>${p.lat}</strong></div><div><span>Longitude</span><strong>${p.lng}</strong></div></div></div><div class="panel-lite full"><h3>Technical Characteristics</h3><div class="info-grid"><div><span>Commissioning Date</span><strong>${p.commissioned}</strong></div><div><span>Installed Capacity DC</span><strong>${p.capacityDc} MWp</strong></div><div><span>Installed Capacity AC</span><strong>${p.capacityAc} MW</strong></div><div><span>Grid Connection Capacity</span><strong>${p.gridCapacity} MW</strong></div><div><span>Number of Panels</span><strong>${Number(p.panels || 0).toLocaleString()}</strong></div><div><span>Battery Installed</span><strong>${p.battery}</strong></div></div></div></div>`;
  if (tab === 'structure') return `<div class="split-grid"><div class="panel-lite"><h3>Plant Structure</h3><div class="asset-tree"><p>Plant · ${p.name}</p><p>├── Area A</p><p>│   ├── Inverters</p><p>│   └── Strings</p><p>├── Area B</p><p>│   ├── Inverters</p><p>│   └── Strings</p><p>└── ${p.battery === 'Yes' ? 'Battery System' : 'Grid Connection Point'}</p></div></div><div class="panel-lite"><h3>Asset Relationships</h3><p class="muted">Parent/child hierarchy is used for traceability, navigation and correct aggregation. No manual complex topology is required at this prototype stage.</p><div class="drawer-actions"><button class="primary-action" onclick="localStorage.setItem('zentrid_device_filter_plant','${p.id}'); location.href='devices.html'">Open Device Registry</button></div></div><div class="panel-lite full"><h3>Device Preview</h3>${devicePreview(p)}</div></div>`;
  if (tab === 'energy') return `<div class="split-grid"><div class="panel-lite"><h3>Energy KPIs</h3><div class="info-grid"><div><span>Live Power</span><strong>${p.livePower}</strong></div><div><span>Today Energy</span><strong>${p.today}</strong></div><div><span>Month Energy</span><strong>${p.month}</strong></div><div><span>Performance Ratio</span><strong>${p.pr}</strong></div></div></div><div class="panel-lite"><h3>Alerts Preview</h3><div class="timeline-mini"><p><strong>${p.alerts}</strong> active alert(s)</p><p>${p.status === 'Normal' ? 'No critical issues detected.' : 'Attention required: review plant status and last data freshness.'}</p><p>Click Alerts to open filtered operational events.</p></div><div class="drawer-actions"><button class="primary-action" onclick='localStorage.setItem("zentrid_alert_context", JSON.stringify({plantId:"${p.id}", tenant:"${p.tenant}"})); location.href="alerts.html"'>Open Alerts</button></div></div><div class="panel-lite full"><h3>Production Trend Preview</h3><div class="bar-chart mini-trend"><button style="height:42%"></button><button style="height:55%"></button><button style="height:72%"></button><button style="height:64%"></button><button style="height:88%"></button><button style="height:76%"></button><button style="height:61%"></button></div><div class="drawer-actions"><button class="primary-action" onclick='localStorage.setItem("zentrid_telemetry_context", JSON.stringify({tenant:"${p.tenant}", plant:"${p.name}", device:"All Devices", metric:"Current Power", range:localStorage.getItem("zentrid_time")||"Last 24h", layer:"Normalized"})); location.href="telemetry.html"'>Open Telemetry Explorer</button></div></div></div>`;
  if (tab === 'commercial') return `<div class="split-grid"><div class="panel-lite"><h3>Commercial Model</h3><div class="info-grid"><div><span>Commercial Status</span><strong>Active</strong></div><div><span>Primary Buyer</span><strong>Green Market Trader LLC</strong></div><div><span>Sale Price</span><strong>€0.092 / kWh</strong></div><div><span>Settlement</span><strong>Monthly · Net 15</strong></div><div><span>Currency</span><strong>EUR</strong></div><div><span>Contract Ref</span><strong>PPA-${p.code}</strong></div></div></div><div class="panel-lite"><h3>Payment Destination</h3><div class="info-grid"><div><span>Receiver</span><strong>${p.owner}</strong></div><div><span>Bank</span><strong>ACBA Bank</strong></div><div><span>Account</span><strong>AM110001234567890</strong></div><div><span>Revenue Split</span><strong>Owner 92% · O&M 8%</strong></div></div></div><div class="panel-lite full"><h3>Energy Sale Chain</h3><div class="plant-flow-chain-v91"><span>Plant</span><b>→</b><span>Metered Export</span><b>→</b><span>Energy Buyer</span><b>→</b><span>Settlement</span><b>→</b><span>Payment</span></div></div></div>`;
  if (tab === 'documents') return `<div class="split-grid"><div class="panel-lite full"><h3>Plant Documents</h3><div class="data-table compact-table plant-documents-v91"><div class="data-head"><span>Document</span><span>Type</span><span>Status</span><span>Updated</span></div><div class="data-row"><div><strong>Power Purchase Agreement</strong><small>PPA-${p.code}.pdf</small></div><div><strong>Commercial</strong><small>Energy sale contract</small></div><div><span class="badge ok">Signed</span></div><div><strong>12 Jun 2026</strong><small>Global Admin</small></div></div><div class="data-row"><div><strong>Grid Connection Agreement</strong><small>GRID-${p.code}.pdf</small></div><div><strong>Grid</strong><small>Connection and export permission</small></div><div><span class="badge ok">Verified</span></div><div><strong>08 Jun 2026</strong><small>Tenant Admin</small></div></div><div class="data-row"><div><strong>Technical Passport</strong><small>TECH-${p.code}.pdf</small></div><div><strong>Technical</strong><small>Capacity, inverter and meter passport</small></div><div><span class="badge warn">Review</span></div><div><strong>04 Jun 2026</strong><small>O&M Provider</small></div></div></div></div></div>`;
  if (tab === 'parties') return `<div class="split-grid"><div class="panel-lite"><h3>Related Parties</h3><div class="info-grid"><div><span>Client / Owner</span><strong>${p.owner}</strong></div><div><span>Tenant</span><strong>${p.tenant}</strong></div><div><span>Operator</span><strong>${p.operator || p.tenant}</strong></div><div><span>O&M Provider</span><strong>${p.om}</strong></div><div><span>Energy Trader</span><strong>Green Market Trader LLC</strong></div><div><span>Grid Operator</span><strong>ENA Grid</strong></div></div></div><div class="panel-lite"><h3>Assigned Users</h3><div class="timeline-mini plant-users-v91"><p><b>Client Admin</b><span>Can view plant, reports, invoices and documents</span></p><p><b>Finance Contact</b><span>Can view commercial, payment and settlement records</span></p><p><b>Technical Viewer</b><span>Can view devices, alerts and telemetry snapshots</span></p><p><b>Tenant Admin</b><span>Can manage plant data, users and assignments</span></p></div></div></div>`;
  if (tab === 'audit') return `<div class="split-grid"><div class="panel-lite full"><h3>Plant Timeline</h3><div class="timeline-mini plant-audit-v91"><p><b>Created</b><span>${p.name} registered under ${p.tenant}</span></p><p><b>Client linked</b><span>${p.owner} assigned as commercial owner / beneficiary</span></p><p><b>Integration mapped</b><span>${p.vendor} · ${p.externalId} linked to Zentrid canonical plant</span></p><p><b>Commercial activated</b><span>Energy sale and payment destination configured</span></p><p><b>Last updated</b><span>${p.lastData} · Data freshness: ${p.freshness}</span></p></div></div></div>`;
  if (tab === 'source') return `<div class="split-grid"><div class="panel-lite"><h3>Integration Source</h3><div class="info-grid"><div><span>Vendor</span><strong>${p.vendor}</strong></div><div><span>Integration</span><strong>${p.integration}</strong></div><div><span>External Plant ID</span><strong>${p.externalId}</strong></div><div><span>Last Sync</span><strong>${p.lastData}</strong></div><div><span>Data Freshness</span><strong>${p.freshness}</strong></div><div><span>Status</span><strong>${p.status}</strong></div></div></div><div class="panel-lite"><h3>Mapping Logic</h3><div class="timeline-mini"><p><strong>Discovery</strong> · Vendor plant found</p><p><strong>Mapping</strong> · Create New / Link Existing plant</p><p><strong>Core Write</strong> · Plant master data normalized</p><p><strong>Sync</strong> · Operational data updated by source integration</p></div></div></div>`;
  return `<div class="split-grid"><div class="panel-lite"><h3>Plant Summary</h3><div class="info-grid"><div><span>Status</span><strong>${p.status}</strong></div><div><span>Tenant</span><strong>${p.tenant}</strong></div><div><span>Client / Owner</span><strong>${p.owner}</strong></div><div><span>Operator</span><strong>${p.operator || p.tenant}</strong></div><div><span>Location</span><strong>${p.country} · ${p.city}</strong></div><div><span>Capacity</span><strong>${p.capacityDc} MWp</strong></div><div><span>Devices</span><strong>${p.devices}</strong></div><div><span>Last Data</span><strong>${p.lastData}</strong></div></div></div><div class="panel-lite"><h3>Location / Map View</h3><div class="map-world plant-map"><div class="map-grid"></div><button class="map-dot good" style="left:50%;top:42%">${p.city}</button></div></div><div class="panel-lite full"><h3>Operational Chain</h3><div class="plant-flow-chain-v91"><span>Tenant</span><b>→</b><span>Client</span><b>→</b><span>Plant</span><b>→</b><span>Devices</span><b>→</b><span>Telemetry</span><b>→</b><span>Alerts / Reports</span></div></div><div class="panel-lite full"><h3>Devices Preview</h3>${devicePreview(p)}</div></div>`;
}
function renderPlantDetail(){
  const p = selectedPlant();
  if (!p.id) return window.ZentridApiOnly?.emptyState('Plant Detail', 'The plant endpoint has not returned a selected record.', '/api/plants') || '';
  return `<section class="page-hero"><div><p class="eyebrow">Plant Detail Workspace ${ZentridDataSource.badge(p, 'plant', true)}</p><h1>${p.name}</h1><p class="muted">${p.tenant} · ${p.country}, ${p.city} · ${p.vendor} source · ${p.id}</p></div><div class="hero-actions"><button class="freshness-card" id="plantSync"><span class="pulse"></span><div><strong>Run Plant Sync</strong><small>${p.lastData}</small></div></button><button class="freshness-card" onclick="location.href='plants.html'"><span class="pulse"></span><div><strong>Back to Registry</strong><small>All plants</small></div></button></div></section>
  <section class="kpi-grid detail-kpis"><article class="kpi-card"><span>Plant Status</span><strong>${p.status}</strong><small>${p.alerts} active alerts</small></article><article class="kpi-card"><span>Live Power</span><strong>${p.livePower}</strong><small>Real-time layer</small></article><article class="kpi-card"><span>Today Energy</span><strong>${p.today}</strong><small>Accounting period</small></article><article class="kpi-card"><span>Installed DC</span><strong>${p.capacityDc} MWp</strong><small>${p.capacityAc} MW AC</small></article><article class="kpi-card"><span>Devices</span><strong>${p.devices}</strong><small>${p.inverters} inverters · ${p.meters} meters</small></article><article class="kpi-card"><span>Data Freshness</span><strong>${p.freshness}</strong><small>${p.lastData}</small></article></section>
  <section class="client-layout-v17 detail-layout-standard">
    <aside class="glass-card plant-side-card-v17">
      <h3>Plant Navigation</h3>
      <button class="active" data-plant-tab="overview">Overview</button>
      <button data-plant-tab="master">Master Data</button>
      <button data-plant-tab="structure">Structure & Devices</button>
      <button data-plant-tab="energy">Energy & Alerts</button>
      <button data-plant-tab="commercial">Commercial</button>
      <button data-plant-tab="documents">Documents</button>
      <button data-plant-tab="parties">Parties & Users</button>
      <button data-plant-tab="audit">Audit</button>
      <button data-plant-tab="source">Source & Sync</button>
    </aside>
    <section class="glass-card plant-main-card-v17">
      <div class="detail-content-head-v32"><div><h2 id="plantDetailTitle">Overview</h2><p class="muted">Plant detail uses the same left-navigation detail layout as Client Detail.</p></div></div>
      <div id="plantDetailContent">${plantTab(p,'overview')}</div>
    </section>
  </section>`;
}
function plantTabLabel(tab: string): string { return ({overview:'Overview',master:'Master Data',structure:'Structure & Devices',energy:'Energy & Alerts',commercial:'Commercial',documents:'Documents',parties:'Parties & Users',audit:'Audit',source:'Source & Sync'})[tab] || 'Plant Detail'; }
function wirePlantDetail(){
  const p = selectedPlant();
  document.getElementById('plantSync')?.addEventListener('click', () => ZentridLayout.toast(`Plant sync requested for ${p.name}`));
  document.querySelectorAll('[data-plant-tab]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-plant-tab]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const tab = b.dataset.plantTab;
    const title = document.getElementById('plantDetailTitle');
    if (title) title.textContent = plantTabLabel(tab);
    const detailContent = document.getElementById('plantDetailContent');
    if (detailContent) detailContent.innerHTML = plantTab(p, tab);
  });
}
