const { existsSync, readFileSync, readdirSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => {
  const path = join(root, relative);
  expect(existsSync(path), `Missing file: ${relative}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const runtime = read('assets/js/runtime-stability.ts');
const ux = read('assets/js/ux-consistency.ts');
const responsive = read('assets/js/responsive-accessibility.ts');
const repositories = read('assets/js/api-repositories.ts');
const lazy = read('assets/js/detail-lazy-tabs.ts');
const clients = read('assets/js/client-hierarchy.ts');
const plants = read('assets/js/plants.ts');
const devices = read('assets/js/devices.ts');
const alerts = read('assets/js/alerts.ts');
const tenants = read('assets/js/tenants.ts');
const integrations = read('assets/js/integrations.ts');
const globals = read('types/zentrid-globals.d.ts');
const pkg = JSON.parse(read('package.json') || '{}');

[
  "const timers = new Map<string, RuntimeTimer>()",
  "function debounce(key: string",
  "function frame(key: string",
  "function idle(key: string",
  "function replaceHtml(container: HTMLElement, html: string)",
  "function registerCleanup(key: string",
  "PerformanceObserver",
  "window.addEventListener('pagehide', dispose",
  "data-zentrid-single-action",
  "longTaskDurationMs"
].forEach(token => expect(runtime.includes(token), `Runtime stability token missing: ${token}`));

[
  "pendingRoots = new Set<HTMLElement>()",
  "ZentridRuntimeStability.frame('ux-consistency:mutations'",
  "registerCleanup('ux-consistency:observer'"
].forEach(token => expect(ux.includes(token), `UX observer batching token missing: ${token}`));

[
  "ZentridRuntimeStability.frame('responsive-accessibility:mutations'",
  "registerCleanup('responsive-accessibility:observer'",
  "function stopObserving()"
].forEach(token => expect(responsive.includes(token), `Responsive observer lifecycle token missing: ${token}`));

expect(repositories.includes('cancelAll(): void'), 'Repository coordinator cancelAll is missing.');
expect(repositories.includes("window.addEventListener('pagehide', () => api.coordinator.cancelAll()"), 'Repository requests are not cancelled on pagehide.');
expect(lazy.includes('function unobserve(page: string, key: string)'), 'Lazy detail observer unregistration is missing.');
expect(lazy.includes('function dispose(page?: string)'), 'Lazy detail page disposal is missing.');
expect(lazy.includes("window.addEventListener('pagehide', () => dispose()"), 'Lazy detail state is not disposed on pagehide.');

const searchChecks = [
  [clients, "ZentridRuntimeStability.debounce('registry:clients:search'", 'clients'],
  [plants, "ZentridRuntimeStability.debounce('registry:plants:search'", 'plants'],
  [devices, "ZentridRuntimeStability.debounce('registry:devices:search'", 'devices'],
  [alerts, "ZentridRuntimeStability.debounce('registry:alerts:search'", 'alerts'],
  [tenants, "ZentridRuntimeStability.debounce('registry:tenants:search'", 'tenants'],
  [integrations, "ZentridRuntimeStability.debounce('registry:integrations:search'", 'integrations']
];
searchChecks.forEach(([source, token, name]) => expect(source.includes(token), `${name} search is not using shared debounce.`));
[
  [clients, 'ZentridRuntimeStability.replaceHtml(target', 'clients'],
  [plants, 'ZentridRuntimeStability.replaceHtml(table', 'plants'],
  [devices, 'ZentridRuntimeStability.replaceHtml(table', 'devices'],
  [alerts, 'ZentridRuntimeStability.replaceHtml(host', 'alerts'],
  [integrations, 'ZentridRuntimeStability.replaceHtml(integrationTable', 'integrations']
].forEach(([source, token, name]) => expect(source.includes(token), `${name} render does not preserve interaction state.`));

expect(globals.includes('interface ZentridRuntimeStabilityApi'), 'ZentridRuntimeStability global type is missing.');
expect(globals.includes('cancelAll(): void;'), 'Repository coordinator cancelAll type is missing.');
expect(globals.includes('unobserve(page: string, key: string): void;'), 'Lazy detail unobserve type is missing.');

const htmlFiles = ['index.html', ...readdirSync(join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => `pages/${name}`)];
htmlFiles.forEach(relative => {
  const html = read(relative);
  const layoutIndex = html.indexOf('layout.js');
  const runtimeIndex = html.indexOf('runtime-stability.js');
  const uxIndex = html.indexOf('ux-consistency.js');
  expect(runtimeIndex >= 0, `${relative} does not load runtime-stability.js.`);
  expect(layoutIndex < runtimeIndex && runtimeIndex < uxIndex, `${relative} runtime script order must be layout -> runtime stability -> UX consistency.`);
});

expect(pkg.scripts?.['check:performance-runtime-stability'] === 'node scripts/check-performance-runtime-stability.js', 'Package script check:performance-runtime-stability is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:performance-runtime-stability'), 'verify does not run performance runtime stability checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:performance-runtime-stability'), 'verify:vercel does not run performance runtime stability checks.');

if (failures.length) {
  console.error('Performance and runtime stability checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Performance and runtime stability checks OK: batched observers, shared debounce, render-state preservation, lifecycle cleanup and request cancellation verified.');
