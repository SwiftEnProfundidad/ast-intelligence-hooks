#!/usr/bin/env node

const env = require('../../config/env');
const { evaluateViolations } = require('../severity/severity-evaluator');
const { GatePolicies } = require('../severity/policies/gate-policies');
const { ReportGenerator } = require('../reporting/report-generator');
const { SeverityTracker } = require('../reporting/severity-tracker');
const { TokenManager } = require('../utils/token-manager');
const { toErrorMessage } = require('../utils/error-utils');
const fs = require('fs');
const path = require('path');
const DynamicRulesLoader = require('../../application/services/DynamicRulesLoader');
const RulesDigestService = require('../../application/services/RulesDigestService');
const PolicyBundleService = require('../../application/services/PolicyBundleService');

function deriveCategoryFromRuleId(ruleId) {
  if (!ruleId || typeof ruleId !== 'string') return 'unknown';
  const parts = ruleId.split('.');
  if (parts.length >= 2) {
    const platform = parts[0].toLowerCase();
    const domain = parts[1].toLowerCase();
    if (['ios', 'android', 'backend', 'frontend'].includes(platform)) {
      return `${platform}.${domain}`;
    }
    return domain;
  }
  return parts[0] || 'unknown';
}

/**
 * Generate semantic_snapshot automatically from current evidence state.
 * This is the Semantic Memory Layer - derived, never manually input.
 */
function generateSemanticSnapshot(evidence, violations, gateResult) {
  const now = new Date();
  const activePlatforms = Object.entries(evidence.platforms || {})
    .filter(([, v]) => v.detected)
    .map(([k]) => k);

  const violationSummary = violations.length > 0
    ? violations.slice(0, 5).map(v => `${v.severity}: ${v.ruleId || v.rule || 'unknown'}`).join('; ')
    : 'No violations';

  const healthScore = Math.max(0, 100 - (violations.length * 5) -
    (violations.filter(v => v.severity === 'CRITICAL').length * 20) -
    (violations.filter(v => v.severity === 'HIGH').length * 10));

  return {
    generated_at: now.toISOString(),
    derivation_source: 'auto:updateAIEvidence',
    context_hash: `ctx-${Date.now().toString(36)}`,
    summary: {
      health_score: healthScore,
      gate_status: gateResult.passed ? 'PASSED' : 'FAILED',
      active_platforms: activePlatforms,
      violation_count: violations.length,
      violation_preview: violationSummary,
      branch: evidence.current_context?.current_branch || 'unknown',
      session_id: evidence.session_id || 'unknown'
    },
    feature_state: {
      ai_gate_enabled: true,
      token_monitoring: evidence.watchers?.token_monitor?.enabled ?? true,
      auto_refresh: evidence.watchers?.evidence_watcher?.auto_refresh ?? true,
      protocol_3_active: evidence.protocol_3_questions?.answered ?? false
    },
    decisions: {
      last_gate_decision: gateResult.passed ? 'allow' : 'block',
      blocking_reason: gateResult.blockedBy || null,
      recommended_action: gateResult.passed
        ? 'proceed_with_development'
        : 'fix_violations_before_commit'
    }
  };
}

