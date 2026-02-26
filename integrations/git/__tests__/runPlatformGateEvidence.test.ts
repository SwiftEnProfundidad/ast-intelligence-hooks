import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from '../../../core/gate/Finding';
import { rulePackVersions } from '../../../core/rules/presets/rulePackVersions';
import type { RuleSet } from '../../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import type { ResolvedStagePolicy } from '../../gate/stagePolicies';
import type { DetectedPlatforms } from '../../platform/detectPlatforms';
import type { TddBddSnapshot } from '../../tdd/types';
import type { IEvidenceService } from '../EvidenceService';
import { emitPlatformGateEvidence } from '../runPlatformGateEvidence';

type GenerateEvidenceParams = {
  stage: string;
  findings: ReadonlyArray<Finding>;
  gateOutcome: string;
  filesScanned: number;
  evaluationMetrics?: {
    facts_total: number;
    rules_total: number;
    baseline_rules: number;
    heuristic_rules: number;
    skills_rules: number;
    project_rules: number;
    matched_rules: number;
    unmatched_rules: number;
    evaluated_rule_ids: string[];
    matched_rule_ids: string[];
    unmatched_rule_ids: string[];
  };
  rulesCoverage?: {
    stage: string;
    active_rule_ids: string[];
    evaluated_rule_ids: string[];
    matched_rule_ids: string[];
    unevaluated_rule_ids: string[];
    counts: {
      active: number;
      evaluated: number;
      matched: number;
      unevaluated: number;
    };
    coverage_ratio: number;
  };
  tddBdd?: TddBddSnapshot;
  previousEvidence: unknown;
  detectedPlatforms: unknown;
  loadedRulesets: unknown;
  sddMetrics?: {
    enforced: boolean;
    stage: string;
    decision: {
      allowed: boolean;
      code: string;
      message: string;
    };
  };
};

test('emitPlatformGateEvidence construye payload y delega en generateEvidence', () => {
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'ERROR',
      code: 'CONSOLE_LOG',
      message: 'No usar console.log en codigo de produccion',
      filePath: 'src/app.ts',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const policyTrace: ResolvedStagePolicy['trace'] = {
    source: 'default',
    bundle: 'gate-policy.default.PRE_PUSH',
    hash: 'trace-hash',
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [{ name: 'windsurf-rules-backend', version: '1.0.0', hash: 'skills-hash' }],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
  };
  const projectRules: RuleSet = [];
  const heuristicRules: RuleSet = [];
  const previousEvidence = { version: '2.1-prev' };
  const detectedPlatformsRecord = { backend: { detected: true, confidence: 'HIGH' } };
  const rulesetState = [{ platform: 'backend', bundle: 'backendRuleSet@1.0.0', hash: 'abc' }];

  let loadPreviousEvidenceRepoRoot = '';
  let toDetectedPlatformsRecordInput: DetectedPlatforms | undefined;
  let buildRulesetStateInput: Parameters<IEvidenceService['buildRulesetState']>[0] | undefined;
  const evidenceService: IEvidenceService = {
    loadPreviousEvidence: (repoRoot: string) => {
      loadPreviousEvidenceRepoRoot = repoRoot;
      return previousEvidence as never;
    },
    toDetectedPlatformsRecord: (detected) => {
      toDetectedPlatformsRecordInput = detected;
      return detectedPlatformsRecord;
    },
    buildRulesetState: (params) => {
      buildRulesetStateInput = params;
      return rulesetState as never;
    },
  };

  let capturedGenerateEvidenceParams: GenerateEvidenceParams | undefined;
  emitPlatformGateEvidence(
    {
      stage: 'PRE_PUSH',
      policyTrace,
      findings,
      gateOutcome: 'BLOCK',
      repoRoot: '/repo/root',
      detectedPlatforms,
      skillsRuleSet,
      projectRules,
      heuristicRules,
      filesScanned: 42,
      evaluationMetrics: {
        facts_total: 100,
        rules_total: 20,
        baseline_rules: 0,
        heuristic_rules: 0,
        skills_rules: 20,
        project_rules: 0,
        matched_rules: 1,
        unmatched_rules: 19,
        evaluated_rule_ids: ['skills.backend.no-empty-catch'],
        matched_rule_ids: ['skills.backend.no-empty-catch'],
        unmatched_rule_ids: ['skills.backend.avoid-explicit-any'],
      },
      rulesCoverage: {
        stage: 'PRE_PUSH',
        active_rule_ids: ['skills.backend.no-empty-catch', 'skills.backend.avoid-explicit-any'],
        evaluated_rule_ids: ['skills.backend.no-empty-catch'],
        matched_rule_ids: ['skills.backend.no-empty-catch'],
        unevaluated_rule_ids: ['skills.backend.avoid-explicit-any'],
        counts: {
          active: 2,
          evaluated: 1,
          matched: 1,
          unevaluated: 1,
        },
        coverage_ratio: 0.5,
      },
      evidenceService,
      sddDecision: {
        allowed: true,
        code: 'ALLOWED',
        message: 'sdd ok',
      },
    },
    {
      generateEvidence: (params: GenerateEvidenceParams) => {
        capturedGenerateEvidenceParams = params;
        return {
          evidence: { version: '2.1' },
          write: { ok: true, path: '/tmp/.ai_evidence.json' },
        };
      },
    }
  );

  assert.equal(loadPreviousEvidenceRepoRoot, '/repo/root');
  assert.deepEqual(toDetectedPlatformsRecordInput, detectedPlatforms);
  assert.ok(buildRulesetStateInput);
  assert.equal(buildRulesetStateInput?.stage, 'PRE_PUSH');
  assert.deepEqual(buildRulesetStateInput?.projectRules, projectRules);
  assert.deepEqual(buildRulesetStateInput?.heuristicRules, heuristicRules);
  assert.equal(
    buildRulesetStateInput?.heuristicsBundle,
    `astHeuristicsRuleSet@${rulePackVersions.astHeuristicsRuleSet}`
  );
  assert.deepEqual(buildRulesetStateInput?.skillsBundles, skillsRuleSet.activeBundles);
  assert.deepEqual(buildRulesetStateInput?.policyTrace, policyTrace);
  assert.ok(
    buildRulesetStateInput?.baselineRuleSets.some((entry) => entry.platform === 'backend')
  );
  assert.ok(capturedGenerateEvidenceParams);
  assert.equal(capturedGenerateEvidenceParams?.stage, 'PRE_PUSH');
  assert.deepEqual(capturedGenerateEvidenceParams?.findings, findings);
  assert.equal(capturedGenerateEvidenceParams?.gateOutcome, 'BLOCK');
  assert.equal(capturedGenerateEvidenceParams?.filesScanned, 42);
  assert.deepEqual(capturedGenerateEvidenceParams?.evaluationMetrics, {
    facts_total: 100,
    rules_total: 20,
    baseline_rules: 0,
    heuristic_rules: 0,
    skills_rules: 20,
    project_rules: 0,
    matched_rules: 1,
    unmatched_rules: 19,
    evaluated_rule_ids: ['skills.backend.no-empty-catch'],
    matched_rule_ids: ['skills.backend.no-empty-catch'],
    unmatched_rule_ids: ['skills.backend.avoid-explicit-any'],
  });
  assert.deepEqual(capturedGenerateEvidenceParams?.rulesCoverage, {
    stage: 'PRE_PUSH',
    active_rule_ids: ['skills.backend.avoid-explicit-any', 'skills.backend.no-empty-catch'],
    evaluated_rule_ids: ['skills.backend.no-empty-catch'],
    matched_rule_ids: ['skills.backend.no-empty-catch'],
    unevaluated_rule_ids: ['skills.backend.avoid-explicit-any'],
    counts: {
      active: 2,
      evaluated: 1,
      matched: 1,
      unevaluated: 1,
    },
    coverage_ratio: 0.5,
  });
  assert.deepEqual(capturedGenerateEvidenceParams?.previousEvidence, previousEvidence);
  assert.deepEqual(capturedGenerateEvidenceParams?.detectedPlatforms, detectedPlatformsRecord);
  assert.deepEqual(capturedGenerateEvidenceParams?.loadedRulesets, rulesetState);
  assert.deepEqual(capturedGenerateEvidenceParams?.sddMetrics, {
    enforced: true,
    stage: 'PRE_PUSH',
    decision: {
      allowed: true,
      code: 'ALLOWED',
      message: 'sdd ok',
    },
  });
});

