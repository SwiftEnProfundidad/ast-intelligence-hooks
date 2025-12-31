const fs = require('fs');
const path = require('path');
const { getGitTreeState, isTreeBeyondLimit } = require('./GitTreeState');

const { recordMetric } = require('../../../infrastructure/telemetry/metrics-logger');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

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
        recordMetric({
            hook: 'realtime_guard_service',
            operation: 'constructor',
            status: 'started',
            hasDependencies: !!dependencies
        });

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
        this.notificationService = notificationService;
        this.notifier = typeof notifier === 'function' ? notifier : null;
        this.notificationsEnabled = notifications !== false;
        this.monitors = monitors || {};
        this.orchestration = orchestration;
        this.config = config || {};

        if (!this.config.debugLogPath) {
            this.config.debugLogPath = path.join(process.cwd(), '.audit-reports', 'guard-debug.log');
        }

        this.evidencePath = this.config.evidencePath || path.join(process.cwd(), '.AI_EVIDENCE.json');
        this.staleThresholdMs = Number(process.env.HOOK_GUARD_EVIDENCE_STALE_THRESHOLD || 60000);
        this.reminderIntervalMs = Number(process.env.HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL || 60000);
        this.inactivityGraceMs = Number(process.env.HOOK_GUARD_INACTIVITY_GRACE_MS || 120000);
        this.pollIntervalMs = Number(process.env.HOOK_GUARD_EVIDENCE_POLL_INTERVAL || 30000);
        this.pollTimer = null;
        this.lastStaleNotification = 0;
        this.lastUserActivityAt = 0;

        this.gitTreeStagedThreshold = Number(process.env.HOOK_GUARD_DIRTY_TREE_STAGED_LIMIT || 10);
        this.gitTreeUnstagedThreshold = Number(process.env.HOOK_GUARD_DIRTY_TREE_UNSTAGED_LIMIT || 15);
        this.gitTreeTotalThreshold = Number(process.env.HOOK_GUARD_DIRTY_TREE_TOTAL_LIMIT || 20);
        this.gitTreeCheckIntervalMs = Number(process.env.HOOK_GUARD_DIRTY_TREE_INTERVAL || 60000);
        this.gitTreeReminderMs = Number(process.env.HOOK_GUARD_DIRTY_TREE_REMINDER || 300000);
        this.gitTreeTimer = null;
        this.lastDirtyTreeNotification = 0;
        this.dirtyTreeActive = false;

        this.autoRefreshCooldownMs = Number(process.env.HOOK_GUARD_EVIDENCE_AUTO_REFRESH_COOLDOWN || 180000);
        this.lastAutoRefresh = 0;
        this.autoRefreshInFlight = false;

        this.watchers = [];
        this.embedTokenMonitor = process.env.HOOK_GUARD_EMBEDDED_TOKEN_MONITOR === 'true';
    }

    start() {
        const m_start = createMetricScope({
            hook: 'realtime_guard_service',
            operation: 'start'
        });

        m_start.started();
        this.logger.info('Starting RealtimeGuardService...');

        // Start all monitors
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
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'realtime_guard_service',
            operation: 'stop'
        });

        m_stop.started();
        this.logger.info('Stopping RealtimeGuardService...');

        this.watchers.forEach(w => w.close());
        this.watchers = [];

        Object.values(this.monitors).forEach(monitor => {
            if (typeof monitor.stop === 'function') {
                monitor.stop();
            }
        });

        this.logger.info('[RealtimeGuardService] All services stopped');
        m_stop.success();
    }

    _startEvidenceMonitoring() {
        this.monitors.evidence.startPolling(
            () => this.notify('🔄 Evidence is stale - Auto-refreshing...', 'warning'),
            () => this.notify('✅ Evidence refreshed successfully', 'success')
        );
    }

    _startGitTreeMonitoring() {
        if (process.env.HOOK_GUARD_DIRTY_TREE_DISABLED === 'true') return;

        this.monitors.gitTree.startMonitoring((state) => {
            if (state.isBeyondLimit) {
                const message = `Git tree has too many files: ${state.total} total (${state.staged} staged, ${state.unstaged} unstaged)`;
                this.notify(message, 'error', { forceDialog: true });
            } else {
                this.notify('✅ Git tree is clean', 'success');
            }
        });
    }

    _startTokenMonitoring() {
        if (!this.monitors.token.isAvailable()) {
            this.logger.warn('[RealtimeGuardService] Token monitor script not found');
            return;
        }

        try {
            this.monitors.token.start();
            this.notify('🔋 Token monitor started', 'info');
        } catch (error) {
            this.notify(`Failed to start token monitor: ${error.message}`, 'error');
        }
    }

    _startGitFlowSync() {
        if (!this.monitors.gitFlow.autoSyncEnabled) return;

        const syncInterval = setInterval(() => {
            if (this.monitors.gitFlow.isClean()) {
                const result = this.monitors.gitFlow.syncBranches();
                if (result.success) {
                    this.notify('🔄 Branches synchronized', 'info');
                }
            }
        }, Number(process.env.HOOK_GUARD_GITFLOW_AUTOSYNC_INTERVAL || 300000));

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

    notify(message, level = 'info', options = {}) {
        const { forceDialog = false, ...metadata } = options;
        this._appendDebugLog(`NOTIFY|${level}|${forceDialog ? 'force-dialog|' : ''}${message}`);

        if (this.notifier && this.notificationsEnabled) {
            try {
                this.notifier(message, level, { ...metadata, forceDialog });
            } catch (error) {
                const msg = error && error.message ? error.message : String(error);
                this._appendDebugLog(`NOTIFIER_ERROR|${msg}`);
                this.logger?.debug?.('REALTIME_GUARD_NOTIFIER_ERROR', { error: msg });
            }
        }

        if (this.notificationService) {
            this.notificationService.enqueue({
                message,
                level,
                metadata: { ...metadata, forceDialog }
            });
        }
    }

    _appendDebugLog(entry) {
        try {
            const timestamp = new Date().toISOString();
            fs.appendFileSync(this.config.debugLogPath, `[${timestamp}] ${entry}\n`);
        } catch (error) {
            console.error('[RealtimeGuardService] Failed to write debug log:', error.message);
        }
    }

    appendDebugLog(entry) {
        this._appendDebugLog(entry);
    }

    readEvidenceTimestamp() {
        try {
            if (!fs.existsSync(this.evidencePath)) {
                return null;
            }
            const raw = fs.readFileSync(this.evidencePath, 'utf8');
            const json = JSON.parse(raw);
            const ts = json?.timestamp;
            if (!ts) {
                return null;
            }
            const ms = new Date(ts).getTime();
            if (Number.isNaN(ms)) {
                return null;
            }
            return ms;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            this._appendDebugLog(`EVIDENCE_TIMESTAMP_ERROR|${msg}`);
            this.logger?.debug?.('REALTIME_GUARD_EVIDENCE_TIMESTAMP_ERROR', { error: msg });
            return null;
        }
    }

    evaluateEvidenceAge(source = 'manual', notifyFresh = false) {
        const now = Date.now();
        const timestamp = this.readEvidenceTimestamp();
        if (!timestamp) {
            return;
        }

        const ageMs = now - timestamp;
        const isStale = ageMs > this.staleThresholdMs;
        const isRecentlyActive = this.lastUserActivityAt && (now - this.lastUserActivityAt) < this.inactivityGraceMs;

        if (isStale && !isRecentlyActive) {
            this.triggerStaleAlert(source, ageMs);
            return;
        }

        if (notifyFresh && this.lastStaleNotification > 0 && !isStale) {
            this.notify('Evidence updated; back within SLA.', 'info');
            this.lastStaleNotification = 0;
        }
    }

    triggerStaleAlert(source, ageMs) {
        const now = Date.now();
        if (this.lastStaleNotification && (now - this.lastStaleNotification) < this.reminderIntervalMs) {
            return;
        }

        this.lastStaleNotification = now;
        const ageSec = Math.floor(ageMs / 1000);
        this.notify(`Evidence has been stale for ${ageSec}s (source: ${source}).`, 'warn', { forceDialog: true });
        void this.attemptAutoRefresh('stale');
    }

    async attemptAutoRefresh(reason = 'manual') {
        if (process.env.HOOK_GUARD_AUTO_REFRESH !== 'true') {
            return;
        }

        const updateScriptCandidates = [
            path.join(process.cwd(), 'scripts/hooks-system/bin/update-evidence.sh'),
            path.join(process.cwd(), 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
            path.join(process.cwd(), 'bin/update-evidence.sh')
        ];

        const updateScript = updateScriptCandidates.find(p => fs.existsSync(p));
        if (!updateScript) {
            return;
        }

        const now = Date.now();
        const ts = this.readEvidenceTimestamp();
        if (ts && (now - ts) <= this.staleThresholdMs) {
            return;
        }

        if (this.lastAutoRefresh && (now - this.lastAutoRefresh) < this.autoRefreshCooldownMs) {
            return;
        }

        if (this.autoRefreshInFlight) {
            return;
        }

        this.autoRefreshInFlight = true;
        try {
            await this.runDirectEvidenceRefresh(reason);
            this.lastAutoRefresh = now;
        } finally {
            this.autoRefreshInFlight = false;
        }
    }

    async runDirectEvidenceRefresh(_reason) {
        return;
    }

    async evaluateGitTree() {
        try {
            const state = getGitTreeState();
            const limits = {
                stagedLimit: this.gitTreeStagedThreshold,
                unstagedLimit: this.gitTreeUnstagedThreshold,
                totalLimit: this.gitTreeTotalThreshold
            };

            if (isTreeBeyondLimit(state, limits)) {
                this.handleDirtyTree(state, limits);
                return;
            }
            this.resolveDirtyTree(state, limits);
        } catch (error) {
            this.appendDebugLog(`DIRTY_TREE_ERROR|${error.message}`);
        }
    }

    resolveDirtyTree(_state, _limits) {
        this.dirtyTreeActive = false;
    }

    handleDirtyTree(_state, limitOrLimits) {
        const now = Date.now();
        const limits = typeof limitOrLimits === 'number'
            ? { totalLimit: limitOrLimits }
            : (limitOrLimits || {});

        if (this.lastDirtyTreeNotification && (now - this.lastDirtyTreeNotification) < this.gitTreeReminderMs) {
            return;
        }

        this.lastDirtyTreeNotification = now;
        this.dirtyTreeActive = true;
        this.notify('Git tree is dirty; please stage/unstage to reduce file count.', 'warn', { forceDialog: true, ...limits });
        this.persistDirtyTreeState();
    }

    persistDirtyTreeState() {
        return;
    }

    startGitTreeMonitoring() {
        if (this.gitTreeTimer) {
            clearInterval(this.gitTreeTimer);
            this.gitTreeTimer = null;
        }

        const thresholdsValid = this.gitTreeStagedThreshold > 0 || this.gitTreeUnstagedThreshold > 0 || this.gitTreeTotalThreshold > 0;
        if (!thresholdsValid || this.gitTreeCheckIntervalMs <= 0) {
            this.gitTreeTimer = null;
            return;
        }

        void this.evaluateGitTree();
        this.gitTreeTimer = setInterval(() => {
            void this.evaluateGitTree();
        }, this.gitTreeCheckIntervalMs);
    }

    startEvidencePolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        if (this.pollIntervalMs <= 0) {
            this.pollTimer = null;
            return;
        }

        this.pollTimer = setInterval(() => {
            this.evaluateEvidenceAge('polling');
        }, this.pollIntervalMs);
    }
}

module.exports = RealtimeGuardService;
