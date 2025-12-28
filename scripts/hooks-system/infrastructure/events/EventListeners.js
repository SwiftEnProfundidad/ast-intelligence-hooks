const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class EventListeners {
    constructor(orchestrator, repoRoot) {
        this.orchestrator = orchestrator;
        this.repoRoot = repoRoot || process.cwd();
        this.listeners = [];
        this.pollingInterval = null;
        this.lastGitState = null;
    }

    async subscribeToEvents() {
        console.error('[EventListeners] Subscribing to events...');

        this.onSessionLoad(() => this.triggerAnalysis('session-load'));
        this.onPreCommit(() => this.triggerAnalysis('pre-commit'));
        this.startGitWatcher();
        this.onBranchSwitch(() => this.triggerAnalysis('branch-switch'));

        console.error('[EventListeners] Event subscriptions active');
    }

    onSessionLoad(callback) {
        console.error('[EventListeners] Session load listener registered');
        this.listeners.push({ event: 'session-load', callback });
    }

    onPreCommit(callback) {
        console.error('[EventListeners] Pre-commit listener registered');
        this.listeners.push({ event: 'pre-commit', callback });
    }

    onBranchSwitch(callback) {
        console.error('[EventListeners] Branch switch listener registered');
        this.listeners.push({ event: 'branch-switch', callback });
    }

    startGitWatcher() {
        if (this.pollingInterval) {
            return;
        }

        console.error('[EventListeners] Starting Git watcher (poll every 30s)...');

        this.lastGitState = this.getGitState();

        this.pollingInterval = setInterval(async () => {
            const currentState = this.getGitState();

            if (this.hasGitStateChanged(currentState)) {
                console.error('[EventListeners] Git state changed, triggering analysis...');
                await this.triggerAnalysis('git-change');
                this.lastGitState = currentState;
            }
        }, 30000);
    }

    getGitState() {
        try {
            const branch = execSync('git branch --show-current', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            }).trim();

            const staged = execSync('git diff --cached --name-only', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            }).trim();

            const modified = execSync('git status --porcelain', {
                cwd: this.repoRoot,
                encoding: 'utf-8'
            }).trim();

            return {
                branch,
                staged: staged ? staged.split('\n') : [],
                modified: modified ? modified.split('\n').map(l => l.substring(3)) : []
            };
        } catch (error) {
            return { branch: 'unknown', staged: [], modified: [] };
        }
    }

    hasGitStateChanged(currentState) {
        if (!this.lastGitState) return true;

        const branchChanged = currentState.branch !== this.lastGitState.branch;
        const stagedChanged = JSON.stringify(currentState.staged) !== JSON.stringify(this.lastGitState.staged);

        return branchChanged || stagedChanged;
    }

    async triggerAnalysis(event) {
        try {
            console.error(`[EventListeners] Triggered by event: ${event}`);

            const result = await this.orchestrator.analyzeContext();

            console.error(`[EventListeners] Analysis result: ${result.action} (confidence: ${result.confidence}%)`);

            if (result.action === 'auto-execute') {
                console.error(`[EventListeners] Auto-executing ai-start for: ${result.platforms.map(p => p.platform).join(', ')}`);
                return { executed: true, result };
            }

            if (result.action === 'ask') {
                console.error(`[EventListeners] AI should ask user about: ${result.platforms.map(p => p.platform).join(', ')}`);
                return { executed: false, shouldAsk: true, result };
            }

            console.error(`[EventListeners] Action: ${result.action} - ${result.reason}`);
            return { executed: false, result };

        } catch (error) {
            console.error(`[EventListeners] Error triggering analysis:`, error.message);
            return { executed: false, error: error.message };
        }
    }

    stopWatching() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.error('[EventListeners] Git watcher stopped');
        }
    }

    emit(event, data) {
        const eventListeners = this.listeners.filter(l => l.event === event);
        eventListeners.forEach(listener => {
            try {
                listener.callback(data);
            } catch (error) {
                console.error(`[EventListeners] Error in ${event} listener:`, error.message);
            }
        });
    }
}

module.exports = EventListeners;
