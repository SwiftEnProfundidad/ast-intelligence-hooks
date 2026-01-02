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

        this.evidenceManager = new EvidenceManager(this.evidencePath, this.notifier, this.auditLogger);
        this.gitTreeManager = new GitTreeManager(this.notifier, this.auditLogger);

        this.watchers = [];
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
