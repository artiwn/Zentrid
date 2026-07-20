type V51Tone = "danger" | "warning" | "success";

type V51KpiItem = {
  label: string;
  value: string;
  note: string;
};

type V51DrawerItem = Record<string, string | number | boolean | null | undefined> & {
  title?: string;
  action?: string;
  severity?: string;
  priority?: string;
  result?: string;
  status?: string;
  entity?: string;
  desc?: string;
};

type V51IncidentCase = {
  id: string;
  title: string;
  status: string;
  severity: string;
  tenant: string;
  plant: string;
  source: string;
  owner: string;
  sla: string;
  next: string;
  desc: string;
};

type V51Ticket = {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  tenant: string;
  linked: string;
  channel: string;
  assignee: string;
};

type V51WorkOrder = {
  id: string;
  title: string;
  status: string;
  priority: string;
  plant: string;
  assignee: string;
  due: string;
  source: string;
};

type V51AuditRecord = {
  time: string;
  actor: string;
  action: string;
  entity: string;
  scope: string;
  result: string;
};

type V51Command = {
  id: string;
  title: string;
  status: string;
  risk: string;
  scope: string;
  target: string;
  capability: string;
  requester: string;
  approval: string;
  result: string;
  desc: string;
};

type V51Invoice = {
  id: string;
  title: string;
  status: string;
  amount: string;
  tenant: string;
  period: string;
  due: string;
  source: string;
  desc: string;
};

type V51WorkspaceApi = {
  cases: V51IncidentCase[];
  tickets: V51Ticket[];
  orders: V51WorkOrder[];
  audit: V51AuditRecord[];
  commands: V51Command[];
  invoices: V51Invoice[];
  tone: (value: string) => V51Tone;
  hero: (eyebrow: string, title: string, desc: string, status?: string) => string;
  kpis: (items: V51KpiItem[]) => string;
  drawer: (title: string, item: V51DrawerItem, extra?: string) => void;
};

const V51: V51WorkspaceApi = (() => {
  const cases: V51IncidentCase[] = [
    { id:'INC-2401', title:'Plant Offline Case', status:'Triage', severity:'Critical', tenant:'Tenant Alpha Energy', plant:'Plant A', source:'ALT-2041', owner:'Operations Team', sla:'24m remaining', next:'Assign field task', desc:'Alert converted into operational case with SLA, owner, task and audit trail.' },
    { id:'INC-2402', title:'BESS Temperature Investigation', status:'Assigned', severity:'High', tenant:'Tenant North Operations', plant:'Armavir BESS', source:'ALT-2048', owner:'BESS Specialist', sla:'1h 42m remaining', next:'Remote diagnostics', desc:'Temperature warning grouped with device readings and SOP checklist.' },
    { id:'INC-2403', title:'Telemetry Delay Case', status:'In Progress', severity:'Medium', tenant:'Tenant Gamma Grid', plant:'Madrid East', source:'ALT-2050', owner:'Integration Team', sla:'3h 18m remaining', next:'Replay failed payload', desc:'Freshness delay linked to connector retries and mapping validation.' },
    { id:'INC-2404', title:'Inverter Fault Resolution', status:'Escalated', severity:'Critical', tenant:'Tenant Delta Enterprise', plant:'Lyon PV Park', source:'ALT-2062', owner:'Operations Manager', sla:'Escalated', next:'Approve work order', desc:'Critical fault escalated to management and field service queue.' }
  ];
  const tickets: V51Ticket[] = [
    { id:'TCK-1102', title:'Owner reports no generation', type:'Issue', priority:'P1', status:'New', tenant:'Tenant Alpha Energy', linked:'INC-2401', channel:'Portal', assignee:'Support L1' },
    { id:'TCK-1103', title:'Request monthly production package', type:'Request', priority:'P3', status:'In Review', tenant:'Tenant Gamma Grid', linked:'Report', channel:'Email', assignee:'Tenant Success' },
    { id:'TCK-1104', title:'Complaint: delayed response to alert', type:'Complaint', priority:'P2', status:'Assigned', tenant:'Tenant Delta Enterprise', linked:'INC-2404', channel:'Phone', assignee:'Service Manager' },
    { id:'TCK-1105', title:'Need access for new operator', type:'Access', priority:'P3', status:'Waiting Tenant', tenant:'Tenant North Operations', linked:'Users', channel:'Portal', assignee:'IAM Admin' }
  ];
  const orders: V51WorkOrder[] = [
    { id:'WO-901', title:'Field inspection for offline plant', status:'Scheduled', priority:'P1', plant:'Plant A', assignee:'Field Team A', due:'Today 15:00', source:'INC-2401' },
    { id:'WO-902', title:'BESS thermal check', status:'In Progress', priority:'P2', plant:'Armavir BESS', assignee:'BESS Specialist', due:'Today 18:00', source:'INC-2402' },
    { id:'WO-903', title:'Replace inverter fan module', status:'Pending Approval', priority:'P1', plant:'Lyon PV Park', assignee:'Service Partner', due:'Tomorrow 10:00', source:'INC-2404' },
    { id:'WO-904', title:'Validate gateway connectivity', status:'Done', priority:'P3', plant:'Madrid East', assignee:'Integration Team', due:'Completed', source:'INC-2403' }
  ];
  const audit: V51AuditRecord[] = [
    { time:'09:12:04', actor:'Global Admin', action:'Acknowledged alert ALT-2041', entity:'Alert', scope:'Tenant Alpha Energy', result:'Success' },
    { time:'09:14:27', actor:'Operations Lead', action:'Created incident INC-2401', entity:'Incident', scope:'Plant A', result:'Success' },
    { time:'09:18:43', actor:'System', action:'Retry connector job', entity:'Integration', scope:'Sungrow iSolarCloud', result:'Warning' },
    { time:'09:25:10', actor:'IAM Admin', action:'Updated role permissions', entity:'RBAC', scope:'Tenant Admin', result:'Success' },
    { time:'09:31:56', actor:'Data Mapper', action:'Changed vendor status mapping', entity:'Mapping', scope:'Huawei FusionSolar', result:'Success' }
  ];
  const tone = (value: string): V51Tone => /Critical|P1|Escalated|Failed|Warning/.test(value) ? 'danger' : /High|P2|Pending|Delayed|In Review|Assigned|Scheduled/.test(value) ? 'warning' : 'success';
  function hero(eyebrow: string, title: string, desc: string, status = 'Updated now'): string { return `<section class="page-hero"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="muted">${desc}</p></div><button class="freshness-card" onclick="FleetLayout.toast('${title} refreshed')"><span class="pulse"></span><div><strong>${status}</strong><small>v5.1 enterprise workspace</small></div></button></section>`; }
  function kpis(items: V51KpiItem[]): string { return `<section class="module-grid">${items.map(i=>`<article class="module-card"><span>${i.label}</span><strong>${i.value}</strong><small>${i.note}</small></article>`).join('')}</section>`; }
  function drawer(title: string, item: V51DrawerItem, extra = ''): void {
    let d = document.getElementById('detailDrawer') as HTMLElement | null;
    if (!d) {
      d = document.createElement('aside');
      d.id = 'detailDrawer';
      d.className = 'detail-drawer';
      document.body.appendChild(d);
    }
    const statusValue = String(item.severity || item.priority || item.result || item.status || 'Info');
    d.innerHTML = `<button class="drawer-close" type="button">x</button><p class="eyebrow">${title}</p><h2>${item.title || item.action || ''}</h2><div class="drawer-body"><div class="drawer-status-row"><span class="badge ${tone(statusValue)}">${statusValue}</span><span class="badge warning">${item.status || item.entity || ''}</span></div><p>${item.desc || 'Enterprise workflow object with traceability, ownership, SLA and audit context.'}</p><div class="drawer-metrics rich">${Object.entries(item).filter(([k])=>!['desc','title'].includes(k)).slice(0,8).map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div>${extra}<div class="timeline-mini"><strong>Audit Timeline</strong><p>Created by system normalization</p><p>Assigned owner and SLA policy</p><p>Latest user action captured in audit trail</p></div></div><div class="drawer-actions"><button class="primary-action" onclick="FleetLayout.toast('Action saved')">Save Action</button><button class="secondary-action drawer-close-2">Close</button></div>`;
    d.classList.add('open');
    d.querySelectorAll('.drawer-close,.drawer-close-2').forEach((button) => {
      (button as HTMLElement).onclick = () => d?.classList.remove('open');
    });
  }
  return { cases, tickets, orders, audit, commands: [] as V51Command[], invoices: [] as V51Invoice[], tone, hero, kpis, drawer };
})();


