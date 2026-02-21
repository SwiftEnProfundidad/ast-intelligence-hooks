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
  const evaluationMetrics = coverage
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
    : undefined;
  const effectiveFindings = sddBlockingFinding
    ? [sddBlockingFinding, ...findings]
    : findings;
  const decision = dependencies.evaluateGate([...effectiveFindings], params.policy);
  const gateOutcome = sddBlockingFinding ? 'BLOCK' : decision.outcome;

  dependencies.emitPlatformGateEvidence({
    stage: params.policy.stage,
    policyTrace: params.policyTrace,
    findings: effectiveFindings,
    gateOutcome,
    filesScanned,
    ...(evaluationMetrics ? { evaluationMetrics } : {}),
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
