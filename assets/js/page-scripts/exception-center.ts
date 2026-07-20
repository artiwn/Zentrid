(() => {
ZentridLayout.mount(`
      <section class="page-hero production-normalization-hero exception-center-hero">
        <div>
          <p class="eyebrow">Global Admin · Integration Hub · Data Governance</p>
          <h1>Exception Center</h1>
          <p class="muted">Operational queue for normalization failures across production, alerts, storage, mappings, units, timestamps and raw vendor payloads.</p>
        </div>
        <button class="freshness-card" onclick="ZentridLayout.toast('Exception Center: mock governance workspace only')">
          <span class="pulse"></span>
          <div><strong>1,742 open exceptions</strong><small>428 queued · 37 SLA risk</small></div>
        </button>
      </section>

      <section class="kpi-grid detail-kpis production-normalization-kpis exception-center-kpis">
        <button class="kpi-card red" onclick="ZentridLayout.toast('Open exceptions filtered')"><span>Open Exceptions</span><strong>1,742</strong><small>unknown plant/device, invalid unit, missing timestamp</small></button>
        <button class="kpi-card yellow" onclick="ZentridLayout.toast('Queued exceptions filtered')"><span>Queued Reprocess</span><strong>428</strong><small>ready after mapping correction</small></button>
        <button class="kpi-card green" onclick="ZentridLayout.toast('Resolved exceptions filtered')"><span>Resolved Today</span><strong>913</strong><small>corrected mapping + replay success</small></button>
        <button class="kpi-card blue" onclick="ZentridLayout.toast('SLA risk filtered')"><span>SLA Risk</span><strong>37</strong><small>high impact records awaiting owner</small></button>
      </section>

      <section class="panel glass-card production-workspace exception-center-workspace">
        <div class="panel-head">
          <div>
            <h2>Exception Management</h2>
            <p>Handle failed records before they affect analytics, billing, reports, alerts, SOP or operational dashboards.</p>
          </div>
          <div class="toolbar production-toolbar">
            <select id="exDomainFilter">
              <option>All domains</option>
              <option>Production</option>
              <option>Alerts</option>
              <option>Storage</option>
              <option>Mappings</option>
            </select>
            <select id="exSourceFilter">
              <option>All vendors</option>
              <option>Huawei FusionSolar</option>
              <option>GoodWe SEMS</option>
              <option>Sungrow iSolarCloud</option>
              <option>SolarEdge Monitoring</option>
            </select>
          </div>
        </div>

        <div class="detail-tabs production-tabs" id="exceptionTabs">
          <button class="active" data-tab="queue">Exception Queue</button>
          <button data-tab="types">Exception Types</button>
          <button data-tab="actions">Actions</button>
          <button data-tab="raw">Raw Payload</button>
          <button data-tab="mapping">Mapping Fix</button>
          <button data-tab="reprocess">Reprocess Queue</button>
          <button data-tab="ownership">Ownership & SLA</button>
          <button data-tab="audit">Audit</button>
        </div>

        <div class="pn-tab-panel active" data-panel="queue">
          <div class="mapping-note"><strong>Exception Queue:</strong> every row represents a failed normalization group. Actions are UI mock actions now; later they will call Data Governance APIs.</div>
          <div class="data-table pn-table ex-queue-table">
            <div class="data-head"><span>Exception</span><span>Source</span><span>Domain</span><span>Count</span><span>Owner</span><span>Actions</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Unknown plant exception opened')"><div><strong>Unknown Plant</strong><small>vendor plant id PLANT_EXT_884 has no internal match</small></div><div>Huawei FusionSolar</div><div>Production</div><div>342</div><div>Data Governance</div><div class="row-actions"><span>Correct Mapping</span><span>Assign Owner</span></div><div><span class="badge danger">Open</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Unknown device exception opened')"><div><strong>Unknown Device</strong><small>BMS rack id not bound to Zentrid device topology registry</small></div><div>GoodWe SEMS</div><div>Storage</div><div>188</div><div>Integration Team</div><div class="row-actions"><span>Open Mapping Rule</span><span>Escalate</span></div><div><span class="badge warning">Review</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Invalid unit exception opened')"><div><strong>Invalid Unit</strong><small>energy unit MWhh is not recognized by unit dictionary</small></div><div>SolarEdge</div><div>Production</div><div>104</div><div>Mapping Owner</div><div class="row-actions"><span>Correct Rule</span><span>Reprocess</span></div><div><span class="badge warning">Queued</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Missing timestamp exception opened')"><div><strong>Missing Timestamp</strong><small>alert payload has event text but no occurrence time</small></div><div>Sungrow iSolarCloud</div><div>Alerts</div><div>276</div><div>Vendor Adapter</div><div class="row-actions"><span>View Raw</span><span>Escalate</span></div><div><span class="badge danger">Blocked</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Duplicate record exception opened')"><div><strong>Duplicate Record</strong><small>same source hash found inside replay window</small></div><div>Solis Cloud</div><div>Alerts</div><div>890</div><div>System Rule</div><div class="row-actions"><span>Ignore</span><span>Reprocess</span></div><div><span class="badge info">Auto grouped</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Transformation error opened')"><div><strong>Transformation Error</strong><small>formula returned invalid PR value above allowed range</small></div><div>Fronius Solar.web</div><div>Production</div><div>49</div><div>Rule Owner</div><div class="row-actions"><span>Open Rule</span><span>Escalate</span></div><div><span class="badge warning">Needs fix</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="types">
          <div class="pn-card-grid">
            <article><strong>Identity</strong><small>Unknown Plant, Unknown Device, Missing Device Link</small></article>
            <article><strong>Data Shape</strong><small>Missing Timestamp, Missing Metric, Invalid Unit, Invalid Status</small></article>
            <article><strong>Processing</strong><small>Mapping Failure, Transformation Error, Duplicate Record</small></article>
          </div>
          <div class="data-table pn-table ex-types-table">
            <div class="data-head"><span>Type</span><span>Domain</span><span>Default Action</span><span>Severity</span><span>Route</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Exception type opened')"><div><strong>Unknown Plant</strong><small>source object cannot resolve to internal plant</small></div><div>All domains</div><div>Correct Mapping</div><div><span class="badge danger">High</span></div><div>Plant Mapping</div><div>Active</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Exception type opened')"><div><strong>Invalid Status</strong><small>vendor status does not match enum dictionary</small></div><div>Production / Alerts / Storage</div><div>Fallback UNKNOWN</div><div><span class="badge warning">Medium</span></div><div>Status Mapping</div><div>Active</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Exception type opened')"><div><strong>Mapping Failure</strong><small>rule exists but returned blocked output</small></div><div>All domains</div><div>Open Mapping Rule</div><div><span class="badge warning">Medium</span></div><div>Mapping Rules</div><div>Active</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Exception type opened')"><div><strong>Duplicate Record</strong><small>source hash or unique key already processed</small></div><div>All domains</div><div>Ignore / Merge</div><div><span class="badge info">Low</span></div><div>Validation Rules</div><div>Active</div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="actions">
          <div class="pn-rule-grid">
            <article><span>Reprocess</span><strong>Run record through pipeline again after rules are updated.</strong></article>
            <article><span>Correct Mapping</span><strong>Bind vendor id, field, status or unit to canonical Zentrid value.</strong></article>
            <article><span>Ignore</span><strong>Mark duplicate/noise as intentionally ignored with audit reason.</strong></article>
            <article><span>Escalate</span><strong>Send to integration owner, vendor adapter owner or data governance lead.</strong></article>
          </div>
          <div class="data-table pn-table ex-action-table">
            <div class="data-head"><span>Action</span><span>Allowed For</span><span>Required Input</span><span>Audit Required</span><span>Result</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Action policy opened')"><div><strong>Reprocess</strong><small>manual or bulk replay</small></div><div>Corrected mapping, duplicate, transient transform</div><div>exception id / batch id</div><div>Yes</div><div>new processing attempt</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Action policy opened')"><div><strong>Correct Mapping</strong><small>open mapping editor</small></div><div>unknown plant, device, unit, status</div><div>target canonical value</div><div>Yes</div><div>mapping rule update</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Action policy opened')"><div><strong>Ignore</strong><small>controlled discard</small></div><div>duplicate/noise records only</div><div>reason comment</div><div>Yes</div><div>ignored with audit trail</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Action policy opened')"><div><strong>Escalate</strong><small>assign responsible team</small></div><div>blocked or repeated exceptions</div><div>owner + SLA</div><div>Yes</div><div>task/escalation created</div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="raw">
          <div class="pn-preview">
            <article><span>Raw Vendor Payload</span><pre>{
  "plantId": "PLANT_EXT_884",
  "deviceSn": "INV-0091",
  "powerNow": 1500,
  "unit": "W",
  "timestamp": null
}</pre></article>
            <div class="pn-preview-arrow">blocked by</div>
            <article><span>Validation Failure</span><pre>timestamp_required = failed
plant_mapping = missing
exception_route = open</pre></article>
          </div>
          <div class="mapping-note"><strong>Raw Payload Viewer:</strong> shows the original vendor record, validation result, correlation id and processing path without losing vendor semantics.</div>
          <div class="data-table pn-table ex-raw-table">
            <div class="data-head"><span>Payload</span><span>Correlation ID</span><span>Source</span><span>Stage</span><span>Failure</span><span>Action</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Raw payload opened')"><div><strong>RAW-HUA-99281</strong><small>production snapshot</small></div><div>COR-20260615-884</div><div>Huawei</div><div>Validation</div><div>Missing timestamp</div><div>View Raw</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Raw payload opened')"><div><strong>RAW-GW-55021</strong><small>storage BMS payload</small></div><div>COR-20260615-550</div><div>GoodWe</div><div>Mapping</div><div>Unknown device</div><div>Open Mapping</div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="mapping">
          <div class="pn-preview ex-mapping-preview">
            <article><span>Vendor Reference</span><pre>PLANT_EXT_884
source: Huawei
confidence: 42%</pre></article>
            <div class="pn-preview-arrow">map to</div>
            <article><span>Zentrid Target</span><pre>ARM-PLT-001
Arpi Solar Group
Plant Code: ARM001</pre></article>
            <div class="pn-preview-arrow">then</div>
            <article><span>Replay Result</span><pre>342 records ready
estimated quality +1.4%</pre></article>
          </div>
          <div class="data-table pn-table ex-mapping-table">
            <div class="data-head"><span>Mapping Candidate</span><span>Vendor</span><span>Target</span><span>Confidence</span><span>Action</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Mapping candidate opened')"><div><strong>PLANT_EXT_884</strong><small>Unknown Plant</small></div><div>Huawei</div><div>ARM-PLT-001</div><div>92%</div><div>Approve + Reprocess</div><div><span class="badge warning">Pending</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Mapping candidate opened')"><div><strong>BMS_RACK_03</strong><small>Unknown Device</small></div><div>GoodWe</div><div>DEV-BESS-R03</div><div>88%</div><div>Approve Mapping</div><div><span class="badge warning">Pending</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Mapping candidate opened')"><div><strong>FAULT_EMERGENCY</strong><small>Missing severity</small></div><div>Sungrow</div><div>Critical</div><div>97%</div><div>Approve Rule</div><div><span class="badge good">Recommended</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="reprocess">
          <div class="data-table pn-table ex-reprocess-table">
            <div class="data-head"><span>Batch</span><span>Records</span><span>Domain</span><span>Trigger</span><span>Progress</span><span>Result</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Reprocess batch opened')"><div><strong>RP-20260615-004</strong><small>after plant mapping correction</small></div><div>342</div><div>Production</div><div>Manual</div><div>68%</div><div>232 valid / 110 pending</div><div><span class="badge info">Running</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Reprocess batch opened')"><div><strong>RP-20260615-003</strong><small>duplicate replay guard</small></div><div>890</div><div>Alerts</div><div>Auto</div><div>100%</div><div>870 ignored / 20 valid</div><div><span class="badge good">Completed</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Reprocess batch opened')"><div><strong>RP-20260615-002</strong><small>storage device mapping</small></div><div>188</div><div>Storage</div><div>Manual</div><div>0%</div><div>waiting approval</div><div><span class="badge warning">Queued</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="ownership">
          <div class="data-table pn-table ex-owner-table">
            <div class="data-head"><span>Owner</span><span>Scope</span><span>Open</span><span>SLA Risk</span><span>Next Action</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Owner queue opened')"><div><strong>Data Governance Lead</strong><small>canonical model + approval</small></div><div>All domains</div><div>418</div><div>12</div><div>Approve mapping candidates</div><div><span class="badge warning">Attention</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Owner queue opened')"><div><strong>Integration Team</strong><small>vendor adapter fixes</small></div><div>Huawei / GoodWe / Sungrow</div><div>644</div><div>18</div><div>Review schema changes</div><div><span class="badge danger">At risk</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Owner queue opened')"><div><strong>Mapping Owner</strong><small>units, status and device rules</small></div><div>Mapping Rules</div><div>312</div><div>7</div><div>Correct invalid unit rules</div><div><span class="badge warning">Review</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="audit">
          <div class="data-table pn-table ex-audit-table">
            <div class="data-head"><span>Audit Event</span><span>Actor</span><span>Date</span><span>Impact</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Exception audit opened')"><div><strong>Unknown Plant mapping corrected</strong><small>PLANT_EXT_884 → ARM-PLT-001</small></div><div>Global Admin</div><div>15 Jun 2026 · 11:18</div><div>342 records reprocessed</div><div><span class="badge good">Applied</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Exception audit opened')"><div><strong>Duplicate alert group ignored</strong><small>Sungrow replay window</small></div><div>System Rule</div><div>15 Jun 2026 · 10:42</div><div>870 records ignored</div><div><span class="badge info">Auto</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Exception audit opened')"><div><strong>Storage device exception escalated</strong><small>BMS_RACK_03 owner assigned</small></div><div>Integration Team</div><div>15 Jun 2026 · 10:11</div><div>SLA 4h</div><div><span class="badge warning">Pending</span></div></button>
          </div>
        </div>
      </section>
    `);

    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('view') || 'queue';
    function activateExceptionTab(tab: string): void {
      document.querySelectorAll('#exceptionTabs button').forEach(x => x.classList.toggle('active', x.dataset.tab === tab));
      document.querySelectorAll('.exception-center-workspace .pn-tab-panel').forEach(x => x.classList.toggle('active', x.dataset.panel === tab));
    }
    document.querySelectorAll('#exceptionTabs button').forEach(btn => {
      btn.addEventListener('click', () => activateExceptionTab(btn.dataset.tab || 'queue'));
    });
    activateExceptionTab(document.querySelector(`#exceptionTabs button[data-tab="${initialTab}"]`) ? initialTab : 'queue');

})();
