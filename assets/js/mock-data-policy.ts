(() => {
  const LIVE_ROUTES = new Set([
    '', 'index.html', 'tenants.html', 'tenant-detail.html', 'clients.html', 'client-detail.html',
    'plants.html', 'plant-detail.html', 'devices.html', 'device-detail.html', 'alerts.html',
    'alert-detail.html', 'integrations.html', 'integration-detail.html', 'api-console.html',
    'vendor-api-console.html'
  ]);

  const REFERENCE_ROUTES = new Set([
    'alert-dictionary.html', 'alert-normalization.html', 'data-quality.html',
    'production-normalization.html', 'storage-normalization.html', 'ui-field-dictionary.html'
  ]);

  const STORAGE_KEYS = [
    'zentrid_demo_tenants', 'zentrid_custom_clients', 'zentrid_demo_plants',
    'zentrid_custom_plants', 'zentrid_demo_devices', 'zentrid_custom_devices',
    'zentrid_demo_integrations', 'zentrid_tasks_v62', 'zentrid_work_orders_v51',
    'zentrid_sop_templates_v51', 'zentrid_incidents_v51', 'zentrid_billing_payments_v1',
    'zentrid_financial_operations_v1'
  ];

  function route(): string {
    return (location.pathname.split('/').filter(Boolean).pop() || '').toLowerCase();
  }

  function isLiveRoute(): boolean {
    return LIVE_ROUTES.has(route());
  }

  function clearLegacyBusinessStorage(): void {
    STORAGE_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch { /* Storage can be blocked by browser policy. */ }
    });
  }

  function emptyMarkup(message = 'No backend records are available for this section.'): string {
    return `<div class="empty-state zentrid-api-data-empty" role="status" aria-live="polite"><strong>No API data</strong><small>${message}</small></div>`;
  }

  function ensurePolicyNotice(main: HTMLElement): void {
    if (main.querySelector('[data-zentrid-api-data-policy]')) return;
    const notice = document.createElement('section');
    notice.className = 'panel glass-card zentrid-api-data-policy';
    notice.dataset.zentridApiDataPolicy = 'true';
    notice.innerHTML = '<div class="empty-state"><strong>Backend endpoint not connected</strong><small>The original page structure and sections are preserved. Prototype records and calculated demo values are hidden until this module receives API data.</small></div>';
    const hero = main.querySelector('.page-hero');
    if (hero) hero.insertAdjacentElement('afterend', notice);
    else main.prepend(notice);
  }

  function scrubDataTables(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('.data-table').forEach(table => {
      const rows = table.querySelectorAll<HTMLElement>(':scope > .data-row');
      rows.forEach(row => row.remove());
      if (!table.querySelector(':scope > .zentrid-api-data-empty')) {
        table.insertAdjacentHTML('beforeend', emptyMarkup());
      }
    });

    root.querySelectorAll<HTMLTableElement>('table').forEach(table => {
      const body = table.tBodies.item(0);
      if (!body) return;
      if (body.rows.length === 1 && body.querySelector('.zentrid-api-data-empty')) return;
      body.replaceChildren();
      const row = body.insertRow();
      const cell = row.insertCell();
      cell.colSpan = Math.max(1, table.tHead?.rows.item(0)?.cells.length || 1);
      cell.innerHTML = emptyMarkup();
    });
  }

  function scrubMetrics(root: ParentNode): void {
    const containers = root.querySelectorAll<HTMLElement>([
      '.kpi-grid', '.metric-grid', '.stats-grid', '.summary-grid', '.detail-kpis',
      '.overview-kpis', '.dashboard-kpis', '.api-metrics', '.status-summary-grid'
    ].join(','));
    containers.forEach(container => {
      container.querySelectorAll<HTMLElement>('article strong, .kpi-card strong, .metric-card strong, .stat-card strong').forEach(value => {
        if (value.textContent !== '—') value.textContent = '—';
      });
      container.querySelectorAll<HTMLElement>('article small, .kpi-card small, .metric-card small, .stat-card small').forEach(meta => {
        if (meta.textContent !== 'No backend data') meta.textContent = 'No backend data';
      });
    });
  }

  function scrubCharts(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('.bar-chart, .line-chart, .donut-chart, .chart-area, .chart-canvas, .mini-trend').forEach(chart => {
      chart.querySelectorAll('button, svg, canvas').forEach(node => node.remove());
      if (!chart.querySelector('.zentrid-api-data-empty')) chart.insertAdjacentHTML('beforeend', emptyMarkup('Chart data will appear when the backend endpoint is connected.'));
    });
  }

  function scrubMockOriginRows(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('.record-origin-chip[data-record-origin="mock"], .record-origin-chip[data-record-origin="local"], .record-origin-chip[data-record-origin="mixed"]').forEach(chip => {
      const row = chip.closest<HTMLElement>('.data-row, tr, .list-row, .record-card');
      if (row) row.remove();
    });
  }

  function scrubUnsupportedPage(): void {
    if (isLiveRoute() || REFERENCE_ROUTES.has(route()) || route() === 'login.html') return;
    const main = document.querySelector<HTMLElement>('.main-content');
    if (!main) return;
    ensurePolicyNotice(main);
    scrubMockOriginRows(main);
    scrubDataTables(main);
    scrubMetrics(main);
    scrubCharts(main);
    clearLegacyBusinessStorage();
  }

  function scrubLivePageMockRows(): void {
    if (!isLiveRoute()) return;
    const main = document.querySelector<HTMLElement>('.main-content');
    if (!main) return;
    scrubMockOriginRows(main);
  }

  let scheduled = false;
  function apply(): void {
    scheduled = false;
    scrubUnsupportedPage();
    scrubLivePageMockRows();
  }

  function schedule(): void {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(apply, 0);
  }

  clearLegacyBusinessStorage();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('zentrid:live-data-state', schedule as EventListener);
})();
