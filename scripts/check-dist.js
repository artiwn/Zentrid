const { existsSync, readFileSync, readdirSync } = require('fs');
const { dirname, join, relative, resolve } = require('path');

const root = process.cwd();
const dist = join(root, 'dist');
const targetArgument = process.argv.find(argument => argument.startsWith('--target='));
const target = targetArgument ? targetArgument.slice('--target='.length) : 'local';
const validTargets = new Set(['local', 'vercel']);

if (!validTargets.has(target)) {
  console.error(`Unknown dist target: ${target}. Expected local or vercel.`);
  process.exit(1);
}

const sources = [];
const htmlFiles = [];
const failures = [];

function walk(dir, visitor) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, visitor);
    else if (entry.isFile()) visitor(path);
  }
}

walk(join(root, 'assets', 'js'), path => {
  if (path.endsWith('.ts') && !path.endsWith('.d.ts')) sources.push(path);
});
if (target === 'local') {
  const proxySource = join(root, 'proxy-server.ts');
  if (existsSync(proxySource)) sources.push(proxySource);
}

for (const source of sources) {
  const rel = relative(root, source).replace(/\.ts$/, '.js');
  const emitted = join(dist, rel);
  if (!existsSync(emitted)) failures.push(`Missing emitted JavaScript: ${relative(root, emitted)}`);
}

walk(dist, path => {
  if (path.endsWith('.html')) htmlFiles.push(path);
  if (path.endsWith('.ts')) failures.push(`TypeScript leaked into dist: ${relative(root, path)}`);
  if (path.endsWith('.js') && relative(dist, path).replace(/\\/g, '/') !== 'proxy-server.js') {
    const source = readFileSync(path, 'utf8');
    if (/Object\.defineProperty\(exports, ["']__esModule["']/.test(source)) {
      failures.push(`Browser runtime contains CommonJS exports marker: ${relative(root, path)}`);
    }
  }
});

function validateLocalReference(htmlFile, reference, kind) {
  if (!reference || /^(?:https?:)?\/\//i.test(reference) || reference.startsWith('data:')) return;
  const clean = reference.split(/[?#]/, 1)[0];
  const destination = resolve(dirname(htmlFile), clean);
  if (!destination.startsWith(dist)) {
    failures.push(`${kind} reference escapes dist: ${relative(root, htmlFile)} -> ${reference}`);
  } else if (!existsSync(destination)) {
    failures.push(`Missing local ${kind.toLowerCase()}: ${relative(root, htmlFile)} -> ${reference}`);
  }
}

const scriptPattern = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
const linkPattern = /<link\b[^>]*>/gi;
const relPattern = /\brel=["']([^"']+)["']/i;
const hrefPattern = /\bhref=["']([^"']+)["']/i;
for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  for (const match of html.matchAll(scriptPattern)) {
    validateLocalReference(htmlFile, match[1], 'Script');
  }
  for (const match of html.matchAll(linkPattern)) {
    const tag = match[0];
    const rel = tag.match(relPattern)?.[1] || '';
    if (!rel.split(/\s+/).some(value => value.toLowerCase() === 'stylesheet')) continue;
    validateLocalReference(htmlFile, tag.match(hrefPattern)?.[1], 'Stylesheet');
  }
}

for (const required of ['index.html', 'login.html', 'client-onboarding.html', 'assets/css/styles.css', 'assets/release-manifest.json']) {
  if (!existsSync(join(dist, required))) failures.push(`Missing required dist file: dist/${required}`);
}


const releaseManifestPath = join(dist, 'assets', 'release-manifest.json');
if (existsSync(releaseManifestPath)) {
  try {
    const releaseManifest = JSON.parse(readFileSync(releaseManifestPath, 'utf8'));
    for (const key of ['version', 'release', 'buildId', 'builtAt', 'target']) {
      if (typeof releaseManifest[key] !== 'string' || !releaseManifest[key]) {
        failures.push(`Release manifest field is missing or invalid: ${key}`);
      }
    }
  } catch (error) {
    failures.push(`Release manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const proxyOutput = join(dist, 'proxy-server.js');
if (target === 'local' && !existsSync(proxyOutput)) {
  failures.push('Missing required local proxy output: dist/proxy-server.js');
}
if (target === 'vercel' && existsSync(proxyOutput)) {
  failures.push('Local proxy-server.js must not be published in the Vercel static output.');
}

if (failures.length) {
  console.error(`Generated ${target} application check failed.`);
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log(
  `Generated ${target} application OK: ${sources.length} emitted runtime script(s), ${htmlFiles.length} HTML file(s), all local script and stylesheet references resolved.`
);
