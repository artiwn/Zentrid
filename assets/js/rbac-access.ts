type RbacScopeLevel = 'Global' | 'Tenant' | 'Client' | 'Plant' | 'Plant group';
type RbacTab = 'overview' | 'users' | 'roles' | 'matrix' | 'policies' | 'invitations' | 'security' | 'audit' | 'versions';
type RbacBadgeTone = 'success' | 'warning' | 'danger' | 'info';

interface RbacUser {
  id: string;
  name: string;
  email: string;
  tenant: string;
  client: string;
  role: string;
  template: string;
  scope: string;
  scopeLevel: RbacScopeLevel;
  status: string;
  mfa: string;
  last: string;
  review: string;
  risk: string;
  invited: string;
  owner: string;
  modules: string[];
  restrictions: string[];
  plants: string;
  expires: string;
}

interface RbacRole {
  name: string;
  level: RbacScopeLevel;
  users: number;
  scope: string;
  permissions: string;
  sensitive: 'Yes' | 'No';
  status: string;
  approval: string;
  modules: string[];
}

interface RbacMatrixRow {
  area: string;
  global: string;
  tenant: string;
  client: string;
  engineer: string;
  viewer: string;
}

interface RbacPolicy {
  title: string;
  type: string;
  status: string;
  owner: string;
  rule: string;
  text: string;
}

interface RbacInvite {
  email: string;
  tenant: string;
  client: string;
  role: string;
  scope: string;
  status: string;
  expires: string;
  mfa: string;
  reviewer: string;
  note: string;
}

interface RbacSecurityPolicy {
  policy: string;
  status: string;
  scope: string;
  note: string;
  enforcement: string;
}

interface RbacVersion {
  version: string;
  type: string;
  date: string;
  author: string;
  status: string;
  change: string;
}

type RbacAccessEvent = [event: string, description: string, time: string, actor: string, status: string];
type RbacVersionDiff = [change: string, permission: string, before: string, after: string, impact: string];

