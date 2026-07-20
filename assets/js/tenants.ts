interface ZentridTenantContact {
  [key: string]: unknown;
  first?: string;
  last?: string;
  full?: string;
  position?: string;
  department?: string;
  role?: string;
  email?: string;
  mobile?: string;
  office?: string;
  phone?: string;
  language?: string;
  method?: string;
  active?: string;
}

interface ZentridTenantDocument {
  [key: string]: unknown;
  name?: string;
  type?: string;
  expiry?: string;
  file?: string;
}

interface ZentridTenantRecord {
  [key: string]: unknown;
  id: string;
  code?: string;
  name: string;
  legal?: string;
  country?: string;
  region?: string;
  city?: string;
  status?: string;
  health?: string;
  setup?: number;
  contacts?: ZentridTenantContact[];
  documents?: ZentridTenantDocument[];
  notes?: Record<string, string>;
}


interface ZentridTenantClientRecordV42 {
  [key: string]: unknown;
  id: string;
  name: string;
  code?: string;
  country?: string;
  city?: string;
}

interface ZentridTenantPlantRecordV42 {
  [key: string]: unknown;
  id: string;
  clientId: string;
  tenantId?: string;
  name: string;
  code?: string;
  externalId?: string;
  portfolio?: string;
  health?: string;
  capacityDc?: string | FormDataEntryValue;
  powerNow?: string;
  energyToday?: string;
  alerts?: number | string;
  inverters?: number;
  strings?: number;
  transformers?: number;
  meters?: number;
  battery?: string;
  country?: string | FormDataEntryValue;
  region?: string | FormDataEntryValue;
  city?: string | FormDataEntryValue;
  devices?: string[];
}

interface ZentridTenantDeviceRecordV42 {
  [key: string]: unknown;
  id: string;
  plantId: string;
  type: string;
  name: string;
  vendor: string;
  model: string;
}

interface ZentridTenantCountryRule {
  registrationPlaceholder: string;
  registrationHelp: string;
  taxPlaceholder: string;
  taxHelp: string;
  postalPlaceholder: string;
  regionPlaceholder: string;
  phonePlaceholder: string;
  timezone: string;
}

interface TenantPlantBuilderDeviceV28 {
  [key: string]: unknown;
  kind: string;
  vendor: string;
  model: string;
  rating?: string;
  protocol?: string;
  serial?: string;
  firmware?: string;
  location?: string;
  role?: string;
  individual?: string;
}

type ZentridTenantInfoItem = [string, unknown] | [string, unknown, string];
type ZentridTenantWizardStepElement = Element & { classList: DOMTokenList };
type ZentridTenantTabKey = 'general' | 'address' | 'contacts' | 'classification' | 'communication' | 'legal' | 'plants' | string;

function tenantElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function requireTenantElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = tenantElement<T>(id);
  if (!element) throw new Error(`Required tenant element not found: ${id}`);
  return element;
}

function tenantFormText(formData: FormData, key: string, fallback = ''): string {
  const value = formData.get(key);
  return typeof value === 'string' && value ? value : fallback;
}

const tenantSeed: ZentridTenantRecord[] = [
  { id:'TNT-000125', entityType:'Legal Entity', code:'TN-000125', name:'Tenant Alpha Energy', legal:'Tenant Alpha Energy CJSC', trade:'Tenant Alpha', registration:'286.110.123456', tax:'01234567', status:'Active', types:['Owner','Operator'], country:'Armenia', region:'Yerevan', city:'Yerevan', address:'24 Energy Avenue', building:'12', postal:'0010', businessSame:true, plants:318, devices:4820, users:42, revenue:'€248k', health:'Attention Required', integrations:4, alerts:18, industry:'Solar Energy', businessCategory:'Enterprise', parentCompany:'None', employees:'101–500', annualRevenue:'$10M–$50M', webplant:'https://alpha-energy.example', category:'Strategic', tier:'Platinum', priority:'High', risk:'Medium', source:'Partner', account:'Mariam Sargsyan', language:'English', timezone:'Asia/Yerevan', channel:'Email', businessHours:'09:00–18:00', platformNotifications:'Yes', serviceNotifications:'Yes', invoiceNotifications:'Yes', securityNotifications:'Yes', notificationRecipients:'Primary, Billing, Technical', dpa:'Signed', nda:'Signed', compliance:'Pending', confidentiality:'Restricted', controllerType:'Controller', consent:'Active', consentExpiry:'2027-06-30', setup:92, contacts:[{first:'Aram', last:'Hakobyan', full:'Aram Hakobyan', position:'Operations Lead', department:'Operations', role:'Primary', email:'aram@example.am', mobile:'+374 55 100 200', office:'+374 10 200 300', phone:'+374 55 100 200', language:'English', method:'Email', active:'Yes'}], documents:(window.tenantWizardDocuments&&window.tenantWizardDocuments.length?window.tenantWizardDocuments:[{name:'Registration Certificate', type:'Corporate', expiry:'2028-12-31', file:'Registration Certificate.pdf'}]), notes:{general:'', address:'', contacts:'', classification:'', communication:'', legal:''}, created:'2026-05-14', updated:'2026-06-03' },
  { id:'TNT-000126', entityType:'Legal Entity', code:'TN-000126', name:'Tenant North Operations', legal:'North Region Operations Inc.', trade:'North Ops', registration:'2024-000123456', tax:'12-3456789', status:'Active', types:['Operator'], country:'United States', region:'California', city:'San Diego', address:'510 Grid Street', building:'Suite 420', postal:'92101', businessSame:true, plants:274, devices:3910, users:38, revenue:'$211k', health:'Healthy', integrations:3, alerts:4, industry:'Solar Energy', businessCategory:'Enterprise', parentCompany:'None', employees:'51–100', annualRevenue:'$5M–$10M', webplant:'https://north-ops.example', category:'Standard', tier:'Gold', priority:'Medium', risk:'Low', source:'Direct', account:'Daniel Weber', language:'English', timezone:'America/Los_Angeles', channel:'Portal', businessHours:'08:00–17:00', platformNotifications:'Yes', serviceNotifications:'Yes', invoiceNotifications:'Yes', securityNotifications:'Yes', notificationRecipients:'Primary, Legal', dpa:'Signed', nda:'Signed', compliance:'Approved', confidentiality:'Standard', controllerType:'Processor', consent:'Active', consentExpiry:'2027-04-15', setup:96, contacts:[{first:'Laura', last:'Schmidt', full:'Laura Schmidt', position:'Program Manager', department:'Executive', role:'Primary', email:'laura@example.com', mobile:'+1 (619) 555-0180', office:'+1 (619) 555-0199', phone:'+1 (619) 555-0180', language:'English', method:'Portal', active:'Yes'}], documents:[{name:'NDA', type:'Legal', expiry:'2027-04-15', file:'NDA.pdf'}], created:'2026-05-18', updated:'2026-06-02' },
  { id:'TNT-000127', entityType:'Legal Entity', code:'TN-000127', name:'Tenant Gamma Grid', legal:'Tenant Gamma Grid LLC', trade:'Tenant Gamma Grid', registration:'2025-000987654', tax:'98-7654321', status:'Suspended', types:['Owner','Investor'], country:'United States', region:'Texas', city:'Austin', address:'88 Storage Lane', building:'Unit 8', postal:'78701', businessSame:false, businessCountry:'United States', businessRegion:'Texas', businessCity:'Houston', businessAddress:'210 Battery Road', businessPostal:'77002', plants:195, devices:2508, users:29, revenue:'$174k', health:'At Risk', integrations:2, alerts:41, industry:'Solar Energy', businessCategory:'SME', parentCompany:'Energy Holdings Group', employees:'11–50', annualRevenue:'$1M–$5M', webplant:'https://gamma-grid.example', category:'Partner', tier:'Silver', priority:'High', risk:'High', source:'Referral', account:'Laura Garcia', language:'English', timezone:'America/Chicago', channel:'Email', businessHours:'08:30–17:30', platformNotifications:'Yes', serviceNotifications:'Yes', invoiceNotifications:'No', securityNotifications:'Yes', notificationRecipients:'Primary, Technical', dpa:'Not Signed', nda:'Signed', compliance:'Pending', confidentiality:'Critical', controllerType:'Controller', consent:'Expired', consentExpiry:'2026-08-01', setup:67, contacts:[{first:'Miguel', last:'Torres', full:'Miguel Torres', position:'Owner Representative', department:'Finance', role:'Billing', email:'miguel@example.com', mobile:'+1 (512) 555-0142', office:'+1 (512) 555-0149', phone:'+1 (512) 555-0142', language:'English', method:'Email', active:'Yes'}], documents:[{name:'Data Processing Agreement', type:'Compliance', expiry:'2026-08-01', file:'Data Processing Agreement.pdf'}], created:'2026-04-27', updated:'2026-06-01' }
];

const tenantCountryRules: Record<string, ZentridTenantCountryRule> = {
  Armenia: {
    registrationPlaceholder: 'Example: 286.110.123456',
    registrationHelp: 'State registration number issued in Armenia.',
    taxPlaceholder: 'Example: 01234567',
    taxHelp: 'Armenian Taxpayer Identification Number (TIN).',
    postalPlaceholder: 'Example: 0010',
    regionPlaceholder: 'Example: Yerevan, Kotayk, Shirak',
    phonePlaceholder: '+374 XX XXX XXX',
    timezone: 'Asia/Yerevan'
  },
  'United States': {
    registrationPlaceholder: 'Example: 2024-000123456',
    registrationHelp: 'State business registration number.',
    taxPlaceholder: 'Example: 12-3456789',
    taxHelp: 'Employer Identification Number (EIN).',
    postalPlaceholder: 'Example: 10001 or 10001-1234',
    regionPlaceholder: 'Example: California, Texas, New York',
    phonePlaceholder: '+1 (XXX) XXX-XXXX',
    timezone: 'America/New_York'
  }
};

function defaultTenantCountryRule(): ZentridTenantCountryRule {
  const rule = tenantCountryRules.Armenia;
  if (!rule) throw new Error('Default tenant country rule is missing.');
  return rule;
}
function cls(v: unknown): string { const text=String(v).toLowerCase(); if(text.includes('risk')||text.includes('critical')||text.includes('suspend')||text.includes('non')||text.includes('expired')) return 'danger'; if(text.includes('attention')||text.includes('review')||text.includes('medium')||text.includes('inactive')||text.includes('pending')) return 'warning'; return 'success'; }
function getTenants(): ZentridTenantRecord[] { const liveRows = window.ZentridLiveTenants as ZentridTenantRecord[] | undefined; if (Array.isArray(liveRows) && liveRows.length) return liveRows; const rows = window.ZentridLocalStore ? ZentridLocalStore.read(ZentridLocalStore.KEYS.tenants, []) : JSON.parse(localStorage.getItem('zentrid_demo_tenants') || '[]'); if (rows && rows.length) return rows; if (window.ZentridLocalStore) ZentridLocalStore.write(ZentridLocalStore.KEYS.tenants, tenantSeed); else localStorage.setItem('zentrid_demo_tenants', JSON.stringify(tenantSeed)); return tenantSeed; }
function saveTenants(rows: ZentridTenantRecord[]): void { if (window.ZentridLocalStore) ZentridLocalStore.write(ZentridLocalStore.KEYS.tenants, rows); else localStorage.setItem('zentrid_demo_tenants', JSON.stringify(rows)); }
function genId(){ return 'TNT-' + String(Math.floor(100000 + Math.random()*899999)); }
function genCode(){ return 'TN-' + String(Math.floor(100000 + Math.random()*899999)); }
function selectedTenant(): ZentridTenantRecord {
  const rows = getTenants();
  const id = localStorage.getItem('zentrid_selected_tenant');
  const tenant = rows.find(x => x.id === id) || rows[0] || tenantSeed[0];
  if (!tenant) throw new Error('Tenant registry is empty.');
  return tenant;
}
function tenantClientRecord(tenant: ZentridTenantRecord): ZentridTenantClientRecordV42 | null {
  if (typeof ZentridClientModel === 'undefined') return null;
  return (ZentridClientModel.clients as ZentridTenantClientRecordV42[]).find(c => c.name === tenant.name || c.code === tenant.code || c.id === tenant.id) || (ZentridClientModel.clients as ZentridTenantClientRecordV42[])[0] || null;
}
function tenantAssignedPlants(tenant: ZentridTenantRecord): ZentridTenantPlantRecordV42[] {
  const client = tenantClientRecord(tenant);
  if (typeof ZentridClientModel === 'undefined') return [];
  const base = client ? (ZentridClientModel.plantsForClient(client.id) as ZentridTenantPlantRecordV42[]) : [];
  const custom = (ZentridClientModel.plants as ZentridTenantPlantRecordV42[]).filter((p: ZentridTenantPlantRecordV42) => p.tenantId === tenant.id && (!client || p.clientId !== client.id));
  return [...base, ...custom];
}
function tenantPlantSummaryCards(tenant: ZentridTenantRecord): string {
  if (typeof ZentridClientModel === 'undefined') return '<p class="muted">Plant hierarchy model is not loaded.</p>';
  const client = tenantClientRecord(tenant);
  const plants = tenantAssignedPlants(tenant);
  if (!plants.length) return '<div class="empty-state"><strong>No assigned plants yet</strong><small>Create a plant and attach it to an owning client. This tenant will manage the plant workspace.</small></div>';
  return `<div class="client-flow-v17 tenant-plant-flow-v18"><div><b>Managing Tenant</b><span>${tenant.name}</span></div><em>→</em><div><b>Managed Plants</b><span>${plants.length} plant workspaces</span></div><em>→</em><div><b>Owning Clients & Device</b><span>Client-owned plants · inverters, strings, meters, BESS</span></div></div><div class="plant-card-grid-v17 tenant-assigned-plants-v18">${plants.map(p => {
    const ds = ZentridClientModel.devicesForPlant(p.id);
    return `<article class="plant-card-v17 clickable-row" data-plant="${p.id}" data-client="${p.clientId || client?.id || ''}">
      <div class="plant-card-top-v17"><div><strong>${p.name}</strong><small>${p.code} · ${p.portfolio}</small></div><span class="badge ${ZentridClientModel.badge(p.health)}">${p.health}</span></div>
      <div class="plant-card-metrics-v17"><div><span>Capacity</span><b>${p.capacityDc}</b></div><div><span>Now</span><b>${p.powerNow}</b></div><div><span>Today</span><b>${p.energyToday}</b></div><div><span>Alerts</span><b>${p.alerts}</b></div></div>
      <div class="device-strip-v17"><span>Inverters ${p.inverters}</span><span>Meters ${p.meters}</span><span>BESS ${p.battery}</span><span>${ds.length} device records</span></div>
      <div class="plant-card-footer-v18"><button class="small-btn" type="button" data-open-plant="${p.id}">Open Plant Detail</button><small>${p.country}, ${p.region}, ${p.city}</small></div>
    </article>`;
  }).join('')}</div>`;
}


