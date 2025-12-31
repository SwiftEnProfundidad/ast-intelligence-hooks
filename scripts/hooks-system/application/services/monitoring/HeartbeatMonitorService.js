const fs = require('fs');
const path = require('path');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class HeartbeatMonitorService {
    constructor({
        repoRoot = process.cwd(),
        heartbeatPath = path.join(process.cwd(), '.audit_tmp', 'guard-heartbeat.json'),
        intervalMs = 15000,
        statusProvider = () => null,
        logger = console
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'heartbeat_monitor_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.heartbeatPath = heartbeatPath;
        this.intervalMs = intervalMs;
        this.statusProvider = statusProvider;
        this.logger = logger;
        this.timer = null;
        this.lastStatus = null;
        m_constructor.success();
    }

    start() {
        const m_start = createMetricScope({
            hook: 'heartbeat_monitor_service',
            operation: 'start'
        });

        m_start.started();
        if (!Number.isFinite(this.intervalMs) || this.intervalMs <= 0) {
            m_start.success();
            return;
        }
        this.emitHeartbeat();
        this.timer = setInterval(() => this.emitHeartbeat(), this.intervalMs);
        if (this.timer && typeof this.timer.unref === 'function') {
            this.timer.unref();
        }
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'heartbeat_monitor_service',
            operation: 'stop'
        });

        m_stop.started();
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        m_stop.success();
    }

    emitHeartbeat() {
        try {
            const payload = this.statusProvider();
            if (!payload) {
                return;
            }
            const directory = path.dirname(this.heartbeatPath);
            fs.mkdirSync(directory, { recursive: true });
            fs.writeFileSync(this.heartbeatPath, JSON.stringify(payload));
            if (payload.status !== this.lastStatus) {
                this.logger.info?.('HEARTBEAT_STATUS_CHANGE', {
                    status: payload.status,
                    heartbeatPath: this.heartbeatPath
                });
                this.lastStatus = payload.status;
            }
        } catch (error) {
            this.logger.error?.('HEARTBEAT_EMIT_FAILED', { error: error.message });
        }
    }
}

module.exports = HeartbeatMonitorService;
