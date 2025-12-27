const fs = require('fs');
const path = require('path');

class GuardEventLogger {
    constructor({
        repoRoot = process.cwd(),
        logger = console,
        fsModule = fs
    } = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.fs = fsModule;

        this.tmpDir = path.join(this.repoRoot, '.audit_tmp');
        this.eventLogPath = path.join(this.tmpDir, 'guard-events.log');

        // Ensure tmp dir exists
        try {
            if (!this.fs.existsSync(this.tmpDir)) {
                this.fs.mkdirSync(this.tmpDir, { recursive: true });
            }
            // Ensure log file exists
            if (!this.fs.existsSync(this.eventLogPath)) {
                this.fs.writeFileSync(this.eventLogPath, '', { encoding: 'utf8' });
            }
        } catch (error) {
            // Log setup failure for debugging purposes instead of silencing
            if (this.logger?.debug) {
                this.logger.debug('GUARD_EVENT_LOGGER_INIT_ERROR', { error: error.message });
            }
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
        try {
            const entry = `[${this.formatLocalTimestamp()}] ${message}`;
            this.fs.appendFileSync(this.eventLogPath, `${entry}\n`, { encoding: 'utf8' });
        } catch (error) {
            this.log(`Error recording event: ${error.message}`);
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

module.exports = GuardEventLogger;
