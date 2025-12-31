const EvidenceMonitorService = require('./monitoring/EvidenceMonitorService');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class EvidenceRealtimeGuardPlugin {
    constructor({
        repoRoot = process.cwd(),
        notificationCenter = null,
        logger = console,
        evidenceMonitor = null
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'realtime_guard_plugin',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.notificationCenter = notificationCenter;
        this.logger = logger || console;

        this.evidenceMonitor = evidenceMonitor || new EvidenceMonitorService({
            repoRoot: this.repoRoot,
            logger: this.logger,
            notifier: payload => this.forwardNotification(payload)
        });
        m_constructor.success();
    }

    start() {
        const m_start = createMetricScope({
            hook: 'realtime_guard_plugin',
            operation: 'start'
        });

        m_start.started();
        if (typeof this.evidenceMonitor.start === 'function') {
            this.evidenceMonitor.start();
        }
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'realtime_guard_plugin',
            operation: 'stop'
        });

        m_stop.started();
        if (typeof this.evidenceMonitor.stop === 'function') {
            this.evidenceMonitor.stop();
        }
        m_stop.success();
    }

    forwardNotification(payload) {
        if (!payload) {
            return;
        }
        const notification = {
            message: payload.message || '',
            level: payload.level || 'info',
            type: payload.type || 'evidence_plugin',
            metadata: payload.metadata || {}
        };

        if (this.notificationCenter && typeof this.notificationCenter.enqueue === 'function') {
            this.notificationCenter.enqueue(notification);
            return;
        }

        const message = `EvidenceMonitor: ${notification.message}`;
        if (notification.level === 'error') {
            this.logger.error?.(message, notification.metadata);
            return;
        }
        if (notification.level === 'warn') {
            this.logger.warn?.(message, notification.metadata);
            return;
        }
        this.logger.info?.(message, notification.metadata);
    }
}

module.exports = { EvidenceRealtimeGuardPlugin };
