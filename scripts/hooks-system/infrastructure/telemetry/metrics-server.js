#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const env = require('../../config/env');

const PORT = env.getNumber('HOOK_METRICS_PORT', 9464);
const METRICS_FILE = path.join(process.cwd(), env.get('HOOK_METRICS_FILE', '.audit_tmp/hook-metrics.jsonl'));

function loadMetrics() {
  if (!fs.existsSync(METRICS_FILE)) return [];
  return fs
    .readFileSync(METRICS_FILE, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
}

function buildPrometheusMetrics() {
  const metrics = loadMetrics();
  const counters = {};

  for (const metric of metrics) {
    const hook = metric.hook || 'unknown';
    const status = metric.status || 'unknown';
    const key = `${hook}:${status}`;
    counters[key] = (counters[key] || 0) + 1;
  }

  let output = '# HELP hook_events_total Total number of hook events\n';
  output += '# TYPE hook_events_total counter\n';
  for (const [key, value] of Object.entries(counters)) {
    const [hook, status] = key.split(':');
    output += `hook_events_total{hook="${hook}",status="${status}"} ${value}\n`;
  }
  return output;
}

const server = http.createServer((req, res) => {
  if (req.url === '/metrics') {
    const body = buildPrometheusMetrics();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(body);
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Hook-System metrics server running on http://localhost:${PORT}/metrics`);
});
