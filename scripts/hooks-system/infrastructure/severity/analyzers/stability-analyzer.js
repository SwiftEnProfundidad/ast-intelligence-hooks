
class StabilityAnalyzer {
  analyze(violation, context) {
    let score = 0;

    score += this.analyzeCrashRisk(violation, context);

    score += this.analyzeDataCorruptionRisk(violation, context);

    score += this.analyzeUndefinedBehavior(violation, context);

    return Math.min(100, score);
  }

  analyzeCrashRisk(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('force_unwrap') || ruleId.includes('non_null_assertion')) {
      if (context.valueCanBeNil) return 50;
      return 30;
    }

    if (ruleId.includes('empty_catch') || ruleId.includes('silenced_error')) {
      if (context.criticalPath) return 45;
      return 25;
    }

    if (ruleId.includes('force_try')) {
      return 40;
    }

    if (ruleId.includes('index') || ruleId.includes('bounds')) {
      return 35;
    }

    if (violation.message.includes('division') && violation.message.includes('zero')) {
      return 35;
    }

    return 0;
  }

  analyzeDataCorruptionRisk(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('race') || ruleId.includes('thread_safe')) {
      if (context.isSharedState) return 30;
      return 15;
    }

    if (ruleId.includes('transaction') && context.isMultiStepOperation) {
      return 25;
    }

    if (ruleId.includes('invariant') || ruleId.includes('lsp')) {
      return 20;
    }

    if (ruleId.includes('direct_mutation') && context.isSharedState) {
      return 25;
    }

    return 0;
  }

  analyzeUndefinedBehavior(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('lsp')) {
      return 20;
    }

    if (ruleId.includes('untyped_catch') || ruleId.includes('any_without_guard')) {
      return 15;
    }

    if (ruleId.includes('undefined')) {
      return 18;
    }

    return 0;
  }
}

module.exports = { StabilityAnalyzer };
