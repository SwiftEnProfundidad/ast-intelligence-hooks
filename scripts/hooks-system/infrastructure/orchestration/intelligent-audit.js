#!/usr/bin/env node

const { evaluateViolations } = require('../severity/severity-evaluator');
const { GatePolicies } = require('../severity/policies/gate-policies');
const { ReportGenerator } = require('../reporting/report-generator');
const { SeverityTracker } = require('../reporting/severity-tracker');
const { TokenManager } = require('../utils/token-manager');
const { toErrorMessage } = require('../utils/error-utils');
const fs = require('fs');
const path = require('path');

function resolveAuditTmpDir() {
  const configured = (process.env.AUDIT_TMP || '').trim();
  if (configured.length > 0) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), '.audit_tmp');
}

/**
 * Main orchestration function
 * Called by audit.sh after AST analysis completes
 */
async function runIntelligentAudit() {
  try {
    console.log('[Intelligent Audit] Starting severity evaluation...');

    const rawViolations = loadRawViolations();
    console.log(`[Intelligent Audit] Loaded ${rawViolations.length} violations from AST`);

    const gateScope = String(process.env.AI_GATE_SCOPE || 'staging').trim().toLowerCase();
    const isRepoScope = gateScope === 'repo' || gateScope === 'repository';

    let violationsForGate = [];
    let violationsForEvidence = [];

    if (isRepoScope) {
      console.log('[Intelligent Audit] Gate scope: REPOSITORY');
      violationsForGate = rawViolations;
      violationsForEvidence = rawViolations;
    } else {
      const stagedFiles = getStagedFiles();
      const stagedViolations = rawViolations.filter(v =>
        stagedFiles.some(sf => v.filePath && v.filePath.includes(sf))
      );

      console.log(`[Intelligent Audit] Gate scope: STAGING (${stagedFiles.length} files)`);
      console.log(`[Intelligent Audit] Filtered to ${stagedViolations.length} violations in staged files`);

      violationsForGate = stagedViolations;
      violationsForEvidence = stagedViolations;
    }

    if (violationsForGate.length === 0) {
      console.log('[Intelligent Audit] ✅ No violations in staged files - PASSED');
      const enhancedAll = evaluateViolations(violationsForEvidence);
      const gateResult = { passed: true, exitCode: 0, blockedBy: null };
      const tokenManager = new TokenManager();
      const tokenUsage = tokenManager.estimate(enhancedAll, {});
      updateAIEvidence(enhancedAll, gateResult, tokenUsage);
      process.exit(0);
    }

    console.log('[Intelligent Audit] Evaluating severities...');
    const enhancedViolations = evaluateViolations(violationsForGate);

    const intelligentCount = enhancedViolations.filter(v => v.intelligentEvaluation).length;
    console.log(`[Intelligent Audit] ✅ ${intelligentCount}/${enhancedViolations.length} violations intelligently evaluated`);

    console.log('[Intelligent Audit] Applying quality gate...');
    const gatePolicies = new GatePolicies();
    const gateResult = gatePolicies.apply(enhancedViolations);

    console.log(`[Intelligent Audit] Gate status: ${gateResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (gateResult.blockedBy) {
      console.log(`[Intelligent Audit] Blocked by: ${gateResult.blockedBy} violations`);
    }

    console.log('[Intelligent Audit] Generating reports...');
    const reportGenerator = new ReportGenerator();
    const reportPaths = reportGenerator.save(enhancedViolations, gateResult);

    console.log(`[Intelligent Audit] ✅ Reports saved:`);
    console.log(`  - JSON: ${reportPaths.jsonPath}`);
    console.log(`  - Text: ${reportPaths.textPath}`);

    const tracker = new SeverityTracker();
    tracker.record(enhancedViolations, gateResult);

    const trend = tracker.getTrend(10);
    if (trend.trend !== 'INSUFFICIENT_DATA') {
      console.log(`[Intelligent Audit] 📈 Trend: ${trend.trend} (avg score ${trend.latest.averageScore}/100)`);
    }

    const tokenManager = new TokenManager();
    const report = reportGenerator.generate(enhancedViolations, gateResult);
    const tokenUsage = tokenManager.estimate(enhancedViolations, report);
    const warning = tokenManager.checkWarnings(tokenUsage);

    if (warning.shouldWarn) {
      console.log(`[Token Manager] ${warning.message}`);
    }

    tokenManager.record(tokenUsage);

    updateAIEvidence(enhancedViolations, gateResult, tokenUsage);

    saveEnhancedViolations(enhancedViolations);

    console.log('[Intelligent Audit] ✅ Complete');

    process.exit(gateResult.exitCode);

  } catch (auditExecutionError) {
    process.stderr.write(`[Intelligent Audit] ❌ Fatal error during audit execution: ${toErrorMessage(auditExecutionError)}\n`);
    throw auditExecutionError;
  }
}

function loadRawViolations() {
  const astSummaryPath = path.join(resolveAuditTmpDir(), 'ast-summary.json');

  if (!fs.existsSync(astSummaryPath)) {
    console.error('[Intelligent Audit] ⚠️  No ast-summary.json found - running without violations');
    return [];
  }

  const astSummary = JSON.parse(fs.readFileSync(astSummaryPath, 'utf8'));

  return astSummary.findings || astSummary.violations || [];
}

function getStagedFiles() {
  const { execSync } = require('child_process');

  try {
    const result = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return result.trim().split('\n').filter(f => f);
  } catch (error) {
    process.stderr.write(`[Intelligent Audit] ⚠️  Failed to read staged files: ${toErrorMessage(error)}\n`);
    return [];
  }
}

function saveEnhancedViolations(violations) {
  const outputPath = path.join(resolveAuditTmpDir(), 'ast-summary-enhanced.json');

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

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  } catch (error) {
    process.stderr.write(`[Intelligent Audit] ⚠️  Failed to create output directory: ${toErrorMessage(error)}\n`);
  }
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

    evidence.token_usage = {
      estimated: tokenUsage.estimated,
      percent_used: Math.round(tokenUsage.percentUsed),
      remaining: tokenUsage.remaining,
      warning_level: tokenUsage.percentUsed > 95 ? 'CRITICAL' :
        tokenUsage.percentUsed > 85 ? 'WARNING' :
          tokenUsage.percentUsed > 75 ? 'INFO' : 'OK'
    };

    const { execSync } = require('child_process');
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

    const resolveBaseBranch = () => {
        const configured = process.env.AST_BASE_BRANCH;
        if (configured && configured.trim().length > 0) {
            return configured.trim();
        }
        try {
            execSync('git show-ref --verify --quiet refs/heads/develop', { stdio: 'ignore' });
            return 'develop';
        } catch {
            try {
                execSync('git show-ref --verify --quiet refs/heads/main', { stdio: 'ignore' });
                return 'main';
            } catch {
                return 'main';
            }
        }
    };
    const baseBranch = resolveBaseBranch();
    const isProtected = ['main', 'master', baseBranch].includes(currentBranch);
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
    const highViolations = violations.filter(v => v.severity === 'HIGH');
    const blockingViolations = [...criticalViolations, ...highViolations].slice(0, 50);

    const gateScope = String(process.env.AI_GATE_SCOPE || 'staging').trim().toLowerCase();

    const existingGate = evidence.ai_gate && typeof evidence.ai_gate === 'object' ? evidence.ai_gate : null;
    let preserveExistingRepoGate = false;
    if (gateScope !== 'repo' && gateScope !== 'repository' && existingGate && existingGate.scope === 'repo' && existingGate.status === 'BLOCKED') {
      const preserveMs = Number(process.env.AI_GATE_REPO_PRESERVE_MS || 600000);
      const lastCheckMs = Date.parse(existingGate.last_check || '');
      if (!Number.isNaN(preserveMs) && preserveMs > 0 && !Number.isNaN(lastCheckMs)) {
        const ageMs = Date.now() - lastCheckMs;
        if (ageMs >= 0 && ageMs < preserveMs) {
          preserveExistingRepoGate = true;
        }
      }
    }

    const nextGate = {
      status: gateResult.passed ? 'ALLOWED' : 'BLOCKED',
      scope: gateScope === 'repo' || gateScope === 'repository' ? 'repo' : 'staging',
      last_check: new Date().toISOString(),
      violations: blockingViolations.map(v => ({
        file: v.filePath || v.file || 'unknown',
        line: v.line || null,
        severity: v.severity,
        rule: v.ruleId || v.rule || 'unknown',
        message: v.message || v.description || '',
        category: v.category || 'unknown',
        intelligent_evaluation: v.intelligentEvaluation || false,
        severity_score: v.severityScore || 0
      })),
      instruction: '🚨 AI MUST call mcp_ast-intelligence-automation_ai_gate_check BEFORE any action. If BLOCKED, fix violations first!',
      mandatory: true
    };

    evidence.ai_gate = preserveExistingRepoGate ? existingGate : nextGate;

    evidence.git_flow = {
      branch_protection: {
        main: 'protected',
        [baseBranch]: 'protected',
        feature_branches: 'allowed'
      },
      commit_validation: {
        require_evidence: true,
        require_tests: true,
        require_build: true,
        allow_no_verify: false
      },
      current_branch: currentBranch,
      base_branch: baseBranch,
      is_protected: isProtected
    };

    const tokenFile = path.join(resolveAuditTmpDir(), 'token-usage.jsonl');
    let realTokenData = { estimated: tokenUsage.estimated, percentUsed: tokenUsage.percentUsed };
    try {
      if (fs.existsSync(tokenFile)) {
        const lastLine = execSync(`tail -1 ${tokenFile}`, { encoding: 'utf8' }).trim();
        if (lastLine) {
          realTokenData = JSON.parse(lastLine);
        }
      }
    } catch (tokenReadError) {
      process.stderr.write(`[Token] Using estimated data (read failed: ${toErrorMessage(tokenReadError)})\n`);
    }

    const tokenPercent = Math.round(realTokenData.percentUsed || tokenUsage.percentUsed);
    const tokenEstimated = Math.round((realTokenData.estimated || tokenUsage.estimated) / 1000);

    if (tokenPercent >= 90) {
      try {
        execSync('osascript -e \'display notification "Token usage at ' + tokenPercent + '%! Update evidence to avoid context loss." with title "⚠️ Token Usage Critical" sound name "Basso"\'', { stdio: 'ignore' });
      } catch (notificationError) {
        if (toErrorMessage(notificationError).includes('osascript')) {
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
    console.log('[Intelligent Audit] ✅ .AI_EVIDENCE.json updated with complete format (ai_gate, severity_metrics, token_usage, git_flow, watchers)');

  } catch (evidenceFileUpdateError) {
    process.stderr.write(`[Intelligent Audit] ⚠️  Evidence update failed: ${toErrorMessage(evidenceFileUpdateError)}\n`);
  }
}

if (require.main === module) {
  runIntelligentAudit().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runIntelligentAudit };
