const fs = require('fs');
const path = require('path');
const AuditLogger = require('./logging/AuditLogger');
const { recordMetric } = require('../../infrastructure/telemetry/metrics-logger');
const env = require('../../config/env.js');
const GuardNotifier = require('./guard/GuardNotifier');
const EvidenceManager = require('./guard/EvidenceManager');
const GitTreeManager = require('./guard/GitTreeManager');

class RealtimeGuardService {
    /**
     * @param {Object} dependencies
     * @param {Object} dependencies.logger
     * @param {Object} dependencies.notificationService
     * @param {Object} dependencies.monitors
     * @param {Object} dependencies.orchestration
     * @param {Object} dependencies.config
     */
    constructor(dependencies = {}) {
        const {
            logger,
            notificationService,
            monitors,
            orchestration,
            config,
            // Legacy/test options
            notifier,
            notifications
        } = dependencies;

        this.logger = logger || console;
        this.monitors = monitors || {};
        this.orchestration = orchestration;
        this.config = config || {};
        this.auditLogger = dependencies.auditLogger || new AuditLogger({ repoRoot: process.cwd(), logger: this.logger });

        if (!this.config.debugLogPath) {
            this.config.debugLogPath = path.join(process.cwd(), '.audit-reports', 'guard-debug.log');
        }

        this.evidencePath = this.config.evidencePath || path.join(process.cwd(), '.AI_EVIDENCE.json');
        this.embedTokenMonitor = env.getBool('HOOK_GUARD_EMBEDDED_TOKEN_MONITOR', false);

        // Initialize specialized components
        this.notifier = new GuardNotifier(
            this.logger,
            notificationService,
            typeof notifier === 'function' ? notifier : null,
            notifications !== false
        );
        this.notifier.setDebugLogPath(this.config.debugLogPath);

        this.evidenceManager = new EvidenceManager(this.evidencePath, this.notifier, this.auditLogger, this);
        this.gitTreeManager = new GitTreeManager(this.notifier, this.auditLogger, this);

        this.watchers = [];
    }

}

RealtimeGuardService.prototype.notify = function notify(message, level = 'info', options = {}) {
    return this.notifier.notify(message, level, options);
};

RealtimeGuardService.prototype.appendDebugLog = function appendDebugLog(entry) {
    return this.notifier.appendDebugLog(entry);
};

RealtimeGuardService.prototype.readEvidenceTimestamp = function readEvidenceTimestamp() {
    return this.evidenceManager.readEvidenceTimestamp();
};

RealtimeGuardService.prototype.evaluateEvidenceAge = function evaluateEvidenceAge(source = 'manual', notifyFresh = false) {
    return this.evidenceManager.evaluateEvidenceAge(source, notifyFresh);
};

RealtimeGuardService.prototype.triggerStaleAlert = function triggerStaleAlert(source, ageMs) {
    return this.evidenceManager.triggerStaleAlert(source, ageMs);
};

RealtimeGuardService.prototype.attemptAutoRefresh = async function attemptAutoRefresh(reason = 'manual') {
    return this.evidenceManager.attemptAutoRefresh(reason);
};

RealtimeGuardService.prototype.runDirectEvidenceRefresh = async function runDirectEvidenceRefresh(reason) {
    return this.evidenceManager.runDirectEvidenceRefresh(reason);
};

RealtimeGuardService.prototype.evaluateGitTree = async function evaluateGitTree() {
    return this.gitTreeManager.evaluateGitTree();
};

RealtimeGuardService.prototype.resolveDirtyTree = function resolveDirtyTree(state, limits) {
    return this.gitTreeManager.resolveDirtyTree(state, limits);
};

RealtimeGuardService.prototype.handleDirtyTree = function handleDirtyTree(state, limits) {
    return this.gitTreeManager.handleDirtyTree(state, limits);
};

RealtimeGuardService.prototype.persistDirtyTreeState = function persistDirtyTreeState() {
    return this.gitTreeManager.persistDirtyTreeState();
};

RealtimeGuardService.prototype.startGitTreeMonitoring = function startGitTreeMonitoring() {
    return this.gitTreeManager.startMonitoring();
};

