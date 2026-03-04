import { evaluateGate } from '../../core/gate/evaluateGate';
import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { RuleSet } from '../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../config/skillsRuleSet';
import type { ResolvedStagePolicy } from '../gate/stagePolicies';
import type { DetectedPlatforms } from '../platform/detectPlatforms';
import { GitService, type IGitService } from './GitService';
import { EvidenceService, type IEvidenceService } from './EvidenceService';
import {
  resolveActiveGateWaiver,
  type GateWaiverResult,
} from './gateWaiver';
import { evaluatePlatformGateFindings } from './runPlatformGateEvaluation';
import {
  countScannedFilesFromFacts,
  resolveFactsForGateScope,
  type GateScope,
} from './runPlatformGateFacts';
import { emitPlatformGateEvidence } from './runPlatformGateEvidence';
import { printGateFindings } from './runPlatformGateOutput';
import { evaluateSddPolicy, type SddDecision } from '../sdd';
import type { SnapshotEvaluationMetrics } from '../evidence/schema';
import { createEmptyEvaluationMetrics } from '../evidence/evaluationMetrics';
import { createEmptySnapshotRulesCoverage } from '../evidence/rulesCoverage';
import { enforceTddBddPolicy } from '../tdd/enforcement';
import type { TddBddSnapshot } from '../tdd/types';

export type OperationalMemoryShadowRecommendation = {
  recommendedOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
  confidence: number;
  reasonCodes: ReadonlyArray<string>;
};

export type GateServices = {
  git: IGitService;
  evidence: IEvidenceService;
};

export type GateDependencies = {
  evaluateGate: typeof evaluateGate;
  evaluatePlatformGateFindings: typeof evaluatePlatformGateFindings;
  resolveFactsForGateScope: typeof resolveFactsForGateScope;
  emitPlatformGateEvidence: typeof emitPlatformGateEvidence;
  printGateFindings: typeof printGateFindings;
  enforceTddBddPolicy: typeof enforceTddBddPolicy;
  buildMemoryShadowRecommendation: (params: {
    findings: ReadonlyArray<Finding>;
    tddBddSnapshot?: TddBddSnapshot;
  }) => OperationalMemoryShadowRecommendation | undefined;
  evaluateSddForStage: (
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI',
    repoRoot: string
  ) => Pick<SddDecision, 'allowed' | 'code' | 'message'>;
  resolveActiveGateWaiver: (params: {
    repoRoot: string;
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
    branch: string | null;
  }) => GateWaiverResult;
};

const defaultServices: GateServices = {
  git: new GitService(),
  evidence: new EvidenceService(),
};

const buildDefaultMemoryShadowRecommendation = (params: {
  findings: ReadonlyArray<Finding>;
  tddBddSnapshot?: TddBddSnapshot;
}): OperationalMemoryShadowRecommendation | undefined => {
  const hasCritical = params.findings.some((finding) => finding.severity === 'CRITICAL');
  const hasError = params.findings.some((finding) => finding.severity === 'ERROR');
  const hasWarn = params.findings.some((finding) => finding.severity === 'WARN');
  const reasonCodes: string[] = [];

  if (hasCritical || hasError) {
    reasonCodes.push('severity.error_or_critical');
  } else if (hasWarn) {
    reasonCodes.push('severity.warn');
  } else {
    reasonCodes.push('severity.clean');
  }

  if (params.tddBddSnapshot?.status === 'blocked') {
    reasonCodes.push('tdd_bdd.blocked');
  } else if (params.tddBddSnapshot?.status === 'passed') {
    reasonCodes.push('tdd_bdd.passed');
  }

  if (hasCritical || hasError || params.tddBddSnapshot?.status === 'blocked') {
    return {
      recommendedOutcome: 'BLOCK',
      confidence: 0.9,
      reasonCodes,
    };
  }
  if (hasWarn) {
    return {
      recommendedOutcome: 'WARN',
      confidence: 0.75,
      reasonCodes,
    };
  }
  return {
    recommendedOutcome: 'ALLOW',
    confidence: 0.65,
    reasonCodes,
  };
};

const defaultDependencies: GateDependencies = {
  evaluateGate,
  evaluatePlatformGateFindings,
  resolveFactsForGateScope,
  emitPlatformGateEvidence,
  printGateFindings,
  enforceTddBddPolicy,
  buildMemoryShadowRecommendation: buildDefaultMemoryShadowRecommendation,
  evaluateSddForStage: (stage, repoRoot) =>
    evaluateSddPolicy({
      stage,
      repoRoot,
    }).decision,
  resolveActiveGateWaiver: ({ repoRoot, stage, branch }) =>
    resolveActiveGateWaiver({
      repoRoot,
      stage,
      branch,
    }),
};

const resolveCurrentBranch = (git: IGitService, repoRoot: string): string | null => {
  try {
    const symbolicBranch = git.runGit(['symbolic-ref', '--short', 'HEAD'], repoRoot).trim();
    if (symbolicBranch.length > 0) {
      return symbolicBranch;
    }
  } catch {
  }
  try {
    const branch = git.runGit(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot).trim();
    if (branch.length === 0 || branch === 'HEAD') {
      return null;
    }
    return branch;
  } catch {
    return null;
  }
};