function generateAutoIntent(evidence, violations, gateResult, stagedFiles) {
  const now = new Date();
  const activePlatforms = Object.entries(evidence.platforms || {})
    .filter(([, v]) => v.detected)
    .map(([k]) => k);

  const stagedDetected = Array.from(detectPlatformsFromStagedFiles(stagedFiles || []));
  const platforms = Array.from(new Set([...(activePlatforms || []), ...(stagedDetected || [])]));

  const gateStatus = gateResult && typeof gateResult === 'object'
    ? (gateResult.passed ? 'PASSED' : 'FAILED')
    : 'unknown';

  const platformLabel = platforms.length > 0 ? platforms.join('+') : 'repo';

  const branch = evidence.current_context?.current_branch || 'unknown';
  const baseBranch = evidence.current_context?.base_branch || 'unknown';
  const isProtected = Boolean(evidence.git_flow && evidence.git_flow.is_protected);

  let primaryGoal = `Continue work on ${platformLabel} changes`;
  if (gateStatus === 'FAILED') {
    primaryGoal = `Unblock gate by fixing ${platformLabel} violations`;
  }
  if (isProtected) {
    primaryGoal = `Create a feature branch for ${platformLabel} work (Git Flow)`;
  }

  const recommendedNextActions = [];
  if (isProtected) {
    recommendedNextActions.push('Create a feature/fix branch and move changes there');
  }
  if (gateStatus === 'FAILED') {
    recommendedNextActions.push('Fix blocking violations (CRITICAL/HIGH) before proceeding');
  }
  if (Array.isArray(violations) && violations.length > 0) {
    recommendedNextActions.push('Run audit and re-check gate after fixes');
  }
  if (recommendedNextActions.length === 0) {
    recommendedNextActions.push('Proceed with planned work');
  }

  const constraints = [];
  constraints.push('Do not bypass hooks (--no-verify)');
  constraints.push('Follow platform rules (rules*.mdc)');

  const confidence = platforms.length > 0 ? 'medium' : 'low';

  return {
    generated_at: now.toISOString(),
    derivation_source: 'auto:updateAIEvidence',
    primary_goal: primaryGoal,
    secondary_goals: [],
    constraints,
    confidence_level: confidence,
    context: {
      branch,
      base_branch: baseBranch,
      platforms,
      staged_files_count: Array.isArray(stagedFiles) ? stagedFiles.length : 0,
      gate_status: gateStatus,
      is_protected_branch: isProtected
    },
    recommended_next_actions: recommendedNextActions
  };
}

/**
 * Preserve or initialize human_intent layer.
 * This is the Intentional Memory Layer - set by human, preserved across updates.
 */
function preserveOrInitHumanIntent(existingEvidence) {
  const existing = existingEvidence.human_intent;

  if (existing && typeof existing === 'object' && existing.primary_goal) {
    const expiresAt = existing.expires_at ? new Date(existing.expires_at) : null;
    const isExpired = expiresAt && expiresAt < new Date();

    if (!isExpired) {
      return {
        ...existing,
        preserved_at: new Date().toISOString(),
        preservation_count: (existing.preservation_count || 0) + 1
      };
    }
  }

  return {
    primary_goal: null,
    secondary_goals: [],
    non_goals: [],
    constraints: [],
    confidence_level: 'unset',
    set_by: null,
    set_at: null,
    expires_at: null,
    preserved_at: new Date().toISOString(),
    preservation_count: 0,
    _hint: 'Set via CLI: ast-hooks intent --goal "your goal" or manually edit this file'
  };
}

function hasNonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isProtocolQuestionsComplete(protocol) {
  if (!protocol || typeof protocol !== 'object') return false;
  if (protocol.answered !== true) return false;
  return hasNonEmptyText(protocol.question_1_file_type)
    && hasNonEmptyText(protocol.question_2_similar_exists)
    && hasNonEmptyText(protocol.question_3_clean_architecture);
}

function isEvidenceCompleteForAutoRefresh(evidence) {
  if (!evidence || typeof evidence !== 'object') return false;
  const rulesRead = evidence.rules_read;
  const gate = evidence.ai_gate;
  return isProtocolQuestionsComplete(evidence.protocol_3_questions)
    && Array.isArray(rulesRead)
    && rulesRead.length > 0
    && gate
    && typeof gate === 'object'
    && typeof gate.status === 'string'
    && Array.isArray(gate.violations);
}

