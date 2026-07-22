/* Zentrid Telemetry Governance page.
   The page renders only normalized fields returned by /api/telemetry.
   API loading, cache/freshness and failures remain owned by live-api-ui.ts. */
(function () {
  type TelemetryRecord = Record<string, ZentridLegacyCompat>;

  interface TelemetryPageState {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }

  interface ZentridTelemetryPageApi {
    readOptions(): { page: number; pageSize: number };
    setLoading(message?: string): void;
    render(result: ZentridRepositoryListResult): void;
    renderFailure(message: string): void;
  }

  const state: TelemetryPageState = {
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  };

  function escapeHtml(value: unknown): string {
    const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '—').replace(/[&<>"']/g, character => entities[character] || character);
  }

  function text(value: unknown, fallback = '—'): string {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value);
  }


  function qualityClass(value: unknown): string {
    const normalized = text(value, '').toLowerCase();
    if (/fresh|good|valid|normal|online|ok|success/.test(normalized)) return 'success';
    if (/stale|delay|warn|unknown|partial/.test(normalized)) return 'warning';
    if (/bad|invalid|fault|error|offline|critical|fail/.test(normalized)) return 'danger';
    return 'neutral';
  }

  function parsedTimestamp(record: TelemetryRecord): number | null {
    const raw = text(record.timestampRaw || record.timestamp, '');
    if (!raw) return null;
    const timestamp = Date.parse(raw);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function latestRecord(items: TelemetryRecord[]): TelemetryRecord | null {
    let latest: TelemetryRecord | null = null;
    let latestTimestamp = -Infinity;
    items.forEach(item => {
      const timestamp = parsedTimestamp(item);
      if (timestamp !== null && timestamp > latestTimestamp) {
        latest = item;
        latestTimestamp = timestamp;
      }
    });
    return latest;
  }

  function uniqueCount(items: TelemetryRecord[], key: string): number {
    const values = new Set<string>();
    items.forEach(item => {
      const value = text(item[key], '').trim();
      if (value && value !== '—') values.add(value.toLowerCase());
    });
    return values.size;
  }

  function summaryHtml(items: TelemetryRecord[], result?: ZentridRepositoryListResult): string {
    const latest = latestRecord(items);
    const totalCount = result?.pagination?.totalCount ?? state.totalCount;
    return `
      <article class="kpi-card">
        <span>Total Telemetry</span>
        <strong>${escapeHtml(totalCount)}</strong>
        <small>Backend totalCount</small>
      </article>
      <article class="kpi-card">
        <span>Loaded Page</span>
        <strong>${escapeHtml(items.length)}</strong>
        <small>Page ${escapeHtml(state.page)} of ${escapeHtml(state.totalPages)}</small>
      </article>
      <article class="kpi-card">
        <span>Metrics</span>
        <strong>${escapeHtml(uniqueCount(items, 'metric'))}</strong>
        <small>Unique on current page</small>
      </article>
      <article class="kpi-card">
        <span>Latest Reading</span>
        <strong>${escapeHtml(latest ? text(latest.timestamp) : '—')}</strong>
        <small>${escapeHtml(latest ? text(latest.provider, 'Live API') : 'No timestamp returned')}</small>
      </article>`;
  }

  function rowHtml(record: TelemetryRecord): string {
    const metric = text(record.metric);
    const displayValue = text(record.valueText, text(record.value));
    const plant = text(record.plant);
    const device = text(record.device);
    const deviceType = text(record.deviceType, '');
    const provider = text(record.provider);
    const quality = text(record.quality, text(record.status));
    const tenant = text(record.tenant);
    const timestamp = text(record.timestamp);
    const identifier = text(record.id, '');

    return `
      <div class="data-row" data-record-origin="live">
        <div><strong>${escapeHtml(metric)}</strong><small>${escapeHtml(identifier || 'Telemetry record')}</small></div>
        <div><strong>${escapeHtml(displayValue)}</strong><small>${escapeHtml(text(record.unit, 'Unit not supplied'))}</small></div>
        <div><strong>${escapeHtml(plant)}</strong><small>${escapeHtml([device, deviceType].filter(value => value && value !== '—').join(' · ') || 'Device not supplied')}</small></div>
        <div><strong>${escapeHtml(provider)}</strong><small>${escapeHtml(tenant)}</small><span class="badge ${qualityClass(quality)}">${escapeHtml(quality)}</span></div>
        <div><strong>${escapeHtml(timestamp)}</strong><small>${escapeHtml(text(record.timestampRaw, 'Raw timestamp not supplied'))}</small></div>
      </div>`;
  }

  function recordsHtml(items: TelemetryRecord[]): string {
    if (!items.length) {
      return `<div class="empty-state"><strong>No telemetry records returned</strong><small>/api/telemetry responded successfully, but the requested page contains no records.</small></div>`;
    }
    return `
      <div class="data-table telemetry-table">
        <div class="data-head"><span>Metric</span><span>Value</span><span>Plant / Device</span><span>Source / Quality</span><span>Timestamp</span></div>
        ${items.map(rowHtml).join('')}
      </div>`;
  }

  function updatePager(): void {
    const label = document.getElementById('telemetryPageLabel');
    const previous = document.getElementById('telemetryPreviousPage') as HTMLButtonElement | null;
    const next = document.getElementById('telemetryNextPage') as HTMLButtonElement | null;
    if (label) label.textContent = `Page ${state.page} of ${state.totalPages} · ${state.totalCount} record(s)`;
    if (previous) previous.disabled = !state.hasPreviousPage;
    if (next) next.disabled = !state.hasNextPage;
  }

  function requestPage(page: number): void {
    const target = Math.min(Math.max(1, page), Math.max(1, state.totalPages));
    if (target === state.page && state.totalCount > 0) return;
    state.page = target;
    window.dispatchEvent(new CustomEvent('zentrid:telemetry-page-change', {
      detail: { page: state.page, pageSize: state.pageSize }
    }));
  }

  function wire(): void {
    document.getElementById('telemetryRefresh')?.addEventListener('click', () => {
      window.ZentridDataFreshness?.requestRefresh('manual');
    });
    document.getElementById('telemetryPreviousPage')?.addEventListener('click', () => requestPage(state.page - 1));
    document.getElementById('telemetryNextPage')?.addEventListener('click', () => requestPage(state.page + 1));
  }

  function mountShell(): void {
    ZentridLayout.mount(`
      <section class="page-hero telemetry-hero">
        <div>
          <p class="eyebrow">Global Admin · Device Governance</p>
          <h1>Telemetry Governance</h1>
          <p class="muted">Live normalized telemetry received from the existing <code>/api/telemetry</code> endpoint.</p>
        </div>
        <button id="telemetryRefresh" class="freshness-card" type="button">
          <span class="pulse"></span>
          <div><strong>Live telemetry</strong><small>Refresh API data</small></div>
        </button>
      </section>
      <section id="telemetrySummary" class="telemetry-summary telemetry-lower">${summaryHtml([])}</section>
      <section class="panel glass-card telemetry-lower">
        <div class="panel-head">
          <div><h2>Telemetry Records</h2><p id="telemetryPageLabel">Loading the requested API page…</p></div>
          <div class="hero-actions">
            <button id="telemetryPreviousPage" class="secondary-action" type="button" disabled>Previous</button>
            <button id="telemetryNextPage" class="secondary-action" type="button" disabled>Next</button>
          </div>
        </div>
        <div id="telemetryRecords"><div class="empty-state"><strong>Loading telemetry</strong><small>Waiting for /api/telemetry.</small></div></div>
      </section>`);
    wire();
  }

  const api: ZentridTelemetryPageApi = {
    readOptions() {
      return { page: state.page, pageSize: state.pageSize };
    },
    setLoading(message = 'Loading telemetry from /api/telemetry…') {
      const container = document.getElementById('telemetryRecords');
      if (container) container.innerHTML = `<div class="empty-state"><strong>Loading telemetry</strong><small>${escapeHtml(message)}</small></div>`;
    },
    render(result) {
      const pagination = result.pagination;
      state.page = pagination.page;
      state.pageSize = pagination.pageSize;
      state.totalCount = pagination.totalCount;
      state.totalPages = pagination.totalPages;
      state.hasPreviousPage = pagination.hasPreviousPage;
      state.hasNextPage = pagination.hasNextPage;
      const items = result.items as TelemetryRecord[];
      const summary = document.getElementById('telemetrySummary');
      const records = document.getElementById('telemetryRecords');
      if (summary) summary.innerHTML = summaryHtml(items, result);
      if (records) records.innerHTML = recordsHtml(items);
      updatePager();
    },
    renderFailure(message) {
      const records = document.getElementById('telemetryRecords');
      if (records) records.innerHTML = `<div class="empty-state"><strong>Telemetry unavailable</strong><small>${escapeHtml(message)}</small></div>`;
      state.totalCount = 0;
      state.totalPages = 1;
      state.hasPreviousPage = false;
      state.hasNextPage = false;
      updatePager();
    }
  };

  mountShell();
  window.ZentridTelemetryPage = api;
})();
