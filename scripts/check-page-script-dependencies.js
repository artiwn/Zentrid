const { readFileSync, readdirSync, statSync } = require('fs');
const { join, relative } = require('path');

const root = process.cwd();
const pagesRoot = join(root, 'pages');
const failures = [];

const dependencies = new Map([
  ['tenants.js', ['form-ux.js', 'form-readiness.js', 'entity-detail-ux.js']],
  ['plants.js', ['form-ux.js', 'form-readiness.js']],
  ['client-hierarchy.js', ['form-ux.js', 'form-readiness.js', 'entity-detail-ux.js']],
  ['integrations.js', ['form-ux.js', 'form-readiness.js']],
  ['devices.js', ['form-readiness.js']],
  ['tasks.js', ['form-readiness.js']],
  ['api-console.js', ['api-diagnostics.js', 'platform-api.js', 'api-contracts.js']]
]);

function walk(dir) {
  const output = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) output.push(...walk(path));
    else if (path.endsWith('.html')) output.push(path);
  }
  return output;
}

for (const page of walk(pagesRoot)) {
  const html = readFileSync(page, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)]
    .map(match => match[1].split('/').pop());
  const index = name => scripts.indexOf(name);

  for (const [consumer, required] of dependencies) {
    const consumerIndex = index(consumer);
    if (consumerIndex < 0) continue;
    for (const dependency of required) {
      const dependencyIndex = index(dependency);
      if (dependencyIndex < 0) {
        failures.push(`${relative(root, page)}: ${consumer} requires missing ${dependency}`);
      } else if (dependencyIndex > consumerIndex) {
        failures.push(`${relative(root, page)}: ${dependency} must load before ${consumer}`);
      }
    }
  }
}

if (failures.length) {
  console.error('Page script dependency check failed.');
  failures.forEach(failure => console.error(`  ${failure}`));
  process.exit(1);
}
console.log('Page script dependency check OK: shared classic-script globals load before their consumers.');
