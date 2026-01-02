const env = require('../../../config/env');

class GuardNotificationHandler {
    constructor(notificationCenter, eventLogger, config) {
        this.notificationCenter = notificationCenter;
        this.eventLogger = eventLogger;
        this.config = config;
        this.lastNotificationState = { reason: null, at: 0 };
    }

    notify(message, level = 'info', options = {}) {
        if (!message) return;

        const { reason = null, cooldownMs = this.config.heartbeatNotifyCooldownMs } = options;
        if (reason) {
            const now = Date.now();
            if (this.lastNotificationState.reason === reason && now - this.lastNotificationState.at < cooldownMs) {
                this.eventLogger.log(`NOTIFY_SUPPRESSED|${reason}|cooldown`);
                return;
            }
            this.lastNotificationState = { reason, at: now };
        }

        this.eventLogger.recordEvent(`${(level || 'info').toUpperCase()} ${message}`);
        this.eventLogger.log(`NOTIFY|${level}|${message}`);

        if (this.notificationCenter && typeof this.notificationCenter.enqueue === 'function') {
            this.notificationCenter.enqueue({
                message,
                level,
                type: `guard_auto_manager_${reason || level}`,
                metadata: { reason, cooldownMs }
            });
        }
    }
}

module.exports = GuardNotificationHandler;
