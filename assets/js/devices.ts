type ZentridDeviceStatusTone = "success" | "warning" | "danger" | "info" | "neutral" | string;

interface ZentridDeviceRecord {
  [key: string]: string | number | boolean | null | undefined;
  id: string;
  externalId?: string;
  name: string;
  type: string;
  subtype?: string;
  manufacturer?: string;
  model?: string;
  serial?: string;
  serialNumber?: string;
  firmware?: string;
  protocol?: string;
  ip?: string;
  mac?: string;
  plantId?: string;
  plant?: string;
  tenant?: string;
  vendor?: string;
  integration?: string;
  status?: string;
  lifecycle?: string;
  capacity?: string;
  installation?: string;
  installDate?: string;
  warranty?: string;
  lastSeen?: string;
  alerts?: number | string;
  power?: string;
  voltage?: string;
  current?: string;
  temperature?: string;
  pr?: string;
  sourceStatus?: string;
  parent?: string;
  children?: string;
  location?: string;
}

interface ZentridDevicePagerState {
  page: number;
  size: number;
}

interface ZentridDevicePageSlice<T> {
  total: number;
  pages: number;
  page: number;
  start: number;
  end: number;
  rows: T[];
}

type ZentridDeviceCardItem = unknown[];
type ZentridDeviceTab = "overview" | "master" | "topology" | "telemetry" | "source" | "operating" | "configuration" | "alerts" | "control" | string | undefined;

interface ZentridDevicePrimaryMetric {
  label: string;
  value: unknown;
  hint: string;
}

declare const ZentridLocalStore: ZentridLocalStoreApi;
declare function plants(): Array<Record<string, unknown>>;

