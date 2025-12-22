
class MaintainabilityAnalyzer {
  analyze(violation, context) {
    let score = 0;

    score += this.analyzeCoupling(violation, context);

    score += this.analyzeComplexity(violation, context);

    score += this.analyzeDuplication(violation, context);

    score += this.analyzeTestability(violation, context);

    return Math.min(100, score);
  }

  analyzeCoupling(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('dip')) {
      if (context.dependencyCount > 10) return 30;
      return 20;
    }

    if (ruleId.includes('isp')) {
      return 15;
    }

    if (ruleId.includes('prop_drilling')) {
      const depth = violation.metrics?.propDrillingDepth || 0;
      if (depth > 5) return 25;
      return 10;
    }

    return 0;
  }

  analyzeComplexity(violation, context) {
    const ruleId = violation.ruleId || '';

    const complexity = violation.metrics?.cyclomaticComplexity || 0;
    if (complexity > 20) return 30;
    if (complexity > 15) return 20;
    if (complexity > 10) return 10;

    if (ruleId.includes('god') || ruleId.includes('massive')) {
      const size = violation.metrics?.methodCount || 0;
      if (size > 30) return 30;
      if (size > 20) return 20;
      return 15;
    }

    if (ruleId.includes('nested') || ruleId.includes('pyramid')) {
      return 25;
    }

    if (ruleId.includes('callback_hell')) {
      return 20;
    }

    return 0;
  }

  analyzeDuplication(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('duplication') || ruleId.includes('duplicate')) {
      const duplicateCount = violation.metrics?.duplicateCount || 1;
      return Math.min(20, duplicateCount * 5);
    }

    if (ruleId.includes('ocp')) {
      return 15;
    }

    return 0;
  }

  analyzeTestability(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('missing_tests') || ruleId.includes('coverage')) {
      if (context.criticalPath) return 20;
      if (context.hasBusinessLogic) return 15;
      return 5;
    }

    if (ruleId.includes('dip') || ruleId.includes('concrete_dependency')) {
      return 15;
    }

    if (ruleId.includes('mock_in_production')) {
      return 18;
    }

    return 0;
  }
}

module.exports = { MaintainabilityAnalyzer };
