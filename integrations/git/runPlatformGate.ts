import type { Finding } from '../../core/gate/Finding';
import { evaluateGate } from '../../core/gate/evaluateGate';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { ResolvedStagePolicy } from '../gate/stagePolicies';
import { GitService, type IGitService } from './GitService';
import { EvidenceService, type IEvidenceService } from './EvidenceService';
import { evaluatePlatformGateFindings } from './runPlatformGateEvaluation';
import { resolveFactsForGateScope, type GateScope } from './runPlatformGateFacts';
import { emitPlatformGateEvidence } from './runPlatformGateEvidence';

const formatFinding = (finding: Finding): string => {
  return `${finding.ruleId}: ${finding.message}`;
};

export type GateServices = {
  git: IGitService;
  evidence: IEvidenceService;
};

const defaultServices: GateServices = {
  git: new GitService(),
  evidence: new EvidenceService(),
};

export async function runPlatformGate(params: {
  policy: GatePolicy;
  policyTrace?: ResolvedStagePolicy['trace'];
  scope: GateScope;
  services?: Partial<GateServices>;
}): Promise<number> {
  const git = params.services?.git ?? defaultServices.git;
  const evidence = params.services?.evidence ?? defaultServices.evidence;
  const repoRoot = git.resolveRepoRoot();

  const facts = await resolveFactsForGateScope({
    scope: params.scope,
    git,
  });

  const {
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    heuristicRules,
    findings,
  } = evaluatePlatformGateFindings({
    facts,
    stage: params.policy.stage,
    repoRoot,
  });
  const decision = evaluateGate([...findings], params.policy);

  emitPlatformGateEvidence({
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
  });

  if (decision.outcome === 'BLOCK') {
    for (const finding of findings) {
      console.log(formatFinding(finding));
    }
    return 1;
  }

  return 0;
}
