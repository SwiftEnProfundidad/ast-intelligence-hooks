const { getGitTreeState, isTreeBeyondLimit } = require('../GitTreeState');
const { recordMetric } = require('../../../infrastructure/telemetry/metrics-logger');
const env = require('../../../config/env.js');
const path = require('path');
const fs = require('fs');

class GitTreeManager {
    constructor(notifier, auditLogger, delegate = null) {
        this.notifier = notifier;
        this.auditLogger = auditLogger;
        this.delegate = delegate;
        this.gitTreeStagedThreshold = env.getNumber('HOOK_GUARD_DIRTY_TREE_STAGED_LIMIT', 10);
        this.gitTreeUnstagedThreshold = env.getNumber('HOOK_GUARD_DIRTY_TREE_UNSTAGED_LIMIT', 15);
        this.gitTreeTotalThreshold = env.getNumber('HOOK_GUARD_DIRTY_TREE_TOTAL_LIMIT', 20);
        this.gitTreeCheckIntervalMs = env.getNumber('HOOK_GUARD_DIRTY_TREE_INTERVAL', 60000);
        this.gitTreeReminderMs = env.getNumber('HOOK_GUARD_DIRTY_TREE_REMINDER', 300000);
        this.gitTreeTimer = null;
        this.lastDirtyTreeNotification = 0;
        this.dirtyTreeActive = false;
    }

    startMonitoring(onStateChange) {
        this.onStateChange = onStateChange;

        if (env.getBool('HOOK_GUARD_DIRTY_TREE_DISABLED', false)) return;

        if (this.gitTreeTimer) {
            clearInterval(this.gitTreeTimer);
        }

        const thresholdsValid = this.gitTreeStagedThreshold > 0 || this.gitTreeUnstagedThreshold > 0 || this.gitTreeTotalThreshold > 0;
        if (!thresholdsValid || this.gitTreeCheckIntervalMs <= 0) return;

        if (this.delegate && typeof this.delegate.evaluateGitTree === 'function') {
            this.delegate.evaluateGitTree();
        } else {
            this.evaluateGitTree();
        }
        this.gitTreeTimer = setInterval(() => {
            if (this.delegate && typeof this.delegate.evaluateGitTree === 'function') {
                this.delegate.evaluateGitTree();
            } else {
                this.evaluateGitTree();
            }
        }, this.gitTreeCheckIntervalMs);
    }

    stopMonitoring() {
        if (this.gitTreeTimer) {
            clearInterval(this.gitTreeTimer);
            this.gitTreeTimer = null;
        }
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
                if (this.delegate && typeof this.delegate.handleDirtyTree === 'function') {
                    this.delegate.handleDirtyTree(state, limits);
                } else {
                    this.handleDirtyTree(state, limits);
                }
                return;
            }
            if (this.delegate && typeof this.delegate.resolveDirtyTree === 'function') {
                this.delegate.resolveDirtyTree(state, limits);
            } else {
                this.resolveDirtyTree(state, limits);
            }
        } catch (error) {
            this.notifier.appendDebugLog(`DIRTY_TREE_ERROR|${error.message}`);
        }
    }

    resolveDirtyTree(_state, _limits) {
        this.dirtyTreeActive = false;
        if (this.delegate && typeof this.delegate.notify === 'function') {
            this.delegate.notify('✅ Git tree is clean', 'success');
        } else {
            this.notifier.notify('✅ Git tree is clean', 'success');
        }
        this.auditLogger.record({
            action: 'guard.git_tree.clean',
            resource: 'git_tree',
            status: 'success'
        });
        recordMetric({ hook: 'git_tree', status: 'clean' });

        if (this.onStateChange) {
            this.onStateChange({ isBeyondLimit: false, ..._state });
        }
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
        const staged = Number.isFinite(_state?.stagedCount) ? _state.stagedCount : (_state?.staged ?? 0);
        const working = Number.isFinite(_state?.workingCount) ? _state.workingCount : (_state?.unstaged ?? 0);
        const unique = Number.isFinite(_state?.uniqueCount) ? _state.uniqueCount : (_state?.total ?? 0);
        const message = `Git tree has too many files: ${unique} total (${staged} staged, ${working} unstaged)`;
        if (this.delegate && typeof this.delegate.notify === 'function') {
            this.delegate.notify(message, 'error', { forceDialog: true, ...limits });
        } else {
            this.notifier.notify(message, 'error', { forceDialog: true, ...limits });
        }
        this.auditLogger.record({
            action: 'guard.git_tree.dirty',
            resource: 'git_tree',
            status: 'warning',
            meta: { total: unique, staged, unstaged: working }
        });
        recordMetric({ hook: 'git_tree', status: 'dirty', total: unique, staged, unstaged: working });
        if (this.delegate && typeof this.delegate.persistDirtyTreeState === 'function') {
            this.delegate.persistDirtyTreeState();
        } else {
            this.persistDirtyTreeState();
        }

        if (this.onStateChange) {
            this.onStateChange({ isBeyondLimit: true, ..._state });
        }
    }

    persistDirtyTreeState() {
        const persistPath = path.join(process.cwd(), '.audit_tmp', 'dirty-tree-state.json');
        const state = {
            timestamp: new Date().toISOString(),
            lastNotification: this.lastDirtyTreeNotification,
            isActive: this.dirtyTreeActive,
            thresholds: {
                staged: this.gitTreeStagedThreshold,
                unstaged: this.gitTreeUnstagedThreshold,
                total: this.gitTreeTotalThreshold
            }
        };

        try {
            fs.writeFileSync(persistPath, JSON.stringify(state, null, 2));
        } catch (error) {
            this.notifier.appendDebugLog(`PERSIST_DIRTY_TREE_ERROR|${error.message}`);
        }
    }
}

module.exports = GitTreeManager;
