// ===== MAINTAINABILITY IMPACT ANALYZER =====
// Evaluates code quality impact of violations (0-100)

class MaintainabilityAnalyzer {
  analyze(violation, context) {
    let score = 0;

    // 1. COUPLING (0-30 points)
    score += this.analyzeCoupling(violation, context);

    // 2. COMPLEXITY (0-30 points)
    score += this.analyzeComplexity(violation, context);

    // 3. CODE DUPLICATION (0-20 points)
    score += this.analyzeDuplication(violation, context);

    // 4. TEST COVERAGE (0-20 points)
    score += this.analyzeTestability(violation, context);

    return Math.min(100, score);
  }

  analyzeCoupling(violation, context) {
    const ruleId = violation.ruleId || '';

    // DIP violations (high coupling to concrete)
    if (ruleId.includes('dip')) {
      if (context.dependencyCount > 10) return 30;  // Many modules affected
      return 20;
    }

    // ISP violations (forced to depend on unused methods)
    if (ruleId.includes('isp')) {
      return 15;
    }

    // Prop drilling (tight coupling)
    if (ruleId.includes('prop_drilling')) {
      const depth = violation.metrics?.propDrillingDepth || 0;
      if (depth > 5) return 25;
      return 10;
    }

    return 0;
  }

  analyzeComplexity(violation, context) {
    const ruleId = violation.ruleId || '';

    // Cyclomatic complexity
    const complexity = violation.metrics?.cyclomaticComplexity || 0;
    if (complexity > 20) return 30;
    if (complexity > 15) return 20;
    if (complexity > 10) return 10;

    // God classes/components
    if (ruleId.includes('god') || ruleId.includes('massive')) {
      const size = violation.metrics?.methodCount || 0;
      if (size > 30) return 30;
      if (size > 20) return 20;
      return 15;
    }

    // Nested conditionals (pyramid of doom)
    if (ruleId.includes('nested') || ruleId.includes('pyramid')) {
      return 25;
    }

    // Callback hell
    if (ruleId.includes('callback_hell')) {
      return 20;
    }

    return 0;
  }

  analyzeDuplication(violation, context) {
    const ruleId = violation.ruleId || '';

    // Code duplication detected
    if (ruleId.includes('duplication') || ruleId.includes('duplicate')) {
      const duplicateCount = violation.metrics?.duplicateCount || 1;
      return Math.min(20, duplicateCount * 5);
    }

    // OCP violation (modification instead of extension)
    if (ruleId.includes('ocp')) {
      // Will need to modify in multiple places
      return 15;
    }

    return 0;
  }

  analyzeTestability(violation, context) {
    const ruleId = violation.ruleId || '';

    // Missing tests for critical code
    if (ruleId.includes('missing_tests') || ruleId.includes('coverage')) {
      if (context.criticalPath) return 20;
      if (context.hasBusinessLogic) return 15;
      return 5;
    }

    // Hard to test (DIP, tight coupling)
    if (ruleId.includes('dip') || ruleId.includes('concrete_dependency')) {
      return 15;  // Can't mock dependencies
    }

    // Mocks in production
    if (ruleId.includes('mock_in_production')) {
      return 18;  // Tests will fail
    }

    return 0;
  }
}

module.exports = { MaintainabilityAnalyzer };
