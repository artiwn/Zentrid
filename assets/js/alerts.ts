type AlertTone = 'danger' | 'warning' | 'success';
type AlertCheckTone = 'success' | 'danger' | 'muted' | 'warning';
type AlertDetailTabId = 'summary' | 'classification' | 'case' | 'sop' | 'timeline' | 'related' | 'activity' | 'actions';

interface ZentridAlertMeta {
  category: string;
  name: string;
  severity: string;
  deviceScope: string;
  policy: string;
  meaning: string;
  vendorMappings: string[];
}

interface ZentridAlertDictionaryModel {
  categories: string[];
  codes: Record<string, ZentridAlertMeta>;
}

interface ZentridAlertRecord {
  id: string;
  dataOrigin?: ZentridDataOrigin;
  zentridCode?: string;
  vendorRawCode?: string;
  vendorCode?: string;
  vendorMessage?: string;
  severity: string;
  priority: string;
  title: string;
  status: string;
  occurrenceStatus?: string;
  category: string;
  tenant: string;
  plantId: string;
  plant: string;
  deviceId: string;
  device: string;
  deviceType: string;
  vendor: string;
  source: string;
  integration: string;
  created: string;
  updated: string;
  age: string;
  sla: string;
  owner: string;
  telemetry: string;
  description: string;
  probableCause: string;
  recommendation: string;
  sourceAlertId?: string;
  sourcePlantId?: string;
  sourceDeviceId?: string;
  mappingStatus?: string;
  mappingVersion?: string;
  rawPayloadRef?: string;
  lastSyncAtUtc?: string;
  canonical?: Record<string, unknown>;
  mapping?: Record<string, unknown>;
  workflow?: Record<string, unknown>;
  assignment?: Record<string, unknown>;
  guidance?: Record<string, unknown>;
  audit?: Record<string, unknown>;
  vendorExtensions?: Record<string, unknown>;
  liveOperational?: Record<string, unknown>;
  adminSnapshot?: Record<string, unknown>;
  linkedDevice?: Record<string, unknown>;
  linkedLiveDevice?: Record<string, unknown>;
  linkedDeviceResolution?: { source?: string; adminId?: string; liveId?: string };
  subresourceSources?: {
    timeline?: 'admin' | 'live' | 'none';
    related?: 'admin' | 'live' | 'none';
    sop?: 'admin' | 'live' | 'none';
    telemetryCurve?: 'admin' | 'live' | 'none';
  };
  timeline: string[];
  related: {
    telemetryMetric: string;
    caseId: string;
    taskId: string;
    workOrderId?: string;
  };
  sop?: { procedureId?: string; procedureVersion?: string; title?: string; steps?: Array<{ id?: string; title?: string; completed?: boolean; owner?: string | null }>; notes?: string | null; outcome?: string; escalationTarget?: string | null; evidence?: string[] } | null;
  telemetryCurve?: { metricCode?: string; samples?: Array<{ timestampUtc?: string; value?: number | string; unit?: string }> } | null;
}

interface AlertContextState {
  plantId?: string;
  deviceId?: string;
  tenant?: string;
  status?: string;
  severity?: string;
}

interface AlertPagerState {
  page: number;
  size: number;
}

interface AlertPageSliceState {
  total: number;
  pages: number;
  page: number;
  start: number;
  end: number;
  rows: ZentridAlertRecord[];
}

interface AlertCheckRowInput {
  label: string;
  hint?: string;
  status?: string;
  checked?: boolean;
  input?: boolean;
  index?: string | number;
  required?: boolean;
}

interface AlertRuntimeState {
  acknowledged?: boolean;
  escalated?: boolean;
  resolved?: boolean;
  assignee?: string;
  taskId?: string;
  workOrder?: string;
  sopDone?: boolean[];
  evidence?: string[];
  notes?: string;
  outcome?: string;
  escalationTarget?: string;
}

interface AlertIncidentModel {
  caseId: string;
  caseStatus: string;
  assignee: string;
  priority: string;
  sla: string;
  due: string;
  taskId: string;
  workOrder: string;
  linkedClient: string;
  impact: string;
  nextStep: string;
}

interface AlertSopStep {
  label: string;
  done: boolean;
  owner: string;
  time: string;
}

interface AlertSopModel {
  title: string;
  procedure: string;
  completed: number;
  total: number;
  progress: number;
  outcome: string;
  backendOutcome: string;
  escalationTarget: string;
  evidence: string[];
  items: AlertSopStep[];
  hasDraft: boolean;
}

interface AlertDetailModel {
  levelLabel: string;
  occurrenceStatus: string;
  deviceLabel: string;
  plantName: string;
  alertTime: string;
  component: string;
  componentDetail: string;
  duration: string;
  alertType: string;
  confirmStatus: string;
  recoveryTime: string;
  curveMetric: string;
  samples: string[];
  reason: string[];
  suggestion: string[];
}

const ZentridAlertDictionary: ZentridAlertDictionaryModel = {
  categories:['Grid','PV / DC Side','Battery / BMS','Inverter','Communication','Metering','Safety','Optimizers','EV Charger','Configuration'],
  codes:{
    'FL-GRD-OV': { category:'Grid', name:'Grid Overvoltage', severity:'Fault', deviceScope:'Inverter / Grid Interface', policy:'Verify grid voltage, check utility fluctuation, contact client if recurring, escalate after repeated occurrences.', meaning:'Grid voltage is above accepted threshold.', vendorMappings:['Deye F42/F13','Huawei 2034','GoodWe 3','Sofar ID01/ID001','Solis 1010','Peimar IE09/IE11'] },
    'FL-PV-ISO': { category:'PV / DC Side', name:'PV Insulation / Isolation Fault', severity:'Fault', deviceScope:'PV String / Inverter', policy:'Open technical case, request visual/plant checks if remote validation is inconclusive.', meaning:'Insulation or residual current fault was detected.', vendorMappings:['Deye F23/F24/F12','Huawei 2051/2062','GoodWe 14/23','Solis 1033/1034','Peimar IE23/IE29'] },
    'FL-PV-ARC': { category:'PV / DC Side', name:'DC Arc Fault (AFCI)', severity:'Critical', deviceScope:'PV String / Inverter', policy:'Immediate critical escalation. Require technical validation and resolution evidence before closure.', meaning:'Potential DC arc fault / AFCI trip.', vendorMappings:['Huawei 2002','SunGrow 087/088','Solis 1041'] },
    'FL-BAT-COM': { category:'Battery / BMS', name:'Battery BMS Communication Lost', severity:'Fault', deviceScope:'Battery / BMS / ESS', policy:'Notify BESS specialist, check BMS communication path, escalate if storage operation is affected.', meaning:'Battery management system communication is lost.', vendorMappings:['Deye F58','Huawei 3000/3110','GoodWe 20/E10','SunGrow 514/714','Solis 2012','Peimar IE43/IE35'] },
    'FL-BAT-OT': { category:'Battery / BMS', name:'Battery Overtemperature', severity:'Fault', deviceScope:'Battery / BMS / ESS', policy:'Monitor trend, notify BESS specialist and contact client/plant if cooling check is required.', meaning:'Battery temperature is above allowed threshold.', vendorMappings:['Deye OT','Huawei 3105','GoodWe 12/E05','Sofar ID57','Peimar IE44'] },
    'FL-BAT-LOCK': { category:'Battery / BMS', name:'Battery Pack Locked', severity:'Critical', deviceScope:'Battery / ESS', policy:'Immediate escalation. Field validation may be required.', meaning:'Battery pack is locked or in critical safety state.', vendorMappings:['Huawei 3107/4003','Sofar Solid Red LED','Solis RED_SOLID'] },
    'FL-INV-INT': { category:'Inverter', name:'Internal Hardware Fault', severity:'Fault', deviceScope:'Inverter', policy:'Open technical case, validate telemetry, escalate if not remotely recoverable.', meaning:'Internal hardware or controller error reported by inverter.', vendorMappings:['Huawei 2064','GoodWe 31','Solax SPI/SCI Fault','Peimar IE01/IE08'] },
    'FL-INV-FAN': { category:'Inverter', name:'Fan Fault', severity:'Warning', deviceScope:'Inverter', policy:'Open maintenance task if persistent. Not every occurrence requires field visit.', meaning:'Cooling fan fault or abnormal speed.', vendorMappings:['Deye F63','GoodWe 30/32','SunGrow 70','Solis 1030/1031','Peimar IE58'] },
    'FL-COM-LOG': { category:'Communication', name:'Logger / Dongle Offline', severity:'Fault', deviceScope:'Logger / Dongle / Gateway', policy:'Notify support and client. Ask client to check internet, router and device power. Escalate if not restored.', meaning:'Logger or dongle stopped communicating.', vendorMappings:['Deye LOGGER_OFFLINE','Huawei RED Steady / Dongle Fault','GoodWe NET LED Red','Solax Blinking Red','Peimar IE36/IE32'] },
    'FL-COM-SRV': { category:'Communication', name:'Cloud / Server Connection Error', severity:'Warning', deviceScope:'Logger / Cloud Connector', policy:'Check connector health and retry before client contact unless plant is offline.', meaning:'Vendor cloud/server connection is delayed or unavailable.', vendorMappings:['Deye NET Flashing Red','Huawei RED Slow Blink','GoodWe Blink 4 Times','Solax NET Red','Peimar IE33'] },
    'FL-COM-RS': { category:'Communication', name:'RS485 Communication Error', severity:'Fault', deviceScope:'Meter / Inverter / Gateway', policy:'Check RS485 path, meter/inverter link and accounting impact. Assign technical task if data is affected.', meaning:'RS485 or internal communication failure.', vendorMappings:['Deye W04','Solis 2010','Sofar ID053','Peimar IE34/IE31/IE74'] },
    'FL-MTR-COM': { category:'Metering', name:'Meter Communication Lost', severity:'Fault', deviceScope:'Smart Meter', policy:'Validate accounting freshness; escalate if billing-ready records are affected.', meaning:'Meter communication is lost or delayed.', vendorMappings:['Deye W04','Huawei 2067','GoodWe 21','Sofar ID065','Solax Meter Fault','Solis 2011','Peimar IE65'] },
    'FL-MTR-CT': { category:'Metering', name:'CT / Meter Wiring Error', severity:'Warning', deviceScope:'Smart Meter / CT', policy:'Create verification task before using values for billing or settlement.', meaning:'Meter or CT wiring appears reversed or inconsistent.', vendorMappings:['Deye W03','Huawei Negative Values','SunGrow 601','Peimar IE65'] },
    'FL-SAF-FIRE': { category:'Safety', name:'Fire Suppression Triggered', severity:'Critical', deviceScope:'BESS / Safety System', policy:'Immediate escalation, notify responsible parties, require closure evidence.', meaning:'Fire suppression or safety system was triggered.', vendorMappings:['Sofar ID105','Solax FSS Trigger','SunGrow FSS Alert'] }
  }
};
function alertCodeMeta(a?: Partial<ZentridAlertRecord>): ZentridAlertMeta { const code=a?.zentridCode; return (code ? ZentridAlertDictionary.codes[code] : undefined) || { category:a?.category || 'Unmapped', name:a?.title || 'Unknown alert', severity:a?.severity || 'Unknown', deviceScope:a?.deviceType || '—', policy:'No canonical policy configured yet.', meaning:a?.description || 'No unified explanation configured.', vendorMappings:[] }; }
function vendorCodeLabel(a?: Partial<ZentridAlertRecord>): string { return `${a?.vendor || 'Vendor'} ${a?.vendorRawCode || a?.vendorCode || '—'}`; }
function vendorMappingStatus(a?: Partial<ZentridAlertRecord>): string { const backend=String(a?.mappingStatus || a?.mapping?.mappingStatus || '').trim(); return backend || 'Not returned'; }

