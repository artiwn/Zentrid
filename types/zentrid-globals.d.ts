interface ZentridExpressApp {
  use(...args: unknown[]): void;
  get(...args: unknown[]): void;
  listen(port: string | number, callback?: () => void): void;
}
interface ZentridExpressFactory {
  (): ZentridExpressApp;
  json(options?: { limit?: string }): unknown;
  static(root: string): unknown;
}
interface ZentridCorsFactory {
  (...args: unknown[]): unknown;
}
declare function require(id: 'express'): ZentridExpressFactory;
declare function require(id: 'cors'): ZentridCorsFactory;
declare function require(id: string): unknown;
declare const process: { env: Record<string, string | undefined> };
declare const __dirname: string;

type ZentridLegacyCompat = any;

declare interface Window {
  [key: string]: ZentridLegacyCompat;
}

declare interface Element {
  onclick: ((event: Event) => void) | null;
}

declare interface EventTarget {
  closest?: ZentridLegacyCompat;
  dataset?: ZentridLegacyCompat;
}

declare interface Event {
  detail?: ZentridLegacyCompat;
}

// Legacy DOM conveniences used by the non-module prototype scripts.
declare interface Element {
  hidden: boolean;
  disabled?: boolean;
  blur?: () => void;
  innerText?: string;
}

declare interface HTMLElement {
  value?: string;
  checked?: boolean;
  disabled: boolean;
  readOnly?: boolean;
  placeholder?: string;
  files?: FileList | null;
  options?: HTMLOptionsCollection;
  innerText?: string;
}

declare interface EventTarget {
  id?: string;
  value?: string;
  checked?: boolean;
}

// Additional legacy DOM conveniences for integration prototype scripts.
declare interface Element {
  matches?: ZentridLegacyCompat;
}

declare interface HTMLElement {
  selectedIndex?: number;
}

declare interface EventTarget {
  matches?: ZentridLegacyCompat;
}


interface ZentridDeviceCatalogLegacyApi {
  catalog: Array<{ kind: string; vendor: string; model: string; rating: string; protocol: string; shared: string; individual: string }>;
  compatibility: Array<{ from: string; to: string; type: string; status: string; rule: string }>;
}

interface SettlementCenterLegacyApi {
  createRun(): void;
  saveRun(): void;
  openDetail(id: string): void;
  createAgreement(): void;
  saveAgreement(): void;
  closeModal(): void;
  closeDrawer(): void;
}

interface ZentridCommercialAgreementsLegacyApi {
  toast(message: string): void;
  open(type: string, title: string, meta: string): void;
}

// Runtime globals produced by legacy non-module browser scripts.
declare const ZentridClientModel: ZentridClientModelLegacyApi;
declare const ZentridDeviceCatalog: ZentridDeviceCatalogLegacyApi;
declare function renderClientsPage(): void;
declare function renderClientDetailPage(): void;
declare function renderClientPlantAssignmentPage(): void;
declare function renderClientOnboardingPage(): void;

// Commercial / settlement prototype globals exposed by non-module scripts.
declare const SettlementCenter: SettlementCenterLegacyApi;
declare const ZentridCommercialAgreementsV125: ZentridCommercialAgreementsLegacyApi;

// Detail and registry renderers exposed by legacy page scripts.
declare function renderPlantDetailPage(): void;
declare function renderDeviceDetail(): string;
declare function wireDeviceDetail(): void;
declare function renderPlants(): string;
declare function wirePlants(): void;
declare function renderTenantDetail(): string;
declare function wireTenantDetail(): void;

interface EnergyAccountingApi {
  openCorrection(): void;
  saveCorrection(): void;
  runAccounting(): void;
  startRun(): void;
  closeModal(): void;
  closeDrawer(): void;
}

interface Window {
  EnergyAccounting: EnergyAccountingApi;
}


// Narrow legacy API contracts used while the browser prototype is still non-module based.
interface ZentridLayoutDrawerApi {
  (title: string, details?: Record<string, unknown>, bodyHtml?: string): void;
}

