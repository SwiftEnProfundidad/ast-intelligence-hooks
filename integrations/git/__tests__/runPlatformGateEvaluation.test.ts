import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { RuleDefinition } from '../../../core/rules/RuleDefinition';
import type { RuleSet } from '../../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import type { DetectedPlatforms } from '../../platform/detectPlatforms';

type EvaluatePlatformGateFindings = (params: {
  facts: ReadonlyArray<Fact>;
  stage: 'STAGED' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  repoRoot: string;
}) => {
  detectedPlatforms: DetectedPlatforms;
  skillsRuleSet: SkillsRuleSetLoadResult;
  projectRules: RuleSet;
  heuristicRules: RuleSet;
  findings: ReadonlyArray<Finding>;
};

const makeRule = (id: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'WARN'): RuleDefinition => {
  return {
    id,
    description: id,
    severity,
    when: { kind: 'FileChange' },
    then: { kind: 'Finding', message: id, code: id.toUpperCase() },
    platform: 'backend',
  };
};

const withPatchedEvaluation = (params: {
  detectPlatformsFromFacts: (facts: ReadonlyArray<Fact>) => DetectedPlatforms;
  loadHeuristicsConfig: () => { astSemanticEnabled: boolean };
  loadSkillsRuleSetForStage: (
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI',
    repoRoot: string
  ) => SkillsRuleSetLoadResult;
  buildCombinedBaselineRules: (detected: DetectedPlatforms) => RuleSet;
  extractHeuristicFacts: (input: {
    facts: ReadonlyArray<Fact>;
    detectedPlatforms: DetectedPlatforms;
  }) => ReadonlyArray<Fact>;
  applyHeuristicSeverityForStage: (
    rules: RuleSet,
    stage: 'STAGED' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI'
  ) => RuleSet;
  loadProjectRules: () =>
    | {
      rules: RuleSet;
      allowOverrideLocked?: boolean;
    }
    | undefined;
  mergeRuleSets: (
    baselineRules: RuleSet,
    projectRules: RuleSet,
    options?: { allowDowngradeBaseline?: boolean }
  ) => RuleSet;
  evaluateRules: (rules: RuleSet, facts: ReadonlyArray<Fact>) => ReadonlyArray<Finding>;
}): {
  evaluatePlatformGateFindings: EvaluatePlatformGateFindings;
  restore: () => void;
} => {
  const detectPlatformsModule = require('../../platform/detectPlatforms') as {
    detectPlatformsFromFacts: (facts: ReadonlyArray<Fact>) => DetectedPlatforms;
  };
  const heuristicsModule = require('../../config/heuristics') as {
    loadHeuristicsConfig: () => { astSemanticEnabled: boolean };
  };
  const skillsRuleSetModule = require('../../config/skillsRuleSet') as {
    loadSkillsRuleSetForStage: (
      stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI',
      repoRoot: string
    ) => SkillsRuleSetLoadResult;
  };
  const baselineRuleSetsModule = require('../baselineRuleSets') as {
    buildCombinedBaselineRules: (detected: DetectedPlatforms) => RuleSet;
  };
  const extractHeuristicFactsModule = require('../../../core/facts/extractHeuristicFacts') as {
    extractHeuristicFacts: (input: {
      facts: ReadonlyArray<Fact>;
      detectedPlatforms: DetectedPlatforms;
    }) => ReadonlyArray<Fact>;
  };
  const stagePoliciesModule = require('../../gate/stagePolicies') as {
    applyHeuristicSeverityForStage: (
      rules: RuleSet,
      stage: 'STAGED' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI'
    ) => RuleSet;
  };
  const projectRulesModule = require('../../config/loadProjectRules') as {
    loadProjectRules: () =>
      | {
        rules: RuleSet;
        allowOverrideLocked?: boolean;
      }
      | undefined;
  };
  const mergeRuleSetsModule = require('../../../core/rules/mergeRuleSets') as {
    mergeRuleSets: (
      baselineRules: RuleSet,
      projectRules: RuleSet,
      options?: { allowDowngradeBaseline?: boolean }
    ) => RuleSet;
  };
  const evaluateRulesModule = require('../../../core/gate/evaluateRules') as {
    evaluateRules: (rules: RuleSet, facts: ReadonlyArray<Fact>) => ReadonlyArray<Finding>;
  };

  const originalDetectPlatformsFromFacts = detectPlatformsModule.detectPlatformsFromFacts;
  const originalLoadHeuristicsConfig = heuristicsModule.loadHeuristicsConfig;
  const originalLoadSkillsRuleSetForStage = skillsRuleSetModule.loadSkillsRuleSetForStage;
  const originalBuildCombinedBaselineRules = baselineRuleSetsModule.buildCombinedBaselineRules;
  const originalExtractHeuristicFacts = extractHeuristicFactsModule.extractHeuristicFacts;
  const originalApplyHeuristicSeverityForStage =
    stagePoliciesModule.applyHeuristicSeverityForStage;
  const originalLoadProjectRules = projectRulesModule.loadProjectRules;
  const originalMergeRuleSets = mergeRuleSetsModule.mergeRuleSets;
  const originalEvaluateRules = evaluateRulesModule.evaluateRules;

  detectPlatformsModule.detectPlatformsFromFacts = params.detectPlatformsFromFacts;
  heuristicsModule.loadHeuristicsConfig = params.loadHeuristicsConfig;
  skillsRuleSetModule.loadSkillsRuleSetForStage = params.loadSkillsRuleSetForStage;
  baselineRuleSetsModule.buildCombinedBaselineRules = params.buildCombinedBaselineRules;
  extractHeuristicFactsModule.extractHeuristicFacts = params.extractHeuristicFacts;
  stagePoliciesModule.applyHeuristicSeverityForStage = params.applyHeuristicSeverityForStage;
  projectRulesModule.loadProjectRules = params.loadProjectRules;
  mergeRuleSetsModule.mergeRuleSets = params.mergeRuleSets;
  evaluateRulesModule.evaluateRules = params.evaluateRules;

  const modulePath = require.resolve('../runPlatformGateEvaluation');
  delete require.cache[modulePath];
  const evaluationModule = require('../runPlatformGateEvaluation') as {
    evaluatePlatformGateFindings: EvaluatePlatformGateFindings;
  };

  const restore = (): void => {
    detectPlatformsModule.detectPlatformsFromFacts = originalDetectPlatformsFromFacts;
    heuristicsModule.loadHeuristicsConfig = originalLoadHeuristicsConfig;
    skillsRuleSetModule.loadSkillsRuleSetForStage = originalLoadSkillsRuleSetForStage;
    baselineRuleSetsModule.buildCombinedBaselineRules = originalBuildCombinedBaselineRules;
    extractHeuristicFactsModule.extractHeuristicFacts = originalExtractHeuristicFacts;
    stagePoliciesModule.applyHeuristicSeverityForStage = originalApplyHeuristicSeverityForStage;
    projectRulesModule.loadProjectRules = originalLoadProjectRules;
    mergeRuleSetsModule.mergeRuleSets = originalMergeRuleSets;
    evaluateRulesModule.evaluateRules = originalEvaluateRules;
    delete require.cache[modulePath];
  };

  return {
    evaluatePlatformGateFindings: evaluationModule.evaluatePlatformGateFindings,
    restore,
  };
};

