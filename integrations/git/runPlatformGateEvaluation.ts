import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import type { GateStage } from '../../core/gate/GateStage';
import { evaluateRules } from '../../core/gate/evaluateRules';
import type { RuleSet } from '../../core/rules/RuleSet';
import { mergeRuleSets } from '../../core/rules/mergeRuleSets';
import { astHeuristicsRuleSet } from '../../core/rules/presets/astHeuristicsRuleSet';
import { loadHeuristicsConfig } from '../config/heuristics';
import { loadProjectRules } from '../config/loadProjectRules';
import {
  loadSkillsRuleSetForStage,
  type SkillsRuleSetLoadResult,
} from '../config/skillsRuleSet';
import { applyHeuristicSeverityForStage } from '../gate/stagePolicies';
import {
  detectPlatformsFromFacts,
  type DetectedPlatforms,
} from '../platform/detectPlatforms';
import { extractHeuristicFacts } from '../../core/facts/extractHeuristicFacts';
import { buildCombinedBaselineRules } from './baselineRuleSets';

type PlatformGateEvaluationResult = {
  detectedPlatforms: DetectedPlatforms;
  skillsRuleSet: SkillsRuleSetLoadResult;
  projectRules: RuleSet;
  heuristicRules: RuleSet;
  findings: ReadonlyArray<Finding>;
};

const normalizeStageForSkills = (
  stage: GateStage
): Exclude<GateStage, 'STAGED'> => {
  return stage === 'STAGED' ? 'PRE_COMMIT' : stage;
};

export const evaluatePlatformGateFindings = (
  params: {
    facts: ReadonlyArray<Fact>;
    stage: GateStage;
    repoRoot: string;
  }
): PlatformGateEvaluationResult => {
  const detectedPlatforms = detectPlatformsFromFacts(params.facts);
  const heuristicsConfig = loadHeuristicsConfig();
  const stageForSkills = normalizeStageForSkills(params.stage);
  const skillsRuleSet = loadSkillsRuleSetForStage(stageForSkills, params.repoRoot);
  const baselineRules = buildCombinedBaselineRules(detectedPlatforms);
  const shouldExtractHeuristicFacts =
    heuristicsConfig.astSemanticEnabled || skillsRuleSet.requiresHeuristicFacts;
  const heuristicFacts = shouldExtractHeuristicFacts
    ? extractHeuristicFacts({
      facts: params.facts,
      detectedPlatforms,
    })
    : [];
  const evaluationFacts: ReadonlyArray<Fact> =
    heuristicFacts.length > 0 ? [...params.facts, ...heuristicFacts] : params.facts;
  const heuristicRules = heuristicsConfig.astSemanticEnabled
    ? applyHeuristicSeverityForStage(astHeuristicsRuleSet, params.stage).filter(
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

  return {
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    heuristicRules,
    findings,
  };
};
