#!/usr/bin/env node

const { createUnifiedLogger } = require('../logging/UnifiedLoggerFactory');
const NotificationCenterService = require('../../application/services/notification/NotificationCenterService');
const { HealthCheckService } = require('../../application/services/monitoring/HealthCheckService');
const { getGitTreeState } = require('../../application/services/GitTreeState');
const { createHealthCheckProviders } = require('../../application/services/monitoring/HealthCheckProviders');
const path = require('path');

const repoRoot = process.env.HOOKS_REPO_ROOT ? path.resolve(process.env.HOOKS_REPO_ROOT) : process.cwd();
const logger = createUnifiedLogger({
    repoRoot,
    component: 'HealthCheck',
    fileName: 'health-check.log'
});

const notificationCenter = new NotificationCenterService({
    repoRoot,
    logger
});

const providers = createHealthCheckProviders({
    repoRoot,
    getGitTreeState,
    heartbeatPath: path.join('.audit_tmp', 'guard-heartbeat.json'),
    tokenUsagePath: path.join('.audit_tmp', 'token-usage.jsonl'),
    evidencePath: '.AI_EVIDENCE.json'
});

const service = new HealthCheckService({
    repoRoot,
    providers,
    notificationCenter,
    logger,
    outputFile: path.join(repoRoot, '.audit_tmp', 'health-status.json')
});

service.collect('cli').finally(() => {
    notificationCenter.shutdown();
});
