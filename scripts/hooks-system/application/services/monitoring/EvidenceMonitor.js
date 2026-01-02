const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ConfigurationError, DomainError } = require('../../../domain/errors');

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
        this.refreshInFlight = false;
        this.refreshTimeoutMs = options.refreshTimeoutMs || 120000;
        this.refreshLockFile = path.join(this.tempDir, 'evidence-refresh.lock');
    }

    isPidRunning(pid) {
        if (!pid || !Number.isFinite(pid) || pid <= 0) return false;
        try {
            process.kill(pid, 0);
            return true;
        } catch {
            return false;
        }
    }

    acquireRefreshLock() {
        try {
            fs.mkdirSync(this.tempDir, { recursive: true });
        } catch (error) {
            console.warn('[EvidenceMonitor] Failed to ensure temp dir:', error.message);
        }

        try {
            const fd = fs.openSync(this.refreshLockFile, 'wx');
            const payload = JSON.stringify({ pid: process.pid, timestamp: new Date().toISOString() });
            fs.writeFileSync(fd, payload, { encoding: 'utf8' });
            fs.closeSync(fd);
            return { acquired: true };
        } catch (error) {
            if (error && error.code !== 'EEXIST') {
                return { acquired: false, reason: 'error', error };
            }

            try {
                const raw = String(fs.readFileSync(this.refreshLockFile, 'utf8') || '').trim();
                const data = raw ? JSON.parse(raw) : null;
                const lockPid = data && Number(data.pid);
                if (lockPid && this.isPidRunning(lockPid)) {
                    return { acquired: false, reason: 'locked', pid: lockPid };
                }
            } catch (error) {
                console.warn('[EvidenceMonitor] Failed to read refresh lock file:', error.message);
            }

            try {
                fs.unlinkSync(this.refreshLockFile);
            } catch (error) {
                console.warn('[EvidenceMonitor] Failed to remove stale refresh lock:', error.message);
            }

            try {
                const fd = fs.openSync(this.refreshLockFile, 'wx');
                const payload = JSON.stringify({ pid: process.pid, timestamp: new Date().toISOString() });
                fs.writeFileSync(fd, payload, { encoding: 'utf8' });
                fs.closeSync(fd);
                return { acquired: true };
            } catch (retryError) {
                return { acquired: false, reason: 'locked', error: retryError };
            }
        }
    }

    releaseRefreshLock() {
        try {
            if (!fs.existsSync(this.refreshLockFile)) return;
            const raw = String(fs.readFileSync(this.refreshLockFile, 'utf8') || '').trim();
            const data = raw ? JSON.parse(raw) : null;
            const lockPid = data && Number(data.pid);
            if (lockPid === process.pid) {
                fs.unlinkSync(this.refreshLockFile);
            }
        } catch (error) {
            console.warn('[EvidenceMonitor] Failed to release refresh lock:', error.message);
        }
    }

    resolveUpdateEvidenceScript() {
        const candidates = [
            path.join(this.repoRoot, 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
            path.join(this.repoRoot, 'scripts/hooks-system/bin/update-evidence.sh'),
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

        if (this.refreshInFlight) {
            return '';
        }

        const lock = this.acquireRefreshLock();
        if (!lock.acquired) {
            return '';
        }

        this.refreshInFlight = true;

        return new Promise((resolve, reject) => {
            const child = require('child_process').spawn('bash', [this.updateScript, '--auto', '--refresh-only'], {
                cwd: this.repoRoot,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            const timeoutId = setTimeout(() => {
                try {
                    child.kill('SIGKILL');
                } catch (error) {
                    console.warn('[EvidenceMonitor] Failed to kill timed-out refresh process:', error.message);
                }
            }, this.refreshTimeoutMs);

            child.on('close', (code) => {
                clearTimeout(timeoutId);
                this.refreshInFlight = false;
                this.releaseRefreshLock();
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new DomainError(`Evidence refresh failed with code ${code}`, 'EVIDENCE_REFRESH_FAILED'));
                }
            });

            child.on('error', (err) => {
                clearTimeout(timeoutId);
                this.refreshInFlight = false;
                this.releaseRefreshLock();
                reject(err);
            });
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
