(() => {
  type WorkOrderTab = 'orders' | 'board' | 'sync' | 'evidence' | 'sla';
  type BadgeTone = 'danger' | 'warning' | 'success' | 'info';

  interface WorkOrderState {
    tab: WorkOrderTab;
    status: string;
    type: string;
    query: string;
  }

  interface WorkOrderRecord {
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

  interface SyncRow {
    object: string;
    direction: string;
    status: string;
    last: string;
    payload: string;
  }

  interface EvidenceRow {
    workOrder: string;
    type: string;
    status: string;
    owner: string;
    rule: string;
  }

  interface StatCard {
    label: string;
    value: string;
    note: string;
  }

  const state: WorkOrderState = {
    tab: 'orders',
    status: 'All Statuses',
    type: 'All Types',
    query: ''
  };

  const tone = (value: string = ''): BadgeTone => {
    if (/breach|overdue|failed|p1|critical|blocked/i.test(value)) return 'danger';
    if (/risk|waiting|approval|scheduled|p2|field/i.test(value)) return 'warning';
    if (/done|complete|healthy|synced|approved/i.test(value)) return 'success';
    return 'info';
  };

  const workOrders: WorkOrderRecord[] = [
    {
      id: 'WO-901',
      title: 'Remote inverter recovery sequence',
      type: 'Remote Action',
      priority: 'P1',
      stage: 'In Progress',
      owner: 'Technical Operations · Remote Team',
      assignee: 'Arman Petrosyan',
      tenant: 'Arpi Solar Group',
      client: 'Arpi Solar Group',
      plant: 'Berlin Solar 3',
      asset: 'INV-023 · Huawei SUN2000',
      sourceIncident: 'INC-3104',
      bitrixId: 'BX-TASK-8831',
      sla: '42 min remaining',
      sync: 'Synced 2 min ago',
      evidence: 'Pending command result',
      next: 'Run gateway restart and attach command log',
      desc: 'Technical team can try remote recovery from Zentrid before field visit is scheduled.'
    },
    {
      id: 'WO-902',
      title: 'Client follow-up for metering data issue',
      type: 'Support Case',
      priority: 'P2',
      stage: 'Waiting Client',
      owner: 'Support L1',
      assignee: 'Narine Hakobyan',
      tenant: 'Tenant Alpha Energy',
      client: 'North Retail Owner',
      plant: 'Madrid East',
      asset: 'Grid Meter GM-001',
      sourceIncident: 'INC-3108',
      bitrixId: 'BX-TICKET-7762',
      sla: 'At risk · 18 min',
      sync: 'Synced 6 min ago',
      evidence: 'Client response required',
      next: 'Confirm meter reading window with client',
      desc: 'Support case created from an incident where customer communication is required before closure.'
    },
    {
      id: 'WO-903',
      title: 'On-site inspection for logger offline chain',
      type: 'Field Visit',
      priority: 'P1',
      stage: 'Scheduled',
      owner: 'Field Service Partner',
      assignee: 'Service Partner · Team A',
      tenant: 'Tenant Gamma Grid',
      client: 'Gamma Grid Owner',
      plant: 'Lyon PV Park',
      asset: 'Logger 3877560314',
      sourceIncident: 'INC-3112',
      bitrixId: 'BX-WO-4419',
      sla: 'Breach in 1h 12m',
      sync: 'Pending update',
      evidence: 'Field photos required',
      next: 'Technician arrival confirmation',
      desc: 'Remote recovery failed; Bitrix work order schedules physical inspection on site.'
    },
    {
      id: 'WO-904',
      title: 'Connector payload replay for delayed vendor API',
      type: 'Integration Work',
      priority: 'P2',
      stage: 'In Progress',
      owner: 'Integration Operations',
      assignee: 'Data Integration Team',
      tenant: 'All Tenants',
      client: 'Multiple affected clients',
      plant: '7 affected plants',
      asset: 'GoodWe SEMS API',
      sourceIncident: 'INC-3117',
      bitrixId: 'BX-TASK-8840',
      sla: '2h 05m remaining',
      sync: 'Sync warning',
      evidence: 'Replay report pending',
      next: 'Replay failed payload batch and verify core write',
      desc: 'Vendor API delay created operational task for integration team, not field staff.'
    },
    {
      id: 'WO-905',
      title: 'Preventive BESS thermal review',
      type: 'Preventive Maintenance',
      priority: 'P3',
      stage: 'Done',
      owner: 'BESS Specialist',
      assignee: 'BESS Team',
      tenant: 'Tenant North Operations',
      client: 'Armavir Storage Owner',
      plant: 'Armavir BESS',
      asset: 'Battery Rack 02',
      sourceIncident: 'SOP-RUN-502',
      bitrixId: 'BX-WO-4388',
      sla: 'Completed',
      sync: 'Synced 12 min ago',
      evidence: 'Thermal report attached',
      next: 'No action required',
      desc: 'Preventive task created from SOP schedule and closed with evidence.'
    }
  ];

  const boardStages: string[] = ['Scheduled', 'In Progress', 'Waiting Client', 'Done'];

  const syncRows: SyncRow[] = [
    { object: 'BX-TASK-8831', direction: 'Bitrix ↔ Zentrid', status: 'Healthy', last: '2 min ago', payload: 'Stage, assignee, SLA, comment thread' },
    { object: 'BX-TICKET-7762', direction: 'Bitrix → Zentrid', status: 'Healthy', last: '6 min ago', payload: 'Client communication and waiting status' },
    { object: 'BX-WO-4419', direction: 'Zentrid → Bitrix', status: 'Pending', last: 'Queued', payload: 'Field visit schedule update' },
    { object: 'BX-TASK-8840', direction: 'Bitrix ↔ Zentrid', status: 'Warning', last: '18 min ago', payload: 'Integration replay progress delayed' }
  ];

  const evidenceRows: EvidenceRow[] = [
    { workOrder: 'WO-901', type: 'Command Log', status: 'Pending', owner: 'Technical Operations', rule: 'Required before remote recovery closure' },
    { workOrder: 'WO-903', type: 'Field Photos', status: 'Missing', owner: 'Field Service Partner', rule: 'Required for field visit completion' },
    { workOrder: 'WO-904', type: 'Replay Report', status: 'Pending', owner: 'Integration Operations', rule: 'Required for connector incident closure' },
    { workOrder: 'WO-905', type: 'Thermal Report', status: 'Approved', owner: 'BESS Specialist', rule: 'Attached and verified' }
  ];

  const stats: StatCard[] = [
    { label: 'Open Work Orders', value: '48', note: 'Remote, support, field and integration work' },
    { label: 'Waiting Client', value: '9', note: 'Bitrix stage mirrored into Zentrid' },
    { label: 'At Risk / Breached', value: '6', note: 'SLA needs attention' },
    { label: 'Evidence Pending', value: '14', note: 'Cannot close without proof' }
  ];

  const escape = (value: unknown): string => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));

  function kpis(): string {
    return `<section class="module-grid workorder-kpis">${stats.map(item => `
      <article class="module-card workorder-kpi-card">
        <span>${escape(item.label)}</span>
        <strong>${escape(item.value)}</strong>
        <small>${escape(item.note)}</small>
      </article>`).join('')}</section>`;
  }

  function sideNav(): string {
    const items = [
      ['orders', 'Work Orders'],
      ['board', 'Execution Board'],
      ['sync', 'Bitrix Sync'],
      ['evidence', 'Evidence Review'],
      ['sla', 'SLA Snapshot']
    ];
    return `<aside class="glass-card production-side-card-v92 workorder-side-card">
      <h3>Work Order Workspace</h3>
      ${items.map(([key, label]) => `<button type="button" class="${state.tab === key ? 'active' : ''}" data-workorder-tab="${key}">${label}</button>`).join('')}
    </aside>`;
  }

  function filterBar(): string {
    const statuses = ['All Statuses', 'Scheduled', 'In Progress', 'Waiting Client', 'Done'];
    const types = ['All Types', 'Remote Action', 'Support Case', 'Field Visit', 'Integration Work', 'Preventive Maintenance'];
    return `<div class="workorder-filterbar">
      <input type="search" placeholder="Search work order, Bitrix ID, incident, plant, assignee..." value="${escape(state.query)}" data-workorder-search />
      <select data-workorder-status>${statuses.map(x => `<option ${state.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <select data-workorder-type>${types.map(x => `<option ${state.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <button type="button" class="small-btn primary" data-workorder-action="create">Create Work Order</button>
    </div>`;
  }

  function filteredOrders(): WorkOrderRecord[] {
    const q = state.query.trim().toLowerCase();
    return workOrders.filter(order => {
      const text = Object.values(order).join(' ').toLowerCase();
      return (!q || text.includes(q)) &&
        (state.status === 'All Statuses' || order.stage === state.status) &&
        (state.type === 'All Types' || order.type === state.type);
    });
  }

  function ordersTable(): string {
    const rows = filteredOrders();
    return `<section class="panel glass-card workorder-panel">
      <div class="panel-head">
        <div>
          <h2>Work Order Inbox</h2>
          <p>Execution objects created from incidents, SOP runs, support cases and Bitrix tasks.</p>
        </div>
      </div>
      ${filterBar()}
      <div class="data-table compact-table workorder-table">
        <div class="data-head"><span>Work Order</span><span>Source / Bitrix</span><span>Type</span><span>Stage</span><span>Owner / SLA</span><span>Actions</span></div>
        ${rows.map(order => `
          <div class="data-row" data-workorder-id="${escape(order.id)}">
            <div><strong>${escape(order.title)}</strong><small>${escape(order.id)} · ${escape(order.priority)}<br>${escape(order.plant)} · ${escape(order.asset)}</small></div>
            <div><strong>${escape(order.sourceIncident)}</strong><small>${escape(order.bitrixId)}<br>${escape(order.sync)}</small></div>
            <div><span class="badge ${tone(order.type)}">${escape(order.type)}</span><small>${escape(order.desc)}</small></div>
            <div><span class="badge ${tone(order.stage)}">${escape(order.stage)}</span><small>${escape(order.next)}</small></div>
            <div><strong>${escape(order.owner)}</strong><small>${escape(order.assignee)}<br>${escape(order.sla)}</small></div>
            <div class="row-actions single-action"><button type="button" class="secondary-action single-row-action" data-workorder-open="${escape(order.id)}">Open</button></div>
          </div>`).join('') || `<div class="data-row"><div><strong>No work orders found</strong><small>Try another filter.</small></div></div>`}
      </div>
    </section>`;
  }

  function boardView(): string {
    return `<section class="panel glass-card workorder-panel">
      <div class="panel-head"><div><h2>Execution Board</h2><p>High-level process view. Actual staff work stays in Bitrix; Zentrid mirrors stage and SLA.</p></div></div>
      <div class="workorder-board">
        ${boardStages.map(stage => {
          const list = workOrders.filter(order => order.stage === stage);
          return `<div class="workorder-column"><h3>${escape(stage)} <span>${list.length}</span></h3>${list.map(order => `
            <button type="button" class="workorder-board-card" data-workorder-open="${escape(order.id)}">
              <strong>${escape(order.title)}</strong>
              <small>${escape(order.id)} · ${escape(order.type)}</small>
              <span class="badge ${tone(order.priority)}">${escape(order.priority)}</span>
              <small>${escape(order.assignee)} · ${escape(order.sla)}</small>
            </button>`).join('') || `<p class="muted">No items</p>`}</div>`;
        }).join('')}
      </div>
    </section>`;
  }

  function syncView(): string {
    return `<section class="panel glass-card workorder-panel">
      <div class="panel-head"><div><h2>Bitrix Work Order Sync</h2><p>Shows whether Zentrid has the latest stage, assignee, comments, due date and evidence state from Bitrix.</p></div><button type="button" class="small-btn ghost" data-workorder-action="sync-all">Sync All</button></div>
      <div class="data-table compact-table workorder-sync-table">
        <div class="data-head"><span>Bitrix Object</span><span>Direction</span><span>Status</span><span>Last Sync</span><span>Payload</span><span>Action</span></div>
        ${syncRows.map(row => `<div class="data-row">
          <div><strong>${escape(row.object)}</strong><small>Mapped to Work Order registry</small></div>
          <div><strong>${escape(row.direction)}</strong><small>Stage and execution state</small></div>
          <div><span class="badge ${tone(row.status)}">${escape(row.status)}</span></div>
          <div><strong>${escape(row.last)}</strong><small>Automatic polling + webhook-ready</small></div>
          <div><small>${escape(row.payload)}</small></div>
          <div class="row-actions single-action"><button type="button" class="small-btn ghost" data-workorder-action="sync-one" data-id="${escape(row.object)}">Sync</button></div>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function evidenceView(): string {
    return `<section class="panel glass-card workorder-panel">
      <div class="panel-head"><div><h2>Evidence Review</h2><p>Controls which work orders can be closed. Field visits, remote commands and replay tasks need different proof.</p></div></div>
      <div class="data-table compact-table workorder-evidence-table">
        <div class="data-head"><span>Work Order</span><span>Evidence Type</span><span>Status</span><span>Owner</span><span>Rule</span><span>Action</span></div>
        ${evidenceRows.map(row => `<div class="data-row">
          <div><strong>${escape(row.workOrder)}</strong><small>Linked to execution closure</small></div>
          <div><strong>${escape(row.type)}</strong></div>
          <div><span class="badge ${tone(row.status)}">${escape(row.status)}</span></div>
          <div><strong>${escape(row.owner)}</strong></div>
          <div><small>${escape(row.rule)}</small></div>
          <div class="row-actions single-action"><button type="button" class="small-btn ghost" data-workorder-action="evidence" data-id="${escape(row.workOrder)}">Review</button></div>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function slaView(): string {
    const items = [
      { label: 'In SLA', value: '42', note: 'Execution is on time', status: 'Healthy' },
      { label: 'At Risk', value: '4', note: 'Less than 30 minutes to breach', status: 'Warning' },
      { label: 'Breached', value: '2', note: 'Needs escalation in Bitrix', status: 'Breached' },
      { label: 'Waiting Evidence', value: '14', note: 'Cannot close until proof is uploaded', status: 'Pending' }
    ];
    return `<section class="panel glass-card workorder-panel">
      <div class="panel-head"><div><h2>SLA Snapshot</h2><p>Global Admin control over work execution risk, not technician task management.</p></div></div>
      <div class="module-grid workorder-sla-grid">${items.map(item => `<article class="module-card"><span>${escape(item.label)}</span><strong>${escape(item.value)}</strong><small>${escape(item.note)}</small><span class="badge ${tone(item.status)}">${escape(item.status)}</span></article>`).join('')}</div>
      <div class="workorder-flow-map">
        <div><span>Incident</span><strong>INC-3104</strong><small>Critical device issue</small></div>
        <div><span>Bitrix</span><strong>BX-TASK-8831</strong><small>Assigned to technical team</small></div>
        <div><span>Execution</span><strong>Remote recovery</strong><small>Command result pending</small></div>
        <div><span>Closure</span><strong>Evidence required</strong><small>Audit-ready completion</small></div>
      </div>
    </section>`;
  }

  function currentView(): string {
    if (state.tab === 'board') return boardView();
    if (state.tab === 'sync') return syncView();
    if (state.tab === 'evidence') return evidenceView();
    if (state.tab === 'sla') return slaView();
    return ordersTable();
  }

  function drawer(title: string, body: string): void {
    let d = document.getElementById('workorderDrawer');
    if (!d) {
      d = document.createElement('aside');
      d.id = 'workorderDrawer';
      d.className = 'detail-drawer workorder-detail-drawer';
      document.body.appendChild(d);
    }
    d.innerHTML = `<button class="drawer-close" type="button">×</button>${body}`;
    d.classList.add('open');
    d.querySelector('.drawer-close')?.addEventListener('click', () => d.classList.remove('open'));
  }

  function createDrawer(): void {
    drawer('Create Work Order', `<p class="eyebrow">Work Order Builder</p><h2>Create Work Order</h2>
      <div class="drawer-body">
        <p class="muted">This creates or mirrors a Bitrix task depending on routing source. In production it would call the Bitrix API and store the Zentrid work order reference.</p>
        <div class="incident-form-grid workorder-form-grid">
          <label>Source<select><option>Incident</option><option>SOP Run</option><option>Support Ticket</option><option>Manual</option></select></label>
          <label>Type<select><option>Remote Action</option><option>Support Case</option><option>Field Visit</option><option>Integration Work</option></select></label>
          <label>Owner Team<select><option>Technical Operations</option><option>Support L1</option><option>Field Service Partner</option><option>Integration Operations</option></select></label>
          <label>Priority<select><option>P1</option><option>P2</option><option>P3</option></select></label>
          <label class="full">Title<input value="Remote recovery task from incident" /></label>
          <label class="full">Evidence Policy<textarea>Require execution log or field proof before closure.</textarea></label>
        </div>
      </div>
      <div class="drawer-actions"><button type="button" class="primary-action" data-workorder-close-toast="Work order draft created">Create Draft</button><button type="button" class="secondary-action" data-workorder-close>Close</button></div>`);
  }

  function render(): void {
    ZentridLayout.mount(`
      <section class="page-hero">
        <div>
          <p class="eyebrow">Global Admin · Operations Center</p>
          <h1>Work Order Oversight</h1>
          <p class="muted">Execution governance over Bitrix tasks, support cases, remote technical actions and field visits. Zentrid shows who is doing what, current stage, SLA, evidence and sync status.</p>
        </div>
        <button class="freshness-card" type="button" data-workorder-action="sync-all">
          <span class="pulse"></span>
          <div><strong>Bitrix synced</strong><small>Last update 2 min ago</small></div>
        </button>
      </section>
      ${kpis()}
      <section class="production-workspace-v92 workorder-workspace-v92">
        ${sideNav()}
        <div class="workorder-main-card-v92">${currentView()}</div>
      </section>
    `);
    wire();
  }

  function wire(): void {
    const main = document.querySelector('.main-content');
    if (!main) return;
    main.onclick = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const tab = target.closest('[data-workorder-tab]');
      if (tab) { state.tab = tab.dataset.workorderTab; render(); return; }

      const open = target.closest('[data-workorder-open]');
      if (open) {
        const id = open.dataset.workorderOpen;
        window.location.href = `work-order-detail.html?id=${encodeURIComponent(id)}`;
        return;
      }

      const action = target.closest('[data-workorder-action]');
      if (action) {
        const name = action.dataset.workorderAction;
        if (name === 'create') createDrawer();
        if (name === 'sync-all') ZentridLayout.toast('Bitrix work order sync requested');
        if (name === 'sync-one') ZentridLayout.toast(`Manual sync requested for ${action.dataset.id}`);
        if (name === 'evidence') ZentridLayout.toast(`Evidence review opened for ${action.dataset.id}`);
      }
    };

    main.querySelector('[data-workorder-search]')?.addEventListener('input', event => { state.query = (event.target as HTMLInputElement).value; render(); });
    main.querySelector('[data-workorder-status]')?.addEventListener('change', event => { state.status = (event.target as HTMLSelectElement).value; render(); });
    main.querySelector('[data-workorder-type]')?.addEventListener('change', event => { state.type = (event.target as HTMLSelectElement).value; render(); });
  }

  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const close = target.closest('[data-workorder-close], [data-workorder-close-toast]');
    if (!close) return;
    const d = document.getElementById('workorderDrawer');
    d?.classList.remove('open');
    if (close.dataset.workorderCloseToast) ZentridLayout.toast(close.dataset.workorderCloseToast);
  });

  window.ZentridWorkOrders = { workOrders, tone, escape };
  render();
})();
