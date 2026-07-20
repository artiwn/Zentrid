type AlertTone = 'danger' | 'warning' | 'success';
type AlertCheckTone = 'success' | 'danger' | 'muted' | 'warning';
type AlertDetailTabId = 'summary' | 'classification' | 'case' | 'sop' | 'timeline' | 'related' | 'activity' | 'actions';

interface FleetAlertMeta {
  category: string;
  name: string;
  severity: string;
  deviceScope: string;
  policy: string;
  meaning: string;
  vendorMappings: string[];
}

interface FleetAlertDictionaryModel {
  categories: string[];
  codes: Record<string, FleetAlertMeta>;
}

interface FleetAlertRecord {
  id: string;
  dataOrigin?: FleetDataOrigin;
  fleetCode?: string;
  vendorRawCode?: string;
  vendorCode?: string;
  vendorMessage?: string;
  severity: string;
  priority: string;
  title: string;
  status: string;
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
  timeline: string[];
  related: {
    telemetryMetric: string;
    caseId: string;
    taskId: string;
  };
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
  rows: FleetAlertRecord[];
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
  escalationTarget: string;
  evidence: string[];
  items: AlertSopStep[];
}

interface AlertDetailModel {
  levelLabel: string;
  occurrenceStatus: string;
  deviceLabel: string;
  plantName: string;
  alertTime: string;
  component: string;
  duration: string;
  alertType: string;
  confirmStatus: string;
  recoveryTime: string;
  curveMetric: string;
  samples: string[];
  reason: string[];
  suggestion: string[];
}

