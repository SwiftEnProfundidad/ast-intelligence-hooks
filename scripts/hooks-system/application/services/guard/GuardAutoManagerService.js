const fs = require('fs');
const { spawnSync } = require('child_process');
const { toErrorMessage } = require('../../../infrastructure/utils/error-utils');
const env = require('../../../config/env');
const GuardHeartbeatMonitor = require('./GuardHeartbeatMonitor');
const GuardLockManager = require('./GuardLockManager');
const GuardProcessManager = require('./GuardProcessManager');
const GuardEventLogger = require('./GuardEventLogger');
const GuardRecoveryService = require('./GuardRecoveryService');
const GuardConfig = require('./GuardConfig');
const GuardNotificationHandler = require('./GuardNotificationHandler');
const GuardMonitorLoop = require('./GuardMonitorLoop');
const GuardHealthReminder = require('./GuardHealthReminder');
const AuditLogger = require('../logging/AuditLogger');
const envHelper = require('../../../config/env.js');
const { recordMetric } = require('../../../infrastructure/telemetry/metrics-logger');

class GuardAutoManagerService {
    constructor({
        repoRoot = process.cwd(),
        logger = console,
        notificationCenter = null,
        fsModule = fs,
        childProcess = { spawnSync },
        timers = { setInterval, clearInterval },
        env = envHelper,
        processRef = process,
        heartbeatMonitor = null,
        auditLogger = null
    } = {}) {
        this.process = processRef;

        // Configuration & Infrastructure
        this.config = new GuardConfig(env);
        this.eventLogger = new GuardEventLogger({ repoRoot, logger, fsModule });
        this.lockManager = new GuardLockManager({ repoRoot, logger, fsModule });
        this.processManager = new GuardProcessManager({ repoRoot, logger, fsModule, childProcess });
        this.auditLogger = auditLogger || new AuditLogger({ repoRoot, logger });

        // Monitors & Handlers
        this.heartbeatMonitor = heartbeatMonitor || new GuardHeartbeatMonitor({
            repoRoot, logger, fsModule, env
        });
        this.notificationHandler = new GuardNotificationHandler(notificationCenter, this.eventLogger, this.config);
        this.recoveryService = new GuardRecoveryService({
            repoRoot, logger, startScript: this.processManager.startScript,
            notificationHandler: this.notificationHandler, restartCooldownMs: this.config.restartCooldownMs
        });

        // Loops
        this.monitorLoop = new GuardMonitorLoop(timers, this.config.monitorIntervalMs, () => this.monitorTick(), this.eventLogger);
        this.healthReminder = new GuardHealthReminder(timers, this.notificationHandler, this.config);

        // State
        this.lastHeartbeatState = { healthy: true, reason: 'healthy' };
        this.lastHeartbeatRestart = 0;
        this.shuttingDown = false;
    }

    notifyUser(message, level = 'info', metadata = {}) {
        if (!this.notificationHandler) return;
        this.notificationHandler.notify(message, level, metadata);
    }

    start() {
        if (!this.lockManager.acquireLock()) {
            this.eventLogger.log('Another guard auto manager instance detected. Exiting.');
            this.auditLogger.record({ action: 'guard.lock.acquire', resource: 'guard_auto_manager', status: 'fail', meta: { reason: 'lock_exists' } });
            recordMetric({ hook: 'guard_auto_manager', status: 'lock_fail' });
            return false;
        }
        this.lockManager.writePidFile();
        this.eventLogger.log('Guard auto manager started');
        this.auditLogger.record({ action: 'guard.manager.start', resource: 'guard_auto_manager', status: 'success' });
        recordMetric({ hook: 'guard_auto_manager', status: 'start' });

        this.ensureSupervisor('initial-start');
        this._startReminder();
        this.monitorLoop.start();
        this.registerProcessHooks();
        return true;
    }

