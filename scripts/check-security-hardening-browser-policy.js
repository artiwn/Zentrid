const fs = require('fs');
const path = require('path');
const root = process.cwd();
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const security = read('assets/js/security-policy.ts');
const api = read('assets/js/api-client.ts');
const proxy = read('proxy-server.ts');
const vercel = JSON.parse(read('vercel.json'));
const cssManifest = JSON.parse(read('assets/css/src/manifest.json'));
const packageJson = JSON.parse(read('package.json'));

[
  'ZentridBrowserSecurity', 'isUnsafeUrl', 'noopener', 'noreferrer', 'securitypolicyviolation',
  'storageFindings', 'openExternal', 'zentrid:security-blocked-navigation'
].forEach(token => assert(security.includes(token), `Security runtime token is missing: ${token}`));
assert(api.includes("sessionStorage.setItem('zentrid_auth_storage_v139', 'sessionStorage')"), 'Auth vault must prefer sessionStorage.');
assert(api.includes('migrateLegacyAuthStorage'), 'Legacy persistent auth migration is missing.');
assert(!/createElement\(['\"]style/.test(read('assets/js/tenants.ts')), 'Runtime must not inject style elements under enforced CSP.');
assert(!/localStorage\.setItem\((?:ACCESS_TOKEN_KEY|REFRESH_TOKEN_KEY|USER_KEY|EXPIRES_AT_KEY)/.test(api), 'Auth secrets must not be written directly to localStorage.');
assert(cssManifest.sources.includes('components/security-policy.css'), 'Security policy CSS is missing from the CSS manifest.');
assert(cssManifest.sources.includes('components/public-onboarding.css'), 'Onboarding CSS must be externalized into the CSS build.');
assert(Number(String(packageJson.zentridRelease || '').replace(/^v/, '')) >= 139, 'Security hardening requires Zentrid release v139 or newer.');
assert(packageJson.scripts['check:security-hardening-browser-policy'], 'The v139 regression command is missing.');
assert(String(packageJson.scripts.verify || '').includes('check:security-hardening-browser-policy'), 'verify must run the v139 security check.');
assert(String(packageJson.scripts['verify:vercel'] || '').includes('check:security-hardening-browser-policy'), 'verify:vercel must run the v139 security check.');
assert(fs.existsSync(path.join(root, 'docs/SECURITY_HARDENING_BROWSER_POLICY_V139.md')), 'v139 security documentation is missing.');

const htmlFiles = ['index.html', 'login.html', 'client-onboarding.html', ...fs.readdirSync(path.join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => `pages/${name}`)];
htmlFiles.forEach(relative => {
  const html = read(relative);
  assert(html.includes('name="referrer" content="strict-origin-when-cross-origin"'), `${relative}: referrer meta is missing.`);
  const securityIndex = html.indexOf('security-policy.js');
  const firstScript = html.indexOf('<script');
  assert(securityIndex >= 0, `${relative}: security-policy.js is missing.`);
  assert(firstScript >= 0 && securityIndex >= firstScript && securityIndex < firstScript + 180, `${relative}: security-policy.js must be the first runtime script.`);
  assert(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), `${relative}: inline script element violates CSP readiness.`);
  assert(!/<style\b/i.test(html), `${relative}: inline style element violates CSP readiness.`);
});

const globalHeaders = (vercel.headers || []).find(rule => rule.source === '/(.*)')?.headers || [];
const header = key => globalHeaders.find(item => String(item.key).toLowerCase() === key.toLowerCase())?.value || '';
assert(header('Content-Security-Policy').includes("script-src-elem 'self'"), 'Vercel CSP must restrict script elements to self.');
assert(header('Content-Security-Policy').includes("script-src-attr 'unsafe-inline'"), 'Compatible CSP must explicitly isolate legacy inline handlers.');
assert(header('Content-Security-Policy-Report-Only').includes("script-src-attr 'none'"), 'Report-only CSP must measure remaining inline handler debt.');
['nosniff', 'DENY', 'strict-origin-when-cross-origin', 'same-origin'].forEach(value => {
  assert(globalHeaders.some(item => String(item.value).includes(value)), `Vercel security headers are missing value: ${value}`);
});
['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Permissions-Policy'].forEach(token => {
  assert(proxy.includes(token), `Local proxy security header is missing: ${token}`);
});

if (failures.length) {
  console.error('Security hardening and browser policy check failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log(`Security hardening and browser policy OK: ${htmlFiles.length} HTML pages, session-scoped auth, CSP and navigation guards are wired.`);