const FleetAlertDictionary: FleetAlertDictionaryModel = {
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
function alertCodeMeta(a?: Partial<FleetAlertRecord>): FleetAlertMeta { const code=a?.fleetCode; return (code ? FleetAlertDictionary.codes[code] : undefined) || { category:a?.category || 'Unmapped', name:a?.title || 'Unknown alert', severity:a?.severity || 'Unknown', deviceScope:a?.deviceType || '—', policy:'No canonical policy configured yet.', meaning:a?.description || 'No unified explanation configured.', vendorMappings:[] }; }
function vendorCodeLabel(a?: Partial<FleetAlertRecord>): string { return `${a?.vendor || 'Vendor'} ${a?.vendorRawCode || a?.vendorCode || '—'}`; }
function vendorMappingStatus(a?: Partial<FleetAlertRecord>): string { const meta = alertCodeMeta(a); const raw = `${a?.vendor || ''} ${a?.vendorRawCode || a?.vendorCode || ''}`.toLowerCase(); return (meta.vendorMappings || []).some(x => raw && x.toLowerCase().includes(String(a?.vendorRawCode || a?.vendorCode || '').toLowerCase())) ? 'Mapped' : 'Mapped by policy'; }

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
function renderMappingValidation(a: FleetAlertRecord): string {
  const meta = alertCodeMeta(a);
  const mapped = vendorMappingStatus(a);
  const items = [
    { label:'Vendor code received', hint: vendorCodeLabel(a), status: a.vendorRawCode || a.vendorCode ? 'Done' : 'Missing', checked: !!(a.vendorRawCode || a.vendorCode), required:true },
    { label:'Zentrid code assigned', hint: a.fleetCode || 'No canonical code', status: a.fleetCode ? 'Done' : 'Missing', checked: !!a.fleetCode, required:true },
    { label:'Mapping found in dictionary', hint: (meta.vendorMappings || []).slice(0,3).join(' · ') || 'No known mapping', status: mapped, checked: true, required:true },
    { label:'Policy available', hint: meta.policy || 'No policy configured', status: meta.policy ? 'Done' : 'Missing', checked: !!meta.policy, required:true },
    { label:'SLA / case workflow', hint: `${a.priority || 'P?'} · ${a.sla || 'No SLA'}`, status: a.sla ? 'Done' : 'Pending', checked: !!a.sla }
  ];
  return `<div class="check-list validation-check-list-v86">${items.map(renderCheckRow).join('')}</div>`;
}

const FleetAlerts: FleetAlertRecord[] = [
  {
    id: 'ALT-2031', fleetCode: 'FL-COM-RS', vendorRawCode: '2010', vendorCode: 'Solis 2010', vendorMessage: 'EPM Comm. Fail', severity: 'Fault', priority: 'P1', title: 'RS485 Communication Error', status: 'Open', category: 'Communication',
    tenant: 'Tenant Alpha Energy', plantId: 'PLT-000421', plant: 'Plant A', deviceId: 'DEV-INV-00432', device: 'INV-00432', deviceType: 'Inverter / Meter Link', vendor: 'Solis', source: 'SolisCloud', integration: 'Tenant Alpha Energy — Solis SolisCloud',
    created: '08:12', updated: '08:21', age: '18 min', sla: '24 min remaining', owner: 'Unassigned', telemetry: 'RS485 link stale · Last data: 18 min ago',
    description: 'Vendor sent raw alert code 2010: EPM communication failure. Zentrid mapped it to FL-COM-RS.',
    probableCause: 'RS485 or EPM communication path is unavailable. Possible wiring issue, meter/EPM offline, or gateway link problem.',
    recommendation: 'Acknowledge the alert, ask support to verify local connection status, and create a technical task if accounting or telemetry is affected.',
    timeline: ['08:12 · Vendor code received: Solis 2010', '08:12 · Mapping resolved: 2010 → FL-COM-RS', '08:13 · Notification sent to Support + Client', '08:16 · SLA clock started', '08:21 · Waiting for acknowledgement'],
    related: { telemetryMetric: 'Communication Status', caseId: 'CASE-0098', taskId: '—' }
  },
  {
    id: 'ALT-2034', fleetCode: 'FL-GRD-OV', vendorRawCode: '2034', vendorCode: 'Huawei 2034', vendorMessage: 'Grid Overvoltage', severity: 'Fault', priority: 'P1', title: 'Grid Overvoltage', status: 'Open', category: 'Grid',
    tenant: 'Tenant Alpha Energy', plantId: 'PLT-000421', plant: 'Plant A', deviceId: 'DEV-INV-00432', device: 'INV-00432', deviceType: 'Inverter', vendor: 'Huawei', source: 'FusionSolar', integration: 'Tenant Alpha Energy — Huawei FusionSolar',
    created: '08:18', updated: '08:26', age: '12 min', sla: '31 min remaining', owner: 'Grid Operations', telemetry: 'AC voltage peak: 259 V · Last sample: 2 min ago',
    description: 'Vendor sent raw alert code 2034: Grid Overvoltage. Zentrid mapped it to FL-GRD-OV.',
    probableCause: 'Grid voltage exceeded normal range or inverter safety/grid-code parameters require validation.',
    recommendation: 'Verify grid voltage, check whether the issue is repeated, and escalate to Operations if voltage remains unstable.',
    timeline: ['08:18 · Vendor code received: Huawei 2034', '08:18 · Mapping resolved: 2034 → FL-GRD-OV', '08:19 · Support notified', '08:22 · Grid voltage trend attached'],
    related: { telemetryMetric: 'AC Voltage', caseId: 'CASE-0099', taskId: 'TASK-0139' }
  },
  {
    id: 'ALT-2044', fleetCode: 'FL-BAT-OT', vendorRawCode: '3105', vendorCode: 'Huawei 3105', vendorMessage: 'Battery Overtemperature', severity: 'Fault', priority: 'P2', title: 'Battery Overtemperature', status: 'Acknowledged', category: 'Battery / BMS',
    tenant: 'Tenant North Operations', plantId: 'PLT-000501', plant: 'Armavir BESS Solar', deviceId: 'DEV-BESS-0002', device: 'BESS-RACK-02', deviceType: 'Battery', vendor: 'Huawei', source: 'FusionSolar / LUNA2000 ESS', integration: 'Tenant North Operations — Huawei FusionSolar',
    created: '08:23', updated: '08:37', age: '29 min', sla: '1h 42m remaining', owner: 'BESS Specialist', telemetry: 'Rack temp: 47.6 °C · SOC: 71% · Last data: 4 min ago',
    description: 'Vendor sent raw alert code 3105: Battery Overtemperature. Zentrid mapped it to FL-BAT-OT.',
    probableCause: 'Thermal load increased in BESS rack 02. Cooling performance or ambient temperature should be reviewed.',
    recommendation: 'Keep alert acknowledged, monitor temperature trend, and create a work order if temperature keeps rising.',
    timeline: ['08:23 · Vendor code received: Huawei 3105', '08:23 · Mapping resolved: 3105 → FL-BAT-OT', '08:27 · Acknowledged by BESS Specialist', '08:31 · Remote check started'],
    related: { telemetryMetric: 'Temperature', caseId: 'CASE-0101', taskId: 'TASK-0144' }
  },
  {
    id: 'ALT-2050', fleetCode: 'FL-COM-SRV', vendorRawCode: 'NET Red', vendorCode: 'Solax NET Red', vendorMessage: 'Cloud Disconnect', severity: 'Warning', priority: 'P3', title: 'Cloud / Server Connection Error', status: 'Open', category: 'Communication',
    tenant: 'Tenant Gamma Grid', plantId: 'PLT-000611', plant: 'Madrid East', deviceId: 'DEV-GW-019', device: 'GW-019', deviceType: 'Gateway', vendor: 'Solax', source: 'SolaxCloud / DataHub', integration: 'Tenant Gamma Grid — Solax SolaxCloud',
    created: '08:36', updated: '08:44', age: '13 min', sla: '3h 18m remaining', owner: 'Integration Team', telemetry: 'Last normalized record older than freshness window',
    description: 'Vendor sent raw status NET Red: Cloud disconnect. Zentrid mapped it to FL-COM-SRV.',
    probableCause: 'Vendor polling delay, gateway communication issue, or normalization pipeline lag.',
    recommendation: 'Check integration sync status, retry sample fetch, then assign to Data Operations if delay continues.',
    timeline: ['08:36 · Vendor status received: Solax NET Red', '08:36 · Mapping resolved: NET Red → FL-COM-SRV', '08:42 · Retry policy started'],
    related: { telemetryMetric: 'Data Freshness', caseId: '—', taskId: '—' }
  },
  {
    id: 'ALT-2062', fleetCode: 'FL-INV-INT', vendorRawCode: '31', vendorCode: 'GoodWe 31', vendorMessage: 'Internal Comm Error', severity: 'Fault', priority: 'P1', title: 'Internal Hardware Fault', status: 'Escalated', category: 'Inverter',
    tenant: 'Tenant Delta Enterprise', plantId: 'PLT-000720', plant: 'Lyon PV Park', deviceId: 'DEV-INV-021', device: 'INV-021', deviceType: 'Inverter', vendor: 'GoodWe', source: 'SEMS Portal', integration: 'Tenant Delta Enterprise — GoodWe SEMS Portal',
    created: '08:44', updated: '09:02', age: '31 min', sla: 'Escalated', owner: 'Operations Team', telemetry: 'Active power dropped 42% after alert code was received',
    description: 'Vendor sent raw alert code 31: Internal Comm Error. Zentrid mapped it to FL-INV-INT.',
    probableCause: 'Device internal communication/hardware fault reported by vendor source.',
    recommendation: 'Keep escalation active, open source device, and create a task for field inspection if not remotely recoverable.',
    timeline: ['08:44 · Vendor code received: GoodWe 31', '08:44 · Mapping resolved: 31 → FL-INV-INT', '08:55 · Escalated to Operations Manager'],
    related: { telemetryMetric: 'Current Power', caseId: 'CASE-0105', taskId: 'TASK-0150' }
  },
  {
    id: 'ALT-2074', fleetCode: 'FL-MTR-COM', vendorRawCode: '2011', vendorCode: 'Solis 2011', vendorMessage: 'Meter_Comm_FAIL', severity: 'Fault', priority: 'P4', title: 'Meter Communication Lost', status: 'Open', category: 'Metering',
    tenant: 'Tenant Alpha Energy', plantId: 'PLT-000817', plant: 'Plant B', deviceId: 'DEV-MTR-008', device: 'MTR-008', deviceType: 'Meter', vendor: 'Solis', source: 'SolisCloud', integration: 'Tenant Alpha Energy — Solis SolisCloud',
    created: '09:05', updated: '09:07', age: '4 min', sla: '5h remaining', owner: 'Unassigned', telemetry: 'Meter interval record delayed by 11 min',
    description: 'Vendor sent raw alert code 2011: Meter communication failure. Zentrid mapped it to FL-MTR-COM.',
    probableCause: 'Meter ingestion interval lag or vendor endpoint delay.',
    recommendation: 'Monitor next interval. Escalate only if delay affects billing-ready accounting records.',
    timeline: ['09:05 · Vendor code received: Solis 2011', '09:05 · Mapping resolved: 2011 → FL-MTR-COM', '09:07 · Awaiting next import window'],
    related: { telemetryMetric: 'Energy Produced', caseId: '—', taskId: '—' }
  }
];

function alertTone(value?: string): AlertTone {
  const v = String(value || '').toLowerCase();
  if (v.includes('critical') || v.includes('p1') || v.includes('open') || v.includes('escalated')) return 'danger';
  if (v.includes('high') || v.includes('warning') || v.includes('acknowledged') || v.includes('p2') || v.includes('medium')) return 'warning';
  return 'success';
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

function filteredAlerts(): FleetAlertRecord[] {
  const ctx = getAlertContext();
  const severity = document.getElementById('severityFilter')?.value || ctx.severity || 'All';
  const status = document.getElementById('statusFilter')?.value || ctx.status || 'All';
  const tenant = document.getElementById('tenantFilter')?.value || ctx.tenant || 'All';
  const plant = document.getElementById('plantFilter')?.value || 'All';
  const vendor = document.getElementById('vendorFilter')?.value || 'All';
  const q = (document.getElementById('alertSearch')?.value || '').trim().toLowerCase();
  return FleetAlerts.filter(a =>
    (!ctx.plantId || a.plantId === ctx.plantId) &&
    (!ctx.deviceId || a.deviceId === ctx.deviceId) &&
    (severity === 'All' || alertCodeMeta(a).severity === severity) &&
    (status === 'All' || a.status === status) &&
    (tenant === 'All' || a.tenant === tenant) &&
    (plant === 'All' || a.plant === plant || a.plantId === plant) &&
    (vendor === 'All' || a.vendor === vendor) &&
    (!q || `${a.title} ${a.plant} ${a.device} ${a.tenant} ${a.vendor} ${a.id} ${a.category} ${a.fleetCode || ''} ${a.vendorCode || ''} ${a.vendorRawCode || ''} ${a.vendorMessage || ''}`.toLowerCase().includes(q))
  );
}

function alertKpis(items: FleetAlertRecord[] = filteredAlerts()): string {
  const critical = items.filter(a => alertCodeMeta(a).severity === 'Critical').length;
  const fault = items.filter(a => alertCodeMeta(a).severity === 'Fault').length;
  const warning = items.filter(a => alertCodeMeta(a).severity === 'Warning').length;
  const open = items.filter(a => a.status === 'Open').length;
  const acknowledged = items.filter(a => a.status === 'Acknowledged').length;
  const escalated = items.filter(a => a.status === 'Escalated').length;
  return `
    <section class="kpi-grid compact-kpis alert-kpis">
      <article class="kpi-card red"><div class="kpi-label">Critical</div><div class="kpi-value">${critical}</div><div class="kpi-delta">Immediate escalation</div></article>
      <article class="kpi-card yellow"><div class="kpi-label">Fault</div><div class="kpi-value">${fault}</div><div class="kpi-delta">Operational incident</div></article>
      <article class="kpi-card cyan"><div class="kpi-label">Warning</div><div class="kpi-value">${warning}</div><div class="kpi-delta">Monitor / validate</div></article>
      <article class="kpi-card violet"><div class="kpi-label">Escalated</div><div class="kpi-value">${escalated}</div><div class="kpi-delta">Management visible</div></article>
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
  const queryState = window.FleetRegistryQuery?.read('alerts');
  const selected = {
    severity: queryState?.params.severity || ctx.severity || 'All',
    status: queryState?.params.alertStatus || ctx.status || 'All',
    tenant: queryState?.params.tenant || ctx.tenant || 'All',
    plant: queryState?.params.plant || 'All',
    vendor: queryState?.params.vendor || 'All',
    search: queryState?.search || ''
  };
  const opt = (value: string, current: string): string => `<option ${value === current ? 'selected' : ''}>${value}</option>`;
  return `
    <section class="filter-bar glass-card alert-filter-bar">
      <label>Severity<select id="severityFilter">${['All','Critical','Fault','Warning'].map(x => opt(x, selected.severity)).join('')}</select></label>
      <label>Status<select id="statusFilter">${['All','Open','Acknowledged','Escalated','Resolved'].map(x => opt(x, selected.status)).join('')}</select></label>
      <label>Tenant<select id="tenantFilter">${['All','Tenant Alpha Energy','Tenant North Operations','Tenant Gamma Grid','Tenant Delta Enterprise'].map(x => opt(x, selected.tenant)).join('')}</select></label>
      <label>Plant<select id="plantFilter">${['All', ...Array.from(new Set(FleetAlerts.map(a => a.plant)))].map(x => opt(x, selected.plant)).join('')}</select></label>
      <label>Vendor<select id="vendorFilter">${['All','Huawei','Sungrow','Solis','GoodWe','Deye'].map(x => opt(x, selected.vendor)).join('')}</select></label>
      <label>Search<input id="alertSearch" value="${String(selected.search).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" placeholder="Search current page by alert, plant, device..." /></label>
    </section>
    <div id="alertFilterScopeV126">${window.FleetRegistryQuery?.filterScopeHtml('alerts') || ''}</div>`;
}

function alertRow(a: FleetAlertRecord): string {
  const meta = alertCodeMeta(a);
  return `
    <div class="data-row alert-row" data-alert-id="${a.id}">
      <div>${FleetDataSource.badge(a, 'alert')}<strong>${a.fleetCode || '—'}</strong><small>Vendor: ${vendorCodeLabel(a)}</small></div>
      <div><strong>${meta.name || a.title}</strong><small>${a.id} · ${meta.category || a.category} · ${a.priority}</small></div>
      <div><strong>${a.plant}</strong><small>${a.tenant} · ${a.device}</small></div>
      <div><strong>${a.vendor}</strong><small>${a.source}</small></div>
      <span class="badge ${alertTone(meta.severity)}">${meta.severity}</span>
      <span class="badge ${alertTone(a.status)}">${a.status}</span>
      <div><strong>${a.created}</strong><small>${a.sla}</small></div>
      <div class="row-actions kebabified"><div class="kebab-wrap global-action-wrap"><button type="button" class="kebab-btn" data-action="menu" aria-label="Open actions" title="Actions">⋮</button><div class="kebab-menu global-action-menu"><button data-action="open-alert" data-id="${a.id}" type="button">Open</button><button data-action="ack" data-id="${a.id}" type="button">Ack</button></div></div></div>
    </div>`;
}

var ZentridAlertPager: AlertPagerState = window.ZentridAlertPager || (window.ZentridAlertPager = { page: 1, size: 50 });
function alertPageSlice(items: FleetAlertRecord[]): AlertPageSliceState {
  const serverPagination = window.FleetRegistryQuery?.pagination('alerts');
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
  const serverPagination = window.FleetRegistryQuery?.pagination('alerts');
  if (serverPagination) return window.FleetRegistryQuery?.pagerHtml('alerts', state.rows.length) || '';
  if (state.total <= ZentridAlertPager.size) return `<div class="pagination-bar"><span>Showing ${state.total} row(s)</span></div>`;
  return `<div class="pagination-bar"><span>Showing ${state.start + 1}-${state.end} of ${state.total}</span><div class="row-actions"><button data-alert-page="prev" ${state.page<=1?'disabled':''}>Prev</button><strong>Page ${state.page} / ${state.pages}</strong><button data-alert-page="next" ${state.page>=state.pages?'disabled':''}>Next</button></div></div>`;
}
function renderAlertRowsPage(items: FleetAlertRecord[]): string {
  const state = alertPageSlice(items);
  return `${alertPagerHtml(state)}<div class="data-table alerts-table"><div class="data-head alert-head"><span>Alert Codes</span><span>Alert</span><span>Plant / Device</span><span>Source</span><span>Severity</span><span>Status</span><span>SLA</span><span>Actions</span></div><div id="alertsRows">${state.rows.length ? state.rows.map(alertRow).join('') : '<div class="empty-state">No alerts match current filters.</div>'}</div></div>${alertPagerHtml(state)}`;
}
function renderAlertsTable(items: FleetAlertRecord[] = filteredAlerts()): string {
  return `
    <section class="panel glass-card">
      <div class="panel-head">
        <div><h2>Operational Alert Inbox</h2><p>Normalized alerts linked to tenant, plant, device, telemetry source and SLA state.</p></div>
        <div class="inline-actions"><button class="secondary-action" id="resetAlertFilters">Reset Filters</button><button class="primary-action" id="exportAlerts">Export</button></div>
      </div>
      <div id="alertsTableHost">${renderAlertRowsPage(items)}</div>
    </section>`;
}

function renderAlertDetailContentLegacy(a: FleetAlertRecord): string {
  return `
    <section class="page-hero">
      <div><p class="eyebrow">Alert Detail ${FleetDataSource.badge(a, 'alert', true)}</p><h1>${a.title}</h1><p class="muted">${a.id} · ${a.tenant} · ${a.plant} · ${a.device}</p></div>
      <div class="hero-actions"><button class="freshness-card" id="detailAck"><span class="pulse"></span><div><strong>Acknowledge</strong><small>${a.status}</small></div></button><button class="freshness-card" onclick="location.href='alerts.html'"><span class="pulse"></span><div><strong>Back to Alerts</strong><small>Operational inbox</small></div></button></div>
    </section>
    <section class="kpi-grid detail-kpis alert-detail-kpis">
      <article class="kpi-card red"><span>Severity</span><strong>${a.severity}</strong><small>${a.priority}</small></article>
      <article class="kpi-card"><span>Status</span><strong>${a.status}</strong><small>${a.sla}</small></article>
      <article class="kpi-card"><span>Owner</span><strong>${a.owner}</strong><small>Current assignment</small></article>
      <article class="kpi-card"><span>Source</span><strong>${a.vendor}</strong><small>${a.source}</small></article>
      <article class="kpi-card"><span>Plant</span><strong>${a.plant}</strong><small>${a.tenant}</small></article>
      <article class="kpi-card"><span>Device</span><strong>${a.device}</strong><small>${a.deviceType}</small></article>
    </section>
    <section class="glass-card tabs-shell">
      <div class="detail-tabs"><button class="active" data-tab="summary">Summary</button><button data-tab="case">Incident Case</button><button data-tab="sop">SOP Checklist</button><button data-tab="timeline">Timeline</button><button data-tab="related">Related Objects</button><button data-tab="actions">Actions</button></div>
      <div id="alertDetailContent">${alertDetailTab(a, 'summary')}</div>
    </section>`;
}

function alertDetailTabLegacy(a: FleetAlertRecord, tab: AlertDetailTabId | string): string {
  if (tab === 'timeline') return `<div class="split-grid"><div class="panel-lite"><h3>Event Timeline</h3><div class="timeline-mini">${a.timeline.map(x => `<p>${x}</p>`).join('')}</div></div><div class="panel-lite"><h3>SLA & Ownership</h3><div class="info-grid"><div><span>SLA</span><strong>${a.sla}</strong></div><div><span>Owner</span><strong>${a.owner}</strong></div><div><span>Created</span><strong>${a.created}</strong></div><div><span>Updated</span><strong>${a.updated}</strong></div></div></div></div>`;
  if (tab === 'related') return `<div class="split-grid"><div class="panel-lite"><h3>Source Context</h3><div class="info-grid"><div><span>Tenant</span><strong>${a.tenant}</strong></div><div><span>Plant</span><strong>${a.plant}</strong></div><div><span>Device</span><strong>${a.device}</strong></div><div><span>Integration</span><strong>${a.integration}</strong></div><div><span>Telemetry</span><strong>${a.telemetry}</strong></div><div><span>Metric</span><strong>${a.related.telemetryMetric}</strong></div><div><span>Zentrid Alert Code</span><strong>${a.fleetCode || '—'}</strong></div><div><span>Vendor Error Code</span><strong>${vendorCodeLabel(a)}</strong></div></div></div><div class="panel-lite"><h3>Open Related</h3><div class="vertical-actions"><button id="openAlertPlant">Open Plant</button><button id="openAlertDevice">Open Device</button><button id="openAlertTelemetry">Open Telemetry</button><button id="openAlertCase">Open Case / Task</button></div></div></div>`;
  if (tab === 'activity') return `<div class="split-grid"><div class="panel-lite"><h3>Operational Actions</h3><div class="vertical-actions"><button id="actionAck">Acknowledge Alert</button><button id="actionAssign">Assign Owner</button><button id="actionTask">Create Task</button><button id="actionEscalate">Escalate</button><button id="actionResolve" class="danger-action">Resolve Alert</button></div></div><div class="panel-lite"><h3>Activity Log</h3><div class="timeline-mini"><p><strong>09:53</strong> Alert detected from ${a.source}</p><p><strong>09:55</strong> Case context prepared by Zentrid</p><p><strong>Now</strong> Waiting for operator acknowledgement</p></div></div></div>`;
  return `<div class="split-grid"><div class="panel-lite"><h3>What happened?</h3><p class="detail-copy">${a.description}</p><div class="timeline-mini"><p><strong>Probable cause:</strong> ${a.probableCause}</p><p><strong>Recommended action:</strong> ${a.recommendation}</p></div></div><div class="panel-lite"><h3>Current Context</h3><div class="info-grid"><div><span>Status</span><strong>${a.status}</strong></div><div><span>Priority</span><strong>${a.priority}</strong></div><div><span>Category</span><strong>${a.category}</strong></div><div><span>Age</span><strong>${a.age}</strong></div><div><span>SLA</span><strong>${a.sla}</strong></div><div><span>Owner</span><strong>${a.owner}</strong></div></div></div></div>`;
}

function selectedAlert(): FleetAlertRecord {
  const firstAlert = FleetAlerts[0];
  if (!firstAlert) throw new Error('Alerts registry requires a default alert.');
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || localStorage.getItem('zentrid_selected_alert') || firstAlert.id;
  return FleetAlerts.find(x => x.id === id) ?? firstAlert;
}

function openAlert(id: string): void {
  localStorage.setItem('zentrid_selected_alert', id);
  location.href = `alert-detail.html?id=${encodeURIComponent(id)}`;
}

function applyAlertFilters(resetPage = true): void {
  if (resetPage && !window.FleetRegistryQuery?.pagination('alerts')) ZentridAlertPager.page = 1;
  const kpiWrap = document.getElementById('alertKpiWrap');
  const host = document.getElementById('alertsTableHost');
  const items = filteredAlerts();
  if (kpiWrap) FleetRuntimeStability.replaceHtml(kpiWrap, alertKpis(items));
  if (host) FleetRuntimeStability.replaceHtml(host, renderAlertRowsPage(items));
  const severity = document.getElementById('severityFilter')?.value || 'All';
  const status = document.getElementById('statusFilter')?.value || 'All';
  const tenant = document.getElementById('tenantFilter')?.value || 'All';
  const plant = document.getElementById('plantFilter')?.value || 'All';
  const vendor = document.getElementById('vendorFilter')?.value || 'All';
  const search = (document.getElementById('alertSearch')?.value || '').trim();
  window.FleetRegistryQuery?.update('alerts', { search: search || null, severity: severity === 'All' ? null : severity, alertStatus: status === 'All' ? null : status, tenant: tenant === 'All' ? null : tenant, plant: plant === 'All' ? null : plant, vendor: vendor === 'All' ? null : vendor }, { replace: true, emit: false });
  const scope = document.getElementById('alertFilterScopeV126');
  if (scope) scope.innerHTML = window.FleetRegistryQuery?.filterScopeHtml('alerts') || '';
}

function renderAlertsPage(): string {
  setAlertContextFromQuery();
  return `
    <section class="page-hero">
      <div><p class="eyebrow">Global Admin · Tenant Management</p><h1>Alerts</h1><p class="muted">Normalized alert list across plants, devices, vendors and tenants. Filter by plant, status, severity, tenant or source.</p></div>
      <button class="freshness-card" onclick="FleetLayout.toast('Alerts data refreshed')"><span class="pulse"></span><div><strong>Alert freshness</strong><small>Updated 1 min ago</small></div></button>
    </section>
    ${renderAlertContextBanner()}
    <div id="alertKpiWrap">${alertKpis()}</div>
    ${renderAlertFilters()}
    ${renderAlertsTable()}`;
}

function wireAlertsPage(): void {
  document.querySelector('.main-content')?.addEventListener('click', (e: Event) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    const ack = target.closest('[data-action="ack"]');
    if (ack) { e.stopPropagation(); FleetLayout.toast(`Alert ${ack.dataset.id} acknowledged`); return; }
    const open = target.closest('[data-action="open-alert"]') || target.closest('.alerts-table .data-row');
    if (open) {
      const id = open.dataset.id || open.dataset.alertId || open.closest('[data-alert-id]')?.dataset.alertId;
      if (id) openAlert(id);
      return;
    }
    const pageBtn = target.closest('[data-alert-page]');
    if (pageBtn && !window.FleetRegistryQuery?.pagination('alerts')) { ZentridAlertPager.page += pageBtn.dataset.alertPage === 'next' ? 1 : -1; applyAlertFilters(false); return; }
    if (target.closest('#resetAlertFilters')) {
      ['severityFilter','statusFilter','tenantFilter','plantFilter','vendorFilter'].forEach(id => { const el = document.getElementById(id); if (el) el.value = 'All'; });
      const s = document.getElementById('alertSearch'); if (s) s.value = '';
      window.FleetRegistryQuery?.update('alerts', { search: null, severity: null, alertStatus: null, tenant: null, plant: null, vendor: null }, { replace: true, emit: false });
      applyAlertFilters(true);
    }
    if (target.closest('#clearAlertContext')) { clearAlertContext(); location.reload(); }
    if (target.closest('#exportAlerts')) FleetLayout.toast('Alert export queued');
  });
  document.getElementById('alertSearch')?.addEventListener('input', () => FleetRuntimeStability.debounce('registry:alerts:search', () => applyAlertFilters(true), 220));
  ['severityFilter','statusFilter','tenantFilter','plantFilter','vendorFilter'].forEach(id => document.getElementById(id)?.addEventListener('change', () => applyAlertFilters(true)));
}

function wireAlertDetailPage(): void {
  const a = selectedAlert();
  document.getElementById('detailAck')?.addEventListener('click', () => {
    saveAlertRuntimeState(a, { acknowledged: true });
    FleetLayout.toast(`${a.id} acknowledged`);
    rerenderActiveAlertTab(a);
  });
  document.querySelectorAll('.alert-detail-nav-v71 button').forEach(btn => btn.onclick = () => {
    document.querySelectorAll('.alert-detail-nav-v71 button').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    const content = document.getElementById('alertDetailContent');
    if (content) content.innerHTML = alertDetailTab(a, btn.dataset.tab);
    bindAlertDetailActions(a);
  });
  bindAlertDetailActions(a);
}

function bindAlertDetailActions(a: FleetAlertRecord): void {
  const plant = document.getElementById('openAlertPlant');
  if (plant) plant.onclick = () => { localStorage.setItem('zentrid_selected_plant', a.plantId); location.href = 'plant-detail.html'; };
  const device = document.getElementById('openAlertDevice');
  if (device) device.onclick = () => { localStorage.setItem('zentrid_selected_device', a.deviceId); location.href = 'device-detail.html'; };
  const heroDevice = document.getElementById('openAlertDeviceFromHero');
  if (heroDevice) heroDevice.onclick = () => { localStorage.setItem('zentrid_selected_device', a.deviceId); location.href = 'device-detail.html'; };
  const tel = document.getElementById('openAlertTelemetry');
  if (tel) tel.onclick = () => { localStorage.setItem('zentrid_telemetry_context', JSON.stringify({ tenant: a.tenant, plant: a.plant, device: a.device, metric: a.related.telemetryMetric, range: localStorage.getItem('zentrid_time') || 'Last 24h', layer: 'Normalized' })); location.href = 'telemetry.html'; };

  const handlers: Record<string, () => false | void | AlertRuntimeState> = {
    detailAck: () => saveAlertRuntimeState(a, { acknowledged: true }),
    actionAck: () => saveAlertRuntimeState(a, { acknowledged: true }),
    actionAssign: () => saveAlertRuntimeState(a, { assignee: 'Operations Team', acknowledged: true }),
    actionTask: () => {
      const suffix = a.id.replace(/\D/g,'').slice(-4) || '0000';
      saveAlertRuntimeState(a, { acknowledged: true, taskId: `TASK-${suffix}`, workOrder: `WO-${suffix}` });
      localStorage.setItem('zentrid_task_context', JSON.stringify({ alertId: a.id, plant: a.plant, device: a.device, source: 'Alert Detail' }));
    },
    actionEscalate: () => saveAlertRuntimeState(a, { escalated: true, assignee: 'L2 Support / Vendor' }),
    actionResolve: () => saveAlertRuntimeState(a, { resolved: true, acknowledged: true }),
    actionSopSave: () => {
      const notes = document.getElementById('sopResolutionNotes')?.value || '';
      const outcome = document.getElementById('sopOutcome')?.value || 'In Progress';
      const escalationTarget = document.getElementById('sopEscalationTarget')?.value || '';
      saveAlertRuntimeState(a, { notes, outcome, escalationTarget });
    },
    actionSopComplete: () => {
      const total = document.querySelectorAll('.sop-check-input').length || alertSopModel(a).total;
      saveAlertRuntimeState(a, { sopDone: Array.from({ length: total }, () => true), outcome: 'Pass' });
    },
    openAlertCase: () => {
      localStorage.setItem('zentrid_incident_context', JSON.stringify({ alertId: a.id, caseId: alertIncidentModel(a).caseId, plant: a.plant, device: a.device }));
      FleetLayout.toast(`Case context saved for ${a.id}`);
      return false;
    }
  };
  Object.entries(handlers).forEach(([id, fn]) => {
    document.querySelectorAll(`#${id}`).forEach(btn => btn.onclick = () => {
      const result = fn();
      if (result !== false) FleetLayout.toast(`${btn.textContent?.trim() || 'Action'} updated for ${a.id}`);
      rerenderActiveAlertTab(a);
    });
  });

  document.querySelectorAll('.sop-check-input').forEach(input => {
    (input as HTMLInputElement).onchange = () => {
      const current = alertRuntimeState(a);
      const total = document.querySelectorAll('.sop-check-input').length;
      const done = current.sopDone || Array.from({ length: total }, (_, i) => i < alertSopModel(a).completed);
      done[Number((input as HTMLInputElement).dataset.index)] = (input as HTMLInputElement).checked;
      saveAlertRuntimeState(a, { sopDone: done });
      rerenderActiveAlertTab(a);
    };
  });
  document.querySelectorAll('.sop-evidence button').forEach(btn => {
    btn.onclick = () => {
      const current = alertRuntimeState(a);
      const ev = new Set(current.evidence || []);
      const key = btn.dataset.evidence;
      ev.has(key) ? ev.delete(key) : ev.add(key);
      saveAlertRuntimeState(a, { evidence: Array.from(ev) });
      FleetLayout.toast(`${key} evidence updated`);
      rerenderActiveAlertTab(a);
    };
  });
  const outcome = document.getElementById('sopOutcome');
  if (outcome) (outcome as HTMLSelectElement).onchange = () => {
    saveAlertRuntimeState(a, { outcome: (outcome as HTMLSelectElement).value });
    rerenderActiveAlertTab(a);
  };
}