interface ZentridLayoutLegacyApi {
  mount(html: string): void;
  toast(message: string): void;
  pathFor(route: string): string;
  enhanceActionMenus?(root?: Document | Element | null): void;
  drawer?: ZentridLayoutDrawerApi;
}


interface ZentridClientLegacyClient {
  id: string;
  name: string;
  code?: unknown;
  tenant?: unknown;
  type?: unknown;
  legalForm?: unknown;
  verification?: unknown;
  country?: unknown;
  city?: unknown;
  assignmentRole?: unknown;
  status?: unknown;
  users?: unknown;
  billing?: unknown;
  registrationNo?: unknown;
  taxId?: unknown;
  address?: unknown;
  account?: unknown;
  supportTier?: unknown;
  accessScope?: unknown;
  exportPolicy?: unknown;
  onboarding?: unknown;
  primaryContact?: unknown;
  contactEmail?: unknown;
  contactPhone?: unknown;
  plants?: unknown[];
  documents?: unknown;
}

interface ZentridClientLegacyPlant {
  id: string;
  clientId: string;
  name: string;
  code?: unknown;
  owner?: unknown;
  tenant?: unknown;
  country?: unknown;
  city?: unknown;
  health?: unknown;
  capacityDc?: unknown;
  capacityAc?: unknown;
  alerts?: unknown;
  energyToday?: unknown;
  portfolio?: unknown;
  operator?: unknown;
}

interface ZentridClientLegacyDevice {
  id: string;
  plantId: string;
  name: string;
  type?: unknown;
  vendor?: unknown;
  status?: unknown;
  serial?: unknown;
  model?: unknown;
  capacity?: unknown;
  location?: unknown;
  lastSeen?: unknown;
  children?: unknown;
}

interface ZentridClientModelLegacyApi {
  clients: ZentridClientLegacyClient[];
  plants: ZentridClientLegacyPlant[];
  devices: ZentridClientLegacyDevice[];
  badge(value: unknown): string;
  getClient(id?: string | null): ZentridClientLegacyClient | undefined;
  getPlant(id?: string | null): ZentridClientLegacyPlant | undefined;
  plantsForClient(clientId: string): ZentridClientLegacyPlant[];
  devicesForPlant(plantId: string): ZentridClientLegacyDevice[];
  countsForClient(clientId: string): { plants: number; devices: number; capacity: string; alerts: number };
  selectClient(id: string): void;
  selectPlant(id: string): void;
  selectedClient(): ZentridClientLegacyClient;
  selectedPlant(): ZentridClientLegacyPlant;
}

interface Window {
  ZentridLayout: ZentridLayoutLegacyApi;
  ZentridClientModel: ZentridClientModelLegacyApi;
}

// Additional page shell renderers used by strict page-script checks.
declare function renderArchivedIntegrations(): string;
declare function wireArchivedIntegrations(): void;
declare function renderIntegrationArchive(): string;
declare function wireIntegrationArchive(): void;
declare function renderProduction(): string;
declare function wireProduction(): void;

interface Window {
  ZentridDataSource: ZentridDataSourceApi;
  ZentridLiveTenants?: Array<Record<string, unknown>>;
  ZentridLiveIntegrations?: Array<Record<string, unknown>>;
}

declare const ZentridDataSource: ZentridDataSourceApi;

