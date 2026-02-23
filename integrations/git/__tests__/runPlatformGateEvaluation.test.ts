import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { RuleDefinition } from '../../../core/rules/RuleDefinition';
import type { RuleSet } from '../../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import type { DetectedPlatforms } from '../../platform/detectPlatforms';
import {
  evaluatePlatformGateFindings,
  type PlatformGateEvaluationDependencies,
} from '../runPlatformGateEvaluation';

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

test('evaluatePlatformGateFindings normaliza stage STAGED y eleva scope TS a all cuando skills lo requiere fuera de apps/*', () => {
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
  let capturedTraceabilityInput:
    | {
      findings: ReadonlyArray<Finding>;
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
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
    attachFindingTraceability: (input) => {
      capturedTraceabilityInput = input;
      return input.findings;
    },
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'STAGED',
      repoRoot: '/repo',
    },
    deps
  );

  assert.equal(capturedSkillsStage, 'PRE_COMMIT');
  assert.equal(capturedSkillsRepoRoot, '/repo');
  assert.deepEqual(capturedExtractHeuristicFactsInput, {
    facts: inputFacts,
    detectedPlatforms,
    typeScriptScope: 'all',
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
  assert.deepEqual(capturedTraceabilityInput?.findings, findings);
  assert.deepEqual(capturedTraceabilityInput?.rules, [mergedRule]);
  assert.deepEqual(capturedTraceabilityInput?.facts, [...inputFacts, ...heuristicFacts]);
  assert.deepEqual(result.detectedPlatforms, detectedPlatforms);
  assert.deepEqual(result.skillsRuleSet, skillsRuleSet);
  assert.deepEqual(result.projectRules, []);
  assert.deepEqual(result.baselineRules, [baselineRule]);
  assert.deepEqual(result.heuristicRules, []);
  assert.deepEqual(result.mergedRules, [mergedRule]);
  assert.deepEqual(result.evaluationFacts, [...inputFacts, ...heuristicFacts]);
  assert.deepEqual(result.coverage, {
    factsTotal: 2,
    filesScanned: 1,
    rulesTotal: 1,
    baselineRules: 1,
    heuristicRules: 0,
    skillsRules: 1,
    projectRules: 0,
    matchedRules: 1,
    unmatchedRules: 0,
    unevaluatedRules: 0,
    activeRuleIds: ['merged.rule'],
    evaluatedRuleIds: ['merged.rule'],
    matchedRuleIds: ['merged.rule'],
    unmatchedRuleIds: [],
    unevaluatedRuleIds: [],
  });
  assert.deepEqual(result.findings, findings);
});

test('evaluatePlatformGateFindings mantiene scope TS platform cuando hay archivos en apps/*', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/orders.service.ts',
      content: 'export const x = 1;',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [makeRule('skills.rule')],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: true,
  };

  let capturedExtractHeuristicFactsInput:
    | {
      facts: ReadonlyArray<Fact>;
      detectedPlatforms: DetectedPlatforms;
      typeScriptScope?: 'platform' | 'all';
    }
    | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
    loadSkillsRuleSetForStage: () => skillsRuleSet,
    buildCombinedBaselineRules: () => [],
    extractHeuristicFacts: (input) => {
      capturedExtractHeuristicFactsInput = input;
      return [];
    },
    applyHeuristicSeverityForStage: () => [],
    loadProjectRules: () => undefined,
    mergeRuleSets: (baselineRules, projectRules) => [...baselineRules, ...projectRules],
    evaluateRules: () => [],
    attachFindingTraceability: (input) => input.findings,
  };

  evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    deps
  );

  assert.deepEqual(capturedExtractHeuristicFactsInput, {
    facts: inputFacts,
    detectedPlatforms,
    typeScriptScope: 'platform',
  });
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
  let capturedTraceabilityInput:
    | {
      findings: ReadonlyArray<Finding>;
      rules: RuleSet;
      facts: ReadonlyArray<Fact>;
    }
    | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: true, typeScriptScope: 'platform' }),
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
    attachFindingTraceability: (input) => {
      capturedTraceabilityInput = input;
      return input.findings;
    },
  };

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_PUSH',
      repoRoot: '/repo',
    },
    deps
  );

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
  assert.deepEqual(capturedTraceabilityInput?.findings, findings);
  assert.deepEqual(capturedTraceabilityInput?.rules, [mergedRule]);
  assert.deepEqual(capturedTraceabilityInput?.facts, inputFacts);
  assert.deepEqual(result.detectedPlatforms, detectedPlatforms);
  assert.deepEqual(result.skillsRuleSet, skillsRuleSet);
  assert.deepEqual(result.projectRules, [projectRule]);
  assert.deepEqual(result.baselineRules, [baselineRule]);
  assert.deepEqual(result.heuristicRules.map((rule) => rule.id), ['heuristic.keep']);
  assert.deepEqual(result.mergedRules, [mergedRule]);
  assert.deepEqual(result.evaluationFacts, inputFacts);
  assert.deepEqual(result.coverage, {
    factsTotal: 1,
    filesScanned: 1,
    rulesTotal: 1,
    baselineRules: 1,
    heuristicRules: 1,
    skillsRules: 1,
    projectRules: 1,
    matchedRules: 1,
    unmatchedRules: 0,
    unevaluatedRules: 0,
    activeRuleIds: ['merged.rule'],
    evaluatedRuleIds: ['merged.rule'],
    matchedRuleIds: ['merged.rule'],
    unmatchedRuleIds: [],
    unevaluatedRuleIds: [],
  });
  assert.deepEqual(result.findings, findings);
});

