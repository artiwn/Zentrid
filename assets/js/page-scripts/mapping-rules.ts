(() => {
ZentridLayout.mount(`
      <section class="page-hero production-normalization-hero mapping-rules-hero">
        <div>
          <p class="eyebrow">Global Admin · Integration Hub · Rule Governance</p>
          <h1>Mapping Rules</h1>
          <p class="muted">Central rule library for production, alert, storage, unit, timestamp, status, formula and conditional transformations before normalized data enters Zentrid core.</p>
        </div>
        <button class="freshness-card" onclick="ZentridLayout.toast('Mapping rule governance workspace: mock view only')">
          <span class="pulse"></span>
          <div><strong>Rule library v2.1</strong><small>64 active rules · 7 pending approval</small></div>
        </button>
      </section>

      <section class="kpi-grid detail-kpis production-normalization-kpis">
        <button class="kpi-card cyan" onclick="ZentridLayout.toast('Active rules filtered')"><span>Active rules</span><strong>64</strong><small>production, alerts, storage, finance</small></button>
        <button class="kpi-card green" onclick="ZentridLayout.toast('Approved rules filtered')"><span>Approved</span><strong>51</strong><small>stable rules used by pipelines</small></button>
        <button class="kpi-card yellow" onclick="ZentridLayout.toast('Pending approvals opened')"><span>Pending approval</span><strong>7</strong><small>waiting data governance review</small></button>
        <button class="kpi-card blue" onclick="ZentridLayout.toast('Rule test history opened')"><span>Last test pass</span><strong>96.8%</strong><small>312 samples validated</small></button>
      </section>

      <section class="panel glass-card production-workspace mapping-rules-workspace">
        <div class="panel-head">
          <div>
            <h2>Rule Governance Workspace</h2>
            <p>Manage shared unit conversion, status mapping, transformation, formula and conditional rules across all normalization modules.</p>
          </div>
          <div class="toolbar production-toolbar">
            <select id="mrDomainFilter">
              <option>All domains</option>
              <option>Production</option>
              <option>Alerts</option>
              <option>Storage</option>
              <option>Financial</option>
            </select>
            <select id="mrStatusFilter">
              <option>All statuses</option>
              <option>Approved</option>
              <option>Draft</option>
              <option>Needs review</option>
              <option>Deprecated</option>
            </select>
          </div>
        </div>

        <div class="detail-tabs production-tabs" id="mrTabs">
          <button class="active" data-tab="library">Rule Library</button>
          <button data-tab="units">Unit Conversion</button>
          <button data-tab="status">Status Rules</button>
          <button data-tab="transformations">Transformation Rules</button>
          <button data-tab="formulas">Formula Rules</button>
          <button data-tab="conditional">Conditional Rules</button>
          <button data-tab="testing">Rule Testing</button>
          <button data-tab="approval">Approval Queue</button>
          <button data-tab="audit">Rule Audit</button>
        </div>

        <div class="pn-tab-panel active" data-panel="library">
          <div class="pn-card-grid">
            <article><span>Production</span><strong>24 rules</strong><small>power, energy, weather, grid</small></article>
            <article><span>Alerts</span><strong>16 rules</strong><small>severity, status, category, correlation</small></article>
            <article><span>Storage</span><strong>18 rules</strong><small>SOC, SOH, power, safety</small></article>
            <article><span>Financial</span><strong>6 rules</strong><small>currency, tariff basis, settlement period</small></article>
          </div>
          <div class="data-table pn-table mr-library-table">
            <div class="data-head"><span>Rule</span><span>Domain</span><span>Type</span><span>Input</span><span>Output</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Rule detail opened')"><div><strong>W to kW</strong><small>Power unit conversion</small></div><div>Production / Storage</div><div>Unit</div><div>W</div><div>kW</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Rule detail opened')"><div><strong>Running to ACTIVE</strong><small>Operational status normalization</small></div><div>Production / Alerts</div><div>Status</div><div>Running, Online, Normal</div><div>ACTIVE</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Rule detail opened')"><div><strong>SOC ratio to percent</strong><small>0–1 storage values</small></div><div>Storage</div><div>Transform</div><div>battChargeState</div><div>battery_soc_pct</div><div><span class="badge info">Draft</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Rule detail opened')"><div><strong>PR calculation</strong><small>Actual / Expected energy</small></div><div>Production</div><div>Formula</div><div>actual_energy, expected_energy</div><div>performance_ratio</div><div><span class="badge warning">Review</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="units">
          <div class="mapping-note"><strong>Purpose:</strong> one shared unit layer prevents each normalization module from redefining the same conversion logic.</div>
          <div class="data-table pn-table mr-unit-table">
            <div class="data-head"><span>Source Unit</span><span>Target Unit</span><span>Domain</span><span>Rule</span><span>Example</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Unit rule opened')"><div><strong>W</strong><small>watts</small></div><div>kW</div><div>Power</div><div>value / 1000</div><div>1500 W → 1.5 kW</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Unit rule opened')"><div><strong>MWh</strong><small>megawatt-hour</small></div><div>kWh</div><div>Energy</div><div>value * 1000</div><div>0.42 MWh → 420 kWh</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Unit rule opened')"><div><strong>°C</strong><small>celsius</small></div><div>°C</div><div>Temperature</div><div>value</div><div>35°C → 35°C</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Unit rule opened')"><div><strong>mph</strong><small>miles per hour</small></div><div>m/s</div><div>Wind</div><div>value * 0.44704</div><div>10 mph → 4.47 m/s</div><div><span class="badge info">Draft</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="status">
          <div class="data-table pn-table mr-status-table">
            <div class="data-head"><span>Vendor Values</span><span>Zentrid Status</span><span>Applies To</span><span>Priority</span><span>Fallback</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Status rule opened')"><div><strong>Running / Online / Normal</strong><small>positive vendor states</small></div><div><span class="badge good">ACTIVE</span></div><div>Plant, Device, Integration</div><div>High</div><div>UNKNOWN if unmapped</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Status rule opened')"><div><strong>Disconnected / Lost / No data</strong><small>communication loss states</small></div><div><span class="badge muted">OFFLINE</span></div><div>Plant, Device</div><div>High</div><div>OFFLINE after freshness threshold</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Status rule opened')"><div><strong>Alert / Fault / Error</strong><small>fault states</small></div><div><span class="badge danger">FAULT</span></div><div>Plant, Device, BESS</div><div>Critical</div><div>WARNING if severity missing</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Status rule opened')"><div><strong>Service / Maintenance</strong><small>planned service states</small></div><div><span class="badge warning">MAINTENANCE</span></div><div>Plant, Device</div><div>Medium</div><div>UNKNOWN if schedule missing</div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="transformations">
          <div class="data-table pn-table mr-transform-table">
            <div class="data-head"><span>Rule Name</span><span>Source Field</span><span>Target Field</span><span>Expression</span><span>Validation</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Transformation rule opened')"><div><strong>Current power normalize</strong><small>Huawei powerNow</small></div><div>powerNow</div><div>current_power_kw</div><div>value / 1000</div><div><= installed capacity</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Transformation rule opened')"><div><strong>Battery signed power</strong><small>negative means charging</small></div><div>bessPower</div><div>battery_charge_power_kw</div><div>abs(value) / 1000 if value &lt; 0</div><div>direction required</div><div><span class="badge warning">Review</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Transformation rule opened')"><div><strong>Vendor timestamp to UTC</strong><small>local plant time</small></div><div>localTime</div><div>timestamp_utc</div><div>convert timezone → UTC</div><div>timezone required</div><div><span class="badge good">Approved</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="formulas">
          <div class="data-table pn-table mr-formula-table">
            <div class="data-head"><span>Formula</span><span>Inputs</span><span>Output</span><span>Guardrail</span><span>Owner</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Formula rule opened')"><div><strong>Performance Ratio</strong><small>actual vs expected production</small></div><div>actual_energy_kwh, expected_energy_kwh</div><div>performance_ratio_pct</div><div>reject if &gt; 100%</div><div>Data Governance</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Formula rule opened')"><div><strong>Specific Yield</strong><small>energy per installed capacity</small></div><div>energy_kwh, installed_capacity_kwp</div><div>specific_yield_kwh_kwp</div><div>capacity must be &gt; 0</div><div>Analytics</div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Formula rule opened')"><div><strong>Self Consumption Rate</strong><small>consumed production share</small></div><div>self_consumed_kwh, produced_kwh</div><div>self_consumption_pct</div><div>0–100%</div><div>Commercial</div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="conditional">
          <div class="data-table pn-table mr-conditional-table">
            <div class="data-head"><span>Condition</span><span>Then</span><span>Domain</span><span>Use Case</span><span>Status</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Conditional rule opened')"><div><strong>IF status = Running</strong><small>vendor status rule</small></div><div>normalized_status = ACTIVE</div><div>Production</div><div>plant/device status</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Conditional rule opened')"><div><strong>IF SOC &lt; 5%</strong><small>battery safety threshold</small></div><div>severity = Critical</div><div>Storage / Alerts</div><div>low battery emergency</div><div><span class="badge warning">Review</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Conditional rule opened')"><div><strong>IF alert recovered_at exists</strong><small>vendor recovery event</small></div><div>alert_status = RESOLVED</div><div>Alerts</div><div>alert lifecycle</div><div><span class="badge good">Approved</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="testing">
          <div class="pn-preview">
            <article><span>Test Input</span><pre>source_system = Huawei
field = powerNow
value = 1500
unit = W</pre></article>
            <div class="pn-preview-arrow">run</div>
            <article><span>Rule Output</span><pre>target_field = current_power_kw
normalized_value = 1.5
unit = kW
validation = passed</pre></article>
          </div>
          <div class="mapping-note"><strong>Rule Testing:</strong> before approval, Global Admin can run sample payloads against rule chains and confirm output, validation result and target Zentrid field.</div>
          <div class="data-table pn-table mr-test-table">
            <div class="data-head"><span>Test Case</span><span>Rule</span><span>Input</span><span>Output</span><span>Result</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Test case opened')"><div><strong>Huawei powerNow</strong><small>unit conversion</small></div><div>W to kW</div><div>1500 W</div><div>1.5 kW</div><div><span class="badge good">Passed</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Test case opened')"><div><strong>SOC invalid range</strong><small>validation guardrail</small></div><div>SOC range</div><div>136%</div><div>Rejected</div><div><span class="badge danger">Failed as expected</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="approval">
          <div class="data-table pn-table mr-approval-table">
            <div class="data-head"><span>Rule Change</span><span>Requested By</span><span>Domain</span><span>Impact</span><span>Action</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Approval detail opened')"><div><strong>SOC ratio to percent</strong><small>new EMS battery rule</small></div><div>Integration Team</div><div>Storage</div><div>2,800 records/day</div><div class="row-actions"><span>Approve</span><span>Reject</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Approval detail opened')"><div><strong>Alert Emergency → Critical</strong><small>severity mapping update</small></div><div>Data Governance</div><div>Alerts</div><div>all Huawei critical alerts</div><div class="row-actions"><span>Approve</span><span>Request changes</span></div></button>
          </div>
        </div>

        <div class="pn-tab-panel" data-panel="audit">
          <div class="data-table pn-table mr-audit-table">
            <div class="data-head"><span>Version</span><span>Author</span><span>Date</span><span>Change</span><span>Approval</span></div>
            <button class="data-row" onclick="ZentridLayout.toast('Rule version diff opened')"><div><strong>v2.1</strong><small>current draft</small></div><div>Global Admin</div><div>15 Jun 2026</div><div>Added storage SOC ratio rule and alert severity update</div><div><span class="badge warning">Pending</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Rule version diff opened')"><div><strong>v2.0</strong><small>approved baseline</small></div><div>Data Governance</div><div>10 Jun 2026</div><div>Production and alert mapping baseline</div><div><span class="badge good">Approved</span></div></button>
            <button class="data-row" onclick="ZentridLayout.toast('Rule version diff opened')"><div><strong>v1.9</strong><small>archived</small></div><div>Integration Team</div><div>01 Jun 2026</div><div>Initial unit and timestamp rule library</div><div><span class="badge muted">Archived</span></div></button>
          </div>
        </div>
      </section>
    `);

    document.querySelectorAll('#mrTabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('#mrTabs button').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.pn-tab-panel').forEach(x => x.classList.toggle('active', x.dataset.panel === tab));
        btn.classList.add('active');
      });
    });
})();
