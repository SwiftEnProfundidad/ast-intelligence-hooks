#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getGitTreeState } = require('../application/services/GitTreeState');
const GitTreeMonitorService = require('../application/services/monitoring/GitTreeMonitorService');
const HeartbeatMonitorService = require('../application/services/monitoring/HeartbeatMonitorService');
const { HealthCheckService } = require('../application/services/monitoring/HealthCheckService');
const { createHealthCheckProviders } = require('../application/services/monitoring/HealthCheckProviders');
const NotificationCenterService = require('../application/services/notification/NotificationCenterService');
const { AutoRecoveryManager } = require('../application/services/recovery/AutoRecoveryManager');
const { EvidenceContextManager } = require('../application/services/evidence/EvidenceContextManager');
const { createUnifiedLogger } = require('../infrastructure/logging/UnifiedLoggerFactory');
const PlatformDetectionService = require('../application/services/PlatformDetectionService');

const repoRoot = process.cwd();
const tmpDir = path.join(repoRoot, '.audit_tmp');
const reportsDir = path.join(repoRoot, '.audit-reports');
const lockDir = path.join(tmpDir, 'guard-supervisor.lock');
const logPath = path.join(reportsDir, 'guard-supervisor.log');
const restartDebounceMs = Number(process.env.HOOK_GUARD_AUTORELOAD_DEBOUNCE || 1500);
const restartForceMs = Number(process.env.HOOK_GUARD_AUTORELOAD_FORCE || 3000);
const dirtyTreeLimit = Number(process.env.HOOK_GUARD_DIRTY_TREE_LIMIT || 24);
const dirtyTreeWarning = Number(process.env.HOOK_GUARD_DIRTY_TREE_WARNING || Math.max(1, Math.floor(dirtyTreeLimit / 2)));
const dirtyTreeIntervalMs = Number(process.env.HOOK_GUARD_DIRTY_TREE_INTERVAL || 60000);
const dirtyTreeReminderMs = Number(process.env.HOOK_GUARD_DIRTY_TREE_REMINDER || 300000);
const heartbeatRelativePath = process.env.HOOK_GUARD_HEARTBEAT_PATH || '.audit_tmp/guard-heartbeat.json';
const heartbeatPath = path.isAbsolute(heartbeatRelativePath) ? heartbeatRelativePath : path.join(repoRoot, heartbeatRelativePath);
const heartbeatIntervalMs = Number(process.env.HOOK_GUARD_HEARTBEAT_INTERVAL || 15000);
const heartbeatMaxAgeMs = Number(process.env.HOOK_GUARD_HEARTBEAT_MAX_AGE || 60000);
const heartbeatCheckIntervalMs = Number(process.env.HOOK_GUARD_HEARTBEAT_CHECK_INTERVAL || 5000);
const debugLogPath = path.join(reportsDir, 'guard-debug.log');
const healthIntervalMs = Number(process.env.HOOK_GUARD_HEALTH_INTERVAL || 60000);
const evidenceIntervalMs = Number(process.env.HOOK_GUARD_EVIDENCE_INTERVAL || 120000);
const evidencePlatforms = process.env.HOOK_GUARD_EVIDENCE_PLATFORMS
  ? process.env.HOOK_GUARD_EVIDENCE_PLATFORMS.split(',').map(item => item.trim()).filter(Boolean)
  : undefined;

fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const unifiedLogger = createUnifiedLogger({
  repoRoot,
  component: 'GuardSupervisor',
  fileName: 'guard-supervisor.log'
});

const notificationCenter = new NotificationCenterService({
  repoRoot,
  logger: unifiedLogger,
  cooldownsByType: {
    health_check_error: 300000,
    health_check_warn: 120000,
    auto_recovery_error: 300000,
    auto_recovery_warn: 180000
  }
});

