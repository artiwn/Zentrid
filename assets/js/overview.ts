type OverviewTone = 'success' | 'warning' | 'danger' | 'info' | string;

interface OverviewKpi {
  icon: string;
  label: string;
  value: string;
  delta: string;
  tone: OverviewTone;
  route: string;
}
interface OverviewPortfolioHealthItem { label: string; value: number; }
interface OverviewAlertItem { title: string; tenant: string; plant: string; severity: string; time: string; }
interface OverviewIntegrationItem { name: string; sync: string; status: string; errors: number | string; }
interface OverviewQualityItem { label: string; value: string; }
interface OverviewTenantItem { name: string; plants: number | string; revenue: string; health: string; }
interface OverviewState { tenant: string; time: string; region: string; }
interface ZentridOverviewDataStore {
  kpis: OverviewKpi[];
  zentridHealth: OverviewPortfolioHealthItem[];
  alerts: OverviewAlertItem[];
  integrations: OverviewIntegrationItem[];
  quality: OverviewQualityItem[];
  tenants: OverviewTenantItem[];
  activity: string[];
}
declare const ZentridOverviewData: ZentridOverviewDataStore;

function overviewEscape(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char] || char));
}
function overviewStatusClass(value: unknown): string {
  const v = String(value || '').toLowerCase();
  if (v.includes('critical') || v.includes('failed') || v.includes('fault') || v.includes('offline')) return 'danger';
  if (v.includes('high') || v.includes('delayed') || v.includes('warning') || v.includes('medium')) return 'warning';
  return 'success';
}
function overviewEmpty(title: string, message: string): string {
  return `<div class="empty-state zentrid-ux-state zentrid-ux-state-empty" role="status"><strong>${overviewEscape(title)}</strong><small>${overviewEscape(message)}</small></div>`;
}
function overviewProgressBars(): string {
  if (!ZentridOverviewData.zentridHealth.length) return overviewEmpty('No fleet status data', 'The backend has not returned status distribution fields.');
  return ZentridOverviewData.zentridHealth.map(item => {
    const value = Number(item.value || 0);
    return `<button class="health-row drill" data-panel="fleet" data-title="${overviewEscape(item.label)}" data-route="plants"><div class="health-label"><span>${overviewEscape(item.label)}</span><strong>${value}</strong></div><div class="progress"><div style="width:${Math.max(0, Math.min(100, value))}%"></div></div></button>`;
  }).join('');
}
function overviewKpis(): string {
  if (!ZentridOverviewData.kpis.length) return `<section class="panel glass-card">${overviewEmpty('No overview metrics', 'Core API requests have not returned records yet.')}</section>`;
  return `<section class="kpi-grid">${ZentridOverviewData.kpis.map(kpi => `<button class="kpi-card ${overviewEscape(kpi.tone)} drill" data-panel="kpi" data-title="${overviewEscape(kpi.label)}" data-route="${overviewEscape(kpi.route)}"><div class="kpi-icon">${overviewEscape(kpi.icon)}</div><div class="kpi-label">${overviewEscape(kpi.label)}</div><div class="kpi-value">${overviewEscape(kpi.value)}</div><div class="kpi-delta">${overviewEscape(kpi.delta)}</div></button>`).join('')}</section>`;
}
function overviewAlerts(): string {
  if (!ZentridOverviewData.alerts.length) return overviewEmpty('No alert records', 'The alert API returned no records or has not completed yet.');
  return `<div class="table-list">${ZentridOverviewData.alerts.map(item => `<div class="table-row actionable"><button class="row-main drill" data-panel="alert" data-title="${overviewEscape(item.title)}" data-route="alerts"><strong>${overviewEscape(item.title)}</strong><small>${overviewEscape(item.tenant)} · ${overviewEscape(item.plant)}</small></button><span class="badge ${overviewStatusClass(item.severity)}">${overviewEscape(item.severity)}</span><small>${overviewEscape(item.time)}</small></div>`).join('')}</div>`;
}
function overviewIntegrations(): string {
  if (!ZentridOverviewData.integrations.length) return overviewEmpty('No integration records', 'The integration API returned no records or has not completed yet.');
  return `<div class="table-list">${ZentridOverviewData.integrations.map(item => `<div class="table-row actionable"><button class="row-main drill" data-panel="integration" data-title="${overviewEscape(item.name)}" data-route="integrations"><strong>${overviewEscape(item.name)}</strong><small>Last sync: ${overviewEscape(item.sync)}</small></button><span class="badge ${overviewStatusClass(item.status)}">${overviewEscape(item.status)}</span><small>${overviewEscape(item.errors)} errors</small></div>`).join('')}</div>`;
}
function overviewQuality(): string {
  if (!ZentridOverviewData.quality.length) return overviewEmpty('No API quality summary', 'Quality counters appear only when provider and integration endpoints respond.');
  return `<div class="quality-grid">${ZentridOverviewData.quality.map(item => `<button class="drill" data-panel="quality" data-title="${overviewEscape(item.label)}" data-route="api-console"><strong>${overviewEscape(item.value)}</strong><span>${overviewEscape(item.label)}</span></button>`).join('')}</div>`;
}
function overviewRender(state: OverviewState = ZentridLayout.state): string {
  return `<section class="page-hero"><div><p class="eyebrow">Platform Operations Center · API-only</p><h1>Global Admin Overview</h1><p class="muted">This screen contains only values derived from backend responses. Prototype metrics, maps, trends and activity records were removed.</p></div><button class="freshness-card" type="button" data-live-refresh="overview"><span class="pulse"></span><div><strong>Data status</strong><small>Waiting for API response</small></div></button></section>
    <section class="context-bar glass-card"><button class="ctx-item" data-context="tenant"><span>Scope</span><strong id="ctxTenant">${overviewEscape(state.tenant)}</strong></button><button class="ctx-item" data-context="region"><span>Region</span><strong id="ctxRegion">${overviewEscape(state.region)}</strong></button><button class="ctx-item" data-context="time"><span>Time Range</span><strong id="ctxTime">${overviewEscape(state.time)}</strong></button><div class="ctx-item"><span>Source policy</span><strong>Backend API only</strong></div></section>
    ${overviewKpis()}
    <section class="dashboard-grid two-col"><article class="panel glass-card"><div class="panel-head"><div><h2>Fleet Status</h2><p>Calculated only from API status fields when available.</p></div><button class="go" data-route="plants">Open Plants</button></div><div class="health-bars">${overviewProgressBars()}</div></article><article class="panel glass-card"><div class="panel-head"><div><h2>API Quality Summary</h2><p>Provider, template, stale and error-rate values from backend responses.</p></div><button class="go" data-route="api-console">API Console</button></div>${overviewQuality()}</article></section>
    <section class="dashboard-grid two-col"><article class="panel glass-card"><div class="panel-head"><div><h2>Alerts</h2><p>Latest records returned by the alert endpoint.</p></div><button class="go" data-route="alerts">Open Alerts</button></div>${overviewAlerts()}</article><article class="panel glass-card"><div class="panel-head"><div><h2>Integration Health</h2><p>Connector records returned by provider integration endpoints.</p></div><button class="go" data-route="integrations">Open Integrations</button></div>${overviewIntegrations()}</article></section>`;
}
function overviewDrawPanel(title: string, body: string, route: string): void {
  let drawer = document.getElementById('detailDrawer');
  if (!drawer) { drawer = document.createElement('aside'); drawer.id = 'detailDrawer'; drawer.className = 'detail-drawer'; document.body.appendChild(drawer); }
  drawer.innerHTML = `<button class="drawer-close" type="button">×</button><p class="eyebrow">API record preview</p><h2>${overviewEscape(title)}</h2><div class="drawer-body">${body}</div><div class="drawer-actions"><button class="primary-action" data-route="${overviewEscape(route)}">Open section</button></div>`;
  drawer.classList.add('open');
  drawer.querySelector<HTMLElement>('.drawer-close')?.addEventListener('click', () => drawer?.classList.remove('open'));
  drawer.querySelector<HTMLElement>('.primary-action')?.addEventListener('click', event => { const target = event.currentTarget as HTMLElement; location.href = ZentridLayout.pathFor(target.dataset.route || 'index'); });
}
function overviewDetailBody(type: string | undefined, title: string): string {
  return `<p>This preview is derived from the currently displayed backend result.</p><div class="drawer-metrics rich"><div><span>Record</span><strong>${overviewEscape(title)}</strong></div><div><span>Source</span><strong>Backend API</strong></div><div><span>Section</span><strong>${overviewEscape(type || 'overview')}</strong></div></div>`;
}
function wireOverview(): void {
  document.querySelector<HTMLElement>('.main-content')?.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const go = target.closest<HTMLElement>('.go');
    if (go) { location.href = ZentridLayout.pathFor(go.dataset.route || 'index'); return; }
    const drill = target.closest<HTMLElement>('.drill');
    if (drill) overviewDrawPanel(drill.dataset.title || 'API record', overviewDetailBody(drill.dataset.panel, drill.dataset.title || 'API record'), drill.dataset.route || 'index');
    const ctx = target.closest<HTMLElement>('[data-context]');
    if (ctx?.dataset.context === 'tenant') document.getElementById('tenantBtn')?.click();
    if (ctx?.dataset.context === 'time') document.getElementById('timeBtn')?.click();
  });
}
window.renderOverview = overviewRender;
window.wireOverview = wireOverview;
ZentridLayout.mount(overviewRender());
wireOverview();
window.addEventListener('zentrid:context', (event: Event) => {
  const detail = (event as CustomEvent<OverviewState>).detail;
  const tenant = document.getElementById('ctxTenant'); if (tenant) tenant.textContent = detail.tenant;
  const time = document.getElementById('ctxTime'); if (time) time.textContent = detail.time;
  const region = document.getElementById('ctxRegion'); if (region) region.textContent = detail.region;
});