test('evaluatePlatformGateFindings propaga rutas observadas al loader de skills para scope por fichero', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'server/src/orders.service.ts',
      content: 'export class OrdersService {}',
      source: 'test',
    },
    {
      kind: 'FileContent',
      path: 'mobile/ios/MainView.swift',
      content: 'struct MainView: View { var body: some View { Text("x") } }',
      source: 'test',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    ios: { detected: true, confidence: 'HIGH' },
    backend: { detected: true, confidence: 'HIGH' },
  };
  const mergedRule = makeRule('merged.rule');
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
    unsupportedAutoRuleIds: [],
  };

  let capturedObservedFilePaths: ReadonlyArray<string> | undefined;

  const deps: Partial<PlatformGateEvaluationDependencies> = {
    detectPlatformsFromFacts: () => detectedPlatforms,
    loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
    loadSkillsRuleSetForStage: (_stage, _repoRoot, _detectedPlatforms, observedFilePaths) => {
      capturedObservedFilePaths = observedFilePaths;
      return skillsRuleSet;
    },
    buildCombinedBaselineRules: () => [],
    extractHeuristicFacts: () => [],
    applyHeuristicSeverityForStage: () => [],
    loadProjectRules: () => undefined,
    mergeRuleSets: () => [mergedRule],
    evaluateRules: () => [],
    attachFindingTraceability: (input) => input.findings,
  };

  evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    deps
  );

  assert.deepEqual(
    capturedObservedFilePaths,
    ['mobile/ios/MainView.swift', 'server/src/orders.service.ts']
  );
});

test('evaluatePlatformGateFindings usa evaluatedRuleIds capturados en evaluacion cuando no hay override de evaluateRules', () => {
  const inputFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'test',
    },
  ];
  const mergedRules: RuleSet = [makeRule('rule.active.a'), makeRule('rule.active.b')];
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'rule.active.a',
      severity: 'WARN',
      code: 'RULE_ACTIVE_A',
      message: 'finding',
      filePath: 'src/a.ts',
    },
  ];

  const result = evaluatePlatformGateFindings(
    {
      facts: inputFacts,
      stage: 'PRE_COMMIT',
      repoRoot: '/repo',
    },
    {
      detectPlatformsFromFacts: () => ({}),
      loadHeuristicsConfig: () => ({ astSemanticEnabled: false, typeScriptScope: 'platform' }),
      loadSkillsRuleSetForStage: () => ({
        rules: [],
        activeBundles: [],
        mappedHeuristicRuleIds: new Set<string>(),
        requiresHeuristicFacts: false,
      }),
      buildCombinedBaselineRules: () => [],
      extractHeuristicFacts: () => [],
      applyHeuristicSeverityForStage: () => [],
      loadProjectRules: () => undefined,
      mergeRuleSets: () => mergedRules,
      evaluateRulesWithCoverage: () => ({
        findings,
        evaluatedRuleIds: ['rule.active.a'],
      }),
      attachFindingTraceability: (input) => input.findings,
    }
  );

  assert.deepEqual(result.coverage.activeRuleIds, ['rule.active.a', 'rule.active.b']);
  assert.deepEqual(result.coverage.evaluatedRuleIds, ['rule.active.a']);
  assert.deepEqual(result.coverage.matchedRuleIds, ['rule.active.a']);
  assert.deepEqual(result.coverage.unmatchedRuleIds, []);
  assert.deepEqual(result.coverage.unevaluatedRuleIds, ['rule.active.b']);
  assert.equal(result.coverage.unmatchedRules, 0);
  assert.equal(result.coverage.unevaluatedRules, 1);
});
