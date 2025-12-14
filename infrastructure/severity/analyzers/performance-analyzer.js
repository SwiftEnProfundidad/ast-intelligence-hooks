
class PerformanceAnalyzer {
  analyze(violation, context) {
    let score = 0;

    score += this.analyzeUIThreadBlocking(violation, context);

    score += this.analyzeMemoryImpact(violation, context);

    score += this.analyzeAlgorithmicComplexity(violation, context);

    score += this.analyzeMissingOptimizations(violation, context);

    return Math.min(100, score);
  }

  analyzeUIThreadBlocking(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('ui_on_background') || ruleId.includes('blocking_on_main')) {
      if (context.isMainThread) {
        const estimatedDuration = this.estimateBlockingDuration(violation);
        if (estimatedDuration > 100) return 40;
        if (estimatedDuration > 50) return 30;
        if (estimatedDuration > 16) return 20;
      }
    }

    if (ruleId.includes('sync') && (ruleId.includes('network') || ruleId.includes('io'))) {
      return 35;
    }

    return 0;
  }

  estimateBlockingDuration(violation) {
    const message = violation.message || '';

    if (message.includes('network') || message.includes('URLSession')) return 1000;
    if (message.includes('database') || message.includes('query')) return 50;
    if (message.includes('file') || message.includes('disk')) return 30;
    if (message.includes('computation') || message.includes('algorithm')) return 20;

    return 10;
  }

  analyzeMemoryImpact(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('retain_cycle') || ruleId.includes('closure') && ruleId.includes('weak')) {
      if (context.callFrequency > 100) return 30;
      return 20;
    }

    if (ruleId.includes('cancellable') || ruleId.includes('disposable')) {
      return 25;
    }

    if (ruleId.includes('context_leak')) {
      return 25;
    }

    if (ruleId.includes('allocation') && context.inHotPath) {
      return 15;
    }

    return 0;
  }

  analyzeAlgorithmicComplexity(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('n_plus_one') || ruleId.includes('eager_loading')) {
      return 20;
    }

    if (violation.metrics && violation.metrics.nestedLoops > 2) {
      return 18;
    }

    if (ruleId.includes('pagination') && context.dataSize > 1000) {
      return 15;
    }

    return 0;
  }

  analyzeMissingOptimizations(violation, context) {
    const ruleId = violation.ruleId || '';

    if (ruleId.includes('memo') || ruleId.includes('useMemo')) {
      if (context.callFrequency > 100) return 10;
      return 3;
    }

    if (ruleId.includes('virtualization') || ruleId.includes('LazyColumn')) {
      if (context.listSize > 1000) return 8;
      return 2;
    }

    if (ruleId.includes('code_splitting')) {
      return 4;
    }

    return 0;
  }
}

module.exports = { PerformanceAnalyzer };
