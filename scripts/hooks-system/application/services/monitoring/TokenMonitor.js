const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { ConfigurationError } = require('../../../domain/errors');

class TokenMonitor {
    constructor(repoRoot, options = {}) {
        this.repoRoot = repoRoot;
        this.scriptPath = path.join(repoRoot, 'infrastructure', 'watchdog', 'token-monitor-loop.sh');
        this.process = null;
    }

    isAvailable() {
        return fs.existsSync(this.scriptPath);
    }

    start() {
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

        return this.process;
    }

    stop() {
        if (this.process && this.process.kill) {
            this.process.kill('SIGTERM');
            this.process = null;
        }
    }

    isRunning() {
        return this.process !== null && !this.process.killed;
    }
}

module.exports = TokenMonitor;