function alertRuntimeState(a: FleetAlertRecord): AlertRuntimeState {
  try { return JSON.parse(localStorage.getItem(`zentrid_alert_runtime_${a.id}`) || '{}'); }
  catch { return {}; }
}
function saveAlertRuntimeState(a: FleetAlertRecord, patch: Partial<AlertRuntimeState>): AlertRuntimeState {
  const next = Object.assign({}, alertRuntimeState(a), patch || {});
  localStorage.setItem(`zentrid_alert_runtime_${a.id}`, JSON.stringify(next));
  return next;
}
function rerenderActiveAlertTab(a: FleetAlertRecord): void {
  const active = document.querySelector('.alert-detail-nav-v71 button.active')?.dataset.tab || 'summary';
  const host = document.getElementById('alertDetailContent');
  if (host) host.innerHTML = alertDetailTab(a, active);
  bindAlertDetailActions(a);
}
function alertDisplayStatus(a: FleetAlertRecord): string {
  const st = alertRuntimeState(a);
  if (st.resolved) return 'Resolved';
  if (st.escalated) return 'Escalated';
  if (st.acknowledged) return 'Acknowledged';
  return a.status;
}

function alertIncidentModel(a: FleetAlertRecord): AlertIncidentModel {
  const hasCase = a.related?.caseId && a.related.caseId !== '—';
  const hasTask = a.related?.taskId && a.related.taskId !== '—';
  const openLike = ['Open','Escalated'].includes(a.status);
  const runtime = alertRuntimeState(a);
  const displayStatus = alertDisplayStatus(a);
  const owner = runtime.assignee || (a.owner && a.owner !== 'Unassigned' ? a.owner : 'Needs assignment');
  const runtimeTask = runtime.taskId;
  const runtimeOrder = runtime.workOrder;
  return {
    caseId: hasCase ? a.related.caseId : `CASE-${a.id.replace(/\D/g,'').slice(-4) || '0000'}`,
    caseStatus: a.status === 'Escalated' ? 'Escalated' : (a.status === 'Acknowledged' ? 'Assigned' : (a.status === 'Resolved' ? 'Resolved' : 'New')),
    assignee: owner,
    priority: a.priority,
    sla: a.sla,
    due: a.priority === 'P1' ? 'Today · 10:30' : a.priority === 'P2' ? 'Today · 14:00' : 'Next business day',
    taskId: runtimeTask || (hasTask ? a.related.taskId : 'Not created yet'),
    workOrder: runtimeOrder || (hasTask ? 'WO-00418' : 'Create after triage'),
    linkedClient: a.tenant.includes('Alpha') ? 'Arpi Solar Group' : a.tenant.replace('Tenant ', '') + ' Client',
    impact: /offline|fault|outage/i.test(`${a.title} ${a.category}`) ? 'Production risk / service interruption' : 'Monitoring required',
    nextStep: openLike ? 'Acknowledge, assign responsible owner and start SOP checklist.' : 'Continue monitoring and attach resolution evidence.'
  };
}

