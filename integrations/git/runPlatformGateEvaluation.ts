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
import { attachFindingTraceability } from './findingTraceability';

type PlatformGateEvaluationResult = {
  detectedPlatforms: DetectedPlatforms;
  skillsRuleSet: SkillsRuleSetLoadResult;
  projectRules: RuleSet;
  baselineRules: RuleSet;
  heuristicRules: RuleSet;
  mergedRules: RuleSet;
  evaluationFacts: ReadonlyArray<Fact>;
  coverage: {
    factsTotal: number;
    filesScanned: number;
    rulesTotal: number;
    baselineRules: number;
    heuristicRules: number;
    skillsRules: number;
    projectRules: number;
    matchedRules: number;
    unmatchedRules: number;
    evaluatedRuleIds: ReadonlyArray<string>;
    matchedRuleIds: ReadonlyArray<string>;
    unmatchedRuleIds: ReadonlyArray<string>;
  };
  findings: ReadonlyArray<Finding>;
};

export type PlatformGateEvaluationDependencies = {
  detectPlatformsFromFacts: typeof detectPlatformsFromFacts;
  loadHeuristicsConfig: typeof loadHeuristicsConfig;
  loadSkillsRuleSetForStage: typeof loadSkillsRuleSetForStage;
  buildCombinedBaselineRules: typeof buildCombinedBaselineRules;
  extractHeuristicFacts: typeof extractHeuristicFacts;
  applyHeuristicSeverityForStage: typeof applyHeuristicSeverityForStage;
  loadProjectRules: typeof loadProjectRules;
  mergeRuleSets: typeof mergeRuleSets;
  evaluateRules: typeof evaluateRules;
  attachFindingTraceability: typeof attachFindingTraceability;
};

const defaultDependencies: PlatformGateEvaluationDependencies = {
  detectPlatformsFromFacts,
  loadHeuristicsConfig,
  loadSkillsRuleSetForStage,
  buildCombinedBaselineRules,
  extractHeuristicFacts,
  applyHeuristicSeverityForStage,
  loadProjectRules,
  mergeRuleSets,
  evaluateRules,
  attachFindingTraceability,
};

const normalizeStageForSkills = (
  stage: GateStage
): Exclude<GateStage, 'STAGED'> => {
  return stage === 'STAGED' ? 'PRE_COMMIT' : stage;
};

const extractFactPath = (fact: Fact): string | null => {
  if (fact.kind === 'FileContent' || fact.kind === 'FileChange') {
    return fact.path;
  }
  if (fact.kind === 'Heuristic') {
    return fact.filePath ?? null;
  }
  return null;
};

const countFilesScanned = (facts: ReadonlyArray<Fact>): number => {
  const files = new Set<string>();
  for (const fact of facts) {
    const path = extractFactPath(fact);
    if (!path || path.trim().length === 0) {
      continue;
    }
    files.add(path.replace(/\\/g, '/'));
  }
  return files.size;
};

export const evaluatePlatformGateFindings = (
  params: {
    facts: ReadonlyArray<Fact>;
    stage: GateStage;
    repoRoot: string;
  },
  dependencies: Partial<PlatformGateEvaluationDependencies> = {}
): PlatformGateEvaluationResult => {
  const activeDependencies: PlatformGateEvaluationDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const detectedPlatforms = activeDependencies.detectPlatformsFromFacts(params.facts);
  const heuristicsConfig = activeDependencies.loadHeuristicsConfig();
  const stageForSkills = normalizeStageForSkills(params.stage);
  const skillsRuleSet = activeDependencies.loadSkillsRuleSetForStage(
    stageForSkills,
    params.repoRoot
  );
  const baselineRules = activeDependencies.buildCombinedBaselineRules(detectedPlatforms);
  const shouldExtractHeuristicFacts =
    heuristicsConfig.astSemanticEnabled || skillsRuleSet.requiresHeuristicFacts;
  const heuristicFacts = shouldExtractHeuristicFacts
    ? activeDependencies.extractHeuristicFacts({
      facts: params.facts,
      detectedPlatforms,
      typeScriptScope: heuristicsConfig.typeScriptScope,
    })
    : [];
  const evaluationFacts: ReadonlyArray<Fact> =
    heuristicFacts.length > 0 ? [...params.facts, ...heuristicFacts] : params.facts;
  const heuristicRules = heuristicsConfig.astSemanticEnabled
    ? activeDependencies.applyHeuristicSeverityForStage(astHeuristicsRuleSet, params.stage).filter(
      (rule) => !skillsRuleSet.mappedHeuristicRuleIds.has(rule.id)
    )
    : [];
  const baselineRulesWithHeuristicsAndSkills: RuleSet = [
    ...baselineRules,
    ...heuristicRules,
    ...skillsRuleSet.rules,
  ];
  const projectConfig = activeDependencies.loadProjectRules();
  const projectRules = projectConfig?.rules ?? [];
  const mergedRules = activeDependencies.mergeRuleSets(
    baselineRulesWithHeuristicsAndSkills,
    projectRules,
    {
      allowDowngradeBaseline: projectConfig?.allowOverrideLocked === true,
    }
  );
  const rawFindings = activeDependencies.evaluateRules(mergedRules, evaluationFacts);
  const findings = activeDependencies.attachFindingTraceability({
    findings: rawFindings,
    rules: mergedRules,
    facts: evaluationFacts,
  });
  const evaluatedRuleIds = mergedRules.map((rule) => rule.id).sort();
  const matchedRuleIds = Array.from(new Set(findings.map((finding) => finding.ruleId))).sort();
  const matchedRuleIdsSet = new Set(matchedRuleIds);
  const unmatchedRuleIds = evaluatedRuleIds.filter((ruleId) => !matchedRuleIdsSet.has(ruleId));

  return {
    detectedPlatforms,
    skillsRuleSet,
    projectRules,
    baselineRules,
    heuristicRules,
    mergedRules,
    evaluationFacts,
    coverage: {
      factsTotal: evaluationFacts.length,
      filesScanned: countFilesScanned(evaluationFacts),
      rulesTotal: mergedRules.length,
      baselineRules: baselineRules.length,
      heuristicRules: heuristicRules.length,
      skillsRules: skillsRuleSet.rules.length,
      projectRules: projectRules.length,
      matchedRules: matchedRuleIds.length,
      unmatchedRules: Math.max(0, mergedRules.length - matchedRuleIds.length),
      evaluatedRuleIds,
      matchedRuleIds,
      unmatchedRuleIds,
    },
    findings,
  };
};
