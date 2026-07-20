type OverviewTone = "success" | "warning" | "danger" | "info" | string;

interface OverviewKpi {
  icon: string;
  label: string;
  value: string;
  delta: string;
  tone: OverviewTone;
  route: string;
}

interface OverviewPortfolioHealthItem {
  label: string;
  value: number;
}

interface OverviewAlertItem {
  title: string;
  tenant: string;
  plant: string;
  severity: string;
  time: string;
}

interface OverviewIntegrationItem {
  name: string;
  sync: string;
  status: string;
  errors: number | string;
}

interface OverviewQualityItem {
  label: string;
  value: string;
}

interface OverviewTenantItem {
  name: string;
  plants: number | string;
  revenue: string;
  health: string;
}

interface OverviewState {
  tenant: string;
  time: string;
  region: string;
}

interface ZentridOverviewMock {
  kpis: OverviewKpi[];
  zentridHealth: OverviewPortfolioHealthItem[];
  alerts: OverviewAlertItem[];
  integrations: OverviewIntegrationItem[];
  quality: OverviewQualityItem[];
  tenants: OverviewTenantItem[];
  activity: string[];
}

declare const ZentridMock: ZentridOverviewMock;

function asHTMLElement<T extends HTMLElement = HTMLElement>(element: Element | null): T | null {
  return element instanceof HTMLElement ? (element as T) : null;
}

function overviewStatusClass(value: unknown): string {
  const v = String(value).toLowerCase();
  if (v.includes('critical') || v.includes('failed') || v.includes('fault')) return 'danger';
  if (v.includes('high') || v.includes('delayed') || v.includes('warning') || v.includes('medium')) return 'warning';
  return 'success';
}

function overviewProgressBars(): string {
  return ZentridMock.zentridHealth.map(item => `
    <button class="health-row drill" data-panel="fleet" data-title="${item.label} devices" data-route="asset-registry">
      <div class="health-label"><span>${item.label}</span><strong>${item.value}%</strong></div>
      <div class="progress"><div style="width:${item.value}%"></div></div>
    </button>`).join('');
}

function overviewMiniBars(): string {
  const values = [28, 42, 35, 58, 69, 64, 82, 76, 91, 84, 88, 95];
  return `<div class="bar-chart">${values.map((v, i) => `<button class="drill" data-panel="trend" data-title="Trend point ${i + 1}" data-route="data-governance" style="height:${v}%"><span>${v}%</span></button>`).join('')}</div>`;
}


function overviewRouteLabel(route: string): string {
  const labels: Record<string, string> = {
    tenants: 'Open Tenant Registry',
    'tenant-detail': 'Open Tenant Detail',
    plants: 'Open Device Governance',
    devices: 'Open Device Governance',
    telemetry: 'Open Telemetry Explorer',
    alerts: 'Open Incident Governance',
    analytics: 'Open Data Governance',
    finance: 'Open Financial Operations',
    reports: 'Open Reports',
    integrations: 'Open Integrations',
    'admin-console': 'Open Data Governance',
    users: 'Open Users & Access',
    settings: 'Open Settings'
  };
  return labels[route] || 'Open full section';
}

function overviewDrawPanel(title: string, body: string, route: string): void {
  let drawer = document.getElementById('detailDrawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'detailDrawer';
    drawer.className = 'detail-drawer';
    document.body.appendChild(drawer);
  }
  drawer.innerHTML = `
    <button class="drawer-close" type="button">x</button>
    <p class="eyebrow">Drill-down preview</p>
    <h2>${title}</h2>
    <div class="drawer-body">${body}</div>
    <div class="drawer-actions">
      <button class="primary-action" data-route="${route}">${overviewRouteLabel(route)}</button>
      <button class="secondary-action drawer-close-2">Close</button>
    </div>`;
  drawer.classList.add('open');
  asHTMLElement(drawer.querySelector('.drawer-close'))!.onclick = () => drawer.classList.remove('open');
  asHTMLElement(drawer.querySelector('.drawer-close-2'))!.onclick = () => drawer.classList.remove('open');
  asHTMLElement(drawer.querySelector('.primary-action'))!.onclick = (event: Event) => {
    const target = event.currentTarget as HTMLElement;
    window.location.href = ZentridLayout.pathFor(target.dataset.route);
  };
}

