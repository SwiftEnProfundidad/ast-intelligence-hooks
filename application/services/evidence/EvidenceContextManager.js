const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_PLATFORMS = ['1', '2', '3', '4'];

function resolveUpdateEvidenceScript(repoRoot) {
    const candidates = [
        path.join(repoRoot, 'scripts/hooks-system/bin/update-evidence.sh'),
        path.join(repoRoot, 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
        path.join(repoRoot, 'bin/update-evidence.sh')
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

class EvidenceContextManager {
    constructor({
        repoRoot = process.cwd(),
        updateScript = resolveUpdateEvidenceScript(repoRoot) || path.join(process.cwd(), 'scripts', 'hooks-system', 'bin', 'update-evidence.sh'),
        thresholdSeconds = 180,
        autoPlatforms = DEFAULT_PLATFORMS,
        notificationCenter = null,
        logger = console,
        intervalMs = 0,
        timers = { setInterval, clearInterval },
        runCommand = EvidenceContextManager.runUpdateScript
    } = {}) {
        this.repoRoot = repoRoot;
        this.updateScript = updateScript;
        this.thresholdSeconds = thresholdSeconds;
        this.autoPlatforms = Array.isArray(autoPlatforms) && autoPlatforms.length ? autoPlatforms : DEFAULT_PLATFORMS;
        this.notificationCenter = notificationCenter;
        this.logger = logger || console;
        this.intervalMs = intervalMs;
        this.timers = timers;
        this.runCommand = runCommand;
        this.timerRef = null;
        this.refreshInProgress = false;
    }

    static runUpdateScript(scriptPath, platforms) {
        const args = ['--auto', '--platforms', platforms.join(',')];
        const result = spawnSync(scriptPath, args, { cwd: process.cwd(), stdio: 'pipe' });
        if (result.error) {
            throw result.error;
        }
        if (result.status !== 0) {
            throw new Error(result.stderr?.toString() || `update script exited with ${result.status}`);
        }
        return {
            stdout: result.stdout?.toString() || ''
        };
    }

    start(reason = 'startup') {
        this.ensureFresh(reason).catch(error => {
            this.log('error', 'EVIDENCE_STARTUP_REFRESH_FAILED', { error: error.message });
        });
        if (this.intervalMs > 0) {
            this.timerRef = this.timers.setInterval(() => {
                this.ensureFresh('interval').catch(error => {
                    this.log('error', 'EVIDENCE_INTERVAL_REFRESH_FAILED', { error: error.message });
                });
            }, this.intervalMs);
            if (this.timerRef && typeof this.timerRef.unref === 'function') {
                this.timerRef.unref();
            }
        }
    }

    stop() {
        if (this.timerRef) {
            this.timers.clearInterval(this.timerRef);
            this.timerRef = null;
        }
    }

    async ensureFresh(reason = 'manual') {
        const info = this.readEvidence();
        if (!info.valid || this.isStale(info.timestamp)) {
            await this.refresh({ reason });
            return { refreshed: true, reason };
        }
        return { refreshed: false, reason };
    }

    isStale(timestamp) {
        if (!timestamp) {
            return true;
        }
        const evidenceEpoch = Date.parse(timestamp);
        if (!Number.isFinite(evidenceEpoch)) {
            return true;
        }
        const diffSeconds = Math.floor((Date.now() - evidenceEpoch) / 1000);
        return diffSeconds > this.thresholdSeconds;
    }

    readEvidence() {
        try {
            const target = path.join(this.repoRoot, '.AI_EVIDENCE.json');
            if (!fs.existsSync(target)) {
                return { valid: false };
            }
            const content = JSON.parse(fs.readFileSync(target, 'utf8'));
            return {
                valid: true,
                timestamp: content.timestamp,
                payload: content
            };
        } catch (error) {
            this.log('warn', 'EVIDENCE_READ_FAILED', { error: error.message });
            return { valid: false };
        }
    }

    async refresh({ reason = 'auto', platforms = this.autoPlatforms } = {}) {
        if (this.refreshInProgress) {
            return { status: 'skipped', reason: 'in_progress' };
        }
        this.refreshInProgress = true;
        try {
            this.log('info', 'EVIDENCE_REFRESH_STARTED', { reason, platforms });
            const result = await this.runCommand(this.updateScript, platforms);
            this.log('info', 'EVIDENCE_REFRESH_COMPLETED', { reason, output: result.stdout });
            this.notify(`AI evidence refreshed (${reason})`, 'info', { reason, platforms });
            return { status: 'refreshed' };
        } catch (error) {
            this.log('error', 'EVIDENCE_REFRESH_FAILED', { reason, error: error.message });
            this.notify(`AI evidence refresh failed: ${error.message}`, 'error', { reason });
            throw error;
        } finally {
            this.refreshInProgress = false;
        }
    }

    log(level, event, data = {}) {
        if (this.logger && typeof this.logger[level] === 'function') {
            this.logger[level](event, data);
        }
    }

    notify(message, level, metadata = {}) {
        if (this.notificationCenter && typeof this.notificationCenter.enqueue === 'function') {
            this.notificationCenter.enqueue({
                message,
                level,
                type: `evidence_${level}`,
                metadata
            });
        }
    }
}

module.exports = { EvidenceContextManager };
