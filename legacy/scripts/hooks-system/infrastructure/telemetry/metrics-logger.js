#!/usr/bin/env node

const env = require('../../config/env');

/**
 * Simple metrics logger stub for the hook-system platform.
 * Usage (programmatic):
 *   const { recordMetric } = require('./metrics-logger');
 *   recordMetric({ hook: 'validate-ai-evidence', status: 'success', durationMs: 123 });
 *
 * Usage (CLI):
 *   node scripts/hooks-system/infrastructure/telemetry/metrics-logger.js \
 *     --hook validate-ai-evidence --status success --duration 123
 */

const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.join(process.cwd(), '.audit_tmp', 'hook-metrics.jsonl');

function ensureDir() {
  const dir = path.dirname(METRICS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function recordMetric(entry) {
  ensureDir();
  const payload = {
    timestamp: Date.now(),
    ...entry,
  };
  fs.appendFileSync(METRICS_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
  return payload;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i++;
    }
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv);
  const { hook, status, duration } = args;

  if (!hook || !status) {
    console.error('Usage: metrics-logger --hook <name> --status <success|failure> [--duration <ms>]');
    process.exit(1);
  }

  const durationMs = duration ? Number(duration) : undefined;
  recordMetric({ hook, status, durationMs });
  console.log('Metric recorded');
}

module.exports = {
  recordMetric,
};
