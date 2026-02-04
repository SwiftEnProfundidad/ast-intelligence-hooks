const AuditLogger = require('../../logging/AuditLogger');

class NotificationQueue {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.items = [];
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
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
