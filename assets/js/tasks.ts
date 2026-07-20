type ZentridTaskTone = 'danger' | 'warning' | 'success';

type ZentridTaskStatus = 'New' | 'Assigned' | 'In Progress' | 'Scheduled' | 'Completed' | 'Closed' | string;
type ZentridTaskPriority = 'P1' | 'P2' | 'P3' | 'P4' | string;

interface ZentridTaskChecklistItem {
  text: string;
  done: boolean;
}

type ZentridTaskChecklistInput = string | Partial<ZentridTaskChecklistItem>;

interface ZentridTaskRecord {
  id: string;
  type: string;
  title: string;
  status: ZentridTaskStatus;
  priority: ZentridTaskPriority;
  assignee: string;
  team: string;
  due: string;
  sla: string;
  client: string;
  plantId: string;
  plant: string;
  deviceId: string;
  device: string;
  alertId: string;
  source: string;
  created: string;
  updated: string;
  description: string;
  evidence: string[];
  checklist: ZentridTaskChecklistItem[];
  notes: string[];
}

type ZentridTaskDraft = Omit<ZentridTaskRecord, 'checklist' | 'evidence' | 'notes'> & {
  evidence?: string[];
  checklist?: ZentridTaskChecklistInput[];
  notes?: string[];
};

interface ZentridTaskDeviceContext {
  id: string;
  name: string;
  type: string;
}

interface ZentridTaskAlertContext {
  id: string;
  title: string;
  deviceId: string;
  severity: string;
  priority: string;
  type: string;
  description: string;
}

interface ZentridTaskPlantContext {
  id: string;
  name: string;
  devices: ZentridTaskDeviceContext[];
  alerts: ZentridTaskAlertContext[];
}

interface ZentridTaskClientContext {
  client: string;
  plants: ZentridTaskPlantContext[];
}

interface ZentridAlertTaskSource {
  id: string;
  title: string;
  device?: string;
  severity?: string;
  priority?: string;
  sla?: string;
  client?: string;
  plantId?: string;
  plant?: string;
  deviceId?: string;
  recommendation?: string;
  description?: string;
  telemetry?: string;
}

interface ZentridTaskFormValues {
  [key: string]: string;
  client: string;
  plantId: string;
  deviceId: string;
  alertId: string;
  type: string;
  title: string;
  priority: string;
  assignee: string;
  team: string;
  due: string;
  description: string;
  note: string;
}

function taskFirst<T>(items: readonly T[], label: string): T {
  const item = items[0];
  if (!item) throw new Error(`Missing required task context: ${label}`);
  return item;
}