type ZentridContractRecord = Record<string, ZentridLegacyCompat>;
interface ZentridContractMapperContext {
  safeText(value: unknown, fallback?: unknown): string;
  firstOf(row: ZentridContractRecord, keys: string[], fallback?: unknown): unknown;
  displayName(row: ZentridContractRecord, keys: string[], entityLabel: string, index: number, typeHint?: unknown): string;
  formatDate(value: unknown, fallback?: string): string;
  integrationVendor(value: unknown): string;
  integrationSoftware(value: unknown): string;
}
type ZentridContractEntity = 'clients' | 'tenants' | 'plants' | 'devices' | 'alerts' | 'telemetry' | 'integrations';
type ZentridContractSeverity = 'error' | 'warning';
interface ZentridContractIssue {
  entity: ZentridContractEntity;
  entityLabel: string;
  index: number;
  severity: ZentridContractSeverity;
  code: 'INVALID_RECORD' | 'MISSING_REQUIRED_FIELD' | 'INVALID_FIELD_TYPE';
  field: string;
  aliases: string[];
  message: string;
}
interface ZentridContractValidation {
  entity: ZentridContractEntity;
  valid: boolean;
  issues: ZentridContractIssue[];
}
interface ZentridContractDiagnosticSummary {
  total: number;
  errors: number;
  warnings: number;
  affectedEntities: ZentridContractEntity[];
}

type ZentridFieldFormat = 'identifier' | 'text' | 'status' | 'date' | 'count' | 'email' | 'phone' | 'relation' | 'power' | 'energy' | 'boolean' | 'raw';
interface ZentridFieldMappingDefinition {
  canonicalField: string;
  aliases: string[];
  uiTargets: string[];
  format: ZentridFieldFormat;
  fallback: string;
  required?: ZentridContractSeverity;
}
interface ZentridFieldAuditRecord {
  entity: ZentridContractEntity;
  index: number;
  mappedFields: string[];
  fallbackFields: string[];
  missingExpectedFields: string[];
  unmappedFields: string[];
  sourceByCanonical: Record<string, string>;
  rawFieldCount: number;
}
interface ZentridFieldAuditEntitySummary {
  entity: ZentridContractEntity;
  records: number;
  rawFields: number;
  mappedFields: number;
  fallbackFields: number;
  missingExpectedFields: number;
  unmappedFields: number;
}
interface ZentridFieldAuditSummary {
  records: number;
  rawFields: number;
  mappedFields: number;
  fallbackFields: number;
  missingExpectedFields: number;
  unmappedFields: number;
  affectedEntities: ZentridContractEntity[];
  byEntity: ZentridFieldAuditEntitySummary[];
}
interface ZentridFieldAuditApi {
  clear(entity?: ZentridContractEntity): void;
  manifest(entity?: ZentridContractEntity): ZentridFieldMappingDefinition[] | Record<ZentridContractEntity, ZentridFieldMappingDefinition[]>;
  list(entity?: ZentridContractEntity): ZentridFieldAuditRecord[];
  summary(entity?: ZentridContractEntity): ZentridFieldAuditSummary;
}
interface ZentridContractDiagnosticsApi {
  clear(entity?: ZentridContractEntity): void;
  report(issues: ZentridContractIssue[]): void;
  list(entity?: ZentridContractEntity): ZentridContractIssue[];
  summary(entity?: ZentridContractEntity): ZentridContractDiagnosticSummary;
}
interface ZentridEntityContractApi {
  parse(value: unknown): ZentridContractRecord | null;
  validate(value: unknown, index?: number): ZentridContractValidation;
  map(value: unknown, index: number, context: ZentridContractMapperContext): ZentridContractRecord;
  mapList(values: unknown[], context: ZentridContractMapperContext): ZentridContractRecord[];
}
type ZentridNormalizationDomain =
  | 'country'
  | 'clientType'
  | 'entityType'
  | 'tenantType'
  | 'provider'
  | 'integrationProvider'
  | 'clientStatus'
  | 'tenantStatus'
  | 'plantStatus'
  | 'deviceStatus'
  | 'alertStatus'
  | 'alertSeverity'
  | 'integrationStatus';
