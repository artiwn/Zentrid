const { existsSync, readdirSync, readFileSync } = require('fs');
const { join, resolve } = require('path');
const vm = require('vm');

const root = process.cwd();
const starts = process.argv.slice(2).length ? process.argv.slice(2).map(item => resolve(root, item)) : [join(root, 'assets', 'js')];
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(path);
  }
}

for (const start of starts) {
  if (!existsSync(start)) {
    process.stderr.write(`JS syntax check path not found: ${start}\n`);
    process.exit(1);
  }
  walk(start);
}

let failed = 0;
for (const file of files) {
  try {
    const source = readFileSync(file, 'utf8');
    new vm.Script(source, { filename: file });
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\nJS syntax failed: ${file}\n${message}\n`);
  }
}

if (failed) {
  process.stderr.write(`\n${failed} JavaScript file(s) failed syntax check.\n`);
  process.exit(1);
}

console.log(`JS syntax OK: ${files.length} file(s) checked.`);