const FleetRBAC = (() => {
  const users: RbacUser[] = [
    { id:'USR-GA-001', name:'Anna Harutyunyan', email:'anna.harutyunyan@zentrid.example', tenant:'Zentrid Platform', client:'—', role:'Global Admin', template:'Platform Administrator', scope:'Platform-wide', scopeLevel:'Global', status:'Active', mfa:'Enabled', last:'Today · 10:18', review:'Passed', risk:'Low', invited:'Accepted', owner:'Security Office', modules:['All platform modules'], restrictions:['Sensitive action re-auth'], plants:'All tenants', expires:'Never' },
    { id:'USR-GA-014', name:'Mariam Sargsyan', email:'mariam.sargsyan@alpha.example', tenant:'Tenant Alpha Energy', client:'Arpi Solar Group', role:'Client Admin', template:'Client Admin', scope:'All assigned client plants', scopeLevel:'Client', status:'Active', mfa:'Enabled', last:'Today · 09:42', review:'Due in 12 days', risk:'Medium', invited:'Accepted', owner:'Tenant Alpha Energy', modules:['Client profile','Assigned plants','Reports','Documents','Invoices','Client users'], restrictions:['No tenant configuration','No platform integrations'], plants:'18 plants', expires:'2026-12-31' },
    { id:'USR-GA-022', name:'Daniel Weber', email:'daniel.weber@north.example', tenant:'Tenant North Operations', client:'Valley Solar Holdings', role:'Finance User', template:'Finance Viewer', scope:'Finance + reports · California portfolio', scopeLevel:'Plant group', status:'Active', mfa:'Enabled', last:'Yesterday · 16:10', review:'Passed', risk:'Low', invited:'Accepted', owner:'Finance Governance', modules:['Revenue analytics','Invoices','Reports','Documents'], restrictions:['Read-only','No payment configuration'], plants:'California portfolio', expires:'2026-09-30' },
    { id:'USR-GA-031', name:'Laura Garcia', email:'laura.garcia@gamma.example', tenant:'Tenant Gamma Grid', client:'Gamma Grid Holdings', role:'Viewer', template:'Read-only Viewer', scope:'Investor portfolio', scopeLevel:'Client', status:'Suspended', mfa:'Disabled', last:'29 May · 11:03', review:'Blocked', risk:'High', invited:'Accepted', owner:'Tenant Gamma Grid', modules:['Overview','Reports'], restrictions:['Suspended account','No exports'], plants:'Investor portfolio', expires:'Blocked' },
    { id:'USR-GA-038', name:'Aram Hakobyan', email:'aram.hakobyan@arpi.example', tenant:'Tenant Alpha Energy', client:'Arpi Solar Group', role:'Operations Viewer', template:'Operations Viewer', scope:'3 assigned plants', scopeLevel:'Plant', status:'Invited', mfa:'Required', last:'Invitation pending', review:'Pending activation', risk:'Medium', invited:'Pending', owner:'O&M Lead', modules:['Assigned plants','Alerts','Work orders','SOP'], restrictions:['Activation pending','MFA enrollment required'], plants:'PL-ARM-001, PL-ARM-003, PL-ARM-010', expires:'2 days' },
    { id:'USR-GA-044', name:'Narek Petrosyan', email:'narek.pet@service.example', tenant:'Tenant Alpha Energy', client:'Arpi Solar Group', role:'O&M Engineer', template:'Field Engineer', scope:'Plant PL-ARM-001 · alerts + work orders', scopeLevel:'Plant', status:'Active', mfa:'Enabled', last:'Today · 08:07', review:'Passed', risk:'Low', invited:'Accepted', owner:'Service Team', modules:['Alerts','SOP tasks','Work orders','Device history','Evidence upload'], restrictions:['No billing','No RBAC'], plants:'PL-ARM-001', expires:'2026-11-15' }
  ];

  const roles: RbacRole[] = [
    { name:'Platform Administrator', level:'Global', users:3, scope:'Zentrid platform governance', permissions:'Tenants, integrations, audit, RBAC, data governance, system configuration', sensitive:'Yes', status:'Active', approval:'Two-step approval', modules:['Tenant Registry','Integrations','Data Governance','Audit Center','Users & Access','Platform Settings'] },
    { name:'Tenant Administrator', level:'Tenant', users:18, scope:'One tenant only', permissions:'Tenant users, plant registry, reports, finance view, integration monitoring', sensitive:'Yes', status:'Active', approval:'Security review required', modules:['Plants','Devices','Alerts','Reports','Tenant Users','Finance'] },
    { name:'Client Admin', level:'Client', users:26, scope:'Assigned client portfolio', permissions:'Client users, reports, documents, assigned plants, invoices', sensitive:'Yes', status:'Active', approval:'Tenant approval required', modules:['Client Profile','Assigned Plants','Reports','Documents','Invoices','Client Users'] },
    { name:'Field Engineer', level:'Plant', users:12, scope:'Selected plants / work orders', permissions:'Alerts, SOP tasks, device history, field evidence', sensitive:'No', status:'Active', approval:'Manager approval', modules:['Assigned Plants','Alerts','SOP','Tasks','Device History'] },
    { name:'Finance Viewer', level:'Client', users:19, scope:'Commercial and reporting scope', permissions:'Reports, invoices, revenue summaries', sensitive:'No', status:'Active', approval:'Finance owner', modules:['Finance','Invoices','Reports','Commercial Models'] },
    { name:'Read-only Viewer', level:'Client', users:81, scope:'Read-only assigned objects', permissions:'Dashboard, reports, documents', sensitive:'No', status:'Active', approval:'Owner approval', modules:['Overview','Reports','Documents'] }
  ];

  const matrix: RbacMatrixRow[] = [
    { area:'Tenant Registry', global:'View · Configure', tenant:'No access', client:'No access', engineer:'No access', viewer:'No access' },
    { area:'Client Registry', global:'View · Governance', tenant:'Create / edit in tenant scope', client:'View own profile', engineer:'No access', viewer:'View own profile' },
    { area:'Plant Assignment', global:'View · audit', tenant:'Create / edit assignment', client:'View assigned plants', engineer:'Assigned plants only', viewer:'View assigned plants' },
    { area:'Users & Access', global:'Full RBAC governance', tenant:'Tenant users only', client:'Client users only', engineer:'Own profile', viewer:'Own profile' },
    { area:'Alerts & Incidents', global:'Policies · governance', tenant:'Manage tenant incidents', client:'View own incidents', engineer:'Execute assigned tasks', viewer:'View only' },
    { area:'Data Governance', global:'Approve mappings', tenant:'No access', client:'No access', engineer:'No access', viewer:'No access' },
    { area:'Commercial / Billing', global:'Configure models', tenant:'Tenant billing view', client:'Own invoices', engineer:'No access', viewer:'No access' },
    { area:'Audit Center', global:'Full audit', tenant:'Tenant audit', client:'Own access events', engineer:'Own task events', viewer:'No access' },
    { area:'Platform Settings', global:'Configure', tenant:'No access', client:'No access', engineer:'No access', viewer:'No access' }
  ];

  const policies: RbacPolicy[] = [
    { title:'Global scope', type:'Scope boundary', status:'Active', owner:'Security Office', rule:'Only Zentrid platform administrators can hold this scope.', text:'Cross-tenant governance, audit, integration and platform configuration. This scope is never inherited from tenant roles.' },
    { title:'Tenant scope', type:'Scope boundary', status:'Active', owner:'Tenant Governance', rule:'Bound to exactly one tenant.', text:'Operates tenant business data without visibility into other tenants. Can manage tenant users only inside tenant boundary.' },
    { title:'Client scope', type:'Scope boundary', status:'Active', owner:'Client Governance', rule:'Bound to one client profile.', text:'Includes assigned plants, client documents, invoices, reports and client user administration.' },
    { title:'Plant scope', type:'Scope boundary', status:'Active', owner:'Operations', rule:'Must include explicit plant or plant group list.', text:'Restricts user access to specific plants, plant groups, alerts, work orders and device history.' },
    { title:'Sensitive action approval', type:'Approval', status:'Active', owner:'Security Office', rule:'RBAC, payment, mapping and alert-policy changes require audit and approval.', text:'Changes enter Access Review Queue until approved by an allowed reviewer.' },
    { title:'Least privilege rule', type:'Security', status:'Active', owner:'RBAC Owner', rule:'New roles start read-only until explicit permissions are granted.', text:'Prevents accidental broad access during role creation and user invitation.' }
  ];

  const invites: RbacInvite[] = [
    { email:'aram.hakobyan@arpi.example', tenant:'Tenant Alpha Energy', client:'Arpi Solar Group', role:'Operations Viewer', scope:'Plant scope · PL-ARM-001, PL-ARM-003, PL-ARM-010', status:'Pending', expires:'2 days', mfa:'Required', reviewer:'O&M Lead', note:'Waiting for activation and MFA enrollment.' },
    { email:'finance@valley.example', tenant:'Tenant North Operations', client:'Valley Solar Holdings', role:'Finance Viewer', scope:'Plant group · California portfolio', status:'Pending', expires:'5 days', mfa:'Required', reviewer:'Finance Governance', note:'Revenue reports and invoices only.' },
    { email:'viewer@gamma.example', tenant:'Tenant Gamma Grid', client:'Gamma Grid Holdings', role:'Read-only Viewer', scope:'Client scope · Investor portfolio', status:'Expired', expires:'Expired yesterday', mfa:'Optional', reviewer:'Tenant Admin', note:'Expired before account activation.' }
  ];

  const security: RbacSecurityPolicy[] = [
    { policy:'MFA required for admins', status:'Enabled', scope:'Global Admin · Tenant Admin · Client Admin', note:'Blocks login until MFA enrollment is completed.', enforcement:'Login gate' },
    { policy:'Session timeout', status:'Enabled', scope:'All users', note:'Inactive sessions expire after 30 minutes.', enforcement:'Session control' },
    { policy:'Sensitive action re-auth', status:'Enabled', scope:'RBAC · Payments · Data mappings', note:'Requires password/MFA confirmation before save.', enforcement:'Before save' },
    { policy:'Export restriction', status:'Enabled', scope:'Billing · reports · audit', note:'Export is limited by role and object scope.', enforcement:'Export workflow' },
    { policy:'Suspended account block', status:'Enabled', scope:'Suspended / disabled users', note:'Prevents login and API token usage.', enforcement:'Auth service' }
  ];

  const versions: RbacVersion[] = [
    { version:'RBAC v1.4', type:'Permission Matrix', date:'15 Jun 2026', author:'Global Admin', status:'Approved', change:'Added client scope and finance export restriction.' },
    { version:'RBAC v1.3', type:'Client Admin Scope', date:'08 Jun 2026', author:'Security Lead', status:'Approved', change:'Separated Client Admin from Tenant Admin.' },
    { version:'RBAC v1.2', type:'Finance Viewer Role', date:'22 May 2026', author:'Finance Admin', status:'Archived', change:'Deprecated broad finance access.' }
  ];

  const accessEvents: RbacAccessEvent[] = [
    ['Role changed','Platform Administrator template updated','Today · 10:42','Global Admin','Approved'],
    ['Invitation sent','Operations Viewer invited to PL-ARM-001','Today · 09:20','Tenant Alpha Energy','Pending'],
    ['Access review','Finance Viewer scope approved','Yesterday · 16:31','Security Lead','Approved'],
    ['MFA blocked','Suspended user attempted login','29 May · 11:04','System','Blocked'],
    ['Scope changed','Client Admin plant assignment changed','28 May · 14:10','Tenant Admin','Approved']
  ];



  const roleModules: string[] = ['Tenant Management','Client Management','Plant Registry','Device Registry','Integrations','Billing & Payments','Reports','Audit Center','RBAC','Data Governance','Command Center','Platform Operations'];
  const roleActions: string[] = ['View','Create','Edit','Delete','Export','Approve','Execute','Configure'];
  const versionDiff: RbacVersionDiff[] = [
    ['Permission added','Billing.Payments.Approve','v1.3','v1.4','Sensitive action now requires two-step approval.'],
    ['Scope tightened','ClientAdmin.PlantAssignment','All tenant plants','Assigned client plants only','Client Admin no longer inherits tenant-wide plant registry access.'],
    ['Permission removed','Reports.Delete','Allowed','Blocked','Delete reports moved to Platform Administrator only.'],
    ['Security rule added','RBAC.RoleTemplate.Update','Audit only','Audit + MFA re-auth','Sensitive role template changes require re-auth before save.']
  ];

  let activeTab: RbacTab = ((localStorage.getItem('zentrid_rbac_tab') as RbacTab | null) || 'overview');

  function esc(value: unknown): string {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch] ?? ch));
  }
  function tone(v: unknown): RbacBadgeTone {
    const text = String(v ?? '');
    if (/Active|Enabled|Passed|Low|Approved|Accepted|Standard|Never/.test(text)) return 'success';
    if (/Invited|Required|Due|Medium|Pending|Open|Sensitive|Attention|Review/.test(text)) return 'warning';
    if (/Suspended|Disabled|Blocked|High|Expired|Archived/.test(text)) return 'danger';
    return 'info';
  }
  function pill(v: unknown): string { return `<span class="badge ${tone(v)}">${esc(v)}</span>`; }
  function cell(title: unknown, sub: unknown = ''): string { return `<div><strong>${esc(title)}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`; }
  function notify(message: string | undefined): void { if (message) window.FleetLayout?.toast?.(message); }
  function openUser(id: string | undefined): void { if (!id) return; localStorage.setItem('zentrid_selected_access_user', id); window.location.href = 'user-access-detail.html'; }

  function render(): void {
    const root = document.getElementById('rbacRoot');
    if (!root) return;
    root.innerHTML = `
      <section class="page-hero rbac-hero">
        <div>
          <p class="eyebrow">Global Admin · Platform Governance</p>
          <h1>User & Access Governance</h1>
          <p class="muted">Central RBAC workspace for users, roles, permission templates, scope policies, invitations, security review and access audit.</p>
        </div>
        <button class="freshness-card" type="button" data-toast="Access policy snapshot is current">
          <span class="pulse"></span>
          <div><strong>Policy snapshot</strong><small>Updated 4 min ago</small></div>
        </button>
      </section>
      <section class="plant-workspace-v17 rbac-workspace">
        <aside class="glass-card plant-side-card-v17 rbac-side">
          <h3>User & Access</h3>
          ${[
            ['overview','Overview'],['users','User Directory'],['roles','Role Registry'],['matrix','Permission Matrix'],['policies','Scope Policies'],['invitations','Invitations'],['security','Security Policies'],['audit','Access Audit'],['versions','Version History']
          ].map(([key,label])=>`<button type="button" class="${activeTab===key?'active':''}" data-rbac-tab="${key}">${label}</button>`).join('')}
        </aside>
        <section class="glass-card plant-main-card-v17 rbac-main">
          <div id="rbacTabContent"></div>
        </section>
      </section>
      <aside class="detail-drawer rbac-drawer" id="rbacDrawer"><button class="drawer-close" type="button" data-rbac-close>×</button><div id="rbacDrawerContent"></div></aside>
    `;
    bindRoot();
    drawTab();
  }

  function drawTab(): void {
    const el = document.getElementById('rbacTabContent');
    if (!el) return;
    const tabs = { overview: overviewTab, users: usersTab, roles: rolesTab, matrix: matrixTab, policies: policiesTab, invitations: invitationsTab, security: securityTab, audit: auditTab, versions: versionsTab };
    el.innerHTML = (tabs[activeTab] || overviewTab)();
    bindTab();
  }

  function overviewTab(): string {
    const active = users.filter(u=>u.status==='Active').length;
    const review = users.filter(u=>!u.review.includes('Passed')).length;
    const highRisk = users.filter(u=>u.risk==='High').length;
    const pendingInvites = invites.filter(i=>i.status==='Pending').length;
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Access Command Center</h2><p class="muted">High-level view of account health, scope boundaries, role coverage and pending governance actions.</p></div><button class="small-btn primary" data-rbac-action="invite">Invite User</button></div>
      <div class="kpi-grid rbac-kpis">
        ${[
          ['Active users', active, 'Across platform, tenants and clients'],
          ['Roles', roles.length, 'Reusable role templates'],
          ['Review queue', review, 'Accounts requiring attention'],
          ['Pending invites', pendingInvites, 'Awaiting activation'],
          ['High risk', highRisk, 'Blocked or suspicious access'],
          ['Policies', policies.length, 'Active scope/security policies']
        ].map(([label,value,sub])=>`<article class="kpi-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(sub)}</small></article>`).join('')}
      </div>
      <div class="rbac-flow">
        ${[
          ['1','Invite','Email, tenant/client, role and scope'],['2','Assign role','Template with allowed modules'],['3','Bind scope','Global, tenant, client, plant or plant group'],['4','Security','MFA and sensitive action rules'],['5','Review','Approve, reject, suspend or request changes']
        ].map(x=>`<article><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>`).join('')}
      </div>
      <div class="module-grid rbac-two-col">
        <section class="panel glass-card embedded-panel-v32 rbac-review-panel"><div class="panel-head"><div><h2>Access Review Queue</h2><p>Accounts that need governance attention.</p></div><button class="small-btn ghost" data-rbac-tab-jump="users">Open Directory</button></div>${userTable(users.filter(u=>!u.review.includes('Passed')), true)}</section>
        <section class="panel glass-card embedded-panel-v32"><div class="panel-head"><div><h2>Scope Policies</h2><p>Core boundaries used across the product.</p></div><button class="small-btn ghost" data-rbac-tab-jump="policies">Open Policies</button></div><div class="placeholder-grid compact-cards rbac-policy-mini">${policies.slice(0,4).map((p,i)=>`<article><strong>${esc(p.title)}</strong><small>${esc(p.text)}</small><button class="small-btn ghost" type="button" data-rbac-policy="${i}">Open</button></article>`).join('')}</div></section>
      </div>
      <div class="module-grid rbac-two-col">
        <section class="panel glass-card embedded-panel-v32"><div class="panel-head"><div><h2>Role coverage</h2><p>Role templates and assigned users.</p></div><button class="small-btn ghost" data-rbac-tab-jump="roles">Manage Roles</button></div><div class="data-table rbac-role-table compact-table"><div class="data-head"><span>Role</span><span>Scope</span><span>Users</span><span>Status</span></div>${roles.slice(0,4).map((r,i)=>`<div class="data-row"><div><strong>${esc(r.name)}</strong><small>${esc(r.permissions)}</small></div><div><strong>${esc(r.level)}</strong><small>${esc(r.scope)}</small></div><div><strong>${r.users}</strong><small>Assigned</small></div><div>${pill(r.status)}</div></div>`).join('')}</div></section>
        <section class="panel glass-card embedded-panel-v32"><div class="panel-head"><div><h2>Security snapshot</h2><p>MFA and sensitive access controls.</p></div><button class="small-btn ghost" data-rbac-tab-jump="security">Open Security</button></div><div class="placeholder-grid compact-cards">${security.slice(0,4).map(s=>`<article><strong>${esc(s.policy)}</strong><small>${esc(s.note)}</small>${pill(s.status)}</article>`).join('')}</div></section>
      </div>
    `;
  }

  function usersTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>User Directory</h2><p class="muted">Governance view of role, tenant/client boundary, plant scope, MFA, risk and last activity.</p></div><div class="rbac-head-actions"><button class="small-btn ghost" data-toast="Access review exported">Export Review</button><button class="small-btn primary" data-rbac-action="invite">Invite User</button></div></div>
      <div class="toolbar rbac-toolbar"><input id="rbacSearch" placeholder="Search user, role, tenant, client..." /><select id="rbacStatus"><option value="">All statuses</option><option>Active</option><option>Invited</option><option>Suspended</option></select><select id="rbacScope"><option value="">All scopes</option><option>Global</option><option>Tenant</option><option>Client</option><option>Plant</option><option>Plant group</option></select></div>
      <div id="rbacUserTableWrap">${userTable(users)}</div>
    `;
  }

  function rolesTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Role Registry</h2><p class="muted">Reusable role templates with scope level, allowed modules, approval rule and sensitive access flags.</p></div><button class="small-btn primary" data-rbac-action="role">Create Role</button></div>
      <div class="data-table rbac-role-table"><div class="data-head"><span>Role Template</span><span>Scope</span><span>Users</span><span>Permission Summary</span><span>Approval</span><span>Actions</span></div>${roles.map((r,i)=>`<div class="data-row"><div><strong>${esc(r.name)}</strong><small>${r.sensitive==='Yes'?'Sensitive access · audit required':'Standard review'}</small></div><div><strong>${esc(r.level)}</strong><small>${esc(r.scope)}</small></div><div><strong>${r.users}</strong><small>Assigned users</small></div><div><strong>${esc(r.permissions)}</strong><small>${esc(r.modules.join(' · '))}</small></div><div>${pill(r.sensitive==='Yes'?'Sensitive':'Standard')}<small>${esc(r.approval)}</small></div><div class="row-actions single-action"><button class="secondary-action single-row-action" data-rbac-role="${i}">View Role</button></div></div>`).join('')}</div>
    `;
  }

  function matrixTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Permission Matrix</h2><p class="muted">Governance matrix for core Zentrid modules and role layers.</p></div><button class="small-btn ghost" data-toast="Permission matrix exported">Export Matrix</button></div>
      <div class="data-table rbac-matrix-table"><div class="data-head"><span>Module</span><span>Global Admin</span><span>Tenant Admin</span><span>Client Admin</span><span>Engineer</span><span>Viewer</span></div>${matrix.map(m=>`<div class="data-row"><div><strong>${esc(m.area)}</strong><small>Permission area</small></div><div><strong>${esc(m.global)}</strong></div><div><strong>${esc(m.tenant)}</strong></div><div><strong>${esc(m.client)}</strong></div><div><strong>${esc(m.engineer)}</strong></div><div><strong>${esc(m.viewer)}</strong></div></div>`).join('')}</div>
    `;
  }

  function policiesTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Scope Policies</h2><p class="muted">Rules that bind roles to platform, tenant, client, plant and sensitive actions.</p></div><button class="small-btn primary" data-rbac-action="policy">Add Policy</button></div>
      <div class="placeholder-grid rbac-policy-grid">${policies.map((p,i)=>`<article><div><strong>${esc(p.title)}</strong><small>${esc(p.text)}</small></div><div class="rbac-card-meta"><span>${esc(p.type)}</span>${pill(p.status)}<button class="small-btn ghost" type="button" data-rbac-policy="${i}">Open</button></div></article>`).join('')}</div>
    `;
  }

  function invitationsTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Invitations</h2><p class="muted">Pending, accepted and expired invitations across tenants and client scopes.</p></div><button class="small-btn primary" data-rbac-action="invite">Invite User</button></div>
      <div class="data-table rbac-invite-table"><div class="data-head"><span>Email</span><span>Tenant / Client</span><span>Role</span><span>Scope</span><span>Security</span><span>Actions</span></div>${invites.map((i,idx)=>`<div class="data-row"><div><strong>${esc(i.email)}</strong><small>${esc(i.note)}</small></div><div><strong>${esc(i.tenant)}</strong><small>${esc(i.client)}</small></div><div><strong>${esc(i.role)}</strong><small>Reviewer: ${esc(i.reviewer)}</small></div><div><strong>${esc(i.scope)}</strong></div><div>${pill(i.status)} ${pill(i.mfa)}<small>Expires: ${esc(i.expires)}</small></div><div class="row-actions single-action"><button class="secondary-action single-row-action" data-rbac-invite="${idx}">Review</button></div></div>`).join('')}</div>
    `;
  }

  function securityTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Security Policies</h2><p class="muted">MFA, session, sensitive action and export restrictions for access governance.</p></div><button class="small-btn ghost" data-toast="Security policy review queued">Run Review</button></div>
      <div class="data-table rbac-security-table"><div class="data-head"><span>Policy</span><span>Status</span><span>Scope</span><span>Enforcement</span><span>Note</span></div>${security.map(s=>`<div class="data-row"><div><strong>${esc(s.policy)}</strong></div><div>${pill(s.status)}</div><div><strong>${esc(s.scope)}</strong></div><div><strong>${esc(s.enforcement)}</strong></div><div><strong>${esc(s.note)}</strong></div></div>`).join('')}</div>
    `;
  }

  function auditTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Access Audit</h2><p class="muted">Immutable timeline for user, role, scope and security changes.</p></div><button class="small-btn ghost" data-toast="Audit export queued">Export Audit</button></div>
      <div class="commercial-audit-v78 rbac-audit rbac-audit-inline">${accessEvents.map(e=>`<article class="commercial-audit-item"><div class="commercial-audit-inline-main"><strong>${esc(e[0])}</strong><b>${esc(e[3])}</b><small>${esc(e[1])}</small></div><span class="rbac-audit-time">${esc(e[2])}</span>${pill(e[4])}</article>`).join('')}</div>
    `;
  }

  function versionsTab(): string {
    return `
      <div class="section-title-v17 rbac-section-head"><div><h2>Version History</h2><p class="muted">Every permission and role template change must be versioned and auditable.</p></div><button class="small-btn ghost" data-rbac-action="compare">Compare Versions</button></div>
      <div class="data-table rbac-version-table"><div class="data-head"><span>Version</span><span>Change Type</span><span>Date</span><span>Approved By</span><span>Change</span><span>Status</span></div>${versions.map(v=>`<div class="data-row"><div><strong>${esc(v.version)}</strong><small>Rollback available</small></div><div><strong>${esc(v.type)}</strong></div><div><strong>${esc(v.date)}</strong></div><div><strong>${esc(v.author)}</strong></div><div><strong>${esc(v.change)}</strong></div><div>${pill(v.status)}</div></div>`).join('')}</div>
    `;
  }

  function filteredUsers(): RbacUser[] {
    const q = ((document.getElementById('rbacSearch') as HTMLInputElement | null)?.value || '').toLowerCase();
    const status = (document.getElementById('rbacStatus') as HTMLSelectElement | null)?.value || '';
    const scope = (document.getElementById('rbacScope') as HTMLSelectElement | null)?.value || '';
    return users.filter(u => {
      const hay = `${u.name} ${u.email} ${u.tenant} ${u.client} ${u.role} ${u.scope} ${u.template}`.toLowerCase();
      return (!q || hay.includes(q)) && (!status || u.status === status) && (!scope || u.scopeLevel === scope);
    });
  }

  function userTable(list: RbacUser[], compact = false): string {
    const rows = list.map(u=>`<div class="data-row clickable-row" data-open-user="${esc(u.id)}"><div><strong>${esc(u.name)}</strong><small>${esc(u.email)}<br>${esc(u.id)}</small></div><div><strong>${esc(u.role)}</strong><small>${esc(u.template)}</small></div><div><strong>${esc(u.tenant)}</strong><small>${esc(u.client)}</small></div><div><strong>${esc(u.scopeLevel)}</strong><small>${esc(u.scope)}</small></div><div>${pill(u.status)} ${pill(u.mfa)}<small>Last login: ${esc(u.last)}<br>Risk: ${esc(u.risk)}</small></div><div class="row-actions single-action"><button class="secondary-action single-row-action" data-open-user="${esc(u.id)}">View Access</button></div></div>`).join('');
    return `<div class="data-table rbac-user-table ${compact?'compact-table':''}"><div class="data-head"><span>User</span><span>Role / Template</span><span>Tenant / Client</span><span>Access Scope</span><span>Security</span><span>Actions</span></div>${rows || `<div class="data-row"><div><strong>No users found</strong><small>Try another filter.</small></div></div>`}</div>`;
  }

  function drawUsers(): void { const wrap = document.getElementById('rbacUserTableWrap'); if (wrap) wrap.innerHTML = userTable(filteredUsers()); }

  function drawerShell(title: string, body: string, actions = ''): void {
    openDrawer(title, `<div class="drawer-body rbac-drawer-body">${body}</div>${actions ? `<div class="drawer-actions rbac-drawer-actions">${actions}</div>` : ''}`);
  }
  function openDrawer(title: string, body: string): void {
    const drawer = document.getElementById('rbacDrawer');
    const content = document.getElementById('rbacDrawerContent');
    if (!drawer || !content) return;
    content.innerHTML = `<div class="drawer-head"><div><p class="eyebrow">User & Access Governance</p><h2>${esc(title)}</h2></div></div>${body}`;
    drawer.classList.add('open');
  }

  function inviteDrawer(): void {
    drawerShell('Invite User', `
      <div class="rbac-step-list"><article><b>1</b><div><strong>Identity</strong><small>Email and display name</small></div></article><article><b>2</b><div><strong>Access</strong><small>Role template and scope</small></div></article><article><b>3</b><div><strong>Security</strong><small>MFA, expiry and review</small></div></article></div>
      <div class="form-grid wizard-step active rbac-form-grid">
        <label>Email<input value="new.user@example.com" /></label>
        <label>Display Name<input value="New User" /></label>
        <label>Tenant<select><option>Tenant Alpha Energy</option><option>Tenant North Operations</option><option>Tenant Gamma Grid</option></select></label>
        <label>Client<select><option>Arpi Solar Group</option><option>Valley Solar Holdings</option><option>Gamma Grid Holdings</option></select></label>
        <label>Role Template<select>${roles.map(r=>`<option>${esc(r.name)}</option>`).join('')}</select></label>
        <label>Scope Level<select><option>Client</option><option>Plant</option><option>Plant group</option><option>Tenant</option></select></label>
        <label class="full">Allowed Scope<textarea>Assigned plants: PL-ARM-001, PL-ARM-003, PL-ARM-010</textarea></label>
        <label>MFA Policy<select><option>Required before first login</option><option>Required after first login</option><option>Optional</option></select></label>
        <label>Invitation Expiry<select><option>7 days</option><option>14 days</option><option>30 days</option></select></label>
        <label class="full">Governance Note<textarea>Access requires tenant/client owner approval and will be logged in access audit.</textarea></label>
      </div>`,
      `<button class="secondary-action" data-rbac-close>Cancel</button><button class="primary-action" data-toast="Invitation draft saved">Save Draft</button><button class="primary-action" data-toast="Invitation sent and queued for audit">Send Invitation</button>`
    );
  }

  function createRoleWizard(): void {
    drawerShell('Create Role', `
      <div class="rbac-role-wizard">
      <div class="rbac-step-list rbac-step-list-wide">
        <article><b>1</b><div><strong>Role Info</strong><small>Name, code and role type</small></div></article>
        <article><b>2</b><div><strong>Scope</strong><small>Global, tenant, client or plant</small></div></article>
        <article><b>3</b><div><strong>Modules</strong><small>Zentrid workspaces</small></div></article>
        <article><b>4</b><div><strong>Actions</strong><small>Allowed operations</small></div></article>
        <article><b>5</b><div><strong>Security</strong><small>MFA, approval and audit</small></div></article>
      </div>
      <div class="form-grid wizard-step active rbac-form-grid">
        <label>Role Name<input placeholder="Example: Client Finance Approver" /></label>
        <label>Role Code<input placeholder="CLIENT_FINANCE_APPROVER" /></label>
        <label>Role Type<select><option>Internal Zentrid role</option><option>Tenant role</option><option>Client role</option><option>External service role</option></select></label>
        <label>Default Status<select><option>Draft</option><option>Active after approval</option><option>Inactive</option></select></label>
        <label class="full">Description<textarea placeholder="Explain what this role is allowed to do and why it exists."></textarea></label>
        <label>Scope Level<select><option>Global</option><option>Tenant</option><option>Client</option><option>Plant</option><option>Plant group</option><option>Device</option></select></label>
        <label>Scope Binding<select><option>Explicit assignment required</option><option>Inherited from tenant</option><option>Inherited from client</option><option>All platform objects</option></select></label>
        <label class="full">Scope Rule<textarea placeholder="Example: User can access only assigned client plants, documents, invoices and reports."></textarea></label>
      </div>
      <h3>Module access</h3>
      <div class="rbac-check-grid">${roleModules.map((m,i)=>`<label><input type="checkbox" ${i<3?'checked':''}/> <span>${esc(m)}</span></label>`).join('')}</div>
      <h3>Allowed actions</h3>
      <div class="rbac-check-grid compact">${roleActions.map((a,i)=>`<label><input type="checkbox" ${i===0?'checked':''}/> <span>${esc(a)}</span></label>`).join('')}</div>
      <h3>Security & governance</h3>
      <div class="form-grid wizard-step active rbac-form-grid">
        <label>MFA Requirement<select><option>Required</option><option>Required for sensitive actions only</option><option>Optional</option></select></label>
        <label>Approval Flow<select><option>Security approval required</option><option>Tenant owner approval required</option><option>No approval</option></select></label>
        <label>Sensitive Role<select><option>No</option><option>Yes</option></select></label>
        <label>Audit Policy<select><option>Audit every action</option><option>Audit sensitive actions only</option><option>Standard audit</option></select></label>
      </div>
      </div>`,
      `<button class="secondary-action" data-rbac-close>Cancel</button><button class="secondary-action" data-toast="Role draft saved">Save Draft</button><button class="primary-action" data-toast="Role template sent to approval queue">Create Role</button>`
    );
  }

  function roleDrawer(index: number | null = null): void {
    const r = index === null ? roles[0] : roles[index];
    if (!r) return notify('Role template not found');
    drawerShell(`${r.name} · Role Detail`, `
      <div class="info-grid rbac-info-grid"><div><span>Scope Level</span><strong>${esc(r.level)}</strong><small>${esc(r.scope)}</small></div><div><span>Assigned Users</span><strong>${esc(r.users ?? 0)}</strong><small>${esc(r.status)}</small></div><div><span>Approval Rule</span><strong>${esc(r.approval)}</strong></div><div><span>Sensitive</span><strong>${esc(r.sensitive)}</strong><small>${r.sensitive === 'Yes' ? 'Audit required' : 'Standard review'}</small></div></div>
      <div class="detail-section-spacer-v32"></div>
      <h3>Allowed modules</h3>
      <div class="placeholder-grid compact-cards rbac-drawer-cards">${r.modules.map(m=>`<article><strong>${esc(m)}</strong><small>Allowed inside ${esc(r.level)} scope.</small></article>`).join('')}</div>
      <div class="detail-section-spacer-v32"></div>
      <h3>Permission summary</h3><p class="muted">${esc(r.permissions)}</p>
      <div class="detail-section-spacer-v32"></div>
      <h3>Governance meaning</h3><p class="muted">This screen is for viewing or editing an existing role template. New roles are created from the Create Role wizard, starting from empty fields and least-privilege defaults.</p>`,
      `<button class="secondary-action" data-toast="Role review requested">Request Review</button><button class="secondary-action" data-rbac-action="compare">Compare Versions</button><button class="primary-action" data-toast="Role template saved">Save Changes</button>`
    );
  }

  function compareVersionsDrawer(): void {
    drawerShell('Compare RBAC Versions', `
      <div class="form-grid wizard-step active rbac-form-grid">
        <label>Base Version<select>${versions.slice().reverse().map(v=>`<option>${esc(v.version)} · ${esc(v.date)}</option>`).join('')}</select></label>
        <label>Target Version<select>${versions.map(v=>`<option>${esc(v.version)} · ${esc(v.date)}</option>`).join('')}</select></label>
      </div>
      <div class="detail-section-spacer-v32"></div>
      <h3>Detected changes</h3>
      <div class="data-table rbac-diff-table"><div class="data-head"><span>Change</span><span>Permission / Scope</span><span>Before</span><span>After</span><span>Impact</span></div>${versionDiff.map(d=>`<div class="data-row"><div><strong>${esc(d[0])}</strong></div><div><strong>${esc(d[1])}</strong></div><div><strong>${esc(d[2])}</strong></div><div><strong>${esc(d[3])}</strong></div><div><strong>${esc(d[4])}</strong></div></div>`).join('')}</div>
      <div class="detail-section-spacer-v32"></div>
      <h3>Summary</h3><p class="muted">Compare Versions is used before approving RBAC changes. It shows added permissions, removed permissions, scope changes and new security requirements so Global Admin can approve safely.</p>`,
      `<button class="secondary-action" data-toast="Version diff exported">Export Diff</button><button class="primary-action" data-toast="Version comparison attached to approval">Attach to Review</button>`
    );
  }

  function policyDrawer(index: number): void {
    const p = policies[index];
    if (!p) return notify('Policy not found');
    drawerShell(p.title, `<div class="info-grid rbac-info-grid"><div><span>Type</span><strong>${esc(p.type)}</strong></div><div><span>Status</span><strong>${esc(p.status)}</strong><small>Owner: ${esc(p.owner)}</small></div><div class="full"><span>Rule</span><strong>${esc(p.rule)}</strong></div><div class="full"><span>Description</span><strong>${esc(p.text)}</strong></div></div>`, `<button class="secondary-action" data-toast="Policy review opened">Request Review</button><button class="primary-action" data-toast="Policy saved">Save Policy</button>`);
  }

  function inviteReviewDrawer(index: number): void {
    const i = invites[index];
    if (!i) return notify('Invitation not found');
    drawerShell('Invitation Review', `<div class="info-grid rbac-info-grid"><div><span>Email</span><strong>${esc(i.email)}</strong></div><div><span>Status</span><strong>${esc(i.status)}</strong><small>Expires: ${esc(i.expires)}</small></div><div><span>Tenant</span><strong>${esc(i.tenant)}</strong><small>${esc(i.client)}</small></div><div><span>Role</span><strong>${esc(i.role)}</strong><small>MFA: ${esc(i.mfa)}</small></div><div class="full"><span>Scope</span><strong>${esc(i.scope)}</strong></div><div class="full"><span>Review note</span><strong>${esc(i.note)}</strong></div></div>`, `<button class="secondary-action" data-toast="Invitation resent">Resend</button><button class="secondary-action" data-toast="Invitation revoked">Revoke</button><button class="primary-action" data-toast="Invitation approved">Approve</button>`);
  }

  function updateActiveTabs(): void {
    document.querySelectorAll('[data-rbac-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.rbacTab === activeTab));
  }

  function handleAction(type: string | undefined): void {
    if (type === 'invite') inviteDrawer();
    if (type === 'role') createRoleWizard();
    if (type === 'compare') compareVersionsDrawer();
    if (type === 'policy') drawerShell('Add Scope Policy', `<div class="form-grid wizard-step active rbac-form-grid"><label>Policy Name<input value="New policy" /></label><label>Policy Type<select><option>Scope boundary</option><option>Approval</option><option>Security</option></select></label><label class="full">Rule<textarea>Describe the rule and affected role/scope.</textarea></label><label>Owner<select><option>Security Office</option><option>Tenant Governance</option><option>Client Governance</option></select></label><label>Status<select><option>Draft</option><option>Active</option></select></label></div>`, `<button class="primary-action" data-toast="Policy draft saved">Save Draft</button>`);
  }

  function bindRoot(): void {
    const root = document.getElementById('rbacRoot');
    if (!root || root.dataset.rbacBound === 'true') return;
    root.dataset.rbacBound = 'true';
    root.addEventListener('click', e => {
      const target = e.target as Element | null;
      if (!target) return;
      const tab = target.closest<HTMLElement>('[data-rbac-tab]');
      if (tab) {
        const nextTab = tab.dataset.rbacTab as RbacTab | undefined;
        if (nextTab && nextTab !== activeTab) {
          activeTab = nextTab;
          localStorage.setItem('zentrid_rbac_tab', activeTab);
          updateActiveTabs();
          drawTab();
        }
        return;
      }
      const jump = target.closest<HTMLElement>('[data-rbac-tab-jump]');
      if (jump?.dataset.rbacTabJump) { activeTab = jump.dataset.rbacTabJump as RbacTab; localStorage.setItem('zentrid_rbac_tab', activeTab); updateActiveTabs(); drawTab(); return; }
      const actionBtn = target.closest<HTMLElement>('[data-rbac-action]'); if (actionBtn) { handleAction(actionBtn.dataset.rbacAction); return; }
      const toastBtn = target.closest<HTMLElement>('[data-toast]'); if (toastBtn) notify(toastBtn.dataset.toast);
      const userBtn = target.closest<HTMLElement>('[data-open-user]'); if (userBtn) openUser(userBtn.dataset.openUser);
      const roleBtn = target.closest<HTMLElement>('[data-rbac-role]'); if (roleBtn) roleDrawer(Number(roleBtn.dataset.rbacRole));
      const policyBtn = target.closest<HTMLElement>('[data-rbac-policy]'); if (policyBtn) policyDrawer(Number(policyBtn.dataset.rbacPolicy));
      const inviteBtn = target.closest<HTMLElement>('[data-rbac-invite]'); if (inviteBtn) inviteReviewDrawer(Number(inviteBtn.dataset.rbacInvite));
      const closeBtn = target.closest<HTMLElement>('[data-rbac-close]'); if (closeBtn) document.getElementById('rbacDrawer')?.classList.remove('open');
    });
  }

  function bindTab(): void {
    document.getElementById('rbacSearch')?.addEventListener('input', drawUsers);
    document.getElementById('rbacStatus')?.addEventListener('change', drawUsers);
    document.getElementById('rbacScope')?.addEventListener('change', drawUsers);
  }

  function selectedUser(): RbacUser {
    const fallback = users[1] || users[0];
    if (!fallback) throw new Error('At least one RBAC user is required');
    const id = localStorage.getItem('zentrid_selected_access_user') || fallback.id;
    return users.find(x => x.id === id) || fallback;
  }
  function detailTab(name: string, active = false): string { return `<button class="${active?'active':''}" type="button" data-detail-tab="${name}">${name}</button>`; }
  function renderDetail(): void {
    const root = document.getElementById('rbacDetailRoot'); if (!root) return; const u = selectedUser();
    root.innerHTML = `
      <section class="page-hero rbac-hero"><div><p class="eyebrow">Global Admin · Access Detail</p><h1>${esc(u.name)}</h1><p class="muted">${esc(u.email)} · ${esc(u.id)}</p></div><button class="freshness-card" type="button" onclick="history.back()"><span class="pulse"></span><div><strong>Back</strong><small>Return to RBAC center</small></div></button></section>
      <section class="client-layout-v17 detail-layout-standard rbac-detail-layout"><aside class="glass-card client-side-card-v17"><h3>Access Navigation</h3>${detailTab('Access Profile',true)}${detailTab('Allowed Modules')}${detailTab('Scope Boundaries')}${detailTab('Governance Checks')}${detailTab('Activity')}</aside><section class="glass-card client-main-card-v17"><div class="detail-content-head-v32"><div><h2>Access Profile</h2><p class="muted">Governance snapshot for this user: identity, role, scope, security and audit readiness.</p></div><div class="rbac-head-actions"><button type="button" class="small-btn ghost" onclick="FleetLayout.toast('Access review exported')">Export Review</button><button type="button" class="small-btn primary" onclick="FleetLayout.toast('Access review requested')">Request Review</button></div></div><div class="info-grid rbac-info-grid"><div><span>Status</span><strong>${esc(u.status)}</strong><small>MFA: ${esc(u.mfa)}</small></div><div><span>Role Template</span><strong>${esc(u.template)}</strong><small>${esc(u.role)}</small></div><div><span>Tenant</span><strong>${esc(u.tenant)}</strong><small>Client: ${esc(u.client)}</small></div><div><span>Scope</span><strong>${esc(u.scopeLevel)}</strong><small>${esc(u.scope)}</small></div><div><span>Last Login</span><strong>${esc(u.last)}</strong><small>Review: ${esc(u.review)}</small></div><div><span>Risk</span><strong>${esc(u.risk)}</strong><small>Access expires: ${esc(u.expires)}</small></div></div><div class="detail-section-spacer-v32"></div><div class="module-grid rbac-two-col"><section class="panel glass-card embedded-panel-v32"><div class="panel-head"><div><h2>Allowed modules</h2><p>Derived from assigned role template and scope.</p></div></div><div class="placeholder-grid compact-cards rbac-drawer-cards">${u.modules.map(x=>`<article><strong>${esc(x)}</strong><small>Allowed within ${esc(u.scopeLevel)} scope.</small></article>`).join('')}</div></section><section class="panel glass-card embedded-panel-v32"><div class="panel-head"><div><h2>Governance checks</h2><p>What Global Admin should monitor.</p></div></div><div class="data-table rbac-check-table"><div class="data-head"><span>Check</span><span>Status</span><span>Note</span></div>${[['MFA policy', u.mfa === 'Enabled' ? 'Passed' : 'Attention', 'Required for admin and finance templates'],['Scope boundary','Passed',u.scope],['Last review',u.review.includes('Blocked')?'Blocked':'Open',u.review],['Sensitive role',u.role.includes('Admin')?'Sensitive':'Standard','Audit trail enabled'],['Restrictions','Review',u.restrictions.join(' · ')]].map(r=>`<div class="data-row"><div><strong>${esc(r[0])}</strong></div><div>${pill(r[1])}</div><div><strong>${esc(r[2])}</strong></div></div>`).join('')}</div></section></div></section></section>`;
  }
  return { render, renderDetail };
})();
