const fs = require('fs');
const path = require('path');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class ActivityMonitor {
    constructor({
        repoRoot = process.cwd(),
        inactivityGraceMs = 420000, // 7 minutes
        logger = console
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'activity_monitor',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.inactivityGraceMs = inactivityGraceMs;
        this.logger = logger;
        this.lastUserActivityAt = Date.now();
        this.watcher = null;
        this.debounceTimer = null;
        m_constructor.success();
    }

    start() {
        const m_start = createMetricScope({
            hook: 'activity_monitor',
            operation: 'start'
        });

        m_start.started();
        if (this.watcher) {
            m_start.success();
            return;
        }

        try {
            // Watch the git HEAD as a proxy for significant developer activity
            // Watching the whole repo can be expensive and noisy
            const gitHeadPath = path.join(this.repoRoot, '.git', 'HEAD');

            if (fs.existsSync(gitHeadPath)) {
                this.watcher = fs.watch(gitHeadPath, (eventType, filename) => {
                    this.recordActivity(`git activity: ${filename}`);
                });
                this.logger.info('[ActivityMonitor] Started watching .git/HEAD for activity');
            } else {
                // Fallback to watching repo root non-recursively for file additions/deletions
                this.watcher = fs.watch(this.repoRoot, { recursive: false }, (eventType, filename) => {
                    if (filename && !filename.startsWith('.git') && !filename.startsWith('node_modules')) {
                        this.recordActivity(`file change: ${filename}`);
                    }
                });
                this.logger.info('[ActivityMonitor] Started watching repo root for activity');
            }
        } catch (error) {
            this.logger.error('[ActivityMonitor] Failed to start watcher:', { error: error.message });
        }
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'activity_monitor',
            operation: 'stop'
        });

        m_stop.started();
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        m_stop.success();
    }

    recordActivity(source = 'unknown') {
        // Debounce activity updates
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.lastUserActivityAt = Date.now();
            this.logger.debug(`[ActivityMonitor] Activity detected via ${source}`);
        }, 1000);
    }

    isActive() {
        const idleTime = Date.now() - this.lastUserActivityAt;
        return idleTime < this.inactivityGraceMs;
    }

    getLastActivityTime() {
        const m_get_last_activity_time = createMetricScope({
            hook: 'activity_monitor',
            operation: 'get_last_activity_time'
        });

        m_get_last_activity_time.started();
        m_get_last_activity_time.success();
        return this.lastUserActivityAt;
    }
}

module.exports = ActivityMonitor;
