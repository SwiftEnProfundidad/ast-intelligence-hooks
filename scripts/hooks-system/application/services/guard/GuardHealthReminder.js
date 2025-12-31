const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class GuardHealthReminder {
    constructor(timers, notificationHandler, config) {
        const m_constructor = createMetricScope({
            hook: 'guard_health_reminder',
            operation: 'constructor'
        });

        m_constructor.started();
        this.timers = timers;
        this.notificationHandler = notificationHandler;
        this.config = config;
        this.timer = null;
        this.lastReminderAt = 0;
        m_constructor.success();
    }

    start(checkHealthCallback) {
        const m_start = createMetricScope({
            hook: 'guard_health_reminder',
            operation: 'start'
        });

        m_start.started();
        this.stop();

        const { healthyReminderIntervalMs } = this.config;
        if (!Number.isFinite(healthyReminderIntervalMs) || healthyReminderIntervalMs <= 0) {
            m_start.success();
            return;
        }

        this.timer = this.timers.setInterval(() => {
            this._tick(checkHealthCallback);
        }, healthyReminderIntervalMs);

        if (this.timer && typeof this.timer.unref === 'function') {
            this.timer.unref();
        }
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'guard_health_reminder',
            operation: 'stop'
        });

        m_stop.started();
        if (this.timer) {
            this.timers.clearInterval(this.timer);
            this.timer = null;
        }
        m_stop.success();
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
