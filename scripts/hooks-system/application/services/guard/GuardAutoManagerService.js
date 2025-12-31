const fs = require('fs');
const { spawnSync } = require('child_process');
const { toErrorMessage } = require('../../../infrastructure/utils/error-utils');
const GuardHeartbeatMonitor = require('./GuardHeartbeatMonitor');
const GuardLockManager = require('./GuardLockManager');
const GuardProcessManager = require('./GuardProcessManager');
const GuardEventLogger = require('./GuardEventLogger');
const GuardRecoveryService = require('./GuardRecoveryService');
const GuardConfig = require('./GuardConfig');
const GuardNotificationHandler = require('./GuardNotificationHandler');
const GuardMonitorLoop = require('./GuardMonitorLoop');
const GuardHealthReminder = require('./GuardHealthReminder');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class GuardAutoManagerService {
    constructor({
        repoRoot = process.cwd(),
        logger = console,
        notificationCenter = null,
        fsModule = fs,
        childProcess = { spawnSync },
        timers = { setInterval, clearInterval },
        env = process.env,
        processRef = process,
        heartbeatMonitor = null
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'guard_auto_manager_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.process = processRef;

        // Configuration & Infrastructure
        this.config = new GuardConfig(env);
        this.eventLogger = new GuardEventLogger({ repoRoot, logger, fsModule });
        this.lockManager = new GuardLockManager({ repoRoot, logger, fsModule });
        this.processManager = new GuardProcessManager({ repoRoot, logger, fsModule, childProcess });

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
        m_constructor.success();
    }

    notifyUser(message, level = 'info', metadata = {}) {
        if (!this.notificationHandler) return;
        this.notificationHandler.notify(message, level, metadata);
    }

    start() {
        const m_start = createMetricScope({
            hook: 'guard_auto_manager_service',
            operation: 'start'
        });

        m_start.started();
        if (!this.lockManager.acquireLock()) {
            this.eventLogger.log('Another guard auto manager instance detected. Exiting.');
            m_start.success();
            return false;
        }
        this.lockManager.writePidFile();
        this.eventLogger.log('Guard auto manager started');

        this.ensureSupervisor('initial-start');
        this._startReminder();
        this.monitorLoop.start();
        this.registerProcessHooks();
        m_start.success();
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
            } else {
                this.eventLogger.log(`Heartbeat degraded (${heartbeat.reason}); restart suppressed (cooldown).`);
                this.eventLogger.recordEvent(`Heartbeat degradado (${heartbeat.reason}); reinicio omitido por cooldown.`);
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
