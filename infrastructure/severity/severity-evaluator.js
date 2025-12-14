
const path = require('path');
const { SecurityAnalyzer } = require('./analyzers/security-analyzer');
const { PerformanceAnalyzer } = require('./analyzers/performance-analyzer');
const { StabilityAnalyzer } = require('./analyzers/stability-analyzer');
const { MaintainabilityAnalyzer } = require('./analyzers/maintainability-analyzer');
const { ContextBuilder } = require('./context/context-builder');

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
        recommendation: this.generateRecommendation(violation, severity, context)
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

  /**
   * Generate actionable recommendation
   */
  generateRecommendation(violation, severity, context) {
    const impact = this.explainImpact(violation, context);
    const fix = this.suggestFix(violation, context);

    const icons = {
      CRITICAL: '🚨',
      HIGH: '⚠️',
      MEDIUM: '⚡',
      LOW: 'ℹ️'
    };

    const actions = {
      CRITICAL: 'Fix IMMEDIATELY (blocks commit)',
      HIGH: 'Fix in this PR (blocks merge to main)',
      MEDIUM: 'Create tech debt issue for next sprint',
      LOW: 'Consider fixing when touching this code'
    };

    return `${icons[severity]} ${severity}: ${violation.message}

Impact: ${impact}
Action Required: ${actions[severity]}

Suggested Fix:
${fix}`;
  }

  explainImpact(violation, context) {
    const impacts = [];

    if (context.criticalPath) {
      impacts.push('Affects critical user flow (checkout, payment, signup)');
    }

    if (context.dependencyCount > 10) {
      impacts.push(`${context.dependencyCount} modules depend on this (ripple effect)`);
    }

    if (context.callFrequency > 1000) {
      impacts.push(`Executed ${context.callFrequency} times/day (high frequency)`);
    }

    if (context.isMainThread) {
      impacts.push('Runs on UI thread (can freeze app)');
    }

    if (context.handlesPayments) {
      impacts.push('🔴 PAYMENT PROCESSING - highest priority');
    }

    if (context.handlesPII) {
      impacts.push('Handles personal data (GDPR compliance)');
    }

    return impacts.length > 0 ? impacts.join('\n- ') : 'Standard code quality issue';
  }

  suggestFix(violation, context) {
    const fixes = {
      'solid.srp': this.generateSRPFix(violation, context),
      'solid.ocp': this.generateOCPFix(violation, context),
      'solid.lsp': this.generateLSPFix(violation, context),
      'solid.isp': this.generateISPFix(violation, context),
      'solid.dip': this.generateDIPFix(violation, context),
      'clean_arch': this.generateCleanArchFix(violation, context),
      'cqrs': this.generateCQRSFix(violation, context)
    };

    for (const [prefix, generator] of Object.entries(fixes)) {
      if (violation.ruleId.includes(prefix)) {
        return generator;
      }
    }

    return violation.message;
  }

  generateSRPFix(violation, context) {
    if (violation.metrics && violation.metrics.responsibilities) {
      const responsibilities = violation.metrics.responsibilities;
      return `Split into ${responsibilities.length} classes:
${responsibilities.map((r, i) => `${i + 1}. ${r}Class - handles ${r.toLowerCase()} only`).join('\n')}

Example:
❌ class ${violation.className} {
}

✅
    }
    return 'Extract responsibilities into separate classes (SRP)';
  }

  generateDIPFix(violation, context) {
    if (violation.concreteDependency) {
      const concrete = violation.concreteDependency;
      const protocol = concrete.replace(/(Service|Repository|Client|Manager)$/, '$1Protocol');

      return `Create protocol abstraction:

1. Define protocol:
   protocol ${protocol} {
   }

2. Make concrete conform:
   class ${concrete}: ${protocol} {
   }

3. Inject protocol:
   init(repository: ${protocol}) {
       self.repository = repository
   }`;
    }
    return 'Inject protocol abstraction instead of concrete type (DIP)';
  }

  generateCQRSFix(violation, context) {
    return `Split into Command + Query:

❌ Current:
func updateAndReturn(_ item: Item) -> Item {
    self.items.append(item)
    return item
}

✅ Refactor:
func updateItem(_ item: Item) {
    self.items.append(item)
}

func getItem(id: UUID) -> Item? {
    return items.first { $0.id == id }
}`;
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