const autoRecoveryManager = new AutoRecoveryManager({
  repoRoot,
  logger: unifiedLogger,
  notificationCenter,
  strategies: [
    AutoRecoveryManager.createSupervisorRestartStrategy(),
    {
      id: 'guard-child-exit',
      condition: ({ reason }) => typeof reason === 'string' && reason.startsWith('child-exit:guard'),
      action: async ({ logger: recoveryLogger }) => {
        recoveryLogger.info('Attempting guard restart via auto recovery');
        return AutoRecoveryManager.runScript('start-guards.sh', ['restart']);
      }
    },
    {
      id: 'token-child-exit',
      condition: ({ reason }) => typeof reason === 'string' && reason.startsWith('child-exit:tokenMonitor'),
      action: async ({ logger: recoveryLogger }) => {
        recoveryLogger.info('Attempting token monitor restart via auto recovery');
        return AutoRecoveryManager.runScript('start-guards.sh', ['restart']);
      }
    }
  ]
});

const originalEnqueue = notificationCenter.enqueue.bind(notificationCenter);
notificationCenter.enqueue = payload => {
  const result = originalEnqueue(payload);
  if (payload && payload.type === 'health_check_error') {
    autoRecoveryManager.recover({
      key: 'health',
      reason: `health-error:${payload.metadata?.reason || 'unknown'}`,
      context: payload.metadata || {}
    }).catch(error => {
      unifiedLogger.error('GUARD_HEALTH_RECOVERY_ERROR', { message: error.message });
    });
  }
  if (payload && payload.type === 'health_check_info') {
    autoRecoveryManager.clear('health');
  }
  return result;
};

if (!acquireLock()) {
  log('Another guard supervisor instance is already running. Exiting.');
  process.exit(0);
}

const childDefs = {
  guard: {
    command: 'node',
    args: [path.join(repoRoot, 'scripts', 'hooks-system', 'bin', 'watch-hooks.js')],
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, HOOK_GUARD_DIRTY_TREE_DISABLED: 'true' }
  },
  tokenMonitor: {
    command: 'bash',
    args: [path.join(repoRoot, 'scripts', 'hooks-system', 'infrastructure', 'watchdog', 'token-monitor-loop.sh')],
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env
  }
};

const targets = [
  'scripts/hooks-system/bin/watch-hooks.js',
  'scripts/hooks-system/bin/guard-supervisor.js',
  'scripts/hooks-system/bin/start-guards.sh',
  'application/services/RealtimeGuardService.js',
  'scripts/hooks-system/infrastructure/watchdog/token-monitor-loop.sh',
  'scripts/hooks-system/infrastructure/watchdog/token-monitor.js',
  'scripts/hooks-system/infrastructure/watchdog/token-tracker.sh'
];

const watchers = [];
const children = new Map();
let restartTimer = null;
let restartPromise = Promise.resolve();
let shuttingDown = false;

const platformDetector = new PlatformDetectionService();

function appendDebugLogSync(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(debugLogPath, `${timestamp}|${message}\n`);
}

const gitTreeMonitor = new GitTreeMonitorService({
  repoRoot,
  limit: dirtyTreeLimit,
  warning: dirtyTreeWarning,
  reminderMs: dirtyTreeReminderMs,
  intervalMs: dirtyTreeIntervalMs,
  getState: getGitTreeState,
  notifier: (message, level) => log(message, { level }),
  logger: unifiedLogger,
  debugLogger: appendDebugLogSync
});

const heartbeatMonitor = new HeartbeatMonitorService({
  heartbeatPath,
  intervalMs: heartbeatIntervalMs,
  statusProvider: buildHeartbeatPayload,
  logger: unifiedLogger
});

const healthCheckProviders = createHealthCheckProviders({
  repoRoot,
  getGitTreeState,
  heartbeatPath,
  tokenUsagePath: path.join(tmpDir, 'token-usage.jsonl'),
  evidencePath: path.join(repoRoot, '.AI_EVIDENCE.json'),
  processes: [
    {
      name: 'watchHooks',
      pidResolver: () => {
        const description = describeChild('guard');
        return description.running ? description.pid : null;
      }
    },
    {
      name: 'tokenMonitor',
      pidResolver: () => {
        const description = describeChild('tokenMonitor');
        return description.running ? description.pid : null;
      }
    }
  ]
});

const healthCheckService = new HealthCheckService({
  repoRoot,
  providers: healthCheckProviders,
  notificationCenter,
  logger: unifiedLogger,
  outputFile: path.join(tmpDir, 'health-status.json'),
  intervalMs: healthIntervalMs
});