function taskString(value: FormDataEntryValue | string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

function taskFormValues(form: HTMLFormElement): ZentridTaskFormValues {
  const raw = Object.fromEntries(new FormData(form).entries());
  return raw as unknown as ZentridTaskFormValues;
}

const ZentridTasksBase: ZentridTaskDraft[] = [
  {
    id: 'TASK-0144', type: 'Remote Check', title: 'Review BESS rack temperature trend', status: 'In Progress', priority: 'P2', assignee: 'BESS Specialist', team: 'Operations', due: 'Today · 14:30', sla: '1h 12m remaining',
    client: 'North Region Ops', plantId: 'PLT-000501', plant: 'Armavir BESS Solar', deviceId: 'DEV-BESS-0002', device: 'BESS-RACK-02', alertId: 'ALT-2044', source: 'Alert', created: '08:28', updated: '09:02',
    description: 'Monitor rack 02 temperature, compare against last 24h trend and confirm whether cooling inspection is required.',
    evidence: ['Telemetry snapshot attached', 'Alert timeline linked', 'No field visit created yet'],
    checklist: ['Open telemetry trend', 'Check BESS rack current temperature', 'Add operational note', 'Decide if field inspection is needed'],
    notes: ['Task accepted by BESS Specialist at 09:02.']
  },
  {
    id: 'TASK-0150', type: 'Field Inspection', title: 'Inspect inverter fault on INV-021', status: 'Assigned', priority: 'P1', assignee: 'Operations Team', team: 'Field Service', due: 'Today · 12:00', sla: 'Escalated',
    client: 'Solaris Enterprise', plantId: 'PLT-000720', plant: 'Lyon PV Park', deviceId: 'DEV-INV-021', device: 'INV-021', alertId: 'ALT-2062', source: 'Alert', created: '08:58', updated: '09:06',
    description: 'Critical inverter fault reported by GoodWe SEMS. Field technician should inspect electrical subsystem and upload resolution evidence.',
    evidence: ['Alert code normalized', 'Alert escalated', 'Production drop detected'],
    checklist: ['Confirm technician availability', 'Inspect device onplant', 'Upload photo/evidence', 'Mark work completed'],
    notes: ['Field inspection required before resolution.']
  },
  {
    id: 'TASK-0158', type: 'Data Check', title: 'Validate Solis telemetry ingestion lag', status: 'New', priority: 'P3', assignee: 'Unassigned', team: 'Data Operations', due: 'Tomorrow · 10:00', sla: '3h 18m remaining',
    client: 'HelioGrid', plantId: 'PLT-000611', plant: 'Madrid East', deviceId: 'DEV-GW-019', device: 'GW-019', alertId: 'ALT-2050', source: 'Data Quality', created: '09:12', updated: '09:12',
    description: 'Check if telemetry delay is caused by vendor polling, gateway communication, or normalization queue lag.',
    evidence: ['Data freshness alert', 'Integration sync status warning'],
    checklist: ['Run sample fetch', 'Check integration status', 'Review normalization queue', 'Close if next interval arrives'],
    notes: []
  },
  {
    id: 'WO-0021', type: 'Work Order', title: 'Replace communication module on gateway', status: 'Scheduled', priority: 'P2', assignee: 'Field Team A', team: 'Maintenance', due: 'Jun 06 · 09:00', sla: 'Scheduled',
    client: 'Arpi Solar Group', plantId: 'PLT-000421', plant: 'Berlin Solar 1', deviceId: 'DEV-GW-001', device: 'Gateway-01', alertId: 'ALT-2031', source: 'Alert', created: 'Yesterday · 17:20', updated: 'Today · 08:05',
    description: 'Field visit scheduled to inspect communication gateway after repeated offline alerts.',
    evidence: ['Previous alert history', 'Technician assigned'],
    checklist: ['Prepare spare communication module', 'Visit plant', 'Replace module if needed', 'Attach completion evidence'],
    notes: ['Visit planned for Jun 06.']
  }
];

const taskStoreKey = 'zentrid_tasks_v2';
const taskStatuses: string[] = ['New', 'Assigned', 'In Progress', 'Scheduled', 'Completed', 'Closed'];
const taskPriorities: string[] = ['P1', 'P2', 'P3', 'P4'];
const taskTeams: string[] = ['Operations', 'Field Service', 'Data Operations', 'Maintenance', 'Support'];
const taskAssignees: string[] = ['Unassigned', 'Operations Team', 'Field Team A', 'Field Team B', 'BESS Specialist', 'Data Operations', 'Support Manager'];


const taskContextCatalog: ZentridTaskClientContext[] = [
  {
    client: 'ABC Solar Energy LLC',
    plants: [
      {
        id: 'PLT-000125', name: 'Yerevan Solar 1',
        devices: [
          { id: 'DEV-INV-125-01', name: 'INV-01', type: 'Inverter' },
          { id: 'DEV-MTR-125-01', name: 'Meter-01', type: 'Meter' },
          { id: 'DEV-BAT-125-01', name: 'BESS-01', type: 'Battery' }
        ],
        alerts: [
          { id: 'ALT-2091', title: 'Inverter offline', deviceId: 'DEV-INV-125-01', severity: 'Critical', priority: 'P1', type: 'Field Inspection', description: 'Inverter INV-01 is not responding. Check connection and physical power state.' },
          { id: 'ALT-2094', title: 'Meter data delayed', deviceId: 'DEV-MTR-125-01', severity: 'Warning', priority: 'P2', type: 'Data Check', description: 'Meter-01 has delayed telemetry. Verify vendor sync and data freshness.' }
        ]
      },
      {
        id: 'PLT-000126', name: 'Gyumri Rooftop',
        devices: [
          { id: 'DEV-INV-126-01', name: 'INV-RF-01', type: 'Inverter' },
          { id: 'DEV-WS-126-01', name: 'Weather Station', type: 'Weather Station' }
        ],
        alerts: [
          { id: 'ALT-2102', title: 'Low production warning', deviceId: 'DEV-INV-126-01', severity: 'Warning', priority: 'P3', type: 'Remote Check', description: 'Production is below expected range for the selected period.' }
        ]
      }
    ]
  },
  {
    client: 'Arpi Solar Group',
    plants: [
      {
        id: 'PLT-000421', name: 'Berlin Solar 1',
        devices: [
          { id: 'DEV-GW-001', name: 'Gateway-01', type: 'Gateway' },
          { id: 'DEV-INV-004', name: 'INV-004', type: 'Inverter' }
        ],
        alerts: [
          { id: 'ALT-2031', title: 'Gateway offline', deviceId: 'DEV-GW-001', severity: 'Critical', priority: 'P1', type: 'Work Order', description: 'Gateway offline repeatedly. Prepare field inspection and possible module replacement.' }
        ]
      }
    ]
  },
  {
    client: 'North Region Ops',
    plants: [
      {
        id: 'PLT-000501', name: 'Armavir BESS Solar',
        devices: [
          { id: 'DEV-BESS-0002', name: 'BESS-RACK-02', type: 'Battery Rack' },
          { id: 'DEV-INV-501-01', name: 'INV-BESS-01', type: 'Inverter' }
        ],
        alerts: [
          { id: 'ALT-2044', title: 'BESS rack temperature high', deviceId: 'DEV-BESS-0002', severity: 'Warning', priority: 'P2', type: 'Remote Check', description: 'Rack 02 temperature is above normal trend. Review telemetry before assigning field work.' }
        ]
      }
    ]
  },
  {
    client: 'Solaris Enterprise',
    plants: [
      {
        id: 'PLT-000720', name: 'Lyon PV Park',
        devices: [
          { id: 'DEV-INV-021', name: 'INV-021', type: 'Inverter' },
          { id: 'DEV-MTR-720-01', name: 'Grid Meter', type: 'Meter' }
        ],
        alerts: [
          { id: 'ALT-2062', title: 'Inverter fault', deviceId: 'DEV-INV-021', severity: 'Critical', priority: 'P1', type: 'Field Inspection', description: 'Critical inverter fault reported by GoodWe SEMS. Field inspection recommended.' }
        ]
      }
    ]
  },
  {
    client: 'HelioGrid',
    plants: [
      {
        id: 'PLT-000611', name: 'Madrid East',
        devices: [
          { id: 'DEV-GW-019', name: 'GW-019', type: 'Gateway' },
          { id: 'DEV-INV-611-03', name: 'INV-03', type: 'Inverter' }
        ],
        alerts: [
          { id: 'ALT-2050', title: 'Telemetry ingestion lag', deviceId: 'DEV-GW-019', severity: 'Warning', priority: 'P3', type: 'Data Check', description: 'Telemetry delay may be caused by vendor polling or normalization queue lag.' }
        ]
      }
    ]
  }
];

function contextClientNames(): string[] { return taskContextCatalog.map(c => c.client); }
function contextForClient(client: string): ZentridTaskClientContext { return taskContextCatalog.find(c => c.client === client) || taskFirst(taskContextCatalog, 'client'); }
function contextPlant(client: string, plantId?: string | null): ZentridTaskPlantContext {
  const ctx = contextForClient(client);
  return ctx.plants.find(p => p.id === plantId) || taskFirst(ctx.plants, 'plant');
}
function contextDevice(client: string, plantId?: string | null, deviceId?: string | null): ZentridTaskDeviceContext {
  const plant = contextPlant(client, plantId);
  return plant.devices.find(d => d.id === deviceId) || plant.devices[0] || { id: 'DEV-MANUAL', name: 'No device selected', type: 'Device' };
}
function contextAlert(client: string, plantId?: string | null, alertId?: string | null): ZentridTaskAlertContext | null {
  const plant = contextPlant(client, plantId);
  return plant.alerts.find(a => a.id === alertId) || null;
}
function taskTypeForAlert(alert?: ZentridTaskAlertContext | null): string {
  if (!alert) return 'Remote Check';
  return alert.type || (alert.severity === 'Critical' ? 'Field Inspection' : 'Remote Check');
}
function titleForContext(plant: ZentridTaskPlantContext, device: ZentridTaskDeviceContext, alert?: ZentridTaskAlertContext | null): string {
  if (alert) return `${alert.title} — ${device.name}`;
  if (device?.name) return `Check ${device.name} at ${plant.name}`;
  return `Operational check for ${plant.name}`;
}

function nowLabel(): string { return new Date().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
function taskTone(value: unknown): ZentridTaskTone {
  const v = String(value || '').toLowerCase();
  if (v.includes('p1') || v.includes('escalated') || v.includes('overdue')) return 'danger';
  if (v.includes('p2') || v.includes('assigned') || v.includes('progress') || v.includes('scheduled')) return 'warning';
  return 'success';
}
function normalizeChecklist(items?: ZentridTaskChecklistInput[]): ZentridTaskChecklistItem[] {
  return (items || []).map((item, index) => typeof item === 'string' ? { text: item, done: index === 0 } : { text: item.text || '', done: Boolean(item.done) });
}
function normalizeTask(t: ZentridTaskDraft | ZentridTaskRecord): ZentridTaskRecord {
  return {
    ...t,
    evidence: Array.isArray(t.evidence) ? t.evidence : [],
    checklist: normalizeChecklist(t.checklist),
    notes: Array.isArray(t.notes) ? t.notes : [],
    updated: t.updated || nowLabel()
  };
}
function seedTasksIfNeeded() {
  if (!localStorage.getItem(taskStoreKey)) {
    localStorage.setItem(taskStoreKey, JSON.stringify(ZentridTasksBase.map(normalizeTask)));
  }
}
function storedTasks(): ZentridTaskRecord[] {
  seedTasksIfNeeded();
  try { return JSON.parse(localStorage.getItem(taskStoreKey) || '[]').map(normalizeTask); } catch { return ZentridTasksBase.map(normalizeTask); }
}
function saveStoredTasks(items: ZentridTaskRecord[]) { localStorage.setItem(taskStoreKey, JSON.stringify(items.map(normalizeTask))); }
function allTasks(): ZentridTaskRecord[] { return storedTasks(); }
function saveTask(task: ZentridTaskDraft | ZentridTaskRecord): ZentridTaskRecord {
  const items = allTasks();
  const idx = items.findIndex(t => t.id === task.id);
  const normalized = normalizeTask({ ...task, updated: nowLabel() });
  if (idx >= 0) items[idx] = normalized; else items.unshift(normalized);
  saveStoredTasks(items);
  return normalized;
}
function selectedTask(): ZentridTaskRecord {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || localStorage.getItem('zentrid_selected_task') || allTasks()[0]?.id;
  const tasks = allTasks();
  return tasks.find(t => t.id === id) || taskFirst(tasks, 'task');
}
function openTask(id: string) {
  localStorage.setItem('zentrid_selected_task', id);
  location.href = `task-detail.html?id=${encodeURIComponent(id)}`;
}
function newTaskId(type: string = 'TASK'): string {
  const prefix = type === 'Work Order' ? 'WO' : 'TASK';
  const existing = allTasks().filter(t => t.id.startsWith(prefix)).length + 160;
  return `${prefix}-${String(existing).padStart(4, '0')}`;
}
function createTaskFromAlert(alert?: ZentridAlertTaskSource | null) {
  if (!alert) return;
  const exists = allTasks().find(t => t.alertId === alert.id);
  if (exists) return openTask(exists.id);
  const task = normalizeTask({
    id: newTaskId(alert.severity === 'Critical' ? 'Work Order' : 'Task'),
    type: alert.severity === 'Critical' ? 'Field Inspection' : 'Remote Check',
    title: `${alert.title} — ${alert.device}`,
    status: 'New',
    priority: alert.priority || 'P3',
    assignee: 'Unassigned',
    team: alert.severity === 'Critical' ? 'Operations' : 'Data Operations',
    due: alert.severity === 'Critical' ? 'Today · 12:00' : 'Tomorrow · 10:00',
    sla: alert.sla ?? '',
    client: alert.client ?? '',
    plantId: alert.plantId ?? '',
    plant: alert.plant ?? '',
    deviceId: alert.deviceId ?? '',
    device: alert.device ?? '',
    alertId: alert.id,
    source: 'Alert',
    created: 'Just now',
    updated: 'Just now',
    description: alert.recommendation || alert.description || '',
    evidence: [alert.telemetry || 'Telemetry context linked', 'Alert timeline linked'],
    checklist: ['Review alert details', 'Check latest telemetry', 'Assign owner', 'Add resolution evidence'],
    notes: ['Created from alert.']
  });
  saveTask(task);
  openTask(task.id);
}

function filteredTasks(): ZentridTaskRecord[] {
  const status = document.getElementById('taskStatusFilter')?.value || 'All';
  const priority = document.getElementById('taskPriorityFilter')?.value || 'All';
  const q = (document.getElementById('taskSearch')?.value || '').toLowerCase().trim();
  return allTasks().filter(t =>
    (status === 'All' || t.status === status) &&
    (priority === 'All' || t.priority === priority) &&
    (!q || `${t.id} ${t.title} ${t.client} ${t.plant} ${t.device} ${t.assignee} ${t.alertId}`.toLowerCase().includes(q))
  );
}
function refreshTasksPage() {
  const items = filteredTasks();
  const kpis = document.getElementById('taskKpis');
  const rows = document.getElementById('taskRows');
  if (kpis) kpis.innerHTML = taskKpis(items);
  if (rows) rows.innerHTML = renderTaskRows(items);
}
function taskKpis(items: ZentridTaskRecord[] = filteredTasks()): string {
  return `<section class="kpi-grid compact-kpis">
    <article class="kpi-card cyan"><div class="kpi-label">Open Work</div><div class="kpi-value">${items.filter(t => !['Completed','Closed'].includes(t.status)).length}</div><div class="kpi-delta">Tasks and work orders</div></article>
    <article class="kpi-card yellow"><div class="kpi-label">Assigned</div><div class="kpi-value">${items.filter(t => ['Assigned','In Progress','Scheduled'].includes(t.status)).length}</div><div class="kpi-delta">Owner visible</div></article>
    <article class="kpi-card red"><div class="kpi-label">P1 / Escalated</div><div class="kpi-value">${items.filter(t => t.priority === 'P1' || t.sla === 'Escalated').length}</div><div class="kpi-delta">Needs fast action</div></article>
    <article class="kpi-card green"><div class="kpi-label">Completed</div><div class="kpi-value">${items.filter(t => ['Completed','Closed'].includes(t.status)).length}</div><div class="kpi-delta">Closed evidence</div></article>
  </section>`;
}
function renderTaskRows(items: ZentridTaskRecord[] = filteredTasks()): string {
  return items.map(t => `<div class="data-row task-row">
    <div><strong>${t.title}</strong><small>${t.id} · ${t.type} · Source: ${t.source} ${t.alertId !== '—' ? '· ' + t.alertId : ''}</small></div>
    <div><strong>${t.client}</strong><small>${t.plant} · ${t.device}</small></div>
    <div><span class="badge ${taskTone(t.priority)}">${t.priority}</span><small>${t.due}</small></div>
    <div><span class="badge ${taskTone(t.status)}">${t.status}</span><small>${t.assignee}</small></div>
    <div class="row-actions"><button onclick="openTask('${t.id}')">Open</button><button onclick="quickAssignTask('${t.id}')">Assign</button><button onclick="quickAdvanceTask('${t.id}')">Next</button></div>
  </div>`).join('') || `<div class="empty-card">No tasks match the current filters.</div>`;
}
function renderCreateTaskModal(): string {
  const firstClient = taskFirst(taskContextCatalog, 'client');
  const firstPlant = taskFirst(firstClient.plants, 'plant');
  const firstDevice = taskFirst(firstPlant.devices, 'device');
  const firstAlert = firstPlant.alerts[0] || null;
  return `<div class="modal" id="taskModal"><div class="modal-card compact-modal"><button class="modal-close" type="button" onclick="closeTaskModal()">x</button>
    <h2>Create Task / Work Order</h2><p class="muted">Select the operational context first. Zentrid will auto-fill plant, device, alert and suggested work details.</p>
    <form id="taskCreateForm" class="workflow-form" data-zentrid-form-readiness="local" data-zentrid-form-contract="TaskCreateDraft" data-zentrid-form-method="POST" data-zentrid-form-api-note="Task creation remains local until a backend mutation contract is confirmed.">
      <div class="form-grid">
        <label>Client<select name="client" id="taskClientSelect">${contextClientNames().map(x => `<option>${x}</option>`).join('')}</select></label>
        <label>Plant<select name="plantId" id="taskPlantSelect"></select></label>
        <label>Device<select name="deviceId" id="taskDeviceSelect"></select></label>
        <label>Related Alert<select name="alertId" id="taskAlertSelect"></select></label>
        <label>Task Type<select name="type" id="taskTypeSelect"><option>Remote Check</option><option>Field Inspection</option><option>Data Check</option><option>Work Order</option></select></label>
        <label>Priority<select name="priority" id="taskPrioritySelect">${taskPriorities.map(p => `<option>${p}</option>`).join('')}</select></label>
        <label class="full">Task Title<input name="title" id="taskTitleInput" required value="${titleForContext(firstPlant, firstDevice, firstAlert)}"></label>
        <label>Team<select name="team" id="taskTeamSelect">${taskTeams.map(x => `<option>${x}</option>`).join('')}</select></label>
        <label>Assignee<select name="assignee">${taskAssignees.map(x => `<option>${x}</option>`).join('')}</select></label>
        <label>Due Date<select name="due"><option>Today · 12:00</option><option>Today · 14:30</option><option>Tomorrow · 10:00</option><option>Jun 06 · 09:00</option><option>This week</option></select></label>
        <div class="timeline-mini full" id="taskContextPreview"><strong>Auto-filled context</strong><p>Select client, plant, device and alert to generate a clean task context.</p></div>
        <label class="full">Notes<textarea name="description" id="taskDescriptionInput" rows="4" placeholder="Optional note for the assigned team. Zentrid already links the selected context."></textarea></label>
      </div>
      <div class="modal-actions"><button type="button" onclick="closeTaskModal()">Cancel</button><button type="submit" class="primary-action">Create Task</button></div>
    </form>
  </div></div>`;
}

function renderTasksPage(): string {
  return `<section class="page-hero">
    <div><p class="eyebrow">Global Admin · Workflow</p><h1>Tasks & Work Orders</h1><p class="muted">Convert alerts into assigned operational work with owners, SLA, evidence and resolution status.</p></div>
    <button class="freshness-card" onclick="ZentridLayout.toast('Task queue refreshed')"><span class="pulse"></span><div><strong>Queue live</strong><small>${allTasks().length} records · updated now</small></div></button>
  </section>
  <section class="context-bar glass-card">
    <div><span>Workflow scope</span><strong>Alerts → Tasks → Work Orders</strong></div>
    <div><span>Default owner</span><strong>Operations Team</strong></div>
    <div><span>SLA policy</span><strong>P1 / P2 priority</strong></div>
    <div><span>Evidence</span><strong>Required on close</strong></div>
  </section>
  <div id="taskKpis">${taskKpis()}</div>
  <section class="panel glass-card">
    <div class="panel-head"><div><h2>Task Queue</h2><p>Tasks created from alerts, service requests or manual operations.</p></div><button class="primary-action" onclick="openTaskModal()">+ Create Task</button></div>
    <div class="filter-bar">
      <input id="taskSearch" placeholder="Search task, plant, device, assignee..." />
      <select id="taskStatusFilter"><option>All</option>${taskStatuses.map(s => `<option>${s}</option>`).join('')}</select>
      <select id="taskPriorityFilter"><option>All</option>${taskPriorities.map(p => `<option>${p}</option>`).join('')}</select>
      <button class="secondary-action" onclick="resetTaskDemo()">Reset demo data</button>
    </div>
    <div class="data-table tasks-table">
      <div class="data-head task-head"><span>Task</span><span>Context</span><span>Priority / Due</span><span>Status / Owner</span><span>Actions</span></div>
      <div id="taskRows">${renderTaskRows()}</div>
    </div>
  </section>${renderCreateTaskModal()}`;
}
function wireTasksPage() {
  ['taskSearch','taskStatusFilter','taskPriorityFilter'].forEach(id => document.getElementById(id)?.addEventListener('input', refreshTasksPage));
  wireTaskCreateContext();
  document.getElementById('taskCreateForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = taskFormValues(e.currentTarget as HTMLFormElement);
    const plant = contextPlant(data.client, data.plantId);
    const device = contextDevice(data.client, data.plantId, data.deviceId);
    const alert = contextAlert(data.client, data.plantId, data.alertId);
    const title = data.title || titleForContext(plant, device, alert);
    const task = normalizeTask({
      id: newTaskId(data.type), type: data.type, title, status: data.assignee && data.assignee !== 'Unassigned' ? 'Assigned' : 'New', priority: data.priority,
      assignee: data.assignee || 'Unassigned', team: data.team || 'Operations', due: data.due || 'Tomorrow · 10:00', sla: data.priority === 'P1' ? 'Escalated' : 'Pending',
      client: data.client || '—', plantId: plant.id, plant: plant.name, deviceId: device.id, device: device.name, alertId: alert?.id || '—', source: alert ? 'Alert' : 'Manual', created: 'Just now', updated: 'Just now',
      description: data.description || alert?.description || `Work item created for ${device.name} at ${plant.name}.`,
      evidence: alert ? [`Alert ${alert.id} linked`, `${alert.severity} severity context attached`] : [],
      checklist: alert ? ['Review alert details', 'Check latest telemetry', 'Assign owner', 'Add resolution evidence', 'Close task'] : ['Review context', 'Assign owner', 'Execute work', 'Add evidence', 'Close task'],
      notes: [`Created from ${alert ? 'selected alert context' : 'manual context selection'}.`]
    });
    saveTask(task); window.ZentridFormReadiness?.markCommitted(e.currentTarget as HTMLFormElement); closeTaskModal(); refreshTasksPage(); ZentridLayout.toast(`${task.id} created`);
  });
}
function populateTaskContextSelects() {
  const clientEl = document.getElementById('taskClientSelect');
  const plantEl = document.getElementById('taskPlantSelect');
  const deviceEl = document.getElementById('taskDeviceSelect');
  const alertEl = document.getElementById('taskAlertSelect');
  if (!clientEl || !plantEl || !deviceEl || !alertEl) return;
  const client = clientEl.value || taskFirst(taskContextCatalog, 'client').client;
  const clientCtx = contextForClient(client);
  const selectedPlant = plantEl.value;
  plantEl.innerHTML = clientCtx.plants.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  if (selectedPlant && clientCtx.plants.some(p => p.id === selectedPlant)) plantEl.value = selectedPlant;
  const plant = contextPlant(client, plantEl.value);
  const selectedDevice = deviceEl.value;
  deviceEl.innerHTML = plant.devices.map(d => `<option value="${d.id}">${d.name} · ${d.type}</option>`).join('');
  if (selectedDevice && plant.devices.some(d => d.id === selectedDevice)) deviceEl.value = selectedDevice;
  const selectedAlert = alertEl.value;
  alertEl.innerHTML = `<option value="">No alert / manual task</option>` + plant.alerts.map(a => `<option value="${a.id}">${a.id} · ${a.title}</option>`).join('');
  if (selectedAlert && plant.alerts.some(a => a.id === selectedAlert)) alertEl.value = selectedAlert;
  updateTaskContextPreview();
}
function updateTaskContextPreview() {
  const client = document.getElementById('taskClientSelect')?.value || taskFirst(taskContextCatalog, 'client').client;
  const plantId = document.getElementById('taskPlantSelect')?.value;
  const deviceId = document.getElementById('taskDeviceSelect')?.value;
  const alertId = document.getElementById('taskAlertSelect')?.value;
  const plant = contextPlant(client, plantId);
  const device = contextDevice(client, plantId, deviceId);
  const alert = contextAlert(client, plantId, alertId);
  const priorityEl = document.getElementById('taskPrioritySelect');
  const typeEl = document.getElementById('taskTypeSelect');
  const titleEl = document.getElementById('taskTitleInput');
  const descEl = document.getElementById('taskDescriptionInput');
  if (alert) {
    if (priorityEl) priorityEl.value = alert.priority || 'P3';
    if (typeEl) typeEl.value = taskTypeForAlert(alert);
    if (titleEl && (!titleEl.dataset.edited || titleEl.dataset.autofill === 'true')) { titleEl.value = titleForContext(plant, device, alert); titleEl.dataset.autofill = 'true'; }
    if (descEl && !descEl.value) descEl.placeholder = alert.description;
  } else {
    if (titleEl && (!titleEl.dataset.edited || titleEl.dataset.autofill === 'true')) { titleEl.value = titleForContext(plant, device, null); titleEl.dataset.autofill = 'true'; }
  }
  const preview = document.getElementById('taskContextPreview');
  if (preview) preview.innerHTML = `<strong>Auto-filled context</strong><p><b>${client}</b> → ${plant.name} → ${device.name}${alert ? ` → ${alert.id} (${alert.severity})` : ' → manual task'}</p><small>Zentrid will save client, plant ID, device ID and related alert automatically.</small>`;
}
function wireTaskCreateContext() {
  populateTaskContextSelects();
  document.getElementById('taskClientSelect')?.addEventListener('change', populateTaskContextSelects);
  document.getElementById('taskPlantSelect')?.addEventListener('change', populateTaskContextSelects);
  document.getElementById('taskDeviceSelect')?.addEventListener('change', updateTaskContextPreview);
  document.getElementById('taskAlertSelect')?.addEventListener('change', updateTaskContextPreview);
  document.getElementById('taskTitleInput')?.addEventListener('input', e => {
    const input = e.currentTarget as HTMLElement | null;
    if (!input) return;
    input.dataset.edited = 'true';
    input.dataset.autofill = 'false';
  });
}
function openTaskModal() { document.getElementById('taskModal')?.classList.add('open'); }
function closeTaskModal() { document.getElementById('taskModal')?.classList.remove('open'); }
function resetTaskDemo() { localStorage.removeItem(taskStoreKey); refreshTasksPage(); ZentridLayout.toast('Task demo data reset'); }

function assignTaskModalMarkup(t: ZentridTaskRecord): string {
  return `<div class="modal open" id="assignTaskModal"><div class="modal-card compact-modal"><button class="modal-close" type="button" onclick="closeAssignTaskModal()">x</button>
    <h2>Assign Task</h2><p class="muted">Choose who owns this work item and when it should be completed.</p>
    <div class="timeline-mini"><strong>${t.id}</strong><p>${t.title}</p><small>${t.client} · ${t.plant} · ${t.device}</small></div>
    <form id="assignTaskForm" class="workflow-form" data-zentrid-form-readiness="local" data-zentrid-form-contract="TaskAssignmentDraft" data-zentrid-form-method="POST" data-zentrid-form-api-note="Task assignment remains local until a backend mutation contract is confirmed.">
      <div class="form-grid">
        <label>Assignee<select name="assignee" required>${taskAssignees.filter(x => x !== 'Unassigned').map(x => `<option ${x === t.assignee ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label>Team<select name="team">${taskTeams.map(x => `<option ${x === t.team ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label>Priority<select name="priority">${taskPriorities.map(x => `<option ${x === t.priority ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label>Due Date<select name="due"><option ${t.due === 'Today · 12:00' ? 'selected' : ''}>Today · 12:00</option><option ${t.due === 'Today · 14:30' ? 'selected' : ''}>Today · 14:30</option><option ${t.due === 'Tomorrow · 10:00' ? 'selected' : ''}>Tomorrow · 10:00</option><option ${t.due === 'Jun 06 · 09:00' ? 'selected' : ''}>Jun 06 · 09:00</option><option ${t.due === 'This week' ? 'selected' : ''}>This week</option></select></label>
        <label class="full">Assignment Note<textarea name="note" rows="3" placeholder="Optional note for the assignee..."></textarea></label>
      </div>
      <div class="modal-actions"><button type="button" onclick="closeAssignTaskModal()">Cancel</button><button type="submit" class="primary-action">Assign Task</button></div>
    </form>
  </div></div>`;
}
function closeAssignTaskModal() { document.getElementById('assignTaskModal')?.remove(); }
function quickAssignTask(id: string) {
  const t = allTasks().find(x => x.id === id); if (!t) return;
  closeAssignTaskModal();
  document.body.insertAdjacentHTML('beforeend', assignTaskModalMarkup(t));
  document.getElementById('assignTaskForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = taskFormValues(e.currentTarget as HTMLFormElement);
    const notes = [...(t.notes || []), `Assigned to ${data.assignee}.`];
    if (data.note?.trim()) notes.push(data.note.trim());
    const updated = saveTask({
      ...t,
      assignee: data.assignee,
      team: data.team,
      priority: data.priority,
      due: data.due,
      status: t.status === 'New' ? 'Assigned' : t.status,
      notes
    });
    window.ZentridFormReadiness?.markCommitted(e.currentTarget as HTMLFormElement);
    closeAssignTaskModal();
    ZentridLayout.toast(`${id} assigned to ${updated.assignee}`);
    if (location.pathname.endsWith('task-detail.html')) rerenderTaskDetail(id); else refreshTasksPage();
  });
}
function quickAdvanceTask(id: string) {
  const t = allTasks().find(x => x.id === id); if (!t) return;
  const flow = ['New', 'Assigned', 'In Progress', 'Completed', 'Closed'];
  const next = flow[Math.min(flow.indexOf(t.status) + 1, flow.length - 1)] || 'Assigned';
  saveTask({ ...t, status: next, notes: [...(t.notes || []), `Status changed to ${next}.`] });
  refreshTasksPage(); ZentridLayout.toast(`${id} → ${next}`);
}

function taskDetailTab(t: ZentridTaskRecord, tab: string): string {
  if (tab === 'summary') return `<div class="split-grid">
    <div class="panel-lite"><h3>Work Summary</h3><div class="info-grid">
      <div><span>Status</span><strong>${t.status}</strong></div><div><span>Priority</span><strong>${t.priority}</strong></div>
      <div><span>Assignee</span><strong>${t.assignee}</strong></div><div><span>Due</span><strong>${t.due}</strong></div>
      <div><span>Client</span><strong>${t.client}</strong></div><div><span>Source alert</span><strong>${t.alertId}</strong></div>
    </div><div class="detail-button-row"><button class="secondary-action" onclick="quickAssignTask('${t.id}')">Assign</button><button class="primary-action" onclick="setTaskStatus('${t.id}','In Progress')">Start Work</button></div></div>
    <div class="panel-lite"><h3>Description</h3><div class="timeline-mini"><p>${t.description}</p></div><h3 style="margin-top:16px">Activity Notes</h3>${(t.notes || []).map(n => `<div class="timeline-mini"><p>${n}</p></div>`).join('') || '<div class="empty-card">No notes yet.</div>'}<div class="inline-add"><input id="taskNoteInput" placeholder="Add operational note..."/><button onclick="addTaskNote('${t.id}')">Add Note</button></div></div>
  </div>`;
  if (tab === 'context') return `<div class="split-grid"><div class="panel-lite"><h3>Related Objects</h3><div class="info-grid">
    <div><span>Plant</span><strong>${t.plant}</strong></div><div><span>Plant ID</span><strong>${t.plantId}</strong></div>
    <div><span>Device</span><strong>${t.device}</strong></div><div><span>Device ID</span><strong>${t.deviceId}</strong></div>
  </div><div class="detail-button-row"><button id="openTaskPlant" class="secondary-action">Open Plant</button><button id="openTaskDevice" class="secondary-action">Open Device</button><button id="openTaskAlert" class="primary-action">Open Alert</button></div></div>
  <div class="panel-lite"><h3>Evidence</h3>${(t.evidence || []).map(e => `<div class="timeline-mini"><p>${e}</p></div>`).join('') || '<div class="empty-card">No evidence uploaded yet.</div>'}<div class="inline-add"><input id="taskEvidenceInput" placeholder="Evidence note or file reference..."/><button onclick="addTaskEvidence('${t.id}')">Add Evidence</button></div></div></div>`;
  if (tab === 'checklist') return `<div class="panel-lite"><h3>Execution Checklist</h3><div class="check-list task-check-list-v86">${(t.checklist || []).map((c, i) => `<label class="check-row ${c.done ? 'success checked' : 'warning'}"><span class="check-indicator ${c.done ? 'success' : 'warning'}">${c.done ? '✓' : '•'}</span><div><strong>${i + 1}. ${c.text}</strong><small>${c.done ? 'Completed' : 'Required before close'}</small></div><span class="check-status ${c.done ? 'success' : 'warning'}">${c.done ? 'Done' : 'Pending'}</span><button onclick="toggleChecklist('${t.id}', ${i})">${c.done ? 'Reopen' : 'Mark Done'}</button></label>`).join('')}</div><div class="inline-add"><input id="taskChecklistInput" placeholder="Add checklist step..."/><button onclick="addChecklistStep('${t.id}')">Add Step</button></div></div>`;
  return `<div class="split-grid"><div class="panel-lite"><h3>Workflow Actions</h3><div class="vertical-actions"><button onclick="quickAssignTask('${t.id}')">Assign Owner</button><button onclick="setTaskStatus('${t.id}','In Progress')">Start Work</button><button onclick="setTaskStatus('${t.id}','Completed')">Complete Work</button><button onclick="setTaskStatus('${t.id}','Closed')">Close Task</button><button onclick="setTaskStatus('${t.id}','Scheduled')">Schedule Visit</button><button class="danger-action" onclick="escalateTask('${t.id}')">Escalate</button></div></div><div class="panel-lite"><h3>Status Rules</h3><div class="timeline-mini"><p><strong>New</strong> → Assigned → In Progress → Completed → Closed.</p><p>Closing should include evidence and a resolution note. For the prototype this is stored in localStorage.</p></div></div></div>`;
}
function renderTaskDetail(t: ZentridTaskRecord): string {
  return `<section class="page-hero"><div><p class="eyebrow">Workflow · Task Detail</p><h1>${t.id}</h1><p class="muted">${t.title}</p></div><div class="hero-actions"><button class="secondary-action" onclick="location.href='tasks-work-orders.html'">Back to Queue</button><button class="primary-action" onclick="setTaskStatus('${t.id}','In Progress')">Start Work</button></div></section>
  <section class="context-bar glass-card"><div><span>Status</span><strong>${t.status}</strong></div><div><span>Priority</span><strong>${t.priority}</strong></div><div><span>Assignee</span><strong>${t.assignee}</strong></div><div><span>SLA</span><strong>${t.sla}</strong></div></section>
  <section class="panel glass-card"><div class="detail-tabs"><button class="active" data-tab="summary">Summary</button><button data-tab="context">Context & Evidence</button><button data-tab="checklist">Checklist</button><button data-tab="actions">Actions</button></div><div id="taskDetailContent">${taskDetailTab(t, 'summary')}</div></section>`;
}
function wireTaskDetail() {
  let t = selectedTask();
  document.querySelectorAll('.detail-tabs button').forEach(btn => btn.onclick = () => {
    document.querySelectorAll('.detail-tabs button').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    t = selectedTask();
    const content = document.getElementById('taskDetailContent');
    if (content) content.innerHTML = taskDetailTab(t, btn.dataset.tab || 'summary');
    bindTaskDetailActions(t);
  });
  bindTaskDetailActions(t);
}
function bindTaskDetailActions(t: ZentridTaskRecord) {
  document.getElementById('openTaskPlant')?.addEventListener('click', () => { localStorage.setItem('zentrid_selected_plant', t.plantId); location.href = 'plant-detail.html'; });
  document.getElementById('openTaskDevice')?.addEventListener('click', () => { localStorage.setItem('zentrid_selected_device', t.deviceId); location.href = 'device-detail.html'; });
  document.getElementById('openTaskAlert')?.addEventListener('click', () => { localStorage.setItem('zentrid_selected_alert', t.alertId); location.href = `alert-detail.html?id=${encodeURIComponent(t.alertId)}`; });
}
function rerenderTaskDetail(id: string) {
  const t = allTasks().find(x => x.id === id) || selectedTask();
  ZentridLayout.mount(renderTaskDetail(t));
  wireTaskDetail();
}
function setTaskStatus(id: string, status: string) {
  const t = allTasks().find(x => x.id === id); if (!t) return;
  const note = `Status changed to ${status}.`;
  saveTask({ ...t, status, notes: [...(t.notes || []), note] });
  ZentridLayout.toast(`${id} → ${status}`);
  if (location.pathname.endsWith('task-detail.html')) rerenderTaskDetail(id); else refreshTasksPage();
}
function escalateTask(id: string) {
  const t = allTasks().find(x => x.id === id); if (!t) return;
  saveTask({ ...t, priority: 'P1', sla: 'Escalated', notes: [...(t.notes || []), 'Task escalated to P1.'] });
  ZentridLayout.toast(`${id} escalated`);
  if (location.pathname.endsWith('task-detail.html')) rerenderTaskDetail(id); else refreshTasksPage();
}
function addTaskNote(id: string) {
  const input = document.getElementById('taskNoteInput') as HTMLInputElement | null;
  const value = input?.value.trim(); if (!value) return;
  const t = allTasks().find(x => x.id === id); if (!t) return;
  saveTask({ ...t, notes: [...(t.notes || []), value] });
  rerenderTaskDetail(id);
}
function addTaskEvidence(id: string) {
  const input = document.getElementById('taskEvidenceInput') as HTMLInputElement | null;
  const value = input?.value.trim(); if (!value) return;
  const t = allTasks().find(x => x.id === id); if (!t) return;
  saveTask({ ...t, evidence: [...(t.evidence || []), value], notes: [...(t.notes || []), 'Evidence added.'] });
  rerenderTaskDetail(id);
}
function toggleChecklist(id: string, index: number) {
  const t = allTasks().find(x => x.id === id); if (!t) return;
  const checklist = normalizeChecklist(t.checklist);
  const item = checklist[index];
  if (!item) return;
  checklist[index] = { ...item, done: !item.done };
  saveTask({ ...t, checklist, notes: [...(t.notes || []), `Checklist step ${index + 1} updated.`] });
  rerenderTaskDetail(id);
}
function addChecklistStep(id: string) {
  const input = document.getElementById('taskChecklistInput') as HTMLInputElement | null;
  const value = input?.value.trim(); if (!value) return;
  const t = allTasks().find(x => x.id === id); if (!t) return;
  saveTask({ ...t, checklist: [...normalizeChecklist(t.checklist), { text: value, done: false }] });
  rerenderTaskDetail(id);
}

if (location.pathname.endsWith('task-detail.html')) {
  ZentridLayout.mount(renderTaskDetail(selectedTask()));
  wireTaskDetail();
} else if (location.pathname.endsWith('tasks-work-orders.html')) {
  ZentridLayout.mount(renderTasksPage());
  wireTasksPage();
}
