#!/usr/bin/env node

const CompositionRoot = require('../application/CompositionRoot');

// Initialize Composition Root
const compositionRoot = CompositionRoot.createForProduction(process.cwd());

// Resolve dependencies graph
const guard = compositionRoot.getRealtimeGuardService();
const notificationCenter = compositionRoot.getNotificationService();

guard.start();
console.log('Realtime guard active. Watching evidence freshness and critical docs...');

process.on('SIGINT', () => {
  guard.stop();
  notificationCenter.shutdown();
  console.log('\nRealtime guard stopped');
  process.exit(0);
});