    monitorTick() {
        if (this.shuttingDown) return;

        if (!this.processManager.isSupervisorRunning()) {
            this.handleMissingSupervisor();
            return;
        }

        const heartbeat = this.heartbeatMonitor.evaluate();
        if (!heartbeat.healthy) {
            this.handleUnhealthyHeartbeat(heartbeat);
            return;
        }

        if (!this.lastHeartbeatState.healthy || this.lastHeartbeatState.reason !== 'healthy') {
            this._startReminder();
        }
        this.lastHeartbeatState = { healthy: true, reason: 'healthy' };
    }

    handleMissingSupervisor() {
        this.lastHeartbeatState = { healthy: false, reason: 'missing-supervisor' };
        this.eventLogger.recordEvent('Guard supervisor no se encuentra en ejecución; reinicio automático.');
        this.auditLogger.record({
            action: 'guard.supervisor.missing',
            resource: 'guard_supervisor',
            status: 'fail',
            meta: { reason: 'missing-supervisor' }
        });
        this.ensureSupervisor('missing-supervisor');
    }

    handleUnhealthyHeartbeat(heartbeat) {
        this.lastHeartbeatState = { healthy: false, reason: heartbeat.reason };

        if (this.heartbeatMonitor.shouldRestart(heartbeat.reason)) {
            const now = Date.now();
            if (now - this.lastHeartbeatRestart >= this.config.heartbeatRestartCooldownMs) {
                this.eventLogger.log(`Heartbeat degraded (${heartbeat.reason}); attempting supervisor ensure.`);
                this.lastHeartbeatRestart = now;
                this.ensureSupervisor(`heartbeat-${heartbeat.reason}`);
                this.auditLogger.record({
                    action: 'guard.supervisor.ensure',
                    resource: 'guard_supervisor',
                    status: 'success',
                    meta: { reason: heartbeat.reason }
                });
            } else {
                this.eventLogger.log(`Heartbeat degraded (${heartbeat.reason}); restart suppressed (cooldown).`);
                this.eventLogger.recordEvent(`Heartbeat degradado (${heartbeat.reason}); reinicio omitido por cooldown.`);
                this.auditLogger.record({
                    action: 'guard.supervisor.ensure',
                    resource: 'guard_supervisor',
                    status: 'fail',
                    meta: { reason: heartbeat.reason, suppressed: true }
                });
            }
        } else {
            this.eventLogger.recordEvent(`Heartbeat en estado ${heartbeat.reason}; reinicio no requerido.`);
        }
    }

    shutdown() {
        if (this.shuttingDown) return;
        this.shuttingDown = true;
        this.eventLogger.log('Shutting down guard auto manager');

        this.monitorLoop.stop();
        this.healthReminder.stop();

        if (this.config.stopSupervisorOnExit) {
            const result = this.processManager.stopSupervisor();
            if (!result.success) this.eventLogger.log(`Error stopping supervisor: ${result.error?.message}`);
        }
        this.cleanup();
    }

    registerProcessHooks() {
        const shutdownHandler = () => this.shutdown();
        ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(sig => this.process.on(sig, shutdownHandler));
        this.process.on('exit', () => this.cleanup());
        this.process.on('uncaughtException', e => {
            this.eventLogger.log(`Uncaught exception: ${e.stack || e.message}`);
            this.shutdown();
        });
        this.process.on('unhandledRejection', r => {
            this.eventLogger.log(`Unhandled rejection: ${toErrorMessage(r)}`);
            this.shutdown();
        });
    }

    cleanup() {
        this.lockManager.removePidFile();
        this.lockManager.releaseLock();
        this.healthReminder.stop();
        this.auditLogger.record({ action: 'guard.manager.stop', resource: 'guard_auto_manager', status: 'success' });
        recordMetric({ hook: 'guard_auto_manager', status: 'stop' });
    }

    ensureSupervisor(reason) {
        const ensured = this.recoveryService.ensureSupervisor(reason, this.eventLogger);
        if (ensured && (reason === 'initial-start' || reason.startsWith('heartbeat-'))) {
            this._startReminder();
        }
    }

    _startReminder() {
        this.healthReminder.start(() =>
            !this.shuttingDown &&
            this.lastHeartbeatState.healthy &&
            this.lastHeartbeatState.reason === 'healthy'
        );
    }
}

module.exports = { GuardAutoManagerService };
