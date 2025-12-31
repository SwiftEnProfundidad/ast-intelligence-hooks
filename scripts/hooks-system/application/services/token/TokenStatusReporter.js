const fs = require('fs');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

const fsPromises = fs.promises;

class TokenStatusReporter {
    constructor(stateFile) {
        const m_constructor = createMetricScope({
            hook: 'token_status_reporter',
            operation: 'constructor'
        });

        m_constructor.started();
        this.stateFile = stateFile;
        m_constructor.success();
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
}

module.exports = TokenStatusReporter;
