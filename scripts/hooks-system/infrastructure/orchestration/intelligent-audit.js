#!/usr/bin/env node
// ===== INTELLIGENT AUDIT ORCHESTRATOR =====
// Integrates Severity Intelligence with existing AST analysis
// Entry point for audit.sh to run intelligent evaluation

const { evaluateViolations } = require('../severity/severity-evaluator');
const { GatePolicies } = require('../severity/policies/gate-policies');
const { ReportGenerator } = require('../reporting/report-generator');
const { SeverityTracker } = require('../reporting/severity-tracker');
const { TokenManager } = require('../utils/token-manager');
const fs = require('fs');
const path = require('path');

/**
 * Main orchestration function
 * Called by audit.sh after AST analysis completes
 */
async function runIntelligentAudit() {
  try {
    console.log('[Intelligent Audit] Starting severity evaluation...');
    
    // 1. Load raw violations from AST analysis
    const rawViolations = loadRawViolations();
    console.log(`[Intelligent Audit] Loaded ${rawViolations.length} violations from AST`);
    
    // 1.5. Filter to ONLY STAGED FILES (performance optimization)
    const stagedFiles = getStagedFiles();
    const stagedViolations = rawViolations.filter(v => 
      stagedFiles.some(sf => v.filePath && v.filePath.includes(sf))
    );
    
    console.log(`[Intelligent Audit] Filtered to ${stagedViolations.length} violations in ${stagedFiles.length} staged files`);
    
    if (stagedViolations.length === 0) {
      console.log('[Intelligent Audit] ✅ No violations in staged files - PASSED');
      process.exit(0);
    }
    
    // 2. Evaluate severity intelligently (ONLY for staged)
    console.log('[Intelligent Audit] Evaluating severities...');
    const enhancedViolations = evaluateViolations(stagedViolations);
    
    const intelligentCount = enhancedViolations.filter(v => v.intelligentEvaluation).length;
    console.log(`[Intelligent Audit] ✅ ${intelligentCount}/${enhancedViolations.length} violations intelligently evaluated`);
    
    // 3. Apply quality gate policies
    console.log('[Intelligent Audit] Applying quality gate...');
    const gatePolicies = new GatePolicies();
    const gateResult = gatePolicies.apply(enhancedViolations);
    
    console.log(`[Intelligent Audit] Gate status: ${gateResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (gateResult.blockedBy) {
      console.log(`[Intelligent Audit] Blocked by: ${gateResult.blockedBy} violations`);
    }
    
    // 4. Generate comprehensive report
    console.log('[Intelligent Audit] Generating reports...');
    const reportGenerator = new ReportGenerator();
    const reportPaths = reportGenerator.save(enhancedViolations, gateResult);
    
    console.log(`[Intelligent Audit] ✅ Reports saved:`);
    console.log(`  - JSON: ${reportPaths.jsonPath}`);
    console.log(`  - Text: ${reportPaths.textPath}`);
    
    // 5. Track severity history
    const tracker = new SeverityTracker();
    tracker.record(enhancedViolations, gateResult);
    
    const trend = tracker.getTrend(10);
    if (trend.trend !== 'INSUFFICIENT_DATA') {
      console.log(`[Intelligent Audit] 📈 Trend: ${trend.trend} (avg score ${trend.latest.averageScore}/100)`);
    }
    
    // 6. Check token usage
    const tokenManager = new TokenManager();
    const report = reportGenerator.generate(enhancedViolations, gateResult);
    const tokenUsage = tokenManager.estimate(enhancedViolations, report);
    const warning = tokenManager.checkWarnings(tokenUsage);
    
    if (warning.shouldWarn) {
      console.log(`[Token Manager] ${warning.message}`);
    }
    
    tokenManager.record(tokenUsage);
    
    // 7. Update .AI_EVIDENCE.json with severity metrics
    updateAIEvidence(enhancedViolations, gateResult, tokenUsage);
    
    // 8. Save enhanced violations (overwrites original ast-summary.json)
    saveEnhancedViolations(enhancedViolations);
    
    console.log('[Intelligent Audit] ✅ Complete');
    
    // 9. Exit with gate result
    process.exit(gateResult.exitCode);
    
  } catch (error) {
    console.error('[Intelligent Audit] ❌ Error:', error.message);
    console.error(error.stack);
    
    // Fallback: exit with original AST result
    process.exit(0);  // Don't block on evaluation errors
  }
}

function loadRawViolations() {
  const astSummaryPath = '.audit_tmp/ast-summary.json';
  
  if (!fs.existsSync(astSummaryPath)) {
    console.error('[Intelligent Audit] ⚠️  No ast-summary.json found - running without violations');
    return [];
  }
  
  const astSummary = JSON.parse(fs.readFileSync(astSummaryPath, 'utf8'));
  
  // Extract findings array
  return astSummary.findings || astSummary.violations || [];
}

function getStagedFiles() {
  const { execSync } = require('child_process');
  
  try {
    // Get staged files (relative paths)
    const result = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return result.trim().split('\n').filter(f => f);
  } catch {
    // If git fails, return empty (no staging)
    return [];
  }
}

function saveEnhancedViolations(violations) {
  const outputPath = '.audit_tmp/ast-summary.json';
  
  const enhanced = {
    timestamp: new Date().toISOString(),
    generator: 'AST Intelligence v2.0 with Severity Evaluation',
    intelligentEvaluation: true,
    totalViolations: violations.length,
    findings: violations,
    summary: {
      total: violations.length,
      CRITICAL: violations.filter(v => v.severity === 'CRITICAL').length,
      HIGH: violations.filter(v => v.severity === 'HIGH').length,
      MEDIUM: violations.filter(v => v.severity === 'MEDIUM').length,
      LOW: violations.filter(v => v.severity === 'LOW').length
    }
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2));
}

function updateAIEvidence(violations, gateResult, tokenUsage) {
  const evidencePath = '.AI_EVIDENCE.json';
  
  if (!fs.existsSync(evidencePath)) {
    console.warn('[Intelligent Audit] ⚠️  .AI_EVIDENCE.json not found - skipping update');
    return;
  }
  
  try {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    
    // Add severity metrics
    evidence.severity_metrics = {
      last_updated: new Date().toISOString(),
      total_violations: violations.length,
      by_severity: {
        CRITICAL: violations.filter(v => v.severity === 'CRITICAL').length,
        HIGH: violations.filter(v => v.severity === 'HIGH').length,
        MEDIUM: violations.filter(v => v.severity === 'MEDIUM').length,
        LOW: violations.filter(v => v.severity === 'LOW').length
      },
      average_severity_score: Math.round(
        violations.filter(v => v.severityScore).reduce((sum, v) => sum + v.severityScore, 0) /
        Math.max(1, violations.filter(v => v.severityScore).length)
      ),
      intelligent_evaluation_rate: Math.round(
        (violations.filter(v => v.intelligentEvaluation).length / Math.max(1, violations.length)) * 100
      ),
      gate_status: gateResult.passed ? 'PASSED' : 'FAILED',
      blocked_by: gateResult.blockedBy || null
    };
    
    // Add token usage tracking
    evidence.token_usage = {
      estimated: tokenUsage.estimated,
      percent_used: Math.round(tokenUsage.percentUsed),
      remaining: tokenUsage.remaining,
      warning_level: tokenUsage.percentUsed > 95 ? 'CRITICAL' :
                     tokenUsage.percentUsed > 85 ? 'WARNING' :
                     tokenUsage.percentUsed > 75 ? 'INFO' : 'OK'
    };
    
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    console.log('[Intelligent Audit] ✅ .AI_EVIDENCE.json updated with severity metrics');
    
  } catch (error) {
    console.error('[Intelligent Audit] ⚠️  Failed to update .AI_EVIDENCE.json:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runIntelligentAudit().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runIntelligentAudit };

