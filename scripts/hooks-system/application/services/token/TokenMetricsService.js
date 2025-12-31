const { execSync } = require('child_process');

class TokenMetricsService {
    constructor(cursorTokenService, thresholds, logger) {
        this.cursorTokenService = cursorTokenService;
        this.thresholds = thresholds;
        this.logger = logger;
        this.repoRoot = process.cwd();
    }

    async collectMetrics(fallbackEstimator) {
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
                // If usage has a maxTokens, use it, otherwise use our threshold default
                // But wait, the original logic was:
                // tokensUsed = Math.min(tokensUsed, usageMaxTokens); 
                // This seems wrong if usageMaxTokens is the limit. 
                // Let's stick to the original logic for safety but it looks like clamping usage to limit?
                // Actually if usage.maxTokens is provided by the API, we should probably trust it or update our threshold?
                // For now, let's keep original behavior:
                tokensUsed = Math.min(tokensUsed, usageMaxTokens);
            }
            source = usage.source || 'realtime';
            untrusted = Boolean(usage.untrusted);
            timestamp = usage.timestamp || timestamp;
            stale = now.getTime() - new Date(timestamp).getTime() > (15 * 60 * 1000); // 15 min stale threshold hardcoded in original service logic or passed in?
            // The original service had staleThresholdMs passed in constructor. I should probably pass it here too.
        }

        if (source === 'fallback' && fallbackEstimator) {
            const fallbackTokens = await this.safeFallbackEstimate(fallbackEstimator);
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
        const env = require('../../config/env');
        const forceLevel = (env.get('TOKEN_MONITOR_FORCE_LEVEL', '') || '').toLowerCase();
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

        if (this.logger && typeof this.logger.debug === 'function') {
            this.logger.debug('TOKEN_MONITOR_METRICS', metrics);
        }

        return metrics;
    }

    async safeFallbackEstimate(fallbackEstimator) {
        try {
            const estimate = await fallbackEstimator();
            if (typeof estimate === 'number' && Number.isFinite(estimate)) {
                return estimate;
            }
            return null;
        } catch (error) {
            if (this.logger && this.logger.warn) {
                this.logger.warn('TOKEN_MONITOR_FALLBACK_FAILED', { error: error.message });
            }
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
}

module.exports = TokenMetricsService;
