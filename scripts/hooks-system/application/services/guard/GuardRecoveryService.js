const AuditLogger = require('../logging/AuditLogger');

class GuardRecoveryService {
    constructor({
        repoRoot,
        logger,
        startScript,
        notificationHandler,
        restartCooldownMs = 2000
    }) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.auditLogger = new AuditLogger({ repoRoot, logger });
        this.startScript = startScript;
        this.notificationHandler = notificationHandler;
        this.restartCooldownMs = restartCooldownMs;
        this.lastEnsure = 0;
    }

    ensureSupervisor(reason, eventLogger) {
        const now = Date.now();
        if (now - this.lastEnsure < this.restartCooldownMs) {
            return false;
        }
        this.lastEnsure = now;

        const normalizedReason = reason || 'unknown';
        const severity = this._determineSeverity(normalizedReason);

        eventLogger.recordEvent(`Asegurando guard-supervisor (motivo: ${normalizedReason}).`);

        const result = this._startSupervisor();

        if (!result.success) {
            eventLogger.log(`Failed to start supervisor (${reason}): ${result.stderr}`);
            this._notifyUser(`Fallo al reiniciar guard-supervisor (${normalizedReason}).`, 'error', {
                reason: `${normalizedReason}-failed`
            });
            return false;
        }

        if (result.stdout) eventLogger.log(`[start stdout] ${result.stdout}`);
        if (result.stderr) eventLogger.log(`[start stderr] ${result.stderr}`);

        eventLogger.log(`Supervisor ensured (${reason})`);
        this._notifyUser(
            normalizedReason === 'initial-start'
                ? 'Guard-supervisor operativo.'
                : `Guard-supervisor reiniciado (${normalizedReason}).`,
            severity,
            { reason: normalizedReason }
        );

        return true;
    }

    _startSupervisor() {
        try {
            const result = require('child_process').spawnSync(this.startScript, ['start'], {
                cwd: this.repoRoot,
                stdio: 'pipe'
            });

            return {
                success: !result.error && result.status === 0,
                error: result.error,
                stdout: (result.stdout || '').toString().trim(),
                stderr: (result.stderr || '').toString().trim()
            };
        } catch (error) {
            return {
                success: false,
                error,
                stdout: '',
                stderr: error.message
            };
        }
    }

    _determineSeverity(reason) {
        if (reason === 'missing-supervisor') return 'error';
        if (reason.startsWith('heartbeat-')) return 'warn';
        return 'info';
    }

    _notifyUser(message, level, options) {
        if (this.notificationHandler) {
            this.notificationHandler.notify(message, level, options);
        }
    }
}

module.exports = GuardRecoveryService;
