#!/usr/bin/env node

const RealtimeGuardService = require('../application/services/RealtimeGuardService');
const NotificationCenterService = require('../application/services/notification/NotificationCenterService');

const notificationCenter = new NotificationCenterService({ repoRoot: process.cwd() });
const guard = new RealtimeGuardService({ notifier: console, notificationCenter });

guard.start();
console.log('Realtime guard active. Watching evidence freshness and critical docs...');

process.on('SIGINT', () => {
  guard.stop();
  notificationCenter.shutdown();
  console.log('\nRealtime guard stopped');
  process.exit(0);
});