const toSddBlockingFinding = (decision: Pick<SddDecision, 'code' | 'message'>): Finding => ({
  ruleId: 'sdd.policy.blocked',
  severity: 'ERROR',
  code: decision.code,
  message: decision.message,
  filePath: 'openspec/changes',
  matchedBy: 'SddPolicy',
  source: 'sdd-policy',
});

const toRulesCoverageBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  activeRuleIds: ReadonlyArray<string>;
  evaluatedRuleIds: ReadonlyArray<string>;
  unevaluatedRuleIds: ReadonlyArray<string>;
}): Finding | undefined => {
  if (params.unevaluatedRuleIds.length === 0) {
    return undefined;
  }
  const active = params.activeRuleIds.length;
  const evaluated = params.evaluatedRuleIds.length;
  const coverageRatio = active === 0 ? 1 : Number((evaluated / active).toFixed(6));
  const unevaluatedRuleIds = [...params.unevaluatedRuleIds].sort().join(', ');

  return {
    ruleId: 'governance.rules.coverage.incomplete',
    severity: 'ERROR',
    code: 'RULES_COVERAGE_INCOMPLETE_HIGH',
    message:
      `Coverage incomplete at ${params.stage}: unevaluated_rule_ids=[${unevaluatedRuleIds}]` +
      ` coverage_ratio=${coverageRatio}. Evaluate all active rules before proceeding.`,
    filePath: '.ai_evidence.json',
    matchedBy: 'RulesCoverageGuard',
    source: 'rules-coverage',
  };
};

const toSkillsUnsupportedAutoRulesBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  unsupportedAutoRuleIds: ReadonlyArray<string>;
}): Finding | undefined => {
  if (params.unsupportedAutoRuleIds.length === 0) {
    return undefined;
  }

  const unsupportedAutoRuleIds = [...params.unsupportedAutoRuleIds].sort().join(', ');

  return {
    ruleId: 'governance.skills.detector-mapping.incomplete',
    severity: 'ERROR',
    code: 'SKILLS_DETECTOR_MAPPING_INCOMPLETE_HIGH',
    message:
      `Skills detector mapping incomplete at ${params.stage}: ` +
      `unsupported_auto_rule_ids=[${unsupportedAutoRuleIds}]. ` +
      'Map every AUTO skill rule to an AST detector before proceeding.',
    filePath: '.ai_evidence.json',
    matchedBy: 'SkillsDetectorMappingGuard',
    source: 'skills-detector-mapping',
  };
};

const PLATFORM_SKILLS_RULE_PREFIXES: Record<
  'ios' | 'android' | 'backend' | 'frontend',
  string
> = {
  ios: 'skills.ios.',
  android: 'skills.android.',
  backend: 'skills.backend.',
  frontend: 'skills.frontend.',
};

const PLATFORM_REQUIRED_SKILLS_BUNDLES: Record<
  'ios' | 'android' | 'backend' | 'frontend',
  ReadonlyArray<string>
> = {
  ios: [
    'ios-guidelines',
    'ios-concurrency-guidelines',
    'ios-swiftui-expert-guidelines',
  ],
  android: ['android-guidelines'],
  backend: ['backend-guidelines'],
  frontend: ['frontend-guidelines'],
};

const isCriticalProfileSeverity = (severity: string): boolean => {
  return severity === 'CRITICAL' || severity === 'ERROR';
};

const toNormalizedPath = (value: string): string => value.replace(/\\/g, '/').trim();

const CODE_FILE_EXTENSIONS = new Set<string>([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.swift',
  '.kt',
  '.kts',
]);

const isObservedCodePath = (path: string): boolean => {
  const normalized = toNormalizedPath(path).toLowerCase();
  if (normalized.length === 0) {
    return false;
  }
  if (
    normalized.startsWith('apps/backend/')
    || normalized.startsWith('apps/frontend/')
    || normalized.startsWith('apps/web/')
    || normalized.startsWith('apps/admin-dashboard/')
    || normalized.startsWith('apps/ios/')
    || normalized.startsWith('apps/android/')
  ) {
    return true;
  }
  for (const extension of CODE_FILE_EXTENSIONS) {
    if (normalized.endsWith(extension)) {
      return true;
    }
  }
  return false;
};

const collectObservedPathsFromFacts = (
  facts: ReadonlyArray<Fact>
): ReadonlyArray<string> => {
  const observedPaths = new Set<string>();
  for (const fact of facts) {
    if (fact.kind === 'FileChange' || fact.kind === 'FileContent') {
      const normalized = toNormalizedPath(fact.path);
      if (normalized.length > 0) {
        observedPaths.add(normalized);
      }
      continue;
    }
    if (fact.kind === 'Heuristic' && typeof fact.filePath === 'string') {
      const normalized = toNormalizedPath(fact.filePath);
      if (normalized.length > 0) {
        observedPaths.add(normalized);
      }
    }
  }
  return [...observedPaths].sort();
};

