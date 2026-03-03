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
};

const resolveCurrentBranch = (git: IGitService, repoRoot: string): string | null => {
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

const toNormalizedPath = (value: string): string => value.replace(/\\/g, '/').trim();

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
      ...(unsupportedSkillsMappingFinding ? [unsupportedSkillsMappingFinding] : []),
      ...(platformSkillsCoverageFinding ? [platformSkillsCoverageFinding] : []),
      ...(skillsScopeComplianceFinding ? [skillsScopeComplianceFinding] : []),
      ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
      ...tddBddEvaluation.findings,
      ...findings,
    ]
    : unsupportedSkillsMappingFinding
      || platformSkillsCoverageFinding
      || skillsScopeComplianceFinding
      || coverageBlockingFinding
      || tddBddEvaluation.findings.length > 0
      ? [
        ...(unsupportedSkillsMappingFinding ? [unsupportedSkillsMappingFinding] : []),
        ...(platformSkillsCoverageFinding ? [platformSkillsCoverageFinding] : []),
        ...(skillsScopeComplianceFinding ? [skillsScopeComplianceFinding] : []),
        ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
        ...tddBddEvaluation.findings,
        ...findings,
      ]
      : findings;
  const decision = dependencies.evaluateGate([...effectiveFindings], params.policy);
  const gateOutcome =
    sddBlockingFinding ||
    unsupportedSkillsMappingFinding ||
    platformSkillsCoverageFinding ||
    skillsScopeComplianceFinding ||
    coverageBlockingFinding ||
    hasTddBddBlockingFinding
      ? 'BLOCK'
      : decision.outcome;
  const shadowFlagRaw = process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED?.trim().toLowerCase();
  const isMemoryShadowEnabled = shadowFlagRaw === '1' || shadowFlagRaw === 'true';
  let memoryShadowRecommendation: OperationalMemoryShadowRecommendation | undefined;
  if (isMemoryShadowEnabled) {
    try {
      memoryShadowRecommendation = dependencies.buildMemoryShadowRecommendation({
        findings: effectiveFindings,
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
    findings: effectiveFindings,
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
    dependencies.printGateFindings(effectiveFindings);
    return 1;
  }

  return 0;
}
