const { existsSync, readdirSync } = require('fs');
const { join, relative, resolve } = require('path');
const ts = require('typescript');

const root = process.cwd();
const runtimeRoots = [join(root, 'assets', 'js')];
const rootRuntimeSources = ['proxy-server.ts'];
const sources = [];
const failures = [];

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) sources.push(path);
    else if (entry.isFile() && entry.name.endsWith('.bak')) failures.push(`Legacy backup remains: ${relative(root, path)}`);
  }
}

for (const dir of runtimeRoots) walk(dir);
for (const name of rootRuntimeSources) {
  const path = join(root, name);
  if (existsSync(path)) sources.push(path);
  else failures.push(`Runtime TypeScript source is missing: ${name}`);
}

for (const source of sources) {
  const siblingJs = source.slice(0, -3) + '.js';
  if (existsSync(siblingJs)) failures.push(`Generated JavaScript must not be stored beside TypeScript: ${relative(root, siblingJs)}`);
}

const configPath = join(root, 'tsconfig.json');
if (!existsSync(configPath)) {
  failures.push('Main TypeScript configuration is missing: tsconfig.json');
} else {
  const readResult = ts.readConfigFile(configPath, ts.sys.readFile);
  if (readResult.error) {
    failures.push(ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n'));
  } else {
    const parsed = ts.parseJsonConfigFileContent(readResult.config, ts.sys, root, undefined, configPath);
    for (const error of parsed.errors) failures.push(ts.flattenDiagnosticMessageText(error.messageText, '\n'));

    const configuredFiles = new Set(parsed.fileNames.map(file => normalizePath(resolve(file))));
    for (const source of sources) {
      const absolute = normalizePath(resolve(source));
      if (!configuredFiles.has(absolute)) {
        failures.push(`Runtime TypeScript source is not included by tsconfig.json: ${normalizePath(relative(root, source))}`);
      }
    }

    const requiredStrictOptions = [
      'strict',
      'noImplicitReturns',
      'noFallthroughCasesInSwitch',
      'noUncheckedIndexedAccess',
      'exactOptionalPropertyTypes',
      'useUnknownInCatchVariables'
    ];
    for (const option of requiredStrictOptions) {
      if (readResult.config.compilerOptions?.[option] !== true) {
        failures.push(`tsconfig.json must keep compilerOptions.${option} enabled.`);
      }
    }
  }
}

if (failures.length) {
  console.error('TypeScript source-of-truth check failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log(
  `TypeScript source of truth OK: ${sources.length} runtime source file(s), all included by the main strict tsconfig, no checked-in runtime JS duplicates.`
);