const collectObservedCodePathsFromFacts = (
  facts: ReadonlyArray<Fact>
): ReadonlyArray<string> => {
  const codePaths = collectObservedPathsFromFacts(facts).filter((path) => isObservedCodePath(path));
  return [...new Set(codePaths)].sort();
};

type IosTestFileContent = {
  path: string;
  content: string;
};

const isIosSwiftTestPath = (path: string): boolean => {
  const normalized = toNormalizedPath(path).toLowerCase();
  if (!normalized.endsWith('.swift')) {
    return false;
  }
  return normalized.includes('/tests/') || normalized.includes('/uitests/');
};

const collectIosTestFileContents = (
  facts: ReadonlyArray<Fact>
): ReadonlyArray<IosTestFileContent> => {
  const filesByPath = new Map<string, string>();
  for (const fact of facts) {
    if (fact.kind !== 'FileContent') {
      continue;
    }
    if (!isIosSwiftTestPath(fact.path)) {
      continue;
    }
    const normalizedPath = toNormalizedPath(fact.path);
    filesByPath.set(normalizedPath, fact.content);
  }
  return [...filesByPath.entries()]
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([path, content]) => ({ path, content }));
};

const isXCTestSource = (content: string): boolean => {
  return /\bimport\s+XCTest\b/.test(content) || /\bXCTestCase\b/.test(content);
};

const hasMakeSUTPattern = (content: string): boolean => /\bmakeSUT\s*\(/.test(content);

const hasTrackForMemoryLeaksPattern = (content: string): boolean =>
  /\btrackForMemoryLeaks\s*\(/.test(content);

const toIosTestsQualityBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  facts: ReadonlyArray<Fact>;
}): Finding | undefined => {
  const testFiles = collectIosTestFileContents(params.facts);
  if (testFiles.length === 0) {
    return undefined;
  }

  const invalidFiles: string[] = [];
  for (const testFile of testFiles) {
    if (!isXCTestSource(testFile.content)) {
      continue;
    }
    const missingMarkers: string[] = [];
    if (!hasMakeSUTPattern(testFile.content)) {
      missingMarkers.push('makeSUT()');
    }
    if (!hasTrackForMemoryLeaksPattern(testFile.content)) {
      missingMarkers.push('trackForMemoryLeaks()');
    }
    if (missingMarkers.length === 0) {
      continue;
    }
    invalidFiles.push(`${testFile.path}{missing=[${missingMarkers.join(', ')}]}`);
  }

  if (invalidFiles.length === 0) {
    return undefined;
  }

  const sampleFiles = invalidFiles.slice(0, 3).join(' | ');
  return {
    ruleId: 'governance.skills.ios-test-quality.incomplete',
    severity: 'ERROR',
    code: 'IOS_TEST_QUALITY_PATTERN_MISSING_HIGH',
    message:
      `iOS test quality enforcement incomplete at ${params.stage}: ${sampleFiles}. ` +
      'Use makeSUT() factory pattern and trackForMemoryLeaks() in XCTest sources.',
    filePath: '.ai_evidence.json',
    matchedBy: 'IosTestsQualityGuard',
    source: 'skills-ios-test-quality',
  };
};

const toActiveRulesEmptyForCodeChangesBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  facts: ReadonlyArray<Fact>;
  activeRuleIds: ReadonlyArray<string>;
}): Finding | undefined => {
  if (params.activeRuleIds.length > 0) {
    return undefined;
  }
  const codePaths = collectObservedCodePathsFromFacts(params.facts);
  if (codePaths.length === 0) {
    return undefined;
  }
  const samplePaths = codePaths.slice(0, 5).join(', ');
  return {
    ruleId: 'governance.rules.active-rule-coverage.empty',
    severity: 'ERROR',
    code: 'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH',
    message:
      `Active rules coverage is empty at ${params.stage} while code changes were detected. ` +
      `sample_paths=[${samplePaths}]. Ensure skill/project rules are active before allowing this stage.`,
    filePath: '.ai_evidence.json',
    matchedBy: 'ActiveRulesCoverageGuard',
    source: 'rules-coverage',
  };
};

const detectRequiredSkillsScopesFromPaths = (
  observedPaths: ReadonlyArray<string>
): Record<'ios' | 'android' | 'backend' | 'frontend', ReadonlyArray<string>> => {
  const scopes: Record<'ios' | 'android' | 'backend' | 'frontend', string[]> = {
    ios: [],
    android: [],
    backend: [],
    frontend: [],
  };

  for (const observedPath of observedPaths) {
    const normalized = observedPath.toLowerCase();
    if (normalized.startsWith('apps/ios/') || normalized.endsWith('.swift')) {
      scopes.ios.push(observedPath);
    }
    if (
      normalized.startsWith('apps/android/')
      || normalized.endsWith('.kt')
      || normalized.endsWith('.kts')
    ) {
      scopes.android.push(observedPath);
    }
    if (normalized.startsWith('apps/backend/')) {
      scopes.backend.push(observedPath);
    }
    if (
      normalized.startsWith('apps/frontend/')
      || normalized.startsWith('apps/web/')
      || normalized.startsWith('apps/admin-dashboard/')
    ) {
      scopes.frontend.push(observedPath);
    }
  }

  return {
    ios: [...new Set(scopes.ios)].sort(),
    android: [...new Set(scopes.android)].sort(),
    backend: [...new Set(scopes.backend)].sort(),
    frontend: [...new Set(scopes.frontend)].sort(),
  };
};

const toSkillsScopeComplianceBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  facts: ReadonlyArray<Fact>;
  activeRuleIds: ReadonlyArray<string>;
  evaluatedRuleIds: ReadonlyArray<string>;
}): Finding | undefined => {
  const observedPaths = collectObservedPathsFromFacts(params.facts);
  const requiredScopes = detectRequiredSkillsScopesFromPaths(observedPaths);
  const missingScopes: string[] = [];

  for (const scope of ['ios', 'android', 'backend', 'frontend'] as const) {
    const scopePaths = requiredScopes[scope];
    if (scopePaths.length === 0) {
      continue;
    }
    const prefix = PLATFORM_SKILLS_RULE_PREFIXES[scope];
    const hasActiveRules = params.activeRuleIds.some((ruleId) => ruleId.startsWith(prefix));
    const hasEvaluatedRules = params.evaluatedRuleIds.some((ruleId) => ruleId.startsWith(prefix));
    if (hasActiveRules && hasEvaluatedRules) {
      continue;
    }
    const reasons: string[] = [];
    if (!hasActiveRules) {
      reasons.push(`active_rules_prefix=${prefix} missing`);
    }
    if (!hasEvaluatedRules) {
      reasons.push(`evaluated_rules_prefix=${prefix} missing`);
    }
    const samplePaths = scopePaths.slice(0, 3).join(', ');
    missingScopes.push(`${scope}{${reasons.join('; ')} sample_paths=[${samplePaths}]}`);
  }

  if (missingScopes.length === 0) {
    return undefined;
  }

  return {
    ruleId: 'governance.skills.scope-compliance.incomplete',
    severity: 'ERROR',
    code: 'SKILLS_SCOPE_COMPLIANCE_INCOMPLETE_HIGH',
    message:
      `Skills scope compliance incomplete at ${params.stage}: ${missingScopes.join(' | ')}. ` +
      'Map changed file scopes to required skill rules and ensure those prefixes are active/evaluated.',
    filePath: '.ai_evidence.json',
    matchedBy: 'SkillsScopeComplianceGuard',
    source: 'skills-scope-compliance',
  };
};

const toPolicyAsCodeBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  policyTrace?: ResolvedStagePolicy['trace'];
}): Finding | undefined => {
  const validation = params.policyTrace?.validation;
  if (!validation || validation.status === 'valid' || !validation.strict) {
    return undefined;
  }

  return {
    ruleId: 'governance.policy-as-code.invalid',
    severity: 'ERROR',
    code: validation.code,
    message:
      `Policy-as-code validation failed at ${params.stage}: ${validation.message} ` +
      `policy_source=${params.policyTrace?.policySource ?? 'n/a'} ` +
      `policy_version=${params.policyTrace?.version ?? 'n/a'}.`,
    filePath: '.pumuki/policy-as-code.json',
    matchedBy: 'PolicyAsCodeGuard',
    source: 'policy-as-code',
  };
};

const toDegradedModeFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  policyTrace?: ResolvedStagePolicy['trace'];
}): Finding | undefined => {
  const degraded = params.policyTrace?.degraded;
  if (!degraded?.enabled) {
    return undefined;
  }
  if (degraded.action === 'block') {
    return {
      ruleId: 'governance.degraded-mode.blocked',
      severity: 'ERROR',
      code: degraded.code,
      message:
        `Degraded mode is active at ${params.stage} with fail-closed action=block. ` +
        `reason=${degraded.reason} source=${degraded.source}.`,
      filePath: '.pumuki/degraded-mode.json',
      matchedBy: 'DegradedModeGuard',
      source: 'degraded-mode',
    };
  }
  return {
    ruleId: 'governance.degraded-mode.active',
    severity: 'INFO',
    code: degraded.code,
    message:
      `Degraded mode is active at ${params.stage} with fail-open action=allow. ` +
      `reason=${degraded.reason} source=${degraded.source}.`,
    filePath: '.pumuki/degraded-mode.json',
    matchedBy: 'DegradedModeGuard',
    source: 'degraded-mode',
  };
};

const toGateWaiverAppliedFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  waiver: Extract<GateWaiverResult, { kind: 'applied' }>['waiver'];
}): Finding => ({
  ruleId: 'governance.waiver.applied',
  severity: 'INFO',
  code: 'GATE_WAIVER_APPLIED',
  message:
    `Gate waiver applied at ${params.stage}: waiver_id=${params.waiver.id} owner=${params.waiver.owner} ` +
    `expires_at=${params.waiver.expires_at}.`,
  filePath: '.pumuki/waivers/gate.json',
  matchedBy: 'GateWaiverGuard',
  source: 'gate-waiver',
});

const toGateWaiverExpiredFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  waiver: Extract<GateWaiverResult, { kind: 'expired' }>['waiver'];
}): Finding => ({
  ruleId: 'governance.waiver.expired',
  severity: 'ERROR',
  code: 'GATE_WAIVER_EXPIRED',
  message:
    `Gate waiver expired at ${params.stage}: waiver_id=${params.waiver.id} owner=${params.waiver.owner} ` +
    `expired_at=${params.waiver.expires_at}. Provide a valid waiver or fix blocking findings.`,
  filePath: '.pumuki/waivers/gate.json',
  matchedBy: 'GateWaiverGuard',
  source: 'gate-waiver',
});

const toGateWaiverInvalidFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  reason: string;
}): Finding => ({
  ruleId: 'governance.waiver.invalid',
  severity: 'ERROR',
  code: 'GATE_WAIVER_INVALID',
  message:
    `Gate waiver file is invalid at ${params.stage}: ${params.reason}. ` +
    'Fix waiver schema or remove invalid waiver before continuing.',
  filePath: '.pumuki/waivers/gate.json',
  matchedBy: 'GateWaiverGuard',
  source: 'gate-waiver',
});

const toPlatformSkillsCoverageBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  detectedPlatforms: DetectedPlatforms;
  activeBundles: ReadonlyArray<SkillsRuleSetLoadResult['activeBundles'][number]>;
  activeRuleIds: ReadonlyArray<string>;
  evaluatedRuleIds: ReadonlyArray<string>;
}): Finding | undefined => {
  const detectedPlatformKeys = (
    ['ios', 'android', 'backend', 'frontend'] as const
  ).filter((platform) => params.detectedPlatforms[platform]?.detected === true);

  if (detectedPlatformKeys.length === 0) {
    return undefined;
  }

  const activeBundleNames = new Set(params.activeBundles.map((bundle) => bundle.name));
  const gaps: string[] = [];

  for (const platform of detectedPlatformKeys) {
    const requiredBundles = PLATFORM_REQUIRED_SKILLS_BUNDLES[platform];
    const missingBundles = requiredBundles.filter((bundleName) => !activeBundleNames.has(bundleName));
    const rulePrefix = PLATFORM_SKILLS_RULE_PREFIXES[platform];
    const hasActiveRules = params.activeRuleIds.some((ruleId) => ruleId.startsWith(rulePrefix));
    const hasEvaluatedRules = params.evaluatedRuleIds.some((ruleId) => ruleId.startsWith(rulePrefix));

    if (missingBundles.length === 0 && hasActiveRules && hasEvaluatedRules) {
      continue;
    }

    const reasons: string[] = [];
    if (missingBundles.length > 0) {
      reasons.push(`missing_bundles=[${missingBundles.join(', ')}]`);
    }
    if (!hasActiveRules) {
      reasons.push(`active_rules_prefix=${rulePrefix} missing`);
    }
    if (!hasEvaluatedRules) {
      reasons.push(`evaluated_rules_prefix=${rulePrefix} missing`);
    }
    gaps.push(`${platform}{${reasons.join('; ')}}`);
  }

  if (gaps.length === 0) {
    return undefined;
  }

  return {
    ruleId: 'governance.skills.platform-coverage.incomplete',
    severity: 'ERROR',
    code: 'SKILLS_PLATFORM_COVERAGE_INCOMPLETE_HIGH',
    message:
      `Platform skills coverage incomplete at ${params.stage}: ${gaps.join(' | ')}. ` +
      'Activate required bundles and ensure platform skill rules are active/evaluated.',
    filePath: '.ai_evidence.json',
    matchedBy: 'SkillsPlatformCoverageGuard',
    source: 'skills-platform-coverage',
  };
};

const toCrossPlatformCriticalEnforcementBlockingFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  detectedPlatforms: DetectedPlatforms;
  skillsRules: SkillsRuleSetLoadResult['rules'];
  evaluatedRuleIds: ReadonlyArray<string>;
}): Finding | undefined => {
  const detectedPlatformKeys = (
    ['ios', 'android', 'backend', 'frontend'] as const
  ).filter((platform) => params.detectedPlatforms[platform]?.detected === true);

  if (detectedPlatformKeys.length === 0) {
    return undefined;
  }

  const evaluatedRuleIds = new Set(params.evaluatedRuleIds);
  const gaps: string[] = [];

  for (const platform of detectedPlatformKeys) {
    const rulePrefix = PLATFORM_SKILLS_RULE_PREFIXES[platform];
    const criticalSkillRules = params.skillsRules
      .filter(
        (rule) =>
          rule.id.startsWith(rulePrefix) &&
          isCriticalProfileSeverity(rule.severity)
      )
      .map((rule) => rule.id)
      .sort();

    if (criticalSkillRules.length === 0) {
      gaps.push(`${platform}{critical_profile_rules=missing}`);
      continue;
    }

    const evaluatedCriticalSkillRules = criticalSkillRules.filter((ruleId) =>
      evaluatedRuleIds.has(ruleId)
    );
    if (evaluatedCriticalSkillRules.length === 0) {
      gaps.push(
        `${platform}{critical_profile_rules=${criticalSkillRules.length}; evaluated=0}`
      );
    }
  }

  if (gaps.length === 0) {
    return undefined;
  }

  return {
    ruleId: 'governance.skills.cross-platform-critical.incomplete',
    severity: 'ERROR',
    code: 'SKILLS_CROSS_PLATFORM_CRITICAL_INCOMPLETE_S0',
    message:
      `Cross-platform critical enforcement incomplete at ${params.stage}: ${gaps.join(' | ')}. ` +
      'Ensure each detected platform has critical-profile skill rules active and evaluated.',
    filePath: '.ai_evidence.json',
    matchedBy: 'SkillsCrossPlatformCriticalGuard',
    source: 'skills-cross-platform-critical',
  };
};

