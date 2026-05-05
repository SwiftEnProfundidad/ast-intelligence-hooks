import { evaluateGate } from '../../core/gate/evaluateGate';
import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
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
import {
  evaluateAstIntelligenceDualValidation,
  evaluatePlatformGateFindings,
  type AstIntelligenceDualValidationResult,
} from './runPlatformGateEvaluation';
import {
  countScannedFilesFromFacts,
  resolveFactsForGateScope,
  type GateScope,
} from './runPlatformGateFacts';
import { evaluateBrownfieldHotspotFindings } from './brownfieldHotspots';
import { emitPlatformGateEvidence } from './runPlatformGateEvidence';
import { printGateFindings } from './runPlatformGateOutput';
import { evaluateSddPolicy, type SddDecision } from '../sdd';
import type { SnapshotEvaluationMetrics, SnapshotRulesCoverage } from '../evidence/schema';
import { createEmptyEvaluationMetrics } from '../evidence/evaluationMetrics';
import { createEmptySnapshotRulesCoverage } from '../evidence/rulesCoverage';
import { enforceTddBddPolicy } from '../tdd/enforcement';
import type { TddBddSnapshot } from '../tdd/types';
import { applyTddBddEnforcement } from '../policy/tddBddEnforcement';
import { collectAiGateRepoPolicyFindings } from './aiGateRepoPolicyFindings';
import {
  filterFactsByPathPrefixes,
  resolveGateScopePathPrefixesFromEnv,
} from './filterFactsByPathPrefixes';
import {
  DEFAULT_MEMORY_SHADOW_DISPLAY_PRECISION,
  DEGRADED_MODE_ACTION_ALLOW,
  DEGRADED_MODE_ACTION_BLOCK,
  DEFAULT_GATE_AUDIT_MODE,
  DEFAULT_RULES_COVERAGE_RATIO_DECIMALS,
  LIFECYCLE_GATE_STAGES,
  MAX_IOS_TEST_QUALITY_SAMPLE_FILES,
  MAX_OBSERVED_CODE_PATHS_SAMPLE,
  MAX_SCOPE_SAMPLE_PATHS,
  LIST_SEPARATOR,
  MEMORY_SHADOW_CONFIDENCE_ALLOW,
  MEMORY_SHADOW_CONFIDENCE_BLOCK,
  MEMORY_SHADOW_CONFIDENCE_WARN,
  MEMORY_SHADOW_CONFIDENCE_WARN_ADVISORY,
} from '../gate/runPlatformGateConfig';
import type { Severity } from '../../core/rules/Severity';

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
  evaluateBrownfieldHotspotFindings: typeof evaluateBrownfieldHotspotFindings;
  resolveFactsForGateScope: typeof resolveFactsForGateScope;
  emitPlatformGateEvidence: typeof emitPlatformGateEvidence;
  printGateFindings: typeof printGateFindings;
  enforceTddBddPolicy: typeof enforceTddBddPolicy;
  evaluateAstIntelligenceDualValidation: typeof evaluateAstIntelligenceDualValidation;
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

const SEVERITY_CRITICAL: Severity = 'CRITICAL';
const SEVERITY_ERROR: Severity = 'ERROR';
const SEVERITY_WARN: Severity = 'WARN';
const buildDefaultMemoryShadowRecommendation = (params: {
  findings: ReadonlyArray<Finding>;
  tddBddSnapshot?: TddBddSnapshot;
}): OperationalMemoryShadowRecommendation | undefined => {
  const hasCritical = params.findings.some(
    (finding) => finding.severity === SEVERITY_CRITICAL
  );
  const hasError = params.findings.some((finding) => finding.severity === SEVERITY_ERROR);
  const hasWarn = params.findings.some((finding) => finding.severity === SEVERITY_WARN);
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
  } else if (params.tddBddSnapshot?.status === 'advisory') {
    reasonCodes.push('tdd_bdd.advisory');
  } else if (params.tddBddSnapshot?.status === 'passed') {
    reasonCodes.push('tdd_bdd.passed');
  }

  if (hasCritical || hasError || params.tddBddSnapshot?.status === 'blocked') {
    return {
      recommendedOutcome: 'BLOCK',
      confidence: MEMORY_SHADOW_CONFIDENCE_BLOCK,
      reasonCodes,
    };
  }
  if (hasWarn) {
    return {
      recommendedOutcome: 'WARN',
      confidence: MEMORY_SHADOW_CONFIDENCE_WARN,
      reasonCodes,
    };
  }
  if (params.tddBddSnapshot?.status === 'advisory') {
    return {
      recommendedOutcome: 'WARN',
      confidence: MEMORY_SHADOW_CONFIDENCE_WARN_ADVISORY,
      reasonCodes,
    };
  }
  return {
    recommendedOutcome: 'ALLOW',
    confidence: MEMORY_SHADOW_CONFIDENCE_ALLOW,
    reasonCodes,
  };
};

