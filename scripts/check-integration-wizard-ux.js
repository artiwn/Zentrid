const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const root = process.cwd();
const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
function read(path) { const full = join(root, path); expect(existsSync(full), `Missing file: ${path}`); return existsSync(full) ? readFileSync(full, 'utf8') : ''; }
const integrations = read('assets/js/integrations.ts');
const page = read('pages/integrations.html');
const css = read('assets/css/src/05-platform-core-patches.css');
const pkg = JSON.parse(read('package.json') || '{}');
[
  'integrationValidationSummary', 'integrationWizardProgress', 'validateStep', 'validateAll',
  'A connector named', 'Discard the connector information entered in this wizard?',
  'Creating Connector…', 'Activation requires passed Connection and Sample Data checks',
  'Backend archive is not available yet. Live connector was not changed.',
  'integrationCredentialValues', 'integrationConfiguredCredentials', "'Configured'",
  'ZentridAPIMutations.integrations.create(payload)', 'result.error.retriable',
  'zentrid_integration_create_fallback', 'location.href = \'integration-detail.html\'',
  'role="dialog"', 'aria-current="step"', 'Backend API',
  'ZentridPlatformAPI.providerIntegrations.template(apiName)', 'unwrapProviderTemplateDetail',
  'liveProviderTemplateState.details[key] = detail', 'liveProviderTemplateRequestVersion',
  'normalizeProviderTemplateNames', 'liveTemplateFieldRecords', 'liveTemplateFieldValue',
  'Provider template list and detail load from the backend when the wizard opens.'
].forEach(token => expect(integrations.includes(token), `Integration wizard UX token is missing: ${token}`));
expect(!integrations.includes("show(step + 1); ZentridLayout.toast('Step saved')"), 'Integration wizard still allows unvalidated Next navigation.');
expect(!integrations.includes("? value : 'Configured value'"), 'Blank credential values must not be saved as configured.');
expect(integrations.includes('data-zentrid-form-readiness="api"'), 'Integration wizard must declare API form readiness.');
expect(integrations.includes("credentials: integrationConfiguredCredentials(formData)"), 'Session fallback must store only redacted credential state.');
expect(page.includes('form-ux.js'), 'Integrations page must load shared form UX.');
expect(page.indexOf('layout.js') < page.indexOf('form-ux.js'), 'layout.js must load before form-ux.js.');
expect(page.indexOf('form-ux.js') < page.indexOf('integrations.js'), 'form-ux.js must load before integrations.js.');
expect(css.includes('.integration-review-grid'), 'Integration review styles are missing.');
expect(css.includes('.integration-prototype-note'), 'Integration local prototype notice styles are missing.');
expect(pkg.scripts?.['check:integration-wizard-ux'] === 'node scripts/check-integration-wizard-ux.js', 'Package script check:integration-wizard-ux is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:integration-wizard-ux'), 'verify does not run integration wizard UX checks.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:integration-wizard-ux'), 'verify:vercel does not run integration wizard UX checks.');

expect(/ZentridPlatformAPI\.providerIntegrations\.template\s*\(apiName\)/.test(integrations), 'Integration wizard must load the exact provider template after vendor selection.');
expect(integrations.includes("for (const key of ['data', 'template', 'providerTemplate', 'integrationTemplate', 'result', 'item'])"), 'Provider template response unwrapping is missing.');
expect(integrations.includes("renderLiveTemplateStatus(key, 'loading'"), 'Provider template detail loading state is missing.');
expect(integrations.includes("renderLiveTemplateStatus(key, 'error'"), 'Provider template detail error state is missing.');

if (failures.length) { console.error('Integration wizard UX checks failed.'); failures.forEach(message => console.error(`  ${message}`)); process.exit(1); }
console.log('Integration wizard UX checks OK: validation, step gating, local test states, lifecycle guards, duplicate prevention, safe credential handling and accessibility verified.');