function overviewRender(state: OverviewState = ZentridLayout.state): string {
  return `
    <section class="page-hero">
      <div>
        <p class="eyebrow">Platform Operations Center</p>
        <h1>Global Admin Overview</h1>
        <p class="muted">Unified view of tenants, plants, devices, integrations, data quality and active incidents.</p>
      </div>
      <button class="freshness-card drill" data-panel="freshness" data-title="Data freshness breakdown" data-route="data-governance">
        <span class="pulse"></span>
        <div><strong>Data updated</strong><small>2 min ago · Fresh</small></div>
      </button>
    </section>

    <section class="context-bar glass-card">
      <button class="ctx-item" data-context="tenant"><span>Scope</span><strong id="ctxTenant">${state.tenant}</strong></button>
      <button class="ctx-item" data-context="region"><span>Region</span><strong id="ctxRegion">${state.region}</strong></button>
      <button class="ctx-item" data-context="time"><span>Time Range</span><strong id="ctxTime">${state.time}</strong></button>
      <button class="ctx-item drill" data-panel="freshness" data-title="Freshness details" data-route="data-governance"><span>Freshness</span><strong>Healthy</strong></button>
    </section>

    <section class="kpi-grid">
      ${ZentridMock.kpis.map(kpi => `
        <button class="kpi-card ${kpi.tone} drill" data-panel="kpi" data-title="${kpi.label}" data-route="${kpi.route}">
          <div class="kpi-icon">${kpi.icon}</div>
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${kpi.value}</div>
          <div class="kpi-delta">${kpi.delta}</div>
        </button>`).join('')}
    </section>

    <section class="dashboard-grid two-col">
      <article class="panel glass-card">
        <div class="panel-head"><div><h2>Fleet Health</h2><p>Normalized operational status across all devices.</p></div><button class="go" data-route="asset-registry">Open Governance</button></div>
        <div class="health-layout">
          <button class="donut drill" data-panel="fleet" data-title="Fleet availability" data-route="asset-registry"><span>93%</span><small>available</small></button>
          <div class="health-bars">${overviewProgressBars()}</div>
        </div>
      </article>

      <article class="panel glass-card map-panel">
        <div class="panel-head"><div><h2>Global Map</h2><p>Regional plant distribution and risk hotspots.</p></div><button class="go" data-route="asset-registry">View Devices</button></div>
        <div class="map-world">
          <button class="map-dot dot-1 success drill" data-panel="region" data-title="Germany region" data-route="asset-registry">Germany</button>
          <button class="map-dot dot-2 warning drill" data-panel="region" data-title="Armenia region" data-route="asset-registry">Armenia</button>
          <button class="map-dot dot-3 danger drill" data-panel="region" data-title="Spain region" data-route="incident-center">Spain</button>
          <button class="map-dot dot-4 success drill" data-panel="region" data-title="France region" data-route="asset-registry">France</button>
        </div>
      </article>
    </section>

    <section class="dashboard-grid two-col">
      <article class="panel glass-card">
        <div class="panel-head"><div><h2>Critical Alerts</h2><p>Operational incidents requiring attention.</p></div><button class="go" data-route="incident-center">Open Incidents</button></div>
        <div class="table-list">
          ${ZentridMock.alerts.map(a => `
            <div class="table-row actionable">
              <button class="row-main drill" data-panel="alert" data-title="${a.title}" data-route="incident-center"><strong>${a.title}</strong><small>${a.tenant} · ${a.plant}</small></button>
              <span class="badge ${overviewStatusClass(a.severity)}">${a.severity}</span>
              <small>${a.time}</small>
            </div>`).join('')}
        </div>
      </article>

      <article class="panel glass-card">
        <div class="panel-head"><div><h2>Integration Health</h2><p>Connector status, sync delay and errors.</p></div><button class="go" data-route="integrations">Open Integrations</button></div>
        <div class="table-list">
          ${ZentridMock.integrations.map(i => `
            <div class="table-row actionable">
              <button class="row-main drill" data-panel="integration" data-title="${i.name}" data-route="integrations"><strong>${i.name}</strong><small>Last sync: ${i.sync}</small></button>
              <span class="badge ${overviewStatusClass(i.status)}">${i.status}</span>
              <small>${i.errors} errors</small>
            </div>`).join('')}
        </div>
      </article>
    </section>

    <section class="dashboard-grid two-col">
      <article class="panel glass-card">
        <div class="panel-head"><div><h2>Data Quality</h2><p>Freshness, completeness and rejected records.</p></div><button class="go" data-route="data-governance">Data Governance</button></div>
        <div class="quality-grid">
          ${ZentridMock.quality.map(q => `<button class="drill" data-panel="quality" data-title="${q.label} quality" data-route="data-governance"><strong>${q.value}</strong><span>${q.label}</span></button>`).join('')}
        </div>
      </article>

      <article class="panel glass-card">
        <div class="panel-head"><div><h2>Top Tenants</h2><p>Business and operational leaders.</p></div><button class="go" data-route="tenants">Tenant List</button></div>
        <div class="table-list">
          ${ZentridMock.tenants.map(t => `
            <div class="table-row actionable">
              <button class="row-main drill" data-panel="tenant" data-title="${t.name}" data-route="tenant-detail"><strong>${t.name}</strong><small>${t.plants} plants · ${t.revenue}</small></button>
              <span class="badge ${overviewStatusClass(t.health)}">${t.health}</span>
            </div>`).join('')}
        </div>
      </article>
    </section>

    <section class="dashboard-grid two-col wide-left">
      <article class="panel glass-card trend-panel">
        <div class="panel-head"><div><h2>Energy & Revenue Trends</h2><p>Aggregated production and estimated revenue trend.</p></div><button class="go" data-route="data-governance">Analytics</button></div>
        ${overviewMiniBars()}
      </article>

      <article class="panel glass-card">
        <div class="panel-head"><div><h2>Activity Feed</h2><p>Recent platform operations.</p></div><button class="go" data-route="data-governance">Audit</button></div>
        <div class="activity-feed">
          ${ZentridMock.activity.map((x, idx) => `<button class="drill" data-panel="activity" data-title="Activity #${idx + 1}" data-route="data-governance"><span>${idx + 1}</span><p>${x}</p></button>`).join('')}
        </div>
      </article>
    </section>
  `;
}