function alertIncidentCaseBlock(a: FleetAlertRecord): string {
  const c = alertIncidentModel(a);
  return `
    <section class="alert-incident-case glass-card">
      <div class="incident-head">
        <div><span class="eyebrow">Incident Case</span><h2>${c.caseId}</h2><p class="muted">Alert → Case → Task → Work Order → Resolution</p></div>
        <span class="badge ${alertTone(c.caseStatus)}">${c.caseStatus}</span>
      </div>
      <div class="incident-grid">
        <article><span>Responsible</span><strong>${c.assignee}</strong><small>Current owner</small></article>
        <article><span>Priority / SLA</span><strong>${c.priority}</strong><small>${c.sla}</small></article>
        <article><span>Due Date</span><strong>${c.due}</strong><small>Operational target</small></article>
        <article><span>Task</span><strong>${c.taskId}</strong><small>${c.workOrder}</small></article>
        <article><span>Linked Client</span><strong>${c.linkedClient}</strong><small>${a.plant}</small></article>
        <article><span>Impact</span><strong>${c.impact}</strong><small>${c.nextStep}</small></article>
      </div>
      <div class="incident-actions">
        <button id="actionAck" type="button">Acknowledge</button>
        <button id="actionAssign" type="button">Assign Responsible</button>
        <button id="actionTask" type="button">Create Task</button>
        <button id="actionResolve" type="button" class="danger-action">Resolve</button>
      </div>
    </section>`;
}

