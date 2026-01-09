/**
 * Observability Module - Metrics & Monitoring
 */

const {
    MetricsCollector,
    globalCollector,
    gateCheckCounter,
    gateCheckDuration,
    violationsGauge,
    mcpToolCallCounter,
    evidenceAgeGauge
} = require('./MetricsCollector');

module.exports = {
    MetricsCollector,
    globalCollector,
    gateCheckCounter,
    gateCheckDuration,
    violationsGauge,
    mcpToolCallCounter,
    evidenceAgeGauge
};
