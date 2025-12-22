#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = process.cwd();
const debounceMs = Number(process.env.HOOK_GUARD_AUTORELOAD_DEBOUNCE || 1500);
const restartCmd = path.join(repoRoot, 'bin', 'start-guards.sh');

const targets = [
  'bin/watch-hooks.js',
  'application/services/RealtimeGuardService.js',
  'infrastructure/watchdog/token-monitor-loop.sh',
  'infrastructure/watchdog/token-monitor.js',
  'infrastructure/watchdog/token-tracker.sh',
  'bin/start-guards.sh'
];

let restartTimer = null;

const watchers = [];

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[guard-auto-reload ${timestamp}] ${message}`);
}

function scheduleRestart(reason) {
  if (restartTimer) {
    return;
  }
  log(`Change detected (${reason}). Restarting guards in ${debounceMs}ms`);
  restartTimer = setTimeout(() => {
    try {
      const child = spawn(restartCmd, ['restart'], {
        cwd: repoRoot,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
    } catch (error) {
      log(`Failed to launch restart: ${error.message}`);
    } finally {
      process.exit(0);
    }
  }, debounceMs);
  if (typeof restartTimer.unref === 'function') {
    restartTimer.unref();
  }
}

function watchFile(relativePath) {
  const absolute = path.join(repoRoot, relativePath);
  const dir = path.dirname(absolute);
  const file = path.basename(absolute);

  if (!fs.existsSync(absolute)) {
    log(`Warning: ${relativePath} not found; auto-reload will ignore it.`);
    return;
  }

  try {
    const watcher = fs.watch(dir, (event, filename) => {
      if (!filename) {
        return;
      }
      if (filename.toString() === file) {
        scheduleRestart(`${relativePath}:${event}`);
      }
    });
    watchers.push(watcher);
  } catch (error) {
    log(`Error watching ${relativePath}: ${error.message}`);
  }
}

function shutdown() {
  watchers.forEach(w => {
    try {
      w.close();
    } catch (error) {
      log(`Error closing watcher: ${error.message}`); 
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

log('Auto-restart guard running');
targets.forEach(watchFile);

setInterval(() => {}, 1 << 30);
