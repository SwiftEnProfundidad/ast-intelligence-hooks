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
import { resolveFactsForGateScope, type GateScope } from './runPlatformGateFacts';
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
      console.log(`[pumuki][sdd] ${sddDecision.code}: ${sddDecision.message}`);
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
        findings: [toSddBlockingFinding(sddDecision)],
        gateOutcome: 'BLOCK',
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

  const facts = await dependencies.resolveFactsForGateScope({
    scope: params.scope,
    git,
  });

  const {
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    heuristicRules,
    findings,
  } = dependencies.evaluatePlatformGateFindings({
    facts,
    stage: params.policy.stage,
    repoRoot,
  });
  const decision = dependencies.evaluateGate([...findings], params.policy);

  dependencies.emitPlatformGateEvidence({
    stage: params.policy.stage,
    policyTrace: params.policyTrace,
    findings,
    gateOutcome: decision.outcome,
    repoRoot,
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    heuristicRules,
    evidenceService: evidence,
    sddDecision,
  });

  if (decision.outcome === 'BLOCK') {
    dependencies.printGateFindings(findings);
    return 1;
  }

  return 0;
}
