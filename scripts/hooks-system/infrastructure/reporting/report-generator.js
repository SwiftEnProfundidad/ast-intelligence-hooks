
const fs = require('fs');
const path = require('path');
const ReportPresenter = require('./ReportPresenter');

class ReportGenerator {
  constructor() {
    this.presenter = new ReportPresenter();
  }

  /**
   * Generate comprehensive violation report
   * @param {Array} violations - Enhanced violations with severity evaluation
   * @param {Object} gateResult - Quality gate result
   * @returns {Object} Report object
   */
  generate(violations, gateResult) {
    const timestamp = new Date().toISOString();

    return {
      meta: {
        timestamp,
        generator: 'AST Intelligence v2.0',
        totalViolations: violations.length,
        intelligentEvaluationEnabled: violations.some(v => v.intelligentEvaluation),
        gateStatus: gateResult.passed ? 'PASSED' : 'FAILED'
      },

      summary: this.generateSummary(violations),

      bySeverity: this.groupBySeverity(violations),

      byCategory: this.groupByCategory(violations),

      byFile: this.groupByFile(violations),

      criticalIssues: this.extractCriticalIssues(violations),

      impactAnalysis: this.analyzeImpact(violations),

      recommendations: this.generateRecommendations(violations),

      metrics: this.calculateMetrics(violations),

      gateResult,

      violations: violations.map(v => this.formatViolation(v))
    };
  }

  generateSummary(violations) {
    const grouped = this.groupBySeverity(violations);

    const intelligentCount = violations.filter(v => v.intelligentEvaluation).length;
    const upgradedCount = violations.filter(v =>
      v.originalSeverity && v.severity !== v.originalSeverity &&
      this.severityRank(v.severity) > this.severityRank(v.originalSeverity)
    ).length;
    const downgradedCount = violations.filter(v =>
      v.originalSeverity && v.severity !== v.originalSeverity &&
      this.severityRank(v.severity) < this.severityRank(v.originalSeverity)
    ).length;

    return {
      total: violations.length,
      CRITICAL: grouped.CRITICAL?.length || 0,
      HIGH: grouped.HIGH?.length || 0,
      MEDIUM: grouped.MEDIUM?.length || 0,
      LOW: grouped.LOW?.length || 0,
      intelligentlyEvaluated: intelligentCount,
      upgradedBySeverityIntelligence: upgradedCount,
      downgradedBySeverityIntelligence: downgradedCount,
      averageSeverityScore: this.calculateAverageSeverityScore(violations)
    };
  }

  groupBySeverity(violations) {
    return violations.reduce((acc, v) => {
      const severity = v.severity || 'LOW';
      if (!acc[severity]) acc[severity] = [];
      acc[severity].push(v);
      return acc;
    }, {});
  }

  groupByCategory(violations) {
    return violations.reduce((acc, v) => {
      const category = this.extractCategory(v.ruleId);
      if (!acc[category]) acc[category] = [];
      acc[category].push(v);
      return acc;
    }, {});
  }

  groupByFile(violations) {
    return violations.reduce((acc, v) => {
      const file = v.filePath;
      if (!acc[file]) acc[file] = [];
      acc[file].push(v);
      return acc;
    }, {});
  }

  extractCategory(ruleId) {
    if (ruleId.includes('solid.')) return 'SOLID Principles';
    if (ruleId.includes('clean_arch.')) return 'Clean Architecture';
    if (ruleId.includes('bdd.') || ruleId.includes('tdd.')) return 'BDD/TDD';
    if (ruleId.includes('ddd.')) return 'DDD';
    if (ruleId.includes('cqrs.')) return 'CQRS';
    if (ruleId.includes('security.')) return 'Security';
    if (ruleId.includes('performance.')) return 'Performance';
    if (ruleId.includes('testing.')) return 'Testing';
    if (ruleId.includes('typescript.') || ruleId.includes('kotlin.')) return 'Type Safety';
    if (ruleId.includes('react.') || ruleId.includes('compose.')) return 'UI Framework';
    return 'Other';
  }

  extractCriticalIssues(violations) {
    const critical = violations.filter(v => v.severity === 'CRITICAL');

    return critical.map(v => ({
      ruleId: v.ruleId,
      filePath: v.filePath,
      line: v.line,
      message: v.message,
      severityScore: v.severityScore,
      impactBreakdown: v.impactBreakdown,
      recommendation: v.recommendation,
      context: {
        isCriticalPath: v.context?.isCriticalPath,
        isProduction: v.context?.isProduction,
        dependencyCount: v.context?.dependencyCount
      }
    }));
  }

