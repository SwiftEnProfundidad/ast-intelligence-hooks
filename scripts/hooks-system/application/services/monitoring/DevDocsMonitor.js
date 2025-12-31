const fs = require('fs');
const path = require('path');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class DevDocsMonitor {
    constructor({
        repoRoot = process.cwd(),
        checkIntervalMs = 300000, // 5 minutes
        staleThresholdMs = 86400000, // 24 hours
        autoRefreshEnabled = true,
        logger = console,
        notificationService = null
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'dev_docs_monitor',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.checkIntervalMs = checkIntervalMs;
        this.staleThresholdMs = staleThresholdMs;
        this.autoRefreshEnabled = autoRefreshEnabled;
        this.logger = logger;
        this.notificationService = notificationService;
        this.timer = null;
        this.docsStatePath = path.join(repoRoot, '.audit_tmp', 'dev-docs-state.json');
        m_constructor.success();
    }

    start() {
        const m_start = createMetricScope({
            hook: 'dev_docs_monitor',
            operation: 'start'
        });

        m_start.started();
        if (!this.autoRefreshEnabled) {
            this.logger.info('[DevDocsMonitor] Auto-refresh disabled');
            m_start.success();
            return;
        }

        this.checkDocs();
        this.timer = setInterval(() => this.checkDocs(), this.checkIntervalMs);
        if (this.timer.unref) {
            this.timer.unref();
        }
        this.logger.info('[DevDocsMonitor] Started');
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'dev_docs_monitor',
            operation: 'stop'
        });

        m_stop.started();
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        m_stop.success();
    }

    async checkDocs() {
        try {
            const rulesFiles = [
                'rulesbackend.mdc',
                'rulesfront.mdc',
                'rulesios.mdc',
                'rulesandroid.mdc'
            ];

            const staleDocs = [];

            for (const file of rulesFiles) {
                const filePath = path.join(this.repoRoot, '.cursor', 'rules', file);
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    const ageMs = Date.now() - stats.mtime.getTime();
                    if (ageMs > this.staleThresholdMs) {
                        staleDocs.push(file);
                    }
                }
            }

            if (staleDocs.length > 0) {
                const message = `⚠️ Developer documentation (${staleDocs.length} files) may be stale.`;
                this.logger.warn(`[DevDocsMonitor] Stale docs detected: ${staleDocs.join(', ')}`);

                if (this.notificationService && typeof this.notificationService.enqueue === 'function') {
                    this.notificationService.enqueue({
                        message,
                        level: 'warn',
                        type: 'docs_stale',
                        metadata: { staleDocs }
                    });
                }
            }
        } catch (error) {
            this.logger.error('[DevDocsMonitor] Failed to check docs:', { error: error.message });
        }
    }
}

module.exports = DevDocsMonitor;
