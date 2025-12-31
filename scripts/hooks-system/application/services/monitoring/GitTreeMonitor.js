const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class GitTreeMonitor {
    constructor(repoRoot, options = {}) {
        const m_constructor = createMetricScope({
            hook: 'git_tree_monitor',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.stagedThreshold = options.stagedThreshold || 10;
        this.unstagedThreshold = options.unstagedThreshold || 15;
        this.totalThreshold = options.totalThreshold || 20;
        this.checkIntervalMs = options.checkIntervalMs || 60000;
        this.reminderMs = options.reminderMs || 300000;
        this.tempDir = path.join(repoRoot, '.audit_tmp');
        this.markerPath = path.join(this.tempDir, 'dirty-tree-state.json');
        this.lastNotification = 0;
        this.isActive = false;
        this.timer = null;
        this.lastState = null;
        this.loadState();
        m_constructor.success();
    }

    loadState() {
        try {
            if (fs.existsSync(this.markerPath)) {
                this.lastState = JSON.parse(fs.readFileSync(this.markerPath, 'utf8'));
            }
        } catch (error) {
            this.lastState = null;
        }
    }

    saveState(state) {
        try {
            fs.writeFileSync(this.markerPath, JSON.stringify(state, null, 2));
            this.lastState = state;
        } catch (error) {
            console.error('[GitTreeMonitor] Failed to save state:', error.message);
        }
    }

    getTreeState() {
        const m_get_tree_state = createMetricScope({
            hook: 'git_tree_monitor',
            operation: 'get_tree_state'
        });

        m_get_tree_state.started();
        try {
            const stagedRaw = execSync('git diff --cached --name-only', {
                cwd: this.repoRoot,
                encoding: 'utf8'
            }).trim();
            const unstagedRaw = execSync('git diff --name-only', {
                cwd: this.repoRoot,
                encoding: 'utf8'
            }).trim();
            const untrackedRaw = execSync('git ls-files --others --exclude-standard', {
                cwd: this.repoRoot,
                encoding: 'utf8'
            }).trim();

            const staged = stagedRaw ? stagedRaw.split('\n').length : 0;
            const unstaged = unstagedRaw ? unstagedRaw.split('\n').length : 0;
            const untracked = untrackedRaw ? untrackedRaw.split('\n').length : 0;
            const total = staged + unstaged + untracked;

            m_get_tree_state.success();

            return {
                staged,
                unstaged,
                untracked,
                total,
                isBeyondLimit: total > this.totalThreshold ||
                    staged > this.stagedThreshold ||
                    unstaged > this.unstagedThreshold,
                timestamp: Date.now()
            };
        } catch (error) {
            m_get_tree_state.success();
            return {
                staged: 0,
                unstaged: 0,
                untracked: 0,
                total: 0,
                isBeyondLimit: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
        m_get_tree_state.success();
    }

    startMonitoring(onStateChange) {
        this.timer = setInterval(() => {
            const currentState = this.getTreeState();

            if (!this.lastState ||
                currentState.total !== this.lastState.total ||
                currentState.isBeyondLimit !== this.lastState.isBeyondLimit) {

                this.saveState(currentState);

                if (currentState.isBeyondLimit) {
                    this.isActive = true;
                    const now = Date.now();
                    if (now - this.lastNotification > this.reminderMs) {
                        this.lastNotification = now;
                        onStateChange && onStateChange(currentState);
                    }
                } else {
                    if (this.isActive) {
                        this.isActive = false;
                        onStateChange && onStateChange(currentState);
                    }
                }
            }
        }, this.checkIntervalMs);
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'git_tree_monitor',
            operation: 'stop'
        });

        m_stop.started();
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        m_stop.success();
    }

    isActive() {
        return this.isActive;
    }
}

module.exports = GitTreeMonitor;
