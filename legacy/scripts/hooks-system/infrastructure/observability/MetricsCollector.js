/**
 * =============================================================================
 * MetricsCollector - Enterprise Observability for AST Intelligence
 * =============================================================================
 * Collects and exposes metrics in Prometheus format
 * Supports: counters, gauges, histograms
 */

class MetricsCollector {
    constructor(options = {}) {
        this.prefix = options.prefix || 'ast_intelligence';
        this.labels = options.defaultLabels || {};
        this.metrics = new Map();
        this.histogramBuckets = options.histogramBuckets || [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10];
    }

    counter(name, help, labelNames = []) {
        const key = `${this.prefix}_${name}`;
        if (!this.metrics.has(key)) {
            this.metrics.set(key, {
                type: 'counter',
                name: key,
                help,
                labelNames,
                values: new Map()
            });
        }
        return {
            inc: (labels = {}, value = 1) => this._incCounter(key, labels, value)
        };
    }

    gauge(name, help, labelNames = []) {
        const key = `${this.prefix}_${name}`;
        if (!this.metrics.has(key)) {
            this.metrics.set(key, {
                type: 'gauge',
                name: key,
                help,
                labelNames,
                values: new Map()
            });
        }
        return {
            set: (labels = {}, value) => this._setGauge(key, labels, value),
            inc: (labels = {}, value = 1) => this._incGauge(key, labels, value),
            dec: (labels = {}, value = 1) => this._decGauge(key, labels, value)
        };
    }

    histogram(name, help, labelNames = [], buckets = null) {
        const key = `${this.prefix}_${name}`;
        if (!this.metrics.has(key)) {
            this.metrics.set(key, {
                type: 'histogram',
                name: key,
                help,
                labelNames,
                buckets: buckets || this.histogramBuckets,
                values: new Map()
            });
        }
        return {
            observe: (labels = {}, value) => this._observeHistogram(key, labels, value)
        };
    }

    _labelKey(labels) {
        return JSON.stringify(labels);
    }

    _incCounter(key, labels, value) {
        const metric = this.metrics.get(key);
        if (!metric) return;
        const labelKey = this._labelKey(labels);
        const current = metric.values.get(labelKey) || 0;
        metric.values.set(labelKey, current + value);
    }

    _setGauge(key, labels, value) {
        const metric = this.metrics.get(key);
        if (!metric) return;
        const labelKey = this._labelKey(labels);
        metric.values.set(labelKey, value);
    }

    _incGauge(key, labels, value) {
        const metric = this.metrics.get(key);
        if (!metric) return;
        const labelKey = this._labelKey(labels);
        const current = metric.values.get(labelKey) || 0;
        metric.values.set(labelKey, current + value);
    }

    _decGauge(key, labels, value) {
        const metric = this.metrics.get(key);
        if (!metric) return;
        const labelKey = this._labelKey(labels);
        const current = metric.values.get(labelKey) || 0;
        metric.values.set(labelKey, current - value);
    }

    _observeHistogram(key, labels, value) {
        const metric = this.metrics.get(key);
        if (!metric) return;
        const labelKey = this._labelKey(labels);

        if (!metric.values.has(labelKey)) {
            metric.values.set(labelKey, {
                sum: 0,
                count: 0,
                buckets: new Map(metric.buckets.map(b => [b, 0]))
            });
        }

        const data = metric.values.get(labelKey);
        data.sum += value;
        data.count += 1;

        for (const bucket of metric.buckets) {
            if (value <= bucket) {
                data.buckets.set(bucket, data.buckets.get(bucket) + 1);
            }
        }
    }

    toPrometheusFormat() {
        const lines = [];

        for (const [, metric] of this.metrics) {
            lines.push(`# HELP ${metric.name} ${metric.help}`);
            lines.push(`# TYPE ${metric.name} ${metric.type}`);

            for (const [labelKey, value] of metric.values) {
                const labels = JSON.parse(labelKey);
                const labelStr = Object.entries(labels)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(',');

                if (metric.type === 'histogram') {
                    for (const [bucket, count] of value.buckets) {
                        const bucketLabels = labelStr ? `${labelStr},le="${bucket}"` : `le="${bucket}"`;
                        lines.push(`${metric.name}_bucket{${bucketLabels}} ${count}`);
                    }
                    const infLabels = labelStr ? `${labelStr},le="+Inf"` : `le="+Inf"`;
                    lines.push(`${metric.name}_bucket{${infLabels}} ${value.count}`);
                    lines.push(`${metric.name}_sum{${labelStr}} ${value.sum}`);
                    lines.push(`${metric.name}_count{${labelStr}} ${value.count}`);
                } else {
                    if (labelStr) {
                        lines.push(`${metric.name}{${labelStr}} ${value}`);
                    } else {
                        lines.push(`${metric.name} ${value}`);
                    }
                }
            }
        }

        return lines.join('\n');
    }

    getMetricsJSON() {
        const result = {};
        for (const [key, metric] of this.metrics) {
            result[key] = {
                type: metric.type,
                help: metric.help,
                values: Object.fromEntries(metric.values)
            };
        }
        return result;
    }

    reset() {
        for (const [, metric] of this.metrics) {
            metric.values.clear();
        }
    }
}

const globalCollector = new MetricsCollector();

const gateCheckCounter = globalCollector.counter(
    'gate_check_total',
    'Total number of AI gate checks',
    ['status', 'branch_type']
);

const gateCheckDuration = globalCollector.histogram(
    'gate_check_duration_seconds',
    'Duration of AI gate checks in seconds',
    ['status']
);

const violationsGauge = globalCollector.gauge(
    'violations_current',
    'Current number of violations',
    ['severity']
);

const mcpToolCallCounter = globalCollector.counter(
    'mcp_tool_call_total',
    'Total MCP tool calls',
    ['tool', 'success']
);

const evidenceAgeGauge = globalCollector.gauge(
    'evidence_age_seconds',
    'Age of AI evidence in seconds',
    []
);

module.exports = {
    MetricsCollector,
    globalCollector,
    gateCheckCounter,
    gateCheckDuration,
    violationsGauge,
    mcpToolCallCounter,
    evidenceAgeGauge
};
