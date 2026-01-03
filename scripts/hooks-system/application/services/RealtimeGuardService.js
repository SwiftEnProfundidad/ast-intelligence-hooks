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

    get staleThresholdMs() {
        return this.evidenceManager.staleThresholdMs;
    }

    set staleThresholdMs(value) {
        this.evidenceManager.staleThresholdMs = value;
    }

    get reminderIntervalMs() {
        return this.evidenceManager.reminderIntervalMs;
    }

    set reminderIntervalMs(value) {
        this.evidenceManager.reminderIntervalMs = value;
    }

    get pollIntervalMs() {
        return this.evidenceManager.pollIntervalMs;
    }

    set pollIntervalMs(value) {
        this.evidenceManager.pollIntervalMs = value;
    }

    get pollTimer() {
        return this.evidenceManager.pollTimer;
    }

    set pollTimer(value) {
        this.evidenceManager.pollTimer = value;
    }

    get lastStaleNotification() {
        return this.evidenceManager.lastStaleNotification;
    }

    set lastStaleNotification(value) {
        this.evidenceManager.lastStaleNotification = value;
    }

    get lastUserActivityAt() {
        return this.evidenceManager.lastUserActivityAt;
    }

    set lastUserActivityAt(value) {
        this.evidenceManager.lastUserActivityAt = value;
    }

    get inactivityGraceMs() {
        return this.evidenceManager.inactivityGraceMs;
    }

    set inactivityGraceMs(value) {
        this.evidenceManager.inactivityGraceMs = value;
    }

    get autoRefreshCooldownMs() {
        return this.evidenceManager.autoRefreshCooldownMs;
    }

    set autoRefreshCooldownMs(value) {
        this.evidenceManager.autoRefreshCooldownMs = value;
    }

    get lastAutoRefresh() {
        return this.evidenceManager.lastAutoRefresh;
    }

    set lastAutoRefresh(value) {
        this.evidenceManager.lastAutoRefresh = value;
    }

    get autoRefreshInFlight() {
        return this.evidenceManager.autoRefreshInFlight;
    }

    set autoRefreshInFlight(value) {
        this.evidenceManager.autoRefreshInFlight = value;
    }

    get gitTreeStagedThreshold() {
        return this.gitTreeManager.gitTreeStagedThreshold;
    }

    set gitTreeStagedThreshold(value) {
        this.gitTreeManager.gitTreeStagedThreshold = value;
    }

    get gitTreeUnstagedThreshold() {
        return this.gitTreeManager.gitTreeUnstagedThreshold;
    }

    set gitTreeUnstagedThreshold(value) {
        this.gitTreeManager.gitTreeUnstagedThreshold = value;
    }

    get gitTreeTotalThreshold() {
        return this.gitTreeManager.gitTreeTotalThreshold;
    }

    set gitTreeTotalThreshold(value) {
        this.gitTreeManager.gitTreeTotalThreshold = value;
    }

    get gitTreeCheckIntervalMs() {
        return this.gitTreeManager.gitTreeCheckIntervalMs;
    }

    set gitTreeCheckIntervalMs(value) {
        this.gitTreeManager.gitTreeCheckIntervalMs = value;
    }

    get gitTreeReminderMs() {
        return this.gitTreeManager.gitTreeReminderMs;
    }

    set gitTreeReminderMs(value) {
        this.gitTreeManager.gitTreeReminderMs = value;
    }

    get gitTreeTimer() {
        return this.gitTreeManager.gitTreeTimer;
    }

    set gitTreeTimer(value) {
        this.gitTreeManager.gitTreeTimer = value;
    }

    get lastDirtyTreeNotification() {
        return this.gitTreeManager.lastDirtyTreeNotification;
    }

    set lastDirtyTreeNotification(value) {
        this.gitTreeManager.lastDirtyTreeNotification = value;
    }

    get dirtyTreeActive() {
        return this.gitTreeManager.dirtyTreeActive;
    }

    set dirtyTreeActive(value) {
        this.gitTreeManager.dirtyTreeActive = value;
    }

    start() {
        this.logger.info('Starting RealtimeGuardService...');
        this.auditLogger.record({ action: 'guard.realtime.start', resource: 'realtime_guard', status: 'success' });
        recordMetric({ hook: 'realtime_guard', status: 'start' });

        // Start all monitors via specialized managers
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
    }

    stop() {
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

        // Stop specialized managers
        this.evidenceManager.stopPolling();
        this.gitTreeManager.stopMonitoring();

        this.logger.info('[RealtimeGuardService] All services stopped');
    }

    _startEvidenceMonitoring() {
        this.evidenceManager.startPolling(
            () => this.notifier.notify('Evidence is stale - Auto-refreshing...', 'warning'),
            () => this.notifier.notify('Evidence refreshed successfully', 'success')
        );
    }

    _startGitTreeMonitoring() {
        this.gitTreeManager.startMonitoring();
    }

    _startTokenMonitoring() {
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
    }

    _startGitFlowSync() {
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
    }

    _startActivityMonitoring() {
        if (this.monitors.activity) this.monitors.activity.start();
    }

    _startDevDocsMonitoring() {
        if (this.monitors.devDocs) this.monitors.devDocs.start();
    }

    _startAstMonitoring() {
        if (this.monitors.ast) this.monitors.ast.start();
    }

    // --- Delegation to specialized components ---

    notify(message, level = 'info', options = {}) {
        return this.notifier.notify(message, level, options);
    }

    appendDebugLog(entry) {
        return this.notifier.appendDebugLog(entry);
    }

    readEvidenceTimestamp() {
        return this.evidenceManager.readEvidenceTimestamp();
    }

    evaluateEvidenceAge(source = 'manual', notifyFresh = false) {
        return this.evidenceManager.evaluateEvidenceAge(source, notifyFresh);
    }

    triggerStaleAlert(source, ageMs) {
        return this.evidenceManager.triggerStaleAlert(source, ageMs);
    }

    async attemptAutoRefresh(reason = 'manual') {
        return this.evidenceManager.attemptAutoRefresh(reason);
    }

    async runDirectEvidenceRefresh(reason) {
        return this.evidenceManager.runDirectEvidenceRefresh(reason);
    }

    async evaluateGitTree() {
        return this.gitTreeManager.evaluateGitTree();
    }

    resolveDirtyTree(state, limits) {
        return this.gitTreeManager.resolveDirtyTree(state, limits);
    }

    handleDirtyTree(state, limits) {
        return this.gitTreeManager.handleDirtyTree(state, limits);
    }

    persistDirtyTreeState() {
        return this.gitTreeManager.persistDirtyTreeState();
    }

    startGitTreeMonitoring() {
        return this.gitTreeManager.startMonitoring();
    }

    startEvidencePolling() {
        return this.evidenceManager.startPolling();
    }

    updateUserActivity() {
        return this.evidenceManager.updateUserActivity();
    }
}

module.exports = RealtimeGuardService;