function tenantPlantBuilderCatalogByKind(kind: string): ZentridDeviceCatalogLegacyApi['catalog'] {
  if (typeof ZentridDeviceCatalog === 'undefined') return [];
  return ZentridDeviceCatalog.catalog.filter(x => x.kind === kind);
}
function tenantPlantBuilderClientOptions(tenant: ZentridTenantRecord): string {
  if (typeof ZentridClientModel === 'undefined') return '';
  const preferred = tenantClientRecord(tenant);
  return ZentridClientModel.clients.map(c => `<option value="${c.id}" ${preferred && c.id === preferred.id ? 'selected' : ''}>${c.name} · ${c.code}</option>`).join('');
}
function tenantBuilderOptions(list: string[], selected: unknown): string {
  return list.map(v => `<option value="${v}" ${String(selected || '').toLowerCase() === String(v).toLowerCase() ? 'selected' : ''}>${v}</option>`).join('');
}
function tenantBuilderCapacityOptions(values: string[], selected: unknown): string {
  return values.map(v => `<option value="${v}" ${String(selected || '').toLowerCase() === String(v).toLowerCase() ? 'selected' : ''}>${v}</option>`).join('');
}
function tenantBuilderCompatibleCatalog(kind: string): ZentridDeviceCatalogLegacyApi['catalog'] {
  const catalog = tenantPlantBuilderCatalogByKind(kind);
  if (!tenantPlantBuilderDevicesV28.length) return catalog;
  const hasInverter = tenantPlantBuilderDevicesV28.some(d => d.kind === 'Inverter');
  const hasBess = tenantPlantBuilderDevicesV28.some(d => d.kind === 'BESS');
  const hasSolis = tenantPlantBuilderDevicesV28.some(d => d.vendor === 'Solis');
  if (kind === 'Inverter') return catalog;
  if (kind === 'PCS') return hasBess ? catalog : [];
  if (kind === 'Meter') return hasInverter ? catalog.filter(x => /modbus|rs485/i.test(x.protocol)) : catalog;
  if (kind === 'Logger') return hasInverter ? catalog.filter(x => x.vendor === 'Meteocontrol' || (hasSolis && x.vendor === 'Solis') || /modbus|sunspec/i.test(x.protocol)) : catalog;
  if (kind === 'BESS') return hasInverter ? catalog.filter(x => /can|rs485|bms|modbus/i.test(x.protocol)) : catalog;
  if (['Weather Station','Transformer','Switchgear'].includes(kind)) return catalog;
  return catalog;
}
function tenantPlantBuilderModelOptions(kind: string): string {
  const rows = tenantBuilderCompatibleCatalog(kind);
  if (!rows.length) return `<option value="">Add the required related device first</option>`;
  return rows.map(x=>`<option value="${x.kind}|${x.vendor}|${x.model}">${x.vendor} · ${x.model} · ${x.rating}</option>`).join('');
}
function tenantPlantBuilderModal(tenant: ZentridTenantRecord): string {
  const kindOptions = ['Inverter','Meter','Logger','BESS','PCS','Weather Station','Transformer','Switchgear'].map(x=>`<option value="${x}">${x}</option>`).join('');
  const initialModels = tenantPlantBuilderModelOptions('Inverter');
  return `<div class="tenant-plant-builder-modal-v28" id="tenantPlantBuilderModalV28" aria-hidden="true">
    <div class="tenant-plant-builder-shell-v28" role="dialog" aria-modal="true" aria-labelledby="tenantPlantBuilderTitleV28">
      <div class="tenant-builder-head-v28">
        <div>
          <p class="eyebrow">Tenant Detail · Managed Plants</p>
          <h2 id="tenantPlantBuilderTitleV28">Create Plant</h2>
          <p class="muted">Create a plant under this tenant, attach it to a client, then assemble device from the catalog using dropdowns.</p>
        </div>
        <button class="drawer-close" type="button" data-close-tenant-plant-builder>x</button>
      </div>
      <div class="tenant-builder-steps-v28">
        <button class="active" type="button" data-builder-step="1"><b>1</b><span>Plant</span></button>
        <button type="button" data-builder-step="2"><b>2</b><span>Device</span></button>
        <button type="button" data-builder-step="3"><b>3</b><span>Review</span></button>
      </div>
      <form id="tenantPlantBuilderFormV28" class="tenant-builder-body-v28" data-zentrid-form-readiness="local" data-zentrid-form-contract="TenantPlantDraft" data-zentrid-form-endpoint="/api/admin/plants" data-zentrid-form-method="POST" data-zentrid-form-api-note="Plant builder output remains local until the final backend payload is approved.">
        <section class="builder-step-panel-v28 active" data-step-panel="1">
          <div class="section-title-v17 mini"><div><h3>Plant Information</h3><p class="muted">Only plant-level fields are entered here. Device model data comes from the catalog.</p></div></div>
          <div class="builder-form-grid-v28">
            <label>Owning Client<select name="clientId">${tenantPlantBuilderClientOptions(tenant)}</select></label>
            <label>Plant Name<input name="plantName" value="New Plant" required></label>
            <label>Plant Code<input name="plantCode" value="AUTO-PL-${Math.floor(100+Math.random()*899)}" required></label>
            <label>Portfolio<input name="portfolio" value="${tenant.name} Portfolio"></label>
            <label>Plant Type<select name="plantType"><option>Commercial</option><option>Utility Scale</option><option>Industrial</option><option>Hybrid Storage</option></select></label>
            <label>Country<select name="country">${tenantBuilderOptions(['Armenia','Germany','Spain','Italy','France','United States'], tenant.country || 'Armenia')}</select></label>
            <label>Region<select name="region">${tenantBuilderOptions(['Yerevan','Kotayk','Armavir','Syunik','Bavaria','Madrid','Catalonia','Lombardy','California'], tenant.region || 'Yerevan')}</select></label>
            <label>City<select name="city">${tenantBuilderOptions(['Yerevan','Abovyan','Armavir','Kapan','Munich','Madrid','Barcelona','Milan','Los Angeles'], tenant.city || 'Yerevan')}</select></label>
            <label>Address<input name="address" value="${tenant.address || ''}"></label>
            <label>Timezone<select name="timezone">${tenantBuilderOptions(['Asia/Yerevan','Europe/Berlin','Europe/Madrid','Europe/Rome','Europe/Paris','America/Los_Angeles'], tenant.timezone || 'Asia/Yerevan')}</select></label>
            <label>DC Capacity<select name="capacityDc">${tenantBuilderCapacityOptions(['50 kWp','100 kWp','250 kWp','500 kWp','1.00 MWp','2.50 MWp','5.00 MWp','10.00 MWp'], '1.00 MWp')}</select></label>
            <label>AC Capacity<select name="capacityAc">${tenantBuilderCapacityOptions(['40 kW','90 kW','200 kW','450 kW','0.90 MW','2.00 MW','4.50 MW','9.00 MW'], '0.90 MW')}</select></label>
          </div>
        </section>
        <section class="builder-step-panel-v28" data-step-panel="2">
          <div class="builder-device-bar-v28">
            <div>
              <h3>Device Builder</h3>
              <p class="muted">Choose a device type and model from the catalog. Zentrid filters the next models by hidden compatibility rules, then you enter only individual instance data.</p>
            </div>
            <div class="builder-add-line-v28">
              <select id="builderDeviceKindV28">${kindOptions}</select>
              <select id="builderDeviceModelV28">${initialModels}</select>
              <button class="small-btn primary" type="button" data-add-builder-device>Add Device</button>
            </div>
          </div>
          <div class="builder-compat-hint-v28"><span class="pulse"></span><strong>Compatibility is applied automatically.</strong><small id="builderCompatibilityHintV28">Select an inverter first to filter meters, loggers and BESS models by protocol.</small></div>
          <div class="builder-device-table-wrap-v28">
            <div class="data-table compact-table tenant-builder-device-table-v28">
              <div class="data-head"><span>Device</span><span>Catalog Model</span><span>Individual Data</span><span>Link / Role</span><span>Action</span></div>
              <div id="builderDeviceRowsV28"></div>
            </div>
          </div>
        </section>
        <section class="builder-step-panel-v28" data-step-panel="3">
          <div class="section-title-v17 mini"><div><h3>Review & Create</h3><p class="muted">Review plant, client assignment, device count and topology before creating the plant.</p></div></div>
          <div id="builderReviewV28" class="builder-review-v28"></div>
        </section>
      </form>
      <div class="tenant-builder-footer-v28">
        <button class="secondary-btn" type="button" data-close-tenant-plant-builder>Cancel</button>
        <div>
          <button class="small-btn ghost" type="button" data-builder-prev>Previous</button>
          <button class="small-btn primary" type="button" data-builder-next>Next</button>
          <button class="primary-btn hidden" type="button" data-create-tenant-plant>Create Plant</button>
        </div>
      </div>
    </div>
  </div>`;
}
let tenantPlantBuilderDevicesV28: TenantPlantBuilderDeviceV28[] = [];
let tenantPlantBuilderStepV28 = 1;
function builderSelectedCatalogItem(){
  const value = document.getElementById('builderDeviceModelV28')?.value || '';
  const [kind,vendor,model] = value.split('|');
  return (ZentridDeviceCatalog?.catalog || []).find(x => x.kind === kind && x.vendor === vendor && x.model === model) || null;
}

function refreshTenantBuilderModelOptions(){
  const kind = document.getElementById('builderDeviceKindV28')?.value;
  const model = document.getElementById('builderDeviceModelV28');
  if (kind && model) model.innerHTML = tenantPlantBuilderModelOptions(kind);
  renderTenantBuilderCompatibilityHint();
}

function renderTenantBuilderDeviceRows(){
  const host = document.getElementById('builderDeviceRowsV28');
  if (!host) return;
  if (!tenantPlantBuilderDevicesV28.length) {
    host.innerHTML = `<div class="data-row empty-builder-row-v28"><div><strong>No device selected</strong><small>Add devices using the dropdowns above.</small></div><div></div><div></div><div></div><div></div></div>`;
  } else {
    host.innerHTML = tenantPlantBuilderDevicesV28.map((d,i)=>`<div class="data-row" data-builder-device-row="${i}">
      <div><strong>${d.kind}</strong><small>${d.vendor} · ${d.model}</small></div>
      <div><strong>${d.rating}</strong><small>${d.protocol}</small></div>
      <div class="instance-fields-v28"><input placeholder="Serial number" value="${d.serial || ''}" data-builder-field="serial"><input placeholder="Firmware / address" value="${d.firmware || ''}" data-builder-field="firmware"><input placeholder="Location" value="${d.location || ''}" data-builder-field="location"></div>
      <div><select data-builder-field="role"><option ${d.role==='Plant-level device'?'selected':''}>Plant-level device</option><option ${d.role==='Linked to inverter'?'selected':''}>Linked to inverter</option><option ${d.role==='Linked to BESS'?'selected':''}>Linked to BESS</option><option ${d.role==='Grid / POI'?'selected':''}>Grid / POI</option><option ${d.role==='Weather context'?'selected':''}>Weather context</option></select></div>
      <div><button class="small-btn ghost" type="button" data-remove-builder-device="${i}">Remove</button></div>
    </div>`).join('');
  }
  refreshTenantBuilderModelOptions();
  renderTenantBuilderReview();
}
function renderTenantBuilderCompatibilityHint(){
  const hint = document.getElementById('builderCompatibilityHintV28');
  const kind = document.getElementById('builderDeviceKindV28')?.value || 'Inverter';
  const model = document.getElementById('builderDeviceModelV28');
  if (!hint) return;
  const counts = tenantPlantBuilderDevicesV28.reduce<Record<string, number>>((acc,d)=>{ acc[d.kind]=(acc[d.kind]||0)+1; return acc; },{});
  const total = tenantBuilderCompatibleCatalog(kind).length;
  if (!tenantPlantBuilderDevicesV28.length) {
    hint.textContent = 'Select an inverter first to filter meters, loggers and BESS models by protocol.';
  } else if (kind === 'PCS' && !counts.BESS) {
    hint.textContent = 'PCS models are hidden until a BESS is selected, because PCS must match the storage system.';
  } else {
    hint.textContent = `${total} compatible ${kind} model${total === 1 ? '' : 's'} available based on selected device.`;
  }
  if (model && !model.value && total) model.innerHTML = tenantPlantBuilderModelOptions(kind);
}
function renderTenantBuilderReview(){
  const host = document.getElementById('builderReviewV28');
  const form = document.getElementById('tenantPlantBuilderFormV28');
  if (!host || !form) return;
  const fd = new FormData(form as HTMLFormElement);
  const client = ZentridClientModel?.getClient(String(fd.get('clientId') || ''));
  const counts = tenantPlantBuilderDevicesV28.reduce<Record<string, number>>((acc,d)=>{ acc[d.kind]=(acc[d.kind]||0)+1; return acc; },{});
  host.innerHTML = `<div class="builder-review-grid-v28">
    <article><span>Plant</span><strong>${fd.get('plantName') || 'New Plant'}</strong><small>${fd.get('plantCode') || 'AUTO'} · ${fd.get('country') || '—'}, ${fd.get('city') || '—'}</small></article>
    <article><span>Owning Client</span><strong>${client?.name || '—'}</strong><small>Plant will appear here as a managed plant and under the selected client as an owned plant</small></article>
    <article><span>Device</span><strong>${tenantPlantBuilderDevicesV28.length} devices</strong><small>${Object.entries(counts).map(([k,v])=>`${k}: ${v}`).join(' · ') || 'No device yet'}</small></article>
    <article><span>Topology</span><strong>Plant-level structure</strong><small>Inverters / meters / loggers / BESS / grid infrastructure</small></article>
  </div>`;
}
function setTenantBuilderStep(step: number): void {
  tenantPlantBuilderStepV28 = Math.max(1, Math.min(3, step));
  document.querySelectorAll('[data-builder-step]').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.builderStep) === tenantPlantBuilderStepV28));
  document.querySelectorAll('[data-step-panel]').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.stepPanel) === tenantPlantBuilderStepV28));
  document.querySelector('[data-builder-prev]')?.classList.toggle('hidden', tenantPlantBuilderStepV28 === 1);
  document.querySelector('[data-builder-next]')?.classList.toggle('hidden', tenantPlantBuilderStepV28 === 3);
  document.querySelector('[data-create-tenant-plant]')?.classList.toggle('hidden', tenantPlantBuilderStepV28 !== 3);
  renderTenantBuilderReview();
}
function openTenantPlantBuilder(){
  tenantPlantBuilderDevicesV28 = [];
  tenantPlantBuilderStepV28 = 1;
  const modal = document.getElementById('tenantPlantBuilderModalV28');
  modal?.classList.add('open');
  setTenantBuilderStep(1);
  renderTenantBuilderDeviceRows();
  renderTenantBuilderCompatibilityHint();
}
function closeTenantPlantBuilder(){ document.getElementById('tenantPlantBuilderModalV28')?.classList.remove('open'); }
function createTenantPlantFromBuilder(){
  if (typeof ZentridClientModel === 'undefined') return;
  const form = document.getElementById('tenantPlantBuilderFormV28') as HTMLFormElement | null;
  if (!form) return;
  const fd = new FormData(form);
  const client = ZentridClientModel.getClient(String(fd.get('clientId') || ''));
  if (!client) { ZentridLayout.toast('Select a valid client before creating a plant'); return; }
  const plantId = 'PL-CUSTOM-' + Date.now().toString().slice(-6);
  const plant = {
    id: plantId,
    code: fd.get('plantCode') || plantId,
    externalId: 'MANUAL-' + plantId,
    name: fd.get('plantName') || 'New Plant',
    clientId: client.id,
    portfolio: fd.get('portfolio') || `${client.name} Portfolio`,
    status: 'Draft', type: fd.get('plantType') || 'Commercial', country: fd.get('country') || client.country, region: fd.get('region') || '', city: fd.get('city') || client.city,
    address: fd.get('address') || '', timezone: fd.get('timezone') || 'Asia/Yerevan', capacityDc: fd.get('capacityDc') || '1.00 MWp', capacityAc: fd.get('capacityAc') || '0.90 MW', gridCapacity: fd.get('capacityAc') || '0.90 MW',
    commissioning: 'Not commissioned', tenantId: selectedTenant().id, owner: client.name, operator: 'Tenant workspace', om: 'Not assigned', powerNow: '—', energyToday: '—', alerts: 0, health: 'Draft', panels: 0,
    inverters: tenantPlantBuilderDevicesV28.filter(d=>d.kind==='Inverter').length,
    strings: 0,
    transformers: tenantPlantBuilderDevicesV28.filter(d=>d.kind==='Transformer').length,
    meters: tenantPlantBuilderDevicesV28.filter(d=>d.kind==='Meter').length,
    battery: tenantPlantBuilderDevicesV28.some(d=>d.kind==='BESS') ? 'Yes' : 'No',
    devices: []
  } as ZentridTenantPlantRecordV42;
  const devices = tenantPlantBuilderDevicesV28.map((d,i)=>({
    id: `${(d.kind.split(' ')[0] || d.kind).toUpperCase().slice(0,4)}-${plantId}-${i+1}`,
    plantId,
    type: d.kind === 'Transformer' ? 'Grid Device' : d.kind,
    name: `${d.kind} ${String(i+1).padStart(2,'0')}`,
    vendor: d.vendor,
    model: d.model,
    serial: d.serial || 'Pending serial',
    capacity: d.rating,
    firmware: d.firmware || 'Pending',
    status: 'Draft',
    location: d.location || d.role || 'Plant level',
    lastSeen: 'Not connected',
    children: d.individual || 'Instance data required'
  }));
  plant.devices = devices.map(d=>d.id);
  const customPlants = (JSON.parse(localStorage.getItem('zentrid_custom_plants') || '[]') as ZentridTenantPlantRecordV42[]).filter((x: ZentridTenantPlantRecordV42) => x.id !== plant.id);
  const customDevices = (JSON.parse(localStorage.getItem('zentrid_custom_devices') || '[]') as ZentridTenantDeviceRecordV42[]).filter((x: ZentridTenantDeviceRecordV42) => x.plantId !== plant.id);
  customPlants.push(plant);
  customDevices.push(...devices);
  localStorage.setItem('zentrid_custom_plants', JSON.stringify(customPlants));
  localStorage.setItem('zentrid_custom_devices', JSON.stringify(customDevices));
  if (!(ZentridClientModel.plants as ZentridTenantPlantRecordV42[]).some((x: ZentridTenantPlantRecordV42)=>x.id===plant.id)) ZentridClientModel.plants.push(plant);
  devices.forEach((d: ZentridTenantDeviceRecordV42)=>{ if (!(ZentridClientModel.devices as ZentridTenantDeviceRecordV42[]).some((x: ZentridTenantDeviceRecordV42)=>x.id===d.id)) ZentridClientModel.devices.push(d); });
  closeTenantPlantBuilder();
  ZentridLayout.toast('Plant created and attached to client');
  setTenantDetailEditMode(false);
}