function overviewMetricGrid(items: Array<[string, string]>): string {
  return `<div class="drawer-metrics rich">${items.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
}

function overviewDetailBody(type: string | undefined, title: string): string {
  const normalized = String(title || '').toLowerCase();

  if (type === 'kpi') {
    if (normalized.includes('live power')) {
      return `<p>Live production summary across the selected tenant, region and time context.</p>${overviewMetricGrid([
        ['Current Power', '1.24 GW'],
        ["Today's Yield", '12.4 GWh'],
        ['Active Plants', '4,011'],
        ['Trend', '+2.1% vs yesterday']
      ])}`;
    }
    if (normalized.includes('active alerts')) {
      return `<p>Operational alert summary. Use this preview to decide whether to open the full Alerts Center.</p>${overviewMetricGrid([
        ['Open Incidents', '187'],
        ['Critical', '15'],
        ['Unacknowledged', '42'],
        ['Escalated', '7']
      ])}`;
    }
    if (normalized.includes('revenue')) {
      return `<p>Estimated commercial impact for the current selected period.</p>${overviewMetricGrid([
        ['Current Month', '€1.2M'],
        ['Invoices', '42'],
        ['Overdue', '3'],
        ['Collected', '92%']
      ])}`;
    }
    if (normalized.includes('plants')) {
      return `<p>Aggregated plant registry summary for the current scope.</p>${overviewMetricGrid([
        ['Plants', '4,285'],
        ['Active', '4,011'],
        ['Warning', '214'],
        ['Offline', '60']
      ])}`;
    }
    if (normalized.includes('devices')) {
      return `<p>Device fleet status across inverters, meters, BESS and communication gateways.</p>${overviewMetricGrid([
        ['Devices', '68,521'],
        ['Online', '99.1%'],
        ['Fault', '312'],
        ['No Signal', '188']
      ])}`;
    }
    return `<p>Tenant and platform scope preview.</p>${overviewMetricGrid([
      ['Context', `${ZentridLayout.state.tenant}`],
      ['Time Range', `${ZentridLayout.state.time}`],
      ['Region', `${overviewState.region}`],
      ['Drill Filter', title]
    ])}`;
  }

  if (type === 'fleet') {
    return `<p>Fleet availability breakdown from normalized operational status.</p>${overviewMetricGrid([
      ['Available', '93%'],
      ['Normal', '81%'],
      ['Warning', '12%'],
      ['Fault / Offline', '7%']
    ])}`;
  }

  if (type === 'region') {
    const region = title.replace(' region', '');
    const regionData: Record<string, [string, string, string, string, string]> = {
      germany: ['Germany', '1,248', '18.2 MW', '4', '1 min ago'],
      armenia: ['Armenia', '286', '6.4 MW', '9', '3 min ago'],
      spain: ['Spain', '412', '9.7 MW', '18', '12 min ago'],
      france: ['France', '364', '7.1 MW', '3', '2 min ago']
    };
    const data = regionData[region.toLowerCase()] || [region, '—', '—', '—', '—'];
    return `<p>Regional operational snapshot for <strong>${data[0]}</strong>.</p>${overviewMetricGrid([
      ['Plants', data[1]],
      ['Capacity', data[2]],
      ['Open Incidents', data[3]],
      ['Last Sync', data[4]]
    ])}`;
  }

  if (type === 'trend') {
    return `<p>Energy and revenue trend point with the current tenant/time/region context preserved.</p>${overviewMetricGrid([
      ['Energy Index', title.replace('Trend point ', 'Point ')],
      ['Production', '8.7 GWh'],
      ['Revenue Estimate', '€84k'],
      ['Previous Period', '+6.4%']
    ])}`;
  }

  if (type === 'freshness') {
    return `<p>Overview data freshness. This explains whether the dashboard can be trusted right now.</p>${overviewMetricGrid([
      ['Plants Data', 'Fresh'],
      ['Devices Data', 'Fresh'],
      ['Alerts Data', 'Delayed'],
      ['Integrations', 'Fresh']
    ])}<div class="timeline-mini"><p>Last overview aggregation: 2 min ago</p><p>Affected module: Alerts & Events</p></div>`;
  }

  if (type === 'alert') {
    return `<p>Alert preview from the operational incident inbox.</p>${overviewMetricGrid([
      ['Status', 'New'],
      ['Severity', normalized.includes('offline') || normalized.includes('fault') ? 'Critical' : 'High'],
      ['SLA', '24 min remaining'],
      ['Suggested Action', 'Assign to Operations']
    ])}`;
  }

  if (type === 'integration') {
    return `<p>Connector health preview for the selected integration.</p>${overviewMetricGrid([
      ['Connection Health', normalized.includes('solis') ? 'Failed' : normalized.includes('sungrow') ? 'Warning' : 'Healthy'],
      ['Last Sync', '1 min ago'],
      ['Errors', normalized.includes('solis') ? '12' : '0'],
      ['Next Action', 'Open Integration Detail']
    ])}`;
  }

  if (type === 'tenant') {
    return `<p>Tenant operational preview.</p>${overviewMetricGrid([
      ['Tenant', title],
      ['Plants', '318'],
      ['Revenue', '€248k'],
      ['Health', 'Warning']
    ])}`;
  }

  if (type === 'quality') {
    return `<p>Data quality control summary for normalized platform records.</p>${overviewMetricGrid([
      ['Completeness', '98.7%'],
      ['Invalid Records', '8'],
      ['Duplicate Records', '12'],
      ['Mapping Exceptions', '17']
    ])}`;
  }

  if (type === 'activity') {
    return `<p>Audit preview for a recent platform operation.</p>${overviewMetricGrid([
      ['Activity', title],
      ['Actor', 'Global Admin'],
      ['Action Type', 'Audit Logged'],
      ['Timestamp', 'Just now']
    ])}`;
  }

  return `<p>Preview for <strong>${title}</strong>.</p>${overviewMetricGrid([
    ['Context', `${ZentridLayout.state.tenant}`],
    ['Time Range', `${ZentridLayout.state.time}`]
  ])}`;
}

window.renderOverview = overviewRender;
const overviewState = ZentridLayout.mount(overviewRender());

function wireOverview(): void {
  asHTMLElement(document.querySelector('.main-content'))?.addEventListener('click', (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const go = asHTMLElement(target.closest('.go'));
    if (go) { window.location.href = ZentridLayout.pathFor(go.dataset.route); return; }
    const drill = asHTMLElement(target.closest('.drill'));
    if (drill) {
      overviewDrawPanel(drill.dataset.title || 'Details', overviewDetailBody(drill.dataset.panel, drill.dataset.title || 'Details'), drill.dataset.route || 'index');
    }
    const ctx = asHTMLElement(target.closest('[data-context]'));
    if (ctx) {
      if (ctx.dataset.context === 'tenant') document.getElementById('tenantBtn')?.click();
      if (ctx.dataset.context === 'time') document.getElementById('timeBtn')?.click();
      if (ctx.dataset.context === 'region') {
        const next = overviewState.region === 'All Regions' ? 'Armenia' : overviewState.region === 'Armenia' ? 'Germany' : 'All Regions';
        overviewState.region = next; localStorage.setItem('zentrid_region', next);
        const ctxRegion = asHTMLElement(document.getElementById('ctxRegion'));
        if (ctxRegion) ctxRegion.textContent = next;
        ZentridLayout.toast(`Region changed: ${next}`);
      }
    }
  });
}

window.addEventListener('zentrid:context', (event: Event) => {
  const detail = (event as CustomEvent<OverviewState>).detail;
  const ctxTenant = asHTMLElement(document.getElementById('ctxTenant'));
  if (ctxTenant) ctxTenant.textContent = detail.tenant;
  const ctxTime = asHTMLElement(document.getElementById('ctxTime'));
  if (ctxTime) ctxTime.textContent = detail.time;
  document.querySelectorAll('.kpi-card').forEach(card => {
    card.classList.add('is-updating');
    window.setTimeout(() => card.classList.remove('is-updating'), 520);
  });
});
wireOverview();
