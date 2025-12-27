const fs = require('fs');
const path = require('path');

class GuardLockManager {
    constructor({
        repoRoot = process.cwd(),
        logger = console,
        fsModule = fs
    } = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.fs = fsModule;

        this.tmpDir = path.join(this.repoRoot, '.audit_tmp');
        this.lockDir = path.join(this.tmpDir, 'guard-auto-manager.lock');
        this.pidFile = path.join(this.repoRoot, '.guard-auto-manager.pid');

        // Ensure tmp dir exists
        try {
            if (!this.fs.existsSync(this.tmpDir)) {
                this.fs.mkdirSync(this.tmpDir, { recursive: true });
            }
        } catch (error) {
            // Race condition or directory already exists is fine, but we log for debugging
            if (this.logger?.debug) {
                this.logger.debug('GUARD_LOCK_MANAGER_INIT_DEBUG', { error: error.message });
            }
        }
    }

    acquireLock() {
        try {
            this.fs.mkdirSync(this.lockDir, { recursive: false });
            return true;
        } catch (error) {
            if (this.logger?.debug) {
                this.logger.debug('GUARD_LOCK_ACQUIRE_FAILED', { error: error.message });
            }
            return false;
        }
    }

    releaseLock() {
        try {
            if (this.fs.existsSync(this.lockDir)) {
                this.fs.rmdirSync(this.lockDir);
            }
        } catch (error) {
            this.logger.warn?.(`Error releasing lock: ${error.message}`);
        }
    }

    writePidFile() {
        try {
            this.fs.writeFileSync(this.pidFile, String(process.pid), { encoding: 'utf8' });
        } catch (error) {
            this.logger.warn?.(`Error writing PID file: ${error.message}`);
        }
    }

    removePidFile() {
        try {
            if (this.fs.existsSync(this.pidFile)) {
                this.fs.unlinkSync(this.pidFile);
            }
        } catch (error) {
            this.logger.warn?.(`Error removing PID file: ${error.message}`);
        }
    }
}

module.exports = GuardLockManager;
