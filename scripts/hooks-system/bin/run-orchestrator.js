#!/usr/bin/env node

const ContextDetectionEngine = require('../application/services/ContextDetectionEngine');
const AutonomousOrchestrator = require('../application/services/AutonomousOrchestrator');
const PlatformDetectionService = require('../application/services/PlatformDetectionService');
const HookSystemScheduler = require('../application/services/HookSystemScheduler');

async function main() {
  const contextEngine = new ContextDetectionEngine(process.cwd());
  const platformDetector = new PlatformDetectionService();
  const orchestrator = new AutonomousOrchestrator(contextEngine, platformDetector, null);
  const scheduler = new HookSystemScheduler({ orchestrator, contextEngine });

  scheduler.start();
  console.log('Hook-System scheduler started (press Ctrl+C to stop)');

  process.on('SIGINT', () => {
    scheduler.stop();
    console.log('\nScheduler stopped');
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Failed to start orchestrator:', error);
  process.exit(1);
});
