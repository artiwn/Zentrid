const { existsSync, readdirSync, statSync, watch } = require('fs');
const { basename, extname, join, relative, resolve } = require('path');
const { spawn } = require('child_process');

const root = process.cwd();
const npmExecPath = process.env.npm_execpath;
const sourceDirectories = [
  'assets',
  'pages',
  'scripts',
  'types'
].map(path => join(root, path));
const rootFiles = new Set([
  'index.html',
  'login.html',
  'client-onboarding.html',
  'proxy-server.ts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.server.build.json'
]);
const ignoredDirectories = new Set(['dist', 'node_modules', '.git', '.ts-build']);
const ignoredExtensions = new Set(['.tmp', '.swp']);

let serverProcess = null;
let buildInProgress = false;
let rebuildQueued = false;
let debounceTimer = null;
let shuttingDown = false;
const watchers = new Map();
const intentionallyStoppedProcesses = new WeakSet();

function log(message) {
  console.log(`[Zentrid dev] ${message}`);
}

function runCommand(command, args, options = {}) {
  return new Promise(resolvePromise => {
    let settled = false;
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
      windowsHide: false,
      ...options
    });

    child.on('error', error => {
      if (settled) return;
      settled = true;
      console.error(`[Zentrid dev] Failed to start ${command}: ${error.message}`);
      resolvePromise(false);
    });

    child.on('exit', code => {
      if (settled) return;
      settled = true;
      resolvePromise(code === 0);
    });
  });
}

function runNpm(args) {
  // When this file is launched through `npm run dev`, npm exposes the path to
  // npm-cli.js. Running that file through the current Node executable avoids
  // Windows `spawn EINVAL` errors caused by spawning npm.cmd directly.
  if (npmExecPath && existsSync(npmExecPath)) {
    return runCommand(process.execPath, [npmExecPath, ...args]);
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return runCommand(npmCommand, args, { shell: process.platform === 'win32' });
}

async function stopServer() {
  const child = serverProcess;
  serverProcess = null;
  if (!child || child.killed) return;
  intentionallyStoppedProcesses.add(child);

  await new Promise(resolvePromise => {
    const timeout = setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL');
      resolvePromise();
    }, 3000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolvePromise();
    });

    child.kill('SIGTERM');
  });
}

async function waitForServer(child, timeoutMs = 8000) {
  const port = process.env.PORT || 5050;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) return false;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return true;
    } catch {
      // The proxy is still starting.
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 150));
  }

  return false;
}

async function startServer() {
  const serverEntry = join(root, 'dist', 'proxy-server.js');
  if (!existsSync(serverEntry)) {
    console.error('[Zentrid dev] Cannot start server: dist/proxy-server.js is missing.');
    return false;
  }

  const child = spawn(process.execPath, [serverEntry], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    windowsHide: false
  });
  serverProcess = child;

  child.on('error', error => {
    console.error(`[Zentrid dev] Proxy process error: ${error.message}`);
  });

  child.on('exit', code => {
    if (serverProcess === child) serverProcess = null;
    if (!intentionallyStoppedProcesses.has(child) && !shuttingDown && !buildInProgress) {
      console.error(`[Zentrid dev] Proxy stopped unexpectedly with code ${code ?? 'unknown'}.`);
    }
  });

  const ready = await waitForServer(child);
  if (!ready) {
    console.error('[Zentrid dev] Proxy did not become healthy. Check the server output above.');
    if (serverProcess === child) serverProcess = null;
    return false;
  }

  return true;
}

async function buildAndRestart(reason) {
  if (buildInProgress) {
    rebuildQueued = true;
    return;
  }

  buildInProgress = true;
  rebuildQueued = false;
  log(`${reason}. Running strict typecheck and rebuilding dist...`);
  await stopServer();

  const typecheckOk = await runNpm(['run', 'typecheck']);
  if (!typecheckOk) {
    console.error('[Zentrid dev] Typecheck failed. Fix the errors and save again.');
    buildInProgress = false;
    if (rebuildQueued) scheduleRebuild('Additional changes detected');
    return;
  }

  const buildOk = await runNpm(['run', 'build']);
  if (!buildOk) {
    console.error('[Zentrid dev] Build failed. Fix the errors and save again.');
    buildInProgress = false;
    if (rebuildQueued) scheduleRebuild('Additional changes detected');
    return;
  }

  if (await startServer()) {
    log(`Ready: http://localhost:${process.env.PORT || 5050}/login.html`);
  }

  buildInProgress = false;
  if (rebuildQueued) scheduleRebuild('Additional changes detected');
}

function shouldReactToFile(path) {
  const relativePath = relative(root, path).replace(/\\/g, '/');
  const parts = relativePath.split('/');
  if (parts.some(part => ignoredDirectories.has(part))) return false;
  if (basename(path).startsWith('.#') || basename(path).endsWith('~')) return false;
  if (ignoredExtensions.has(extname(path).toLowerCase())) return false;

  if (!relativePath.includes('/')) return rootFiles.has(relativePath);
  return true;
}

function scheduleRebuild(reason) {
  if (shuttingDown) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    buildAndRestart(reason).catch(error => {
      console.error(`[Zentrid dev] Rebuild error: ${error instanceof Error ? error.message : String(error)}`);
      buildInProgress = false;
    });
  }, 250);
}

function listDirectories(directory) {
  const directories = [];
  if (!existsSync(directory)) return directories;

  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    directories.push(current);

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory() || ignoredDirectories.has(entry.name)) continue;
      stack.push(join(current, entry.name));
    }
  }

  return directories;
}

function addWatcher(directory) {
  const normalized = resolve(directory);
  if (watchers.has(normalized) || !existsSync(normalized) || !statSync(normalized).isDirectory()) return;

  const watcher = watch(normalized, { persistent: true }, (eventType, fileName) => {
    if (!fileName) return;
    const changedPath = join(normalized, fileName.toString());
    if (!shouldReactToFile(changedPath)) return;

    if (eventType === 'rename') refreshWatchers();
    const changed = relative(root, changedPath).replace(/\\/g, '/');
    scheduleRebuild(`Change detected: ${changed}`);
  });

  watcher.on('error', error => {
    console.error(`[Zentrid dev] Watcher error for ${relative(root, normalized)}: ${error.message}`);
  });

  watchers.set(normalized, watcher);
}

function refreshWatchers() {
  for (const directory of sourceDirectories) {
    for (const nestedDirectory of listDirectories(directory)) addWatcher(nestedDirectory);
  }
  addWatcher(root);
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(debounceTimer);
  log(`Stopping (${signal})...`);

  for (const watcher of watchers.values()) watcher.close();
  watchers.clear();
  await stopServer();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', error => {
  console.error(`[Zentrid dev] Uncaught error: ${error.stack || error.message}`);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', error => {
  console.error(`[Zentrid dev] Unhandled rejection: ${error instanceof Error ? error.stack || error.message : String(error)}`);
});

async function main() {
  refreshWatchers();
  log(`Watching ${watchers.size} source director${watchers.size === 1 ? 'y' : 'ies'}.`);
  await buildAndRestart('Initial start');
}

main().catch(error => {
  console.error(`[Zentrid dev] Startup failed: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exit(1);
});