test('emitPlatformGateEvidence inyecta evaluationMetrics vacio cuando no se informa cobertura', () => {
  const findings: ReadonlyArray<Finding> = [];
  const detectedPlatforms: DetectedPlatforms = {};
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
  };
  const projectRules: RuleSet = [];
  const heuristicRules: RuleSet = [];
  const evidenceService: IEvidenceService = {
    loadPreviousEvidence: () => undefined,
    toDetectedPlatformsRecord: () => ({}),
    buildRulesetState: () => [],
  };

  let capturedGenerateEvidenceParams: GenerateEvidenceParams | undefined;
  emitPlatformGateEvidence(
    {
      stage: 'PRE_COMMIT',
      findings,
      gateOutcome: 'PASS',
      repoRoot: '/repo/root',
      detectedPlatforms,
      skillsRuleSet,
      projectRules,
      heuristicRules,
      filesScanned: 0,
      evidenceService,
    },
    {
      generateEvidence: (params: GenerateEvidenceParams) => {
        capturedGenerateEvidenceParams = params;
        return {
          evidence: { version: '2.1' },
          write: { ok: true, path: '/tmp/.ai_evidence.json' },
        };
      },
    }
  );

  assert.deepEqual(capturedGenerateEvidenceParams?.evaluationMetrics, {
    facts_total: 0,
    rules_total: 0,
    baseline_rules: 0,
    heuristic_rules: 0,
    skills_rules: 0,
    project_rules: 0,
    matched_rules: 0,
    unmatched_rules: 0,
    evaluated_rule_ids: [],
    matched_rule_ids: [],
    unmatched_rule_ids: [],
  });
  assert.deepEqual(capturedGenerateEvidenceParams?.rulesCoverage, {
    stage: 'PRE_COMMIT',
    active_rule_ids: [],
    evaluated_rule_ids: [],
    matched_rule_ids: [],
    unevaluated_rule_ids: [],
    counts: {
      active: 0,
      evaluated: 0,
      matched: 0,
      unevaluated: 0,
    },
    coverage_ratio: 1,
  });
});
