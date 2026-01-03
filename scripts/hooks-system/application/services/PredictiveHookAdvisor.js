const fs = require('fs');
const path = require('path');
const AuditLogger = require('./logging/AuditLogger');

const METRICS_FILE = path.join(process.cwd(), '.audit_tmp', 'hook-metrics.jsonl');

class PredictiveHookAdvisor {
  constructor({ windowSize = 200 } = {}) {
    this.windowSize = windowSize;
    this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
  }

  loadMetrics() {
    if (!fs.existsSync(METRICS_FILE)) {
      return [];
    }
    const lines = fs.readFileSync(METRICS_FILE, 'utf8').trim().split('\n').filter(Boolean);
    const recent = lines.slice(-this.windowSize);
    return recent.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  }

  getFailureProbabilities() {
    const metrics = this.loadMetrics();
    const stats = {};

    for (const metric of metrics) {
      const key = metric.hook || 'unknown';
      if (!stats[key]) {
        stats[key] = { total: 0, failures: 0 };
      }
      stats[key].total += 1;
      if (metric.status === 'failure') {
        stats[key].failures += 1;
      }
    }

    return Object.entries(stats)
      .map(([hook, { total, failures }]) => ({
        hook,
        total,
        failures,
        probability: total > 0 ? failures / total : 0,
      }))
      .sort((a, b) => b.probability - a.probability);
  }

  suggestPreemptiveActions(threshold = 0.3) {
    return this.getFailureProbabilities().filter(item => item.probability >= threshold);
  }
}

module.exports = PredictiveHookAdvisor;