let tenantDetailEditMode = false;
let tenantDetailEditSnapshot = '';
let tenantDetailDraft: ZentridTenantRecord | null = null;
let tenantDetailBusy = false;
type TenantDetailFeedbackTone = 'info' | 'warning' | 'danger' | 'success';

function tenantComplianceValue(c: ZentridTenantRecord): string { return String(c.compliance || c.status || c.health || 'Active'); }
function tenantStatusValue(c: ZentridTenantRecord): string { return String(c.status || 'Active'); }
function tenantDisplayValue(v: unknown): string { return (v === undefined || v === null || v === '') ? '—' : String(v); }
function tenantActiveDetailTab(): string { return document.querySelector<HTMLElement>('[data-tenant-tab].active')?.dataset.tenantTab || 'general'; }
function tenantEscapeHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function tenantEscapeAttr(value: unknown): string { return tenantEscapeHtml(value).replace(/`/g, '&#096;'); }
function tenantCloneRecord(record: ZentridTenantRecord): ZentridTenantRecord { return JSON.parse(JSON.stringify(record)) as ZentridTenantRecord; }
function tenantDetailOrigin(record: ZentridTenantRecord): ZentridDataOrigin { return ZentridEntityDetailUX.origin(record, 'tenant'); }
function tenantDetailBackendManaged(record: ZentridTenantRecord): boolean { return ZentridEntityDetailUX.backendManaged(record, 'tenant'); }
function tenantDetailIsArchived(record: ZentridTenantRecord): boolean { return ZentridEntityDetailUX.archived(tenantStatusValue(record)); }
function tenantDetailTabEditable(tab = tenantActiveDetailTab()): boolean { return tab !== 'plants'; }
function tenantDetailCanEdit(record: ZentridTenantRecord, tab = tenantActiveDetailTab()): boolean {
  return !tenantDetailIsArchived(record) && tenantDetailTabEditable(tab);
}
function tenantDetailRaw(record: ZentridTenantRecord): Record<string, unknown> {
  return record.raw && typeof record.raw === 'object' ? record.raw as Record<string, unknown> : {};
}
function tenantDetailFreshness(record: ZentridTenantRecord): string {
  return ZentridEntityDetailUX.freshness(record, 'tenant', {
    timestampKeys:['lastSyncAt','last_sync_at','raw.lastSyncAt','raw.lastSyncAtUtc','raw.updatedAt','updated']
  });
}
function tenantDetailModeCopy(record: ZentridTenantRecord): { title: string; message: string; tone: TenantDetailFeedbackTone } {
  return ZentridEntityDetailUX.modeCopy(record, 'tenant', {
    status:tenantStatusValue(record),
    backendTitle:'Live tenant · local override available',
    backendMessage:'Edit creates a browser-only override for tenant metadata. Lifecycle commands remain separate and no backend update request is sent.',
    archivedTitle:'Archived tenant is read-only',
    archivedMessage:'Archived tenant identity, contacts and compliance data cannot be edited from this workspace.'
  });
}
function renderTenantDetailControls(record: ZentridTenantRecord): string {
  const copy = tenantDetailModeCopy(record);
  return `<section class="tenant-detail-control-v117 ${copy.tone}" id="tenantDetailControl" data-tenant-detail-origin="${tenantEscapeAttr(tenantDetailOrigin(record))}" role="status" aria-live="polite" aria-busy="false">
    <div class="tenant-detail-control-source-v117"><span>Data source</span>${ZentridDataSource.badge(record, 'tenant', true)}<small>${tenantEscapeHtml(tenantDetailFreshness(record))}</small><span class="permission-profile-v121" data-permission-summary data-permission-resource="tenant"></span></div>
    <div class="tenant-detail-control-copy-v117"><strong>${tenantEscapeHtml(copy.title)}</strong><small>${tenantEscapeHtml(copy.message)}</small></div>
    <div class="tenant-detail-feedback-v117" id="tenantDetailFeedback" hidden></div>
  </section>`;
}
function setTenantDetailFeedback(tone: TenantDetailFeedbackTone, title: string, message: string): void {
  ZentridEntityDetailUX.setFeedback({ id:'tenantDetailFeedback', className:'tenant-detail-feedback-v117', tone, title, message, escape:tenantEscapeHtml });
}
function clearTenantDetailFeedback(): void {
  ZentridEntityDetailUX.clearFeedback('tenantDetailFeedback', 'tenant-detail-feedback-v117');
}
function tenantEditableControl(key: string, value: unknown, label: string): string {
  const safe = tenantEscapeAttr(value ?? '');
  const controlName = `tenant-edit-${key.replace(/[^a-z0-9]+/gi, '-')}`;
  const optionsByLabel: Record<string, string[]> = {
    'Entity Type':['Legal Entity','Individual'],
    'Legal Country':['Armenia','United States','Germany','Spain'],
    'Business Address Country':['Armenia','United States','Germany','Spain'],
    'Contact Role':['Primary','Billing','Technical','Legal','Operations'],
    'Active':['Yes','No'],
    'Preferred Language':['English','Armenian','German','Spanish'],
    'Preferred Contact Method':['Email','Portal','Phone'],
    'Preferred Communication Channel':['Email','Portal','Phone'],
    'Tenant Category':['Standard','Strategic','Partner'],
    'Account Tier':['Bronze','Silver','Gold','Platinum'],
    'Tenant Priority':['Low','Medium','High','Critical'],
    'Risk Category':['Low','Medium','High','Critical'],
    'Data Processing Agreement':['Signed','Not Signed','Pending'],
    'NDA Status':['Signed','Not Signed','Pending'],
    'Compliance Status':['Approved','Pending','Rejected','Review Required'],
    'Consent Status':['Active','Expired','Revoked'],
    'Business Address Same as Legal':['Yes','No'],
    'Receive Platform Notifications':['Yes','No'],
    'Receive Service Notifications':['Yes','No'],
    'Receive Invoice Notifications':['Yes','No'],
    'Receive Security Notifications':['Yes','No']
  };
  const options = optionsByLabel[label];
  if (options) return `<select name="${controlName}" aria-label="${tenantEscapeAttr(label)}" data-tenant-edit-key="${tenantEscapeAttr(key)}">${options.map(option=>`<option ${safe===option?'selected':''}>${tenantEscapeHtml(option)}</option>`).join('')}</select>`;
  const type = label === 'Email' ? 'email' : label === 'Website' ? 'url' : ['Consent Expiry Date','Expiry Date'].includes(label) ? 'date' : 'text';
  const textarea = String(value ?? '').length > 80 || ['Notification Recipients','Legal Street Address','Business Address Street Address','Notes for General Information','Notes for Address Information','Notes for Contact Person','Notes for Tenant Classification','Notes for Communication Preferences','Notes for Legal & Compliance'].includes(label);
  if (textarea) return `<textarea name="${controlName}" aria-label="${tenantEscapeAttr(label)}" data-tenant-edit-key="${tenantEscapeAttr(key)}">${tenantEscapeHtml(value ?? '')}</textarea>`;
  return `<input type="${type}" name="${controlName}" aria-label="${tenantEscapeAttr(label)}" data-tenant-edit-key="${tenantEscapeAttr(key)}" value="${safe}">`;
}
function tenantInfo(items: ZentridTenantInfoItem[], editable = tenantDetailEditMode): string { return `<div class="info-grid ${editable ? 'editing-grid' : ''}">${items.map(([a,b,k]: ZentridTenantInfoItem)=>`<div><span>${tenantEscapeHtml(a)}</span>${editable && k ? tenantEditableControl(k,b,a) : `<strong>${tenantEscapeHtml(tenantDisplayValue(b))}</strong>`}</div>`).join('')}</div>`; }
function tenantNotesValue(c: ZentridTenantRecord, section: string): unknown { return (c.notes && c.notes[section]) || c[section + 'Notes'] || ''; }
function tenantNotesBlock(c: ZentridTenantRecord, section: string, label: string, editable = tenantDetailEditMode): string { const key = `notes::${section}`; const value = tenantNotesValue(c, section); return `<div class="tenant-notes-block"><span>${tenantEscapeHtml(label)}</span>${editable ? `<textarea name="tenant-edit-notes-${tenantEscapeAttr(section)}" aria-label="${tenantEscapeAttr(label)}" data-tenant-edit-key="${tenantEscapeAttr(key)}" placeholder="${tenantEscapeAttr(label)}...">${tenantEscapeHtml(value || '')}</textarea>` : `<strong>${tenantEscapeHtml(tenantDisplayValue(value))}</strong>`}</div>`; }
function updateSelectedTenant(mutator: (tenant: ZentridTenantRecord) => void): void {
  const rows = getTenants();
  const id = selectedTenant().id;
  const idx = rows.findIndex(x => x.id === id);
  if (idx < 0) return;
  const tenant = rows[idx];
  if (!tenant) return;
  mutator(tenant);
  rows[idx] = ZentridDataSource.markChanged(tenant, 'tenant');
  if (Array.isArray(window.ZentridLiveTenants) && window.ZentridLiveTenants === rows) window.ZentridLiveTenants = rows;
  else saveTenants(rows);
}
function tenantDetailCurrentEditSnapshot(): string {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('#detailContent [data-tenant-edit-key]'))
    .map(control => `${control.dataset.tenantEditKey || ''}:${control.value}`)
    .join('\n');
}
function tenantDetailHasUnsavedEdits(): boolean {
  return tenantDetailEditMode && tenantDetailEditSnapshot !== tenantDetailCurrentEditSnapshot();
}
function tenantDetailConfirmDiscard(message = 'Discard unsaved tenant changes?'): boolean {
  return ZentridEntityDetailUX.confirmDiscard(tenantDetailHasUnsavedEdits(), message);
}
function tenantDetailControl(key: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  return document.querySelector(`#detailContent [data-tenant-edit-key="${CSS.escape(key)}"]`);
}
function syncTenantDetailInputs(record: ZentridTenantRecord): void {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('#detailContent [data-tenant-edit-key]'));
  inputs.forEach(input => {
    const key = input.dataset.tenantEditKey;
    if (!key || key === 'status') return;
    const value = input.value.trim();
    if (key.startsWith('notes::')) {
      const section = key.split('::')[1];
      if (!section) return;
      record.notes = record.notes || {};
      record.notes[section] = value;
    } else if (key.startsWith('contacts::')) {
      const [, indexText, field] = key.split('::');
      const index = Number(indexText);
      if (!field || !Number.isInteger(index)) return;
      record.contacts = record.contacts || [];
      const contact = record.contacts[index] || {};
      contact[field] = value;
      record.contacts[index] = contact;
      if (field === 'first' || field === 'last') contact.full = `${contact.first || ''} ${contact.last || ''}`.trim();
    } else if (key.startsWith('documents::')) {
      const [, indexText, field] = key.split('::');
      const index = Number(indexText);
      if (!field || !Number.isInteger(index)) return;
      record.documents = record.documents || [];
      const documentRecord = record.documents[index] || {};
      documentRecord[field] = value;
      record.documents[index] = documentRecord;
    } else if (key === 'types') {
      record.types = value.split(',').map(item => item.trim()).filter(Boolean);
    } else if (key === 'businessSame') {
      record.businessSame = ['yes','true','signed'].includes(value.toLowerCase());
    } else {
      record[key] = value;
    }
  });
}
function renderTenantDetailCurrentTab(): void {
  const tab = tenantActiveDetailTab();
  const record = tenantDetailEditMode && tenantDetailDraft ? tenantDetailDraft : selectedTenant();
  const content = document.getElementById('detailContent');
  if (content) content.innerHTML = detailTab(record, tab, tenantDetailEditMode);
  const title = document.getElementById('tenantDetailTitle');
  if (title) title.textContent = tenantTabLabel(tab);
}
function updateTenantDetailEditButtons(): void {
  const record = selectedTenant();
  const edit = tenantElement<HTMLButtonElement>('editTenantTab');
  const cancel = tenantElement<HTMLButtonElement>('cancelTenantEdit');
  const save = tenantElement<HTMLButtonElement>('saveTenantEdit');
  if (edit) {
    edit.classList.toggle('hidden', tenantDetailEditMode);
    edit.disabled = tenantDetailBusy || !tenantDetailCanEdit(record);
    edit.title = tenantDetailCanEdit(record) ? (tenantDetailBackendManaged(record) ? 'Edit as a local browser override' : 'Edit this local tenant section') : tenantDetailIsArchived(record) ? 'Archived tenants are read-only' : 'Managed Plants are edited from the Plant workspace';
  }
  cancel?.classList.toggle('hidden', !tenantDetailEditMode);
  save?.classList.toggle('hidden', !tenantDetailEditMode);
  if (cancel) cancel.disabled = tenantDetailBusy;
  if (save) save.disabled = tenantDetailBusy;
}
function setTenantDetailEditMode(enabled: boolean, force = false): void {
  const record = selectedTenant();
  if (enabled && !tenantDetailCanEdit(record)) {
    setTenantDetailFeedback('warning', 'Tenant section is read-only', tenantDetailBackendManaged(record)
      ? 'The backend does not expose a Tenant update endpoint. No local override was created for this live tenant.'
      : tenantDetailIsArchived(record)
        ? 'Archived tenant data cannot be changed.'
        : 'Managed Plants are edited from the Plant workspace.');
    return;
  }
  if (!enabled && !force && !tenantDetailConfirmDiscard()) return;
  tenantDetailEditMode = enabled;
  tenantDetailDraft = enabled ? tenantCloneRecord(record) : null;
  renderTenantDetailCurrentTab();
  const summary = document.getElementById('tenantDetailEditSummary');
  if (summary) { summary.hidden = true; summary.innerHTML = ''; }
  tenantDetailEditSnapshot = enabled ? tenantDetailCurrentEditSnapshot() : '';
  updateTenantDetailEditButtons();
  if (enabled) clearTenantDetailFeedback();
}
function tenantDetailMeaningful(value: unknown): boolean {
  const text = String(value ?? '').trim();
  return Boolean(text && text !== '—' && text.toLowerCase() !== 'not set');
}
function validateTenantDetailEdits(): ZentridFormValidationResult {
  const root = requireTenantElement('detailContent');
  const summary = tenantElement('tenantDetailEditSummary');
  const draft = tenantDetailDraft;
  if (!draft) return { valid:false, issues:[{ message:'Tenant edit draft is unavailable.' }] };
  syncTenantDetailInputs(draft);
  const tab = tenantActiveDetailTab();
  const issues: ZentridFormIssue[] = [];
  const required = (key: string, label: string) => {
    const control = tenantDetailControl(key);
    if (!control || !tenantDetailMeaningful(control.value)) issues.push({ control, message:`${label} is required.` });
  };
  if (tab === 'general') {
    required('name', 'Tenant Name');
    required('legal', 'Legal Name');
    required('tax', 'Tax ID / VAT Number');
    const currentId = selectedTenant().id;
    const name = String(draft.name || '').trim().toLowerCase();
    const tax = String(draft.tax || '').trim().toLowerCase();
    const registration = String(draft.registration || '').trim().toLowerCase();
    const others = getTenants().filter(item => item.id !== currentId);
    if (name && others.some(item => String(item.name || '').trim().toLowerCase() === name)) issues.push({ control:tenantDetailControl('name'), message:`A tenant named “${String(draft.name).trim()}” already exists.` });
    if (tax && tax !== '—' && others.some(item => String(item.tax || '').trim().toLowerCase() === tax)) issues.push({ control:tenantDetailControl('tax'), message:'This Tax ID / VAT Number is already used by another tenant.' });
    if (registration && registration !== '—' && others.some(item => String(item.registration || '').trim().toLowerCase() === registration)) issues.push({ control:tenantDetailControl('registration'), message:'This Registration Number is already used by another tenant.' });
    const website = tenantDetailControl('webplant');
    if (website?.value.trim()) {
      try { new URL(website.value.trim()); } catch { issues.push({ control:website, message:'Website must be a complete URL, for example https://tenant.example.com.' }); }
    }
  }
  if (tab === 'address') {
    ['country','region','city','address'].forEach((key, index) => required(key, ['Legal Country','Legal State / Region','Legal City','Legal Street Address'][index] || key));
    const businessSame = String(draft.businessSame ?? '').toLowerCase() === 'true' || draft.businessSame === true;
    if (!businessSame) ['businessCountry','businessRegion','businessCity','businessAddress'].forEach((key, index) => required(key, ['Business Address Country','Business Address State / Region','Business Address City','Business Address Street Address'][index] || key));
    const postal = tenantDetailControl('postal');
    const country = String(draft.country || '');
    if (postal?.value.trim() && country === 'Armenia' && !/^\d{4}$/.test(postal.value.trim())) issues.push({ control:postal, message:'Armenian postal code must contain 4 digits.' });
    if (postal?.value.trim() && country === 'United States' && !/^\d{5}(?:-\d{4})?$/.test(postal.value.trim())) issues.push({ control:postal, message:'US ZIP code must use 12345 or 12345-6789 format.' });
  }
  if (tab === 'contacts') {
    const contacts = draft.contacts || [];
    if (!contacts.length) issues.push({ message:'Add at least one active Primary contact.' });
    const emails = new Map<string, number>();
    contacts.forEach((contact, index) => {
      const first = tenantDetailControl(`contacts::${index}::first`);
      const last = tenantDetailControl(`contacts::${index}::last`);
      const email = tenantDetailControl(`contacts::${index}::email`);
      if (!tenantDetailMeaningful(contact.first)) issues.push({ control:first, message:`Contact ${index + 1}: First Name is required.` });
      if (!tenantDetailMeaningful(contact.last)) issues.push({ control:last, message:`Contact ${index + 1}: Last Name is required.` });
      const emailText = String(contact.email || '').trim().toLowerCase();
      if (!emailText) issues.push({ control:email, message:`Contact ${index + 1}: Email is required.` });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailText)) issues.push({ control:email, message:`Contact ${index + 1}: Enter a valid email address.` });
      else if (emails.has(emailText)) issues.push({ control:email, message:`Contact ${index + 1}: Email duplicates another contact.` });
      else emails.set(emailText, index);
    });
    const primary = contacts.some(contact => String(contact.role || '').toLowerCase() === 'primary' && String(contact.active || 'Yes').toLowerCase() !== 'no');
    if (!primary) issues.push({ control:tenantDetailControl('contacts::0::role'), message:'At least one active contact must have the Primary role.' });
  }
  if (tab === 'classification') {
    ['category','tier','priority','risk'].forEach((key, index) => required(key, ['Tenant Category','Account Tier','Tenant Priority','Risk Category'][index] || key));
  }
  if (tab === 'communication') {
    ['language','timezone','channel'].forEach((key, index) => required(key, ['Preferred Language','Preferred Time Zone','Preferred Communication Channel'][index] || key));
    const hours = tenantDetailControl('businessHours');
    if (hours?.value.trim() && !/^\d{2}:\d{2}\s*[–-]\s*\d{2}:\d{2}$/.test(hours.value.trim())) issues.push({ control:hours, message:'Business Hours must use a format such as 09:00–18:00.' });
  }
  if (tab === 'legal') {
    (draft.documents || []).forEach((documentRecord, index) => {
      const hasAny = [documentRecord.name, documentRecord.type, documentRecord.expiry, documentRecord.file].some(tenantDetailMeaningful);
      if (!hasAny) return;
      if (!tenantDetailMeaningful(documentRecord.name)) issues.push({ control:tenantDetailControl(`documents::${index}::name`), message:`Document ${index + 1}: Document Name is required.` });
      if (!tenantDetailMeaningful(documentRecord.type)) issues.push({ control:tenantDetailControl(`documents::${index}::type`), message:`Document ${index + 1}: Type is required.` });
    });
  }
  const result = ZentridFormUX.validate(root, issues, summary, `Review ${tenantTabLabel(tab)} before saving`);
  if (!result.valid) ZentridFormUX.focusFirst(result, summary);
  return result;
}
function refreshTenantDetailSummary(): void {
  const record = selectedTenant();
  const setText = (id: string, value: unknown) => { const element = document.getElementById(id); if (element) element.textContent = tenantDisplayValue(value); };
  setText('tenantDetailHeroName', record.name);
  setText('tenantDetailHeroMeta', `${record.legal || '—'} · ${record.country || '—'}, ${record.city || '—'} · ${record.code || '—'}`);
  setText('tenantDetailStatusKpi', tenantStatusValue(record));
  setText('tenantDetailComplianceKpi', tenantComplianceValue(record));
  setText('tenantDetailCountryKpi', record.country);
  setText('tenantDetailRegionKpi', record.region || record.city);
  setText('tenantDetailEntityKpi', record.entityType || 'Legal Entity');
  setText('tenantDetailTypesKpi', Array.isArray(record.types) ? record.types.join(', ') : '—');
  setText('tenantDetailContactCountKpi', (record.contacts || []).length);
  setText('tenantDetailRiskKpi', record.risk || '—');
  setText('tenantDetailPriorityKpi', `${record.priority || '—'} priority`);
  const heroBadge = document.querySelector<HTMLElement>('.page-hero .record-origin-chip');
  if (heroBadge) heroBadge.outerHTML = ZentridDataSource.badge(record, 'tenant', true);
  const control = document.getElementById('tenantDetailControl');
  if (control) control.outerHTML = renderTenantDetailControls(record);
}
function saveTenantDetailEdits(): void {
  if (tenantDetailBusy || !tenantDetailDraft) return;
  const record = selectedTenant();
  if (!ZentridActionPermissions.guard({ action:'edit', resource:'tenant', record, status:tenantStatusValue(record), origin:tenantDetailOrigin(record), updateAvailable:false, localOverride:true })) return;
  if (!tenantDetailCanEdit(record)) {
    setTenantDetailFeedback('warning', 'Tenant section is read-only', 'No local override was created.');
    return;
  }
  const result = validateTenantDetailEdits();
  if (!result.valid) return;
  syncTenantDetailInputs(tenantDetailDraft);
  const saveButton = tenantElement<HTMLButtonElement>('saveTenantEdit');
  tenantDetailBusy = true;
  if (saveButton) ZentridFormUX.setBusy(saveButton, true, 'Saving locally…');
  document.getElementById('tenantDetailControl')?.setAttribute('aria-busy', 'true');
  try {
    const next = tenantCloneRecord(tenantDetailDraft);
    updateSelectedTenant(tenant => {
      const stableId = tenant.id;
      const stableStatus = tenant.status;
      Object.assign(tenant, next);
      tenant.id = stableId;
      if (stableStatus !== undefined) tenant.status = stableStatus;
      else delete tenant.status;
      tenant.updated = new Date().toISOString().slice(0,10);
    });
    setTenantDetailEditMode(false, true);
    refreshTenantDetailSummary();
    setTenantDetailFeedback('success', 'Tenant section saved locally', 'This prototype change was stored only in the current browser. No backend request was sent.');
    ZentridLayout.toast('Tenant section saved locally');
  } catch {
    setTenantDetailFeedback('danger', 'Unable to save tenant section', 'Review browser storage and try again.');
  } finally {
    tenantDetailBusy = false;
    document.getElementById('tenantDetailControl')?.setAttribute('aria-busy', 'false');
    if (saveButton) ZentridFormUX.setBusy(saveButton, false);
    updateTenantDetailEditButtons();
  }
}
function addTenantDetailContact(): void {
  if (!tenantDetailEditMode || !tenantDetailDraft) return;
  syncTenantDetailInputs(tenantDetailDraft);
  tenantDetailDraft.contacts = tenantDetailDraft.contacts || [];
  tenantDetailDraft.contacts.push({ first:'', last:'', role:tenantDetailDraft.contacts.length ? 'Technical' : 'Primary', email:'', mobile:'', office:'', language:'English', method:'Email', active:'Yes' });
  renderTenantDetailCurrentTab();
  tenantDetailControl(`contacts::${tenantDetailDraft.contacts.length - 1}::first`)?.focus();
}
function removeTenantDetailContact(index: number): void {
  if (!tenantDetailEditMode || !tenantDetailDraft) return;
  syncTenantDetailInputs(tenantDetailDraft);
  const contact = (tenantDetailDraft.contacts || [])[index];
  if (!contact) return;
  const name = contact.full || `${contact.first || ''} ${contact.last || ''}`.trim() || 'this contact';
  const warning = String(contact.role || '').toLowerCase() === 'primary'
    ? `Remove Primary contact ${name}? Another active Primary contact will be required before saving.`
    : `Remove ${name} from this tenant draft?`;
  if (!window.confirm(warning)) return;
  tenantDetailDraft.contacts?.splice(index, 1);
  renderTenantDetailCurrentTab();
}
function addTenantDetailDocument(): void {
  if (!tenantDetailEditMode || !tenantDetailDraft) return;
  syncTenantDetailInputs(tenantDetailDraft);
  tenantDetailDraft.documents = tenantDetailDraft.documents || [];
  tenantDetailDraft.documents.push({ name:'', type:'', expiry:'', file:'' });
  renderTenantDetailCurrentTab();
  tenantDetailControl(`documents::${tenantDetailDraft.documents.length - 1}::name`)?.focus();
}
function removeTenantDetailDocument(index: number): void {
  if (!tenantDetailEditMode || !tenantDetailDraft) return;
  syncTenantDetailInputs(tenantDetailDraft);
  const documentRecord = (tenantDetailDraft.documents || [])[index];
  if (!documentRecord || !window.confirm(`Remove ${documentRecord.name || 'this document'} from the tenant draft?`)) return;
  tenantDetailDraft.documents?.splice(index, 1);
  renderTenantDetailCurrentTab();
}

