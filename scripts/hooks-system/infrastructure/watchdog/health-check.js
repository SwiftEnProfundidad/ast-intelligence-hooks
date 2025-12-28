#!/usr/bin/env node

const { createUnifiedLogger } = require('../logging/UnifiedLoggerFactory');
const NotificationCenterService = require('../../application/services/notification/NotificationCenterService');
const { HealthCheckService } = require('../../application/services/monitoring/HealthCheckService');
const { getGitTreeState } = require('../../application/services/GitTreeState');
const { createHealthCheckProviders } = require('../../application/services/monitoring/HealthCheckProviders');
const path = require('path');

async function runHealthCheck({ repoRoot = null } = {}) {
    const resolvedRepoRoot = repoRoot
        || (process.env.HOOKS_REPO_ROOT ? path.resolve(process.env.HOOKS_REPO_ROOT) : null)
        || process.cwd();

    const logger = createUnifiedLogger({
        repoRoot: resolvedRepoRoot,
        component: 'HealthCheck',
        fileName: 'health-check.log'
    });

    const notificationCenter = new NotificationCenterService({
        repoRoot: resolvedRepoRoot,
        logger
    });

    const providers = createHealthCheckProviders({
        repoRoot: resolvedRepoRoot,
        getGitTreeState,
        heartbeatPath: path.join('.audit_tmp', 'guard-heartbeat.json'),
        tokenUsagePath: path.join('.audit_tmp', 'token-usage.jsonl'),
        evidencePath: '.AI_EVIDENCE.json'
    });

    const service = new HealthCheckService({
        repoRoot: resolvedRepoRoot,
        providers,
        notificationCenter,
        logger,
        outputFile: path.join(resolvedRepoRoot, '.audit_tmp', 'health-status.json')
    });

    try {
        await service.collect('cli');
    } finally {
        notificationCenter.shutdown();
    }
}

if (require.main === module) {
    runHealthCheck()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('[health-check] Execution failed', error);
            process.exit(1);
        });
}

module.exports = { runHealthCheck };