function checkStatusClass(status?: string): AlertCheckTone {
  const v = String(status || '').toLowerCase();
  if (v.includes('done') || v.includes('pass') || v.includes('found') || v.includes('mapped')) return 'success';
  if (v.includes('fail') || v.includes('missing') || v.includes('unknown') || v.includes('blocked')) return 'danger';
  if (v.includes('skip')) return 'muted';
  return 'warning';
}
function renderCheckRow({ label, hint = '', status = 'Pending', checked = false, input = false, index = '', required = false }: AlertCheckRowInput): string {
  const cls = checkStatusClass(status);
  const req = required ? '<em>Required</em>' : '';
  const control = input
    ? `<input class="sop-check-input" data-index="${index}" type="checkbox" ${checked ? 'checked' : ''}>`
    : `<span class="check-indicator ${cls}">${cls === 'success' ? '✓' : cls === 'danger' ? '!' : cls === 'muted' ? '–' : '•'}</span>`;
  return `<label class="check-row ${cls} ${checked ? 'checked' : ''}">${control}<div><strong>${label}</strong><small>${hint}</small></div><span class="check-status ${cls}">${status}</span>${req}</label>`;
}
function renderMappingValidation(a: ZentridAlertRecord): string {
  const localMeta = a.zentridCode ? ZentridAlertDictionary.codes[a.zentridCode] : undefined;
  const mappingStatus = vendorMappingStatus(a);
  const items = [
    { label:'Vendor code received', hint: vendorCodeLabel(a), status: a.vendorRawCode || a.vendorCode ? 'Done' : 'Missing', checked: !!(a.vendorRawCode || a.vendorCode), required:true },
    { label:'Zentrid code assigned', hint: a.zentridCode || 'No canonical code returned', status: a.zentridCode ? 'Done' : 'Missing', checked: !!a.zentridCode, required:true },
    { label:'Backend mapping status', hint: mappingStatus, status: mappingStatus === 'Mapped' ? 'Done' : mappingStatus === 'Not returned' ? 'Pending' : mappingStatus, checked: mappingStatus === 'Mapped', required:true },
    { label:'Backend severity / category', hint: `${a.severity || '—'} · ${a.category || '—'}`, status: a.severity && a.category ? 'Done' : 'Missing', checked: !!(a.severity && a.category), required:true },
    { label:'Local dictionary reference', hint: localMeta ? `${localMeta.name} · UI reference only` : 'No local dictionary entry', status: localMeta ? 'Done' : 'Skipped', checked: !!localMeta },
    { label:'SLA', hint: a.sla || 'Not returned', status: a.sla && a.sla !== '—' ? 'Done' : 'Pending', checked: !!(a.sla && a.sla !== '—') }
  ];
  return `<div class="check-list validation-check-list-v86">${items.map(renderCheckRow).join('')}</div>`;
}
const ZentridAlerts: ZentridAlertRecord[] = [];

function alertTone(value?: string): AlertTone {
  const v = String(value || '').toLowerCase();
  if (v.includes('critical') || v.includes('p1') || v.includes('open') || v.includes('escalated')) return 'danger';
  if (v.includes('high') || v.includes('warning') || v.includes('acknowledged') || v.includes('p2') || v.includes('medium')) return 'warning';
  return 'success';
}

function alertRegistryBadge(compact = false): string {
  return `<span class="record-origin-chip live${compact ? ' compact' : ''}" data-record-origin="live" title="Data source: Alert Registry API · /api/admin/alerts">Alert Registry</span>`;
}
function alertDetailSourceBadge(a: ZentridAlertRecord, compact = true): string {
  if (a.liveOperational) return `<span class="record-origin-chip mixed${compact ? ' compact' : ''}" data-record-origin="mixed" title="Data source: Alert Registry + Platform Live">Registry + Live</span>`;
  return `<span class="record-origin-chip live${compact ? ' compact' : ''}" data-record-origin="live" title="Data source: Alert Registry API">Alert Registry API</span>`;
}
function alertDisplayValue(value: unknown): string {
  const text = String(value ?? '').trim();
  return text && text !== 'Unassigned' && text !== 'Unknown' ? text : '—';
}

function alertLinkedDeviceType(a: ZentridAlertRecord): { value: string; source: 'registry' | 'live' | 'none' } {
  const linked = a.linkedDevice && typeof a.linkedDevice === 'object' ? a.linkedDevice : {};
  const registryType = alertDisplayValue(linked.type || linked.deviceType || linked.subtype);
  if (registryType !== '—') return { value: registryType, source: 'registry' };
  const live = a.linkedLiveDevice && typeof a.linkedLiveDevice === 'object' ? a.linkedLiveDevice : {};
  const liveType = alertDisplayValue(live.type || live.deviceType || live.subtype || live.rawDeviceType);
  if (liveType !== '—') return { value: liveType, source: 'live' };
  return { value: '—', source: 'none' };
}

function alertResolvedAdminDeviceId(a: ZentridAlertRecord): string {
  const linked = a.linkedDevice && typeof a.linkedDevice === 'object' ? a.linkedDevice : {};
  return alertDisplayValue(linked.id || linked.adminId || linked.deviceId) === '—' ? '' : String(linked.id || linked.adminId || linked.deviceId || '').trim();
}

function alertDeviceResolutionLabel(a: ZentridAlertRecord): string {
  const source = String(a.linkedDeviceResolution?.source || '').trim();
  if (source === 'admin-id') return 'Direct Device Registry ID';
  if (source === 'admin-source-search') return 'Matched by sourceDeviceId + provider';
  if (source === 'plant-device-relation') return 'Matched in parent plant device relation';
  return alertResolvedAdminDeviceId(a) ? 'Device Registry identity resolved' : 'Not resolved';
}

function alertDeviceTypePresentation(a: ZentridAlertRecord): { label: string; detail: string; rawCode: string } {
  const rawCode = alertDisplayValue(a.deviceType);
  const linkedType = alertLinkedDeviceType(a);
  if (linkedType.value !== '—') {
    const sourceLabel = linkedType.source === 'registry' ? 'Device Registry classification' : 'Platform Live device classification';
    return {
      label: linkedType.value,
      detail: rawCode !== '—' && rawCode !== linkedType.value ? `${sourceLabel} · Alert source device-type value: ${rawCode}` : sourceLabel,
      rawCode
    };
  }
  if (rawCode !== '—' && /^\d+$/.test(rawCode)) {
    return { label: `Source code ${rawCode}`, detail: 'No canonical Device Registry or Platform Live device type was resolved for this alert.', rawCode };
  }
  return { label: rawCode, detail: rawCode === '—' ? 'Device type not returned by backend.' : 'Alert backend device-type value', rawCode };
}

