const { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } = require('fs');
const { dirname, extname, join, relative } = require('path');

const root = process.cwd();
const dist = join(root, 'dist');
const copied = [];

function copyFile(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  copied.push(relative(root, destination));
}

function copyTree(sourceRoot, destinationRoot, shouldCopy = () => true) {
  if (!existsSync(sourceRoot)) return;
  for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = join(sourceRoot, entry.name);
    const destination = join(destinationRoot, entry.name);
    if (entry.isDirectory()) {
      copyTree(source, destination, shouldCopy);
    } else if (entry.isFile() && shouldCopy(source)) {
      copyFile(source, destination);
    }
  }
}

for (const name of ['index.html', 'login.html', 'client-onboarding.html']) {
  copyFile(join(root, name), join(dist, name));
}

copyTree(join(root, 'pages'), join(dist, 'pages'));
copyTree(join(root, 'assets'), join(dist, 'assets'), source => {
  const extension = extname(source).toLowerCase();
  const normalized = relative(root, source).replace(/\\/g, '/');
  if (normalized.startsWith('assets/css/src/')) return false;
  return extension !== '.ts' && extension !== '.js' && extension !== '.bak';
});

console.log(`Copied static application files: ${copied.length}.`);
