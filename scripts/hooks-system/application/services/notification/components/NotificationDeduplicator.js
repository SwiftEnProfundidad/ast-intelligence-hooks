const crypto = require('crypto');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class NotificationDeduplicator {
    constructor(windowMs = 5000, logger = null) {
        const m_constructor = createMetricScope({
            hook: 'notification_deduplicator',
            operation: 'constructor'
        });

        m_constructor.started();
        this.deduplicationMap = new Map();
        this.windowMs = windowMs;
        this.logger = logger;
        m_constructor.success();
    }

    isDuplicate(notification) {
        const hash = this.hashNotification(notification);
        const now = Date.now();

        if (this.deduplicationMap.has(hash)) {
            const existing = this.deduplicationMap.get(hash);

            if (now - existing.lastSeen < this.windowMs) {
                existing.count++;
                existing.lastSeen = now;
                if (this.logger && this.logger.debug) {
                    this.logger.debug('NOTIFICATION_DUPLICATE', {
                        hash,
                        count: existing.count,
                        message: notification.message
                    });
                }
                return true;
            }

            this.deduplicationMap.set(hash, { count: 1, firstSeen: now, lastSeen: now });
            return false;
        }

        this.deduplicationMap.set(hash, { count: 1, firstSeen: now, lastSeen: now });
        this.cleanup(now);
        return false;
    }

    hashNotification(notification) {
        const payload = `${notification.message}|${notification.type}|${notification.level}`;
        return crypto.createHash('md5').update(payload).digest('hex');
    }

    cleanup(now) {
        if (this.deduplicationMap.size < 100) {
            return;
        }

        for (const [hash, data] of this.deduplicationMap.entries()) {
            if (now - data.lastSeen > this.windowMs * 2) {
                this.deduplicationMap.delete(hash);
            }
        }
    }

    getStats() {
        const m_get_stats = createMetricScope({
            hook: 'notification_deduplicator',
            operation: 'get_stats'
        });

        m_get_stats.started();
        m_get_stats.success();
        return {
            size: this.deduplicationMap.size
        };
    }

    reset() {
        this.deduplicationMap.clear();
    }
}

module.exports = NotificationDeduplicator;