function alertCaseTimeline(a: FleetAlertRecord): string {
  const c = alertIncidentModel(a);
  const rows = [
    ['Detected', a.created, 'Alert normalized from source platform'],
    ['Acknowledged', a.status === 'Open' ? 'Pending' : a.updated, a.status === 'Open' ? 'Waiting for operator confirmation' : `Confirmed by ${c.assignee}`],
    ['Assigned', c.assignee === 'Needs assignment' ? 'Pending' : a.updated, c.assignee],
    ['In Progress', c.taskId === 'Not created yet' ? 'Pending' : 'Started', c.taskId],
    ['Resolved', a.status === 'Resolved' ? a.updated : 'Pending', 'Resolution evidence required']
  ];
  return `<div class="incident-timeline">${rows.map(([step,time,desc],i)=>`<div class="incident-step ${time==='Pending'?'pending':'done'}"><b>${i+1}</b><div><strong>${step}</strong><span>${time}</span><small>${desc}</small></div></div>`).join('')}</div>`;
}


function alertSopModel(a: FleetAlertRecord): AlertSopModel {
  const hay = `${a.title} ${a.category} ${a.description}`.toLowerCase();
  const outage = hay.includes('outage') || hay.includes('offline') || hay.includes('communication') || hay.includes('no telemetry');
  const voltage = hay.includes('voltage') || hay.includes('fault') || hay.includes('electrical');
  const temperature = hay.includes('temperature') || hay.includes('bess') || hay.includes('battery');
  let title = 'Recommended Resolution Procedure';
  let procedure = 'Generic Alert Investigation';
  let items = [
    'Acknowledge alert and confirm current status.',
    'Check latest telemetry and source platform state.',
    'Inspect linked plant and device context.',
    'Attach evidence or operator note.',
    'Escalate if the issue remains active after SLA threshold.',
    'Resolve incident after verification.'
  ];
  if (outage) {
    procedure = 'Grid / Communication Outage SOP';
    items = [
      'Verify utility grid or communication availability.',
      'Measure AC voltage or confirm gateway connectivity.',
      'Inspect AC breaker, router, logger or communication module.',
      'Verify wiring and live/neutral connection state.',
      'Restart inverter, logger or breaker after inspection window.',
      'Confirm telemetry recovery and close incident.'
    ];
  } else if (voltage) {
    procedure = 'Grid Voltage Investigation SOP';
    items = [
      'Verify inverter safety parameters.',
      'Measure grid voltage with a multimeter.',
      'Verify AC cable sizing and route length.',
      'Check AC terminal connections.',
      'Verify local grid stability.',
      'Restart inverter after inspection and record evidence.'
    ];
  } else if (temperature) {
    procedure = 'Battery Temperature SOP';
    items = [
      'Confirm battery rack temperature trend.',
      'Check cooling state and ambient conditions.',
      'Inspect BESS ventilation and cabinet alerts.',
      'Verify charge/discharge mode and current load.',
      'Escalate to BESS specialist if temperature keeps rising.',
      'Attach thermal evidence and monitoring notes.'
    ];
  }
  const runtime = alertRuntimeState(a);
  const baseCompleted = alertDisplayStatus(a) === 'Open' ? 2 : alertDisplayStatus(a) === 'Escalated' ? 4 : alertDisplayStatus(a) === 'Acknowledged' ? 3 : 5;
  const doneState = Array.isArray(runtime.sopDone) ? runtime.sopDone : items.map((_, i) => i < baseCompleted);
  const completed = doneState.filter(Boolean).length;
  return {
    title,
    procedure,
    completed,
    total: items.length,
    progress: Math.round((completed / items.length) * 100),
    outcome: runtime.outcome || (alertDisplayStatus(a) === 'Escalated' ? 'Needs Escalation' : alertDisplayStatus(a) === 'Open' ? 'In Progress' : 'Pass'),
    escalationTarget: runtime.escalationTarget || (alertDisplayStatus(a) === 'Escalated' ? 'L2 Support / Vendor' : 'Field Technician if not resolved'),
    evidence: ['Photo evidence', 'Voltage measurement', 'Operator note'],
    items: items.map((label, i) => ({
      label,
      done: !!doneState[i],
      owner: doneState[i] ? (runtime.assignee || (a.owner === 'Unassigned' ? 'Operations Team' : a.owner)) : 'Pending owner',
      time: doneState[i] ? `12 Jun 2026 · 09:${String(30 + i * 4).padStart(2, '0')}` : 'Pending'
    }))
  };
}

