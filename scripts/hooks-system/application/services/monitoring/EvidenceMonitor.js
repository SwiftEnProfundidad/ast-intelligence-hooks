const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ConfigurationError, DomainError } = require('../../../../domain/errors');

class EvidenceMonitor {
    constructor(repoRoot, options = {}) {
        this.repoRoot = repoRoot;
        this.staleThresholdMs = options.staleThresholdMs || 180000;
        this.pollIntervalMs = options.pollIntervalMs || 30000;
        this.reminderIntervalMs = options.reminderIntervalMs || 60000;
        this.lastStaleNotification = 0;
        this.pollTimer = null;
        this.evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
        this.tempDir = path.join(repoRoot, '.audit_tmp');
        this.updateScript = this.resolveUpdateEvidenceScript();
    }

    resolveUpdateEvidenceScript() {
        const candidates = [
            path.join(this.repoRoot, 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
            path.join(this.repoRoot, 'bin/update-evidence.sh')
        ];

        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    isStale() {
        try {
            if (!fs.existsSync(this.evidencePath)) {
                return true;
            }

            const stats = fs.statSync(this.evidencePath);
            const ageMs = Date.now() - stats.mtime.getTime();
            return ageMs > this.staleThresholdMs;
        } catch (error) {
            return true;
        }
    }

    async refresh() {
        if (!this.updateScript) {
            throw new ConfigurationError('Update evidence script not found', 'updateScript');
        }

        return new Promise((resolve, reject) => {
            const child = require('child_process').spawn('bash', [this.updateScript, '--auto', '--refresh-only'], {
                cwd: this.repoRoot,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new DomainError(`Evidence refresh failed with code ${code}`, 'EVIDENCE_REFRESH_FAILED'));
                }
            });

            child.on('error', reject);
        });
    }

    startPolling(onStale, onRefreshed) {
        this.pollTimer = setInterval(async () => {
            if (this.isStale()) {
                const now = Date.now();
                if (now - this.lastStaleNotification > this.reminderIntervalMs) {
                    this.lastStaleNotification = now;
                    onStale && onStale();

                    try {
                        await this.refresh();
                        onRefreshed && onRefreshed();
                    } catch (error) {
                        console.error('[EvidenceMonitor] Failed to refresh:', error.message);
                    }
                }
            }
        }, this.pollIntervalMs);
    }

    stop() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
}

module.exports = EvidenceMonitor;
