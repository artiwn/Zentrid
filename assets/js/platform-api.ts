type ZentridHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | string;

type ZentridQueryParams = Record<string, string | number | boolean | null | undefined>;

type ZentridJsonOptions = {
  method: ZentridHttpMethod;
  body?: string;
};

type ZentridRawRequestOptions = {
  method?: ZentridHttpMethod;
  headers?: HeadersInit;
  body?: unknown;
};

type ZentridRawRequestResult = {
  ok: boolean;
  status: number | string;
  statusText: string;
  ms: number;
  path: string;
  method: string;
  source: string;
  count: number | null;
  data: unknown;
  bodyText?: string;
  error: string;
  skipped?: boolean;
  responseBytes?: number;
  contentType?: string;
  requestId?: string;
  pagination?: ZentridApiDiagnosticPagination;
};

type ZentridEndpointCatalogItem = {
  group: string;
  label: string;
  method: ZentridHttpMethod;
  path: string;
  safe: boolean;
  used: boolean;
  notes: string;
};

type ZentridMutationEntity = 'clients' | 'tenants' | 'plants' | 'devices' | 'alerts' | 'integrations';

type ZentridPlatformModule = {
  list(): Promise<unknown>;
  get(id: string): Promise<unknown>;
  create(payload: unknown): Promise<unknown>;
};

type ZentridPlatformAPIShape = {
  auth: {
    me(): Promise<unknown>;
    validate(): Promise<unknown>;
    refresh(): Promise<ZentridSession>;
    logout(): Promise<unknown>;
    session(): ZentridSession;
    jwks(): Promise<unknown>;
  };
  live: {
    plants(options?: ZentridRequestOptions): Promise<unknown>;
    devices(options?: ZentridRequestOptions): Promise<unknown>;
    alerts(options?: ZentridRequestOptions): Promise<unknown>;
    integrations(options?: ZentridRequestOptions): Promise<unknown>;
    providers(options?: ZentridRequestOptions): Promise<unknown>;
  };
  tenants: ZentridPlatformModule & {
    activate(id: string): Promise<unknown>;
    deactivate(id: string): Promise<unknown>;
    archive(id: string): Promise<unknown>;
  };
  clients: ZentridPlatformModule;
  plantRegistry: ZentridPlatformModule;
  providerIntegrations: {
    templates(): Promise<unknown>;
    template(providerType: string): Promise<unknown>;
    list(): Promise<unknown>;
    get(id: string): Promise<unknown>;
    create(payload: unknown): Promise<unknown>;
    validate(id: string): Promise<unknown>;
    testConnection(id: string): Promise<unknown>;
    testSampleData(id: string): Promise<unknown>;
    activate(id: string): Promise<unknown>;
    suspend(id: string): Promise<unknown>;
    archive(id: string): Promise<unknown>;
    failed(id: string): Promise<unknown>;
  };
  endpointCatalog: ZentridEndpointCatalogItem[];
  allowedEndpointPatterns: RegExp[];
  isAllowedPath(path: string): boolean;
  checkCatalog(options?: { includeUnsafe?: boolean }): Promise<Array<ZentridEndpointCatalogItem & ZentridRawRequestResult>>;
  checkAllReadEndpoints(): Promise<Array<ZentridEndpointCatalogItem & ZentridRawRequestResult>>;
  rawRequest(path: string, options?: ZentridRawRequestOptions): Promise<ZentridRawRequestResult>;
  qs(params?: ZentridQueryParams): string;
};

/* Zentrid Platform/Admin API layer
   Scope is locked to the Swagger endpoints currently provided by backend. */