function tenantRows(rows: ZentridTenantRecord[]): string { return `<div class="data-table tenant-table"><div class="data-head"><span>Tenant</span><span>Legal / Country</span><span>Registry</span><span>Classification</span><span>Compliance</span><span>Actions</span></div>${rows.map((c: ZentridTenantRecord)=>{ const compliance = tenantComplianceValue(c); const status = tenantStatusValue(c); return `<div class="data-row" data-id="${c.id}"><div>${ZentridDataSource.badge(c, 'tenant')}<strong>${c.name}</strong><small>${c.code}<br>${c.legal}</small></div><div><strong>${c.country}, ${c.city}</strong><small>${Array.isArray(c.types) ? c.types.join(', ') : ''}<br>${c.address}</small></div><div><strong>${c.registration || 'Registered'}</strong><small>Tax ID / VAT: ${c.tax}</small></div><div><strong>${c.tier}</strong><small>${c.category} · Risk: ${c.risk}</small></div><div class="tenant-status-stack"><span class="badge ${cls(compliance)}">${compliance}</span><small>${status} · Setup ${c.setup || 0}%</small></div><div class="row-actions"><button data-action="view" data-permission-action="view" data-permission-resource="tenant" data-permission-status="${tenantEscapeAttr(status)}" data-permission-origin="${tenantEscapeAttr(tenantDetailOrigin(c))}">Open</button><button data-action="integrate" data-permission-action="create" data-permission-resource="integration">Connect</button><button data-action="edit" data-permission-action="edit" data-permission-resource="tenant" data-permission-status="${tenantEscapeAttr(status)}" data-permission-origin="${tenantEscapeAttr(tenantDetailOrigin(c))}" data-permission-update-available="false" data-permission-local-override="true">Edit</button></div></div>`; }).join('')}</div>`; }
function renderTenantRegistry(){ const rows=getTenants(); return `<section class="page-hero"><div><p class="eyebrow">Global Admin · Tenant Lifecycle</p><h1>Tenant Registry</h1><p class="muted">Create and maintain tenant legal identity, addresses, contacts, classification, communication preferences and compliance.</p></div><button class="create-action" id="openTenantWizard" type="button" data-permission-action="create" data-permission-resource="tenant"><span class="pulse"></span><div><strong>+ Create Tenant</strong><small>6-step documented form</small></div></button></section><section class="context-bar glass-card"><button class="ctx-item"><span>Total Tenants</span><strong>${rows.length}</strong></button><button class="ctx-item"><span>Active</span><strong>${rows.filter(x=>x.status==='Active').length}</strong></button><button class="ctx-item"><span>Armenia / USA</span><strong>${rows.filter(x => ['Armenia','United States'].includes(String(x.country || ''))).length}</strong></button><button class="ctx-item"><span>Needs Compliance Review</span><strong>${rows.filter(x=>x.compliance!=='Approved').length}</strong></button></section><section class="panel glass-card"><div class="panel-head"><div><h2>Tenants</h2><p>Only tenant data fields from the Client Data document are used. Portal Access and Internal Notes & Audit are intentionally excluded.</p></div><div class="toolbar"><input id="tenantSearch" placeholder="Search tenant, country, tax id..."/><select id="tenantStatus"><option>All Statuses</option><option>Active</option><option>Inactive</option><option>Suspended</option><option>Archived</option></select></div></div><div id="tenantTable">${tenantRows(rows)}</div></section>${tenantWizard()}`; }

