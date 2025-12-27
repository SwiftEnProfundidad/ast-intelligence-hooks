
const path = require('path');
const { SecurityAnalyzer } = require('./analyzers/security-analyzer');
const { PerformanceAnalyzer } = require('./analyzers/performance-analyzer');
const { StabilityAnalyzer } = require('./analyzers/stability-analyzer');
const { MaintainabilityAnalyzer } = require('./analyzers/maintainability-analyzer');
const { ContextBuilder } = require('./context/context-builder');
const RecommendationGenerator = require('./generators/RecommendationGenerator');

/**
 * Main severity evaluator
 * Analyzes violations across 4 dimensions: Security, Performance, Stability, Maintainability
 */
class SeverityEvaluator {
  constructor() {
    this.securityAnalyzer = new SecurityAnalyzer();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.stabilityAnalyzer = new StabilityAnalyzer();
    this.maintainabilityAnalyzer = new MaintainabilityAnalyzer();
    this.contextBuilder = new ContextBuilder();
    this.recommendationGenerator = new RecommendationGenerator();

    this.weights = {
      security: 0.40,
      stability: 0.30,
      performance: 0.20,
      maintainability: 0.10
    };
  }

  /**
   * Evaluate severity for a violation
   * @param {Object} violation - { ruleId, filePath, line, message, ... }
   * @returns {Object} { severity: 'CRITICAL', score: 92, breakdown: {...} }
   */
  evaluate(violation) {
    try {
      const context = this.contextBuilder.build(violation);

      const securityScore = this.securityAnalyzer.analyze(violation, context);
      const performanceScore = this.performanceAnalyzer.analyze(violation, context);
      const stabilityScore = this.stabilityAnalyzer.analyze(violation, context);
      const maintainabilityScore = this.maintainabilityAnalyzer.analyze(violation, context);

      const baseScore = (
        securityScore * this.weights.security +
        stabilityScore * this.weights.stability +
        performanceScore * this.weights.performance +
        maintainabilityScore * this.weights.maintainability
      );

      const finalScore = this.applyContextMultipliers(baseScore, context, violation);

      const severity = this.mapToSeverity(finalScore);

      return {
        severity,
        score: Math.round(finalScore),
        baseScore: Math.round(baseScore),
        breakdown: {
          security: Math.round(securityScore),
          performance: Math.round(performanceScore),
          stability: Math.round(stabilityScore),
          maintainability: Math.round(maintainabilityScore)
        },
        context: {
          isMainThread: context.isMainThread,
          isCriticalPath: context.criticalPath,
          isProduction: context.isProductionCode,
          dependencyCount: context.dependencyCount,
          callFrequency: context.callFrequency
        },
        recommendation: this.recommendationGenerator.generate(violation, severity, context)
      };
    } catch (error) {
      return {
        severity: violation.severity || 'MEDIUM',
        score: 50,
        baseScore: 50,
        breakdown: {},
        context: {},
        recommendation: violation.message,
        evaluationError: error.message
      };
    }
  }

  /**
   * Apply context multipliers to base score
   */
  applyContextMultipliers(baseScore, context, violation) {
    let multiplier = 1.0;

    if (context.isProductionCode) {
      if (context.criticalPath) multiplier *= 1.5;
      if (context.handlesPayments) multiplier *= 2.0;
      if (context.handlesPII) multiplier *= 1.4;
      if (context.userFacing && !context.hasErrorBoundary) multiplier *= 1.3;
      if (context.isPublicAPI) multiplier *= 1.2;
    }

    if (context.isMainThread && baseScore > 30) {
      multiplier *= 2.0;
    }

    if (context.dependencyCount > 10) {
      multiplier *= (1 + context.dependencyCount / 50);
    }

    if (context.callFrequency > 1000) {
      multiplier *= 1.2;
    }

    if (violation.ruleId.includes('solid.') && context.layer === 'DOMAIN') {
      multiplier *= 1.4;
    }

    if (violation.ruleId.includes('clean_arch.') && violation.ruleId.includes('domain')) {
      multiplier *= 1.6;
    }

    if (context.isTestCode) {
      multiplier *= 0.3;
    }

    if (context.hasErrorBoundary && context.hasFallback) {
      multiplier *= 0.7;
    }

    if (context.hasRetryLogic) {
      multiplier *= 0.9;
    }

    return Math.min(100, baseScore * multiplier);
  }

  /**
   * Map final score to severity level
   */
  mapToSeverity(score) {
    if (score >= 85) return 'CRITICAL';
    if (score >= 65) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }
}

/**
 * Batch evaluate all violations
 */
function evaluateViolations(violations) {
  const evaluator = new SeverityEvaluator();

  return violations.map(violation => {
    const evaluation = evaluator.evaluate(violation);

    return {
      ...violation,
      originalSeverity: violation.severity,
      severity: evaluation.severity,
      severityScore: evaluation.score,
      baseScore: evaluation.baseScore,
      impactBreakdown: evaluation.breakdown,
      context: evaluation.context,
      recommendation: evaluation.recommendation
    };
  });
}

module.exports = {
  SeverityEvaluator,
  evaluateViolations
};
