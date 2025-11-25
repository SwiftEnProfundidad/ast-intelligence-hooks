#!/usr/bin/env node

const RealtimeGuardService = require('../application/services/RealtimeGuardService');

const guard = new RealtimeGuardService({ notifier: console });
guard.start();
console.log('Realtime guard active. Watching evidence freshness and critical docs...');

process.on('SIGINT', () => {
  guard.stop();
  console.log('\nRealtime guard stopped');
  process.exit(0);
});
