const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fsPromises = fs.promises;
const CursorTokenService = require('./CursorTokenService');
const NotificationCenterService = require('../notification/NotificationCenterService');

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
    }

    async run() {
        const metrics = await this.collectMetrics();
        await this.writeStatusFile(metrics);
        await this.emitNotification(metrics);
        return metrics;
    }

    async collectMetrics() {
        const usage = await this.cursorTokenService.getCurrentUsage();
        const now = new Date();
        const maxTokens = this.thresholds.maxTokens;

        let tokensUsed = 0;
        let source = 'fallback';
        let untrusted = false;
        let timestamp = now.toISOString();
        let stale = true;

        if (usage) {
            tokensUsed = typeof usage.tokensUsed === 'number' ? usage.tokensUsed : tokensUsed;
            const usageMaxTokens = typeof usage.maxTokens === 'number' ? usage.maxTokens : maxTokens;
            if (Number.isFinite(usageMaxTokens)) {
                tokensUsed = Math.min(tokensUsed, usageMaxTokens);
            }
            source = usage.source || 'realtime';
            untrusted = Boolean(usage.untrusted);
            timestamp = usage.timestamp || timestamp;
            stale = now.getTime() - new Date(timestamp).getTime() > this.staleThresholdMs;
        }

        if (source === 'fallback') {
            const fallbackTokens = await this.safeFallbackEstimate();
            if (fallbackTokens != null) {
                tokensUsed = fallbackTokens;
            }
        }

        tokensUsed = Math.max(0, Math.min(tokensUsed, maxTokens));
        const percentUsed = maxTokens === 0 ? 0 : (tokensUsed / maxTokens) * 100;
        const remainingTokens = Math.max(0, maxTokens - tokensUsed);

        let level = this.resolveLevel(percentUsed);
        if (untrusted) {
            level = 'ok';
        }
        const forceLevel = (process.env.TOKEN_MONITOR_FORCE_LEVEL || '').toLowerCase();
        if (forceLevel === 'warning' || forceLevel === 'critical' || forceLevel === 'ok') {
            level = forceLevel;
        }

        const metrics = {
            timestamp,
            tokensUsed,
            maxTokens,
            percentUsed: Number(percentUsed.toFixed(2)),
            remainingTokens,
            level,
            source,
            stale,
            untrusted
        };

        if (typeof this.logger?.debug === 'function') {
            this.logger.debug('TOKEN_MONITOR_METRICS', {
                level: metrics.level,
                tokensUsed: metrics.tokensUsed,
                maxTokens: metrics.maxTokens,
                percentUsed: metrics.percentUsed,
                source: metrics.source,
                stale: metrics.stale,
                untrusted: metrics.untrusted
            });
        }

        return metrics;
    }

    async safeFallbackEstimate() {
        try {
            const estimate = await this.fallbackEstimator();
            if (typeof estimate === 'number' && Number.isFinite(estimate)) {
                return estimate;
            }
            return null;
        } catch (error) {
            this.logger.warn?.('TOKEN_MONITOR_FALLBACK_FAILED', { error: error.message });
            return null;
        }
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
            this.logger.error?.('TOKEN_MONITOR_DEFAULT_ESTIMATE_FAILED', { error: error.message });
            return null;
        }
    }

    resolveLevel(percentUsed) {
        if (percentUsed >= this.thresholds.criticalPercent) {
            return 'critical';
        }

        if (percentUsed >= this.thresholds.warningPercent) {
            return 'warning';
        }

        return 'ok';
    }

    async writeStatusFile(metrics) {
        const lines = [];
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        lines.push('🔋 TOKEN USAGE - Current Session');
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        lines.push('');
        lines.push(`Status: ${metrics.level.toUpperCase()}${metrics.stale ? ' (stale data)' : ''}`);
        lines.push(`Tokens Used: ${this.formatNumber(metrics.tokensUsed)} / ${this.formatNumber(metrics.maxTokens)} (${metrics.percentUsed}%)`);
        lines.push(`Remaining: ${this.formatNumber(metrics.remainingTokens)} tokens`);
        lines.push(`Source: ${metrics.source}`);
        lines.push('');

        if (metrics.level === 'critical') {
            lines.push('🚨 CRITICAL: Approaching token limit!');
            lines.push('   → Save your work and prepare for context switch');
            lines.push('');
        } else if (metrics.level === 'warning') {
            lines.push('⚠️  WARNING: High token usage');
            lines.push('   → Consider wrapping up current task');
            lines.push('');
        } else {
            lines.push('✅ Token usage healthy');
            lines.push('   → Continue working normally');
            lines.push('');
        }

        if (metrics.untrusted) {
            lines.push('⚠️  Data marked as heuristic/untrusted. Verify token feed.');
            lines.push('');
        }

        if (metrics.stale) {
            lines.push('ℹ️  Data is stale. Ensure guards are running and refreshing token usage.');
            lines.push('');
        }

        lines.push(`Last updated: ${new Date().toISOString()}`);
        lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await fsPromises.writeFile(this.stateFile, `${lines.join('\n')}\n`, 'utf8');
    }

    formatNumber(value) {
        return value.toLocaleString('en-US');
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
                message: `🚨 Tokens at ${metrics.percentUsed}% (${this.formatNumber(metrics.tokensUsed)} used). Remaining ${this.formatNumber(metrics.remainingTokens)}.`,
                level: 'error',
                type: 'token_critical',
                metadata: { ...metadata, forceDialog: true }
            });
            return;
        }

        if (metrics.level === 'warning') {
            this.notificationService.enqueue({
                message: `⚠️ Tokens at ${metrics.percentUsed}% (${this.formatNumber(metrics.tokensUsed)} used).`,
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