function detectPlatformsFromStagedFiles(stagedFiles) {
  const platforms = new Set();
  const files = Array.isArray(stagedFiles) ? stagedFiles : [];

  files.forEach(filePath => {
    const lowerPath = String(filePath || '').toLowerCase();

    if (lowerPath.includes('apps/backend/') || lowerPath.includes('/services/') || lowerPath.includes('services/') || lowerPath.includes('/functions/') || lowerPath.includes('functions/')) {
      platforms.add('backend');
    }
    if (lowerPath.includes('apps/web-app/') || lowerPath.includes('apps/admin') || lowerPath.includes('apps/frontend/') || lowerPath.includes('frontend/')) {
      platforms.add('frontend');
    }
    if (lowerPath.includes('apps/ios/') || lowerPath.endsWith('.swift')) {
      platforms.add('ios');
    }
    if (lowerPath.includes('apps/android/') || lowerPath.endsWith('.kt') || lowerPath.endsWith('.kts') || lowerPath.endsWith('.java')) {
      platforms.add('android');
    }
  });

  return platforms;
}

function countViolationsByPlatform(violations) {
  const counts = { backend: 0, frontend: 0, ios: 0, android: 0 };
  const list = Array.isArray(violations) ? violations : [];

  list.forEach(v => {
    const ruleId = v.ruleId || v.rule || 'unknown';
    const category = String(v.category || deriveCategoryFromRuleId(ruleId) || '').toLowerCase();
    const platform = category.split('.')[0];
    if (counts[platform] !== undefined) {
      counts[platform] += 1;
    }
  });

  return counts;
}

function buildPlatformsEvidence(stagedFiles, violations) {
  const stagedDetected = detectPlatformsFromStagedFiles(stagedFiles);
  const violationCounts = countViolationsByPlatform(violations);

  const platforms = ['backend', 'frontend', 'ios', 'android'];
  const result = {};

  platforms.forEach(p => {
    const violationsCount = violationCounts[p] || 0;
    result[p] = {
      detected: stagedDetected.has(p) || violationsCount > 0,
      violations: violationsCount
    };
  });

  return result;
}

function summarizeRulesContent(content) {
  if (!content || typeof content !== 'string') {
    return 'not found';
  }
  const firstNonEmpty = content
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 0);
  const firstLine = firstNonEmpty ? firstNonEmpty.slice(0, 140) : '';
  return firstLine.length > 0 ? firstLine : `loaded (${content.length} chars)`;
}

function buildAutoContextFrontmatter(detectedPlatforms) {
  const platforms = Array.isArray(detectedPlatforms) ? detectedPlatforms.filter(Boolean) : [];
  const generated = formatLocalTimestamp();
  const platformStr = platforms.length > 0 ? platforms.join(', ') : 'none';
  return `---\nalwaysApply: true\ndescription: Auto-generated context for detected platforms\nplatforms: ${platformStr}\ngenerated: ${generated}\n---\n\n`;
}

async function buildAutoContextContent(platformsEvidence) {
  const loader = new DynamicRulesLoader();
  const detectedPlatforms = ['backend', 'frontend', 'ios', 'android']
    .filter(p => platformsEvidence && platformsEvidence[p] && platformsEvidence[p].detected);

  const files = ['rulesgold.mdc', ...detectedPlatforms.map(p => loader.rulesMap[p]).filter(Boolean)];
  const uniqueFiles = Array.from(new Set(files));

  let content = buildAutoContextFrontmatter(detectedPlatforms);

  for (const file of uniqueFiles) {
    let ruleContent = null;
    try {
      ruleContent = await loader.loadRule(file);
    } catch {
      ruleContent = null;
    }

    content += `## Source: ${file}\n\n`;
    content += ruleContent ? `${ruleContent}\n\n` : `not found\n\n`;
    content += `---\n\n`;
  }

  return content;
}

