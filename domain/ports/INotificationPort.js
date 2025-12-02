/**
 * INotificationPort
 *
 * Port interface for notification delivery.
 * Infrastructure adapters must implement this interface.
 *
 * @interface
 */
class INotificationPort {
    /**
     * Send a notification to the user
     * @param {Object} notification
     * @param {string} notification.title - Notification title
     * @param {string} notification.message - Notification message
     * @param {string} notification.level - Level: 'info' | 'warn' | 'error'
     * @param {string} [notification.type] - Type for cooldown/deduplication
     * @param {string} [notification.sound] - Sound name (macOS)
     * @returns {Promise<boolean>} true if sent successfully
     */
    async send(notification) {
        throw new Error('INotificationPort.send() must be implemented');
    }

    /**
     * Check if notifications are enabled
     * @returns {boolean}
     */
    isEnabled() {
        throw new Error('INotificationPort.isEnabled() must be implemented');
    }
}

module.exports = INotificationPort;
