const AuditLogger = require('../../logging/AuditLogger');

class NotificationCooldownManager {
    constructor(defaultCooldownMs = 60000, cooldownsByType = {}, logger = null) {
        this.cooldowns = new Map();
        this.defaultCooldownMs = defaultCooldownMs;
        this.cooldownsByType = cooldownsByType;
        this.logger = logger;
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd(), logger });
    }

    isInCooldown(notification) {
        const type = notification.type;
        const now = Date.now();

        if (!this.cooldowns.has(type)) {
            return false;
        }

        const lastSent = this.cooldowns.get(type);
        const cooldownMs = this.cooldownsByType[type] || this.defaultCooldownMs;

        const inCooldown = (now - lastSent) < cooldownMs;

        if (inCooldown && this.logger && this.logger.debug) {
            this.logger.debug('NOTIFICATION_COOLDOWN', {
                type,
                lastSent,
                cooldownMs,
                remaining: cooldownMs - (now - lastSent)
            });
        }

        return inCooldown;
    }

    markSent(notification) {
        this.cooldowns.set(notification.type, Date.now());
        if (this.logger && this.logger.debug) {
            this.logger.debug('NOTIFICATION_SENT_MARK', { type: notification.type });
        }
    }

    clearExpired() {
        const now = Date.now();
        for (const [type, lastSent] of this.cooldowns.entries()) {
            const cooldownMs = this.cooldownsByType[type] || this.defaultCooldownMs;
            if (now - lastSent > cooldownMs) {
                this.cooldowns.delete(type);
            }
        }
    }

    getStats() {
        return {
            activeCooldowns: this.cooldowns.size
        };
    }

    reset() {
        this.cooldowns.clear();
    }
}

module.exports = NotificationCooldownManager;