const evidenceContextManager = new EvidenceContextManager({
  repoRoot,
  updateScript: path.join(repoRoot, 'scripts', 'hooks-system', 'bin', 'update-evidence.sh'),
  notificationCenter,
  logger: unifiedLogger,
  intervalMs: evidenceIntervalMs,
  autoPlatforms: evidencePlatforms
});

function acquireLock() {
  try {
    fs.mkdirSync(lockDir, { recursive: false });
    return true;
  } catch (error) {
    return false;
  }
}

function releaseLock() {
  try {
    fs.rmdirSync(lockDir);
  } catch (error) {
    log(`Error releasing lock: ${error.message}`);
  }
}

function log(message, data = {}) {
  const timestamp = formatLocalTimestamp();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  unifiedLogger.info('GUARD_SUPERVISOR_EVENT', { message, ...data });
}

async function startChild(name) {
  const def = childDefs[name];
  if (!def) {
    log(`Unknown child ${name}`);
    return;
  }
  await stopChild(name);
  const child = spawn(def.command, def.args, {
    cwd: def.cwd,
    stdio: def.stdio,
    env: def.env || process.env
  });
  children.set(name, { child });
  autoRecoveryManager.clear(name);
  log(`${name} started (pid ${child.pid})`);
  child.on('exit', (code, signal) => {
    log(`${name} exited (code ${code ?? 'null'} signal ${signal ?? 'null'})`);
    children.delete(name);
    autoRecoveryManager.recover({
      key: name,
      reason: `child-exit:${name}`,
      context: { code, signal }
    }).catch(error => {
      unifiedLogger.error('GUARD_CHILD_RECOVERY_ERROR', { name, message: error.message });
    });
    if (!shuttingDown) {
      scheduleRestart(`${name}-exit:${code ?? 'null'}:${signal ?? 'null'}`);
    }
  });
}

function stopChild(name) {
  const entry = children.get(name);
  if (!entry) {
    return Promise.resolve();
  }
  const { child } = entry;
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch (error) {
        log(`Failed to SIGKILL ${name}: ${error.message}`);
      }
    }, restartForceMs);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    try {
      child.kill('SIGTERM');
    } catch (error) {
      log(`Failed to SIGTERM ${name}: ${error.message}`);
      resolve();
    }
  });
}

function startAll() {
  return Promise.all(Object.keys(childDefs).map(name => startChild(name)));
}

function stopAll() {
  const names = Array.from(children.keys());
  if (!names.length) {
    return Promise.resolve();
  }
  return Promise.all(names.map(name => stopChild(name)));
}

function scheduleRestart(reason) {
  if (restartTimer) {
    return;
  }
  log(`Scheduling restart due to ${reason}`);
  restartTimer = setTimeout(() => {
    restartTimer = null;
    restartAll(reason);
  }, restartDebounceMs);
}

function restartAll(reason) {
  restartPromise = restartPromise.then(async () => {
    if (shuttingDown) {
      return;
    }
    log(`Restarting guards (${reason})`);
    await stopAll();
    await startAll();
    heartbeatMonitor.emitHeartbeat();
    evidenceContextManager.ensureFresh('restart').catch(error => {
      unifiedLogger.error('GUARD_EVIDENCE_REFRESH_FAILED', { message: error.message });
    });
    healthCheckService.collect('restart').catch(error => {
      unifiedLogger.error('GUARD_HEALTHCHECK_RESTART_FAILED', { message: error.message });
    });
  });
}

function watchTargets() {
  const directories = new Map();
  targets.forEach(relPath => {
    const absolute = path.join(repoRoot, relPath);
    if (!fs.existsSync(absolute)) {
      log(`Warning: ${relPath} missing; auto-restart will ignore it.`);
      return;
    }
    const dir = path.dirname(absolute);
    const list = directories.get(dir) || [];
    list.push(path.basename(absolute));
    directories.set(dir, list);
  });

  directories.forEach((files, dir) => {
    try {
      const watcher = fs.watch(dir, (event, filename) => {
        if (!filename) {
          return;
        }
        const normalized = filename.toString();
        if (files.includes(normalized)) {
          scheduleRestart(`${path.relative(repoRoot, path.join(dir, normalized))}:${event}`);
        }
      });
      watchers.push(watcher);
    } catch (error) {
      log(`Error watching ${dir}: ${error.message}`);
    }
  });
}

