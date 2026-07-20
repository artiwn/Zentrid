(() => {
  type AuditTabKey = 'overview' | 'users' | 'access' | 'commercial' | 'payments' | 'data' | 'alerts' | 'integrations' | 'security' | 'approvals' | 'versions';
  type AuditTone = 'danger' | 'warning' | 'success' | 'neutral';
  type AuditEvent = {
    id: string;
    time: string;
    actor: string;
    module: string;
    action: string;
    entity: string;
    scope: string;
    result: string;
    risk: string;
    before: string;
    after: string;
    note: string;
  };

const auditTabsV104: Array<[AuditTabKey, string]> = [
      ['overview','Overview'],
      ['users','User Activity'],
      ['access','Role & Access Changes'],
      ['commercial','Commercial Changes'],
      ['payments','Billing & Payments'],
      ['data','Data Governance'],
      ['alerts','Alert Governance'],
      ['integrations','Integration Activity'],
      ['security','Security Events'],
      ['approvals','Approvals'],
      ['versions','Version History']
    ];

    const auditEventsV104: AuditEvent[] = [
      {id:'AUD-9001', time:'Today · 10:42', actor:'Global Admin', module:'RBAC', action:'Role changed', entity:'Platform Administrator', scope:'All Tenants', result:'Success', risk:'High', before:'Permission template v2.3', after:'Permission template v2.4', note:'Export permission added to Data Quality Center.'},
      {id:'AUD-9002', time:'Today · 10:18', actor:'Data Steward', module:'Data Governance', action:'Metric mapping approved', entity:'Huawei powerNow', scope:'Production Normalization', result:'Success', risk:'Medium', before:'Pending Review', after:'Approved · current_power_kw', note:'Transformation rule /1000 approved.'},
      {id:'AUD-9003', time:'Today · 09:54', actor:'Finance Admin', module:'Payments', action:'Settlement rule updated', entity:'Ameriabank settlement', scope:'Financial Operations', result:'Success', risk:'High', before:'Manual reconciliation', after:'Auto-reconcile enabled', note:'Settlement batch creation enabled for EUR payments.'},
      {id:'AUD-9004', time:'Today · 09:20', actor:'Security Lead', module:'RBAC', action:'Invitation sent', entity:'Operations Viewer', scope:'Tenant Alpha Energy', result:'Pending', risk:'Medium', before:'No invitation', after:'Invite pending', note:'Invite sent for 3 assigned plants.'},
      {id:'AUD-9005', time:'Yesterday · 18:11', actor:'Integration Engineer', module:'Integrations', action:'API credential rotated', entity:'Huawei FusionSolar connector', scope:'Tenant Alpha Energy', result:'Success', risk:'Critical', before:'Credential ending 42F', after:'Credential ending 91A', note:'Connector remained healthy after rotation.'},
      {id:'AUD-9006', time:'Yesterday · 16:31', actor:'System', module:'Security', action:'MFA blocked', entity:'USR-GA-031', scope:'Tenant Gamma Grid', result:'Blocked', risk:'High', before:'Suspended user attempted login', after:'Access denied', note:'Suspended account attempted to access Billing Configuration.'},
      {id:'AUD-9007', time:'Yesterday · 14:08', actor:'Alert Steward', module:'Alert Governance', action:'Incident mapping edited', entity:'Solis 2010', scope:'Incident Normalization', result:'Success', risk:'Medium', before:'Unmapped', after:'FL-COM-RS', note:'Vendor code mapped to RS485 Communication Error.'},
      {id:'AUD-9008', time:'12 Jun · 12:41', actor:'Commercial Admin', module:'Commercial', action:'Pricing rule changed', entity:'Energy Sale Tariff ARM-EUR-01', scope:'Arpi Solar Group', result:'Success', risk:'High', before:'€0.089 / kWh', after:'€0.092 / kWh', note:'Effective from next billing cycle.'}
    ];

    const tabRowsV104: Partial<Record<AuditTabKey, AuditEvent[]>> = {
      users: auditEventsV104.filter(x => ['RBAC','Security'].includes(x.module)),
      access: auditEventsV104.filter(x => x.module === 'RBAC'),
      commercial: auditEventsV104.filter(x => x.module === 'Commercial'),
      payments: auditEventsV104.filter(x => x.module === 'Payments'),
      data: auditEventsV104.filter(x => x.module === 'Data Governance'),
      alerts: auditEventsV104.filter(x => x.module === 'Alert Governance'),
      integrations: auditEventsV104.filter(x => x.module === 'Integrations'),
      security: auditEventsV104.filter(x => x.module === 'Security'),
      approvals: [
        {id:'APR-2101', time:'Today · 11:00', actor:'Finance Manager', module:'Payments', action:'Approval required', entity:'Refund above threshold', scope:'Financial Operations', result:'Pending', risk:'High', before:'Requested', after:'Awaiting approval', note:'Refund requires Level 1 approval.'},
        {id:'APR-2102', time:'Today · 10:12', actor:'Data Steward', module:'Data Governance', action:'Approval required', entity:'Status Mapping v1.8', scope:'Production Normalization', result:'Pending', risk:'Medium', before:'Draft', after:'Pending approval', note:'New ACTIVE/OFFLINE mapping rules waiting review.'}
      ],
      versions: [
        {id:'VER-104', time:'Today · 10:42', actor:'Global Admin', module:'RBAC', action:'Version created', entity:'Permission Matrix v2.4', scope:'Platform Governance', result:'Approved', risk:'Medium', before:'v2.3', after:'v2.4', note:'Export permission change approved.'},
        {id:'VER-103', time:'12 Jun · 12:41', actor:'Commercial Admin', module:'Commercial', action:'Version created', entity:'Tariff ARM-EUR-01 v1.2', scope:'Financial Operations', result:'Approved', risk:'High', before:'v1.1', after:'v1.2', note:'New price effective next billing cycle.'}
      ]
    };

    function badgeTone(result: string): AuditTone {
      if(['Blocked','Failed','Rejected'].includes(result)) return 'danger';
      if(['Pending','Approval required'].includes(result)) return 'warning';
      if(['Approved','Success'].includes(result)) return 'success';
      return 'neutral';
    }

    function riskTone(risk: string): AuditTone {
      if(risk === 'Critical' || risk === 'High') return 'danger';
      if(risk === 'Medium') return 'warning';
      return 'success';
    }

    function auditTable(rows: AuditEvent[]): string {
      return `<div class="data-table platform-audit-table-v104">
        <div class="data-head"><span>Event</span><span>Actor / Module</span><span>Entity / Scope</span><span>Risk</span><span>Result</span><span>Actions</span></div>
        ${rows.map(a => `<div class="data-row clickable-row" data-audit-open="${a.id}">
          <div><strong>${a.action}</strong><small>${a.id}<br>${a.time}</small></div>
          <div><strong>${a.actor}</strong><small>${a.module}</small></div>
          <div><strong>${a.entity}</strong><small>${a.scope}</small></div>
          <div><span class="badge ${riskTone(a.risk)}">${a.risk}</span><small>Sensitive action</small></div>
          <div><span class="badge ${badgeTone(a.result)}">${a.result}</span><small>Hash verified</small></div>
          <div class="row-actions single-action"><button class="secondary-action single-row-action" data-audit-open="${a.id}">Open</button></div>
        </div>`).join('')}
      </div>`;
    }

    function renderAuditTab(tab: AuditTabKey = 'overview'): void {
      const root = document.getElementById('auditTabContent');
      if (!root) return;
      document.querySelectorAll('[data-audit-tab]').forEach(b => b.classList.toggle('active', b.dataset.auditTab === tab));
      if(tab === 'overview'){
        root.innerHTML = `
          <div class="section-title-v17"><div><h2>Platform Audit Overview</h2><p class="muted">Central governance log for users, access, commercial, payments, data, alerts and integrations.</p></div><button class="small-btn" data-toast="Audit export queued">Export Audit</button></div>
          <div class="module-grid audit-kpis-v104">
            <article class="kpi-card"><span>Events Today</span><strong>1,284</strong><small>All Global Admin modules</small></article>
            <article class="kpi-card"><span>Critical Actions</span><strong>37</strong><small>RBAC · Payments · Integrations</small></article>
            <article class="kpi-card"><span>Pending Approvals</span><strong>12</strong><small>Mapping, refunds, role changes</small></article>
            <article class="kpi-card"><span>Failed / Blocked</span><strong>4</strong><small>Security review required</small></article>
          </div>
          <div class="audit-overview-grid-v104">
            <section class="panel glass-card embedded-panel-v32 audit-overview-panel-v104">
              <div class="panel-head"><div><h2>Recent Activity</h2><p>Latest sensitive actions across the platform.</p></div></div>
              ${auditTable(auditEventsV104.slice(0,5))}
            </section>
            <section class="panel glass-card embedded-panel-v32 audit-side-panel-v104">
              <div class="panel-head"><div><h2>Top Actors</h2><p>Users with recent governance activity.</p></div></div>
              <div class="mini-list-v104">
                <article><strong>Global Admin</strong><small>Role, scope and matrix changes</small><span class="badge danger">14 events</span></article>
                <article><strong>Finance Admin</strong><small>Settlement and payment settings</small><span class="badge warning">9 events</span></article>
                <article><strong>Data Steward</strong><small>Mapping and validation approvals</small><span class="badge success">8 events</span></article>
              </div>
            </section>
            <section class="panel glass-card embedded-panel-v32 audit-side-panel-v104">
              <div class="panel-head"><div><h2>Modified Modules</h2><p>Where changes happened.</p></div></div>
              <div class="mini-list-v104">
                <article><strong>RBAC</strong><small>Permission and invitation changes</small><span class="badge warning">22%</span></article>
                <article><strong>Commercial</strong><small>Pricing, billing and settlements</small><span class="badge warning">18%</span></article>
                <article><strong>Data Governance</strong><small>Mappings and version approvals</small><span class="badge success">15%</span></article>
              </div>
            </section>
          </div>`;
        return;
      }
      const titleMap = Object.fromEntries(auditTabsV104);
      const descriptions: Partial<Record<AuditTabKey, string>> = {
        users:'User login, profile, account and session activity.',
        access:'Role, scope, policy and permission matrix changes.',
        commercial:'Commercial model, pricing, tariff and revenue distribution changes.',
        payments:'Billing, payment, settlement and reconciliation activity.',
        data:'Production, storage, incident mapping and data quality governance.',
        alerts:'Alert dictionary, incident normalization and workflow policy changes.',
        integrations:'Connector credentials, sync jobs, webhook and API activity.',
        security:'MFA, failed login, suspicious access and restricted actions.',
        approvals:'Pending and completed approvals across sensitive modules.',
        versions:'Versioned governance changes with rollback visibility.'
      };
      root.innerHTML = `
        <div class="section-title-v17"><div><h2>${titleMap[tab]}</h2><p class="muted">${descriptions[tab]}</p></div><button class="small-btn" data-toast="${titleMap[tab]} export queued">Export</button></div>
        ${auditTable(tabRowsV104[tab] || auditEventsV104)}
      `;
    }

    function openAuditDrawer(id: string): void {
      const event = auditEventsV104.concat(...Object.values(tabRowsV104)).find(x => x.id === id);
      if(!event) return;
      const html = `<div class="drawer-section audit-drawer-v104">
        <div class="info-grid">
          <div><span>Audit ID</span><strong>${event.id}</strong></div>
          <div><span>Time</span><strong>${event.time}</strong></div>
          <div><span>Actor</span><strong>${event.actor}</strong></div>
          <div><span>Module</span><strong>${event.module}</strong></div>
          <div><span>Entity</span><strong>${event.entity}</strong></div>
          <div><span>Scope</span><strong>${event.scope}</strong></div>
          <div><span>Risk</span><strong>${event.risk}</strong></div>
          <div><span>Result</span><strong>${event.result}</strong></div>
        </div>
        <div class="audit-change-card-v104"><small>Previous Value</small><strong>${event.before}</strong></div>
        <div class="audit-change-card-v104"><small>New Value</small><strong>${event.after}</strong></div>
        <div class="audit-change-card-v104"><small>Governance Note</small><strong>${event.note}</strong></div>
        <div class="check-list-v86 audit-checks-v104">
          <label class="check-row is-done"><input type="checkbox" checked disabled><span><b>Append-only event</b><small>This record cannot be edited after creation.</small></span></label>
          <label class="check-row is-done"><input type="checkbox" checked disabled><span><b>Hash verified</b><small>Integrity marker is valid.</small></span></label>
          <label class="check-row is-done"><input type="checkbox" checked disabled><span><b>Traceable actor</b><small>User, module and entity are linked.</small></span></label>
        </div>
      </div>`;
      let d = document.getElementById('auditDrawerV104');
      if(!d){ d = document.createElement('aside'); d.id = 'auditDrawerV104'; d.className = 'detail-drawer audit-detail-drawer-v104'; document.body.appendChild(d); }
      d.innerHTML = `<button class="drawer-close" type="button">x</button><p class="eyebrow">Platform Audit</p><h2>Audit Event Detail</h2><div class="drawer-body">${html}</div><div class="drawer-actions"><button class="primary-action" data-toast="Audit evidence package queued">Export Evidence</button><button class="secondary-action drawer-close-2">Close</button></div>`;
      d.classList.add('open');
      d.querySelectorAll('.drawer-close,.drawer-close-2').forEach(b => b.onclick = () => d.classList.remove('open'));
    }

    ZentridLayout.mount(`
      <section class="page-hero">
        <div>
          <p class="eyebrow">Global Admin · Platform Governance</p>
          <h1>Platform Audit Center</h1>
          <p class="muted">Unified audit layer for users, roles, mappings, alerts, integrations, commercial, billing and payment actions.</p>
        </div>
        <button class="freshness-card" data-toast="Audit stream verified">
          <span class="pulse"></span>
          <div><strong>Append-only audit</strong><small>Hash verified · 2 min ago</small></div>
        </button>
      </section>
      <section class="plant-workspace-v17 audit-workspace-v104">
        <aside class="glass-card plant-side-card-v17 audit-side-card-v104">
          <h3>Platform Audit</h3>
          ${auditTabsV104.map(([key,label], i) => `<button class="${i===0?'active':''}" type="button" data-audit-tab="${key}">${label}</button>`).join('')}
        </aside>
        <section class="glass-card plant-main-card-v17 audit-main-v104"><div id="auditTabContent"></div></section>
      </section>
    `);
    renderAuditTab('overview');

    document.addEventListener('click', (e: Event) => {
      const tab = (e.target as Element | null)?.closest('[data-audit-tab]') as HTMLElement | null;
      if(tab?.dataset.auditTab){ renderAuditTab(tab.dataset.auditTab as AuditTabKey); return; }
      const open = (e.target as Element | null)?.closest('[data-audit-open]') as HTMLElement | null;
      if(open?.dataset.auditOpen){ openAuditDrawer(open.dataset.auditOpen); return; }
    });

})();