async function writeAutoContextFiles(platformsEvidence) {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg && pkg.name === 'pumuki-ast-hooks') {
        return;
      }
    }
  } catch (error) {
    process.stderr.write(`[Intelligent Audit] ⚠️  Failed to inspect package.json for auto-context skip logic (${toErrorMessage(error)})\n`);
  }

  const content = await buildAutoContextContent(platformsEvidence);
  const targets = [
    path.join(process.cwd(), '.cursor', 'rules', 'auto-context.mdc'),
    path.join(process.cwd(), '.windsurf', 'rules', 'auto-context.mdc')
  ];

  for (const target of targets) {
    try {
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await fs.promises.writeFile(target, content, 'utf-8');
    } catch (error) {
      process.stderr.write(`[Intelligent Audit] ⚠️  Failed to write auto-context: ${target} (${toErrorMessage(error)})\n`);
    }
  }
}

async function buildRulesReadEvidence(platformsEvidence) {
  const loader = new DynamicRulesLoader();
  const digestService = new RulesDigestService();
  const entries = [];

  const detectedPlatforms = ['backend', 'frontend', 'ios', 'android']
    .filter(p => platformsEvidence && platformsEvidence[p] && platformsEvidence[p].detected);

  const uniqueFiles = ['rulesgold.mdc', ...detectedPlatforms.map(p => loader.rulesMap[p]).filter(Boolean)];

  for (const file of uniqueFiles) {
    let content = null;
    let resolvedPath = null;

    try {
      content = await loader.loadRule(file);
      const cached = loader.cache && loader.cache.rules ? loader.cache.rules.get(file) : null;
      resolvedPath = cached && cached.fullPath ? cached.fullPath : null;
    } catch (error) {
      content = null;
    }

    const entry = digestService.buildEntry({
      file,
      content,
      path: resolvedPath
    });

    entries.push(entry);
  }

  return {
    entries,
    legacyFlags: {
      backend: detectedPlatforms.includes('backend'),
      frontend: detectedPlatforms.includes('frontend'),
      ios: detectedPlatforms.includes('ios'),
      android: detectedPlatforms.includes('android'),
      gold: true,
      last_checked: formatLocalTimestamp()
    }
  };
}

function formatLocalTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const offsetMins = String(absolute % 60).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetMins}`;
}

function normalizePathForMatch(value) {
  const s = String(value || '');
  const normalized = path.normalize(s).replace(/\\/g, '/');
  return normalized;
}

function toRepoRelativePath(filePath) {
  const normalized = normalizePathForMatch(filePath);
  const cwd = normalizePathForMatch(process.cwd());
  if (normalized.startsWith(cwd + '/')) {
    return normalized.slice(cwd.length + 1);
  }
  return normalized;
}

function isAuditTmpPath(repoRelativePath) {
  const normalized = normalizePathForMatch(repoRelativePath);
  return normalized.startsWith('.audit_tmp/') || normalized.includes('/.audit_tmp/');
}

function isViolationInStagedFiles(violationPath, stagedSet) {
  if (!violationPath) {
    return false;
  }

  const repoRelative = toRepoRelativePath(violationPath);
  if (!repoRelative) {
    return false;
  }

  if (isAuditTmpPath(repoRelative)) {
    return false;
  }

  return stagedSet.has(repoRelative);
}

function resolveAuditTmpDir() {
  const configured = (env.get('AUDIT_TMP', '') || '').trim();
  if (configured.length > 0) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), '.audit_tmp');
}

function loadExclusions() {
  const configPath = path.join(process.cwd(), 'config', 'ast-exclusions.json');
  try {
    if (!fs.existsSync(configPath)) {
      return {};
    }
    const payload = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return payload.exclusions || {};
  } catch (error) {
    if (process.env.DEBUG) {
      console.debug(`[Intelligent Audit] Failed to load exclusions: ${error.message}`);
    }
    return {};
  }
}

function isViolationExcluded(violation, exclusions) {
  const ruleId = violation.ruleId || violation.rule || '';
  if (!ruleId) return false;

  const rules = exclusions.rules || {};
  const rule = rules[ruleId];
  if (!rule) return false;

  const files = rule.files || [];
  const paths = rule.paths || [];
  const globs = rule.globs || [];
  const excludeFiles = rule.excludeFiles || [];
  const excludePaths = rule.excludePaths || [];
  const excludePatterns = rule.excludePatterns || [];

  const hasSelectors = files.length || paths.length || globs.length || excludeFiles.length || excludePaths.length || excludePatterns.length;
  if (!hasSelectors) return true;

  const filePath = toRepoRelativePath(violation.filePath || violation.file || '');

  if (files.some((pattern) => filePath.includes(pattern))) return true;
  if (paths.some((pattern) => filePath.includes(pattern))) return true;
  if (globs.some((pattern) => filePath.includes(pattern))) return true;
  if (excludeFiles.some((pattern) => filePath.includes(pattern))) return true;
  if (excludePaths.some((pattern) => filePath.includes(pattern))) return true;

  for (const pattern of excludePatterns) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    if (regex.test(filePath)) return true;
  }

  return false;
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
    const exclusions = loadExclusions();
    const filteredViolations = rawViolations.filter(v => !isViolationExcluded(v, exclusions));
    if (filteredViolations.length !== rawViolations.length) {
      console.log(`[Intelligent Audit] Excluded ${rawViolations.length - filteredViolations.length} violations via config`);
    }

    const autoEvidenceTrigger = String(env.get('AUTO_EVIDENCE_TRIGGER', process.env.AUTO_EVIDENCE_TRIGGER || '') || '').trim().toLowerCase();
    const isAutoEvidenceRefresh = autoEvidenceTrigger === 'auto';

    const gateScope = String(env.get('AI_GATE_SCOPE', 'staging') || 'staging').trim().toLowerCase();
    const isRepoScope = gateScope === 'repo' || gateScope === 'repository';

    let violationsForGate = [];
    let violationsForEvidence = [];

    if (isRepoScope) {
      console.log('[Intelligent Audit] Gate scope: REPOSITORY');
      violationsForGate = filteredViolations;
      violationsForEvidence = filteredViolations;
    } else {
      const stagedFiles = getStagedFiles();
      const stagedSet = new Set((Array.isArray(stagedFiles) ? stagedFiles : []).map(toRepoRelativePath));

      const stagedViolations = filteredViolations.filter(v => {
        const violationPath = toRepoRelativePath(v.filePath || v.file || '');
        return isViolationInStagedFiles(violationPath, stagedSet);
      });

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
      await updateAIEvidence(enhancedAll, gateResult, tokenUsage);
      process.exit(0);
    }

    console.log('[Intelligent Audit] Evaluating severities...');
    const enhancedViolations = evaluateViolations(violationsForGate);

    const intelligentCount = enhancedViolations.filter(v => v.intelligentEvaluation).length;
    console.log(`[Intelligent Audit] ✅ ${intelligentCount}/${enhancedViolations.length} violations intelligently evaluated`);

    console.log('[Intelligent Audit] Applying quality gate...');
    const gatePolicies = new GatePolicies();
    const gateResult = gatePolicies.apply(enhancedViolations);

    if (isAutoEvidenceRefresh && !gateResult.passed) {
      console.log('[Intelligent Audit] ℹ️  Auto evidence refresh: preserving gate status but not failing process exit code');
      gateResult.exitCode = 0;
    }

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

    // Generate detailed console output for God classes and critical violations
    console.log('\n🔍 DETAILED VIOLATION ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const godClassViolations = enhancedViolations.filter(v =>
      v.ruleId && v.ruleId.includes('god_class') && v.severity === 'CRITICAL'
    );

    if (godClassViolations.length > 0) {
      console.log(`\n🚨 GOD CLASSES DETECTED (${godClassViolations.length}):`);
      godClassViolations.forEach((violation, idx) => {
        console.log(`\n${idx + 1}. ${violation.ruleId}`);
        console.log(`   File: ${violation.filePath}:${violation.line}`);
        console.log(`   Message: ${violation.message}`);
        if (violation.intelligentEvaluation && violation.recommendation) {
          console.log(`   Recommendation: ${violation.recommendation}`);
        }
      });
    }

    // Show top critical violations with details
    const otherCritical = enhancedViolations.filter(v =>
      v.severity === 'CRITICAL' && !v.ruleId.includes('god_class')
    ).slice(0, 5);

    if (otherCritical.length > 0) {
      console.log(`\n🚨 OTHER CRITICAL VIOLATIONS (Top ${otherCritical.length}):`);
      otherCritical.forEach((violation, idx) => {
        console.log(`\n${idx + 1}. ${violation.ruleId}`);
        console.log(`   File: ${violation.filePath}:${violation.line}`);
        console.log(`   Message: ${violation.message}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

    await updateAIEvidence(enhancedViolations, gateResult, tokenUsage);

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
    const result = execSync('git diff --cached --name-only --diff-filter=ACMRT', { encoding: 'utf8' });
    return result.trim().split('\n').filter(f => f);
  } catch (error) {
    process.stderr.write(`[Intelligent Audit] ⚠️  Failed to read staged files: ${toErrorMessage(error)}\n`);
    return [];
  }
}