const demoDevices: ZentridDeviceRecord[] = [];
function saveDevices(_list: ZentridDeviceRecord[]): void { /* API-only: use a confirmed backend mutation. */ }
function deviceStatusCls(v: unknown): ZentridDeviceStatusTone { const text = String(v).toLowerCase(); if(text.includes('offline')||text.includes('fault')) return 'danger'; if(text.includes('warning')||text.includes('delayed')) return 'warning'; return 'success'; }
function deviceStatusPill(d: ZentridDeviceRecord): string { return `<span class="badge ${deviceStatusCls(d.status)}">${d.status || 'Unknown'}</span>`; }
function selectedDevice(): ZentridDeviceRecord { const list=devices(); const id=new URLSearchParams(location.search).get('id') || localStorage.getItem('zentrid_selected_device'); const snapshot=window.ZentridLiveSelection?.readDevice?.(id) as ZentridDeviceRecord | null | undefined; return list.find(d=>d.id===id || d.externalId===id || d.serial===id) ?? snapshot ?? (!id ? list[0] : undefined) ?? ({} as ZentridDeviceRecord); }
function wireDevices(): void {
  const table = document.getElementById('deviceTable') as HTMLElement;
  const search = document.getElementById('deviceSearch') as HTMLInputElement;
  const type = document.getElementById('deviceTypeFilter') as HTMLSelectElement;
  const status = document.getElementById('deviceStatusFilter') as HTMLSelectElement;
  const plantFilter=()=>localStorage.getItem('zentrid_device_filter_plant') || '';
  function baseList(){ const pf=plantFilter(); return pf ? devices().filter(d=>d.plantId===pf) : devices(); }
  function apply(resetPage = true){
    if (resetPage && !window.ZentridRegistryQuery?.pagination('devices')) ZentridDevicePager.page = 1;
    const q=(search.value||'').toLowerCase();
    let list=baseList().filter(d=>[d.name,d.id,d.serial,d.plant,d.tenant,d.vendor,d.type,d.status,d.model].join(' ').toLowerCase().includes(q));
    if(type.value!=='All Types') list=list.filter(d=>d.type===type.value);
    if(status.value!=='All Statuses') list=list.filter(d=>d.status===status.value);
    ZentridRuntimeStability.replaceHtml(table, deviceRows(list));
    window.ZentridRegistryQuery?.update('devices', { search: q || null, deviceType: type.value === 'All Types' ? null : type.value, deviceStatus: status.value === 'All Statuses' ? null : status.value }, { replace: true, emit: false });
    const scope = document.getElementById('deviceFilterScopeV126');
    if (scope) scope.innerHTML = window.ZentridRegistryQuery?.filterScopeHtml('devices') || '';
    bindRows();
  }
  function bindRows(){ table.querySelectorAll('.data-row').forEach(row=> row.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{ const id=row.dataset.id; const d=devices().find(x=>x.id===id); if(btn.dataset.action==='open' && id){ if (d && window.ZentridLiveSelection?.selectDevice) window.ZentridLiveSelection.selectDevice(d); else { localStorage.setItem('zentrid_selected_device', id); location.href='device-detail.html'; } } if(btn.dataset.action==='plant' && d?.plantId){ localStorage.setItem('zentrid_selected_plant', d.plantId); location.href='plant-detail.html'; } if(btn.dataset.action==='telemetry' && d){ localStorage.setItem('zentrid_telemetry_context', JSON.stringify({tenant:d.tenant, plant:d.plant, device:d.name, metric:'Current Power', range:localStorage.getItem('zentrid_time')||'Last 24h', layer:'Normalized'})); location.href='telemetry.html'; } if(btn.dataset.action==='alerts' && d){ localStorage.setItem('zentrid_alert_context', JSON.stringify({deviceId:d.id, plantId:d.plantId, tenant:d.tenant})); location.href='alerts.html'; } })); table.querySelectorAll('[data-device-page]').forEach(btn=>btn.onclick=()=>{ if (window.ZentridRegistryQuery?.pagination('devices')) return; ZentridDevicePager.page += btn.dataset.devicePage === 'next' ? 1 : -1; apply(false); }); }
  search?.addEventListener('input', () => ZentridRuntimeStability.debounce('registry:devices:search', () => apply(true), 220));
  [type,status].forEach(el=> el && el.addEventListener('change', ()=>apply(true)));
  bindRows();
  document.getElementById('clearPlantDeviceFilter')?.addEventListener('click',()=>{ localStorage.removeItem('zentrid_device_filter_plant'); location.reload(); });

  document.getElementById('openDeviceCreate')?.addEventListener('click',()=>{
    const select = document.getElementById('devicePlantSelect') as HTMLSelectElement | null;
    if (select) {
      let plantRows: Array<Record<string, unknown>> = [];
      try { plantRows = typeof plants === 'function' ? plants() : (window.ZentridLocalStore ? ZentridLocalStore.read(ZentridLocalStore.KEYS.plants, []) as Array<Record<string, unknown>> : JSON.parse(localStorage.getItem('zentrid_demo_plants') || '[]') as Array<Record<string, unknown>>); } catch(e) { plantRows = []; }
      const current = localStorage.getItem('zentrid_device_filter_plant') || '';
      select.innerHTML = plantRows.map(p => `<option value="${String(p.id || '')}" ${String(p.id || '')===current?'selected':''}>${String(p.name || p.id || 'Plant')} · ${String(p.tenant || p.operator || 'Tenant')}</option>`).join('') || '<option value="">No plant selected</option>';
    }
    document.getElementById('deviceCreateModal')?.classList.add('open');
  });
  const closeDeviceCreate = () => document.getElementById('deviceCreateModal')?.classList.remove('open');
  document.getElementById('closeDeviceCreate')?.addEventListener('click', closeDeviceCreate);
  document.getElementById('cancelDeviceCreate')?.addEventListener('click', closeDeviceCreate);
  document.getElementById('deviceCreateForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const field = (name: string, fallback = ''): string => String(fd.get(name) || fallback);
    let plant: Record<string, unknown> | undefined;
    try { plant = (typeof plants === 'function' ? plants() : []).find(p => String(p.id || '') === field('plantId')); } catch(err) {}
    const id = 'DEV-LOCAL-' + String(Date.now()).slice(-7);
    const device: ZentridDeviceRecord = {
      dataOrigin:'local',
      id,
      externalId:'LOCAL-STORAGE',
      name: field('name', id),
      type: field('type', 'Device'),
      subtype: field('type', 'Device'),
      manufacturer: field('vendor', 'Manual'),
      model: field('model', 'Manual Model'),
      serial: field('serial', id),
      firmware: field('firmware', '—'),
      ip:'—', mac:'—',
      plantId: field('plantId'),
      plant: String(plant?.name || 'Local Plant'),
      tenant: String(plant?.tenant || plant?.operator || 'Tenant workspace'),
      vendor: field('vendor', 'Manual'),
      integration:'Manual / Local storage',
      status: field('status', 'Online'),
      lifecycle:'Active',
      capacity: field('capacity', '—'),
      installation: new Date().toISOString().slice(0,10),
      warranty:'—',
      lastSeen:'Local draft',
      alerts:0,
      sourceStatus:'Local draft',
      parent: field('location', 'Plant level'),
      children:'No child objects yet'
    };
    if (window.ZentridLocalStore) ZentridLocalStore.addDevice(device);
    else { const rows = devices(); rows.unshift(device); saveDevices(rows); }
    localStorage.setItem('zentrid_selected_device', id);
    window.ZentridFormReadiness?.markCommitted(e.currentTarget as HTMLFormElement);
    ZentridLayout.toast('Device saved locally');
    closeDeviceCreate();
    table.innerHTML = deviceRows(baseList());
    bindRows();
  });

  document.getElementById('openDeviceSource')?.addEventListener('click',()=>document.getElementById('deviceSourceDrawer')?.classList.add('open'));
  document.getElementById('closeDeviceSource')?.addEventListener('click',()=>document.getElementById('deviceSourceDrawer')?.classList.remove('open'));
}
function devicePortalStatusTextV92(d: ZentridDeviceRecord): string {
  const s=String(d.status||'').toLowerCase();
  if(s.includes('offline')) return 'Not visible as healthy in client portal';
  if(s.includes('warning')) return 'Visible with warning note in client portal';
  return 'Visible as working in client portal';
}
function devicePassportPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Technical Passport</h2><p class="muted">Static device master data used by registry, support, warranty and replacement workflows.</p></div></div>
  <div class="device-passport-grid-v92">
    <article><span>Identity</span><strong>${d.name}</strong><small>${d.id} · ${d.externalId}</small></article>
    <article><span>Classification</span><strong>${d.type}</strong><small>${d.subtype}</small></article>
    <article><span>Manufacturer</span><strong>${d.manufacturer || d.vendor}</strong><small>${d.model}</small></article>
    <article><span>Serial Number</span><strong>${d.serial}</strong><small>Unique traceable device number</small></article>
    <article><span>Firmware / Protocol</span><strong>${d.firmware}</strong><small>${d.protocol || 'Protocol version: vendor default'}</small></article>
    <article><span>Rated Capacity</span><strong>${d.capacity}</strong><small>Technical passport value</small></article>
    <article><span>Network Type</span><strong>${d.ip && d.ip !== '—' ? 'LAN / WLAN' : 'Passive / field device'}</strong><small>IP ${d.ip || '—'} · MAC ${d.mac || '—'}</small></article>
    <article><span>Warranty</span><strong>${d.warranty}</strong><small>Installed ${d.installation}</small></article>
  </div>
  <div class="data-table compact-table device-passport-table-v92"><div class="data-head"><span>Parameter</span><span>Value</span><span>Used By</span></div>
    <div class="data-row"><div><strong>Rated Power / Capacity</strong></div><div><span>${d.capacity}</span></div><div><small>Reports · Device & Topology Registry · Lifecycle</small></div></div>
    <div class="data-row"><div><strong>Parent Relation</strong></div><div><span>${d.parent}</span></div><div><small>Topology · Plant Detail · Alerts</small></div></div>
    <div class="data-row"><div><strong>Child Objects</strong></div><div><span>${d.children}</span></div><div><small>Topology · Impact analysis</small></div></div>
  </div>`;
}
function deviceConnectivityFullPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Connectivity</h2><p class="muted">Communication, freshness and integration health for this device.</p></div></div>
  ${cardGrid([
    ['Online Status', d.status, devicePortalStatusTextV92(d)],
    ['Last Seen', d.lastSeen, 'Latest communication timestamp'],
    ['Signal Strength', d.signal || (d.status==='Offline' ? 'No signal' : 'Good'), 'Logger / network quality'],
    ['Data Freshness', d.status==='Offline' ? 'Stale' : d.status==='Warning' ? 'Delayed' : 'Fresh', 'Used by dashboards and alert logic'],
    ['Gateway / Logger', d.parent || 'Direct integration', 'Communication path'],
    ['Integration Status', d.sourceStatus || 'Mapped', d.integration]
  ], 'device-param-grid-v58')}
  <div class="device-chain-v92"><div><span>Device</span><strong>${d.name}</strong></div><i></i><div><span>Gateway / Parent</span><strong>${d.parent}</strong></div><i></i><div><span>Vendor Cloud</span><strong>${d.vendor}</strong></div><i></i><div><span>Zentrid Core</span><strong>${d.sourceStatus}</strong></div></div>`;
}
function telemetrySummaryPanelV92(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  const rows = key==='battery' ? [['SOC',deviceMetricValue(d,'soc')],['Charge Power','18 kW'],['Discharge Power',deviceMetricValue(d,'activePower')],['Battery Temperature',deviceMetricValue(d,'temperature')],['SOH',deviceMetricValue(d,'soh')],['Cycle Count','1,284']] :
    key==='meter' ? [['Import Today',deviceMetricValue(d,'todayImport')],['Export Today',deviceMetricValue(d,'todayExport')],['Total Import',deviceMetricValue(d,'import')],['Total Export',deviceMetricValue(d,'export')],['Voltage',deviceMetricValue(d,'voltage')],['Frequency',deviceMetricValue(d,'frequency')]] :
    key==='logger' ? [['Signal',deviceMetricValue(d,'signal')],['Data Lag',deviceMetricValue(d,'dataLag')],['Linked Devices',deviceMetricValue(d,'linked')],['WLAN',deviceMetricValue(d,'wlan')],['LAN IP',deviceMetricValue(d,'lanIp')],['Last Seen',d.lastSeen]] :
    [['Current Power',deviceMetricValue(d,'activePower')],['Daily Yield',deviceMetricValue(d,'dailyEnergy')],['Monthly Yield',d.monthlyYield || '4.82 MWh'],['Total Yield',deviceMetricValue(d,'totalYield')],['Temperature',deviceMetricValue(d,'temperature')],['Voltage / Current',`${deviceMetricValue(d,'lineVoltage')} · ${deviceMetricValue(d,'phaseCurrent')}`]];
  return `<div class="section-title-v17"><div><h2>Telemetry Summary</h2><p class="muted">Mock normalized telemetry values. This view prepares the UI before live API connection.</p></div></div>
  <div class="device-monitoring-grid-v58">${deviceMiniChart(key==='battery'?'Storage Power':'Power Trend')}${deviceMiniChart(key==='meter'?'Import / Export':'Energy Trend')}</div>
  ${cardGrid(rows, 'device-param-grid-v58')}`;
}
function lifecyclePanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Lifecycle / Replacement History</h2><p class="muted">Device lifecycle state, service events, replacement trace and warranty checkpoints.</p></div></div>
  <div class="device-lifecycle-summary-v92">
    <article><span>Lifecycle Status</span><strong>${d.lifecycle || 'Active'}</strong><small>Active device in operational registry</small></article>
    <article><span>Commissioning Date</span><strong>${d.installation}</strong><small>First operational binding</small></article>
    <article><span>Warranty Until</span><strong>${d.warranty}</strong><small>Warranty and service tracking</small></article>
  </div>
  <div class="timeline-v17 device-lifecycle-v92">
    <div><b>${d.installation}</b><span>Commissioned and linked to ${d.plant}</span></div>
    <div><b>2025</b><span>Firmware baseline confirmed · ${d.firmware}</span></div>
    <div><b>2026</b><span>Topology relation checked · ${d.parent}</span></div>
    <div><b>2026</b><span>${d.type==='Battery' ? 'Battery health inspection completed' : d.type==='Meter' ? 'Accounting point verification completed' : 'Communication module / device health verified'}</span></div>
    <div><b>Next</b><span>Warranty inspection and replacement eligibility review</span></div>
  </div>`;
}
function relatedObjectsPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Related Objects</h2><p class="muted">Shows where the device belongs in Zentrid and who is responsible for it.</p></div></div>
  <div class="device-related-flow-v92">
    <article><span>Tenant</span><strong>${d.tenant}</strong><small>Operational scope</small></article>
    <i></i>
    <article><span>Client</span><strong>Arpi Solar Group</strong><small>Portal visibility: ${devicePortalStatusTextV92(d)}</small></article>
    <i></i>
    <article><span>Plant</span><strong>${d.plant}</strong><small>${d.plantId}</small></article>
    <i></i>
    <article><span>Device</span><strong>${d.name}</strong><small>${d.type} · ${d.serial}</small></article>
  </div>
  <div class="data-table compact-table device-related-table-v92"><div class="data-head"><span>Relation</span><span>Object / Party</span><span>Responsibility</span><span>Action</span></div>
    <div class="data-row"><div><strong>Owner / Client</strong></div><div><span>Arpi Solar Group</span></div><div><small>Receives portal view, reports and commercial summary</small></div><div><button class="small-btn" type="button" onclick="location.href='client-detail.html'">Open</button></div></div>
    <div class="data-row"><div><strong>Parent Plant</strong></div><div><span>${d.plant}</span></div><div><small>Operational workspace and alerts context</small></div><div><button class="small-btn" type="button" onclick="localStorage.setItem('zentrid_selected_plant','${d.plantId}');location.href='plant-detail.html'">Open</button></div></div>
    <div class="data-row"><div><strong>Integration</strong></div><div><span>${d.integration}</span></div><div><small>Vendor source and sync traceability</small></div><div><button class="small-btn" type="button" onclick="location.href='integration-detail.html'">Open</button></div></div>
    <div class="data-row"><div><strong>Service Team</strong></div><div><span>Tenant Operations Team</span></div><div><small>Device support, replacement and field checks</small></div><div><button class="small-btn" type="button" onclick="location.href='tasks-work-orders.html'">Tasks</button></div></div>
  </div>`;
}
function deviceDocumentsPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Documents</h2><p class="muted">Device-level documents for support, warranty, commissioning and compliance.</p></div></div>
  <div class="document-grid-v17 device-documents-v92">
    <article><strong>Datasheet</strong><small>${d.manufacturer || d.vendor} ${d.model} · PDF · Valid</small><button class="small-btn" type="button">View</button></article>
    <article><strong>Warranty Certificate</strong><small>Until ${d.warranty} · Linked to serial ${d.serial}</small><button class="small-btn" type="button">View</button></article>
    <article><strong>Installation Report</strong><small>${d.installation} · Commissioning evidence</small><button class="small-btn" type="button">View</button></article>
    <article><strong>Service Report</strong><small>Last inspection · 2026 · No blocker</small><button class="small-btn" type="button">View</button></article>
    <article><strong>Firmware Snapshot</strong><small>${d.firmware} · Vendor source record</small><button class="small-btn" type="button">View</button></article>
    <article><strong>Replacement Record</strong><small>No active replacement case</small><button class="small-btn" type="button">Create</button></article>
  </div>`;
}
function deviceAuditPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Audit</h2><p class="muted">Immutable device change trail across registry, integration, topology and user actions.</p></div></div>
  <div class="timeline-v17 device-audit-v92">
    <div><b>Created</b><span>${d.installation} · Device record created for ${d.plant}</span></div>
    <div><b>Imported</b><span>Vendor source imported from ${d.integration}</span></div>
    <div><b>Mapped</b><span>External ID ${d.externalId} mapped to Zentrid ID ${d.id}</span></div>
    <div><b>Linked</b><span>Topology relation set: ${d.parent}</span></div>
    <div><b>Checked</b><span>Last communication checked · ${d.lastSeen}</span></div>
    <div><b>Modified</b><span>Updated by Global Admin · 15 Jun 2026</span></div>
  </div>`;
}

