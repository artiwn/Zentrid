const { existsSync, readFileSync, readdirSync } = require('fs');
const { dirname, join, relative, resolve } = require('path');

const root = process.cwd();
const browserRoot = join(root, 'assets', 'js');
const htmlFiles = [];
const browserSources = [];
const referencedScripts = new Set();
const failures = [];

function normalize(value) {
  return value.replace(/\\/g, '/');
}

function walk(dir, visitor) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, visitor);
    else if (entry.isFile()) visitor(path);
  }
}

for (const name of ['index.html', 'login.html', 'client-onboarding.html']) {
  const path = join(root, name);
  if (existsSync(path)) htmlFiles.push(path);
}
walk(join(root, 'pages'), path => {
  if (path.endsWith('.html')) htmlFiles.push(path);
});
walk(browserRoot, path => {
  if (path.endsWith('.ts') && !path.endsWith('.d.ts')) browserSources.push(path);
});

const scriptPattern = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  for (const match of html.matchAll(scriptPattern)) {
    const reference = match[1];
    if (!reference || /^(?:https?:)?\/\//i.test(reference) || reference.startsWith('data:')) continue;
    const clean = reference.split(/[?#]/, 1)[0];
    const destination = clean.startsWith('/')
      ? resolve(root, clean.slice(1))
      : resolve(dirname(htmlFile), clean);
    referencedScripts.add(normalize(destination));
  }
}

for (const source of browserSources) {
  const expectedOutput = normalize(resolve(source.replace(/\.ts$/, '.js')));
  if (!referencedScripts.has(expectedOutput)) {
    failures.push(`Browser TypeScript source has no HTML script reference: ${normalize(relative(root, source))}`);
  }
}

if (failures.length) {
  console.error('Browser runtime reference check failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log(
  `Browser runtime references OK: ${browserSources.length} TypeScript source file(s) are linked by ${htmlFiles.length} source HTML file(s).`
);
