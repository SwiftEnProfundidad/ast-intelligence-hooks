const env = require('../../../config/env');

class GuardHealthReminder {
    constructor(timers, notificationHandler, config) {
        this.timers = timers;
        this.notificationHandler = notificationHandler;
        this.config = config;
        this.timer = null;
        this.lastReminderAt = 0;
    }

    start(checkHealthCallback) {
        this.stop();

        const { healthyReminderIntervalMs } = this.config;
        if (!Number.isFinite(healthyReminderIntervalMs) || healthyReminderIntervalMs <= 0) {
            return;
        }

        this.timer = this.timers.setInterval(() => {
            this._tick(checkHealthCallback);
        }, healthyReminderIntervalMs);

        if (this.timer && typeof this.timer.unref === 'function') {
            this.timer.unref();
        }
    }

    stop() {
        if (this.timer) {
            this.timers.clearInterval(this.timer);
            this.timer = null;
        }
    }

    _tick(checkHealthCallback) {
        if (!checkHealthCallback()) return;

        const now = Date.now();
        const { healthyReminderIntervalMs, healthyReminderCooldownMs } = this.config;

        const cooldown = Number.isFinite(healthyReminderCooldownMs) && healthyReminderCooldownMs > 0
            ? healthyReminderCooldownMs
            : healthyReminderIntervalMs;

        if (cooldown > 0 && now - this.lastReminderAt < cooldown) return;

        this.lastReminderAt = now;
        this.notificationHandler.notify('Guard-supervisor en ejecución.', 'info', {
            reason: 'healthy-reminder',
            cooldownMs: cooldown
        });
    }
}

module.exports = GuardHealthReminder;
