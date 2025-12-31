const fs = require('fs');
const path = require('path');

const {
  createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

const METRICS_FILE = path.join(process.cwd(), '.audit_tmp', 'hook-metrics.jsonl');

class PredictiveHookAdvisor {
  constructor({ windowSize = 200 } = {}) {
    const m_constructor = createMetricScope({
      hook: 'predictive_hook_advisor',
      operation: 'constructor'
    });

    m_constructor.started();
    this.windowSize = windowSize;
    m_constructor.success();
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
    const m_get_failure_probabilities = createMetricScope({
      hook: 'predictive_hook_advisor',
      operation: 'get_failure_probabilities'
    });

    m_get_failure_probabilities.started();
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

    m_get_failure_probabilities.success();

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
