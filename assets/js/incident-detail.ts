(() => {
  type IncidentDetailTab = 'overview' | 'timeline' | 'routing' | 'bitrix' | 'assets' | 'alerts' | 'resolution' | 'audit';
  type BadgeTone = 'danger' | 'warning' | 'success';

  interface IncidentDetailState {
    tab: IncidentDetailTab;
  }

  interface IncidentDetailRecord {
    id: string;
    alertId: string;
    title: string;
    type: string;
    category: string;
    severity: string;
    priority: string;
    tenant: string;
    client: string;
    plant: string;
    asset: string;
    device: string;
    source: string;
    created: string;
    route: string;
    bitrix: string;
    bitrixType: string;
    stage: string;
    status: string;
    sla: string;
    owner: string;
    sop: string;
    next: string;
    clientNotify: string;
    sync: string;
    desc: string;
    rootCause: string;
    resolution: string;
    evidence: string;
  }

  interface TimelineItem {
    time: string;
    title: string;
    text: string;
  }

  type AuditRow = [actor: string, action: string, time: string];

  type IncidentDetailDatasetElement = HTMLElement & {
    dataset: DOMStringMap & {
      detailTab?: IncidentDetailTab;
      detailToast?: string;
    };
  };

  const asDetailTarget = (target: EventTarget | null): IncidentDetailDatasetElement | null =>
    target instanceof HTMLElement ? target as IncidentDetailDatasetElement : null;
  const params = new URLSearchParams(window.location.search);
  const incidentId = params.get('id') || 'INC-3104';
  const state: IncidentDetailState = { tab: 'overview' };

  const incidents: IncidentDetailRecord[] = [
    {
      id: 'INC-3101', alertId: 'ALT-9017', title: 'Inverter INV-22 offline', type: 'Device fault', category: 'Remote technical action', severity: 'Critical', priority: 'P1', tenant: 'Arpi Solar Group', client: 'Green Market LLC', plant: 'Lyon PV Park', asset: 'INV-22 · Huawei SUN2000', device: 'INV-22', source: 'Huawei FusionSolar', created: 'Today · 10:18', route: 'Technical Team', bitrix: 'BX-TASK-8841', bitrixType: 'Task', stage: 'Remote diagnostics', status: 'In Progress', sla: '42 min left', owner: 'Technical Support L2', sop: 'Device Offline Recovery', next: 'Run connectivity check and restart gateway if supported', clientNotify: 'Client notified · support will follow up if remote recovery fails', sync: 'Synced 2 min ago', desc: 'Critical device alert routed to technical team because the device can potentially be recovered remotely from Zentrid or vendor API.', rootCause: 'Device stopped reporting through logger channel.', resolution: 'Pending remote diagnostics result.', evidence: 'Command result, telemetry recovery, engineer comment'
    },
    {
      id: 'INC-3102', alertId: 'ALT-9024', title: 'Cloudy weather production drop', type: 'Information', category: 'Client notification only', severity: 'Info', priority: 'P4', tenant: 'Arpi Solar Group', client: 'Solar Home Owner', plant: 'Berlin Solar 1', asset: 'Plant production', device: 'Plant level', source: 'Weather + Production Analytics', created: 'Today · 09:44', route: 'Client Notification', bitrix: 'BX-NOTIF-2219', bitrixType: 'Notification', stage: 'Client notified', status: 'No Action Required', sla: 'No SLA', owner: 'System', sop: 'Informational Production Notice', next: 'No specialist action required', clientNotify: 'Client received informational message explaining weather impact', sync: 'Synced 4 min ago', desc: 'Informational alert is visible for governance and client transparency, but it does not create a support or field task.', rootCause: 'Weather condition lowered expected production.', resolution: 'Client notification delivered.', evidence: 'Notification delivery status'
    },
    {
      id: 'INC-3103', alertId: 'ALT-9031', title: 'GoodWe API authentication failed', type: 'Vendor API failure', category: 'Integration support', severity: 'High', priority: 'P2', tenant: 'North Region Ops', client: 'Portfolio Client A', plant: 'Multiple plants', asset: 'GoodWe Connector EU', device: 'Connector', source: 'GoodWe SEMS API', created: 'Today · 08:57', route: 'Integration Support', bitrix: 'BX-TICKET-7785', bitrixType: 'Ticket', stage: 'Waiting vendor credentials', status: 'Assigned', sla: '2h 15m left', owner: 'Integration Support', sop: 'Vendor Connector Recovery', next: 'Check token expiry and request credential confirmation', clientNotify: 'Affected tenants receive data delay notice', sync: 'Synced 1 min ago', desc: 'Vendor-side API issue is routed to integration support and synchronized with Bitrix ticket status.', rootCause: 'Vendor API auth rejected token refresh.', resolution: 'Waiting for credential confirmation.', evidence: 'Connector logs, retry trace, API response code'
    },
    {
      id: 'INC-3104', alertId: 'ALT-9040', title: 'Grid meter inconsistent readings', type: 'Data quality / metering', category: 'Support case', severity: 'Medium', priority: 'P3', tenant: 'Tenant Delta Enterprise', client: 'Industrial Consumer LLC', plant: 'Madrid East', asset: 'Meter-04', device: 'Meter-04', source: 'Metering Layer', created: 'Yesterday · 17:10', route: 'Support L1 → Metering Specialist', bitrix: 'BX-TICKET-7762', bitrixType: 'Ticket', stage: 'Client contacted', status: 'Waiting Client', sla: '6h 20m left', owner: 'Support L1', sop: 'Metering Data Verification', next: 'Collect invoice period and meter photo from client', clientNotify: 'Support contacted client for confirmation', sync: 'Synced 7 min ago', desc: 'Support case requires communication with client before technical or billing correction can continue.', rootCause: 'Meter reading does not match expected accounting interval.', resolution: 'Waiting for client evidence before metering specialist review.', evidence: 'Client response, meter photo, corrected reading decision'
    },
    {
      id: 'INC-3105', alertId: 'ALT-9055', title: 'Plant communication lost for 45 minutes', type: 'Plant offline', category: 'Field visit required', severity: 'Critical', priority: 'P1', tenant: 'South Solar Operations', client: 'Agro Solar Farm', plant: 'Armavir BESS + PV', asset: 'Main gateway + router', device: 'Main gateway', source: 'Zentrid Connectivity Monitor', created: 'Yesterday · 14:26', route: 'Field Service', bitrix: 'BX-WO-3304', bitrixType: 'Work Order', stage: 'Visit scheduled', status: 'Escalated', sla: 'Breached · 18 min', owner: 'Field Team A', sop: 'Communication Loss Field Recovery', next: 'Engineer visit scheduled for today 16:00', clientNotify: 'Client informed about planned visit', sync: 'Synced 3 min ago', desc: 'Remote steps failed, so the case was escalated into a Bitrix work order for on-site specialist visit.', rootCause: 'Site gateway unavailable after remote checks.', resolution: 'Field visit scheduled.', evidence: 'Site visit report, photos, connectivity restored confirmation'
    }
  ];

  const selectedIncident = incidents.find(item => item.id === incidentId) || incidents[0];
  if (!selectedIncident) return;
  const incident: IncidentDetailRecord = selectedIncident;

  const tone = (value?: string): BadgeTone => {
    if (/Critical|Escalated|Breached|High|Failed|P1/.test(value || '')) return 'danger';
    if (/Medium|Assigned|Waiting|Visit|Progress|P2|P3/.test(value || '')) return 'warning';
    if (/Info|No Action|Client notified|Success|Synced|Closed|Resolved/.test(value || '')) return 'success';
    return 'warning';
  };

  const timeline: TimelineItem[] = [
    { time: incident.created, title: 'Alert normalized', text: `${incident.alertId} from ${incident.source}` },
    { time: '+1 min', title: 'Incident created', text: `${incident.id} classified as ${incident.category}` },
    { time: '+2 min', title: 'Routing rule applied', text: `Routed to ${incident.route}` },
    { time: '+3 min', title: 'Bitrix object created', text: `${incident.bitrixType} ${incident.bitrix}` },
    { time: 'Latest', title: incident.stage, text: incident.sync }
  ];

  const auditRows: AuditRow[] = [
    ['System', 'Created incident from normalized alert', incident.created],
    ['Routing Engine', `Assigned owner: ${incident.owner}`, '+2 min'],
    ['Bitrix Sync', `Linked ${incident.bitrix}`, '+3 min'],
    ['SLA Monitor', `Current SLA state: ${incident.sla}`, 'Latest']
  ];

  function pageHero() {
    return `<section class="page-hero incident-detail-hero">
      <div>
        <p class="eyebrow">Operations Center · Incident Detail</p>
        <h1>${incident.id}</h1>
        <p class="muted">${incident.title}</p>
        <div class="inline-badges">
          <span class="badge ${tone(incident.severity)}">${incident.severity}</span>
          <span class="badge ${tone(incident.status)}">${incident.status}</span>
          <span class="badge ${tone(incident.priority)}">${incident.priority}</span>
        </div>
      </div>
      <div class="incident-detail-actions">
        <button type="button" class="small-btn ghost" data-back-incidents>Back to Incidents</button>
        <button type="button" class="small-btn primary" data-detail-toast="Manual sync requested for ${incident.id}">Sync Bitrix</button>
      </div>
    </section>`;
  }

  function kpis() {
    const cards = [
      ['Current Owner', incident.owner, incident.route],
      ['Bitrix Object', incident.bitrix, incident.bitrixType],
      ['SLA', incident.sla, incident.stage],
      ['SOP', incident.sop, 'Bound response template']
    ];
    return `<section class="module-grid incident-detail-kpis">${cards.map(([l,v,n]) => `<article class="module-card"><span>${l}</span><strong>${v}</strong><small>${n}</small></article>`).join('')}</section>`;
  }

  function tabs() {
    const items = [
      ['overview', 'Overview'],
      ['timeline', 'Timeline'],
      ['routing', 'Routing'],
      ['bitrix', 'Bitrix'],
      ['assets', 'Assets'],
      ['alerts', 'Related Alerts'],
      ['resolution', 'Resolution'],
      ['audit', 'Audit']
    ];
    return `<aside class="glass-card production-side-card-v92 incident-side-card incident-detail-side"><h3>Incident Detail</h3>${items.map(([key,label]) => `<button type="button" class="${state.tab === key ? 'active' : ''}" data-detail-tab="${key}">${label}</button>`).join('')}</aside>`;
  }

  function overview() {
    return `<section class="panel glass-card incident-detail-panel">
      <div class="panel-head"><div><h2>Overview</h2><p>High-level operational state, routing result and next action.</p></div></div>
      <div class="info-grid incident-detail-info-grid">
        <div><span>Tenant</span><strong>${incident.tenant}</strong></div>
        <div><span>Client</span><strong>${incident.client}</strong></div>
        <div><span>Plant</span><strong>${incident.plant}</strong></div>
        <div><span>Source</span><strong>${incident.source}</strong></div>
        <div><span>Classification</span><strong>${incident.type}<br>${incident.category}</strong></div>
        <div><span>Client visibility</span><strong>${incident.clientNotify}</strong></div>
      </div>
      <article class="incident-detail-callout"><h3>Next action</h3><p>${incident.next}</p></article>
      <article class="incident-detail-callout"><h3>Operational description</h3><p>${incident.desc}</p></article>
    </section>`;
  }

  function timelineView() {
    return `<section class="panel glass-card incident-detail-panel"><div class="panel-head"><div><h2>Timeline</h2><p>Zentrid and Bitrix history for this incident.</p></div></div><div class="incident-detail-timeline">${timeline.map(item => `<div><span>${item.time}</span><strong>${item.title}</strong><small>${item.text}</small></div>`).join('')}</div></section>`;
  }

  function routingView() {
    return `<section class="panel glass-card incident-detail-panel"><div class="panel-head"><div><h2>Routing History</h2><p>How the incident moved between system, support, technical staff and field service.</p></div></div><div class="incident-routing-chain">
      <div><span>01</span><strong>Classification</strong><small>${incident.category}</small></div>
      <div><span>02</span><strong>Owner route</strong><small>${incident.route}</small></div>
      <div><span>03</span><strong>Current owner</strong><small>${incident.owner}</small></div>
      <div><span>04</span><strong>Current stage</strong><small>${incident.stage}</small></div>
    </div></section>`;
  }

  function bitrixView() {
    return `<section class="panel glass-card incident-detail-panel"><div class="panel-head"><div><h2>Bitrix Sync</h2><p>Read-only mirror of the Bitrix task, ticket, notification or work order.</p></div><button class="small-btn primary" data-detail-toast="External Bitrix link would open in production">Open Bitrix</button></div><div class="info-grid incident-detail-info-grid">
      <div><span>Object ID</span><strong>${incident.bitrix}</strong></div>
      <div><span>Object type</span><strong>${incident.bitrixType}</strong></div>
      <div><span>Assignee</span><strong>${incident.owner}</strong></div>
      <div><span>Stage</span><strong>${incident.stage}</strong></div>
      <div><span>Sync state</span><strong>${incident.sync}</strong></div>
      <div><span>Returned fields</span><strong>Status, assignee, SLA, comments, evidence links</strong></div>
    </div></section>`;
  }

  function assetsView() {
    return `<section class="panel glass-card incident-detail-panel"><div class="panel-head"><div><h2>Related Objects</h2><p>Entities affected by the incident.</p></div></div><div class="info-grid incident-detail-info-grid">
      <div><span>Plant</span><strong>${incident.plant}</strong></div>
      <div><span>Asset / Device</span><strong>${incident.asset}</strong></div>
      <div><span>Device reference</span><strong>${incident.device}</strong></div>
      <div><span>Source system</span><strong>${incident.source}</strong></div>
      <div><span>Tenant</span><strong>${incident.tenant}</strong></div>
      <div><span>Client</span><strong>${incident.client}</strong></div>
    </div></section>`;
  }

  function relatedAlertsView() {
    return `<section class="panel glass-card incident-detail-panel"><div class="panel-head"><div><h2>Related Alerts</h2><p>Alerts that created or were grouped into this incident.</p></div></div><div class="data-table compact-table incident-detail-table"><div class="data-head"><span>Alert</span><span>Source</span><span>Severity</span><span>State</span></div><div class="data-row"><div><strong>${incident.alertId}</strong><small>${incident.title}</small></div><div><strong>${incident.source}</strong><small>${incident.asset}</small></div><div><span class="badge ${tone(incident.severity)}">${incident.severity}</span></div><div><span class="badge ${tone(incident.status)}">${incident.status}</span></div></div></div></section>`;
  }

  function resolutionView() {
    return `<section class="panel glass-card incident-detail-panel"><div class="panel-head"><div><h2>Resolution</h2><p>Root cause, current resolution state and evidence requirements.</p></div></div><div class="info-stack">
      <div class="info-card"><span>Root cause</span><strong>${incident.rootCause}</strong><small>May be updated from Bitrix or technical specialist comment.</small></div>
      <div class="info-card"><span>Resolution</span><strong>${incident.resolution}</strong><small>Final result will be synchronized back after closure.</small></div>
      <div class="info-card"><span>Evidence</span><strong>${incident.evidence}</strong><small>Required to close the operational process.</small></div>
    </div></section>`;
  }

  function auditView() {
    return `<section class="panel glass-card incident-detail-panel"><div class="panel-head"><div><h2>Audit</h2><p>Non-repudiable history of incident lifecycle and sync events.</p></div></div><div class="data-table compact-table incident-detail-table"><div class="data-head"><span>Actor</span><span>Action</span><span>Time</span></div>${auditRows.map(([actor,action,time]) => `<div class="data-row"><div><strong>${actor}</strong></div><div><small>${action}</small></div><div><small>${time}</small></div></div>`).join('')}</div></section>`;
  }

  function body() {
    if (state.tab === 'timeline') return timelineView();
    if (state.tab === 'routing') return routingView();
    if (state.tab === 'bitrix') return bitrixView();
    if (state.tab === 'assets') return assetsView();
    if (state.tab === 'alerts') return relatedAlertsView();
    if (state.tab === 'resolution') return resolutionView();
    if (state.tab === 'audit') return auditView();
    return overview();
  }

  function render() {
    FleetLayout.mount(`${pageHero()}${kpis()}<section class="production-workspace-v92 incident-workspace-v92 incident-detail-workspace">${tabs()}<div class="incident-main-card-v92">${body()}</div></section>`);
    bind();
  }

  function bind() {
    const main = document.querySelector('.main-content');
    if (!main || main.dataset.incidentDetailBound === '1') return;
    main.dataset.incidentDetailBound = '1';
    main.addEventListener('click', (e: Event) => {
      const target = asDetailTarget(e.target);
      if (!target) return;
      const tab = target.closest('[data-detail-tab]') as IncidentDetailDatasetElement | null;
      if (tab) { state.tab = tab.dataset.detailTab; render(); return; }
      if (target.closest('[data-back-incidents]')) { window.location.href = 'incident-center.html'; return; }
      const toast = target.closest('[data-detail-toast]') as IncidentDetailDatasetElement | null;
      if (toast) FleetLayout.toast(toast.dataset.detailToast);
    });
  }

  render();
})();
