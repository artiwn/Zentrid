interface AlertCrmInboxItemV54 { id: string; alert: string; plant: string; severity: string; status: string; age: string; case: string; }
interface AlertCrmCaseItemV54 { id: string; source: string; title: string; client: string; owner: string; priority: string; status: string; sla: string; }
interface AlertCrmTaskItemV54 { task: string; title: string; caseId: string; assignee: string; due: string; status: string; }
interface AlertCrmWorkOrderItemV54 { wo: string; caseId: string; type: string; team: string; schedule: string; status: string; }
interface AlertCrmEscalationItemV54 { rule: string; trigger: string; target: string; channel: string; status: string; }
interface AlertCrmResolutionItemV54 { name: string; category: string; used: string; owner: string; status: string; }
interface AlertCrmRcaItemV54 { caseId: string; cause: string; action: string; owner: string; status: string; }
interface AlertCrmSlaItemV54 { severity: string; response: string; resolution: string; escalation: string; status: string; }
interface AlertCrmActivityItemV54 { time: string; user: string; action: string; entity: string; status: string; }

(() => {
const alertInboxV126: AlertCrmInboxItemV54[] = [
      {id:'AL-90021', alert:'Inverter Offline', plant:'Arpi Plant 01', severity:'Critical', status:'New', age:'12 min', case:'Not created'},
      {id:'AL-90018', alert:'Low Performance', plant:'Arpi Rooftop 02', severity:'Warning', status:'Acknowledged', age:'38 min', case:'CASE-1048'},
      {id:'AL-90012', alert:'No Meter Data', plant:'Armavir Solar Field', severity:'Major', status:'New', age:'1 h 14 min', case:'Not created'},
      {id:'AL-89991', alert:'Gateway Delayed', plant:'Kotayk PV Plant', severity:'Minor', status:'Monitoring', age:'2 h 05 min', case:'CASE-1041'}
    ];
    const casesV126: AlertCrmCaseItemV54[] = [
      {id:'CASE-1048', source:'AL-90018', title:'Low performance investigation', client:'Arpi Solar Group', owner:'Lilit Hakobyan', priority:'High', status:'Investigating', sla:'On Track'},
      {id:'CASE-1041', source:'AL-89991', title:'Gateway reporting delay', client:'Kotayk Energy LLC', owner:'Aren Mkrtchyan', priority:'Medium', status:'Waiting Vendor', sla:'At Risk'},
      {id:'CASE-1037', source:'AL-89920', title:'Meter data mismatch', client:'Armavir Agro Solar', owner:'Finance Ops', priority:'High', status:'Open', sla:'Breached'}
    ];
    const tasksV126: AlertCrmTaskItemV54[] = [
      {task:'TASK-3312', title:'Check inverter communication logs', caseId:'CASE-1048', assignee:'Lilit Hakobyan', due:'Today · 16:00', status:'In Progress'},
      {task:'TASK-3308', title:'Request vendor gateway trace', caseId:'CASE-1041', assignee:'Aren Mkrtchyan', due:'Tomorrow · 11:00', status:'Open'},
      {task:'TASK-3301', title:'Verify meter export counters', caseId:'CASE-1037', assignee:'Finance Ops', due:'Overdue', status:'Blocked'}
    ];
    const workOrdersV126: AlertCrmWorkOrderItemV54[] = [
      {wo:'WO-2210', caseId:'CASE-1048', type:'Remote check', team:'L2 Operations', schedule:'Today', status:'Ready'},
      {wo:'WO-2204', caseId:'CASE-1041', type:'Vendor support', team:'Integration Ops', schedule:'Tomorrow', status:'Waiting'},
      {wo:'WO-2198', caseId:'CASE-1037', type:'On-plant inspection', team:'Field Team A', schedule:'18 Jun 2026', status:'Planned'}
    ];
    const escalationsV126: AlertCrmEscalationItemV54[] = [
      {rule:'Critical alert without case', trigger:'15 min', target:'Operations Manager', channel:'In-app · Email', status:'Active'},
      {rule:'SLA response breached', trigger:'Any high priority case', target:'Head of O&M', channel:'Email', status:'Active'},
      {rule:'Blocked task overdue', trigger:'2 h overdue', target:'Team Lead', channel:'In-app', status:'Review'}
    ];
    const resolutionsV126: AlertCrmResolutionItemV54[] = [
      {name:'Restart logger and verify child devices', category:'Connectivity', used:'18', owner:'L2 Operations', status:'Approved'},
      {name:'Re-sync meter counters from source', category:'Data quality', used:'9', owner:'Data Governance', status:'Approved'},
      {name:'Vendor ticket for inverter firmware issue', category:'Vendor', used:'4', owner:'Integration Ops', status:'Draft'}
    ];
    const rcaV126: AlertCrmRcaItemV54[] = [
      {caseId:'CASE-1048', cause:'Intermittent gateway communication', action:'Add gateway freshness monitoring', owner:'L2 Operations', status:'In Review'},
      {caseId:'CASE-1037', cause:'Meter timezone mismatch', action:'Normalize accounting timezone rule', owner:'Data Governance', status:'Approved'}
    ];
    const slaV126: AlertCrmSlaItemV54[] = [
      {severity:'Critical', response:'15 min', resolution:'4 h', escalation:'Ops Manager', status:'Active'},
      {severity:'Major', response:'1 h', resolution:'24 h', escalation:'Team Lead', status:'Active'},
      {severity:'Warning', response:'4 h', resolution:'72 h', escalation:'Queue owner', status:'Active'}
    ];
    const activityV126: AlertCrmActivityItemV54[] = [
      {time:'Today · 10:42', user:'Global Admin', action:'Created case from alert', entity:'CASE-1048', status:'Completed'},
      {time:'Today · 10:51', user:'Lilit Hakobyan', action:'Task accepted', entity:'TASK-3312', status:'Completed'},
      {time:'Today · 11:08', user:'System', action:'SLA warning raised', entity:'CASE-1041', status:'At Risk'}
    ];

    function tone(v: unknown): string {
      const value = String(v || '').toLowerCase();
      if(value.includes('active')||value.includes('approved')||value.includes('completed')||value.includes('ready')||value.includes('on track')) return 'success';
      if(value.includes('critical')||value.includes('breached')||value.includes('blocked')||value.includes('overdue')) return 'danger';
      if(value.includes('warning')||value.includes('major')||value.includes('high')||value.includes('risk')||value.includes('review')||value.includes('waiting')||value.includes('new')||value.includes('open')||value.includes('draft')) return 'warning';
      return 'info';
    }
    function badge(v: string): string { return `<span class="badge ${tone(v)}">${v}</span>`; }
    function toast(msg: string): void { if(window.FleetLayout && FleetLayout.toast) FleetLayout.toast(msg); else alert(msg); }
    function rowAction(label: string, js: string): string { return `<div class="row-actions alert-crm-actions-v126"><button class="small-btn" type="button" onclick="FleetAlertCRMv126.${js}">${label}</button></div>`; }
    function table(heads: string[], rows: string[], cls = 'alert-crm-table-v126'): string {
      return `<div class="data-table ${cls}"><div class="data-head">${heads.map(h=>`<span>${h}</span>`).join('')}</div>${rows.join('')}</div>`;
    }
    function actionPanel(): string {
      return `<div class="alert-crm-action-panel-v126">
        <button class="primary-action" type="button" onclick="FleetAlertCRMv126.toast('Create case wizard opened')">Create Case</button>
        <button class="secondary-action" type="button" onclick="FleetAlertCRMv126.toast('Task assignment panel opened')">Assign Task</button>
        <button class="secondary-action" type="button" onclick="FleetAlertCRMv126.toast('SLA rules review opened')">Review SLA</button>
        <button class="secondary-action" type="button" onclick="FleetAlertCRMv126.toast('Operations audit export prepared')">Export Activity</button>
      </div>`;
    }
    function overview(): string {
      return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Alert CRM Overview</h2><p class="muted">Turns technical alerts into managed cases, tasks, work orders, SLA controls and resolution history.</p></div><button class="primary-action" onclick="FleetAlertCRMv126.toast('Create case wizard opened')">Create Case</button></div>
      <section class="module-grid alert-crm-kpis-v126">
        <article class="module-card"><span>Open Alerts</span><strong>4</strong><small>2 need case creation</small></article>
        <article class="module-card"><span>Open Cases</span><strong>3</strong><small>1 SLA breached</small></article>
        <article class="module-card"><span>Active Tasks</span><strong>3</strong><small>1 blocked</small></article>
        <article class="module-card"><span>Work Orders</span><strong>3</strong><small>1 ready for dispatch</small></article>
      </section>
      <div class="alert-crm-flow-v126"><article><span>01</span><strong>Alert</strong><small>Incoming issue from monitoring.</small></article><article><span>02</span><strong>Case</strong><small>Operational ownership and priority.</small></article><article><span>03</span><strong>Task</strong><small>Assigned investigation step.</small></article><article><span>04</span><strong>Work Order</strong><small>Remote or field execution.</small></article><article><span>05</span><strong>Resolution</strong><small>Close, RCA and audit.</small></article></div>
      ${actionPanel()}
      <div class="section-title-v17 mini alert-crm-title-v126"><div><h3>Current Attention Queue</h3><p class="muted">Most urgent operational records that require action.</p></div></div>
      ${table(['Item','Source','Owner','Risk','Status','Actions'], [
        `<div class="data-row alert-crm-row-v126"><div><strong>CASE-1037</strong><small>Meter data mismatch</small></div><div><strong>AL-89920</strong><small>Armavir Agro Solar</small></div><div><strong>Finance Ops</strong><small>Billing impact</small></div><div>${badge('Breached')}</div><div>${badge('Open')}</div>${rowAction('Open',"open('Case','CASE-1037','SLA breached · meter counters')")}</div>`,
        `<div class="data-row alert-crm-row-v126"><div><strong>AL-90021</strong><small>Inverter Offline</small></div><div><strong>Arpi Plant 01</strong><small>No case yet</small></div><div><strong>Unassigned</strong><small>Critical alert</small></div><div>${badge('Critical')}</div><div>${badge('New')}</div>${rowAction('Create Case',"toast('Case created from AL-90021')")}</div>`
      ])}`;
    }
    function inbox(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Alert Inbox</h2><p class="muted">Incoming alerts before or after conversion into operational cases.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('Alert filters opened')">Filter Alerts</button></div>` + table(['Alert','Plant','Severity','Age','Case','Actions'], alertInboxV126.map(a=>`<div class="data-row alert-crm-row-v126"><div><strong>${a.alert}</strong><small>${a.id}</small></div><div><strong>${a.plant}</strong><small>${a.status}</small></div><div>${badge(a.severity)}</div><div><strong>${a.age}</strong><small>Active age</small></div><div>${a.case==='Not created'?badge(a.case):`<strong>${a.case}</strong><small>Linked case</small>`}</div>${rowAction(a.case==='Not created'?'Create Case':'Open Case',`open('Alert','${a.id}','${a.alert} · ${a.plant}')`)}</div>`)); }
    function cases(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Cases</h2><p class="muted">Case records group alerts, owners, tasks, work orders, SLA and resolution history.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('New case form opened')">Add Case</button></div>` + table(['Case','Client / Source','Owner','Priority','Status / SLA','Actions'], casesV126.map(c=>`<div class="data-row alert-crm-row-v126"><div><strong>${c.id}</strong><small>${c.title}</small></div><div><strong>${c.client}</strong><small>${c.source}</small></div><div><strong>${c.owner}</strong><small>Case owner</small></div><div>${badge(c.priority)}</div><div>${badge(c.status)}<small>${c.sla}</small></div>${rowAction('Open',`open('Case','${c.id}','${c.title} · ${c.client}')`)}</div>`)); }
    function tasks(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Staff Tasks</h2><p class="muted">Operational tasks assigned to engineers, finance or integration teams.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('Task editor opened')">Add Task</button></div>` + table(['Task','Case','Assignee','Due Date','Status','Actions'], tasksV126.map(t=>`<div class="data-row alert-crm-row-v126"><div><strong>${t.title}</strong><small>${t.task}</small></div><div><strong>${t.caseId}</strong><small>Parent case</small></div><div><strong>${t.assignee}</strong><small>Assigned owner</small></div><div><strong>${t.due}</strong><small>Due date</small></div><div>${badge(t.status)}</div>${rowAction('Open',`open('Task','${t.task}','${t.title} · ${t.assignee}')`)}</div>`)); }
    function workOrders(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Work Orders</h2><p class="muted">Remote, vendor or field execution records linked to cases.</p></div><button class="secondary-action" onclick="location.href='work-orders.html'">Open Work Order Oversight</button></div>` + table(['Work Order','Case','Type','Team','Schedule','Actions'], workOrdersV126.map(w=>`<div class="data-row alert-crm-row-v126"><div><strong>${w.wo}</strong><small>${w.status}</small></div><div><strong>${w.caseId}</strong><small>Linked case</small></div><div><strong>${w.type}</strong><small>Execution type</small></div><div><strong>${w.team}</strong><small>Responsible team</small></div><div>${badge(w.schedule)}</div>${rowAction('Open',`open('Work Order','${w.wo}','${w.type} · ${w.team}')`)}</div>`)); }
    function escalations(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Escalations</h2><p class="muted">Rules that move unresolved issues to higher responsibility levels.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('Escalation rule editor opened')">Add Rule</button></div>` + table(['Rule','Trigger','Escalate To','Channel','Status','Actions'], escalationsV126.map(e=>`<div class="data-row alert-crm-row-v126"><div><strong>${e.rule}</strong><small>Escalation rule</small></div><div><strong>${e.trigger}</strong><small>Trigger condition</small></div><div><strong>${e.target}</strong><small>Target owner</small></div><div><strong>${e.channel}</strong><small>Notification channel</small></div><div>${badge(e.status)}</div>${rowAction('Open',`open('Escalation Rule','${e.rule}','${e.trigger} → ${e.target}')`)}</div>`)); }
    function resolutions(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Resolution Library</h2><p class="muted">Reusable resolution playbooks and treatment notes for recurring issues.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('Resolution template editor opened')">Add Resolution</button></div>` + table(['Resolution','Category','Used','Owner','Status','Actions'], resolutionsV126.map(r=>`<div class="data-row alert-crm-row-v126"><div><strong>${r.name}</strong><small>Resolution playbook</small></div><div><strong>${r.category}</strong><small>Category</small></div><div><strong>${r.used}</strong><small>Usage count</small></div><div><strong>${r.owner}</strong><small>Owner</small></div><div>${badge(r.status)}</div>${rowAction('Open',`open('Resolution','${r.name}','${r.category} · used ${r.used} times')`)}</div>`)); }
    function rca(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Root Cause Analysis</h2><p class="muted">RCA records and preventive actions after case resolution.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('RCA editor opened')">Add RCA</button></div>` + table(['Case','Root Cause','Preventive Action','Owner','Status','Actions'], rcaV126.map(r=>`<div class="data-row alert-crm-row-v126"><div><strong>${r.caseId}</strong><small>Closed / resolving case</small></div><div><strong>${r.cause}</strong><small>Root cause</small></div><div><small>${r.action}</small></div><div><strong>${r.owner}</strong><small>Owner</small></div><div>${badge(r.status)}</div>${rowAction('Open',`open('RCA','${r.caseId}','${r.cause} · ${r.action}')`)}</div>`)); }
    function sla(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>SLA Rules</h2><p class="muted">Response and resolution targets by alert severity.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('SLA rule editor opened')">Add SLA Rule</button></div>` + table(['Severity','Response','Resolution','Escalation','Status','Actions'], slaV126.map(s=>`<div class="data-row alert-crm-row-v126"><div>${badge(s.severity)}<small>Severity</small></div><div><strong>${s.response}</strong><small>Response target</small></div><div><strong>${s.resolution}</strong><small>Resolution target</small></div><div><strong>${s.escalation}</strong><small>Escalation owner</small></div><div>${badge(s.status)}</div>${rowAction('Open',`open('SLA Rule','${s.severity}','Response ${s.response} · resolution ${s.resolution}')`)}</div>`)) + `<div class="section-title-v17 mini alert-crm-title-v126"><div><h3>SLA Handling</h3><p class="muted">How the workspace reacts when time targets are at risk.</p></div></div><div class="info-grid alert-crm-info-grid-v126"><div><span>Warning Threshold</span><strong>80% of SLA</strong><small>Case is marked At Risk before breach.</small></div><div><span>Auto Escalation</span><strong>Enabled</strong><small>Escalates by severity and owner.</small></div><div><span>Audit Required</span><strong>Yes</strong><small>Every breach and override is logged.</small></div><div><span>Client Visibility</span><strong>Case controlled</strong><small>Only customer-safe updates are shown.</small></div></div>`; }
    function activity(): string { return `<div class="section-title-v17 alert-crm-title-v126"><div><h2>Activity</h2><p class="muted">Operational audit trail across alerts, cases, tasks, work orders and SLA events.</p></div><button class="secondary-action" onclick="FleetAlertCRMv126.toast('Activity export prepared')">Export Activity</button></div>` + table(['Time','User','Action','Entity','Status','Actions'], activityV126.map(a=>`<div class="data-row alert-crm-row-v126"><div><strong>${a.time}</strong><small>Timestamp</small></div><div><strong>${a.user}</strong><small>Actor</small></div><div><strong>${a.action}</strong><small>Action</small></div><div><strong>${a.entity}</strong><small>Entity</small></div><div>${badge(a.status)}</div>${rowAction('Open',`open('Activity','${a.action}','${a.entity} · ${a.time}')`)}</div>`)); }
    function content(tab: string): string { return tab==='inbox'?inbox():tab==='cases'?cases():tab==='tasks'?tasks():tab==='workorders'?workOrders():tab==='escalations'?escalations():tab==='resolutions'?resolutions():tab==='rca'?rca():tab==='sla'?sla():tab==='activity'?activity():overview(); }
    window.FleetAlertCRMv126 = { toast, open(type: string, title: string, meta: string): void { toast(type+': '+title+' — '+meta); } };

    FleetLayout.mount(`<section class="page-hero"><div><p class="eyebrow">Global Admin · Operations Center</p><h1>Alert CRM & Staff Task Management</h1><p class="muted">Workspace for turning alerts into cases, staff tasks, work orders, escalations, SLA controls, resolutions and RCA records.</p></div><button class="secondary-action" onclick="location.href='incident-center.html'">Back to Incident Governance</button></section><section class="plant-workspace-v17 alert-crm-workspace-v126"><aside class="glass-card plant-side-card-v17 alert-crm-side-v126"><h3>Alert Operations</h3><button class="active" data-alert-crm-tab="overview">Overview</button><button data-alert-crm-tab="inbox">Alert Inbox</button><button data-alert-crm-tab="cases">Cases</button><button data-alert-crm-tab="tasks">Staff Tasks</button><button data-alert-crm-tab="workorders">Work Orders</button><button data-alert-crm-tab="escalations">Escalations</button><button data-alert-crm-tab="resolutions">Resolutions</button><button data-alert-crm-tab="rca">RCA</button><button data-alert-crm-tab="sla">SLA Rules</button><button data-alert-crm-tab="activity">Activity</button></aside><section class="glass-card plant-main-card-v17 alert-crm-main-card-v126" id="alertCrmContent">${content('overview')}</section></section>`);
    document.addEventListener('click', (e: MouseEvent) => { const target = e.target as Element | null; const b = target?.closest('[data-alert-crm-tab]'); if(!b) return; const contentRoot=document.getElementById('alertCrmContent'); if(!contentRoot) return; document.querySelectorAll('[data-alert-crm-tab]').forEach(x=>x.classList.toggle('active',x===b)); contentRoot.innerHTML=content((b as HTMLElement).dataset.alertCrmTab || 'overview'); });

})();
