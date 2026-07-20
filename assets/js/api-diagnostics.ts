(function () {
  type DiagnosticTone = 'success' | 'warning' | 'danger' | 'neutral';
  interface DiagnosticRun {
    version: 1;
    capturedAt: string;
    endpoints: Record<string, FleetApiDiagnosticEndpoint>;
  }

const api = (() => {
  const STORAGE_KEY = 'zentrid_api_diagnostics_previous_v130';
  const sensitiveKey = /(authorization|access.?token|refresh.?token|password|secret|api.?key|credential|cookie|private.?key)/i;
  const contractCatalog = [
    { entity: 'clients', fixture: 'assets/fixtures/api-contracts/clients-list.json', endpoint: 'GET /api/admin/clients' },
    { entity: 'tenants', fixture: 'assets/fixtures/api-contracts/tenants-list.json', endpoint: 'GET /api/admin/tenants' },
    { entity: 'plants', fixture: 'assets/fixtures/api-contracts/plants-list.json', endpoint: 'GET /api/plants' },
    { entity: 'devices', fixture: 'assets/fixtures/api-contracts/devices-list.json', endpoint: 'GET /api/devices' },
    { entity: 'alerts', fixture: 'assets/fixtures/api-contracts/alerts-list.json', endpoint: 'GET /api/alerts' },
    { entity: 'integrations', fixture: 'assets/fixtures/api-contracts/integrations-list.json', endpoint: 'GET /api/integrations' }
  ];

  function endpointKey(result: Pick<ZentridRawRequestResult, 'method' | 'path'>): string {
    return `${String(result.method || 'GET').toUpperCase()} ${String(result.path || '').split('?')[0]}`;
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  function numberOrNull(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function pagination(value: unknown): FleetApiDiagnosticPagination {
    if (!isRecord(value)) return { page: null, pageSize: null, totalCount: null, totalPages: null };
    return {
      page: numberOrNull(value.page ?? value.pageNumber ?? value.currentPage),
      pageSize: numberOrNull(value.pageSize ?? value.size ?? value.limit),
      totalCount: numberOrNull(value.totalCount ?? value.total ?? value.count),
      totalPages: numberOrNull(value.totalPages ?? value.pageCount)
    };
  }

  function redact(value: unknown, depth = 0): unknown {
    if (depth > 7) return '[max-depth]';
    if (Array.isArray(value)) return value.slice(0, 3).map(item => redact(item, depth + 1));
    if (!isRecord(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? '[redacted]' : redact(item, depth + 1)
    ]));
  }

  function shape(value: unknown, prefix = '$', depth = 0): string[] {
    if (depth > 7) return [`${prefix}:max-depth`];
    if (value === null) return [`${prefix}:null`];
    if (Array.isArray(value)) {
      const output = [`${prefix}:array`];
      if (value.length) output.push(...shape(value[0], `${prefix}[]`, depth + 1));
      return output;
    }
    if (isRecord(value)) {
      const output = [`${prefix}:object`];
      Object.keys(value).sort().forEach(key => output.push(...shape(value[key], `${prefix}.${key}`, depth + 1)));
      return output;
    }
    return [`${prefix}:${typeof value}`];
  }

  function hash(input: string): string {
    let current = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      current ^= input.charCodeAt(index);
      current = Math.imul(current, 16777619);
    }
    return (current >>> 0).toString(16).padStart(8, '0');
  }

  function endpoint(result: ZentridRawRequestResult): FleetApiDiagnosticEndpoint {
    const resultShape = shape(result.data);
    return {
      key: endpointKey(result),
      path: result.path,
      method: result.method,
      capturedAt: new Date().toISOString(),
      ok: result.ok,
      status: result.status,
      durationMs: result.ms || 0,
      responseBytes: result.responseBytes || 0,
      rows: result.count,
      pagination: result.pagination || pagination(result.data),
      contentType: result.contentType || '',
      requestId: result.requestId || '',
      shapeHash: hash(resultShape.join('\n')),
      shape: resultShape
    };
  }

  function loadPrevious(): DiagnosticRun | null {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null') as DiagnosticRun | null;
      return parsed?.version === 1 && parsed.endpoints ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function compare(current: FleetApiDiagnosticEndpoint, previous?: FleetApiDiagnosticEndpoint): FleetApiDiagnosticDelta {
    if (!previous) return { available: false, tone: 'neutral', durationDeltaMs: 0, responseBytesDelta: 0, rowsDelta: null, statusChanged: false, shapeChanged: false, summary: 'No previous run' };
    const durationDeltaMs = current.durationMs - previous.durationMs;
    const responseBytesDelta = current.responseBytes - previous.responseBytes;
    const rowsDelta = current.rows === null || previous.rows === null ? null : current.rows - previous.rows;
    const statusChanged = String(current.status) !== String(previous.status) || current.ok !== previous.ok;
    const shapeChanged = current.shapeHash !== previous.shapeHash;
    const slower = durationDeltaMs > Math.max(250, previous.durationMs * 0.25);
    const faster = durationDeltaMs < -Math.max(250, previous.durationMs * 0.25);
    const tone: DiagnosticTone = statusChanged || shapeChanged ? 'danger' : slower ? 'warning' : faster ? 'success' : 'neutral';
    const parts = [
      `${durationDeltaMs >= 0 ? '+' : ''}${durationDeltaMs} ms`,
      `${responseBytesDelta >= 0 ? '+' : ''}${responseBytesDelta} B`,
      rowsDelta === null ? 'rows n/a' : `${rowsDelta >= 0 ? '+' : ''}${rowsDelta} rows`
    ];
    if (statusChanged) parts.push('status changed');
    if (shapeChanged) parts.push('response shape changed');
    return { available: true, tone, durationDeltaMs, responseBytesDelta, rowsDelta, statusChanged, shapeChanged, summary: parts.join(' · ') };
  }

  function captureRun(results: ZentridRawRequestResult[]): Record<string, FleetApiDiagnosticDelta> {
    const previous = loadPrevious();
    const endpoints: Record<string, FleetApiDiagnosticEndpoint> = { ...(previous?.endpoints || {}) };
    const deltas: Record<string, FleetApiDiagnosticDelta> = {};
    results.forEach(result => {
      const item = endpoint(result);
      endpoints[item.key] = item;
      deltas[item.key] = compare(item, previous?.endpoints[item.key]);
    });
    const run: DiagnosticRun = { version: 1, capturedAt: new Date().toISOString(), endpoints };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(run)); } catch (error) { /* session storage is optional */ }
    return deltas;
  }

  function safeSnapshot(result: ZentridRawRequestResult): Record<string, unknown> {
    const item = endpoint(result);
    return {
      capturedAt: item.capturedAt,
      request: { method: item.method, path: item.path },
      response: {
        ok: item.ok,
        status: item.status,
        durationMs: item.durationMs,
        responseBytes: item.responseBytes,
        rows: item.rows,
        pagination: item.pagination,
        contentType: item.contentType,
        requestId: item.requestId || null,
        shapeHash: item.shapeHash,
        body: redact(result.data)
      }
    };
  }

  function diagnosticsText(result: ZentridRawRequestResult, delta?: FleetApiDiagnosticDelta): string {
    const item = endpoint(result);
    return [
      `${item.method} ${item.path}`,
      `Status: ${item.status} (${item.ok ? 'OK' : 'ERROR'})`,
      `Duration: ${item.durationMs} ms`,
      `Response size: ${item.responseBytes} bytes`,
      `Rows: ${item.rows ?? '—'}`,
      `Page: ${item.pagination.page ?? '—'} / ${item.pagination.totalPages ?? '—'}`,
      `Page size: ${item.pagination.pageSize ?? '—'}`,
      `Total count: ${item.pagination.totalCount ?? '—'}`,
      `Content-Type: ${item.contentType || '—'}`,
      `Request ID: ${item.requestId || '—'}`,
      `Shape hash: ${item.shapeHash}`,
      `Previous comparison: ${delta?.summary || 'not available'}`
    ].join('\n');
  }

  function clear(): void {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (error) { /* optional */ }
  }

  return { endpointKey, pagination, redact, shape, hash, endpoint, compare, captureRun, safeSnapshot, diagnosticsText, clear, contractCatalog };
})();

window.FleetAPIDiagnostics = api;
})();