const defaultDependencies: GateDependencies = {
  evaluateGate,
  evaluatePlatformGateFindings,
  evaluateBrownfieldHotspotFindings,
  resolveFactsForGateScope,
  emitPlatformGateEvidence,
  printGateFindings,
  enforceTddBddPolicy,
  evaluateAstIntelligenceDualValidation,
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

const readSymbolicBranchRef = (git: IGitService, repoRoot: string): string | null => {
  try {
    const symbolicBranch = git.runGit(['symbolic-ref', '--short', 'HEAD'], repoRoot).trim();
    return symbolicBranch.length > 0 ? symbolicBranch : null;
  } catch {
    return null;
  }
};

const resolveCurrentBranch = (git: IGitService, repoRoot: string): string | null => {
  const symbolic = readSymbolicBranchRef(git, repoRoot);
  if (symbolic !== null) {
    return symbolic;
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

const STRICT_ENFORCEMENT_STAGES = new Set<GateStage>([
  'PRE_WRITE',
  'PRE_COMMIT',
  'PRE_PUSH',
  'CI',
]);

const isStrictEnforcementStage = (
  stage: GateStage
): stage is Exclude<GateStage, 'STAGED'> => STRICT_ENFORCEMENT_STAGES.has(stage);

const isLifecycleGateStage = (
  stage: GateStage
): stage is 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' =>
  stage === 'PRE_COMMIT' || stage === 'PRE_PUSH' || stage === 'CI';

const toRulesCoverageBlockingFinding = (params: {
  stage: Exclude<GateStage, 'STAGED'>;
  activeRuleIds: ReadonlyArray<string>;
  evaluatedRuleIds: ReadonlyArray<string>;
  unevaluatedRuleIds: ReadonlyArray<string>;
}): Finding | undefined => {
  if (params.unevaluatedRuleIds.length === 0) {
    return undefined;
  }
  const active = params.activeRuleIds.length;
  const evaluated = params.evaluatedRuleIds.length;
  const coverageRatio =
    active === 0
      ? 1
      : Number((evaluated / active).toFixed(DEFAULT_RULES_COVERAGE_RATIO_DECIMALS));
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
  stage: Exclude<GateStage, 'STAGED'>;
  filesScanned: number;
  unsupportedAutoRuleIds: ReadonlyArray<string>;
  unsupportedDetectorRuleIds?: ReadonlyArray<string>;
}): Finding | undefined => {
  if (params.filesScanned === 0) {
    return undefined;
  }

  const unsupportedRuleIds = [...new Set(params.unsupportedAutoRuleIds)].sort();
  if (unsupportedRuleIds.length === 0) {
    return undefined;
  }

  const unsupportedRuleIdsToken = unsupportedRuleIds.join(LIST_SEPARATOR);

  return {
    ruleId: 'governance.skills.detector-mapping.incomplete',
    severity: 'ERROR',
    code: 'SKILLS_DETECTOR_MAPPING_INCOMPLETE_HIGH',
    message:
      `Skills detector mapping incomplete at ${params.stage}: ` +
      `unsupported_auto_rule_ids=[${unsupportedRuleIdsToken}]. ` +
      'Map every stage-applicable AUTO skill rule to an intelligent AST detector before proceeding.',
    filePath: '.ai_evidence.json',
    matchedBy: 'SkillsDetectorMappingGuard',
    source: 'skills-detector-mapping',
  };
};

const toSkillsUnsupportedDetectorRulesBlockingFinding = (params: {
  stage: Exclude<GateStage, 'STAGED'>;
  filesScanned: number;
  unsupportedDetectorRuleIds: ReadonlyArray<string>;
  registryTotal?: number;
  registryDeclarative?: number;
}): Finding | undefined => {
  if (params.filesScanned === 0) {
    return undefined;
  }

  const unsupportedRuleIds = [...new Set(params.unsupportedDetectorRuleIds)].sort();
  if (unsupportedRuleIds.length === 0) {
    return undefined;
  }

  const unsupportedRuleIdsSample = unsupportedRuleIds
    .slice(0, MAX_SCOPE_SAMPLE_PATHS)
    .join(LIST_SEPARATOR);
  const remainingRuleIds = Math.max(0, unsupportedRuleIds.length - MAX_SCOPE_SAMPLE_PATHS);
  return {
    ruleId: 'governance.skills.global-enforcement.incomplete',
    severity: 'ERROR',
    code: 'SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_CRITICAL',
    message:
      `Global skills enforcement incomplete at ${params.stage}: ` +
      `registry_total=${params.registryTotal ?? 'n/a'} ` +
      `registry_declarative=${params.registryDeclarative ?? 'n/a'} ` +
      `unsupported_detector=${unsupportedRuleIds.length} ` +
      `unsupported_detector_rule_ids_sample=[${unsupportedRuleIdsSample}] ` +
      `unsupported_detector_rule_ids_remaining=${remainingRuleIds}. ` +
      'Every hard skill rule must be enforced by AST detector or fail closed before this stage can proceed.',
    filePath: '.ai_evidence.json',
    matchedBy: 'SkillsGlobalEnforcementGuard',
    source: 'skills-global-enforcement',
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
    'ios-swift-testing-guidelines',
    'ios-core-data-guidelines',
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

const isSkillsContractCarrierPath = (path: string): boolean => {
  const normalized = toNormalizedPath(path).toLowerCase();
  return (
    normalized === 'agents.md' ||
    normalized === 'skills.lock.json' ||
    normalized === 'skills.sources.json' ||
    normalized.startsWith('vendor/skills/') ||
    normalized.startsWith('docs/codex-skills/') ||
    normalized === '.pumuki/policy-as-code.json'
  );
};

const isSkillsEnforcementImplementationPath = (path: string): boolean => {
  const normalized = toNormalizedPath(path).toLowerCase();
  return (
    normalized.endsWith('.feature') ||
    normalized.startsWith('core/facts/') ||
    normalized.startsWith('core/rules/presets/heuristics/') ||
    normalized.startsWith('integrations/config/') ||
    normalized === 'integrations/git/runplatformgate.ts' ||
    normalized === 'integrations/git/__tests__/runplatformgate.test.ts' ||
    normalized === 'integrations/git/gitatomicity.ts' ||
    normalized === 'integrations/git/__tests__/gitatomicity.test.ts' ||
    normalized === 'pumuki-reset-master-plan.md' ||
    normalized === 'package.json' ||
    normalized === 'package-lock.json' ||
    isSkillsContractCarrierPath(normalized)
  );
};

const isSkillsEnforcementRemediationDiff = (
  paths: ReadonlyArray<string>
): boolean => {
  if (paths.length === 0) {
    return false;
  }

  const normalizedPaths = paths.map((path) => toNormalizedPath(path));
  const touchesDetectorSurface = normalizedPaths.some((path) =>
    path.startsWith('core/facts/') ||
    path.startsWith('core/rules/presets/heuristics/') ||
    path.startsWith('integrations/config/') ||
    path === 'integrations/git/runplatformgate.ts' ||
    path === 'integrations/git/__tests__/runplatformgate.test.ts' ||
    path === 'integrations/git/gitatomicity.ts' ||
    path === 'integrations/git/__tests__/gitatomicity.test.ts'
  );
  const touchesLockOrScenario = normalizedPaths.some((path) =>
    path === 'skills.lock.json' || path.endsWith('.feature')
  );
  return (
    touchesDetectorSurface &&
    touchesLockOrScenario &&
    normalizedPaths.every((path) => isSkillsEnforcementImplementationPath(path))
  );
};

const collectStagedPaths = (git: IGitService, repoRoot: string): ReadonlyArray<string> => {
  try {
    return git.runGit(['diff', '--cached', '--name-only'], repoRoot)
      .split('\n')
      .map((line) => toNormalizedPath(line))
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
};

const BASELINE_BRANCH_REFS = [
  'origin/develop',
  'origin/main',
  'upstream/develop',
  'upstream/main',
  'develop',
  'main',
];

const collectPrePushChangedPaths = (
  git: IGitService,
  repoRoot: string
): ReadonlyArray<string> => {
  for (const baselineRef of BASELINE_BRANCH_REFS) {
    try {
      git.runGit(['rev-parse', '--verify', baselineRef], repoRoot);
      const mergeBase = git.runGit(['merge-base', baselineRef, 'HEAD'], repoRoot).trim();
      if (mergeBase.length === 0) {
        continue;
      }
      return git.runGit(['diff', '--name-only', `${mergeBase}..HEAD`], repoRoot)
        .split('\n')
        .map((line) => toNormalizedPath(line).toLowerCase())
        .filter((line) => line.length > 0);
    } catch {
      continue;
    }
  }
  return [];
};

const toBlockingFindingsForPaths = (
  findings: ReadonlyArray<Finding>,
  paths: ReadonlySet<string>
): ReadonlyArray<Finding> => {
  return findings.filter((finding) => {
    if (finding.severity !== 'ERROR' && finding.severity !== 'CRITICAL') {
      return false;
    }
    const path = finding.filePath ? toNormalizedPath(finding.filePath) : '';
    return path.length > 0 && paths.has(path);
  });
};

const buildHeadFactsForPaths = (params: {
  git: IGitService;
  repoRoot: string;
  paths: ReadonlyArray<string>;
}): ReadonlyArray<Fact> => {
  const facts: Fact[] = [];
  for (const path of params.paths) {
    try {
      const content = params.git.runGit(['show', `HEAD:${path}`], params.repoRoot);
      facts.push({
        kind: 'FileChange',
        path,
        changeType: 'modified',
        source: 'git:staged:HEAD',
      });
      facts.push({
        kind: 'FileContent',
        path,
        content,
        source: 'git:staged:HEAD',
      });
    } catch {
      continue;
    }
  }
  return facts;
};

const toRemediationProgressAllowedFinding = (params: {
  stage: Exclude<GateStage, 'STAGED'>;
  currentBlockingCount: number;
  previousBlockingCount: number;
  paths: ReadonlyArray<string>;
  ruleIds: ReadonlyArray<string>;
}): Finding => {
  const samplePaths = params.paths.slice(0, MAX_SCOPE_SAMPLE_PATHS).join(LIST_SEPARATOR);
  const sampleRuleIds = params.ruleIds.slice(0, MAX_SCOPE_SAMPLE_PATHS).join(LIST_SEPARATOR);
  return {
    ruleId: 'governance.remediation.progress.allowed',
    severity: 'INFO',
    code: 'REMEDIATION_PROGRESS_ALLOWED',
    message:
      `Remediation progress allowed at ${params.stage}: ` +
      `previous_blocking_findings=${params.previousBlockingCount} ` +
      `current_blocking_findings=${params.currentBlockingCount} ` +
      `paths=[${samplePaths}] remediated_rule_ids=[${sampleRuleIds}]. ` +
      'Feature work remains blocked until global skills enforcement is complete.',
    filePath: '.ai_evidence.json',
    matchedBy: 'RemediationProgressGuard',
    source: 'remediation-progress',
    blocking: false,
  };
};

const toRemediationProgressAdvisoryFinding = (finding: Finding): Finding => ({
  ...finding,
  severity: 'INFO',
  code:
    finding.code === 'SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_CRITICAL'
      ? 'SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_REMEDIATION_ADVISORY'
      : finding.code === 'TDD_BDD_EVIDENCE_STALE'
        ? 'TDD_BDD_EVIDENCE_STALE_REMEDIATION_ADVISORY'
        : finding.code,
  message:
    `${finding.message} Remediation progress mode converted this blocker to advisory ` +
    'because the staged diff reduces existing supported-detector findings and introduces none.',
  blocking: false,
});

const shouldAugmentStagedSkillsContractFactsWithRepoFacts = (params: {
  scope: GateScope;
  facts: ReadonlyArray<Fact>;
  stagedPaths: ReadonlyArray<string>;
}): boolean => {
  if (params.scope.kind !== 'staged') {
    return false;
  }
  if (collectObservedCodePathsFromFacts(params.facts).length > 0) {
    return false;
  }
  return params.stagedPaths.some((path) => isSkillsContractCarrierPath(path));
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

const isXCTestUiOrPerformanceCompatibilitySource = (content: string): boolean => {
  return /\bXCUIApplication\b|\bXCTMetric\b|\bmeasure\s*(?:\(|\{)/.test(content);
};

const hasMakeSUTPattern = (content: string): boolean => /\bmakeSUT\s*\(/.test(content);

const hasTrackForMemoryLeaksPattern = (content: string): boolean =>
  /\btrackForMemoryLeaks\s*\(/.test(content);

const toIosTestsQualityBlockingFinding = (params: {
  stage: Exclude<GateStage, 'STAGED'>;
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
    if (isXCTestUiOrPerformanceCompatibilitySource(testFile.content)) {
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

  const sampleFiles = invalidFiles
    .slice(0, MAX_IOS_TEST_QUALITY_SAMPLE_FILES)
    .join(' | ');
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
  stage: Exclude<GateStage, 'STAGED'>;
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
  const samplePaths = codePaths.slice(0, MAX_OBSERVED_CODE_PATHS_SAMPLE).join(', ');
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
  stage: Exclude<GateStage, 'STAGED'>;
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
    const samplePaths = scopePaths.slice(0, MAX_SCOPE_SAMPLE_PATHS).join(', ');
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
  stage: Exclude<GateStage, 'STAGED'>;
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
  stage: Exclude<GateStage, 'STAGED'>;
  policyTrace?: ResolvedStagePolicy['trace'];
}): Finding | undefined => {
  const degraded = params.policyTrace?.degraded;
  if (!degraded?.enabled) {
    return undefined;
  }
  if (degraded.action === DEGRADED_MODE_ACTION_BLOCK) {
    return {
      ruleId: 'governance.degraded-mode.blocked',
      severity: 'ERROR',
      code: degraded.code,
      message:
        `Degraded mode is active at ${params.stage} with fail-closed action=${DEGRADED_MODE_ACTION_BLOCK}. ` +
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
      `Degraded mode is active at ${params.stage} with fail-open action=${DEGRADED_MODE_ACTION_ALLOW}. ` +
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
  stage: Exclude<GateStage, 'STAGED'>;
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
  stage: Exclude<GateStage, 'STAGED'>;
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

const shouldBlockFromFinding = (finding: Finding | undefined): boolean => {
  if (!finding) {
    return false;
  }
  return finding.severity === 'ERROR' || finding.severity === 'CRITICAL';
};

const applySkillsFindingEnforcement = (
  finding: Finding | undefined
): Finding | undefined => {
  if (!finding) {
    return undefined;
  }
  return {
    ...finding,
    severity: 'ERROR',
  };
};

export async function runPlatformGate(params: {
  policy: GatePolicy;
  auditMode?: 'gate' | 'engine';
  policyTrace?: ResolvedStagePolicy['trace'];
  scope: GateScope;
  silent?: boolean;
  sddShortCircuit?: boolean;
  sddDecisionOverride?: Pick<SddDecision, 'allowed' | 'code' | 'message'>;
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
  const auditMode = params.auditMode ?? DEFAULT_GATE_AUDIT_MODE;
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
    sddDecision = params.sddDecisionOverride
      ?? dependencies.evaluateSddForStage(
        params.policy.stage,
        repoRoot
      );
    if (!sddDecision.allowed) {
      if (params.silent !== true) {
        process.stdout.write(`[pumuki][sdd] ${sddDecision.code}: ${sddDecision.message}\n`);
      }
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

  const gateScopePathPrefixes = resolveGateScopePathPrefixesFromEnv();
  const facts = filterFactsByPathPrefixes(
    await dependencies.resolveFactsForGateScope({
      scope: params.scope,
      git,
    }),
    gateScopePathPrefixes
  );
  const stagedPaths = collectStagedPaths(git, repoRoot);
  const factsForPlatformEvaluation = shouldAugmentStagedSkillsContractFactsWithRepoFacts({
    scope: params.scope,
    facts,
    stagedPaths,
  })
    ? [
      ...facts,
      ...(await dependencies.resolveFactsForGateScope({
        scope: {
          kind: 'repo',
        },
        git,
      })),
    ]
    : facts;
  const filesScanned = countScannedFilesFromFacts(factsForPlatformEvaluation);
  const observedCodePaths = collectObservedCodePathsFromFacts(facts);

  const platformEvaluation = dependencies.evaluatePlatformGateFindings({
    facts: factsForPlatformEvaluation,
    stage: params.policy.stage,
    repoRoot,
  });
  const aiGateRepoPolicyFindings = collectAiGateRepoPolicyFindings({
    repoRoot,
    stage: params.policy.stage,
  });
  const {
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    heuristicRules,
    coverage,
    evaluationFacts = factsForPlatformEvaluation,
    findings: ruleEngineFindings,
  } = platformEvaluation;
  const findings = [...aiGateRepoPolicyFindings, ...ruleEngineFindings];
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
    isStrictEnforcementStage(params.policy.stage)
      ? toRulesCoverageBlockingFinding({
        stage: params.policy.stage,
        activeRuleIds: coverage?.activeRuleIds ?? [],
        evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
        unevaluatedRuleIds: coverage?.unevaluatedRuleIds ?? [],
      })
      : undefined;
  const unsupportedSkillsMappingFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toSkillsUnsupportedAutoRulesBlockingFinding({
        stage: params.policy.stage,
        filesScanned,
        unsupportedAutoRuleIds: skillsRuleSet.unsupportedAutoRuleIds ?? [],
        unsupportedDetectorRuleIds: skillsRuleSet.unsupportedDetectorRuleIds ?? [],
      })
      : undefined;
  const effectiveUnsupportedSkillsMappingFinding = applySkillsFindingEnforcement(
    unsupportedSkillsMappingFinding
  );
  const unsupportedDetectorSkillsFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toSkillsUnsupportedDetectorRulesBlockingFinding({
          stage: params.policy.stage,
          filesScanned,
          unsupportedDetectorRuleIds: skillsRuleSet.unsupportedDetectorRuleIds ?? [],
          registryTotal: skillsRuleSet.registryCoverage?.registryTotals.total,
          registryDeclarative: skillsRuleSet.registryCoverage?.registryTotals.declarative,
        })
      : undefined;
  const effectiveUnsupportedDetectorSkillsFinding = applySkillsFindingEnforcement(
    unsupportedDetectorSkillsFinding
  );
  const platformSkillsCoverageFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toPlatformSkillsCoverageBlockingFinding({
          stage: params.policy.stage,
          detectedPlatforms,
          activeBundles: skillsRuleSet.activeBundles,
          activeRuleIds: coverage?.activeRuleIds ?? [],
          evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
        })
      : undefined;
  const effectivePlatformSkillsCoverageInput = applySkillsFindingEnforcement(
    platformSkillsCoverageFinding
  );
  const crossPlatformCriticalFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toCrossPlatformCriticalEnforcementBlockingFinding({
          stage: params.policy.stage,
          detectedPlatforms,
          skillsRules: skillsRuleSet.rules,
          evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
        })
      : undefined;
  const effectiveCrossPlatformCriticalInput = applySkillsFindingEnforcement(
    crossPlatformCriticalFinding
  );
  const skillsScopeComplianceFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toSkillsScopeComplianceBlockingFinding({
          stage: params.policy.stage,
          facts,
          activeRuleIds: coverage?.activeRuleIds ?? [],
        evaluatedRuleIds: coverage?.evaluatedRuleIds ?? [],
      })
      : undefined;
  const effectiveSkillsScopeComplianceInput = applySkillsFindingEnforcement(
    skillsScopeComplianceFinding
  );
  const activeRulesEmptyForCodeChangesFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toActiveRulesEmptyForCodeChangesBlockingFinding({
        stage: params.policy.stage,
        facts,
        activeRuleIds: coverage?.activeRuleIds ?? [],
      })
      : undefined;
  const iosTestsQualityFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toIosTestsQualityBlockingFinding({
          stage: params.policy.stage,
          facts,
        })
      : undefined;
  const effectiveIosTestsQualityFinding = applySkillsFindingEnforcement(
    iosTestsQualityFinding
  );
  const policyAsCodeBlockingFinding =
    isStrictEnforcementStage(params.policy.stage)
      ? toPolicyAsCodeBlockingFinding({
          stage: params.policy.stage,
          policyTrace: params.policyTrace,
        })
      : undefined;
  const degradedModeFinding = isLifecycleGateStage(params.policy.stage)
    && LIFECYCLE_GATE_STAGES.includes(params.policy.stage)
    ? toDegradedModeFinding({
        stage: params.policy.stage,
        policyTrace: params.policyTrace,
      })
    : undefined;
  const astIntelligenceDualValidation:
    | AstIntelligenceDualValidationResult
    | undefined =
    isStrictEnforcementStage(params.policy.stage)
      ? dependencies.evaluateAstIntelligenceDualValidation({
          stage: params.policy.stage,
          skillsRules: skillsRuleSet.rules,
          facts: evaluationFacts,
          legacyFindings: findings,
        })
      : undefined;
  const astIntelligenceDualFinding = astIntelligenceDualValidation?.finding;
  if (astIntelligenceDualValidation && astIntelligenceDualValidation.mode !== 'off') {
    const summary = astIntelligenceDualValidation.summary;
    if (params.silent !== true) {
      process.stdout.write(
        `[pumuki][ast-intelligence] mode=${astIntelligenceDualValidation.mode}` +
        ` mapped_rules=${summary.mapped_rules}` +
        ` compared_rules=${summary.compared_rules}` +
        ` divergences=${summary.divergences}` +
        ` false_positives=${summary.false_positives}` +
        ` false_negatives=${summary.false_negatives}` +
        ` latency_ms=${summary.latency_ms}` +
        ` languages=[${summary.languages.join(',') || 'none'}]\n`
      );
    }
  }
  const degradedModeBlocks =
    params.policyTrace?.degraded?.action === DEGRADED_MODE_ACTION_BLOCK;
  const rulesCoverage: SnapshotRulesCoverage = coverage
    ? {
      stage: params.policy.stage,
      contract: skillsRuleSet.registryCoverage?.contract ?? 'AUTO_RUNTIME_RULES_FOR_STAGE',
      scope_note:
        'rules_coverage reports AUTO runtime rules applicable to this stage; it does not claim full DECLARATIVE registry execution.',
      active_rule_ids: [...coverage.activeRuleIds],
      evaluated_rule_ids: [...coverage.evaluatedRuleIds],
      matched_rule_ids: [...coverage.matchedRuleIds],
      unevaluated_rule_ids: [...coverage.unevaluatedRuleIds],
      ...(skillsRuleSet.registryCoverage
        ? {
          registry_totals: skillsRuleSet.registryCoverage.registryTotals,
          stage_applicable_auto_rule_ids: [
            ...skillsRuleSet.registryCoverage.stageApplicableAutoRuleIds,
          ],
          declarative_rule_ids: [...skillsRuleSet.registryCoverage.declarativeRuleIds],
          declarative_excluded_reason:
            skillsRuleSet.registryCoverage.excludedDeclarativeReason,
        }
        : {}),
      ...((skillsRuleSet.unsupportedAutoRuleIds?.length ?? 0) > 0
        ? {
          unsupported_auto_rule_ids: [...(skillsRuleSet.unsupportedAutoRuleIds ?? [])],
        }
        : {}),
      ...((skillsRuleSet.unsupportedDetectorRuleIds?.length ?? 0) > 0
        ? {
          unsupported_detector_rule_ids: [
            ...(skillsRuleSet.unsupportedDetectorRuleIds ?? []),
          ],
        }
        : {}),
      counts: {
        active: coverage.activeRuleIds.length,
        evaluated: coverage.evaluatedRuleIds.length,
        matched: coverage.matchedRuleIds.length,
        unevaluated: coverage.unevaluatedRuleIds.length,
        ...(skillsRuleSet.registryCoverage
          ? {
            registry_total: skillsRuleSet.registryCoverage.registryTotals.total,
            registry_auto: skillsRuleSet.registryCoverage.registryTotals.auto,
            registry_declarative:
              skillsRuleSet.registryCoverage.registryTotals.declarative,
            stage_applicable_auto:
              skillsRuleSet.registryCoverage.stageApplicableAutoRuleIds.length,
          }
          : {}),
        ...((skillsRuleSet.unsupportedAutoRuleIds?.length ?? 0) > 0
          ? {
            unsupported_auto: (skillsRuleSet.unsupportedAutoRuleIds ?? []).length,
          }
          : {}),
        ...((skillsRuleSet.unsupportedDetectorRuleIds?.length ?? 0) > 0
          ? {
            unsupported_detector:
              (skillsRuleSet.unsupportedDetectorRuleIds ?? []).length,
          }
          : {}),
      },
      coverage_ratio:
        coverage.activeRuleIds.length === 0
          ? 1
          : Number(
              (
                coverage.evaluatedRuleIds.length / coverage.activeRuleIds.length
              ).toFixed(DEFAULT_RULES_COVERAGE_RATIO_DECIMALS)
            ),
      auto_runtime_coverage_ratio:
        coverage.activeRuleIds.length === 0
          ? 1
          : Number(
              (
                coverage.evaluatedRuleIds.length / coverage.activeRuleIds.length
              ).toFixed(DEFAULT_RULES_COVERAGE_RATIO_DECIMALS)
            ),
      semantic_enforcement_ratio: skillsRuleSet.registryCoverage
        ? Number(
            (
              Math.max(
                0,
                skillsRuleSet.registryCoverage.registryTotals.total -
                  (skillsRuleSet.unsupportedDetectorRuleIds ?? []).length
              ) / Math.max(1, skillsRuleSet.registryCoverage.registryTotals.total)
            ).toFixed(DEFAULT_RULES_COVERAGE_RATIO_DECIMALS)
          )
        : 1,
      global_skills_enforcement: {
        status:
          (skillsRuleSet.unsupportedDetectorRuleIds?.length ?? 0) === 0
            ? 'enforced'
            : coverage.activeRuleIds.length > 0
              ? 'partially_enforced'
              : 'unsupported',
        registry_total: skillsRuleSet.registryCoverage?.registryTotals.total ?? 0,
        detector_supported: Math.max(
          0,
          (skillsRuleSet.registryCoverage?.registryTotals.total ?? 0) -
            (skillsRuleSet.unsupportedDetectorRuleIds ?? []).length
        ),
        declarative_only:
          skillsRuleSet.registryCoverage?.registryTotals.declarative ?? 0,
        unsupported_detector:
          (skillsRuleSet.unsupportedDetectorRuleIds ?? []).length,
      },
    }
    : createEmptySnapshotRulesCoverage(params.policy.stage);
  const brownfieldHotspotFindings = dependencies.evaluateBrownfieldHotspotFindings({
    repoRoot,
    stage: params.policy.stage,
    facts,
  });
  const currentBranch = resolveCurrentBranch(git, repoRoot);
  const tddBddEvaluation = applyTddBddEnforcement(
    dependencies.enforceTddBddPolicy({
      facts,
      repoRoot,
      branch: currentBranch,
    })
  );
  const tddBddSnapshot: TddBddSnapshot | undefined = tddBddEvaluation.snapshot.scope.in_scope
    ? tddBddEvaluation.snapshot
    : undefined;
  const hasTddBddBlockingFinding = tddBddEvaluation.findings.some(
    (finding) => finding.severity === 'ERROR' || finding.severity === 'CRITICAL'
  );
  const hasNativeBlockingFinding = findings.some(
    (finding) => finding.severity === 'ERROR' || finding.severity === 'CRITICAL'
  );
  const stagedCodePaths = stagedPaths.filter((path) => isObservedCodePath(path));
  const stagedCodePathSet = new Set(stagedCodePaths);
  const currentBlockingFindingsForStagedPaths = toBlockingFindingsForPaths(
    findings,
    stagedCodePathSet
  );
  const previousFactsForStagedPaths =
    isStrictEnforcementStage(params.policy.stage) &&
    params.scope.kind === 'staged' &&
    stagedCodePaths.length > 0 &&
    currentBlockingFindingsForStagedPaths.length === 0
      ? buildHeadFactsForPaths({
          git,
          repoRoot,
          paths: stagedCodePaths,
        })
      : [];
  const previousEvaluationForStagedPaths =
    previousFactsForStagedPaths.length > 0
      ? dependencies.evaluatePlatformGateFindings({
          facts: previousFactsForStagedPaths,
          stage: params.policy.stage,
          repoRoot,
        })
      : undefined;
  const previousBlockingFindingsForStagedPaths = previousEvaluationForStagedPaths
    ? toBlockingFindingsForPaths(
        previousEvaluationForStagedPaths.findings,
        stagedCodePathSet
      )
    : [];
  const remediationProgressFinding =
    previousBlockingFindingsForStagedPaths.length > currentBlockingFindingsForStagedPaths.length &&
    currentBlockingFindingsForStagedPaths.length === 0
      ? toRemediationProgressAllowedFinding({
          stage: params.policy.stage as Exclude<GateStage, 'STAGED'>,
          currentBlockingCount: currentBlockingFindingsForStagedPaths.length,
          previousBlockingCount: previousBlockingFindingsForStagedPaths.length,
          paths: stagedCodePaths,
          ruleIds: [
            ...new Set(
              previousBlockingFindingsForStagedPaths.map((finding) => finding.ruleId)
            ),
          ].sort(),
        })
      : undefined;
  const skillsEnforcementRemediationDiff = isSkillsEnforcementRemediationDiff(
    stagedPaths.length > 0
      ? stagedPaths
      : params.policy.stage === 'PRE_PUSH'
        ? collectPrePushChangedPaths(git, repoRoot)
        : []
  );
  const remediationProgressAllowsGlobalGap =
    remediationProgressFinding !== undefined ||
    (skillsEnforcementRemediationDiff &&
      !hasNativeBlockingFinding &&
      !hasTddBddBlockingFinding);
  const effectiveTddBddFindings = remediationProgressAllowsGlobalGap
    ? tddBddEvaluation.findings.map((finding) =>
        finding.code === 'TDD_BDD_EVIDENCE_STALE'
          ? toRemediationProgressAdvisoryFinding(finding)
          : finding
      )
    : tddBddEvaluation.findings;
  const effectiveTddBddSnapshot =
    remediationProgressAllowsGlobalGap &&
    tddBddSnapshot?.status === 'blocked' &&
    tddBddEvaluation.findings.length > 0 &&
    tddBddEvaluation.findings.every((finding) => finding.code === 'TDD_BDD_EVIDENCE_STALE')
      ? {
          ...tddBddSnapshot,
          status: 'advisory' as const,
          evidence: {
            ...tddBddSnapshot.evidence,
            errors: ['TDD_BDD_EVIDENCE_STALE_REMEDIATION_ADVISORY'],
          },
        }
      : tddBddSnapshot;
  const effectiveHasTddBddBlockingFinding = effectiveTddBddFindings.some(
    (finding) => finding.severity === 'ERROR' || finding.severity === 'CRITICAL'
  );
  const effectivePlatformSkillsCoverageFinding = effectivePlatformSkillsCoverageInput;
  const effectiveCrossPlatformCriticalFinding = effectiveCrossPlatformCriticalInput;
  const effectiveSkillsScopeComplianceFinding = effectiveSkillsScopeComplianceInput;
  const effectiveUnsupportedDetectorSkillsFindingForOutcome =
    remediationProgressAllowsGlobalGap && effectiveUnsupportedDetectorSkillsFinding
      ? toRemediationProgressAdvisoryFinding(effectiveUnsupportedDetectorSkillsFinding)
      : effectiveUnsupportedDetectorSkillsFinding;
  const effectiveFindings = sddBlockingFinding
    ? [
      sddBlockingFinding,
      ...(degradedModeFinding ? [degradedModeFinding] : []),
      ...(policyAsCodeBlockingFinding ? [policyAsCodeBlockingFinding] : []),
      ...(effectiveUnsupportedSkillsMappingFinding ? [effectiveUnsupportedSkillsMappingFinding] : []),
      ...(effectiveUnsupportedDetectorSkillsFindingForOutcome ? [effectiveUnsupportedDetectorSkillsFindingForOutcome] : []),
      ...(effectivePlatformSkillsCoverageFinding ? [effectivePlatformSkillsCoverageFinding] : []),
      ...(effectiveCrossPlatformCriticalFinding ? [effectiveCrossPlatformCriticalFinding] : []),
      ...(effectiveSkillsScopeComplianceFinding ? [effectiveSkillsScopeComplianceFinding] : []),
      ...(activeRulesEmptyForCodeChangesFinding ? [activeRulesEmptyForCodeChangesFinding] : []),
      ...(effectiveIosTestsQualityFinding ? [effectiveIosTestsQualityFinding] : []),
      ...(astIntelligenceDualFinding ? [astIntelligenceDualFinding] : []),
      ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
      ...brownfieldHotspotFindings,
      ...effectiveTddBddFindings,
      ...(remediationProgressFinding ? [remediationProgressFinding] : []),
      ...findings,
    ]
    : effectiveUnsupportedSkillsMappingFinding
      || effectiveUnsupportedDetectorSkillsFindingForOutcome
      || effectivePlatformSkillsCoverageFinding
      || effectiveCrossPlatformCriticalFinding
      || effectiveSkillsScopeComplianceFinding
      || activeRulesEmptyForCodeChangesFinding
      || effectiveIosTestsQualityFinding
      || astIntelligenceDualFinding
      || coverageBlockingFinding
      || brownfieldHotspotFindings.length > 0
      || policyAsCodeBlockingFinding
      || degradedModeFinding
      || effectiveTddBddFindings.length > 0
      || remediationProgressFinding
      ? [
        ...(degradedModeFinding ? [degradedModeFinding] : []),
        ...(policyAsCodeBlockingFinding ? [policyAsCodeBlockingFinding] : []),
        ...(effectiveUnsupportedSkillsMappingFinding ? [effectiveUnsupportedSkillsMappingFinding] : []),
        ...(effectiveUnsupportedDetectorSkillsFindingForOutcome ? [effectiveUnsupportedDetectorSkillsFindingForOutcome] : []),
        ...(effectivePlatformSkillsCoverageFinding ? [effectivePlatformSkillsCoverageFinding] : []),
        ...(effectiveCrossPlatformCriticalFinding ? [effectiveCrossPlatformCriticalFinding] : []),
        ...(effectiveSkillsScopeComplianceFinding ? [effectiveSkillsScopeComplianceFinding] : []),
        ...(activeRulesEmptyForCodeChangesFinding ? [activeRulesEmptyForCodeChangesFinding] : []),
        ...(effectiveIosTestsQualityFinding ? [effectiveIosTestsQualityFinding] : []),
        ...(astIntelligenceDualFinding ? [astIntelligenceDualFinding] : []),
        ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
        ...brownfieldHotspotFindings,
        ...effectiveTddBddFindings,
        ...(remediationProgressFinding ? [remediationProgressFinding] : []),
        ...findings,
      ]
      : brownfieldHotspotFindings.length > 0
        ? [...brownfieldHotspotFindings, ...findings]
        : findings;
  const hasAstIntelligenceBlockingFinding = shouldBlockFromFinding(astIntelligenceDualFinding);
  const gateDecisionFindings = effectiveFindings.filter((finding) => finding.blocking !== false);
  const decision = dependencies.evaluateGate([...gateDecisionFindings], params.policy);
  const baseGateOutcome =
    sddBlockingFinding ||
    degradedModeBlocks ||
    shouldBlockFromFinding(policyAsCodeBlockingFinding) ||
    shouldBlockFromFinding(effectiveUnsupportedSkillsMappingFinding) ||
    shouldBlockFromFinding(effectiveUnsupportedDetectorSkillsFindingForOutcome) ||
    shouldBlockFromFinding(effectivePlatformSkillsCoverageFinding) ||
    shouldBlockFromFinding(effectiveCrossPlatformCriticalFinding) ||
    shouldBlockFromFinding(effectiveSkillsScopeComplianceFinding) ||
    shouldBlockFromFinding(activeRulesEmptyForCodeChangesFinding) ||
    shouldBlockFromFinding(effectiveIosTestsQualityFinding) ||
    hasAstIntelligenceBlockingFinding ||
    shouldBlockFromFinding(coverageBlockingFinding) ||
    brownfieldHotspotFindings.some((finding) => shouldBlockFromFinding(finding)) ||
    effectiveHasTddBddBlockingFinding
      ? 'BLOCK'
      : (decision.outcome === 'PASS' && effectiveTddBddSnapshot?.status === 'advisory'
          ? 'WARN'
          : decision.outcome);
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
        ...(effectiveTddBddSnapshot ? { tddBddSnapshot: effectiveTddBddSnapshot } : {}),
      });
    } catch (error) {
      const rawReason = error instanceof Error ? error.message : String(error);
      const reason = rawReason.trim().replace(/\s+/g, ' ');
      if (params.silent !== true) {
        process.stdout.write(
          `[pumuki][memory-shadow] unavailable reason=${reason.length > 0 ? reason : 'unknown_error'}\n`
        );
      }
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
    if (params.silent !== true) {
      process.stdout.write(
        `[pumuki][memory-shadow] recommended=${memoryShadowRecommendation.recommendedOutcome}` +
        ` confidence=${memoryShadowRecommendation.confidence.toFixed(DEFAULT_MEMORY_SHADOW_DISPLAY_PRECISION)}` +
        ` reasons=${memoryShadowRecommendation.reasonCodes.join(',')}\n`
      );
    }
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
    ...(effectiveTddBddSnapshot ? { tddBdd: effectiveTddBddSnapshot } : {}),
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
    if (params.silent !== true) {
      const renderStage =
        params.policy.stage === 'PRE_PUSH'
          ? 'PRE_PUSH'
          : params.policy.stage === 'CI'
            ? 'CI'
            : 'PRE_COMMIT';
      dependencies.printGateFindings(findingsWithWaiver, {
        stage: renderStage,
      });
    }
    return 1;
  }

  return 0;
}