interface ZentridValueNormalizationApi {
  country(value: unknown): string;
  clientType(value: unknown): string;
  entityType(value: unknown): string;
  tenantType(value: unknown): string;
  provider(value: unknown): string;
  integrationProvider(value: unknown): string;
  clientStatus(value: unknown): string;
  tenantStatus(value: unknown): string;
  plantStatus(value: unknown): string;
  deviceStatus(value: unknown): string;
  alertStatus(value: unknown): string;
  alertSeverity(value: unknown): string;
  integrationStatus(value: unknown): string;
  normalize(domain: ZentridNormalizationDomain, value: unknown): string;
}
interface ZentridAPIContractsApi {
  clients: ZentridEntityContractApi;
  tenants: ZentridEntityContractApi;
  plants: ZentridEntityContractApi;
  devices: ZentridEntityContractApi;
  alerts: ZentridEntityContractApi;
  telemetry: ZentridEntityContractApi;
  integrations: ZentridEntityContractApi;
  diagnostics: ZentridContractDiagnosticsApi;
  fieldAudit: ZentridFieldAuditApi;
  normalization: ZentridValueNormalizationApi;
}
declare const ZentridAPIContracts: ZentridAPIContractsApi;
interface Window { ZentridAPIContracts: ZentridAPIContractsApi; }



interface ZentridDetailLazySnapshot {
  page: string;
  resource: string;
  label: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  errorMessage: string;
}
interface ZentridDetailLazyResourceDefinition {
  key: string;
  tabs: string[];
  label: string;
  description?: string;
  loader: () => Promise<void> | void;
}
interface ZentridDetailLazyTabsApi {
  register(page: string, definitions: ZentridDetailLazyResourceDefinition[]): void;
  activate(page: string, tab: string): void;
  load(page: string, tabOrResource: string, force?: boolean): Promise<void>;
  snapshot(page: string, tabOrResource: string): ZentridDetailLazySnapshot | null;
  panel(page: string, tab: string, content: string): string;
  observe(page: string, key: string, callback: () => void): void;
  unobserve(page: string, key: string): void;
  reset(page: string, resourceKey?: string): void;
  dispose(page?: string): void;
}
declare const ZentridDetailLazyTabs: ZentridDetailLazyTabsApi;
interface Window { ZentridDetailLazyTabs: ZentridDetailLazyTabsApi; }

interface ZentridRegistryQueryState {
  entity: 'clients' | 'plants' | 'devices' | 'alerts';
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc' | '';
  params: Record<string, string>;
}
interface ZentridRegistryPaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  server: boolean;
  source?: string;
}
interface ZentridRegistryQueryApi {
  read(entity: 'clients' | 'plants' | 'devices' | 'alerts'): ZentridRegistryQueryState;
  update(entity: 'clients' | 'plants' | 'devices' | 'alerts', patch: Record<string, string | number | boolean | null | undefined>, options?: { replace?: boolean; emit?: boolean }): ZentridRegistryQueryState;
  setPagination(entity: 'clients' | 'plants' | 'devices' | 'alerts', pagination: Partial<ZentridRegistryPaginationState>): ZentridRegistryPaginationState;
  pagination(entity: 'clients' | 'plants' | 'devices' | 'alerts'): ZentridRegistryPaginationState | null;
  pagerHtml(entity: 'clients' | 'plants' | 'devices' | 'alerts', fallbackTotal?: number): string;
  filterScopeHtml(entity: 'clients' | 'plants' | 'devices' | 'alerts'): string;
  activeCurrentPageFilters(entity: 'clients' | 'plants' | 'devices' | 'alerts'): string[];
  supportedPageSizes: number[];
}
declare const ZentridRegistryQuery: ZentridRegistryQueryApi;
interface Window { ZentridRegistryQuery: ZentridRegistryQueryApi; }

