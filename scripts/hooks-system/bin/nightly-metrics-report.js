#!/usr/bin/env node
'use strict';

const env = require('../config/env');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();
const METRICS_FILE = path.join(REPO_ROOT, '.audit_tmp', 'hook-metrics.jsonl');
const OUTPUT_DIR = path.join(REPO_ROOT, '.audit-reports', 'nightly');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readMetricsWindow(windowMs) {
  if (!fs.existsSync(METRICS_FILE)) {
    return [];
  }

  const now = Date.now();
  const cutoff = now - windowMs;
  const lines = fs.readFileSync(METRICS_FILE, 'utf8').split('\n').filter(Boolean);

  const entries = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.timestamp && parsed.timestamp >= cutoff) {
        entries.push(parsed);
      }
    } catch (error) {
      continue;
    }
  }
  return entries;
}

function aggregateMetrics(entries) {
  const summary = {
    total: entries.length,
    success: 0,
    failure: 0,
    hooks: {}
  };

  for (const entry of entries) {
    const status = entry.status || 'unknown';
    if (status === 'success') {
      summary.success += 1;
    } else if (status === 'failure') {
      summary.failure += 1;
    }

    const hook = entry.hook || 'unknown';
    if (!summary.hooks[hook]) {
      summary.hooks[hook] = {
        total: 0,
        success: 0,
        failure: 0,
        durations: []
      };
    }

    const bucket = summary.hooks[hook];
    bucket.total += 1;
    if (status === 'success') {
      bucket.success += 1;
    } else if (status === 'failure') {
      bucket.failure += 1;
    }
    if (Number.isFinite(entry.durationMs)) {
      bucket.durations.push(entry.durationMs);
    }
  }

  for (const hook of Object.keys(summary.hooks)) {
    const bucket = summary.hooks[hook];
    const count = bucket.durations.length;
    const totalDuration = bucket.durations.reduce((acc, value) => acc + value, 0);
    bucket.avgDurationMs = count > 0 ? totalDuration / count : null;
    delete bucket.durations;
  }

  return summary;
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function writeReport(report) {
  ensureDir(OUTPUT_DIR);
  const dateKey = formatDate(new Date(report.window.end));
  const outputPath = path.join(OUTPUT_DIR, `hook-metrics-${dateKey}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

function run() {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const entries = readMetricsWindow(windowMs);
  const summary = aggregateMetrics(entries);

  const report = {
    generatedAt: new Date(now).toISOString(),
    window: {
      start: new Date(now - windowMs).toISOString(),
      end: new Date(now).toISOString()
    },
    totals: summary,
    notes: entries.length === 0 ? 'No metrics recorded in the selected window.' : undefined
  };

  const outputPath = writeReport(report);
  console.log(`Nightly metrics report generated: ${outputPath}`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error('Failed to generate nightly metrics report:', error.message);
    process.exit(1);
  }
}

module.exports = {
  readMetricsWindow,
  aggregateMetrics,
  writeReport,
  run
};
