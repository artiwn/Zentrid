(function () {
  type SopTab = 'catalog' | 'mapping' | 'escalation' | 'evidence' | 'analytics';
  type SopDrawerKind = 'create' | 'mapping' | 'escalation' | 'evidence';
  type BadgeTone = 'danger' | 'warning' | 'success' | 'info';

  interface SopCenterState {
    tab: SopTab;
    query: string;
    status: string;
    category: string;
  }

  interface SopTemplate {
    id: string;
    name: string;
    category: string;
    trigger: string;
    severity: string;
    status: string;
    version: string;
    owner: string;
    workType: string;
    sla: string;
    evidence: string;
    success: string;
    runs: string;
    escalations: string;
  }

  interface SopMapping {
    event: string;
    severity: string;
    sop: string;
    routing: string;
    bitrix: string;
    result: string;
  }

  interface SopEscalation {
    level: string;
    window: string;
    action: string;
    owner: string;
    status: string;
  }

  interface SopEvidencePolicy {
    type: string;
    required: string;
    waiver: string;
    sync: string;
  }

  interface SopDrawerConfig {
    eyebrow: string;
    title: string;
    description: string;
    save: string;
    body: string;
  }
  const state: SopCenterState = { tab: 'catalog', query: '', status: 'All Statuses', category: 'All Categories' };
  const escape = (value: unknown): string => String(value ?? '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c] ?? c));
  const tone = (value: unknown): BadgeTone => {
    const v = String(value || '').toLowerCase();
    if (/critical|breach|failed|p1|field/.test(v)) return 'danger';
    if (/warning|draft|review|support|remote|at risk/.test(v)) return 'warning';
    if (/active|approved|healthy|success|informational|notification/.test(v)) return 'success';
    return 'info';
  };

  const sopTemplates: SopTemplate[] = [
    {
      id: 'SOP-001', name: 'Device Offline Recovery', category: 'Technical Recovery', trigger: 'Device Offline', severity: 'Critical', status: 'Active', version: 'v1.4', owner: 'Technical Operations', workType: 'Remote Action', sla: 'Response 15 min · resolution 4h', evidence: 'Command log, device response, operator note', success: '82%', runs: '48', escalations: '6'
    },
    {
      id: 'SOP-002', name: 'Cloudy Production Drop Notification', category: 'Informational', trigger: 'Weather / production deviation', severity: 'Info', status: 'Active', version: 'v1.1', owner: 'System / Notifications', workType: 'Client Notification', sla: 'Notify within 5 min', evidence: 'Notification delivery log', success: '99%', runs: '214', escalations: '0'
    },
    {
      id: 'SOP-003', name: 'Vendor API Connector Failure', category: 'Platform Operations', trigger: 'API timeout / auth failure', severity: 'High', status: 'Active', version: 'v2.0', owner: 'Integration Operations', workType: 'Integration Work', sla: 'Response 10 min · recovery 2h', evidence: 'Sync log, replay result, connector health', success: '76%', runs: '31', escalations: '9'
    },
    {
      id: 'SOP-004', name: 'Metering Data Verification', category: 'Data Quality', trigger: 'Meter data delayed or inconsistent', severity: 'Warning', status: 'Under Review', version: 'v1.7', owner: 'Data Operations', workType: 'Support Case', sla: 'Response 30 min · validation 8h', evidence: 'Meter reading window, validation note, client response', success: '88%', runs: '73', escalations: '12'
    },
    {
      id: 'SOP-005', name: 'Field Visit Escalation', category: 'Field Service', trigger: 'Remote recovery failed', severity: 'Critical', status: 'Draft', version: 'v0.9', owner: 'Field Service Partner', workType: 'Field Visit', sla: 'Schedule within 2h', evidence: 'Site photos, visit report, completion note', success: 'Draft', runs: '0', escalations: '0'
    }
  ];

  const mappings: SopMapping[] = [
    { event: 'Device Offline', severity: 'Critical', sop: 'Device Offline Recovery', routing: 'Technical Team', bitrix: 'Create BX-TASK', result: 'Remote Action Work Order' },
    { event: 'Production Drop · Weather Context', severity: 'Info', sop: 'Cloudy Production Drop Notification', routing: 'Client Only', bitrix: 'No task · notification log', result: 'Client Notification' },
    { event: 'Vendor API Timeout', severity: 'High', sop: 'Vendor API Connector Failure', routing: 'Integration Operations', bitrix: 'Create BX-TASK', result: 'Integration Work' },
    { event: 'Meter Data Delayed', severity: 'Warning', sop: 'Metering Data Verification', routing: 'Support L1 / Data Ops', bitrix: 'Create BX-TICKET', result: 'Support Case' },
    { event: 'Remote Recovery Failed', severity: 'Critical', sop: 'Field Visit Escalation', routing: 'Field Service Partner', bitrix: 'Create BX-WO', result: 'Field Visit' }
  ];

  const escalations: SopEscalation[] = [
    { level: 'Support L1', window: '0–15 min', action: 'Client contact or first triage', owner: 'Support Queue', status: 'Active' },
    { level: 'Support L2', window: '15–30 min', action: 'Advanced troubleshooting and Bitrix update', owner: 'Support Lead', status: 'Active' },
    { level: 'Technical Team', window: '30–60 min', action: 'Remote action or connector recovery', owner: 'Technical Operations', status: 'Active' },
    { level: 'Field Service', window: '60+ min', action: 'Field visit work order if remote action failed', owner: 'Service Partner', status: 'Draft' }
  ];

  const evidencePolicies: SopEvidencePolicy[] = [
    { type: 'Remote Recovery', required: 'Command log, result payload, operator comment', waiver: 'Security approval required', sync: 'Work Order + Incident closure' },
    { type: 'Support Case', required: 'Client communication note, resolution summary', waiver: 'Support lead approval', sync: 'Bitrix ticket + client visibility' },
    { type: 'Field Visit', required: 'Site photos, visit report, technician note', waiver: 'Not allowed for P1 incidents', sync: 'Bitrix work order + audit trail' },
    { type: 'Integration Work', required: 'Connector logs, replay report, validation result', waiver: 'Integration lead approval', sync: 'Incident + Data Governance' }
  ];

  function filteredTemplates(): SopTemplate[] {
    const q = state.query.trim().toLowerCase();
    return sopTemplates.filter(item => {
      const text = Object.values(item).join(' ').toLowerCase();
      return (!q || text.includes(q)) &&
        (state.status === 'All Statuses' || item.status === state.status) &&
        (state.category === 'All Categories' || item.category === state.category);
    });
  }

  function kpis(): string {
    const active = sopTemplates.filter(x => x.status === 'Active').length;
    const review = sopTemplates.filter(x => x.status !== 'Active').length;
    return `<section class="module-grid workorder-kpis sop-kpis">
      <article class="module-card workorder-kpi-card"><span>Active SOPs</span><strong>${active}</strong><small>Rules currently eligible for routing</small></article>
      <article class="module-card workorder-kpi-card"><span>Event Mappings</span><strong>${mappings.length}</strong><small>Alert-to-SOP bindings</small></article>
      <article class="module-card workorder-kpi-card"><span>Under Review</span><strong>${review}</strong><small>Draft or policy review templates</small></article>
      <article class="module-card workorder-kpi-card"><span>SLA Breach Risk</span><strong>7</strong><small>Open incidents using SOPs at risk</small></article>
    </section>`;
  }

  function sideNav(): string {
    const items: Array<[SopTab, string]> = [
      ['catalog', 'SOP Catalog'],
      ['mapping', 'Event Mapping'],
      ['escalation', 'Escalation Rules'],
      ['evidence', 'Evidence Policies'],
      ['analytics', 'Execution Analytics']
    ];
    return `<aside class="glass-card production-side-card-v92 workorder-side-card sop-side-card">
      <h3>SOP Workspace</h3>
      ${items.map(([key, label]) => `<button type="button" class="${state.tab === key ? 'active' : ''}" data-sop-tab="${key}">${label}</button>`).join('')}
    </aside>`;
  }

  function filterBar(): string {
    const statuses = ['All Statuses', 'Active', 'Under Review', 'Draft'];
    const categories = ['All Categories', ...Array.from(new Set(sopTemplates.map(x => x.category)))];
    return `<div class="workorder-filterbar sop-filterbar">
      <input type="search" placeholder="Search SOP, event, owner, work type..." value="${escape(state.query)}" data-sop-search />
      <select data-sop-status>${statuses.map(x => `<option ${state.status === x ? 'selected' : ''}>${escape(x)}</option>`).join('')}</select>
      <select data-sop-category>${categories.map(x => `<option ${state.category === x ? 'selected' : ''}>${escape(x)}</option>`).join('')}</select>
      <button type="button" class="small-btn primary" data-sop-action="create">Create SOP</button>
    </div>`;
  }

  function catalogView(): string {
    const rows = filteredTemplates();
    return `<section class="panel glass-card workorder-panel sop-panel">
      <div class="panel-head"><div><h2>SOP Catalog</h2><p>Operational playbooks that define how alerts become incidents, Bitrix objects and work orders.</p></div></div>
      ${filterBar()}
      <div class="data-table compact-table workorder-table sop-table">
        <div class="data-head"><span>SOP</span><span>Trigger</span><span>Owner / SLA</span><span>Work Type</span><span>Status</span><span>Actions</span></div>
        ${rows.map(item => `<div class="data-row" data-sop-id="${escape(item.id)}">
          <div><strong>${escape(item.name)}</strong><small>${escape(item.id)} · ${escape(item.version)}<br>${escape(item.category)}</small></div>
          <div><strong>${escape(item.trigger)}</strong><small>Severity: ${escape(item.severity)}</small></div>
          <div><strong>${escape(item.owner)}</strong><small>${escape(item.sla)}</small></div>
          <div><span class="badge ${tone(item.workType)}">${escape(item.workType)}</span><small>${escape(item.evidence)}</small></div>
          <div><span class="badge ${tone(item.status)}">${escape(item.status)}</span><small>${escape(item.runs)} runs · ${escape(item.success)} success</small></div>
          <div class="row-actions single-action"><button type="button" class="secondary-action single-row-action" data-sop-open="${escape(item.id)}">Open</button></div>
        </div>`).join('') || `<div class="data-row"><div><strong>No SOP templates found</strong><small>Try another filter.</small></div></div>`}
      </div>
    </section>`;
  }

  function mappingView(): string {
    return `<section class="panel glass-card workorder-panel sop-panel">
      <div class="panel-head"><div><h2>Event Mapping</h2><p>Defines which alert or event type launches which SOP, routing path and Bitrix object.</p></div><button type="button" class="small-btn primary" data-sop-action="mapping">Create Mapping</button></div>
      <div class="data-table compact-table workorder-table sop-table">
        <div class="data-head"><span>Event</span><span>Severity</span><span>SOP</span><span>Routing</span><span>Bitrix</span><span>Result</span></div>
        ${mappings.map(row => `<div class="data-row">
          <div><strong>${escape(row.event)}</strong><small>Canonical event rule</small></div>
          <div><span class="badge ${tone(row.severity)}">${escape(row.severity)}</span></div>
          <div><strong>${escape(row.sop)}</strong><small>Auto-match enabled</small></div>
          <div><strong>${escape(row.routing)}</strong><small>Owner selected by rule</small></div>
          <div><strong>${escape(row.bitrix)}</strong><small>External object policy</small></div>
          <div><span class="badge ${tone(row.result)}">${escape(row.result)}</span></div>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function escalationView(): string {
    return `<section class="panel glass-card workorder-panel sop-panel">
      <div class="panel-head"><div><h2>Escalation Rules</h2><p>Controls how stalled incidents and work orders move between support, technical and field teams.</p></div><button type="button" class="small-btn primary" data-sop-action="escalation">Create Escalation</button></div>
      <div class="module-grid sop-rule-grid">${escalations.map(row => `<article class="module-card sop-rule-card">
        <span>${escape(row.level)}</span><strong>${escape(row.window)}</strong><small>${escape(row.action)}</small><div class="sop-card-foot"><b>${escape(row.owner)}</b><span class="badge ${tone(row.status)}">${escape(row.status)}</span></div>
      </article>`).join('')}</div>
      <div class="incident-detail-callout sop-callout"><h3>Escalation principle</h3><p>Zentrid mirrors Bitrix stage changes but keeps SLA and escalation governance visible at platform level.</p></div>
    </section>`;
  }

  function evidenceView(): string {
    return `<section class="panel glass-card workorder-panel sop-panel">
      <div class="panel-head"><div><h2>Evidence Policies</h2><p>Defines what proof is required before a work order can close and the source incident can be resolved.</p></div><button type="button" class="small-btn primary" data-sop-action="evidence">Create Policy</button></div>
      <div class="data-table compact-table workorder-table sop-table">
        <div class="data-head"><span>Work Type</span><span>Required Evidence</span><span>Waiver Rule</span><span>Sync Target</span><span>Status</span></div>
        ${evidencePolicies.map(row => `<div class="data-row">
          <div><strong>${escape(row.type)}</strong><small>Closure policy</small></div>
          <div><strong>${escape(row.required)}</strong></div>
          <div><strong>${escape(row.waiver)}</strong></div>
          <div><strong>${escape(row.sync)}</strong></div>
          <div><span class="badge success">Active</span></div>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function analyticsView(): string {
    const items = [
      ['SOP Runs', '366', 'Last 30 days'],
      ['Success Rate', '87%', 'Closed without field escalation'],
      ['Escalations', '27', 'Moved past first owner'],
      ['Average Resolution', '2h 18m', 'Across active SOPs'],
      ['SLA Breaches', '7', 'Needs operations review'],
      ['Evidence Missing', '14', 'Blocking work order closure']
    ];
    return `<section class="panel glass-card workorder-panel sop-panel">
      <div class="panel-head"><div><h2>Execution Analytics</h2><p>Governance view of how SOP templates perform across incidents and Bitrix work orders.</p></div><button type="button" class="small-btn ghost" data-sop-action="export">Export Snapshot</button></div>
      <div class="module-grid workorder-sla-grid sop-analytics-grid">${items.map(([label,value,note]) => `<article class="module-card"><span>${escape(label)}</span><strong>${escape(value)}</strong><small>${escape(note)}</small><span class="badge ${tone(value + ' ' + note)}">Tracked</span></article>`).join('')}</div>
      <div class="workorder-flow-map sop-flow-map"><span>Alert</span><b>→</b><span>Incident</span><b>→</b><span>SOP</span><b>→</b><span>Bitrix Object</span><b>→</b><span>Work Order</span><b>→</b><span>Evidence</span><b>→</b><span>Closure</span></div>
    </section>`;
  }

  function currentView(): string {
    if (state.tab === 'mapping') return mappingView();
    if (state.tab === 'escalation') return escalationView();
    if (state.tab === 'evidence') return evidenceView();
    if (state.tab === 'analytics') return analyticsView();
    return catalogView();
  }

  function isSopDrawerKind(value: string): value is SopDrawerKind {
    return ['create', 'mapping', 'evidence', 'escalation'].includes(value);
  }

  function createDrawer(kind: SopDrawerKind = 'create'): void {
    let d = document.getElementById('sopDrawer');
    if (!d) {
      d = document.createElement('div');
      d.id = 'sopDrawer';
      d.className = 'detail-drawer workorder-detail-drawer sop-detail-drawer';
      document.body.appendChild(d);
    }

    const drawerMap: Record<SopDrawerKind, SopDrawerConfig> = {
      create: {
        eyebrow: 'SOP Template Builder',
        title: 'Create SOP Template',
        description: 'Defines the reusable operational playbook: trigger, workflow, owner team, Bitrix object policy, evidence and versioning.',
        save: 'SOP template draft created',
        body: `<div class="incident-form-grid workorder-form-grid sop-form-grid">
          <label>Template Name<input placeholder="Example: Device Offline Recovery" /></label>
          <label>SOP Code<input placeholder="SOP-DEVICE-OFFLINE" /></label>
          <label>Category<select><option>Technical Recovery</option><option>Informational</option><option>Platform Operations</option><option>Data Quality</option><option>Field Service</option></select></label>
          <label>Owner Team<select><option>Technical Operations</option><option>Support L1 / L2</option><option>Integration Operations</option><option>Data Operations</option><option>Field Service Partner</option></select></label>
          <label>Default Work Type<select><option>Remote Action</option><option>Support Case</option><option>Integration Work</option><option>Client Notification</option><option>Field Visit</option></select></label>
          <label>Default Status<select><option>Draft</option><option>Under Review</option><option>Active</option></select></label>
          <label class="full">Workflow Steps<textarea placeholder="1. Validate alert\n2. Create incident\n3. Route to owner team\n4. Execute recovery\n5. Attach evidence\n6. Close incident"></textarea></label>
          <label class="full">Template Notes<textarea placeholder="Explain when this SOP should be used and what successful resolution means."></textarea></label>
        </div>`
      },
      mapping: {
        eyebrow: 'Event-to-SOP Mapping',
        title: 'Create Event Mapping',
        description: 'Defines how a canonical alert/event is classified and which SOP, routing path and Bitrix object it creates.',
        save: 'Event mapping draft created',
        body: `<div class="incident-form-grid workorder-form-grid sop-form-grid">
          <label>Event Type<input placeholder="Example: Device Offline" /></label>
          <label>Source Domain<select><option>Device</option><option>Plant</option><option>Vendor API</option><option>Data Quality</option><option>Weather / Forecast</option><option>Platform</option></select></label>
          <label>Severity<select><option>Critical</option><option>High</option><option>Warning</option><option>Info</option></select></label>
          <label>Classification<select><option>Remote Technical Action</option><option>Support Case</option><option>Field Visit Required</option><option>Client Notification Only</option><option>Integration Operations</option></select></label>
          <label>Assigned SOP<select><option>Device Offline Recovery</option><option>Cloudy Production Drop Notification</option><option>Vendor API Connector Failure</option><option>Metering Data Verification</option><option>Field Visit Escalation</option></select></label>
          <label>Bitrix Object Policy<select><option>Create BX-TASK</option><option>Create BX-TICKET</option><option>Create BX-WO</option><option>No task · notification only</option></select></label>
          <label>Routing Target<select><option>Technical Team</option><option>Support L1</option><option>Integration Operations</option><option>Field Service Partner</option><option>Client Notifications</option></select></label>
          <label>Client Visibility<select><option>Notify client</option><option>Hide from client</option><option>Notify only after support review</option></select></label>
          <label class="full">Matching Conditions<textarea placeholder="Example: device_status = offline AND duration > 10 min AND source = Huawei"></textarea></label>
          <label class="full">Result Action<textarea placeholder="Example: Create incident, create Bitrix task, start remote recovery work order."></textarea></label>
        </div>`
      },
      escalation: {
        eyebrow: 'Escalation Rule Builder',
        title: 'Create Escalation Rule',
        description: 'Defines when unresolved incidents or work orders move from one owner to the next team or become a field visit.',
        save: 'Escalation rule draft created',
        body: `<div class="incident-form-grid workorder-form-grid sop-form-grid">
          <label>Rule Name<input placeholder="Example: Remote recovery failed escalation" /></label>
          <label>Applies To<select><option>Critical incidents</option><option>Support cases</option><option>Remote action work orders</option><option>Integration failures</option><option>Field visit candidates</option></select></label>
          <label>Current Stage<select><option>Support L1</option><option>Support L2</option><option>Technical Team</option><option>Remote Recovery</option><option>Waiting Client</option></select></label>
          <label>Timeout Window<select><option>15 min</option><option>30 min</option><option>60 min</option><option>2 hours</option><option>Custom</option></select></label>
          <label>Escalate To<select><option>Support L2</option><option>Technical Operations</option><option>Integration Lead</option><option>Field Service Partner</option><option>Global Admin</option></select></label>
          <label>Bitrix Update<select><option>Move stage and add comment</option><option>Create new task</option><option>Create work order</option><option>Notify only</option></select></label>
          <label>Notification Target<select><option>Owner team + Global Admin</option><option>Support Lead</option><option>Technical Lead</option><option>Client + Support</option></select></label>
          <label>Auto Action<select><option>No automatic command</option><option>Request manual sync</option><option>Create field visit</option><option>Mark SLA at risk</option></select></label>
          <label class="full">Escalation Condition<textarea placeholder="Example: no evidence attached OR Bitrix stage unchanged for 30 min OR remote action failed."></textarea></label>
        </div>`
      },
      evidence: {
        eyebrow: 'Evidence Policy Builder',
        title: 'Create Evidence Policy',
        description: 'Defines what proof is required before a Bitrix task/work order can close and the source incident can be resolved.',
        save: 'Evidence policy draft created',
        body: `<div class="incident-form-grid workorder-form-grid sop-form-grid">
          <label>Policy Name<input placeholder="Example: Remote recovery evidence policy" /></label>
          <label>Work Order Type<select><option>Remote Recovery</option><option>Support Case</option><option>Field Visit</option><option>Integration Work</option><option>Replacement</option></select></label>
          <label>Required Evidence<select><option>Command log + result payload</option><option>Client communication note</option><option>Site photos + visit report</option><option>Connector logs + replay report</option><option>Installation report</option></select></label>
          <label>Approval Role<select><option>Technical Lead</option><option>Support Lead</option><option>Field Service Manager</option><option>Integration Lead</option><option>Global Admin</option></select></label>
          <label>Waiver Allowed<select><option>No</option><option>Yes · with approval</option><option>Only for non-critical cases</option></select></label>
          <label>Closure Blocking<select><option>Block closure until evidence approved</option><option>Allow closure with waiver</option><option>Warn only</option></select></label>
          <label>Sync Target<select><option>Work Order + Incident + Audit</option><option>Bitrix task only</option><option>Incident resolution only</option><option>Data Governance evidence</option></select></label>
          <label>Retention Policy<select><option>Keep with audit record</option><option>Keep with document repository</option><option>Keep for 12 months</option></select></label>
          <label class="full">Evidence Checklist<textarea placeholder="Example:\n- Command log attached\n- Operator comment filled\n- Device status validated\n- Bitrix stage updated"></textarea></label>
        </div>`
      }
    };

    const config = drawerMap[kind] || drawerMap.create;
    d.innerHTML = `<button type="button" class="drawer-close" data-sop-close>×</button>
      <p class="eyebrow">${escape(config.eyebrow)}</p><h2>${escape(config.title)}</h2>
      <p class="drawer-intro sop-drawer-intro">${escape(config.description)}</p>
      ${config.body}
      <div class="incident-detail-callout sop-callout sop-drawer-callout"><h3>Governance note</h3><p>This form only defines Zentrid routing and governance rules. Actual staff execution remains in Bitrix and syncs back through API.</p></div>
      <div class="drawer-actions"><button type="button" class="primary-action" data-sop-close-toast="${escape(config.save)}">Save Draft</button><button type="button" class="secondary-action" data-sop-close>Close</button></div>`;
    d.classList.add('open');
  }

  function render(): void {
    ZentridLayout.mount(`
      <section class="page-hero">
        <div><p class="eyebrow">Global Admin · Operations Center</p><h1>SOP Templates</h1><p class="muted">Operational playbooks that decide how alerts become incidents, Bitrix work objects, work orders, evidence and closure.</p></div>
        <button class="freshness-card" type="button" data-sop-action="export"><span class="pulse"></span><div><strong>Version controlled</strong><small>5 templates · 1 draft</small></div></button>
      </section>
      ${kpis()}
      <section class="production-workspace-v92 workorder-workspace-v92 sop-workspace-v92">
        ${sideNav()}
        <div class="workorder-main-card-v92 sop-main-card-v92">${currentView()}</div>
      </section>
    `);
    bind();
  }

  function bind(): void {
    const main = document.getElementById('app');
    if (!main || main.dataset.sopBound === '1') return;
    main.dataset.sopBound = '1';
    main.addEventListener('click', (event: Event) => {
      const target = event.target as Element | null;
      if (!target) return;
      const tab = target.closest<HTMLElement>('[data-sop-tab]');
      if (tab?.dataset.sopTab) { state.tab = tab.dataset.sopTab as SopCenterState['tab']; render(); return; }
      const open = target.closest<HTMLElement>('[data-sop-open]');
      if (open?.dataset.sopOpen) { location.href = `sop-detail.html?id=${encodeURIComponent(open.dataset.sopOpen)}`; return; }
      const action = target.closest<HTMLElement>('[data-sop-action]');
      if (action) {
        const name = action.dataset.sopAction;
        if (isSopDrawerKind(name)) createDrawer(name);
        else ZentridLayout.toast('SOP governance snapshot exported');
      }
    });
    main.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.matches?.('[data-sop-search]')) { state.query = target.value; render(); }
    });
    main.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLSelectElement | null;
      if (target?.matches?.('[data-sop-status]')) { state.status = target.value; render(); }
      if (target?.matches?.('[data-sop-category]')) { state.category = target.value; render(); }
    });
  }

  document.addEventListener('click', (event: Event) => {
    const target = event.target as Element | null;
    const close = target?.closest<HTMLElement>('[data-sop-close], [data-sop-close-toast]');
    if (!close) return;
    const d = document.getElementById('sopDrawer');
    if (d) d.classList.remove('open');
    if (close.dataset.sopCloseToast) ZentridLayout.toast(close.dataset.sopCloseToast);
  });

  render();
})();
