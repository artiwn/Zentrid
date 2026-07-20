(function () {
  type SopDetailTab = 'overview' | 'workflow' | 'triggers' | 'routing' | 'evidence' | 'versions' | 'audit';
  type BadgeTone = 'danger' | 'warning' | 'success' | 'info';
  type InfoGridItem = [string, string];
  type DetailTableRow = [string, string, string, string];

  interface SopDetailState {
    tab: SopDetailTab;
  }

  interface SopDetailRecord {
    id: string;
    name: string;
    category: string;
    version: string;
    status: string;
    owner: string;
    severity: string;
    trigger: string;
    routing: string;
    bitrix: string;
    workType: string;
    responseSla: string;
    resolutionSla: string;
    evidence: string;
    closure: string;
  }
  const state: SopDetailState = { tab: 'overview' };
  const escape = (value: unknown): string => { const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }; return String(value ?? '').replace(/[&<>\"]/g, c => entities[c] ?? c); };
  const tone = (value: unknown): BadgeTone => {
    const v = String(value || '').toLowerCase();
    if (/critical|breach|failed|p1|field/.test(v)) return 'danger';
    if (/warning|draft|review|support|remote|at risk/.test(v)) return 'warning';
    if (/active|approved|healthy|success|informational|notification/.test(v)) return 'success';
    return 'info';
  };

  const sops: Record<string, SopDetailRecord> = {
    'SOP-001': {
      id: 'SOP-001', name: 'Device Offline Recovery', category: 'Technical Recovery', version: 'v1.4', status: 'Active', owner: 'Technical Operations', severity: 'Critical', trigger: 'Device Offline > 10 min', routing: 'Technical Operations · Remote Team', bitrix: 'Create BX-TASK', workType: 'Remote Action', responseSla: '15 min', resolutionSla: '4 h', evidence: 'Command log, device response, operator note', closure: 'Source incident can close only after evidence and validation are approved.'
    },
    'SOP-002': { id: 'SOP-002', name: 'Cloudy Production Drop Notification', category: 'Informational', version: 'v1.1', status: 'Active', owner: 'System / Notifications', severity: 'Info', trigger: 'Production deviation with weather context', routing: 'Client notification only', bitrix: 'No task · notification log', workType: 'Client Notification', responseSla: '5 min', resolutionSla: 'No action required', evidence: 'Notification delivery log', closure: 'Automatically closed as informational after notification delivery.' },
    'SOP-003': { id: 'SOP-003', name: 'Vendor API Connector Failure', category: 'Platform Operations', version: 'v2.0', status: 'Active', owner: 'Integration Operations', severity: 'High', trigger: 'API timeout / auth failure', routing: 'Integration Operations', bitrix: 'Create BX-TASK', workType: 'Integration Work', responseSla: '10 min', resolutionSla: '2 h', evidence: 'Connector logs, replay report, validation result', closure: 'Incident remains active until data freshness is restored and replay succeeds.' }
  };
  const params = new URLSearchParams(location.search);
  function requireSop(value: SopDetailRecord | undefined): SopDetailRecord {
    if (!value) throw new Error('SOP detail requires a default record.');
    return value;
  }
  const current: SopDetailRecord = requireSop(sops[params.get('id') || ''] ?? sops['SOP-001']);

  function infoGrid(items: InfoGridItem[]): string {
    return `<div class="incident-detail-info-grid workorder-detail-info-grid sop-detail-info-grid">${items.map(([label,value]) => `<div><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`).join('')}</div>`;
  }

  function sideNav(): string {
    const tabs: Array<[SopDetailTab, string]> = [['overview','Overview'], ['workflow','Workflow'], ['triggers','Trigger Rules'], ['routing','Routing Rules'], ['evidence','Evidence Rules'], ['versions','Version History'], ['audit','Audit']];
    return `<aside class="glass-card production-side-card-v92 workorder-side-card workorder-detail-side sop-detail-side"><h3>SOP Detail</h3>${tabs.map(([key,label]) => `<button type="button" class="${state.tab === key ? 'active' : ''}" data-sop-detail-tab="${key}">${label}</button>`).join('')}</aside>`;
  }

  function overviewView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel sop-detail-panel">
      <div class="panel-head"><div><h2>Template Overview</h2><p>High-level governance identity for this operational response template.</p></div><button type="button" class="small-btn primary" data-sop-detail-action="edit">Edit Template</button></div>
      ${infoGrid([
        ['SOP ID', current.id], ['Name', current.name], ['Category', current.category], ['Version', current.version], ['Status', current.status], ['Owner', current.owner], ['Severity', current.severity], ['Work Type', current.workType], ['Bitrix Policy', current.bitrix], ['Response SLA', current.responseSla], ['Resolution SLA', current.resolutionSla], ['Closure Rule', current.closure]
      ])}
      <div class="incident-detail-callout"><h3>Purpose</h3><p>This SOP decides what happens after a matching event is classified: whether Zentrid only notifies the client, creates a Bitrix ticket, starts a remote work order, or escalates to field service.</p></div>
    </section>`;
  }

  function workflowView(): string {
    const steps: Array<[string, string, string]> = [
      ['1', 'Validate Event', 'Check canonical event type, severity, source object and freshness before launching workflow.'],
      ['2', 'Create Incident', 'Open or attach to an existing Incident Governance record to avoid duplicates.'],
      ['3', 'Route Owner', `Assign ${current.routing} according to severity, scope and support model.`],
      ['4', 'Create Bitrix Object', `${current.bitrix} and store external ID for synchronization.`],
      ['5', 'Execute Work', `Create or mirror ${current.workType} with SLA and evidence requirements.`],
      ['6', 'Validate Closure', 'Close only after Bitrix stage, evidence and resolution summary are aligned.']
    ];
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel sop-detail-panel">
      <div class="panel-head"><div><h2>Workflow</h2><p>Execution path controlled by this SOP. Actual staff work remains in Bitrix where applicable.</p></div></div>
      <div class="incident-detail-timeline workorder-detail-timeline sop-workflow-list">${steps.map(([num,title,body]) => `<div><span>${escape(num)}</span><strong>${escape(title)}</strong><small>${escape(body)}</small></div>`).join('')}</div>
    </section>`;
  }

  function triggersView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel sop-detail-panel">
      <div class="panel-head"><div><h2>Trigger Rules</h2><p>Defines when Zentrid should apply this SOP automatically or offer it as a manual override.</p></div><button type="button" class="small-btn ghost" data-sop-detail-action="test-rule">Test Rule</button></div>
      ${infoGrid([
        ['Event Type', current.trigger], ['Severity', current.severity], ['Source Scope', 'Plant / device / integration / platform event'], ['Matching Mode', 'Auto-match enabled'], ['Duplicate Window', '15 min grouping window'], ['Manual Override', 'Allowed for Global Admin and Operations Lead'], ['Unsupported Case', 'Show no-action explanation instead of blank state'], ['Priority Handling', 'Critical first · informational never creates specialist task']
      ])}
    </section>`;
  }

  function routingView(): string {
    const rows: DetailTableRow[] = [
      ['Informational', 'Client Notification Only', 'No Bitrix specialist task', 'Notification delivery log'],
      ['Support Case', 'Support L1 / L2', 'BX-TICKET', 'Client contact and response notes'],
      ['Remote Action', 'Technical Operations', 'BX-TASK', 'Command log and recovery result'],
      ['Field Visit', 'Field Service Partner', 'BX-WO', 'Site photos and visit report']
    ];
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel sop-detail-panel">
      <div class="panel-head"><div><h2>Routing Rules</h2><p>How this SOP maps classified alerts into people, teams and Bitrix objects.</p></div></div>
      <div class="data-table compact-table sop-detail-table">
        <div class="data-head"><span>Route Type</span><span>Owner</span><span>Bitrix Object</span><span>Required Result</span></div>
        ${rows.map(([type,owner,bitrix,result]) => `<div class="data-row"><div><span class="badge ${tone(type)}">${escape(type)}</span></div><div><strong>${escape(owner)}</strong></div><div><strong>${escape(bitrix)}</strong></div><div><strong>${escape(result)}</strong></div></div>`).join('')}
      </div>
    </section>`;
  }

  function evidenceView(): string {
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel sop-detail-panel">
      <div class="panel-head"><div><h2>Evidence Rules</h2><p>Evidence required before work order closure and incident resolution.</p></div><button type="button" class="small-btn primary" data-sop-detail-action="approve-policy">Approve Policy</button></div>
      ${infoGrid([
        ['Required Evidence', current.evidence], ['Waiver Policy', current.severity === 'Critical' ? 'Not allowed without Global Admin approval' : 'Allowed by owner role'], ['Audit Impact', 'Closure writes non-repudiable audit record'], ['Bitrix Sync', 'Evidence state mirrored back to Zentrid'], ['Incident Update', 'Resolution note attached to source incident'], ['Client Visibility', current.severity === 'Info' ? 'Visible as notification only' : 'Visible after support-approved update']
      ])}
    </section>`;
  }

  function versionsView(): string {
    const items: DetailTableRow[] = [
      ['v1.4', 'Today · 10:42', 'Evidence policy updated for remote recovery closure', 'Approved'],
      ['v1.3', 'Yesterday · 16:10', 'Escalation window changed from 45 min to 30 min', 'Approved'],
      ['v1.2', 'Jun 18 · 09:24', 'Bitrix object mapping added', 'Approved'],
      ['v1.0', 'Jun 01 · 12:00', 'Baseline SOP created', 'Archived']
    ];
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel sop-detail-panel">
      <div class="panel-head"><div><h2>Version History</h2><p>SOP templates are versioned because old incidents must remain traceable to the procedure that was active at execution time.</p></div><button type="button" class="small-btn ghost" data-sop-detail-action="compare">Compare Versions</button></div>
      <div class="incident-detail-timeline workorder-detail-timeline sop-version-list">${items.map(([version,time,body,status]) => `<div><span>${escape(version)}</span><strong>${escape(time)}</strong><small>${escape(body)}</small><em class="badge ${tone(status)}">${escape(status)}</em></div>`).join('')}</div>
    </section>`;
  }

  function auditView(): string {
    const rows: DetailTableRow[] = [
      ['Rule tested', 'Global Admin', 'Trigger matched test event DEV-OFFLINE-CRIT', 'Today · 10:48'],
      ['Evidence policy approved', 'Operations Lead', 'Remote recovery requires command log', 'Today · 10:42'],
      ['Bitrix mapping changed', 'Integration Admin', 'BX-TASK is now default for remote action', 'Yesterday · 16:10']
    ];
    return `<section class="panel glass-card incident-detail-panel workorder-detail-panel sop-detail-panel">
      <div class="panel-head"><div><h2>Audit</h2><p>All SOP changes are audit-relevant because they affect routing, SLA and operational responsibility.</p></div></div>
      <div class="data-table compact-table sop-detail-table">
        <div class="data-head"><span>Action</span><span>Actor</span><span>Details</span><span>Time</span></div>
        ${rows.map(([action,actor,details,time]) => `<div class="data-row"><div><strong>${escape(action)}</strong></div><div><strong>${escape(actor)}</strong></div><div><strong>${escape(details)}</strong></div><div><strong>${escape(time)}</strong></div></div>`).join('')}
      </div>
    </section>`;
  }

  function currentView(): string {
    if (state.tab === 'workflow') return workflowView();
    if (state.tab === 'triggers') return triggersView();
    if (state.tab === 'routing') return routingView();
    if (state.tab === 'evidence') return evidenceView();
    if (state.tab === 'versions') return versionsView();
    if (state.tab === 'audit') return auditView();
    return overviewView();
  }

  function render(): void {
    ZentridLayout.mount(`
      <section class="page-hero incident-detail-hero workorder-detail-hero sop-detail-hero">
        <div><p class="eyebrow">Global Admin · SOP Detail</p><h1>${escape(current.name)}</h1><p class="muted">${escape(current.id)} · ${escape(current.category)} · ${escape(current.version)}</p></div>
        <div class="hero-actions"><button type="button" class="secondary-action" onclick="location.href='sop-center.html'">Back to SOPs</button><button type="button" class="primary-action" data-sop-detail-action="version">Create Version</button></div>
      </section>
      <section class="module-grid workorder-kpis sop-detail-kpis">
        <article class="module-card"><span>Status</span><strong>${escape(current.status)}</strong><small>${escape(current.owner)}</small></article>
        <article class="module-card"><span>Trigger</span><strong>${escape(current.trigger)}</strong><small>${escape(current.severity)}</small></article>
        <article class="module-card"><span>Bitrix Policy</span><strong>${escape(current.bitrix)}</strong><small>${escape(current.workType)}</small></article>
        <article class="module-card"><span>SLA</span><strong>${escape(current.responseSla)}</strong><small>${escape(current.resolutionSla)}</small></article>
      </section>
      <section class="production-workspace-v92 workorder-workspace-v92 sop-detail-workspace-v92">
        ${sideNav()}
        <div class="workorder-main-card-v92 sop-detail-main-card-v92">${currentView()}</div>
      </section>
    `);
    bind();
  }

  function bind(): void {
    const app = document.getElementById('app');
    if (!app || app.dataset.sopDetailBound === '1') return;
    app.dataset.sopDetailBound = '1';
    app.addEventListener('click', (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const tab = target.closest('[data-sop-detail-tab]');
      if (tab) { state.tab = tab.dataset.sopDetailTab; render(); return; }
      const action = target.closest('[data-sop-detail-action]');
      if (action) ZentridLayout.toast(`${action.dataset.sopDetailAction} action prepared`);
    });
  }

  render();
})();