function buildHeartbeatPayload() {
  const guardStatus = describeChild('guard');
  const tokenStatus = describeChild('tokenMonitor');
  const status = guardStatus.running && tokenStatus.running ? 'healthy' : 'degraded';
  const payload = {
    timestamp: new Date().toISOString(),
    supervisorPid: process.pid,
    status,
    guard: guardStatus,
    tokenMonitor: tokenStatus
  };
  return payload;
}

function describeChild(name) {
  const entry = children.get(name);
  if (!entry || !entry.child) {
    return { running: false, pid: null };
  }
  const { child } = entry;
  if (!child || child.killed) {
    return { running: false, pid: null };
  }
  return { running: true, pid: child.pid };
}

function formatLocalTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const offsetMins = String(absolute % 60).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetMins}`;
}

function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  log('Shutting down guard supervisor');
  watchers.forEach(w => {
    try {
      w.close();
    } catch (error) {
      log(`Error closing watcher: ${error.message}`);
    }
  });
  gitTreeMonitor.stop();
  heartbeatMonitor.stop();
  stopHeartbeatStalenessMonitor();
  healthCheckService.stop();
  evidenceContextManager.stop();
  autoRecoveryManager.clear('guard');
  autoRecoveryManager.clear('tokenMonitor');
  autoRecoveryManager.clear('health');
  notificationCenter.shutdown();
  stopAll().finally(() => {
    releaseLock();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', releaseLock);
process.on('uncaughtException', error => {
  log(`Uncaught exception: ${error.stack || error.message}`);
  shutdown();
});
process.on('unhandledRejection', reason => {
  log(`Unhandled rejection: ${reason instanceof Error ? reason.stack || reason.message : reason}`);
  shutdown();
});

log('Guard supervisor started');

let lastHeartbeatStale = false;
let heartbeatStalenessTimer = null;

function appendDebugLog(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(debugLogPath, `${timestamp}|${message}\n`);
}

function checkHeartbeatStaleness() {
  if (shuttingDown) {
    return;
  }
  try {
    if (!fs.existsSync(heartbeatPath)) {
      return;
    }
    const raw = fs.readFileSync(heartbeatPath, 'utf8');
    if (!raw) {
      return;
    }
    const data = JSON.parse(raw);
    const timestamp = Date.parse(data.timestamp);
    if (!Number.isFinite(timestamp)) {
      return;
    }
    const age = Date.now() - timestamp;
    if (age > heartbeatMaxAgeMs) {
      if (!lastHeartbeatStale) {
        lastHeartbeatStale = true;
        appendDebugLog(`HEARTBEAT_ALERT|stale|ageMs=${age}`);
      }
    } else {
      if (lastHeartbeatStale) {
        lastHeartbeatStale = false;
        appendDebugLog('HEARTBEAT_RECOVERED');
      }
    }
  } catch (error) {
    appendDebugLog(`HEARTBEAT_CHECK_ERROR|${error.message}`);
  }
}

function startHeartbeatStalenessMonitor() {
  if (heartbeatStalenessTimer) {
    clearInterval(heartbeatStalenessTimer);
  }
  if (heartbeatCheckIntervalMs > 0 && heartbeatMaxAgeMs > 0) {
    heartbeatStalenessTimer = setInterval(checkHeartbeatStaleness, heartbeatCheckIntervalMs);
    if (heartbeatStalenessTimer && typeof heartbeatStalenessTimer.unref === 'function') {
      heartbeatStalenessTimer.unref();
    }
  }
}

function stopHeartbeatStalenessMonitor() {
  if (heartbeatStalenessTimer) {
    clearInterval(heartbeatStalenessTimer);
    heartbeatStalenessTimer = null;
  }
}

startAll().then(() => {
  watchTargets();
  gitTreeMonitor.start();
  heartbeatMonitor.start();
  startHeartbeatStalenessMonitor();
  healthCheckService.start('startup');
  evidenceContextManager.start('startup');
}).catch(error => {
  log(`Failed to start guards: ${error.message}`);
  shutdown();
});
