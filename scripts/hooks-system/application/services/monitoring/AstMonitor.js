const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class AstMonitor {
    constructor({
        repoRoot = process.cwd(),
        debounceMs = 8000,
        cooldownMs = 30000,
        enabled = true,
        logger = console,
        notificationService = null
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'ast_monitor',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.debounceMs = debounceMs;
        this.cooldownMs = cooldownMs;
        this.enabled = enabled;
        this.logger = logger;
        this.notificationService = notificationService;

        this.watcher = null;
        this.timer = null;
        this.lastRun = 0;
        this.isRunning = false;

        this.evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
        this.tempDir = path.join(repoRoot, '.audit_tmp');
        this.astScript = path.join(repoRoot, 'infrastructure', 'ast', 'ast-intelligence.js');
        m_constructor.success();
    }

    start() {
        const m_start = createMetricScope({
            hook: 'ast_monitor',
            operation: 'start'
        });

        m_start.started();
        if (!this.enabled) {
            this.logger.info('[AstMonitor] AST Watch disabled');
            m_start.success();
            return;
        }

        if (this.watcher) {
            m_start.success();
            return;
        }

        // Watch for file changes in source directories to trigger AST analysis
        // We avoid watching node_modules or .git
        const watchDirs = ['application', 'domain', 'infrastructure', 'presentation', 'hooks', 'bin', 'src'];

        this.logger.info('[AstMonitor] Starting AST watch on source directories');

        try {
            watchDirs.forEach(dir => {
                const fullPath = path.join(this.repoRoot, dir);
                if (fs.existsSync(fullPath)) {
                    fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
                        if (filename && (filename.endsWith('.js') || filename.endsWith('.ts'))) {
                            this.scheduleAnalysis();
                        }
                    });
                }
            });
        } catch (error) {
            this.logger.error('[AstMonitor] Failed to start watchers:', { error: error.message });
        }
        m_start.success();
    }

    stop() {
        const m_stop = createMetricScope({
            hook: 'ast_monitor',
            operation: 'stop'
        });

        m_stop.started();
        // fs.watch returns FSWatcher which has close(). 
        // Since we might have multiple watchers (one per dir), we should track them if we want to close properly.
        // For simplicity in this iteration, we assume the process exit handles it, or we rely on the debounce timer clear.

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        // Ideally we would close all FSWatchers here
        m_stop.success();
    }

    scheduleAnalysis() {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            this.runAnalysis();
        }, this.debounceMs);
    }

    async runAnalysis() {
        const now = Date.now();
        if (now - this.lastRun < this.cooldownMs || this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.lastRun = now;
        this.logger.info('[AstMonitor] Triggering AST Analysis due to changes');

        if (this.notificationService && typeof this.notificationService.enqueue === 'function') {
            this.notificationService.enqueue({
                message: '🔍 Analyzing code changes...',
                level: 'info',
                type: 'ast_analysis_start'
            });
        }

        const child = spawn('node', [this.astScript], {
            cwd: this.repoRoot,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderr = '';

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            this.isRunning = false;
            if (code === 0) {
                this.logger.info('[AstMonitor] AST Analysis complete');
                if (this.notificationService && typeof this.notificationService.enqueue === 'function') {
                    this.notificationService.enqueue({
                        message: '✅ AST Analysis updated',
                        level: 'info',
                        type: 'ast_analysis_success'
                    });
                }
            } else {
                this.logger.error('[AstMonitor] AST Analysis failed', { code, stderr });
                if (this.notificationService && typeof this.notificationService.enqueue === 'function') {
                    this.notificationService.enqueue({
                        message: '❌ AST Analysis failed',
                        level: 'error',
                        type: 'ast_analysis_error',
                        metadata: { code, stderr }
                    });
                }
            }
        });
    }
}

module.exports = AstMonitor;