RealtimeGuardService.prototype.startEvidencePolling = function startEvidencePolling() {
    return this.evidenceManager.startPolling();
};

RealtimeGuardService.prototype.updateUserActivity = function updateUserActivity() {
    return this.evidenceManager.updateUserActivity();
};

RealtimeGuardService.prototype.start = function start() {
    this.logger.info('Starting RealtimeGuardService...');
    this.auditLogger.record({ action: 'guard.realtime.start', resource: 'realtime_guard', status: 'success' });
    recordMetric({ hook: 'realtime_guard', status: 'start' });

    this._startEvidenceMonitoring();
    this._startGitTreeMonitoring();
    this._startActivityMonitoring();
    this._startDevDocsMonitoring();
    this._startAstMonitoring();

    if (this.embedTokenMonitor) {
        this._startTokenMonitoring();
    }

    this._startGitFlowSync();

    this.logger.info('[RealtimeGuardService] All services started');
};

RealtimeGuardService.prototype.stop = function stop() {
    this.logger.info('Stopping RealtimeGuardService...');
    this.auditLogger.record({ action: 'guard.realtime.stop', resource: 'realtime_guard', status: 'success' });
    recordMetric({ hook: 'realtime_guard', status: 'stop' });

    this.watchers.forEach(w => w.close());
    this.watchers = [];

    Object.values(this.monitors).forEach(monitor => {
        if (typeof monitor.stop === 'function') {
            monitor.stop();
        }
    });

    this.evidenceManager.stopPolling();
    this.gitTreeManager.stopMonitoring();

    this.logger.info('[RealtimeGuardService] All services stopped');
};

RealtimeGuardService.prototype._startEvidenceMonitoring = function startEvidenceMonitoring() {
    this.evidenceManager.startPolling(
        () => this.notifier.notify('Evidence is stale - Auto-refreshing...', 'warning'),
        () => this.notifier.notify('Evidence refreshed successfully', 'success')
    );
};

RealtimeGuardService.prototype._startGitTreeMonitoring = function startGitTreeMonitoring() {
    this.gitTreeManager.startMonitoring();
};

RealtimeGuardService.prototype._startTokenMonitoring = function startTokenMonitoring() {
    if (!this.monitors.token.isAvailable()) {
        this.logger.warn('[RealtimeGuardService] Token monitor script not found');
        return;
    }

    try {
        this.monitors.token.start();
        this.notifier.notify('🔋 Token monitor started', 'info');
        this.auditLogger.record({
            action: 'guard.token_monitor.start',
            resource: 'token_monitor',
            status: 'success'
        });
        recordMetric({ hook: 'token_monitor', status: 'start' });
    } catch (error) {
        this.notifier.notify(`Failed to start token monitor: ${error.message}`, 'error');
        this.auditLogger.record({
            action: 'guard.token_monitor.start',
            resource: 'token_monitor',
            status: 'fail',
            meta: { message: error.message }
        });
        recordMetric({ hook: 'token_monitor', status: 'fail' });
    }
};

RealtimeGuardService.prototype._startGitFlowSync = function startGitFlowSync() {
    if (!this.monitors || !this.monitors.gitFlow) return;
    if (!this.monitors.gitFlow.autoSyncEnabled) return;

    this.auditLogger.record({
        action: 'guard.gitflow.autosync.enabled',
        resource: 'gitflow',
        status: 'success',
        meta: { intervalMs: env.getNumber('HOOK_GUARD_GITFLOW_AUTOSYNC_INTERVAL', 300000) }
    });
    recordMetric({ hook: 'gitflow_autosync', status: 'enabled' });

    const syncInterval = setInterval(() => {
        if (this.monitors.gitFlow.isClean()) {
            const result = this.monitors.gitFlow.syncBranches();
            if (result.success) {
                this.notifier.notify('🔄 Branches synchronized', 'info');
                recordMetric({ hook: 'gitflow_autosync', status: 'sync_success' });
            }
        }
    }, env.getNumber('HOOK_GUARD_GITFLOW_AUTOSYNC_INTERVAL', 300000));

    syncInterval.unref();
};

