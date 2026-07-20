(() => {
  type BadgeTone = 'danger' | 'warning' | 'success' | 'info';
  type WorkOrderDetailTab = 'overview' | 'timeline' | 'evidence' | 'resolution' | 'related' | 'assets' | 'bitrix' | 'audit';
  type InfoGridItem = [string, string];

  interface WorkOrderDetailRecord {
    id: string;
    title: string;
    type: string;
    priority: string;
    stage: string;
    owner: string;
    assignee: string;
    tenant: string;
    client: string;
    plant: string;
    asset: string;
    sourceIncident: string;
    bitrixId: string;
    sla: string;
    sync: string;
    evidence: string;
    next: string;
    desc: string;
  }

  interface WorkOrderDetailState {
    tab: WorkOrderDetailTab;
  }

  interface TimelineItem {
    time: string;
    title: string;
    body: string;
  }

  interface AuditItem {
    actor: string;
    action: string;
    time: string;
    result: string;
  }

  const params = new URLSearchParams(window.location.search);
  const currentId = params.get('id') || 'WO-901';
  const tone = (window.ZentridWorkOrders?.tone || ((value: string = ''): BadgeTone => /breach|overdue|failed|p1|critical/i.test(value) ? 'danger' : /risk|waiting|approval|scheduled|p2/i.test(value) ? 'warning' : 'success')) as (value?: string) => BadgeTone | string;
  const escape = (window.ZentridWorkOrders?.escape || ((value: unknown): string => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c)))) as (value: unknown) => string;

  const workOrders: WorkOrderDetailRecord[] = window.ZentridWorkOrders?.workOrders || [
    { id: 'WO-901', title: 'Remote inverter recovery sequence', type: 'Remote Action', priority: 'P1', stage: 'In Progress', owner: 'Technical Operations · Remote Team', assignee: 'Arman Petrosyan', tenant: 'Arpi Solar Group', client: 'Arpi Solar Group', plant: 'Berlin Solar 3', asset: 'INV-023 · Huawei SUN2000', sourceIncident: 'INC-3104', bitrixId: 'BX-TASK-8831', sla: '42 min remaining', sync: 'Synced 2 min ago', evidence: 'Pending command result', next: 'Run gateway restart and attach command log', desc: 'Technical team can try remote recovery from Zentrid before field visit is scheduled.' },
    { id: 'WO-902', title: 'Client follow-up for metering data issue', type: 'Support Case', priority: 'P2', stage: 'Waiting Client', owner: 'Support L1', assignee: 'Narine Hakobyan', tenant: 'Tenant Alpha Energy', client: 'North Retail Owner', plant: 'Madrid East', asset: 'Grid Meter GM-001', sourceIncident: 'INC-3108', bitrixId: 'BX-TICKET-7762', sla: 'At risk · 18 min', sync: 'Synced 6 min ago', evidence: 'Client response required', next: 'Confirm meter reading window with client', desc: 'Support case created from an incident where customer communication is required before closure.' },
    { id: 'WO-903', title: 'On-site inspection for logger offline chain', type: 'Field Visit', priority: 'P1', stage: 'Scheduled', owner: 'Field Service Partner', assignee: 'Service Partner · Team A', tenant: 'Tenant Gamma Grid', client: 'Gamma Grid Owner', plant: 'Lyon PV Park', asset: 'Logger 3877560314', sourceIncident: 'INC-3112', bitrixId: 'BX-WO-4419', sla: 'Breach in 1h 12m', sync: 'Pending update', evidence: 'Field photos required', next: 'Technician arrival confirmation', desc: 'Remote recovery failed; Bitrix work order schedules physical inspection on site.' },
    { id: 'WO-904', title: 'Connector payload replay for delayed vendor API', type: 'Integration Work', priority: 'P2', stage: 'In Progress', owner: 'Integration Operations', assignee: 'Data Integration Team', tenant: 'All Tenants', client: 'Multiple affected clients', plant: '7 affected plants', asset: 'GoodWe SEMS API', sourceIncident: 'INC-3117', bitrixId: 'BX-TASK-8840', sla: '2h 05m remaining', sync: 'Sync warning', evidence: 'Replay report pending', next: 'Replay failed payload batch and verify core write', desc: 'Vendor API delay created operational task for integration team, not field staff.' },
    { id: 'WO-905', title: 'Preventive BESS thermal review', type: 'Preventive Maintenance', priority: 'P3', stage: 'Done', owner: 'BESS Specialist', assignee: 'BESS Team', tenant: 'Tenant North Operations', client: 'Armavir Storage Owner', plant: 'Armavir BESS', asset: 'Battery Rack 02', sourceIncident: 'SOP-RUN-502', bitrixId: 'BX-WO-4388', sla: 'Completed', sync: 'Synced 12 min ago', evidence: 'Thermal report attached', next: 'No action required', desc: 'Preventive task created from SOP schedule and closed with evidence.' }
  ];
  function requireWorkOrder(value: WorkOrderDetailRecord | undefined): WorkOrderDetailRecord {
    if (!value) throw new Error('Work order detail requires a default record.');
    return value;
  }
  const order: WorkOrderDetailRecord = requireWorkOrder(workOrders.find(x => x.id === currentId) ?? workOrders[0]);
  const state: WorkOrderDetailState = { tab: 'overview' };

  const timeline: TimelineItem[] = [
    { time: '10:21', title: 'Incident created', body: `${order.sourceIncident} generated work requirement from normalized alert routing.` },
    { time: '10:24', title: 'Bitrix object created', body: `${order.bitrixId} created and linked to Zentrid work order ${order.id}.` },
    { time: '10:31', title: 'Assigned to owner', body: `${order.owner} / ${order.assignee} accepted ownership.` },
    { time: '10:42', title: 'Execution step started', body: order.type === 'Field Visit' ? 'Field visit planning started in Bitrix and mirrored back to Zentrid.' : order.type === 'Support Case' ? 'Support contacted the client and is waiting for confirmation.' : 'Remote recovery checklist started by technical owner.' },
    { time: '10:52', title: 'Execution in progress', body: order.next },
    { time: '11:02', title: 'Sync back', body: `${order.sync}. Zentrid mirrored stage, SLA and evidence state.` },
    { time: 'Pending', title: 'Closure validation', body: 'Work order can be closed after required evidence and resolution summary are completed.' }
  ];

  const audit: AuditItem[] = [
    { actor: 'System', action: 'Created work order from incident routing', time: 'Today · 10:24', result: 'Success' },
    { actor: 'Bitrix API', action: `Linked external object ${order.bitrixId}`, time: 'Today · 10:24', result: 'Success' },
    { actor: order.assignee, action: 'Updated execution stage', time: 'Today · 10:52', result: 'Success' },
    { actor: 'Zentrid Sync', action: 'Pulled latest Bitrix task fields', time: 'Today · 11:02', result: 'Success' }
  ];

  function sideNav(): string {
    const tabs = [['overview','Overview'],['timeline','Timeline'],['evidence','Evidence'],['resolution','Resolution'],['related','Related Objects'],['bitrix','Bitrix'],['audit','Audit']];
    return `<aside class="glass-card production-side-card-v92 workorder-side-card workorder-detail-side"><h3>Work Order Detail</h3>${tabs.map(([key,label]) => `<button type="button" class="${state.tab === key ? 'active' : ''}" data-workorder-detail-tab="${key}">${label}</button>`).join('')}</aside>`;
  }

  function infoGrid(items: InfoGridItem[]): string {
    return `<div class="incident-detail-info-grid workorder-detail-info-grid">${items.map(([label,value]) => `<div><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`).join('')}</div>`;
  }

  function overview(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Execution Overview</h2><p>${escape(order.desc)}</p></div></div>
      ${infoGrid([
        ['Work Order ID', order.id], ['Type', order.type], ['Stage', order.stage], ['Priority', order.priority], ['Owner Team', order.owner], ['Assignee', order.assignee], ['Client', order.client], ['Plant', order.plant], ['Asset', order.asset], ['Source Incident', order.sourceIncident], ['Bitrix Object', order.bitrixId], ['SLA', order.sla]
      ])}
      <div class="incident-detail-callout"><h3>Next Action</h3><p>${escape(order.next)}</p></div>
    </section>`;
  }

  function timelineView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Execution Timeline</h2><p>Mirrored from Zentrid routing, Bitrix stage updates and evidence events.</p></div></div>
      <div class="incident-detail-timeline workorder-detail-timeline">${timeline.map(item => `<div><span>${escape(item.time)}</span><strong>${escape(item.title)}</strong><small>${escape(item.body)}</small></div>`).join('')}</div>
    </section>`;
  }

  function bitrixView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Bitrix Mirror</h2><p>Zentrid does not replace Bitrix. It shows the operational state returned by Bitrix API.</p></div><button type="button" class="small-btn ghost" data-workorder-detail-action="sync">Sync</button></div>
      ${infoGrid([
        ['Bitrix Object', order.bitrixId], ['Current Stage', order.stage], ['Responsible', order.assignee], ['Queue', order.owner], ['Last Sync', order.sync], ['Mapped Fields', 'stage, owner, due date, comments, evidence state, linked incident'], ['External Link', `Open ${order.bitrixId} in Bitrix`], ['Sync Direction', 'Bitrix ↔ Zentrid']
      ])}
    </section>`;
  }

  function evidenceView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Evidence & Closure</h2><p>Controls whether the work order can be closed and whether the incident resolution is audit-ready.</p></div><button type="button" class="small-btn primary" data-workorder-detail-action="approve-evidence">Approve Evidence</button></div>
      ${infoGrid([
        ['Evidence Status', order.evidence], ['Required Proof', order.type === 'Field Visit' ? 'Field photos, technician comment, visit completion form' : order.type === 'Remote Action' ? 'Command log, result payload, operator comment' : 'Support note, client confirmation, closure summary'], ['Closure Rule', 'Cannot close until required evidence is attached or explicitly waived by authorized role'], ['Audit Impact', 'Closure writes non-repudiable audit record']
      ])}
      <div class="incident-detail-callout"><h3>Resolution Note</h3><p>Resolution summary will be synchronized back to the source incident and visible in Incident Governance.</p></div>
    </section>`;
  }

  function resolutionView(): string {
    const rootCause = order.type === 'Integration Work'
      ? 'Vendor API response delay and normalization queue replay required.'
      : order.type === 'Field Visit'
        ? 'Remote checks did not restore stable device communication. Physical inspection is required.'
        : order.type === 'Support Case'
          ? 'Client confirmation is required before the operational case can be closed.'
          : order.type === 'Preventive Maintenance'
            ? 'Preventive review triggered by scheduled SOP and equipment trend monitoring.'
            : 'Gateway communication timeout caused device recovery workflow to start.';
    const resolution = order.stage === 'Done'
      ? 'Completed and synchronized with Bitrix. Incident closure is allowed.'
      : order.type === 'Field Visit'
        ? 'Technician must confirm site visit result, attach evidence and submit closure note.'
        : order.type === 'Support Case'
          ? 'Support must record client response and confirm whether additional technical action is needed.'
          : order.type === 'Integration Work'
            ? 'Integration team must replay failed payloads, verify core write and attach replay report.'
            : 'Technical team must execute remote recovery and attach command result.';
    const recommendation = order.type === 'Field Visit'
      ? 'Check connectivity module, power state and logger wiring before replacing hardware.'
      : order.type === 'Integration Work'
        ? 'Review vendor API stability and add retry/replay monitoring if delay repeats.'
        : order.type === 'Support Case'
          ? 'Keep communication thread linked to the source incident for audit traceability.'
          : 'If the same recovery action repeats, convert it into a preventive SOP rule.';
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Resolution Summary</h2><p>Final operational outcome that will be synchronized back to the incident and audit trail.</p></div><button type="button" class="small-btn primary" data-workorder-detail-action="approve-resolution">Approve Resolution</button></div>
      ${infoGrid([
        ['Root Cause', rootCause], ['Resolution', resolution], ['Recommendation', recommendation], ['Closure Status', order.stage === 'Done' ? 'Ready to close' : 'Waiting for evidence and final validation'], ['Knowledge Base Candidate', order.type === 'Remote Action' || order.type === 'Integration Work' ? 'Yes · repeated pattern should become article' : 'Optional'], ['Incident Update', `${order.sourceIncident} will receive closure note after approval`]
      ])}
      <div class="incident-detail-callout"><h3>Closure Rule</h3><p>Zentrid should not mark the source incident as resolved until Bitrix stage, evidence state and resolution summary are aligned.</p></div>
    </section>`;
  }

  function relatedObjectsView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Related Objects</h2><p>The execution object is linked back to source incident, client, plant, affected asset and Bitrix object.</p></div></div>
      <div class="data-table compact-table incident-detail-table workorder-detail-table">
        <div class="data-head"><span>Object</span><span>Value</span><span>Status</span><span>Action</span></div>
        ${[
          ['Incident', order.sourceIncident, 'Open', 'Open Incident'],
          ['Alert', order.sourceIncident.replace('INC', 'ALT'), 'Linked', 'Open Alert'],
          ['Client', order.client, 'Visible', 'Open Client'],
          ['Plant', order.plant, 'Affected', 'Open Plant'],
          ['Asset', order.asset, 'Requires action', 'Open Asset'],
          ['Bitrix', order.bitrixId, 'Mirrored', 'Open Bitrix']
        ].map(([obj,val,status,action]) => `<div class="data-row"><div><strong>${escape(obj)}</strong></div><div><small>${escape(val)}</small></div><div><span class="badge ${tone(status)}">${escape(status)}</span></div><div><button type="button" class="small-btn ghost" data-workorder-detail-action="toast" data-label="${escape(action)}">${escape(action)}</button></div></div>`).join('')}
      </div>
    </section>`;
  }

  function assetsView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Related Objects</h2><p>The execution object is linked back to source incident, client, plant and affected asset.</p></div></div>
      <div class="data-table compact-table incident-detail-table workorder-detail-table">
        <div class="data-head"><span>Object</span><span>Value</span><span>Status</span><span>Action</span></div>
        ${[
          ['Incident', order.sourceIncident, 'Open', 'Open Incident'],
          ['Client', order.client, 'Visible', 'Open Client'],
          ['Plant', order.plant, 'Affected', 'Open Plant'],
          ['Asset', order.asset, 'Requires action', 'Open Asset'],
          ['Bitrix', order.bitrixId, 'Mirrored', 'Open Bitrix']
        ].map(([obj,val,status,action]) => `<div class="data-row"><div><strong>${escape(obj)}</strong></div><div><small>${escape(val)}</small></div><div><span class="badge ${tone(status)}">${escape(status)}</span></div><div><button type="button" class="small-btn ghost" data-workorder-detail-action="toast" data-label="${escape(action)}">${escape(action)}</button></div></div>`).join('')}
      </div>
    </section>`;
  }

  function auditView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel">
      <div class="panel-head"><div><h2>Audit Trail</h2><p>Every status change, sync operation and closure action must be traceable.</p></div></div>
      <div class="data-table compact-table incident-detail-table workorder-detail-table">
        <div class="data-head"><span>Actor</span><span>Action</span><span>Time</span><span>Result</span></div>
        ${audit.map(item => `<div class="data-row"><div><strong>${escape(item.actor)}</strong></div><div><small>${escape(item.action)}</small></div><div><strong>${escape(item.time)}</strong></div><div><span class="badge ${tone(item.result)}">${escape(item.result)}</span></div></div>`).join('')}
      </div>
    </section>`;
  }

  function currentView(): string {
    if (state.tab === 'timeline') return timelineView();
    if (state.tab === 'bitrix') return bitrixView();
    if (state.tab === 'evidence') return evidenceView();
    if (state.tab === 'resolution') return resolutionView();
    if (state.tab === 'related') return relatedObjectsView();
    if (state.tab === 'assets') return assetsView();
    if (state.tab === 'audit') return auditView();
    return overview();
  }

  function render(): void {
    FleetLayout.mount(`
      <section class="page-hero incident-detail-hero workorder-detail-hero">
        <div>
          <p class="eyebrow">Global Admin · Work Order Detail</p>
          <h1>${escape(order.id)} · ${escape(order.title)}</h1>
          <p class="muted">Execution object mirrored from Bitrix and linked to source incident, affected asset, SLA, evidence and audit trail.</p>
          <div class="inline-badges"><span class="badge ${tone(order.priority)}">${escape(order.priority)}</span><span class="badge ${tone(order.stage)}">${escape(order.stage)}</span><span class="badge info">${escape(order.type)}</span></div>
        </div>
        <div class="incident-detail-actions"><button type="button" class="small-btn ghost" onclick="window.location.href='work-orders.html'">Back to Work Orders</button><button type="button" class="small-btn primary" data-workorder-detail-action="sync">Sync Bitrix</button></div>
      </section>
      <section class="module-grid incident-detail-kpis workorder-detail-kpis">
        <article class="module-card"><span>Bitrix Object</span><strong>${escape(order.bitrixId)}</strong><small>${escape(order.sync)}</small></article>
        <article class="module-card"><span>Owner</span><strong>${escape(order.owner)}</strong><small>${escape(order.assignee)}</small></article>
        <article class="module-card"><span>SLA</span><strong>${escape(order.sla)}</strong><small>${escape(order.next)}</small></article>
        <article class="module-card"><span>Evidence</span><strong>${escape(order.evidence)}</strong><small>Required before closure</small></article>
      </section>
      <section class="production-workspace-v92 incident-detail-workspace workorder-detail-workspace">
        ${sideNav()}
        <div class="incident-main-card-v92 workorder-main-card-v92">${currentView()}</div>
      </section>
    `);
    wire();
  }

  function wire(): void {
    const main = document.querySelector('.main-content');
    if (!main) return;
    main.onclick = (event: Event) => {
      const target = event.target as Element | null;
      const tab = target?.closest('[data-workorder-detail-tab]') as HTMLElement | null;
      if (tab) { state.tab = tab.dataset.workorderDetailTab; render(); return; }
      const action = target?.closest('[data-workorder-detail-action]') as HTMLElement | null;
      if (!action) return;
      const name = action.dataset.workorderDetailAction;
      if (name === 'sync') FleetLayout.toast(`Manual Bitrix sync requested for ${order.id}`);
      if (name === 'approve-evidence') FleetLayout.toast(`Evidence approved for ${order.id}`);
      if (name === 'approve-resolution') FleetLayout.toast(`Resolution approved for ${order.id}`);
      if (name === 'toast') FleetLayout.toast(`${action.dataset.label} opened`);
    };
  }

  render();
})();
