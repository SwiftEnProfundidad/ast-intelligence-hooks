
const env = require('../../../config/env');
const fs = require('fs');
const path = require('path');

class GatePolicies {
  constructor() {
    const policiesPath = path.join(__dirname, 'severity-policies.json');
    this.policies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));
  }

  /**
   * Apply quality gate to violations
   * @param {Array} violations - Enhanced violations with computed severity
   * @returns {Object} Gate result
   */
  apply(violations) {
    const grouped = this.groupBySeverity(violations);

    const override = this.detectContextOverride(violations);
    const effectivePolicies = override ? this.policies.context_overrides[override].policies : this.policies.quality_gate;

    const results = {
      CRITICAL: this.checkLevel('CRITICAL', grouped.CRITICAL || [], effectivePolicies.CRITICAL || effectivePolicies['CRITICAL']),
      HIGH: this.checkLevel('HIGH', grouped.HIGH || [], effectivePolicies.HIGH || effectivePolicies['HIGH']),
      MEDIUM: this.checkLevel('MEDIUM', grouped.MEDIUM || [], effectivePolicies.MEDIUM || effectivePolicies['MEDIUM']),
      LOW: this.checkLevel('LOW', grouped.LOW || [], effectivePolicies.LOW || effectivePolicies['LOW'])
    };

    const passed = !results.CRITICAL.failed && !results.HIGH.failed && !results.MEDIUM.failed && !results.LOW.failed;
    const blockedBy = results.CRITICAL.failed ? 'CRITICAL' :
      (results.HIGH.failed ? 'HIGH' :
        (results.MEDIUM.failed ? 'MEDIUM' :
          (results.LOW.failed ? 'LOW' : null)));

    return {
      passed,
      blockedBy,
      contextOverride: override,
      levelResults: results,
      summary: this.generateSummary(grouped, results),
      action: blockedBy ? effectivePolicies[blockedBy].action : 'ALLOW',
      exitCode: passed ? 0 : 1,
      violations: grouped
    };
  }

  groupBySeverity(violations) {
    return violations.reduce((acc, v) => {
      const severity = v.severity || 'MEDIUM';
      if (!acc[severity]) acc[severity] = [];
      acc[severity].push(v);
      return acc;
    }, {});
  }

  detectContextOverride(violations) {
    const allPaths = violations.map(v => v.filePath || '');

    for (const [contextName, config] of Object.entries(this.policies.context_overrides)) {
      const patterns = config.patterns || [];
      const matchCount = allPaths.filter(p =>
        patterns.some(pattern => p.includes(pattern))
      ).length;

      if (matchCount > allPaths.length * 0.8) {
        return contextName;
      }
    }

    return null;
  }

  checkLevel(severity, violations, policy) {
    const count = violations.length;
    const threshold = policy?.threshold ?? 0;
    const failed = count > threshold;

    return {
      severity,
      count,
      threshold,
      failed,
      action: policy?.action || 'WARN',
      message: policy?.message || `${count} ${severity} violations`,
      violations: failed ? violations.map(v => ({
        ruleId: v.ruleId,
        filePath: v.filePath,
        line: v.line,
        message: v.message,
        score: v.severityScore
      })) : []
    };
  }

  generateSummary(grouped, results) {
    const total = Object.values(grouped).flat().length;

    return {
      total,
      bySeverity: {
        CRITICAL: grouped.CRITICAL?.length || 0,
        HIGH: grouped.HIGH?.length || 0,
        MEDIUM: grouped.MEDIUM?.length || 0,
        LOW: grouped.LOW?.length || 0
      },
      failed: {
        CRITICAL: results.CRITICAL.failed,
        HIGH: results.HIGH.failed,
        MEDIUM: results.MEDIUM.failed,
        LOW: results.LOW.failed
      },
      message: this.buildSummaryMessage(results)
    };
  }

  buildSummaryMessage(results) {
    const parts = [];

    if (results.CRITICAL.failed) {
      parts.push(`🚨 ${results.CRITICAL.count} CRITICAL (threshold: ${results.CRITICAL.threshold})`);
    }

    if (results.HIGH.failed) {
      parts.push(`⚠️  ${results.HIGH.count} HIGH (threshold: ${results.HIGH.threshold})`);
    }

    if (results.MEDIUM.count > 0) {
      parts.push(`⚡ ${results.MEDIUM.count} MEDIUM (threshold: ${results.MEDIUM.threshold})`);
    }

    if (results.LOW.count > 0) {
      parts.push(`ℹ️  ${results.LOW.count} LOW (threshold: ${results.LOW.threshold})`);
    }

    return parts.join('\n');
  }
}

module.exports = { GatePolicies };