function detectPlatformsFromFiles(files) {
  const platforms = new Set();

  for (const file of files) {
    if (file.endsWith('.swift') || file.includes('/ios/') || file.includes('.xcodeproj') || file.includes('.xcworkspace')) {
      platforms.add('ios');
    }
    if (file.endsWith('.kt') || file.endsWith('.java') || file.includes('/android/') || file.includes('build.gradle')) {
      platforms.add('android');
    }
    if (file.includes('/backend/') || file.includes('.nestjs') || file.endsWith('.controller.ts') || file.endsWith('.service.ts')) {
      platforms.add('backend');
    }
    if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.includes('/frontend/') || file.includes('/web/')) {
      platforms.add('frontend');
    }
  }

  return Array.from(platforms);
}

function saveEnhancedViolations(violations) {
  const outputPath = path.join(resolveAuditTmpDir(), 'ast-summary-enhanced.json');

  const normalizeSeverity = (s) => String(s || '').toUpperCase().trim();
  const enhanced = {
    timestamp: formatLocalTimestamp(),
    generator: 'AST Intelligence v2.0 with Severity Evaluation',
    intelligentEvaluation: true,
    totalViolations: violations.length,
    findings: violations,
    summary: {
      total: violations.length,
      CRITICAL: violations.filter(v => normalizeSeverity(v.severity) === 'CRITICAL').length,
      HIGH: violations.filter(v => normalizeSeverity(v.severity) === 'HIGH').length,
      MEDIUM: violations.filter(v => normalizeSeverity(v.severity) === 'MEDIUM').length,
      LOW: violations.filter(v => normalizeSeverity(v.severity) === 'LOW').length
    }
  };

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  } catch (error) {
    process.stderr.write(`[Intelligent Audit] ⚠️  Failed to create output directory: ${toErrorMessage(error)}\n`);
  }
  fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2));
}

