/**
 * NotificationCenterService
 *
 * Centralized service for hook-system notification management.
 * Implements deduplication, message queue, cooldowns, and retry logic.
 *
 * Responsibilities (SRP):
 * - Orchestrate notification flow
 * - Delegate specific logic to components (Queue, Dedupe, Cooldown, Retry)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const UnifiedLogger = require('../logging/UnifiedLogger');
const MacNotificationSender = require('./MacNotificationSender');
const NotificationDeduplicator = require('./components/NotificationDeduplicator');
const NotificationCooldownManager = require('./components/NotificationCooldownManager');
const NotificationQueue = require('./components/NotificationQueue');
const NotificationRetryExecutor = require('./components/NotificationRetryExecutor');
const NotificationDispatcher = require('./NotificationDispatcher');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class NotificationCenterService {
    constructor(config = {}) {
        const m_constructor = createMetricScope({
            hook: 'notification_center_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = config.repoRoot || process.cwd();
        this.enabled = config.enabled !== false;

        // Logging Configuration
        const defaultLogPath = config.logPath || path.join(this.repoRoot, '.audit-reports', 'notifications.log');
        try {
            fs.mkdirSync(path.dirname(defaultLogPath), { recursive: true });
        } catch (e) {
            // Ignore if it already exists or permissions issues during init
        }

        this.logger = config.logger || new UnifiedLogger({
            component: 'NotificationCenter',
            console: { enabled: true, level: 'info' },
            file: { enabled: true, level: 'debug', path: defaultLogPath }
        });

        // Core Components
        this.queue = new NotificationQueue(config.maxQueueSize || 100);
        this.deduplicator = new NotificationDeduplicator(config.deduplicationWindowMs, this.logger);

        // Cooldown Configuration
        const cooldownsByType = {
            evidence_stale: config.evidenceCooldownMs || 120000,
            evidence_ok: config.evidenceOkCooldownMs || 300000,
            token_warning: config.tokenWarningCooldownMs || 180000,
            token_critical: config.tokenCriticalCooldownMs || 120000,
            token_ok: config.tokenOkCooldownMs || 300000,
            dirty_tree_warning: config.dirtyTreeWarningMs || 600000,
            dirty_tree_critical: config.dirtyTreeCriticalMs || 300000,
            heartbeat_degraded: config.heartbeatDegradedMs || 180000,
            heartbeat_ok: config.heartbeatOkMs || 600000,
            guard_supervisor: config.guardSupervisorMs || 900000
        };
        this.cooldownManager = new NotificationCooldownManager(config.defaultCooldownMs, cooldownsByType, this.logger);

        // Sender and Executor
        this.sender = new MacNotificationSender(this.logger);
        this.notificationTimeout = config.notificationTimeout || 8;
        this.retryExecutor = new NotificationRetryExecutor(this.sender, {
            maxRetries: config.maxRetries || 2,
            retryDelayMs: config.retryDelayMs || 1000
        }, this.logger);

        this.dispatcher = new NotificationDispatcher(this.sender, this.retryExecutor, this.cooldownManager, this.logger);

        // Internal State
        this.processing = false;
        this.flushIntervalMs = config.flushIntervalMs || 1000;
        this.flushTimer = null;

        // Statistics
        this.stats = {
            totalEnqueued: 0,
            totalSent: 0,
            totalDeduplicated: 0,
            totalCooldownSkipped: 0,
            totalFailed: 0,
            totalRetries: 0
        };
        m_constructor.success();
    }

    /**
     * Enqueues a notification to be sent
     */
    enqueue(notification) {
        if (!this.enabled) return false;

        const enriched = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            level: notification.level || 'info',
            type: notification.type || 'generic',
            metadata: notification.metadata || {},
            retries: 0
        };

        if (this.deduplicator.isDuplicate(enriched)) {
            this.stats.totalDeduplicated++;
            this.log('debug', 'Notification deduplicated', { message: enriched.message, type: enriched.type });
            return false;
        }

        if (this.cooldownManager.isInCooldown(enriched)) {
            this.stats.totalCooldownSkipped++;
            this.log('debug', 'Notification skipped (cooldown)', { message: enriched.message, type: enriched.type });
            return false;
        }

        if (!this.queue.enqueue(enriched)) {
            this.log('warn', 'Queue full, dropping notification', { message: enriched.message });
            return false;
        }

        this.stats.totalEnqueued++;
        this.log('debug', 'Notification enqueued', { id: enriched.id, type: enriched.type });

        this.scheduleFlush();
        return true;
    }

    scheduleFlush() {
        if (!this.processing && !this.flushTimer) {
            this.flushTimer = setTimeout(() => this.flush(), this.flushIntervalMs);
        }
    }

    /**
     * Processes the notification queue
     */
    async flush() {
        if (this.processing || this.queue.isEmpty()) return;

        this.processing = true;
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        while (!this.queue.isEmpty()) {
            const notification = this.queue.dequeue();
            if (notification) {
                await this.dispatcher.dispatch(notification, this.stats);
            }
        }

        this.processing = false;
    }

    /**
     * Structured logging
     */
    log(level, event, data = {}) {
        if (this.logger && typeof this.logger[level] === 'function') {
            this.logger[level](event, data);
        }
    }

    /**
     * Helper: sleep for retry logic
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets service statistics
     */
    getStats() {
        const m_get_stats = createMetricScope({
            hook: 'notification_center_service',
            operation: 'get_stats'
        });

        m_get_stats.started();
        m_get_stats.success();
        return {
            ...this.stats,
            queueSize: this.queue.size(),
            deduplication: this.deduplicator.getStats(),
            cooldowns: this.cooldownManager.getStats()
        };
    }

    /**
     * Resets the service (useful for testing)
     */
    reset() {
        this.queue.clear();
        this.deduplicator.reset();
        this.cooldownManager.reset();
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        this.processing = false;
        this.stats = {
            totalEnqueued: 0,
            totalSent: 0,
            totalDeduplicated: 0,
            totalCooldownSkipped: 0,
            totalFailed: 0,
            totalRetries: 0
        };
    }

    /**
     * Stops the service cleanly
     */
    shutdown() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        if (!this.queue.isEmpty()) {
            this.flush(); // Attempt one last flush
        }
        this.log('info', 'NotificationCenterService shutdown', this.getStats());
    }
}

module.exports = NotificationCenterService;