function alertSopChecklistBlock(a: FleetAlertRecord): string {
  const sop = alertSopModel(a);
  const runtime = alertRuntimeState(a);
  const evidenceDone = new Set(runtime.evidence || []);
  return `
    <section class="alert-sop-card glass-card">
      <div class="sop-head">
        <div><span class="eyebrow">SOP Checklist</span><h2>${sop.title}</h2><p class="muted">${sop.procedure} · ${sop.completed} / ${sop.total} completed</p></div>
        <div class="sop-progress"><strong>${sop.progress}%</strong><span>Completion</span></div>
      </div>
      <div class="sop-progress-bar"><i style="width:${sop.progress}%"></i></div>
      <div class="sop-checklist sop-checklist-interactive">
        ${sop.items.map((item, idx) => renderCheckRow({
            label: item.label,
            hint: `${item.done ? 'Completed by' : 'Assigned to'}: ${item.owner} · ${item.time}`,
            status: item.done ? 'Done' : 'Pending',
            checked: item.done,
            input: true,
            index: idx,
            required: idx < 2
          })).join('')}
      </div>
      <div class="sop-bottom-grid">
        <div class="sop-evidence"><h3>Required Evidence</h3><div>${sop.evidence.map(x => `<button type="button" data-evidence="${x}" class="${evidenceDone.has(x) ? 'active' : ''}">${evidenceDone.has(x) ? '✓ ' : '+ '}${x}</button>`).join('')}</div></div>
        <label class="sop-notes"><span>Resolution Notes</span><textarea id="sopResolutionNotes" placeholder="Operator findings, measurements and next action...">${runtime.notes || (a.status === 'Escalated' ? 'Escalated after remote validation. Field inspection required.' : '')}</textarea></label>
        <div class="sop-outcome"><span>Outcome</span><select id="sopOutcome"><option ${sop.outcome === 'In Progress' ? 'selected' : ''}>In Progress</option><option ${sop.outcome === 'Pass' ? 'selected' : ''}>Pass</option><option ${sop.outcome === 'Fail' ? 'selected' : ''}>Fail</option><option ${sop.outcome === 'Needs Escalation' ? 'selected' : ''}>Needs Escalation</option></select>${sop.outcome === 'Needs Escalation' ? `<label><span>Escalate To</span><select id="sopEscalationTarget"><option ${sop.escalationTarget.includes('Field') ? 'selected' : ''}>Field Technician</option><option ${sop.escalationTarget.includes('L2') ? 'selected' : ''}>L2 Support / Vendor</option><option ${sop.escalationTarget.includes('Grid') ? 'selected' : ''}>Grid Operator</option></select></label>` : `<small>Escalation: ${sop.escalationTarget}</small>`}</div>
      </div>
      <div class="incident-actions sop-actions">
        <button id="actionSopSave" type="button">Save Progress</button>
        <button id="actionSopComplete" type="button">Complete Checklist</button>
        <button id="actionTask" type="button">Create Work Order</button>
        <button id="actionResolve" type="button" class="danger-action">Resolve Incident</button>
      </div>
    </section>`;
}
// v68 — richer Alert Detail based on GoodWe-style alert detail structure
function alertDetailModel(a: FleetAlertRecord): AlertDetailModel {
  const isGoodWeGrid = a.vendor === 'GoodWe' || /grid|voltage|inverter/i.test(`${a.title} ${a.category}`);
  const isRecovered = String(a.status || '').toLowerCase().includes('resolved') || a.id === 'ALT-2074';
  const reasonGridVoltage = [
    "The inverter's safety parameters are not set correctly.",
    'The grid voltage is not stable.',
    'The AC cable is too small or too long, increasing resistance and voltage drop.',
    'The AC cable is not connected correctly, causing abnormal voltage on the AC side.'
  ];
  const suggestionGridVoltage = [
    "Check if the inverter's safety parameters are set correctly; if not, turn off AC, correct the settings and turn AC on again.",
    'Use a multimeter to check whether live-to-neutral voltage deviation exceeds the normal range.',
    'Check whether the local grid voltage is stable.',
    'Inspect AC cable length, section and connection quality.'
  ];
  const reasonGridOutage = [
    'The grid is unavailable or unstable.',
    'The AC connection is not working correctly.',
    'The AC switch or breaker connection is damaged.',
    'The inverter AC side is not connected.'
  ];
  const suggestionGridOutage = [
    'Check whether the grid is down.',
    "Use a multimeter to check if the inverter's AC side has voltage.",
    'Check whether the AC breaker is damaged.',
    'Verify live and neutral wires are connected correctly.',
    'Make sure the AC breaker is ON and the system is connected to grid.',
    'If everything is normal, turn off the DC/AC breaker and turn it on again after 5 minutes.'
  ];
  const isOutage = /offline|outage|no telemetry|communication/i.test(`${a.title} ${a.category} ${a.description}`);
  return {
    levelLabel: a.severity === 'Critical' ? 'Fault' : 'Alert',
    occurrenceStatus: isRecovered ? 'Recovered' : 'Occurring',
    confirmStatus: a.status === 'Acknowledged' ? 'Confirmed' : 'Unconfirmed',
    recoveryTime: isRecovered ? '12/06/2026 09:54:50' : '',
    duration: a.age || '2m 15s',
    alertType: /communication|telemetry|data/i.test(a.category) ? 'Communication / Data Events' : 'Protection Events',
    plantName: a.plant,
    alertTime: `12/06/2026 ${a.created}:40`,
    component: a.deviceType || 'Device',
    deviceLabel: `${a.device}${a.deviceId ? ` (${a.deviceId})` : ''}`,
    reason: isOutage ? reasonGridOutage : (isGoodWeGrid ? reasonGridVoltage : [a.probableCause]),
    suggestion: isOutage ? suggestionGridOutage : (isGoodWeGrid ? suggestionGridVoltage : [a.recommendation]),
    curveMetric: isOutage ? 'AC Voltage / Connectivity' : (a.related?.telemetryMetric || 'Current Power'),
    samples: isOutage ? ['0 V','0 V','0 V','Recovered'] : ['232 V','246 V','259 V','241 V']
  };
}

