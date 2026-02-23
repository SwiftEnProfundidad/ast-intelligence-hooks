import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import type { GateStage } from '../../core/gate/GateStage';
import { evaluateRules } from '../../core/gate/evaluateRules';
import { evaluateRulesWithCoverage } from '../../core/gate/evaluateRules';
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
    unevaluatedRules: number;
    activeRuleIds: ReadonlyArray<string>;
    evaluatedRuleIds: ReadonlyArray<string>;
    matchedRuleIds: ReadonlyArray<string>;
    unmatchedRuleIds: ReadonlyArray<string>;
    unevaluatedRuleIds: ReadonlyArray<string>;
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
  evaluateRulesWithCoverage: typeof evaluateRulesWithCoverage;
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
  evaluateRulesWithCoverage,
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
  return collectObservedFilePaths(facts).length;
};

const collectObservedFilePaths = (facts: ReadonlyArray<Fact>): ReadonlyArray<string> => {
  const filePaths = new Set<string>();
  for (const fact of facts) {
    const path = extractFactPath(fact);
    if (!path || path.trim().length === 0) {
      continue;
    }
    filePaths.add(path.replace(/\\/g, '/'));
  }
  return [...filePaths].sort();
};

const hasObservedTypeScriptPlatformPaths = (
  observedFilePaths: ReadonlyArray<string>
): boolean => {
  return observedFilePaths.some((path) => {
    const normalized = path.replace(/\\/g, '/');
    return (
      normalized.startsWith('apps/backend/') ||
      normalized.startsWith('apps/frontend/') ||
      normalized.startsWith('apps/web/')
    );
  });
};

const resolveTypeScriptHeuristicScope = (params: {
  configuredScope: 'platform' | 'all';
  requiresHeuristicFacts: boolean;
  observedFilePaths: ReadonlyArray<string>;
}): 'platform' | 'all' => {
  if (params.configuredScope === 'all') {
    return 'all';
  }
  if (!params.requiresHeuristicFacts) {
    return params.configuredScope;
  }
  return hasObservedTypeScriptPlatformPaths(params.observedFilePaths)
    ? 'platform'
    : 'all';
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
  const observedFilePaths = collectObservedFilePaths(params.facts);
  const detectedPlatforms = activeDependencies.detectPlatformsFromFacts(params.facts);
  const heuristicsConfig = activeDependencies.loadHeuristicsConfig();
  const stageForSkills = normalizeStageForSkills(params.stage);
  const skillsRuleSet = activeDependencies.loadSkillsRuleSetForStage(
    stageForSkills,
    params.repoRoot,
    detectedPlatforms,
    observedFilePaths
  );
  const baselineRules = activeDependencies.buildCombinedBaselineRules(detectedPlatforms);
  const shouldExtractHeuristicFacts =
    heuristicsConfig.astSemanticEnabled || skillsRuleSet.requiresHeuristicFacts;
  const typeScriptScope = resolveTypeScriptHeuristicScope({
    configuredScope: heuristicsConfig.typeScriptScope,
    requiresHeuristicFacts: skillsRuleSet.requiresHeuristicFacts,
    observedFilePaths,
  });
  const heuristicFacts = shouldExtractHeuristicFacts
    ? activeDependencies.extractHeuristicFacts({
      facts: params.facts,
      detectedPlatforms,
      typeScriptScope,
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
  const usesEvaluateRulesOverride = typeof dependencies.evaluateRules === 'function';
  const evaluationWithCoverage = usesEvaluateRulesOverride
    ? {
      findings: activeDependencies.evaluateRules(mergedRules, evaluationFacts),
      evaluatedRuleIds: mergedRules.map((rule) => rule.id),
    }
    : activeDependencies.evaluateRulesWithCoverage(mergedRules, evaluationFacts);
  const rawFindings = evaluationWithCoverage.findings;
  const findings = activeDependencies.attachFindingTraceability({
    findings: rawFindings,
    rules: mergedRules,
    facts: evaluationFacts,
  });
  const activeRuleIds = mergedRules.map((rule) => rule.id).sort();
  const evaluatedRuleIds = Array.from(new Set(evaluationWithCoverage.evaluatedRuleIds)).sort();
  const matchedRuleIds = Array.from(new Set(findings.map((finding) => finding.ruleId))).sort();
  const matchedRuleIdsSet = new Set(matchedRuleIds);
  const unmatchedRuleIds = evaluatedRuleIds.filter((ruleId) => !matchedRuleIdsSet.has(ruleId));
  const evaluatedRuleIdsSet = new Set(evaluatedRuleIds);
  const unevaluatedRuleIds = activeRuleIds.filter(
    (ruleId) => !evaluatedRuleIdsSet.has(ruleId)
  );

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
      unmatchedRules: Math.max(0, evaluatedRuleIds.length - matchedRuleIds.length),
      unevaluatedRules: unevaluatedRuleIds.length,
      activeRuleIds,
      evaluatedRuleIds,
      matchedRuleIds,
      unmatchedRuleIds,
      unevaluatedRuleIds,
    },
    findings,
  };
};
