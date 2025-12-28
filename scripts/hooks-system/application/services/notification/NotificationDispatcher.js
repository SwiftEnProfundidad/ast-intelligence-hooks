class NotificationDispatcher {
    constructor(sender, retryExecutor, cooldownManager, logger) {
        this.sender = sender;
        this.retryExecutor = retryExecutor;
        this.cooldownManager = cooldownManager;
        this.logger = logger;
    }

    async dispatch(notification, stats) {
        const { success, attempts } = await this.retryExecutor.execute(notification, {
            timeout: this.sender.timeout || 8
        });

        if (success) {
            stats.totalSent++;
            if (attempts > 1) stats.totalRetries += (attempts - 1);
            this.cooldownManager.markSent(notification);
            this.log('info', 'Notification sent', {
                id: notification.id,
                type: notification.type,
                level: notification.level,
                attempts
            });
        } else {
            stats.totalFailed++;
            stats.totalRetries += (attempts - 1);
            this.log('error', 'Notification failed after retries', {
                id: notification.id,
                type: notification.type,
                attempts
            });
        }
    }

    log(level, event, data) {
        if (this.logger && typeof this.logger[level] === 'function') {
            this.logger[level](event, data);
        }
    }
}

module.exports = NotificationDispatcher;
