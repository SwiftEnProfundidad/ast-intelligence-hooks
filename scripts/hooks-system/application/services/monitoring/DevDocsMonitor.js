const fs = require('fs');
const path = require('path');

class DevDocsMonitor {
    constructor({
        repoRoot = process.cwd(),
        checkIntervalMs = 300000, // 5 minutes
        staleThresholdMs = 86400000, // 24 hours
        autoRefreshEnabled = true,
        logger = console,
        notificationService = null
    } = {}) {
        this.repoRoot = repoRoot;
        this.checkIntervalMs = checkIntervalMs;
        this.staleThresholdMs = staleThresholdMs;
        this.autoRefreshEnabled = autoRefreshEnabled;
        this.logger = logger;
        this.notificationService = notificationService;
        this.timer = null;
        this.docsStatePath = path.join(repoRoot, '.audit_tmp', 'dev-docs-state.json');
    }

    start() {
        if (!this.autoRefreshEnabled) {
            this.logger.info('[DevDocsMonitor] Auto-refresh disabled');
            return;
        }

        this.checkDocs();
        this.timer = setInterval(() => this.checkDocs(), this.checkIntervalMs);
        if (this.timer.unref) {
            this.timer.unref();
        }
        this.logger.info('[DevDocsMonitor] Started');
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
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
