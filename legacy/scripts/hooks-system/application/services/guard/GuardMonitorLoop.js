const AuditLogger = require('../logging/AuditLogger');
class GuardMonitorLoop {
    constructor(timers, intervalMs, tickCallback, logger) {
        
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });this.timers = timers;
        this.intervalMs = intervalMs;
        this.tickCallback = tickCallback;
        this.logger = logger;
        this.timer = null;
    }

    start() {
        this.stop();
        this.timer = this.timers.setInterval(() => {
            try {
                this.tickCallback();
            } catch (error) {
                this.logger.log(`Monitor error: ${error.message}`);
            }
        }, this.intervalMs);
    }

    stop() {
        if (this.timer) {
            this.timers.clearInterval(this.timer);
            this.timer = null;
        }
    }
}

module.exports = GuardMonitorLoop;
