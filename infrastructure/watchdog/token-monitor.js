const path = require('path');

const NotificationCenterService = require('../../application/services/notification/NotificationCenterService');
const TokenMonitorService = require('../../application/services/token/TokenMonitorService');
const { createUnifiedLogger } = require('../logging/UnifiedLoggerFactory');

async function runTokenMonitor({
    repoRoot = null,
    notificationCenter = null,
    logger = null,
    service = null
} = {}) {
    const envRoot = process.env.HOOKS_REPO_ROOT ? path.resolve(process.env.HOOKS_REPO_ROOT) : null;
    const resolvedRepoRoot = repoRoot || envRoot || path.resolve(__dirname, '../..');

    const resolvedNotificationCenter = notificationCenter || new NotificationCenterService({
        repoRoot: resolvedRepoRoot,
        enabled: true
    });

    const resolvedLogger = logger || createUnifiedLogger({
        repoRoot: resolvedRepoRoot,
        component: 'TokenMonitor',
        fileName: 'token-monitor.log'
    });

    const monitorService = service || new TokenMonitorService({
        repoRoot: resolvedRepoRoot,
        notificationCenter: resolvedNotificationCenter,
        logger: resolvedLogger
    });

    const metrics = await monitorService.run();

    const staleTag = metrics.stale ? ' (stale)' : '';
    resolvedLogger.info('TOKEN_MONITOR_RESULT', {
        level: metrics.level,
        percentUsed: metrics.percentUsed,
        tokensUsed: metrics.tokensUsed,
        maxTokens: metrics.maxTokens,
        source: metrics.source,
        stale: metrics.stale,
        untrusted: metrics.untrusted
    }, {
        message: `Result level=${metrics.level} percent=${metrics.percentUsed}% used=${metrics.tokensUsed}/${metrics.maxTokens} source=${metrics.source}${staleTag}`
    });

    let exitCode = 0;
    if (metrics.level === 'critical') {
        exitCode = 2;
    } else if (metrics.level === 'warning') {
        exitCode = 1;
    }

    return { exitCode, metrics };
}

if (require.main === module) {
    runTokenMonitor()
        .then(({ exitCode }) => {
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('[token-monitor] Execution failed', error);
            process.exit(1);
        });
}

module.exports = { runTokenMonitor };
