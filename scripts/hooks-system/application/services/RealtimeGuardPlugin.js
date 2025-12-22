const EvidenceMonitorService = require('./monitoring/EvidenceMonitorService');

class EvidenceRealtimeGuardPlugin {
    constructor({
        repoRoot = process.cwd(),
        notificationCenter = null,
        logger = console,
        evidenceMonitor = null
    } = {}) {
        this.repoRoot = repoRoot;
        this.notificationCenter = notificationCenter;
        this.logger = logger || console;

        this.evidenceMonitor = evidenceMonitor || new EvidenceMonitorService({
            repoRoot: this.repoRoot,
            logger: this.logger,
            notifier: payload => this.forwardNotification(payload)
        });
    }

    start() {
        if (typeof this.evidenceMonitor.start === 'function') {
            this.evidenceMonitor.start();
        }
    }

    stop() {
        if (typeof this.evidenceMonitor.stop === 'function') {
            this.evidenceMonitor.stop();
        }
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