const ZentridPlatformAPI: ZentridPlatformAPIShape = (() => {
  const allowedEndpointPatterns: RegExp[] = [
    /^\/api\/Auth\/(login|register|refresh|logout|me|validate)$/,
    /^\/\.well-known\/jwks\.json$/,
    /^\/api\/admin\/clients(?:\/[^/]+)?$/,
    /^\/api\/admin\/plants(?:\/[^/]+)?$/,
    /^\/api\/admin\/tenants(?:\/[^/]+)?(?:\/(activate|deactivate|archive))?$/,
    /^\/api\/alerts$/,
    /^\/api\/devices$/,
    /^\/api\/integrations$/,
    /^\/api\/plants$/,
    /^\/api\/Providers$/,
    /^\/api\/admin\/provider-integrations$/,
    /^\/api\/admin\/provider-integrations\/templates(?:\/[^/]+)?$/,
    /^\/api\/admin\/provider-integrations\/[^/]+(?:\/(validate|test-connection|test-sample-data|activate|suspend|archive|failed))?$/
  ];

  function isAllowedPath(path: string): boolean {
    const cleanPath = String(path || '').split('?')[0] ?? '';
    return allowedEndpointPatterns.some((pattern) => pattern.test(cleanPath));
  }

  function qs(params: ZentridQueryParams = {}): string {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      search.set(key, String(value));
    });
    const text = search.toString();
    return text ? `?${text}` : '';
  }

  function jsonOptions(method: ZentridHttpMethod, body?: unknown): ZentridJsonOptions {
    return {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body || {}) })
    };
  }

  async function mutationRequest<T = unknown>(
    path: string,
    options: ZentridRequestOptions,
    entities: ZentridMutationEntity[],
    action: string
  ): Promise<T> {
    const result = await ZentridAPI.request<T>(path, options);
    const detail: ZentridDataMutationDetail = {
      action,
      path,
      method: String(options.method || 'POST').toUpperCase(),
      entities: [...new Set(entities)],
      completedAt: new Date().toISOString()
    };
    window.dispatchEvent(new CustomEvent<ZentridDataMutationDetail>('zentrid:data-mutated', { detail }));
    return result;
  }

  function sourceLabel(): string {
    return ZentridConfig.isLocalFrontend() ? 'Local proxy' : 'Vercel proxy';
  }

  function resolveApiUrl(path: string): string {
    const base = ZentridConfig.apiBaseUrl || '';
    return `${base}${path}`;
  }

  function authHeaders({ body, extraHeaders }: { body?: unknown; extraHeaders?: HeadersInit } = {}): Headers {
    const headers = new Headers(extraHeaders || {});
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (body !== undefined && body !== null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const token = ZentridAuth.getAccessToken();
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  function collectionCount(value: unknown): number | null {
    if (Array.isArray(value)) return value.length;
    if (!isRecord(value)) return null;
    const items = value.items;
    const data = value.data;
    if (Array.isArray(items)) return items.length;
    if (Array.isArray(data)) return data.length;
    return null;
  }

  async function rawRequest(path: string, options: ZentridRawRequestOptions = {}): Promise<ZentridRawRequestResult> {
    const method = String(options.method || 'GET').toUpperCase();
    const body = options.body;
    const started = performance.now();

    if (!isAllowedPath(path)) {
      return {
        ok: false,
        status: 0,
        statusText: 'Endpoint not in active Swagger scope',
        ms: 0,
        path,
        method,
        source: sourceLabel(),
        count: null,
        data: null,
        bodyText: '',
        error: 'This endpoint was removed from the active frontend API layer because it is not present in the provided Swagger snapshot.'
      };
    }

    const headers = authHeaders({ body, ...(options.headers !== undefined ? { extraHeaders: options.headers } : {}) });
    let parsedBody: unknown = null;
    let responseText = '';
    try {
      const requestBody = body === undefined || body === null || method === 'GET' || method === 'HEAD'
        ? undefined
        : (typeof body === 'string' ? body : JSON.stringify(body));
      const response = await fetch(resolveApiUrl(path), {
        method,
        headers,
        ...(requestBody !== undefined ? { body: requestBody } : {})
      });
      responseText = await response.text();
      try { parsedBody = responseText ? JSON.parse(responseText) : null; } catch (e) { parsedBody = responseText; }
      const ms = Math.round(performance.now() - started);
      const responseBytes = typeof TextEncoder === 'undefined' ? responseText.length : new TextEncoder().encode(responseText).length;
      const contentType = response.headers.get('content-type') || '';
      const requestId = response.headers.get('x-request-id') || response.headers.get('request-id') || response.headers.get('traceparent') || response.headers.get('x-correlation-id') || '';
      const responsePagination = typeof ZentridAPIDiagnostics === 'undefined'
        ? { page: null, pageSize: null, totalCount: null, totalPages: null }
        : ZentridAPIDiagnostics.pagination(parsedBody);
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText || '',
        ms,
        path,
        method,
        source: sourceLabel(),
        count: collectionCount(parsedBody),
        data: parsedBody,
        bodyText: responseText,
        error: response.ok ? '' : `${response.statusText || 'Request failed'} (${response.status})`,
        responseBytes,
        contentType,
        requestId,
        pagination: responsePagination
      };
    } catch (error) {
      const ms = Math.round(performance.now() - started);
      return {
        ok: false,
        status: 0,
        statusText: 'Network/Fetch Error',
        ms,
        path,
        method,
        source: sourceLabel(),
        count: null,
        data: null,
        bodyText: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  const auth = {
    me: () => ZentridAuth.me(),
    validate: () => ZentridAuth.validate(),
    refresh: () => ZentridAuth.refresh(),
    logout: () => ZentridAuth.request('/api/Auth/logout', { method: 'POST' }),
    session: () => ZentridAuth.getSession(),
    jwks: () => ZentridAPI.request('/.well-known/jwks.json')
  };

  const live = {
    plants: (options: ZentridRequestOptions = {}) => ZentridAPI.request('/api/plants', options),
    devices: (options: ZentridRequestOptions = {}) => ZentridAPI.request('/api/devices', options),
    alerts: (options: ZentridRequestOptions = {}) => ZentridAPI.request('/api/alerts', options),
    integrations: (options: ZentridRequestOptions = {}) => ZentridAPI.request('/api/integrations', options),
    providers: (options: ZentridRequestOptions = {}) => ZentridAPI.request('/api/Providers', options)
  };

  const tenants = {
    list: () => ZentridAPI.request('/api/admin/tenants'),
    get: (id: string) => ZentridAPI.request(`/api/admin/tenants/${encodeURIComponent(id)}`),
    create: (payload: unknown) => mutationRequest('/api/admin/tenants', jsonOptions('POST', payload), ['tenants'], 'tenant.create'),
    activate: (id: string) => mutationRequest(`/api/admin/tenants/${encodeURIComponent(id)}/activate`, { method: 'POST' }, ['tenants'], 'tenant.activate'),
    deactivate: (id: string) => mutationRequest(`/api/admin/tenants/${encodeURIComponent(id)}/deactivate`, { method: 'POST' }, ['tenants'], 'tenant.deactivate'),
    archive: (id: string) => mutationRequest(`/api/admin/tenants/${encodeURIComponent(id)}/archive`, { method: 'POST' }, ['tenants'], 'tenant.archive')
  };

  const clients = {
    list: () => ZentridAPI.request('/api/admin/clients'),
    get: (id: string) => ZentridAPI.request(`/api/admin/clients/${encodeURIComponent(id)}`),
    create: (payload: unknown) => mutationRequest('/api/admin/clients', jsonOptions('POST', payload), ['clients'], 'client.create')
  };

  const plantRegistry = {
    list: () => ZentridAPI.request('/api/admin/plants'),
    get: (id: string) => ZentridAPI.request(`/api/admin/plants/${encodeURIComponent(id)}`),
    create: (payload: unknown) => mutationRequest('/api/admin/plants', jsonOptions('POST', payload), ['plants'], 'plant.create')
  };

  const providerIntegrations = {
    templates: () => ZentridAPI.request('/api/admin/provider-integrations/templates'),
    template: (providerType: string) => ZentridAPI.request(`/api/admin/provider-integrations/templates/${encodeURIComponent(providerType)}`),
    list: () => ZentridAPI.request('/api/admin/provider-integrations'),
    get: (id: string) => ZentridAPI.request(`/api/admin/provider-integrations/${encodeURIComponent(id)}`),
    create: (payload: unknown) => mutationRequest('/api/admin/provider-integrations', jsonOptions('POST', payload), ['integrations'], 'integration.create'),
    validate: (id: string) => mutationRequest(`/api/admin/provider-integrations/${encodeURIComponent(id)}/validate`, { method: 'POST' }, ['integrations'], 'integration.validate'),
    testConnection: (id: string) => mutationRequest(`/api/admin/provider-integrations/${encodeURIComponent(id)}/test-connection`, { method: 'POST' }, ['integrations'], 'integration.test-connection'),
    testSampleData: (id: string) => mutationRequest(`/api/admin/provider-integrations/${encodeURIComponent(id)}/test-sample-data`, { method: 'POST' }, ['integrations'], 'integration.test-sample-data'),
    activate: (id: string) => mutationRequest(`/api/admin/provider-integrations/${encodeURIComponent(id)}/activate`, { method: 'POST' }, ['integrations', 'plants', 'devices', 'alerts'], 'integration.activate'),
    suspend: (id: string) => mutationRequest(`/api/admin/provider-integrations/${encodeURIComponent(id)}/suspend`, { method: 'POST' }, ['integrations', 'plants', 'devices', 'alerts'], 'integration.suspend'),
    archive: (id: string) => mutationRequest(`/api/admin/provider-integrations/${encodeURIComponent(id)}/archive`, { method: 'POST' }, ['integrations', 'plants', 'devices', 'alerts'], 'integration.archive'),
    failed: (id: string) => mutationRequest(`/api/admin/provider-integrations/${encodeURIComponent(id)}/failed`, { method: 'POST' }, ['integrations', 'plants', 'devices', 'alerts'], 'integration.failed')
  };

  const endpointCatalog: ZentridEndpointCatalogItem[] = [
    { group: 'Auth', label: 'Login', method: 'POST', path: '/api/Auth/login', safe: false, used: true, notes: 'Used by login page.' },
    { group: 'Auth', label: 'Register', method: 'POST', path: '/api/Auth/register', safe: false, used: false, notes: 'Manual only. Creates a user/account.' },
    { group: 'Auth', label: 'Refresh Token', method: 'POST', path: '/api/Auth/refresh', safe: false, used: true, notes: 'Manual only. Refreshes session.' },
    { group: 'Auth', label: 'Logout', method: 'POST', path: '/api/Auth/logout', safe: false, used: true, notes: 'Manual only. Ends backend session.' },
    { group: 'Auth', label: 'Current User', method: 'GET', path: '/api/Auth/me', safe: true, used: true, notes: 'Returns current authenticated user/profile.' },
    { group: 'Auth', label: 'Validate Token', method: 'POST', path: '/api/Auth/validate', safe: true, used: true, notes: 'Validates current Bearer token.' },
    { group: 'Jwks', label: 'JWKS', method: 'GET', path: '/.well-known/jwks.json', safe: true, used: false, notes: 'Public JSON Web Key Set endpoint.' },

    { group: 'Clients', label: 'List Clients', method: 'GET', path: '/api/admin/clients', safe: true, used: true, notes: 'Global Admin client registry list.' },
    { group: 'Clients', label: 'Create Client', method: 'POST', path: '/api/admin/clients', safe: false, used: false, notes: 'Manual only. Creates a client.' },
    { group: 'Clients', label: 'Get Client by ID', method: 'GET', path: '/api/admin/clients/{id}', safe: false, used: false, notes: 'Manual only. Requires client id.' },

    { group: 'PlantRegistry', label: 'List Admin Plants', method: 'GET', path: '/api/admin/plants', safe: true, used: true, notes: 'Admin plant registry list.' },
    { group: 'PlantRegistry', label: 'Create Admin Plant', method: 'POST', path: '/api/admin/plants', safe: false, used: false, notes: 'Manual only. Creates a plant.' },
    { group: 'PlantRegistry', label: 'Get Admin Plant by ID', method: 'GET', path: '/api/admin/plants/{id}', safe: false, used: false, notes: 'Manual only. Requires plant id.' },

    { group: 'Platform Live API', label: 'Live Alerts', method: 'GET', path: '/api/alerts', safe: true, used: true, notes: 'Returns normalized alert list.' },
    { group: 'Platform Live API', label: 'Live Devices', method: 'GET', path: '/api/devices', safe: true, used: true, notes: 'Returns normalized device list.' },
    { group: 'Platform Live API', label: 'Live Integrations', method: 'GET', path: '/api/integrations', safe: true, used: true, notes: 'Returns provider integration summary list.' },
    { group: 'Platform Live API', label: 'Live Plants', method: 'GET', path: '/api/plants', safe: true, used: true, notes: 'Returns normalized plant list.' },
    { group: 'Platform Live API', label: 'Providers', method: 'GET', path: '/api/Providers', safe: true, used: true, notes: 'Returns provider registry.' },

    { group: 'ProviderIntegrations', label: 'List Provider Templates', method: 'GET', path: '/api/admin/provider-integrations/templates', safe: true, used: true, notes: 'Returns available provider template names.' },
    { group: 'ProviderIntegrations', label: 'Provider Template by Type', method: 'GET', path: '/api/admin/provider-integrations/templates/{providerType}', safe: false, used: false, notes: 'Manual only. Requires provider type.' },
    { group: 'ProviderIntegrations', label: 'List Provider Integrations', method: 'GET', path: '/api/admin/provider-integrations', safe: true, used: true, notes: 'Provider integration registry list.' },
    { group: 'ProviderIntegrations', label: 'Create Provider Integration', method: 'POST', path: '/api/admin/provider-integrations', safe: false, used: false, notes: 'Manual only. Creates provider integration.' },
    { group: 'ProviderIntegrations', label: 'Get Provider Integration by ID', method: 'GET', path: '/api/admin/provider-integrations/{id}', safe: false, used: false, notes: 'Manual only. Requires provider integration id.' },
    { group: 'ProviderIntegrations', label: 'Validate Provider Integration', method: 'POST', path: '/api/admin/provider-integrations/{id}/validate', safe: false, used: false, notes: 'Manual only. Requires provider integration id.' },
    { group: 'ProviderIntegrations', label: 'Test Provider Connection', method: 'POST', path: '/api/admin/provider-integrations/{id}/test-connection', safe: false, used: false, notes: 'Manual only. Requires provider integration id.' },
    { group: 'ProviderIntegrations', label: 'Test Provider Sample Data', method: 'POST', path: '/api/admin/provider-integrations/{id}/test-sample-data', safe: false, used: false, notes: 'Manual only. Requires provider integration id.' },
    { group: 'ProviderIntegrations', label: 'Activate Provider Integration', method: 'POST', path: '/api/admin/provider-integrations/{id}/activate', safe: false, used: false, notes: 'Manual only. Lifecycle write action.' },
    { group: 'ProviderIntegrations', label: 'Suspend Provider Integration', method: 'POST', path: '/api/admin/provider-integrations/{id}/suspend', safe: false, used: false, notes: 'Manual only. Lifecycle write action.' },
    { group: 'ProviderIntegrations', label: 'Archive Provider Integration', method: 'POST', path: '/api/admin/provider-integrations/{id}/archive', safe: false, used: false, notes: 'Manual only. Lifecycle write action.' },
    { group: 'ProviderIntegrations', label: 'Mark Provider Integration Failed', method: 'POST', path: '/api/admin/provider-integrations/{id}/failed', safe: false, used: false, notes: 'Manual only. Lifecycle/error-state write action.' },

    { group: 'Tenants', label: 'List Tenants', method: 'GET', path: '/api/admin/tenants', safe: true, used: true, notes: 'Global Admin tenant registry list.' },
    { group: 'Tenants', label: 'Create Tenant', method: 'POST', path: '/api/admin/tenants', safe: false, used: false, notes: 'Manual only. Creates tenant.' },
    { group: 'Tenants', label: 'Get Tenant by ID', method: 'GET', path: '/api/admin/tenants/{id}', safe: false, used: false, notes: 'Manual only. Requires tenant id.' },
    { group: 'Tenants', label: 'Activate Tenant', method: 'POST', path: '/api/admin/tenants/{id}/activate', safe: false, used: false, notes: 'Manual only. Lifecycle write action.' },
    { group: 'Tenants', label: 'Deactivate Tenant', method: 'POST', path: '/api/admin/tenants/{id}/deactivate', safe: false, used: false, notes: 'Manual only. Lifecycle write action.' },
    { group: 'Tenants', label: 'Archive Tenant', method: 'POST', path: '/api/admin/tenants/{id}/archive', safe: false, used: false, notes: 'Manual only. Lifecycle write action.' }
  ];

  async function checkCatalog({ includeUnsafe = false }: { includeUnsafe?: boolean } = {}): Promise<Array<ZentridEndpointCatalogItem & ZentridRawRequestResult>> {
    const checks = endpointCatalog.filter(item => item.safe || includeUnsafe);
    const results: Array<ZentridEndpointCatalogItem & ZentridRawRequestResult> = [];
    for (const endpoint of checks) {
      if (!endpoint.safe || endpoint.path.includes('{')) {
        results.push({ ...endpoint, ok: false, skipped: true, status: 'Skipped', statusText: 'Skipped', ms: 0, count: null, data: null, error: 'Manual endpoint. Use Manual Request Runner with concrete id/body.', path: endpoint.path, method: String(endpoint.method), source: sourceLabel() });
        continue;
      }
      const result = await rawRequest(endpoint.path, { method: endpoint.method });
      results.push({ ...endpoint, ...result });
    }
    return results;
  }

  async function checkAllReadEndpoints(): Promise<Array<ZentridEndpointCatalogItem & ZentridRawRequestResult>> {
    return checkCatalog({ includeUnsafe: false });
  }

  return {
    auth,
    live,
    tenants,
    clients,
    plantRegistry,
    providerIntegrations,
    endpointCatalog,
    allowedEndpointPatterns,
    isAllowedPath,
    checkCatalog,
    checkAllReadEndpoints,
    rawRequest,
    qs
  };
})();

window.ZentridPlatformAPI = ZentridPlatformAPI;