test('evaluatePlatformGateFindings normaliza stage STAGED y agrega heuristic facts cuando skills lo requiere', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'test',
    },
  ];
  const heuristicFacts: ReadonlyArray<Fact> = [
    {
      kind: 'Heuristic',
      ruleId: 'heuristic.test',
      severity: 'WARN',
      code: 'HEURISTIC_TEST',
      message: 'heuristic fact',
      filePath: 'src/a.ts',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const baselineRule = makeRule('baseline.rule');
  const skillsRule = makeRule('skills.rule');
  const mergedRule = makeRule('merged.rule');
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'merged.rule',
      severity: 'WARN',
      code: 'MERGED_RULE',
      message: 'finding',
      filePath: 'src/a.ts',
    },
  ];
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [skillsRule],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
  };

  let capturedSkillsStage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | undefined;
  let capturedSkillsRepoRoot: string | undefined;
  let capturedExtractHeuristicFactsInput:
    | {
      facts: ReadonlyArray<Fact>;
      detectedPlatforms: DetectedPlatforms;
    }
    | undefined;
  let capturedMergeRuleSetsInput:
    | {
      baselineRules: RuleSet;
      projectRules: RuleSet;
      options?: { allowDowngradeBaseline?: boolean };
    }
    | undefined;
  let capturedEvaluateRulesInput:
    | {
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;

  const patched = withPatchedEvaluation({
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: false }),
    loadSkillsRuleSetForStage: (stage, repoRoot) => {
      capturedSkillsStage = stage;
      capturedSkillsRepoRoot = repoRoot;
      return skillsRuleSet;
    },
    buildCombinedBaselineRules: () => [baselineRule],
    extractHeuristicFacts: (input) => {
      capturedExtractHeuristicFactsInput = input;
      return heuristicFacts;
    },
    applyHeuristicSeverityForStage: () => {
      throw new Error('No debe invocarse cuando astSemanticEnabled=false');
    },
    loadProjectRules: () => undefined,
    mergeRuleSets: (baselineRules, projectRules, options) => {
      capturedMergeRuleSetsInput = { baselineRules, projectRules, options };
      return [mergedRule];
    },
    evaluateRules: (rules, factsArg) => {
      capturedEvaluateRulesInput = { rules, facts: factsArg };
      return findings;
    },
  });

  try {
    const result = patched.evaluatePlatformGateFindings({
      facts: inputFacts,
      stage: 'STAGED',
      repoRoot: '/repo',
    });

    assert.equal(capturedSkillsStage, 'PRE_COMMIT');
    assert.equal(capturedSkillsRepoRoot, '/repo');
    assert.deepEqual(capturedExtractHeuristicFactsInput, {
      facts: inputFacts,
      detectedPlatforms,
    });
    assert.deepEqual(
      capturedMergeRuleSetsInput?.baselineRules.map((rule) => rule.id),
      ['baseline.rule', 'skills.rule']
    );
    assert.deepEqual(capturedMergeRuleSetsInput?.projectRules, []);
    assert.deepEqual(capturedMergeRuleSetsInput?.options, {
      allowDowngradeBaseline: false,
    });
    assert.deepEqual(capturedEvaluateRulesInput?.rules, [mergedRule]);
    assert.deepEqual(capturedEvaluateRulesInput?.facts, [...inputFacts, ...heuristicFacts]);
    assert.deepEqual(result.detectedPlatforms, detectedPlatforms);
    assert.deepEqual(result.skillsRuleSet, skillsRuleSet);
    assert.deepEqual(result.projectRules, []);
    assert.deepEqual(result.heuristicRules, []);
    assert.deepEqual(result.findings, findings);
  } finally {
    patched.restore();
  }
});