function alertDetailHero(a: FleetAlertRecord, m: AlertDetailModel): string {
  const levelClass = m.levelLabel === 'Fault' ? 'danger' : 'warning';
  const statusClass = m.occurrenceStatus === 'Recovered' ? 'success' : 'danger';
  return `
    <section class="alert-detail-hero glass-card">
      <div class="alert-detail-title-row">
        <div class="alert-title-stack">
          <div class="alert-title-line"><span class="alert-level-pill ${levelClass}">${m.levelLabel}</span><h1>${a.title}</h1><span class="alert-status-pill ${statusClass}"><i></i>${m.occurrenceStatus}</span></div>
          <button class="alert-device-link" id="openAlertDeviceFromHero" type="button">▣ ${m.deviceLabel}</button>
        </div>
        <button class="secondary-action" onclick="location.href='alerts.html'">Back to Alerts</button>
      </div>
      <div class="alert-detail-meta-grid">
        <div><span>Plant Name</span><strong>${m.plantName}</strong></div>
        <div><span>Alert Time</span><strong>${m.alertTime}</strong></div>
        <div><span>Devices / Components</span><strong>${m.component}</strong></div>
        <div><span>Duration</span><strong>${m.duration}</strong></div>
        <div><span>Alert Type</span><strong>${m.alertType}</strong></div>
        <div><span>Zentrid Alert Code</span><strong>${a.fleetCode || '—'}</strong></div>
        <div><span>Unified Category</span><strong>${alertCodeMeta(a).category}</strong></div>
        <div><span>Device Scope</span><strong>${alertCodeMeta(a).deviceScope}</strong></div>
        <div><span>Vendor Error Code</span><strong>${vendorCodeLabel(a)}</strong></div>
        <div><span>Confirm Status</span><strong class="${m.confirmStatus === 'Confirmed' ? 'text-success' : 'text-warning'}">${m.confirmStatus}</strong><button class="mini-inline-action" id="detailAck" type="button">Confirm</button></div>
        ${m.recoveryTime ? `<div><span>Recovery Time</span><strong>${m.recoveryTime}</strong></div>` : ''}
      </div>
    </section>`;
}

function alertReasonBlock(title: string, icon: string, items: string[]): string {
  return `<section class="alert-explain-card glass-card"><div class="alert-section-title"><span>${icon}</span><h3>${title}</h3></div><ol class="alert-numbered-list">${items.map(x => `<li>${x}</li>`).join('')}</ol></section>`;
}

function alertCurveBlock(a: FleetAlertRecord, m: AlertDetailModel): string {
  return `<section class="alert-curve-card glass-card"><div class="alert-section-title"><span>⌁</span><h3>Curve</h3><small>${m.curveMetric} around alert time</small></div><div class="alert-curve-visual"><div class="curve-line"></div>${m.samples.map((x,i)=>`<div class="curve-point" style="left:${16+i*24}%; bottom:${28+(i%3)*16}%"><span>${x}</span></div>`).join('')}</div></section>`;
}

