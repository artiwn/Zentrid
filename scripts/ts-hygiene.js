const { readdirSync, readFileSync } = require('fs');
const { join, relative } = require('path');

const root = process.cwd();
const includeDirs = ['assets/js', 'types'];
const includeRootTs = true;
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(path);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts'))) {
      files.push(path);
    }
  }
}

for (const dir of includeDirs) walk(join(root, dir));
if (includeRootTs) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.ts')) files.push(join(root, entry.name));
  }
}

const blockers = [];
const anyMarkers = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes('@ts-nocheck')) blockers.push({ file, line: index + 1, text: line.trim() });
    if (/\bas any\b/.test(line)) blockers.push({ file, line: index + 1, text: line.trim() });
    if (/: any\b|\bany\[\]|Promise<any>|Record<string, any>/.test(line)) {
      anyMarkers.push({ file, line: index + 1, text: line.trim() });
    }
  });
}

if (blockers.length) {
  console.error('TypeScript hygiene failed. Remove @ts-nocheck and as any before continuing.');
  blockers.forEach(item => console.error(`${relative(root, item.file)}:${item.line} ${item.text}`));
  process.exit(1);
}

console.log(`TypeScript hygiene OK: ${files.length} file(s) checked.`);
console.log(`Explicit any markers remaining: ${anyMarkers.length} (tracked, not blocking yet).`);
if (anyMarkers.length) {
  const preview = anyMarkers.slice(0, 20);
  preview.forEach(item => console.log(`  ${relative(root, item.file)}:${item.line} ${item.text}`));
  if (anyMarkers.length > preview.length) console.log(`  ... ${anyMarkers.length - preview.length} more`);
}