export async function runPlatformGate(params: {
  policy: GatePolicy;
  auditMode?: 'gate' | 'engine';
  policyTrace?: ResolvedStagePolicy['trace'];
  scope: GateScope;
  sddShortCircuit?: boolean;
  services?: Partial<GateServices>;
  dependencies?: Partial<GateDependencies>;
}): Promise<number> {
  const git = params.services?.git ?? defaultServices.git;
  const evidence = params.services?.evidence ?? defaultServices.evidence;
  const dependencies: GateDependencies = {
    ...defaultDependencies,
    ...params.dependencies,
  };
  const repoRoot = git.resolveRepoRoot();
  const auditMode = params.auditMode ?? 'gate';
  const shouldShortCircuitSdd = params.sddShortCircuit ?? false;
  let sddDecision:
    | Pick<SddDecision, 'allowed' | 'code' | 'message'>
    | undefined;
  let sddBlockingFinding: Finding | undefined;

  if (
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
  ) {
    sddDecision = dependencies.evaluateSddForStage(
      params.policy.stage,
      repoRoot
    );
    if (!sddDecision.allowed) {
      process.stdout.write(`[pumuki][sdd] ${sddDecision.code}: ${sddDecision.message}\n`);
      sddBlockingFinding = toSddBlockingFinding(sddDecision);
      if (shouldShortCircuitSdd) {
        const emptyDetectedPlatforms: DetectedPlatforms = {};
        const emptySkillsRuleSet: SkillsRuleSetLoadResult = {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
        };
        const emptyRuleSet: RuleSet = [];
        dependencies.emitPlatformGateEvidence({
          stage: params.policy.stage,
          auditMode,
          policyTrace: params.policyTrace,
          findings: [sddBlockingFinding],
          gateOutcome: 'BLOCK',
          filesScanned: 0,
          evaluationMetrics: createEmptyEvaluationMetrics(),
          rulesCoverage: createEmptySnapshotRulesCoverage(params.policy.stage),
          repoRoot,
          detectedPlatforms: emptyDetectedPlatforms,
          skillsRuleSet: emptySkillsRuleSet,
          projectRules: emptyRuleSet,
          heuristicRules: emptyRuleSet,
          evidenceService: evidence,
          sddDecision,
        });
        return 1;
      }
    }
  }

  const facts = await dependencies.resolveFactsForGateScope({
    scope: params.scope,
    git,
  });
  const filesScanned = countScannedFilesFromFacts(facts);

  const {
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    heuristicRules,
    coverage,
    findings,
  } = dependencies.evaluatePlatformGateFindings({
    facts,
    stage: params.policy.stage,
    repoRoot,
  });
  const evaluationMetrics: SnapshotEvaluationMetrics = coverage
    ? {
      facts_total: coverage.factsTotal,
      rules_total: coverage.rulesTotal,
      baseline_rules: coverage.baselineRules,
      heuristic_rules: coverage.heuristicRules,
      skills_rules: coverage.skillsRules,
      project_rules: coverage.projectRules,
      matched_rules: coverage.matchedRules,
      unmatched_rules: coverage.unmatchedRules,
      evaluated_rule_ids: [...coverage.evaluatedRuleIds],
      matched_rule_ids: [...coverage.matchedRuleIds],
      unmatched_rule_ids: [...coverage.unmatchedRuleIds],
    }
    : createEmptyEvaluationMetrics();
  const coverageBlockingFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toRulesCoverageBlockingFinding({
        stage: params.policy.stage,
        activeRuleIds: coverage?.activeRuleIds ?? [],
        evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
        unevaluatedRuleIds: coverage?.unevaluatedRuleIds ?? [],
      })
      : undefined;
  const unsupportedSkillsMappingFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toSkillsUnsupportedAutoRulesBlockingFinding({
        stage: params.policy.stage,
        unsupportedAutoRuleIds: skillsRuleSet.unsupportedAutoRuleIds ?? [],
      })
      : undefined;
  const platformSkillsCoverageFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toPlatformSkillsCoverageBlockingFinding({
          stage: params.policy.stage,
          detectedPlatforms,
          activeBundles: skillsRuleSet.activeBundles,
          activeRuleIds: coverage?.activeRuleIds ?? [],
          evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
        })
      : undefined;
  const crossPlatformCriticalFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toCrossPlatformCriticalEnforcementBlockingFinding({
          stage: params.policy.stage,
          detectedPlatforms,
          skillsRules: skillsRuleSet.rules,
          evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
        })
      : undefined;
  const skillsScopeComplianceFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toSkillsScopeComplianceBlockingFinding({
          stage: params.policy.stage,
          facts,
          activeRuleIds: coverage?.activeRuleIds ?? [],
        evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
      })
      : undefined;
  const activeRulesEmptyForCodeChangesFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toActiveRulesEmptyForCodeChangesBlockingFinding({
        stage: params.policy.stage,
        facts,
        activeRuleIds: coverage?.activeRuleIds ?? [],
      })
      : undefined;
  const iosTestsQualityFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toIosTestsQualityBlockingFinding({
          stage: params.policy.stage,
          facts,
        })
      : undefined;
  const policyAsCodeBlockingFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toPolicyAsCodeBlockingFinding({
          stage: params.policy.stage,
          policyTrace: params.policyTrace,
        })
      : undefined;
  const degradedModeFinding =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? toDegradedModeFinding({
          stage: params.policy.stage,
          policyTrace: params.policyTrace,
        })
      : undefined;
  const degradedModeBlocks = params.policyTrace?.degraded?.action === 'block';
  const rulesCoverage = coverage
    ? {
      stage: params.policy.stage,
      active_rule_ids: [...coverage.activeRuleIds],
      evaluated_rule_ids: [...coverage.evaluatedRuleIds],
      matched_rule_ids: [...coverage.matchedRuleIds],
      unevaluated_rule_ids: [...coverage.unevaluatedRuleIds],
      ...((skillsRuleSet.unsupportedAutoRuleIds?.length ?? 0) > 0
        ? {
          unsupported_auto_rule_ids: [...(skillsRuleSet.unsupportedAutoRuleIds ?? [])],
        }
        : {}),
      counts: {
        active: coverage.activeRuleIds.length,
        evaluated: coverage.evaluatedRuleIds.length,
        matched: coverage.matchedRuleIds.length,
        unevaluated: coverage.unevaluatedRuleIds.length,
        ...((skillsRuleSet.unsupportedAutoRuleIds?.length ?? 0) > 0
          ? {
            unsupported_auto: (skillsRuleSet.unsupportedAutoRuleIds ?? []).length,
          }
          : {}),
      },
      coverage_ratio:
        coverage.activeRuleIds.length === 0
          ? 1
          : Number((coverage.evaluatedRuleIds.length / coverage.activeRuleIds.length).toFixed(6)),
    }
    : createEmptySnapshotRulesCoverage(params.policy.stage);
  const currentBranch = resolveCurrentBranch(git, repoRoot);
  const tddBddEvaluation = dependencies.enforceTddBddPolicy({
    facts,
    repoRoot,
    branch: currentBranch,
  });
  const tddBddSnapshot: TddBddSnapshot | undefined = tddBddEvaluation.snapshot.scope.in_scope
    ? tddBddEvaluation.snapshot
    : undefined;
  const hasTddBddBlockingFinding = tddBddEvaluation.findings.some(
    (finding) => finding.severity === 'ERROR' || finding.severity === 'CRITICAL'
  );
  const effectiveFindings = sddBlockingFinding
    ? [
      sddBlockingFinding,
      ...(degradedModeFinding ? [degradedModeFinding] : []),
      ...(policyAsCodeBlockingFinding ? [policyAsCodeBlockingFinding] : []),
      ...(unsupportedSkillsMappingFinding ? [unsupportedSkillsMappingFinding] : []),
      ...(platformSkillsCoverageFinding ? [platformSkillsCoverageFinding] : []),
      ...(crossPlatformCriticalFinding ? [crossPlatformCriticalFinding] : []),
      ...(skillsScopeComplianceFinding ? [skillsScopeComplianceFinding] : []),
      ...(activeRulesEmptyForCodeChangesFinding ? [activeRulesEmptyForCodeChangesFinding] : []),
      ...(iosTestsQualityFinding ? [iosTestsQualityFinding] : []),
      ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
      ...tddBddEvaluation.findings,
      ...findings,
    ]
    : unsupportedSkillsMappingFinding
      || platformSkillsCoverageFinding
      || crossPlatformCriticalFinding
      || skillsScopeComplianceFinding
      || activeRulesEmptyForCodeChangesFinding
      || iosTestsQualityFinding
      || coverageBlockingFinding
      || policyAsCodeBlockingFinding
      || degradedModeFinding
      || tddBddEvaluation.findings.length > 0
      ? [
        ...(degradedModeFinding ? [degradedModeFinding] : []),
        ...(policyAsCodeBlockingFinding ? [policyAsCodeBlockingFinding] : []),
        ...(unsupportedSkillsMappingFinding ? [unsupportedSkillsMappingFinding] : []),
        ...(platformSkillsCoverageFinding ? [platformSkillsCoverageFinding] : []),
        ...(crossPlatformCriticalFinding ? [crossPlatformCriticalFinding] : []),
        ...(skillsScopeComplianceFinding ? [skillsScopeComplianceFinding] : []),
        ...(activeRulesEmptyForCodeChangesFinding ? [activeRulesEmptyForCodeChangesFinding] : []),
        ...(iosTestsQualityFinding ? [iosTestsQualityFinding] : []),
        ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
        ...tddBddEvaluation.findings,
        ...findings,
      ]
      : findings;
  const decision = dependencies.evaluateGate([...effectiveFindings], params.policy);
  const baseGateOutcome =
    sddBlockingFinding ||
    degradedModeBlocks ||
    policyAsCodeBlockingFinding ||
    unsupportedSkillsMappingFinding ||
    platformSkillsCoverageFinding ||
    crossPlatformCriticalFinding ||
    skillsScopeComplianceFinding ||
    activeRulesEmptyForCodeChangesFinding ||
    iosTestsQualityFinding ||
    coverageBlockingFinding ||
    hasTddBddBlockingFinding
      ? 'BLOCK'
      : decision.outcome;
  const gateWaiverStage =
    params.policy.stage === 'PRE_COMMIT' ||
    params.policy.stage === 'PRE_PUSH' ||
    params.policy.stage === 'CI'
      ? params.policy.stage
      : undefined;
  const gateWaiverResult = gateWaiverStage
    ? dependencies.resolveActiveGateWaiver({
        repoRoot,
        stage: gateWaiverStage,
        branch: currentBranch,
      })
    : ({
        kind: 'none',
        path: '.pumuki/waivers/gate.json',
      } as const);
  let gateWaiverFinding: Finding | undefined;
  let gateOutcome = baseGateOutcome;
  if (baseGateOutcome === 'BLOCK' && gateWaiverStage) {
    if (gateWaiverResult.kind === 'applied') {
      gateWaiverFinding = toGateWaiverAppliedFinding({
        stage: gateWaiverStage,
        waiver: gateWaiverResult.waiver,
      });
      gateOutcome = 'PASS';
    } else if (gateWaiverResult.kind === 'expired') {
      gateWaiverFinding = toGateWaiverExpiredFinding({
        stage: gateWaiverStage,
        waiver: gateWaiverResult.waiver,
      });
    } else if (gateWaiverResult.kind === 'invalid') {
      gateWaiverFinding = toGateWaiverInvalidFinding({
        stage: gateWaiverStage,
        reason: gateWaiverResult.reason,
      });
    }
  }
  const findingsWithWaiver = gateWaiverFinding
    ? [...effectiveFindings, gateWaiverFinding]
    : effectiveFindings;
  const shadowFlagRaw = process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED?.trim().toLowerCase();
  const isMemoryShadowEnabled = shadowFlagRaw === '1' || shadowFlagRaw === 'true';
  let memoryShadowRecommendation: OperationalMemoryShadowRecommendation | undefined;
  if (isMemoryShadowEnabled) {
    try {
      memoryShadowRecommendation = dependencies.buildMemoryShadowRecommendation({
        findings: findingsWithWaiver,
        ...(tddBddSnapshot ? { tddBddSnapshot } : {}),
      });
    } catch (error) {
      const rawReason = error instanceof Error ? error.message : String(error);
      const reason = rawReason.trim().replace(/\s+/g, ' ');
      process.stdout.write(
        `[pumuki][memory-shadow] unavailable reason=${reason.length > 0 ? reason : 'unknown_error'}\n`
      );
    }
  }
  const memoryShadow:
    | {
      recommended_outcome: GateOutcome;
      actual_outcome: GateOutcome;
      confidence: number;
      reason_codes: string[];
    }
    | undefined =
    memoryShadowRecommendation
      ? {
        recommended_outcome:
          memoryShadowRecommendation.recommendedOutcome === 'ALLOW'
            ? 'PASS'
            : memoryShadowRecommendation.recommendedOutcome,
        actual_outcome: gateOutcome,
        confidence: memoryShadowRecommendation.confidence,
        reason_codes: [...memoryShadowRecommendation.reasonCodes],
      }
      : undefined;

  if (memoryShadowRecommendation) {
    process.stdout.write(
      `[pumuki][memory-shadow] recommended=${memoryShadowRecommendation.recommendedOutcome}` +
      ` confidence=${memoryShadowRecommendation.confidence.toFixed(2)}` +
      ` reasons=${memoryShadowRecommendation.reasonCodes.join(',')}\n`
    );
  }

  dependencies.emitPlatformGateEvidence({
    stage: params.policy.stage,
    auditMode,
    policyTrace: params.policyTrace,
    findings: findingsWithWaiver,
    gateOutcome,
    filesScanned,
    evaluationMetrics,
    rulesCoverage,
    ...(tddBddSnapshot ? { tddBdd: tddBddSnapshot } : {}),
    ...(memoryShadow ? { memoryShadow } : {}),
    repoRoot,
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    heuristicRules,
    evidenceService: evidence,
    sddDecision,
  });

  if (gateOutcome === 'BLOCK') {
    dependencies.printGateFindings(findingsWithWaiver);
    return 1;
  }

  return 0;
}
