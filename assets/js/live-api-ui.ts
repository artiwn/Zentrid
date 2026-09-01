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

  type BackgroundLoadState = 'pending' | 'ready' | 'error';

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
    deviceKpi?: AnyRecord;
    alertKpi?: AnyRecord;
    alertState?: BackgroundLoadState;
    integrationState?: BackgroundLoadState;
  };

  type RegistryEntity = 'clients' | 'tenants' | 'plants' | 'devices' | 'alerts' | 'integrations';
  const registryRequestVersions = new Map<RegistryEntity, number>();

  function isRegistryPage(entity: RegistryEntity): boolean {
    return location.pathname.endsWith(`/${entity}.html`) || location.pathname.endsWith(`${entity}.html`);
  }

  function registryReadOptions(entity: RegistryEntity, forceRefresh = false): ZentridRepositoryReadOptions {
    const state = window.ZentridRegistryQuery?.read(entity);
    const newestFirst = entity === 'clients' || entity === 'plants';
    const clientFilters = entity === 'clients' ? { search: state?.search || '' } : {};
    const tenantFilters = entity === 'tenants' ? { search: state?.search || '' } : {};
    const plantFilters = entity === 'plants' ? {
      // PlantRegistry explicitly supports search. Keep status/source dropdowns as
      // current-page UI filters until backend exposes confirmed query parameters.
      search: state?.search || ''
    } : {};
    const deviceFilters = entity === 'devices' ? {
      search: state?.search || '',
      deviceType: state?.params?.deviceType || '',
      deviceStatus: state?.params?.deviceStatus || '',
      plantId: state?.params?.plantId || localStorage.getItem('zentrid_device_filter_plant') || ''
    } : {};
    let alertContext: Record<string, string> = {};
    if (entity === 'alerts') {
      try {
        const stored = JSON.parse(localStorage.getItem('zentrid_alert_context') || '{}') as Record<string, unknown>;
        alertContext = Object.fromEntries(Object.entries(stored).filter(([, value]) => typeof value === 'string' && value.trim()).map(([key, value]) => [key, String(value).trim()]));
      } catch {
        alertContext = {};
      }
    }
    const rawAlertVendor = state?.params?.vendor || '';
    const normalizedAlertVendor = (() => {
      const value = String(rawAlertVendor || '').trim();
      const key = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key === 'solax') return 'solarx';
      if (key === 'deye' || key === 'deyecloud') return 'deyecloud';
      if (key === 'sungrow') return 'sungrow';
      if (key === 'huawei') return 'huawei';
      return value;
    })();
    const alertFilters = entity === 'alerts' ? {
      search: state?.search || '',
      severity: state?.params?.severity || alertContext.severity || '',
      alertStatus: state?.params?.alertStatus || alertContext.status || '',
      tenant: state?.params?.tenant || alertContext.tenant || '',
      plant: state?.params?.plant || '',
      vendor: normalizedAlertVendor,
      plantId: state?.params?.plantId || alertContext.plantId || '',
      deviceId: state?.params?.deviceId || alertContext.deviceId || '',
      tenantId: state?.params?.tenantId || ''
    } : {};
    return {
      page: state?.page || 1,
      pageSize: state?.pageSize || 50,
      ...clientFilters,
      ...tenantFilters,
      ...plantFilters,
      ...deviceFilters,
      ...alertFilters,
      ...(newestFirst ? {
        sortBy: state?.sortBy || 'createdAtUtc',
        sortDirection: state?.sortDirection || 'desc'
      } : {}),
      staleWhileRevalidate: true,
      persist: true,
      requestGroup: `registry:${entity}`,
      supersede: true,
      forceRefresh,
      ...(entity === 'plants' ? { cacheVariant: 'admin-registry' } : {})
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
      forceRefresh,
      ...(entity === 'plants' ? { cacheVariant: 'admin-registry' } : {})
    };
  }

  function telemetryReadOptions(forceRefresh = false): ZentridRepositoryReadOptions {
    const page = window.ZentridTelemetryPage?.readOptions() || { page: 1, pageSize: 50 };
    return {
      page: page.page,
      pageSize: page.pageSize,
      ...(page.plantId ? { plantId: page.plantId } : {}),
      ...(page.deviceId ? { deviceId: page.deviceId } : {}),
      ...(page.metric ? { metric: page.metric } : {}),
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

  const ALERT_DISPLAY_SEARCH_PAGE_SIZE = 100;
  const ALERT_DISPLAY_SEARCH_MAX_PAGES = 10;

  type AlertSearchMode = 'none' | 'backend' | 'display-fallback';
  type AlertSearchMeta = {
    mode: AlertSearchMode;
    query: string;
    scannedCount: number;
    availableCount: number;
    truncated: boolean;
  };

  function setAlertSearchMeta(meta: AlertSearchMeta): void {
    (window as Window & { ZentridAlertSearchMeta?: AlertSearchMeta }).ZentridAlertSearchMeta = meta;
  }

  function alertDisplaySearchText(item: AnyRecord): string {
    const values = [
      item.title,
      item.canonicalName,
      item.zentridCode,
      item.id,
      item.sourceAlertId,
      item.vendorRawCode,
      item.vendorCode,
      item.vendorMessage,
      item.category,
      item.plant,
      item.plantName,
      item.plantId,
      item.sourcePlantId,
      item.device,
      item.deviceName,
      item.deviceId,
      item.sourceDeviceId,
      item.tenant,
      item.tenantId,
      item.vendor,
      item.source
    ];
    return values.map(value => String(value ?? '').trim()).filter(Boolean).join(' ').toLowerCase();
  }

  function alertDisplaySearchKpi(items: AnyRecord[]): Record<string, number> {
    const severity = (value: unknown) => String(value || '').trim().toLowerCase();
    const escalated = (value: unknown) => String(value || '').trim().toLowerCase().includes('escalat');
    return {
      totalCount: items.length,
      criticalCount: items.filter(item => severity(item.severity) === 'critical').length,
      faultCount: items.filter(item => severity(item.severity) === 'fault').length,
      warningCount: items.filter(item => severity(item.severity) === 'warning').length,
      escalatedCount: items.filter(item => escalated(item.status) || escalated(item.priority)).length
    };
  }

  async function alertDisplaySearchFallback(
    query: string,
    baseOptions: ZentridRepositoryReadOptions
  ): Promise<ZentridRepositoryListResult | null> {
    const normalizedQuery = String(query || '').trim().toLowerCase();
    if (!normalizedQuery) return null;

    const pageOptions = (page: number): ZentridRepositoryReadOptions => ({
      ...baseOptions,
      page,
      pageSize: ALERT_DISPLAY_SEARCH_PAGE_SIZE,
      search: '',
      requestGroup: `registry:alerts:display-search:${page}`,
      supersede: false
    });

    const first = await ZentridAPIRepositories.alerts.list(pageOptions(1));
    const availableCount = Math.max(first.pagination.totalCount, first.items.length);
    const pageLimit = Math.max(1, Math.min(first.pagination.totalPages || 1, ALERT_DISPLAY_SEARCH_MAX_PAGES));
    const rest = pageLimit > 1
      ? await Promise.all(Array.from({ length: pageLimit - 1 }, (_, index) => ZentridAPIRepositories.alerts.list(pageOptions(index + 2))))
      : [];
    const pages = [first, ...rest];
    const allItems = pages.flatMap(page => page.items as AnyRecord[]);
    const unique = Array.from(new Map(allItems.map(item => [String(item.id || item.sourceAlertId || JSON.stringify(item)), item])).values());
    const matches = unique.filter(item => alertDisplaySearchText(item).includes(normalizedQuery));

    const requestedPage = Math.max(1, Number(baseOptions.page) || 1);
    const requestedPageSize = Math.max(1, Number(baseOptions.pageSize) || 50);
    const totalPages = Math.max(1, Math.ceil(matches.length / requestedPageSize));
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * requestedPageSize;
    const pageItems = matches.slice(start, start + requestedPageSize);
    const truncated = (first.pagination.totalPages || 1) > pageLimit;

    setAlertSearchMeta({
      mode: 'display-fallback',
      query,
      scannedCount: unique.length,
      availableCount,
      truncated
    });

    return {
      entity: 'alerts',
      items: pageItems,
      rawItems: pageItems,
      source: '/api/admin/alerts · Zentrid display-field fallback',
      errors: pages.flatMap(pageResult => pageResult.errors || []),
      pagination: {
        page,
        pageSize: requestedPageSize,
        totalCount: matches.length,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages
      },
      kpi: alertDisplaySearchKpi(matches)
    };
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
    location.href = kind === 'device' ? `device-detail.html?id=${encodeURIComponent(id)}` : `alert-detail.html?id=${encodeURIComponent(id)}`;
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
    unavailable: 'No backend-provenance record is displayed in API-only mode.',
    local: 'Browser-created business records are disabled in API-only mode.',
    mixed: 'Displayed records come from multiple backend endpoints or API cache layers.'
  };

  function renderedDataOrigin(): ZentridDataOrigin {
    const chips = Array.from(document.querySelectorAll<HTMLElement>('.record-origin-chip[data-record-origin]'))
      .filter(chip => !chip.closest('.data-source-summary'));
    const origins = new Set<ZentridDataOrigin>();
    for (const chip of chips) {
      const origin = chip.dataset.recordOrigin;
      if (origin === 'live' || origin === 'unavailable' || origin === 'local' || origin === 'mixed') origins.add(origin);
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
    const legendOrigins: ZentridDataOrigin[] = origin === 'mixed' ? ['mixed'] : [origin];
    legendOrigins.forEach(value => {
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
    window.ZentridDetailLoading?.sync(state);
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
    plantTotalCount = null, deviceTotalCount = null, alertTotalCount = null, integrationTotalCount = null,
    deviceKpi = {}, alertKpi = {}
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
    const providerNames = uniqueOverviewValues((providers.length ? providers : liveProviderNames).map(value => ZentridAPIContracts.normalization.integrationProvider(value)));
    const staleCount = sum(integrations.map(x => x.stalePlantsCount ?? x.stalePlants ?? x.liveSummary?.raw?.stalePlantsCount));
    const integrationPlantCount = sum(integrations.map(x => x.plantsCount ?? x.plants ?? x.liveSummary?.raw?.plantsCount));
    const stalePlantRate = integrationPlantCount > 0 ? Math.min(100, (staleCount / integrationPlantCount) * 100) : 0;
    const onlineDevices = Number(deviceKpi?.onlineCount ?? 0);
    const attentionDevices = Number(deviceKpi?.attentionCount ?? 0);
    const mappedDevices = Number(deviceKpi?.mappedDevicesCount ?? 0);
    const warningAlerts = Number(alertKpi?.warningCount ?? 0);
    const criticalAlerts = Number(alertKpi?.criticalCount ?? 0);
    const faultAlerts = Number(alertKpi?.faultCount ?? 0);
    const escalatedAlerts = Number(alertKpi?.escalatedCount ?? 0);
    return {
      plantCount,
      deviceCount,
      alertCount,
      currentPowerKw,
      providerNames,
      staleCount,
      stalePlantRate,
      integrationPlantCount,
      integrationCount: knownIntegrationTotal ?? integrations.length,
      templateCount: templates.length,
      onlineDevices,
      attentionDevices,
      mappedDevices,
      warningAlerts,
      criticalAlerts,
      faultAlerts,
      escalatedAlerts,
      plantTotalCount: knownPlantTotal,
      deviceTotalCount: knownDeviceTotal,
      alertTotalCount: knownAlertTotal,
      integrationTotalCount: knownIntegrationTotal
    };
  }

  function applyOverviewDataFromLive(payload: Required<LiveSnapshotPayload>): void {
    const store = window.ZentridOverviewData;
    if (!store) return;
    const snap = snapshotFromLive(payload);
    const hasDeviceKpi = Object.keys(payload.deviceKpi || {}).length > 0;
    const hasAlertKpi = Object.keys(payload.alertKpi || {}).length > 0;
    const alertsPending = payload.alertState === 'pending';
    const alertsFailed = payload.alertState === 'error';
    const integrationsPending = payload.integrationState === 'pending';
    const integrationsFailed = payload.integrationState === 'error';
    const mappedCoverage = snap.deviceCount > 0 && snap.mappedDevices > 0
      ? `${Math.min(100, (snap.mappedDevices / snap.deviceCount) * 100).toFixed(1)}%`
      : '—';

    store.kpis = [
      { label: 'Available Providers', value: String(snap.providerNames.length || snap.integrationCount), delta: snap.providerNames.join(', ') || '—', icon: '🔗', tone: 'cyan', route: 'integrations' },
      { label: 'Plants', value: compactNumber(snap.plantCount), delta: overviewCoverageLabel(payload.plants.length, snap.plantTotalCount, 'plant'), icon: '🏭', tone: 'green', route: 'plants' },
      { label: 'Devices', value: compactNumber(snap.deviceCount), delta: hasDeviceKpi ? `${compactNumber(snap.onlineDevices)} online · ${compactNumber(snap.attentionDevices)} attention` : overviewCoverageLabel(payload.devices.length, snap.deviceTotalCount, 'device'), icon: '🔌', tone: 'blue', route: 'devices' },
      { label: 'Online Devices', value: hasDeviceKpi ? compactNumber(snap.onlineDevices) : '—', delta: hasDeviceKpi ? `${compactNumber(snap.attentionDevices)} require attention` : 'Device KPI was not returned', icon: '●', tone: 'green', route: 'devices' },
      { label: 'Alerts', value: alertsPending ? '…' : alertsFailed && snap.alertTotalCount === null ? 'Unavailable' : compactNumber(snap.alertCount), delta: alertsPending ? 'Loading operational alert summary' : alertsFailed && snap.alertTotalCount === null ? 'Alert endpoint did not complete' : hasAlertKpi ? `${compactNumber(snap.warningAlerts)} warning · ${compactNumber(snap.criticalAlerts)} critical · ${compactNumber(snap.faultAlerts)} fault` : overviewCoverageLabel(payload.alerts.length, snap.alertTotalCount, 'alert'), icon: '🚨', tone: 'red', route: 'alerts' },
      { label: 'Integrations', value: integrationsPending ? '…' : integrationsFailed && snap.integrationTotalCount === null ? 'Unavailable' : compactNumber(snap.integrationCount), delta: integrationsPending ? 'Loading operational summaries' : integrationsFailed && snap.integrationTotalCount === null ? '/api/integrations did not complete' : 'Operational summaries returned by /api/integrations', icon: '🧩', tone: 'violet', route: 'integrations' }
    ];

    store.zentridHealth = hasDeviceKpi
      ? [
          { label: 'Online', value: snap.onlineDevices },
          { label: 'Attention', value: snap.attentionDevices }
        ]
      : [];

    store.alertState = payload.alertState;
    store.integrationState = payload.integrationState;

    store.integrations = payload.integrations.map(row => {
      const errorRateValue = row.errorRatePct ?? row.errorRate ?? row.liveSummary?.raw?.errorRatePct;
      const hasErrorRate = errorRateValue !== undefined && errorRateValue !== null && Number.isFinite(Number(errorRateValue));
      const plantsValue = Number(row.plantsCount ?? row.plants ?? row.liveSummary?.raw?.plantsCount ?? 0);
      const staleValue = Number(row.stalePlantsCount ?? row.stalePlants ?? row.liveSummary?.raw?.stalePlantsCount ?? 0);
      const hasStaleMetric = Number.isFinite(plantsValue) && plantsValue > 0 && Number.isFinite(staleValue);
      const lastError = safeText(row.lastErrorMessage || row.liveSummary?.lastErrorMessage, '').trim();
      const staleRateValue = hasStaleMetric ? Math.min(100, (staleValue / plantsValue) * 100) : null;
      const backendMetricValue = hasErrorRate ? Number(errorRateValue) : null;
      const backendMetricMatchesStaleRate = backendMetricValue !== null && staleRateValue !== null
        ? Math.abs(backendMetricValue - staleRateValue) < 0.15
        : false;
      const healthParts = [
        hasStaleMetric ? `${compactNumber(staleValue)}/${compactNumber(plantsValue)} stale` : '',
        backendMetricValue !== null
          ? `API errorRatePct ${backendMetricValue.toFixed(1)}%${backendMetricMatchesStaleRate ? ' · matches stale rate' : ''} · semantics unverified`
          : ''
      ].filter(Boolean);
      return {
        name: safeText(ZentridAPIContracts.normalization.integrationProvider(row.displayName || row.name || row.provider || row.vendor), '—'),
        status: safeText(row.operationalStatus || row.status || row.health, '—'),
        sync: safeText(row.lastSyncText || row.lastSync, fmtDate(row.lastSyncAtUtc || row.updatedAt, '—')),
        errors: healthParts.join(' · ') || (lastError ? 'Last error reported' : 'No integration health metric')
      };
    });

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
      { label: 'Integrations', value: integrationsPending ? '…' : integrationsFailed && snap.integrationTotalCount === null ? 'Unavailable' : String(snap.integrationCount) },
      { label: 'Templates', value: String(snap.templateCount) },
      { label: 'Mapped Devices', value: hasDeviceKpi ? mappedCoverage : '—' },
      { label: 'Stale Plants', value: integrationsPending ? '…' : integrationsFailed && !payload.integrations.length ? 'Unavailable' : payload.integrations.some(row => row.stalePlantsCount !== undefined || row.stalePlants !== undefined || row.liveSummary?.raw?.stalePlantsCount !== undefined) ? compactNumber(snap.staleCount) : '—' },
      { label: 'Stale Plant Rate', value: integrationsPending ? '…' : integrationsFailed && !payload.integrations.length ? 'Unavailable' : snap.integrationPlantCount > 0 ? `${snap.stalePlantRate.toFixed(1)}%` : '—' }
    ];
  }

  function integrationVendor(provider: unknown): string {
    const p = String(provider || '').trim();
    if (/deye/i.test(p)) return 'DeyeCloud';
    if (/solax|solarx/i.test(p)) return 'SolaX';
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
    const canonicalPlantId = firstOf(plant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId', 'raw.liveRecord.id'], '');
    return sameId(device.plantId, canonicalPlantId)
      || sameId(device.plantId, plant.externalId)
      || sameId(device.plantId, plant.id)
      || sameId(device.raw?.sourcePlantId, plant.externalId)
      || sameId(device.raw?.sourcePlantId, plant.sourcePlantId)
      || sameId(device.raw?.sourcePlantId, plant.id);
  }

  function plantMatchesAlert(plant: AnyRecord, alert: AnyRecord): boolean {
    const canonicalPlantId = firstOf(plant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId', 'raw.liveRecord.id'], '');
    return sameId(alert.plantId, canonicalPlantId)
      || sameId(alert.plantId, plant.externalId)
      || sameId(alert.plantId, plant.id)
      || sameId(alert.raw?.sourcePlantId, plant.externalId)
      || sameId(alert.raw?.sourcePlantId, plant.sourcePlantId)
      || sameId(alert.raw?.sourcePlantId, plant.id);
  }

  function deviceMatchesAlert(device: AnyRecord, alert: AnyRecord): boolean {
    const canonicalDeviceId = firstOf(device, ['liveId', 'canonicalDeviceId', 'liveDetail.id', 'liveDetail.deviceId'], '');
    return sameId(alert.deviceId, canonicalDeviceId)
      || sameId(alert.deviceId, device.externalId)
      || sameId(alert.deviceId, device.id)
      || sameId(alert.raw?.sourceDeviceId, device.externalId)
      || sameId(alert.raw?.sourceDeviceId, device.sourceDeviceId)
      || sameId(alert.raw?.sourceDeviceId, device.id);
  }

  function sameLabel(a: unknown, b: unknown): boolean {
    const left = safeText(a, '').trim().toLowerCase();
    const right = safeText(b, '').trim().toLowerCase();
    return Boolean(left && right && left === right && left !== '—');
  }

  function plantMatchesTelemetry(plant: AnyRecord, telemetry: AnyRecord): boolean {
    const canonicalPlantId = firstOf(plant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId', 'raw.liveRecord.id'], '');
    return sameId(telemetry.plantId, canonicalPlantId)
      || sameId(telemetry.plantId, plant.externalId)
      || sameId(telemetry.plantId, plant.id)
      || sameId(telemetry.raw?.sourcePlantId, plant.externalId)
      || sameId(telemetry.raw?.sourcePlantId, plant.sourcePlantId)
      || sameId(telemetry.raw?.sourcePlantId, plant.id)
      || sameLabel(telemetry.plant, plant.name);
  }

  function deviceMatchesTelemetry(device: AnyRecord, telemetry: AnyRecord): boolean {
    const canonicalDeviceId = firstOf(device, ['liveId', 'canonicalDeviceId', 'liveDetail.id', 'liveDetail.deviceId'], '');
    return sameId(telemetry.deviceId, canonicalDeviceId)
      || sameId(telemetry.deviceId, device.externalId)
      || sameId(telemetry.deviceId, device.id)
      || sameId(telemetry.deviceId, device.serial)
      || sameId(telemetry.raw?.sourceDeviceId, device.externalId)
      || sameId(telemetry.raw?.sourceDeviceId, device.sourceDeviceId)
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
        const key = String(device.type || device.subtype || device.raw?.deviceType || '').toLowerCase();
        if (key.includes('invert')) acc.inverters += 1;
        if (key.includes('meter')) acc.meters += 1;
        if (key.includes('transform')) acc.transformers += 1;
        if (key.includes('logger') || key.includes('collector') || key.includes('gateway')) acc.loggers += 1;
        if (key.includes('module') || key.includes('panel')) acc.panels += 1;
        if (key.includes('string')) acc.strings += 1;
        return acc;
      }, { inverters: 0, meters: 0, transformers: 0, loggers: 0, panels: 0, strings: 0 });
      const relationTenant = relatedDevices.map(device => safeText(device.tenant, '').trim()).find(value => value && value !== '—')
        || relatedAlerts.map(alert => safeText(alert.tenant, '').trim()).find(value => value && value !== '—')
        || '';
      const relationTenantId = relatedDevices.map(device => safeText(device.raw?.tenantId || device.tenantId, '').trim()).find(Boolean)
        || relatedAlerts.map(alert => safeText(alert.raw?.tenantId || alert.tenantId, '').trim()).find(Boolean)
        || '';
      return {
        ...plant,
        operator: plant.operator && plant.operator !== '—' ? plant.operator : (plant.tenant && plant.tenant !== '—' ? plant.tenant : relationTenant || '—'),
        tenantId: plant.tenantId || relationTenantId,
        devicesCount: plant.devicesLoaded ? relatedDevices.length : plant.devices,
        alertsCount: plant.alertsLoaded ? relatedAlerts.length : plant.alerts,
        inverters: plant.devicesLoaded ? typeCounts.inverters : plant.inverters,
        meters: plant.devicesLoaded ? typeCounts.meters : plant.meters,
        transformers: plant.devicesLoaded ? typeCounts.transformers : plant.transformers,
        panels: plant.devicesLoaded ? typeCounts.panels : plant.panels,
        strings: plant.devicesLoaded ? typeCounts.strings : plant.strings,
        loggers: typeCounts.loggers,
        relatedDevices,
        relatedAlerts
      };
    });
  }

  function mergeDetailRows(rows: AnyRecord[]): AnyRecord[] {
    const output: AnyRecord[] = [];
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      const key = safeText(firstOf(row, ['id', 'externalId', 'code', 'serial', 'raw.id', 'raw.sourceDeviceId', 'raw.sourceAlertId'], `row-${index}`), `row-${index}`).trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      output.push(row);
    });
    return output;
  }

  function mappedDeviceRows(payload: unknown): AnyRecord[] {
    return ZentridAPIContracts.devices.mapList(asArray(payload), contractMapperContext) as AnyRecord[];
  }

  async function loadPlantDeviceRelations(plant: AnyRecord, forceRefresh: boolean): Promise<{ rows: AnyRecord[]; errors: unknown[]; sources: string[] }> {
    const errors: unknown[] = [];
    const sources: string[] = [];
    const rows: AnyRecord[] = [];
    const registryPlantId = safeText(firstOf(plant, ['adminId', 'registryPlantId', 'raw.adminRecord.id', 'raw.adminRecord.plantId', 'id'], ''), '').trim();
    const canonicalPlantId = safeText(firstOf(plant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId', 'raw.liveRecord.id'], ''), '').trim();
    const externalId = safeText(firstOf(plant, ['sourcePlantId', 'operationalExternalId', 'externalId', 'code'], ''), '').trim();

    if (registryPlantId && window.ZentridPlatformAPI?.plantRegistry?.devices) {
      try {
        const payload = await window.ZentridPlatformAPI.plantRegistry.devices(registryPlantId, detailReadOptions('plant-detail:admin-plant-devices', 100, forceRefresh));
        rows.push(...mappedDeviceRows(payload));
        sources.push(`/api/admin/plants/${encodeURIComponent(registryPlantId)}/devices`);
        return { rows: mergeDetailRows(rows), errors, sources };
      } catch (error) {
        errors.push(error);
      }
    }

    if (registryPlantId) {
      try {
        const result = await ZentridAPIRepositories.devices.list({
          ...detailReadOptions('plant-detail:devices-by-registry-plant', 100, forceRefresh),
          plantId: registryPlantId
        });
        rows.push(...result.items.filter(row => plantMatchesDevice(plant, row)));
        errors.push(...result.errors);
        sources.push(`${result.source}?plantId=${encodeURIComponent(registryPlantId)}`);
      } catch (error) {
        errors.push(error);
      }
    }

    if (!rows.length && window.ZentridPlatformAPI?.liveDevices?.list && canonicalPlantId) {
      try {
        const payload = await window.ZentridPlatformAPI.liveDevices.list({ page: 1, pageSize: 100, plantId: canonicalPlantId }, detailReadOptions('plant-detail:live-devices-by-plant', 100, forceRefresh));
        rows.push(...mappedDeviceRows(payload).filter(row => plantMatchesDevice(plant, row)));
        sources.push(`/api/devices?plantId=${encodeURIComponent(canonicalPlantId)}`);
      } catch (error) {
        errors.push(error);
      }
    }

    if (!rows.length && window.ZentridPlatformAPI?.liveDevices?.list && externalId && externalId !== '—') {
      try {
        const payload = await window.ZentridPlatformAPI.liveDevices.list({ page: 1, pageSize: 100, search: externalId }, detailReadOptions('plant-detail:live-devices-search', 100, forceRefresh));
        rows.push(...mappedDeviceRows(payload).filter(row => plantMatchesDevice(plant, row)));
        sources.push(`/api/devices?search=${encodeURIComponent(externalId)}`);
      } catch (error) {
        errors.push(error);
      }
    }

    return { rows: mergeDetailRows(rows), errors, sources };
  }

  async function loadPlantAlertRelations(plant: AnyRecord, forceRefresh: boolean): Promise<{ rows: AnyRecord[]; errors: unknown[]; source: string }> {
    const canonicalPlantId = safeText(firstOf(plant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId', 'raw.liveRecord.id'], ''), '').trim();
    if (!canonicalPlantId) {
      return { rows: [], errors: [new Error('A Canonical/Platform Live Plant ID is required for plant-scoped alerts. Registry UUIDs are not sent to /api/admin/alerts.')], source: '/api/admin/alerts' };
    }
    try {
      const result = await ZentridAPIRepositories.alerts.list({
        ...detailReadOptions(`plant-detail:alerts-${canonicalPlantId}`, 100, forceRefresh),
        timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS,
        plantId: canonicalPlantId
      });
      const rows = result.items.filter(row => plantMatchesAlert(plant, row));
      return { rows, errors: result.errors, source: `${result.source}?plantId=${encodeURIComponent(canonicalPlantId)}` };
    } catch (error) {
      return { rows: [], errors: [error], source: `/api/admin/alerts?plantId=${encodeURIComponent(canonicalPlantId)}` };
    }
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
        alerts: device.alertsLoaded ? relatedAlerts.length : (relatedAlerts.length ? relatedAlerts.length : device.alerts),
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
    // Connector identity belongs to /api/admin/provider-integrations. The
    // provider-level /api/integrations dataset may enrich a connector, but it
    // must never create a synthetic Connector Registry row or overwrite
    // connector-level Registry fields with provider-wide operational counts.
    if (!registry.length) return registry;

    const registryCounts = new Map<string, number>();
    registry.forEach(record => {
      const key = integrationMatchKey(record);
      if (key) registryCounts.set(key, (registryCounts.get(key) || 0) + 1);
    });
    const summaryBuckets = new Map<string, AnyRecord[]>();
    summaries.forEach(summary => {
      const key = integrationMatchKey(summary);
      if (!key) return;
      const bucket = summaryBuckets.get(key) || [];
      bucket.push(summary);
      summaryBuckets.set(key, bucket);
    });

    return registry.map(record => {
      const key = integrationMatchKey(record);
      if (!key) return { ...record, operationalSummaryLinkStatus: 'unmatched-provider' };
      if ((registryCounts.get(key) || 0) !== 1) {
        return { ...record, operationalSummaryLinkStatus: 'ambiguous-registry-provider' };
      }
      const candidates = summaryBuckets.get(key) || [];
      if (candidates.length !== 1) {
        return {
          ...record,
          operationalSummaryLinkStatus: candidates.length > 1 ? 'ambiguous-operational-provider' : 'not-found'
        };
      }
      const summary = candidates[0];
      if (!summary) return { ...record, operationalSummaryLinkStatus: 'not-found' };
      return {
        ...record,
        operationalSummaryLinkStatus: 'matched-by-unique-provider',
        operationalPlants: summary.plants,
        operationalDevices: summary.devices,
        operationalAlerts: summary.alerts,
        operationalActiveIntegrations: summary.activeIntegrations,
        operationalStalePlants: summary.stalePlants,
        operationalErrorRate: summary.errorRate,
        operationalHealth: summary.health || summary.status || '',
        operationalStatus: summary.status || summary.health || '',
        operationalLastSync: summary.lastSync || summary.lastSuccessfulSync || summary.lastActivity || '',
        operationalLastErrorMessage: summary.lastErrorMessage || '',
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
      plantTotalCount: null, deviceTotalCount: null, alertTotalCount: null, integrationTotalCount: null,
      deviceKpi: {}, alertKpi: {}, alertState: 'pending', integrationState: 'pending'
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
        { label: 'Integrations', value: compactNumber(snap.integrationCount), meta: pending.has('integration summaries') ? 'Operational summary loading' : `${payload.integrations.length} operational summary row(s) loaded` }
      ]);
    };

    try {
      const results = await Promise.allSettled([
        ZentridAPIRepositories.plants.list({ ...detailReadOptions('overview:plants', 20, forceRefresh), cacheVariant: 'live' }),
        ZentridAPIRepositories.devices.list({ ...detailReadOptions('overview:devices', 20, forceRefresh), cacheVariant: 'live' }),
        ZentridPlatformAPI.live.providers(),
        ZentridPlatformAPI.providerIntegrations.templates()
      ]);
      const [plantsResult, devicesResult, providersResult, templatesResult] = results;
      payload.plants = plantsResult.status === 'fulfilled' ? plantsResult.value.rawItems : [];
      payload.plantTotalCount = plantsResult.status === 'fulfilled' ? plantsResult.value.pagination.totalCount : null;
      payload.devices = devicesResult.status === 'fulfilled' ? devicesResult.value.rawItems : [];
      payload.deviceTotalCount = devicesResult.status === 'fulfilled' ? devicesResult.value.pagination.totalCount : null;
      payload.deviceKpi = devicesResult.status === 'fulfilled' ? (devicesResult.value.kpi || {}) : {};
      payload.providers = providersResult.status === 'fulfilled' ? asArray(providersResult.value) : [];
      payload.templates = templatesResult.status === 'fulfilled' ? asArray(templatesResult.value) : [];
      results.forEach(result => { if (result.status === 'rejected') errors.push(result.reason); });
      if (plantsResult.status === 'fulfilled') errors.push(...plantsResult.value.errors);
      if (devicesResult.status === 'fulfilled') errors.push(...devicesResult.value.errors);

      const hasCoreSignal = Boolean(payload.plants.length || payload.devices.length || payload.providers.length || payload.templates.length);
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

    void ZentridAPIRepositories.alerts.list({ ...detailReadOptions('overview:alerts', 20, forceRefresh), cacheVariant: 'live', timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
      .then(result => {
        payload.alerts = result.rawItems;
        payload.alertTotalCount = result.pagination.totalCount;
        payload.alertKpi = result.kpi || {};
        payload.alertState = 'ready';
        errors.push(...result.errors);
        renderOverviewLiveSnapshot(payload);
      })
      .catch(error => {
        payload.alertState = 'error';
        errors.push(error);
        renderOverviewLiveSnapshot(payload);
      })
      .finally(() => { pending.delete('alerts'); updateState(); });

    void ZentridAPIRepositories.integrations.summary({ ...detailReadOptions('integration-summary', 20, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
      .then(result => {
        // Overview intentionally shows the operational provider dataset itself.
        // It is not a Connector Registry view, so do not run Registry identity
        // merge rules here.
        payload.integrations = result.items;
        payload.integrationTotalCount = result.pagination.totalCount || result.items.length;
        payload.integrationState = 'ready';
        errors.push(...result.errors);
        renderOverviewLiveSnapshot(payload);
      })
      .catch(error => {
        payload.integrationState = 'error';
        errors.push(error);
        renderOverviewLiveSnapshot(payload);
      })
      .finally(() => { pending.delete('integration summaries'); updateState(); });
  }

  async function applyIntegrations(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/integrations\.html$/.test(location.pathname)) return;
    const requestVersion = beginRegistryRequest('integrations');
    ensureVendorTemplateAliases();
    if (!backgroundRefresh) setLiveDataState('loading', 'Loading the requested Connector Registry page. Operational summaries will be added separately.', { source: '/api/admin/provider-integrations' });
    try {
      const [registryResult, providersResult, templatesResult] = await Promise.allSettled([
        ZentridAPIRepositories.integrations.list(registryReadOptions('integrations', forceRefresh)),
        ZentridPlatformAPI.live.providers(),
        ZentridPlatformAPI.providerIntegrations.templates()
      ]);
      if (!isCurrentRegistryRequest('integrations', requestVersion)) return;
      const registry = registryResult.status === 'fulfilled' ? registryResult.value : null;
      if (registry) publishRegistryPagination('integrations', registry);
      const data = registry?.items || [];
      const providers = providersResult.status === 'fulfilled' ? asArray(providersResult.value) : [];
      const templates = templatesResult.status === 'fulfilled' ? asArray(templatesResult.value) : [];
      const errors: unknown[] = [...(registry?.errors || [])];
      if (registryResult.status === 'rejected') errors.push(registryResult.reason);
      if (providersResult.status === 'rejected') errors.push(providersResult.reason);
      if (templatesResult.status === 'rejected') errors.push(templatesResult.reason);

      integrations = data;
      window.ZentridLiveIntegrations = integrations;
      ZentridLayout.mount(renderIntegrations());
      wireIntegrations();

      if (data.length) {
        setLiveDataState('partial', `Connector Registry page ${registry?.pagination.page || 1} of ${registry?.pagination.totalPages || 1} is ready. Operational counts and sync health continue loading separately.`, {
          source: registry?.source || '/api/admin/provider-integrations',
          details: `Server pagination · ${registry?.pagination.pageSize || data.length} rows per page · Background: /api/integrations`,
          recordCount: registry?.pagination.totalCount || data.length
        });
      } else if (errors.length) {
        setRequestFailure('/api/admin/provider-integrations', errors[0], 'No prototype connector records are displayed.');
      } else {
        setLiveDataState('empty', 'The requested Connector Registry page returned no records.', { source: '/api/admin/provider-integrations', recordCount: registry?.pagination.totalCount || 0 });
      }

      insertIntegrationLiveSummary([
        { label: 'Integration Registry', value: `${registry?.pagination.totalCount ?? data.length} record(s)`, meta: `Page ${registry?.pagination.page || 1} · administrative source` },
        { label: '/api/Providers', value: `${providers.length} provider(s)`, meta: providers.join(', ') || 'Endpoint empty' },
        { label: 'Templates', value: `${templates.length} template(s)`, meta: templates.join(', ') || 'Endpoint empty' },
        { label: 'Operational Summary', value: 'Loading…', meta: 'Provider-level enrichment; never creates connector rows' }
      ]);

      if (!data.length) return;
      void ZentridAPIRepositories.integrations.summary({ ...detailReadOptions('integration-summary', 20, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
        .then(summary => {
          if (!isCurrentRegistryRequest('integrations', requestVersion)) return;
          const enriched = mergeIntegrationSummaries(data, summary.items);
          integrations = enriched;
          window.ZentridLiveIntegrations = integrations;
          ZentridLayout.mount(renderIntegrations());
          wireIntegrations();
          setLiveDataState(summary.errors.length ? 'partial' : 'live', summary.errors.length
            ? 'The Connector Registry is visible, but part of the optional operational summary could not be loaded.'
            : 'The Connector Registry page was enriched with provider-level operational counts and sync health.', {
            source: `${registry?.source || '/api/admin/provider-integrations'} + ${summary.source}`,
            details: summary.errors.length ? `${summary.errors.length} summary error(s)` : 'Registry identities preserved · progressive enrichment complete',
            recordCount: registry?.pagination.totalCount || enriched.length
          });
          insertIntegrationLiveSummary([
            { label: 'Integration Registry', value: `${registry?.pagination.totalCount ?? data.length} record(s)`, meta: `Page ${registry?.pagination.page || 1} · administrative records` },
            { label: 'Operational Summary', value: `${summary.items.length} provider row(s)`, meta: summary.items.map(item => item.vendor || item.name).filter(Boolean).join(', ') || 'No summary rows' },
            { label: 'Providers / Templates', value: `${providers.length}/${templates.length}`, meta: 'Fast supporting endpoints' }
          ]);
        })
        .catch(error => {
          if (!isCurrentRegistryRequest('integrations', requestVersion)) return;
          setLiveDataState('partial', 'The Connector Registry is ready. The optional operational summary did not complete, so Registry values remain visible.', {
            source: registry?.source || '/api/admin/provider-integrations',
            details: liveErrorMessage(error),
            recordCount: registry?.pagination.totalCount || data.length
          });
        });
    } catch (error) {
      if (isCurrentRegistryRequest('integrations', requestVersion)) setRequestFailure('/api/admin/provider-integrations', error, 'No prototype connector records are displayed.');
    }
  }


  async function applyPlants(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/plants\.html$/.test(location.pathname)) return;
    const requestVersion = beginRegistryRequest('plants');
    if (!backgroundRefresh) setLiveDataState('loading', 'Loading the administrative Plant Registry. Operational plant data will load separately without blocking master-data actions.', { source: '/api/admin/plants' });
    try {
      const registry = await ZentridAPIRepositories.plants.list({ ...registryReadOptions('plants', forceRefresh), cacheVariant: 'admin-registry' });
      if (!isCurrentRegistryRequest('plants', requestVersion)) return;
      publishRegistryPagination('plants', registry);
      const data = registry.items;
      if (!data.length) {
        if (registry.errors.length) setRequestFailure(registry.source, registry.errors[0], 'No plant registry records are displayed.');
        else setLiveDataState('empty', 'The requested administrative plant page returned no records.', { source: registry.source, recordCount: registry.pagination.totalCount });
        return;
      }
      window.ZentridLivePlants = data;
      window.ZentridOperationalPlants = [];
      window.ZentridOperationalPlantPagination = undefined;
      window.ZentridOperationalPlantsState = 'pending';
      syncLiveClientModel(data, []);
      ZentridLayout.mount(renderPlants());
      wirePlants();
      const cacheInfo = repositoryCachePresentation(registry);
      setLiveDataState('partial', `${cacheInfo.prefix}Plant Registry page ${registry.pagination.page} is ready. The operational /api/plants snapshot is loading independently.`, {
        source: registry.source,
        details: `${cacheInfo.details ? `${cacheInfo.details} · ` : ''}Registry page ${registry.pagination.page} of ${registry.pagination.totalPages} · Operational snapshot pending`,
        recordCount: registry.pagination.totalCount,
        ...cacheFreshnessOptions(cacheInfo)
      });
      void ZentridAPIRepositories.plants.list({ page: 1, pageSize: 20, cacheVariant: 'live', staleWhileRevalidate: true, persist: true, requestGroup: 'plants:operational-snapshot', supersede: true, forceRefresh })
        .then(operational => {
          if (!isCurrentRegistryRequest('plants', requestVersion)) return;
          window.ZentridOperationalPlants = operational.items;
          window.ZentridOperationalPlantPagination = operational.pagination;
          window.ZentridOperationalPlantsState = operational.errors.length ? 'error' : 'ready';
          ZentridLayout.mount(renderPlants()); wirePlants();
          setLiveDataState(operational.errors.length ? 'partial' : 'live', operational.errors.length ? 'The Plant Registry is ready, but the optional operational snapshot could not be completed.' : 'Administrative Plant Registry and the separate operational plant snapshot are both ready.', {
            source: `${registry.source} + ${operational.source}`,
            details: operational.errors.length ? `${operational.errors.length} operational error(s) · Registry remains available` : `Registry ${registry.pagination.totalCount} record(s) · Operational ${operational.pagination.totalCount} record(s) · No page-position merge`,
            recordCount: registry.pagination.totalCount
          });
        })
        .catch(error => {
          if (!isCurrentRegistryRequest('plants', requestVersion)) return;
          window.ZentridOperationalPlants = [];
          window.ZentridOperationalPlantPagination = undefined;
          window.ZentridOperationalPlantsState = 'error';
          ZentridLayout.mount(renderPlants()); wirePlants();
          setLiveDataState('partial', 'The administrative Plant Registry is ready. Operational plant data is unavailable, so live metrics are not substituted with registry values.', { source: registry.source, details: liveErrorMessage(error), recordCount: registry.pagination.totalCount });
        });
    } catch (error) {
      if (isCurrentRegistryRequest('plants', requestVersion)) setRequestFailure('/api/admin/plants', error, 'No plant registry records are displayed.');
    }
  }

  async function applyDevices(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/devices\.html$/.test(location.pathname)) return;
    const requestVersion = beginRegistryRequest('devices');
    if (!backgroundRefresh) setLiveDataState('loading', 'Loading the administrative Device Registry. Operational device KPI and status data will load separately.', { source: '/api/admin/devices' });
    try {
      const registry = await ZentridAPIRepositories.devices.list(registryReadOptions('devices', forceRefresh));
      if (!isCurrentRegistryRequest('devices', requestVersion)) return;
      publishRegistryPagination('devices', registry);
      if (!registry.items.length) {
        setLiveDataState('empty', 'The requested Device Registry page returned no records. No prototype device records are displayed.', { source: registry.source, recordCount: registry.pagination.totalCount });
        return;
      }
      window.ZentridLiveDevices = registry.items;
      window.ZentridOperationalDevices = [];
      window.ZentridOperationalDevicePagination = undefined;
      window.ZentridOperationalDeviceKpi = undefined;
      window.ZentridOperationalDevicesState = 'pending';
      ZentridLayout.mount(renderDevices());
      wireDevices();
      const cacheInfo = repositoryCachePresentation(registry);
      setLiveDataState('partial', `${cacheInfo.prefix}Device Registry page ${registry.pagination.page} is ready. The operational /api/devices snapshot is loading independently.`, {
        source: registry.source,
        details: `${cacheInfo.details ? `${cacheInfo.details} · ` : ''}Registry page ${registry.pagination.page} of ${registry.pagination.totalPages} · Operational snapshot pending`,
        recordCount: registry.pagination.totalCount,
        ...cacheFreshnessOptions(cacheInfo)
      });
      void ZentridAPIRepositories.devices.list({ ...detailReadOptions('devices:operational-snapshot', 20, forceRefresh), cacheVariant: 'live' })
        .then(operational => {
          if (!isCurrentRegistryRequest('devices', requestVersion)) return;
          window.ZentridOperationalDevices = operational.items;
          window.ZentridOperationalDevicePagination = operational.pagination;
          window.ZentridOperationalDeviceKpi = operational.kpi;
          window.ZentridOperationalDevicesState = operational.errors.length ? 'error' : 'ready';
          ZentridLayout.mount(renderDevices()); wireDevices();
          setLiveDataState(operational.errors.length ? 'partial' : 'live', operational.errors.length ? 'The Device Registry is ready, but the operational device snapshot could not be completed.' : 'Administrative Device Registry and the separate operational device snapshot are both ready.', {
            source: `${registry.source} + ${operational.source}`,
            details: operational.errors.length ? `${operational.errors.length} operational error(s) · Registry remains available` : `Registry ${registry.pagination.totalCount} record(s) · Operational ${operational.pagination.totalCount} record(s) · KPI preserved from /api/devices`,
            recordCount: registry.pagination.totalCount,
            dataOrigin: operational.errors.length ? 'live' : 'mixed'
          });
        })
        .catch(error => {
          if (!isCurrentRegistryRequest('devices', requestVersion)) return;
          window.ZentridOperationalDevices = [];
          window.ZentridOperationalDevicePagination = undefined;
          window.ZentridOperationalDeviceKpi = undefined;
          window.ZentridOperationalDevicesState = 'error';
          ZentridLayout.mount(renderDevices()); wireDevices();
          setLiveDataState('partial', 'The administrative Device Registry is ready. Operational device data is unavailable, so live KPI values are not substituted with registry-page counts.', { source: registry.source, details: liveErrorMessage(error), recordCount: registry.pagination.totalCount });
        });
    } catch (error) {
      if (isCurrentRegistryRequest('devices', requestVersion)) setRequestFailure('/api/admin/devices', error, 'No prototype device records are displayed.');
    }
  }

  async function applyAlerts(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/alerts\.html$/.test(location.pathname)) return;
    const requestVersion = beginRegistryRequest('alerts');
    if (!backgroundRefresh) setLiveDataState('loading', 'Loading the requested Alert Registry page.', { source: '/api/admin/alerts' });
    try {
      const alertOptions = { ...registryReadOptions('alerts', forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS };
      let registry = await ZentridAPIRepositories.alerts.list(alertOptions);
      if (!isCurrentRegistryRequest('alerts', requestVersion)) return;
      const requestedSearch = String(alertOptions.search || '').trim();
      if (requestedSearch && registry.pagination.totalCount === 0) {
        try {
          const fallback = await alertDisplaySearchFallback(requestedSearch, alertOptions);
          if (!isCurrentRegistryRequest('alerts', requestVersion)) return;
          if (fallback) registry = fallback;
        } catch (fallbackError) {
          console.warn('Zentrid alert display-field fallback search was unavailable.', fallbackError);
          setAlertSearchMeta({ mode: 'backend', query: requestedSearch, scannedCount: 0, availableCount: 0, truncated: false });
        }
      } else {
        setAlertSearchMeta({
          mode: requestedSearch ? 'backend' : 'none',
          query: requestedSearch,
          scannedCount: registry.items.length,
          availableCount: registry.pagination.totalCount,
          truncated: false
        });
      }
      publishRegistryPagination('alerts', registry);
      const data = registry.items;
      const alertStore = window.ZentridAlerts || (typeof ZentridAlerts !== 'undefined' ? ZentridAlerts : null);
      if (!Array.isArray(alertStore)) return;

      try {
        const storedContext = JSON.parse(localStorage.getItem('zentrid_alert_context') || '{}') as Record<string, unknown>;
        const plantId = String(storedContext.plantId || '').trim();
        const deviceId = String(storedContext.deviceId || '').trim();
        const tenant = String(storedContext.tenant || '').trim();
        const contextMatches = data.some(item =>
          (!plantId || String(item.plantId || '') === plantId) &&
          (!deviceId || String(item.deviceId || '') === deviceId) &&
          (!tenant || String(item.tenant || '') === tenant)
        );
        if ((plantId || deviceId || tenant) && data.length && !contextMatches) localStorage.removeItem('zentrid_alert_context');
      } catch {
        localStorage.removeItem('zentrid_alert_context');
      }

      (alertStore as AnyRecord[]).splice(0, alertStore.length, ...data);
      window.ZentridOperationalAlerts = [];
      window.ZentridOperationalAlertPagination = undefined;
      window.ZentridOperationalAlertKpi = undefined;
      window.ZentridOperationalAlertsState = 'pending';
      ZentridLayout.mount(renderAlertsPage());
      wireAlertsPage();

      const cacheInfo = repositoryCachePresentation(registry);
      const registryState: LiveDataState = data.length ? 'partial' : 'empty';
      setLiveDataState(registryState, data.length
        ? `${cacheInfo.prefix}Alert Registry page ${registry.pagination.page} is ready. The operational /api/alerts snapshot is loading independently.`
        : 'The requested Alert Registry page returned no records. The operational /api/alerts snapshot is still checked separately.', {
        source: registry.source,
        details: [`Registry page ${registry.pagination.page} of ${registry.pagination.totalPages}`, requestedSearch && registry.source.includes('display-field fallback') ? 'Display-field fallback search' : '', 'Operational snapshot pending', cacheInfo.details].filter(Boolean).join(' · '),
        recordCount: registry.pagination.totalCount,
        ...cacheFreshnessOptions(cacheInfo)
      });

      void ZentridAPIRepositories.alerts.list({ ...detailReadOptions('alerts:operational-snapshot', 20, forceRefresh), cacheVariant: 'live', timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS })
        .then(operational => {
          if (!isCurrentRegistryRequest('alerts', requestVersion)) return;
          window.ZentridOperationalAlerts = operational.items;
          window.ZentridOperationalAlertPagination = operational.pagination;
          window.ZentridOperationalAlertKpi = operational.kpi;
          window.ZentridOperationalAlertsState = operational.errors.length ? 'error' : 'ready';
          ZentridLayout.mount(renderAlertsPage());
          wireAlertsPage();
          const state: LiveDataState = operational.errors.length ? 'partial' : (data.length || operational.items.length ? 'live' : 'empty');
          setLiveDataState(state, operational.errors.length
            ? 'The Alert Registry is ready, but the operational alert snapshot could not be completed.'
            : 'Administrative Alert Registry and the separate operational alert snapshot are both ready.', {
            source: `${registry.source} + ${operational.source}`,
            details: operational.errors.length
              ? `${operational.errors.length} operational error(s) · Registry remains available`
              : `Registry ${registry.pagination.totalCount} record(s) · Operational ${operational.pagination.totalCount} record(s) · No page-position join`,
            recordCount: registry.pagination.totalCount,
            dataOrigin: operational.errors.length ? 'live' : 'mixed'
          });
        })
        .catch(error => {
          if (!isCurrentRegistryRequest('alerts', requestVersion)) return;
          window.ZentridOperationalAlerts = [];
          window.ZentridOperationalAlertPagination = undefined;
          window.ZentridOperationalAlertKpi = undefined;
          window.ZentridOperationalAlertsState = 'error';
          ZentridLayout.mount(renderAlertsPage());
          wireAlertsPage();
          setLiveDataState('partial', 'The administrative Alert Registry is ready. Operational alert data is unavailable, so live counts are not substituted with registry-page counts.', {
            source: registry.source,
            details: liveErrorMessage(error),
            recordCount: registry.pagination.totalCount
          });
        });
    } catch (error) {
      if (isCurrentRegistryRequest('alerts', requestVersion)) setRequestFailure('/api/admin/alerts', error, 'No prototype alert records are displayed.');
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
    if (!text || text === '—') return '—';
    if (/[a-z]/i.test(text)) return text;
    return `${text} ${unit}`;
  }

  function ensureLiveClientModelPlant(plant: AnyRecord, devices: AnyRecord[] = []): void {
    const model = window.ZentridClientModel;
    if (!model || !Array.isArray(model.plants) || !Array.isArray(model.devices)) return;

    const relatedAlerts = Array.isArray(plant.relatedAlerts) ? plant.relatedAlerts as AnyRecord[] : [];
    const assignedClientId = safeText(plant.clientId, '').trim();
    const assignedClient = assignedClientId
      ? model.clients?.find((item: AnyRecord) => safeText(item?.id, '').trim() === assignedClientId)
      : null;
    const relationTenant = devices.map(device => safeText(device.tenant, '').trim()).find(value => value && value !== '—')
      || relatedAlerts.map(alert => safeText(alert.tenant, '').trim()).find(value => value && value !== '—')
      || '';
    const relationTenantId = devices.map(device => safeText(device.raw?.tenantId || device.tenantId, '').trim()).find(Boolean)
      || relatedAlerts.map(alert => safeText(alert.raw?.tenantId || alert.tenantId, '').trim()).find(Boolean)
      || '';
    const relationProvider = devices.map(device => safeText(device.vendor || device.sourceSystem || device.raw?.provider || device.raw?.vendorExtensions?.sourceSystem, '').trim()).find(value => value && value !== '—') || '';
    const sourceScheme = safeText(plant.sourceScheme || plant.raw?.sourceScheme || plant.raw?.vendorPlatform?.sourceScheme, '').trim();
    const mappedSourceSystem = safeText(plant.sourceSystem || plant.vendor, '').trim();
    const operationalProvider = mappedSourceSystem && mappedSourceSystem !== '—' && mappedSourceSystem !== sourceScheme ? mappedSourceSystem : relationProvider || '—';
    const devicesLoaded = Boolean(plant.devicesLoaded);
    const alertsLoaded = Boolean(plant.alertsLoaded);
    const telemetryLoaded = Boolean(plant.telemetryLoaded);
    const rawDeviceCount = Number(plant.devicesCount ?? plant.devices);
    const backendDeviceCount = Number.isFinite(rawDeviceCount) ? rawDeviceCount : null;
    const rawAlertCount = Number(plant.alertsCount ?? plant.alerts);
    const backendAlertCount = Number.isFinite(rawAlertCount) ? rawAlertCount : null;

    const normalizedCount = (value: unknown): number | null => {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };
    const typeToken = (device: AnyRecord): string => safeText(device.type || device.subtype || device.raw?.deviceType || device.raw?.vendorExtensions?.deviceType, '').trim().toLowerCase();
    const countType = (pattern: RegExp): number => devices.filter(device => pattern.test(typeToken(device))).length;
    const panelCount = normalizedCount(plant.panels);
    const stringCount = normalizedCount(plant.strings);
    const inverterCount = devicesLoaded ? countType(/invert/) : normalizedCount(plant.inverters);
    const meterCount = devicesLoaded ? countType(/meter/) : normalizedCount(plant.meters);
    const transformerCount = devicesLoaded ? countType(/transform/) : normalizedCount(plant.transformers);

    const livePlant = {
      id: plant.id,
      adminId: safeText(plant.adminId || plant.raw?.adminRecord?.id || plant.raw?.adminRecord?.plantId, '').trim(),
      operationalId: safeText(plant.operationalId, '').trim(),
      operationalExternalId: safeText(plant.operationalExternalId, '').trim(),
      code: plant.code || plant.externalId || plant.id,
      externalId: plant.externalId || plant.id,
      name: plant.name,
      clientId: assignedClientId,
      tenantId: safeText(plant.tenantId, '').trim() || relationTenantId,
      portfolio: plant.portfolio && plant.portfolio !== '—' ? plant.portfolio : '—',
      status: plant.status && plant.status !== 'Unknown' ? plant.status : '—',
      type: plant.type || '—',
      country: plant.country || '—',
      region: plant.region || '—',
      city: plant.city || '—',
      address: plant.address || '—',
      timezone: plant.timezone || '—',
      capacityDc: liveCapacity(plant.capacityDc, 'MWp'),
      capacityAc: liveCapacity(plant.capacityAc, 'MW'),
      gridCapacity: liveCapacity(plant.gridCapacity, 'MW'),
      commissioning: plant.commissioned || plant.commissioning || plant.commissionedAt || '—',
      owner: assignedClient?.name || (plant.owner && plant.owner !== '—' ? plant.owner : '—'),
      operator: plant.operator && plant.operator !== '—' ? plant.operator : (plant.tenant && plant.tenant !== '—' ? plant.tenant : relationTenant || '—'),
      om: plant.om && plant.om !== '—' ? plant.om : '—',
      powerNow: plant.livePower && plant.livePower !== '0 kW' ? plant.livePower : '—',
      energyToday: plant.today && plant.today !== '0 kWh' ? plant.today : '—',
      totalEnergy: plant.totalEnergy ?? null,
      alerts: alertsLoaded ? relatedAlerts.length : (backendAlertCount ?? null),
      alertsLoaded,
      health: plant.health || 'Unknown',
      panels: panelCount,
      inverters: inverterCount,
      strings: stringCount,
      transformers: transformerCount,
      meters: meterCount,
      battery: plant.battery || '—',
      devices: devices.map(device => device.id).filter(Boolean),
      devicesCount: devicesLoaded ? devices.length : backendDeviceCount,
      devicesLoaded,
      telemetryLoaded,
      relatedAlerts,
      dataOrigin: 'live',
      lastDataAt: plant.lastDataAt || '',
      lastSyncAt: plant.lastSyncAt || plant.updatedAt || '',
      dataQualityStatus: plant.dataQualityStatus || plant.freshness || '—',
      sourceSystem: operationalProvider,
      sourceScheme: sourceScheme || '—',
      integration: plant.integration && plant.integration !== '—' ? plant.integration : '—',
      latitude: plant.latitude || plant.lat || '',
      longitude: plant.longitude || plant.lng || '',
      raw: plant.raw || undefined
    };
    upsertLiveRecord(model.plants, livePlant);
    devices.forEach(device => {
      upsertLiveRecord(model.devices, {
        id: device.id,
        plantId: livePlant.id,
        externalId: device.externalId || device.raw?.sourceDeviceId || '—',
        type: device.type || device.subtype || 'Device',
        name: device.name || device.id,
        vendor: device.vendor || device.manufacturer || device.sourceSystem || '—',
        model: device.model || '—',
        serial: device.serial || device.externalId || '—',
        capacity: device.capacity || device.power || '—',
        firmware: device.firmware || '—',
        status: device.status || 'Unknown',
        location: device.parent || device.location || '—',
        parentDeviceId: device.raw?.parentDeviceId || device.raw?.vendorExtensions?.parentDeviceId || '',
        parentDeviceName: device.raw?.parentDeviceName || '',
        lastSeen: device.lastSeen || '—',
        children: device.children ?? '—',
        manufacturer: device.manufacturer || device.vendor || '—',
        tenant: device.tenant && device.tenant !== '—' ? device.tenant : livePlant.operator,
        plant: livePlant.name,
        integration: device.integration && device.integration !== '—' ? device.integration : '—',
        sourceStatus: device.sourceStatus || device.dataQualityStatus || '—',
        raw: device.raw || undefined
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
        <article class="kpi-card green"><span class="kpi-label">Linked Devices</span><div class="kpi-value">${htmlEscape(relatedDevices.length || plant.devices || 0)}</div><small class="kpi-delta">Matched from /api/admin/devices</small></article>
        <article class="kpi-card blue"><span class="kpi-label">Capacity DC</span><div class="kpi-value">${htmlEscape(plant.capacityDc)} MWp</div><small class="kpi-delta">Installed capacity</small></article>
        <article class="kpi-card yellow"><span class="kpi-label">Related Alerts</span><div class="kpi-value">${htmlEscape(relatedAlerts.length || plant.alerts || 0)}</div><small class="kpi-delta">Matched from /api/admin/alerts</small></article>
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
        <article class="kpi-card cyan"><span class="kpi-label">Status</span><div class="kpi-value">${htmlEscape(device.status)}</div><small class="kpi-delta">From /api/admin/devices</small></article>
        <article class="kpi-card green"><span class="kpi-label">Related Plant</span><div class="kpi-value">${plant ? '1' : '0'}</div><small class="kpi-delta">Matched from /api/plants</small></article>
        <article class="kpi-card yellow"><span class="kpi-label">Related Alerts</span><div class="kpi-value">${alerts.length}</div><small class="kpi-delta">Matched from /api/admin/alerts</small></article>
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


  function normalizedSourceKey(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }

  function isUuidValue(value: unknown): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value ?? '').trim());
  }

  function normalizedProviderIdentity(value: unknown): string {
    const key = normalizedSourceKey(value).replace(/[\s_-]+/g, '');
    if (key === 'deye' || key === 'deyecloud') return 'deyecloud';
    if (key === 'solarx' || key === 'solax') return 'solax';
    if (key === 'sungrow') return 'sungrow';
    if (key === 'huawei') return 'huawei';
    return key;
  }

  function liveDeviceMatchesAdmin(candidate: AnyRecord, device: AnyRecord): boolean {
    const sourceDeviceId = normalizedSourceKey(firstOf(candidate, ['sourceDeviceId', 'sourceReference.sourceEntityId', 'vendorExtensions.sourceDeviceId', 'vendorExtensions.deviceId', 'deviceId'], ''));
    const adminSourceDeviceId = normalizedSourceKey(firstOf(device, ['externalId', 'raw.source.sourceDeviceId', 'raw.sourceDeviceId', 'serial'], ''));
    if (!sourceDeviceId || !adminSourceDeviceId || sourceDeviceId !== adminSourceDeviceId) return false;
    const publicProvider = normalizedProviderIdentity(firstOf(candidate, ['provider', 'sourceReference.sourceSystem', 'vendorExtensions.sourceSystem'], ''));
    const adminProvider = normalizedProviderIdentity(firstOf(device, ['vendor', 'raw.source.provider'], ''));
    return !publicProvider || !adminProvider || publicProvider === adminProvider;
  }

  async function loadLiveDeviceDetail(device: AnyRecord, forceRefresh: boolean): Promise<{ id: string; detail: AnyRecord } | null> {
    const sourceDeviceId = String(firstOf(device, ['externalId', 'raw.source.sourceDeviceId', 'raw.sourceDeviceId', 'serial'], '') || '').trim();
    const explicitLiveId = String(firstOf(device, ['liveId', 'canonicalDeviceId'], '') || '').trim();

    // Device Registry UUIDs are administrative/canonical identifiers. The Platform Live
    // detail endpoint does not necessarily accept that UUID (confirmed by real 404s), so
    // only reuse an already-resolved live id here. Otherwise start from sourceDeviceId.
    if (explicitLiveId) {
      try {
        const direct = await window.ZentridPlatformAPI?.liveDevices?.get(explicitLiveId, detailReadOptions('device-detail:live-direct', 20, forceRefresh));
        if (direct && typeof direct === 'object') return { id: explicitLiveId, detail: direct as AnyRecord };
      } catch (_error) { /* Re-resolve below from source identity. */ }
    }

    if (!sourceDeviceId || sourceDeviceId === '—') return null;

    // Do not probe /api/devices/{sourceDeviceId}: the detail route is canonical-id based
    // for vendors where source ids are not route ids. Continue with the collection search.

    const requestOptions = detailReadOptions('device-detail:live-match', 50, forceRefresh);
    const listPayload = await window.ZentridPlatformAPI?.liveDevices?.list({ page: 1, pageSize: 50, search: sourceDeviceId }, requestOptions);
    const candidates = asArray(listPayload);
    const match = candidates.find(candidate => liveDeviceMatchesAdmin(candidate, device));
    if (!match) return null;
    const liveId = String(firstOf(match, ['deviceId', 'id', 'sourceDeviceId'], '') || '').trim();
    if (!liveId) return null;
    try {
      const detail = await window.ZentridPlatformAPI?.liveDevices?.get(liveId, detailReadOptions('device-detail:live-core', 20, forceRefresh));
      return { id: liveId, detail: (detail && typeof detail === 'object' ? detail as AnyRecord : match) };
    } catch {
      return { id: liveId, detail: match };
    }
  }


  async function applyDeviceDetail(forceRefresh = false): Promise<void> {
    if (!/device-detail\.html$/.test(location.pathname)) return;
    const selectedId = new URLSearchParams(location.search).get('id') || localStorage.getItem('zentrid_selected_device');
    const selectedSnapshot = readDetailSelection('device', selectedId);
    setLiveDataState('loading', selectedSnapshot
      ? 'Loading the selected Device Registry record. A preserved browser snapshot is used only if the direct detail endpoint is unavailable.'
      : 'Loading the device record. Parent plant, alerts and telemetry sections will load only when opened.', { source: '/api/admin/devices' });
    try {
      let requestedRegistryId = String(selectedId || '').trim();
      if (!requestedRegistryId) {
        const registryList = await ZentridAPIRepositories.devices.list(detailReadOptions('device-detail:registry-selection', 20, forceRefresh));
        const firstRegistryDevice = registryList.items[0];
        requestedRegistryId = String(firstOf(firstRegistryDevice || {}, ['adminId', 'registryDeviceId', 'id'], '') || '').trim();
        if (!requestedRegistryId) {
          const message = 'The Device Registry returned no records. No prototype device detail is displayed.';
          window.ZentridApiOnly?.mountEmpty('Device Detail', message, '/api/admin/devices');
          setLiveDataState('empty', message, { source: '/api/admin/devices', recordCount: registryList.pagination.totalCount });
          return;
        }
      }
      const deviceResult = await ZentridAPIRepositories.devices.get(requestedRegistryId, {
        ...detailReadOptions('device-detail:registry-direct', 20, forceRefresh),
        allowListFallback: false
      });
      const registryRecord = deviceResult.item || deviceResult.items.find(record => detailSelectionMatches(record, requestedRegistryId));
      const selectedRecord: AnyRecord | undefined = registryRecord
        ? {
            ...registryRecord,
            adminId: String(firstOf(registryRecord, ['adminId', 'registryDeviceId', 'id'], requestedRegistryId) || requestedRegistryId).trim(),
            registryDeviceId: String(firstOf(registryRecord, ['registryDeviceId', 'adminId', 'id'], requestedRegistryId) || requestedRegistryId).trim(),
            detailSourceMode: 'registry',
            registryLoaded: true,
            operationalLoaded: false
          }
        : undefined;
      if (!selectedRecord) {
        throw new Error(`GET /api/admin/devices/${requestedRegistryId} returned no Device Registry record.`);
      }

      const deviceRows = [selectedRecord];
      let plantRows: AnyRecord[] = [];
      let alertRows: AnyRecord[] = [];
      let telemetryRows: AnyRecord[] = [];
      const relationErrors: unknown[] = [...deviceResult.errors];
      const sync = (): AnyRecord | undefined => {
        const mappedDevices = enrichDeviceRelations(deviceRows, plantRows, alertRows);
        window.ZentridLivePlants = plantRows;
        window.ZentridLiveDevices = mappedDevices;
        window.ZentridLiveAlerts = alertRows;
        const device = mappedDevices.find(record => detailSelectionMatches(record, requestedRegistryId)) || mappedDevices[0];
        if (device) {
          localStorage.setItem('zentrid_selected_device', device.id);
          saveDetailSelection('device', device);
        }
        return device;
      };
      let device = sync();
      const selectedAdminDeviceId = String(device?.adminId || device?.registryDeviceId || requestedRegistryId || '').trim();
      let selectedLiveDeviceId = '';
      const applyDeviceResource = (field: string, payload: unknown): AnyRecord | undefined => {
        const target = deviceRows.find(record => detailSelectionMatches(record, requestedRegistryId)) || deviceRows[0];
        if (target) target[field] = payload;
        return sync();
      };

      try {
        const liveMatch = device ? await loadLiveDeviceDetail(device, forceRefresh) : null;
        if (liveMatch) {
          selectedLiveDeviceId = liveMatch.id;
          applyDeviceResource('liveLookupStatus', 'matched');
          applyDeviceResource('liveId', liveMatch.id);
          applyDeviceResource('canonicalDeviceId', liveMatch.id);
          applyDeviceResource('operationalLoaded', true);
          applyDeviceResource('detailSourceMode', 'registry-live');
          device = applyDeviceResource('liveDetail', liveMatch.detail);
        } else {
          applyDeviceResource('operationalLoaded', false);
          applyDeviceResource('detailSourceMode', 'registry');
          device = applyDeviceResource('liveLookupStatus', 'not-linked');
        }
      } catch (error) {
        relationErrors.push(error);
      }

      window.ZentridDetailLazyTabs?.register('device', [
        {
          key: 'parent-plant',
          tabs: ['architecture', 'related'],
          label: 'Parent plant and topology',
          loader: async () => {
            const parentPlantId = String(firstOf(device || {}, ['plantId', 'raw.plantRelation.plantId'], '') || '').trim();
            if (!parentPlantId) {
              plantRows = [];
              sync();
              setLiveDataState('partial', 'The Device Registry record does not include a parent Plant Registry ID, so no plant was substituted.', {
                source: deviceResult.source,
                details: 'Parent Plant Registry relation was not returned by backend',
                recordCount: deviceResult.pagination.totalCount,
                dataOrigin: selectedLiveDeviceId ? 'mixed' : 'live'
              });
              return;
            }
            const result = await ZentridAPIRepositories.plants.get(parentPlantId, {
              ...detailReadOptions('device-detail:parent-plant', 20, forceRefresh),
              cacheVariant: 'admin-registry',
              allowListFallback: false
            });
            plantRows = result.items;
            relationErrors.push(...result.errors);
            if (!plantRows.length && result.errors.length) throw result.errors[0];
            sync();
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'The device record is visible and its parent plant relation was loaded on demand.', {
              source: `${deviceResult.source} + ${result.source}`,
              details: result.errors.length ? `${result.errors.length} relation error(s)` : 'Parent relation loaded on demand',
              recordCount: deviceResult.pagination.totalCount,
              dataOrigin: selectedLiveDeviceId ? 'mixed' : 'live'
            });
          }
        },
        {
          key: 'alerts',
          tabs: ['alerts'],
          label: 'Device alerts',
          loader: async () => {
            if (!selectedLiveDeviceId) throw new Error('A Canonical/Platform Live Device ID is required for device-scoped alerts. Registry UUIDs are not sent to /api/admin/alerts.');
            const result = await ZentridAPIRepositories.alerts.list({ ...detailReadOptions('device-detail:alerts', 100, forceRefresh), deviceId: selectedLiveDeviceId, timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS });
            alertRows = result.items;
            relationErrors.push(...result.errors);
            if (!alertRows.length && result.errors.length) throw result.errors[0];
            applyDeviceResource('relatedAlerts', alertRows);
            applyDeviceResource('alertsLoaded', true);
            sync();
            setLiveDataState(result.errors.length ? 'partial' : 'live', 'Device alerts were loaded only after the Alerts tab was opened.', {
              source: `${deviceResult.source} + ${result.source}`,
              details: result.errors.length ? `${result.errors.length} alert error(s)` : 'Alerts loaded on demand',
              recordCount: deviceResult.pagination.totalCount,
              dataOrigin: selectedLiveDeviceId ? 'mixed' : 'live'
            });
          }
        },
        {
          key: 'telemetry',
          tabs: ['telemetry', 'monitoring', 'operating'],
          label: 'Latest device telemetry',
          loader: async () => {
            if (!selectedAdminDeviceId) throw new Error('A Device Registry id is required for latest telemetry.');
            const [adminTelemetry, liveTelemetry] = await Promise.all([
              window.ZentridPlatformAPI?.deviceRegistry?.telemetryLatest(selectedAdminDeviceId, detailReadOptions('device-detail:telemetry-latest', 20, forceRefresh)),
              selectedLiveDeviceId ? window.ZentridPlatformAPI?.liveDevices?.telemetryLatest(selectedLiveDeviceId, detailReadOptions('device-detail:live-telemetry-latest', 20, forceRefresh)).catch((error: unknown) => { relationErrors.push(error); return null; }) : Promise.resolve(null)
            ]);
            applyDeviceResource('telemetryLatest', adminTelemetry);
            applyDeviceResource('liveTelemetryLatest', liveTelemetry);
            setLiveDataState(relationErrors.length ? 'partial' : 'live', 'Administrative and Platform Live telemetry were mapped into Device Detail.', { source: selectedLiveDeviceId ? `/api/admin/devices/${encodeURIComponent(selectedAdminDeviceId)}/telemetry/latest + /api/devices/${encodeURIComponent(selectedLiveDeviceId)}/telemetry/latest` : `/api/admin/devices/${encodeURIComponent(selectedAdminDeviceId)}/telemetry/latest`, recordCount: deviceResult.pagination.totalCount, dataOrigin: selectedLiveDeviceId ? 'mixed' : 'live' });
          }
        },
        {
          key: 'connectivity',
          tabs: ['connectivity', 'connectivity-full', 'configuration'],
          label: 'Connectivity and network',
          loader: async () => {
            if (!selectedAdminDeviceId) throw new Error('A Device Registry id is required for connectivity.');
            const [connectivity, network, linked, liveConnectivity, liveNetwork] = await Promise.all([
              window.ZentridPlatformAPI?.deviceRegistry?.connectivity(selectedAdminDeviceId, detailReadOptions('device-detail:connectivity', 20, forceRefresh)),
              window.ZentridPlatformAPI?.deviceRegistry?.network(selectedAdminDeviceId, detailReadOptions('device-detail:network', 20, forceRefresh)),
              window.ZentridPlatformAPI?.deviceRegistry?.linkedDevices(selectedAdminDeviceId, detailReadOptions('device-detail:linked-devices', 100, forceRefresh)),
              selectedLiveDeviceId ? window.ZentridPlatformAPI?.liveDevices?.connectivity(selectedLiveDeviceId, detailReadOptions('device-detail:live-connectivity', 20, forceRefresh)).catch((error: unknown) => { relationErrors.push(error); return null; }) : Promise.resolve(null),
              selectedLiveDeviceId ? window.ZentridPlatformAPI?.liveDevices?.network(selectedLiveDeviceId, detailReadOptions('device-detail:live-network', 20, forceRefresh)).catch((error: unknown) => { relationErrors.push(error); return null; }) : Promise.resolve(null)
            ]);
            applyDeviceResource('connectivityDetail', connectivity);
            applyDeviceResource('networkDetail', network);
            applyDeviceResource('linkedDevices', linked);
            applyDeviceResource('liveConnectivityDetail', liveConnectivity);
            applyDeviceResource('liveNetworkDetail', liveNetwork);
            setLiveDataState(relationErrors.length ? 'partial' : 'live', 'Device Registry and Platform Live connectivity were mapped into the same Device Detail workspace.', { source: selectedLiveDeviceId ? `/api/admin/devices/${encodeURIComponent(selectedAdminDeviceId)} + /api/devices/${encodeURIComponent(selectedLiveDeviceId)}` : `/api/admin/devices/${encodeURIComponent(selectedAdminDeviceId)}`, recordCount: deviceResult.pagination.totalCount, dataOrigin: selectedLiveDeviceId ? 'mixed' : 'live' });
          }
        },
        {
          key: 'warranty',
          tabs: ['passport', 'lifecycle', 'information'],
          label: 'Warranty',
          loader: async () => {
            if (!selectedAdminDeviceId) throw new Error('A Device Registry id is required for warranty.');
            const [adminWarranty, liveWarranty] = await Promise.all([
              window.ZentridPlatformAPI?.deviceRegistry?.warranty(selectedAdminDeviceId, detailReadOptions('device-detail:warranty', 20, forceRefresh)),
              selectedLiveDeviceId ? window.ZentridPlatformAPI?.liveDevices?.warranty(selectedLiveDeviceId, detailReadOptions('device-detail:live-warranty', 20, forceRefresh)).catch((error: unknown) => { relationErrors.push(error); return null; }) : Promise.resolve(null)
            ]);
            applyDeviceResource('warrantyDetail', adminWarranty);
            applyDeviceResource('liveWarrantyDetail', liveWarranty);
          }
        },
        {
          key: 'audit',
          tabs: ['audit', 'activity'],
          label: 'Device audit',
          loader: async () => {
            if (!selectedAdminDeviceId) throw new Error('A Device Registry id is required for audit.');
            const payload = await window.ZentridPlatformAPI?.deviceRegistry?.audit(selectedAdminDeviceId, detailReadOptions('device-detail:audit', 100, forceRefresh));
            applyDeviceResource('auditDetail', payload);
          }
        }
      ]);

      if (!mountExistingRenderer('renderDeviceDetail', 'wireDeviceDetail') && device) {
        console.warn('Zentrid live API: existing Device Detail renderer was not found; keeping current page markup.');
      }
      setLiveDataState(deviceResult.errors.length ? 'partial' : 'live', selectedLiveDeviceId
        ? 'The direct Device Registry record and matching Platform Live device are mapped. Lazy relation and operational subresources load when their tabs are opened.'
        : 'The direct Device Registry record is ready. No matching Platform Live device was found by explicit canonical id or provider/source identity; administrative sections remain available.', {
        source: deviceResult.source,
        details: `Direct Registry detail · Live device: ${selectedLiveDeviceId || 'not matched'} · Lazy sections: parent plant · alerts · telemetry · connectivity · warranty`,
        recordCount: deviceResult.pagination.totalCount,
        dataOrigin: selectedLiveDeviceId ? 'mixed' : 'live'
      });
    } catch (error) {
      if (selectedSnapshot) {
        const snapshotRecord = {
          ...selectedSnapshot,
          detailSourceMode: 'snapshot',
          registryLoaded: false,
          operationalLoaded: false
        };
        window.ZentridLivePlants = [];
        window.ZentridLiveDevices = [snapshotRecord];
        window.ZentridLiveAlerts = [];
        saveDetailSelection('device', snapshotRecord);
        mountExistingRenderer('renderDeviceDetail', 'wireDeviceDetail');
        setLiveDataState('partial', 'The selected device was restored from this browser session because the direct Device Registry detail request failed. Snapshot values are not merged into a successful Registry response.', {
          source: 'Selected session record',
          details: liveErrorMessage(error),
          recordCount: 1,
          freshnessStatus: 'stale'
        });
        return;
      }
      setRequestFailure('/api/admin/devices', error, 'No prototype device detail is displayed.');
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

  async function resolveSelectedLivePlant(selectedId: string | null, forceRefresh: boolean): Promise<ZentridRepositoryListResult> {
    const requestedId = String(selectedId || '').trim();
    const pageSize = 100;
    let page = 1;
    let lastResult: ZentridRepositoryListResult | null = null;
    do {
      const result = await ZentridAPIRepositories.plants.list({
        ...detailReadOptions(`plant-detail:live-core:${page}`, pageSize, forceRefresh),
        cacheVariant: 'live',
        page,
        pageSize
      });
      lastResult = result;
      const match = requestedId ? result.items.find(item => detailSelectionMatches(item, requestedId)) : result.items[0];
      if (match) return { ...result, items: [match], rawItems: [match] };
      page += 1;
    } while (lastResult && lastResult.pagination.hasNextPage && page <= lastResult.pagination.totalPages);

    if (lastResult) return { ...lastResult, items: [], rawItems: [] };
    return {
      entity: 'plants',
      items: [],
      rawItems: [],
      source: '/api/plants',
      errors: [],
      pagination: { page: 1, pageSize, totalCount: 0, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
    };
  }


  function plantOperationalValue(value: unknown): boolean {
    return value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== '—';
  }

  function enrichAdministrativePlantWithOperational(adminPlant: AnyRecord, operationalPlant: AnyRecord): AnyRecord {
    const preferOperational = (operationalValue: unknown, adminValue: unknown): unknown => plantOperationalValue(operationalValue) ? operationalValue : adminValue;
    const adminRaw = adminPlant.raw && typeof adminPlant.raw === 'object' ? adminPlant.raw as AnyRecord : {};
    const liveRaw = operationalPlant.raw && typeof operationalPlant.raw === 'object' ? operationalPlant.raw as AnyRecord : {};
    const administrativeId = safeText(adminPlant.adminId || adminPlant.registryPlantId || adminPlant.id, '').trim();
    return {
      ...adminPlant,
      adminId: administrativeId,
      registryPlantId: administrativeId,
      operationalId: safeText(operationalPlant.id || adminPlant.operationalId || adminPlant.canonicalPlantId, '').trim(),
      canonicalPlantId: safeText(operationalPlant.id || adminPlant.canonicalPlantId || adminPlant.operationalId, '').trim(),
      operationalExternalId: safeText(operationalPlant.externalId || adminPlant.operationalExternalId || adminPlant.sourcePlantId, '').trim(),
      sourcePlantId: safeText(adminPlant.sourcePlantId || operationalPlant.externalId || adminPlant.externalId, '').trim(),
      livePower: preferOperational(operationalPlant.livePower, adminPlant.livePower),
      today: preferOperational(operationalPlant.today, adminPlant.today),
      totalEnergy: operationalPlant.totalEnergy ?? adminPlant.totalEnergy ?? null,
      health: preferOperational(operationalPlant.health, adminPlant.health),
      vendor: preferOperational(operationalPlant.vendor, adminPlant.vendor),
      sourceSystem: preferOperational(operationalPlant.sourceSystem, adminPlant.sourceSystem),
      lastDataAt: preferOperational(operationalPlant.lastDataAt, adminPlant.lastDataAt),
      lastSyncAt: preferOperational(operationalPlant.lastSyncAt, adminPlant.lastSyncAt),
      dataQualityStatus: preferOperational(operationalPlant.dataQualityStatus, adminPlant.dataQualityStatus),
      freshness: preferOperational(operationalPlant.freshness, adminPlant.freshness),
      detailSourceMode: 'registry-live',
      registryLoaded: true,
      operationalLoaded: true,
      raw: {
        ...adminRaw,
        adminRecord: adminRaw,
        liveRecord: liveRaw
      }
    };
  }

  function administrativePlantId(record: AnyRecord | null | undefined): string {
    if (!record) return '';
    return safeText(firstOf(record, ['adminId', 'registryPlantId', 'raw.adminRecord.id', 'raw.adminRecord.plantId', 'raw.id', 'raw.plantId', 'id'], ''), '').trim();
  }

  function providerPlantAssignmentRows(payload: unknown): AnyRecord[] {
    if (Array.isArray(payload)) return payload.filter(item => item && typeof item === 'object') as AnyRecord[];
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as AnyRecord;
    for (const key of ['items', 'data', 'results']) {
      const value = record[key];
      if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object') as AnyRecord[];
    }
    return [];
  }

  function providerPlantAssignmentMatches(assignment: AnyRecord, selectedId: string | null, operationalPlant: AnyRecord | null, adminId = ''): boolean {
    const registryId = safeText(assignment.plantRegistryId, '').trim();
    const sourcePlantId = safeText(assignment.sourcePlantId, '').trim();
    const provider = safeText(assignment.provider, '').trim();
    const requested = safeText(selectedId, '').trim();
    const expectedAdminId = safeText(adminId, '').trim();
    if (expectedAdminId && registryId && sameId(registryId, expectedAdminId)) return true;
    if (requested && registryId && sameId(registryId, requested)) return true;

    const operationalSourceId = safeText(firstOf(operationalPlant || {}, ['sourcePlantId', 'externalId', 'operationalExternalId', 'code', 'raw.sourcePlantId'], ''), '').trim();
    const operationalProvider = safeText(firstOf(operationalPlant || {}, ['sourceSystem', 'vendor', 'provider', 'raw.provider'], ''), '').trim();
    const sourceMatches = Boolean(sourcePlantId) && (
      (requested && sameId(sourcePlantId, requested)) ||
      (operationalSourceId && sameId(sourcePlantId, operationalSourceId))
    );
    if (!sourceMatches) return false;
    if (provider && operationalProvider && !sameLabel(provider, operationalProvider)) return false;
    return true;
  }

  async function resolveProviderPlantAssignment(selectedId: string | null, operationalPlant: AnyRecord | null, adminId = ''): Promise<{ assignment: AnyRecord | null; ambiguous: boolean }> {
    if (!window.ZentridPlatformAPI?.providerPlantAssignments?.list) return { assignment: null, ambiguous: false };
    try {
      const payload = await window.ZentridPlatformAPI.providerPlantAssignments.list({ timeoutMs: 15000 });
      const matches = providerPlantAssignmentRows(payload).filter(row => providerPlantAssignmentMatches(row, selectedId, operationalPlant, adminId));
      if (matches.length !== 1) return { assignment: null, ambiguous: matches.length > 1 };
      return { assignment: matches[0] || null, ambiguous: false };
    } catch {
      // Assignment mapping is an identity accelerator. Plant Registry resolution below remains the fallback.
      return { assignment: null, ambiguous: false };
    }
  }

  function plantRegistryMatchesSelection(adminPlant: AnyRecord, selectedId: string | null, operationalPlant?: AnyRecord | null): boolean {
    const requested = safeText(selectedId, '').trim();
    if (requested && detailSelectionMatches(adminPlant, requested)) return true;
    if (!operationalPlant) return false;

    const operationalId = safeText(firstOf(operationalPlant, ['id', 'operationalId', 'canonicalPlantId', 'raw.id'], ''), '').trim();
    const registryOperationalId = safeText(firstOf(adminPlant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId'], ''), '').trim();
    if (operationalId && registryOperationalId && sameId(operationalId, registryOperationalId)) return true;

    const operationalExternalId = safeText(firstOf(operationalPlant, ['sourcePlantId', 'externalId', 'operationalExternalId', 'code', 'raw.sourcePlantId'], ''), '').trim();
    const registryExternalId = safeText(firstOf(adminPlant, ['sourcePlantId', 'externalId', 'operationalExternalId', 'code', 'raw.sourcePlantId', 'raw.plantCode'], ''), '').trim();
    if (operationalExternalId && registryExternalId && sameId(operationalExternalId, registryExternalId)) return true;

    const sameProvider = sameLabel(operationalPlant.sourceSystem || operationalPlant.vendor, adminPlant.sourceSystem || adminPlant.vendor);
    return sameProvider && sameLabel(operationalPlant.name, adminPlant.name);
  }

  async function resolveSelectedAdministrativePlantId(selectedId: string | null, operationalPlant: AnyRecord | null, forceRefresh: boolean): Promise<{ adminId: string; errors: unknown[] }> {
    const paired = selectedPlantAdministrativeId(selectedId);
    if (paired) return { adminId: paired, errors: [] };

    const providerAssignment = await resolveProviderPlantAssignment(selectedId, operationalPlant);
    const assignedRegistryId = safeText(providerAssignment.assignment?.plantRegistryId, '').trim();
    if (assignedRegistryId) return { adminId: assignedRegistryId, errors: [] };

    const terms = Array.from(new Set([
      safeText(selectedId, '').trim(),
      safeText(firstOf(operationalPlant || {}, ['id', 'operationalId', 'canonicalPlantId'], ''), '').trim(),
      safeText(firstOf(operationalPlant || {}, ['sourcePlantId', 'externalId', 'operationalExternalId', 'code'], ''), '').trim(),
      safeText(operationalPlant?.name, '').trim()
    ].filter(Boolean)));
    const errors: unknown[] = [];

    for (const term of terms) {
      try {
        const result = await ZentridAPIRepositories.plants.list({
          ...detailReadOptions(`plant-detail:registry-resolve:${term}`, 50, forceRefresh),
          cacheVariant: 'admin-registry',
          search: term,
          page: 1,
          pageSize: 50
        });
        errors.push(...result.errors);
        const match = result.items.find(item => plantRegistryMatchesSelection(item as AnyRecord, selectedId, operationalPlant));
        if (match) return { adminId: administrativePlantId(match as AnyRecord), errors };
      } catch (error) {
        errors.push(error);
      }
    }
    return { adminId: '', errors };
  }

  function registryBackedPlant(record: AnyRecord, adminId: string): AnyRecord {
    const raw = record.raw && typeof record.raw === 'object' ? record.raw as AnyRecord : {};
    return {
      ...record,
      adminId: safeText(adminId || record.adminId || record.registryPlantId || record.id, '').trim(),
      registryPlantId: safeText(adminId || record.registryPlantId || record.id, '').trim(),
      detailSourceMode: 'registry',
      registryLoaded: true,
      operationalLoaded: false,
      raw: { ...raw, adminRecord: raw }
    };
  }

  function liveOnlyPlant(record: AnyRecord): AnyRecord {
    const raw = record.raw && typeof record.raw === 'object' ? record.raw as AnyRecord : {};
    return {
      ...record,
      detailSourceMode: 'live-only',
      registryLoaded: false,
      operationalLoaded: true,
      raw: { ...raw, liveRecord: raw }
    };
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
    let selectedAdminId = selectedPlantAdministrativeId(selectedId);
    let detailSource = selectedAdminId ? `/api/admin/plants/${encodeURIComponent(selectedAdminId)}` : '/api/admin/plants';
    setLiveDataState('loading', selectedAdminId ? 'Loading the selected Plant Registry record.' : 'Resolving the selected plant against Plant Registry.', { source: detailSource });
    try {
      let operationalSelection: ZentridRepositoryListResult | null = null;
      const resolutionErrors: unknown[] = [];

      if (!selectedAdminId && selectedId) {
        const registryResolution = await resolveSelectedAdministrativePlantId(selectedId, null, forceRefresh);
        selectedAdminId = registryResolution.adminId;
        resolutionErrors.push(...registryResolution.errors);
      }

      let live: ZentridRepositoryListResult;
      if (selectedAdminId) {
        detailSource = `/api/admin/plants/${encodeURIComponent(selectedAdminId)}`;
        const adminDetail = await ZentridAPIRepositories.plants.get(selectedAdminId, {
          ...detailReadOptions('plant-detail:registry-core', 20, forceRefresh),
          cacheVariant: 'admin-registry'
        });
        live = {
          ...adminDetail,
          items: adminDetail.items.map(item => registryBackedPlant(item as AnyRecord, selectedAdminId)),
          rawItems: adminDetail.rawItems.map(item => registryBackedPlant(item as AnyRecord, selectedAdminId)),
          errors: [...resolutionErrors, ...adminDetail.errors]
        };
      } else {
        operationalSelection = await resolveSelectedLivePlant(selectedId, forceRefresh);
        const operationalPlant = operationalSelection.items[0] as AnyRecord | undefined;

        if (operationalPlant) {
          const registryResolution = await resolveSelectedAdministrativePlantId(selectedId, operationalPlant, forceRefresh);
          selectedAdminId = registryResolution.adminId;
          resolutionErrors.push(...registryResolution.errors);
        }

        if (selectedAdminId) {
          detailSource = `/api/admin/plants/${encodeURIComponent(selectedAdminId)}`;
          const adminDetail = await ZentridAPIRepositories.plants.get(selectedAdminId, {
            ...detailReadOptions('plant-detail:registry-core', 20, forceRefresh),
            cacheVariant: 'admin-registry'
          });
          live = {
            ...adminDetail,
            items: adminDetail.items.map(item => registryBackedPlant(item as AnyRecord, selectedAdminId)),
            rawItems: adminDetail.rawItems.map(item => registryBackedPlant(item as AnyRecord, selectedAdminId)),
            errors: [...resolutionErrors, ...adminDetail.errors]
          };
        } else {
          live = {
            ...operationalSelection,
            items: operationalSelection.items.map(item => liveOnlyPlant(item as AnyRecord)),
            rawItems: operationalSelection.rawItems.map(item => liveOnlyPlant(item as AnyRecord)),
            errors: [...resolutionErrors, ...operationalSelection.errors]
          };
          detailSource = '/api/plants';
        }
      }

      if (selectedAdminId && live.items.length) {
        try {
          let adminPlant = live.items[0] as AnyRecord;
          const assignmentResolution = await resolveProviderPlantAssignment(selectedId, adminPlant, selectedAdminId);
          const assignment = assignmentResolution.assignment;
          if (assignment) {
            const assignmentRaw = adminPlant.raw && typeof adminPlant.raw === 'object' ? adminPlant.raw as AnyRecord : {};
            adminPlant = {
              ...adminPlant,
              sourcePlantId: safeText(adminPlant.sourcePlantId || assignment.sourcePlantId, '').trim(),
              vendor: safeText(adminPlant.vendor || assignment.provider, '').trim(),
              providerAccount: safeText(adminPlant.providerAccount || assignment.providerAccount, '').trim(),
              providerPlantAssignment: assignment,
              providerPlantAssignmentStatus: 'matched',
              raw: { ...assignmentRaw, providerPlantAssignment: assignment }
            };
            live = { ...live, items: [adminPlant], rawItems: [adminPlant] };
          } else if (assignmentResolution.ambiguous) {
            adminPlant = { ...adminPlant, providerPlantAssignmentStatus: 'ambiguous' };
            live = { ...live, items: [adminPlant], rawItems: [adminPlant] };
          }

          const canonicalPlantId = safeText(firstOf(adminPlant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId', 'raw.adminRecord.operationalData.canonicalPlantId'], ''), '').trim();
          const assignedSourcePlantId = safeText(assignment?.sourcePlantId, '').trim();
          const liveLookupId = canonicalPlantId || assignedSourcePlantId;
          const operational = operationalSelection && operationalSelection.items.length
            ? operationalSelection
            : liveLookupId
              ? await resolveSelectedLivePlant(liveLookupId, forceRefresh)
              : null;
          const operationalPlant = operational?.items[0] as AnyRecord | undefined;
          const operationalMatches = operationalPlant
            ? (!canonicalPlantId || detailSelectionMatches(operationalPlant, canonicalPlantId) || plantRegistryMatchesSelection(adminPlant, selectedId, operationalPlant))
            : false;
          if (operationalPlant && operationalMatches) {
            const enrichedPlant = {
              ...enrichAdministrativePlantWithOperational(adminPlant, operationalPlant),
              ...(assignment ? { providerPlantAssignment: assignment, providerPlantAssignmentStatus: 'matched' } : {}),
              ...(assignmentResolution.ambiguous ? { providerPlantAssignmentStatus: 'ambiguous' } : {})
            };
            live = {
              ...live,
              items: [enrichedPlant],
              rawItems: [enrichedPlant],
              source: `${detailSource} + /api/plants${assignment ? ' + /api/admin/provider-plant-assignments' : ''}`,
              errors: [...live.errors, ...(operational?.errors || [])]
            };
          } else if (operational?.errors.length) {
            live = { ...live, errors: [...live.errors, ...operational.errors] };
          }
        } catch (error) {
          live = { ...live, errors: [...live.errors, error] };
        }
      }

      const data = live.items;
      if (!data.length) {
        if (live.errors.length) setRequestFailure(live.source, live.errors[0], 'No prototype plant detail is displayed.');
        else setLiveDataState('empty', selectedId ? 'The selected plant endpoint returned no matching record.' : 'Plant endpoints returned no records. No prototype plant detail is displayed.', { source: live.source || detailSource, recordCount: 0 });
        return;
      }

      // Resolve Plant assignment relations to human-readable labels before the legacy detail renderer runs.
      // Keep the canonical IDs on the record so PUT still writes stable backend references.
      const assignmentRecord = data[0] as AnyRecord | undefined;
      if (assignmentRecord) {
        const rawAssignment = assignmentRecord.raw?.clientAssignment || assignmentRecord.clientAssignment || {};
        const assignmentClientId = String(assignmentRecord.clientId || rawAssignment.clientId || '').trim();
        const assignmentTenantCandidate = String(assignmentRecord.tenantId || rawAssignment.managingTenant || assignmentRecord.tenant || '').trim();
        const assignmentTenantId = isUuidValue(assignmentTenantCandidate) ? assignmentTenantCandidate : '';
        const assignmentTenantLabel = assignmentTenantId ? '' : assignmentTenantCandidate;
        const [clientResult, tenantResult] = await Promise.all([
          assignmentClientId && isUuidValue(assignmentClientId)
            ? ZentridAPIRepositories.clients.get(assignmentClientId, detailReadOptions('plant-detail:client-assignment', 20, forceRefresh)).catch(() => null)
            : Promise.resolve(null),
          assignmentTenantId
            ? ZentridAPIRepositories.tenants.get(assignmentTenantId, detailReadOptions('plant-detail:tenant-assignment', 20, forceRefresh)).catch(() => null)
            : Promise.resolve(null)
        ]);
        const resolvedClient = clientResult && 'item' in clientResult ? clientResult.item as AnyRecord | null : null;
        const resolvedTenant = tenantResult && 'item' in tenantResult ? tenantResult.item as AnyRecord | null : null;
        if (resolvedClient?.id) {
          const model = window.ZentridClientModel;
          if (model && Array.isArray(model.clients)) upsertLiveRecord(model.clients as AnyRecord[], resolvedClient);
          assignmentRecord.owner = safeText(resolvedClient.name || resolvedClient.clientName || resolvedClient.displayName || resolvedClient.code || assignmentRecord.owner, assignmentRecord.owner || '—');
          assignmentRecord.clientId = String(resolvedClient.id || assignmentClientId);
        }
        if (assignmentTenantId) assignmentRecord.tenantId = assignmentTenantId;
        if (resolvedTenant) {
          const tenantLabel = safeText(resolvedTenant.name || resolvedTenant.tenantName || resolvedTenant.displayName || resolvedTenant.code || resolvedTenant.id, assignmentTenantId || '—');
          assignmentRecord.operator = tenantLabel;
          assignmentRecord.tenant = tenantLabel;
          setLiveTenants([resolvedTenant]);
        } else if (assignmentTenantLabel) {
          assignmentRecord.operator = assignmentTenantLabel;
          assignmentRecord.tenant = assignmentTenantLabel;
        }
      }

      let deviceRows: AnyRecord[] = [];
      let alertRows: AnyRecord[] = [];
      let telemetryRows: AnyRecord[] = [];
      let devicesLoaded = false;
      let alertsLoaded = false;
      let telemetryLoaded = false;
      const relationErrors: unknown[] = [...live.errors];
      const sync = (): AnyRecord | undefined => {
        const relationAwareData: AnyRecord[] = data.map(item => ({ ...(item as AnyRecord), devicesLoaded, alertsLoaded, telemetryLoaded }));
        const mapped: AnyRecord[] = enrichPlantRelations(relationAwareData, deviceRows, alertRows).map(item => ({
          ...item,
          adminId: safeText(item.adminId || (selectedAdminId && detailSelectionMatches(item, selectedAdminId) ? selectedAdminId : ''), '').trim(),
          devicesLoaded,
          alertsLoaded,
          telemetryLoaded
        }));
        window.ZentridLivePlants = mapped;
        window.ZentridLiveDevices = deviceRows;
        window.ZentridLiveAlerts = alertRows;
        syncLiveClientModel(mapped, deviceRows);
        const plant = mapped.find(p => p.id === selectedId || p.externalId === selectedId || p.code === selectedId || p.adminId === selectedAdminId) || (!selectedId && !selectedAdminId ? mapped[0] : undefined);
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
      sync();

      window.ZentridDetailLazyTabs?.register('plant', [
        {
          key: 'devices',
          tabs: ['structure', 'device', 'inverters', 'arrays', 'batteries', 'metering', 'gateways'],
          label: 'Plant devices and topology',
          loader: async () => {
            const selectedPlant = sync();
            if (!selectedPlant) throw new Error('The selected plant is not available for device matching.');
            const relation = await loadPlantDeviceRelations(selectedPlant, forceRefresh);
            deviceRows = relation.rows;
            devicesLoaded = true;
            relationErrors.push(...relation.errors);
            if (!deviceRows.length && relation.errors.length) throw relation.errors[0];
            sync();
            setLiveDataState(relation.errors.length ? 'partial' : 'live', 'Plant device relations were loaded for the selected plant only.', {
              source: `${live.source} + ${relation.sources.join(' + ') || '/api/devices'}`,
              details: relation.errors.length ? `${relation.errors.length} device relation error(s)` : `${deviceRows.length} matching device record(s)`,
              recordCount: deviceRows.length
            });
          }
        },
        {
          key: 'alerts',
          tabs: ['alerts'],
          label: 'Plant alerts',
          loader: async () => {
            const selectedPlant = sync();
            if (!selectedPlant) throw new Error('The selected plant is not available for alert matching.');
            const relation = await loadPlantAlertRelations(selectedPlant, forceRefresh);
            alertRows = relation.rows;
            alertsLoaded = true;
            relationErrors.push(...relation.errors);
            if (!alertRows.length && relation.errors.length) throw relation.errors[0];
            sync();
            setLiveDataState(relation.errors.length ? 'partial' : 'live', 'Plant alerts were loaded for the selected plant only.', {
              source: `${live.source} + ${relation.source}`,
              details: relation.errors.length ? `${relation.errors.length} alert relation error(s)` : `${alertRows.length} matching alert record(s)`,
              recordCount: alertRows.length
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
              timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS,
              plantId: safeText(firstOf(selectedPlant, ['operationalId', 'canonicalPlantId', 'raw.operationalData.canonicalPlantId', 'id'], ''), '').trim()
            });
            telemetryRows = result.items.filter(row => plantMatchesTelemetry(selectedPlant, row));
            telemetryLoaded = true;
            relationErrors.push(...result.errors);
            if (!result.items.length && result.errors.length) throw result.errors[0];
            publishDetailTelemetry('plant', selectedPlant, telemetryRows);
            sync();
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
      const renderedPlant = sync();
      const sourceMode = safeText(renderedPlant?.detailSourceMode, selectedAdminId ? 'registry' : 'live-only');
      setLiveDataState(live.errors.length ? 'partial' : 'live', 'The plant overview is ready. Devices, alerts and telemetry remain idle until their tabs are opened.', {
        source: live.source,
        details: [
          sourceMode === 'registry-live'
            ? 'Plant Registry detail is authoritative; Platform Live enriches operational fields.'
            : sourceMode === 'registry'
              ? 'Plant Registry detail is authoritative; no matching Platform Live record was available.'
              : 'Live operational record only; no linked Plant Registry record was resolved.',
          live.errors.length ? 'One or more enrichment or relation-resolution requests returned an error; available Registry data remains visible.' : '',
          'Lazy sections: devices · alerts · telemetry'
        ].filter(Boolean).join(' · '),
        recordCount: data.length
      });
    } catch (error) {
      setRequestFailure(detailSource, error, 'No prototype plant detail is displayed.');
    }
  }

  function meaningfulAlertValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    const text = String(value).trim();
    return Boolean(text) && text !== '—' && text !== 'Unknown' && text !== 'Unassigned';
  }

  function mergeAlertRelated(adminValue: unknown, liveValue: unknown): AnyRecord {
    const adminRelated = adminValue && typeof adminValue === 'object' ? adminValue as AnyRecord : {};
    const liveRelated = liveValue && typeof liveValue === 'object' ? liveValue as AnyRecord : {};
    const keys = new Set([...Object.keys(liveRelated), ...Object.keys(adminRelated)]);
    const merged: AnyRecord = {};
    keys.forEach(key => {
      const adminField = adminRelated[key];
      merged[key] = meaningfulAlertValue(adminField) ? adminField : liveRelated[key];
    });
    return merged;
  }

  function mergeAlertRegistryWithLive(adminAlert: AnyRecord, liveAlert: AnyRecord, livePayloads: AnyRecord): AnyRecord {
    const merged: AnyRecord = { ...liveAlert, ...adminAlert };
    const fillFromLive = [
      'occurrenceStatus', 'vendorMessage', 'sourceAlertId', 'sourcePlantId', 'sourceDeviceId',
      'rawPayloadRef', 'lastSyncAtUtc', 'telemetry', 'description', 'probableCause', 'recommendation',
      'integration', 'age', 'sla', 'owner'
    ];
    fillFromLive.forEach(key => {
      if (!meaningfulAlertValue(adminAlert[key]) && meaningfulAlertValue(liveAlert[key])) merged[key] = liveAlert[key];
    });

    const adminRaw = adminAlert.raw && typeof adminAlert.raw === 'object' ? adminAlert.raw as AnyRecord : {};
    const adminTimelineLoaded = adminRaw.__timelineLoaded === true;
    const adminRelatedLoaded = adminRaw.__relatedLoaded === true;
    const adminSopLoaded = adminRaw.__sopLoaded === true;
    const adminTelemetryCurveLoaded = adminRaw.__telemetryCurveLoaded === true;
    const liveTimelineLoaded = livePayloads.timelineLoaded === true;
    const liveRelatedLoaded = livePayloads.relatedLoaded === true;
    const liveSopLoaded = livePayloads.sopLoaded === true;
    const liveTelemetryCurveLoaded = livePayloads.telemetryCurveLoaded === true;

    if (adminTimelineLoaded) merged.timeline = Array.isArray(adminAlert.timeline) ? adminAlert.timeline : [];
    else if (liveTimelineLoaded) merged.timeline = Array.isArray(liveAlert.timeline) ? liveAlert.timeline : [];

    if (adminRelatedLoaded) merged.related = adminAlert.related && typeof adminAlert.related === 'object' ? adminAlert.related : {};
    else if (liveRelatedLoaded) merged.related = liveAlert.related && typeof liveAlert.related === 'object' ? liveAlert.related : {};

    if (adminSopLoaded) merged.sop = adminAlert.sop ?? null;
    else if (liveSopLoaded) merged.sop = liveAlert.sop ?? null;

    if (adminTelemetryCurveLoaded) merged.telemetryCurve = adminAlert.telemetryCurve ?? null;
    else if (liveTelemetryCurveLoaded) merged.telemetryCurve = liveAlert.telemetryCurve ?? null;

    merged.adminSnapshot = { ...adminAlert };
    merged.liveOperational = livePayloads;
    merged.dataOrigin = 'mixed';
    merged.subresourceSources = {
      timeline: adminTimelineLoaded ? 'admin' : liveTimelineLoaded ? 'live' : 'none',
      related: adminRelatedLoaded ? 'admin' : liveRelatedLoaded ? 'live' : 'none',
      sop: adminSopLoaded ? 'admin' : liveSopLoaded ? 'live' : 'none',
      telemetryCurve: adminTelemetryCurveLoaded ? 'admin' : liveTelemetryCurveLoaded ? 'live' : 'none'
    };
    return merged;
  }

  function alertExplicitLiveId(alert: AnyRecord): string {
    return safeText(firstOf(alert, [
      'liveAlertId', 'canonicalAlertId',
      'raw.liveAlertId', 'raw.canonicalAlertId', 'raw.live.alertId'
    ], ''), '').trim();
  }

  function alertSourceIdentity(alert: AnyRecord): string {
    return normalizedSourceKey(firstOf(alert, [
      'sourceAlertId', 'raw.vendor.sourceAlertId', 'raw.sourceAlertId', 'raw.vendorExtensions.sourceAlertId'
    ], ''));
  }

  function alertSourceProvider(alert: AnyRecord): string {
    return normalizedProviderIdentity(firstOf(alert, [
      'vendor', 'provider', 'source', 'raw.vendor.provider', 'raw.provider'
    ], ''));
  }

  function alertLiveIdentityMatch(candidate: AnyRecord, registryAlert: AnyRecord): boolean {
    const wantedSource = alertSourceIdentity(registryAlert);
    const candidateSource = alertSourceIdentity(candidate);
    if (!wantedSource || !candidateSource || wantedSource !== candidateSource) return false;
    const wantedProvider = alertSourceProvider(registryAlert);
    const candidateProvider = alertSourceProvider(candidate);
    if (wantedProvider && candidateProvider && wantedProvider !== candidateProvider) return false;

    const wantedPlant = normalizedSourceKey(firstOf(registryAlert, ['sourcePlantId', 'raw.plant.sourcePlantId'], ''));
    const candidatePlant = normalizedSourceKey(firstOf(candidate, ['sourcePlantId', 'raw.plant.sourcePlantId'], ''));
    if (wantedPlant && candidatePlant && wantedPlant !== candidatePlant) return false;

    const wantedDevice = normalizedSourceKey(firstOf(registryAlert, ['sourceDeviceId', 'raw.device.sourceDeviceId'], ''));
    const candidateDevice = normalizedSourceKey(firstOf(candidate, ['sourceDeviceId', 'raw.device.sourceDeviceId'], ''));
    if (wantedDevice && candidateDevice && wantedDevice !== candidateDevice) return false;
    return true;
  }

  async function resolveAlertLiveId(alert: AnyRecord, forceRefresh: boolean): Promise<{ id: string; source: string; errors: unknown[] }> {
    const explicitId = alertExplicitLiveId(alert);
    if (explicitId) return { id: explicitId, source: 'explicit-live-id', errors: [] };

    const sourceAlertId = alertSourceIdentity(alert);
    if (!sourceAlertId) return { id: '', source: 'not-resolved', errors: [] };

    try {
      const result = await ZentridAPIRepositories.alerts.list({
        page: 1,
        pageSize: 50,
        search: sourceAlertId,
        cacheVariant: 'live',
        forceRefresh,
        timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS
      });
      const matches = (result.items as AnyRecord[]).filter(candidate => alertLiveIdentityMatch(candidate, alert));
      if (matches.length === 1) {
        const id = safeText(matches[0]?.id, '').trim();
        return { id, source: id ? 'source-alert-id-search' : 'not-resolved', errors: result.errors };
      }
      return { id: '', source: matches.length > 1 ? 'ambiguous-source-alert-id' : 'not-resolved', errors: result.errors };
    } catch (error) {
      return { id: '', source: 'lookup-error', errors: [error] };
    }
  }

  function alertDeviceSourceId(alert: AnyRecord): string {
    return String(firstOf(alert, ['sourceDeviceId', 'device', 'raw.sourceDeviceId', 'raw.vendor.sourceDeviceId', 'raw.vendorExtensions.deviceSn'], '') || '').trim();
  }

  function alertDeviceProvider(alert: AnyRecord): string {
    return normalizedProviderIdentity(firstOf(alert, ['vendor', 'provider', 'source', 'raw.vendor.provider', 'raw.provider'], ''));
  }

  function mappedDeviceSourceId(device: AnyRecord): string {
    return normalizedSourceKey(firstOf(device, [
      'externalId', 'sourceDeviceId', 'serial', 'serialNumber',
      'raw.source.sourceDeviceId', 'raw.sourceDeviceId', 'raw.identity.serialNumber',
      'raw.sourceReference.sourceEntityId', 'raw.vendorExtensions.sourceDeviceId'
    ], ''));
  }

  function mappedDeviceProvider(device: AnyRecord): string {
    return normalizedProviderIdentity(firstOf(device, [
      'vendor', 'provider', 'sourceSystem', 'raw.source.provider', 'raw.provider',
      'raw.sourceReference.sourceSystem', 'raw.vendorExtensions.sourceSystem'
    ], ''));
  }

  function alertDeviceSourceMatch(device: AnyRecord, sourceDeviceId: string, provider: string): boolean {
    const candidateSource = mappedDeviceSourceId(device);
    const wantedSource = normalizedSourceKey(sourceDeviceId);
    if (!candidateSource || !wantedSource || candidateSource !== wantedSource) return false;
    const candidateProvider = mappedDeviceProvider(device);
    return !provider || !candidateProvider || candidateProvider === provider;
  }

  function mapAlertLinkedDevicePayload(payload: unknown): AnyRecord | null {
    if (!payload || typeof payload !== 'object') return null;
    return ZentridAPIContracts.devices.map(payload as AnyRecord, 0, contractMapperContext) as AnyRecord;
  }

  const alertRegistryPlantCache = new Map<string, string>();

  async function resolveAlertRegistryPlantId(alert: AnyRecord, forceRefresh: boolean, requestOptions: ZentridRequestOptions): Promise<string> {
    const sourcePlantId = safeText(firstOf(alert, ['sourcePlantId', 'raw.sourcePlantId', 'raw.plant.sourcePlantId'], ''), '').trim();
    const provider = alertDeviceProvider(alert);
    const plantName = safeText(firstOf(alert, ['plant', 'plantName', 'raw.plantName'], ''), '').trim();
    if (!sourcePlantId || !plantName) return '';
    const cacheKey = `${provider}|${normalizedSourceKey(sourcePlantId)}|${normalizedSourceKey(plantName)}`;
    if (!forceRefresh && alertRegistryPlantCache.has(cacheKey)) return alertRegistryPlantCache.get(cacheKey) || '';

    const payload = await window.ZentridPlatformAPI?.plantRegistry?.search(plantName, requestOptions);
    const candidates = asArray(payload).map(row => ZentridAPIContracts.plants.map(row, 0, contractMapperContext) as AnyRecord);
    const exactNameCandidates = candidates.filter(row => normalizedSourceKey(firstOf(row, ['name', 'plant', 'plantName'], '')) === normalizedSourceKey(plantName));
    const pool = exactNameCandidates.length ? exactNameCandidates : candidates;

    for (const candidate of pool.slice(0, 10)) {
      const registryPlantId = safeText(firstOf(candidate, ['adminId', 'id'], ''), '').trim();
      if (!registryPlantId || !isUuidValue(registryPlantId)) continue;
      try {
        const detailResult = await ZentridAPIRepositories.plants.get(registryPlantId, {
          ...detailReadOptions('alert-detail:registry-plant-identity', 20, forceRefresh),
          cacheVariant: 'admin-registry',
          timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS
        });
        const detail = detailResult.items[0] as AnyRecord | undefined;
        if (!detail) continue;
        const detailSourcePlantId = normalizedSourceKey(firstOf(detail, [
          'sourcePlantId', 'raw.providerData.sourcePlantId', 'raw.source.sourcePlantId', 'raw.sourcePlantId'
        ], ''));
        const detailProvider = normalizedProviderIdentity(firstOf(detail, [
          'vendor', 'raw.providerData.provider', 'raw.source.provider', 'raw.provider'
        ], ''));
        const sourceMatches = !detailSourcePlantId || detailSourcePlantId === normalizedSourceKey(sourcePlantId);
        const providerMatches = !provider || !detailProvider || detailProvider === provider;
        if (sourceMatches && providerMatches) {
          alertRegistryPlantCache.set(cacheKey, registryPlantId);
          return registryPlantId;
        }
      } catch {
        // Search candidates come from the Registry list. A missing enrichment detail is non-fatal.
      }
    }

    if (pool.length === 1) {
      const onlyId = safeText(firstOf(pool[0] || {}, ['adminId', 'id'], ''), '').trim();
      if (isUuidValue(onlyId)) {
        alertRegistryPlantCache.set(cacheKey, onlyId);
        return onlyId;
      }
    }
    return '';
  }

  function alertAdminDevicePlantMatch(device: AnyRecord, alert: AnyRecord, sourceDeviceId: string, provider: string): boolean {
    if (alertDeviceSourceMatch(device, sourceDeviceId, provider)) return true;
    const candidateProvider = mappedDeviceProvider(device);
    const alertName = normalizedSourceKey(firstOf(alert, ['device', 'deviceName'], ''));
    const candidateName = normalizedSourceKey(firstOf(device, ['name', 'device', 'deviceName', 'raw.identity.deviceName'], ''));
    return Boolean(alertName && candidateName && alertName === candidateName && (!provider || !candidateProvider || candidateProvider === provider));
  }

  async function resolveAlertLinkedDevice(alert: AnyRecord, forceRefresh: boolean): Promise<{ admin: AnyRecord | null; live: AnyRecord | null; errors: unknown[]; source: string }> {
    const errors: unknown[] = [];
    let admin: AnyRecord | null = null;
    let live: AnyRecord | null = null;
    let source = 'not-resolved';
    const alertDeviceId = safeText(alert.deviceId, '').trim();
    let sourceDeviceId = alertDeviceSourceId(alert);
    let provider = alertDeviceProvider(alert);
    const requestOptions = { ...detailReadOptions('alert-detail:linked-device', 1, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS };

    // Alert.deviceId belongs to the canonical/operational graph. Do not probe the
    // administrative Device Registry detail route with it; resolve Registry identity below.

    // The alert device id may instead be the Platform Live id. Use it to enrich the
    // source identity before searching the administrative registry.
    if (alertDeviceId && window.ZentridPlatformAPI?.liveDevices) {
      try {
        const payload = await window.ZentridPlatformAPI.liveDevices.get(alertDeviceId, requestOptions);
        if (payload && typeof payload === 'object') {
          live = ZentridAPIContracts.devices.map(payload as AnyRecord, 0, contractMapperContext) as AnyRecord;
          sourceDeviceId = sourceDeviceId || String(firstOf(live, ['externalId', 'sourceDeviceId', 'serial'], '') || '').trim();
          provider = provider || mappedDeviceProvider(live);
        }
      } catch (_expectedLiveMiss) { /* Source search remains available. */ }
    }

    if (!admin && sourceDeviceId) {
      try {
        const search = await ZentridAPIRepositories.devices.list({
          page: 1,
          pageSize: 50,
          search: sourceDeviceId,
          timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS,
          forceRefresh
        });
        admin = (search.items as AnyRecord[]).find(row => alertDeviceSourceMatch(row, sourceDeviceId, provider)) || null;
        if (admin) source = 'admin-source-search';
      } catch (error) {
        errors.push(error);
      }
    }

    if (!admin && sourceDeviceId) {
      try {
        const registryPlantId = await resolveAlertRegistryPlantId(alert, forceRefresh, requestOptions);
        if (registryPlantId) {
          const registryDevices = await ZentridAPIRepositories.devices.list({
            page: 1,
            pageSize: 100,
            plantId: registryPlantId,
            timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS,
            forceRefresh
          });
          admin = (registryDevices.items as AnyRecord[]).find(row => alertAdminDevicePlantMatch(row, alert, sourceDeviceId, provider)) || null;
          if (admin) source = 'registry-plant-device-list';
        }
      } catch (error) {
        errors.push(error);
      }
    }

    if (!live && sourceDeviceId && window.ZentridPlatformAPI?.liveDevices) {
      try {
        const payload = await window.ZentridPlatformAPI.liveDevices.list({ page: 1, pageSize: 50, search: sourceDeviceId }, requestOptions);
        const mapped = asArray(payload).map(row => ZentridAPIContracts.devices.map(row, 0, contractMapperContext) as AnyRecord);
        live = mapped.find(row => alertDeviceSourceMatch(row, sourceDeviceId, provider)) || null;
      } catch (error) {
        errors.push(error);
      }
    }

    return { admin, live, errors, source };
  }

  async function applyAlertDetail(forceRefresh = false): Promise<void> {
    if (!/alert-detail\.html$/.test(location.pathname)) return;
    const selectedId = new URLSearchParams(location.search).get('id') || localStorage.getItem('zentrid_selected_alert');
    const selectedSnapshot = readDetailSelection('alert', selectedId);
    setLiveDataState('loading', selectedSnapshot
      ? 'Loading the selected Alert Registry record. A preserved browser snapshot is used only if the direct detail endpoint is unavailable.'
      : 'Loading the selected Alert Registry record and its backend subresources.', { source: '/api/admin/alerts' });
    try {
      let requestedRegistryId = String(selectedId || '').trim();
      if (!requestedRegistryId) {
        const registryList = await ZentridAPIRepositories.alerts.list(detailReadOptions('alert-detail:registry-selection', 20, forceRefresh));
        const firstRegistryAlert = registryList.items[0] as AnyRecord | undefined;
        requestedRegistryId = safeText(firstOf(firstRegistryAlert || {}, ['id', 'adminId', 'registryAlertId'], ''), '').trim();
        if (!requestedRegistryId) {
          const message = 'The Alert Registry returned no records. No prototype alert detail is displayed.';
          window.ZentridApiOnly?.mountEmpty('Alert Detail', message, '/api/admin/alerts');
          setLiveDataState('empty', message, { source: '/api/admin/alerts', recordCount: registryList.pagination.totalCount });
          return;
        }
      }

      const result = await ZentridAPIRepositories.alerts.get(requestedRegistryId, {
        ...detailReadOptions('alert-detail:registry-direct', 1, forceRefresh),
        allowListFallback: false,
        timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS
      });
      const registryRecord = (result.item || result.items.find(record => detailSelectionMatches(record, requestedRegistryId))) as AnyRecord | undefined;
      if (!registryRecord) throw new Error(`GET /api/admin/alerts/${requestedRegistryId} returned no Alert Registry record.`);

      let selectedRecord: AnyRecord = {
        ...registryRecord,
        registryAlertId: requestedRegistryId,
        liveAlertId: '',
        liveAlertResolution: 'not-resolved'
      };
      const uiErrors: unknown[] = [...result.errors];
      const adminRaw = selectedRecord.raw && typeof selectedRecord.raw === 'object' ? selectedRecord.raw as AnyRecord : {};
      selectedRecord.subresourceSources = {
        timeline: adminRaw.__timelineLoaded === true ? 'admin' : 'none',
        related: adminRaw.__relatedLoaded === true ? 'admin' : 'none',
        sop: adminRaw.__sopLoaded === true ? 'admin' : 'none',
        telemetryCurve: adminRaw.__telemetryCurveLoaded === true ? 'admin' : 'none'
      };

      const liveResolution = await resolveAlertLiveId(selectedRecord, forceRefresh);
      selectedRecord.liveAlertId = liveResolution.id;
      selectedRecord.liveAlertResolution = liveResolution.source;
      uiErrors.push(...liveResolution.errors);

      if (liveResolution.id && window.ZentridPlatformAPI?.liveAlerts) {
        type LiveLoad = { loaded: boolean; value: unknown };
        const liveErrors: unknown[] = [];
        const safeLive = async (promise: Promise<unknown>): Promise<LiveLoad> => {
          try { return { loaded: true, value: await promise }; }
          catch (error) { liveErrors.push(error); return { loaded: false, value: null }; }
        };
        const requestOptions = { ...detailReadOptions('alert-detail:live', 1, forceRefresh), timeoutMs: SLOW_ENDPOINT_TIMEOUT_MS };
        const liveId = liveResolution.id;
        const [liveDetail, liveTimeline, liveRelated, liveSop, liveTelemetryCurve] = await Promise.all([
          safeLive(window.ZentridPlatformAPI.liveAlerts.get(liveId, requestOptions)),
          adminRaw.__timelineLoaded === true ? Promise.resolve({ loaded: false, value: null } as LiveLoad) : safeLive(window.ZentridPlatformAPI.liveAlerts.timeline(liveId, requestOptions)),
          adminRaw.__relatedLoaded === true ? Promise.resolve({ loaded: false, value: null } as LiveLoad) : safeLive(window.ZentridPlatformAPI.liveAlerts.related(liveId, requestOptions)),
          adminRaw.__sopLoaded === true ? Promise.resolve({ loaded: false, value: null } as LiveLoad) : safeLive(window.ZentridPlatformAPI.liveAlerts.sop(liveId, requestOptions)),
          adminRaw.__telemetryCurveLoaded === true ? Promise.resolve({ loaded: false, value: null } as LiveLoad) : safeLive(window.ZentridPlatformAPI.liveAlerts.telemetryCurve(liveId, { windowMinutes: 60 }, requestOptions))
        ]);

        const detailObject = liveDetail.loaded && liveDetail.value && typeof liveDetail.value === 'object' ? liveDetail.value as AnyRecord : null;
        const hasLiveFallback = liveTimeline.loaded || liveRelated.loaded || liveSop.loaded || liveTelemetryCurve.loaded;
        if (detailObject || hasLiveFallback) {
          const liveRaw: AnyRecord = detailObject ? { ...detailObject } : { id: liveId };
          if (liveTimeline.loaded) { liveRaw.__timeline = liveTimeline.value; liveRaw.__timelineLoaded = true; }
          if (liveRelated.loaded) { liveRaw.__related = liveRelated.value; liveRaw.__relatedLoaded = true; }
          if (liveSop.loaded) { liveRaw.__sop = liveSop.value; liveRaw.__sopLoaded = true; }
          if (liveTelemetryCurve.loaded) { liveRaw.__telemetryCurve = liveTelemetryCurve.value; liveRaw.__telemetryCurveLoaded = true; }
          const liveMapped = ZentridAPIContracts.alerts.map(liveRaw, 0, contractMapperContext) as AnyRecord;
          selectedRecord = mergeAlertRegistryWithLive(selectedRecord, liveMapped, {
            liveAlertId: liveId,
            resolution: liveResolution.source,
            detail: detailObject,
            detailLoaded: Boolean(detailObject),
            timeline: liveTimeline.value,
            timelineLoaded: liveTimeline.loaded,
            related: liveRelated.value,
            relatedLoaded: liveRelated.loaded,
            sop: liveSop.value,
            sopLoaded: liveSop.loaded,
            telemetryCurve: liveTelemetryCurve.value,
            telemetryCurveLoaded: liveTelemetryCurve.loaded
          });
          selectedRecord.liveAlertId = liveId;
          selectedRecord.liveAlertResolution = liveResolution.source;
        }
        uiErrors.push(...liveErrors);
      }

      if (safeText(selectedRecord.deviceId, '').trim() || alertDeviceSourceId(selectedRecord)) {
        const resolution = await resolveAlertLinkedDevice(selectedRecord, forceRefresh);
        selectedRecord = {
          ...selectedRecord,
          ...(resolution.admin ? { linkedDevice: resolution.admin } : {}),
          ...(resolution.live ? { linkedLiveDevice: resolution.live } : {}),
          linkedDeviceResolution: {
            source: resolution.source,
            adminId: safeText(resolution.admin?.id, '').trim(),
            liveId: safeText(resolution.live?.id, '').trim()
          }
        };
        uiErrors.push(...resolution.errors);
      }

      if (Array.isArray(window.ZentridAlerts || ZentridAlerts)) {
        const target = window.ZentridAlerts || ZentridAlerts;
        target.splice(0, target.length, selectedRecord);
        localStorage.setItem('zentrid_selected_alert', selectedRecord.id);
        saveDetailSelection('alert', selectedRecord);
        ZentridLayout.mount(renderAlertDetailContent(selectedAlert()));
        wireAlertDetailPage();
        const hasLiveOperational = Boolean(selectedRecord.liveOperational && typeof selectedRecord.liveOperational === 'object');
        const liveId = safeText(selectedRecord.liveAlertId, '').trim();
        setLiveDataState(uiErrors.length ? 'partial' : 'live', hasLiveOperational
          ? 'Alert Registry detail is authoritative; a separately resolved Platform Live alert is attached only as operational enrichment or failed-subresource fallback.'
          : liveId
            ? 'Alert Registry detail is authoritative. A Platform Live identity was resolved, but no live enrichment payload was applied.'
            : 'Alert Registry detail is authoritative. No safe Platform Live alert identity was resolved, so the Registry UUID was not sent to /api/alerts/{id}.', {
          source: hasLiveOperational && liveId
            ? `${result.source} + /api/alerts/${encodeURIComponent(liveId)}`
            : result.source,
          details: `${hasLiveOperational ? `Live match: ${selectedRecord.liveAlertResolution}` : `Live match: ${selectedRecord.liveAlertResolution || 'not-resolved'}`} · ${uiErrors.length} non-blocking enrichment/subresource error(s)`,
          recordCount: 1,
          dataOrigin: hasLiveOperational ? 'mixed' : 'live'
        });
      }
    } catch (error) {
      if (selectedSnapshot && Array.isArray(window.ZentridAlerts || ZentridAlerts)) {
        const target = window.ZentridAlerts || ZentridAlerts;
        const snapshot = { ...selectedSnapshot, detailSourceMode: 'session-snapshot' } as AnyRecord;
        target.splice(0, target.length, snapshot);
        saveDetailSelection('alert', snapshot);
        ZentridLayout.mount(renderAlertDetailContent(selectedAlert()));
        wireAlertDetailPage();
        setLiveDataState('partial', 'The selected alert was restored from this browser session because the direct Alert Registry detail request failed.', {
          source: 'Selected session record',
          details: liveErrorMessage(error),
          recordCount: 1,
          freshnessStatus: 'stale'
        });
        return;
      }
      setRequestFailure('/api/admin/alerts/{id}', error, 'No prototype alert detail is displayed.');
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
    if (!selectedId) {
      window.ZentridApiOnly?.mountEmpty('Integration Detail', 'Select a connector from Connector Registry before opening Integration Detail.', '/api/admin/provider-integrations/{id}');
      setLiveDataState('empty', 'No connector is selected. Integration Detail does not substitute the first registry row.', { source: '/api/admin/provider-integrations/{id}', recordCount: 0 });
      return;
    }
    setLiveDataState('loading', 'Loading the selected integration registry record. Operational summary will remain idle until Synchronization is opened.', { source: detailSource });
    try {
      const registry = await ZentridAPIRepositories.integrations.get(selectedId, { ...detailReadOptions('integration-detail', 20, forceRefresh), allowListFallback: false });
      const data: AnyRecord[] = 'item' in registry && registry.item ? [registry.item as AnyRecord] : [];
      if (!data.length) {
        if (registry.errors.length) setRequestFailure(registry.source, registry.errors[0], 'No prototype integration detail is displayed.');
        else { window.ZentridApiOnly?.mountEmpty('Integration Detail', selectedId ? 'The selected integration record was not returned.' : 'The integration registry returned no records.', registry.source); setLiveDataState('empty', selectedId ? 'The selected integration record was not returned. Integration Detail is empty.' : 'The integration registry returned no records. Integration Detail is empty.', { source: registry.source, recordCount: 0 }); }
        return;
      }
      integrations = data;
      window.ZentridLiveIntegrations = integrations;
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
      setLiveDataState(registry.errors.length ? 'partial' : 'live', 'The integration registry record is ready. Operational health has not been requested yet.', {
        source: registry.source,
        details: ['Direct detail endpoint', 'Lazy section: Synchronization operational summary'].join(' · '),
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
      if (!registry && !selectedId) {
        setLiveClients([]);
        window.ZentridApiOnly?.mountEmpty('Client Detail', 'Select a client from Client Registry before opening Client Detail.', '/api/admin/clients/{id}');
        setLiveDataState('empty', 'No client is selected. Client Detail does not substitute the first registry row.', { source: '/api/admin/clients/{id}', recordCount: 0 });
        return;
      }
      const result = registry
        ? await ZentridAPIRepositories.clients.list(registryReadOptions('clients', forceRefresh))
        : await ZentridAPIRepositories.clients.get(selectedId, { ...detailReadOptions('client-detail', 20, forceRefresh), allowListFallback: false });
      if (registry && !isCurrentRegistryRequest('clients', requestVersion)) return;
      if (registry) publishRegistryPagination('clients', result);
      const data: AnyRecord[] = registry
        ? result.items as AnyRecord[]
        : ('item' in result && result.item ? [result.item as AnyRecord] : []);
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
        renderClientsPage();
      } else {
        if (mapped[0]?.id) clientModel?.selectClient(mapped[0].id);
        renderClientDetailPage();
      }
      const cacheInfo = repositoryCachePresentation(result);
      const usedDirectDetail = !registry && Boolean(selectedId) && result.source.includes('/api/admin/clients/');
      setLiveDataState(result.errors.length ? 'partial' : cacheInfo.state, `${cacheInfo.prefix}${registry
        ? `Client page ${result.pagination.page} of ${result.pagination.totalPages} was applied.`
        : 'The selected client record was loaded by ID.'}`, {
        source: result.source || detailSource,
        details: [
          registry ? `Server pagination · ${result.pagination.pageSize} rows per page` : 'Direct detail endpoint',
          cacheInfo.details
        ].filter(Boolean).join(' · '),
        recordCount: registry ? result.pagination.totalCount : data.length,
        ...cacheFreshnessOptions(cacheInfo)
      });
    } catch (error) {
      if (!registry || isCurrentRegistryRequest('clients', requestVersion)) setRequestFailure(registry ? '/api/admin/clients' : detailSource, error, 'No prototype client records are displayed.');
    }
  }

  async function applyTenants(backgroundRefresh = false, forceRefresh = false): Promise<void> {
    if (!/tenants\.html$/.test(location.pathname) && !/tenant-detail\.html$/.test(location.pathname)) return;
    const registry = /tenants\.html$/.test(location.pathname);
    const requestVersion = registry ? beginRegistryRequest('tenants') : 0;
    const selectedId = registry ? '' : String(localStorage.getItem('zentrid_selected_tenant') || '').trim();
    let selectedLocalTenant: AnyRecord | null = null;
    if (!registry && selectedId) {
      try {
        const raw = sessionStorage.getItem('zentrid_tenant_create_fallback');
        const parsed = raw ? JSON.parse(raw) as AnyRecord : null;
        if (parsed && String(parsed.id || '').trim() === selectedId && parsed.dataOrigin === 'local') selectedLocalTenant = parsed;
      } catch {
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
    if (!registry && !selectedId) {
      setLiveTenants([]);
      window.ZentridApiOnly?.mountEmpty('Tenant Detail', 'Select a tenant from Tenant Registry before opening Tenant Detail.', '/api/admin/tenants/{id}');
      setLiveDataState('empty', 'No tenant is selected. Tenant Detail does not substitute the first registry row.', { source: '/api/admin/tenants/{id}', recordCount: 0 });
      return;
    }
    if (!backgroundRefresh) setLiveDataState('loading', registry ? 'Loading the requested Global Admin tenant page.' : 'Loading the selected Global Admin tenant record.', { source: registry ? '/api/admin/tenants' : detailSource });
    try {
      const result = registry
        ? await ZentridAPIRepositories.tenants.list(registryReadOptions('tenants', forceRefresh))
        : await ZentridAPIRepositories.tenants.get(selectedId, { ...detailReadOptions('tenant-detail', 20, forceRefresh), allowListFallback: false });
      if (registry && !isCurrentRegistryRequest('tenants', requestVersion)) return;
      if (registry) publishRegistryPagination('tenants', result);
      const data: AnyRecord[] = registry
        ? result.items as AnyRecord[]
        : ('item' in result && result.item ? [result.item as AnyRecord] : []);
      if (!data.length) {
        setLiveTenants([]);
        if (!registry) window.ZentridApiOnly?.mountEmpty('Tenant Detail', 'The selected tenant endpoint returned no matching record.', detailSource);
        else { ZentridLayout.mount(renderTenantRegistry()); wireTenantRegistry(); }
        if (result.errors.length) setRequestFailure(detailSource, result.errors[0], 'No prototype tenant records are displayed.');
        else setLiveDataState('empty', registry ? 'The requested Tenant Registry page returned no records.' : 'The selected tenant endpoint responded successfully but returned no matching record.', { source: detailSource, recordCount: registry ? result.pagination.totalCount : 0 });
        return;
      }
      setLiveTenants(data);
      if (registry) {
        ZentridLayout.mount(renderTenantRegistry());
        wireTenantRegistry();
      } else {
        ZentridLayout.mount(renderTenantDetail());
        wireTenantDetail();
      }
      const cacheInfo = repositoryCachePresentation(result);
      setLiveDataState(result.errors.length ? 'partial' : cacheInfo.state, `${cacheInfo.prefix}${registry
        ? `Tenant page ${result.pagination.page} of ${result.pagination.totalPages} was applied.`
        : 'The selected tenant record was loaded by ID.'}`, {
        source: result.source || detailSource,
        details: [
          registry ? `Server pagination · ${result.pagination.pageSize} rows per page` : 'Direct detail endpoint',
          cacheInfo.details
        ].filter(Boolean).join(' · '),
        recordCount: registry ? result.pagination.totalCount : data.length,
        ...cacheFreshnessOptions(cacheInfo)
      });
    } catch (error) {
      if (!registry || isCurrentRegistryRequest('tenants', requestVersion)) setRequestFailure(registry ? '/api/admin/tenants' : detailSource, error, 'No prototype tenant records are displayed.');
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
      if (entity === 'tenants') void applyTenants(true);
      if (entity === 'plants') void applyPlants(true);
      if (entity === 'devices') void applyDevices(true);
      if (entity === 'alerts') void applyAlerts(true);
      if (entity === 'integrations') void applyIntegrations(true);
    }, 40));
  }

  function handleRegistryQueryChange(event: Event): void {
    const detail = (event as CustomEvent<{ entity?: RegistryEntity }>).detail;
    const entity = detail?.entity;
    if (!entity || !isRegistryPage(entity)) return;
    if (entity === 'clients') void applyClients();
    if (entity === 'tenants') void applyTenants();
    if (entity === 'plants') void applyPlants();
    if (entity === 'devices') void applyDevices();
    if (entity === 'alerts') void applyAlerts();
    if (entity === 'integrations') void applyIntegrations();
  }

  function handleDataRefreshRequest(event: Event): void {
    const detail = (event as CustomEvent<{ resource?: ZentridFreshnessResource; forceRefresh?: boolean }>).detail;
    const resource = detail?.resource || window.ZentridDataFreshness?.inferResource();
    const forceRefresh = detail?.forceRefresh !== false;
    if (resource === 'overview') void applyOverview(forceRefresh);
    if (resource === 'clients') void applyClients(true, forceRefresh);
    if (resource === 'client-detail') void applyClients(false, forceRefresh);
    if (resource === 'tenants' || resource === 'tenant-detail') void applyTenants(false, forceRefresh);
    if (resource === 'plants') void applyPlants(true, forceRefresh);
    if (resource === 'plant-detail') void applyPlantDetail(forceRefresh);
    if (resource === 'devices') void applyDevices(true, forceRefresh);
    if (resource === 'device-detail') void applyDeviceDetail(forceRefresh);
    if (resource === 'alerts') void applyAlerts(true, forceRefresh);
    if (resource === 'telemetry') void applyTelemetry(false, forceRefresh);
    if (resource === 'alert-detail') void applyAlertDetail(forceRefresh);
    if (resource === 'integrations') void applyIntegrations(false, forceRefresh);
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
