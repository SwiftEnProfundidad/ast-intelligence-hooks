const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class GuardMonitorLoop {
    constructor(timers, intervalMs, tickCallback, logger) {
        const m_constructor = createMetricScope({
            hook: 'guard_monitor_loop',
            operation: 'constructor'
        });

        m_constructor.started();
        this.timers = timers;
        this.intervalMs = intervalMs;
        this.tickCallback = tickCallback;
        this.logger = logger;
        this.timer = null;
        m_constructor.success();
    }

    start() {
        const m_start = createMetricScope({
            hook: 'guard_monitor_loop',
            operation: 'start'
        });

        m_start.started();
        this.stop();
        this.timer = this.timers.setInterval(() => {
            try {
                this.tickCallback();
            } catch (error) {
                this.logger.log(`Monitor error: ${error.message}`);
            }
        }, this.intervalMs);
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'guard_monitor_loop',
            operation: 'stop'
        });

        m_stop.started();
        if (this.timer) {
            this.timers.clearInterval(this.timer);
            this.timer = null;
        }
        m_stop.success();
    }
}

module.exports = GuardMonitorLoop;