function alertSubresourceSourceLabel(a: ZentridAlertRecord, resource: 'timeline' | 'related' | 'sop' | 'telemetryCurve'): string {
  const source = a.subresourceSources?.[resource] || 'none';
  if (source === 'admin') return `Alert Registry API · /api/admin/alerts/{id}/${resource === 'telemetryCurve' ? 'telemetry-curve' : resource}`;
  if (source === 'live') return `Platform Live API · /api/alerts/{id}/${resource === 'telemetryCurve' ? 'telemetry-curve' : resource}`;
  return 'Backend subresource not returned';
}

function getAlertContext(): AlertContextState {
  try { return JSON.parse(localStorage.getItem('zentrid_alert_context') || '{}'); } catch { return {}; }
}
function setAlertContextFromQuery(): void {
  const params = new URLSearchParams(location.search);
  const ctx: AlertContextState = {};
  (['plantId', 'deviceId', 'tenant', 'status', 'severity'] as const).forEach(k => {
    const value = params.get(k);
    if (value) ctx[k] = value;
  });
  if (Object.keys(ctx).length) localStorage.setItem('zentrid_alert_context', JSON.stringify(ctx));
}
function clearAlertContext(): void { localStorage.removeItem('zentrid_alert_context'); }

function filteredAlerts(): ZentridAlertRecord[] {
  const ctx = getAlertContext();
  const severity = document.getElementById('severityFilter')?.value || ctx.severity || 'All';
  const status = document.getElementById('statusFilter')?.value || ctx.status || 'All';
  const tenant = document.getElementById('tenantFilter')?.value || ctx.tenant || 'All';
  const plant = document.getElementById('plantFilter')?.value || 'All';
  const vendor = document.getElementById('vendorFilter')?.value || 'All';
  const q = (document.getElementById('alertSearch')?.value || '').trim().toLowerCase();
  return ZentridAlerts.filter(a =>
    (!ctx.plantId || a.plantId === ctx.plantId) &&
    (!ctx.deviceId || a.deviceId === ctx.deviceId) &&
    (severity === 'All' || a.severity === severity) &&
    (status === 'All' || a.status === status) &&
    (tenant === 'All' || a.tenant === tenant) &&
    (plant === 'All' || a.plant === plant || a.plantId === plant) &&
    (vendor === 'All' || a.vendor === vendor) &&
    (!q || `${a.title} ${a.plant} ${a.device} ${a.tenant} ${a.vendor} ${a.id} ${a.category} ${a.zentridCode || ''} ${a.vendorCode || ''} ${a.vendorRawCode || ''} ${a.vendorMessage || ''}`.toLowerCase().includes(q))
  );
}

function alertKpis(items: ZentridAlertRecord[] = filteredAlerts()): string {
  const critical = items.filter(a => a.severity === 'Critical').length;
  const fault = items.filter(a => a.severity === 'Fault').length;
  const warning = items.filter(a => a.severity === 'Warning').length;
  const open = items.filter(a => a.status === 'Open').length;
  return `
    <section class="kpi-grid compact-kpis alert-kpis">
      <article class="kpi-card red"><div class="kpi-label">Critical on Page</div><div class="kpi-value">${critical}</div><div class="kpi-delta">Current registry page only</div></article>
      <article class="kpi-card yellow"><div class="kpi-label">Fault on Page</div><div class="kpi-value">${fault}</div><div class="kpi-delta">Current registry page only</div></article>
      <article class="kpi-card cyan"><div class="kpi-label">Warning on Page</div><div class="kpi-value">${warning}</div><div class="kpi-delta">Current registry page only</div></article>
      <article class="kpi-card violet"><div class="kpi-label">Open on Page</div><div class="kpi-value">${open}</div><div class="kpi-delta">Current registry page only</div></article>
    </section>`;
}
function renderAlertContextBanner(): string {
  const ctx = getAlertContext();
  if (!ctx.plantId && !ctx.deviceId && !ctx.tenant) return '';
  const parts: string[] = [];
  if (ctx.tenant) parts.push(`Tenant: ${ctx.tenant}`);
  if (ctx.plantId) parts.push(`Plant ID: ${ctx.plantId}`);
  if (ctx.deviceId) parts.push(`Device ID: ${ctx.deviceId}`);
  return `<section class="context-banner glass-card"><div><strong>Filtered alert context</strong><small>${parts.join(' · ')}</small></div><button class="secondary-action" id="clearAlertContext">Clear context</button></section>`;
}

function renderAlertFilters(): string {
  const ctx = getAlertContext();
  const queryState = window.ZentridRegistryQuery?.read('alerts');
  const selected = {
    severity: queryState?.params.severity || ctx.severity || 'All',
    status: queryState?.params.alertStatus || ctx.status || 'All',
    tenant: queryState?.params.tenant || ctx.tenant || 'All',
    plant: queryState?.params.plant || 'All',
    vendor: queryState?.params.vendor || 'All',
    search: queryState?.search || ''
  };
  const opt = (value: string, current: string): string => `<option ${value === current ? 'selected' : ''}>${value}</option>`;
  const apiValues = (field: keyof ZentridAlertRecord): string[] => ['All', ...Array.from(new Set(ZentridAlerts.map(alert => String(alert[field] || '').trim()).filter(Boolean)))];
  return `
    <section class="filter-bar glass-card alert-filter-bar">
      <label>Severity<select id="severityFilter">${apiValues('severity').map(x => opt(x, selected.severity)).join('')}</select></label>
      <label>Status<select id="statusFilter">${apiValues('status').map(x => opt(x, selected.status)).join('')}</select></label>
      <label>Tenant<select id="tenantFilter">${apiValues('tenant').map(x => opt(x, selected.tenant)).join('')}</select></label>
      <label>Plant<select id="plantFilter">${apiValues('plant').map(x => opt(x, selected.plant)).join('')}</select></label>
      <label>Vendor<select id="vendorFilter">${apiValues('vendor').map(x => opt(x, selected.vendor)).join('')}</select></label>
      <label>Search<input id="alertSearch" value="${String(selected.search).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" placeholder="Search current page by alert, plant, device..." /></label>
    </section>
    <div id="alertFilterScopeV126">${window.ZentridRegistryQuery?.filterScopeHtml('alerts') || ''}</div>`;
}

function alertRow(a: ZentridAlertRecord): string {
  return `
    <div class="data-row alert-row" data-alert-id="${a.id}">
      <div>${alertRegistryBadge()}<strong>${a.zentridCode || '—'}</strong><small>Vendor: ${vendorCodeLabel(a)}</small></div>
      <div><strong>${a.title || '—'}</strong><small>${a.id} · ${a.category || '—'} · Mapping ${vendorMappingStatus(a)}</small></div>
      <div><strong>${a.plant || '—'}</strong><small>${a.tenant || '—'} · ${a.device || '—'}</small></div>
      <div><strong>${a.vendor || '—'}</strong><small>${a.source || '—'}</small></div>
      <span class="badge ${alertTone(a.severity)}">${a.severity || '—'}</span>
      <span class="badge ${alertTone(a.status)}">${a.status || '—'}</span>
      <div><strong>${a.created || '—'}</strong><small>${a.sla || '—'}</small></div>
      <div class="row-actions kebabified"><div class="kebab-wrap global-action-wrap"><button type="button" class="kebab-btn" data-action="menu" aria-label="Open actions" title="Actions">⋮</button><div class="kebab-menu global-action-menu"><button data-action="open-alert" data-id="${a.id}" type="button">Open</button><button data-action="ack" data-id="${a.id}" type="button" ${String(a.status).toLowerCase().includes('acknowledged') || String(a.status).toLowerCase().includes('resolved') ? 'disabled aria-disabled="true" title="Already acknowledged or resolved"' : ''}>Acknowledge</button></div></div></div>
    </div>`;
}
var ZentridAlertPager: AlertPagerState = window.ZentridAlertPager || (window.ZentridAlertPager = { page: 1, size: 50 });
function alertPageSlice(items: ZentridAlertRecord[]): AlertPageSliceState {
  const serverPagination = window.ZentridRegistryQuery?.pagination('alerts');
  if (serverPagination) {
    return {
      total: serverPagination.totalCount,
      pages: serverPagination.totalPages,
      page: serverPagination.page,
      start: (serverPagination.page - 1) * serverPagination.pageSize,
      end: Math.min(serverPagination.page * serverPagination.pageSize, serverPagination.totalCount),
      rows: items
    };
  }
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / ZentridAlertPager.size));
  ZentridAlertPager.page = Math.min(Math.max(1, Number(ZentridAlertPager.page) || 1), pages);
  const start = (ZentridAlertPager.page - 1) * ZentridAlertPager.size;
  return { total, pages, page: ZentridAlertPager.page, start, end: Math.min(start + ZentridAlertPager.size, total), rows: items.slice(start, start + ZentridAlertPager.size) };
}
function alertPagerHtml(state: AlertPageSliceState): string {
  const serverPagination = window.ZentridRegistryQuery?.pagination('alerts');
  if (serverPagination) return window.ZentridRegistryQuery?.pagerHtml('alerts', state.rows.length) || '';
  if (state.total <= ZentridAlertPager.size) return `<div class="pagination-bar"><span>Showing ${state.total} row(s)</span></div>`;
  return `<div class="pagination-bar"><span>Showing ${state.start + 1}-${state.end} of ${state.total}</span><div class="row-actions"><button data-alert-page="prev" ${state.page<=1?'disabled':''}>Prev</button><strong>Page ${state.page} / ${state.pages}</strong><button data-alert-page="next" ${state.page>=state.pages?'disabled':''}>Next</button></div></div>`;
}
function renderAlertRowsPage(items: ZentridAlertRecord[]): string {
  const state = alertPageSlice(items);
  return `${alertPagerHtml(state)}<div class="data-table alerts-table"><div class="data-head alert-head"><span>Alert Codes</span><span>Alert</span><span>Plant / Device</span><span>Source</span><span>Severity</span><span>Status</span><span>SLA</span><span>Actions</span></div><div id="alertsRows">${state.rows.length ? state.rows.map(alertRow).join('') : '<div class="empty-state">No alerts match current filters.</div>'}</div></div>${alertPagerHtml(state)}`;
}
function renderAlertsTable(items: ZentridAlertRecord[] = filteredAlerts()): string {
  return `
    <section class="panel glass-card">
      <div class="panel-head">
        <div><p class="eyebrow">Master data · /api/admin/alerts</p><h2>Alert Registry</h2><p>Administrative alert records, canonical mapping fields and workflow state. KPI cards above describe the currently loaded registry page only.</p></div>
        <div class="inline-actions"><button class="secondary-action" id="resetAlertFilters">Reset Filters</button><button class="primary-action" id="exportAlerts">Export Registry</button></div>
      </div>
      <div id="alertsTableHost">${renderAlertRowsPage(items)}</div>
    </section>`;
}
function selectedAlert(): ZentridAlertRecord {
  const firstAlert = ZentridAlerts[0];
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || localStorage.getItem('zentrid_selected_alert') || firstAlert?.id || '';
  const snapshot = window.ZentridLiveSelection?.readAlert?.(id) as ZentridAlertRecord | null | undefined;
  return ZentridAlerts.find(x => x.id === id) ?? snapshot ?? (!id ? firstAlert : undefined) ?? ({} as ZentridAlertRecord);
}

