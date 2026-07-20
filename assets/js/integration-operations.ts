interface IntegrationOperationConnectorV54 {
  id: string;
  name: string;
  vendor: string;
  scope: string;
  status: string;
  health: string;
  freshness: string;
  lastSync: string;
  nextSync: string;
  lag: string;
  errorRate: string;
  queue: number;
  owner: string;
}

interface IntegrationOperationJobV54 {
  id: string;
  connector: string;
  type: string;
  stage: string;
  status: string;
  duration: string;
  records: string;
  started: string;
}

interface IntegrationOperationFailureV54 {
  connector: string;
  error: string;
  impact: string;
  time: string;
  severity: string;
  action: string;
}

interface IntegrationOperationQueueItemV54 {
  label: string;
  value: string;
  note: string;
}

interface IntegrationOperationTimelineItemV54 {
  time: string;
  text: string;
  meta: string;
}

const V55 = (() => {
  const connectors: IntegrationOperationConnectorV54[] = [
    { id:'CON-HUAWEI-EU', name:'Huawei FusionSolar EU', vendor:'Huawei', scope:'18 tenants · 142 plants', status:'Healthy', health:'99.7%', freshness:'Fresh', lastSync:'2 min ago', nextSync:'in 3 min', lag:'1m', errorRate:'0.2%', queue:0, owner:'Integration Team' },
    { id:'CON-SUNGROW-01', name:'Sungrow iSolarCloud', vendor:'Sungrow', scope:'7 tenants · 64 plants', status:'Warning', health:'94.1%', freshness:'Delayed', lastSync:'17 min ago', nextSync:'in 8 min', lag:'18m', errorRate:'2.4%', queue:32, owner:'Data Ops' },
    { id:'CON-SOLAREDGE-EU', name:'SolarEdge Monitoring EU', vendor:'SolarEdge', scope:'5 tenants · 38 plants', status:'Healthy', health:'99.9%', freshness:'Fresh', lastSync:'1 min ago', nextSync:'in 4 min', lag:'45s', errorRate:'0.1%', queue:2, owner:'Integration Team' },
    { id:'CON-TESLA-BESS', name:'Tesla PowerHub BESS', vendor:'Tesla', scope:'2 tenants · 9 storage plants', status:'Critical', health:'61.2%', freshness:'Stale', lastSync:'2 h ago', nextSync:'manual', lag:'2h 04m', errorRate:'18.6%', queue:84, owner:'Platform Support' },
    { id:'CON-GOODWE-DE', name:'GoodWe SEMS Germany', vendor:'GoodWe', scope:'4 tenants · 29 plants', status:'Healthy', health:'98.8%', freshness:'Fresh', lastSync:'4 min ago', nextSync:'in 1 min', lag:'2m', errorRate:'0.4%', queue:3, owner:'Integration Team' }
  ];

  const jobs: IntegrationOperationJobV54[] = [
    { id:'JOB-9081', connector:'Huawei FusionSolar EU', type:'Full Sync', stage:'Core Write', status:'Success', duration:'34s', records:'31,902', started:'10:21' },
    { id:'JOB-9080', connector:'Huawei FusionSolar EU', type:'Incremental Sync', stage:'Telemetry', status:'Success', duration:'4s', records:'2,184', started:'10:18' },
    { id:'JOB-9079', connector:'Tesla PowerHub BESS', type:'Discovery', stage:'Authentication', status:'Failed', duration:'21s', records:'0', started:'10:11' },
    { id:'JOB-9078', connector:'Sungrow iSolarCloud', type:'Metrics Sync', stage:'Validation', status:'Success', duration:'6s', records:'6,420', started:'10:05' },
    { id:'JOB-9077', connector:'SolarEdge Monitoring EU', type:'Alert Sync', stage:'Mapping', status:'Success', duration:'8s', records:'318', started:'09:58' }
  ];

  const failed: IntegrationOperationFailureV54[] = [
    { connector:'Tesla PowerHub BESS', error:'Authentication failed', impact:'BESS telemetry stopped', time:'10:11', severity:'Critical', action:'Refresh credentials' },
    { connector:'Sungrow iSolarCloud', error:'API timeout', impact:'Delayed metrics for 32 payloads', time:'09:57', severity:'Warning', action:'Retry queue' },
    { connector:'Huawei FusionSolar EU', error:'Invalid mapping', impact:'7 alerts sent to exception queue', time:'09:42', severity:'Warning', action:'Open mapping' },
    { connector:'GoodWe SEMS Germany', error:'Duplicate checksum', impact:'3 telemetry buckets skipped', time:'08:36', severity:'Info', action:'View log' }
  ];

  const queue: IntegrationOperationQueueItemV54[] = [
    { label:'Pending Jobs', value:'128', note:'Waiting for scheduler window' },
    { label:'Running', value:'17', note:'Active ingestion jobs' },
    { label:'Failed', value:'4', note:'Needs operator action' },
    { label:'Retry Queue', value:'11', note:'Recoverable payloads' }
  ];

  const timeline: IntegrationOperationTimelineItemV54[] = [
    { time:'10:22', text:'Huawei FusionSolar sync completed', meta:'31,902 records written to core' },
    { time:'10:19', text:'Sungrow metrics imported', meta:'Validation passed with 2 warnings' },
    { time:'10:11', text:'Tesla authentication failed', meta:'Credentials expired or revoked' },
    { time:'09:54', text:'SolarEdge discovery completed', meta:'38 plants · 482 devices discovered' },
    { time:'09:42', text:'Huawei alert mapping exception', meta:'7 unknown alert codes routed to Data Governance' }
  ];

  function tone(status: string): string {
    const s = String(status || '').toLowerCase();
    if (['healthy','fresh','success','completed','info'].some(x => s.includes(x))) return 'good';
    if (['critical','failed','stale'].some(x => s.includes(x))) return 'bad';
    return 'warn';
  }
  function badge(text: string): string { return `<span class="badge ${tone(text)}">${text}</span>`; }

  function connectorRow(c: IntegrationOperationConnectorV54): string {
    return `<div class="data-row ops-row-v56">
      <div><strong>${c.name}</strong><small>${c.id} · ${c.vendor}</small></div>
      ${badge(c.status)}
      <div><strong>${c.health}</strong><small>${c.errorRate} failures</small></div>
      ${badge(c.freshness)}
      <div><strong>${c.lastSync}</strong><small>next ${c.nextSync}</small></div>
      <div><strong>${c.queue}</strong><small>${c.lag} lag</small></div>
      <div><strong>${c.owner}</strong><small>${c.scope}</small></div>
    </div>`;
  }

  function jobRow(j: IntegrationOperationJobV54): string {
    return `<div class="data-row ops-job-row-v56">
      <div><strong>${j.id}</strong><small>${j.started} · ${j.connector}</small></div>
      <div><strong>${j.type}</strong><small>${j.stage}</small></div>
      ${badge(j.status)}
      <div>${j.duration}</div>
      <div>${j.records}</div>
    </div>`;
  }

  function failedRow(f: IntegrationOperationFailureV54): string {
    return `<div class="data-row ops-failed-row-v56">
      <div><strong>${f.connector}</strong><small>${f.time} · ${f.impact}</small></div>
      ${badge(f.severity)}
      <div><strong>${f.error}</strong><small>${f.action}</small></div>
      <div class="row-actions"><button onclick="ZentridLayout.toast('Retry requested for ${f.connector}')">Retry</button><button onclick="ZentridLayout.toast('Opening operation log')">View Log</button><button onclick="ZentridLayout.toast('Escalation created')">Escalate</button></div>
    </div>`;
  }

  function render(): void {
    const healthy = connectors.filter(c => c.status === 'Healthy').length;
    const warning = connectors.filter(c => c.status === 'Warning').length;
    const critical = connectors.filter(c => c.status === 'Critical').length;
    const queued = connectors.reduce((sum, c) => sum + Number(c.queue || 0), 0);

    ZentridLayout.mount(`
      ${V51.hero('Global Admin · Integration Governance', 'Connector Operations', 'Operational command center for live connector health, sync jobs, failed operations, queues and timeline. Registry/setup data stays in Connector Registry.', 'Live operations')}

      ${V51.kpis([
        {label:'Healthy Connectors', value:String(healthy), note:'Adapters running normally'},
        {label:'Warning', value:String(warning), note:'Delayed or partial data'},
        {label:'Critical', value:String(critical), note:'Manual intervention required'},
        {label:'Queued Payloads', value:String(queued), note:'Pending + retry workload'}
      ])}

      <section class="panel glass-card">
        <div class="panel-head"><div><h2>Connector Health</h2><p>Shows how active integrations are operating right now: health, freshness, lag, errors and queue pressure.</p></div><div class="row-actions"><button onclick="ZentridLayout.toast('Health checks refreshed')">Refresh</button><button onclick="ZentridLayout.toast('Manual sync requested')">Run Sync</button></div></div>
        <div class="data-table"><div class="data-head ops-row-v56"><span>Connector</span><span>Status</span><span>Health</span><span>Freshness</span><span>Last Sync</span><span>Queue</span><span>Owner / Scope</span></div>${connectors.map(connectorRow).join('')}</div>
      </section>

      <section class="module-grid ops-two-col-v56">
        <div class="panel glass-card">
          <div class="panel-head"><div><h2>Sync Jobs</h2><p>Recent full, incremental, discovery, metrics and alert sync executions.</p></div></div>
          <div class="data-table"><div class="data-head ops-job-row-v56"><span>Job</span><span>Type / Stage</span><span>Status</span><span>Duration</span><span>Records</span></div>${jobs.map(jobRow).join('')}</div>
        </div>
        <div class="panel glass-card">
          <div class="panel-head"><div><h2>Queue Monitoring</h2><p>Scheduler and retry workload that operations should watch.</p></div><button onclick="ZentridLayout.toast('Retry queue replay started')">Replay Retry Queue</button></div>
          <div class="queue-grid-v56">${queue.map(q => `<article><span>${q.label}</span><strong>${q.value}</strong><small>${q.note}</small></article>`).join('')}</div>
        </div>
      </section>

      <section class="panel glass-card">
        <div class="panel-head"><div><h2>Failed Operations</h2><p>Only actionable failures are shown here. Setup, credentials and vendor profile fields remain in Connector Registry.</p></div><button onclick="ZentridLayout.toast('Failure list exported')">Export Failures</button></div>
        <div class="data-table"><div class="data-head ops-failed-row-v56"><span>Connector</span><span>Severity</span><span>Error / Next Action</span><span>Actions</span></div>${failed.map(failedRow).join('')}</div>
      </section>

      <section class="panel glass-card">
        <div class="panel-head"><div><h2>Activity Timeline</h2><p>Recent operational events across connectors, jobs, mapping exceptions and ingestion pipeline.</p></div></div>
        <div class="ops-timeline-v56">${timeline.map(t => `<div><span>${t.time}</span><strong>${t.text}</strong><small>${t.meta}</small></div>`).join('')}</div>
      </section>
    `);
  }

  return { render };
})();

V55.render();
