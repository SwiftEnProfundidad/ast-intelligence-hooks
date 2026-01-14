const fs = require('fs');
const path = require('path');
const { recordMetric } = require('../../../infrastructure/telemetry/metrics-logger');
const env = require('../../../config/env.js');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

class EvidenceManager {
    constructor(evidencePath, notifier, auditLogger, delegate = null) {
        this.evidencePath = evidencePath;
        this.notifier = notifier;
        this.auditLogger = auditLogger;
        this.delegate = delegate;
        this.staleThresholdMs = env.getNumber('HOOK_GUARD_EVIDENCE_STALE_THRESHOLD', 180000);
        this.reminderIntervalMs = env.getNumber('HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL', 60000);
        this.inactivityGraceMs = env.getNumber('HOOK_GUARD_INACTIVITY_GRACE_MS', 120000);
        this.pollIntervalMs = env.getNumber('HOOK_GUARD_EVIDENCE_POLL_INTERVAL', 30000);
        this.pollTimer = null;
        this.lastStaleNotification = 0;
        this.lastUserActivityAt = 0;
        this.autoRefreshCooldownMs = env.getNumber('HOOK_GUARD_EVIDENCE_AUTO_REFRESH_COOLDOWN', 180000);
        this.lastAutoRefresh = 0;
        this.autoRefreshInFlight = false;
    }

    startPolling(onStale, onRefresh) {
        this.onStale = onStale;
        this.onRefresh = onRefresh;

        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }

        if (this.pollIntervalMs <= 0) return;

        this.pollTimer = setInterval(() => {
            if (this.delegate && typeof this.delegate.evaluateEvidenceAge === 'function') {
                this.delegate.evaluateEvidenceAge('polling');
            } else {
                this.evaluateEvidenceAge('polling');
            }
        }, this.pollIntervalMs);
    }

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    readEvidenceTimestamp() {
        try {
            if (!fs.existsSync(this.evidencePath)) {
                return null;
            }
            const raw = fs.readFileSync(this.evidencePath, 'utf8');
            const json = JSON.parse(raw);
            const ts = json?.timestamp;
            if (!ts) return null;
            const ms = new Date(ts).getTime();
            if (Number.isNaN(ms)) return null;
            return ms;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            this.notifier.appendDebugLog(`EVIDENCE_TIMESTAMP_ERROR|${msg}`);
            return null;
        }
    }

    evaluateEvidenceAge(source = 'manual', notifyFresh = false) {
        const now = Date.now();
        const timestamp = (this.delegate && typeof this.delegate.readEvidenceTimestamp === 'function')
            ? this.delegate.readEvidenceTimestamp()
            : this.readEvidenceTimestamp();
        if (!timestamp) return;

        const ageMs = now - timestamp;
        const isStale = ageMs > this.staleThresholdMs;
        const isRecentlyActive = this.lastUserActivityAt && (now - this.lastUserActivityAt) < this.inactivityGraceMs;

        if (isStale && !isRecentlyActive) {
            if (this.delegate && typeof this.delegate.triggerStaleAlert === 'function') {
                this.delegate.triggerStaleAlert(source, ageMs);
            } else {
                this.triggerStaleAlert(source, ageMs);
            }
            return;
        }

        if (notifyFresh && this.lastStaleNotification > 0 && !isStale) {
            if (this.delegate && typeof this.delegate.notify === 'function') {
                this.delegate.notify('Evidence updated; back within SLA.', 'info');
            } else {
                this.notifier.notify('Evidence updated; back within SLA.', 'info');
            }
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
        const message = `Evidence has been stale for ${ageSec}s (source: ${source}).`;
        if (this.delegate && typeof this.delegate.notify === 'function') {
            this.delegate.notify(message, 'warn', { forceDialog: true });
        } else {
            this.notifier.notify(message, 'warn', { forceDialog: true });
        }
        this.auditLogger.record({
            action: 'guard.evidence.stale',
            resource: 'evidence',
            status: 'warning',
            meta: { ageSec, source }
        });
        recordMetric({ hook: 'evidence', status: 'stale', ageSec, source });
        if (this.delegate && typeof this.delegate.attemptAutoRefresh === 'function') {
            this.delegate.attemptAutoRefresh('stale');
        } else {
            this.attemptAutoRefresh('stale');
        }

        if (this.onStale) this.onStale();
    }

    async attemptAutoRefresh(reason = 'manual') {
        if (!env.getBool('HOOK_GUARD_AUTO_REFRESH', true)) return;

        const updateScriptCandidates = [
            path.join(process.cwd(), 'scripts/hooks-system/bin/update-evidence.sh'),
            path.join(process.cwd(), 'node_modules/pumuki-ast-hooks/bin/update-evidence.sh'),
            path.join(process.cwd(), 'bin/update-evidence.sh')
        ];

        const updateScript = updateScriptCandidates.find(p => fs.existsSync(p));
        if (!updateScript) return;

        const now = Date.now();
        const ts = this.readEvidenceTimestamp();
        if (ts && (now - ts) <= this.staleThresholdMs) return;

        if (this.lastAutoRefresh && (now - this.lastAutoRefresh) < this.autoRefreshCooldownMs) return;

        if (this.autoRefreshInFlight) return;

        this.autoRefreshInFlight = true;
        try {
            await this.runDirectEvidenceRefresh(reason);
            this.lastAutoRefresh = now;
            this.auditLogger.record({
                action: 'guard.evidence.auto_refresh',
                resource: 'evidence',
                status: 'success',
                meta: { reason }
            });
            recordMetric({ hook: 'evidence', status: 'auto_refresh_success', reason });

            if (this.onRefresh) this.onRefresh();
        } finally {
            this.autoRefreshInFlight = false;
        }
    }

    async runDirectEvidenceRefresh(_reason) {
        const updateScriptCandidates = [
            path.join(process.cwd(), 'scripts/hooks-system/bin/update-evidence.sh'),
            path.join(process.cwd(), 'node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/update-evidence.sh')
        ];

        const updateScript = updateScriptCandidates.find(p => fs.existsSync(p));
        if (!updateScript) return;

        try {
            await execFileAsync('bash', [updateScript, '--auto'], {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    AUTO_EVIDENCE_TRIGGER: 'auto',
                    AUTO_EVIDENCE_REASON: 'guard.auto_refresh',
                    AUTO_EVIDENCE_SUMMARY: 'auto-refresh'
                }
            });
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            this.notifier.appendDebugLog(`EVIDENCE_AUTO_REFRESH_ERROR|${msg}`);
        }
    }

    updateUserActivity() {
        this.lastUserActivityAt = Date.now();
    }
}

module.exports = EvidenceManager;
