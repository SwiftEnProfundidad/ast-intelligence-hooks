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
    process.stdout.write('[Intelligent Audit] Starting severity evaluation...\n');

    // 1. Load raw violations from AST analysis
    const rawViolations = loadRawViolations();
    process.stdout.write(`[Intelligent Audit] Loaded ${rawViolations.length} violations from AST\n`);

    // 1.5. Filter to ONLY STAGED FILES (performance optimization)
    const stagedFiles = getStagedFiles();
    const stagedViolations = rawViolations.filter(v =>
      stagedFiles.some(sf => v.filePath && v.filePath.includes(sf))
    );

    process.stdout.write(`[Intelligent Audit] Filtered to ${stagedViolations.length} violations in ${stagedFiles.length} staged files\n`);

    // Use staged violations for gate check, but ALL violations for evidence update
    const violationsForGate = stagedViolations;
    const violationsForEvidence = rawViolations;

    if (violationsForGate.length === 0) {
      process.stdout.write('[Intelligent Audit] ✅ No violations in staged files - PASSED\n');
      // Still update .AI_EVIDENCE.json with repo-wide metrics
      const enhancedAll = evaluateViolations(violationsForEvidence.slice(0, 100));
      const gateResult = { passed: true, exitCode: 0, blockedBy: null };
      const tokenManager = new TokenManager();
      const tokenUsage = tokenManager.estimate(enhancedAll, {});
      updateAIEvidence(enhancedAll, gateResult, tokenUsage);
      process.exit(0);
    }

    // 2. Evaluate severity intelligently (ONLY for staged)
    process.stdout.write('[Intelligent Audit] Evaluating severities...\n');
    const enhancedViolations = evaluateViolations(violationsForGate);

    const intelligentCount = enhancedViolations.filter(v => v.intelligentEvaluation).length;
    process.stdout.write(`[Intelligent Audit] ✅ ${intelligentCount}/${enhancedViolations.length} violations intelligently evaluated\n`);

    // 3. Apply quality gate policies
    process.stdout.write('[Intelligent Audit] Applying quality gate...\n');
    const gatePolicies = new GatePolicies();
    const gateResult = gatePolicies.apply(enhancedViolations);

    process.stdout.write(`[Intelligent Audit] Gate status: ${gateResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
    if (gateResult.blockedBy) {
      process.stdout.write(`[Intelligent Audit] Blocked by: ${gateResult.blockedBy} violations\n`);
    }

    // 4. Generate comprehensive report
    process.stdout.write('[Intelligent Audit] Generating reports...\n');
    const reportGenerator = new ReportGenerator();
    const reportPaths = reportGenerator.save(enhancedViolations, gateResult);

    process.stdout.write(`[Intelligent Audit] ✅ Reports saved:\n`);
    process.stdout.write(`  - JSON: ${reportPaths.jsonPath}\n`);
    process.stdout.write(`  - Text: ${reportPaths.textPath}\n`);

    // 5. Track severity history
    const tracker = new SeverityTracker();
    tracker.record(enhancedViolations, gateResult);

    const trend = tracker.getTrend(10);
    if (trend.trend !== 'INSUFFICIENT_DATA') {
      process.stdout.write(`[Intelligent Audit] 📈 Trend: ${trend.trend} (avg score ${trend.latest.averageScore}/100)\n`);
    }

    // 6. Check token usage
    const tokenManager = new TokenManager();
    const report = reportGenerator.generate(enhancedViolations, gateResult);
    const tokenUsage = tokenManager.estimate(enhancedViolations, report);
    const warning = tokenManager.checkWarnings(tokenUsage);

    if (warning.shouldWarn) {
      process.stdout.write(`[Token Manager] ${warning.message}\n`);
    }

    tokenManager.record(tokenUsage);

    // 7. Update .AI_EVIDENCE.json with severity metrics
    updateAIEvidence(enhancedViolations, gateResult, tokenUsage);

    // 8. Save enhanced violations (overwrites original ast-summary.json)
    saveEnhancedViolations(enhancedViolations);

    process.stdout.write('[Intelligent Audit] ✅ Complete\n');

    // 9. Exit with gate result
    process.exit(gateResult.exitCode);

  } catch (auditExecutionError) {
    if (!(auditExecutionError instanceof Error)) {
      throw new Error('Audit execution failed with non-Error value');
    }
    process.stderr.write('[Intelligent Audit] ❌ Fatal error during audit execution\n');
    throw auditExecutionError;
  }
}

function loadRawViolations() {
  const astSummaryPath = '.audit_tmp/ast-summary.json';

  if (!fs.existsSync(astSummaryPath)) {
    process.stderr.write('[Intelligent Audit] ⚠️  No ast-summary.json found - running without violations\n');
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
    process.stderr.write('[Intelligent Audit] ⚠️  .AI_EVIDENCE.json not found - skipping update\n');
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

    // Add AI Gate section
    const { execSync } = require('child_process');
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const isProtected = ['main', 'master', 'develop'].includes(currentBranch);
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
    const highViolations = violations.filter(v => v.severity === 'HIGH');
    const blockingViolations = [...criticalViolations, ...highViolations].slice(0, 50);

    evidence.ai_gate = {
      status: gateResult.passed ? 'ALLOWED' : 'BLOCKED',
      last_check: new Date().toISOString(),
      violations: blockingViolations.map(v => ({
        file: v.file || 'unknown',
        line: v.line || null,
        severity: v.severity,
        rule: v.rule,
        message: v.message || v.description || '',
        category: v.category || 'unknown',
        intelligent_evaluation: v.intelligentEvaluation || false,
        severity_score: v.severityScore || 0
      })),
      instruction: '🚨 AI MUST call mcp6_ai_gate_check BEFORE any action. If BLOCKED, fix violations first!',
      mandatory: true
    };

    // Add Git Flow section
    evidence.git_flow = {
      branch_protection: {
        main: 'protected',
        develop: 'protected',
        feature_branches: 'allowed'
      },
      commit_validation: {
        require_evidence: true,
        require_tests: true,
        require_build: true,
        allow_no_verify: false
      },
      current_branch: currentBranch,
      base_branch: 'develop',
      is_protected: isProtected
    };

    // Add Watchers section with REAL token data
    const tokenFile = `${process.cwd()}/.audit_tmp/token-usage.jsonl`;
    let realTokenData = { estimated: tokenUsage.estimated, percentUsed: tokenUsage.percentUsed };
    try {
      if (fs.existsSync(tokenFile)) {
        const lastLine = execSync(`tail -1 ${tokenFile}`, { encoding: 'utf8' }).trim();
        if (lastLine) {
          realTokenData = JSON.parse(lastLine);
        }
      }
    } catch (tokenReadError) {
      const errorMsg = tokenReadError instanceof Error ? tokenReadError.message : 'Unknown error';
      process.stderr.write(`[Token] Using estimated data (read failed: ${errorMsg})\n`);
    }

    const tokenPercent = Math.round(realTokenData.percentUsed || tokenUsage.percentUsed);
    const tokenEstimated = Math.round((realTokenData.estimated || tokenUsage.estimated) / 1000);

    // Notify at 90% threshold
    if (tokenPercent >= 90) {
      try {
        execSync('osascript -e \'display notification "Token usage at ' + tokenPercent + '%! Update evidence to avoid context loss." with title "⚠️ Token Usage Critical" sound name "Basso"\'', { stdio: 'ignore' });
      } catch (notificationError) {
        // Notification failed (macOS only feature), continue silently
        if (notificationError instanceof Error && notificationError.message.includes('osascript')) {
          process.stderr.write('[Token] Notification skipped (not macOS)\n');
        }
      }
    }

    evidence.watchers = {
      token_monitor: {
        enabled: true,
        status: tokenPercent >= 90 ? 'critical' : tokenPercent >= 75 ? 'warning' : 'active',
        current_usage: `${tokenEstimated}K/1M tokens (${tokenPercent}%)`,
        warning_threshold: 750000,
        critical_threshold: 900000,
        notify_at_percent: 90
      },
      violations_watcher: {
        enabled: true,
        status: 'monitoring',
        blocking_threshold: 'HIGH',
        auto_fix_enabled: false
      },
      evidence_watcher: {
        enabled: true,
        status: 'active',
        sla_minutes: 10,
        auto_refresh: true
      }
    };

    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    process.stdout.write('[Intelligent Audit] ✅ .AI_EVIDENCE.json updated with complete format (ai_gate, severity_metrics, token_usage, git_flow, watchers)\n');

  } catch (evidenceFileUpdateError) {
    if (evidenceFileUpdateError instanceof Error) {
      process.stderr.write(`[Intelligent Audit] ⚠️  Evidence update failed: ${evidenceFileUpdateError.message}\n`);
    } else {
      process.stderr.write('[Intelligent Audit] ⚠️  Evidence update failed with non-Error value\n');
    }
  }
}

// Run if called directly
if (require.main === module) {
  runIntelligentAudit().catch(fatalError => {
    const errorMessage = fatalError instanceof Error ? fatalError.message : String(fatalError);
    process.stderr.write(`Fatal error: ${errorMessage}\n`);
    process.exit(1);
  });
}

module.exports = { runIntelligentAudit };
