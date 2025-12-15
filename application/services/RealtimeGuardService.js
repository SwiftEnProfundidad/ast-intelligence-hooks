const fs = require('fs');
const path = require('path');
const { execSync, spawn, spawnSync } = require('child_process');
const ContextDetectionEngine = require('./ContextDetectionEngine');
const PlatformDetectionService = require('./PlatformDetectionService');
const AutonomousOrchestrator = require('./AutonomousOrchestrator');
const AutoExecuteAIStartUseCase = require('../use-cases/AutoExecuteAIStartUseCase');
const { getGitTreeState, isTreeBeyondLimit, summarizeTreeState } = require('./GitTreeState');

const EVIDENCE_PATH = path.join(process.cwd(), '.AI_EVIDENCE.json');
function resolveUpdateEvidenceScript(repoRoot) {
  const candidates = [
    path.join(repoRoot, 'scripts/hooks-system/bin/update-evidence.sh'),
    path.join(repoRoot, 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
    path.join(repoRoot, 'bin/update-evidence.sh')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const UPDATE_EVIDENCE_SCRIPT = resolveUpdateEvidenceScript(process.cwd());

class RealtimeGuardService {
  constructor({ notifier = console, notifications = true } = {}) {
    this.notifier = notifier;
    this.notifications = notifications;
    this.watchers = [];
    this.autoRefreshEnabled = process.env.HOOK_GUARD_AUTO_REFRESH === 'true';
    this.autoRefreshCooldownMs = Number(process.env.HOOK_GUARD_AUTO_REFRESH_COOLDOWN || 180000);
    this.lastAutoRefresh = 0;
    this.repoRoot = process.cwd();
    this.auditDir = path.join(this.repoRoot, '.audit-reports');
    this.tempDir = path.join(this.repoRoot, '.audit_tmp');
    fs.mkdirSync(this.auditDir, { recursive: true });
    fs.mkdirSync(this.tempDir, { recursive: true });
    this.notificationLogPath = path.join(this.auditDir, 'notifications.log');
    this.chatLogPath = path.join(this.tempDir, 'chat-events.log');
    this.debugLogPath = path.join(this.auditDir, 'guard-debug.log');
    this.terminalNotifierPath = this.resolveTerminalNotifier();
    this.osascriptPath = this.resolveOsascript();
    this.notificationTimeout = Number(process.env.HOOK_GUARD_NOTIFY_TIMEOUT || 8);
    this.notificationFailures = 0;
    this.maxNotificationErrors = Number(process.env.HOOK_GUARD_NOTIFY_MAX_ERRORS || 3);
    this.staleThresholdMs = Number(process.env.HOOK_GUARD_EVIDENCE_STALE_THRESHOLD || 180000);
    this.pollIntervalMs = Number(process.env.HOOK_GUARD_EVIDENCE_POLL_INTERVAL || 30000);
    this.reminderIntervalMs = Number(process.env.HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL || 60000);
    this.gitTreeStagedThreshold = Number(process.env.HOOK_GUARD_DIRTY_TREE_STAGED_LIMIT || 10);
    this.gitTreeUnstagedThreshold = Number(process.env.HOOK_GUARD_DIRTY_TREE_UNSTAGED_LIMIT || 15);
    this.gitTreeTotalThreshold = Number(process.env.HOOK_GUARD_DIRTY_TREE_TOTAL_LIMIT || 20);
    this.gitTreeCheckIntervalMs = Number(process.env.HOOK_GUARD_DIRTY_TREE_INTERVAL || 60000);
    this.gitTreeReminderMs = Number(process.env.HOOK_GUARD_DIRTY_TREE_REMINDER || 300000);
    this.dirtyTreeMarkerPath = path.join(this.tempDir, 'dirty-tree-state.json');
    this.lastDirtyTreeNotification = 0;
    this.dirtyTreeActive = false;
    this.gitTreeTimer = null;
    this.lastDirtyTreeState = null;
    this.loadDirtyTreeState();
    this.lastStaleNotification = 0;
    this.pollTimer = null;
    this.tokenMonitorProcess = null;
    this.activityWatcher = null;
    this.lastUserActivityAt = Date.now();
    this.lastActivityLogAt = 0;
    this.inactivityGraceMs = Number(process.env.HOOK_GUARD_INACTIVITY_GRACE_MS || 420000);
    this.autoRefreshInFlight = false;
    this.autoAIStartEnabled = process.env.HOOK_GUARD_AI_START === 'true';
    this.autoAIStartCooldownMs = Number(process.env.HOOK_GUARD_AI_START_COOLDOWN || 60000);
    this.lastAutoAIStart = 0;
    this.contextEngine = new ContextDetectionEngine(this.repoRoot);
    this.platformDetector = new PlatformDetectionService();
    this.orchestrator = new AutonomousOrchestrator(this.contextEngine, this.platformDetector, null);
    this.autoExecuteAIStart = new AutoExecuteAIStartUseCase(this.orchestrator, this.repoRoot);
    this.embedTokenMonitor = process.env.HOOK_GUARD_EMBEDDED_TOKEN_MONITOR === 'true';
    this.tokenMonitorScript = path.join(
      this.repoRoot,
      'scripts',
      'hooks-system',
      'infrastructure',
      'watchdog',
      'token-monitor-loop.sh'
    );
    this.evidenceChangeTimer = null;
    this.gitflowAutoSyncEnabled = process.env.HOOK_GUARD_GITFLOW_AUTOSYNC !== 'false';
    this.gitflowAutoSyncIntervalMs = Number(process.env.HOOK_GUARD_GITFLOW_AUTOSYNC_INTERVAL || 300000);
    this.gitflowAutoSyncCooldownMs = Number(process.env.HOOK_GUARD_GITFLOW_AUTOSYNC_COOLDOWN || 900000);
    this.gitflowAutoCleanEnabled = process.env.HOOK_GUARD_GITFLOW_AUTOCLEAN !== 'false';
    this.gitflowDevelopBranch = process.env.HOOK_GUARD_GITFLOW_DEVELOP_BRANCH || 'develop';
    this.gitflowMainBranch = process.env.HOOK_GUARD_GITFLOW_MAIN_BRANCH || 'main';
    this.gitflowRequireClean = process.env.HOOK_GUARD_GITFLOW_REQUIRE_CLEAN !== 'false';
    this.gitflowSyncStatePath = path.join(this.tempDir, 'gitflow-sync-state.json');
    this.gitflowSyncState = this.loadGitflowSyncState();
    this.gitflowSyncTimer = null;
    this.ghAvailability = undefined;
    this.devDocsStatePath = path.join(this.tempDir, 'dev-docs-state.json');
    this.devDocsCheckIntervalMs = Number(process.env.HOOK_GUARD_DEV_DOCS_CHECK_INTERVAL || 300000);
    this.devDocsStaleThresholdMs = Number(process.env.HOOK_GUARD_DEV_DOCS_STALE_THRESHOLD || 86400000);
    this.devDocsAutoRefreshEnabled = process.env.HOOK_GUARD_DEV_DOCS_AUTO_REFRESH !== 'false';
    this.devDocsTimer = null;

    this.astWatchEnabled = process.env.HOOK_AST_WATCH !== 'false';
    this.astWatchDebounceMs = Number(process.env.HOOK_AST_WATCH_DEBOUNCE || 8000);
    this.astWatchCooldownMs = Number(process.env.HOOK_AST_WATCH_COOLDOWN || 30000);
    this.astWatchTimer = null;
    this.lastAstWatchRun = 0;
  }

  start() {
    this.watchEvidenceFreshness();
    this.watchWorkspaceActivity();
    this.startEvidencePolling();
    this.startGitTreeMonitoring();
    if (this.embedTokenMonitor) {
      this.startTokenMonitorLoop();
    }
    this.startGitflowSync();
    this.startDevDocsMonitoring();
    this.startAstWatch();
    this.performInitialChecks();
  }

  stop() {
    this.watchers.forEach(w => w.close());
    this.watchers = [];
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.gitTreeTimer) {
      clearInterval(this.gitTreeTimer);
      this.gitTreeTimer = null;
    }
    if (this.gitflowSyncTimer) {
      clearInterval(this.gitflowSyncTimer);
      this.gitflowSyncTimer = null;
    }
    if (this.devDocsTimer) {
      clearInterval(this.devDocsTimer);
      this.devDocsTimer = null;
    }
    if (this.tokenMonitorProcess && typeof this.tokenMonitorProcess.kill === 'function') {
      this.tokenMonitorProcess.kill();
      this.tokenMonitorProcess = null;
    }
    if (this.activityWatcher && typeof this.activityWatcher.close === 'function') {
      this.activityWatcher.close();
      this.activityWatcher = null;
    }
    if (this.evidenceChangeTimer) {
      clearTimeout(this.evidenceChangeTimer);
      this.evidenceChangeTimer = null;
    }
    if (this.astWatchTimer) {
      clearTimeout(this.astWatchTimer);
      this.astWatchTimer = null;
    }
  }

  notify(message, level = 'info', options = {}) {
    const { forceDialog = false } = options;
    const entry = `[${this.timestamp()}] [${level.toUpperCase()}] ${message}`;
    this.appendNotificationLog(entry);
    this.appendDebugLog(`NOTIFY|${level}|${forceDialog ? 'force-dialog|' : ''}${message}`);

    if (this.notifier && typeof this.notifier.warn === 'function') {
      this.notifier.warn(`[hook-guard] ${message}`);
    } else {
      console.warn(`[hook-guard] ${message}`);
    }
    if (this.notifications) {
      this.sendMacNotification(message, level, forceDialog);
    }
  }

  startGitTreeMonitoring() {
    if (!Number.isFinite(this.gitTreeStagedThreshold) || this.gitTreeStagedThreshold <= 0 ||
        !Number.isFinite(this.gitTreeUnstagedThreshold) || this.gitTreeUnstagedThreshold <= 0 ||
        !Number.isFinite(this.gitTreeTotalThreshold) || this.gitTreeTotalThreshold <= 0) {
      return;
    }
    const runCheck = async () => {
      try {
        await this.evaluateGitTree();
      } catch (error) {
        this.appendDebugLog(`DIRTY_TREE_ERROR|${error.message}`);
      }
    };
    runCheck();
    if (this.gitTreeCheckIntervalMs > 0) {
      this.gitTreeTimer = setInterval(runCheck, this.gitTreeCheckIntervalMs);
      if (this.gitTreeTimer && typeof this.gitTreeTimer.unref === 'function') {
        this.gitTreeTimer.unref();
      }
    }
  }

  async evaluateGitTree() {
    const state = getGitTreeState({ repoRoot: this.repoRoot });
    const limits = {
      stagedLimit: this.gitTreeStagedThreshold,
      unstagedLimit: this.gitTreeUnstagedThreshold,
      totalLimit: this.gitTreeTotalThreshold
    };
    this.appendDebugLog(
      `DIRTY_TREE_STATE|${state?.stagedCount ?? 0}|${state?.workingCount ?? 0}|${state?.uniqueCount ?? 0}|staged:${limits.stagedLimit}|unstaged:${limits.unstagedLimit}|total:${limits.totalLimit}`
    );

    if (state.uniqueCount > 20) {
      try {
        const IntelligentGitTreeMonitor = require('./IntelligentGitTreeMonitor');
        const intelligentMonitor = new IntelligentGitTreeMonitor({
          repoRoot: this.repoRoot,
          notifier: (notification) => {
            if (notification.action === 'suggest_commit' && notification.data && notification.data.length > 0) {
              this.sendNotification({
                title: notification.title || '📦 Atomic Commit Suggestions',
                subtitle: notification.subtitle || '',
                message: notification.message || '',
                sound: notification.sound || 'Ping'
              });
            }
          },
          logger: this.logger
        });
        await intelligentMonitor.notify();
        return;
      } catch (error) {
        this.appendDebugLog(`INTELLIGENT_ANALYSIS_ERROR|${error.message}`);
      }
    }

    if (isTreeBeyondLimit(state, limits)) {
      this.handleDirtyTree(state, limits);
      return;
    }
    this.resolveDirtyTree(state, limits);
  }

  handleDirtyTree(state, limits) {
    const now = Date.now();
    const summary = summarizeTreeState(state, limits);
    this.dirtyTreeActive = true;
    this.lastDirtyTreeState = state;

    const { stagedLimit, unstagedLimit, totalLimit } = typeof limits === 'number' 
      ? { stagedLimit: limits, unstagedLimit: limits, totalLimit: limits }
      : limits;

    const stagedExceeded = state.stagedCount > stagedLimit;
    const unstagedExceeded = state.workingCount > unstagedLimit;
    const totalExceeded = state.uniqueCount > totalLimit;

    let message = 'Git tree has too many files: ';
    const issues = [];
    if (stagedExceeded) {
      issues.push(`${state.stagedCount} staged (limit: ${stagedLimit})`);
    }
    if (unstagedExceeded) {
      issues.push(`${state.workingCount} unstaged (limit: ${unstagedLimit})`);
    }
    if (totalExceeded) {
      issues.push(`${state.uniqueCount} total (limit: ${totalLimit})`);
    }
    message += issues.join(', ') + '. Clean staging and working before continuing.';

    const lastNotified = this.lastDirtyTreeNotification || 0;
    const withinReminder = lastNotified > 0 && now - lastNotified < this.gitTreeReminderMs;

    if (withinReminder) {
      const remaining = Math.max(this.gitTreeReminderMs - (now - lastNotified), 0);
      this.persistDirtyTreeState(state, limits, lastNotified, true);
      this.appendDebugLog(`DIRTY_TREE_SUPPRESSED|${state.stagedCount}|${state.workingCount}|${state.uniqueCount}|${remaining}`);
      return;
    }

    this.lastDirtyTreeNotification = now;
    this.persistDirtyTreeState(state, limits, now, true);
    this.appendDebugLog(`DIRTY_TREE_ALERT|${state.stagedCount}|${state.workingCount}|${state.uniqueCount}|staged:${stagedLimit}|unstaged:${unstagedLimit}|total:${totalLimit}`);
    this.notify(message, 'error', { forceDialog: true });
  }

  resolveDirtyTree(state, limits) {
    if (!this.dirtyTreeActive) {
      this.removeDirtyTreeMarker();
      return;
    }
    this.dirtyTreeActive = false;
    this.lastDirtyTreeState = null;
    this.lastDirtyTreeNotification = 0;
    this.removeDirtyTreeMarker();
    this.appendDebugLog(`DIRTY_TREE_CLEAR|${state.stagedCount}|${state.workingCount}|${state.uniqueCount}`);
    this.notify('Git tree is clean. You can continue.', 'info');
  }

  persistDirtyTreeState(state, limits, notifiedAt, active = true) {
    try {
      const limitObj = typeof limits === 'number' 
        ? { stagedLimit: limits, unstagedLimit: limits, totalLimit: limits }
        : limits || {};
      const payload = {
        active,
        stagedCount: state?.stagedCount ?? 0,
        workingCount: state?.workingCount ?? 0,
        uniqueCount: state?.uniqueCount ?? 0,
        limits: limitObj,
        notifiedAt: notifiedAt ? new Date(notifiedAt).toISOString() : null,
        timestamp: this.timestamp()
      };
      fs.writeFileSync(this.dirtyTreeMarkerPath, JSON.stringify(payload, null, 2), { encoding: 'utf8' });
    } catch (error) {
      this.appendDebugLog(`DIRTY_TREE_WRITE_ERROR|${error.message}`);
    }
  }

  removeDirtyTreeMarker() {
    try {
      if (fs.existsSync(this.dirtyTreeMarkerPath)) {
        fs.unlinkSync(this.dirtyTreeMarkerPath);
      }
    } catch (error) {
      this.appendDebugLog(`DIRTY_TREE_REMOVE_ERROR|${error.message}`);
    }
  }

  sendNotification(options = {}) {
    const {
      title = 'Hook-System Guard',
      subtitle = '',
      message = '',
      sound = 'Ping'
    } = options;

    const compactMessage = message.replace(/\s+/g, ' ').trim();
    const compactSubtitle = subtitle.replace(/\s+/g, ' ').trim();
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedMessage = compactMessage.replace(/"/g, '\\"');
    const escapedSubtitle = compactSubtitle.replace(/"/g, '\\"');

    const logSuccess = channel => {
      this.appendNotificationLog(`[${this.timestamp()}] [SUCCESS] [${channel}] ${title}: ${compactMessage}`);
    };

    const logFailure = (channel, detail) => {
      const formatted = detail && detail.message ? detail.message : detail || 'unknown error';
      this.appendNotificationLog(`[${this.timestamp()}] [FAIL] [${channel}] ${title}: ${compactMessage} :: ${formatted}`);
    };

    const notifyWithTerminalNotifier = () => {
      if (!this.terminalNotifierPath) {
        return false;
      }
      const args = [
        '-title',
        title,
        '-message',
        compactMessage,
        '-sound',
        sound,
        '-group',
        'hook-system-guard',
        '-ignoreDnD'
      ];
      if (compactSubtitle) {
        args.push('-subtitle', compactSubtitle);
      }
      if (this.notificationTimeout > 0) {
        args.push('-timeout', String(this.notificationTimeout));
      }
      const result = spawnSync(this.terminalNotifierPath, args, {
        stdio: 'ignore'
      });
      if (result.status === 0) {
        this.notificationFailures = 0;
        logSuccess('terminal-notifier');
        return true;
      }
      logFailure('terminal-notifier', result.error || new Error(`exit ${result.status}`));
      return false;
    };

    const notifyWithOsascriptNotification = () => {
      if (!this.osascriptPath) {
        return false;
      }
      const notificationText = compactSubtitle
        ? `display notification "${escapedMessage}" with title "${escapedTitle}" subtitle "${escapedSubtitle}" sound name "${sound}"`
        : `display notification "${escapedMessage}" with title "${escapedTitle}" sound name "${sound}"`;
      const result = spawnSync(this.osascriptPath, [
        '-e',
        notificationText
      ], {
        stdio: 'ignore'
      });
      if (result.status === 0) {
        this.notificationFailures = 0;
        logSuccess('osascript');
        return true;
      }
      logFailure('osascript', result.error || new Error(`exit ${result.status}`));
      return false;
    };

    let delivered = false;
    if (notifyWithTerminalNotifier()) {
      delivered = true;
    } else if (notifyWithOsascriptNotification()) {
      delivered = true;
    }

    if (!delivered) {
      this.notificationFailures++;
      this.appendDebugLog(`NOTIFICATION_FAILED|${this.notificationFailures}`);
    }
  }

  sendMacNotification(message, level, forceDialog = false) {
    const title = 'Hook-System Guard';
    const sound = level === 'error' ? 'Basso' : level === 'warn' ? 'Submarine' : 'Hero';
    const compactMessage = message.replace(/\s+/g, ' ').trim();
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedMessage = compactMessage.replace(/"/g, '\\"');

    const logSuccess = channel => {
      this.appendNotificationLog(`[${this.timestamp()}] [SUCCESS] [${channel}] ${compactMessage}`);
    };

    const logFailure = (channel, detail) => {
      const formatted = detail && detail.message ? detail.message : detail || 'unknown error';
      this.appendNotificationLog(`[${this.timestamp()}] [FAIL] [${channel}] ${compactMessage} :: ${formatted}`);
    };

    const notifyWithTerminalNotifier = () => {
      if (!this.terminalNotifierPath) {
        return false;
      }
      const args = [
        '-title',
        title,
        '-message',
        compactMessage,
        '-sound',
        sound,
        '-group',
        'hook-system-guard',
        '-ignoreDnD'
      ];
      if (this.notificationTimeout > 0) {
        args.push('-timeout', String(this.notificationTimeout));
      }
      if (level === 'error' || level === 'warn') {
        args.push('-subtitle', level.toUpperCase());
      }
      const result = spawnSync(this.terminalNotifierPath, args, {
        stdio: 'ignore'
      });
      if (result.status === 0) {
        this.notificationFailures = 0;
        logSuccess('terminal-notifier');
        return true;
      }
      logFailure('terminal-notifier', result.error || new Error(`exit ${result.status}`));
      return false;
    };

    const notifyWithOsascriptNotification = () => {
      if (!this.osascriptPath) {
        return false;
      }
      const result = spawnSync(this.osascriptPath, [
        '-e',
        `display notification "${escapedMessage}" with title "${escapedTitle}" sound name "${sound}"`
      ], {
        stdio: 'ignore'
      });
      if (result.status === 0) {
        this.notificationFailures = 0;
        logSuccess('osascript');
        return true;
      }
      logFailure('osascript', result.error || new Error(`exit ${result.status}`));
      return false;
    };

    const notifyWithOsascriptDialog = () => {
      return false;
    };

    let delivered = false;
    if (notifyWithTerminalNotifier()) {
      delivered = true;
    } else if (notifyWithOsascriptNotification()) {
      delivered = true;
    }

    const shouldForceDialog = false;
    if (shouldForceDialog) {
      const dialogDelivered = notifyWithOsascriptDialog();
      delivered = dialogDelivered || delivered;
    } else if (!delivered) {
    }

    if (!delivered) {
      this.logNotificationFailure('No native mechanism delivered the notification.');
    }
  }

  resolveTerminalNotifier() {
    const candidates = [
      'command -v terminal-notifier',
      'command -v /opt/homebrew/bin/terminal-notifier',
      'command -v /usr/local/bin/terminal-notifier'
    ];
    for (const candidate of candidates) {
      try {
        const output = execSync(candidate, {
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf8'
        }).trim();
        if (output) {
          return output;
        }
      } catch (error) {
        this.notifier.warn(`[hook-guard] terminal-notifier not found at ${candidate}: ${error.message}`);
        this.appendNotificationLog(`[${this.timestamp()}] [FAIL] terminal-notifier not found at ${candidate}: ${error.message}`);
      }
    }
    return null;
  }

  resolveOsascript() {
    return fs.existsSync('/usr/bin/osascript') ? '/usr/bin/osascript' : null;
  }

  appendNotificationLog(entry) {
    try {
      fs.appendFileSync(this.notificationLogPath, `${entry}\n`, { encoding: 'utf8' });
    } catch (error) {
      const fallback = `[hook-guard] Could not write to notifications.log: ${error.message}`;
      if (this.notifier && typeof this.notifier.warn === 'function') {
        this.notifier.warn(fallback);
      } else {
        console.warn(fallback);
      }
    }
  }

  appendChatLog(entry) {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        ...entry
      };
      fs.appendFileSync(this.chatLogPath, `${JSON.stringify(payload)}\n`, {
        encoding: 'utf8'
      });
    } catch (error) {
      this.appendDebugLog(`CHAT_LOG_ERROR|${error.message}`);
    }
  }

  loadGitflowSyncState() {
    try {
      if (!fs.existsSync(this.gitflowSyncStatePath)) {
        return {};
      }
      const raw = fs.readFileSync(this.gitflowSyncStatePath, 'utf8');
      if (!raw.trim()) {
        return {};
      }
      return JSON.parse(raw);
    } catch (error) {
      this.appendDebugLog(`GITFLOW_STATE_READ_ERROR|${error.message}`);
      return {};
    }
  }

  persistGitflowSyncState(state) {
    try {
      fs.writeFileSync(this.gitflowSyncStatePath, `${JSON.stringify(state, null, 2)}\n`, {
        encoding: 'utf8'
      });
    } catch (error) {
      this.appendDebugLog(`GITFLOW_STATE_WRITE_ERROR|${error.message}`);
    }
  }

  updateGitflowSyncState(patch) {
    this.gitflowSyncState = {
      ...(this.gitflowSyncState || {}),
      ...(patch || {})
    };
    this.persistGitflowSyncState(this.gitflowSyncState);
  }

  startGitflowSync() {
    if (!this.gitflowAutoSyncEnabled) {
      return;
    }

    const runCheck = trigger => {
      this.ensureDevelopMainSync(trigger)
        .then(() => null)
        .catch(error => {
          this.appendDebugLog(`GITFLOW_AUTOSYNC_ERROR|${error.message}`);
        });
    };

    runCheck('startup');

    if (this.gitflowAutoSyncIntervalMs > 0) {
      this.gitflowSyncTimer = setInterval(() => runCheck('interval'), this.gitflowAutoSyncIntervalMs);
      if (this.gitflowSyncTimer && typeof this.gitflowSyncTimer.unref === 'function') {
        this.gitflowSyncTimer.unref();
      }
    }
  }

  async ensureDevelopMainSync(trigger = 'interval') {
    if (!this.gitflowAutoSyncEnabled) {
      return;
    }

    let statusOutput = '';
    try {
      statusOutput = execSync('git status --porcelain', {
        cwd: this.repoRoot,
        encoding: 'utf8'
      }).trim();
    } catch (error) {
      this.appendDebugLog(`GITFLOW_AUTOSYNC_SKIP|status-error|${error.message}`);
      return;
    }

    if (statusOutput) {
      const dirtyCount = statusOutput
        .split('\n')
        .map(entry => entry.trim())
        .filter(Boolean).length;
      if (this.gitflowRequireClean) {
        this.appendDebugLog(`GITFLOW_AUTOSYNC_SKIP|dirty-tree|${dirtyCount}`);
        return;
      }
      this.appendDebugLog(`GITFLOW_AUTOSYNC_DIRTY_OK|${dirtyCount}`);
    }

    let countsOutput = '';
    try {
      countsOutput = execSync(
        `git rev-list --left-right --count ${this.gitflowMainBranch}...${this.gitflowDevelopBranch}`,
        {
          cwd: this.repoRoot,
          encoding: 'utf8'
        }
      )
        .toString()
        .trim();
    } catch (error) {
      this.appendDebugLog(`GITFLOW_AUTOSYNC_SKIP|rev-list-error|${error.message}`);
      return;
    }

    const parts = countsOutput.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      this.appendDebugLog('GITFLOW_AUTOSYNC_SKIP|invalid-counts');
      return;
    }

    const behind = Number(parts[0]);
    const ahead = Number(parts[1]);

    if (!Number.isFinite(ahead) || ahead <= 0) {
      this.appendDebugLog(`GITFLOW_AUTOSYNC_SKIP|no-diff|ahead=${ahead}|behind=${behind}`);
      return;
    }

    let developSha = '';
    try {
      developSha = execSync(`git rev-parse ${this.gitflowDevelopBranch}`, {
        cwd: this.repoRoot,
        encoding: 'utf8'
      })
        .toString()
        .trim();
    } catch (error) {
      this.appendDebugLog(`GITFLOW_AUTOSYNC_SKIP|rev-parse-develop|${error.message}`);
      return;
    }

    const lastSha = this.gitflowSyncState?.lastDevelopSha || null;
    const lastCreatedAt = this.gitflowSyncState?.lastCreatedAt
      ? Date.parse(this.gitflowSyncState.lastCreatedAt)
      : 0;

    if (lastSha === developSha && Date.now() - lastCreatedAt < this.gitflowAutoSyncCooldownMs) {
      this.appendDebugLog(`GITFLOW_AUTOSYNC_SKIP|cooldown|ahead=${ahead}`);
      return;
    }

    if (!this.isGhAvailable()) {
      this.appendDebugLog('GITFLOW_AUTOSYNC_SKIP|gh-missing');
      return;
    }

    const listResult = spawnSync(
      'gh',
      ['pr', 'list', '--base', this.gitflowMainBranch, '--head', this.gitflowDevelopBranch, '--state', 'open', '--json', 'url'],
      {
        cwd: this.repoRoot,
        encoding: 'utf8'
      }
    );

    if (listResult.status !== 0) {
      this.appendDebugLog(
        `GITFLOW_AUTOSYNC_ERROR|pr-list|${(listResult.stderr || '').trim() || 'unknown'}`
      );
      return;
    }

    const normalizedList = (listResult.stdout || '').trim();
    if (normalizedList && normalizedList !== '[]') {
      this.appendDebugLog(`GITFLOW_AUTOSYNC_SKIP|pr-open|${normalizedList}`);
      this.updateGitflowSyncState({
        lastDevelopSha: developSha,
        lastCheckedAt: new Date().toISOString()
      });
      return;
    }

    const title =
      process.env.HOOK_GUARD_GITFLOW_PR_TITLE ||
      `Sync ${this.gitflowDevelopBranch} into ${this.gitflowMainBranch}`;
    const body =
      process.env.HOOK_GUARD_GITFLOW_PR_BODY ||
      `## Summary
- Auto-sync ${this.gitflowDevelopBranch} into ${this.gitflowMainBranch}

## Context
- Trigger: ${trigger}
- Ahead commits: ${ahead}
- Behind commits: ${behind}
`;

    const createResult = spawnSync(
      'gh',
      [
        'pr',
        'create',
        '--base',
        this.gitflowMainBranch,
        '--head',
        this.gitflowDevelopBranch,
        '--title',
        title,
        '--body',
        body
      ],
      {
        cwd: this.repoRoot,
        encoding: 'utf8'
      }
    );

    if (createResult.status !== 0) {
      this.appendDebugLog(
        `GITFLOW_AUTOSYNC_ERROR|pr-create|${(createResult.stderr || '').trim() || 'unknown'}`
      );
      return;
    }

    const prUrl = this.extractPrUrl(createResult.stdout);

    this.appendDebugLog(`GITFLOW_AUTOSYNC_PR_CREATED|ahead=${ahead}|url=${prUrl || 'n/a'}`);
    this.appendChatLog({
      type: 'gitflow-autosync',
      message: `Pull request ${prUrl || '(no URL)'} created automatically to sync ${this.gitflowDevelopBranch} → ${this.gitflowMainBranch}`,
      ahead,
      trigger
    });
    this.notify(
      `PR ${this.gitflowDevelopBranch} → ${this.gitflowMainBranch} created automatically.`,
      'info'
    );

    this.updateGitflowSyncState({
      lastDevelopSha: developSha,
      lastCreatedAt: new Date().toISOString(),
      lastAhead: ahead,
      lastTrigger: trigger
    });

    if (this.gitflowAutoCleanEnabled) {
      this.cleanupMergedBranches();
    }
  }

  isGhAvailable() {
    if (typeof this.ghAvailability === 'boolean') {
      return this.ghAvailability;
    }
    const result = spawnSync('gh', ['--version'], {
      cwd: this.repoRoot,
      stdio: 'ignore'
    });
    this.ghAvailability = result.status === 0;
    if (!this.ghAvailability) {
      this.appendDebugLog('GITFLOW_AUTOSYNC_WARN|gh-unavailable');
    }
    return this.ghAvailability;
  }

  cleanupMergedBranches() {
    const currentBranchResult = spawnSync('git', ['branch', '--show-current'], {
      cwd: this.repoRoot,
      encoding: 'utf8'
    });

    if (currentBranchResult.status !== 0) {
      this.appendDebugLog(
        `GITFLOW_AUTOCLEAN_SKIP|current-branch|${(currentBranchResult.stderr || '').trim() || 'unknown'}`
      );
      return;
    }

    const currentBranch = (currentBranchResult.stdout || '').trim();

    let mergedOutput = '';
    try {
      mergedOutput = execSync(`git branch --merged ${this.gitflowDevelopBranch}`, {
        cwd: this.repoRoot,
        encoding: 'utf8'
      }).toString();
    } catch (error) {
      this.appendDebugLog(`GITFLOW_AUTOCLEAN_SKIP|merged-error|${error.message}`);
      return;
    }

    const branches = mergedOutput
      .split('\n')
      .map(entry => entry.replace('*', '').trim())
      .filter(Boolean)
      .filter(
        branch =>
        branch !== this.gitflowDevelopBranch &&
        branch !== this.gitflowMainBranch &&
        branch !== currentBranch &&
        /^(feature|fix|chore|docs|refactor|test|ci)\//.test(branch)
      );

    if (!branches.length) {
      this.appendDebugLog('GITFLOW_AUTOCLEAN_SKIP|no-branches');
      return;
    }

    const removedLocal = [];
    const removedRemote = [];
    const failures = [];

    branches.forEach(branch => {
      const deleteLocal = spawnSync('git', ['branch', '-d', branch], {
        cwd: this.repoRoot,
        encoding: 'utf8'
      });

      if (deleteLocal.status !== 0) {
        failures.push({
          branch,
          reason: (deleteLocal.stderr || '').trim() || 'local-delete-failed'
        });
        return;
      }

      removedLocal.push(branch);

      const remoteCheck = spawnSync('git', ['ls-remote', '--heads', 'origin', branch], {
        cwd: this.repoRoot,
        encoding: 'utf8'
      });

      if (remoteCheck.status === 0 && remoteCheck.stdout && remoteCheck.stdout.trim().length > 0) {
        const deleteRemote = spawnSync('git', ['push', 'origin', '--delete', branch], {
          cwd: this.repoRoot,
          encoding: 'utf8'
        });

        if (deleteRemote.status === 0) {
          removedRemote.push(branch);
        } else {
          failures.push({
            branch,
            reason: (deleteRemote.stderr || '').trim() || 'remote-delete-failed'
          });
        }
      }
    });

    if (removedLocal.length) {
      this.appendDebugLog(`GITFLOW_AUTOCLEAN_SUCCESS|${removedLocal.join(',')}`);
      this.appendChatLog({
        type: 'gitflow-autoclean',
        message: `Branches cleaned automatically: ${removedLocal.join(', ')}`,
        remoteRemoved: removedRemote
      });
      this.notify(`Clean branches: ${removedLocal.join(', ')}`, 'info');
      this.updateGitflowSyncState({
        lastCleanedAt: new Date().toISOString(),
        lastCleanedBranches: removedLocal
      });
    }

    failures.forEach(item => {
      this.appendDebugLog(`GITFLOW_AUTOCLEAN_FAIL|${item.branch}|${item.reason}`);
    });
  }

  extractPrUrl(output) {
    if (!output) {
      return null;
    }
    const text = output.toString().trim();
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0].replace(/[)\]]$/, '') : text || null;
  }

  appendDebugLog(message) {
    fs.appendFileSync(this.debugLogPath, `${this.timestamp()}|${message}\n`, {
      encoding: 'utf8'
    });
  }

  logNotificationFailure(details) {
    this.notificationFailures += 1;
    const entry = `[${this.timestamp()}] [FAIL] ${details}`;
    this.appendNotificationLog(entry);
    this.appendDebugLog(`NOTIFY_FAIL|${details}`);
    if (this.notificationFailures <= this.maxNotificationErrors) {
      const failure = `Failed to send native notification: ${details}`;
      if (this.notifier && typeof this.notifier.warn === 'function') {
        this.notifier.warn(`[hook-guard] ${failure}`);
      } else {
        console.warn(`[hook-guard] ${failure}`);
      }
    }
  }

  watchEvidenceFreshness() {
    const watcher = fs.watch(EVIDENCE_PATH, () => {
      if (this.evidenceChangeTimer) {
        clearTimeout(this.evidenceChangeTimer);
      }
      this.evidenceChangeTimer = setTimeout(() => {
        try {
          this.evaluateEvidenceAge('watcher-change', true);
        } catch (error) {
          this.notify(`Could not validate .AI_EVIDENCE.json: ${error.message}`, 'error');
        }
      }, 1000);
      if (this.evidenceChangeTimer.unref) {
        this.evidenceChangeTimer.unref();
      }
    });
    this.watchers.push(watcher);
  }

  startAstWatch() {
    if (!this.astWatchEnabled) {
      return;
    }

    const candidates = [
      path.join(this.repoRoot, 'apps', 'backend', 'src'),
      path.join(this.repoRoot, 'apps', 'frontend'),
      path.join(this.repoRoot, 'apps', 'web'),
      path.join(this.repoRoot, 'ios'),
      path.join(this.repoRoot, 'android')
    ];

    const handleChange = (eventType, filename, baseDir) => {
      if (!filename) return;
      const fullPath = path.join(baseDir, filename);
      if (!this.shouldWatchAstFile(fullPath)) return;
      this.scheduleAstRun(fullPath);
    };

    candidates.forEach(dir => {
      if (!fs.existsSync(dir)) return;
      try {
        const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
          handleChange(eventType, filename, dir);
        });
        this.watchers.push(watcher);
        this.appendDebugLog(`AST_WATCH_STARTED|${dir}`);
      } catch (error) {
        this.appendDebugLog(`AST_WATCH_ERROR|watch-init|${dir}|${error.message}`);
      }
    });
  }

  shouldWatchAstFile(filePath) {
    const exts = ['.ts', '.tsx', '.js', '.jsx', '.swift', '.kt', '.kts'];
    const ext = path.extname(filePath);
    if (!exts.includes(ext)) {
      return false;
    }
    const p = filePath.replace(/\\/g, '/');
    if (p.includes('/node_modules/')) return false;
    if (p.includes('/scripts/hooks-system/')) return false;
    if (p.includes('/.git/')) return false;
    if (p.includes('/.audit_tmp/')) return false;
    if (p.includes('/.next/')) return false;
    if (p.includes('/dist/')) return false;
    return true;
  }

  scheduleAstRun(changedFile) {
    const now = Date.now();

    if (this.lastAstWatchRun && now - this.lastAstWatchRun < this.astWatchCooldownMs) {
      this.appendDebugLog(`AST_WATCH_SKIPPED|cooldown|${changedFile}`);
      return;
    }

    if (this.astWatchTimer) {
      clearTimeout(this.astWatchTimer);
      this.astWatchTimer = null;
    }

    this.astWatchTimer = setTimeout(() => {
      this.runAstAnalysis(changedFile);
    }, this.astWatchDebounceMs);

    if (this.astWatchTimer && typeof this.astWatchTimer.unref === 'function') {
      this.astWatchTimer.unref();
    }
  }

  runAstAnalysis(changedFile) {
    this.astWatchTimer = null;
    this.lastAstWatchRun = Date.now();

    const astScript = path.join(
      this.repoRoot,
      'scripts',
      'hooks-system',
      'infrastructure',
      'ast',
      'ast-intelligence.js'
    );

    this.appendDebugLog(`AST_WATCH_RUN|${changedFile || 'unknown'}`);

    try {
      const result = spawnSync('node', [astScript], {
        cwd: this.repoRoot,
        encoding: 'utf8',
        stdio: 'ignore'
      });

      if (result.status !== 0) {
        this.appendDebugLog(`AST_WATCH_ERROR|exit|${result.status}`);
        this.notify(`AST watch failed (exit ${result.status}).`, 'error');
        return;
      }
    } catch (error) {
      this.appendDebugLog(`AST_WATCH_ERROR|spawn|${error.message}`);
      this.notify(`AST watch failed: ${error.message}`, 'error');
      return;
    }

    try {
      const outDir = process.env.AUDIT_TMP || path.join(this.repoRoot, '.audit_tmp');
      const summaryPath = path.join(outDir, 'ast-summary.json');

      if (!fs.existsSync(summaryPath)) {
        this.appendDebugLog('AST_WATCH_NO_SUMMARY');
        return;
      }

      const raw = fs.readFileSync(summaryPath, 'utf8');
      if (!raw.trim()) {
        this.appendDebugLog('AST_WATCH_EMPTY_SUMMARY');
        return;
      }

      const summary = JSON.parse(raw);
      const totals = summary.totals || {};
      const errors = totals.errors || 0;
      const warnings = totals.warnings || 0;
      const infos = totals.infos || 0;
      const relFile = changedFile ? path.relative(this.repoRoot, changedFile) : null;

      const baseMessage = relFile
        ? `AST watch: errors=${errors} warnings=${warnings} infos=${infos} (last: ${relFile})`
        : `AST watch: errors=${errors} warnings=${warnings} infos=${infos}`;
      const level = errors > 0 ? 'error' : warnings > 0 ? 'warn' : 'info';

      this.notify(baseMessage, level);
    } catch (error) {
      this.appendDebugLog(`AST_WATCH_SUMMARY_ERROR|${error.message}`);
    }
  }

  performInitialChecks() {
    if (!fs.existsSync(EVIDENCE_PATH)) {
      this.notify('No .AI_EVIDENCE.json found, run update-evidence.', 'warn');
      this.attemptAutoRefresh('initial-missing').catch(error => {
        this.notify(`Auto-refresh failed: ${error.message}`, 'error');
      });
    } else {
      try {
        this.evaluateEvidenceAge('initial-check');
      } catch (error) {
        this.notify(`Error reading initial evidence: ${error.message}`, 'error');
      }
    }
  }

  timestamp() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const offsetMinutes = now.getTimezoneOffset();
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offsetAbs = Math.abs(offsetMinutes);
    const offsetHours = pad(Math.floor(offsetAbs / 60));
    const offsetMins = pad(offsetAbs % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMins}`;
  }

  async attemptAutoRefresh(reason) {
    if (!this.autoRefreshEnabled) {
      return;
    }

    if (!UPDATE_EVIDENCE_SCRIPT || !fs.existsSync(UPDATE_EVIDENCE_SCRIPT)) {
      return;
    }

    const now = Date.now();
    const evidenceTimestamp = this.readEvidenceTimestamp();
    if (!evidenceTimestamp) {
      this.appendDebugLog(`AUTO_REFRESH_SKIPPED|${reason}|no-timestamp`);
      return;
    }
    if (now - evidenceTimestamp < this.staleThresholdMs) {
      this.appendDebugLog(`AUTO_REFRESH_SKIPPED|${reason}|fresh-evidence`);
      return;
    }
    if (now - this.lastAutoRefresh < this.autoRefreshCooldownMs) {
      return;
    }

    if (this.autoRefreshInFlight) {
      this.appendDebugLog(`AUTO_REFRESH_SKIPPED|${reason}|busy`);
      return;
    }

    this.autoRefreshInFlight = true;

    const allowAIStart = this.autoAIStartEnabled && now - this.lastAutoAIStart >= this.autoAIStartCooldownMs;

    try {
      let aiResult = null;
      let platformsUsed = [];

      if (allowAIStart) {
        const analysis = await this.safeAnalyzeContext();
        platformsUsed = this.resolvePlatformsForAIStart(analysis);
        const confidence = analysis?.confidence ?? 100;
        aiResult = await this.autoExecuteAIStart.execute(platformsUsed, Math.max(confidence, 100));

        this.appendDebugLog(
          `AI_START_RESULT|${reason}|${JSON.stringify({
            platforms: platformsUsed,
            confidence,
            success: aiResult?.success,
            action: aiResult?.action
          })}`
        );

        if (!aiResult || !aiResult.success || aiResult.action === 'error') {
          const fallbackMsg = aiResult?.message || 'Auto ai-start failed, falling back to direct refresh.';
          this.notify(fallbackMsg, 'warn', { forceDialog: true });
        }
      } else {
        platformsUsed = this.resolvePlatformsForAIStart(null);
      }

      if (!platformsUsed.length) {
        platformsUsed = this.resolvePlatformsForAIStart(null);
      }

      const refreshReason = `guard-auto-refresh-${reason}`;
      const evidenceResult = this.runDirectEvidenceRefresh(platformsUsed, refreshReason);

      this.lastAutoRefresh = Date.now();
      this.lastAutoAIStart = Date.now();
      this.lastStaleNotification = 0;
      this.lastUserActivityAt = Date.now();
      this.appendDebugLog(`AUTO_REFRESH_SUCCESS|${reason}|${platformsUsed.join(',') || 'default'}`);
      this.appendChatLog({
        type: 'auto-evidence',
        reason,
        platforms: platformsUsed,
        evidence: evidenceResult || null
      });

      setTimeout(() => {
        const friendlyMessage =
          reason === 'stale'
            ? 'Evidence refreshed automatically; protocol answered without intervention.'
            : `Evidence refreshed automatically (${reason}); protocol answered.`;
        const shouldForceDialog = reason === 'stale';
        const extraDetails = platformsUsed.length ? ` Platforms analyzed: ${platformsUsed.join(', ')}.` : '';
        this.notify(`${friendlyMessage}${extraDetails}`, 'info', { forceDialog: shouldForceDialog });
      }, 2000);
    } catch (error) {
      this.appendDebugLog(`AUTO_REFRESH_FAILED|${reason}|${error.message}`);
      this.notify(`Evidence auto-renewal failed: ${error.message}`, 'error');
    } finally {
      this.autoRefreshInFlight = false;
    }
  }

  startEvidencePolling() {
    if (this.pollIntervalMs <= 0) {
      return;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    this.pollTimer = setInterval(() => {
      try {
        this.evaluateEvidenceAge('polling');
      } catch (error) {
        this.notify(`Error evaluating evidence by polling: ${error.message}`, 'error');
      }
    }, this.pollIntervalMs);
    if (typeof this.pollTimer.unref === 'function') {
      this.pollTimer.unref();
    }
  }

  evaluateEvidenceAge(reason, notifyFresh = false) {
    const timestamp = this.readEvidenceTimestamp();
    if (!timestamp) {
      return;
    }
    const age = Date.now() - timestamp;
    if (age > this.staleThresholdMs) {
      const sinceActivity = Date.now() - this.lastUserActivityAt;
      if (sinceActivity < this.inactivityGraceMs) {
        this.appendDebugLog(`STALE_SUPPRESSED|recent-activity|${sinceActivity}`);
        return;
      }
      this.triggerStaleAlert(reason, age);
      return;
    }
    if (notifyFresh && this.lastStaleNotification !== 0) {
      this.notify('Evidence updated; back within SLA.', 'info');
    }
    this.lastStaleNotification = 0;
  }

  readEvidenceTimestamp() {
    if (!fs.existsSync(EVIDENCE_PATH)) {
      return null;
    }
    try {
      const raw = fs.readFileSync(EVIDENCE_PATH, 'utf8');
      const data = JSON.parse(raw);
      const timestamp = new Date(data.timestamp).getTime();
      if (!Number.isFinite(timestamp)) {
        return null;
      }
      return timestamp;
    } catch (error) {
      this.appendDebugLog(`EVIDENCE_READ_ERROR|${error.message}`);
      return null;
    }
  }

  triggerStaleAlert(reason, age) {
    const now = Date.now();
    if (now - this.lastStaleNotification < this.reminderIntervalMs) {
      return;
    }
    this.lastStaleNotification = now;
    const minutes = Math.round(this.staleThresholdMs / 60000);
    const formattedAge = Math.round(age / 60000);
    const message = formattedAge > minutes
      ? `Evidence has been ${formattedAge} minutes out of SLA (limit ${minutes}). Run update-evidence.`
      : `Evidence exceeds the ${minutes} minute limit. Run update-evidence.`;
    this.notify(message, 'warn', { forceDialog: true });
    this.attemptAutoRefresh('stale').catch(error => {
      this.notify(`Auto-refresh failed: ${error.message}`, 'error');
    });
  }

  watchWorkspaceActivity() {
    if (this.activityWatcher) {
      return;
    }

    try {
      const normalizePath = value => {
        if (!value) {
          return '';
        }
        return value
          .replace(/\\/g, '/')
          .replace(/^(\.\/)+/, '')
          .replace(/^(\.\.\/)+/, '')
          .replace(/\/+/g, '/')
          .toLowerCase();
      };

      const auditRelative = normalizePath(path.relative(process.cwd(), this.auditDir));
      const ignoredSegments = new Set(
        [
          '.audit-reports',
          '.audit_tmp',
          '.git',
          'node_modules',
          auditRelative
        ]
          .map(normalizePath)
          .filter(Boolean)
          .map(entry => entry.split('/')[0])
      );

      const ignoredExactFiles = new Set(
        [
          '.ai_token_status.txt',
          '.ai_token_status.backup',
          '.guard-auto-manager.pid',
          '.guard-supervisor.pid',
          '.guard-test-activity',
          'guard-auto-reload.log',
          '.guard-supervisor.pid.lock'
        ].map(normalizePath)
      );

      this.activityWatcher = fs.watch(process.cwd(), { recursive: true }, (event, filename) => {
        if (!filename) {
          this.registerActivity('fswatch', 'unknown');
          return;
        }

        const sanitized = normalizePath(filename);
        if (!sanitized) {
          this.registerActivity('fswatch', 'unknown');
          return;
        }

        if (sanitized.includes('.ai_evidence.json')) {
          return;
        }

        if (ignoredExactFiles.has(sanitized)) {
          return;
        }

        const [firstSegment] = sanitized.split('/');
        if (firstSegment && ignoredSegments.has(firstSegment)) {
          return;
        }

        this.registerActivity('fswatch', sanitized);
      });
      this.watchers.push(this.activityWatcher);
    } catch (error) {
      this.appendDebugLog(`ACTIVITY_WATCH_ERROR|${error.message}`);
    }
  }

  registerActivity(source, details) {
    this.lastUserActivityAt = Date.now();
    if (this.lastUserActivityAt - this.lastActivityLogAt > 60000) {
      this.appendDebugLog(`ACTIVITY|${source}|${details || 'unknown'}`);
      this.lastActivityLogAt = this.lastUserActivityAt;
    }
  }

  async safeAnalyzeContext() {
    if (!this.autoAIStartEnabled) {
      return null;
    }

    try {
      const analysis = await this.orchestrator.analyzeContext();
      return analysis;
    } catch (error) {
      this.appendDebugLog(`AI_ANALYSIS_ERROR|${error.message}`);
      return null;
    }
  }

  resolvePlatformsForAIStart(analysis) {
    const defaultPlatforms = ['frontend', 'backend', 'ios', 'android'];
    if (!analysis || !analysis.platforms || analysis.platforms.length === 0) {
      return defaultPlatforms;
    }
    const extracted = analysis.platforms
      .map(entry => entry.platform || entry)
      .filter(Boolean);
    return extracted.length > 0 ? extracted : defaultPlatforms;
  }

  runDirectEvidenceRefresh(platformsUsed, reason) {
    if (!UPDATE_EVIDENCE_SCRIPT || !fs.existsSync(UPDATE_EVIDENCE_SCRIPT)) {
      this.appendDebugLog(`EVIDENCE_REFRESH_SKIPPED|${reason}|missing-script`);
      this.notify('Failed to refresh evidence: update-evidence.sh not found', 'error');
      return null;
    }

    const effectivePlatforms = Array.isArray(platformsUsed) && platformsUsed.length
      ? platformsUsed.join(',')
      : 'frontend,backend,ios,android';

    const env = {
      ...process.env,
      AUTO_EVIDENCE_REASON: reason || 'guard-auto-refresh',
      AUTO_EVIDENCE_TRIGGER: 'realtime-guard',
      AUTO_EVIDENCE_SUMMARY: `Auto refresh ${reason || 'guard'}`,
      AUTO_EVIDENCE_EXTRA: 'No manual changes during execution.',
      AUTO_EVIDENCE_PLATFORM_LIST: effectivePlatforms
    };

    const result = spawnSync('bash', [UPDATE_EVIDENCE_SCRIPT, '--auto', '--platforms', effectivePlatforms], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env
    });

    if (result.status !== 0) {
      const errorMessage = result.stderr || result.stdout || `exit ${result.status}`;
      this.appendDebugLog(`EVIDENCE_REFRESH_FAILED|${reason}|${errorMessage}`);
      this.notify(`Failed to refresh evidence: ${errorMessage}`, 'error');
      return null;
    }

    let parsed = null;
    const trimmed = (result.stdout || '').trim();
    if (trimmed) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (error) {
        this.appendDebugLog(`EVIDENCE_REFRESH_PARSE_ERROR|${reason}|${error.message}`);
      }
    }

    this.appendDebugLog(`EVIDENCE_REFRESH_SUCCESS|${reason}|${effectivePlatforms}`);
    return parsed;
  }

  startTokenMonitorLoop() {
    if (!this.embedTokenMonitor) {
      return;
    }
    if (this.tokenMonitorProcess || !fs.existsSync(this.tokenMonitorScript)) {
      return;
    }
    try {
      const child = spawn(this.tokenMonitorScript, {
        cwd: process.cwd(),
        stdio: 'ignore'
      });
      this.tokenMonitorProcess = child;
      child.on('exit', () => {
        this.tokenMonitorProcess = null;
      });
    } catch (error) {
      this.notify(`Token monitor loop failed to start: ${error.message}`, 'error');
    }
  }

  loadDirtyTreeState() {
    if (!this.dirtyTreeMarkerPath) {
      return;
    }
    if (!fs.existsSync(this.dirtyTreeMarkerPath)) {
      return;
    }
    try {
      const raw = fs.readFileSync(this.dirtyTreeMarkerPath, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        this.dirtyTreeActive = Boolean(data.active);
        if (Number.isFinite(Number(data.stagedCount))) {
          this.lastDirtyTreeState = {
            stagedCount: Number(data.stagedCount) || 0,
            workingCount: Number(data.workingCount) || 0,
            uniqueCount: Number(data.uniqueCount) || 0
          };
        }
        if (data.notifiedAt) {
          const parsed = Date.parse(data.notifiedAt);
          if (Number.isFinite(parsed)) {
            this.lastDirtyTreeNotification = parsed;
          }
        }
      }
    } catch (error) {
      this.appendDebugLog(`DIRTY_TREE_LOAD_ERROR|${error.message}`);
    }
  }

  startDevDocsMonitoring() {
    if (this.devDocsCheckIntervalMs <= 0) {
      return;
    }

    const runCheck = () => {
      try {
        this.checkDevDocsState();
      } catch (error) {
        this.appendDebugLog(`DEV_DOCS_CHECK_ERROR|${error.message}`);
      }
    };

    runCheck();

    if (this.devDocsCheckIntervalMs > 0) {
      this.devDocsTimer = setInterval(() => runCheck(), this.devDocsCheckIntervalMs);
      if (this.devDocsTimer && typeof this.devDocsTimer.unref === 'function') {
        this.devDocsTimer.unref();
      }
    }
  }

  checkDevDocsState() {
    const devDocsDir = path.join(this.repoRoot, 'dev', 'active');
    if (!fs.existsSync(devDocsDir)) {
      return;
    }

    const activeDocs = [];
    try {
      const entries = fs.readdirSync(devDocsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        const docDir = path.join(devDocsDir, entry.name);
        const contextFile = path.join(docDir, `${entry.name}-context.md`);
        const tasksFile = path.join(docDir, `${entry.name}-tasks.md`);
        const planFile = path.join(docDir, `${entry.name}-plan.md`);

        if (fs.existsSync(contextFile) || fs.existsSync(tasksFile) || fs.existsSync(planFile)) {
          const stats = fs.statSync(contextFile || tasksFile || planFile);
          const ageMs = Date.now() - stats.mtimeMs;
          activeDocs.push({
            name: entry.name,
            path: docDir,
            lastModified: stats.mtimeMs,
            ageMs,
            isStale: ageMs > this.devDocsStaleThresholdMs
          });
        }
      }
    } catch (error) {
      this.appendDebugLog(`DEV_DOCS_READ_ERROR|${error.message}`);
      return;
    }

    if (activeDocs.length === 0) {
      return;
    }

    const staleDocs = activeDocs.filter(doc => doc.isStale);
    if (staleDocs.length > 0) {
      const staleList = staleDocs.map(doc => `  - ${doc.name} (${Math.floor(doc.ageMs / 3600000)}h old)`).join('\n');
      this.notify(
        `\uD83D\uDCCB Dev Docs need update:\n\n${staleList}\n\nRun /dev-docs-update to refresh before context reset.`,
        'warn'
      );
      for (const doc of staleDocs) {
        this.runDevDocsRefresh(doc.name);
      }
    }

    const state = {
      activeDocs: activeDocs.length,
      staleDocs: staleDocs.length,
      lastChecked: new Date().toISOString(),
      docs: activeDocs.map(doc => ({
        name: doc.name,
        lastModified: new Date(doc.lastModified).toISOString(),
        isStale: doc.isStale
      }))
    };

    try {
      fs.writeFileSync(this.devDocsStatePath, `${JSON.stringify(state, null, 2)}\n`, {
        encoding: 'utf8'
      });
    } catch (error) {
      this.appendDebugLog(`DEV_DOCS_STATE_WRITE_ERROR|${error.message}`);
    }
  }

  runDevDocsRefresh(taskName) {
    if (!this.devDocsAutoRefreshEnabled) {
      return;
    }

    const binPath = path.join(this.repoRoot, 'node_modules', '.bin', 'ast-hooks');
    if (!fs.existsSync(binPath)) {
      this.appendDebugLog(`DEV_DOCS_REFRESH_SKIP|${taskName}|BIN_NOT_FOUND`);
      return;
    }

    const result = spawnSync(binPath, ['dev-docs-refresh', '--task', taskName], {
      cwd: this.repoRoot,
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      const errorMessage = result.stderr || result.stdout || `exit ${result.status}`;
      this.appendDebugLog(`DEV_DOCS_REFRESH_FAILED|${taskName}|${errorMessage}`);
      return;
    }

    this.appendDebugLog(`DEV_DOCS_REFRESH_SUCCESS|${taskName}`);
  }
}

module.exports = RealtimeGuardService;
