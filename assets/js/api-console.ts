type ApiConsoleResult = ZentridRawRequestResult & {
  label?: string;
  group?: string;
  notes?: string;
  skipped?: boolean;
};

type ApiGroupSummary = {
  total: number;
  ok: number;
  error: number;
  skipped: number;
};

type AuthEndpointKind = 'me' | 'validate' | 'refresh';

let zentridApiResults: ApiConsoleResult[] = [];
let zentridManualResult: ApiConsoleResult | null = null;
let zentridAuthResult: ApiConsoleResult | null = null;
let zentridApiDeltas: Record<string, ZentridApiDiagnosticDelta> = {};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function apiStatusClass(result: ApiConsoleResult): string {
  if (result.skipped) return 'warning';
  if (result.ok) return 'success';
  if (result.status === 401 || result.status === 403) return 'warning';
  return 'danger';
}

function apiStatusText(result: ApiConsoleResult): string {
  if (result.skipped) return 'Skipped';
  if (result.ok) return 'OK';
  if (result.status) return `Error ${result.status}`;
  return 'Fetch Error';
}

function apiStatusBadge(result: ApiConsoleResult): string {
  return `<span class="badge ${apiStatusClass(result)}">${apiStatusText(result)}</span>`;
}

function apiRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function apiPretty(value: unknown): string {
  try { return JSON.stringify(value, null, 2); } catch (e) { return String(value); }
}

function apiPreviewData(result: ApiConsoleResult): unknown {
  if (!result.ok) return result.bodyText || result.error || result.statusText || 'No response body';
  if (Array.isArray(result.data)) return result.data.slice(0, 3);
  return result.data;
}


function apiArray(value: unknown, depth = 0): ZentridContractRecord[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object' && !Array.isArray(item)) as ZentridContractRecord[];
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  for (const key of ['items', 'data', 'records', 'rows', 'results', 'content', 'telemetry', 'measurements', 'points', 'samples', 'value', 'values']) {
    if (Array.isArray(row[key])) return apiArray(row[key], depth + 1);
  }
  for (const key of ['data', 'result', 'payload']) {
    if (!row[key] || typeof row[key] !== 'object' || Array.isArray(row[key])) continue;
    const nested = apiArray(row[key], depth + 1);
    if (nested.length) return nested;
  }
  return [];
}

function apiFieldAuditEntity(path: string): ZentridContractEntity | null {
  if (/\/api\/admin\/clients(?:\?|$)/i.test(path)) return 'clients';
  if (/\/api\/admin\/tenants(?:\?|$)/i.test(path)) return 'tenants';
  if (/\/api\/admin\/plants(?:\?|$)/i.test(path) || /\/api\/plants(?:\?|$)/i.test(path)) return 'plants';
  if (/\/api\/devices(?:\?|$)/i.test(path)) return 'devices';
  if (/\/api\/alerts(?:\?|$)/i.test(path)) return 'alerts';
  if (/\/api\/telemetry(?:\?|$)/i.test(path)) return 'telemetry';
  if (/\/api\/admin\/provider-integrations(?:\?|$)/i.test(path) || /\/api\/integrations(?:\?|$)/i.test(path)) return 'integrations';
  return null;
}

function apiAuditFirstOf(row: ZentridContractRecord, keys: string[], fallback: unknown = ''): unknown {
  for (const key of keys) {
    let value: unknown = row;
    for (const part of key.split('.')) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) { value = undefined; break; }
      value = (value as ZentridContractRecord)[part];
    }
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

