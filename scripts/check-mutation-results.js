const { existsSync, readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(relativePath) {
  const path = join(root, relativePath);
  expect(existsSync(path), `Missing file: ${relativePath}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const source = read('assets/js/api-mutations.ts');
const globals = read('types/zentrid-globals.d.ts');
const packageJson = JSON.parse(read('package.json') || '{}');

[
  'FleetMutationResult', 'FleetMutationSuccess', 'FleetMutationFailure',
  'FleetMutationNormalizedError', 'FleetAPIMutationsApi'
].forEach(name => expect(globals.includes(name), `Global mutation result type is missing: ${name}.`));
[
  "'zentrid:mutation-result'", 'normalizeError', 'defaultErrorMessage', 'isRetriable',
  'ZentridPlatformAPI.clients.create', 'ZentridPlatformAPI.tenants.activate',
  'ZentridPlatformAPI.plantRegistry.create', 'ZentridPlatformAPI.providerIntegrations.activate'
].forEach(token => expect(source.includes(token), `Mutation result implementation token is missing: ${token}.`));
expect(!source.includes('FleetAPI.request('), 'Mutation result layer must use ZentridPlatformAPI instead of bypassing the mutation foundation.');
expect(packageJson.scripts?.['check:mutation-results'] === 'node scripts/check-mutation-results.js', 'Package script check:mutation-results is missing.');
expect(String(packageJson.scripts?.verify || '').includes('check:mutation-results'), 'verify does not run mutation result checks.');
expect(String(packageJson.scripts?.['verify:vercel'] || '').includes('check:mutation-results'), 'verify:vercel does not run mutation result checks.');

const mutationPages = new Set([
  'pages/clients.html', 'pages/client-detail.html',
  'pages/tenants.html', 'pages/tenant-detail.html',
  'pages/plants.html', 'pages/plant-detail.html',
  'pages/integrations.html', 'pages/integration-detail.html'
]);
let enabledPages = 0;
const htmlFiles = ['index.html', ...readdirSync(join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => `pages/${name}`)];
for (const relativePath of htmlFiles) {
  const html = read(relativePath);
  const mutationIndex = html.indexOf('api-mutations.js');
  if (mutationPages.has(relativePath)) {
    enabledPages += 1;
    const platformIndex = html.indexOf('platform-api.js');
    const authIndex = html.indexOf('auth-guard.js');
    expect(mutationIndex >= 0, `${relativePath} is missing api-mutations.js.`);
    expect(platformIndex >= 0 && platformIndex < mutationIndex, `${relativePath} must load platform-api.js before api-mutations.js.`);
    expect(authIndex >= 0 && mutationIndex < authIndex, `${relativePath} must load api-mutations.js before auth-guard.js.`);
  } else {
    expect(mutationIndex < 0, `${relativePath} unexpectedly loads api-mutations.js.`);
  }
}
expect(enabledPages === 8, `Expected 8 mutation-ready active pages, found ${enabledPages}.`);

const resultEvents = [];
class TestCustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
}
const windowObject = {
  dispatchEvent(event) {
    if (event.type === 'zentrid:mutation-result') resultEvents.push(event.detail);
    return true;
  }
};
const platformCalls = [];
let clientMode = 'success';
const platformApi = {
  clients: {
    async create(payload) {
      platformCalls.push(['client.create', payload]);
      if (clientMode === 'validation') throw { status: 422, code: 'HTTP_422', path: '/api/admin/clients', message: 'Client name is required.' };
      if (clientMode === 'timeout') throw { status: 0, code: 'TIMEOUT', path: '/api/admin/clients', message: 'Timed out.' };
      if (clientMode === 'unauthorized') throw { status: 401, code: 'SESSION_EXPIRED', path: '/api/admin/clients', message: 'Session expired.' };
      return { id: 'C-2', ...payload };
    }
  },
  tenants: {
    async create(payload) { platformCalls.push(['tenant.create', payload]); return { id: 'T-2' }; },
    async activate(id) { platformCalls.push(['tenant.activate', id]); return { id, status: 'Active' }; },
    async deactivate(id) { platformCalls.push(['tenant.deactivate', id]); return { id, status: 'Inactive' }; },
    async archive(id) { platformCalls.push(['tenant.archive', id]); return { id, status: 'Archived' }; }
  },
  plantRegistry: {
    async create(payload) { platformCalls.push(['plant.create', payload]); return { id: 'P-2' }; }
  },
  providerIntegrations: {
    async create(payload) { platformCalls.push(['integration.create', payload]); return { id: 'I-2' }; },
    async validate(id) { return { id, validated: true }; },
    async testConnection(id) { return { id, connected: true }; },
    async testSampleData(id) { return { id, sample: true }; },
    async activate(id) { platformCalls.push(['integration.activate', id]); return { id, status: 'Active' }; },
    async suspend(id) { return { id, status: 'Suspended' }; },
    async archive(id) { return { id, status: 'Archived' }; },
    async failed(id) { return { id, status: 'Failed' }; }
  }
};

const sandbox = {
  window: windowObject,
  CustomEvent: TestCustomEvent,
  ZentridPlatformAPI: platformApi,
  performance,
  console,
  Date,
  String,
  Number,
  Boolean,
  Array,
  Object,
  Math,
  Set,
  Promise,
  Error,
  encodeURIComponent
};
vm.createContext(sandbox);
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None };
vm.runInContext(ts.transpileModule(source, { compilerOptions }).outputText, sandbox, { filename: 'api-mutations.js' });
const mutations = sandbox.window.FleetAPIMutations;
expect(Boolean(mutations), 'FleetAPIMutations did not initialize.');

(async () => {
  if (mutations) {
    const success = await mutations.clients.create({ name: 'New Client' });
    expect(success.ok === true, 'Successful mutation was not normalized as ok=true.');
    expect(success.data?.id === 'C-2', 'Successful mutation did not preserve backend data.');
    expect(success.meta.action === 'client.create' && success.meta.path === '/api/admin/clients', 'Successful mutation metadata is incorrect.');
    expect(success.meta.method === 'POST' && success.meta.entities.join(',') === 'clients', 'Successful mutation method/entities are incorrect.');
    expect(typeof success.meta.operationId === 'string' && success.meta.operationId.includes('client-create'), 'Successful mutation operationId is missing.');
    expect(mutations.isSuccess(success) === true && mutations.isFailure(success) === false, 'Mutation result type guards are incorrect for success.');
    expect(mutations.unwrap(success)?.id === 'C-2', 'unwrap() did not return successful data.');

    clientMode = 'validation';
    const validation = await mutations.clients.create({});
    expect(validation.ok === false, 'Validation failure was not normalized as ok=false.');
    expect(validation.error.kind === 'validation' && validation.error.status === 422, 'Validation error classification is incorrect.');
    expect(validation.error.retriable === false, 'Validation failure must not be retriable.');
    expect(validation.message === 'Client name is required.', 'Validation error message was not preserved.');
    expect(mutations.isFailure(validation) === true, 'Mutation result type guard is incorrect for failure.');
    let unwrapFailed = false;
    try { mutations.unwrap(validation); } catch (error) { unwrapFailed = error?.code === 'HTTP_422'; }
    expect(unwrapFailed, 'unwrap() did not throw the normalized mutation error.');

    clientMode = 'timeout';
    const timeout = await mutations.clients.create({ name: 'Slow Client' });
    expect(timeout.ok === false && timeout.error.kind === 'timeout', 'Timeout failure classification is incorrect.');
    expect(timeout.error.retriable === true && timeout.error.code === 'TIMEOUT', 'Timeout retry metadata is incorrect.');

    clientMode = 'unauthorized';
    const unauthorized = await mutations.clients.create({ name: 'Private Client' });
    expect(unauthorized.ok === false && unauthorized.error.kind === 'unauthorized', 'Unauthorized failure classification is incorrect.');
    expect(unauthorized.error.retriable === false, 'Unauthorized failure must not be retriable by a form.');

    const tenant = await mutations.tenants.activate('T 1');
    expect(tenant.ok === true && tenant.meta.path.endsWith('/T%201/activate'), 'Tenant lifecycle path encoding is incorrect.');

    const integration = await mutations.integrations.activate('I-1');
    expect(integration.ok === true, 'Integration lifecycle result is not successful.');
    expect(['integrations', 'plants', 'devices', 'alerts'].every(entity => integration.meta.entities.includes(entity)), 'Integration lifecycle result is missing affected entities.');

    const custom = await mutations.run(
      { action: 'custom.write', path: '/api/custom', method: 'PATCH', entities: ['clients'], successMessage: 'Custom write complete.' },
      async () => ({ saved: true })
    );
    expect(custom.ok === true && custom.meta.method === 'PATCH' && custom.message === 'Custom write complete.', 'Generic mutation runner is incorrect.');

    expect(resultEvents.length === 7, `Expected 7 zentrid:mutation-result events, found ${resultEvents.length}.`);
    expect(resultEvents.filter(result => result.ok).length === 4, 'Mutation result event success count is incorrect.');
    expect(resultEvents.filter(result => !result.ok).length === 3, 'Mutation result event failure count is incorrect.');
    expect(platformCalls.some(([action]) => action === 'client.create'), 'Mutation layer did not call the Client Platform API method.');
    expect(platformCalls.some(([action]) => action === 'tenant.activate'), 'Mutation layer did not call the Tenant Platform API method.');
    expect(platformCalls.some(([action]) => action === 'integration.activate'), 'Mutation layer did not call the Integration Platform API method.');
  }

  if (failures.length) {
    console.error('Mutation result checks failed.');
    failures.forEach(message => console.error(`  ${message}`));
    process.exit(1);
  }
  console.log(`Mutation result checks OK: normalized success/error behavior, 8 active page load orders and ${resultEvents.length} result events verified.`);
})().catch(error => {
  console.error('Mutation result checks failed with an unexpected error.');
  console.error(error);
  process.exit(1);
});