/* v59 Device Detail v2: type-driven workspace, topology and architecture */
const zentridExtraDeviceTypesV59: ZentridDeviceRecord[] = [];
const zentridDefaultDevicesV59: ZentridDeviceRecord[] = [...demoDevices, ...zentridExtraDeviceTypesV59];
function devices(): ZentridDeviceRecord[] {
  return Array.isArray(window.ZentridLiveDevices) ? window.ZentridLiveDevices : [];
}

function isType(d: ZentridDeviceRecord, name: string): boolean { return String(d.type || '').toLowerCase().includes(name); }
function deviceTypeKey(d: ZentridDeviceRecord): string {
  const t=String(d.type||'').toLowerCase();
  if(t.includes('micro')) return 'microinverter';
  if(t.includes('inverter')) return 'inverter';
  if(t.includes('battery')) return 'battery';
  if(t.includes('logger')||t.includes('gateway')||t.includes('communication')) return 'logger';
  if(t.includes('meter')) return 'meter';
  if(t.includes('weather')) return 'weather';
  if(t.includes('pv module')||t.includes('module')) return 'module';
  return 'generic';
}
function deviceTypeLabel(d: ZentridDeviceRecord): string {
  const map: Record<string, string> = {inverter:'Inverter',microinverter:'Microinverter',battery:'Battery',logger:'Logger / Communication',meter:'Meter',weather:'Weather Station',module:'PV Module',generic:String(d.type || 'Device')};
  return map[deviceTypeKey(d)] || String(d.type || 'Device');
}
var ZentridDevicePager: ZentridDevicePagerState = window.ZentridDevicePager || (window.ZentridDevicePager = { page: 1, size: 50 });
let deviceDetailActiveTab: ZentridDeviceTab = 'overview';
function pageSlice<T>(list: T[], pager: ZentridDevicePagerState): ZentridDevicePageSlice<T> {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pager.size));
  pager.page = Math.min(Math.max(1, Number(pager.page) || 1), pages);
  const start = (pager.page - 1) * pager.size;
  return { total, pages, page: pager.page, start, end: Math.min(start + pager.size, total), rows: list.slice(start, start + pager.size) };
}
function pagerHtml(kind: string, state: ZentridDevicePageSlice<unknown>): string {
  if (state.total <= ZentridDevicePager.size) return `<div class="pagination-bar"><span>Showing ${state.total} row(s)</span></div>`;
  return `<div class="pagination-bar"><span>Showing ${state.start + 1}-${state.end} of ${state.total}</span><div class="row-actions"><button data-${kind}-page="prev" ${state.page<=1?'disabled':''}>Prev</button><strong>Page ${state.page} / ${state.pages}</strong><button data-${kind}-page="next" ${state.page>=state.pages?'disabled':''}>Next</button></div></div>`;
}
function deviceRows(list: ZentridDeviceRecord[]): string {
  const serverPagination = window.ZentridRegistryQuery?.pagination('devices');
  const state = serverPagination
    ? { total: serverPagination.totalCount, pages: serverPagination.totalPages, page: serverPagination.page, start: (serverPagination.page - 1) * serverPagination.pageSize, end: Math.min(serverPagination.page * serverPagination.pageSize, serverPagination.totalCount), rows: list }
    : pageSlice(list, ZentridDevicePager);
  const pager = serverPagination ? window.ZentridRegistryQuery?.pagerHtml('devices', list.length) || '' : pagerHtml('device', state);
  return `${pager}<div class="data-table device-table"><div class="data-head"><span>Device</span><span>Plant / Tenant</span><span>Type</span><span>Vendor Source</span><span>Status</span><span>Actions</span></div>${state.rows.map(d=>`<div class="data-row" data-id="${d.id}"><div>${ZentridDataSource.badge(d, 'device')}<strong>${d.name}</strong><small>${d.id}<br>${d.serial}</small></div><div><strong>${d.plant}</strong><small>${d.tenant}</small></div><div><strong>${d.type}</strong><small>${d.subtype} · ${d.capacity}</small></div><div><strong>${d.vendor}</strong><small>${d.integration}<br>${d.sourceStatus}</small></div><div><span class="badge ${deviceStatusCls(d.status)}">${d.status}</span><small>${d.alerts} alerts · ${d.lastSeen}</small></div><div class="row-actions"><button data-action="open">Open</button><button data-action="plant">Plant</button><button data-action="telemetry">Telemetry</button><button data-action="alerts">Alerts</button></div></div>`).join('')}</div>${pager}`;
}
function renderDevices(): string {
  const all=devices();
  const queryState = window.ZentridRegistryQuery?.read('devices');
  const serverPagination = window.ZentridRegistryQuery?.pagination('devices');
  const initialSearch = queryState?.search || '';
  const initialType = queryState?.params.deviceType || 'All Types';
  const initialStatus = queryState?.params.deviceStatus || 'All Statuses';
  const activePlantFilter=localStorage.getItem('zentrid_device_filter_plant') || '';
  const activePlant=activePlantFilter ? all.find(d=>d.plantId===activePlantFilter) : null;
  const list=activePlantFilter ? all.filter(d=>d.plantId===activePlantFilter) : all;
  const online=list.filter(d=>d.status==='Online').length;
  const attention=list.filter(d=>d.status!=='Online').length;
  const mapped=list.filter(d=>d.sourceStatus).length;
  const types=[...new Set(all.map(d=>d.type).filter(Boolean))].sort();
  const statuses=Array.from(new Set(['Online','Warning','Fault','Offline','Draft',...all.map(d=>String(d.status||'').trim()).filter(Boolean)]));
  const optionText=(value: unknown): string=>String(value??'').replace(/[&<>"']/g, character=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character]||character));
  const filterBanner=activePlantFilter ? `<div class="filter-banner"><div><strong>Filtered by plant</strong><small>${activePlant ? activePlant.plant : activePlantFilter} · ${list.length} device records</small></div><button id="clearPlantDeviceFilter">Clear filter</button></div>` : '';
  return `<section class="page-hero"><div><p class="eyebrow">Global Admin · Groups</p><h1>Device List</h1><p class="muted">All devices connected to Plants, grouped by plant, tenant, vendor source and operational status.</p></div><div class="hero-actions"><button class="create-action" id="openDeviceCreate" type="button"><span class="pulse"></span><div><strong>+ Add Device</strong><small>Save to localStorage</small></div></button><button class="freshness-card" id="openDeviceSource"><span class="pulse"></span><div><strong>Source Traceability</strong><small>Vendor ID → Zentrid Device</small></div></button></div></section>
  ${filterBanner}
  <section class="context-bar glass-card"><button class="ctx-item"><span>Total Devices</span><strong>${(serverPagination?.totalCount || list.length).toLocaleString()}</strong></button><button class="ctx-item"><span>Online</span><strong>${online}</strong></button><button class="ctx-item"><span>Attention</span><strong>${attention}</strong></button><button class="ctx-item"><span>Mapped Devices</span><strong>${mapped}</strong></button></section>
  <section class="panel glass-card"><div class="panel-head"><div><h2>Device List</h2><p>Search by device, plant, tenant, vendor, type, serial or status.</p></div><div class="toolbar"><input id="deviceSearch" value="${String(initialSearch).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" placeholder="Search current page by device, serial, plant..."/><select id="deviceTypeFilter"><option ${initialType === 'All Types' ? 'selected' : ''}>All Types</option>${types.map(t=>`<option ${t === initialType ? 'selected' : ''}>${optionText(t)}</option>`).join('')}</select><select id="deviceStatusFilter"><option ${initialStatus === 'All Statuses' ? 'selected' : ''}>All Statuses</option>${statuses.map(value=>`<option ${value === initialStatus ? 'selected' : ''}>${optionText(value)}</option>`).join('')}</select></div></div><div id="deviceFilterScopeV126">${window.ZentridRegistryQuery?.filterScopeHtml('devices') || ''}</div><div id="deviceTable">${deviceRows(list)}</div></section>
  <aside class="modal" id="deviceCreateModal"><div class="modal-card wide-modal"><button class="modal-close" id="closeDeviceCreate" type="button">×</button><div class="panel-head"><div><h2>Add Device</h2><p>Creates a local device record and shows it in Device List and Device Detail after refresh.</p></div><span class="badge info">localStorage</span></div><form id="deviceCreateForm" class="client-form-grid two-col" data-zentrid-form-readiness="local" data-zentrid-form-contract="DeviceCreateDraft" data-zentrid-form-method="POST" data-zentrid-form-validation="native" data-zentrid-form-api-note="A Device create endpoint is not confirmed; Save Device continues to store a local record only."><label>Device Name<input name="name" required placeholder="Inverter 01"></label><label>Device Type<select name="type"><option>Inverter</option><option>Battery</option><option>Meter</option><option>Weather Station</option><option>Transformer</option><option>Gateway</option><option>Logger</option><option>Other</option></select></label><label>Plant<select name="plantId" id="devicePlantSelect"></select></label><label>Status<select name="status"><option>Online</option><option>Warning</option><option>Offline</option><option>Draft</option></select></label><label>Vendor<input name="vendor" placeholder="Huawei / GoodWe / Manual"></label><label>Model<input name="model" placeholder="Device model"></label><label>Serial Number<input name="serial" required placeholder="Serial number"></label><label>Capacity / Role<input name="capacity" placeholder="100 kW / Bidirectional / Logger"></label><label>Firmware<input name="firmware" placeholder="Firmware version"></label><label>Location<input name="location" placeholder="Area A / Control room"></label><div class="modal-actions full"><button class="secondary-action" id="cancelDeviceCreate" type="button">Cancel</button><button class="primary-action" type="submit">Save Device</button></div></form></div></aside><aside class="detail-drawer" id="deviceSourceDrawer"><button class="drawer-close" id="closeDeviceSource">x</button><h2>Device Source Traceability</h2><div class="drawer-body"><p>Each device is stored as Zentrid master data and keeps the source reference from the vendor platform.</p><ul><li>External Device ID</li><li>Vendor and integration name</li><li>Plant relationship</li><li>Parent / child topology</li><li>Last seen and freshness</li></ul></div><div class="drawer-actions"><button class="primary-action" onclick="location.href='plants.html'">Open Groups</button></div></aside>`;
}
function devicePrimaryMetric(d: ZentridDeviceRecord): ZentridDevicePrimaryMetric {
  const k=deviceTypeKey(d);
  if(k==='battery') return {label:'SOC / SOH', value:`${d.soc||'68%'} · ${d.soh||'94%'}`, hint:'Battery health'};
  if(k==='logger') return {label:'Signal / Data Lag', value:`${d.signal||'Good'} · ${d.dataLag||d.lastSeen}`, hint:'Communication health'};
  if(k==='meter') return {label:'Grid Power', value:d.power||'31.2 MW', hint:'Accounting point'};
  if(k==='weather') return {label:'Irradiance', value:d.irradiance||'0 W/m2', hint:'Weather telemetry'};
  if(k==='module') return {label:'Module Power', value:d.power||'549 W', hint:'Module-level output'};
  return {label:'Active Power', value:d.power||'83.4 kW', hint:'Realtime output'};
}
function deviceHeroActions(d: ZentridDeviceRecord): string {
  return `<button class="secondary-action" type="button" onclick="location.href='devices.html'">Back to Device List</button><button class="secondary-action" type="button" onclick="localStorage.setItem('zentrid_selected_plant','${d.plantId}');location.href='plant-detail.html'">Open Plant</button><button class="primary-action" type="button" id="refreshDeviceV59">Refresh</button>`;
}
function deviceKpis(d: ZentridDeviceRecord): string {
  const primary=devicePrimaryMetric(d);
  return `<section class="kpi-grid detail-kpis device-kpi-grid-v58 device-kpi-grid-v59">
    <article class="kpi-card"><span>Status</span><strong>${d.status}</strong><small>${d.alerts} active alerts · ${d.lastSeen}</small></article>
    <article class="kpi-card"><span>${primary.label}</span><strong>${primary.value}</strong><small>${primary.hint}</small></article>
    <article class="kpi-card"><span>Type</span><strong>${deviceTypeLabel(d)}</strong><small>${d.subtype}</small></article>
    <article class="kpi-card"><span>Vendor / Model</span><strong>${d.vendor}</strong><small>${d.model}</small></article>
    <article class="kpi-card"><span>Serial Number</span><strong>${d.serial}</strong><small>${d.externalId}</small></article>
    <article class="kpi-card"><span>Parent Relation</span><strong>${d.parent}</strong><small>${d.children}</small></article>
  </section>`;
}
function universalDeviceSidebar(d: ZentridDeviceRecord, activeTab: ZentridDeviceTab = deviceDetailActiveTab): string {
  const key=deviceTypeKey(d);
  const typeSpecific = key==='inverter'||key==='microinverter' ? `<button class="${activeTab === 'strings' ? 'active' : ''}" data-device-tab="strings" type="button" ${activeTab === 'strings' ? 'aria-current=\"page\"' : ''}><span>PV Strings</span></button>` :
    key==='battery' ? `<button class="${activeTab === 'battery' ? 'active' : ''}" data-device-tab="battery" type="button" ${activeTab === 'battery' ? 'aria-current=\"page\"' : ''}><span>Battery State</span></button>` :
    key==='logger' ? `<button class="${activeTab === 'connectivity' ? 'active' : ''}" data-device-tab="connectivity" type="button" ${activeTab === 'connectivity' ? 'aria-current=\"page\"' : ''}><span>Logger View</span></button>` :
    key==='meter' ? `<button class="${activeTab === 'measurements' ? 'active' : ''}" data-device-tab="measurements" type="button" ${activeTab === 'measurements' ? 'aria-current=\"page\"' : ''}><span>Measurements</span></button>` :
    key==='weather' ? `<button class="${activeTab === 'weather' ? 'active' : ''}" data-device-tab="weather" type="button" ${activeTab === 'weather' ? 'aria-current=\"page\"' : ''}><span>Weather Data</span></button>` :
    key==='module' ? `<button class="${activeTab === 'module' ? 'active' : ''}" data-device-tab="module" type="button" ${activeTab === 'module' ? 'aria-current=\"page\"' : ''}><span>Module Data</span></button>` : '';
  const button = (tab: string, label: string): string => `<button class="${activeTab === tab ? 'active' : ''}" data-device-tab="${tab}" type="button" ${activeTab === tab ? 'aria-current="page"' : ''}><span>${label}</span></button>`;
  return `<aside class="detail-side-nav device-detail-nav-v58 device-detail-nav-v92" aria-label="Device navigation">
    ${button('overview','Overview')}
    ${button('passport','Technical Passport')}
    ${button('connectivity-full','Connectivity')}
    ${button('telemetry','Telemetry Summary')}
    ${button('architecture','Topology')}
    ${typeSpecific}
    ${button('alerts','Alerts / Events')}
    ${button('lifecycle','Lifecycle')}
    ${button('related','Related Objects')}
    ${button('documents','Documents')}
    ${button('configuration','Configuration')}
    ${button('audit','Audit')}
    ${button('source','Source & Sync')}
  </aside>`;
}

type ZentridDeviceTelemetryRecord = Record<string, unknown>;

function deviceTelemetryRecords(d: ZentridDeviceRecord): ZentridDeviceTelemetryRecord[] {
  const store = window.ZentridLiveTelemetryByDevice as Record<string, ZentridDeviceTelemetryRecord[]> | undefined;
  if (!store) return [];
  const keys = [d.id, d.externalId, d.serial].map(value => String(value || '').trim()).filter(Boolean);
  for (const key of keys) {
    const records = store[key];
    if (Array.isArray(records)) return records;
  }
  return [];
}

function deviceTelemetryLoaded(d: ZentridDeviceRecord): boolean {
  const loaded = window.ZentridLiveTelemetryLoadedDevices as Record<string, boolean> | undefined;
  if (!loaded) return false;
  return [d.id, d.externalId, d.serial].some(value => Boolean(value && loaded[String(value)]));
}

function deviceTelemetryMetricToken(value: unknown): string {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function deviceTelemetryEscape(value: unknown): string {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function deviceTelemetryTimestamp(record: ZentridDeviceTelemetryRecord): number {
  const value = record.timestampRaw || record.timestamp;
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function deviceTelemetryAliases(key: string): string[] {
  const aliases: Record<string, string[]> = {
    activePower: ['active power', 'active power kw', 'current power', 'current power kw', 'ac power', 'ac power kw', 'output power', 'power'],
    reactivePower: ['reactive power', 'reactive power kvar'],
    powerFactor: ['power factor', 'pf'],
    frequency: ['grid frequency', 'grid frequency hz', 'frequency', 'frequency hz', 'ac frequency'],
    dailyEnergy: ['daily energy', 'daily energy kwh', 'today energy', 'today energy kwh', 'energy today', 'daily yield', 'today yield'],
    totalYield: ['total yield', 'total yield kwh', 'lifetime yield', 'total energy', 'total energy kwh', 'cumulative energy'],
    temperature: ['internal temperature', 'device temperature', 'temperature', 'temperature c', 'inverter temperature'],
    phaseCurrent: ['phase current', 'ac current', 'output current'],
    lineVoltage: ['line voltage', 'ac voltage', 'output voltage'],
    voltage: ['battery voltage', 'battery voltage v', 'dc voltage', 'dc voltage v', 'voltage', 'voltage v'],
    current: ['battery current', 'battery current a', 'dc current', 'dc current a', 'current', 'current a'],
    soc: ['soc', 'soc pct', 'state of charge', 'battery soc'],
    soh: ['soh', 'soh pct', 'state of health', 'battery soh'],
    charged: ['charged today', 'charge energy today', 'daily charge energy'],
    discharged: ['discharged today', 'discharge energy today', 'daily discharge energy'],
    signal: ['signal strength', 'signal quality', 'rssi'],
    wlan: ['wlan', 'wifi signal', 'wireless signal'],
    dataLag: ['data lag', 'telemetry lag', 'communication delay'],
    todayImport: ['import today', 'today import', 'daily import energy'],
    todayExport: ['export today', 'today export', 'daily export energy'],
    import: ['total import', 'import energy'],
    export: ['total export', 'export energy'],
    irradiance: ['irradiance', 'solar irradiance', 'poa irradiance'],
    ambient: ['ambient temperature', 'air temperature'],
    moduleTemp: ['module temperature', 'panel temperature']
  };
  return aliases[key] || [key];
}

function deviceTelemetryMetricValue(d: ZentridDeviceRecord, key: string): string {
  const expected = deviceTelemetryAliases(key).map(deviceTelemetryMetricToken);
  const matches = deviceTelemetryRecords(d)
    .filter(record => expected.includes(deviceTelemetryMetricToken(record.metric)))
    .sort((a, b) => deviceTelemetryTimestamp(b) - deviceTelemetryTimestamp(a));
  const record = matches[0];
  if (!record) return '';
  const display = String(record.displayValue || '').trim();
  if (display && display !== '—') return display;
  const value = record.valueText ?? record.value;
  if (value === undefined || value === null || value === '') return '';
  const unit = String(record.unit || '').trim();
  return `${String(value)}${unit ? ` ${unit}` : ''}`;
}

function deviceTelemetryLatestTimestamp(d: ZentridDeviceRecord): string {
  const record = deviceTelemetryRecords(d).slice().sort((a, b) => deviceTelemetryTimestamp(b) - deviceTelemetryTimestamp(a))[0];
  return String(record?.timestamp || '').trim();
}

function deviceMetricValue(d: ZentridDeviceRecord, key: string): string {
  const telemetryValue = deviceTelemetryMetricValue(d, key);
  if (telemetryValue) return telemetryValue;
  if (deviceTelemetryLoaded(d)) return '—';
  const k=deviceTypeKey(d);
  const base: Record<string, string | number | boolean | null | undefined> = {activePower:d.power||'83.4 kW', reactivePower:'0.002 kvar', powerFactor:'1.000', frequency:d.frequency||'50.00 Hz', dailyEnergy:d.dailyEnergy||'156.91 kWh', totalYield:d.totalYield||'149,933.20 kWh', temperature:d.temperature||'42 °C', insulation:'4.359 MOhm', phaseCurrent:'22.552 / 22.468 / 22.438 A', lineVoltage:d.voltage||'379.2 / 378.6 / 382.4 V', startup:'2026-06-11 05:49:24', shutdown:'N/A'};
  const pick = (source: Record<string, string | number | boolean | null | undefined>): string => String(source[key] || base[key] || '—');
  if(k==='battery') return pick({activePower:d.power||'-42 kW', soc:d.soc||'68%', soh:d.soh||'94%', voltage:d.voltage||'53.60 V', current:d.current||'0.00 A', temperature:d.temperature||'25.00 °C', rated:'5.000 kWh', backup:'— min', charged:'0.14 kWh', discharged:'0.07 kWh', packages:'4', chargeVoltage:'58.40 V', dischargeVoltage:'0.00 V', chargeCurrent:'0 A', dischargeCurrent:'250 A'});
  if(k==='logger') return pick({signal:d.signal||'Good', wlan:d.wlan||'82%', dataLag:d.dataLag||d.lastSeen, linked:d.children||'8 inverters · 2 meters', lanIp:d.lanIp||d.ip, cybersecurity:d.cybersecurity||'CS1.0.0'});
  if(k==='meter') return pick({activePower:d.power||'31.2 MW', voltage:d.voltage||'20 kV', current:d.current||'901 A', frequency:d.frequency||'50.01 Hz', import:'1.82 MWh', export:'7.44 MWh', todayImport:'0.12 MWh', todayExport:'1.09 MWh'});
  if(k==='weather') return pick({irradiance:d.irradiance||'0 W/m2', ambient:d.ambient||'27 °C', moduleTemp:d.moduleTemp||'41 °C', wind:'3.2 m/s', humidity:'42%', rainfall:'0 mm'});
  if(k==='module') return pick({activePower:d.power||'549 W', voltage:d.voltage||'42.6 V', current:d.current||'12.9 A', temperature:d.temperature||'44 °C', string:'String A-2', mppt:'MPPT 1', position:'R2-C4'});
  return String(base[key] || '—');
}
function cardGrid(items: ZentridDeviceCardItem[], cls: string = 'device-param-grid-v58'): string {
  return `<div class="${cls}">${items.map(([k,v,h])=>`<article><span>${k}</span><strong>${v}</strong>${h?`<small>${h}</small>`:''}</article>`).join('')}</div>`;
}
function operatingDataGrid(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  if(key==='logger') return cardGrid([['Signal Strength',deviceMetricValue(d,'signal')],['WLAN',deviceMetricValue(d,'wlan')],['Data Lag',deviceMetricValue(d,'dataLag')],['Linked Devices',deviceMetricValue(d,'linked')],['LAN IP',deviceMetricValue(d,'lanIp')],['Cyber Security Version',deviceMetricValue(d,'cybersecurity')],['Status',d.status],['Last Update',deviceTelemetryLatestTimestamp(d) || d.lastSeen]]);
  if(key==='battery') return cardGrid([['SOC',deviceMetricValue(d,'soc')],['SOH',deviceMetricValue(d,'soh')],['Voltage',deviceMetricValue(d,'voltage')],['Current',deviceMetricValue(d,'current')],['Temperature',deviceMetricValue(d,'temperature')],['Rated Capacity',deviceMetricValue(d,'rated')],['Charged Today',deviceMetricValue(d,'charged')],['Discharged Today',deviceMetricValue(d,'discharged')]]);
  if(key==='weather') return cardGrid([['Irradiance',deviceMetricValue(d,'irradiance')],['Ambient Temp',deviceMetricValue(d,'ambient')],['Module Temp',deviceMetricValue(d,'moduleTemp')],['Wind Speed',deviceMetricValue(d,'wind')],['Humidity',deviceMetricValue(d,'humidity')],['Rainfall',deviceMetricValue(d,'rainfall')]]);
  if(key==='meter') return cardGrid([['Active Power',deviceMetricValue(d,'activePower')],['Import Today',deviceMetricValue(d,'todayImport')],['Export Today',deviceMetricValue(d,'todayExport')],['Voltage',deviceMetricValue(d,'voltage')],['Current',deviceMetricValue(d,'current')],['Frequency',deviceMetricValue(d,'frequency')]]);
  if(key==='module') return cardGrid([['Power',deviceMetricValue(d,'activePower')],['Voltage',deviceMetricValue(d,'voltage')],['Current',deviceMetricValue(d,'current')],['Temperature',deviceMetricValue(d,'temperature')],['String',deviceMetricValue(d,'string')],['MPPT',deviceMetricValue(d,'mppt')],['Position',deviceMetricValue(d,'position')]]);
  return cardGrid([['Active Power',deviceMetricValue(d,'activePower')],['Reactive Power',deviceMetricValue(d,'reactivePower')],['Power Factor',deviceMetricValue(d,'powerFactor')],['Grid Frequency',deviceMetricValue(d,'frequency')],['Daily Energy',deviceMetricValue(d,'dailyEnergy')],['Total Yield',deviceMetricValue(d,'totalYield')],['Phase Current',deviceMetricValue(d,'phaseCurrent')],['Line Voltage',deviceMetricValue(d,'lineVoltage')],['Internal Temperature',deviceMetricValue(d,'temperature')],['Insulation Resistance',deviceMetricValue(d,'insulation')],['Startup Time',deviceMetricValue(d,'startup')],['Shutdown Time',deviceMetricValue(d,'shutdown')]]);
}
function deviceMiniChart(label: string): string {
  return `<div class="device-chart-card-v58"><div class="chart-card-head-v20"><strong>${label}</strong><small>Mock trend · Last 24h</small></div><div class="mini-bar-chart-v20"><span style="height:25%"></span><span style="height:42%"></span><span style="height:66%"></span><span style="height:78%"></span><span style="height:92%"></span><span style="height:74%"></span><span style="height:54%"></span><span style="height:35%"></span></div></div>`;
}

function deviceTelemetryCharts(d: ZentridDeviceRecord): string {
  const groups = new Map<string, ZentridDeviceTelemetryRecord[]>();
  deviceTelemetryRecords(d).forEach(record => {
    const metric = String(record.metric || '').trim();
    const numeric = Number(record.numericValue ?? record.value);
    if (!metric || !Number.isFinite(numeric)) return;
    const rows = groups.get(metric) || [];
    rows.push(record);
    groups.set(metric, rows);
  });
  const selected = [...groups.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .slice(0, 2);
  if (!selected.length) {
    return `<div class="device-monitoring-grid-v58"><div class="device-chart-card-v58"><div class="chart-card-head-v20"><strong>Telemetry Samples</strong><small>/api/telemetry</small></div><div class="empty-state"><strong>No numeric telemetry samples</strong><small>The endpoint returned no chart-ready values for this device on the loaded page.</small></div></div></div>`;
  }
  return `<div class="device-monitoring-grid-v58">${selected.map(([metric, records]) => {
    const ordered = records.slice().sort((a, b) => deviceTelemetryTimestamp(a) - deviceTelemetryTimestamp(b)).slice(-12);
    const values = ordered.map(record => Number(record.numericValue ?? record.value)).filter(Number.isFinite);
    const max = Math.max(...values.map(value => Math.abs(value)), 1);
    const bars = values.map(value => `<span style="height:${Math.max(12, Math.round(Math.abs(value) / max * 100))}%" title="${deviceTelemetryEscape(value)}"></span>`).join('');
    const latest = String(ordered[ordered.length - 1]?.timestamp || '').trim() || 'Latest API sample';
    return `<div class="device-chart-card-v58"><div class="chart-card-head-v20"><strong>${deviceTelemetryEscape(metric)}</strong><small>${ordered.length} API sample(s) · ${deviceTelemetryEscape(latest)}</small></div><div class="mini-bar-chart-v20">${bars}</div></div>`;
  }).join('')}</div>`;
}
function architectureFlow(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  const nodes = key==='battery' ? [['Plant',d.plant],['Hybrid Inverter','Power conversion'],['Battery',d.name],['BMS','Health / limits'],['Grid','Import / Export']] :
    key==='logger' ? [['Plant',d.plant],['Logger',d.name],['Inverters','Linked devices'],['Meter','Accounting'],['Cloud','Vendor sync']] :
    key==='meter' ? [['Plant',d.plant],['Inverters','Generation'],['Meter',d.name],['Grid','Import / Export'],['Accounting','Records']] :
    key==='weather' ? [['Plant',d.plant],['Weather Station',d.name],['Irradiance','Sensor'],['Temperature','Sensor'],['Performance Analytics','PR context']] :
    key==='module' ? [['Plant',d.plant],['PV String','Array A'],['PV Module',d.name],['Microinverter','Module conversion'],['Grid','AC output']] :
    [['PV Arrays','DC input'],[deviceTypeLabel(d),d.name],['Battery / Load','Optional'],['Meter','Grid point'],['Grid','Export / Import']];
  return `<div class="device-architecture-v59">${nodes.map((n,i)=>`<div class="arch-node-v59"><span>${n[0]}</span><strong>${n[1]}</strong></div>${i<nodes.length-1?'<div class="arch-link-v59"><span></span></div>':''}`).join('')}</div>`;
}
function architectureRelations(d: ZentridDeviceRecord): string {
  return `<div class="split-grid device-relations-v59"><div class="panel-lite"><h3>Hierarchy</h3><div class="asset-tree"><p>${d.plant}\n└── ${d.parent}\n    └── ${d.name}\n        └── ${d.children}</p></div></div><div class="panel-lite"><h3>Connected Objects</h3>${cardGrid([['Plant',d.plant],['Tenant',d.tenant],['Parent',d.parent],['Children',d.children],['Vendor Source',d.vendor],['Mapping',d.sourceStatus]],'device-param-grid-v58 compact-v59')}</div></div>`;
}
function stringRows(d: ZentridDeviceRecord): string {
  const count=deviceTypeKey(d)==='microinverter'?4:8;
  const rows=Array.from({length:count},(_,i)=>{ const n=i+1; const volt=[256.2,5.5,0,0,547.3,547.3,560,560][i]||612.4; const cur=[3.1,0,0,0,6.87,0,6.78,0][i]||5.1; return `<div class="data-row"><div><strong>PV${n}</strong><small>MPPT ${Math.ceil(n/2)}</small></div><div><span>${volt} V</span></div><div><span>${cur} A</span></div><div><span>${cur ? (volt*cur/1000).toFixed(2) : '0.00'} kW</span></div><div><span>${cur ? '8,640.00 Wp' : '0.00 Wp'}</span></div></div>`; }).join('');
  return `<div class="data-table compact-table device-string-table-v58"><div class="data-head"><span>Input</span><span>Voltage</span><span>Current</span><span>Power</span><span>String Capacity</span></div>${rows}</div>`;
}
function batteryDetail(d: ZentridDeviceRecord): string {
  return `<div class="device-battery-visual-v59"><div class="battery-gauge-v59"><strong>${deviceMetricValue(d,'soc')}</strong><span>SOC</span></div><div>${cardGrid([['Battery Voltage',deviceMetricValue(d,'voltage')],['Battery Current',deviceMetricValue(d,'current')],['Battery Health',deviceMetricValue(d,'soh')],['Temp',deviceMetricValue(d,'temperature')],['Package Quantity',deviceMetricValue(d,'packages')]],'device-param-grid-v58 compact-v59')}</div></div><div class="section-title-v17 mini"><div><h3>Charge / Discharge Limits</h3><p class="muted">Limits and flags inspired by battery detail screens.</p></div></div>${cardGrid([['Charge End Voltage',deviceMetricValue(d,'chargeVoltage')],['Discharge End Voltage',deviceMetricValue(d,'dischargeVoltage')],['Charge Limit Current',deviceMetricValue(d,'chargeCurrent')],['Discharge Limit Current',deviceMetricValue(d,'dischargeCurrent')],['Force Charge Flag','0000'],['Check SOC Flag','0000']], 'device-param-grid-v58')}`;
}
function configurationPanel(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  const common=[['Firmware',d.firmware],['Configuration Version', key==='logger'?'Communication Profile v2':'Parameter Set v1'],['Task History','Available'],['Audit Required','Yes']];
  const specific= key==='inverter'||key==='microinverter' ? [['Active Power Adjustment','Supported'],['Reactive Power Adjustment','Supported'],['Power Factor Adjustment','Supported'],['Firmware Upgrade','Supported']] : key==='battery' ? [['Charge / Discharge Mode','Supported'],['SOC Reserve','Supported'],['Manual Health Check','Supported'],['Emergency Stop','Restricted']] : key==='logger' ? [['Search for Devices','Supported'],['Restart Communication','Supported'],['Network Settings','Read-only'],['WLAN Signal','Supported']] : [['Read Parameters','Supported'],['Remote Command','Capability gated'],['Repair','Available'],['Refresh','Supported']];
  return `<div class="section-title-v17"><div><h2>Configuration</h2><p class="muted">Capability-aware settings and command entry points.</p></div></div>${cardGrid([...common,...specific])}<div class="drawer-actions device-config-actions-v59"><button class="primary-action">View Task History</button><button class="secondary-action">Read Parameters</button><button class="secondary-action">Open Command Center</button></div>`;
}
function remoteControlPanel(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  const actions = key==='logger' ? ['Restart Communication','Search for Devices','Run Connectivity Test','Refresh Linked Devices'] : key==='battery' ? ['Manual Battery Health Check','Charge / Discharge Mode','Set SOC Reserve','Emergency Stop'] : key==='meter' ? ['Refresh Measurements','Verify Accounting Point','Sync Meter Clock'] : key==='weather' ? ['Refresh Sensors','Run Sensor Check','Calibrate Sensor'] : key==='module' ? ['Refresh Module Data','Locate Module','Open Parent Microinverter'] : ['Device Start / Stop','Active Power Adjustment','Reactive Power Adjustment','Power Factor Adjustment','Firmware Upgrade'];
  return `<div class="device-control-grid-v58">${actions.map(a=>`<button type="button"><strong>${a}</strong><small>Capability-gated · audit required</small></button>`).join('')}</div><p class="muted device-note-v58">Write-actions are mock controls for UX validation. In production they must use capability flags, confirmation, approval rules and immutable audit log.</p>`;
}
function deviceLazyPanel(tab: ZentridDeviceTab, content: string): string {
  return window.ZentridDetailLazyTabs?.panel('device', String(tab || 'overview'), content) || content;
}
function deviceDetailPanel(d: ZentridDeviceRecord, tab: ZentridDeviceTab): string {
  if(tab==='overview') return `<div class="section-title-v17"><div><h2>Device Overview</h2><p class="muted">Type-driven workspace: ${deviceTypeLabel(d)} shows only relevant operational data.</p></div></div><div class="device-overview-grid-v58"><article><span>Status</span><strong>${deviceStatusPill(d)}</strong><small>${d.lastSeen}</small></article><article><span>Plant</span><strong>${d.plant}</strong><small>${d.tenant}</small></article><article><span>Vendor / Model</span><strong>${d.vendor}</strong><small>${d.model}</small></article><article><span>Serial Number</span><strong>${d.serial}</strong><small>${d.id}</small></article></div><div class="section-title-v17 mini"><div><h3>Realtime Snapshot</h3><p class="muted">Main values change by device type.</p></div></div>${operatingDataGrid(d)}`;
  if(tab==='telemetry'||tab==='monitoring') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Telemetry</h2><p class="muted">Chart-ready operational view for ${deviceTypeLabel(d)}.</p></div></div>${deviceTelemetryCharts(d)}<div class="section-title-v17 mini"><div><h3>Live Metrics</h3><p class="muted">Fast numeric inspection from the loaded telemetry records.</p></div></div>${operatingDataGrid(d)}`);
  if(tab==='architecture') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Architecture</h2><p class="muted">Visual relationship between plant, device and connected objects.</p></div></div>${architectureFlow(d)}${architectureRelations(d)}`);
  if(tab==='strings') return `<div class="section-title-v17"><div><h2>PV Strings / Inputs</h2><p class="muted">MPPT and PV input values for inverter and microinverter devices.</p></div></div>${stringRows(d)}`;
  if(tab==='battery') return `<div class="section-title-v17"><div><h2>Battery State</h2><p class="muted">Storage-specific information: SOC, health, voltage/current, packages and limits.</p></div></div>${batteryDetail(d)}`;
  if(tab==='connectivity') return `<div class="section-title-v17"><div><h2>Connectivity</h2><p class="muted">Logger / communication module status and subordinate devices.</p></div></div>${operatingDataGrid(d)}<div class="section-title-v17 mini"><div><h3>Subordinate Devices</h3><p class="muted">Devices managed through this logger.</p></div></div><div class="data-table compact-table subordinate-device-table-v59"><div class="data-head"><span>Status</span><span>Device Type</span><span>Model</span><span>Software Version</span><span>SN</span></div><div class="data-row"><div><span class="badge success">Connected</span></div><div><strong>Inverter</strong></div><div><span>SUN2000-50KTL-M0</span></div><div><span>V300R001C00SPC127</span></div><div><span>BN2251034144</span></div></div><div class="data-row"><div><span class="badge success">Connected</span></div><div><strong>Meter</strong></div><div><span>DTSU666-H</span></div><div><span>1.2.9</span></div><div><span>SN-MTR-00088</span></div></div></div>`;
  if(tab==='measurements') return `<div class="section-title-v17"><div><h2>Measurements</h2><p class="muted">Meter measurements for import/export and accounting context.</p></div></div>${operatingDataGrid(d)}${cardGrid([['Total Import',deviceMetricValue(d,'import')],['Total Export',deviceMetricValue(d,'export')],['Accounting Source','Smart Meter'],['Data Status','Confirmed']])}`;
  if(tab==='weather') return `<div class="section-title-v17"><div><h2>Weather Data</h2><p class="muted">Weather plant values used for performance analytics.</p></div></div>${operatingDataGrid(d)}`;
  if(tab==='module') return `<div class="section-title-v17"><div><h2>Module Data</h2><p class="muted">Module-level values are shown inside the device topology without turning the whole registry into module-only UI.</p></div></div>${operatingDataGrid(d)}`;
  if(tab==='information') return `<div class="section-title-v17"><div><h2>Technical Info</h2><p class="muted">Static master data, vendor identifiers and lifecycle attributes.</p></div></div><div class="info-grid"><div><span>Device Name</span><strong>${d.name}</strong></div><div><span>Device Type</span><strong>${d.type}</strong></div><div><span>Subtype</span><strong>${d.subtype}</strong></div><div><span>Vendor</span><strong>${d.vendor}</strong></div><div><span>Manufacturer</span><strong>${d.manufacturer}</strong></div><div><span>Model</span><strong>${d.model}</strong></div><div><span>Serial Number</span><strong>${d.serial}</strong></div><div><span>Firmware</span><strong>${d.firmware}</strong></div><div><span>IP Address</span><strong>${d.ip}</strong></div><div><span>MAC Address</span><strong>${d.mac}</strong></div><div><span>Installation Date</span><strong>${d.installation}</strong></div><div><span>Warranty</span><strong>${d.warranty}</strong></div></div>`;
  if(tab==='alerts') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Alerts / Faults</h2><p class="muted">Device-level active and historical events.</p></div></div><div class="data-table compact-table device-alert-table-v58"><div class="data-head"><span>Alert</span><span>Severity</span><span>Source</span><span>Time</span><span>Status</span></div>${d.alerts ? `<div class="data-row"><div><strong>${d.type} communication / performance warning</strong><small>${d.name}</small></div><div><span class="badge warning">Warning</span></div><div><span>${d.vendor}</span></div><div><span>${d.lastSeen}</span></div><div><span>Open</span></div></div>` : `<div class="data-row"><div><strong>No active issues</strong><small>${d.name}</small></div><div><span class="badge success">Normal</span></div><div><span>Zentrid</span></div><div><span>Now</span></div><div><span>Clear</span></div></div>`}</div><div class="drawer-actions"><button class="primary-action" onclick='localStorage.setItem("zentrid_alert_context", JSON.stringify({deviceId:"${d.id}", plantId:"${d.plantId}", tenant:"${d.tenant}"})); location.href="alerts.html"'>Open Alerts Center</button></div>`);
  if(tab==='configuration') return configurationPanel(d) + `<div class="section-title-v17 mini"><div><h3>Remote Actions</h3><p class="muted">Common actions are shown below the config blocks.</p></div></div>${remoteControlPanel(d)}`;
  if(tab==='activity') return `<div class="section-title-v17"><div><h2>Activity Log</h2><p class="muted">Telemetry refresh, configuration changes, firmware and repair history.</p></div></div><div class="timeline-v17"><div><b>Today</b><span>Operational telemetry refreshed · ${d.lastSeen}</span></div><div><b>Today</b><span>Architecture relationship checked · ${d.parent}</span></div><div><b>Yesterday</b><span>Configuration snapshot stored from ${d.vendor}</span></div><div><b>03 Jun</b><span>Firmware version confirmed · ${d.firmware}</span></div><div><b>${d.installation}</b><span>Device registered and linked to ${d.plant}</span></div></div>`;
  if(tab==='source') return `<div class="section-title-v17"><div><h2>Source & Sync</h2><p class="muted">Vendor traceability and canonical mapping state.</p></div></div><div class="info-grid"><div><span>Integration</span><strong>${d.integration}</strong></div><div><span>Vendor</span><strong>${d.vendor}</strong></div><div><span>External ID</span><strong>${d.externalId}</strong></div><div><span>Zentrid ID</span><strong>${d.id}</strong></div><div><span>Mapping Status</span><strong>${d.sourceStatus}</strong></div><div><span>Last Seen</span><strong>${d.lastSeen}</strong></div><div><span>Raw Payload</span><strong>Available in Data Governance</strong></div><div><span>Capability Flags</span><strong>Telemetry · Alerts · Architecture · ${deviceTypeLabel(d)} controls</strong></div></div>`;
  if(tab==='passport') return devicePassportPanelV92(d);
  if(tab==='connectivity-full') return deviceConnectivityFullPanelV92(d);
  if(tab==='lifecycle') return lifecyclePanelV92(d);
  if(tab==='related') return deviceLazyPanel(tab, relatedObjectsPanelV92(d));
  if(tab==='documents') return deviceDocumentsPanelV92(d);
  if(tab==='audit') return deviceAuditPanelV92(d);
  return '';
}
function renderDeviceDetail(): string {
  const d=selectedDevice();
  if (!d.id) return window.ZentridApiOnly?.emptyState('Device Detail', 'The device endpoint has not returned a selected record.', '/api/devices') || '';
  return `<section class="page-hero device-hero-v58 device-hero-v59"><div><p class="eyebrow">Global Admin · Device Detail ${ZentridDataSource.badge(d, 'device', true)}</p><h1>${d.name}</h1><p class="muted">${deviceTypeLabel(d)} · ${d.manufacturer || d.vendor} ${d.model} · ${d.serial}</p></div><div class="hero-actions">${deviceHeroActions(d)}</div></section>
  <section class="context-bar glass-card device-context-v58"><div><span>Plant</span><strong>${d.plant}</strong></div><div><span>Tenant</span><strong>${d.tenant}</strong></div><div><span>Device Type</span><strong>${deviceTypeLabel(d)}</strong></div><div><span>Last Communication</span><strong>${d.lastSeen}</strong></div></section>
  ${deviceKpis(d)}
  <section class="detail-layout-v58 device-detail-layout-v58 device-detail-layout-v59">${universalDeviceSidebar(d, deviceDetailActiveTab)}<main class="glass-card detail-main-v58"><div id="deviceDetailContent">${deviceDetailPanel(d,deviceDetailActiveTab)}</div></main></section>`;
}
function wireDeviceDetail(): void {
  const d=selectedDevice();
  if (!d.id) return;
  document.getElementById('refreshDeviceV59')?.addEventListener('click',()=>ZentridLayout.toast(`Device data refresh requested for ${d.name}`));
  window.ZentridDetailLazyTabs?.observe('device', 'device-detail-content', () => {
    const content=document.getElementById('deviceDetailContent');
    if(content) content.innerHTML=deviceDetailPanel(selectedDevice(), deviceDetailActiveTab);
  });
  document.querySelectorAll<HTMLElement>('[data-device-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    deviceDetailActiveTab = btn.dataset.deviceTab || 'overview';
    document.querySelectorAll<HTMLElement>('[data-device-tab]').forEach(item => {
      const active = item.dataset.deviceTab === deviceDetailActiveTab;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current','page'); else item.removeAttribute('aria-current');
    });
    window.ZentridDetailLazyTabs?.activate('device', String(deviceDetailActiveTab));
    const content=document.getElementById('deviceDetailContent');
    if(content) content.innerHTML=deviceDetailPanel(d, deviceDetailActiveTab);
  }));
}