const apiFieldAuditContext: ZentridContractMapperContext = {
  safeText(value, fallback = '—') { return value === undefined || value === null || value === '' ? String(fallback) : String(value); },
  firstOf: apiAuditFirstOf,
  displayName(row, keys, entityLabel, index, typeHint) {
    const value = apiAuditFirstOf(row, keys, '');
    return value === '' ? `${String(typeHint || entityLabel)} ${index + 1}` : String(value);
  },
  formatDate(value, fallback = 'No data') { return value ? String(value) : fallback; },
  integrationVendor(value) {
    const text = String(value || '').trim();
    if (/deye/i.test(text)) return 'DeyeCloud';
    if (/solax/i.test(text)) return 'SolaX';
    return text || 'Unknown';
  },
  integrationSoftware(value) {
    const vendor = String(value || '').trim();
    return /solax/i.test(vendor) ? 'SolaX Cloud' : vendor || 'Unknown';
  }
};

function runApiFieldAudit(results: ApiConsoleResult[]): ZentridFieldAuditSummary | null {
  if (typeof ZentridAPIContracts === 'undefined' || !ZentridAPIContracts.fieldAudit) return null;
  ZentridAPIContracts.fieldAudit.clear();
  const offsets = new Map<ZentridContractEntity, number>();
  results.forEach(result => {
    if (!result.ok) return;
    const entity = apiFieldAuditEntity(result.path || '');
    if (!entity) return;
    const rows = apiArray(result.data);
    const contract = ZentridAPIContracts[entity];
    let offset = offsets.get(entity) || 0;
    rows.forEach((row, rowIndex) => contract.map(row, offset + rowIndex, apiFieldAuditContext));
    offsets.set(entity, offset + rows.length);
  });
  return ZentridAPIContracts.fieldAudit.summary();
}

function apiFieldAuditPanel(): string {
  if (typeof ZentridAPIContracts === 'undefined' || !ZentridAPIContracts.fieldAudit) {
    return '<div class="empty-state"><strong>Field audit unavailable</strong><small>The mapping audit module is not loaded.</small></div>';
  }
  const summary = ZentridAPIContracts.fieldAudit.summary();
  if (!summary.records) return '<div class="empty-state"><strong>No mapped API records yet</strong><small>Run safe endpoint diagnostics to audit backend fields against Zentrid UI mappings.</small></div>';
  const rows = summary.byEntity.map(item => `<div class="data-row">
    <strong>${escapeHtml(item.entity)}</strong>
    <span>${item.records}</span>
    <span>${item.mappedFields}/${item.rawFields}</span>
    <span>${item.fallbackFields}</span>
    <span class="${item.missingExpectedFields ? 'api-audit-danger' : ''}">${item.missingExpectedFields}</span>
    <span class="${item.unmappedFields ? 'api-audit-warning' : ''}">${item.unmappedFields}</span>
  </div>`).join('');
  const details = summary.affectedEntities.map(entity => {
    const records = ZentridAPIContracts.fieldAudit.list(entity);
    const missing = [...new Set(records.flatMap(record => record.missingExpectedFields))];
    const unmapped = [...new Set(records.flatMap(record => record.unmappedFields))];
    const manifest = ZentridAPIContracts.fieldAudit.manifest(entity) as ZentridFieldMappingDefinition[];
    const manifestRows = manifest.map(item => `<div class="api-field-map-row">
      <strong>${escapeHtml(item.canonicalField)}</strong>
      <span>${escapeHtml(item.aliases.join(' · '))}</span>
      <span>${escapeHtml(item.uiTargets.join(' · '))}</span>
      <span>${escapeHtml(item.format)}</span>
      <span>${escapeHtml(item.fallback || 'None')}</span>
    </div>`).join('');
    return `<details class="api-field-audit-details">
      <summary>${escapeHtml(entity)} · ${manifest.length} canonical field(s)</summary>
      <p class="muted">Missing expected: ${escapeHtml(missing.join(', ') || 'none')} · Unmapped source fields: ${escapeHtml(unmapped.join(', ') || 'none')}</p>
      <div class="api-field-map-table"><div class="api-field-map-head"><span>Canonical</span><span>Backend aliases</span><span>UI targets</span><span>Format</span><span>Fallback</span></div>${manifestRows}</div>
    </details>`;
  }).join('');
  return `<div class="metric-grid compact api-audit-metrics">
      <div><span>Records audited</span><strong>${summary.records}</strong></div>
      <div><span>Mapped fields</span><strong>${summary.mappedFields}</strong></div>
      <div><span>Fallback fields</span><strong>${summary.fallbackFields}</strong></div>
      <div><span>Missing expected</span><strong>${summary.missingExpectedFields}</strong></div>
      <div><span>Unmapped source fields</span><strong>${summary.unmappedFields}</strong></div>
    </div>
    <div class="data-table compact-table api-field-audit-summary"><div class="data-head"><span>Entity</span><span>Records</span><span>Mapped / Raw</span><span>Fallbacks</span><span>Missing</span><span>Unmapped</span></div>${rows}</div>
    <div class="api-field-audit-manifests">${details}</div>`;
}

