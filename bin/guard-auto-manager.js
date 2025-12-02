#!/usr/bin/env node
const { createUnifiedLogger } = require('../infrastructure/logging/UnifiedLoggerFactory');
const NotificationCenterService = require('../application/services/notification/NotificationCenterService');
const { GuardAutoManagerService } = require('../application/services/guard/GuardAutoManagerService');

const repoRoot = process.cwd();

const logger = createUnifiedLogger({
  repoRoot,
  component: 'GuardAutoManager',
  fileName: 'guard-auto-manager.log'
});

const notificationCenter = new NotificationCenterService({
  repoRoot,
  logger
});

const service = new GuardAutoManagerService({
  repoRoot,
  logger,
  notificationCenter
});

if (!service.start()) {
  process.exit(0);
}

process.on('SIGINT', () => {
  service.shutdown();
  notificationCenter.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  service.shutdown();
  notificationCenter.shutdown();
  process.exit(0);
});

process.on('exit', () => {
  service.shutdown();
  notificationCenter.shutdown();
});
