// ===== PERFORMANCE IMPACT ANALYZER =====
// Evaluates performance impact of violations (0-100)

class PerformanceAnalyzer {
  analyze(violation, context) {
    let score = 0;

    // 1. UI THREAD BLOCKING (0-40 points)
    score += this.analyzeUIThreadBlocking(violation, context);

    // 2. MEMORY LEAKS (0-30 points)
    score += this.analyzeMemoryImpact(violation, context);

    // 3. ALGORITHMIC INEFFICIENCY (0-20 points)
    score += this.analyzeAlgorithmicComplexity(violation, context);

    // 4. MISSING OPTIMIZATION (0-10 points)
    score += this.analyzeMissingOptimizations(violation, context);

    return Math.min(100, score);
  }

  analyzeUIThreadBlocking(violation, context) {
    const ruleId = violation.ruleId || '';

    // Main thread blocking
    if (ruleId.includes('ui_on_background') || ruleId.includes('blocking_on_main')) {
      if (context.isMainThread) {
        const estimatedDuration = this.estimateBlockingDuration(violation);
        if (estimatedDuration > 100) return 40;   // >100ms = ANR
        if (estimatedDuration > 50) return 30;
        if (estimatedDuration > 16) return 20;    // >16ms = frame drop
      }
    }

    // Synchronous network/IO on main
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

    return 10;  // Default estimate
  }

  analyzeMemoryImpact(violation, context) {
    const ruleId = violation.ruleId || '';

    // Retain cycles
    if (ruleId.includes('retain_cycle') || ruleId.includes('closure') && ruleId.includes('weak')) {
      if (context.callFrequency > 100) return 30;  // Frequent = many leaks
      return 20;
    }

    // Missing cancellable storage
    if (ruleId.includes('cancellable') || ruleId.includes('disposable')) {
      return 25;
    }

    // Context leaks
    if (ruleId.includes('context_leak')) {
      return 25;
    }

    // Large object allocations without pooling
    if (ruleId.includes('allocation') && context.inHotPath) {
      return 15;
    }

    return 0;
  }

  analyzeAlgorithmicComplexity(violation, context) {
    const ruleId = violation.ruleId || '';

    // N+1 query problem
    if (ruleId.includes('n_plus_one') || ruleId.includes('eager_loading')) {
      return 20;
    }

    // Nested loops (O(n^2) or worse)
    if (violation.metrics && violation.metrics.nestedLoops > 2) {
      return 18;
    }

    // Missing pagination
    if (ruleId.includes('pagination') && context.dataSize > 1000) {
      return 15;
    }

    return 0;
  }

  analyzeMissingOptimizations(violation, context) {
    const ruleId = violation.ruleId || '';

    // Missing memoization
    if (ruleId.includes('memo') || ruleId.includes('useMemo')) {
      if (context.callFrequency > 100) return 10;
      return 3;
    }

    // Missing virtualization
    if (ruleId.includes('virtualization') || ruleId.includes('LazyColumn')) {
      if (context.listSize > 1000) return 8;
      return 2;
    }

    // Missing code splitting
    if (ruleId.includes('code_splitting')) {
      return 4;  // Usually low impact
    }

    return 0;
  }
}

module.exports = { PerformanceAnalyzer };
