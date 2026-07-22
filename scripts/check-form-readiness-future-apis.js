const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const source = read('assets/js/form-readiness.ts');
const css = read('assets/css/src/components/form-readiness.css');
const manifest = JSON.parse(read('assets/css/src/manifest.json'));
const packageJson = JSON.parse(read('package.json'));

[
  "'api'", "'local'", "'unavailable'", "'readonly'",
  'beforeunload', 'zentridDisabledByReadiness', 'API not available',
  'zentrid:form-dirty-change', 'zentrid:form-committed',
  'dataset.nullable', 'dataset.emptyPolicy', 'dataset.dtoType', 'dataset.dtoKey',
  'credential', 'redacted', 'DTO preview'
].forEach(token => assert(source.includes(token), `Form readiness runtime is missing ${token}.`));

const cssIndex = manifest.sources.indexOf('components/form-readiness.css');
const primitiveIndex = manifest.sources.indexOf('components/form-primitives.css');
assert(cssIndex === primitiveIndex + 1, 'Form readiness CSS must load immediately after form primitives.');
['.zentrid-form-readiness', '.zentrid-form-validation-summary', '.zentrid-form-contract-preview', 'form.is-dirty', '@media (max-width: 480px)']
  .forEach(token => assert(css.includes(token), `Form readiness CSS is missing ${token}.`));

const annotatedSources = {
  'assets/js/client-hierarchy.ts': { tokens: ['ClientCreateDraft', '/api/admin/clients'], mode: 'api' },
  'assets/js/tenants.ts': { tokens: ['TenantCreateDraft', 'TenantPlantDraft', '/api/admin/tenants'], mode: 'api' },
  'assets/js/plants.ts': { tokens: ['PlantCreateDraft', '/api/admin/plants'], mode: 'api' },
  'assets/js/integrations.ts': { tokens: ['ProviderIntegrationCreateDraft', '/api/admin/provider-integrations'], mode: 'api' },
  'assets/js/devices.ts': { tokens: ['DeviceCreateDraft'], mode: 'local' },
  'assets/js/tasks.ts': { tokens: ['TaskCreateDraft', 'TaskAssignmentDraft'], mode: 'local' }
};
Object.entries(annotatedSources).forEach(([relative, definition]) => {
  const content = read(relative);
  definition.tokens.forEach(token => assert(content.includes(token), `${relative} is missing ${token}.`));
  assert(content.includes(`data-zentrid-form-readiness="${definition.mode}"`), `${relative} must declare ${definition.mode} form readiness.`);
  assert(content.includes('ZentridFormReadiness?.markCommitted'), `${relative} must clear dirty state after a successful save.`);
});

const pages = [
  'pages/clients.html', 'pages/client-detail.html', 'pages/tenants.html', 'pages/tenant-detail.html',
  'pages/plants.html', 'pages/plant-detail.html', 'pages/devices.html', 'pages/device-detail.html',
  'pages/integrations.html', 'pages/integration-detail.html', 'pages/task-detail.html'
];
pages.forEach(relative => {
  const html = read(relative);
  const readiness = html.indexOf('form-readiness.js');
  assert(readiness >= 0, `${relative} must load form-readiness.js.`);
  const consumers = ['client-hierarchy.js', 'tenants.js', 'plants.js', 'devices.js', 'integrations.js', 'tasks.js'];
  consumers.forEach(consumer => {
    const index = html.indexOf(consumer);
    if (index >= 0) assert(readiness < index, `${relative} must load form readiness before ${consumer}.`);
  });
});

assert(packageJson.scripts['check:form-readiness-future-apis'], 'package.json must expose the v136 regression check.');
assert(packageJson.scripts.verify.includes('check:form-readiness-future-apis'), 'verify must include the v136 regression check.');
assert(packageJson.scripts['verify:vercel'].includes('check:form-readiness-future-apis'), 'verify:vercel must include the v136 regression check.');

