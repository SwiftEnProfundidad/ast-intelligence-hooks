const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

class GuardAutoManagerService {
    constructor({
        repoRoot = process.cwd(),
        logger = console,
        notificationCenter = null,
        fsModule = fs,
        childProcess = { spawnSync },
        timers = { setInterval, clearInterval },
        env = process.env,
        processRef = process
    } = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger || console;
        this.notificationCenter = notificationCenter;
        this.fs = fsModule;
        this.childProcess = childProcess;
        this.timers = timers;
        this.env = env;
        this.process = processRef;

        this.tmpDir = path.join(this.repoRoot, '.audit_tmp');
        this.reportsDir = path.join(this.repoRoot, '.audit-reports');
        this.lockDir = path.join(this.tmpDir, 'guard-auto-manager.lock');
        this.pidFile = path.join(this.repoRoot, '.guard-auto-manager.pid');
        this.supervisorPidFile = path.join(this.repoRoot, '.guard-supervisor.pid');
        this.startScript = path.join(this.repoRoot, 'scripts', 'hooks-system', 'bin', 'start-guards.sh');
        this.eventLogPath = path.join(this.tmpDir, 'guard-events.log');

        this.heartbeatNotifyCooldownMs = Number(env.GUARD_AUTOSTART_NOTIFY_COOLDOWN || 60000);
        this.healthyReminderIntervalMs = Number(env.GUARD_AUTOSTART_HEALTHY_INTERVAL || 0);
        this.healthyReminderCooldownMs = Number(
            env.GUARD_AUTOSTART_HEALTHY_COOLDOWN || (this.healthyReminderIntervalMs > 0 ? this.healthyReminderIntervalMs : 0)
        );

        const heartbeatRelative = env.HOOK_GUARD_HEARTBEAT_PATH || path.join('.audit_tmp', 'guard-heartbeat.json');
        this.heartbeatPath = path.isAbsolute(heartbeatRelative)
            ? heartbeatRelative
            : path.join(this.repoRoot, heartbeatRelative);
        this.heartbeatMaxAgeMs = Number(
            env.GUARD_AUTOSTART_HEARTBEAT_MAX_AGE || env.HOOK_GUARD_HEARTBEAT_MAX_AGE || 60000
        );
        this.heartbeatRestartCooldownMs = Number(env.GUARD_AUTOSTART_HEARTBEAT_COOLDOWN || 60000);
        this.heartbeatRestartReasons = new Set(
            (env.GUARD_AUTOSTART_HEARTBEAT_RESTART || 'missing,stale,invalid,degraded')
                .split(',')
                .map(entry => entry.trim().toLowerCase())
                .filter(Boolean)
        );

        this.monitorIntervalMs = Number(env.GUARD_AUTOSTART_MONITOR_INTERVAL || 5000);
        this.restartCooldownMs = Number(env.GUARD_AUTOSTART_RESTART_COOLDOWN || 2000);
        this.stopSupervisorOnExit = env.GUARD_AUTOSTART_STOP_SUPERVISOR_ON_EXIT !== 'false';

        this.lastNotificationState = { reason: null, at: 0 };
        this.lastHeartbeatState = { healthy: true, reason: 'healthy' };
        this.lastHeartbeatRestart = 0;
        this.lastEnsure = 0;
        this.lastHealthyReminderAt = 0;
        this.healthyReminderTimer = null;
        this.monitorTimer = null;
        this.shuttingDown = false;

        this.fs.mkdirSync(this.tmpDir, { recursive: true });
        this.fs.mkdirSync(this.reportsDir, { recursive: true });
        this.fs.appendFileSync(this.eventLogPath, '', { encoding: 'utf8' });
    }

    start() {
        if (!this.acquireLock()) {
            this.log('Another guard auto manager instance detected. Exiting.');
            return false;
        }
        this.writePidFile();
        this.log('Guard auto manager started');
        this.ensureSupervisor('initial-start');
        this.startHealthyReminder();
        this.monitorTimer = this.timers.setInterval(() => {
            try {
                this.monitorTick();
            } catch (error) {
                this.log(`Monitor error: ${error.message}`);
            }
        }, this.monitorIntervalMs);
        this.registerProcessHooks();
        return true;
    }

