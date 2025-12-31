const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { ConfigurationError } = require('../../../domain/errors');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class TokenMonitor {
    constructor(repoRoot, options = {}) {
        const m_constructor = createMetricScope({
            hook: 'token_monitor',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.scriptPath = path.join(repoRoot, 'infrastructure', 'watchdog', 'token-monitor-loop.sh');
        this.process = null;
        m_constructor.success();
    }

    isAvailable() {
        return fs.existsSync(this.scriptPath);
    }

    start() {
        const m_start = createMetricScope({
            hook: 'token_monitor',
            operation: 'start'
        });

        m_start.started();
        if (!this.isAvailable()) {
            throw new ConfigurationError('Token monitor script not found', 'scriptPath');
        }

        if (this.process) {
            this.stop();
        }

        this.process = spawn('bash', [this.scriptPath], {
            cwd: this.repoRoot,
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        this.process.unref();

        this.process.on('error', (error) => {
            console.error('[TokenMonitor] Failed to start:', error.message);
        });

        this.process.on('exit', (code) => {
            if (code !== 0) {
                console.error(`[TokenMonitor] Exited with code ${code}`);
            }
            this.process = null;
        });

        m_start.success();

        return this.process;
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'token_monitor',
            operation: 'stop'
        });

        m_stop.started();
        if (this.process && this.process.kill) {
            this.process.kill('SIGTERM');
            this.process = null;
        }
        m_stop.success();
    }

    isRunning() {
        return this.process !== null && !this.process.killed;
    }
}

module.exports = TokenMonitor;