interface ZentridRepositoryMapperContext extends ZentridContractMapperContext {
  realDisplayName?(row: ZentridContractRecord, entityLabel: string, typeHint?: unknown): string;
}
interface ZentridRepositoryPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
type ZentridRepositoryCacheState = 'network' | 'fresh' | 'stale' | 'persistent';
interface ZentridRepositoryCacheMeta {
  state: ZentridRepositoryCacheState;
  key: string;
  ageMs: number;
  cachedAt: number;
  updatedAt: string;
  stale: boolean;
  revalidating: boolean;
  fallback: boolean;
}
interface ZentridRepositoryListResult {
  entity: ZentridContractEntity;
  items: ZentridContractRecord[];
  rawItems: ZentridContractRecord[];
  source: string;
  errors: unknown[];
  pagination: ZentridRepositoryPagination;
  cache?: ZentridRepositoryCacheMeta;
}
interface ZentridRepositoryItemResult extends ZentridRepositoryListResult {
  item: ZentridContractRecord | null;
}
interface ZentridRepositoryReadOptions {
  forceRefresh?: boolean;
  maxAgeMs?: number;
  staleMaxAgeMs?: number;
  staleWhileRevalidate?: boolean;
  persist?: boolean;
  requestGroup?: string;
  supersede?: boolean;
  cacheVariant?: string;
  timeoutMs?: number;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}
interface ZentridRepositoryCacheSnapshotEntry {
  entity: ZentridContractEntity;
  cached: boolean;
  persistent: boolean;
  inFlight: boolean;
  activeRequests: number;
  ageMs: number | null;
  ttlMs: number;
  staleMaxAgeMs: number;
  hits: number;
  misses: number;
  deduplicated: number;
  invalidations: number;
  staleHits: number;
  persistentHits: number;
  revalidations: number;
  cancellations: number;
  fallbacks: number;
}
interface ZentridRepositoryCacheApi {
  invalidate(entity?: ZentridContractEntity): void;
  invalidateMany(entities: ZentridContractEntity[]): void;
  snapshot(entity?: ZentridContractEntity): ZentridRepositoryCacheSnapshotEntry[];
  clearPersistent(entity?: ZentridContractEntity): void;
}
interface ZentridRepositoryCoordinatorApi {
  cancel(group: string): void;
  cancelAll(): void;
  snapshot(): Array<{ group: string; entity: ZentridContractEntity; key: string; aborted: boolean }>;
}

interface ZentridDataMutationDetail {
  action: string;
  path: string;
  method: string;
  entities: ZentridContractEntity[];
  completedAt: string;
}
interface ZentridEntityReadRepositoryApi {
  list(options?: ZentridRepositoryReadOptions): Promise<ZentridRepositoryListResult>;
  get(id: string, options?: ZentridRepositoryReadOptions): Promise<ZentridRepositoryItemResult>;
}
interface ZentridIntegrationReadRepositoryApi extends ZentridEntityReadRepositoryApi {
  summary(options?: ZentridRepositoryReadOptions): Promise<ZentridRepositoryListResult>;
}
interface ZentridAPIRepositoriesApi {
  configure(context: ZentridRepositoryMapperContext): void;
  isConfigured(): boolean;
  cache: ZentridRepositoryCacheApi;
  coordinator: ZentridRepositoryCoordinatorApi;
  clients: ZentridEntityReadRepositoryApi;
  tenants: ZentridEntityReadRepositoryApi;
  plants: ZentridEntityReadRepositoryApi;
  devices: ZentridEntityReadRepositoryApi;
  alerts: ZentridEntityReadRepositoryApi;
  telemetry: ZentridEntityReadRepositoryApi;
  integrations: ZentridIntegrationReadRepositoryApi;
}
declare const ZentridAPIRepositories: ZentridAPIRepositoriesApi;
interface Window { ZentridAPIRepositories: ZentridAPIRepositoriesApi; }

interface ZentridTelemetryPageApi {
  readOptions(): { page: number; pageSize: number };
  setLoading(message?: string): void;
  render(result: ZentridRepositoryListResult): void;
  renderFailure(message: string): void;
}
interface Window { ZentridTelemetryPage?: ZentridTelemetryPageApi; }

