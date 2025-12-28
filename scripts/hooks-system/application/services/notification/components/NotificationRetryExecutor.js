class NotificationRetryExecutor {
    constructor(sender, config = {}, logger = null) {
        this.sender = sender;
        this.maxRetries = config.maxRetries || 2;
        this.retryDelayMs = config.retryDelayMs || 1000;
        this.logger = logger;
    }

    async execute(notification, options = {}) {
        const currentRetries = notification.retries || 0;
        const remainingRetries = currentRetries < this.maxRetries ? this.maxRetries - currentRetries : 0;

        for (let attempt = 0; attempt <= remainingRetries; attempt++) {
            if (attempt > 0) {
                await this.sleep(this.retryDelayMs * attempt);
            }

            try {
                const success = this.sender.send(notification, options);
                if (success) {
                    if (attempt > 0) {
                        this.logRetrySuccess(notification, attempt);
                    }
                    return { success: true, attempts: attempt + 1 };
                }
            } catch (error) {
                this.logError(notification, error, attempt);
            }
        }

        return { success: false, attempts: remainingRetries + 1 };
    }

    logRetrySuccess(notification, attempt) {
        if (this.logger && this.logger.debug) {
            this.logger.debug('Notification sent after retry', {
                id: notification.id,
                attempts: attempt + 1
            });
        }
    }

    logError(notification, error, attempt) {
        if (this.logger && this.logger.warn) {
            this.logger.warn('Notification send attempt failed', {
                id: notification.id,
                attempt: attempt + 1,
                error: error.message
            });
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = NotificationRetryExecutor;