function renderAlertDetailContent(a: FleetAlertRecord): string {
  const m = alertDetailModel(a);
  return `
    <section class="page-hero alert-detail-page-hero">
      <div><p class="eyebrow">Global Admin · Alerts ${FleetDataSource.badge(a, 'alert', true)}</p><h1>Alert Details</h1><p class="muted">Source-normalized alert workspace with incident, SOP, timeline and related objects.</p></div>
      <button class="freshness-card" onclick="FleetLayout.toast('Alert detail refreshed')"><span class="pulse"></span><div><strong>Refresh</strong><small>${a.updated} · ${a.source}</small></div></button>
    </section>
    ${alertDetailHero(a, m)}
    <section class="kpi-grid detail-kpis alert-detail-kpis">
      <article class="kpi-card ${a.severity === 'Critical' ? 'red' : 'yellow'}"><span>Severity</span><strong>${a.severity}</strong><small>${a.priority}</small></article>
      <article class="kpi-card"><span>Status</span><strong>${a.status}</strong><small>${a.sla}</small></article>
      <article class="kpi-card"><span>Owner</span><strong>${a.owner}</strong><small>Current assignment</small></article>
      <article class="kpi-card"><span>Source</span><strong>${a.vendor}</strong><small>${a.source}</small></article>
    </section>
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

function alertDetailTab(a: FleetAlertRecord, tab: AlertDetailTabId | string): string {
  const m = alertDetailModel(a);
  if (tab === 'classification') { const meta = alertCodeMeta(a); return `<div class="split-grid alert-classification-tab"><div class="panel-lite"><h3>Zentrid Unified Code</h3><div class="info-grid"><div><span>Zentrid Code</span><strong>${a.fleetCode || '—'}</strong></div><div><span>Unified Name</span><strong>${meta.name}</strong></div><div><span>Category</span><strong>${meta.category}</strong></div><div><span>Severity</span><strong>${meta.severity}</strong></div><div><span>Device Scope</span><strong>${meta.deviceScope}</strong></div><div><span>Meaning</span><strong>${meta.meaning}</strong></div></div></div><div class="panel-lite"><h3>Vendor Source Mapping</h3><div class="info-grid"><div><span>Vendor</span><strong>${a.vendor}</strong></div><div><span>Source Platform</span><strong>${a.source}</strong></div><div><span>Received Vendor Code</span><strong>${vendorCodeLabel(a)}</strong></div><div><span>Vendor Message</span><strong>${a.vendorMessage || a.title}</strong></div><div><span>Mapping Status</span><strong>${vendorMappingStatus(a)}</strong></div><div><span>Known Mapping</span><strong>${(meta.vendorMappings || []).join(' · ') || '—'}</strong></div><div><span>Integration</span><strong>${a.integration}</strong></div><div><span>Policy</span><strong>${meta.policy}</strong></div></div><div class="vertical-actions"><button onclick="location.href='alert-dictionary.html'">Open Alert Dictionary</button><button id="actionTask">Create Case from Policy</button></div></div><div class="panel-lite full-span-v86"><h3>Mapping Validation Checklist</h3>${renderMappingValidation(a)}</div></div>`; }
  if (tab === 'case') return `<div class="split-grid incident-case-tab"><div class="panel-lite"><h3>Case Timeline</h3>${alertCaseTimeline(a)}</div><div class="panel-lite"><h3>Case Context</h3><div class="info-grid"><div><span>Case ID</span><strong>${alertIncidentModel(a).caseId}</strong></div><div><span>Status</span><strong>${alertIncidentModel(a).caseStatus}</strong></div><div><span>Responsible</span><strong>${alertIncidentModel(a).assignee}</strong></div><div><span>Due</span><strong>${alertIncidentModel(a).due}</strong></div><div><span>Task</span><strong>${alertIncidentModel(a).taskId}</strong></div><div><span>Work Order</span><strong>${alertIncidentModel(a).workOrder}</strong></div></div><div class="vertical-actions incident-tab-actions"><button id="actionAssign">Assign Responsible</button><button id="actionTask">Create Task / Work Order</button><button id="openAlertCase">Open Case Workspace</button></div></div></div>`;
  if (tab === 'sop') return alertSopChecklistBlock(a);
  if (tab === 'timeline') return `<div class="split-grid"><div class="panel-lite"><h3>Event Timeline</h3><div class="timeline-mini">${a.timeline.map(x => `<p>${x}</p>`).join('')}</div></div><div class="panel-lite"><h3>SLA & Ownership</h3><div class="info-grid"><div><span>SLA</span><strong>${a.sla}</strong></div><div><span>Owner</span><strong>${a.owner}</strong></div><div><span>Created</span><strong>${a.created}</strong></div><div><span>Updated</span><strong>${a.updated}</strong></div></div></div></div>`;
  if (tab === 'related') return `<div class="split-grid"><div class="panel-lite"><h3>Source Context</h3><div class="info-grid"><div><span>Tenant</span><strong>${a.tenant}</strong></div><div><span>Plant</span><strong>${a.plant}</strong></div><div><span>Device</span><strong>${a.device}</strong></div><div><span>Integration</span><strong>${a.integration}</strong></div><div><span>Telemetry</span><strong>${a.telemetry}</strong></div><div><span>Metric</span><strong>${a.related.telemetryMetric}</strong></div><div><span>Zentrid Alert Code</span><strong>${a.fleetCode || '—'}</strong></div><div><span>Vendor Error Code</span><strong>${vendorCodeLabel(a)}</strong></div></div></div><div class="panel-lite"><h3>Open Related</h3><div class="vertical-actions"><button id="openAlertPlant">Open Plant</button><button id="openAlertDevice">Open Device</button><button id="openAlertTelemetry">Open Telemetry</button><button id="openAlertCase">Open Case / Task</button></div></div></div>`;
  if (tab === 'activity') return `<div class="split-grid"><div class="panel-lite"><h3>Operational Actions</h3><div class="vertical-actions"><button id="actionAck">Acknowledge Alert</button><button id="actionAssign">Assign Owner</button><button id="actionTask">Create Task</button><button id="actionEscalate">Escalate</button><button id="actionResolve" class="danger-action">Resolve Alert</button></div></div><div class="panel-lite"><h3>Activity Log</h3><div class="timeline-mini"><p><strong>09:53</strong> Alert detected from ${a.source}</p><p><strong>09:55</strong> Case context prepared by Zentrid</p><p><strong>Now</strong> Waiting for operator acknowledgement</p></div></div></div>`;
  return `<div class="alert-summary-layout">${alertReasonBlock('Reason', '!', m.reason)}${alertReasonBlock('Suggestion', '✓', m.suggestion)}${alertCurveBlock(a, m)}<section class="alert-explain-card glass-card"><div class="alert-section-title"><span>i</span><h3>Operational Context</h3></div><div class="info-grid"><div><span>Category</span><strong>${alertCodeMeta(a).category}</strong></div><div><span>Canonical Severity</span><strong>${alertCodeMeta(a).severity}</strong></div><div><span>Device Scope</span><strong>${alertCodeMeta(a).deviceScope}</strong></div><div><span>Telemetry</span><strong>${a.telemetry}</strong></div><div><span>Case</span><strong>${a.related.caseId}</strong></div><div><span>Task</span><strong>${a.related.taskId}</strong></div><div><span>Zentrid Alert Code</span><strong>${a.fleetCode || '—'}</strong></div><div><span>Vendor Error Code</span><strong>${vendorCodeLabel(a)}</strong></div><div><span>Workflow Policy</span><strong>${alertCodeMeta(a).policy}</strong></div></div></section></div>`;
}

if (location.pathname.endsWith('alert-detail.html')) {
  FleetLayout.mount(renderAlertDetailContent(selectedAlert()));
  wireAlertDetailPage();
} else {
  FleetLayout.mount(renderAlertsPage());
  wireAlertsPage();
}
