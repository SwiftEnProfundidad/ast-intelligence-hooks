const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fsPromises = fs.promises;
const CursorTokenService = require('./CursorTokenService');
const NotificationCenterService = require('../notification/NotificationCenterService');
const TokenMetricsService = require('./TokenMetricsService');
const TokenStatusReporter = require('./TokenStatusReporter');

class TokenMonitorService {
    constructor({
        repoRoot = process.cwd(),
        dataFile = null,
        stateFile = null,
        notificationService = null,
        logger = console,
        thresholds = {},
        staleThresholdMs = 15 * 60 * 1000,
        fallbackEstimator = null,
        cursorTokenService = null
    } = {}) {
        this.repoRoot = repoRoot;
        this.dataFile = dataFile || path.join(this.repoRoot, '.audit_tmp', 'token-usage.jsonl');
        this.stateFile = stateFile || path.join(this.repoRoot, '.AI_TOKEN_STATUS.txt');
        this.logger = logger || console;

        this.notificationService = notificationService || new NotificationCenterService({
            repoRoot: this.repoRoot,
            logger: this.logger
        });

        this.thresholds = {
            maxTokens: thresholds.maxTokens ?? 1_000_000,
            warningPercent: thresholds.warningPercent ?? 90,
            criticalPercent: thresholds.criticalPercent ?? 95
        };
        this.staleThresholdMs = staleThresholdMs;
        this.fallbackEstimator = fallbackEstimator || this.defaultFallbackEstimator.bind(this);

        this.cursorTokenService = cursorTokenService || new CursorTokenService({
            repoRoot: this.repoRoot,
            usageFile: this.dataFile,
            logger: this.logger
        });

        this.metricsService = new TokenMetricsService(this.cursorTokenService, this.thresholds, this.logger);
        this.statusReporter = new TokenStatusReporter(this.stateFile);
    }

    async run() {
        // Collect metrics
        const metrics = await this.metricsService.collectMetrics(this.fallbackEstimator);

        // Write status file
        await this.statusReporter.writeStatusFile(metrics);

        // Notify
        await this.emitNotification(metrics);

        return metrics;
    }

    async defaultFallbackEstimator() {
        try {
            const commitCommand = 'git rev-list --count HEAD --since="1 hour ago"';
            const filesCommand = 'git diff --name-only HEAD~1 HEAD';

            let commitsCount = 0;
            let filesModified = 0;

            try {
                const commitsOutput = execSync(commitCommand, {
                    cwd: this.repoRoot,
                    stdio: ['ignore', 'pipe', 'ignore']
                });
                commitsCount = parseInt(commitsOutput.toString('utf8').trim(), 10);
            } catch (error) {
                commitsCount = 0;
            }

            try {
                const filesOutput = execSync(filesCommand, {
                    cwd: this.repoRoot,
                    stdio: ['ignore', 'pipe', 'ignore']
                });
                filesModified = filesOutput.toString('utf8').split('\n').filter(Boolean).length;
            } catch (error) {
                filesModified = 0;
            }

            const estimated = commitsCount * 10_000 + filesModified * 2_000 + 5_000;
            return estimated;
        } catch (error) {
            if (this.logger && this.logger.error) {
                this.logger.error('TOKEN_MONITOR_DEFAULT_ESTIMATE_FAILED', { error: error.message });
            }
            return null;
        }
    }

    async emitNotification(metrics) {
        if (!this.notificationService) {
            return;
        }

        const metadata = {
            percentUsed: metrics.percentUsed,
            tokensUsed: metrics.tokensUsed,
            remainingTokens: metrics.remainingTokens,
            source: metrics.source,
            stale: metrics.stale,
            untrusted: metrics.untrusted
        };

        if (metrics.untrusted) {
            this.notificationService.enqueue({
                message: `Token usage heurístico (${metrics.percentUsed}%). Esperando métricas reales antes de alertar.`,
                level: 'info',
                type: 'token_ok',
                metadata
            });
            return;
        }

        if (metrics.level === 'critical') {
            this.notificationService.enqueue({
                message: `🚨 Tokens at ${metrics.percentUsed}% (${this.statusReporter.formatNumber(metrics.tokensUsed)} used). Remaining ${this.statusReporter.formatNumber(metrics.remainingTokens)}.`,
                level: 'error',
                type: 'token_critical',
                metadata: { ...metadata, forceDialog: true }
            });
            return;
        }

        if (metrics.level === 'warning') {
            this.notificationService.enqueue({
                message: `⚠️ Tokens at ${metrics.percentUsed}% (${this.statusReporter.formatNumber(metrics.tokensUsed)} used).`,
                level: 'warn',
                type: 'token_warning',
                metadata
            });
            return;
        }

        this.notificationService.enqueue({
            message: `Token usage healthy (${metrics.percentUsed}% used).`,
            level: 'info',
            type: 'token_ok',
            metadata
        });
    }
}

module.exports = TokenMonitorService;