function apiFormatBytes(value: number | undefined): string {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function apiResultCard(result: ApiConsoleResult, index: number): string {
  const count = result.count === null || result.count === undefined ? '—' : result.count;
  const methodClass = String(result.method || 'GET').toLowerCase();
  const diagnosticKey = ZentridAPIDiagnostics.endpointKey(result);
  const delta = zentridApiDeltas[diagnosticKey];
  const page = result.pagination?.page;
  const totalPages = result.pagination?.totalPages;
  const pageText = page === null || page === undefined ? '—' : `${page}${totalPages ? ` / ${totalPages}` : ''}`;
  const comparison = delta?.available
    ? `<div class="api-comparison ${delta.tone}"><strong>Compared with previous run</strong><span>${escapeHtml(delta.summary)}</span></div>`
    : '<div class="api-comparison neutral"><strong>Compared with previous run</strong><span>No previous result for this endpoint.</span></div>';
  return `<article class="glass-card api-check-card" data-api-result="${index}">
    <div class="panel-head compact">
      <div>
        <h3>${escapeHtml(result.label)}</h3>
        <p class="muted"><span class="badge neutral">${escapeHtml(result.group || 'API')}</span> <span class="api-method ${methodClass}">${escapeHtml(result.method || 'GET')}</span> <code>${escapeHtml(result.path)}</code></p>
      </div>
      ${apiStatusBadge(result)}
    </div>
    <div class="metric-grid compact api-metrics api-diagnostic-metrics">
      <div><span>Status</span><strong>${escapeHtml(result.status ?? '—')}</strong></div>
      <div><span>Time</span><strong>${escapeHtml(result.ms || 0)} ms</strong></div>
      <div><span>Rows</span><strong>${escapeHtml(count)}</strong></div>
      <div><span>Response</span><strong>${escapeHtml(apiFormatBytes(result.responseBytes))}</strong></div>
      <div><span>Page</span><strong>${escapeHtml(pageText)}</strong></div>
      <div><span>Source</span><strong>${escapeHtml(result.source || (ZentridConfig.isLocalFrontend() ? 'Local proxy' : 'Vercel proxy'))}</strong></div>
      <div><span>Content-Type</span><strong title="${escapeHtml(result.contentType || '')}">${escapeHtml(result.contentType || '—')}</strong></div>
      <div><span>Request ID</span><strong title="${escapeHtml(result.requestId || '')}">${escapeHtml(result.requestId || '—')}</strong></div>
    </div>
    ${comparison}
    <p class="muted api-notes">${escapeHtml(result.notes || '')}</p>
    <div class="toolbar api-card-actions">
      <button class="secondary-action" type="button" data-api-copy-response="${index}">Copy response</button>
      <button class="secondary-action" type="button" data-api-copy-diagnostics="${index}">Copy diagnostics</button>
      <button class="secondary-action" type="button" data-api-copy-snapshot="${index}">Copy safe snapshot</button>
    </div>
    <details class="api-response-details"><summary>Response preview</summary><pre class="api-preview">${escapeHtml(apiPretty(apiPreviewData(result)))}</pre></details>
  </article>`;
}

function apiGroupSummary(results: ApiConsoleResult[]): string {
  const grouped = results.reduce<Record<string, ApiGroupSummary>>((acc, item) => {
    const group = item.group || 'Other';
    acc[group] ||= { total: 0, ok: 0, error: 0, skipped: 0 };
    acc[group].total += 1;
    if (item.skipped) acc[group].skipped += 1;
    else if (item.ok) acc[group].ok += 1;
    else acc[group].error += 1;
    return acc;
  }, {});
  return Object.entries(grouped).map(([group, data]) => `<div class="data-row">
    <strong>${escapeHtml(group)}</strong>
    <span>${data.ok}/${data.total} OK</span>
    <span>${data.error} errors</span>
    <span>${data.skipped} skipped</span>
  </div>`).join('');
}

function buildBackendReport(results: ApiConsoleResult[]): string {
  const stamp = new Date().toISOString();
  const lines: string[] = [];
  lines.push(`Zentrid API backend check — ${stamp}`);
  lines.push(`Frontend source: ${ZentridConfig.isLocalFrontend() ? 'Local proxy http://localhost:5050' : 'Vercel proxy /api rewrites'}`);
  lines.push(`Authenticated: ${ZentridAuth.isAuthenticated() ? 'yes' : 'no'}`);
  const user = ZentridAuth.getUser();
  if (user) lines.push(`User: ${user.username || user.email || JSON.stringify(user)}`);
  const session = (ZentridAuth.getSession?.() || {}) as Partial<ZentridSession>;
  if (session.role) lines.push(`Role: ${session.role}`);
  if (session.claims?.iss) lines.push(`Issuer: ${session.claims.iss}`);
  if (session.claims?.aud) lines.push(`Audience: ${session.claims.aud}`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push(`OK: ${results.filter(r => r.ok).length}`);
  lines.push(`Errors: ${results.filter(r => !r.ok && !r.skipped).length}`);
  lines.push(`Skipped/manual: ${results.filter(r => r.skipped).length}`);
  lines.push('');
  lines.push('FAILED ENDPOINTS');
  const failed = results.filter(r => !r.ok && !r.skipped);
  if (!failed.length) lines.push('None');
  failed.forEach(r => lines.push(`- ${r.method} ${r.path} => ${r.status || 0} ${r.statusText || r.error || ''}`));
  lines.push('');
  lines.push('ALL CHECKED ENDPOINTS');
  results.forEach(r => {
    const count = r.count === null || r.count === undefined ? '-' : r.count;
    const page = r.pagination?.page ?? '-';
    const totalPages = r.pagination?.totalPages ?? '-';
    lines.push(`- ${r.group || 'API'} | ${r.method} ${r.path} | ${r.skipped ? 'SKIPPED' : r.ok ? 'OK' : 'ERROR'} | status=${r.status ?? '-'} | rows=${count} | page=${page}/${totalPages} | bytes=${r.responseBytes || 0} | time=${r.ms || 0}ms | requestId=${r.requestId || '-'}`);
  });
  lines.push('');
  lines.push('NOTE');
  lines.push('Only endpoints present in the provided Swagger snapshot are active in this build.');
  return lines.join('\n');
}

function renderApiConsole(): string {
  const catalogRows = ZentridPlatformAPI.endpointCatalog.map(item => `<div class="data-row">
    <strong>${escapeHtml(item.label)}</strong>
    <span>${escapeHtml(item.method)} <code>${escapeHtml(item.path)}</code></span>
    <span>${escapeHtml(item.group)}</span>
    <span>${item.safe ? '<span class="badge success">Auto safe</span>' : '<span class="badge warning">Manual only</span>'}</span>
  </div>`).join('');

  return `<section class="page-hero">
    <div>
      <p class="eyebrow">Swagger Diagnostics</p>
      <h1>Platform API Console</h1>
      <p class="muted">Checks only the active Swagger endpoints you provided: Auth, JWKS, Tenants, Clients, PlantRegistry, Platform Live API and ProviderIntegrations. Endpoints with {id} or write actions stay Manual only.</p>
    </div>
    <button class="create-action" id="runApiChecks" type="button"><span class="pulse"></span><div><strong>Run diagnostics</strong><small>Safe endpoints auto-check</small></div></button>
  </section>

  <section class="context-bar glass-card">
    <button class="ctx-item"><span>Auth</span><strong>${ZentridAuth.isAuthenticated() ? 'Bearer token found' : 'No token'}</strong></button>
    <button class="ctx-item"><span>API Base</span><strong>${escapeHtml(ZentridConfig.apiBaseUrl || '/api via Vercel')}</strong></button>
    <button class="ctx-item"><span>Mode</span><strong>${ZentridConfig.isLocalFrontend() ? 'Local proxy' : 'Vercel proxy'}</strong></button>
    <button class="ctx-item"><span>API Scope</span><strong>Provided Swagger only</strong></button>
  </section>

  <section class="panel glass-card">
    <div class="panel-head">
      <div><h2>Auth API & Session</h2><p>Checks the currently stored Bearer token against Auth API. Refresh is available manually and will update the saved session if backend returns a new token.</p></div>
      <div class="toolbar"><button class="secondary-action" id="runAuthMe" type="button">GET /me</button><button class="secondary-action" id="runAuthValidate" type="button">POST /validate</button><button class="secondary-action" id="runAuthRefresh" type="button">POST /refresh</button></div>
    </div>
    <div class="metric-grid compact api-metrics" id="authSessionSummary"></div>
    <div id="authApiResult" class="api-check-grid"></div>
  </section>

  <section class="panel glass-card">
    <div class="panel-head">
      <div><h2>Safe Endpoint Health</h2><p>Automatic check for safe concrete endpoints from the provided Swagger snapshot. Endpoints with ids or write actions stay manual to avoid changing backend data.</p></div>
      <div class="toolbar"><button class="secondary-action" id="copyBackendReport" type="button">Copy backend report</button><button class="secondary-action" id="clearApiResults" type="button">Clear</button></div>
    </div>
    <div id="apiConsoleStatus" class="empty-state"><strong>Ready</strong><small>Click Run diagnostics after login as globaladmin.</small></div>
    <div class="data-table compact-table api-method-table" id="apiGroupSummary" style="display:none"><div class="data-head"><span>Group</span><span>OK</span><span>Errors</span><span>Skipped</span></div></div>
    <div id="apiConsoleResults" class="api-check-grid"></div>
    <textarea id="backendReportOutput" class="hidden" aria-label="Backend report"></textarea>
  </section>

  <section class="panel glass-card">
    <div class="panel-head"><div><h2>API Field Mapping Audit</h2><p>Compares real response fields with Zentrid canonical fields, formats, fallbacks and exact UI targets. New backend fields remain visible as unmapped instead of being silently ignored.</p></div></div>
    <div id="apiFieldMappingAudit">${apiFieldAuditPanel()}</div>
  </section>

  <section class="panel glass-card">
    <div class="panel-head"><div><h2>Contract Snapshot Coverage</h2><p>Sanitized fixtures lock the currently supported response shapes without storing tokens, credentials or production payloads.</p></div></div>
    <div class="data-table compact-table api-contract-snapshot-table">
      <div class="data-head"><span>Entity</span><span>Fixture</span><span>Endpoint</span><span>Coverage</span></div>
      ${ZentridAPIDiagnostics.contractCatalog.map(item => `<div class="data-row"><strong>${escapeHtml(item.entity)}</strong><code>${escapeHtml(item.fixture)}</code><span>${escapeHtml(item.endpoint)}</span><span class="badge success">Snapshot tested</span></div>`).join('')}
    </div>
  </section>

  <section class="panel glass-card">
    <div class="panel-head"><div><h2>Manual Request Runner</h2><p>Use this only for endpoints that need ids, POST bodies or backend-team tests. It uses the same token and proxy.</p></div></div>
    <div class="form-grid three-cols">
      <label>Method
        <select id="manualApiMethod">
          <option>GET</option><option>POST</option>
        </select>
      </label>
      <label class="span-2">Path
        <input id="manualApiPath" value="/api/admin/provider-integrations/templates/DeyeCloud" />
      </label>
    </div>
    <label>JSON Body
      <textarea id="manualApiBody" rows="8" placeholder='{ "example": true }'></textarea>
    </label>
    <div class="toolbar"><button class="create-action" id="runManualApi" type="button">Run manual request</button><button class="secondary-action" id="clearManualApi" type="button">Clear manual result</button></div>
    <div id="manualApiResult" class="api-check-grid"></div>
  </section>

  <section class="panel glass-card">
    <div class="panel-head"><div><h2>Endpoint Catalog</h2><p>Active endpoint catalog from the provided Swagger: Auth, JWKS, Tenants, Clients, PlantRegistry, ProviderIntegrations and Platform Live API. All unsupported endpoints were removed from the frontend API layer.</p></div></div>
    <div class="data-table compact-table api-method-table">
      <div class="data-head"><span>Endpoint</span><span>Path</span><span>Group</span><span>Mode</span></div>
      ${catalogRows}
    </div>
  </section>`;
}

async function wireApiConsole(): Promise<void> {
  const status = document.getElementById('apiConsoleStatus');
  const resultsEl = document.getElementById('apiConsoleResults');
  const groupEl = document.getElementById('apiGroupSummary');
  const authSummary = document.getElementById('authSessionSummary');
  const authResultEl = document.getElementById('authApiResult');
  const reportOutput = document.getElementById('backendReportOutput') as HTMLTextAreaElement | null;

  if (!status || !resultsEl || !groupEl || !reportOutput) return;
  const statusEl = status;
  const resultsHost = resultsEl;
  const groupHost = groupEl;
  const reportField = reportOutput;

  function renderAuthSessionSummary(): void {
    const session = (ZentridAuth.getSession?.() || {}) as Partial<ZentridSession>;
    const claims = apiRecord(session.claims);
    const user = apiRecord(ZentridAuth.getUser?.());
    const exp = claims.exp ? new Date(Number(claims.exp) * 1000).toLocaleString() : (session.expiresAt || '—');
    if (!authSummary) return;
    authSummary.innerHTML = `
      <div><span>User</span><strong>${escapeHtml(user.username || claims.unique_name || claims.email || '—')}</strong></div>
      <div><span>Role</span><strong>${escapeHtml(session.role || '—')}</strong></div>
      <div><span>Issuer</span><strong>${escapeHtml(claims.iss || '—')}</strong></div>
      <div><span>Expires</span><strong>${escapeHtml(exp)}</strong></div>
    `;
  }

  async function runAuthEndpoint(kind: AuthEndpointKind): Promise<void> {
    if (!authResultEl) return;
    authResultEl.innerHTML = '<article class="glass-card api-check-card"><strong>Checking Auth API...</strong></article>';
    let result: ApiConsoleResult;
    if (kind === 'me') {
      result = await ZentridPlatformAPI.rawRequest('/api/Auth/me', { method: 'GET' });
      result.label = 'Current User';
      result.group = 'Auth';
      result.notes = 'GET /api/Auth/me using current Bearer token.';
      if (result.ok && result.data) {
        const dataRecord = apiRecord(result.data);
        sessionStorage.setItem('zentrid_auth_user', JSON.stringify(dataRecord.user || dataRecord.data || dataRecord.result || result.data));
      }
    } else if (kind === 'validate') {
      result = await ZentridPlatformAPI.rawRequest('/api/Auth/validate', { method: 'POST' });
      result.label = 'Validate Token';
      result.group = 'Auth';
      result.notes = 'POST /api/Auth/validate using current Bearer token.';
    } else {
      try {
        const before = ZentridAuth.getAccessToken?.() || '';
        const data = await ZentridAuth.refresh();
        const after = ZentridAuth.getAccessToken?.() || '';
        result = { ok: true, status: 200, statusText: 'OK', ms: 0, path: '/api/Auth/refresh', method: 'POST', source: ZentridConfig.isLocalFrontend() ? 'Local proxy' : 'Vercel proxy', count: null, data: { refreshed: true, tokenChanged: Boolean(after && before !== after), session: data }, error: '', label: 'Refresh Token', group: 'Auth', notes: 'POST /api/Auth/refresh. Stored session updated when backend returns a new token.' };
      } catch (error) {
        result = { ok: false, status: 0, statusText: 'Refresh failed', ms: 0, path: '/api/Auth/refresh', method: 'POST', source: ZentridConfig.isLocalFrontend() ? 'Local proxy' : 'Vercel proxy', count: null, data: null, bodyText: '', error: error instanceof Error ? error.message : String(error), label: 'Refresh Token', group: 'Auth', notes: 'POST /api/Auth/refresh failed.' };
      }
    }
    zentridAuthResult = result;
    renderAuthSessionSummary();
    authResultEl.innerHTML = apiResultCard(result, 0);
  }

  renderAuthSessionSummary();

  async function run(): Promise<void> {
    statusEl.innerHTML = '<strong>Checking...</strong><small>Requests are running through proxy and Bearer token.</small>';
    resultsHost.innerHTML = '';
    groupHost.style.display = 'none';
    zentridApiResults = await ZentridPlatformAPI.checkCatalog({ includeUnsafe: false });
    zentridApiDeltas = ZentridAPIDiagnostics.captureRun(zentridApiResults);
    runApiFieldAudit(zentridApiResults);
    const auditHost = document.getElementById('apiFieldMappingAudit');
    if (auditHost) auditHost.innerHTML = apiFieldAuditPanel();
    const ok = zentridApiResults.filter(x => x.ok).length;
    const errors = zentridApiResults.filter(x => !x.ok && !x.skipped).length;
    statusEl.innerHTML = `<strong>${ok}/${zentridApiResults.length} endpoints OK</strong><small>${errors} backend/API error(s). Vendor APIs are excluded.</small>`;
    groupHost.style.display = 'grid';
    groupHost.innerHTML = '<div class="data-head"><span>Group</span><span>OK</span><span>Errors</span><span>Skipped</span></div>' + apiGroupSummary(zentridApiResults);
    resultsHost.innerHTML = zentridApiResults.map(apiResultCard).join('');
    reportField.value = buildBackendReport(zentridApiResults);
    ZentridLayout.toast(`${ok}/${zentridApiResults.length} API checks passed`);
  }

  async function runManual(): Promise<void> {
    const method = (document.getElementById('manualApiMethod') as HTMLSelectElement | null)?.value || 'GET';
    const path = ((document.getElementById('manualApiPath') as HTMLInputElement | null)?.value || '').trim();
    const bodyText = ((document.getElementById('manualApiBody') as HTMLTextAreaElement | null)?.value || '').trim();
    const manualEl = document.getElementById('manualApiResult');
    if (!manualEl) return;
    if (!path.startsWith('/api/') && !path.startsWith('/.well-known/')) {
      manualEl.innerHTML = '<article class="glass-card api-check-card"><p class="api-error">Path must start with /api/ or /.well-known/</p></article>';
      return;
    }
    if (!ZentridPlatformAPI.isAllowedPath(path)) {
      manualEl.innerHTML = '<article class="glass-card api-check-card"><p class="api-error">This endpoint is not in the active Swagger scope and was removed from this build.</p></article>';
      return;
    }
    let body: unknown;
    if (bodyText) {
      try { body = JSON.parse(bodyText); } catch (e) {
        manualEl.innerHTML = `<article class="glass-card api-check-card"><p class="api-error">Invalid JSON body: ${escapeHtml(e instanceof Error ? e.message : String(e))}</p></article>`;
        return;
      }
    }
    manualEl.innerHTML = '<article class="glass-card api-check-card"><strong>Running manual request...</strong></article>';
    zentridManualResult = await ZentridPlatformAPI.rawRequest(path, { method, body });
    zentridManualResult.label = 'Manual Request';
    zentridManualResult.group = 'Manual';
    zentridManualResult.notes = 'Manual diagnostic result. Add to backend report if needed.';
    zentridApiDeltas = { ...zentridApiDeltas, ...ZentridAPIDiagnostics.captureRun([zentridManualResult]) };
    manualEl.innerHTML = apiResultCard(zentridManualResult, 0);
  }


  async function copyDiagnosticValue(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      ZentridLayout.toast(successMessage, 'success');
    } catch (error) {
      ZentridLayout.toast('Clipboard access is unavailable.', 'warning');
    }
  }

  document.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const responseButton = target.closest<HTMLElement>('[data-api-copy-response]');
    const diagnosticButton = target.closest<HTMLElement>('[data-api-copy-diagnostics]');
    const snapshotButton = target.closest<HTMLElement>('[data-api-copy-snapshot]');
    const button = responseButton || diagnosticButton || snapshotButton;
    if (!button) return;
    const index = Number(button.dataset.apiCopyResponse ?? button.dataset.apiCopyDiagnostics ?? button.dataset.apiCopySnapshot ?? -1);
    const host = button.closest<HTMLElement>('.api-check-grid');
    const result = host?.id === 'manualApiResult' ? zentridManualResult : host?.id === 'authApiResult' ? zentridAuthResult : zentridApiResults[index];
    if (!result) return;
    if (responseButton) void copyDiagnosticValue(apiPretty(result.data), 'Response copied');
    if (diagnosticButton) void copyDiagnosticValue(ZentridAPIDiagnostics.diagnosticsText(result, zentridApiDeltas[ZentridAPIDiagnostics.endpointKey(result)]), 'Diagnostics copied');
    if (snapshotButton) void copyDiagnosticValue(apiPretty(ZentridAPIDiagnostics.safeSnapshot(result)), 'Safe snapshot copied');
  });

  document.getElementById('runApiChecks')?.addEventListener('click', run);
  document.getElementById('clearApiResults')?.addEventListener('click', () => {
    zentridApiResults = [];
    resultsHost.innerHTML = '';
    groupHost.style.display = 'none';
    reportField.value = '';
    ZentridAPIContracts.fieldAudit.clear();
    const auditHost = document.getElementById('apiFieldMappingAudit');
    if (auditHost) auditHost.innerHTML = apiFieldAuditPanel();
    statusEl.innerHTML = '<strong>Ready</strong><small>Click Run diagnostics after login as globaladmin.</small>';
  });
  document.getElementById('copyBackendReport')?.addEventListener('click', async () => {
    const text = reportField.value || buildBackendReport(zentridApiResults);
    if (!text.trim()) {
      ZentridLayout.toast('Run diagnostics first');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      ZentridLayout.toast('Backend report copied');
    } catch (e) {
      reportField.classList.remove('hidden');
      reportField.focus();
      reportField.select();
    }
  });
  document.getElementById('runManualApi')?.addEventListener('click', runManual);
  document.getElementById('clearManualApi')?.addEventListener('click', () => {
    zentridManualResult = null;
    const manualEl = document.getElementById('manualApiResult');
    if (!manualEl) return;
    if (manualEl) manualEl.innerHTML = '';
  });
  document.getElementById('runAuthMe')?.addEventListener('click', () => runAuthEndpoint('me'));
  document.getElementById('runAuthValidate')?.addEventListener('click', () => runAuthEndpoint('validate'));
  document.getElementById('runAuthRefresh')?.addEventListener('click', () => runAuthEndpoint('refresh'));

  run();
}
