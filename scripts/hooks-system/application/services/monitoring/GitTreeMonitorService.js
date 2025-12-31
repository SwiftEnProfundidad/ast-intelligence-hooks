const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class GitTreeMonitorService {
    constructor({
        repoRoot = process.cwd(),
        limit,
        warning,
        reminderMs = 300000,
        intervalMs = 60000,
        getState,
        notifier = () => { },
        logger = console,
        debugLogger = null
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'git_tree_monitor_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.limit = limit;
        this.warning = warning;
        this.reminderMs = reminderMs;
        this.intervalMs = intervalMs;
        this.getState = getState;
        this.notifier = notifier;
        this.logger = logger;
        this.debugLogger = debugLogger;
        this.timer = null;
        this.lastCritical = 0;
        this.lastWarning = 0;
        this.wasOverLimit = false;
        m_constructor.success();
    }

    start() {
        const m_start = createMetricScope({
            hook: 'git_tree_monitor_service',
            operation: 'start'
        });

        m_start.started();
        if (!Number.isFinite(this.limit) || this.limit <= 0 || typeof this.getState !== 'function') {
            m_start.success();
            return;
        }
        this.check('startup');
        if (this.intervalMs > 0) {
            this.timer = setInterval(() => this.check('interval'), this.intervalMs);
            if (this.timer && typeof this.timer.unref === 'function') {
                this.timer.unref();
            }
        }
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'git_tree_monitor_service',
            operation: 'stop'
        });

        m_stop.started();
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        m_stop.success();
    }

    check(reason) {
        try {
            const state = this.getState({ repoRoot: this.repoRoot });
            if (!state) {
                return;
            }
            this.evaluateState(state, reason);
        } catch (error) {
            this.logger.error?.('GIT_TREE_MONITOR_FAILED', { error: error.message, reason });
        }
    }

    evaluateState(state, reason) {
        const now = Date.now();
        const isOverLimit = state.uniqueCount > this.limit || state.stagedCount > this.limit || state.workingCount > this.limit;

        if (this.warning && state.uniqueCount >= this.warning) {
            const withinWarning = this.lastWarning > 0 && now - this.lastWarning < this.reminderMs;
            if (!withinWarning) {
                this.lastWarning = now;
                this.notify(`Git tree is growing (staged ${state.stagedCount}, working ${state.workingCount}, unique ${state.uniqueCount}) during ${reason}.`, 'warn');
            }
        } else {
            this.lastWarning = 0;
        }

        if (isOverLimit) {
            this.wasOverLimit = true;
            const withinCritical = this.lastCritical > 0 && now - this.lastCritical < this.reminderMs;
            if (!withinCritical) {
                this.lastCritical = now;
                this.lastWarning = now;
                this.debugLog(`DIRTY_TREE_ALERT|${state.stagedCount}|${state.workingCount}|${state.uniqueCount}`);
                this.notify(`Git tree limit exceeded (staged ${state.stagedCount}, working ${state.workingCount}, unique ${state.uniqueCount}) during ${reason}.`, 'error');
            } else {
                this.debugLog(`DIRTY_TREE_SUPPRESSED|${state.stagedCount}|${state.workingCount}|${state.uniqueCount}`);
            }
            return;
        }

        if (this.wasOverLimit) {
            this.wasOverLimit = false;
            this.debugLog(`DIRTY_TREE_CLEAR|${state.stagedCount}|${state.workingCount}|${state.uniqueCount}`);
        }

        if (state.uniqueCount < this.warning) {
            this.lastWarning = 0;
        }
        this.lastCritical = 0;
    }

    debugLog(message) {
        if (typeof this.debugLogger === 'function') {
            this.debugLogger(message);
        }
    }

    notify(message, level) {
        try {
            this.notifier(message, level);
        } catch (error) {
            this.logger.warn?.('GIT_TREE_MONITOR_NOTIFY_FAILED', { error: error.message });
        }
    }
}

module.exports = GitTreeMonitorService;