function openAlert(id: string): void {
  const record = ZentridAlerts.find(alert => alert.id === id);
  if (record && window.ZentridLiveSelection?.selectAlert) { window.ZentridLiveSelection.selectAlert(record); return; }
  localStorage.setItem('zentrid_selected_alert', id);
  location.href = `alert-detail.html?id=${encodeURIComponent(id)}`;
}

function applyAlertFilters(resetPage = true): void {
  if (resetPage && !window.ZentridRegistryQuery?.pagination('alerts')) ZentridAlertPager.page = 1;
  const kpiWrap = document.getElementById('alertKpiWrap');
  const host = document.getElementById('alertsTableHost');
  const items = filteredAlerts();
  if (kpiWrap) ZentridRuntimeStability.replaceHtml(kpiWrap, alertKpis(items));
  if (host) ZentridRuntimeStability.replaceHtml(host, renderAlertRowsPage(items));
  const severity = document.getElementById('severityFilter')?.value || 'All';
  const status = document.getElementById('statusFilter')?.value || 'All';
  const tenant = document.getElementById('tenantFilter')?.value || 'All';
  const plant = document.getElementById('plantFilter')?.value || 'All';
  const vendor = document.getElementById('vendorFilter')?.value || 'All';
  const search = (document.getElementById('alertSearch')?.value || '').trim();
  window.ZentridRegistryQuery?.update('alerts', { search: search || null, severity: severity === 'All' ? null : severity, alertStatus: status === 'All' ? null : status, tenant: tenant === 'All' ? null : tenant, plant: plant === 'All' ? null : plant, vendor: vendor === 'All' ? null : vendor }, { replace: true, emit: false });
  const scope = document.getElementById('alertFilterScopeV126');
  if (scope) scope.innerHTML = window.ZentridRegistryQuery?.filterScopeHtml('alerts') || '';
}

function renderAlertRegistryContext(): string {
  const pagination = window.ZentridRegistryQuery?.pagination('alerts');
  const rows = ZentridAlerts;
  const total = pagination?.totalCount ?? rows.length;
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const mapped = rows.filter(a => vendorMappingStatus(a) === 'Mapped').length;
  const open = rows.filter(a => a.status === 'Open').length;
  const providers = new Set(rows.map(a => String(a.vendor || '').trim()).filter(Boolean)).size;
  return `<section class="context-bar glass-card"><div class="ctx-item"><span>Registry Records</span><strong>${total.toLocaleString()}</strong></div><div class="ctx-item"><span>Registry Page</span><strong>${page} / ${totalPages}</strong></div><div class="ctx-item"><span>Rows Loaded</span><strong>${rows.length}</strong></div><div class="ctx-item"><span>Mapped on Page</span><strong>${mapped}</strong></div><div class="ctx-item"><span>Open on Page</span><strong>${open}</strong></div><div class="ctx-item"><span>Providers on Page</span><strong>${providers}</strong></div></section>`;
}

function renderOperationalAlertSnapshot(): string {
  const state = String(window.ZentridOperationalAlertsState || 'pending');
  const rows = Array.isArray(window.ZentridOperationalAlerts) ? window.ZentridOperationalAlerts as ZentridAlertRecord[] : [];
  const pagination = window.ZentridOperationalAlertPagination as { totalCount?: number; page?: number; totalPages?: number } | undefined;
  const total = Number(pagination?.totalCount ?? 0);
  if (state === 'pending') return `<section class="panel glass-card" id="alertOperationalSnapshot"><div class="panel-head"><div><p class="eyebrow">Operational data · /api/alerts</p><h2>Operational Alert Snapshot</h2><p>Operational alerts load separately from the administrative Alert Registry.</p></div></div><div class="empty-state"><strong>Loading operational alert data…</strong><small>/api/alerts is loading independently from /api/admin/alerts.</small></div></section>`;
  if (state === 'error') return `<section class="panel glass-card" id="alertOperationalSnapshot"><div class="panel-head"><div><p class="eyebrow">Operational data · /api/alerts</p><h2>Operational Alert Snapshot</h2><p>The administrative Alert Registry remains available.</p></div><button class="go" type="button" data-live-refresh="alerts">Retry</button></div><div class="empty-state"><strong>Operational alert data unavailable</strong><small>No operational counts are inferred from the current registry page.</small></div></section>`;
  const open = rows.filter(a => a.status === 'Open').length;
  const acknowledged = rows.filter(a => a.status === 'Acknowledged').length;
  const critical = rows.filter(a => a.severity === 'Critical').length;
  const fault = rows.filter(a => a.severity === 'Fault').length;
  const warning = rows.filter(a => a.severity === 'Warning').length;
  const otherSeverity = Math.max(0, rows.length - critical - fault - warning);
  const tableRows = rows.map(a => `<div class="data-row"><div><strong>${a.title || '—'}</strong><small>${a.zentridCode || '—'} · ${a.sourceAlertId || a.id}</small></div><div><strong>${a.plant || '—'}</strong><small>${a.device || '—'}</small></div><div><strong>${a.vendor || '—'}</strong><small>${vendorCodeLabel(a)}</small></div><div><span class="badge ${alertTone(a.severity)}">${a.severity || '—'}</span><small>${a.category || '—'}</small></div><div><span class="badge ${alertTone(a.status)}">${a.status || '—'}</span><small>${a.occurrenceStatus || '—'}</small></div><div><strong>${a.created || '—'}</strong><small>Sync ${a.lastSyncAtUtc || a.updated || '—'}</small></div></div>`).join('');
  return `<section class="panel glass-card" id="alertOperationalSnapshot"><div class="panel-head"><div><p class="eyebrow">Operational data · /api/alerts</p><h2>Operational Alert Snapshot</h2><p>Separate live view. Registry rows are not joined to this snapshot by page position.</p></div><button class="go" type="button" data-live-refresh="alerts">Refresh</button></div><div class="integration-live-summary-grid"><article><span>Operational alerts</span><strong>${total.toLocaleString()}</strong><small>/api/alerts totalCount</small></article><article><span>Rows loaded</span><strong>${rows.length}</strong><small>Operational snapshot only</small></article><article><span>Open / Acknowledged</span><strong>${open} / ${acknowledged}</strong><small>Current snapshot page</small></article><article><span>Severity sample</span><strong>${critical} / ${fault} / ${warning} / ${otherSeverity}</strong><small>Critical · Fault · Warning · Other</small></article></div><div class="data-table alert-operational-table zentrid-responsive-table" aria-label="Operational Alert Snapshot"><div class="data-head"><span>Alert</span><span>Plant / Device</span><span>Provider</span><span>Severity</span><span>Status</span><span>Occurred / Sync</span></div>${tableRows || '<div class="empty-state"><strong>No operational alerts on this page</strong><small>The /api/alerts snapshot returned no rows.</small></div>'}</div></section>`;
}