  analyzeImpact(violations) {
    const withImpact = violations.filter(v => v.impactBreakdown);

    if (withImpact.length === 0) {
      return null;
    }

    const totals = withImpact.reduce((acc, v) => {
      acc.security += v.impactBreakdown.security || 0;
      acc.stability += v.impactBreakdown.stability || 0;
      acc.performance += v.impactBreakdown.performance || 0;
      acc.maintainability += v.impactBreakdown.maintainability || 0;
      acc.count++;
      return acc;
    }, { security: 0, stability: 0, performance: 0, maintainability: 0, count: 0 });

    return {
      averages: {
        security: Math.round(totals.security / totals.count),
        stability: Math.round(totals.stability / totals.count),
        performance: Math.round(totals.performance / totals.count),
        maintainability: Math.round(totals.maintainability / totals.count)
      },
      dominantImpact: this.findDominantImpact(totals),
      riskProfile: this.assessRiskProfile(totals, violations.length)
    };
  }

  findDominantImpact(totals) {
    const impacts = {
      security: totals.security,
      stability: totals.stability,
      performance: totals.performance,
      maintainability: totals.maintainability
    };

    return Object.entries(impacts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  assessRiskProfile(totals, totalCount) {
    const avgTotal = (totals.security + totals.stability + totals.performance + totals.maintainability) / (totals.count * 4);

    if (avgTotal > 70) return 'HIGH_RISK';
    if (avgTotal > 50) return 'MEDIUM_RISK';
    if (avgTotal > 30) return 'LOW_RISK';
    return 'MINIMAL_RISK';
  }

  generateRecommendations(violations) {
    const recommendations = [];

    const sortedBySeverity = [...violations]
      .filter(v => v.severityScore)
      .sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0))
      .slice(0, 5);

    sortedBySeverity.forEach((v, idx) => {
      recommendations.push({
        priority: idx + 1,
        ruleId: v.ruleId,
        filePath: v.filePath,
        line: v.line,
        severityScore: v.severityScore,
        action: v.recommendation || v.message
      });
    });

    const byCategory = this.groupByCategory(violations);
    Object.entries(byCategory).forEach(([category, violations]) => {
      if (violations.length > 5) {
        recommendations.push({
          type: 'CATEGORY_PATTERN',
          category,
          count: violations.length,
          action: `Consider architectural review of ${category} - ${violations.length} violations detected`
        });
      }
    });

    return recommendations;
  }

  calculateMetrics(violations) {
    return {
      totalFiles: new Set(violations.map(v => v.filePath)).size,
      totalLines: violations.reduce((sum, v) => sum + (v.line || 0), 0),
      averageSeverityScore: this.calculateAverageSeverityScore(violations),
      severityDistribution: this.calculateSeverityDistribution(violations),
      categoryBreakdown: this.calculateCategoryBreakdown(violations),
      filesWithMostViolations: this.findFilesWithMostViolations(violations, 10)
    };
  }

  calculateAverageSeverityScore(violations) {
    const withScores = violations.filter(v => v.severityScore);
    if (withScores.length === 0) return 0;

    const total = withScores.reduce((sum, v) => sum + v.severityScore, 0);
    return Math.round(total / withScores.length);
  }

  calculateSeverityDistribution(violations) {
    const total = violations.length;
    const grouped = this.groupBySeverity(violations);

    return {
      CRITICAL: Math.round(((grouped.CRITICAL?.length || 0) / total) * 100),
      HIGH: Math.round(((grouped.HIGH?.length || 0) / total) * 100),
      MEDIUM: Math.round(((grouped.MEDIUM?.length || 0) / total) * 100),
      LOW: Math.round(((grouped.LOW?.length || 0) / total) * 100)
    };
  }

  calculateCategoryBreakdown(violations) {
    const byCategory = this.groupByCategory(violations);

    return Object.entries(byCategory)
      .map(([category, violations]) => ({
        category,
        count: violations.length,
        percentage: Math.round((violations.length / violations.length) * 100),
        averageScore: this.calculateAverageSeverityScore(violations)
      }))
      .sort((a, b) => b.count - a.count);
  }

  findFilesWithMostViolations(violations, limit = 10) {
    const byFile = this.groupByFile(violations);

    return Object.entries(byFile)
      .map(([file, violations]) => ({
        file,
        count: violations.length,
        averageScore: this.calculateAverageSeverityScore(violations),
        highestSeverity: violations.reduce((max, v) =>
          this.severityRank(v.severity) > this.severityRank(max) ? v.severity : max,
          'LOW'
        )
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  severityRank(severity) {
    const ranks = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return ranks[severity] || 0;
  }

  formatViolation(v) {
    return {
      ruleId: v.ruleId,
      severity: v.severity,
      filePath: v.filePath,
      line: v.line,
      column: v.column,
      message: v.message,
      ...(v.intelligentEvaluation && {
        originalSeverity: v.originalSeverity,
        severityScore: v.severityScore,
        baseScore: v.baseScore,
        impactBreakdown: v.impactBreakdown,
        context: v.context,
        recommendation: v.recommendation
      })
    };
  }

  /**
   * Save report to file
   */
  save(violations, gateResult, outputPath = '.audit_tmp/intelligent-report.json') {
    const report = this.generate(violations, gateResult);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    const textPath = outputPath.replace('.json', '.txt');
    fs.writeFileSync(textPath, this.presenter.formatText(report, gateResult));

    return { jsonPath: outputPath, textPath };
  }
}

module.exports = { ReportGenerator };
