#!/usr/bin/env node

const env = require('../../config/env');
const path = require('path');

const { createUnifiedLogger } = require('../logging/UnifiedLoggerFactory');
const NotificationCenterService = require('../../application/services/notification/NotificationCenterService');
const { AutoRecoveryManager } = require('../../application/services/recovery/AutoRecoveryManager');

const repoRoot = env.get('HOOKS_REPO_ROOT') ? path.resolve(env.get('HOOKS_REPO_ROOT')) : process.cwd();
const logger = createUnifiedLogger({
    repoRoot,
    component: 'AutoRecovery',
    fileName: 'auto-recovery.log'
});

const notificationCenter = new NotificationCenterService({
    repoRoot,
    logger
});

const manager = new AutoRecoveryManager({
    repoRoot,
    logger,
    notificationCenter
});

const reason = process.argv[2] || 'heartbeat-manual';
const key = process.argv[3] || 'guard-supervisor';

manager.recover({ key, reason }).finally(() => {
    notificationCenter.shutdown();
});
