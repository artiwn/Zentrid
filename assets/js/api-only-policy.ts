(() => {
  const LIVE_ROUTES = new Set([
    '', 'index.html', 'tenants.html', 'tenant-detail.html', 'clients.html', 'client-detail.html',
    'plants.html', 'plant-detail.html', 'devices.html', 'device-detail.html', 'alerts.html',
    'alert-detail.html', 'integrations.html', 'integration-detail.html', 'telemetry.html',
    'api-console.html', 'vendor-api-console.html'
  ]);

  const REFERENCE_ROUTES = new Set([
    'alert-dictionary.html', 'alert-normalization.html', 'data-quality.html',
    'production-normalization.html', 'storage-normalization.html', 'ui-field-dictionary.html'
  ]);

  function route(): string {
    return (location.pathname.split('/').filter(Boolean).pop() || '').toLowerCase();
  }

  function isLiveRoute(): boolean {
    return LIVE_ROUTES.has(route());
  }

  function clearLegacyBusinessStorage(): void {
    window.ZentridApiOnly?.clearLegacyBusinessData?.();
  }

  function emptyMarkup(message = 'No backend records are available for this section.'): string {
    return `<div class="empty-state zentrid-api-data-empty" role="status" aria-live="polite"><strong>No API data</strong><small>${message}</small></div>`;
  }

  function ensurePolicyNotice(main: HTMLElement): void {
    if (main.querySelector('[data-zentrid-api-data-policy]')) return;
    const notice = document.createElement('section');
    notice.className = 'panel glass-card zentrid-api-data-policy';
    notice.dataset.zentridApiDataPolicy = 'true';
    notice.innerHTML = '<div class="empty-state"><strong>Backend endpoint not connected</strong><small>The original page structure is preserved, but business records remain hidden until this module receives API data.</small></div>';
    const hero = main.querySelector('.page-hero');
    if (hero) hero.insertAdjacentElement('afterend', notice);
    else main.prepend(notice);
  }

  function clearDataTables(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('.data-table').forEach(table => {
      table.querySelectorAll<HTMLElement>(':scope > .data-row').forEach(row => row.remove());
      if (!table.querySelector(':scope > .zentrid-api-data-empty')) table.insertAdjacentHTML('beforeend', emptyMarkup());
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

  function clearMetrics(root: ParentNode): void {
    const selectors = [
      '.kpi-grid', '.metric-grid', '.stats-grid', '.summary-grid', '.detail-kpis',
      '.overview-kpis', '.dashboard-kpis', '.status-summary-grid'
    ].join(',');
    root.querySelectorAll<HTMLElement>(selectors).forEach(container => {
      container.querySelectorAll<HTMLElement>('article strong, .kpi-card strong, .metric-card strong, .stat-card strong').forEach(value => {
        value.textContent = '—';
      });
      container.querySelectorAll<HTMLElement>('article small, .kpi-card small, .metric-card small, .stat-card small').forEach(meta => {
        meta.textContent = 'No backend data';
      });
    });
  }

  function clearCharts(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('.bar-chart, .line-chart, .donut-chart, .chart-area, .chart-canvas, .mini-trend').forEach(chart => {
      chart.querySelectorAll('button, svg, canvas').forEach(node => node.remove());
      if (!chart.querySelector('.zentrid-api-data-empty')) chart.insertAdjacentHTML('beforeend', emptyMarkup('Chart data will appear when the backend endpoint is connected.'));
    });
  }

  function removeNonApiRows(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('.record-origin-chip[data-record-origin]:not([data-record-origin="live"])').forEach(chip => {
      chip.closest<HTMLElement>('.data-row, tr, .list-row, .record-card')?.remove();
    });
  }

  function applyUnsupportedPagePolicy(): void {
    if (isLiveRoute() || REFERENCE_ROUTES.has(route()) || route() === 'login.html') return;
    const main = document.querySelector<HTMLElement>('.main-content');
    if (!main) return;
    ensurePolicyNotice(main);
    removeNonApiRows(main);
    clearDataTables(main);
    clearMetrics(main);
    clearCharts(main);
    clearLegacyBusinessStorage();
  }

  function applyLivePagePolicy(): void {
    if (!isLiveRoute()) return;
    const main = document.querySelector<HTMLElement>('.main-content');
    if (main) removeNonApiRows(main);
  }

  let scheduled = false;
  function apply(): void {
    scheduled = false;
    applyUnsupportedPagePolicy();
    applyLivePagePolicy();
  }
  function schedule(): void {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(apply, 0);
  }

  clearLegacyBusinessStorage();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('zentrid:live-data-state', schedule as EventListener);
})();