interface ZentridMutationMeta {
  operationId: string;
  action: string;
  path: string;
  method: string;
  entities: ZentridContractEntity[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}
type ZentridMutationErrorKind = 'timeout' | 'cancelled' | 'unauthorized' | 'forbidden' | 'validation' | 'conflict' | 'rate-limit' | 'server' | 'network' | 'unknown';
interface ZentridMutationNormalizedError {
  kind: ZentridMutationErrorKind;
  message: string;
  status: number;
  code: string;
  path: string;
  retriable: boolean;
}
interface ZentridMutationSuccess<T = unknown> {
  ok: true;
  data: T;
  message: string;
  meta: ZentridMutationMeta;
}
interface ZentridMutationFailure {
  ok: false;
  data: null;
  message: string;
  error: ZentridMutationNormalizedError;
  meta: ZentridMutationMeta;
}
type ZentridMutationResult<T = unknown> = ZentridMutationSuccess<T> | ZentridMutationFailure;
interface ZentridMutationCreateApi {
  create(payload: unknown): Promise<ZentridMutationResult>;
}
interface ZentridAPIMutationsApi {
  run<T>(descriptor: { action: string; path: string; method: string; entities: ZentridContractEntity[]; successMessage: string }, operation: () => Promise<T>): Promise<ZentridMutationResult<T>>;
  isSuccess<T>(result: ZentridMutationResult<T>): result is ZentridMutationSuccess<T>;
  isFailure<T>(result: ZentridMutationResult<T>): result is ZentridMutationFailure;
  unwrap<T>(result: ZentridMutationResult<T>): T;
  clients: ZentridMutationCreateApi;
  tenants: ZentridMutationCreateApi & {
    activate(id: string): Promise<ZentridMutationResult>;
    deactivate(id: string): Promise<ZentridMutationResult>;
    archive(id: string): Promise<ZentridMutationResult>;
  };
  plants: ZentridMutationCreateApi;
  integrations: ZentridMutationCreateApi & {
    validate(id: string): Promise<ZentridMutationResult>;
    testConnection(id: string): Promise<ZentridMutationResult>;
    testSampleData(id: string): Promise<ZentridMutationResult>;
    activate(id: string): Promise<ZentridMutationResult>;
    suspend(id: string): Promise<ZentridMutationResult>;
    archive(id: string): Promise<ZentridMutationResult>;
    failed(id: string): Promise<ZentridMutationResult>;
  };
}
declare const ZentridAPIMutations: ZentridAPIMutationsApi;
interface Window { ZentridAPIMutations: ZentridAPIMutationsApi; }


interface ZentridTenantLifecycleApi {
  render(record: Record<string, unknown>): string;
  wire(record: Record<string, unknown>): void;
  isBackendManaged(record: Record<string, unknown>): boolean;
}

declare const ZentridTenantLifecycle: ZentridTenantLifecycleApi;
interface Window { ZentridTenantLifecycle: ZentridTenantLifecycleApi; }


interface ZentridApiDiagnosticPagination {
  page: number | null;
  pageSize: number | null;
  totalCount: number | null;
  totalPages: number | null;
}
interface ZentridApiDiagnosticEndpoint {
  key: string;
  path: string;
  method: string;
  capturedAt: string;
  ok: boolean;
  status: number | string;
  durationMs: number;
  responseBytes: number;
  rows: number | null;
  pagination: ZentridApiDiagnosticPagination;
  contentType: string;
  requestId: string;
  shapeHash: string;
  shape: string[];
}
interface ZentridApiDiagnosticDelta {
  available: boolean;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
  durationDeltaMs: number;
  responseBytesDelta: number;
  rowsDelta: number | null;
  statusChanged: boolean;
  shapeChanged: boolean;
  summary: string;
}
interface ZentridApiDiagnosticsApi {
  endpointKey(result: Pick<ZentridRawRequestResult, 'method' | 'path'>): string;
  pagination(value: unknown): ZentridApiDiagnosticPagination;
  redact(value: unknown): unknown;
  shape(value: unknown): string[];
  hash(input: string): string;
  endpoint(result: ZentridRawRequestResult): ZentridApiDiagnosticEndpoint;
  compare(current: ZentridApiDiagnosticEndpoint, previous?: ZentridApiDiagnosticEndpoint): ZentridApiDiagnosticDelta;
  captureRun(results: ZentridRawRequestResult[]): Record<string, ZentridApiDiagnosticDelta>;
  safeSnapshot(result: ZentridRawRequestResult): Record<string, unknown>;
  diagnosticsText(result: ZentridRawRequestResult, delta?: ZentridApiDiagnosticDelta): string;
  clear(): void;
  contractCatalog: Array<{ entity: string; fixture: string; endpoint: string }>;
}
declare const ZentridAPIDiagnostics: ZentridApiDiagnosticsApi;
interface Window { ZentridAPIDiagnostics: ZentridApiDiagnosticsApi; }

interface ZentridRuntimeStabilitySnapshot {
  timers: number;
  frames: number;
  idles: number;
  cleanups: number;
  longTasks: number;
  longTaskDurationMs: number;
}
interface ZentridRuntimeStabilityApi {
  debounce(key: string, callback: () => void, delayMs?: number): void;
  frame(key: string, callback: () => void): void;
  idle(key: string, callback: () => void, timeout?: number): void;
  replaceHtml(container: HTMLElement, html: string): void;
  registerCleanup(key: string, cleanup: () => void): void;
  unregisterCleanup(key: string): void;
  dispose(): void;
  snapshot(): ZentridRuntimeStabilitySnapshot;
}
declare const ZentridRuntimeStability: ZentridRuntimeStabilityApi;
interface Window { ZentridRuntimeStability: ZentridRuntimeStabilityApi; }

type ZentridFreshnessStatus = 'live' | 'cached' | 'refreshing' | 'stale' | 'partial' | 'unavailable';
type ZentridFreshnessResource = 'overview' | 'clients' | 'tenants' | 'plants' | 'devices' | 'alerts' | 'telemetry' | 'integrations' | 'client-detail' | 'tenant-detail' | 'plant-detail' | 'device-detail' | 'alert-detail' | 'integration-detail' | 'unknown';
interface ZentridFreshnessSyncInput {
  liveState: string;
  title?: string;
  message?: string;
  source?: string;
  details?: string;
  updatedAt?: string;
  cacheAgeMs?: number;
  status?: ZentridFreshnessStatus;
  resource?: ZentridFreshnessResource;
}
interface ZentridFreshnessSnapshot {
  resource: ZentridFreshnessResource;
  status: ZentridFreshnessStatus;
  updatedAt: string | null;
  ageMs: number | null;
  autoRefreshMs: number;
  refreshing: boolean;
  source: string;
  details: string;
  online: boolean;
  visible: boolean;
}
interface ZentridDataFreshnessApi {
  sync(input: ZentridFreshnessSyncInput): ZentridFreshnessSnapshot;
  markRefreshComplete(success?: boolean): void;
  requestRefresh(reason: 'manual' | 'retry' | 'auto'): void;
  setAutoRefresh(intervalMs: number): void;
  snapshot(resource?: ZentridFreshnessResource): ZentridFreshnessSnapshot;
  inferResource(): ZentridFreshnessResource;
  intervals: number[];
}
declare const ZentridDataFreshness: ZentridDataFreshnessApi;
interface Window { ZentridDataFreshness: ZentridDataFreshnessApi; }


type ZentridFormReadinessMode = 'api' | 'local' | 'unavailable' | 'readonly';
interface ZentridFormReadinessIssue { field: string; message: string; code: string; }
interface ZentridFormFileDescriptor { field: string; name: string; type: string; size: number; lastModified: number; }
interface ZentridFormSerialization {
  payload: Record<string, unknown>;
  files: ZentridFormFileDescriptor[];
  issues: ZentridFormReadinessIssue[];
  meta: { formId: string; contract: string; mode: ZentridFormReadinessMode; endpoint: string; method: string; serializedAt: string; fieldCount: number; };
}
interface ZentridFormReadinessSnapshot { formId: string; contract: string; mode: ZentridFormReadinessMode; endpoint: string; method: string; dirty: boolean; issueCount: number; fileCount: number; }
interface ZentridFormReadinessApi {
  enhance(form: HTMLFormElement): void;
  enhanceAll(root?: ParentNode): void;
  isDirty(form: HTMLFormElement): boolean;
  markCommitted(form: HTMLFormElement): void;
  serialize(form: HTMLFormElement): ZentridFormSerialization;
  setMode(form: HTMLFormElement, mode: ZentridFormReadinessMode, note?: string): void;
  snapshot(): ZentridFormReadinessSnapshot[];
  updatePreview(form: HTMLFormElement): ZentridFormSerialization;
  validate(form: HTMLFormElement): ZentridFormSerialization;
}
interface Window { ZentridFormReadiness: ZentridFormReadinessApi; }

interface ZentridSessionResilienceSnapshot {
  tabId: string;
  online: boolean;
  channel: 'broadcast-channel' | 'storage-fallback';
  retriesObserved: number;
  lastEvent: string;
  lastEventAt: string | null;
}
interface ZentridSessionResilienceApi {
  snapshot(): ZentridSessionResilienceSnapshot;
  broadcastInvalidation(entities: ZentridContractEntity[]): void;
  dispose(): void;
}
declare const ZentridSessionResilience: ZentridSessionResilienceApi;
interface Window { ZentridSessionResilience: ZentridSessionResilienceApi; }


interface ZentridReleaseManifest {
  schemaVersion: number;
  app: string;
  version: string;
  release: string;
  channel: string;
  environment: string;
  target: string;
  buildId: string;
  builtAt: string;
  commit: string | null;
  commitShort: string | null;
}
interface ZentridReleaseSnapshot {
  release: ZentridReleaseManifest;
  collectedAt: string;
  health: 'healthy' | 'attention' | 'offline';
  route: string;
  online: boolean;
  visibility: DocumentVisibilityState;
  viewport: { width: number; height: number; devicePixelRatio: number };
  browser: { userAgent: string; language: string; timezone: string };
  authentication: { authenticated: boolean; roles: string[]; expired: boolean };
  navigation: Record<string, unknown>;
  paint: Record<string, number>;
  resources: Record<string, unknown>;
  storage: { localKeys: number; sessionKeys: number };
  runtime: unknown;
  session: unknown;
  security: unknown;
  freshness: unknown;
  forms: unknown;
  contractDiagnostics: unknown;
  fieldAudit: unknown;
  recentIssues: Array<Record<string, unknown>>;
  recentEvents: Array<Record<string, unknown>>;
}
interface ZentridReleaseObservabilityApi {
  snapshot(): ZentridReleaseSnapshot;
  copySafeReport(): Promise<boolean>;
  downloadReport(): void;
  openPanel(): void;
  closePanel(): void;
  checkForUpdate(manual?: boolean): Promise<boolean>;
  clearIssues(): void;
  manifest(): ZentridReleaseManifest;
}
declare const ZentridReleaseObservability: ZentridReleaseObservabilityApi;
interface Window { ZentridReleaseObservability: ZentridReleaseObservabilityApi; }


interface ZentridBrowserSecurityFinding {
  area: 'localStorage' | 'sessionStorage';
  key: string;
  classification: 'persistent-secret' | 'session-secret';
}
interface ZentridBrowserSecuritySnapshot {
  policy: 'enforced-compatible';
  anchorsAudited: number;
  anchorsHardened: number;
  unsafeUrlsBlocked: number;
  formsAudited: number;
  unsafeFormActionsBlocked: number;
  inlineHandlers: number;
  inlineStyles: number;
  cspViolations: number;
  storageFindings: ZentridBrowserSecurityFinding[];
  authStorage: 'sessionStorage' | 'fallback';
  referrerPolicy: string;
}
interface ZentridBrowserSecurityApi {
  audit(root?: ParentNode): void;
  snapshot(): ZentridBrowserSecuritySnapshot;
  openExternal(url: string): WindowProxy | null;
  isUnsafeUrl(url: string): boolean;
}
declare const ZentridBrowserSecurity: ZentridBrowserSecurityApi;
interface Window { ZentridBrowserSecurity: ZentridBrowserSecurityApi; }
