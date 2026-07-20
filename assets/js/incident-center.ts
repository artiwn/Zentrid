(() => {
  type IncidentTab = 'incidents' | 'routing' | 'bitrix' | 'analytics';
  type IncidentFilter = 'all' | 'critical' | 'info' | 'support' | 'remote' | 'field';
  type BadgeTone = 'danger' | 'warning' | 'success';

  interface IncidentState {
    tab: IncidentTab;
    filter: IncidentFilter;
    selected: string | null;
  }

  interface IncidentRecord {
    id: string;
    alertId: string;
    title: string;
    type: string;
    category: string;
    severity: string;
    tenant: string;
    client: string;
    plant: string;
    asset: string;
    source: string;
    created: string;
    route: string;
    bitrix: string;
    bitrixType: string;
    stage: string;
    status: string;
    sla: string;
    sop: string;
    next: string;
    clientNotify: string;
    actionPath: string;
    evidence: string;
    owner: string;
    sync: string;
    desc: string;
  }

  interface RouteRule {
    key: Exclude<IncidentFilter, 'all' | 'critical'>;
    name: string;
    rule: string;
    owner: string;
    creates: string;
    status: string;
    example: string;
  }

  interface SyncEvent {
    time: string;
    source: string;
    action: string;
    result: string;
  }

  type IncidentDatasetElement = HTMLElement & {
    dataset: DOMStringMap & {
      incidentTab?: IncidentTab;
      incidentFilter?: IncidentFilter;
      incidentId?: string;
      openIncident?: string;
      openRoutingRule?: RouteRule['key'];
      openBitrixObject?: string;
      openIncidentSop?: string;
      openIncidentTimeline?: string;
      syncIncident?: string;
      incidentToast?: string;
    };
  };

  const asIncidentTarget = (target: EventTarget | null): IncidentDatasetElement | null =>
    target instanceof HTMLElement ? target as IncidentDatasetElement : null;
  const state: IncidentState = { tab: 'incidents', filter: 'all', selected: null };

  const incidents: IncidentRecord[] = [
    {
      id: 'INC-3101',
      alertId: 'ALT-9017',
      title: 'Inverter INV-22 offline',
      type: 'Device fault',
      category: 'Remote technical action',
      severity: 'Critical',
      tenant: 'Arpi Solar Group',
      client: 'Green Market LLC',
      plant: 'Lyon PV Park',
      asset: 'INV-22 · Huawei SUN2000',
      source: 'Huawei FusionSolar',
      created: 'Today · 10:18',
      route: 'Technical Team',
      bitrix: 'BX-TASK-8841',
      bitrixType: 'Task',
      stage: 'Remote diagnostics',
      status: 'In Progress',
      sla: '42 min left',
      sop: 'Device Offline Recovery',
      next: 'Run connectivity check and restart gateway if supported',
      clientNotify: 'Client notified · support will follow up if remote recovery fails',
      actionPath: 'Alert → SOP → Bitrix task → Remote command → Result sync',
      evidence: 'Command result, telemetry recovery, engineer comment',
      owner: 'Technical Support L2',
      sync: 'Synced 2 min ago',
      desc: 'Critical device alert routed to technical team because the device can potentially be recovered remotely from Zentrid or vendor API.'
    },
    {
      id: 'INC-3102',
      alertId: 'ALT-9024',
      title: 'Cloudy weather production drop',
      type: 'Information',
      category: 'Client notification only',
      severity: 'Info',
      tenant: 'Arpi Solar Group',
      client: 'Solar Home Owner',
      plant: 'Berlin Solar 1',
      asset: 'Plant production',
      source: 'Weather + Production Analytics',
      created: 'Today · 09:44',
      route: 'Client Notification',
      bitrix: 'BX-NOTIF-2219',
      bitrixType: 'Notification',
      stage: 'Client notified',
      status: 'No Action Required',
      sla: 'No SLA',
      sop: 'Informational Production Notice',
      next: 'No specialist action required',
      clientNotify: 'Client received informational message explaining weather impact',
      actionPath: 'Alert → Classification → Client notification → Closed as informational',
      evidence: 'Notification delivery status',
      owner: 'System',
      sync: 'Synced 4 min ago',
      desc: 'Informational alert is visible for governance and client transparency, but it does not create a support or field task.'
    },
    {
      id: 'INC-3103',
      alertId: 'ALT-9031',
      title: 'GoodWe API authentication failed',
      type: 'Vendor API failure',
      category: 'Integration support',
      severity: 'High',
      tenant: 'North Region Ops',
      client: 'Portfolio Client A',
      plant: 'Multiple plants',
      asset: 'GoodWe Connector EU',
      source: 'GoodWe SEMS API',
      created: 'Today · 08:57',
      route: 'Integration Support',
      bitrix: 'BX-TICKET-7785',
      bitrixType: 'Ticket',
      stage: 'Waiting vendor credentials',
      status: 'Assigned',
      sla: '2h 15m left',
      sop: 'Vendor Connector Recovery',
      next: 'Check token expiry and request credential confirmation',
      clientNotify: 'Affected tenants receive data delay notice',
      actionPath: 'API alert → Integration ticket → Credential check → Retry sync',
      evidence: 'Connector logs, retry trace, API response code',
      owner: 'Integration Support',
      sync: 'Synced 1 min ago',
      desc: 'Vendor-side API issue is routed to integration support and synchronized with Bitrix ticket status.'
    },
    {
      id: 'INC-3104',
      alertId: 'ALT-9040',
      title: 'Grid meter inconsistent readings',
      type: 'Data quality / metering',
      category: 'Support case',
      severity: 'Medium',
      tenant: 'Tenant Delta Enterprise',
      client: 'Industrial Consumer LLC',
      plant: 'Madrid East',
      asset: 'Meter-04',
      source: 'Metering Layer',
      created: 'Yesterday · 17:10',
      route: 'Support L1 → Metering Specialist',
      bitrix: 'BX-TICKET-7762',
      bitrixType: 'Ticket',
      stage: 'Client contacted',
      status: 'Waiting Client',
      sla: '6h 20m left',
      sop: 'Metering Data Verification',
      next: 'Collect invoice period and meter photo from client',
      clientNotify: 'Support contacted client for confirmation',
      actionPath: 'Alert → Support ticket → Client interaction → Specialist review',
      evidence: 'Client response, meter photo, corrected reading decision',
      owner: 'Support L1',
      sync: 'Synced 7 min ago',
      desc: 'Support case requires communication with client before technical or billing correction can continue.'
    },
    {
      id: 'INC-3105',
      alertId: 'ALT-9055',
      title: 'Plant communication lost for 45 minutes',
      type: 'Plant offline',
      category: 'Field visit required',
      severity: 'Critical',
      tenant: 'South Solar Operations',
      client: 'Agro Solar Farm',
      plant: 'Armavir BESS + PV',
      asset: 'Main gateway + router',
      source: 'Zentrid Connectivity Monitor',
      created: 'Yesterday · 14:26',
      route: 'Field Service',
      bitrix: 'BX-WO-3304',
      bitrixType: 'Work Order',
      stage: 'Visit scheduled',
      status: 'Escalated',
      sla: 'Breached · 18 min',
      sop: 'Communication Loss Field Recovery',
      next: 'Engineer visit scheduled for today 16:00',
      clientNotify: 'Client informed about planned visit',
      actionPath: 'Alert → SOP → Work order → Field visit → Evidence upload',
      evidence: 'Site visit report, photos, connectivity restored confirmation',
      owner: 'Field Team A',
      sync: 'Synced 3 min ago',
      desc: 'Remote steps failed, so the case was escalated into a Bitrix work order for on-site specialist visit.'
    }
  ];

  const routes: RouteRule[] = [
    { key: 'info', name: 'Informational', rule: 'Client notice only', owner: 'System / Notifications', creates: 'Notification', status: 'No specialist task', example: 'Cloudy weather production drop' },
    { key: 'support', name: 'Support Case', rule: 'Requires client communication', owner: 'Support L1 / L2', creates: 'Bitrix Ticket', status: 'Client contacted / Waiting client', example: 'Meter reading question' },
    { key: 'remote', name: 'Remote Technical', rule: 'Can be checked or fixed remotely', owner: 'Technical Support', creates: 'Bitrix Task', status: 'Remote diagnostics / Command result', example: 'Gateway restart' },
    { key: 'field', name: 'Field Visit', rule: 'Remote steps failed or physical work required', owner: 'Field Service', creates: 'Bitrix Work Order', status: 'Scheduled / On site / Evidence', example: 'Plant communication lost' }
  ];

  const syncEvents: SyncEvent[] = [
    { time: '10:21', source: 'Zentrid', action: 'Created incident INC-3101 from normalized alert ALT-9017', result: 'Success' },
    { time: '10:22', source: 'Bitrix24', action: 'Task BX-TASK-8841 assigned to Technical Support L2', result: 'Success' },
    { time: '10:27', source: 'Zentrid', action: 'Remote diagnostics step started', result: 'In Progress' },
    { time: '10:31', source: 'Bitrix24', action: 'Status synchronized back to Zentrid', result: 'Success' }
  ];

  const tone = (value?: string): BadgeTone => {
    if (/Critical|Escalated|Breached|High|Failed/.test(value || '')) return 'danger';
    if (/Medium|Assigned|Waiting|Visit|Progress/.test(value || '')) return 'warning';
    if (/Info|No Action|Client notified|Success|Synced/.test(value || '')) return 'success';
    return 'warning';
  };

  const filteredIncidents = () => state.filter === 'all'
    ? incidents
    : incidents.filter(i => {
      if (state.filter === 'info') return i.category === 'Client notification only';
      if (state.filter === 'support') return i.category === 'Support case' || i.category === 'Integration support';
      if (state.filter === 'remote') return i.category === 'Remote technical action';
      if (state.filter === 'field') return i.category === 'Field visit required';
      if (state.filter === 'critical') return i.severity === 'Critical';
      return true;
    });

  function kpi(label: string, value: string | number, note: string, filter: IncidentFilter, danger = false): string {
    return `<button class="module-card incident-kpi ${danger ? 'incident-kpi-danger' : ''}" type="button" data-incident-filter="${filter}">
      <span>${label}</span><strong>${value}</strong><small>${note}</small>
    </button>`;
  }

  function hero() {
    const open = incidents.filter(i => !/No Action Required/.test(i.status)).length;
    const critical = incidents.filter(i => i.severity === 'Critical').length;
    const bitrix = incidents.filter(i => /^BX-/.test(i.bitrix)).length;
    return `
      <section class="page-hero incident-hero">
        <div>
          <p class="eyebrow">Operations Center · Bitrix Synced</p>
          <h1>Incident Governance</h1>
          <p class="muted">Control layer for alerts, routing decisions, Bitrix tickets/tasks/work orders, SLA stages and execution feedback.</p>
        </div>
        <button class="freshness-card" type="button" data-incident-toast="Bitrix sync health checked">
          <span class="pulse"></span>
          <div><strong>Bitrix synced</strong><small>Last update 2 min ago</small></div>
        </button>
      </section>
      <section class="module-grid incident-kpi-grid">
        ${kpi('Open actionable incidents', open, `${critical} critical · routed to staff`, 'all', true)}
        ${kpi('Client-only notices', incidents.filter(i => i.category === 'Client notification only').length, 'Notification, no specialist task', 'info')}
        ${kpi('Support / Integration cases', incidents.filter(i => /Support|Integration/.test(i.category)).length, 'Bitrix tickets in progress', 'support')}
        ${kpi('Remote / Field execution', incidents.filter(i => /Remote|Field/.test(i.category)).length, 'Tasks and work orders', 'remote')}
      </section>`;
  }

  function tabs() {
    const items = [
      ['incidents', 'Incident Inbox'],
      ['routing', 'Routing Rules'],
      ['bitrix', 'Bitrix Sync'],
      ['analytics', 'Execution Snapshot']
    ];
    return `<aside class="glass-card production-side-card-v92 incident-side-card"><h3>Incident Workspace</h3>${items.map(([key, label]) => `<button type="button" class="${state.tab === key ? 'active' : ''}" data-incident-tab="${key}">${label}</button>`).join('')}</aside>`;
  }

  function filters() {
    const items = [
      ['all', 'All'], ['critical', 'Critical'], ['info', 'Client-only'], ['support', 'Support'], ['remote', 'Remote'], ['field', 'Field visit']
    ];
    return `<div class="incident-filterbar">
      <div>
        <h2>Incident Inbox</h2>
        <p class="muted">Shows what happened, where it was routed, current Bitrix stage and next action.</p>
      </div>
      <div class="incident-filter-actions">
        ${items.map(([key, label]) => `<button type="button" class="small-btn ${state.filter === key ? 'primary' : 'ghost'}" data-incident-filter="${key}">${label}</button>`).join('')}
      </div>
    </div>`;
  }

  function incidentTable() {
    return `<section class="panel glass-card incident-panel">
      ${filters()}
      <div class="data-table compact-table incident-table">
        <div class="data-head">
          <span>Incident</span><span>Classification</span><span>Routing</span><span>Bitrix</span><span>Stage / SLA</span><span>Actions</span>
        </div>
        ${filteredIncidents().map(i => `
          <div class="data-row" data-incident-id="${i.id}">
            <div><strong>${i.title}</strong><small>${i.id} · ${i.alertId}<br>${i.client} · ${i.plant}</small></div>
            <div><span class="badge ${tone(i.severity)}">${i.severity}</span><small>${i.type}<br>${i.category}</small></div>
            <div><strong>${i.route}</strong><small>${i.owner}<br>${i.sop}</small></div>
            <div><strong>${i.bitrix}</strong><small>${i.bitrixType}<br>${i.sync}</small></div>
            <div><span class="badge ${tone(i.status)}">${i.status}</span><small>${i.stage}<br>${i.sla}</small></div>
            <div class="row-actions single-action"><button type="button" class="small-btn ghost" data-open-incident="${i.id}">Open</button></div>
          </div>`).join('')}
      </div>
    </section>`;
  }

  function routingRules() {
    return `<section class="panel glass-card incident-panel">
      <div class="panel-head"><div><h2>Routing Rules</h2><p>Classification decides whether Zentrid only notifies the client or creates a Bitrix ticket, task or work order.</p></div><button type="button" class="small-btn primary" data-create-incident-rule>Create Rule</button></div>
      <div class="incident-route-grid">
        ${routes.map(r => `<article class="incident-route-card">
          <div class="incident-route-head"><strong>${r.name}</strong><span class="badge ${r.key === 'field' ? 'danger' : r.key === 'info' ? 'success' : 'warning'}">${r.creates}</span></div>
          <p>${r.rule}</p>
          <div class="info-grid incident-mini-grid">
            <div><span>Owner</span><strong>${r.owner}</strong></div>
            <div><span>Status model</span><strong>${r.status}</strong></div>
            <div><span>Example</span><strong>${r.example}</strong></div>
          </div>
          <button type="button" class="small-btn ghost" data-open-routing-rule="${r.key}">Open Rule</button>
        </article>`).join('')}
      </div>
    </section>`;
  }

  function bitrixSync() {
    return `<section class="split-workspace incident-sync-layout">
      <div class="panel glass-card">
        <div class="panel-head"><div><h2>Bitrix Sync Queue</h2><p>Objects Zentrid receives back from Bitrix API: ticket status, assignee, stage, comments and work order evidence.</p></div><button type="button" class="small-btn primary" data-incident-toast="Manual Bitrix sync requested">Sync Now</button></div>
        <div class="data-table compact-table incident-sync-table">
          <div class="data-head"><span>Bitrix Object</span><span>Zentrid Incident</span><span>Owner</span><span>Status</span><span>Sync</span></div>
          ${incidents.map(i => `<div class="data-row"><div><strong>${i.bitrix}</strong><small>${i.bitrixType}</small></div><div><strong>${i.id}</strong><small>${i.title}</small></div><div><strong>${i.owner}</strong><small>${i.route}</small></div><div><span class="badge ${tone(i.status)}">${i.status}</span></div><div><small>${i.sync}</small></div></div>`).join('')}
        </div>
      </div>
      <aside class="panel glass-card">
        <div class="panel-head"><div><h2>Latest Sync Events</h2><p>Traceability from Zentrid to Bitrix and back.</p></div></div>
        <div class="info-stack">${syncEvents.map(e => `<div class="info-card"><span>${e.time} · ${e.source}</span><strong>${e.action}</strong><small>${e.result}</small></div>`).join('')}</div>
      </aside>
    </section>`;
  }

  function analytics() {
    return `<section class="panel glass-card incident-panel">
      <div class="panel-head"><div><h2>Execution Snapshot</h2><p>Global Admin view of operational workload without replacing Bitrix staff workspace.</p></div><button type="button" class="small-btn ghost" data-incident-toast="Incident report export queued">Export</button></div>
      <div class="module-grid incident-kpi-grid">
        <article class="module-card"><span>Avg response</span><strong>18m</strong><small>Support + technical queue</small></article>
        <article class="module-card"><span>SLA breaches</span><strong>1</strong><small>Field visit required</small></article>
        <article class="module-card"><span>Remote recovery</span><strong>64%</strong><small>Resolved without visit</small></article>
        <article class="module-card"><span>Client-only alerts</span><strong>21%</strong><small>No staff task created</small></article>
      </div>
      <div class="incident-flow-map">
        <div><span>01</span><strong>Alert appears</strong><small>Device, API, data quality, weather or informational event.</small></div>
        <div><span>02</span><strong>Classified</strong><small>Info, support, remote technical or field visit.</small></div>
        <div><span>03</span><strong>Routed to Bitrix</strong><small>Notification, ticket, task or work order created.</small></div>
        <div><span>04</span><strong>Synced back</strong><small>Stage, owner, SLA, comments and evidence visible in Zentrid.</small></div>
      </div>
    </section>`;
  }

  function body() {
    if (state.tab === 'routing') return routingRules();
    if (state.tab === 'bitrix') return bitrixSync();
    if (state.tab === 'analytics') return analytics();
    return incidentTable();
  }

  function render() {
    FleetLayout.mount(`${hero()}<section class="production-workspace-v92 incident-workspace-v92">${tabs()}<div class="incident-main-card-v92">${body()}</div></section>`);
    bind();
  }

  function openDrawer(id: string): void {
    const i = incidents.find(x => x.id === id);
    if (!i) return;
    let drawer = document.getElementById('incidentGovernanceDrawer');
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.id = 'incidentGovernanceDrawer';
      drawer.className = 'detail-drawer incident-detail-drawer';
      document.body.appendChild(drawer);
    }
    drawer.innerHTML = `
      <button class="drawer-close" type="button" data-close-incident-drawer>×</button>
      <p class="eyebrow">Incident Governance</p>
      <h2>${i.title}</h2>
      <div class="drawer-status-row"><span class="badge ${tone(i.severity)}">${i.severity}</span><span class="badge ${tone(i.status)}">${i.status}</span></div>
      <p class="muted">${i.desc}</p>
      <div class="drawer-metrics rich incident-drawer-grid">
        <div><span>Incident</span><strong>${i.id}</strong></div>
        <div><span>Alert source</span><strong>${i.alertId}</strong></div>
        <div><span>Client</span><strong>${i.client}</strong></div>
        <div><span>Plant / Asset</span><strong>${i.plant}<br>${i.asset}</strong></div>
        <div><span>Routing</span><strong>${i.route}</strong></div>
        <div><span>Bitrix</span><strong>${i.bitrix}<br>${i.bitrixType}</strong></div>
        <div><span>SOP</span><strong>${i.sop}</strong></div>
        <div><span>SLA</span><strong>${i.sla}</strong></div>
      </div>
      <div class="incident-drawer-section"><h3>Current execution</h3><p>${i.stage}</p><small>${i.next}</small></div>
      <div class="incident-drawer-section"><h3>Client visibility</h3><p>${i.clientNotify}</p></div>
      <div class="incident-drawer-section"><h3>Action path</h3><p>${i.actionPath}</p><small>Evidence: ${i.evidence}</small></div>
      <div class="drawer-action-grid incident-drawer-actions">
        <button type="button" class="small-btn primary" data-open-bitrix-object="${i.id}">Open Bitrix</button>
        <button type="button" class="small-btn ghost" data-open-incident-sop="${i.id}">Open SOP</button>
        <button type="button" class="small-btn ghost" data-open-incident-timeline="${i.id}">Timeline</button>
        <button type="button" class="small-btn ghost" data-sync-incident="${i.id}">Sync</button>
      </div>`;
    drawer.classList.add('open');
  }


  function ensureUtilityDrawer(id: string, title: string, subtitle: string, html: string): void {
    let drawer = document.getElementById(id);
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.id = id;
      drawer.className = 'detail-drawer incident-detail-drawer';
      document.body.appendChild(drawer);
    }
    drawer.innerHTML = `
      <button class="drawer-close" type="button" data-close-incident-utility>×</button>
      <p class="eyebrow">Incident Governance</p>
      <h2>${title}</h2>
      <p class="muted">${subtitle}</p>
      ${html}`;
    drawer.classList.add('open');
  }

  function openRuleDrawer(key?: RouteRule['key']): void {
    const r = routes.find(x => x.key === key) || routes[0];
    if (!r) return;
    ensureUtilityDrawer('incidentUtilityDrawer', `${r.name} Routing Rule`, 'Controls how Zentrid classifies alerts and what is created in Bitrix.', `
      <div class="drawer-metrics rich incident-drawer-grid">
        <div><span>Classification</span><strong>${r.name}</strong></div>
        <div><span>Creates</span><strong>${r.creates}</strong></div>
        <div><span>Owner</span><strong>${r.owner}</strong></div>
        <div><span>Status model</span><strong>${r.status}</strong></div>
      </div>
      <div class="incident-drawer-section"><h3>Rule condition</h3><p>${r.rule}</p><small>Example: ${r.example}</small></div>
      <div class="incident-drawer-section"><h3>Result</h3><p>${r.key === 'info' ? 'Client notification is sent and the incident is closed as no action required.' : `A ${r.creates.toLowerCase()} is created in Bitrix and synced back to Zentrid.`}</p></div>
      <div class="drawer-action-grid incident-drawer-actions"><button class="small-btn primary" type="button" data-incident-toast="Rule editor opened">Edit Rule</button><button class="small-btn ghost" type="button" data-incident-toast="Rule version history opened">Version History</button></div>`);
  }

  function openRuleBuilder() {
    ensureUtilityDrawer('incidentUtilityDrawer', 'Create Routing Rule', 'Builder for alert classification, recipient, Bitrix object and SLA policy.', `
      <div class="incident-form-grid">
        <label>Alert Category<select><option>Device Fault</option><option>Vendor API Failure</option><option>Weather / Informational</option><option>Data Quality</option></select></label>
        <label>Severity<select><option>Critical</option><option>High</option><option>Medium</option><option>Info</option></select></label>
        <label>Routing Target<select><option>Client Notification</option><option>Support L1</option><option>Technical Support</option><option>Field Service</option></select></label>
        <label>Bitrix Object<select><option>Notification</option><option>Ticket</option><option>Task</option><option>Work Order</option></select></label>
        <label>SOP Template<select><option>Device Offline Recovery</option><option>Vendor Connector Recovery</option><option>Metering Data Verification</option><option>Informational Production Notice</option></select></label>
        <label>SLA<select><option>No SLA</option><option>15 min response</option><option>4 h resolution</option><option>Next business day</option></select></label>
      </div>
      <div class="incident-drawer-section"><h3>Result preview</h3><p>Incoming matching alert will be classified, routed to Bitrix and then tracked in Incident Governance.</p></div>
      <div class="drawer-action-grid incident-drawer-actions"><button class="small-btn primary" type="button" data-incident-toast="Routing rule saved as draft">Save Draft</button><button class="small-btn ghost" type="button" data-incident-toast="Routing rule tested against sample alerts">Test Rule</button></div>`);
  }

  function openBitrixDrawer(id?: string): void {
    const i = incidents.find(x => x.id === id);
    if (!i) return;
    ensureUtilityDrawer('incidentUtilityDrawer', `Bitrix Object ${i.bitrix}`, 'Read-only preview of the object synchronized from Bitrix API.', `
      <div class="drawer-metrics rich incident-drawer-grid">
        <div><span>Type</span><strong>${i.bitrixType}</strong></div>
        <div><span>Assignee</span><strong>${i.owner}</strong></div>
        <div><span>Stage</span><strong>${i.stage}</strong></div>
        <div><span>Status</span><strong>${i.status}</strong></div>
      </div>
      <div class="incident-drawer-section"><h3>What Zentrid receives</h3><p>Assignee, stage, SLA state, comments, evidence links and resolution result.</p><small>${i.sync}</small></div>
      <div class="drawer-action-grid incident-drawer-actions"><button class="small-btn primary" type="button" data-incident-toast="External Bitrix link would open in production">Open External Link</button><button class="small-btn ghost" type="button" data-sync-incident="${i.id}">Sync</button></div>`);
  }

  function openSopDrawer(id?: string): void {
    const i = incidents.find(x => x.id === id);
    if (!i) return;
    ensureUtilityDrawer('incidentUtilityDrawer', i.sop, 'SOP template bound to this incident classification.', `
      <div class="incident-flow-map compact">
        <div><span>01</span><strong>Classify</strong><small>${i.type}</small></div>
        <div><span>02</span><strong>Assign</strong><small>${i.route}</small></div>
        <div><span>03</span><strong>Execute</strong><small>${i.stage}</small></div>
        <div><span>04</span><strong>Close</strong><small>${i.evidence}</small></div>
      </div>
      <div class="incident-drawer-section"><h3>Next step</h3><p>${i.next}</p></div>`);
  }

  function openTimelineDrawer(id?: string): void {
    const i = incidents.find(x => x.id === id);
    if (!i) return;
    ensureUtilityDrawer('incidentUtilityDrawer', `${i.id} Timeline`, 'Zentrid + Bitrix execution history for this incident.', `
      <div class="info-stack">
        <div class="info-card"><span>${i.created}</span><strong>Alert normalized</strong><small>${i.alertId} · ${i.source}</small></div>
        <div class="info-card"><span>+1 min</span><strong>Routing rule applied</strong><small>${i.route} · ${i.bitrixType}</small></div>
        <div class="info-card"><span>+3 min</span><strong>Bitrix object created</strong><small>${i.bitrix}</small></div>
        <div class="info-card"><span>Latest</span><strong>${i.stage}</strong><small>${i.sync}</small></div>
      </div>`);
  }

  function bind() {
    const main = document.querySelector('.main-content');
    if (!main || main.dataset.incidentBound === '1') return;
    main.dataset.incidentBound = '1';
    main.addEventListener('click', (e: Event) => {
      const target = asIncidentTarget(e.target);
      if (!target) return;
      const tab = target.closest('[data-incident-tab]') as IncidentDatasetElement | null;
      if (tab) {
        state.tab = tab.dataset.incidentTab;
        render();
        return;
      }
      const filter = target.closest('[data-incident-filter]') as IncidentDatasetElement | null;
      if (filter) {
        state.filter = filter.dataset.incidentFilter;
        state.tab = 'incidents';
        render();
        return;
      }
      const open = target.closest('[data-open-incident], [data-incident-id]') as IncidentDatasetElement | null;
      if (open) {
        const incidentId = open.dataset.openIncident || open.dataset.incidentId;
        if (incidentId) window.location.href = `incident-detail.html?id=${encodeURIComponent(incidentId)}`;
        return;
      }
      const rule = target.closest('[data-open-routing-rule]') as IncidentDatasetElement | null;
      if (rule) { openRuleDrawer(rule.dataset.openRoutingRule); return; }
      if (target.closest('[data-create-incident-rule]')) { openRuleBuilder(); return; }
      const bitrix = target.closest('[data-open-bitrix-object]') as IncidentDatasetElement | null;
      if (bitrix) { openBitrixDrawer(bitrix.dataset.openBitrixObject); return; }
      const sop = target.closest('[data-open-incident-sop]') as IncidentDatasetElement | null;
      if (sop) { openSopDrawer(sop.dataset.openIncidentSop); return; }
      const timeline = target.closest('[data-open-incident-timeline]') as IncidentDatasetElement | null;
      if (timeline) { openTimelineDrawer(timeline.dataset.openIncidentTimeline); return; }
      const sync = target.closest('[data-sync-incident]') as IncidentDatasetElement | null;
      if (sync) { FleetLayout.toast(`Manual sync requested for ${sync.dataset.syncIncident}`); return; }
      const toast = target.closest('[data-incident-toast]') as IncidentDatasetElement | null;
      if (toast) FleetLayout.toast(toast.dataset.incidentToast);
    });
    document.body.addEventListener('click', (e: MouseEvent) => {
      const target = asIncidentTarget(e.target);
      if (!target) return;
      if (target.closest('[data-close-incident-drawer]')) {
        document.getElementById('incidentGovernanceDrawer')?.classList.remove('open');
      }
      if (target.closest('[data-close-incident-utility]')) {
        document.getElementById('incidentUtilityDrawer')?.classList.remove('open');
      }
      const sync = target.closest('[data-sync-incident]') as IncidentDatasetElement | null;
      if (sync) { FleetLayout.toast(`Manual sync requested for ${sync.dataset.syncIncident}`); return; }
      const toast = target.closest('[data-incident-toast]') as IncidentDatasetElement | null;
      if (toast) FleetLayout.toast(toast.dataset.incidentToast);
    });
  }

  render();
})();
