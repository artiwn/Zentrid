type ZentridVendorApiRequestOptions = {
  method?: string;
  [key: string]: unknown;
};

type ZentridVendorApiResult = {
  ok: boolean;
  status: number;
  statusText: string;
  ms: number;
  path: string;
  method: string;
  source: string;
  count: number | null;
  data: null;
  bodyText: string;
  error: string;
};

type ZentridVendorAPIShape = {
  endpointCatalog: unknown[];
  request(path: string, options?: ZentridVendorApiRequestOptions): Promise<ZentridVendorApiResult>;
  checkCatalog(): Promise<unknown[]>;
};

/* Deprecated vendor API layer.
   The active backend Swagger snapshot does not expose direct DeyeCloud/Huawei/SolarX endpoints.
   Use ZentridPlatformAPI for the current approved API surface. */
const ZentridVendorAPI: ZentridVendorAPIShape = (() => {
  const endpointCatalog: unknown[] = [];

  async function request(path: string, options: ZentridVendorApiRequestOptions = {}): Promise<ZentridVendorApiResult> {
    return {
      ok: false,
      status: 0,
      statusText: 'Vendor API disabled',
      ms: 0,
      path,
      method: String(options.method || 'GET').toUpperCase(),
      source: ZentridConfig?.isLocalFrontend?.() ? 'Local proxy' : 'Vercel proxy',
      count: null,
      data: null,
      bodyText: '',
      error: 'Direct vendor endpoints were removed because they are not present in the provided Swagger snapshot. Use /api/admin/provider-integrations and /api/admin/provider-integrations/templates instead.'
    };
  }

  async function checkCatalog(): Promise<unknown[]> {
    return [];
  }

  return { endpointCatalog, request, checkCatalog };
})();

window.ZentridVendorAPI = ZentridVendorAPI;
