#!/usr/bin/env node

const env = require('../config/env');
const fs = require('fs');
const path = require('path');

const EVIDENCE_PATH = path.join(process.cwd(), '.AI_EVIDENCE.json');
const STATE_FILE = path.join(process.cwd(), '.audit_tmp', 'autonomous-state.json');
const METRICS_FILE = path.join(process.cwd(), '.audit_tmp', 'hook-metrics.jsonl');

function evidenceStatus() {
  if (!fs.existsSync(EVIDENCE_PATH)) return 'missing';
  try {
    const data = JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf8'));
    const timestamp = new Date(data.timestamp).getTime();
    const ageMinutes = (Date.now() - timestamp) / 60000;
    return ageMinutes.toFixed(1) + ' min';
  } catch (error) {
    return 'invalid';
  }
}

function stateStatus() {
  if (!fs.existsSync(STATE_FILE)) return 'idle (default)';
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return data.state || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

function metricStatus() {
  if (!fs.existsSync(METRICS_FILE)) return '0 entries';
  const count = fs.readFileSync(METRICS_FILE, 'utf8').trim().split('\n').filter(Boolean).length;
  return `${count} entries`;
}

console.log('Hook-System status');
console.log(`- Evidence age: ${evidenceStatus()}`);
console.log(`- Orchestrator state: ${stateStatus()}`);
console.log(`- Metrics collected: ${metricStatus()}`);