async function updateAIEvidence(violations, gateResult, tokenUsage) {
  const evidencePath = '.AI_EVIDENCE.json';

  if (!fs.existsSync(evidencePath)) {
    console.warn('[Intelligent Audit] ⚠️  .AI_EVIDENCE.json not found - skipping update');
    return;
  }

  try {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

    const autoEvidenceTrigger = String(env.get('AUTO_EVIDENCE_TRIGGER', process.env.AUTO_EVIDENCE_TRIGGER || '') || '').trim().toLowerCase();
    const isAutoEvidenceRefresh = autoEvidenceTrigger === 'auto';
    if (isAutoEvidenceRefresh && isEvidenceCompleteForAutoRefresh(evidence)) {
      evidence.timestamp = formatLocalTimestamp();
      fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
      console.log('[Intelligent Audit] ✅ Auto refresh skipped full rewrite (evidence already complete)');
      return;
    }

    evidence.timestamp = formatLocalTimestamp();

    const normSev = (s) => String(s || '').toUpperCase().trim();
    evidence.severity_metrics = {
      last_updated: formatLocalTimestamp(),
      total_violations: violations.length,
      by_severity: {
        CRITICAL: violations.filter(v => normSev(v.severity) === 'CRITICAL').length,
        HIGH: violations.filter(v => normSev(v.severity) === 'HIGH').length,
        MEDIUM: violations.filter(v => normSev(v.severity) === 'MEDIUM').length,
        LOW: violations.filter(v => normSev(v.severity) === 'LOW').length
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
      const configured = env.get('AST_BASE_BRANCH', '');
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
    const normalizeSeverity = (s) => String(s || '').toUpperCase().trim();
    const criticalViolations = violations.filter(v => normalizeSeverity(v.severity) === 'CRITICAL');
    const highViolations = violations.filter(v => normalizeSeverity(v.severity) === 'HIGH');
    const mediumViolations = violations.filter(v => normalizeSeverity(v.severity) === 'MEDIUM');
    const lowViolations = violations.filter(v => normalizeSeverity(v.severity) === 'LOW');

    const maxGateViolations = env.getNumber('AI_GATE_MAX_VIOLATIONS', 200);
    const gateViolationsLimit = Number.isFinite(maxGateViolations) && maxGateViolations > 0 ? maxGateViolations : 200;
    const severityBuckets = [
      [...criticalViolations],
      [...highViolations],
      [...mediumViolations],
      [...lowViolations]
    ];
    const gateViolations = [];
    let keepFilling = true;
    while (keepFilling && gateViolations.length < gateViolationsLimit) {
      keepFilling = false;
      for (const bucket of severityBuckets) {
        if (bucket.length === 0) continue;
        gateViolations.push(bucket.shift());
        keepFilling = true;
        if (gateViolations.length >= gateViolationsLimit) break;
      }
    }
    const blockingViolations = gateViolations;

    const gateScope = String(env.get('AI_GATE_SCOPE', 'staging') || 'staging').trim().toLowerCase();

    const existingGate = evidence.ai_gate && typeof evidence.ai_gate === 'object' ? evidence.ai_gate : null;
    let preserveExistingRepoGate = false;
    if (gateScope !== 'repo' && gateScope !== 'repository' && existingGate && existingGate.scope === 'repo' && existingGate.status === 'BLOCKED') {
      const preserveMs = env.getNumber('AI_GATE_REPO_PRESERVE_MS', 600000);
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
      last_check: formatLocalTimestamp(),
      severity_summary: {
        CRITICAL: criticalViolations.length,
        HIGH: highViolations.length,
        MEDIUM: mediumViolations.length,
        LOW: lowViolations.length,
        total: violations.length
      },
      violations: blockingViolations.map(v => {
        const ruleId = v.ruleId || v.rule || 'unknown';
        return {
          file: v.filePath || v.file || 'unknown',
          line: v.line || null,
          severity: v.severity,
          rule_id: ruleId,
          message: v.message || v.description || '',
          category: v.category || deriveCategoryFromRuleId(ruleId),
          intelligent_evaluation: v.intelligentEvaluation || false,
          severity_score: v.severityScore || 0
        };
      }),
      instruction: '🚨 AI MUST call mcp_ast-intelligence-automation_ai_gate_check BEFORE any action. If BLOCKED, fix violations first!',
      mandatory: true
    };

    evidence.ai_gate = preserveExistingRepoGate ? existingGate : nextGate;

    const stagedFilesList = getStagedFiles();
    const detectedPlatformsForQuestions = detectPlatformsFromFiles(stagedFilesList);
    const architectureViolations = violations.filter(v =>
      (v.ruleId || '').includes('solid') ||
      (v.ruleId || '').includes('clean') ||
      (v.ruleId || '').includes('architecture')
    );

    evidence.protocol_3_questions = {
      answered: true,
      question_1_file_type: stagedFilesList.length > 0
        ? `Staged files analyzed: ${stagedFilesList.length}. Platforms detected: ${detectedPlatformsForQuestions.join(', ') || 'none'}.`
        : 'No staged files detected for analysis.',
      question_2_similar_exists: violations.length > 0
        ? `Detected ${violations.length} rule violations; review existing patterns and rule matches.`
        : 'No rule violations detected; no similar patterns flagged.',
      question_3_clean_architecture: architectureViolations.length > 0
        ? `Found ${architectureViolations.length} Clean Architecture/SOLID-related violations that require review.`
        : 'No Clean Architecture or SOLID violations detected.',
      last_answered: formatLocalTimestamp()
    };

    const stagedFiles = getStagedFiles();
    const platformsEvidence = buildPlatformsEvidence(stagedFiles, violations);
    const rulesRead = await buildRulesReadEvidence(platformsEvidence);

    await writeAutoContextFiles(platformsEvidence);

    evidence.rules_read = rulesRead.entries;
    evidence.rules_read_flags = rulesRead.legacyFlags;

    const policyBundleService = new PolicyBundleService();
    const detectedPlatforms = Object.keys(platformsEvidence).filter(p => platformsEvidence[p] && platformsEvidence[p].detected);
    const rulesSources = rulesRead.entries
      .filter(e => e.verified && e.sha256)
      .map(e => ({ file: e.file, sha256: e.sha256, path: e.path, content: e.content || '' }));

    evidence.policy_bundle = policyBundleService.createBundle({
      platforms: detectedPlatforms,
      mandatory: true,
      enforcedAt: 'pre-commit',
      rulesSources
    });

    evidence.current_context = {
      working_on: env.get('AUTO_EVIDENCE_SUMMARY', 'AST Intelligence Analysis'),
      last_files_edited: [],
      current_branch: currentBranch,
      base_branch: baseBranch,
      timestamp: formatLocalTimestamp()
    };

    evidence.platforms = platformsEvidence;

    evidence.session_id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

    evidence.human_intent = preserveOrInitHumanIntent(evidence);

    evidence.semantic_snapshot = generateSemanticSnapshot(evidence, violations, gateResult);

    evidence.auto_intent = generateAutoIntent(evidence, violations, gateResult, stagedFiles);

    const rulesDigestService = new RulesDigestService();
    const allRulesContent = rulesSources.map(src => src.content || '').join('\n');
    const compactDigest = rulesDigestService.generateCompactDigest(rulesSources, allRulesContent);
    const ttlMinutes = 10;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    evidence.rules_digest = {
      ...compactDigest,
      ttl_minutes: ttlMinutes,
      expires_at: expiresAt
    };

    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    console.log('[Intelligent Audit] ✅ .AI_EVIDENCE.json updated with complete format (ai_gate, severity_metrics, token_usage, git_flow, watchers, human_intent, semantic_snapshot)');

    const MacNotificationSender = require('../../application/services/notification/MacNotificationSender');
    const notificationSender = new MacNotificationSender(null);
    const gateStatus = evidence.ai_gate.status;
    const violationCount = evidence.severity_metrics.total_violations;
    const level = gateStatus === 'BLOCKED' ? 'error' : 'info';
    const notifMsg = gateStatus === 'BLOCKED'
      ? `AI Gate BLOCKED - ${violationCount} violations need fixing`
      : `AI Evidence has been refreshed automatically`;
    notificationSender.send({ message: notifMsg, level });

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

module.exports = {
  runIntelligentAudit,
  isViolationInStagedFiles,
  toRepoRelativePath,
  updateAIEvidence,
  formatLocalTimestamp,
  loadExclusions,
  isViolationExcluded
};
