const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class NotificationQueue {
    constructor(maxSize = 100) {
        const m_constructor = createMetricScope({
            hook: 'notification_queue',
            operation: 'constructor'
        });

        m_constructor.started();
        this.maxSize = maxSize;
        this.items = [];
        m_constructor.success();
    }

    enqueue(item) {
        if (this.items.length >= this.maxSize) {
            return false;
        }
        this.items.push(item);
        return true;
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }

    peek() {
        return this.items.length > 0 ? this.items[0] : undefined;
    }
}

module.exports = NotificationQueue;