function renderAlertsPage(): string {
  setAlertContextFromQuery();
  return `
    <section class="page-hero">
      <div><p class="eyebrow">Global Admin · Alerts</p><h1>Alerts</h1><p class="muted">Administrative Alert Registry and a separate operational snapshot. Backend severity, category and workflow fields remain authoritative.</p></div>
      <button class="freshness-card" type="button" data-live-refresh="alerts"><span class="pulse"></span><div><strong>Alert freshness</strong><small>Registry + operational API</small></div></button>
    </section>
    ${renderAlertContextBanner()}
    ${renderAlertRegistryContext()}
    <div id="alertKpiWrap">${alertKpis()}</div>
    ${renderAlertFilters()}
    ${renderAlertsTable()}
    ${renderOperationalAlertSnapshot()}`;
}
function wireAlertsPage(): void {
  document.querySelector('.main-content')?.addEventListener('click', (e: Event) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    const ack = target.closest('[data-action="ack"]');
    if (ack) {
      e.stopPropagation();
      const id = ack.dataset.id || '';
      const record = ZentridAlerts.find(alert => alert.id === id);
      if (record) void runAlertMutation(record, 'acknowledge').then(() => {
        record.status = 'Acknowledged';
        saveAlertRuntimeState(record, { acknowledged: true });
        ZentridLayout.toast(`Alert ${id} acknowledged by backend`);
        applyAlertFilters(false);
      }).catch(error => ZentridLayout.toast(error instanceof Error ? error.message : `Unable to acknowledge ${id}`));
      return;
    }
    const open = target.closest('[data-action="open-alert"]') || target.closest('.alerts-table .data-row');
    if (open) {
      const id = open.dataset.id || open.dataset.alertId || open.closest('[data-alert-id]')?.dataset.alertId;
      if (id) openAlert(id);
      return;
    }
    const pageBtn = target.closest('[data-alert-page]');
    if (pageBtn && !window.ZentridRegistryQuery?.pagination('alerts')) { ZentridAlertPager.page += pageBtn.dataset.alertPage === 'next' ? 1 : -1; applyAlertFilters(false); return; }
    if (target.closest('#resetAlertFilters')) {
      ['severityFilter','statusFilter','tenantFilter','plantFilter','vendorFilter'].forEach(id => { const el = document.getElementById(id); if (el) el.value = 'All'; });
      const s = document.getElementById('alertSearch'); if (s) s.value = '';
      window.ZentridRegistryQuery?.update('alerts', { search: null, severity: null, alertStatus: null, tenant: null, plant: null, vendor: null }, { replace: true, emit: false });
      applyAlertFilters(true);
    }
    if (target.closest('#clearAlertContext')) { clearAlertContext(); location.reload(); }
    if (target.closest('#exportAlerts')) { e.preventDefault(); void exportAlertsCsv(); }
  });
  document.getElementById('alertSearch')?.addEventListener('input', () => ZentridRuntimeStability.debounce('registry:alerts:search', () => applyAlertFilters(true), 220));
  ['severityFilter','statusFilter','tenantFilter','plantFilter','vendorFilter'].forEach(id => document.getElementById(id)?.addEventListener('change', () => applyAlertFilters(true)));
}


async function exportAlertsCsv(): Promise<void> {
  const query: Record<string, string | number> = {};
  const params = new URLSearchParams(location.search);
  ['severity','alertStatus','status','tenant','plant','vendor','plantId','deviceId','tenantId','search','cursor','format'].forEach(key => {
    const value = params.get(key);
    if (value) query[key] = value;
  });
  query.page = Number(params.get('page') || 1);
  query.pageSize = Number(params.get('pageSize') || 20);
  try {
    ZentridLayout.toast('Preparing filtered alert export…');
    const result = await ZentridPlatformAPI.adminAlerts.exportCsv(query);
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = result.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    ZentridLayout.toast(`${result.filename} downloaded`);
  } catch (error) {
    ZentridLayout.toast(error instanceof Error ? error.message : 'Alert export failed');
  }
}

function currentAlertActor(): string {
  const session = ZentridPlatformAPI.auth.session();
  return String(session?.user?.username || session?.user?.email || 'globaladmin');
}

