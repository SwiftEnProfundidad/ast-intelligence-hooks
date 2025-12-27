const fs = require('fs');

class RealtimeGuardService {
    /**
     * @param {Object} dependencies
     * @param {Object} dependencies.logger
     * @param {Object} dependencies.notificationService
     * @param {Object} dependencies.monitors
     * @param {Object} dependencies.orchestration
     * @param {Object} dependencies.config
     */
    constructor({
        logger,
        notificationService,
        monitors,
        orchestration,
        config
    }) {
        this.logger = logger || console;
        this.notificationService = notificationService;
        this.monitors = monitors || {};
        this.orchestration = orchestration;
        this.config = config || {};

        this.watchers = [];
        this.embedTokenMonitor = process.env.HOOK_GUARD_EMBEDDED_TOKEN_MONITOR === 'true';
    }

    start() {
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
    }

    stop() {
        this.logger.info('Stopping RealtimeGuardService...');

        this.watchers.forEach(w => w.close());
        this.watchers = [];

        Object.values(this.monitors).forEach(monitor => {
            if (typeof monitor.stop === 'function') {
                monitor.stop();
            }
        });

        this.logger.info('[RealtimeGuardService] All services stopped');
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
            // Fallback to console if file logging fails
            console.error('[RealtimeGuardService] Failed to write debug log:', error.message);
        }
    }
}

module.exports = RealtimeGuardService;
