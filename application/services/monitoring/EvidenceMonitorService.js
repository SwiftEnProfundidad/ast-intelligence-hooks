const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EvidenceMonitorService {
    constructor({
        repoRoot = process.cwd(),
        evidencePath = path.join(process.cwd(), '.AI_EVIDENCE.json'),
        criticalDocPath = path.join(process.cwd(), 'docs', 'planning', 'LIBRARY_FIVE_STARS_ROADMAP.md'),
        updateScriptPath = path.join(process.cwd(), 'scripts', 'hooks-system', 'bin', 'update-evidence.sh'),
        notifier = () => { },
        logger = console,
        autoRefreshEnabled = process.env.HOOK_GUARD_AUTO_REFRESH !== 'false',
        autoRefreshCooldownMs = Number(process.env.HOOK_GUARD_AUTO_REFRESH_COOLDOWN || 180000),
        staleThresholdMs = Number(process.env.HOOK_GUARD_EVIDENCE_STALE_THRESHOLD || 10 * 60 * 1000),
        fsModule = fs,
        execFn = execSync,
        criticalDocMissingDelayMs = Number(process.env.HOOK_GUARD_CRITICAL_DOC_DELAY_MS || 1500)
    } = {}) {
        this.repoRoot = repoRoot;
        this.evidencePath = evidencePath;
        this.criticalDocPath = criticalDocPath;
        this.updateScriptPath = updateScriptPath;
        this.notifier = notifier;
        this.logger = logger;
        this.autoRefreshEnabled = autoRefreshEnabled;
        this.autoRefreshCooldownMs = autoRefreshCooldownMs;
        this.staleThresholdMs = staleThresholdMs;
        this.fs = fsModule;
        this.exec = execFn;
        this.watchers = [];
        this.lastAutoRefresh = 0;
        this.criticalDocMissingDelayMs = criticalDocMissingDelayMs;
        this.pendingCriticalDocCheck = null;
    }

    start() {
        this.performInitialChecks();
        this.watchEvidenceFreshness();
        this.watchCriticalDocument();
    }

    stop() {
        this.watchers.forEach(watcher => {
            try {
                watcher.close();
            } catch (error) {
                this.logger.warn?.('EVIDENCE_MONITOR_WATCHER_CLOSE_FAILED', { error: error.message });
            }
        });
        this.watchers = [];
        if (this.pendingCriticalDocCheck) {
            clearTimeout(this.pendingCriticalDocCheck);
            this.pendingCriticalDocCheck = null;
        }
    }

    performInitialChecks() {
        if (!this.fs.existsSync(this.evidencePath)) {
            this.notify({
                message: 'Missing .AI_EVIDENCE.json, run update-evidence.',
                level: 'warn',
                type: 'evidence_missing'
            });
            this.attemptAutoRefresh('initial-missing');
        } else {
            this.evaluateEvidence('initial-check');
        }

        if (!this.fs.existsSync(this.criticalDocPath)) {
            this.notify({
                message: 'Critical document LIBRARY_FIVE_STARS_ROADMAP.md is missing.',
                level: 'error',
                type: 'evidence_doc_missing'
            });
        }
    }

    watchEvidenceFreshness() {
        try {
            const watcher = this.fs.watch(this.evidencePath, () => this.evaluateEvidence('fs-watch'));
            this.watchers.push(watcher);
        } catch (error) {
            this.logger.error?.('EVIDENCE_MONITOR_WATCH_FAILED', { error: error.message });
        }
    }

    watchCriticalDocument() {
        const directory = path.dirname(this.criticalDocPath);
        if (!this.fs.existsSync(directory)) {
            return;
        }
        try {
            const watcher = this.fs.watch(directory, (eventType, filename) => {
                if (!filename) {
                    return;
                }
                const target = filename.toString();
                if (target !== path.basename(this.criticalDocPath)) {
                    return;
                }
                this.handleCriticalDocumentEvent(eventType);
            });
            this.watchers.push(watcher);
        } catch (error) {
            this.logger.error?.('EVIDENCE_MONITOR_CRITICAL_DOC_WATCH_FAILED', { error: error.message });
        }
    }

    handleCriticalDocumentEvent() {
        if (this.fs.existsSync(this.criticalDocPath)) {
            if (this.pendingCriticalDocCheck) {
                clearTimeout(this.pendingCriticalDocCheck);
                this.pendingCriticalDocCheck = null;
            }
            return;
        }
        if (this.pendingCriticalDocCheck) {
            return;
        }
        this.pendingCriticalDocCheck = setTimeout(() => {
            this.pendingCriticalDocCheck = null;
            if (!this.fs.existsSync(this.criticalDocPath)) {
                this.notify({
                    message: 'Critical plan document removed or moved.',
                    level: 'error',
                    type: 'evidence_doc_missing'
                });
            }
        }, this.criticalDocMissingDelayMs);
    }

    evaluateEvidence(reason) {
        try {
            const raw = this.fs.readFileSync(this.evidencePath, 'utf8');
            const data = JSON.parse(raw);
            const timestamp = new Date(data.timestamp).getTime();
            if (!Number.isFinite(timestamp)) {
                this.notify({
                    message: 'Evidence timestamp is invalid.',
                    level: 'error',
                    type: 'evidence_invalid'
                });
                return;
            }
            const age = Date.now() - timestamp;
            if (age > this.staleThresholdMs) {
                this.notify({
                    message: 'Evidence older than allowed threshold, please refresh.',
                    level: 'warn',
                    type: 'evidence_stale',
                    metadata: { ageMs: age }
                });
                this.attemptAutoRefresh(reason);
            }
        } catch (error) {
            this.notify({
                message: `Unable to validate .AI_EVIDENCE.json: ${error.message}`,
                level: 'error',
                type: 'evidence_read_error'
            });
        }
    }

    attemptAutoRefresh(reason) {
        if (!this.autoRefreshEnabled) {
            return;
        }
        if (!this.fs.existsSync(this.updateScriptPath)) {
            return;
        }
        const now = Date.now();
        if (now - this.lastAutoRefresh < this.autoRefreshCooldownMs) {
            return;
        }
        try {
            this.exec(`bash ${this.updateScriptPath} --auto --platforms 1,2,3,4`, {
                cwd: this.repoRoot,
                stdio: 'ignore'
            });
            this.lastAutoRefresh = now;
            this.notify({
                message: `Evidence auto-refreshed (${reason}).`,
                level: 'info',
                type: 'evidence_ok'
            });
        } catch (error) {
            this.logger.error?.('EVIDENCE_MONITOR_AUTO_REFRESH_FAILED', { error: error.message, reason });
            this.notify({
                message: `Auto refresh failed: ${error.message}`,
                level: 'error',
                type: 'evidence_refresh_failed'
            });
        }
    }

    notify({ message, level, type = 'evidence_generic', metadata = {} }) {
        try {
            this.notifier({ message, level, type, metadata });
        } catch (error) {
            this.logger.warn?.('EVIDENCE_MONITOR_NOTIFY_FAILED', { error: error.message });
        }
    }
}

module.exports = EvidenceMonitorService;