async function runAlertMutation(a: ZentridAlertRecord, action: 'acknowledge' | 'assign' | 'escalate' | 'resolve' | 'task' | 'sop'): Promise<void> {
  const actor = currentAlertActor();
  if (action === 'acknowledge') {
    await ZentridPlatformAPI.adminAlerts.acknowledge(a.id, { actor, comment: 'Acknowledged from Zentrid Alert Detail' });
  } else if (action === 'sop') {
    const sop = alertSopModel(a);
    if (a.subresourceSources?.sop !== 'admin') throw new Error('Global Admin can only update an SOP returned by the Alert Registry API.');
    if (!a.sop || !Array.isArray(a.sop.steps) || !a.sop.steps.length || !sop.total) throw new Error('No backend SOP is available for this alert.');
    await ZentridPlatformAPI.adminAlerts.updateSop(a.id, {
      procedureId: a.sop.procedureId || '',
      procedureVersion: a.sop.procedureVersion || '',
      title: a.sop.title || sop.title,
      steps: sop.items.map((item, index) => ({ id: a.sop?.steps?.[index]?.id || String(index + 1), title: item.label, completed: item.done, owner: item.owner === '—' ? null : item.owner })),
      notes: String(document.getElementById('sopResolutionNotes')?.value || a.sop.notes || ''),
      outcome: String((document.getElementById('sopOutcome') as HTMLSelectElement | null)?.value || a.sop.outcome || ''),
      escalationTarget: String((document.getElementById('sopEscalationTarget') as HTMLSelectElement | null)?.value || a.sop.escalationTarget || ''),
      evidence: Array.isArray(a.sop.evidence) ? a.sop.evidence : []
    });
  } else {
    throw new Error('This action requires explicit operator input. No default backend payload is sent.');
  }
  window.ZentridAPIRepositories?.cache.invalidate('alerts');
}
function wireAlertDetailPage(): void {
  const a = selectedAlert();
  if (!a.id) return;
  document.querySelectorAll('.alert-detail-nav-v71 button').forEach(btn => btn.onclick = () => {
    document.querySelectorAll('.alert-detail-nav-v71 button').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    const content = document.getElementById('alertDetailContent');
    if (content) content.innerHTML = alertDetailTab(a, btn.dataset.tab);
    bindAlertDetailActions(a);
  });
  bindAlertDetailActions(a);
}
function bindAlertDetailActions(a: ZentridAlertRecord): void {
  const plant = document.getElementById('openAlertPlant');
  if (plant && a.plantId) plant.onclick = () => { localStorage.setItem('zentrid_selected_plant', a.plantId); location.href = 'plant-detail.html'; };
  const resolvedAdminDeviceId = alertResolvedAdminDeviceId(a);
  const device = document.getElementById('openAlertDevice');
  if (device && resolvedAdminDeviceId) device.onclick = () => { localStorage.setItem('zentrid_selected_device', resolvedAdminDeviceId); location.href = `device-detail.html?id=${encodeURIComponent(resolvedAdminDeviceId)}`; };
  const heroDevice = document.getElementById('openAlertDeviceFromHero');
  if (heroDevice && resolvedAdminDeviceId) heroDevice.onclick = () => { localStorage.setItem('zentrid_selected_device', resolvedAdminDeviceId); location.href = `device-detail.html?id=${encodeURIComponent(resolvedAdminDeviceId)}`; };
  const tel = document.getElementById('openAlertTelemetry');
  if (tel) tel.onclick = () => { localStorage.setItem('zentrid_telemetry_context', JSON.stringify({ tenant: a.tenant, plant: a.plant, device: a.device, metric: a.related?.telemetryMetric || '', range: localStorage.getItem('zentrid_time') || 'Last 24h', layer: 'Normalized' })); location.href = 'telemetry.html'; };

  const acknowledge = async (button: HTMLElement): Promise<void> => {
    try {
      await runAlertMutation(a, 'acknowledge');
      saveAlertRuntimeState(a, { acknowledged: true });
      a.status = 'Acknowledged';
      ZentridLayout.toast(`Alert ${a.id} acknowledged by backend`);
      const hero = document.querySelector<HTMLElement>('.alert-detail-hero');
      if (hero) hero.outerHTML = alertDetailHero(a, alertDetailModel(a));
      const kpis = document.querySelector<HTMLElement>('.alert-detail-kpis');
      if (kpis) kpis.outerHTML = alertDetailKpis(a);
      rerenderActiveAlertTab(a);
      bindAlertDetailActions(a);
    } catch (error) {
      ZentridLayout.toast(error instanceof Error ? error.message : `Unable to acknowledge ${a.id}`);
    }
  };
  ['detailAck','actionAck'].forEach(id => document.querySelectorAll<HTMLElement>(`#${id}`).forEach(button => button.onclick = () => { void acknowledge(button); }));

  if (a.sop && Array.isArray(a.sop.steps) && a.sop.steps.length) {
    document.querySelectorAll<HTMLElement>('#actionSopSave').forEach(button => button.onclick = async () => {
      if (button.hasAttribute('disabled')) return;
      try {
        const draft = alertSopModel(a);
        const runtime = alertRuntimeState(a);
        const notes = String((document.getElementById('sopResolutionNotes') as HTMLTextAreaElement | null)?.value || runtime.notes || a.sop?.notes || '');
        await runAlertMutation(a, 'sop');
        if (a.sop) {
          a.sop.steps = (a.sop.steps || []).map((step, index) => ({ ...step, completed: Boolean(draft.items[index]?.done) }));
          if (runtime.outcome !== undefined) a.sop.outcome = runtime.outcome;
          a.sop.notes = notes;
        }
        localStorage.removeItem(`zentrid_alert_runtime_${a.id}`);
        ZentridLayout.toast(`SOP progress saved for ${a.id}`);
        rerenderActiveAlertTab(a);
      } catch (error) { ZentridLayout.toast(error instanceof Error ? error.message : `Unable to save SOP for ${a.id}`); }
    });
    document.querySelectorAll('.sop-check-input').forEach(input => {
      (input as HTMLInputElement).onchange = () => {
        const current = alertRuntimeState(a);
        const total = a.sop?.steps?.length || 0;
        const done = Array.isArray(current.sopDone) ? [...current.sopDone] : (a.sop?.steps || []).map(step => Boolean(step.completed));
        while (done.length < total) done.push(false);
        done[Number((input as HTMLInputElement).dataset.index)] = (input as HTMLInputElement).checked;
        saveAlertRuntimeState(a, { sopDone: done });
        rerenderActiveAlertTab(a);
      };
    });
    const outcome = document.getElementById('sopOutcome');
    if (outcome) (outcome as HTMLSelectElement).onchange = () => saveAlertRuntimeState(a, { outcome: (outcome as HTMLSelectElement).value });
    const notes = document.getElementById('sopResolutionNotes');
    if (notes) (notes as HTMLTextAreaElement).oninput = () => saveAlertRuntimeState(a, { notes: (notes as HTMLTextAreaElement).value });
  }
}
function alertRuntimeState(a: ZentridAlertRecord): AlertRuntimeState {
  try { return JSON.parse(localStorage.getItem(`zentrid_alert_runtime_${a.id}`) || '{}'); }
  catch { return {}; }
}
function saveAlertRuntimeState(a: ZentridAlertRecord, patch: Partial<AlertRuntimeState>): AlertRuntimeState {
  const next = Object.assign({}, alertRuntimeState(a), patch || {});
  localStorage.setItem(`zentrid_alert_runtime_${a.id}`, JSON.stringify(next));
  return next;
}
function rerenderActiveAlertTab(a: ZentridAlertRecord): void {
  const active = document.querySelector('.alert-detail-nav-v71 button.active')?.dataset.tab || 'summary';
  const host = document.getElementById('alertDetailContent');
  if (host) host.innerHTML = alertDetailTab(a, active);
  bindAlertDetailActions(a);
}
function alertIncidentModel(a: ZentridAlertRecord): AlertIncidentModel {
  const workflow = a.workflow && typeof a.workflow === 'object' ? a.workflow as Record<string, unknown> : {};
  const assignment = a.assignment && typeof a.assignment === 'object' ? a.assignment as Record<string, unknown> : {};
  const guidance = a.guidance && typeof a.guidance === 'object' ? a.guidance as Record<string, unknown> : {};
  const caseId = alertDisplayValue(a.related?.caseId);
  return {
    caseId,
    caseStatus: caseId !== '—' ? alertDisplayValue(workflow.caseStatus || workflow.incidentStatus) : '—',
    assignee: alertDisplayValue(assignment.assigneeName || a.owner),
    priority: alertDisplayValue(a.priority),
    sla: alertDisplayValue(a.sla),
    due: alertDisplayValue(workflow.dueAtUtc || workflow.slaDueAtUtc || workflow.dueAt),
    taskId: alertDisplayValue(a.related?.taskId),
    workOrder: alertDisplayValue(a.related?.workOrderId),
    linkedClient: alertDisplayValue(a.tenant),
    impact: alertDisplayValue(guidance.impact || guidance.businessImpact),
    nextStep: alertDisplayValue(a.recommendation)
  };
}
function alertCaseTimeline(a: ZentridAlertRecord): string {
  const rows = Array.isArray(a.timeline) ? a.timeline.filter(Boolean) : [];
  if (!rows.length) return `<div class="empty-state"><strong>No incident timeline returned</strong><small>The alert timeline endpoint returned no events for this record.</small></div>`;
  return `<div class="incident-timeline">${rows.map((row, i)=>`<div class="incident-step done"><b>${i+1}</b><div><strong>Backend event</strong><span>${row}</span></div></div>`).join('')}</div>`;
}
function alertSopModel(a: ZentridAlertRecord): AlertSopModel {
  const liveSop = a.sop;
  if (liveSop && Array.isArray(liveSop.steps) && liveSop.steps.length) {
    const runtime = alertRuntimeState(a);
    const hasDraft = Array.isArray(runtime.sopDone)
      || Object.prototype.hasOwnProperty.call(runtime, 'outcome')
      || Object.prototype.hasOwnProperty.call(runtime, 'notes')
      || Object.prototype.hasOwnProperty.call(runtime, 'escalationTarget');
    const doneState = Array.isArray(runtime.sopDone) ? runtime.sopDone : liveSop.steps.map(step => Boolean(step.completed));
    const completed = doneState.filter(Boolean).length;
    return {
      title: liveSop.title || 'Alert SOP',
      procedure: [liveSop.procedureId, liveSop.procedureVersion].filter(Boolean).join(' · ') || '—',
      completed,
      total: liveSop.steps.length,
      progress: Math.round((completed / liveSop.steps.length) * 100),
      outcome: runtime.outcome || liveSop.outcome || '—',
      backendOutcome: liveSop.outcome || '—',
      escalationTarget: runtime.escalationTarget || liveSop.escalationTarget || '—',
      evidence: Array.isArray(liveSop.evidence) ? liveSop.evidence : [],
      items: liveSop.steps.map((step, i) => ({
        label: step.title || step.id || `Step ${i + 1}`,
        done: Boolean(doneState[i]),
        owner: alertDisplayValue(step.owner),
        time: doneState[i] ? 'Completed · timestamp not returned' : 'Pending'
      })),
      hasDraft
    };
  }
  return { title:'No SOP returned', procedure:'—', completed:0, total:0, progress:0, outcome:'—', backendOutcome:'—', escalationTarget:'—', evidence:[], items:[], hasDraft:false };
}
function alertSopChecklistBlock(a: ZentridAlertRecord): string {
  const sop = alertSopModel(a);
  const source = a.subresourceSources?.sop || 'none';
  if (!sop.total) return `<section class="alert-sop-card glass-card"><div class="sop-head"><div><span class="eyebrow">SOP Checklist</span><h2>No SOP returned</h2><p class="muted">${alertSubresourceSourceLabel(a, 'sop')}</p></div></div><div class="empty-state"><strong>No resolution procedure is available from backend</strong><small>The alert SOP endpoint returned no procedure steps. Zentrid does not generate a synthetic checklist.</small></div></section>`;
  const runtime = alertRuntimeState(a);
  const editable = source === 'admin';
  const sourceName = source === 'admin' ? 'Alert Registry' : source === 'live' ? 'Platform Live' : 'Backend';
  return `
    <section class="alert-sop-card glass-card">
      <div class="sop-head">
        <div><span class="eyebrow">SOP Checklist · ${sourceName}${sop.hasDraft ? ' · Draft changes' : ''}</span><h2>${sop.title}</h2><p class="muted">${sop.procedure} · ${sop.completed} / ${sop.total} completed · ${alertSubresourceSourceLabel(a, 'sop')}</p></div>
        <div class="sop-progress"><strong>${sop.progress}%</strong><span>${sop.hasDraft ? 'Draft completion' : 'Completion'}</span></div>
      </div>
      <div class="sop-progress-bar"><i style="width:${sop.progress}%"></i></div>
      <div class="sop-checklist sop-checklist-interactive">${sop.items.map((item, idx) => renderCheckRow({ label:item.label, hint:`Owner: ${item.owner} · ${item.time}`, status:item.done ? 'Done' : 'Pending', checked:item.done, input:editable, index:idx })).join('')}</div>
      <div class="sop-bottom-grid">
        <div class="sop-evidence"><h3>Backend Evidence Requirements</h3><div>${sop.evidence.length ? sop.evidence.map(x => `<span class="badge neutral">${x}</span>`).join('') : '<small>No evidence requirements returned.</small>'}</div></div>
        <label class="sop-notes"><span>Resolution Notes</span><textarea id="sopResolutionNotes" placeholder="Operator findings and evidence notes..." ${editable ? '' : 'disabled aria-disabled="true"'}>${runtime.notes || a.sop?.notes || ''}</textarea></label>
        <div class="sop-outcome"><span>Outcome</span><select id="sopOutcome" ${editable ? '' : 'disabled aria-disabled="true"'}><option value="">Not set</option><option ${sop.outcome === 'In Progress' ? 'selected' : ''}>In Progress</option><option ${sop.outcome === 'Pass' ? 'selected' : ''}>Pass</option><option ${sop.outcome === 'Fail' ? 'selected' : ''}>Fail</option><option ${sop.outcome === 'Needs Escalation' ? 'selected' : ''}>Needs Escalation</option></select><small>Backend current value: ${sop.backendOutcome}${sop.hasDraft ? ' · unsaved browser draft shown above' : ''}</small></div>
      </div>
      <div class="incident-actions sop-actions"><button id="actionSopSave" type="button" ${editable ? '' : 'disabled aria-disabled="true" title="Platform Live SOP is read-only in Global Admin until an Alert Registry SOP is returned"'}>Save SOP Progress</button></div>
    </section>`;
}
function alertDetailModel(a: ZentridAlertRecord): AlertDetailModel {
  const workflow = a.workflow && typeof a.workflow === 'object' ? a.workflow : {};
  const vendorExtensions = a.vendorExtensions && typeof a.vendorExtensions === 'object' ? a.vendorExtensions : {};
  const occurrenceStatus = String(a.occurrenceStatus || workflow.occurrenceStatus || 'Unknown');
  const acknowledged = Boolean(workflow.acknowledgedAtUtc || workflow.acknowledgedBy) || String(a.status || '').toLowerCase().includes('acknowledged');
  const recoveredAt = workflow.recoveredAtUtc || workflow.resolvedAtUtc || null;
  const reason = String(a.probableCause || vendorExtensions.reason || '').trim();
  const suggestion = String(a.recommendation || vendorExtensions.suggestion || '').trim();
  const deviceType = alertDeviceTypePresentation(a);
  return {
    levelLabel: a.severity || '—',
    occurrenceStatus,
    confirmStatus: acknowledged ? 'Acknowledged' : 'Not acknowledged',
    recoveryTime: recoveredAt ? String(recoveredAt) : '',
    duration: a.age && a.age !== '—' ? a.age : '—',
    alertType: a.category || '—',
    plantName: a.plant || '—',
    alertTime: a.created || '—',
    component: deviceType.label,
    componentDetail: deviceType.detail,
    deviceLabel: `${a.device || '—'}${alertResolvedAdminDeviceId(a) ? ` (${alertResolvedAdminDeviceId(a)})` : a.deviceId ? ` (${a.deviceId})` : ''}`,
    reason: reason ? [reason] : ['No probable cause was returned by the API.'],
    suggestion: suggestion ? [suggestion] : ['No recommendation was returned by the API.'],
    curveMetric: a.telemetryCurve?.metricCode || a.related?.telemetryMetric || '—',
    samples: []
  };
}

