import type { Fact } from '../../core/facts/Fact';
import { extractHeuristicFacts } from '../../core/facts/extractHeuristicFacts';
import type { Finding } from '../../core/gate/Finding';
import { evaluateGate } from '../../core/gate/evaluateGate';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
import { evaluateRules } from '../../core/gate/evaluateRules';
import type { RuleSet } from '../../core/rules/RuleSet';
import { mergeRuleSets } from '../../core/rules/mergeRuleSets';
import { astHeuristicsRuleSet } from '../../core/rules/presets/astHeuristicsRuleSet';
import { loadHeuristicsConfig } from '../config/heuristics';
import { loadProjectRules } from '../config/loadProjectRules';
import { loadSkillsRuleSetForStage } from '../config/skillsRuleSet';
import { generateEvidence } from '../evidence/generateEvidence';
import type { ResolvedStagePolicy } from '../gate/stagePolicies';
import { applyHeuristicSeverityForStage } from '../gate/stagePolicies';
import { detectPlatformsFromFacts } from '../platform/detectPlatforms';
import { getFactsForCommitRange } from './getCommitRangeFacts';
import { rulePackVersions } from '../../core/rules/presets/rulePackVersions';
import { GitService, type IGitService } from './GitService';
import { EvidenceService, type IEvidenceService } from './EvidenceService';
import { buildBaselineRuleSetEntries, buildCombinedBaselineRules } from './baselineRuleSets';

type GateScope =
  | {
    kind: 'staged';
    extensions?: string[];
  }
  | {
    kind: 'range';
    fromRef: string;
    toRef: string;
    extensions?: string[];
  };

const DEFAULT_EXTENSIONS = ['.swift', '.ts', '.tsx', '.js', '.jsx', '.kt', '.kts'];

const formatFinding = (finding: Finding): string => {
  return `${finding.ruleId}: ${finding.message}`;
};

const normalizeStageForSkills = (
  stage: GateStage
): Exclude<GateStage, 'STAGED'> => {
  return stage === 'STAGED' ? 'PRE_COMMIT' : stage;
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

  const extensions = params.scope.extensions ?? DEFAULT_EXTENSIONS;
  const facts =
    params.scope.kind === 'staged'
      ? git.getStagedFacts(extensions)
      : await getFactsForCommitRange({
        fromRef: params.scope.fromRef,
        toRef: params.scope.toRef,
        extensions,
      });

  const detectedPlatforms = detectPlatformsFromFacts(facts);
  const heuristicsConfig = loadHeuristicsConfig();
  const stageForSkills = normalizeStageForSkills(params.policy.stage);
  const skillsRuleSet = loadSkillsRuleSetForStage(stageForSkills, git.resolveRepoRoot());
  const baselineRules = buildCombinedBaselineRules(detectedPlatforms);
  const shouldExtractHeuristicFacts =
    heuristicsConfig.astSemanticEnabled || skillsRuleSet.requiresHeuristicFacts;
  const heuristicFacts = shouldExtractHeuristicFacts
    ? extractHeuristicFacts({
      facts,
      detectedPlatforms,
    })
    : [];
  const evaluationFacts: ReadonlyArray<Fact> =
    heuristicFacts.length > 0 ? [...facts, ...heuristicFacts] : facts;
  const heuristicRules = heuristicsConfig.astSemanticEnabled
    ? applyHeuristicSeverityForStage(astHeuristicsRuleSet, params.policy.stage).filter(
      (rule) => !skillsRuleSet.mappedHeuristicRuleIds.has(rule.id)
    )
    : [];
  const baselineRulesWithHeuristicsAndSkills: RuleSet = [
    ...baselineRules,
    ...heuristicRules,
    ...skillsRuleSet.rules,
  ];
  const projectConfig = loadProjectRules();
  const projectRules = projectConfig?.rules ?? [];
  const mergedRules = mergeRuleSets(baselineRulesWithHeuristicsAndSkills, projectRules, {
    allowDowngradeBaseline: projectConfig?.allowOverrideLocked === true,
  });
  const findings = evaluateRules(mergedRules, evaluationFacts);
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
