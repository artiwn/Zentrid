const { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } = require('fs');
const { dirname, join, relative } = require('path');
const ts = require('typescript');

const root = process.cwd();
const dist = join(root, 'dist');
const sourceFiles = [];
const failures = [];

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && path.endsWith('.ts') && !path.endsWith('.d.ts')) sourceFiles.push(path);
  }
}

walk(join(root, 'assets', 'js'));

sourceFiles.sort((a, b) => a.localeCompare(b));

const typeOnlyModuleMarker = /^\s*export\s*\{\s*\};\s*\r?\n?/m;
const moduleSyntax = /^\s*(?:import\s|export\s+(?!\{\s*\};))/m;

for (const sourcePath of sourceFiles) {
  const sourceRelative = relative(root, sourcePath).replace(/\\/g, '/');
  const outputPath = join(dist, sourceRelative.replace(/\.ts$/, '.js'));
  const original = readFileSync(sourcePath, 'utf8');

  if (moduleSyntax.test(original)) {
    failures.push(`${sourceRelative}: browser runtime contains unsupported import/export syntax.`);
    continue;
  }

  const classicScriptSource = original.replace(typeOnlyModuleMarker, '');
  const result = ts.transpileModule(classicScriptSource, {
    fileName: sourcePath,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      alwaysStrict: true,
      removeComments: false,
      sourceMap: false,
      inlineSourceMap: false,
      declaration: false,
      newLine: ts.NewLineKind.LineFeed
    }
  });

  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    failures.push(`${sourceRelative}: ${message}`);
  }

  if (/(?:\bexports\.|\bmodule\.exports\b|\brequire\s*\()/.test(result.outputText)) {
    failures.push(`${sourceRelative}: CommonJS syntax leaked into browser output.`);
    continue;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, result.outputText, 'utf8');
}

if (failures.length) {
  console.error('Browser TypeScript build failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log(`Browser TypeScript build OK: ${sourceFiles.length} classic runtime script(s) emitted without CommonJS.`);
