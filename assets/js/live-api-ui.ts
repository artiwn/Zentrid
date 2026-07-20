/* Zentrid live API UI bridge
   Uses working Swagger endpoints as primary data source when they return records.
   If an endpoint returns [] or fails, the existing mock/localStorage data remains as fallback. */
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
    fallback: 'Mock fallback active'
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
    fallback: '↺'
  };

  const DATA_SOURCE_MESSAGES: Record<ZentridDataOrigin, string> = {
    live: 'Displayed records come from live backend responses.',
    mock: 'Displayed records are prototype fallback data.',
    local: 'Displayed records were created or changed in this browser.',
    mixed: 'The current page combines records from more than one source.'
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
    return origins.values().next().value || 'mock';
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
    (['live', 'mock', 'local', 'mixed'] as ZentridDataOrigin[]).forEach(value => {
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
    description.textContent = `${summary.errors} required-field error(s) and ${summary.warnings} warning(s) across ${entityCount} entity type(s). Zentrid applied safe fallback values and preserved each raw payload.`;
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
      || (state === 'live' ? 'live' : state === 'partial' ? 'mixed' : renderedDataOrigin());
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

  function snapshotFromLive({ plants = [], devices = [], alerts = [], integrations = [], providers = [], templates = [] }: LiveSnapshotPayload) {
    const plantCount = plants.length || sum(integrations.map(x => x.plantsCount || x.plants));
    const deviceCount = devices.length || sum(integrations.map(x => x.devicesCount || x.devices));
    const alertCount = alerts.length || sum(integrations.map(x => x.alertsCount || x.alerts));
    const currentPowerKw = sum(plants.map(x => x.currentPowerKw));
    const liveProviderNames = integrations.map(x => x.displayName || x.provider || x.name || x.vendor).filter(Boolean);
    const providerNames = providers.length ? providers : liveProviderNames;
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
      integrationCount: integrations.length,
      templateCount: templates.length
    };
  }

  function applyOverviewMockFromLive(payload: Required<LiveSnapshotPayload>): void {
    const zentridMock = window.ZentridMock;
    if (!zentridMock) return;
    const snap = snapshotFromLive(payload);
    const currentPowerText = snap.currentPowerKw > 0 ? `${(snap.currentPowerKw / 1000).toFixed(2)} MW` : '0 kW';
    zentridMock.kpis = [
      { label: 'Live Providers', value: String(snap.providerNames.length || snap.integrationCount), delta: snap.providerNames.join(', ') || 'No provider names', icon: '🔗', tone: 'cyan', route: 'integrations' },
      { label: 'Plants', value: compactNumber(snap.plantCount), delta: `Live endpoint rows: ${payload.plants.length}`, icon: '🏭', tone: 'green', route: 'plants' },
      { label: 'Devices', value: compactNumber(snap.deviceCount), delta: `Live endpoint rows: ${payload.devices.length}`, icon: '🔌', tone: 'blue', route: 'devices' },
      { label: 'Live Power', value: currentPowerText, delta: '/api/plants aggregate', icon: '⚡', tone: 'yellow', route: 'telemetry' },
      { label: 'Active Incidents', value: compactNumber(snap.alertCount), delta: `Live endpoint rows: ${payload.alerts.length}`, icon: '🚨', tone: 'red', route: 'alerts' },
      { label: 'Templates', value: compactNumber(snap.templateCount), delta: 'Provider integration templates', icon: '🧩', tone: 'violet', route: 'integrations' }
    ];

    if (payload.integrations.length) {
      zentridMock.integrations = payload.integrations.map(row => ({
        name: safeText(row.displayName || row.name, safeText(row.provider || row.vendor, 'Provider')),
        status: safeText(row.operationalStatus || row.status || row.health, 'Unknown'),
        sync: safeText(row.lastSyncText || row.lastSync, fmtDate(row.lastSyncAtUtc || row.updatedAt)),
        errors: Number(row.vendorExtensions?.errorsCount || row.errorRatePct || 0)
      }));
    }

    if (payload.alerts.length) {
      zentridMock.alerts = payload.alerts.slice(0, 6).map(row => ({
        title: safeText(row.title || row.message || row.sourceAlertId || row.id, 'Live backend alert'),
        vendorDisplayName: safeText(row.title || row.message || row.sourceAlertId || row.id, 'Live backend alert'),
        registeredName: safeText(row.sourceAlertId || row.id || row.title, 'Live backend alert'),
        tenant: 'Backend Live API',
        plant: safeText(row.plantName, safeText(row.sourcePlantId, 'Unknown Plant')),
        severity: safeText(row.severity, 'Unknown'),
        time: fmtDate(row.occurredAtUtc, 'No occurrence time')
      }));
    }

    zentridMock.quality = [
      { label: 'Providers', value: String(snap.providerNames.length || snap.integrationCount) },
      { label: 'Templates', value: String(snap.templateCount) },
      { label: 'Stale Plants', value: String(snap.staleCount) },
      { label: 'Avg Error Rate', value: `${snap.errorRate.toFixed(1)}%` }
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
      `<button class="small-btn" type="button" onclick="localStorage.setItem('zentrid_selected_device','${htmlEscape(d.id)}');location.href='device-detail.html'">Open</button>`
    ]);
    return liveTable('Plant Devices', `${devices.length} matched by sourcePlantId / plant id. Showing first ${Math.min(25, devices.length)}.`, ['Device', 'Type / Source', 'Status', 'Action'], rows, `No devices matched ${plant.externalId || plant.id}`);
  }

  function relatedAlertsTable(alerts: AnyRecord[], contextLabel: string): string {
    const rows = alerts.slice(0, 25).map(a => [
      `<strong>${htmlEscape(a.title)}</strong><small>${htmlEscape(a.description)}</small>`,
      `<span class="badge ${badge(a.severity)}">${htmlEscape(a.severity)}</span><small>${htmlEscape(a.status)}</small>`,
      `<strong>${htmlEscape(a.plant)}</strong><small>${htmlEscape(a.device)}</small>`,
      `<button class="small-btn" type="button" onclick="localStorage.setItem('zentrid_selected_alert','${htmlEscape(a.id)}');location.href='alert-detail.html'">Open</button>`
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
    applyOverviewMockFromLive(payload);
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

    const payload: Required<LiveSnapshotPayload> = { plants: [], devices: [], alerts: [], integrations: [], providers: [], templates: [] };
    const errors: unknown[] = [];
    const pending = new Set(['alerts', 'integration summaries']);

    const updateState = (): void => {
      const populatedGroups = [payload.plants, payload.devices, payload.alerts, payload.integrations, payload.providers, payload.templates].filter(rows => Array.isArray(rows) && rows.length > 0).length;
      const totalRecords = [payload.plants, payload.devices, payload.alerts, payload.integrations, payload.providers, payload.templates]
        .reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
      const pendingText = [...pending].join(' and ');
      const state: LiveDataState = pending.size || errors.length ? 'partial' : 'live';
      const message = pending.size
        ? `Core dashboard data is ready. ${pendingText} ${pending.size === 1 ? 'is' : 'are'} still loading without blocking the page.`
        : errors.length
          ? 'Available live records were applied. One or more background endpoints did not complete, so existing fallback values remain in those sections.'
          : 'Core and background live records were applied progressively.';
      setLiveDataState(state, message, {
        source: 'Zentrid Platform APIs',
        dataOrigin: populatedGroups >= 5 ? 'live' : 'mixed',
        recordCount: totalRecords,
        details: pending.size ? `Background: ${pendingText}` : errors.length ? `${errors.length} background request failure(s)` : 'Progressive loading complete'
      });
      insertIntegrationLiveSummary([
        { label: 'Core plants / devices', value: `${payload.plants?.length || 0}/${payload.devices?.length || 0}`, meta: 'Rendered before slower relations' },
        { label: 'Alerts', value: pending.has('alerts') ? 'Loading…' : `${payload.alerts?.length || 0} row(s)`, meta: pending.has('alerts') ? 'Background request' : 'Background request completed' },
        { label: 'Integrations', value: pending.has('integration summaries') ? `${payload.integrations?.length || 0} registry row(s)` : `${payload.integrations?.length || 0} enriched row(s)`, meta: pending.has('integration summaries') ? 'Operational summary loading' : 'Registry enriched with live summary' }
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
      payload.devices = devicesResult.status === 'fulfilled' ? devicesResult.value.rawItems : [];
      payload.integrations = registryResult.status === 'fulfilled' ? registryResult.value.items : [];
      payload.providers = providersResult.status === 'fulfilled' ? asArray(providersResult.value) : [];
      payload.templates = templatesResult.status === 'fulfilled' ? asArray(templatesResult.value) : [];
      results.forEach(result => { if (result.status === 'rejected') errors.push(result.reason); });
      if (plantsResult.status === 'fulfilled') errors.push(...plantsResult.value.errors);
      if (devicesResult.status === 'fulfilled') errors.push(...devicesResult.value.errors);
      if (registryResult.status === 'fulfilled') errors.push(...registryResult.value.errors);

      const hasCoreSignal = Boolean(payload.plants.length || payload.devices.length || payload.integrations.length || payload.providers.length || payload.templates.length);
      if (!hasCoreSignal) {
        if (errors.length) setRequestFailure('Overview core endpoints', errors[0], 'The dashboard keeps its mock context.');
        else setLiveDataState('empty', 'Core endpoints returned no records. The dashboard keeps its mock context while background checks continue.', { source: 'Zentrid Platform APIs' });
      } else {
        renderOverviewLiveSnapshot(payload);
        updateState();
      }
    } catch (error) {
      errors.push(error);
      setRequestFailure('Overview core endpoints', error, 'The dashboard keeps its mock context.');
    }

    void ZentridAPIRepositories.alerts.list({ ...detailReadOptions('overview:alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
      .then(result => {
        payload.alerts = result.rawItems;
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
      } else if (errors.length) {
        setRequestFailure('/api/admin/provider-integrations', errors[0], 'Mock connector data remains visible.');
      } else {
        setLiveDataState('empty', 'The integration registry returned no records. Mock connector data remains visible.', { source: '/api/admin/provider-integrations' });
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
      setRequestFailure('/api/admin/provider-integrations', error, 'Mock connector data remains visible.');
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
        if (live.errors.length) setRequestFailure(live.source, live.errors[0], 'Mock Plant Registry data remains visible.');
        else setLiveDataState('empty', 'The requested plant page returned no records. Mock Plant Registry data remains visible.', { source: live.source, recordCount: live.pagination.totalCount });
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
      if (isCurrentRegistryRequest('plants', requestVersion)) setRequestFailure('/api/plants', error, 'Mock Plant Registry data remains visible.');
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
        setLiveDataState('empty', 'The requested device page returned no records. Mock Device List data remains visible.', { source: live.source, recordCount: live.pagination.totalCount });
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
      if (isCurrentRegistryRequest('devices', requestVersion)) setRequestFailure('/api/devices', error, 'Mock Device List data remains visible.');
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
        setLiveDataState('empty', 'The requested alert page returned no records. Mock Alerts data remains visible.', { source: '/api/alerts', recordCount: result.pagination.totalCount });
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
      if (isCurrentRegistryRequest('alerts', requestVersion)) setRequestFailure('/api/alerts', error, 'Mock Alerts data remains visible.');
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
    setLiveDataState('loading', 'Loading the device record. Parent plant, alerts and telemetry sections will load only when opened.', { source: '/api/devices' });
    try {
      const deviceResult = await ZentridAPIRepositories.devices.list(detailReadOptions('device-detail:core', 100, forceRefresh));
      const deviceRows = deviceResult.items;
      if (!deviceRows.length) {
        setLiveDataState('empty', 'The device endpoint returned no records. The existing Device Detail mock remains visible.', { source: '/api/devices' });
        return;
      }

      let plantRows: AnyRecord[] = [];
      let alertRows: AnyRecord[] = [];
      const relationErrors: unknown[] = [...deviceResult.errors];
      const selectedId = localStorage.getItem('zentrid_selected_device') || new URLSearchParams(location.search).get('id');
      const sync = (): AnyRecord | undefined => {
        const mappedDevices = enrichDeviceRelations(deviceRows, plantRows, alertRows);
        window.ZentridLivePlants = plantRows;
        window.ZentridLiveDevices = mappedDevices;
        window.ZentridLiveAlerts = alertRows;
        const device = mappedDevices.find(d => d.id === selectedId || d.externalId === selectedId || d.serial === selectedId) || mappedDevices[0];
        if (device) localStorage.setItem('zentrid_selected_device', device.id);
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
              recordCount: deviceRows.length
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
              recordCount: deviceRows.length
            });
          }
        },
        {
          key: 'telemetry',
          tabs: ['telemetry', 'monitoring'],
          label: 'Telemetry summary',
          loader: async () => {
            // Current normalized device response already contains the available telemetry snapshot.
            await Promise.resolve();
          }
        }
      ]);

      if (!mountExistingRenderer('renderDeviceDetail', 'wireDeviceDetail') && device) {
        console.warn('Zentrid live API: existing Device Detail renderer was not found; keeping current page markup.');
      }
      setLiveDataState(deviceResult.errors.length ? 'partial' : 'live', 'The device overview is ready. Parent plant, alerts and telemetry remain idle until their tabs are opened.', {
        source: deviceResult.source,
        details: 'Lazy sections: parent plant · alerts · telemetry',
        recordCount: deviceRows.length
      });
    } catch (error) {
      setRequestFailure('/api/devices', error, 'The existing Device Detail mock remains visible.');
    }
  }

  async function applyPlantDetail(forceRefresh = false): Promise<void> {
    if (!/plant-detail\.html$/.test(location.pathname)) return;
    setLiveDataState('loading', 'Loading the plant record. Devices, alerts and telemetry will load only when their tabs are opened.', { source: '/api/plants' });
    try {
      const live = await ZentridAPIRepositories.plants.list(detailReadOptions('plant-detail:core', 100, forceRefresh));
      const data = live.items;
      if (!data.length) {
        if (live.errors.length) setRequestFailure(live.source, live.errors[0], 'The existing Plant Detail mock remains visible.');
        else setLiveDataState('empty', 'Plant endpoints returned no records. The existing Plant Detail mock remains visible.', { source: live.source, recordCount: 0 });
        return;
      }

      let deviceRows: AnyRecord[] = [];
      let alertRows: AnyRecord[] = [];
      const relationErrors: unknown[] = [...live.errors];
      const selectedId = localStorage.getItem('zentrid_selected_plant') || new URLSearchParams(location.search).get('id');
      const sync = (): AnyRecord | undefined => {
        const mapped = enrichPlantRelations(data, deviceRows, alertRows);
        window.ZentridLivePlants = mapped;
        window.ZentridLiveDevices = deviceRows;
        window.ZentridLiveAlerts = alertRows;
        syncLiveClientModel(mapped, deviceRows);
        const plant = mapped.find(p => p.id === selectedId || p.externalId === selectedId || p.code === selectedId) || mapped[0];
        if (plant) {
          localStorage.setItem('zentrid_selected_plant', plant.id);
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
            // The current plant DTO already contains its normalized power and energy snapshot.
            await Promise.resolve();
          }
        }
      ]);

      if (!mountExistingRenderer('renderPlantDetailPage', '')) {
        console.warn('Zentrid live API: existing Plant Detail renderer was not found; keeping current page markup.');
      }
      setLiveDataState(live.errors.length ? 'partial' : 'live', 'The plant overview is ready. Devices, alerts and telemetry remain idle until their tabs are opened.', {
        source: live.source,
        details: 'Lazy sections: devices · alerts · telemetry',
        recordCount: data.length
      });
    } catch (error) {
      setRequestFailure('/api/plants', error, 'The existing Plant Detail mock remains visible.');
    }
  }

  async function applyAlertDetail(forceRefresh = false): Promise<void> {
    if (!/alert-detail\.html$/.test(location.pathname)) return;
    setLiveDataState('loading', 'Loading normalized alert data for this detail page.', { source: '/api/alerts' });
    try {
      const result = await ZentridAPIRepositories.alerts.list({ ...detailReadOptions('alerts', 100, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS });
      const data = result.items;
      if (!data.length) {
        setLiveDataState('empty', 'The alert endpoint responded successfully but returned no records. Alert Detail keeps its mock fallback.', { source: '/api/alerts', recordCount: 0 });
        return;
      }
      if (Array.isArray(window.ZentridAlerts || ZentridAlerts)) {
        const target = window.ZentridAlerts || ZentridAlerts;
        target.splice(0, target.length, ...data);
        ZentridLayout.mount(renderAlertDetailContent(selectedAlert()));
        wireAlertDetailPage();
        setLiveDataState('live', `${data.length} live alert record(s) were loaded for this detail page.`, { source: '/api/alerts', recordCount: data.length });
      }
    } catch (error) {
      setRequestFailure('/api/alerts', error, 'Alert Detail keeps its mock fallback.');
    }
  }

  async function applyIntegrationDetail(forceRefresh = false): Promise<void> {
    if (!/integration-detail\.html$/.test(location.pathname)) return;
    setLiveDataState('loading', 'Loading the integration registry record. Operational summary will remain idle until Synchronization is opened.', { source: '/api/admin/provider-integrations' });
    try {
      const registry = await ZentridAPIRepositories.integrations.list(detailReadOptions('integration-detail:registry', 100, forceRefresh));
      const data = registry.items;
      if (!data.length) {
        if (registry.errors.length) setRequestFailure(registry.source, registry.errors[0], 'Integration Detail keeps its mock fallback.');
        else setLiveDataState('empty', 'The integration registry returned no records. Integration Detail keeps its mock fallback.', { source: registry.source, recordCount: 0 });
        return;
      }
      integrations = data;
      window.ZentridLiveIntegrations = integrations;
      const selectedId = localStorage.getItem('zentrid_selected_integration');
      const firstIntegrationId = integrations[0]?.id;
      if (!integrations.some(x => x.id === selectedId) && firstIntegrationId) localStorage.setItem('zentrid_selected_integration', firstIntegrationId);

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
      setLiveDataState(registry.errors.length ? 'partial' : 'live', `${data.length} integration registry record(s) are ready. Operational health has not been requested yet.`, {
        source: registry.source,
        details: 'Lazy section: Synchronization operational summary',
        recordCount: data.length
      });
    } catch (error) {
      setRequestFailure('/api/admin/provider-integrations', error, 'Integration Detail keeps its mock fallback.');
    }
  }

  async function applyClients(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/clients\.html$/.test(location.pathname) && !/client-detail\.html$/.test(location.pathname)) return;
    const registry = /clients\.html$/.test(location.pathname);
    const requestVersion = registry ? beginRegistryRequest('clients') : 0;
    if (!backgroundRefresh) setLiveDataState('loading', registry ? 'Loading the requested Global Admin client page.' : 'Loading Global Admin client records.', { source: '/api/admin/clients' });
    try {
      const result = await ZentridAPIRepositories.clients.list(registry ? registryReadOptions('clients', forceRefresh) : detailReadOptions('clients', 100, forceRefresh));
      if (registry && !isCurrentRegistryRequest('clients', requestVersion)) return;
      if (registry) publishRegistryPagination('clients', result);
      const data = result.items;
      if (!data.length) {
        setLiveDataState('empty', 'The client endpoint responded successfully but returned no records. Client screens keep their mock fallback.', { source: '/api/admin/clients', recordCount: result.pagination.totalCount });
        return;
      }
      const mapped = data;
      if (!setLiveClients(mapped)) {
        setLiveDataState('fallback', 'Live client records were returned, but the client model was unavailable. Existing client data remains visible.', { source: '/api/admin/clients' });
        return;
      }
      const selectedId = localStorage.getItem('zentrid_selected_client');
      const clientModel = window.ZentridClientModel || (typeof ZentridClientModel !== 'undefined' ? ZentridClientModel : null);
      if (!mapped.some(x => x.id === selectedId) && mapped[0]) clientModel?.selectClient(mapped[0].id);
      if (/client-detail\.html$/.test(location.pathname)) renderClientDetailPage();
      else renderClientsPage();
      const cacheInfo = repositoryCachePresentation(result);
      setLiveDataState(cacheInfo.state, `${cacheInfo.prefix}${registry
        ? `Client page ${result.pagination.page} of ${result.pagination.totalPages} was applied.`
        : `${data.length} client record(s) were applied.`}`, {
        source: '/api/admin/clients',
        details: [
          registry ? `Server pagination · ${result.pagination.pageSize} rows per page` : '',
          cacheInfo.details
        ].filter(Boolean).join(' · '),
        recordCount: registry ? result.pagination.totalCount : data.length,
        ...cacheFreshnessOptions(cacheInfo)
      });
    } catch (error) {
      if (!registry || isCurrentRegistryRequest('clients', requestVersion)) setRequestFailure('/api/admin/clients', error, 'Client screens keep their mock fallback.');
    }
  }

  async function applyTenants(forceRefresh = false): Promise<void> {
    if (!/tenants\.html$/.test(location.pathname) && !/tenant-detail\.html$/.test(location.pathname)) return;
    setLiveDataState('loading', 'Loading Global Admin tenant records.', { source: '/api/admin/tenants' });
    try {
      const result = await ZentridAPIRepositories.tenants.list(detailReadOptions('tenants', 100, forceRefresh));
      const data = result.items;
      if (!data.length) {
        setLiveDataState('empty', 'The tenant endpoint responded successfully but returned no records. Tenant screens keep their mock fallback.', { source: '/api/admin/tenants', recordCount: 0 });
        return;
      }
      const mapped = data;
      setLiveTenants(mapped);
      if (/tenant-detail\.html$/.test(location.pathname)) {
        ZentridLayout.mount(renderTenantDetail());
        wireTenantDetail();
      } else {
        ZentridLayout.mount(renderTenantRegistry());
        wireTenantRegistry();
      }
      const cacheInfo = repositoryCachePresentation(result);
      setLiveDataState(cacheInfo.state, `${cacheInfo.prefix}${data.length} tenant record(s) were applied.`, {
        source: '/api/admin/tenants',
        details: cacheInfo.details,
        recordCount: data.length,
        ...cacheFreshnessOptions(cacheInfo)
      });
    } catch (error) {
      setRequestFailure('/api/admin/tenants', error, 'Tenant screens keep their mock fallback.');
    }
  }

  const repositoryRefreshTimers = new Map<RegistryEntity, number>();

  function handleRepositoryUpdated(event: Event): void {
    const detail = (event as CustomEvent<{ entity?: RegistryEntity; reason?: string; result?: ZentridRepositoryListResult }>).detail;
    const entity = detail?.entity;
    if (!entity || detail?.reason !== 'revalidated' || !isRegistryPage(entity)) return;
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
    if (resource === 'alert-detail') void applyAlertDetail(forceRefresh);
    if (resource === 'integrations') void applyIntegrations(forceRefresh);
    if (resource === 'integration-detail') void applyIntegrationDetail(forceRefresh);
  }

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('zentrid:registry-query-change', handleRegistryQueryChange);
    window.addEventListener('zentrid:repository-updated', handleRepositoryUpdated);
    window.addEventListener('zentrid:data-refresh-request', handleDataRefreshRequest);
  }

  async function run(): Promise<void> {
    if (!window.ZentridPlatformAPI || !window.ZentridAPI || !window.ZentridAPIRepositories || !ZentridAPIRepositories.isConfigured()) return;
    await Promise.allSettled([applyOverview(), applyIntegrations(), applyPlants(), applyDevices(), applyAlerts(), applyDeviceDetail(), applyPlantDetail(), applyAlertDetail(), applyIntegrationDetail(), applyClients(), applyTenants()]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else setTimeout(run, 0);
})();