function alertDetailHero(a: ZentridAlertRecord, m: AlertDetailModel): string {
  const levelClass = ['Critical','Fault'].includes(m.levelLabel) ? 'danger' : 'warning';
  const statusClass = m.occurrenceStatus === 'Recovered' ? 'success' : 'danger';
  const canConfirm = !/acknowledged|resolved/i.test(String(a.status || ''));
  return `
    <section class="alert-detail-hero glass-card">
      <div class="alert-detail-title-row">
        <div class="alert-title-stack">
          <div class="alert-title-line"><span class="alert-level-pill ${levelClass}">${m.levelLabel}</span><h1>${a.title}</h1><span class="alert-status-pill ${statusClass}"><i></i>${m.occurrenceStatus}</span></div>
          ${alertResolvedAdminDeviceId(a) ? `<button class="alert-device-link" id="openAlertDeviceFromHero" type="button">▣ ${m.deviceLabel}</button>` : `<span class="alert-device-link" title="Device Registry identity not resolved">▣ ${m.deviceLabel}</span>`}
        </div>
        <button class="secondary-action" onclick="location.href='alerts.html'">Back to Alerts</button>
      </div>
      <div class="alert-detail-meta-grid">
        <div><span>Plant Name</span><strong>${m.plantName}</strong></div>
        <div><span>Alert Time</span><strong>${m.alertTime}</strong></div>
        <div><span>Device Type</span><strong>${m.component}</strong><small>${m.componentDetail}</small></div>
        <div><span>Duration</span><strong>${m.duration}</strong></div>
        <div><span>Backend Category</span><strong>${m.alertType}</strong></div>
        <div><span>Zentrid Alert Code</span><strong>${a.zentridCode || '—'}</strong></div>
        <div><span>Backend Severity</span><strong>${a.severity || '—'}</strong></div>
        <div><span>Mapping Status</span><strong>${vendorMappingStatus(a)}</strong></div>
        <div><span>Vendor Error Code</span><strong>${vendorCodeLabel(a)}</strong></div>
        <div><span>Acknowledgement</span><strong class="${m.confirmStatus === 'Acknowledged' ? 'text-success' : 'text-warning'}">${m.confirmStatus}</strong>${canConfirm ? '<button class="mini-inline-action" id="detailAck" type="button">Acknowledge</button>' : ''}</div>
        ${m.recoveryTime ? `<div><span>Recovery Time</span><strong>${m.recoveryTime}</strong></div>` : ''}
      </div>
    </section>`;
}
function alertReasonBlock(title: string, icon: string, items: string[]): string {
  return `<section class="alert-explain-card glass-card"><div class="alert-section-title"><span>${icon}</span><h3>${title}</h3></div><ol class="alert-numbered-list">${items.map(x => `<li>${x}</li>`).join('')}</ol></section>`;
}

function alertCurveBlock(a: ZentridAlertRecord, m: AlertDetailModel): string {
  const liveSamples = Array.isArray(a.telemetryCurve?.samples) ? a.telemetryCurve.samples : [];
  const metric = a.telemetryCurve?.metricCode || m.curveMetric;
  if (!liveSamples.length) return `<section class="alert-curve-card glass-card"><div class="alert-section-title"><span>⌁</span><h3>Curve</h3><small>${metric} around alert time · ${alertSubresourceSourceLabel(a, 'telemetryCurve')}</small></div><div class="empty-state"><strong>No telemetry samples returned</strong><small>The selected backend telemetry-curve source returned a valid window without sample points.</small></div></section>`;
  const labels = liveSamples.slice(0, 8).map(sample => `${sample.value ?? '—'}${sample.unit ? ` ${sample.unit}` : ''}`);
  return `<section class="alert-curve-card glass-card"><div class="alert-section-title"><span>⌁</span><h3>Curve</h3><small>${metric} around alert time · ${alertSubresourceSourceLabel(a, 'telemetryCurve')}</small></div><div class="alert-curve-visual"><div class="curve-line"></div>${labels.map((x,i)=>`<div class="curve-point" style="left:${10+i*(80/Math.max(labels.length-1,1))}%; bottom:${28+(i%3)*16}%"><span>${x}</span></div>`).join('')}</div></section>`;
}

function alertDetailKpis(a: ZentridAlertRecord): string {
  return `<section class="kpi-grid detail-kpis alert-detail-kpis">
      <article class="kpi-card ${a.severity === 'Critical' ? 'red' : 'yellow'}"><span>Backend Severity</span><strong>${a.severity || '—'}</strong><small>${alertDisplayValue(a.priority)}</small></article>
      <article class="kpi-card"><span>Status</span><strong>${a.status || '—'}</strong><small>${alertDisplayValue(a.sla)}</small></article>
      <article class="kpi-card"><span>Owner</span><strong>${alertDisplayValue(a.owner)}</strong><small>Backend assignment</small></article>
      <article class="kpi-card"><span>Source</span><strong>${a.vendor || '—'}</strong><small>${a.source || '—'}</small></article>
    </section>`;
}