// v5.2 data extensions: command execution and commercial operations
V51.commands = [
  { id:'CMD-501', title:'Limit generation to 80%', status:'Pending Approval', risk:'High', scope:'Plant', target:'Plant A', capability:'Curtailment', requester:'Operations Lead', approval:'Global Admin', result:'Waiting approval', desc:'Capability-aware write action. Requires confirmation, approval, execution result and audit trail.' },
  { id:'CMD-502', title:'Restart gateway telemetry service', status:'Ready', risk:'Medium', scope:'Device', target:'GW-MAD-04', capability:'Remote restart', requester:'Integration Team', approval:'Not required', result:'Not executed', desc:'Safe remote command linked to connector lag and telemetry freshness incident.' },
  { id:'CMD-503', title:'Switch BESS to standby', status:'Executed', risk:'High', scope:'BESS', target:'Armavir BESS', capability:'Operating mode', requester:'BESS Specialist', approval:'Approved', result:'Success', desc:'BESS operating command captured with command log, source capability and operator comment.' },
  { id:'CMD-504', title:'Query inverter parameters', status:'Failed', risk:'Low', scope:'Device', target:'INV-LYON-22', capability:'Parameter read', requester:'Service Partner', approval:'Not required', result:'Vendor timeout', desc:'Read-only command failed at vendor API. Retry is available and trace is stored.' }
];
V51.invoices = [
  { id:'INV-2026-041', title:'Tenant Alpha Energy — O&M May invoice', status:'Issued', amount:'€42,800', tenant:'Tenant Alpha Energy', period:'May 2026', due:'12 Jun 2026', source:'Metering + SLA', desc:'Billing object connected to tariffs, service charges, energy accounting and payment status.' },
  { id:'INV-2026-042', title:'Tenant Gamma Grid — production settlement', status:'Payment Due', amount:'€31,450', tenant:'Tenant Gamma Grid', period:'May 2026', due:'08 Jun 2026', source:'Exported energy', desc:'Settlement invoice built from energy accounting records and tariff profile.' },
  { id:'INV-2026-043', title:'Tenant North Operations — subscription plan', status:'Paid', amount:'€18,900', tenant:'Tenant North Operations', period:'Jun 2026', due:'Paid', source:'Commercial contract', desc:'Recurring subscription tied to service plan, support tier and SLA package.' },
  { id:'INV-2026-044', title:'Tenant Delta Enterprise — corrective service', status:'Disputed', amount:'€7,200', tenant:'Tenant Delta Enterprise', period:'Incident INC-2404', due:'Under review', source:'Work Order WO-903', desc:'Service charge linked to incident, work order, evidence and tenant complaint.' }
];
