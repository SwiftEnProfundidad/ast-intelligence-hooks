const fs = require('fs');
const path = require('path');
const env = require('../../../config/env');

class GuardHeartbeatMonitor {
    constructor({
        repoRoot = process.cwd(),
        logger = console,
        fsModule = fs
    } = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.fs = fsModule;
        const heartbeatRelative = env.get('HOOK_GUARD_HEARTBEAT_PATH', path.join('.audit_tmp', 'guard-heartbeat.json'));
        this.heartbeatPath = path.isAbsolute(heartbeatRelative)
            ? heartbeatRelative
            : path.join(this.repoRoot, heartbeatRelative);

        this.heartbeatMaxAgeMs = env.getNumber('GUARD_AUTOSTART_HEARTBEAT_MAX_AGE',
            env.getNumber('HOOK_GUARD_HEARTBEAT_MAX_AGE', 60000));

        this.heartbeatRestartReasons = new Set(
            (env.get('GUARD_AUTOSTART_HEARTBEAT_RESTART', 'missing,stale,invalid,degraded'))
                .split(',')
                .map(entry => entry.trim().toLowerCase())
                .filter(Boolean)
        );
    }

    evaluate() {
        if (!Number.isFinite(this.heartbeatMaxAgeMs) || this.heartbeatMaxAgeMs <= 0) {
            return { healthy: true, reason: 'disabled' };
        }

        try {
            if (!this.fs.existsSync(this.heartbeatPath)) {
                return { healthy: false, reason: 'missing' };
            }

            const raw = this.fs.readFileSync(this.heartbeatPath, 'utf8');
            if (!raw) {
                return { healthy: false, reason: 'missing' };
            }

            let data;
            try {
                data = JSON.parse(raw);
            } catch (e) {
                return { healthy: false, reason: 'invalid', error: e.message };
            }

            const timestamp = Date.parse(data.timestamp);
            if (!Number.isFinite(timestamp)) {
                return { healthy: false, reason: 'invalid', data };
            }

            const age = Date.now() - timestamp;
            if (age > this.heartbeatMaxAgeMs) {
                return { healthy: false, reason: 'stale', data };
            }

            const status = (data.status || '').toLowerCase();
            if (status && status !== 'healthy') {
                return { healthy: false, reason: status, data };
            }

            const guardRunning = Boolean(data?.guard?.running);
            const tokenRunning = Boolean(data?.tokenMonitor?.running);
            if (!guardRunning || !tokenRunning) {
                return { healthy: false, reason: 'degraded', data };
            }

            return { healthy: true, reason: 'healthy', data };
        } catch (error) {
            this.logger.error(`Heartbeat evaluation error: ${error.message}`);
            return { healthy: false, reason: 'error', error };
        }
    }

    shouldRestart(reason) {
        if (!this.heartbeatRestartReasons.size) {
            return false;
        }
        if (this.heartbeatRestartReasons.has('*')) {
            return true;
        }
        return this.heartbeatRestartReasons.has(reason);
    }
}

module.exports = GuardHeartbeatMonitor;