function renderAlertDetailContent(a: ZentridAlertRecord): string {
  if (!a.id) return window.ZentridApiOnly?.emptyState('Alert Detail', 'The alert endpoint has not returned a selected record.', '/api/admin/alerts') || '';
  const m = alertDetailModel(a);
  return `
    <section class="page-hero alert-detail-page-hero">
      <div><p class="eyebrow">Global Admin · Alerts ${alertDetailSourceBadge(a)}</p><h1>Alert Details</h1><p class="muted">Alert Registry is authoritative for administrative classification and workflow; Platform Live enrichment is shown only when returned.</p></div>
      <button class="freshness-card" type="button" data-live-refresh="alert-detail"><span class="pulse"></span><div><strong>Refresh</strong><small>${a.updated} · ${a.source}</small></div></button>
    </section>
    ${alertDetailHero(a, m)}
    ${alertDetailKpis(a)}
    <section class="alert-detail-layout-v71 detail-layout-v58 detail-layout-standard">
      <aside class="setup-rail alert-detail-nav-v71" aria-label="Alert detail sections">
        <button class="active" type="button" data-tab="summary"><span>Overview</span></button>
        <button type="button" data-tab="classification"><span>Classification</span></button>
        <button type="button" data-tab="case"><span>Incident Case</span></button>
        <button type="button" data-tab="sop"><span>SOP Checklist</span></button>
        <button type="button" data-tab="timeline"><span>Timeline</span></button>
        <button type="button" data-tab="related"><span>Related Objects</span></button>
        <button type="button" data-tab="activity"><span>Activity</span></button>
      </aside>
      <div class="glass-card detail-main-v58 alert-detail-main-v71" id="alertDetailContent">${alertDetailTab(a, 'summary')}</div>
    </section>`;
}
function alertDetailTab(a: ZentridAlertRecord, tab: AlertDetailTabId | string): string {
  const m = alertDetailModel(a);
  const localMeta = a.zentridCode ? ZentridAlertDictionary.codes[a.zentridCode] : undefined;
  const disabledAction = (label: string): string => `<button type="button" disabled aria-disabled="true" title="Requires explicit operator input; no default backend payload is sent">${label}</button>`;
  const timelineRows = Array.isArray(a.timeline) ? a.timeline.filter(Boolean) : [];
  const timelineHtml = timelineRows.length ? `<div class="timeline-mini">${timelineRows.map(x => `<p>${x}</p>`).join('')}</div>` : `<div class="empty-state"><strong>No timeline events returned</strong><small>The alert timeline endpoint returned an empty collection.</small></div>`;
  if (tab === 'classification') return `<div class="split-grid alert-classification-tab"><div class="panel-lite"><h3>Backend Classification</h3><div class="info-grid"><div><span>Zentrid Code</span><strong>${a.zentridCode || '—'}</strong></div><div><span>Title</span><strong>${a.title || '—'}</strong></div><div><span>Category</span><strong>${a.category || '—'}</strong></div><div><span>Severity</span><strong>${a.severity || '—'}</strong></div><div><span>Status</span><strong>${a.status || '—'}</strong></div><div><span>Occurrence</span><strong>${a.occurrenceStatus || '—'}</strong></div><div><span>Mapping Status</span><strong>${vendorMappingStatus(a)}</strong></div><div><span>Mapping Version</span><strong>${a.mappingVersion || String(a.mapping?.mappingVersion || '—')}</strong></div></div></div><div class="panel-lite"><h3>Vendor Source Mapping</h3><div class="info-grid"><div><span>Vendor</span><strong>${a.vendor || '—'}</strong></div><div><span>Source Platform</span><strong>${a.source || '—'}</strong></div><div><span>Received Vendor Code</span><strong>${vendorCodeLabel(a)}</strong></div><div><span>Vendor Message</span><strong>${a.vendorMessage || '—'}</strong></div><div><span>Source Alert ID</span><strong>${a.sourceAlertId || '—'}</strong></div><div><span>Source Plant ID</span><strong>${a.sourcePlantId || '—'}</strong></div><div><span>Source Device ID</span><strong>${a.sourceDeviceId || '—'}</strong></div><div><span>Alert Device Type Value</span><strong>${alertDisplayValue(a.deviceType)}</strong></div><div><span>Resolved Device Type</span><strong>${alertDeviceTypePresentation(a).label}</strong></div><div><span>Device Registry ID</span><strong>${alertResolvedAdminDeviceId(a) || '—'}</strong></div><div><span>Device Identity Resolution</span><strong>${alertDeviceResolutionLabel(a)}</strong></div><div><span>Integration</span><strong>${a.integration || '—'}</strong></div></div></div><div class="panel-lite full-span-v86"><h3>Local Alert Dictionary Reference</h3>${localMeta ? `<div class="info-grid"><div><span>Name</span><strong>${localMeta.name}</strong></div><div><span>Category</span><strong>${localMeta.category}</strong></div><div><span>Reference Severity</span><strong>${localMeta.severity}</strong></div><div><span>Device Scope</span><strong>${localMeta.deviceScope}</strong></div><div><span>Meaning</span><strong>${localMeta.meaning}</strong></div><div><span>Policy Reference</span><strong>${localMeta.policy}</strong></div></div><p class="muted">Local dictionary metadata is a UI/reference layer only. It does not override backend severity, category or mapping status.</p>` : `<div class="empty-state"><strong>No local dictionary entry</strong><small>Backend classification above remains authoritative.</small></div>`}<div class="vertical-actions"><button onclick="location.href='alert-dictionary.html'">Open Alert Dictionary</button></div></div><div class="panel-lite full-span-v86"><h3>Mapping Validation Checklist</h3>${renderMappingValidation(a)}</div></div>`;
  if (tab === 'case') { const c = alertIncidentModel(a); const hasCase = c.caseId !== '—'; return `<div class="split-grid incident-case-tab"><div class="panel-lite"><h3>${hasCase ? 'Case Timeline' : 'Alert Event Timeline'}</h3>${!hasCase ? '<p class="muted">No incident case is linked. The events below belong to the alert workflow itself.</p>' : ''}${alertCaseTimeline(a)}<p class="muted">${alertSubresourceSourceLabel(a, 'timeline')}</p></div><div class="panel-lite"><h3>Backend Case Context</h3>${!hasCase ? '<div class="empty-state"><strong>No incident case returned</strong><small>The backend returned alert workflow events but no case identifier for this record.</small></div>' : ''}<div class="info-grid"><div><span>Case ID</span><strong>${c.caseId}</strong></div><div><span>Case Status</span><strong>${c.caseStatus}</strong></div><div><span>Responsible</span><strong>${c.assignee}</strong></div><div><span>Due</span><strong>${c.due}</strong></div><div><span>Task</span><strong>${c.taskId}</strong></div><div><span>Work Order</span><strong>${c.workOrder}</strong></div><div><span>Client / Tenant</span><strong>${c.linkedClient}</strong></div><div><span>Impact</span><strong>${c.impact}</strong></div></div><div class="vertical-actions incident-tab-actions">${disabledAction('Assign Responsible')}${disabledAction('Create Task / Work Order')}</div><p class="muted">No CASE, TASK, work-order ID or due date is generated in the browser. Missing values remain unavailable until backend returns them.</p></div></div>`; }
  if (tab === 'sop') return alertSopChecklistBlock(a);
  if (tab === 'timeline') return `<div class="split-grid"><div class="panel-lite"><h3>Backend Event Timeline</h3>${timelineHtml}<p class="muted">${alertSubresourceSourceLabel(a, 'timeline')}</p></div><div class="panel-lite"><h3>SLA & Ownership</h3><div class="info-grid"><div><span>SLA</span><strong>${alertDisplayValue(a.sla)}</strong></div><div><span>Owner</span><strong>${alertDisplayValue(a.owner)}</strong></div><div><span>Occurred</span><strong>${a.created || '—'}</strong></div><div><span>Last Sync</span><strong>${a.lastSyncAtUtc || a.updated || '—'}</strong></div></div></div></div>`;
  if (tab === 'related') { const hasCase = alertDisplayValue(a.related?.caseId) !== '—' || alertDisplayValue(a.related?.taskId) !== '—'; return `<div class="split-grid"><div class="panel-lite"><h3>Source Context</h3><div class="info-grid"><div><span>Tenant</span><strong>${a.tenant || '—'}</strong></div><div><span>Plant</span><strong>${a.plant || '—'}</strong></div><div><span>Device</span><strong>${a.device || '—'}</strong></div><div><span>Integration</span><strong>${a.integration || '—'}</strong></div><div><span>Telemetry Metric</span><strong>${a.related?.telemetryMetric || '—'}</strong></div><div><span>Zentrid Alert Code</span><strong>${a.zentridCode || '—'}</strong></div><div><span>Vendor Error Code</span><strong>${vendorCodeLabel(a)}</strong></div><div><span>Last Sync</span><strong>${a.lastSyncAtUtc || a.updated || '—'}</strong></div><div><span>Raw Payload Ref</span><strong>${a.rawPayloadRef || '—'}</strong></div><div><span>Case / Task</span><strong>${alertDisplayValue(a.related?.caseId)} / ${alertDisplayValue(a.related?.taskId)}</strong></div></div><p class="muted">${alertSubresourceSourceLabel(a, 'related')}</p></div><div class="panel-lite"><h3>Open Related</h3><div class="vertical-actions">${a.plantId ? '<button id="openAlertPlant">Open Plant</button>' : disabledAction('Open Plant')}${alertResolvedAdminDeviceId(a) ? '<button id="openAlertDevice">Open Device</button>' : disabledAction('Open Device')}<button id="openAlertTelemetry">Open Telemetry</button>${hasCase ? '<button id="openAlertCase" disabled aria-disabled="true" title="No case workspace route is confirmed by backend contract">Open Case / Task</button>' : disabledAction('Open Case / Task')}</div></div></div>`; }
  if (tab === 'activity') return `<div class="split-grid"><div class="panel-lite"><h3>Backend Actions</h3><div class="vertical-actions">${/acknowledged|resolved/i.test(String(a.status || '')) ? disabledAction('Acknowledge Alert') : '<button id="actionAck">Acknowledge Alert</button>'}${disabledAction('Assign Owner')}${disabledAction('Create Task')}${disabledAction('Escalate')}${disabledAction('Resolve Alert')}</div><p class="muted">Only Acknowledge is sent without additional operator fields. Other mutations stay disabled instead of submitting fabricated default values.</p></div><div class="panel-lite"><h3>Backend Activity Log</h3>${timelineHtml}<p class="muted">${alertSubresourceSourceLabel(a, 'timeline')}</p></div></div>`;
  return `<div class="alert-summary-layout">${alertReasonBlock('Reason', '!', m.reason)}${alertReasonBlock('Suggestion', '✓', m.suggestion)}${alertCurveBlock(a, m)}<section class="alert-explain-card glass-card"><div class="alert-section-title"><span>i</span><h3>Backend Operational Context</h3></div><div class="info-grid"><div><span>Category</span><strong>${a.category || '—'}</strong></div><div><span>Severity</span><strong>${a.severity || '—'}</strong></div><div><span>Device Type</span><strong>${m.component}</strong><small>${m.componentDetail}</small></div><div><span>Alert Device Type Value</span><strong>${alertDisplayValue(a.deviceType)}</strong></div><div><span>Telemetry</span><strong>${a.telemetry || '—'}</strong></div><div><span>Case</span><strong>${alertDisplayValue(a.related?.caseId)}</strong></div><div><span>Task</span><strong>${alertDisplayValue(a.related?.taskId)}</strong></div><div><span>Zentrid Alert Code</span><strong>${a.zentridCode || '—'}</strong></div><div><span>Vendor Error Code</span><strong>${vendorCodeLabel(a)}</strong></div><div><span>Mapping Status</span><strong>${vendorMappingStatus(a)}</strong></div><div><span>Mapping Version</span><strong>${a.mappingVersion || String(a.mapping?.mappingVersion || '—')}</strong></div><div><span>Last Sync</span><strong>${a.lastSyncAtUtc || a.updated || '—'}</strong></div></div></section></div>`;
}
if (location.pathname.endsWith('alert-detail.html')) {
  ZentridLayout.mount(renderAlertDetailContent(selectedAlert()));
  wireAlertDetailPage();
} else {
  ZentridLayout.mount(renderAlertsPage());
  wireAlertsPage();
}