    monitorTick() {
        if (this.shuttingDown) {
            return;
        }
        if (!this.isSupervisorRunning()) {
            this.lastHeartbeatState = { healthy: false, reason: 'missing-supervisor' };
            this.recordEvent('Guard supervisor no se encuentra en ejecución; reinicio automático.');
            this.ensureSupervisor('missing-supervisor');
            return;
        }

        const heartbeat = this.evaluateHeartbeat();
        if (!heartbeat.healthy) {
            this.lastHealthyReminderAt = 0;
            this.lastHeartbeatState = { healthy: false, reason: heartbeat.reason };
            if (this.shouldRestartForHeartbeat(heartbeat.reason)) {
                const now = Date.now();
                if (now - this.lastHeartbeatRestart >= this.heartbeatRestartCooldownMs) {
                    this.log(`Heartbeat degraded (${heartbeat.reason}); attempting supervisor ensure.`);
                    this.lastHeartbeatRestart = now;
                    this.ensureSupervisor(`heartbeat-${heartbeat.reason}`);
                } else {
                    this.log(`Heartbeat degraded (${heartbeat.reason}); restart suppressed (cooldown).`);
                    this.recordEvent(`Heartbeat degradado (${heartbeat.reason}); reinicio omitido por cooldown.`);
                }
            } else {
                this.recordEvent(`Heartbeat en estado ${heartbeat.reason}; reinicio no requerido.`);
            }
            return;
        }

        if (!this.lastHeartbeatState.healthy || this.lastHeartbeatState.reason !== 'healthy') {
            this.startHealthyReminder();
        }
        this.lastHeartbeatState = { healthy: true, reason: 'healthy' };
    }

    shutdown() {
        if (this.shuttingDown) {
            return;
        }
        this.shuttingDown = true;
        this.log('Shutting down guard auto manager');
        if (this.monitorTimer) {
            this.timers.clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }
        if (this.stopSupervisorOnExit) {
            try {
                const result = this.childProcess.spawnSync(this.startScript, ['stop'], {
                    cwd: this.repoRoot,
                    stdio: 'pipe'
                });
                const stdout = (result.stdout || '').toString().trim();
                const stderr = (result.stderr || '').toString().trim();
                if (stdout) {
                    this.log(`[stop stdout] ${stdout}`);
                }
                if (stderr) {
                    this.log(`[stop stderr] ${stderr}`);
                }
            } catch (error) {
                this.log(`Error stopping supervisor: ${error.message}`);
            }
        }
        this.cleanup();
    }

    registerProcessHooks() {
        this.process.on('SIGINT', () => this.shutdown());
        this.process.on('SIGTERM', () => this.shutdown());
        this.process.on('SIGHUP', () => this.shutdown());
        this.process.on('exit', () => this.cleanup());
        this.process.on('uncaughtException', error => {
            this.log(`Uncaught exception: ${error.stack || error.message}`);
            this.shutdown();
        });
        this.process.on('unhandledRejection', reason => {
            const message = reason instanceof Error ? reason.stack || reason.message : reason;
            this.log(`Unhandled rejection: ${message}`);
            this.shutdown();
        });
    }

    acquireLock() {
        try {
            this.fs.mkdirSync(this.lockDir, { recursive: false });
            return true;
        } catch (error) {
            return false;
        }
    }

    releaseLock() {
        try {
            this.fs.rmdirSync(this.lockDir);
        } catch (_) {
            /* ignore */
        }
    }

    writePidFile() {
        this.fs.writeFileSync(this.pidFile, String(process.pid), { encoding: 'utf8' });
    }

    removePidFile() {
        try {
            this.fs.unlinkSync(this.pidFile);
        } catch (_) {
            /* ignore */
        }
    }

    log(message, data = {}) {
        if (this.logger?.info) {
            this.logger.info(message, data);
        } else {
            console.log(message, data);
        }
    }

    recordEvent(message) {
        if (!message) {
            return;
        }
        const entry = `[${this.formatLocalTimestamp()}] ${message}`;
        this.fs.appendFileSync(this.eventLogPath, `${entry}\n`, { encoding: 'utf8' });
    }

    notifyUser(message, level = 'info', options = {}) {
        if (!message) {
            return;
        }
        const { reason = null, cooldownMs = this.heartbeatNotifyCooldownMs } = options;
        if (reason) {
            const now = Date.now();
            if (this.lastNotificationState.reason === reason && now - this.lastNotificationState.at < cooldownMs) {
                this.log(`NOTIFY_SUPPRESSED|${reason}|cooldown`);
                return;
            }
            this.lastNotificationState = { reason, at: now };
        }

        this.recordEvent(`${(level || 'info').toUpperCase()} ${message}`);
        this.log(`NOTIFY|${level}|${message}`);

        if (this.notificationCenter && typeof this.notificationCenter.enqueue === 'function') {
            this.notificationCenter.enqueue({
                message,
                level,
                type: `guard_auto_manager_${reason || level}`,
                metadata: { reason, cooldownMs }
            });
        }
    }

