const { existsSync, readdirSync, readFileSync } = require('fs');
const { join, relative } = require('path');

const root = process.cwd();
const dist = join(root, 'dist');
const failures = [];
const browserSources = [];
const browserOutputs = [];

function walk(dir, visitor) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, visitor);
    else if (entry.isFile()) visitor(path);
  }
}

walk(join(root, 'assets', 'js'), path => {
  if (path.endsWith('.ts') && !path.endsWith('.d.ts')) browserSources.push(path);
});

walk(join(dist, 'assets', 'js'), path => {
  if (path.endsWith('.js')) browserOutputs.push(path);
});

const serverOutput = join(dist, 'proxy-server.js');
if (!existsSync(serverOutput)) failures.push('Missing server build output: dist/proxy-server.js');

if (browserOutputs.length !== browserSources.length) {
  failures.push(`Browser build count mismatch: ${browserOutputs.length} emitted for ${browserSources.length} source file(s).`);
}

for (const source of browserSources) {
  const output = join(dist, relative(root, source).replace(/\.ts$/, '.js'));
  if (!existsSync(output)) failures.push(`Missing browser output: ${relative(root, output)}`);
}

if (existsSync(serverOutput)) {
  const source = readFileSync(serverOutput, 'utf8');
  if (!/require\(["']express["']\)/.test(source)) {
    failures.push('Server output is not compiled as the expected Node CommonJS proxy.');
  }
}

for (const output of browserOutputs) {
  const source = readFileSync(output, 'utf8');
  if (/require\(["'](?:express|cors)["']\)/.test(source)) {
    failures.push(`Server dependency leaked into browser output: ${relative(root, output)}`);
  }
}

if (failures.length) {
  console.error('Build boundary check failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log(`Build boundaries OK: ${browserOutputs.length} browser runtime script(s) + 1 Node proxy server.`);