function stepIntro(name: string, text: string): string { return `<div class="wizard-description full"><strong>${name}</strong><p>${text}</p><textarea name="${name.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_notes" placeholder="Notes for ${name}..."></textarea></div>`; }
function yesNo(name: string, label: string, yes='Yes'): string { return `<label>${label}<select name="${name}"><option>${yes}</option><option>${yes==='Yes'?'No':'Yes'}</option></select></label>`; }
function tenantWizard(){ const steps=['General Information','Address Information','Contact Persons','Tenant Classification','Communication Preferences','Legal & Compliance']; return `<aside class="modal" id="tenantModal" role="dialog" aria-modal="true" aria-labelledby="tenantWizardTitle" aria-hidden="true"><div class="modal-card wide-modal"><button class="modal-close" id="closeTenantModal" type="button" aria-label="Close tenant wizard">x</button><p class="eyebrow">Tenant Provisioning Wizard</p><h2 id="tenantWizardTitle">Create Tenant</h2><div class="setup-layout"><div class="setup-rail" aria-label="Tenant creation steps">${steps.map((s,i)=>`<button class="${i===0?'active':''}" data-step="${i}"><b>${i+1}</b><span>${s}</span></button>`).join('')}</div><form id="tenantForm" class="form-grid setup-form" novalidate data-zentrid-form-readiness="local" data-zentrid-form-contract="TenantCreateDraft" data-zentrid-form-endpoint="/api/admin/tenants" data-zentrid-form-method="POST" data-zentrid-form-api-note="The wizard currently stores a local prototype record; its DTO is ready for the Tenant create contract.">
<div class="form-validation-summary full" id="tenantValidationSummary" role="alert" aria-live="assertive" tabindex="-1" hidden></div>
<div class="wizard-step active" data-tenant-step="0">
  <label>Tenant ID <input disabled value="Auto-generated after save"></label>
  <label>Tenant Code <input disabled value="Auto-generated unique code"></label>
  <label class="full entity-type-field">Entity Type <select name="entityType" id="tenantEntityType"><option>Legal Entity</option><option>Individual</option></select><small class="field-help">Switching entity type changes labels, placeholders and visible organization-only fields. It does not add extra fields.</small></label>
  <label><span id="tenantNameLabel">Tenant Name *</span><input name="name" required minlength="2" maxlength="120" autocomplete="organization" placeholder="ABC Solar Energy"></label>
  <label><span id="legalNameLabel">Legal Name *</span><input name="legal" required minlength="2" maxlength="180" autocomplete="organization" placeholder="ABC Solar Energy LLC"></label>
  <label><span id="tradeNameLabel">Trade Name</span><input name="trade" placeholder="Public / commercial name"></label>
  <label>Display Name <input name="displayName" placeholder="Name shown across Zentrid UI"></label>
  <label>Country * <select name="country" id="tenantCountry"><option>Armenia</option><option>United States</option></select></label>
  <label><span id="registrationLabel">Registration Number</span><input name="registration" id="registrationNumber" maxlength="64" autocomplete="off" placeholder="Example: 286.110.123456"><small class="field-help" id="registrationHelp">State registration number issued in Armenia.</small></label>
  <label><span id="taxLabel">Tax ID / VAT Number *</span><input name="tax" id="taxNumber" required maxlength="32" autocomplete="off" placeholder="Example: 01234567"><small class="field-help" id="taxHelp">Armenian Taxpayer Identification Number (TIN).</small></label>
  <label>Tenant Status * <select name="status"><option>Inactive</option><option>Active</option><option>Suspended</option><option>Archived</option></select></label>
  <label>Tenant Type * <select name="type"><option>Owner</option><option>Operator</option><option>Investor</option><option>EPC</option><option>O&M</option><option>Utility</option></select></label>
  <label>Account Manager <input name="account" placeholder="John Smith"></label>
  <label class="org-only">Industry Sector <select name="industry"><option>Solar Energy</option><option>Renewable Energy</option><option>Energy Services</option><option>O&M Services</option><option>Commercial Real Estate</option><option>Industrial</option><option>Government / Municipality</option><option>Utility</option></select></label>
  <label class="org-only">Business Category <select name="businessCategory"><option>Enterprise</option><option>SME</option><option>Government</option></select></label>
  <label class="org-only">Parent Company <select name="parentCompany"><option>None</option><option>Parent Company A</option><option>Parent Company B</option></select></label>
  <label class="org-only">Number of Employees <input type="number" name="employees" placeholder="120"></label>
  <label class="org-only">Annual Revenue Range <select name="annualRevenue"><option>Less than $1M</option><option>$1M–$5M</option><option>$5M–$10M</option><option>$10M–$50M</option><option>$50M+</option></select></label>
  <label class="full org-only">Website <input type="url" name="webplant" placeholder="https://company.example"></label>
  <div class="country-rules full" id="countryRules"><strong>Country rules: Armenia</strong><p>Registration Number: 286.110.123456 · Tax ID / VAT Number: 01234567 · Phone: +374 XX XXX XXX</p></div>
  ${stepIntro('General Information','Legal identity and organization information for the tenant. Country changes only format hints, validation guidance and placeholders; field names stay the same.')}
</div>
<div class="wizard-step" data-tenant-step="1">
  <h3 class="full">Legal Address</h3>
  <label>Country <select name="legalCountry" id="legalCountry"><option>Armenia</option><option>United States</option></select></label>
  <label>State / Region <input name="region" id="legalRegion" placeholder="Example: Yerevan, Kotayk, Shirak"></label>
  <label>City * <input name="city" required minlength="2" maxlength="100" autocomplete="address-level2" placeholder="Yerevan"></label>
  <label>Street Address * <input name="address" required minlength="4" maxlength="500" autocomplete="street-address" placeholder="24 Energy Avenue"></label>
  <label>Building Number <input name="building" placeholder="12"></label>
  <label>Postal Code <input name="postal" id="legalPostal" placeholder="Example: 0010"></label>
  <label class="check full"><input type="checkbox" name="businessSame" id="businessSame" checked> Business Address same as Legal Address</label>
  <div class="full business-address-fields" id="businessAddressFields">
    <h3>Business Address</h3>
    <div class="form-grid nested-grid">
      <label>Country <select name="businessCountry" id="businessCountry"><option>Armenia</option><option>United States</option></select></label>
      <label>Region <input name="businessRegion" id="businessRegion" placeholder="Example: Yerevan, Kotayk, Shirak"></label>
      <label>City <input name="businessCity" placeholder="City"></label>
      <label>Street Address <input name="businessAddress" placeholder="Street Address"></label>
      <label>Postal Code <input name="businessPostal" id="businessPostal" placeholder="Example: 0010"></label>
    </div>
  </div>
  ${stepIntro('Address Information','Legal address is required. Business address can reuse legal address or be entered separately when the checkbox is unchecked.')}
</div>
<div class="wizard-step" data-tenant-step="2">
  <div class="full contact-step-head"><div><h3>Contact Persons</h3><p class="muted">Add one or more contact persons for Primary, Billing, Legal, Technical or Commercial communication.</p></div><button type="button" class="primary-action" id="openInlineContact">+ Add Contact</button></div>
  <section class="tenant-inline-form full is-hidden" id="inlineContactForm">
    <div class="inline-form-head"><strong>Contact Detail</strong><small>Fill the contact fields and save them into this tenant record.</small></div>
    <div class="form-grid nested-grid tenant-contact-form">
      <label>First Name * <input id="contactFirst" required minlength="2" maxlength="80" autocomplete="given-name" placeholder="First name"></label>
      <label>Last Name * <input id="contactLast" required minlength="2" maxlength="80" autocomplete="family-name" placeholder="Last name"></label>
      <label>Position <input id="contactPosition" placeholder="Operations Lead"></label>
      <label>Department <select id="contactDepartment"><option>Executive</option><option>Finance</option><option>Legal</option><option>Technical</option><option>Operations</option></select></label>
      <label>Contact Role <select id="contactRole"><option>Primary</option><option>Billing</option><option>Legal</option><option>Technical</option><option>Commercial</option></select></label>
      <label>Email * <input id="contactEmail" type="email" required maxlength="160" autocomplete="email" placeholder="contact@company.example"></label>
      <label>Mobile Phone <input id="contactPhone" type="tel" maxlength="40" autocomplete="tel" placeholder="+374 XX XXX XXX"></label>
      <label>Office Phone <input id="contactOfficePhone" type="tel" maxlength="40" autocomplete="tel" placeholder="+374 XX XXX XXX"></label>
      <label>Preferred Language <select id="contactLanguage"><option>English</option><option>Armenian</option></select></label>
      <label>Preferred Contact Method <select id="contactMethod"><option>Email</option><option>Phone</option><option>Portal</option></select></label>
      <label class="check"><input type="checkbox" id="contactActive" checked> Active</label>
      <div class="inline-form-actions"><button type="button" class="primary-action" id="saveInlineContact">Save Contact</button><button type="button" class="secondary-action" id="cancelInlineContact">Cancel</button></div>
    </div>
  </section>
  <div class="data-table full compact-table tenant-contact-table wizard-contact-table" id="wizardContactsTable"><div class="data-head"><span>Full Name</span><span>Role</span><span>Email</span><span>Phone</span><span>Actions</span></div><div class="empty-state">No contacts added yet. Add at least one Primary contact.</div></div>
  ${stepIntro('Contact Persons','Contact records are people related to this tenant. They do not create platform users automatically.')}
</div>
<div class="wizard-step" data-tenant-step="3">
  <label>Tenant Category <select name="category"><option>Strategic</option><option>Standard</option><option>Partner</option></select></label>
  <label>Account Tier <select name="tier"><option>Bronze</option><option>Silver</option><option>Gold</option><option>Platinum</option></select></label>
  <label>Tenant Priority <select name="priority"><option>Low</option><option>Medium</option><option>High</option></select></label>
  <label>Risk Category <select name="risk"><option>Low</option><option>Medium</option><option>High</option></select></label>
  <label class="full">Acquisition Source <select name="source"><option>Referral</option><option>Direct</option><option>Partner</option><option>Event</option></select></label>
  ${stepIntro('Tenant Classification','Business classification fields help Global Admin segment tenants without mixing in plants, devices, billing or integrations.')}
</div>
<div class="wizard-step" data-tenant-step="4">
  <label>Preferred Language <select name="language"><option>English</option><option>Armenian</option></select></label>
  <label>Preferred Time Zone <select name="timezone" id="preferredTimezone"><option>Asia/Yerevan</option><option>America/New_York</option><option>America/Los_Angeles</option><option>America/Chicago</option></select></label>
  <label>Preferred Communication Channel <select name="channel"><option>Email</option><option>Phone</option><option>Portal</option></select></label>
  <label>Business Hours <input name="businessHours" placeholder="09:00–18:00"></label>
  ${yesNo('platformNotifications','Receive Platform Notifications')}
  ${yesNo('serviceNotifications','Receive Service Notifications')}
  ${yesNo('invoiceNotifications','Receive Invoice Notifications')}
  ${yesNo('securityNotifications','Receive Security Notifications')}
  <label class="full">Notification Recipients <input name="notificationRecipients" placeholder="Primary, Billing, Technical"></label>
  ${stepIntro('Communication Preferences','Communication and notification preferences for the tenant organization. Portal access is intentionally not configured here.')}
</div>
<div class="wizard-step" data-tenant-step="5">
  <label>Data Processing Agreement <select name="dpa"><option>Signed</option><option>Not Signed</option></select></label>
  <label>NDA Status <select name="nda"><option>Signed</option><option>Not Signed</option></select></label>
  <label>Compliance Status <select name="compliance"><option>Approved</option><option>Pending</option></select></label>
  <label>Confidentiality Level <select name="confidentiality"><option>Standard</option><option>Restricted</option><option>Critical</option></select></label>
  <label>Data Controller Type <select name="controllerType"><option>Controller</option><option>Processor</option></select></label>
  <label>Consent Status <select name="consent"><option>Active</option><option>Expired</option></select></label>
  <label>Consent Expiry Date <input type="date" name="consentExpiry"></label>
  <input type="file" id="tenantDocUpload" accept=".pdf,.doc,.docx" multiple hidden>
  <div class="document-table-toolbar full"><button type="button" class="table-add-btn document-add-btn" id="tenantDocUploadAction" data-trigger-tenant-doc-upload title="Add documents">+ Add Documents</button></div>
  <div class="data-table full compact-table tenant-document-table wizard-document-table" id="wizardDocumentsTable"><div class="data-head"><span>Document Name</span><span>Type</span><span>Expiry</span><span>File</span><span>Actions</span></div></div>
  ${stepIntro('Legal & Compliance','Compliance and document information for the tenant. Audit data is kept in Audit Center, not in this form.')}
</div>
<div class="form-footer full"><span class="wizard-progress" id="tenantWizardProgress" aria-live="polite">Step 1 of 6</span><button type="button" id="prevTenantStep">Back</button><button type="button" class="primary-action" id="nextTenantStep">Save & Continue</button><button type="submit" class="primary-action" id="saveTenant" hidden data-permission-action="create" data-permission-resource="tenant">Create Tenant</button></div></form></div></div></aside>`; }

