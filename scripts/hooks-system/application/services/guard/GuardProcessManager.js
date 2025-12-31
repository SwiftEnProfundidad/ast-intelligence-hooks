const path = require('path');
const { spawnSync } = require('child_process');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class GuardProcessManager {
    constructor({
        repoRoot = process.cwd(),
        logger = console,
        fsModule = require('fs'),
        childProcess = { spawnSync }
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'guard_process_manager',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.fs = fsModule;
        this.childProcess = childProcess;

        this.supervisorPidFile = path.join(this.repoRoot, '.guard-supervisor.pid');
        this.startScript = path.join(this.repoRoot, 'bin', 'start-guards.sh');
        m_constructor.success();
    }

    isSupervisorRunning() {
        const pid = this.readSupervisorPid();
        return pid ? this.isProcessAlive(pid) : false;
    }

    readSupervisorPid() {
        if (!this.fs.existsSync(this.supervisorPidFile)) {
            return null;
        }
        try {
            const raw = this.fs.readFileSync(this.supervisorPidFile, 'utf8').trim();
            if (!raw) {
                return null;
            }
            const pid = Number(raw);
            return Number.isFinite(pid) ? pid : null;
        } catch (error) {
            if (this.logger?.debug) {
                this.logger.debug('GUARD_PROCESS_PID_READ_ERROR', { error: error.message });
            }
            return null;
        }
    }

    isProcessAlive(pid) {
        if (!pid) {
            return false;
        }
        try {
            process.kill(pid, 0);
            return true;
        } catch (error) {
            // process.kill throws if process doesn't exist (ESRCH) or no permission (EPERM)
            if (error.code !== 'ESRCH' && this.logger?.debug) {
                this.logger.debug('GUARD_PROCESS_CHECK_ERROR', { pid, error: error.message });
            }
            return false;
        }
    }

    startSupervisor() {
        try {
            const result = this.childProcess.spawnSync(this.startScript, ['start'], {
                cwd: this.repoRoot,
                stdio: 'pipe'
            });

            const stdout = (result.stdout || '').toString().trim();
            const stderr = (result.stderr || '').toString().trim();

            return {
                success: !result.error,
                error: result.error,
                stdout,
                stderr
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

    stopSupervisor() {
        try {
            const result = this.childProcess.spawnSync(this.startScript, ['stop'], {
                cwd: this.repoRoot,
                stdio: 'pipe'
            });

            const stdout = (result.stdout || '').toString().trim();
            const stderr = (result.stderr || '').toString().trim();

            return {
                success: !result.error,
                error: result.error,
                stdout,
                stderr
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
}

module.exports = GuardProcessManager;