RealtimeGuardService.prototype._startActivityMonitoring = function startActivityMonitoring() {
    if (this.monitors.activity) this.monitors.activity.start();
};

RealtimeGuardService.prototype._startDevDocsMonitoring = function startDevDocsMonitoring() {
    if (this.monitors.devDocs) this.monitors.devDocs.start();
};

RealtimeGuardService.prototype._startAstMonitoring = function startAstMonitoring() {
    if (this.monitors.ast) this.monitors.ast.start();
};

Object.defineProperties(RealtimeGuardService.prototype, {
    staleThresholdMs: {
        get() { return this.evidenceManager.staleThresholdMs; },
        set(value) { this.evidenceManager.staleThresholdMs = value; }
    },
    reminderIntervalMs: {
        get() { return this.evidenceManager.reminderIntervalMs; },
        set(value) { this.evidenceManager.reminderIntervalMs = value; }
    },
    pollIntervalMs: {
        get() { return this.evidenceManager.pollIntervalMs; },
        set(value) { this.evidenceManager.pollIntervalMs = value; }
    },
    pollTimer: {
        get() { return this.evidenceManager.pollTimer; },
        set(value) { this.evidenceManager.pollTimer = value; }
    },
    lastStaleNotification: {
        get() { return this.evidenceManager.lastStaleNotification; },
        set(value) { this.evidenceManager.lastStaleNotification = value; }
    },
    lastUserActivityAt: {
        get() { return this.evidenceManager.lastUserActivityAt; },
        set(value) { this.evidenceManager.lastUserActivityAt = value; }
    },
    inactivityGraceMs: {
        get() { return this.evidenceManager.inactivityGraceMs; },
        set(value) { this.evidenceManager.inactivityGraceMs = value; }
    },
    autoRefreshCooldownMs: {
        get() { return this.evidenceManager.autoRefreshCooldownMs; },
        set(value) { this.evidenceManager.autoRefreshCooldownMs = value; }
    },
    lastAutoRefresh: {
        get() { return this.evidenceManager.lastAutoRefresh; },
        set(value) { this.evidenceManager.lastAutoRefresh = value; }
    },
    autoRefreshInFlight: {
        get() { return this.evidenceManager.autoRefreshInFlight; },
        set(value) { this.evidenceManager.autoRefreshInFlight = value; }
    },
    gitTreeStagedThreshold: {
        get() { return this.gitTreeManager.gitTreeStagedThreshold; },
        set(value) { this.gitTreeManager.gitTreeStagedThreshold = value; }
    },
    gitTreeUnstagedThreshold: {
        get() { return this.gitTreeManager.gitTreeUnstagedThreshold; },
        set(value) { this.gitTreeManager.gitTreeUnstagedThreshold = value; }
    },
    gitTreeTotalThreshold: {
        get() { return this.gitTreeManager.gitTreeTotalThreshold; },
        set(value) { this.gitTreeManager.gitTreeTotalThreshold = value; }
    },
    gitTreeCheckIntervalMs: {
        get() { return this.gitTreeManager.gitTreeCheckIntervalMs; },
        set(value) { this.gitTreeManager.gitTreeCheckIntervalMs = value; }
    },
    gitTreeReminderMs: {
        get() { return this.gitTreeManager.gitTreeReminderMs; },
        set(value) { this.gitTreeManager.gitTreeReminderMs = value; }
    },
    gitTreeTimer: {
        get() { return this.gitTreeManager.gitTreeTimer; },
        set(value) { this.gitTreeManager.gitTreeTimer = value; }
    },
    lastDirtyTreeNotification: {
        get() { return this.gitTreeManager.lastDirtyTreeNotification; },
        set(value) { this.gitTreeManager.lastDirtyTreeNotification = value; }
    },
    dirtyTreeActive: {
        get() { return this.gitTreeManager.dirtyTreeActive; },
        set(value) { this.gitTreeManager.dirtyTreeActive = value; }
    }
});

module.exports = RealtimeGuardService;
