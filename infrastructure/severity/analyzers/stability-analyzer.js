// ===== STABILITY IMPACT ANALYZER =====
// Evaluates crash/bug risk of violations (0-100)

class StabilityAnalyzer {
  analyze(violation, context) {
    let score = 0;
    
    // 1. CRASH RISK (0-50 points)
    score += this.analyzeCrashRisk(violation, context);
    
    // 2. DATA CORRUPTION (0-30 points)
    score += this.analyzeDataCorruptionRisk(violation, context);
    
    // 3. UNDEFINED BEHAVIOR (0-20 points)
    score += this.analyzeUndefinedBehavior(violation, context);
    
    return Math.min(100, score);
  }
  
  analyzeCrashRisk(violation, context) {
    const ruleId = violation.ruleId || '';
    
    // Force unwrap/null pointer
    if (ruleId.includes('force_unwrap') || ruleId.includes('non_null_assertion')) {
      if (context.valueCanBeNil) return 50;  // Guaranteed crash
      return 30;  // Potential crash
    }
    
    // Empty catch (silences errors)
    if (ruleId.includes('empty_catch') || ruleId.includes('silenced_error')) {
      if (context.criticalPath) return 45;
      return 25;
    }
    
    // Force try
    if (ruleId.includes('force_try')) {
      return 40;
    }
    
    // Index out of bounds
    if (ruleId.includes('index') || ruleId.includes('bounds')) {
      return 35;
    }
    
    // Division by zero
    if (violation.message.includes('division') && violation.message.includes('zero')) {
      return 35;
    }
    
    return 0;
  }
  
  analyzeDataCorruptionRisk(violation, context) {
    const ruleId = violation.ruleId || '';
    
    // Race conditions
    if (ruleId.includes('race') || ruleId.includes('thread_safe')) {
      if (context.isSharedState) return 30;
      return 15;
    }
    
    // Missing transaction
    if (ruleId.includes('transaction') && context.isMultiStepOperation) {
      return 25;
    }
    
    // Invariant violation
    if (ruleId.includes('invariant') || ruleId.includes('lsp')) {
      return 20;
    }
    
    // State mutation without synchronization
    if (ruleId.includes('direct_mutation') && context.isSharedState) {
      return 25;
    }
    
    return 0;
  }
  
  analyzeUndefinedBehavior(violation, context) {
    const ruleId = violation.ruleId || '';
    
    // LSP violation (substitutability broken)
    if (ruleId.includes('lsp')) {
      return 20;
    }
    
    // Untyped error handling
    if (ruleId.includes('untyped_catch') || ruleId.includes('any_without_guard')) {
      return 15;
    }
    
    // Platform-specific undefined behavior
    if (ruleId.includes('undefined')) {
      return 18;
    }
    
    return 0;
  }
}

module.exports = { StabilityAnalyzer };

