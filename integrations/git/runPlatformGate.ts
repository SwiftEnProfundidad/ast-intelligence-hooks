import type { Finding } from '../../core/gate/Finding';
import { evaluateGate } from '../../core/gate/evaluateGate';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import { generateEvidence } from '../evidence/generateEvidence';
import type { ResolvedStagePolicy } from '../gate/stagePolicies';
import { rulePackVersions } from '../../core/rules/presets/rulePackVersions';
import { GitService, type IGitService } from './GitService';
import { EvidenceService, type IEvidenceService } from './EvidenceService';
import { buildBaselineRuleSetEntries } from './baselineRuleSets';
import { evaluatePlatformGateFindings } from './runPlatformGateEvaluation';
import { resolveFactsForGateScope, type GateScope } from './runPlatformGateFacts';

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
    repoRoot: git.resolveRepoRoot(),
  });
  const decision = evaluateGate([...findings], params.policy);

  generateEvidence({
    stage: params.policy.stage,
    findings,
    gateOutcome: decision.outcome,
    previousEvidence: evidence.loadPreviousEvidence(git.resolveRepoRoot()),
    detectedPlatforms: evidence.toDetectedPlatformsRecord(detectedPlatforms),
    loadedRulesets: evidence.buildRulesetState({
      baselineRuleSets: buildBaselineRuleSetEntries(detectedPlatforms),
      projectRules,
      heuristicRules,
      heuristicsBundle: `astHeuristicsRuleSet@${rulePackVersions.astHeuristicsRuleSet}`,
      skillsBundles: skillsRuleSet.activeBundles,
      policyTrace: params.policyTrace,
      stage: params.policy.stage,
    }),
  });

  if (decision.outcome === 'BLOCK') {
    for (const finding of findings) {
      console.log(formatFinding(finding));
    }
    return 1;
  }

  return 0;
}