class FakeInput {
  constructor({ name, value = '', type = 'text', checked = false, required = false, dataset = {}, files = [], step = '' }) {
    this.name = name; this.value = value; this.type = type; this.checked = checked; this.required = required;
    this.dataset = dataset; this.files = files; this.step = step; this.disabled = false; this.multiple = false;
    this.validationMessage = required && !value && type !== 'checkbox' ? `${name} is required.` : '';
  }
  checkValidity() { return !this.validationMessage; }
}
class FakeSelect {
  constructor({ name, value = '', options = [], dataset = {}, multiple = false, selectedOptions = [] }) {
    this.name = name; this.value = value; this.options = options.map(value => ({ value })); this.dataset = dataset;
    this.disabled = false; this.required = false; this.validationMessage = ''; this.multiple = multiple;
    this.selectedOptions = selectedOptions.map(value => ({ value }));
  }
  checkValidity() { return true; }
}
class FakeTextarea {
  constructor({ name, value = '', dataset = {} }) { this.name = name; this.value = value; this.dataset = dataset; this.disabled = false; this.required = false; this.validationMessage = ''; }
  checkValidity() { return true; }
}
class FakeForm {
  constructor(controls) {
    this.id = 'fixtureForm'; this.name = ''; this.method = 'post'; this.controls = controls;
    this.dataset = { zentridFormReadiness: 'local', zentridFormContract: 'FixtureContract', zentridFormEndpoint: '/api/fixture', zentridFormMethod: 'POST' };
  }
  querySelectorAll(selector) { return selector === 'input, select, textarea' ? this.controls : []; }
}

const document = { readyState: 'loading', addEventListener() {} };
const windowObject = { addEventListener() {}, dispatchEvent() { return true; }, setTimeout() { return 1; }, clearTimeout() {} };
windowObject.window = windowObject;
const context = {
  window: windowObject,
  document,
  HTMLInputElement: FakeInput,
  HTMLSelectElement: FakeSelect,
  HTMLTextAreaElement: FakeTextarea,
  HTMLFormElement: FakeForm,
  HTMLElement: class {},
  Element: class {},
  MutationObserver: class {},
  CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
  requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
  Date, Number, Math, JSON, Object, Array, Set, Map, WeakMap, console
};

try {
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInNewContext(js, context, { filename: 'form-readiness.js' });
  const api = windowObject.ZentridFormReadiness;
  assert(api && typeof api.serialize === 'function', 'ZentridFormReadiness API must initialize.');
  const form = new FakeForm([
    new FakeInput({ name: 'name', value: '  Solar North  ', required: true }),
    new FakeInput({ name: 'capacityKw', value: '125.5', type: 'number', dataset: { dtoType: 'number' } }),
    new FakeInput({ name: 'optionalNote', value: '' }),
    new FakeInput({ name: 'expiresAt', value: '', dataset: { nullable: 'true' } }),
    new FakeInput({ name: 'active', type: 'checkbox', checked: true }),
    new FakeSelect({ name: 'status', value: 'Active', options: ['Active', 'Draft'] }),
    new FakeTextarea({ name: 'metadata', value: '{"source":"fixture"}', dataset: { dtoType: 'json', dtoKey: 'extensions.metadata' } }),
    new FakeInput({ name: 'credential_secret', value: 'should-never-appear-in-preview' }),
    new FakeInput({ name: 'document', type: 'file', files: [{ name: 'contract.pdf', type: 'application/pdf', size: 2048, lastModified: 10 }] })
  ]);
  const result = api.serialize(form);
  assert(result.payload.name === 'Solar North', 'String fields must be trimmed.');
  assert(result.payload.capacityKw === 125.5, 'Number fields must be coerced.');
  assert(!Object.prototype.hasOwnProperty.call(result.payload, 'optionalNote'), 'Optional empty fields must be omitted.');
  assert(result.payload.expiresAt === null, 'Nullable empty fields must serialize as null.');
  assert(result.payload.active === true, 'Checkbox fields must serialize as booleans.');
  assert(result.payload.extensions && result.payload.extensions.metadata.source === 'fixture', 'Nested DTO keys and JSON coercion must work.');
  assert(result.files.length === 1 && result.files[0].name === 'contract.pdf', 'File metadata must be separated from raw file content.');
  assert(result.meta.contract === 'FixtureContract' && result.meta.endpoint === '/api/fixture', 'Contract metadata must be preserved.');
} catch (error) {
  failures.push(`Form readiness runtime harness failed: ${error && error.stack ? error.stack : error}`);
}

if (failures.length) {
  console.error('Form readiness for future APIs check failed.');
  failures.forEach(failure => console.error(`  ${failure}`));
  process.exit(1);
}
console.log(`Form readiness for future APIs OK: ${Object.keys(annotatedSources).length} source modules, ${pages.length} pages, API/local DTO/file/dirty-state foundation.`);
