
const path = require('path');
const { SecurityAnalyzer } = require('./analyzers/security-analyzer');
const { PerformanceAnalyzer } = require('./analyzers/performance-analyzer');
const { StabilityAnalyzer } = require('./analyzers/stability-analyzer');
const { MaintainabilityAnalyzer } = require('./analyzers/maintainability-analyzer');
const { ContextBuilder } = require('./context/context-builder');
const RecommendationGenerator = require('./generators/RecommendationGenerator');
const ContextMultiplier = require('./scorers/ContextMultiplier');
const SeverityMapper = require('./mappers/SeverityMapper');

function applySeverityFloor(originalSeverity, evaluatedSeverity) {
  const order = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
  };

  const original = order[String(originalSeverity || '').toUpperCase()] || order.MEDIUM;
  const evaluated = order[String(evaluatedSeverity || '').toUpperCase()] || original;

  return evaluated >= original ? String(evaluatedSeverity || originalSeverity || 'MEDIUM').toUpperCase() : String(originalSeverity).toUpperCase();
}

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
    this.contextMultiplier = new ContextMultiplier();

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

      const finalScore = this.contextMultiplier.calculate(baseScore, context, violation);

      const severity = SeverityMapper.mapToSeverity(finalScore);

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
}

/**
 * Batch evaluate all violations
 */
function evaluateViolations(violations) {
  const evaluator = new SeverityEvaluator();

  return violations.map(violation => {
    const evaluation = evaluator.evaluate(violation);

    const baseSeverity = violation.severity;
    const finalSeverity = applySeverityFloor(baseSeverity, evaluation.severity);

    return {
      ...violation,
      originalSeverity: violation.severity,
      severity: finalSeverity,
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
