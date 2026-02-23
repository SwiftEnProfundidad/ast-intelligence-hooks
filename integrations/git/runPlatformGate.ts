import { evaluateGate } from '../../core/gate/evaluateGate';
import type { Finding } from '../../core/gate/Finding';
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
  evaluateSddForStage: (
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI',
    repoRoot: string
  ) => Pick<SddDecision, 'allowed' | 'code' | 'message'>;
};

const defaultServices: GateServices = {
  git: new GitService(),
  evidence: new EvidenceService(),
};

const defaultDependencies: GateDependencies = {
  evaluateGate,
  evaluatePlatformGateFindings,
  resolveFactsForGateScope,
  emitPlatformGateEvidence,
  printGateFindings,
  evaluateSddForStage: (stage, repoRoot) =>
    evaluateSddPolicy({
      stage,
      repoRoot,
    }).decision,
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

export async function runPlatformGate(params: {
  policy: GatePolicy;
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
      if (params.sddShortCircuit !== false) {
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
  const effectiveFindings = sddBlockingFinding
    ? [
      sddBlockingFinding,
      ...(unsupportedSkillsMappingFinding ? [unsupportedSkillsMappingFinding] : []),
      ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
      ...findings,
    ]
    : unsupportedSkillsMappingFinding || coverageBlockingFinding
      ? [
        ...(unsupportedSkillsMappingFinding ? [unsupportedSkillsMappingFinding] : []),
        ...(coverageBlockingFinding ? [coverageBlockingFinding] : []),
        ...findings,
      ]
      : findings;
  const decision = dependencies.evaluateGate([...effectiveFindings], params.policy);
  const gateOutcome =
    sddBlockingFinding || unsupportedSkillsMappingFinding || coverageBlockingFinding
      ? 'BLOCK'
      : decision.outcome;

  dependencies.emitPlatformGateEvidence({
    stage: params.policy.stage,
    policyTrace: params.policyTrace,
    findings: effectiveFindings,
    gateOutcome,
    filesScanned,
    evaluationMetrics,
    rulesCoverage,
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