test('evaluatePlatformGateFindings filtra heuristicas mapeadas y permite downgrade cuando projectRules lo habilita', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'src/a.ts',
      content: 'console.log("x")',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const baselineRule = makeRule('baseline.rule');
  const heuristicKeptRule = makeRule('heuristic.keep');
  const heuristicFilteredRule = makeRule('heuristic.filtered');
  const skillsRule = makeRule('skills.rule');
  const projectRule = makeRule('project.rule', 'ERROR');
  const mergedRule = makeRule('merged.rule', 'ERROR');
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'merged.rule',
      severity: 'ERROR',
      code: 'MERGED_RULE',
      message: 'finding',
      filePath: 'src/a.ts',
    },
  ];
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [skillsRule],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(['heuristic.filtered']),
    requiresHeuristicFacts: false,
  };

  let applyHeuristicSeverityStage: 'STAGED' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | undefined;
  let extractHeuristicFactsInvocations = 0;
  let capturedMergeRuleSetsInput:
    | {
      baselineRules: RuleSet;
      projectRules: RuleSet;
      options?: { allowDowngradeBaseline?: boolean };
    }
    | undefined;
  let capturedEvaluateRulesInput:
    | {
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;

  const patched = withPatchedEvaluation({
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: true }),
    loadSkillsRuleSetForStage: () => skillsRuleSet,
    buildCombinedBaselineRules: () => [baselineRule],
    extractHeuristicFacts: () => {
      extractHeuristicFactsInvocations += 1;
      return [];
    },
    applyHeuristicSeverityForStage: (_rules, stage) => {
      applyHeuristicSeverityStage = stage;
      return [heuristicKeptRule, heuristicFilteredRule];
    },
    loadProjectRules: () => ({
      rules: [projectRule],
      allowOverrideLocked: true,
    }),
    mergeRuleSets: (baselineRules, projectRules, options) => {
      capturedMergeRuleSetsInput = { baselineRules, projectRules, options };
      return [mergedRule];
    },
    evaluateRules: (rules, factsArg) => {
      capturedEvaluateRulesInput = { rules, facts: factsArg };
      return findings;
    },
  });

  try {
    const result = patched.evaluatePlatformGateFindings({
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    });

    assert.equal(applyHeuristicSeverityStage, 'PRE_PUSH');
    assert.equal(extractHeuristicFactsInvocations, 1);
    assert.deepEqual(
      capturedMergeRuleSetsInput?.baselineRules.map((rule) => rule.id),
      ['baseline.rule', 'heuristic.keep', 'skills.rule']
    );
    assert.deepEqual(capturedMergeRuleSetsInput?.projectRules.map((rule) => rule.id), [
      'project.rule',
    ]);
    assert.deepEqual(capturedMergeRuleSetsInput?.options, {
      allowDowngradeBaseline: true,
    });
    assert.deepEqual(capturedEvaluateRulesInput?.rules, [mergedRule]);
    assert.deepEqual(capturedEvaluateRulesInput?.facts, inputFacts);
    assert.deepEqual(result.detectedPlatforms, detectedPlatforms);
    assert.deepEqual(result.skillsRuleSet, skillsRuleSet);
    assert.deepEqual(result.projectRules, [projectRule]);
    assert.deepEqual(result.heuristicRules.map((rule) => rule.id), ['heuristic.keep']);
    assert.deepEqual(result.findings, findings);
  } finally {
    patched.restore();
  }
});
