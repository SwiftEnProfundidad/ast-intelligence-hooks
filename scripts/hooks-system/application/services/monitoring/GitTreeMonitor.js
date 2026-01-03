const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AuditLogger = require('../logging/AuditLogger');

class GitTreeMonitor {
    constructor(repoRoot, options = {}) {
        this.repoRoot = repoRoot;
        this.auditLogger = new AuditLogger({ repoRoot });
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
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    isActive() {
        return this.isActive;
    }
}

module.exports = GitTreeMonitor;
