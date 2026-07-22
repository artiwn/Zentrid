/* Zentrid API-only UI bridge.
   Runtime business records are rendered exclusively from backend responses or cached backend responses.
   Empty/error responses never fall back to prototype or browser-created data. */
(function () {
  const SOURCE_LABEL = 'Live API';
  const SLOW_ENDPOINT_TIMEOUT_MS = 90_000;

  type AnyRecord = Record<string, ZentridLegacyCompat>;


  type LiveDataState = 'loading' | 'live' | 'partial' | 'empty' | 'timeout' | 'unauthorized' | 'forbidden' | 'unavailable' | 'fallback';

  type LiveDataStateOptions = {
    title?: string;
    source?: string;
    details?: string;
    dataOrigin?: ZentridDataOrigin;
    recordCount?: number;
    freshnessStatus?: ZentridFreshnessStatus;
    freshnessUpdatedAt?: string;
    freshnessCacheAgeMs?: number;
  };

  type RequestErrorShape = {
    message?: unknown;
    status?: unknown;
    code?: unknown;
    path?: unknown;
  };

  type LiveSummaryItem = { label: unknown; value: unknown; meta?: unknown };

  type LiveSnapshotPayload = {
    plants?: AnyRecord[];
    devices?: AnyRecord[];
    alerts?: AnyRecord[];
    integrations?: AnyRecord[];
    providers?: unknown[];
    templates?: unknown[];
    plantTotalCount?: number | null;
    deviceTotalCount?: number | null;
    alertTotalCount?: number | null;
    integrationTotalCount?: number | null;
  };

  type RegistryEntity = 'clients' | 'plants' | 'devices' | 'alerts';
  const registryRequestVersions = new Map<RegistryEntity, number>();

  function isRegistryPage(entity: RegistryEntity): boolean {
    return location.pathname.endsWith(`/${entity}.html`) || location.pathname.endsWith(`${entity}.html`);
  }

  function registryReadOptions(entity: RegistryEntity, forceRefresh = false): ZentridRepositoryReadOptions {
    const state = window.ZentridRegistryQuery?.read(entity);
    return {
      page: state?.page || 1,
      pageSize: state?.pageSize || 50,
      staleWhileRevalidate: true,
      persist: true,
      requestGroup: `registry:${entity}`,
      supersede: true,
      forceRefresh
    };
  }

  function detailReadOptions(entity: string, pageSize = 100, forceRefresh = false): ZentridRepositoryReadOptions {
    return {
      page: 1,
      pageSize,
      staleWhileRevalidate: true,
      persist: true,
      requestGroup: `detail:${entity}`,
      supersede: true,
      forceRefresh
    };
  }

  function telemetryReadOptions(forceRefresh = false): ZentridRepositoryReadOptions {
    const page = window.ZentridTelemetryPage?.readOptions() || { page: 1, pageSize: 50 };
    return {
      page: page.page,
      pageSize: page.pageSize,
      staleWhileRevalidate: true,
      persist: true,
      requestGroup: 'registry:telemetry',
      supersede: true,
      forceRefresh,
      timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS
    };
  }

  function cacheAgeLabel(ageMs: number): string {
    if (ageMs < 1_000) return 'just now';
    if (ageMs < 60_000) return `${Math.max(1, Math.round(ageMs / 1_000))} sec ago`;
    return `${Math.max(1, Math.round(ageMs / 60_000))} min ago`;
  }

  function repositoryCachePresentation(result: ZentridRepositoryListResult): {
    state: LiveDataState;
    prefix: string;
    details: string;
    freshnessStatus: ZentridFreshnessStatus;
    updatedAt?: string;
    ageMs?: number;
  } {
    const cache = result.cache;
    if (!cache) return { state: 'live', prefix: '', details: '', freshnessStatus: 'live' };
    if (cache.state === 'stale' || cache.state === 'persistent' || cache.fallback) {
      const source = cache.state === 'persistent' ? 'Saved page' : 'Cached page';
      const action = cache.revalidating ? 'refreshing in background' : cache.fallback ? 'live refresh failed' : 'shown from cache';
      return {
        state: 'partial',
        prefix: `${source} from ${cacheAgeLabel(cache.ageMs)} is visible; ${action}. `,
        details: `${cache.state} cache · ${cacheAgeLabel(cache.ageMs)}`,
        freshnessStatus: cache.fallback ? 'stale' : 'cached',
        updatedAt: cache.updatedAt,
        ageMs: cache.ageMs
      };
    }
    if (cache.state === 'fresh') {
      return { state: 'live', prefix: '', details: `Memory cache · ${cacheAgeLabel(cache.ageMs)}`, freshnessStatus: 'cached', updatedAt: cache.updatedAt, ageMs: cache.ageMs };
    }
    return { state: 'live', prefix: '', details: 'Live network response', freshnessStatus: 'live', updatedAt: cache.updatedAt, ageMs: cache.ageMs };
  }


  function cacheFreshnessOptions(cacheInfo: ReturnType<typeof repositoryCachePresentation>): Pick<LiveDataStateOptions, 'freshnessStatus' | 'freshnessUpdatedAt' | 'freshnessCacheAgeMs'> {
    return {
      freshnessStatus: cacheInfo.freshnessStatus,
      ...(cacheInfo.updatedAt ? { freshnessUpdatedAt: cacheInfo.updatedAt } : {}),
      ...(Number.isFinite(cacheInfo.ageMs) ? { freshnessCacheAgeMs: cacheInfo.ageMs } : {})
    };
  }

  function publishRegistryPagination(entity: RegistryEntity, result: ZentridRepositoryListResult): void {
    const fallbackCount = Array.isArray(result.items) ? result.items.length : 0;
    const pagination = result.pagination || {
      page: 1,
      pageSize: Math.max(1, fallbackCount || 50),
      totalCount: fallbackCount,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };
    (result as ZentridRepositoryListResult & { pagination: ZentridRepositoryPagination }).pagination = pagination;
    window.ZentridRegistryQuery?.setPagination(entity, {
      ...pagination,
      server: true,
      source: result.source
    });
  }

  function beginRegistryRequest(entity: RegistryEntity): number {
    const next = (registryRequestVersions.get(entity) || 0) + 1;
    registryRequestVersions.set(entity, next);
    return next;
  }

  function isCurrentRegistryRequest(entity: RegistryEntity, version: number): boolean {
    return registryRequestVersions.get(entity) === version;
  }

  function contractDiagnosticsApi(): ZentridContractDiagnosticsApi | null {
    return typeof ZentridAPIContracts === 'undefined' ? null : ZentridAPIContracts.diagnostics;
  }

  contractDiagnosticsApi()?.clear();

  function asArray(value: unknown): AnyRecord[] {
    if (Array.isArray(value)) return value as AnyRecord[];
    if (!value || typeof value !== 'object') return [];
    const payload = value as AnyRecord;
    const keys = ['items', 'data', 'records', 'rows', 'results', 'content', 'value', 'values'];
    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key] as AnyRecord[];
    }
    if (payload.data && typeof payload.data === 'object') {
      const nested = asArray(payload.data);
      if (nested.length) return nested;
    }
    if (payload.result && typeof payload.result === 'object') {
      const nested = asArray(payload.result);
      if (nested.length) return nested;
    }
    return [];
  }

  function safeText(value: unknown, fallback: unknown = '—'): string {
    return value === undefined || value === null || value === '' ? String(fallback) : String(value);
  }


  type DetailSelectionKind = 'device' | 'alert';
  type DetailSelectionSnapshot = {
    version: 1;
    id: string;
    savedAt: string;
    record: AnyRecord;
  };

  const DETAIL_SELECTION_KEYS: Record<DetailSelectionKind, string> = {
    device: 'zentrid_selected_device_record',
    alert: 'zentrid_selected_alert_record'
  };

  function detailSelectionCandidates(record: AnyRecord | null | undefined): string[] {
    if (!record) return [];
    const raw = record.raw && typeof record.raw === 'object' ? record.raw as AnyRecord : {};
    return [
      record.id,
      record.externalId,
      record.serial,
      record.serialNumber,
      record.sourceDeviceId,
      record.alertId,
      raw.id,
      raw.deviceId,
      raw.alertId,
      raw.sourceDeviceId,
      raw.serialNumber
    ].map(value => safeText(value, '').trim()).filter(Boolean);
  }

  function detailSelectionMatches(record: AnyRecord | null | undefined, expectedId: string | null | undefined): boolean {
    const expected = safeText(expectedId, '').trim().toLowerCase();
    if (!expected) return Boolean(record);
    return detailSelectionCandidates(record).some(value => value.toLowerCase() === expected);
  }

  function saveDetailSelection(kind: DetailSelectionKind, record: AnyRecord | null | undefined): boolean {
    if (!record) return false;
    const id = detailSelectionCandidates(record)[0] || '';
    if (!id) return false;
    const snapshot: DetailSelectionSnapshot = { version: 1, id, savedAt: new Date().toISOString(), record };
    try {
      sessionStorage.setItem(DETAIL_SELECTION_KEYS[kind], JSON.stringify(snapshot));
      return true;
    } catch (error) {
      console.warn(`Zentrid live API: could not preserve the selected ${kind} record for detail navigation.`, error);
      return false;
    }
  }

  function readDetailSelection(kind: DetailSelectionKind, expectedId?: string | null): AnyRecord | null {
    try {
      const raw = sessionStorage.getItem(DETAIL_SELECTION_KEYS[kind]);
      if (!raw) return null;
      const snapshot = JSON.parse(raw) as Partial<DetailSelectionSnapshot>;
      const record = snapshot.record && typeof snapshot.record === 'object' ? snapshot.record as AnyRecord : null;
      if (!record || !detailSelectionMatches(record, expectedId || snapshot.id || '')) return null;
      return record;
    } catch {
      sessionStorage.removeItem(DETAIL_SELECTION_KEYS[kind]);
      return null;
    }
  }

  function resolveLiveSelection(kind: DetailSelectionKind, value: AnyRecord | string): AnyRecord | null {
    if (value && typeof value === 'object') return value;
    const id = safeText(value, '').trim();
    const source = kind === 'device' ? window.ZentridLiveDevices : window.ZentridLiveAlerts;
    return (Array.isArray(source) ? source : []).find((record: AnyRecord) => detailSelectionMatches(record, id)) || null;
  }

  function selectLiveDetail(kind: DetailSelectionKind, value: AnyRecord | string): void {
    const record = resolveLiveSelection(kind, value);
    const id = detailSelectionCandidates(record)[0] || safeText(value, '').trim();
    if (!id) return;
    if (record) saveDetailSelection(kind, record);
    localStorage.setItem(kind === 'device' ? 'zentrid_selected_device' : 'zentrid_selected_alert', id);
    location.href = kind === 'device' ? 'device-detail.html' : `alert-detail.html?id=${encodeURIComponent(id)}`;
  }

  window.ZentridLiveSelection = {
    saveDevice: (record: AnyRecord) => saveDetailSelection('device', record),
    saveAlert: (record: AnyRecord) => saveDetailSelection('alert', record),
    readDevice: (id?: string | null) => readDetailSelection('device', id),
    readAlert: (id?: string | null) => readDetailSelection('alert', id),
    selectDevice: (value: AnyRecord | string) => selectLiveDetail('device', value),
    selectAlert: (value: AnyRecord | string) => selectLiveDetail('alert', value)
  };

  function requestErrorShape(error: unknown): RequestErrorShape {
    if (error instanceof Error) {
      const enriched = error as Error & RequestErrorShape;
      return { message: enriched.message, status: enriched.status, code: enriched.code, path: enriched.path };
    }
    if (error && typeof error === 'object') return error as RequestErrorShape;
    return { message: String(error || 'Unknown request error') };
  }

  function liveErrorMessage(error: unknown): string {
    const shaped = requestErrorShape(error);
    return String(shaped.message || 'Request failed.');
  }

  function liveErrorState(error: unknown): LiveDataState {
    const shaped = requestErrorShape(error);
    const status = Number(shaped.status || 0);
    const code = String(shaped.code || '').toUpperCase();
    if (code === 'TIMEOUT') return 'timeout';
    if (status === 401 || code === 'SESSION_EXPIRED' || code === 'NO_REFRESH_TOKEN') return 'unauthorized';
    if (status === 403) return 'forbidden';
    return 'unavailable';
  }

  const LIVE_STATE_TITLES: Record<LiveDataState, string> = {
    loading: 'Loading live data',
    live: 'Live data connected',
    partial: 'Partial live data',
    empty: 'No live records',
    timeout: 'Live API timed out',
    unauthorized: 'Session expired',
    forbidden: 'Access denied',
    unavailable: 'Backend unavailable',
    fallback: 'No live data available'
  };

  const LIVE_STATE_ICONS: Record<LiveDataState, string> = {
    loading: '↻',
    live: '✓',
    partial: '◐',
    empty: '∅',
    timeout: '◷',
    unauthorized: '⌁',
    forbidden: '×',
    unavailable: '!',
    fallback: '∅'
  };

  const DATA_SOURCE_MESSAGES: Record<ZentridDataOrigin, string> = {
    live: 'Displayed records come from live backend responses.',
    mock: 'Prototype records are disabled in API-only mode.',
    local: 'Browser-created business records are disabled in API-only mode.',
    mixed: 'Displayed records come from multiple backend endpoints or API cache layers.'
  };

  function renderedDataOrigin(): ZentridDataOrigin {
    const chips = Array.from(document.querySelectorAll<HTMLElement>('.record-origin-chip[data-record-origin]'))
      .filter(chip => !chip.closest('.data-source-summary'));
    const origins = new Set<ZentridDataOrigin>();
    for (const chip of chips) {
      const origin = chip.dataset.recordOrigin;
      if (origin === 'live' || origin === 'mock' || origin === 'local' || origin === 'mixed') origins.add(origin);
    }
    if (origins.size > 1) return 'mixed';
    return origins.values().next().value || 'live';
  }

  function removeDataSourceSummary(): void {
    document.querySelector('.data-source-summary')?.remove();
  }

  function setDataSourceSummary(origin: ZentridDataOrigin, options: LiveDataStateOptions = {}): void {
    const main = document.querySelector('.main-content');
    if (!main || !window.ZentridDataSource) return;

    let summary = main.querySelector<HTMLElement>('.data-source-summary');
    if (!summary) {
      summary = document.createElement('section');
      summary.className = 'data-source-summary';
      const stateBanner = main.querySelector('.live-data-state');
      if (stateBanner) stateBanner.insertAdjacentElement('afterend', summary);
      else {
        const hero = main.querySelector('.page-hero');
        if (hero) hero.insertAdjacentElement('afterend', summary);
        else main.prepend(summary);
      }
    }

    summary.className = `data-source-summary ${origin}`;
    summary.dataset.dataOrigin = origin;
    summary.setAttribute('role', 'status');
    summary.setAttribute('aria-label', `Displayed data source: ${ZentridDataSource.label(origin)}`);
    summary.replaceChildren();

    const primary = document.createElement('div');
    primary.className = 'data-source-summary-primary';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'data-source-summary-label';
    eyebrow.textContent = 'Displayed data';
    const chip = document.createElement('span');
    chip.className = `record-origin-chip ${origin}`;
    chip.dataset.recordOrigin = origin;
    chip.textContent = ZentridDataSource.label(origin);
    const description = document.createElement('small');
    description.textContent = DATA_SOURCE_MESSAGES[origin];
    primary.append(eyebrow, chip, description);

    const meta = document.createElement('div');
    meta.className = 'data-source-summary-meta';
    const metaParts = [
      options.recordCount !== undefined ? `${options.recordCount} record(s)` : '',
      options.source || '',
      options.details || ''
    ].filter(Boolean);
    meta.textContent = metaParts.join(' · ') || 'Source is identified per visible record.';

    const legend = document.createElement('div');
    legend.className = 'data-source-legend';
    (['live'] as ZentridDataOrigin[]).forEach(value => {
      const item = document.createElement('span');
      item.className = `record-origin-chip ${value} compact`;
      item.dataset.recordOrigin = value;
      item.textContent = ZentridDataSource.label(value);
      legend.append(item);
    });

    summary.append(primary, meta, legend);
  }

  function removeContractDiagnostics(): void {
    document.querySelector('.contract-diagnostics')?.remove();
  }

  function contractIssueTitle(issue: ZentridContractIssue): string {
    return `${issue.entityLabel} #${issue.index + 1} · ${issue.field}`;
  }

  function syncContractDiagnostics(state: LiveDataState): void {
    if (state === 'loading') {
      contractDiagnosticsApi()?.clear();
      removeContractDiagnostics();
      return;
    }
    if (state !== 'live' && state !== 'partial') {
      removeContractDiagnostics();
      return;
    }

    const diagnostics = contractDiagnosticsApi();
    if (!diagnostics) {
      removeContractDiagnostics();
      return;
    }
    const issues = diagnostics.list();
    if (!issues.length) {
      removeContractDiagnostics();
      return;
    }

    const main = document.querySelector('.main-content');
    if (!main) return;
    const summary = diagnostics.summary();
    let panel = main.querySelector<HTMLElement>('.contract-diagnostics');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'contract-diagnostics';
      const sourceSummary = main.querySelector('.data-source-summary');
      const stateBanner = main.querySelector('.live-data-state');
      if (sourceSummary) sourceSummary.insertAdjacentElement('afterend', panel);
      else if (stateBanner) stateBanner.insertAdjacentElement('afterend', panel);
      else main.prepend(panel);
    }

    panel.className = `contract-diagnostics ${summary.errors ? 'error' : 'warning'}`;
    panel.dataset.contractIssueCount = String(summary.total);
    panel.setAttribute('role', summary.errors ? 'alert' : 'status');
    panel.setAttribute('aria-live', 'polite');
    panel.replaceChildren();

    const heading = document.createElement('div');
    heading.className = 'contract-diagnostics-heading';
    const icon = document.createElement('span');
    icon.className = 'contract-diagnostics-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = summary.errors ? '!' : '△';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = summary.errors ? 'API contract mismatch' : 'API contract warning';
    const description = document.createElement('span');
    const entityCount = summary.affectedEntities.length;
    description.textContent = `${summary.errors} required-field error(s) and ${summary.warnings} warning(s) across ${entityCount} entity type(s). Missing fields are shown as unavailable; each raw payload remains available for diagnostics.`;
    copy.append(title, description);
    heading.append(icon, copy);

    const details = document.createElement('details');
    details.className = 'contract-diagnostics-details';
    const detailsSummary = document.createElement('summary');
    detailsSummary.textContent = `Review ${summary.total} contract issue(s)`;
    const list = document.createElement('div');
    list.className = 'contract-diagnostics-list';
    const visibleIssues = issues.slice(0, 12);
    visibleIssues.forEach(issue => {
      const item = document.createElement('div');
      item.className = issue.severity;
      const label = document.createElement('strong');
      label.textContent = contractIssueTitle(issue);
      const message = document.createElement('span');
      message.textContent = issue.message;
      item.append(label, message);
      list.append(item);
    });
    if (issues.length > visibleIssues.length) {
      const remaining = document.createElement('div');
      remaining.className = 'more';
      remaining.textContent = `${issues.length - visibleIssues.length} additional issue(s) are available through ZentridAPIContracts.diagnostics.list().`;
      list.append(remaining);
    }
    details.append(detailsSummary, list);
    panel.append(heading, details);
  }

  function syncDataSourceForState(state: LiveDataState, options: LiveDataStateOptions): void {
    if (state === 'loading') {
      removeDataSourceSummary();
      return;
    }
    const origin = options.dataOrigin
      || (state === 'live' || state === 'partial' ? 'live' : renderedDataOrigin());
    setDataSourceSummary(origin, options);
  }

  function setLiveDataState(state: LiveDataState, message: string, options: LiveDataStateOptions = {}): void {
    const main = document.querySelector('.main-content');
    if (!main) return;

    let banner = main.querySelector<HTMLElement>('.live-data-state');
    if (!banner) {
      banner = document.createElement('section');
      banner.className = 'live-data-state';
      const hero = main.querySelector('.page-hero');
      if (hero) hero.insertAdjacentElement('afterend', banner);
      else main.prepend(banner);
    }

    banner.className = `live-data-state ${state}`;
    banner.dataset.liveState = state;
    banner.setAttribute('role', ['timeout', 'unauthorized', 'forbidden', 'unavailable'].includes(state) ? 'alert' : 'status');
    banner.setAttribute('aria-live', state === 'loading' ? 'polite' : 'assertive');
    banner.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    banner.replaceChildren();

    const icon = document.createElement('span');
    icon.className = 'live-data-state-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = LIVE_STATE_ICONS[state];

    const content = document.createElement('div');
    content.className = 'live-data-state-content';
    const title = document.createElement('strong');
    title.textContent = options.title || LIVE_STATE_TITLES[state];
    const body = document.createElement('span');
    body.textContent = message;
    content.append(title, body);

    const metaParts = [options.source, options.details].filter(Boolean);
    if (metaParts.length) {
      const meta = document.createElement('small');
      meta.className = 'live-data-state-meta';
      meta.textContent = metaParts.join(' · ');
      content.append(meta);
    }

    banner.append(icon, content);
    window.ZentridDataFreshness?.sync({
      liveState: state,
      message,
      ...(options.title ? { title: options.title } : {}),
      ...(options.source ? { source: options.source } : {}),
      ...(options.details ? { details: options.details } : {}),
      ...(options.freshnessStatus ? { status: options.freshnessStatus } : {}),
      ...(options.freshnessUpdatedAt ? { updatedAt: options.freshnessUpdatedAt } : {}),
      ...(Number.isFinite(options.freshnessCacheAgeMs) ? { cacheAgeMs: options.freshnessCacheAgeMs } : {})
    } as ZentridFreshnessSyncInput);
    syncDataSourceForState(state, options);
    syncContractDiagnostics(state);
  }

  function setRequestFailure(endpoint: string, error: unknown, fallbackMessage: string): void {
    const state = liveErrorState(error);
    const shaped = requestErrorShape(error);
    const messages: Record<'timeout' | 'unauthorized' | 'forbidden' | 'unavailable', string> = {
      timeout: `${endpoint} did not respond within the configured timeout. ${fallbackMessage}`,
      unauthorized: `Your session is no longer valid. Zentrid will return to the sign-in page.`,
      forbidden: `The current account is not allowed to read ${endpoint}. ${fallbackMessage}`,
      unavailable: `${endpoint} could not be reached or returned an error. ${fallbackMessage}`
    };
    const normalized = state === 'timeout' || state === 'unauthorized' || state === 'forbidden' ? state : 'unavailable';
    const status = Number(shaped.status || 0);
    const code = String(shaped.code || 'REQUEST_FAILED');
    const detail = status ? `${code} · HTTP ${status}` : code;
    setLiveDataState(normalized, messages[normalized], {
      source: endpoint,
      details: `${detail} · ${liveErrorMessage(error)}`
    });
  }

  function fmtDate(value: unknown, fallback: string = 'No data'): string {
    if (!value) return fallback;
    try {
      const date = new Date(value as string | number | Date);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return String(value);
    }
  }

  function badge(status: unknown): string {
    const value = String(status || '').toLowerCase();
    if (value.includes('ok') || value.includes('active') || value.includes('online') || value.includes('normal')) return 'success';
    if (value.includes('fail') || value.includes('fault') || value.includes('offline') || value.includes('critical')) return 'danger';
    if (value.includes('warn') || value.includes('unknown') || value.includes('stale') || value.includes('delayed')) return 'warning';
    return 'neutral';
  }

  function insertIntegrationLiveSummary(items: LiveSummaryItem[] = []): void {
    const main = document.querySelector('.main-content');
    if (!main || document.querySelector('.integration-live-summary')) return;
    const rows = items.map(item => `
      <article>
        <span>${safeText(item.label, 'Endpoint')}</span>
        <strong>${safeText(item.value, '—')}</strong>
        <small>${safeText(item.meta, '')}</small>
      </article>`).join('');
    const section = document.createElement('section');
    section.className = 'integration-live-summary glass-card';
    section.innerHTML = `
      <div>
        <p class="eyebrow">Backend live source</p>
        <h3>Connected API snapshot</h3>
      </div>
      <div class="integration-live-summary-grid">${rows}</div>`;
    const context = main.querySelector('.context-bar');
    if (context && context.nextSibling) main.insertBefore(section, context.nextSibling);
    else main.appendChild(section);
  }


  function sum(values: unknown[]): number {
    return values.reduce<number>((acc, value) => acc + Number(value || 0), 0);
  }

  function compactNumber(value: unknown, suffix: string = ''): string {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return `0${suffix}`;
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix}`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k${suffix}`;
    return `${n}${suffix}`;
  }

  function knownCollectionTotal(totalCount: number | null | undefined, rows: unknown[]): number | null {
    if (typeof totalCount !== 'number' || !Number.isFinite(totalCount) || totalCount < 0) return null;
    return Math.max(totalCount, rows.length);
  }

  function overviewCoverageLabel(loaded: number, totalCount: number | null, noun: string): string {
    if (totalCount === null) return `${loaded} ${noun} row(s) loaded`;
    if (loaded >= totalCount) return `All ${compactNumber(totalCount)} ${noun} row(s) loaded`;
    return `Page sample · ${loaded} of ${compactNumber(totalCount)} ${noun}`;
  }

  function uniqueOverviewValues(values: unknown[]): unknown[] {
    const seen = new Set<string>();
    return values.filter(value => {
      const key = safeText(value, '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function snapshotFromLive({
    plants = [], devices = [], alerts = [], integrations = [], providers = [], templates = [],
    plantTotalCount = null, deviceTotalCount = null, alertTotalCount = null, integrationTotalCount = null
  }: LiveSnapshotPayload) {
    const knownPlantTotal = knownCollectionTotal(plantTotalCount, plants);
    const knownDeviceTotal = knownCollectionTotal(deviceTotalCount, devices);
    const knownAlertTotal = knownCollectionTotal(alertTotalCount, alerts);
    const knownIntegrationTotal = knownCollectionTotal(integrationTotalCount, integrations);
    const plantCount = knownPlantTotal ?? (plants.length || sum(integrations.map(x => x.plantsCount || x.plants)));
    const deviceCount = knownDeviceTotal ?? (devices.length || sum(integrations.map(x => x.devicesCount || x.devices)));
    const alertCount = knownAlertTotal ?? (alerts.length || sum(integrations.map(x => x.alertsCount || x.alerts)));
    const currentPowerKw = sum(plants.map(x => x.currentPowerKw));
    const liveProviderNames = integrations.map(x => x.displayName || x.provider || x.name || x.vendor).filter(Boolean);
    const providerNames = uniqueOverviewValues(providers.length ? providers : liveProviderNames);
    const staleCount = sum(integrations.map(x => x.stalePlantsCount || x.liveSummary?.raw?.stalePlantsCount));
    const errorRate = integrations.length ? (sum(integrations.map(x => x.errorRatePct || x.liveSummary?.raw?.errorRatePct)) / integrations.length) : 0;
    return {
      plantCount,
      deviceCount,
      alertCount,
      currentPowerKw,
      providerNames,
      staleCount,
      errorRate,
      integrationCount: knownIntegrationTotal ?? integrations.length,
      templateCount: templates.length,
      plantTotalCount: knownPlantTotal,
      deviceTotalCount: knownDeviceTotal,
      alertTotalCount: knownAlertTotal,
      integrationTotalCount: knownIntegrationTotal
    };
  }

  function applyOverviewDataFromLive(payload: Required<LiveSnapshotPayload>): void {
    const store = window.ZentridMock;
    if (!store) return;
    const snap = snapshotFromLive(payload);
    const currentPowerText = payload.plants.some(row => row.currentPowerKw !== undefined && row.currentPowerKw !== null)
      ? `${snap.currentPowerKw} kW`
      : '—';

    store.kpis = [
      { label: 'Live Providers', value: String(snap.providerNames.length || snap.integrationCount), delta: snap.providerNames.join(', ') || '—', icon: '🔗', tone: 'cyan', route: 'integrations' },
      { label: 'Plants', value: compactNumber(snap.plantCount), delta: overviewCoverageLabel(payload.plants.length, snap.plantTotalCount, 'plant'), icon: '🏭', tone: 'green', route: 'plants' },
      { label: 'Devices', value: compactNumber(snap.deviceCount), delta: overviewCoverageLabel(payload.devices.length, snap.deviceTotalCount, 'device'), icon: '🔌', tone: 'blue', route: 'devices' },
      { label: 'Live Power', value: currentPowerText, delta: payload.plants.length ? `Current page total · ${overviewCoverageLabel(payload.plants.length, snap.plantTotalCount, 'plant')}` : 'No plant power rows returned', icon: '⚡', tone: 'yellow', route: 'telemetry' },
      { label: 'Alerts', value: compactNumber(snap.alertCount), delta: overviewCoverageLabel(payload.alerts.length, snap.alertTotalCount, 'alert'), icon: '🚨', tone: 'red', route: 'alerts' },
      { label: 'Templates', value: compactNumber(snap.templateCount), delta: 'Provider integration templates returned by API', icon: '🧩', tone: 'violet', route: 'integrations' }
    ];

    store.integrations = payload.integrations.map(row => ({
      name: safeText(row.displayName || row.name || row.provider || row.vendor, '—'),
      status: safeText(row.operationalStatus || row.status || row.health, '—'),
      sync: safeText(row.lastSyncText || row.lastSync, fmtDate(row.lastSyncAtUtc || row.updatedAt, '—')),
      errors: row.vendorExtensions?.errorsCount ?? row.errorRatePct ?? null
    }));

    store.alerts = payload.alerts.slice(0, 6).map(row => ({
      title: safeText(row.title || row.message || row.sourceAlertId || row.id, '—'),
      vendorDisplayName: safeText(row.title || row.message || row.sourceAlertId || row.id, '—'),
      registeredName: safeText(row.sourceAlertId || row.id || row.title, '—'),
      tenant: safeText(row.tenantName || row.managingTenant || row.tenant, '—'),
      plant: safeText(row.plantName || row.sourcePlantId, '—'),
      severity: safeText(row.severity, '—'),
      time: fmtDate(row.occurredAtUtc, '—')
    }));

    store.quality = [
      { label: 'Providers', value: String(snap.providerNames.length || snap.integrationCount) },
      { label: 'Templates', value: String(snap.templateCount) },
      { label: 'Stale Plants', value: payload.integrations.some(row => row.stalePlantsCount !== undefined || row.liveSummary?.raw?.stalePlantsCount !== undefined) ? String(snap.staleCount) : '—' },
      { label: 'Avg Error Rate', value: payload.integrations.some(row => row.errorRatePct !== undefined || row.liveSummary?.raw?.errorRatePct !== undefined) ? `${snap.errorRate.toFixed(1)}%` : '—' }
    ];
  }

  function integrationVendor(provider: unknown): string {
    const p = String(provider || '').trim();
    if (/deye/i.test(p)) return 'DeyeCloud';
    if (/solax/i.test(p)) return 'SolaX';
    return p || 'Unknown';
  }

  function integrationSoftware(provider: unknown): string {
    const p = integrationVendor(provider);
    if (/deye/i.test(p)) return 'DeyeCloud';
    if (/solax/i.test(p)) return 'SolaX Cloud';
    return p;
  }

  function ensureVendorTemplateAliases(): void {
    try {
      if (typeof vendorTemplates === 'undefined') return;
      const templates = vendorTemplates as Record<string, AnyRecord>;
      if (templates.Deye && !templates.DeyeCloud) {
        templates.DeyeCloud = { ...templates.Deye, software: 'DeyeCloud', scope: 'Backend provider template / live integration summary' };
      }
      if (templates.DeyeCloud && !templates.Deye) {
        templates.Deye = { ...templates.DeyeCloud, software: 'DeyeCloud', scope: 'Backend provider template / live integration summary' };
      }
      if (templates.SolaX && !templates.Solarx) {
        templates.Solarx = { ...templates.SolaX, software: 'SolaX Cloud', scope: 'Backend provider template / live integration summary' };
      }
      if (templates.Solarx && !templates.SolaX) {
        templates.SolaX = { ...templates.Solarx, software: 'SolaX Cloud', scope: 'Backend provider template / live integration summary' };
      }
    } catch (e) {}
  }

  const contractMapperContext: ZentridContractMapperContext = {
    safeText,
    firstOf,
    displayName: liveDisplayName,
    formatDate: fmtDate,
    integrationVendor,
    integrationSoftware
  };

  function sameId(a: unknown, b: unknown): boolean {
    if (a === undefined || a === null || b === undefined || b === null) return false;
    const aa = String(a).trim();
    const bb = String(b).trim();
    return aa !== '' && bb !== '' && aa === bb;
  }

  function plantMatchesDevice(plant: AnyRecord, device: AnyRecord): boolean {
    return sameId(device.plantId, plant.externalId) || sameId(device.plantId, plant.id) || sameId(device.raw?.sourcePlantId, plant.externalId) || sameId(device.raw?.sourcePlantId, plant.id);
  }

  function plantMatchesAlert(plant: AnyRecord, alert: AnyRecord): boolean {
    return sameId(alert.plantId, plant.externalId) || sameId(alert.plantId, plant.id) || sameId(alert.raw?.sourcePlantId, plant.externalId) || sameId(alert.raw?.sourcePlantId, plant.id);
  }

  function deviceMatchesAlert(device: AnyRecord, alert: AnyRecord): boolean {
    return sameId(alert.deviceId, device.externalId) || sameId(alert.deviceId, device.id) || sameId(alert.raw?.sourceDeviceId, device.externalId) || sameId(alert.raw?.sourceDeviceId, device.id);
  }

  function sameLabel(a: unknown, b: unknown): boolean {
    const left = safeText(a, '').trim().toLowerCase();
    const right = safeText(b, '').trim().toLowerCase();
    return Boolean(left && right && left === right && left !== '—');
  }

  function plantMatchesTelemetry(plant: AnyRecord, telemetry: AnyRecord): boolean {
    return sameId(telemetry.plantId, plant.externalId)
      || sameId(telemetry.plantId, plant.id)
      || sameId(telemetry.raw?.sourcePlantId, plant.externalId)
      || sameId(telemetry.raw?.sourcePlantId, plant.id)
      || sameLabel(telemetry.plant, plant.name);
  }

  function deviceMatchesTelemetry(device: AnyRecord, telemetry: AnyRecord): boolean {
    return sameId(telemetry.deviceId, device.externalId)
      || sameId(telemetry.deviceId, device.id)
      || sameId(telemetry.deviceId, device.serial)
      || sameId(telemetry.raw?.sourceDeviceId, device.externalId)
      || sameId(telemetry.raw?.sourceDeviceId, device.id)
      || sameId(telemetry.raw?.sourceDeviceId, device.serial)
      || sameLabel(telemetry.device, device.name);
  }

  function publishDetailTelemetry(scope: 'plant' | 'device', record: AnyRecord, rows: AnyRecord[]): void {
    const key = safeText(record?.id, '').trim();
    if (!key) return;
    if (scope === 'plant') {
      window.ZentridLiveTelemetryByPlant = { ...(window.ZentridLiveTelemetryByPlant || {}), [key]: rows };
      window.ZentridLiveTelemetryLoadedPlants = { ...(window.ZentridLiveTelemetryLoadedPlants || {}), [key]: true };
      return;
    }
    window.ZentridLiveTelemetryByDevice = { ...(window.ZentridLiveTelemetryByDevice || {}), [key]: rows };
    window.ZentridLiveTelemetryLoadedDevices = { ...(window.ZentridLiveTelemetryLoadedDevices || {}), [key]: true };
  }

  function enrichPlantRelations(plants: AnyRecord[], devices: AnyRecord[], alerts: AnyRecord[]): AnyRecord[] {
    return plants.map(plant => {
      const relatedDevices = devices.filter(device => plantMatchesDevice(plant, device));
      const relatedAlerts = alerts.filter(alert => plantMatchesAlert(plant, alert));
      const typeCounts = relatedDevices.reduce((acc, device) => {
        const key = String(device.type || '').toLowerCase();
        if (key.includes('invert')) acc.inverters += 1;
        else if (key.includes('meter')) acc.meters += 1;
        else if (key.includes('logger') || key.includes('collector') || key.includes('gateway')) acc.loggers += 1;
        else acc.other += 1;
        return acc;
      }, { inverters: 0, meters: 0, loggers: 0, other: 0 });
      return {
        ...plant,
        devices: relatedDevices.length || plant.devices,
        alerts: relatedAlerts.length || plant.alerts,
        inverters: typeCounts.inverters || plant.inverters,
        meters: typeCounts.meters || plant.meters,
        loggers: typeCounts.loggers,
        relatedDevices,
        relatedAlerts
      };
    });
  }

  function enrichDeviceRelations(devices: AnyRecord[], plants: AnyRecord[], alerts: AnyRecord[]): AnyRecord[] {
    return devices.map(device => {
      const plant = plants.find(p => plantMatchesDevice(p, device));
      const relatedAlerts = alerts.filter(alert => deviceMatchesAlert(device, alert) || (plant && plantMatchesAlert(plant, alert)));
      return {
        ...device,
        plant: plant?.name || device.plant,
        plantPortfolioId: plant?.id || '',
        tenant: plant?.tenant || device.tenant,
        alerts: relatedAlerts.length || device.alerts,
        relatedPlant: plant || null,
        relatedAlerts
      };
    });
  }

  function liveTable(title: string, subtitle: string, columns: string[], rows: string[][], emptyText?: string): string {
    const body = rows.length ? rows.map(row => `<div class="data-row">${row.map((cell, index) => `<div>${index === 0 ? ZentridDataSource.badge('live', 'record') : ''}${cell}</div>`).join('')}</div>`).join('') : `<div class="data-row"><div><strong>${htmlEscape(emptyText || 'No related records')}</strong><small>Backend returned no matching records for this relation.</small></div></div>`;
    return `<section class="glass-card live-related-card"><div class="panel-head compact"><div><h3>${htmlEscape(title)}</h3><p class="muted">${htmlEscape(subtitle)}</p></div></div><div class="data-table compact-table live-related-table"><div class="data-head">${columns.map(c => `<span>${htmlEscape(c)}</span>`).join('')}</div>${body}</div></section>`;
  }

  function relatedDevicesTable(devices: AnyRecord[], plant: AnyRecord): string {
    const rows = devices.slice(0, 25).map(d => [
      `<strong>${htmlEscape(d.name)}</strong><small>${htmlEscape(d.externalId)} · ${htmlEscape(d.serial)}</small>`,
      `<strong>${htmlEscape(d.type)}</strong><small>${htmlEscape(d.vendor)} · ${htmlEscape(d.sourceStatus)}</small>`,
      `<span class="badge ${badge(d.status)}">${htmlEscape(d.status)}</span><small>${htmlEscape(d.lastSeen)}</small>`,
      `<button class="small-btn" type="button" onclick="window.ZentridLiveSelection.selectDevice('${htmlEscape(d.id)}')">Open</button>`
    ]);
    return liveTable('Plant Devices', `${devices.length} matched by sourcePlantId / plant id. Showing first ${Math.min(25, devices.length)}.`, ['Device', 'Type / Source', 'Status', 'Action'], rows, `No devices matched ${plant.externalId || plant.id}`);
  }

  function relatedAlertsTable(alerts: AnyRecord[], contextLabel: string): string {
    const rows = alerts.slice(0, 25).map(a => [
      `<strong>${htmlEscape(a.title)}</strong><small>${htmlEscape(a.description)}</small>`,
      `<span class="badge ${badge(a.severity)}">${htmlEscape(a.severity)}</span><small>${htmlEscape(a.status)}</small>`,
      `<strong>${htmlEscape(a.plant)}</strong><small>${htmlEscape(a.device)}</small>`,
      `<button class="small-btn" type="button" onclick="window.ZentridLiveSelection.selectAlert('${htmlEscape(a.id)}')">Open</button>`
    ]);
    return liveTable('Related Alerts', `${alerts.length} matched for ${contextLabel}. Showing first ${Math.min(25, alerts.length)}.`, ['Alert', 'Severity / Status', 'Object', 'Action'], rows, 'No related alerts found');
  }

  function integrationMatchKey(row: AnyRecord): string {
    return safeText(firstOf(row, ['vendor', 'provider', 'providerName', 'vendorName', 'raw.provider', 'raw.providerName', 'raw.vendorName'], ''), '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function mergeIntegrationSummaries(registry: AnyRecord[], summaries: AnyRecord[]): AnyRecord[] {
    if (!summaries.length) return registry;
    return registry.map(record => {
      const key = integrationMatchKey(record);
      const summary = summaries.find(item => integrationMatchKey(item) === key);
      if (!summary) return record;
      return {
        ...record,
        plants: Number(summary.plants || record.plants || 0),
        devices: Number(summary.devices || record.devices || 0),
        alerts: Number(summary.alerts || record.alerts || 0),
        activeIntegrations: Number(summary.activeIntegrations || record.activeIntegrations || 0),
        health: summary.health || record.health,
        operationalStatus: summary.status || summary.health || '',
        lastSync: summary.lastSync || record.lastSync,
        lastActivity: summary.lastActivity || record.lastActivity,
        lastSuccessfulSync: summary.lastSuccessfulSync || record.lastSuccessfulSync,
        lastErrorMessage: summary.lastErrorMessage || record.lastErrorMessage,
        liveSummary: summary
      };
    });
  }

  function renderOverviewLiveSnapshot(payload: Required<LiveSnapshotPayload>): void {
    applyOverviewDataFromLive(payload);
    const overviewRenderer = window.renderOverview;
    const overviewWireHandler = window.wireOverview;
    if (typeof overviewRenderer === 'function' && typeof overviewWireHandler === 'function') {
      ZentridLayout.mount(overviewRenderer());
      overviewWireHandler();
    }
  }

  async function applyOverview(forceRefresh = false): Promise<void> {
    if (!/(^|\/)index\.html$/.test(location.pathname) && !/\/$/.test(location.pathname)) return;
    setLiveDataState('loading', 'Loading core records first. Alerts and operational integration summaries will continue in the background.', { source: 'Zentrid Platform APIs' });

    const payload: Required<LiveSnapshotPayload> = {
      plants: [], devices: [], alerts: [], integrations: [], providers: [], templates: [],
      plantTotalCount: null, deviceTotalCount: null, alertTotalCount: null, integrationTotalCount: null
    };
    const errors: unknown[] = [];
    const pending = new Set(['alerts', 'integration summaries']);

    const updateState = (): void => {
      const populatedGroups = [payload.plants, payload.devices, payload.alerts, payload.integrations, payload.providers, payload.templates].filter(rows => Array.isArray(rows) && rows.length > 0).length;
      const snap = snapshotFromLive(payload);
      const totalRecords = snap.plantCount + snap.deviceCount + snap.alertCount + snap.integrationCount + payload.providers.length + payload.templates.length;
      const pendingText = [...pending].join(' and ');
      const state: LiveDataState = pending.size || errors.length ? 'partial' : 'live';
      const message = pending.size
        ? `Core dashboard data is ready. ${pendingText} ${pending.size === 1 ? 'is' : 'are'} still loading without blocking the page.`
        : errors.length
          ? 'Available live records were applied. One or more background endpoints did not complete, so those sections remain empty.'
          : 'Core and background live records were applied progressively.';
      setLiveDataState(state, message, {
        source: 'Zentrid Platform APIs',
        dataOrigin: populatedGroups >= 5 ? 'live' : 'mixed',
        recordCount: totalRecords,
        details: pending.size ? `Background: ${pendingText}` : errors.length ? `${errors.length} background request failure(s)` : 'Progressive loading complete'
      });
      insertIntegrationLiveSummary([
        { label: 'Core plants / devices', value: `${compactNumber(snap.plantCount)}/${compactNumber(snap.deviceCount)}`, meta: `${payload.plants.length}/${payload.devices.length} page row(s) loaded` },
        { label: 'Alerts', value: pending.has('alerts') ? 'Loading…' : compactNumber(snap.alertCount), meta: pending.has('alerts') ? 'Background request' : `${payload.alerts.length} page row(s) loaded` },
        { label: 'Integrations', value: compactNumber(snap.integrationCount), meta: pending.has('integration summaries') ? `${payload.integrations.length} registry row(s); operational summary loading` : `${payload.integrations.length} registry row(s) enriched` }
      ]);
    };

    try {
      const results = await Promise.allSettled([
        ZentridAPIRepositories.plants.list(detailReadOptions('overview:plants', 100, forceRefresh)),
        ZentridAPIRepositories.devices.list(detailReadOptions('overview:devices', 100, forceRefresh)),
        ZentridAPIRepositories.integrations.list(detailReadOptions('integrations', 50, forceRefresh)),
        ZentridPlatformAPI.live.providers(),
        ZentridPlatformAPI.providerIntegrations.templates()
      ]);
      const [plantsResult, devicesResult, registryResult, providersResult, templatesResult] = results;
      payload.plants = plantsResult.status === 'fulfilled' ? plantsResult.value.rawItems : [];
      payload.plantTotalCount = plantsResult.status === 'fulfilled' ? plantsResult.value.pagination.totalCount : null;
      payload.devices = devicesResult.status === 'fulfilled' ? devicesResult.value.rawItems : [];
      payload.deviceTotalCount = devicesResult.status === 'fulfilled' ? devicesResult.value.pagination.totalCount : null;
      payload.integrations = registryResult.status === 'fulfilled' ? registryResult.value.items : [];
      payload.integrationTotalCount = registryResult.status === 'fulfilled' ? registryResult.value.pagination.totalCount : null;
      payload.providers = providersResult.status === 'fulfilled' ? asArray(providersResult.value) : [];
      payload.templates = templatesResult.status === 'fulfilled' ? asArray(templatesResult.value) : [];
      results.forEach(result => { if (result.status === 'rejected') errors.push(result.reason); });
      if (plantsResult.status === 'fulfilled') errors.push(...plantsResult.value.errors);
      if (devicesResult.status === 'fulfilled') errors.push(...devicesResult.value.errors);
      if (registryResult.status === 'fulfilled') errors.push(...registryResult.value.errors);

      const hasCoreSignal = Boolean(payload.plants.length || payload.devices.length || payload.integrations.length || payload.providers.length || payload.templates.length);
      if (!hasCoreSignal) {
        if (errors.length) setRequestFailure('Overview core endpoints', errors[0], 'No prototype fallback is displayed.');
        else setLiveDataState('empty', 'Core endpoints returned no records. The dashboard remains empty while background checks continue.', { source: 'Zentrid Platform APIs' });
      } else {
        renderOverviewLiveSnapshot(payload);
        updateState();
      }
    } catch (error) {
      errors.push(error);
      setRequestFailure('Overview core endpoints', error, 'No prototype fallback is displayed.');
    }

    void ZentridAPIRepositories.alerts.list({ ...detailReadOptions('overview:alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
      .then(result => {
        payload.alerts = result.rawItems;
        payload.alertTotalCount = result.pagination.totalCount;
        errors.push(...result.errors);
        renderOverviewLiveSnapshot(payload);
      })
      .catch(error => errors.push(error))
      .finally(() => { pending.delete('alerts'); updateState(); });

    void ZentridAPIRepositories.integrations.summary({ ...detailReadOptions('integration-summary', 50, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
      .then(result => {
        payload.integrations = mergeIntegrationSummaries(payload.integrations || [], result.items);
        errors.push(...result.errors);
        renderOverviewLiveSnapshot(payload);
      })
      .catch(error => errors.push(error))
      .finally(() => { pending.delete('integration summaries'); updateState(); });
  }

  async function applyIntegrations(forceRefresh = false): Promise<void> {
    if (!/integrations\.html$/.test(location.pathname)) return;
    ensureVendorTemplateAliases();
    setLiveDataState('loading', 'Loading the fast integration registry first. Operational summaries will be added in the background.', { source: '/api/admin/provider-integrations' });
    try {
      const [registryResult, providersResult, templatesResult] = await Promise.allSettled([
        ZentridAPIRepositories.integrations.list(detailReadOptions('integration-registry', 50, forceRefresh)),
        ZentridPlatformAPI.live.providers(),
        ZentridPlatformAPI.providerIntegrations.templates()
      ]);
      const registry = registryResult.status === 'fulfilled' ? registryResult.value : null;
      const data = registry?.items || [];
      const providers = providersResult.status === 'fulfilled' ? asArray(providersResult.value) : [];
      const templates = templatesResult.status === 'fulfilled' ? asArray(templatesResult.value) : [];
      const errors: unknown[] = [...(registry?.errors || [])];
      if (registryResult.status === 'rejected') errors.push(registryResult.reason);
      if (providersResult.status === 'rejected') errors.push(providersResult.reason);
      if (templatesResult.status === 'rejected') errors.push(templatesResult.reason);

      if (data.length) {
        integrations = data;
        window.ZentridLiveIntegrations = integrations;
        ZentridLayout.mount(renderIntegrations());
        wireIntegrations();
        setLiveDataState('partial', `${data.length} integration registry record(s) are ready. Operational counts and sync health continue loading in the background.`, {
          source: registry?.source || '/api/admin/provider-integrations',
          details: 'Background: /api/integrations',
          recordCount: data.length
        });
      } else {
        integrations = [];
        window.ZentridLiveIntegrations = [];
        ZentridLayout.mount(renderIntegrations());
        wireIntegrations();
        if (errors.length) setRequestFailure('/api/admin/provider-integrations', errors[0], 'No prototype connector records are displayed.');
        else setLiveDataState('empty', 'The integration registry returned no records. The registry is empty.', { source: '/api/admin/provider-integrations', recordCount: 0 });
      }

      insertIntegrationLiveSummary([
        { label: 'Integration Registry', value: `${data.length} row(s)`, meta: 'Fast administrative endpoint' },
        { label: '/api/Providers', value: `${providers.length} provider(s)`, meta: providers.join(', ') || 'Endpoint empty' },
        { label: 'Templates', value: `${templates.length} template(s)`, meta: templates.join(', ') || 'Endpoint empty' },
        { label: 'Operational Summary', value: 'Loading…', meta: 'Slow endpoint does not block the registry' }
      ]);

      void ZentridAPIRepositories.integrations.summary({ ...detailReadOptions('integration-summary', 50, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
        .then(summary => {
          const enriched = mergeIntegrationSummaries(data, summary.items);
          if (enriched.length) {
            integrations = enriched;
            window.ZentridLiveIntegrations = integrations;
            ZentridLayout.mount(renderIntegrations());
            wireIntegrations();
          }
          setLiveDataState(summary.errors.length ? 'partial' : 'live', summary.errors.length
            ? 'The integration registry is visible, but part of the operational summary could not be loaded.'
            : 'The fast integration registry was enriched with operational counts and sync health.', {
            source: `${registry?.source || '/api/admin/provider-integrations'} + ${summary.source}`,
            details: summary.errors.length ? `${summary.errors.length} summary error(s)` : 'Progressive loading complete',
            recordCount: enriched.length
          });
          insertIntegrationLiveSummary([
            { label: 'Integration Registry', value: `${data.length} row(s)`, meta: 'Administrative records' },
            { label: 'Operational Summary', value: `${summary.items.length} provider row(s)`, meta: summary.items.map(item => item.vendor || item.name).filter(Boolean).join(', ') || 'No summary rows' },
            { label: 'Providers / Templates', value: `${providers.length}/${templates.length}`, meta: 'Fast supporting endpoints' }
          ]);
        })
        .catch(error => {
          setLiveDataState('partial', 'The integration registry is ready. The optional operational summary did not complete, so registry values remain visible.', {
            source: registry?.source || '/api/admin/provider-integrations',
            details: liveErrorMessage(error),
            recordCount: data.length
          });
        });
    } catch (error) {
      setRequestFailure('/api/admin/provider-integrations', error, 'No prototype connector records are displayed.');
    }
  }

  async function applyPlants(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/plants\.html$/.test(location.pathname)) return;
    const requestVersion = beginRegistryRequest('plants');
    if (!backgroundRefresh) setLiveDataState('loading', 'Loading the requested plant page first. Device and alert relations will be attached in the background.', { source: '/api/plants + /api/admin/plants' });
    try {
      const live = await ZentridAPIRepositories.plants.list(registryReadOptions('plants', forceRefresh));
      if (!isCurrentRegistryRequest('plants', requestVersion)) return;
      publishRegistryPagination('plants', live);
      const data = live.items;
      if (!data.length) {
        if (live.errors.length) setRequestFailure(live.source, live.errors[0], 'No prototype plant records are displayed.');
        else setLiveDataState('empty', 'The requested plant page returned no records. No prototype plant records are displayed.', { source: live.source, recordCount: live.pagination.totalCount });
        return;
      }

      let relatedDevices: AnyRecord[] = [];
      let relatedAlerts: AnyRecord[] = [];
      const relationErrors: unknown[] = [...live.errors];
      const pending = new Set(['devices', 'alerts']);
      const render = (): void => {
        if (!isCurrentRegistryRequest('plants', requestVersion)) return;
        window.ZentridLiveDevices = relatedDevices;
        window.ZentridLiveAlerts = relatedAlerts;
        window.ZentridLivePlants = enrichPlantRelations(data, relatedDevices, relatedAlerts);
        syncLiveClientModel(window.ZentridLivePlants, relatedDevices);
        ZentridLayout.mount(renderPlants());
        wirePlants();
        const pendingText = [...pending].join(' and ');
        const cacheInfo = repositoryCachePresentation(live);
        const state: LiveDataState = pending.size || relationErrors.length || cacheInfo.state === 'partial' ? 'partial' : 'live';
        const baseMessage = pending.size
          ? `Plant page ${live.pagination.page} is ready. ${pendingText} relations continue loading without blocking the registry.`
          : relationErrors.length
            ? `Plant page ${live.pagination.page} is visible, but some related data could not be loaded.`
            : `Plant page ${live.pagination.page} and its available relations were applied.`;
        const detailParts = [
          pending.size ? `Background: ${pendingText}` : '',
          relationErrors.length ? `${relationErrors.length} relation error(s)` : '',
          cacheInfo.details,
          `Page ${live.pagination.page} of ${live.pagination.totalPages}`
        ].filter(Boolean);
        setLiveDataState(state, `${cacheInfo.prefix}${baseMessage}`, {
          source: live.source,
          details: detailParts.join(' · '),
          recordCount: live.pagination.totalCount,
          ...cacheFreshnessOptions(cacheInfo)
        });
      };
      render();

      void ZentridAPIRepositories.devices.list(detailReadOptions('plant-relations:devices', 100, forceRefresh))
        .then(result => { if (isCurrentRegistryRequest('plants', requestVersion)) { relatedDevices = result.items; relationErrors.push(...result.errors); } })
        .catch(error => { if (isCurrentRegistryRequest('plants', requestVersion)) relationErrors.push(error); })
        .finally(() => { if (isCurrentRegistryRequest('plants', requestVersion)) { pending.delete('devices'); render(); } });

      void ZentridAPIRepositories.alerts.list({ ...detailReadOptions('plant-relations:alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
        .then(result => { if (isCurrentRegistryRequest('plants', requestVersion)) { relatedAlerts = result.items; relationErrors.push(...result.errors); } })
        .catch(error => { if (isCurrentRegistryRequest('plants', requestVersion)) relationErrors.push(error); })
        .finally(() => { if (isCurrentRegistryRequest('plants', requestVersion)) { pending.delete('alerts'); render(); } });
    } catch (error) {
      if (isCurrentRegistryRequest('plants', requestVersion)) setRequestFailure('/api/plants', error, 'No prototype plant records are displayed.');
    }
  }

  async function applyDevices(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/devices\.html$/.test(location.pathname)) return;
    const requestVersion = beginRegistryRequest('devices');
    if (!backgroundRefresh) setLiveDataState('loading', 'Loading the requested device page first. Plant and alert relations will be attached in the background.', { source: '/api/devices' });
    try {
      const live = await ZentridAPIRepositories.devices.list(registryReadOptions('devices', forceRefresh));
      if (!isCurrentRegistryRequest('devices', requestVersion)) return;
      publishRegistryPagination('devices', live);
      const data = live.items;
      if (!data.length) {
        setLiveDataState('empty', 'The requested device page returned no records. No prototype device records are displayed.', { source: live.source, recordCount: live.pagination.totalCount });
        return;
      }

      let relatedPlants: AnyRecord[] = [];
      let relatedAlerts: AnyRecord[] = [];
      const relationErrors: unknown[] = [...live.errors];
      const pending = new Set(['plants', 'alerts']);
      const render = (): void => {
        if (!isCurrentRegistryRequest('devices', requestVersion)) return;
        window.ZentridLivePlants = relatedPlants;
        window.ZentridLiveAlerts = relatedAlerts;
        window.ZentridLiveDevices = enrichDeviceRelations(data, relatedPlants, relatedAlerts);
        syncLiveClientModel(relatedPlants, window.ZentridLiveDevices);
        ZentridLayout.mount(renderDevices());
        wireDevices();
        const pendingText = [...pending].join(' and ');
        const cacheInfo = repositoryCachePresentation(live);
        const state: LiveDataState = pending.size || relationErrors.length || cacheInfo.state === 'partial' ? 'partial' : 'live';
        const baseMessage = pending.size
          ? `Device page ${live.pagination.page} is ready. ${pendingText} relations continue loading without blocking the list.`
          : relationErrors.length
            ? `Device page ${live.pagination.page} is visible, but some related data could not be loaded.`
            : `Device page ${live.pagination.page} and its available relations were applied.`;
        const detailParts = [
          pending.size ? `Background: ${pendingText}` : '',
          relationErrors.length ? `${relationErrors.length} relation error(s)` : '',
          cacheInfo.details,
          `Page ${live.pagination.page} of ${live.pagination.totalPages}`
        ].filter(Boolean);
        setLiveDataState(state, `${cacheInfo.prefix}${baseMessage}`, {
          source: live.source,
          details: detailParts.join(' · '),
          recordCount: live.pagination.totalCount,
          ...cacheFreshnessOptions(cacheInfo)
        });
      };
      render();

      void ZentridAPIRepositories.plants.list(detailReadOptions('device-relations:plants', 100, forceRefresh))
        .then(result => { if (isCurrentRegistryRequest('devices', requestVersion)) { relatedPlants = result.items; relationErrors.push(...result.errors); } })
        .catch(error => { if (isCurrentRegistryRequest('devices', requestVersion)) relationErrors.push(error); })
        .finally(() => { if (isCurrentRegistryRequest('devices', requestVersion)) { pending.delete('plants'); render(); } });

      void ZentridAPIRepositories.alerts.list({ ...detailReadOptions('device-relations:alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
        .then(result => { if (isCurrentRegistryRequest('devices', requestVersion)) { relatedAlerts = result.items; relationErrors.push(...result.errors); } })
        .catch(error => { if (isCurrentRegistryRequest('devices', requestVersion)) relationErrors.push(error); })
        .finally(() => { if (isCurrentRegistryRequest('devices', requestVersion)) { pending.delete('alerts'); render(); } });
    } catch (error) {
      if (isCurrentRegistryRequest('devices', requestVersion)) setRequestFailure('/api/devices', error, 'No prototype device records are displayed.');
    }
  }

  async function applyAlerts(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/alerts\.html$/.test(location.pathname)) return;
    const requestVersion = beginRegistryRequest('alerts');
    if (!backgroundRefresh) setLiveDataState('loading', 'Loading the requested alert page.', { source: '/api/alerts' });
    try {
      const result = await ZentridAPIRepositories.alerts.list({ ...registryReadOptions('alerts', forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS });
      if (!isCurrentRegistryRequest('alerts', requestVersion)) return;
      publishRegistryPagination('alerts', result);
      const data = result.items;
      if (!data.length) {
        setLiveDataState('empty', 'The requested alert page returned no records. No prototype alert records are displayed.', { source: '/api/alerts', recordCount: result.pagination.totalCount });
        return;
      }
      const alertStore = window.ZentridAlerts || (typeof ZentridAlerts !== 'undefined' ? ZentridAlerts : null);
      if (Array.isArray(alertStore)) {
        (alertStore as AnyRecord[]).splice(0, alertStore.length, ...data);
        ZentridLayout.mount(renderAlertsPage());
        wireAlertsPage();
        const cacheInfo = repositoryCachePresentation(result);
        setLiveDataState(cacheInfo.state, `${cacheInfo.prefix}Alert page ${result.pagination.page} of ${result.pagination.totalPages} was applied.`, {
          source: '/api/alerts',
          details: [`Server pagination · ${result.pagination.pageSize} rows per page`, cacheInfo.details].filter(Boolean).join(' · '),
          recordCount: result.pagination.totalCount,
          ...cacheFreshnessOptions(cacheInfo)
        });
      }
    } catch (error) {
      if (isCurrentRegistryRequest('alerts', requestVersion)) setRequestFailure('/api/alerts', error, 'No prototype alert records are displayed.');
    }
  }

  function presentTelemetryResult(result: ZentridRepositoryListResult): void {
    window.ZentridTelemetryPage?.render(result);
    if (!result.items.length) {
      setLiveDataState('empty', 'The requested telemetry page returned no records. No prototype telemetry records are displayed.', {
        source: '/api/telemetry',
        details: `Page ${result.pagination.page} of ${result.pagination.totalPages}`,
        recordCount: result.pagination.totalCount
      });
      return;
    }
    const cacheInfo = repositoryCachePresentation(result);
    setLiveDataState(cacheInfo.state, `${cacheInfo.prefix}Telemetry page ${result.pagination.page} of ${result.pagination.totalPages} was applied.`, {
      source: '/api/telemetry',
      details: [`Server pagination · ${result.pagination.pageSize} rows per page`, cacheInfo.details].filter(Boolean).join(' · '),
      recordCount: result.pagination.totalCount,
      ...cacheFreshnessOptions(cacheInfo)
    });
  }

  async function applyTelemetry(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/telemetry\.html$/.test(location.pathname)) return;
    if (!backgroundRefresh) {
      window.ZentridTelemetryPage?.setLoading('Loading the requested telemetry page from /api/telemetry.');
      setLiveDataState('loading', 'Loading the requested telemetry page.', { source: '/api/telemetry' });
    }
    try {
      const result = await ZentridAPIRepositories.telemetry.list(telemetryReadOptions(forceRefresh));
      presentTelemetryResult(result);
    } catch (error) {
      window.ZentridTelemetryPage?.renderFailure(liveErrorMessage(error));
      setRequestFailure('/api/telemetry', error, 'No prototype telemetry records are displayed.');
    }
  }

  function identityValues(row: AnyRecord, entity: 'plant' | 'device' | 'alert' | 'generic' = 'generic'): string[] {
    const plantKeys = ['sourcePlantId','plantId','externalId','plantCode','code','id','canonicalId','sourceEntityId','vendorPlantId','vendorExtensions.sourcePlantId','vendorExtensions.plantId','vendorExtensions.externalId'];
    const deviceKeys = ['sourceDeviceId','deviceId','externalId','serialNumber','serial','registrationNumber','code','id','canonicalId','sourceEntityId','vendorDeviceId','vendorExtensions.sourceDeviceId','vendorExtensions.deviceId','vendorExtensions.serialNumber'];
    const alertKeys = ['sourceAlertId','alertId','eventId','code','id','canonicalId','sourceEntityId','vendorExtensions.sourceAlertId'];
    const keys = entity === 'plant' ? plantKeys : entity === 'device' ? deviceKeys : entity === 'alert' ? alertKeys : [...plantKeys, ...deviceKeys, ...alertKeys];
    const values = keys.map(key => firstOf(row, [key], '')).filter(value => value !== undefined && value !== null && value !== '').map(value => String(value).trim());
    return [...new Set(values.filter(Boolean))];
  }

  function realNameFromRow(row: AnyRecord, entityLabel: string, typeHint?: unknown): string {
    const candidates = collectNameCandidates(row, entityLabel);
    const real = candidates.find(value => isUsefulDisplayName(value, row, entityLabel, typeHint));
    return real ? safeText(real) : '';
  }

  ZentridAPIRepositories.configure({
    ...contractMapperContext,
    realDisplayName: realNameFromRow
  });

  function htmlEscape(value: unknown): string {
    const entities: Record<string, string> = {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'};
    return String(value ?? '—').replace(/[&<>\"']/g, ch => entities[ch] || ch);
  }

  function firstOf(row: AnyRecord, keys: string[], fallback: unknown = ''): unknown {
    for (const key of keys) {
      let value: unknown = row;
      for (const part of String(key).split('.')) {
        if (!value || typeof value !== 'object') {
          value = undefined;
          break;
        }
        value = (value as Record<string, unknown>)[part];
      }
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  }

  function cleanLabelToken(value: unknown, fallback: string): string {
    const text = safeText(value, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return fallback;
    return text.split(' ').map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part).join(' ');
  }

  function isGeneratedLiveName(value: unknown): boolean {
    const text = safeText(value, '').trim();
    return /(^|[^a-z0-9])(tenant|plant|device|alarm|alert|battery|inverter|meter|logger|bess|pcs)[-_]load[-_]\d+/i.test(text)
      || /^[A-Z]+[-_]load[-_]\d+[-_][A-Z0-9]+(?:[-_][A-Z0-9]+)?(?:\s+\w+)?$/i.test(text);
  }

  function looksLikeTechnicalId(value: unknown): boolean {
    const text = safeText(value, '').trim();
    if (!text) return true;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) return true;
    if (/^[A-Z]{2,}[-_][A-Z0-9]{3,}[-_]?\d*$/i.test(text)) return true;
    if (/^\d{5,}$/.test(text)) return true;
    return false;
  }

  function collectNameCandidates(row: AnyRecord, entityLabel: string, explicitKeys: string[] = []): unknown[] {
    const result: unknown[] = [];
    explicitKeys.forEach(key => result.push(firstOf(row, [key], '')));
    const allowKey = (key: string): boolean => {
      const k = key.toLowerCase();
      if (/id$|uuid|guid|status|type|provider|vendor|source|serial|code|capacity|power|energy|date|time|count|number|url|uri|ref/.test(k)) return false;
      if (entityLabel === 'Plant' && /(plantname|plant_name|stationname|station_name|sitename|site_name|displayname|display_name|name|alias|label|title)/.test(k)) return true;
      if (entityLabel === 'Device' && /(devicename|device_name|equipmentname|equipment_name|displayname|display_name|name|alias|label|title)/.test(k)) return true;
      if (/Alert|Alarm/i.test(entityLabel) && /(alertname|alert_name|alarmname|alarm_name|eventname|event_name|displayname|display_name|title|message|name|alias|label)/.test(k)) return true;
      if (entityLabel === 'Tenant' && /(tenantname|tenant_name|organizationname|organization_name|companyname|company_name|legalname|legal_name|displayname|display_name|name|alias|label|title)/.test(k)) return true;
      if (entityLabel === 'Client' && /(clientname|client_name|customername|customer_name|companyname|company_name|legalname|legal_name|fullname|full_name|displayname|display_name|name|alias|label|title)/.test(k)) return true;
      return false;
    };
    const walk = (value: unknown, depth: number): void => {
      if (!value || depth > 5) return;
      if (Array.isArray(value)) {
        value.slice(0, 20).forEach(item => walk(item, depth + 1));
        return;
      }
      if (typeof value !== 'object') return;
      Object.entries(value as AnyRecord).forEach(([key, child]) => {
        if (allowKey(key) && child !== undefined && child !== null && child !== '') result.push(child);
        if (child && typeof child === 'object') walk(child, depth + 1);
      });
    };
    walk(row, 0);
    const seen = new Set<string>();
    return result.filter(value => {
      const text = safeText(value, '').trim();
      if (!text || seen.has(text.toLowerCase())) return false;
      seen.add(text.toLowerCase());
      return true;
    });
  }

  function isUsefulDisplayName(value: unknown, row: AnyRecord, entityLabel: string, typeHint?: unknown): boolean {
    const text = safeText(value, '').trim();
    if (!text || text === '—') return false;
    if (isGeneratedLiveName(text) || looksLikeTechnicalId(text)) return false;
    const typeText = safeText(typeHint, '').trim().toLowerCase();
    if (typeText && text.toLowerCase() === typeText) return false;
    const provider = safeText(firstOf(row, ['provider','vendor','sourceSystem'], ''), '').trim().toLowerCase();
    if (provider && text.toLowerCase() === provider) return false;
    const ids = identityValues(row, /plant/i.test(entityLabel) ? 'plant' : /device/i.test(entityLabel) ? 'device' : /alert|alarm/i.test(entityLabel) ? 'alert' : 'generic').map(x => x.toLowerCase());
    return !ids.includes(text.toLowerCase());
  }

  function shortenGeneratedLiveName(value: unknown, entityLabel: string, index: number, typeHint?: unknown): string {
    const text = safeText(value, '').trim();
    const loadMatch = text.match(/^([A-Z]+)[-_]load[-_]\d+[-_]([A-Z0-9]+)(?:[-_]([A-Z0-9]+))?(?:\s+(.+))?$/i);
    const suffix = loadMatch ? (loadMatch[3] || loadMatch[2]) : String(index + 1).padStart(2, '0');
    const trailingType = loadMatch?.[4];
    const prefix = loadMatch?.[1];
    const kind = cleanLabelToken(typeHint || trailingType || prefix || entityLabel, entityLabel);
    if (/alert|alarm/i.test(entityLabel) && !/alert|alarm/i.test(kind)) return `${kind} Alert ${suffix}`;
    return `${kind} ${suffix}`;
  }

  function liveDisplayName(row: AnyRecord, keys: string[], entityLabel: string, index: number, typeHint?: unknown): string {
    const candidates = collectNameCandidates(row, entityLabel, keys);
    const vendorName = candidates.find(value => isUsefulDisplayName(value, row, entityLabel, typeHint));
    if (vendorName) return safeText(vendorName);
    const generated = candidates.find(value => isGeneratedLiveName(value));
    if (generated) return shortenGeneratedLiveName(generated, entityLabel, index, typeHint);
    return `${cleanLabelToken(typeHint || entityLabel, entityLabel)} ${index + 1}`;
  }



  function setLiveClients(rows: AnyRecord[]): boolean {
    const clientModel = window.ZentridClientModel || (typeof ZentridClientModel !== 'undefined' ? ZentridClientModel : null);
    if (!clientModel || !Array.isArray(clientModel.clients)) return false;
    clientModel.clients.splice(0, clientModel.clients.length, ...(rows as unknown as ZentridClientLegacyClient[]));
    return true;
  }

  function setLiveTenants(rows: AnyRecord[]): boolean {
    try {
      window.ZentridLiveTenants = rows;
      return true;
    } catch (e) { return false; }
  }



  function upsertLiveRecord(target: AnyRecord[] | undefined, record: AnyRecord): void {
    if (!Array.isArray(target) || !record?.id) return;
    const index = target.findIndex(item => item?.id === record.id || item?.externalId === record.externalId);
    if (index >= 0) target[index] = { ...target[index], ...record };
    else target.unshift(record);
  }

  function liveCapacity(value: unknown, unit: string): string {
    const text = safeText(value, '').trim();
    if (!text || text === '—') return `0 ${unit}`;
    if (/[a-z]/i.test(text)) return text;
    return `${text} ${unit}`;
  }

  function ensureLiveClientModelPlant(plant: AnyRecord, devices: AnyRecord[] = []): void {
    const model = window.ZentridClientModel;
    if (!model || !Array.isArray(model.plants) || !Array.isArray(model.devices)) return;
    const client = (typeof model.selectedClient === 'function' ? model.selectedClient() : null) || model.clients?.[0] || null;
    const clientId = client?.id || 'CL-LIVE-API';
    if (!client && Array.isArray(model.clients)) {
      model.clients.unshift({
        id: clientId,
        code: 'LIVE-API',
        name: 'Backend Live API',
        type: 'System Source',
        legalForm: 'Live Data',
        registrationNo: '—',
        taxId: '—',
        country: plant.country || '—',
        city: plant.city || '—',
        address: plant.address || '—',
        status: 'Active',
        verification: 'Backend Live API',
        account: '—',
        primaryContact: '—',
        contactEmail: '—',
        contactPhone: '—',
        tenant: plant.tenant || 'Backend Live API',
        plants: [],
        users: 0,
        documents: 0,
        billing: '—',
        supportTier: '—',
        accessScope: 'Live API plant detail',
        exportPolicy: '—',
        assignmentRole: 'Source owner',
        onboarding: 'Live API'
      });
    }
    const livePlant = {
      id: plant.id,
      code: plant.code || plant.externalId || plant.id,
      externalId: plant.externalId || plant.id,
      name: plant.name,
      clientId,
      tenantId: plant.tenantId || 'LIVE-TENANT',
      portfolio: plant.portfolio || plant.vendor || 'Backend Live API',
      status: plant.status || 'Active',
      type: plant.type || 'Solar Plant',
      country: plant.country || '—',
      region: plant.region || '—',
      city: plant.city || '—',
      address: plant.address || '—',
      timezone: plant.timezone || '—',
      capacityDc: liveCapacity(plant.capacityDc, 'MWp'),
      capacityAc: liveCapacity(plant.capacityAc, 'MW'),
      gridCapacity: liveCapacity(plant.gridCapacity, 'MW'),
      commissioning: plant.commissioned || plant.commissioning || plant.commissionedAt || '—',
      owner: plant.owner || client?.name || 'Backend Live API',
      operator: plant.operator || plant.tenant || 'Backend Live API',
      om: plant.om || plant.operator || plant.tenant || 'Backend Live API',
      powerNow: plant.livePower || '0 kW',
      energyToday: plant.today || '0 kWh',
      alerts: Number(plant.alerts || 0),
      health: plant.status || plant.health || 'Unknown',
      panels: Number(plant.panels || 0),
      inverters: Number(plant.inverters || 0),
      strings: Number(plant.strings || 0),
      transformers: Number(plant.transformers || 0),
      meters: Number(plant.meters || 0),
      battery: plant.battery || 'Unknown',
      devices: devices.map(device => device.id).filter(Boolean),
      dataOrigin: 'live',
      lastSyncAt: plant.lastSyncAt || plant.lastData || plant.updatedAt || '',
      sourceSystem: plant.vendor || plant.sourceSystem || plant.integration || 'Backend Live API',
      integration: plant.integration || `${plant.vendor || 'Backend'} live integration`,
      latitude: plant.latitude || plant.lat || '',
      longitude: plant.longitude || plant.lng || '',
      raw: plant.raw || undefined
    };
    upsertLiveRecord(model.plants, livePlant);
    devices.forEach(device => {
      upsertLiveRecord(model.devices, {
        id: device.id,
        plantId: livePlant.id,
        type: device.type || 'Device',
        name: device.name || device.id,
        vendor: device.vendor || device.manufacturer || 'Backend',
        model: device.model || '—',
        serial: device.serial || device.externalId || '—',
        capacity: device.capacity || device.power || '—',
        firmware: device.firmware || '—',
        status: device.status || 'Unknown',
        location: device.parent || device.location || '—',
        lastSeen: device.lastSeen || 'No live data',
        children: device.children || device.subtype || '—',
        manufacturer: device.manufacturer || device.vendor || 'Backend',
        tenant: livePlant.operator,
        plant: livePlant.name,
        integration: device.integration || `${device.vendor || 'Backend'} live integration`,
        sourceStatus: device.sourceStatus || 'Live API'
      });
    });
    if (typeof model.selectPlant === 'function') model.selectPlant(livePlant.id);
  }


  function syncLiveClientModel(plants: AnyRecord[], devices: AnyRecord[] = []): void {
    const model = window.ZentridClientModel;
    if (!model || !Array.isArray(model.plants) || !Array.isArray(model.devices)) return;
    const previousPlantId = localStorage.getItem('zentrid_selected_plant');
    plants.forEach(plant => {
      const related = Array.isArray(plant.relatedDevices) ? plant.relatedDevices : devices.filter(device => plantMatchesDevice(plant, device));
      ensureLiveClientModelPlant(plant, related);
    });
    if (previousPlantId && typeof model.selectPlant === 'function') model.selectPlant(previousPlantId);
  }

  function mountExistingRenderer(renderName: string, wireName: string): boolean {
    const renderer = window[renderName];
    const wirer = window[wireName];
    if (typeof renderer !== 'function') return false;
    const rendered = renderer();
    if (typeof rendered === 'string') ZentridLayout.mount(rendered);
    if (typeof wirer === 'function') wirer();
    return true;
  }

  function liveDetailGrid(row: AnyRecord, fields: Array<[string, unknown]>): string {
    return `<div class="info-grid">${fields.map(([label, value]) => `<div><span>${htmlEscape(label)}</span><strong>${htmlEscape(value)}</strong></div>`).join('')}</div>`;
  }

  function liveRawPanel(row: AnyRecord): string {
    return `<details class="panel-lite" open><summary>Raw API payload</summary><pre class="api-json-preview">${htmlEscape(JSON.stringify(row?.raw || row || {}, null, 2))}</pre></details>`;
  }

  function renderLivePlantDetail(plant: AnyRecord): void {
    const relatedDevices = Array.isArray(plant.relatedDevices) ? plant.relatedDevices : [];
    const relatedAlerts = Array.isArray(plant.relatedAlerts) ? plant.relatedAlerts : [];
    ZentridLayout.mount(`
      <section class="page-hero plant-hero-v17">
        <div><p class="eyebrow">Plant Detail · Live API</p><h1>${htmlEscape(plant.name)}</h1><p class="muted">${htmlEscape(plant.code)} · ${htmlEscape(plant.vendor)} · ${htmlEscape(plant.country)}, ${htmlEscape(plant.city)}</p></div>
        <button class="freshness-card" onclick="location.href='plants.html'"><span class="pulse"></span><div><strong>Back to Plants</strong><small>/api/plants</small></div></button>
      </section>
      <section class="context-bar plant-context-v17"><div><span>Provider</span><strong>${htmlEscape(plant.vendor)}</strong></div><div><span>External ID</span><strong>${htmlEscape(plant.externalId)}</strong></div><div><span>Status</span><strong>${htmlEscape(plant.status)}</strong></div><div><span>Last Data</span><strong>${htmlEscape(plant.lastData)}</strong></div></section>
      <section class="kpi-grid plant-kpi-grid-v17">
        <article class="kpi-card cyan"><span class="kpi-label">Current Power</span><div class="kpi-value">${htmlEscape(plant.livePower)}</div><small class="kpi-delta">From /api/plants</small></article>
        <article class="kpi-card green"><span class="kpi-label">Linked Devices</span><div class="kpi-value">${htmlEscape(relatedDevices.length || plant.devices || 0)}</div><small class="kpi-delta">Matched from /api/devices</small></article>
        <article class="kpi-card blue"><span class="kpi-label">Capacity DC</span><div class="kpi-value">${htmlEscape(plant.capacityDc)} MWp</div><small class="kpi-delta">Installed capacity</small></article>
        <article class="kpi-card yellow"><span class="kpi-label">Related Alerts</span><div class="kpi-value">${htmlEscape(relatedAlerts.length || plant.alerts || 0)}</div><small class="kpi-delta">Matched from /api/alerts</small></article>
      </section>
      <section class="plant-workspace-v17">
        <aside class="glass-card plant-side-card-v17"><h3>Live Plant</h3><button class="active">Overview</button><button onclick="location.href='devices.html'">Devices</button><button onclick="location.href='alerts.html'">Alerts</button><button onclick="location.href='telemetry.html'">Telemetry</button></aside>
        <section class="glass-card plant-main-card-v17">
          <h2>Backend Plant Record</h2>
          ${liveDetailGrid(plant, [['Zentrid ID', plant.id], ['External Plant ID', plant.externalId], ['Provider', plant.vendor], ['Status', plant.status], ['Data Quality', plant.freshness], ['Timezone', plant.timezone], ['Address', plant.address], ['Current Power', plant.livePower], ['Today Energy', plant.today], ['Total Energy', plant.totalEnergy || '—']])}
          ${liveRawPanel(plant)}
        </section>
      </section>
      ${relatedDevicesTable(relatedDevices, plant)}
      ${relatedAlertsTable(relatedAlerts, plant.name)}
    `);
  }

  function renderLiveDeviceDetail(device: AnyRecord): void {
    const plant = device.relatedPlant || null;
    const alerts = Array.isArray(device.relatedAlerts) ? device.relatedAlerts : [];
    ZentridLayout.mount(`
      <section class="page-hero device-hero-v58 device-hero-v59">
        <div><p class="eyebrow">Device Detail · Live API</p><h1>${htmlEscape(device.name)}</h1><p class="muted">${htmlEscape(device.type)} · ${htmlEscape(device.vendor)} · ${htmlEscape(device.serial)}</p></div>
        <div class="hero-actions"><button class="secondary-action" onclick="location.href='devices.html'">Back to Devices</button></div>
      </section>
      <section class="context-bar glass-card device-context-v58"><div><span>Plant</span><strong>${htmlEscape(device.plant)}</strong></div><div><span>Source Plant ID</span><strong>${htmlEscape(device.plantId)}</strong></div><div><span>Device Type</span><strong>${htmlEscape(device.type)}</strong></div><div><span>Last Communication</span><strong>${htmlEscape(device.lastSeen)}</strong></div></section>
      <section class="kpi-grid plant-kpi-grid-v17">
        <article class="kpi-card cyan"><span class="kpi-label">Status</span><div class="kpi-value">${htmlEscape(device.status)}</div><small class="kpi-delta">From /api/devices</small></article>
        <article class="kpi-card green"><span class="kpi-label">Related Plant</span><div class="kpi-value">${plant ? '1' : '0'}</div><small class="kpi-delta">Matched from /api/plants</small></article>
        <article class="kpi-card yellow"><span class="kpi-label">Related Alerts</span><div class="kpi-value">${alerts.length}</div><small class="kpi-delta">Matched from /api/alerts</small></article>
        <article class="kpi-card blue"><span class="kpi-label">Data Quality</span><div class="kpi-value">${htmlEscape(device.sourceStatus)}</div><small class="kpi-delta">Backend normalized record</small></article>
      </section>
      <section class="glass-card plant-main-card-v17">
        <h2>Backend Device Record</h2>
        ${liveDetailGrid(device, [['Zentrid ID', device.id], ['External Device ID', device.externalId], ['Serial Number', device.serial], ['Provider', device.vendor], ['Type', device.type], ['Status', device.status], ['Plant', device.plant], ['Source Plant ID', device.plantId], ['Last Seen', device.lastSeen], ['Last Sync / Quality', device.sourceStatus]])}
        ${liveRawPanel(device)}
      </section>
      ${plant ? liveTable('Parent Plant', 'Matched by sourcePlantId.', ['Plant', 'Status / Power', 'Location', 'Action'], [[`<strong>${htmlEscape(plant.name)}</strong><small>${htmlEscape(plant.externalId)}</small>`, `<span class="badge ${badge(plant.status)}">${htmlEscape(plant.status)}</span><small>${htmlEscape(plant.livePower)}</small>`, `<strong>${htmlEscape(plant.country)}</strong><small>${htmlEscape(plant.address)}</small>`, `<button class="small-btn" type="button" onclick="localStorage.setItem('zentrid_selected_plant','${htmlEscape(plant.id)}');location.href='plant-detail.html'">Open</button>`]], 'No parent plant matched') : liveTable('Parent Plant', 'No plant matched this device sourcePlantId.', ['Plant'], [], 'No parent plant matched')}
      ${relatedAlertsTable(alerts, device.name)}
    `);
  }


  async function applyDeviceDetail(forceRefresh = false): Promise<void> {
    if (!/device-detail\.html$/.test(location.pathname)) return;
    const selectedId = new URLSearchParams(location.search).get('id') || localStorage.getItem('zentrid_selected_device');
    const selectedSnapshot = readDetailSelection('device', selectedId);
    setLiveDataState('loading', selectedSnapshot
      ? 'Restoring the selected device while the current API page is checked for a fresher copy.'
      : 'Loading the device record. Parent plant, alerts and telemetry sections will load only when opened.', { source: '/api/devices' });
    try {
      const deviceResult = await ZentridAPIRepositories.devices.list(detailReadOptions('device-detail:core', 100, forceRefresh));
      const networkRows = deviceResult.items;
      const selectedDeviceFromNetwork = selectedId
        ? networkRows.find(record => detailSelectionMatches(record, selectedId))
        : networkRows[0];
      const selectedRecord = selectedDeviceFromNetwork || selectedSnapshot || (!selectedId ? networkRows[0] : undefined);
      if (!selectedRecord) {
        const message = selectedId
          ? 'The selected device is not present on the loaded API page and no preserved selection snapshot is available.'
          : 'The device endpoint returned no records. No prototype device detail is displayed.';
        window.ZentridApiOnly?.mountEmpty('Device Detail', message, '/api/devices');
        setLiveDataState('empty', message, { source: '/api/devices', recordCount: deviceResult.pagination.totalCount });
        return;
      }

      const deviceRows = selectedDeviceFromNetwork
        ? networkRows
        : [selectedRecord, ...networkRows.filter(record => !detailSelectionMatches(record, selectedId))];
      let plantRows: AnyRecord[] = [];
      let alertRows: AnyRecord[] = [];
      let telemetryRows: AnyRecord[] = [];
      const relationErrors: unknown[] = [...deviceResult.errors];
      const sync = (): AnyRecord | undefined => {
        const mappedDevices = enrichDeviceRelations(deviceRows, plantRows, alertRows);
        window.ZentridLivePlants = plantRows;
        window.ZentridLiveDevices = mappedDevices;
        window.ZentridLiveAlerts = alertRows;
        const device = selectedId
          ? mappedDevices.find(record => detailSelectionMatches(record, selectedId))
          : mappedDevices[0];
        if (device) {
          localStorage.setItem('zentrid_selected_device', device.id);
          saveDetailSelection('device', device);
        }
        return device;
      };
      const device = sync();

      window.ZentridDetailLazyTabs?.register('device', [
        {
          key: 'parent-plant',
          tabs: ['architecture', 'related'],
          label: 'Parent plant and topology',
          loader: async () => {
            const result = await ZentridAPIRepositories.plants.list(detailReadOptions('device-detail:parent-plant', 100, forceRefresh));
            plantRows = result.items;
            relationErrors.push(...result.errors);
            if (!plantRows.length && result.errors.length) throw result.errors[0];
            sync();
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'The device record is visible and its parent plant relation was loaded on demand.', {
              source: `${deviceResult.source} + ${result.source}`,
              details: result.errors.length ? `${result.errors.length} relation error(s)` : 'Parent relation loaded on demand',
              recordCount: deviceResult.pagination.totalCount
            });
          }
        },
        {
          key: 'alerts',
          tabs: ['alerts'],
          label: 'Device alerts',
          loader: async () => {
            const result = await ZentridAPIRepositories.alerts.list({ ...detailReadOptions('device-detail:alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS });
            alertRows = result.items;
            relationErrors.push(...result.errors);
            if (!alertRows.length && result.errors.length) throw result.errors[0];
            sync();
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'Device alerts were loaded only after the Alerts tab was opened.', {
              source: `${deviceResult.source} + ${result.source}`,
              details: result.errors.length ? `${result.errors.length} alert error(s)` : 'Alerts loaded on demand',
              recordCount: deviceResult.pagination.totalCount
            });
          }
        },
        {
          key: 'telemetry',
          tabs: ['telemetry', 'monitoring'],
          label: 'Telemetry summary',
          loader: async () => {
            const selectedDevice = sync();
            if (!selectedDevice) throw new Error('The selected device is not available for telemetry matching.');
            const result = await ZentridAPIRepositories.telemetry.list({
              ...detailReadOptions('device-detail:telemetry', 100, forceRefresh),
              timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS
            });
            telemetryRows = result.items.filter(row => deviceMatchesTelemetry(selectedDevice, row));
            relationErrors.push(...result.errors);
            if (!result.items.length && result.errors.length) throw result.errors[0];
            publishDetailTelemetry('device', selectedDevice, telemetryRows);
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'Device telemetry was loaded only after the Telemetry Summary tab was opened.', {
              source: `${deviceResult.source} + ${result.source}`,
              details: telemetryRows.length
                ? `${telemetryRows.length} matching telemetry record(s) on API page ${result.pagination.page}`
                : `No matching device telemetry on API page ${result.pagination.page} of ${result.pagination.totalPages}`,
              recordCount: result.pagination.totalCount
            });
          }
        }
      ]);

      if (!mountExistingRenderer('renderDeviceDetail', 'wireDeviceDetail') && device) {
        console.warn('Zentrid live API: existing Device Detail renderer was not found; keeping current page markup.');
      }
      const usingSnapshot = Boolean(selectedSnapshot && !selectedDeviceFromNetwork);
      setLiveDataState(deviceResult.errors.length || usingSnapshot ? 'partial' : 'live', usingSnapshot
        ? 'The exact selected device was restored from this browser session because it is not present on API page 1. Lazy relations remain available.'
        : 'The device overview is ready. Parent plant, alerts and telemetry remain idle until their tabs are opened.', {
        source: usingSnapshot ? `${deviceResult.source} + selected session record` : deviceResult.source,
        details: usingSnapshot ? `Selected record preserved · API page ${deviceResult.pagination.page} checked` : 'Lazy sections: parent plant · alerts · telemetry',
        recordCount: deviceResult.pagination.totalCount
      });
    } catch (error) {
      if (selectedSnapshot) {
        window.ZentridLivePlants = [];
        window.ZentridLiveDevices = [selectedSnapshot];
        window.ZentridLiveAlerts = [];
        saveDetailSelection('device', selectedSnapshot);
        mountExistingRenderer('renderDeviceDetail', 'wireDeviceDetail');
        setLiveDataState('partial', 'The selected device was restored from this browser session while the live device request failed.', {
          source: 'Selected session record',
          details: liveErrorMessage(error),
          recordCount: 1,
          freshnessStatus: 'stale'
        });
        return;
      }
      setRequestFailure('/api/devices', error, 'No prototype device detail is displayed.');
    }
  }

  function selectedPlantAdministrativeId(selectedId: string | null): string {
    if (!selectedId) return '';
    try {
      const raw = localStorage.getItem('zentrid_selected_plant_context');
      if (!raw) return '';
      const context = JSON.parse(raw) as { selectedId?: unknown; adminId?: unknown };
      const contextSelectedId = String(context.selectedId ?? '').trim();
      const adminId = String(context.adminId ?? '').trim();
      return contextSelectedId === String(selectedId).trim() ? adminId : '';
    } catch {
      localStorage.removeItem('zentrid_selected_plant_context');
      return '';
    }
  }

  async function applyPlantDetail(forceRefresh = false): Promise<void> {
    if (!/plant-detail\.html$/.test(location.pathname)) return;
    const selectedId = localStorage.getItem('zentrid_selected_plant') || new URLSearchParams(location.search).get('id');
    let selectedLocalPlant: AnyRecord | null = null;
    if (selectedId) {
      try {
        const raw = sessionStorage.getItem('zentrid_plant_create_fallback');
        const parsed = raw ? JSON.parse(raw) as AnyRecord : null;
        if (parsed && String(parsed.id || '').trim() === String(selectedId).trim() && parsed.dataOrigin === 'local') selectedLocalPlant = parsed;
      } catch {
        sessionStorage.removeItem('zentrid_plant_create_fallback');
      }
    }
    if (selectedLocalPlant) {
      window.ZentridLivePlants = [selectedLocalPlant];
      window.ZentridLiveDevices = [];
      window.ZentridLiveAlerts = [];
      syncLiveClientModel([selectedLocalPlant], []);
      ZentridLayout.mount(renderPlantDetail());
      wirePlantDetail();
      setLiveDataState('fallback', 'This plant is a temporary session fallback created while the backend was unavailable.', {
        source: 'Browser session storage',
        details: 'No backend detail request was sent for the temporary local identifier.',
        dataOrigin: 'local',
        recordCount: 1
      });
      return;
    }
    const selectedAdminId = selectedPlantAdministrativeId(selectedId);
    const detailSource = selectedAdminId ? `/api/admin/plants/${encodeURIComponent(selectedAdminId)}` : '/api/plants + /api/admin/plants';
    setLiveDataState('loading', selectedAdminId ? 'Loading the selected Global Admin plant record.' : 'Resolving the selected plant from the available live and administrative registries.', { source: detailSource });
    try {
      const live = selectedAdminId
        ? await ZentridAPIRepositories.plants.get(selectedAdminId, detailReadOptions('plant-detail:core', 100, forceRefresh))
        : await ZentridAPIRepositories.plants.list(detailReadOptions('plant-detail:core', 100, forceRefresh));
      const data = live.items;
      if (!data.length) {
        if (live.errors.length) setRequestFailure(live.source, live.errors[0], 'No prototype plant detail is displayed.');
        else setLiveDataState('empty', selectedId ? 'The selected plant endpoint returned no matching record.' : 'Plant endpoints returned no records. No prototype plant detail is displayed.', { source: live.source || detailSource, recordCount: 0 });
        return;
      }

      let deviceRows: AnyRecord[] = [];
      let alertRows: AnyRecord[] = [];
      let telemetryRows: AnyRecord[] = [];
      const relationErrors: unknown[] = [...live.errors];
      const sync = (): AnyRecord | undefined => {
        const mapped = enrichPlantRelations(data, deviceRows, alertRows);
        window.ZentridLivePlants = mapped;
        window.ZentridLiveDevices = deviceRows;
        window.ZentridLiveAlerts = alertRows;
        syncLiveClientModel(mapped, deviceRows);
        const plant = mapped.find(p => p.id === selectedId || p.externalId === selectedId || p.code === selectedId || p.adminId === selectedAdminId) || mapped[0];
        if (plant) {
          const renderedId = String(plant.id || selectedId || selectedAdminId || '').trim();
          const administrativeId = String(plant.adminId || plant.raw?.adminRecord?.id || plant.raw?.adminRecord?.plantId || selectedAdminId || '').trim();
          if (renderedId) localStorage.setItem('zentrid_selected_plant', renderedId);
          if (renderedId && administrativeId) {
            localStorage.setItem('zentrid_selected_plant_context', JSON.stringify({ selectedId: renderedId, adminId: administrativeId }));
          } else {
            localStorage.removeItem('zentrid_selected_plant_context');
          }
          ensureLiveClientModelPlant(plant, Array.isArray(plant.relatedDevices) ? plant.relatedDevices : []);
        }
        return plant;
      };
      const plant = sync();

      window.ZentridDetailLazyTabs?.register('plant', [
        {
          key: 'devices',
          tabs: ['structure', 'device', 'inverters', 'batteries', 'metering', 'gateways'],
          label: 'Plant devices and topology',
          loader: async () => {
            const result = await ZentridAPIRepositories.devices.list(detailReadOptions('plant-detail:devices', 100, forceRefresh));
            deviceRows = result.items;
            relationErrors.push(...result.errors);
            if (!deviceRows.length && result.errors.length) throw result.errors[0];
            sync();
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'Plant device relations were loaded only after a device-related tab was opened.', {
              source: `${live.source} + ${result.source}`,
              details: result.errors.length ? `${result.errors.length} device relation error(s)` : 'Devices loaded on demand',
              recordCount: data.length
            });
          }
        },
        {
          key: 'alerts',
          tabs: ['alerts'],
          label: 'Plant alerts',
          loader: async () => {
            const result = await ZentridAPIRepositories.alerts.list({ ...detailReadOptions('plant-detail:alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS });
            alertRows = result.items;
            relationErrors.push(...result.errors);
            if (!alertRows.length && result.errors.length) throw result.errors[0];
            sync();
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'Plant alerts were loaded only after the Alerts tab was opened.', {
              source: `${live.source} + ${result.source}`,
              details: result.errors.length ? `${result.errors.length} alert relation error(s)` : 'Alerts loaded on demand',
              recordCount: data.length
            });
          }
        },
        {
          key: 'telemetry',
          tabs: ['energy'],
          label: 'Plant telemetry',
          loader: async () => {
            const selectedPlant = sync();
            if (!selectedPlant) throw new Error('The selected plant is not available for telemetry matching.');
            const result = await ZentridAPIRepositories.telemetry.list({
              ...detailReadOptions('plant-detail:telemetry', 100, forceRefresh),
              timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS
            });
            telemetryRows = result.items.filter(row => plantMatchesTelemetry(selectedPlant, row));
            relationErrors.push(...result.errors);
            if (!result.items.length && result.errors.length) throw result.errors[0];
            publishDetailTelemetry('plant', selectedPlant, telemetryRows);
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'Plant telemetry was loaded only after the Energy & Telemetry tab was opened.', {
              source: `${live.source} + ${result.source}`,
              details: telemetryRows.length
                ? `${telemetryRows.length} matching telemetry record(s) on API page ${result.pagination.page}`
                : `No matching plant telemetry on API page ${result.pagination.page} of ${result.pagination.totalPages}`,
              recordCount: result.pagination.totalCount
            });
          }
        }
      ]);

      if (!mountExistingRenderer('renderPlantDetailPage', '')) {
        console.warn('Zentrid live API: existing Plant Detail renderer was not found; keeping current page markup.');
      }
      const usedDirectDetail = Boolean(selectedId && live.source.startsWith(detailSource));
      setLiveDataState(live.errors.length ? 'partial' : 'live', 'The plant overview is ready. Devices, alerts and telemetry remain idle until their tabs are opened.', {
        source: live.source,
        details: [
          usedDirectDetail ? 'Direct detail endpoint with live operational enrichment' : selectedId ? 'Fallback list lookup' : 'Merged plant collection lookup',
          live.errors.length ? (usedDirectDetail ? 'Live operational enrichment returned an error; administrative detail remains available.' : 'The direct detail request failed; the bounded list fallback was used.') : '',
          'Lazy sections: devices · alerts · telemetry'
        ].filter(Boolean).join(' · '),
        recordCount: data.length
      });
    } catch (error) {
      setRequestFailure(detailSource, error, 'No prototype plant detail is displayed.');
    }
  }

  async function applyAlertDetail(forceRefresh = false): Promise<void> {
    if (!/alert-detail\.html$/.test(location.pathname)) return;
    const selectedId = new URLSearchParams(location.search).get('id') || localStorage.getItem('zentrid_selected_alert');
    const selectedSnapshot = readDetailSelection('alert', selectedId);
    setLiveDataState('loading', selectedSnapshot
      ? 'Restoring the selected alert while the current API page is checked for a fresher copy.'
      : 'Loading normalized alert data for this detail page.', { source: '/api/alerts' });
    try {
      const result = await ZentridAPIRepositories.alerts.list({ ...detailReadOptions('alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS });
      const data = result.items;
      const selectedAlertFromNetwork = selectedId
        ? data.find(record => detailSelectionMatches(record, selectedId))
        : data[0];
      const selectedRecord = selectedAlertFromNetwork || selectedSnapshot || (!selectedId ? data[0] : undefined);
      if (!selectedRecord) {
        const message = selectedId
          ? 'The selected alert is not present on the loaded API page and no preserved selection snapshot is available.'
          : 'The alert endpoint returned no records.';
        window.ZentridApiOnly?.mountEmpty('Alert Detail', message, '/api/alerts');
        setLiveDataState('empty', message, { source: '/api/alerts', recordCount: result.pagination.totalCount });
        return;
      }
      if (Array.isArray(window.ZentridAlerts || ZentridAlerts)) {
        const target = window.ZentridAlerts || ZentridAlerts;
        const detailRows = selectedAlertFromNetwork
          ? data
          : [selectedRecord, ...data.filter(record => !detailSelectionMatches(record, selectedId))];
        target.splice(0, target.length, ...detailRows);
        localStorage.setItem('zentrid_selected_alert', selectedRecord.id);
        saveDetailSelection('alert', selectedRecord);
        ZentridLayout.mount(renderAlertDetailContent(selectedAlert()));
        wireAlertDetailPage();
        const usingSnapshot = Boolean(selectedSnapshot && !selectedAlertFromNetwork);
        setLiveDataState(result.errors.length || usingSnapshot ? 'partial' : 'live', usingSnapshot
          ? 'The exact selected alert was restored from this browser session because it is not present on API page 1.'
          : 'The selected live alert record was loaded for this detail page.', {
          source: usingSnapshot ? `${result.source} + selected session record` : result.source,
          details: usingSnapshot ? `Selected record preserved · API page ${result.pagination.page} checked` : `API page ${result.pagination.page} of ${result.pagination.totalPages}`,
          recordCount: result.pagination.totalCount
        });
      }
    } catch (error) {
      if (selectedSnapshot && Array.isArray(window.ZentridAlerts || ZentridAlerts)) {
        const target = window.ZentridAlerts || ZentridAlerts;
        target.splice(0, target.length, selectedSnapshot);
        saveDetailSelection('alert', selectedSnapshot);
        ZentridLayout.mount(renderAlertDetailContent(selectedAlert()));
        wireAlertDetailPage();
        setLiveDataState('partial', 'The selected alert was restored from this browser session while the live alert request failed.', {
          source: 'Selected session record',
          details: liveErrorMessage(error),
          recordCount: 1,
          freshnessStatus: 'stale'
        });
        return;
      }
      setRequestFailure('/api/alerts', error, 'No prototype alert detail is displayed.');
    }
  }

  async function applyIntegrationDetail(forceRefresh = false): Promise<void> {
    if (!/integration-detail\.html$/.test(location.pathname)) return;
    const selectedId = String(localStorage.getItem('zentrid_selected_integration') || '').trim();
    let selectedLocalIntegration: AnyRecord | null = null;
    if (selectedId) {
      try {
        const raw = sessionStorage.getItem('zentrid_integration_create_fallback');
        const parsed = raw ? JSON.parse(raw) as AnyRecord : null;
        if (parsed && String(parsed.id || '').trim() === selectedId && parsed.dataOrigin === 'local') selectedLocalIntegration = parsed;
      } catch {
        sessionStorage.removeItem('zentrid_integration_create_fallback');
      }
    }
    if (selectedLocalIntegration) {
      integrations = [selectedLocalIntegration];
      window.ZentridLiveIntegrations = integrations;
      ZentridLayout.mount(renderIntegrationDetail());
      wireIntegrationDetail();
      setLiveDataState('fallback', 'This connector is a temporary session fallback created while the backend was unavailable.', {
        source: 'Browser session storage',
        details: 'No backend detail request was sent for the temporary local identifier. Credential values were not stored.',
        dataOrigin: 'local',
        recordCount: 1
      });
      return;
    }
    const detailSource = selectedId
      ? `/api/admin/provider-integrations/${encodeURIComponent(selectedId)}`
      : '/api/admin/provider-integrations';
    setLiveDataState('loading', selectedId
      ? 'Loading the selected integration registry record. Operational summary will remain idle until Synchronization is opened.'
      : 'Loading the integration registry record. Operational summary will remain idle until Synchronization is opened.', { source: detailSource });
    try {
      const registry = selectedId
        ? await ZentridAPIRepositories.integrations.get(selectedId, detailReadOptions('integration-detail', 20, forceRefresh))
        : await ZentridAPIRepositories.integrations.list(detailReadOptions('integration-detail:fallback', 20, forceRefresh));
      const data: AnyRecord[] = selectedId
        ? ('item' in registry && registry.item ? [registry.item as AnyRecord] : [])
        : (registry.items as AnyRecord[]).slice(0, 1);
      if (!data.length) {
        if (registry.errors.length) setRequestFailure(registry.source, registry.errors[0], 'No prototype integration detail is displayed.');
        else { window.ZentridApiOnly?.mountEmpty('Integration Detail', selectedId ? 'The selected integration record was not returned.' : 'The integration registry returned no records.', registry.source); setLiveDataState('empty', selectedId ? 'The selected integration record was not returned. Integration Detail is empty.' : 'The integration registry returned no records. Integration Detail is empty.', { source: registry.source, recordCount: 0 }); }
        return;
      }
      integrations = data;
      window.ZentridLiveIntegrations = integrations;
      const firstIntegrationId = integrations[0]?.id;
      if (!selectedId && firstIntegrationId) localStorage.setItem('zentrid_selected_integration', firstIntegrationId);

      window.ZentridDetailLazyTabs?.register('integration', [
        {
          key: 'operational-summary',
          tabs: ['synchronization'],
          label: 'Operational synchronization summary',
          loader: async () => {
            const summary = await ZentridAPIRepositories.integrations.summary({ ...detailReadOptions('integration-detail:summary', 50, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS });
            if (!summary.items.length && summary.errors.length) throw summary.errors[0];
            integrations = mergeIntegrationSummaries(data, summary.items);
            window.ZentridLiveIntegrations = integrations;
            setLiveDataState(summary.errors.length ? 'partial' : 'live', summary.errors.length
              ? 'The registry record is visible, but part of the on-demand operational summary could not be loaded.'
              : 'Operational synchronization data was loaded after the Synchronization tab was opened.', {
              source: `${registry.source} + ${summary.source}`,
              details: summary.errors.length ? `${summary.errors.length} summary error(s)` : 'Operational summary loaded on demand',
              recordCount: integrations.length
            });
          }
        }
      ]);

      ZentridLayout.mount(renderIntegrationDetail());
      wireIntegrationDetail();
      const usedDirectDetail = Boolean(selectedId && registry.source.startsWith(detailSource));
      setLiveDataState(registry.errors.length ? 'partial' : 'live', 'The integration registry record is ready. Operational health has not been requested yet.', {
        source: registry.source,
        details: [
          usedDirectDetail ? 'Direct detail endpoint' : selectedId ? 'Fallback list lookup' : 'Registry preview lookup',
          registry.errors.length ? 'The direct detail request failed; the bounded list fallback was used.' : '',
          'Lazy section: Synchronization operational summary'
        ].filter(Boolean).join(' · '),
        recordCount: data.length
      });
    } catch (error) {
      setRequestFailure(detailSource, error, 'No prototype integration detail is displayed.');
    }
  }

  async function applyClients(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/clients\.html$/.test(location.pathname) && !/client-detail\.html$/.test(location.pathname)) return;
    const registry = /clients\.html$/.test(location.pathname);
    const requestVersion = registry ? beginRegistryRequest('clients') : 0;
    const selectedId = registry ? '' : String(localStorage.getItem('zentrid_selected_client') || '').trim();
    const clientModel = window.ZentridClientModel || (typeof ZentridClientModel !== 'undefined' ? ZentridClientModel : null);
    const selectedLocalClient = !registry && selectedId
      ? clientModel?.clients.find(client => client.id === selectedId && (client as unknown as AnyRecord).dataOrigin === 'local')
      : null;
    if (selectedLocalClient) {
      renderClientDetailPage();
      setLiveDataState('fallback', 'This client is a local fallback record created while the backend was unavailable.', {
        source: 'Browser local storage',
        details: 'No backend detail request was sent for the local fallback identifier.',
        dataOrigin: 'local',
        recordCount: 1
      });
      return;
    }
    const detailSource = selectedId ? `/api/admin/clients/${encodeURIComponent(selectedId)}` : '/api/admin/clients';
    if (!backgroundRefresh) setLiveDataState('loading', registry ? 'Loading the requested Global Admin client page.' : selectedId ? 'Loading the selected Global Admin client record.' : 'Loading Global Admin client records.', { source: registry ? '/api/admin/clients' : detailSource });
    try {
      const result = registry
        ? await ZentridAPIRepositories.clients.list(registryReadOptions('clients', forceRefresh))
        : selectedId
          ? await ZentridAPIRepositories.clients.get(selectedId, detailReadOptions('client-detail', 20, forceRefresh))
          : await ZentridAPIRepositories.clients.list(detailReadOptions('client-detail:fallback', 20, forceRefresh));
      if (registry && !isCurrentRegistryRequest('clients', requestVersion)) return;
      if (registry) publishRegistryPagination('clients', result);
      const data: AnyRecord[] = registry
        ? result.items as AnyRecord[]
        : ('item' in result && result.item ? [result.item as AnyRecord] : (result.items as AnyRecord[]).slice(0, 1));
      if (!data.length) {
        setLiveClients([]);
        if (registry) renderClientsPage();
        else window.ZentridApiOnly?.mountEmpty('Client Detail', selectedId ? 'The selected client endpoint returned no matching record.' : 'The client endpoint returned no records.', detailSource);
        if (result.errors.length) setRequestFailure(detailSource, result.errors[0], 'No prototype client records are displayed.');
        else setLiveDataState('empty', selectedId ? 'The selected client endpoint responded successfully but returned no matching record.' : 'The client endpoint responded successfully but returned no records. Client screens are empty.', { source: detailSource, recordCount: registry ? result.pagination.totalCount : 0 });
        return;
      }
      const mapped = data;
      if (!setLiveClients(mapped)) {
        setLiveDataState('fallback', 'Live client records were returned, but the client model was unavailable. Existing client data remains visible.', { source: result.source || detailSource });
        return;
      }
      if (registry) {
        const currentSelectedId = localStorage.getItem('zentrid_selected_client');
        if (!mapped.some(x => x.id === currentSelectedId) && mapped[0]) clientModel?.selectClient(mapped[0].id);
        renderClientsPage();
      } else {
        if (mapped[0]?.id) clientModel?.selectClient(mapped[0].id);
        renderClientDetailPage();
      }
      const cacheInfo = repositoryCachePresentation(result);
      const usedDirectDetail = !registry && Boolean(selectedId) && result.source.includes('/api/admin/clients/');
      setLiveDataState(result.errors.length ? 'partial' : cacheInfo.state, `${cacheInfo.prefix}${registry
        ? `Client page ${result.pagination.page} of ${result.pagination.totalPages} was applied.`
        : usedDirectDetail ? 'The selected client record was loaded by ID.' : 'A client record was loaded from the bounded list fallback.'}`, {
        source: result.source || detailSource,
        details: [
          registry ? `Server pagination · ${result.pagination.pageSize} rows per page` : usedDirectDetail ? 'Direct detail endpoint' : 'Fallback list lookup',
          result.errors.length ? 'The direct detail request failed; the bounded list fallback was used.' : '',
          cacheInfo.details
        ].filter(Boolean).join(' · '),
        recordCount: registry ? result.pagination.totalCount : data.length,
        ...cacheFreshnessOptions(cacheInfo)
      });
    } catch (error) {
      if (!registry || isCurrentRegistryRequest('clients', requestVersion)) setRequestFailure(registry ? '/api/admin/clients' : detailSource, error, 'No prototype client records are displayed.');
    }
  }

  async function applyTenants(forceRefresh = false): Promise<void> {
    if (!/tenants\.html$/.test(location.pathname) && !/tenant-detail\.html$/.test(location.pathname)) return;
    const registry = /tenants\.html$/.test(location.pathname);
    const selectedId = registry ? '' : String(localStorage.getItem('zentrid_selected_tenant') || '').trim();
    let selectedLocalTenant: AnyRecord | null = null;
    if (!registry && selectedId) {
      try {
        const raw = sessionStorage.getItem('zentrid_tenant_create_fallback');
        const parsed = raw ? JSON.parse(raw) as AnyRecord : null;
        if (parsed && String(parsed.id || '').trim() === selectedId && parsed.dataOrigin === 'local') selectedLocalTenant = parsed;
      } catch (error) {
        sessionStorage.removeItem('zentrid_tenant_create_fallback');
      }
    }
    if (selectedLocalTenant) {
      setLiveTenants([selectedLocalTenant]);
      ZentridLayout.mount(renderTenantDetail());
      wireTenantDetail();
      setLiveDataState('fallback', 'This tenant is a temporary local fallback created while the backend was unavailable.', {
        source: 'Browser session storage',
        details: 'No backend detail request was sent for the temporary local identifier.',
        dataOrigin: 'local',
        recordCount: 1
      });
      return;
    }
    const detailSource = selectedId ? `/api/admin/tenants/${encodeURIComponent(selectedId)}` : '/api/admin/tenants';
    setLiveDataState('loading', registry ? 'Loading Global Admin tenant records.' : selectedId ? 'Loading the selected Global Admin tenant record.' : 'Loading Global Admin tenant records.', { source: registry ? '/api/admin/tenants' : detailSource });
    try {
      const result = registry
        ? await ZentridAPIRepositories.tenants.list(detailReadOptions('tenants', 100, forceRefresh))
        : selectedId
          ? await ZentridAPIRepositories.tenants.get(selectedId, detailReadOptions('tenant-detail', 20, forceRefresh))
          : await ZentridAPIRepositories.tenants.list(detailReadOptions('tenant-detail:fallback', 20, forceRefresh));
      const data: AnyRecord[] = registry
        ? result.items as AnyRecord[]
        : ('item' in result && result.item ? [result.item as AnyRecord] : (result.items as AnyRecord[]).slice(0, 1));
      if (!data.length) {
        setLiveTenants([]);
        if (!registry) window.ZentridApiOnly?.mountEmpty('Tenant Detail', selectedId ? 'The selected tenant endpoint returned no matching record.' : 'The tenant endpoint returned no records.', detailSource);
        else { ZentridLayout.mount(renderTenantRegistry()); wireTenantRegistry(); }
        if (result.errors.length) setRequestFailure(detailSource, result.errors[0], 'No prototype tenant records are displayed.');
        else setLiveDataState('empty', selectedId ? 'The selected tenant endpoint responded successfully but returned no matching record.' : 'The tenant endpoint responded successfully but returned no records. Tenant screens are empty.', { source: detailSource, recordCount: registry ? result.pagination.totalCount : 0 });
        return;
      }
      const mapped = data;
      setLiveTenants(mapped);
      if (!registry) {
        if (mapped[0]?.id) localStorage.setItem('zentrid_selected_tenant', mapped[0].id);
        ZentridLayout.mount(renderTenantDetail());
        wireTenantDetail();
      } else {
        ZentridLayout.mount(renderTenantRegistry());
        wireTenantRegistry();
      }
      const cacheInfo = repositoryCachePresentation(result);
      const usedDirectDetail = !registry && Boolean(selectedId) && result.source.includes('/api/admin/tenants/');
      setLiveDataState(result.errors.length ? 'partial' : cacheInfo.state, `${cacheInfo.prefix}${registry
        ? `${data.length} tenant record(s) were applied.`
        : usedDirectDetail ? 'The selected tenant record was loaded by ID.' : 'A tenant record was loaded from the bounded list fallback.'}`, {
        source: result.source || detailSource,
        details: [
          registry ? 'Bounded tenant registry read' : usedDirectDetail ? 'Direct detail endpoint' : 'Fallback list lookup',
          result.errors.length ? 'The direct detail request failed; the bounded list fallback was used.' : '',
          cacheInfo.details
        ].filter(Boolean).join(' · '),
        recordCount: registry ? result.pagination.totalCount : data.length,
        ...cacheFreshnessOptions(cacheInfo)
      });
    } catch (error) {
      setRequestFailure(registry ? '/api/admin/tenants' : detailSource, error, 'No prototype tenant records are displayed.');
    }
  }

  const repositoryRefreshTimers = new Map<RegistryEntity | 'telemetry', number>();

  function handleRepositoryUpdated(event: Event): void {
    const detail = (event as CustomEvent<{ entity?: RegistryEntity | 'telemetry'; reason?: string; result?: ZentridRepositoryListResult }>).detail;
    const entity = detail?.entity;
    if (!entity || detail?.reason !== 'revalidated') return;
    if (entity === 'telemetry') {
      if (!/telemetry\.html$/.test(location.pathname)) return;
      const result = detail.result;
      const current = window.ZentridTelemetryPage?.readOptions();
      if (result && current && (result.pagination.page !== current.page || result.pagination.pageSize !== current.pageSize)) return;
      if (result) presentTelemetryResult(result);
      return;
    }
    if (!isRegistryPage(entity)) return;
    const current = window.ZentridRegistryQuery?.read(entity);
    const result = detail.result;
    if (result && current && (result.pagination.page !== current.page || result.pagination.pageSize !== current.pageSize)) return;
    const existing = repositoryRefreshTimers.get(entity);
    if (existing) window.clearTimeout(existing);
    repositoryRefreshTimers.set(entity, window.setTimeout(() => {
      repositoryRefreshTimers.delete(entity);
      if (entity === 'clients') void applyClients(true);
      if (entity === 'plants') void applyPlants(true);
      if (entity === 'devices') void applyDevices(true);
      if (entity === 'alerts') void applyAlerts(true);
    }, 40));
  }

  function handleRegistryQueryChange(event: Event): void {
    const detail = (event as CustomEvent<{ entity?: RegistryEntity }>).detail;
    const entity = detail?.entity;
    if (!entity || !isRegistryPage(entity)) return;
    if (entity === 'clients') void applyClients();
    if (entity === 'plants') void applyPlants();
    if (entity === 'devices') void applyDevices();
    if (entity === 'alerts') void applyAlerts();
  }

  function handleDataRefreshRequest(event: Event): void {
    const detail = (event as CustomEvent<{ resource?: ZentridFreshnessResource; forceRefresh?: boolean }>).detail;
    const resource = detail?.resource || window.ZentridDataFreshness?.inferResource();
    const forceRefresh = detail?.forceRefresh !== false;
    if (resource === 'overview') void applyOverview(forceRefresh);
    if (resource === 'clients') void applyClients(true, forceRefresh);
    if (resource === 'client-detail') void applyClients(false, forceRefresh);
    if (resource === 'tenants' || resource === 'tenant-detail') void applyTenants(forceRefresh);
    if (resource === 'plants') void applyPlants(true, forceRefresh);
    if (resource === 'plant-detail') void applyPlantDetail(forceRefresh);
    if (resource === 'devices') void applyDevices(true, forceRefresh);
    if (resource === 'device-detail') void applyDeviceDetail(forceRefresh);
    if (resource === 'alerts') void applyAlerts(true, forceRefresh);
    if (resource === 'telemetry') void applyTelemetry(false, forceRefresh);
    if (resource === 'alert-detail') void applyAlertDetail(forceRefresh);
    if (resource === 'integrations') void applyIntegrations(forceRefresh);
    if (resource === 'integration-detail') void applyIntegrationDetail(forceRefresh);
  }

  function handleTelemetryPageChange(): void {
    if (/telemetry\.html$/.test(location.pathname)) void applyTelemetry();
  }

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('zentrid:registry-query-change', handleRegistryQueryChange);
    window.addEventListener('zentrid:telemetry-page-change', handleTelemetryPageChange);
    window.addEventListener('zentrid:repository-updated', handleRepositoryUpdated);
    window.addEventListener('zentrid:data-refresh-request', handleDataRefreshRequest);
  }

  async function run(): Promise<void> {
    if (!window.ZentridPlatformAPI || !window.ZentridAPI || !window.ZentridAPIRepositories || !ZentridAPIRepositories.isConfigured()) return;
    await Promise.allSettled([applyOverview(), applyIntegrations(), applyPlants(), applyDevices(), applyAlerts(), applyTelemetry(), applyDeviceDetail(), applyPlantDetail(), applyAlertDetail(), applyIntegrationDetail(), applyClients(), applyTenants()]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else setTimeout(run, 0);
})();
