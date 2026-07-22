const fs = require('fs');
const os = require('os');
const path = require('path');
const { createManifest } = require('./generate-release-manifest');

const root = process.cwd();
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const source = read('assets/js/release-observability.ts');
const css = read('assets/css/src/components/release-observability.css');
const cssManifest = JSON.parse(read('assets/css/src/manifest.json'));
const packageJson = JSON.parse(read('package.json'));
const distCheck = read('scripts/check-dist.js');

[
  'release-manifest.json', "window.addEventListener('error'", "window.addEventListener('unhandledrejection'",
  'copySafeReport', 'downloadReport', 'checkForUpdate', 'SENSITIVE_KEY', 'ZentridReleaseObservability',
  'performance.getEntriesByType', 'recentIssues', 'recentEvents'
].forEach(token => assert(source.includes(token), `Release observability token is missing: ${token}`));
[
  '.zentrid-release-chip', '.zentrid-release-panel', '.zentrid-release-notice', '.zentrid-release-summary',
  '@media (max-width: 720px)'
].forEach(token => assert(css.includes(token), `Release observability CSS is missing ${token}.`));
assert(cssManifest.sources.includes('components/release-observability.css'), 'Release observability CSS is missing from the CSS manifest.');
assert(/^1\.\d+\.\d+$/.test(packageJson.version), 'package.json must expose a valid Zentrid semantic version.');
assert(/^v\d+$/.test(packageJson.zentridRelease), 'package.json must expose a numeric Zentrid release label.');
assert(packageJson.scripts['build:release'], 'package.json must expose build:release.');
assert(packageJson.scripts['check:release-readiness-observability'], 'package.json must expose the v138 regression check.');
assert(String(packageJson.scripts.verify || '').includes('check:release-readiness-observability'), 'verify must run the v138 regression check.');
assert(String(packageJson.scripts['verify:vercel'] || '').includes('check:release-readiness-observability'), 'verify:vercel must run the v138 regression check.');
assert(distCheck.includes('assets/release-manifest.json'), 'check-dist must require the generated release manifest.');
assert(fs.existsSync(path.join(root, 'docs/RELEASE_READINESS_OBSERVABILITY_V138.md')), 'v138 release readiness documentation is missing.');

const htmlFiles = ['index.html', 'login.html', 'client-onboarding.html', ...fs.readdirSync(path.join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => `pages/${name}`)];
htmlFiles.forEach(relative => {
  const html = read(relative);
  const releaseIndex = html.indexOf('release-observability.js');
  assert(releaseIndex >= 0, `${relative}: release-observability.js is missing.`);
  const runtimeIndex = html.indexOf('runtime-stability.js');
  if (runtimeIndex >= 0) assert(releaseIndex > runtimeIndex, `${relative}: release-observability.js must load after runtime-stability.js.`);
});

const previousEpoch = process.env.SOURCE_DATE_EPOCH;
const previousRelease = process.env.ZENTRID_RELEASE;
process.env.SOURCE_DATE_EPOCH = '1784160000';
process.env.ZENTRID_RELEASE = `${packageJson.zentridRelease}-test`;
const generated = createManifest({ target: 'test' });
if (previousEpoch === undefined) delete process.env.SOURCE_DATE_EPOCH; else process.env.SOURCE_DATE_EPOCH = previousEpoch;
if (previousRelease === undefined) delete process.env.ZENTRID_RELEASE; else process.env.ZENTRID_RELEASE = previousRelease;
assert(generated.schemaVersion === 1, 'Generated manifest schemaVersion must be 1.');
assert(generated.version === packageJson.version, `Generated manifest must use package version ${packageJson.version}.`);
assert(generated.release === `${packageJson.zentridRelease}-test`, 'Generated manifest must respect the current ZENTRID_RELEASE.');
assert(generated.target === 'test', 'Generated manifest must preserve the build target.');
assert(generated.builtAt === '2026-07-16T00:00:00.000Z', 'Generated manifest must support reproducible SOURCE_DATE_EPOCH builds.');
assert(!Object.keys(generated).some(key => /token|password|secret/i.test(key)), 'Generated release manifest must not contain credential fields.');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), `zentrid-${packageJson.zentridRelease}-`));
fs.writeFileSync(path.join(temp, 'manifest.json'), JSON.stringify(generated), 'utf8');
assert(fs.statSync(path.join(temp, 'manifest.json')).size > 0, 'Generated release manifest must be serializable.');
fs.rmSync(temp, { recursive: true, force: true });

if (failures.length) {
  console.error('Release readiness and observability check failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`Release readiness and observability OK: ${htmlFiles.length} HTML pages, safe diagnostics, build metadata and update checks are wired.`);
