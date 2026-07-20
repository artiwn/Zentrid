type NormalizationDomainCard = {
  icon: string;
  title: string;
  status: 'Active' | string;
  count: string;
  desc: string;
  artifact: string;
};

type CanonicalNamingRule = {
  wrong: string;
  right: string;
  scope: string;
};

type GovernanceArtifact = {
  name: string;
  type: string;
  size: string;
  purpose: string;
};

const normalizationDomains: NormalizationDomainCard[] = [
      { icon:'🌱', title:'Plant UI Normalization', status:'Active', count:'Plant List + Plant Detail', desc:'Plant is the single canonical term. No Site / Station labels are used for the normalized UI contract.', artifact:'UI Dictionary' },
      { icon:'🔌', title:'Device UI Normalization', status:'Active', count:'Device, Inverter, Battery, Meter, Logger, Module, EV Charger', desc:'Device is the canonical term. Equipment / Asset labels are replaced by Device or Plant depending on context.', artifact:'UI Dictionary' },
      { icon:'📐', title:'Unit Normalization', status:'Active', count:'kW · kWh · V · A · °C · %', desc:'Display units are controlled by the UI Dictionary. Temperature is normalized to °C according to the UI Dictionary.', artifact:'UI Dictionary' },
      { icon:'🚨', title:'Alert Normalization', status:'Active', count:'28 Zentrid alerts · 844 vendor mappings', desc:'Vendor error/fault/alarm codes are mapped to Zentrid Canonical Alerts and keep vendor name, description and recommended action.', artifact:'Alert Mapping Registry' },
      { icon:'🧭', title:'Screen Field Governance', status:'Active', count:'19 screens · 708 field references', desc:'Each screen references field key values from the central UI Dictionary instead of inventing labels locally.', artifact:'Screen Contract' },
      { icon:'🔗', title:'Alert UI Integration', status:'Active', count:'Alarm List + Alarm Detail', desc:'Alert screens use shared UI keys for Zentrid Alert Code, Zentrid Alert Name, Vendor Error Code, Vendor Description and Vendor Recommended Action.', artifact:'Alert UI Binding Registry' }
    ];

    const canonicalRules: CanonicalNamingRule[] = [
      { wrong:'Site / Station / Power Plant', right:'Plant', scope:'Plant list, plant detail, reports, alert context' },
      { wrong:'Asset / Equipment', right:'Device', scope:'Device list, device detail, inverter, battery, meter, logger' },
      { wrong:'Fault / Error / Alarm used randomly', right:'Alert / Event by Zentrid model', scope:'Alert dictionary, alert list, alert detail, incident flows' },
      { wrong:'Vendor Fault Name', right:'Vendor Error Name', scope:'Vendor mapping and alert detail' },
      { wrong:'Non-canonical temperature unit', right:'Temperature °C', scope:'Telemetry, battery, inverter, weather station' },
      { wrong:'KW / kw / kWp mixed labels', right:'kW / kWh from field dictionary', scope:'Telemetry, energy flow, production, historical data' }
    ];

    const artifacts: GovernanceArtifact[] = [
      { name:'UI Dictionary', type:'UI Dictionary', size:'515 unique fields', purpose:'Single source of truth for UI labels, field keys, units, data type and business meaning.' },
      { name:'Screen Contract', type:'Screen Contract', size:'19 screens / 708 references', purpose:'Defines which normalized field keys appear on each UI screen.' },
      { name:'Alert Mapping Registry', type:'Alert Mapping', size:'28 canonical alerts / 844 vendor rows', purpose:'Maps vendor errors to Zentrid alerts while keeping vendor descriptions and vendor recommended actions.' },
      { name:'Alert UI Binding Registry', type:'Alert UI Binding', size:'Alarm List + Alarm Detail', purpose:'Connects alert mapping fields to the shared UI Dictionary and screen layout.' }
    ];

    function badge(v: string): string { return `<span class="badge ${v === 'Active' ? 'success' : 'warning'}">${v}</span>`; }

    ZentridLayout.mount(`
      <section class="page-hero production-hero">
        <div>
          <p class="eyebrow">Global Admin · Data Governance</p>
          <h1>Data Governance Center</h1>
          <p class="muted">This page shows what Zentrid has normalized, which normalized contract controls the UI, and which naming/unit rules must be followed across all pages.</p>
        </div>
        <button class="freshness-card" onclick="ZentridLayout.toast('Normalization governance snapshot refreshed')">
          <span class="pulse"></span>
          <div><strong>Normalization Snapshot</strong><small>UI fields · screens · alerts · units linked</small></div>
        </button>
      </section>

      <section class="module-grid production-kpis governance-hub-kpis-v94">
        <article class="kpi-card cyan"><span class="kpi-icon">📘</span><span class="kpi-label">UI Fields</span><strong class="kpi-value">515</strong><small class="kpi-delta">unique normalized field keys</small></article>
        <article class="kpi-card blue"><span class="kpi-icon">🖥️</span><span class="kpi-label">UI Screens</span><strong class="kpi-value">19</strong><small class="kpi-delta">screen contracts generated</small></article>
        <article class="kpi-card green"><span class="kpi-icon">🚨</span><span class="kpi-label">Canonical Alerts</span><strong class="kpi-value">28</strong><small class="kpi-delta">Zentrid alert groups</small></article>
        <article class="kpi-card yellow"><span class="kpi-icon">🔁</span><span class="kpi-label">Vendor Alert Mappings</span><strong class="kpi-value">844</strong><small class="kpi-delta">vendor rows mapped</small></article>
        <article class="kpi-card red"><span class="kpi-icon">🌡️</span><span class="kpi-label">Display Units</span><strong class="kpi-value">°C</strong><small class="kpi-delta">temperature normalized</small></article>
      </section>

      <section class="panel glass-card governance-hub-panel-v94">
        <div class="panel-head"><div><h2>What We Normalized</h2><p>Each domain is governed by a normalized contract. Frontend labels must come from these contracts, not from local page text.</p></div></div>
        <div class="governance-module-grid-v94">
          ${normalizationDomains.map(m => `<article class="governance-module-card-v94"><div class="governance-module-icon-v94">${m.icon}</div><div><div class="module-card-head-v94"><h3>${m.title}</h3>${badge(m.status)}</div><p>${m.desc}</p><small><strong>${m.count}</strong><br>${m.artifact}</small></div></article>`).join('')}
        </div>
      </section>

      <section class="split-workspace governance-split-v94">
        <article class="panel glass-card">
          <div class="panel-head"><div><h2>Normalization Pipeline</h2><p>How source data becomes a consistent Zentrid UI.</p></div></div>
          <div class="lineage-flow governance-lineage-v94">
            <div><span>1</span><strong>Vendor Source</strong><small>Huawei, Deye, Solis, Sungrow, GoodWe, Sofar, Peimar, Solax</small></div>
            <div><span>2</span><strong>Canonical Mapping</strong><small>vendor field / code → Zentrid field / alert</small></div>
            <div><span>3</span><strong>UI Dictionary</strong><small>one field key, one label, one unit</small></div>
            <div><span>4</span><strong>Screen Contract</strong><small>which fields appear on each page</small></div>
            <div><span>5</span><strong>Frontend Display</strong><small>same names everywhere</small></div>
          </div>
        </article>
        <aside class="panel glass-card">
          <div class="panel-head"><div><h2>Normalization Contracts</h2><p>These are the current Zentrid normalization contracts used by the admin UI.</p></div></div>
          <div class="info-stack">
            ${artifacts.map(a => `<div class="info-card"><span>${a.type}</span><strong>${a.name}</strong><small>${a.size}<br>${a.purpose}</small></div>`).join('')}
          </div>
        </aside>
      </section>

      <section class="panel glass-card governance-table">
        <div class="panel-head"><div><h2>Canonical Naming Rules</h2><p>These rules prevent the same concept from appearing under different names in different pages.</p></div></div>
        <div class="data-head governance-row"><div>Do Not Use</div><div>Use Instead</div><div>Where Applied</div><div>Status</div><div>Owner</div></div>
        ${canonicalRules.map(r => `<div class="data-row governance-row"><div><strong>${r.wrong}</strong><small>legacy / vendor-specific / mixed UI label</small></div><div><strong>${r.right}</strong><small>Zentrid canonical label</small></div><div><strong>${r.scope}</strong><small>controlled by UI Dictionary</small></div><div>${badge('Active')}</div><div><strong>Data Governance</strong><small>Global Admin</small></div></div>`).join('')}
      </section>

      <section class="panel glass-card governance-table">
        <div class="panel-head"><div><h2>Alert Normalization Example</h2><p>Different vendor errors are shown under one Zentrid alert, while vendor details remain available in Alert Detail.</p></div><a class="secondary-action" href="alert-dictionary.html">Open Alert Dictionary</a></div>
        <div class="data-head governance-row"><div>Zentrid Alert</div><div>Vendor Error</div><div>Vendor</div><div>Vendor Action</div><div>UI Fields</div></div>
        <div class="data-row governance-row"><div><strong>FL-GRD-OV</strong><small>Grid Overvoltage</small></div><div><strong>F42 · AC Over-voltage</strong><small>source code and source name preserved</small></div><div><strong>Deye</strong><small>Hybrid & String Inverter</small></div><div><strong>Use vendor recommended action</strong><small>shown in Alert Detail</small></div><div><strong>zentrid_alert_name</strong><small>vendor_error_name · vendor_recommended_action</small></div></div>
        <div class="data-row governance-row"><div><strong>FL-BAT-TEMP</strong><small>Battery Temperature Fault</small></div><div><strong>3105 · Battery Overtemperature</strong><small>source code and source name preserved</small></div><div><strong>Huawei</strong><small>LUNA2000 ESS</small></div><div><strong>Use vendor recommended action</strong><small>shown in Alert Detail</small></div><div><strong>zentrid_alert_name</strong><small>vendor_error_name · vendor_recommended_action</small></div></div>
      </section>
    `);