function wireTenantRegistry(): void {
  let step = 0;
  const modal = requireTenantElement<HTMLElement>('tenantModal');
  const steps = Array.from(document.querySelectorAll<HTMLElement>('.wizard-step'));
  const rails = Array.from(document.querySelectorAll<HTMLButtonElement>('.setup-rail button'));
  const tenantForm = requireTenantElement<HTMLFormElement>('tenantForm');
  const tenantSearch = requireTenantElement<HTMLInputElement>('tenantSearch');
  const tenantStatus = requireTenantElement<HTMLSelectElement>('tenantStatus');
  const tenantTable = requireTenantElement<HTMLElement>('tenantTable');
  const validationSummary = requireTenantElement<HTMLElement>('tenantValidationSummary');
  const previousButton = requireTenantElement<HTMLButtonElement>('prevTenantStep');
  const nextButton = requireTenantElement<HTMLButtonElement>('nextTenantStep');
  const saveButton = requireTenantElement<HTMLButtonElement>('saveTenant');
  const wizardProgress = requireTenantElement<HTMLElement>('tenantWizardProgress');
  let initialDraftSnapshot = '';
  let isSaving = false;

  const normalizeDuplicateValue = (value: unknown) => String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const draftSnapshot = () => `${ZentridFormUX.snapshot(tenantForm)}\ncontacts:${JSON.stringify(window.tenantWizardContacts || [])}\ndocuments:${JSON.stringify(window.tenantWizardDocuments || [])}`;

  const show = (index: number) => {
    step = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach((section, itemIndex) => section.classList.toggle('active', itemIndex === step));
    rails.forEach((rail, itemIndex) => {
      rail.classList.toggle('active', itemIndex === step);
      if (itemIndex === step) rail.setAttribute('aria-current', 'step');
      else rail.removeAttribute('aria-current');
    });
    previousButton.disabled = step === 0;
    nextButton.hidden = step === steps.length - 1;
    saveButton.hidden = step !== steps.length - 1;
    wizardProgress.textContent = `Step ${step + 1} of ${steps.length}`;
    validationSummary.hidden = true;
    validationSummary.innerHTML = '';
  };

  const applyAddressRules = (country: string, prefix: string) => {
    const rule = tenantCountryRules[country] || defaultTenantCountryRule();
    const region = tenantElement<HTMLInputElement>(prefix + 'Region');
    const postal = tenantElement<HTMLInputElement>(prefix + 'Postal');
    if (region) region.placeholder = rule.regionPlaceholder;
    if (postal) {
      postal.placeholder = rule.postalPlaceholder;
      if (country === 'Armenia') {
        postal.pattern = '\\d{4}';
        postal.title = 'Use a 4-digit Armenian postal code.';
      } else if (country === 'United States') {
        postal.pattern = '\\d{5}(-\\d{4})?';
        postal.title = 'Use ZIP format 12345 or 12345-6789.';
      } else {
        postal.removeAttribute('pattern');
        postal.removeAttribute('title');
      }
    }
  };

  const updateCountryRules = () => {
    const country = tenantElement<HTMLSelectElement>('tenantCountry')?.value || 'Armenia';
    const entity = tenantElement<HTMLSelectElement>('tenantEntityType')?.value || 'Legal Entity';
    const rule = tenantCountryRules[country] || defaultTenantCountryRule();
    const isIndividual = entity === 'Individual';
    const registration = tenantElement<HTMLInputElement>('registrationNumber');
    const tax = tenantElement<HTMLInputElement>('taxNumber');
    const timezone = tenantElement<HTMLSelectElement>('preferredTimezone');
    const mobile = tenantElement<HTMLInputElement>('contactPhone');
    const office = tenantElement<HTMLInputElement>('contactOfficePhone');
    const labels = {
      tenantName: document.getElementById('tenantNameLabel'),
      legal: document.getElementById('legalNameLabel'),
      trade: document.getElementById('tradeNameLabel'),
      registration: document.getElementById('registrationLabel'),
      tax: document.getElementById('taxLabel')
    };
    if (labels.tenantName) labels.tenantName.textContent = isIndividual ? 'Tenant Display Name *' : 'Tenant Name *';
    if (labels.legal) labels.legal.textContent = isIndividual ? 'Full Legal Name *' : 'Legal Name *';
    if (labels.trade) labels.trade.textContent = isIndividual ? 'Display Name' : 'Trade Name';
    if (labels.registration) labels.registration.textContent = isIndividual ? 'Personal ID / Passport Number' : 'Registration Number';
    if (labels.tax) labels.tax.textContent = isIndividual ? 'Tax ID / SSN / ITIN *' : 'Tax ID / VAT Number *';

    const individualRules: Record<string, { reg: string; regHelp: string; tax: string; taxHelp: string }> = {
      Armenia: { reg:'Example: AM1234567', regHelp:'Personal ID or passport number for an individual in Armenia.', tax:'Example: 01234567', taxHelp:'Individual taxpayer identifier when applicable in Armenia.' },
      'United States': { reg:'Example: P123456789', regHelp:'Passport, state ID or other personal identification reference.', tax:'Example: 123-45-6789', taxHelp:'SSN or ITIN for an individual in the United States.' }
    };
    const active = isIndividual ? individualRules[country] : undefined;
    if (registration) registration.placeholder = active?.reg || rule.registrationPlaceholder;
    if (tax) {
      tax.placeholder = active?.tax || rule.taxPlaceholder;
      if (isIndividual) {
        tax.removeAttribute('pattern');
        tax.title = 'Enter the applicable personal taxpayer identifier.';
      } else if (country === 'Armenia') {
        tax.pattern = '\\d{8}';
        tax.title = 'Use an 8-digit Armenian taxpayer identification number.';
      } else if (country === 'United States') {
        tax.pattern = '\\d{2}-\\d{7}';
        tax.title = 'Use EIN format 12-3456789.';
      } else {
        tax.removeAttribute('pattern');
        tax.removeAttribute('title');
      }
    }
    if (timezone && Array.from(timezone.options).some(option => option.value === rule.timezone)) timezone.value = rule.timezone;
    if (mobile) mobile.placeholder = rule.phonePlaceholder;
    if (office) office.placeholder = rule.phonePlaceholder;
    document.querySelectorAll('.org-only').forEach(element => element.classList.toggle('is-hidden', isIndividual));

    const legalCountry = tenantElement<HTMLSelectElement>('legalCountry');
    const businessCountry = tenantElement<HTMLSelectElement>('businessCountry');
    if (legalCountry) legalCountry.value = country;
    applyAddressRules(legalCountry?.value || country, 'legal');
    applyAddressRules(businessCountry?.value || country, 'business');
    const registrationHelp = document.getElementById('registrationHelp');
    const taxHelp = document.getElementById('taxHelp');
    const countryRules = document.getElementById('countryRules');
    if (registrationHelp) registrationHelp.textContent = active?.regHelp || rule.registrationHelp;
    if (taxHelp) taxHelp.textContent = active?.taxHelp || rule.taxHelp;
    if (countryRules) countryRules.innerHTML = `<strong>Country rules: ${country} · ${entity}</strong><p>${isIndividual ? 'Personal ID / Passport Number' : 'Registration Number'}: ${(active?.reg || rule.registrationPlaceholder).replace('Example: ','')} · ${isIndividual ? 'Tax ID / SSN / ITIN' : 'Tax ID / VAT Number'}: ${(active?.tax || rule.taxPlaceholder).replace('Example: ','')} · Phone: ${rule.phonePlaceholder}</p>`;
  };

  const toggleBusiness = () => {
    const box = document.getElementById('businessAddressFields');
    const checkbox = tenantElement<HTMLInputElement>('businessSame');
    if (!box || !checkbox) return;
    box.classList.toggle('is-hidden', checkbox.checked);
    box.setAttribute('aria-hidden', checkbox.checked ? 'true' : 'false');
    box.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(control => {
      control.disabled = checkbox.checked;
      control.required = !checkbox.checked && (control.name === 'businessCity' || control.name === 'businessAddress');
    });
  };

  const customStepIssues = (index: number, includeDuplicates = false): ZentridFormIssue[] => {
    const issues: ZentridFormIssue[] = [];
    const field = <T extends ZentridFormControl = ZentridFormControl>(name: string) => tenantForm.elements.namedItem(name) as T | null;
    if (index === 0) {
      const name = field<HTMLInputElement>('name');
      const legal = field<HTMLInputElement>('legal');
      const tax = field<HTMLInputElement>('tax');
      const registration = field<HTMLInputElement>('registration');
      const entity = field<HTMLSelectElement>('entityType')?.value || 'Legal Entity';
      if (name) name.value = name.value.trim();
      if (legal) legal.value = legal.value.trim();
      if (tax) tax.value = tax.value.trim();
      if (registration) registration.value = registration.value.trim();
      if (entity === 'Individual' && tax && tax.value && tax.value.length < 6) issues.push({ control:tax, message:'Enter a complete personal taxpayer identifier.' });
      if (includeDuplicates) {
        const rows = getTenants();
        const duplicateName = rows.find(item => normalizeDuplicateValue(item.name) === normalizeDuplicateValue(name?.value));
        const duplicateTax = rows.find(item => normalizeDuplicateValue(item.tax) === normalizeDuplicateValue(tax?.value));
        const duplicateRegistration = registration?.value ? rows.find(item => normalizeDuplicateValue(item.registration) === normalizeDuplicateValue(registration.value)) : undefined;
        if (duplicateName && name) issues.push({ control:name, message:`A tenant named “${duplicateName.name}” already exists.` });
        if (duplicateTax && tax) issues.push({ control:tax, message:`Tax identifier is already used by ${duplicateTax.name}.` });
        if (duplicateRegistration && registration) issues.push({ control:registration, message:`Registration number is already used by ${duplicateRegistration.name}.` });
      }
    }
    if (index === 1) {
      const same = field<HTMLInputElement>('businessSame')?.checked ?? true;
      const legalPostal = field<HTMLInputElement>('postal');
      const businessPostal = field<HTMLInputElement>('businessPostal');
      if (legalPostal) legalPostal.value = legalPostal.value.trim();
      if (!same && businessPostal) businessPostal.value = businessPostal.value.trim();
    }
    if (index === 2) {
      const contacts = window.tenantWizardContacts as ZentridTenantContact[];
      const primary = contacts.find(contact => contact.role === 'Primary' && contact.active !== 'No');
      if (!contacts.length) issues.push({ message:'Add at least one contact person before continuing.' });
      else if (!primary) issues.push({ message:'Assign one active contact as the Primary contact.' });
      const inline = document.getElementById('inlineContactForm');
      if (inline && !inline.classList.contains('is-hidden')) {
        const started = ['contactFirst','contactLast','contactEmail','contactPhone','contactOfficePhone'].some(id => tenantElement<HTMLInputElement>(id)?.value.trim());
        if (started) issues.push({ message:'Save or cancel the open contact before continuing.' });
      }
    }
    if (index === 4) {
      const hours = field<HTMLInputElement>('businessHours');
      if (hours) {
        hours.value = hours.value.trim();
        if (hours.value && !/^\d{2}:\d{2}[–-]\d{2}:\d{2}$/.test(hours.value)) issues.push({ control:hours, message:'Use business hours format 09:00–18:00.' });
      }
    }
    return issues;
  };

  const validateStep = (index: number, includeDuplicates = false): boolean => {
    const section = steps[index];
    if (!section) return true;
    const result = ZentridFormUX.validate(section, customStepIssues(index, includeDuplicates), validationSummary, `Step ${index + 1} needs attention`);
    rails[index]?.classList.toggle('has-error', !result.valid);
    if (result.valid) rails[index]?.classList.add('completed');
    else {
      rails[index]?.classList.remove('completed');
      show(index);
      ZentridFormUX.renderSummary(validationSummary, result.issues, `Step ${index + 1} needs attention`);
      ZentridFormUX.focusFirst(result, validationSummary);
    }
    return result.valid;
  };

  const validateBeforeStep = (targetIndex: number): boolean => {
    if (targetIndex <= step) return true;
    for (let index = 0; index < targetIndex; index += 1) {
      if (!validateStep(index)) return false;
    }
    return true;
  };

  const attemptCloseWizard = (): void => {
    if (!modal.classList.contains('open')) return;
    const changed = initialDraftSnapshot && draftSnapshot() !== initialDraftSnapshot;
    if (!isSaving && changed && !window.confirm('Discard the tenant information entered in this wizard?')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  window.tenantWizardContacts = window.tenantWizardContacts || [];
  window.tenantWizardDocuments = window.tenantWizardDocuments || [];
  window.tenantWizardEditContactIndex = null;

  const fillContactForm = (contact: ZentridTenantContact = {}) => {
    requireTenantElement<HTMLInputElement>('contactFirst').value = contact.first || '';
    requireTenantElement<HTMLInputElement>('contactLast').value = contact.last || '';
    requireTenantElement<HTMLInputElement>('contactPosition').value = contact.position || '';
    requireTenantElement<HTMLSelectElement>('contactDepartment').value = contact.department || 'Executive';
    requireTenantElement<HTMLSelectElement>('contactRole').value = contact.role || 'Primary';
    requireTenantElement<HTMLInputElement>('contactEmail').value = contact.email || '';
    requireTenantElement<HTMLInputElement>('contactPhone').value = contact.mobile || contact.phone || '';
    requireTenantElement<HTMLInputElement>('contactOfficePhone').value = contact.office || '';
    requireTenantElement<HTMLSelectElement>('contactLanguage').value = contact.language || 'English';
    requireTenantElement<HTMLSelectElement>('contactMethod').value = contact.method || 'Email';
    requireTenantElement<HTMLInputElement>('contactActive').checked = (contact.active || 'Yes') !== 'No';
  };

  const clearContactForm = () => {
    fillContactForm({ role:'Primary', department:'Executive', language:'English', method:'Email', active:'Yes' });
    window.tenantWizardEditContactIndex = null;
    const button = document.getElementById('saveInlineContact');
    if (button) button.textContent = 'Save Contact';
  };

  const renderWizardContacts = () => {
    const box = document.getElementById('wizardContactsTable');
    if (!box) return;
    const contacts = window.tenantWizardContacts as ZentridTenantContact[];
    const head = '<div class="data-head"><span>Full Name</span><span>Role</span><span>Email</span><span>Phone</span><span>Actions</span></div>';
    if (!contacts.length) { box.innerHTML = head + '<div class="empty-state">No contacts added yet. Add at least one Primary contact.</div>'; return; }
    box.innerHTML = head + contacts.map((contact, index) => `<div class="data-row"><div><strong>${contact.full || '—'}</strong></div><div><span>${contact.role || '—'}</span></div><div><span>${contact.email || '—'}</span></div><div><span>${contact.mobile || contact.phone || '—'}</span></div><div class="mini-row-actions"><button type="button" class="secondary-action" data-edit-wizard-contact="${index}">Edit</button><button type="button" class="danger-action" data-delete-wizard-contact="${index}">Delete</button></div></div>`).join('');
  };

  const renderWizardDocuments = () => {
    const box = document.getElementById('wizardDocumentsTable');
    if (!box) return;
    const documents = window.tenantWizardDocuments as ZentridTenantDocument[];
    const head = '<div class="data-head"><span>Document Name</span><span>Type</span><span>Expiry</span><span>File</span><span>Actions</span></div>';
    if (!documents.length) { box.innerHTML = head + '<div class="empty-state">No documents attached yet.</div>'; return; }
    box.innerHTML = head + documents.map((documentRecord, index) => `<div class="data-row"><strong>${documentRecord.name || '—'}</strong><span>${documentRecord.type || '—'}</span><span>${documentRecord.expiry || '—'}</span><span>${documentRecord.file || documentRecord.name || '—'}</span><div class="mini-row-actions"><button type="button" class="danger-action" data-delete-wizard-document="${index}">Delete</button></div></div>`).join('');
  };

  requireTenantElement<HTMLButtonElement>('openTenantWizard').onclick = () => {
    tenantForm.reset();
    window.tenantWizardContacts = [];
    window.tenantWizardDocuments = [];
    window.tenantWizardEditContactIndex = null;
    const docInput = tenantElement<HTMLInputElement>('tenantDocUpload');
    if (docInput) docInput.value = '';
    clearContactForm();
    renderWizardContacts();
    renderWizardDocuments();
    rails.forEach(rail => rail.classList.remove('completed', 'has-error'));
    ZentridFormUX.clearErrors(tenantForm, validationSummary);
    updateCountryRules();
    toggleBusiness();
    show(0);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    initialDraftSnapshot = draftSnapshot();
    window.setTimeout(() => tenantForm.elements.namedItem('name') instanceof HTMLInputElement && (tenantForm.elements.namedItem('name') as HTMLInputElement).focus(), 0);
  };
  requireTenantElement<HTMLButtonElement>('closeTenantModal').onclick = attemptCloseWizard;
  modal.addEventListener('click', event => { if (event.target === modal) attemptCloseWizard(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) attemptCloseWizard(); });
  requireTenantElement<HTMLSelectElement>('tenantCountry').onchange = updateCountryRules;
  requireTenantElement<HTMLSelectElement>('tenantEntityType').onchange = updateCountryRules;
  requireTenantElement<HTMLSelectElement>('legalCountry').onchange = event => applyAddressRules((event.currentTarget as HTMLSelectElement).value, 'legal');
  requireTenantElement<HTMLSelectElement>('businessCountry').onchange = event => applyAddressRules((event.currentTarget as HTMLSelectElement).value, 'business');
  requireTenantElement<HTMLInputElement>('businessSame').onchange = toggleBusiness;

  const addContact = () => {
    const inlineContact = requireTenantElement<HTMLElement>('inlineContactForm');
    const firstControl = requireTenantElement<HTMLInputElement>('contactFirst');
    const lastControl = requireTenantElement<HTMLInputElement>('contactLast');
    const emailControl = requireTenantElement<HTMLInputElement>('contactEmail');
    firstControl.value = firstControl.value.trim();
    lastControl.value = lastControl.value.trim();
    emailControl.value = emailControl.value.trim();
    const contacts = window.tenantWizardContacts as ZentridTenantContact[];
    const editIndex = typeof window.tenantWizardEditContactIndex === 'number' ? window.tenantWizardEditContactIndex : null;
    const duplicateEmail = contacts.find((contact, index) => index !== editIndex && normalizeDuplicateValue(contact.email) === normalizeDuplicateValue(emailControl.value));
    const contactIssues: ZentridFormIssue[] = duplicateEmail ? [{ control:emailControl, message:`This email is already assigned to ${duplicateEmail.full || 'another contact'}.` }] : [];
    const contactValidation = ZentridFormUX.validate(inlineContact, contactIssues, validationSummary, 'Complete the contact details');
    if (!contactValidation.valid) {
      ZentridFormUX.focusFirst(contactValidation, validationSummary);
      return;
    }
    const first = firstControl.value;
    const last = lastControl.value;
    const email = emailControl.value;
    const role = requireTenantElement<HTMLSelectElement>('contactRole').value;
    if (role === 'Primary') window.tenantWizardContacts = contacts.map((contact, index) => ({ ...contact, role: contact.role === 'Primary' && index !== editIndex ? 'Contact' : contact.role }));
    const mobile = requireTenantElement<HTMLInputElement>('contactPhone').value.trim();
    const office = requireTenantElement<HTMLInputElement>('contactOfficePhone').value.trim();
    const item: ZentridTenantContact = {
      first, last, full: `${first} ${last}`,
      position: requireTenantElement<HTMLInputElement>('contactPosition').value.trim(),
      department: requireTenantElement<HTMLSelectElement>('contactDepartment').value,
      role, email, mobile, office, phone: mobile || office || '—',
      language: requireTenantElement<HTMLSelectElement>('contactLanguage').value,
      method: requireTenantElement<HTMLSelectElement>('contactMethod').value,
      active: requireTenantElement<HTMLInputElement>('contactActive').checked ? 'Yes' : 'No'
    };
    const currentContacts = window.tenantWizardContacts as ZentridTenantContact[];
    if (editIndex !== null && currentContacts[editIndex]) { currentContacts[editIndex] = item; ZentridLayout.toast('Contact updated'); }
    else { currentContacts.push(item); ZentridLayout.toast('Contact added'); }
    clearContactForm();
    document.getElementById('inlineContactForm')?.classList.add('is-hidden');
    renderWizardContacts();
    rails[2]?.classList.remove('has-error');
    validationSummary.hidden = true;
    validationSummary.innerHTML = '';
  };

  requireTenantElement<HTMLButtonElement>('openInlineContact').onclick = () => {
    document.getElementById('inlineContactForm')?.classList.remove('is-hidden');
    requireTenantElement<HTMLInputElement>('contactFirst').focus();
  };
  requireTenantElement<HTMLButtonElement>('saveInlineContact').onclick = addContact;
  requireTenantElement<HTMLButtonElement>('cancelInlineContact').onclick = () => { const inline = document.getElementById('inlineContactForm'); if (inline) ZentridFormUX.clearErrors(inline, validationSummary); clearContactForm(); inline?.classList.add('is-hidden'); };

  document.getElementById('wizardContactsTable')?.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const edit = target.closest<HTMLElement>('[data-edit-wizard-contact]');
    const remove = target.closest<HTMLElement>('[data-delete-wizard-contact]');
    if (edit) {
      const index = Number(edit.dataset.editWizardContact);
      const item = (window.tenantWizardContacts as ZentridTenantContact[])[index];
      if (item) {
        window.tenantWizardEditContactIndex = index;
        fillContactForm(item);
        document.getElementById('inlineContactForm')?.classList.remove('is-hidden');
        const saveButton = document.getElementById('saveInlineContact');
        if (saveButton) saveButton.textContent = 'Update Contact';
        requireTenantElement<HTMLInputElement>('contactFirst').focus();
      }
      return;
    }
    if (remove) {
      const index = Number(remove.dataset.deleteWizardContact);
      const contacts = window.tenantWizardContacts as ZentridTenantContact[];
      const contact = contacts[index];
      if (!contact) return;
      const warning = contact.role === 'Primary'
        ? 'Delete the Primary contact? You must assign another active Primary contact before creating the tenant.'
        : `Delete ${contact.full || 'this contact'}?`;
      if (!window.confirm(warning)) return;
      contacts.splice(index, 1);
      renderWizardContacts();
      rails[2]?.classList.remove('completed');
      ZentridLayout.toast('Contact deleted');
    }
  });

  document.getElementById('tenantDocUploadAction')?.addEventListener('click', () => tenantElement<HTMLInputElement>('tenantDocUpload')?.click());
  document.getElementById('wizardDocumentsTable')?.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const remove = target.closest<HTMLElement>('[data-delete-wizard-document]');
    if (!remove) return;
    const documents = window.tenantWizardDocuments as ZentridTenantDocument[];
    const index = Number(remove.dataset.deleteWizardDocument);
    const documentRecord = documents[index];
    if (!documentRecord || !window.confirm(`Remove ${documentRecord.name || 'this document'} from the tenant draft?`)) return;
    documents.splice(index, 1);
    renderWizardDocuments();
    ZentridLayout.toast('Document removed');
  });

  const docUpload = tenantElement<HTMLInputElement>('tenantDocUpload');
  if (docUpload) docUpload.onchange = () => {
    const files = Array.from(docUpload.files || []);
    files.forEach(file => (window.tenantWizardDocuments as ZentridTenantDocument[]).push({ name:file.name, type:file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Uploaded', expiry:'Not set', file:file.name }));
    renderWizardDocuments();
    ZentridLayout.toast('Tenant documents selected');
  };

  rails.forEach(rail => rail.onclick = () => {
    const target = Number(rail.dataset.step || 0);
    if (target > step && !validateBeforeStep(target)) return;
    show(target);
  });
  previousButton.onclick = () => show(step - 1);
  nextButton.onclick = event => {
    event.preventDefault();
    if (!validateStep(step)) return;
    show(step + 1);
  };

  const filter = () => {
    const query = tenantSearch.value.toLowerCase();
    const status = tenantStatus.value;
    const rows = getTenants().filter(tenant => (status === 'All Statuses' || tenant.status === status) && `${tenant.name} ${tenant.legal} ${tenant.country} ${tenant.tax} ${tenant.registration}`.toLowerCase().includes(query));
    tenantTable.innerHTML = tenantRows(rows);
  };
  tenantSearch.oninput = () => ZentridRuntimeStability.debounce('registry:tenants:search', filter, 220);
  tenantStatus.onchange = filter;
  tenantTable.onclick = event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const row = target.closest<HTMLElement>('.data-row');
    const id = row?.dataset.id;
    if (!id) return;
    const action = target.closest<HTMLElement>('button')?.dataset.action;
    localStorage.setItem('zentrid_selected_tenant', id);
    const tenant = getTenants().find(item => item.id === id);
    if (action === 'integrate' && tenant) {
      localStorage.setItem('zentrid_integration_tenant', tenant.name);
      location.href = 'integrations.html';
    } else {
      if (action === 'edit') localStorage.setItem('zentrid_tenant_detail_edit', 'general');
      location.href = 'tenant-detail.html';
    }
  };

  tenantForm.onsubmit = event => {
    event.preventDefault();
    if (!ZentridActionPermissions.guard({ action:'create', resource:'tenant' })) return;
    if (isSaving) return;
    for (let index = 0; index < steps.length; index += 1) {
      if (!validateStep(index, index === 0)) return;
    }
    const formData = new FormData(tenantForm);
    const name = tenantFormText(formData, 'name').trim();
    const legal = tenantFormText(formData, 'legal').trim();
    const tax = tenantFormText(formData, 'tax').trim();
    const contacts = window.tenantWizardContacts as ZentridTenantContact[];
    const documents = window.tenantWizardDocuments as ZentridTenantDocument[];
    const countryKey = tenantFormText(formData, 'country', 'Armenia');
    const tenant: ZentridTenantRecord = {
      dataOrigin:'local',
      id:genId(), entityType:tenantFormText(formData, 'entityType', 'Legal Entity'), code:genCode(), name, legal,
      trade:tenantFormText(formData, 'trade', name), displayName:tenantFormText(formData, 'displayName', tenantFormText(formData, 'trade', name)),
      registration:tenantFormText(formData, 'registration', 'Pending'), tax, status:tenantFormText(formData, 'status', 'Inactive'), types:[tenantFormText(formData, 'type', 'Owner')],
      country:tenantFormText(formData, 'legalCountry', countryKey), profileCountry:countryKey, region:tenantFormText(formData, 'region', '—'), city:tenantFormText(formData, 'city', '—'), address:tenantFormText(formData, 'address', '—'), building:tenantFormText(formData, 'building'), postal:tenantFormText(formData, 'postal'),
      businessSame:Boolean(formData.get('businessSame')), businessCountry:tenantFormText(formData, 'businessCountry', countryKey), businessRegion:tenantFormText(formData, 'businessRegion', tenantFormText(formData, 'region')), businessCity:tenantFormText(formData, 'businessCity', tenantFormText(formData, 'city')), businessAddress:tenantFormText(formData, 'businessAddress', tenantFormText(formData, 'address')), businessPostal:tenantFormText(formData, 'businessPostal', tenantFormText(formData, 'postal')),
      plants:0, devices:0, users:0, revenue:'—', health:'Attention Required', integrations:0, alerts:0,
      industry:tenantFormText(formData, 'industry', 'Solar Energy'), businessCategory:tenantFormText(formData, 'businessCategory', 'Enterprise'), parentCompany:tenantFormText(formData, 'parentCompany', 'None'), employees:tenantFormText(formData, 'employees', '—'), annualRevenue:tenantFormText(formData, 'annualRevenue', '—'), webplant:tenantFormText(formData, 'webplant', '—'),
      category:tenantFormText(formData, 'category', 'Standard'), tier:tenantFormText(formData, 'tier', 'Bronze'), priority:tenantFormText(formData, 'priority', 'Medium'), risk:tenantFormText(formData, 'risk', 'Low'), source:tenantFormText(formData, 'source', 'Direct'), account:tenantFormText(formData, 'account', 'Unassigned'),
      language:tenantFormText(formData, 'language', 'English'), timezone:tenantFormText(formData, 'timezone', tenantCountryRules[countryKey]?.timezone || defaultTenantCountryRule().timezone), channel:tenantFormText(formData, 'channel', 'Email'), businessHours:tenantFormText(formData, 'businessHours', '09:00–18:00'),
      platformNotifications:tenantFormText(formData, 'platformNotifications', 'Yes'), serviceNotifications:tenantFormText(formData, 'serviceNotifications', 'Yes'), invoiceNotifications:tenantFormText(formData, 'invoiceNotifications', 'Yes'), securityNotifications:tenantFormText(formData, 'securityNotifications', 'Yes'), notificationRecipients:tenantFormText(formData, 'notificationRecipients', 'Primary'),
      dpa:tenantFormText(formData, 'dpa', 'Not Signed'), nda:tenantFormText(formData, 'nda', 'Not Signed'), compliance:tenantFormText(formData, 'compliance', 'Pending'), confidentiality:tenantFormText(formData, 'confidentiality', 'Standard'), controllerType:tenantFormText(formData, 'controllerType', 'Controller'), consent:tenantFormText(formData, 'consent', 'Active'), consentExpiry:tenantFormText(formData, 'consentExpiry'),
      setup:documents.length ? 92 : 86, contacts:[...contacts], documents:[...documents],
      notes:{ general:tenantFormText(formData, 'general_information_notes'), address:tenantFormText(formData, 'address_information_notes'), contacts:tenantFormText(formData, 'contact_persons_notes'), classification:tenantFormText(formData, 'tenant_classification_notes'), communication:tenantFormText(formData, 'communication_preferences_notes'), legal:tenantFormText(formData, 'legal_compliance_notes') },
      created:new Date().toISOString().slice(0,10), updated:new Date().toISOString().slice(0,10)
    };
    isSaving = true;
    ZentridFormUX.setBusy(saveButton, true, 'Creating Tenant…');
    try {
      if (window.ZentridLocalStore) ZentridLocalStore.addTenant(tenant);
      else { const rows = getTenants(); rows.unshift(tenant); saveTenants(rows); }
      localStorage.setItem('zentrid_selected_tenant', tenant.id);
      initialDraftSnapshot = draftSnapshot();
      window.ZentridFormReadiness?.markCommitted(tenantForm);
      ZentridLayout.toast('Tenant created. Opening Tenant Detail.');
      window.setTimeout(() => { location.href = 'tenant-detail.html'; }, 450);
    } catch (error) {
      isSaving = false;
      ZentridFormUX.setBusy(saveButton, false);
      ZentridFormUX.renderSummary(validationSummary, [{ message:'Unable to save the tenant locally. Review browser storage and try again.' }], 'Tenant was not created');
      validationSummary.focus();
    }
  };

  ZentridFormUX.bindClearOnInput(tenantForm, validationSummary);
  updateCountryRules();
  toggleBusiness();
  show(0);
}


function renderTenantDetail(){
  const c=selectedTenant();
  const lifecycle = window.ZentridTenantLifecycle?.render(c) || '';
  const canEdit = tenantDetailCanEdit(c, 'general');
  return `<section class="page-hero"><div><p class="eyebrow">Tenant Detail · ${tenantEscapeHtml(c.entityType || 'Legal Entity')} ${ZentridDataSource.badge(c, 'tenant', true)}</p><h1 id="tenantDetailHeroName">${tenantEscapeHtml(c.name)}</h1><p class="muted" id="tenantDetailHeroMeta">${tenantEscapeHtml(c.legal)} · ${tenantEscapeHtml(c.country)}, ${tenantEscapeHtml(c.city)} · ${tenantEscapeHtml(c.code)}</p></div><div class="tenant-hero-actions-v111"><button class="freshness-card" id="connectFirstIntegration" type="button" data-permission-action="create" data-permission-resource="integration"><span class="pulse"></span><div><strong>Connect First Integration</strong><small>Vendor → credentials → discovery</small></div></button>${lifecycle}</div></section>
  ${renderTenantDetailControls(c)}
  <section class="kpi-grid detail-kpis"><article class="kpi-card"><span>Status</span><strong id="tenantDetailStatusKpi">${tenantEscapeHtml(tenantStatusValue(c))}</strong><small id="tenantDetailComplianceKpi">${tenantEscapeHtml(tenantComplianceValue(c))}</small></article><article class="kpi-card"><span>Setup Progress</span><strong>${Number(c.setup || 0)}%</strong><small>6 documented areas</small></article><article class="kpi-card"><span>Country</span><strong id="tenantDetailCountryKpi">${tenantEscapeHtml(c.country)}</strong><small id="tenantDetailRegionKpi">${tenantEscapeHtml(c.region || c.city)}</small></article><article class="kpi-card"><span>Entity Type</span><strong id="tenantDetailEntityKpi">${tenantEscapeHtml(c.entityType || 'Legal Entity')}</strong><small id="tenantDetailTypesKpi">${tenantEscapeHtml(Array.isArray(c.types) ? c.types.join(', ') : '')}</small></article><article class="kpi-card"><span>Contacts</span><strong id="tenantDetailContactCountKpi">${(c.contacts||[]).length}</strong><small>tenant records</small></article><article class="kpi-card"><span>Managed Plants</span><strong>${tenantAssignedPlants(c).length}</strong><small>Tenant → Client → Plant hierarchy</small></article><article class="kpi-card"><span>Risk</span><strong id="tenantDetailRiskKpi">${tenantEscapeHtml(c.risk || '—')}</strong><small id="tenantDetailPriorityKpi">${tenantEscapeHtml(c.priority || '—')} priority</small></article></section>
  <section class="client-layout-v17 detail-layout-standard">
    <aside class="glass-card client-side-card-v17" aria-label="Tenant detail sections">
      <h3>Tenant Navigation</h3>
      <button class="active" data-tenant-tab="general" aria-current="page">General Information</button>
      <button data-tenant-tab="address">Address Information</button>
      <button data-tenant-tab="contacts">Contact Persons</button>
      <button data-tenant-tab="classification">Tenant Classification</button>
      <button data-tenant-tab="communication">Communication Preferences</button>
      <button data-tenant-tab="legal">Legal & Compliance</button>
      <button data-tenant-tab="plants">Managed Plants</button>
    </aside>
    <section class="glass-card client-main-card-v17">
      <div class="detail-content-head-v32"><div><h2 id="tenantDetailTitle">General Information</h2><p class="muted">Tenant governance data uses source-aware editing and lifecycle-safe status controls.</p></div><div class="detail-tab-actions"><button id="editTenantTab" class="small-btn primary" type="button" data-permission-action="edit" data-permission-resource="tenant" data-permission-status="${tenantEscapeAttr(tenantStatusValue(c))}" data-permission-origin="${tenantEscapeAttr(tenantDetailOrigin(c))}" data-permission-update-available="false" data-permission-local-override="true" data-permission-base-disabled="${canEdit ? 'false' : 'true'}" ${canEdit?'':'disabled'}>Edit</button><button id="cancelTenantEdit" class="small-btn ghost hidden" type="button">Cancel</button><button id="saveTenantEdit" class="small-btn success hidden" type="button" data-permission-action="edit" data-permission-resource="tenant" data-permission-status="${tenantEscapeAttr(tenantStatusValue(c))}" data-permission-origin="${tenantEscapeAttr(tenantDetailOrigin(c))}" data-permission-update-available="false" data-permission-local-override="true">Save Changes</button></div></div>
      <div class="form-validation-summary tenant-detail-summary-v117" id="tenantDetailEditSummary" role="alert" aria-live="assertive" tabindex="-1" hidden></div>
      <div id="detailContent">${detailTab(c,'general')}</div>
    </section>
  </section>`;
}

function tenantTabLabel(tab: ZentridTenantTabKey): string {
  return ({general:'General Information',address:'Address Information',contacts:'Contact Persons',classification:'Tenant Classification',communication:'Communication Preferences',legal:'Legal & Compliance',plants:'Managed Plants'})[tab] || 'Tenant Detail';
}
function info(items: ZentridTenantInfoItem[]): string { return tenantInfo(items, tenantDetailEditMode); }
function tenantContactTable(c: ZentridTenantRecord, editable = tenantDetailEditMode): string {
  const actionHead = editable ? '<span>Actions</span>' : '';
  const head = `<div class="data-head"><span>First Name</span><span>Last Name</span><span>Position</span><span>Department</span><span>Contact Role</span><span>Email</span><span>Mobile Phone</span><span>Office Phone</span><span>Preferred Language</span><span>Preferred Contact Method</span><span>Active</span>${actionHead}</div>`;
  const rows = (c.contacts||[]).map((x,i)=>`<div class="data-row tenant-contact-wide-row" data-tenant-contact-row="${i}">
    <div>${editable ? tenantEditableControl(`contacts::${i}::first`, x.first || (x.full||'').split(' ')[0] || '', 'First Name') : `<strong>${tenantEscapeHtml(x.first || (x.full||'').split(' ')[0] || '—')}</strong>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::last`, x.last || (x.full||'').split(' ').slice(1).join(' ') || '', 'Last Name') : `<span>${tenantEscapeHtml(x.last || (x.full||'').split(' ').slice(1).join(' ') || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::position`, x.position, 'Position') : `<span>${tenantEscapeHtml(x.position || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::department`, x.department, 'Department') : `<span>${tenantEscapeHtml(x.department || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::role`, x.role, 'Contact Role') : `<span>${tenantEscapeHtml(x.role || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::email`, x.email, 'Email') : `<span>${tenantEscapeHtml(x.email || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::mobile`, x.mobile||x.phone, 'Mobile Phone') : `<span>${tenantEscapeHtml(x.mobile||x.phone || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::office`, x.office, 'Office Phone') : `<span>${tenantEscapeHtml(x.office || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::language`, x.language, 'Preferred Language') : `<span>${tenantEscapeHtml(x.language || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::method`, x.method, 'Preferred Contact Method') : `<span>${tenantEscapeHtml(x.method || '—')}</span>`}</div>
    <div>${editable ? tenantEditableControl(`contacts::${i}::active`, x.active || 'Yes', 'Active') : `<span>${tenantEscapeHtml(x.active || 'Yes')}</span>`}</div>
    ${editable ? `<div class="mini-row-actions"><button class="danger-action" type="button" data-remove-tenant-contact="${i}" aria-label="Remove contact ${i + 1}">Remove</button></div>` : ''}
  </div>`).join('');
  return `<div class="tenant-detail-table-head-v117"><div><h3>Contact Persons</h3><p class="muted">At least one active Primary contact is required before local save.</p></div>${editable ? '<button class="small-btn primary" type="button" data-add-tenant-contact>Add Contact</button>' : ''}</div><div class="data-table tenant-contact-table wide-scroll-table ${editable ? 'editing-grid tenant-contact-actions-v117' : ''}">${head}${rows || '<div class="empty-state">No contact persons added.</div>'}</div>${tenantNotesBlock(c,'contacts','Notes for Contact Person', editable)}`;
}
function tenantDocumentsTable(c: ZentridTenantRecord, editable = tenantDetailEditMode): string {
  return `<div class="tenant-detail-table-head-v117"><div><h3>Tenant Documents</h3><p class="muted">Document rows are local metadata until a document API is available.</p></div>${editable ? '<button class="small-btn primary" type="button" data-add-tenant-document>Add Document</button>' : ''}</div><div class="data-table compact-table tenant-document-table ${editable ? 'editing-grid tenant-document-actions-v117' : ''}"><div class="data-head"><span>Document Name</span><span>Type</span><span>Expiry Date</span><span>Document File</span>${editable ? '<span>Actions</span>' : ''}</div>${(c.documents||[]).map((d,i)=>`<div class="data-row" data-tenant-document-row="${i}"><div>${editable ? tenantEditableControl(`documents::${i}::name`, d.name, 'Document Name') : `<strong>${tenantEscapeHtml(d.name || '—')}</strong>`}</div><div>${editable ? tenantEditableControl(`documents::${i}::type`, d.type, 'Type') : `<span>${tenantEscapeHtml(d.type || '—')}</span>`}</div><div>${editable ? tenantEditableControl(`documents::${i}::expiry`, d.expiry, 'Expiry Date') : `<span>${tenantEscapeHtml(d.expiry || '—')}</span>`}</div><div>${editable ? tenantEditableControl(`documents::${i}::file`, d.file || d.name, 'Document File') : `<span>${tenantEscapeHtml(d.file || d.name || '—')}</span>`}</div>${editable ? `<div class="mini-row-actions"><button class="danger-action" type="button" data-remove-tenant-document="${i}" aria-label="Remove document ${i + 1}">Remove</button></div>` : ''}</div>`).join('') || '<div class="empty-state">No documents attached.</div>'}</div>`;
}
function tenantSectionContext(c: ZentridTenantRecord, tab: ZentridTenantTabKey, editable = tenantDetailEditMode): string {
  const origin = tenantDetailOrigin(c);
  const mode = editable ? 'Local edit draft' : tenantDetailIsArchived(c) ? 'Archived read-only' : tenantDetailBackendManaged(c) ? 'Live data · local override available' : 'View mode';
  return `<div class="tenant-section-context-v117"><div><span>${tenantEscapeHtml(tenantTabLabel(tab))}</span>${ZentridDataSource.badge(c, 'tenant', true)}</div><small>${tenantEscapeHtml(tenantDetailFreshness(c))}</small><strong>${tenantEscapeHtml(mode)}</strong></div>`;
}
function detailTab(c: ZentridTenantRecord, t: ZentridTenantTabKey, editable = tenantDetailEditMode): string {
  const context = tenantSectionContext(c, t, editable);
  if(t==='address') return `${context}${tenantInfo([['Legal Country',c.country,'country'],['Legal State / Region',c.region,'region'],['Legal City',c.city,'city'],['Legal Street Address',c.address,'address'],['Legal Building Number',c.building,'building'],['Legal Postal Code',c.postal,'postal'],['Business Address Same as Legal',c.businessSame?'Yes':'No','businessSame'],['Business Address Country',c.businessSame?c.country:c.businessCountry,'businessCountry'],['Business Address State / Region',c.businessSame?c.region:c.businessRegion,'businessRegion'],['Business Address City',c.businessSame?c.city:c.businessCity,'businessCity'],['Business Address Street Address',c.businessSame?c.address:c.businessAddress,'businessAddress'],['Business Address Postal Code',c.businessSame?c.postal:c.businessPostal,'businessPostal']], editable)}${tenantNotesBlock(c,'address','Notes for Address Information', editable)}`;
  if(t==='contacts') return `${context}${tenantContactTable(c, editable)}`;
  if(t==='plants') {
    const preferredClient = tenantClientRecord(c);
    const createUrl = `plants.html?view=solar&create=1&tenant=${encodeURIComponent(String(c.name || ''))}${preferredClient ? `&client=${encodeURIComponent(String(preferredClient.id || ''))}&clientName=${encodeURIComponent(String(preferredClient.name || ''))}&country=${encodeURIComponent(String(preferredClient.country || c.country || ''))}&region=${encodeURIComponent(String(preferredClient.region || c.region || ''))}&city=${encodeURIComponent(String(preferredClient.city || c.city || ''))}&timezone=${encodeURIComponent(String(preferredClient.timezone || c.timezone || 'Asia/Yerevan'))}&contact=${encodeURIComponent(String(preferredClient.primaryContact || preferredClient.contactEmail || ''))}` : ''}`;
    return `${context}<div class="section-title-v17 tenant-assigned-head-v28"><div><h2>Managed Plants</h2><p class="muted">Plant assignments are managed from the global vendor-driven Plant workspace.</p></div><div class="section-actions-v28"><button class="small-btn" type="button" onclick="location.href='plants.html?view=solar'">Open Plants</button><button class="small-btn primary" type="button" onclick="location.href='${createUrl}'">Create Plant</button></div></div>${tenantPlantSummaryCards(c)}`;
  }
  if(t==='classification') return `${context}${tenantInfo([['Tenant Category',c.category,'category'],['Account Tier',c.tier,'tier'],['Tenant Priority',c.priority,'priority'],['Risk Category',c.risk,'risk'],['Acquisition Source',c.source,'source']], editable)}${tenantNotesBlock(c,'classification','Notes for Tenant Classification', editable)}`;
  if(t==='communication') return `${context}${tenantInfo([['Preferred Language',c.language,'language'],['Preferred Time Zone',c.timezone,'timezone'],['Preferred Communication Channel',c.channel,'channel'],['Business Hours',c.businessHours,'businessHours'],['Receive Platform Notifications',c.platformNotifications,'platformNotifications'],['Receive Service Notifications',c.serviceNotifications,'serviceNotifications'],['Receive Invoice Notifications',c.invoiceNotifications,'invoiceNotifications'],['Receive Security Notifications',c.securityNotifications,'securityNotifications'],['Notification Recipients',c.notificationRecipients,'notificationRecipients']], editable)}${tenantNotesBlock(c,'communication','Notes for Communication Preferences', editable)}`;
  if(t==='legal') return `${context}${tenantInfo([['Data Processing Agreement',c.dpa,'dpa'],['NDA Status',c.nda,'nda'],['Compliance Status',tenantComplianceValue(c),'compliance'],['Confidentiality Level',c.confidentiality,'confidentiality'],['Data Controller Type',c.controllerType,'controllerType'],['Consent Status',c.consent,'consent'],['Consent Expiry Date',c.consentExpiry,'consentExpiry']], editable)}${tenantNotesBlock(c,'legal','Notes for Legal & Compliance', editable)}${tenantDocumentsTable(c, editable)}`;
  const isIndividual=(c.entityType||'Legal Entity')==='Individual';
  const base: ZentridTenantInfoItem[]=[['Tenant ID',c.id],['Tenant Code',c.code],['Entity Type',c.entityType||'Legal Entity','entityType'],[isIndividual?'Tenant Display Name':'Tenant Name',c.name,'name'],[isIndividual?'Full Legal Name':'Legal Name',c.legal,'legal'],[isIndividual?'Individual Display Name / Alias':'Trade Name',c.trade,'trade'],['Display Name',c.displayName || c.trade || c.name,'displayName'],[isIndividual?'Personal ID / Passport Number':'Registration Number',c.registration,'registration'],[isIndividual?'Tax ID / SSN / ITIN':'Tax ID / VAT Number',c.tax,'tax'],['Tenant Status',tenantStatusValue(c)],['Tenant Type',(Array.isArray(c.types) ? c.types : []).join(', '),'types'],['Account Manager',c.account,'account']];
  const org: ZentridTenantInfoItem[]=[['Industry Sector',c.industry,'industry'],['Business Category',c.businessCategory,'businessCategory'],['Parent Company',c.parentCompany,'parentCompany'],['Number of Employees',c.employees,'employees'],['Annual Revenue Range',c.annualRevenue,'annualRevenue'],['Website',c.webplant,'webplant'],['Creation Date',c.created,'created'],['Modification Date',c.updated,'updated']];
  return `${context}${tenantInfo(isIndividual?base.concat([['Creation Date',c.created,'created'],['Modification Date',c.updated,'updated']] as ZentridTenantInfoItem[]):base.concat(org), editable)}${tenantNotesBlock(c,'general','Notes for General Information', editable)}`;
}
function wireTenantDetail(): void {
  const tenant = selectedTenant();
  const requestedEditTab = localStorage.getItem('zentrid_tenant_detail_edit');
  if (requestedEditTab) localStorage.removeItem('zentrid_tenant_detail_edit');
  window.ZentridTenantLifecycle?.wire(tenant);
  updateTenantDetailEditButtons();
  document.getElementById('connectFirstIntegration')?.addEventListener('click', () => {
    if (!tenantDetailConfirmDiscard('Discard unsaved tenant changes and open Integrations?')) return;
    localStorage.setItem('zentrid_integration_tenant', tenant.name);
    location.href = 'integrations.html';
  });
  document.querySelectorAll<HTMLElement>('[data-tenant-tab]').forEach(button => button.addEventListener('click', () => {
    const nextTab = button.dataset.tenantTab || 'general';
    if (tenantDetailEditMode && !tenantDetailConfirmDiscard('Discard unsaved changes and open another tenant section?')) return;
    tenantDetailEditMode = false;
    tenantDetailDraft = null;
    tenantDetailEditSnapshot = '';
    document.querySelectorAll<HTMLElement>('[data-tenant-tab]').forEach(item => {
      const active = item.dataset.tenantTab === nextTab;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    renderTenantDetailCurrentTab();
    updateTenantDetailEditButtons();
    const summary = document.getElementById('tenantDetailEditSummary');
    if (summary) { summary.hidden = true; summary.innerHTML = ''; }
    clearTenantDetailFeedback();
  }));
  document.getElementById('editTenantTab')?.addEventListener('click', () => setTenantDetailEditMode(true));
  document.getElementById('cancelTenantEdit')?.addEventListener('click', () => setTenantDetailEditMode(false));
  document.getElementById('saveTenantEdit')?.addEventListener('click', saveTenantDetailEdits);
  const detail = document.getElementById('detailContent');
  detail?.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-add-tenant-contact]')) { addTenantDetailContact(); return; }
    const removeContact = target.closest<HTMLElement>('[data-remove-tenant-contact]');
    if (removeContact) { removeTenantDetailContact(Number(removeContact.dataset.removeTenantContact)); return; }
    if (target.closest('[data-add-tenant-document]')) { addTenantDetailDocument(); return; }
    const removeDocument = target.closest<HTMLElement>('[data-remove-tenant-document]');
    if (removeDocument) { removeTenantDetailDocument(Number(removeDocument.dataset.removeTenantDocument)); return; }
    if (target.closest('[data-open-tenant-plant-builder]')) { openTenantPlantBuilder(); return; }
    if (target.closest('[data-close-tenant-plant-builder]')) { closeTenantPlantBuilder(); return; }
    if (target.closest('[data-builder-next]')) { setTenantBuilderStep(tenantPlantBuilderStepV28 + 1); return; }
    if (target.closest('[data-builder-prev]')) { setTenantBuilderStep(tenantPlantBuilderStepV28 - 1); return; }
    const stepButton = target.closest<HTMLElement>('[data-builder-step]');
    if (stepButton) { setTenantBuilderStep(Number(stepButton.dataset.builderStep || 1)); return; }
    if (target.closest('[data-add-builder-device]')) {
      const item = builderSelectedCatalogItem();
      if (!item) { ZentridLayout.toast('Select a compatible model first'); return; }
      tenantPlantBuilderDevicesV28.push({ ...item, role: item.kind === 'Meter' ? 'Grid / POI' : item.kind === 'BESS' || item.kind === 'PCS' ? 'Linked to BESS' : item.kind === 'Weather Station' ? 'Weather context' : 'Plant-level device' });
      renderTenantBuilderDeviceRows();
      return;
    }
    const removeButton = target.closest<HTMLElement>('[data-remove-builder-device]');
    if (removeButton) { tenantPlantBuilderDevicesV28.splice(Number(removeButton.dataset.removeBuilderDevice || -1), 1); renderTenantBuilderDeviceRows(); return; }
    if (target.closest('[data-create-tenant-plant]')) { createTenantPlantFromBuilder(); return; }
    const plantTarget = target.closest<HTMLElement>('[data-plant]');
    const plantId = plantTarget?.dataset.plant;
    if (!plantId || typeof ZentridClientModel === 'undefined') return;
    if (!tenantDetailConfirmDiscard('Discard unsaved tenant changes and open Plant Detail?')) return;
    const clientId = plantTarget.dataset.client || tenantClientRecord(selectedTenant())?.id;
    if (clientId) ZentridClientModel.selectClient(clientId);
    ZentridClientModel.selectPlant(plantId);
    location.href = 'plant-detail.html';
  });
  detail?.addEventListener('change', event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    const summary = tenantElement('tenantDetailEditSummary');
    if (tenantDetailEditMode) ZentridFormUX.clearErrors(detail, summary);
    if (target.id === 'builderDeviceKindV28') {
      const model = document.getElementById('builderDeviceModelV28');
      if (model) model.innerHTML = tenantPlantBuilderModelOptions(target.value);
      renderTenantBuilderCompatibilityHint();
      return;
    }
    const field = target.dataset.builderField;
    const row = target.closest<HTMLElement>('[data-builder-device-row]');
    const index = Number(row?.dataset.builderDeviceRow);
    const device = tenantPlantBuilderDevicesV28[index];
    if (field && device) { device[field] = target.value; renderTenantBuilderReview(); }
  });
  detail?.addEventListener('input', event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
    const summary = tenantElement('tenantDetailEditSummary');
    if (tenantDetailEditMode) ZentridFormUX.clearErrors(detail, summary);
    const field = target.dataset.builderField;
    const row = target.closest<HTMLElement>('[data-builder-device-row]');
    const index = Number(row?.dataset.builderDeviceRow);
    const device = tenantPlantBuilderDevicesV28[index];
    if (field && device) device[field] = target.value;
    if (target.closest('#tenantPlantBuilderFormV28')) renderTenantBuilderReview();
  });
  if (requestedEditTab === 'general' && tenantDetailCanEdit(tenant, 'general')) setTenantDetailEditMode(true);
  ZentridEntityDetailUX.bindBeforeUnload('tenant-detail', tenantDetailHasUnsavedEdits);
}


