// ===== SECURITY IMPACT ANALYZER =====
// Evaluates security impact of violations (0-100)

class SecurityAnalyzer {
  /**
   * Analyze security impact of violation
   * @param {Object} violation - AST violation
   * @param {Object} context - Execution context
   * @returns {number} Score 0-100
   */
  analyze(violation, context) {
    let score = 0;
    
    // 1. DATA EXPOSURE RISK (0-40 points)
    score += this.analyzeDataExposure(violation, context);
    
    // 2. INJECTION VULNERABILITY (0-30 points)
    score += this.analyzeInjectionRisk(violation, context);
    
    // 3. AUTHENTICATION/AUTHORIZATION (0-20 points)
    score += this.analyzeAuthRisk(violation, context);
    
    // 4. NETWORK SECURITY (0-10 points)
    score += this.analyzeNetworkRisk(violation, context);
    
    return Math.min(100, score);
  }
  
  analyzeDataExposure(violation, context) {
    const ruleId = violation.ruleId || '';
    const message = violation.message || '';
    
    // Hardcoded secrets (CRITICAL)
    if (ruleId.includes('hardcoded_secret') || ruleId.includes('hardcoded_api_key')) {
      if (context.isProductionCode) return 40;
      return 25;  // Less critical in test code
    }
    
    // Sensitive data in insecure storage
    if (ruleId.includes('userdefaults_sensitive') || ruleId.includes('shared_prefs_sensitive')) {
      return 35;
    }
    
    // Data logging (PII exposure)
    if (ruleId.includes('console_log') || ruleId.includes('production_logs')) {
      if (context.handlesPII || context.handlesCredentials) return 30;
      return 5;  // General logging less critical
    }
    
    // Missing data sanitization
    if (ruleId.includes('dangerouslySetInnerHTML') || ruleId.includes('xss')) {
      return 30;
    }
    
    return 0;
  }
  
  analyzeInjectionRisk(violation, context) {
    const ruleId = violation.ruleId || '';
    
    // SQL Injection
    if (ruleId.includes('sql') && ruleId.includes('raw')) {
      return 30;
    }
    
    // XSS
    if (ruleId.includes('xss') || ruleId.includes('innerHTML')) {
      if (context.userGeneratedContent) return 25;
      return 15;
    }
    
    // Code Injection
    if (ruleId.includes('eval') || ruleId.includes('exec')) {
      return 25;
    }
    
    return 0;
  }
  
  analyzeAuthRisk(violation, context) {
    const ruleId = violation.ruleId || '';
    
    // Missing authentication
    if (ruleId.includes('missing_auth') || ruleId.includes('unprotected_route')) {
      if (context.handlesPayments) return 20;
      if (context.handlesPII) return 18;
      return 15;
    }
    
    // Weak authentication
    if (ruleId.includes('weak') && ruleId.includes('auth')) {
      return 15;
    }
    
    return 0;
  }
  
  analyzeNetworkRisk(violation, context) {
    const ruleId = violation.ruleId || '';
    
    // HTTP instead of HTTPS
    if (ruleId.includes('http_url') && !ruleId.includes('https')) {
      if (context.handlesCredentials || context.handlesPayments) return 10;
      return 5;
    }
    
    // Missing SSL pinning
    if (ruleId.includes('ssl_pinning')) {
      if (context.isProductionAPI) return 8;
      return 3;
    }
    
    // Missing CSP headers
    if (ruleId.includes('missing_csp')) {
      return 6;
    }
    
    return 0;
  }
}

module.exports = { SecurityAnalyzer };