    ensureSupervisor(reason) {
        const now = Date.now();
        if (now - this.lastEnsure < this.restartCooldownMs) {
            return;
        }
        this.lastEnsure = now;
        const normalizedReason = reason || 'unknown';
        const severity =
            normalizedReason === 'missing-supervisor'
                ? 'error'
                : normalizedReason.startsWith('heartbeat-')
                    ? 'warn'
                    : 'info';
        this.recordEvent(`Asegurando guard-supervisor (motivo: ${normalizedReason}).`);
        const result = this.childProcess.spawnSync(this.startScript, ['start'], {
            cwd: this.repoRoot,
            stdio: 'pipe'
        });
        if (result.error) {
            this.log(`Failed to start supervisor (${reason}): ${result.error.message}`);
            this.notifyUser(`Fallo al reiniciar guard-supervisor (${normalizedReason}).`, 'error', {
                reason: `${normalizedReason}-failed`
            });
            return;
        }
        const stdout = (result.stdout || '').toString().trim();
        const stderr = (result.stderr || '').toString().trim();
        if (stdout) {
            this.log(`[start stdout] ${stdout}`);
        }
        if (stderr) {
            this.log(`[start stderr] ${stderr}`);
        }
        this.log(`Supervisor ensured (${reason})`);
        this.notifyUser(
            normalizedReason === 'initial-start'
                ? 'Guard-supervisor operativo.'
                : `Guard-supervisor reiniciado (${normalizedReason}).`,
            severity,
            { reason: normalizedReason }
        );
        if (normalizedReason === 'initial-start' || normalizedReason.startsWith('heartbeat-')) {
            this.startHealthyReminder();
        }
    }

    evaluateHeartbeat() {
        if (!Number.isFinite(this.heartbeatMaxAgeMs) || this.heartbeatMaxAgeMs <= 0) {
            return { healthy: true, reason: 'disabled' };
        }
        try {
            const raw = this.fs.readFileSync(this.heartbeatPath, 'utf8');
            if (!raw) {
                return { healthy: false, reason: 'missing' };
            }
            const data = JSON.parse(raw);
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
            if (error && error.code === 'ENOENT') {
                return { healthy: false, reason: 'missing' };
            }
            return { healthy: false, reason: 'error', error };
        }
    }

    shouldRestartForHeartbeat(reason) {
        if (!this.heartbeatRestartReasons.size) {
            return false;
        }
        if (this.heartbeatRestartReasons.has('*')) {
            return true;
        }
        return this.heartbeatRestartReasons.has(reason);
    }

    startHealthyReminder() {
        if (!Number.isFinite(this.healthyReminderIntervalMs) || this.healthyReminderIntervalMs <= 0) {
            if (this.healthyReminderTimer) {
                this.timers.clearInterval(this.healthyReminderTimer);
                this.healthyReminderTimer = null;
            }
            return;
        }
        if (this.healthyReminderTimer) {
            this.timers.clearInterval(this.healthyReminderTimer);
        }
        this.lastHealthyReminderAt = 0;
        const triggerReminder = () => {
            if (this.shuttingDown) {
                return;
            }
            if (!this.lastHeartbeatState.healthy || this.lastHeartbeatState.reason !== 'healthy') {
                return;
            }
            const now = Date.now();
            const cooldown = Number.isFinite(this.healthyReminderCooldownMs) && this.healthyReminderCooldownMs > 0
                ? this.healthyReminderCooldownMs
                : this.healthyReminderIntervalMs;
            if (cooldown > 0 && now - this.lastHealthyReminderAt < cooldown) {
                return;
            }
            this.lastHealthyReminderAt = now;
            this.notifyUser('Guard-supervisor en ejecución.', 'info', {
                reason: 'healthy-reminder',
                cooldownMs: cooldown
            });
        };
        this.healthyReminderTimer = this.timers.setInterval(triggerReminder, this.healthyReminderIntervalMs);
        if (this.healthyReminderTimer && typeof this.healthyReminderTimer.unref === 'function') {
            this.healthyReminderTimer.unref();
        }
    }

    isSupervisorRunning() {
        const pid = this.readSupervisorPid();
        return pid ? this.isProcessAlive(pid) : false;
    }

    readSupervisorPid() {
        if (!this.fs.existsSync(this.supervisorPidFile)) {
            return null;
        }
        const raw = this.fs.readFileSync(this.supervisorPidFile, 'utf8').trim();
        if (!raw) {
            return null;
        }
        const pid = Number(raw);
        return Number.isFinite(pid) ? pid : null;
    }

    isProcessAlive(pid) {
        if (!pid) {
            return false;
        }
        try {
            process.kill(pid, 0);
            return true;
        } catch (_) {
            return false;
        }
    }

    cleanup() {
        this.removePidFile();
        this.releaseLock();
        if (this.healthyReminderTimer) {
            this.timers.clearInterval(this.healthyReminderTimer);
            this.healthyReminderTimer = null;
        }
    }

    formatLocalTimestamp(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        const offsetMinutes = date.getTimezoneOffset();
        const sign = offsetMinutes <= 0 ? '+' : '-';
        const absolute = Math.abs(offsetMinutes);
        const offsetHours = String(Math.floor(absolute / 60)).padStart(2, '0');
        const offsetMins = String(absolute % 60).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetMins}`;
    }
}

module.exports = { GuardAutoManagerService };
