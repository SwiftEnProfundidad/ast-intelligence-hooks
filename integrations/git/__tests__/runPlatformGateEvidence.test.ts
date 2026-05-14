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
  memoryShadow?: {
    recommended_outcome: string;
    actual_outcome: string;
    confidence: number;
    reason_codes: string[];
  };
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
  skipDiskWrite?: boolean;
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
      memoryShadow: {
        recommended_outcome: 'BLOCK',
        actual_outcome: 'ALLOW',
        confidence: 0.9,
        reason_codes: ['shadow.diff'],
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
    contract: 'AUTO_RUNTIME_RULES_FOR_STAGE',
    scope_note:
      'rules_coverage reports AUTO runtime rules applicable to this stage, not total DECLARATIVE registry surface.',
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
  assert.deepEqual(capturedGenerateEvidenceParams?.memoryShadow, {
    recommended_outcome: 'BLOCK',
    actual_outcome: 'ALLOW',
    confidence: 0.9,
    reason_codes: ['shadow.diff'],
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
  assert.equal(capturedGenerateEvidenceParams?.skipDiskWrite, undefined);
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
    contract: 'AUTO_RUNTIME_RULES_FOR_STAGE',
    scope_note:
      'No runtime rules were evaluated for this stage. DECLARATIVE registry rules are not runtime detectors.',
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

test('emitPlatformGateEvidence delega telemetría estructurada con stage/outcome/policy', async () => {
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'governance.policy-as-code.invalid',
      severity: 'ERROR',
      code: 'POLICY_AS_CODE_SIGNATURE_MISMATCH',
      message: 'mismatch',
      filePath: '.pumuki/policy-as-code.json',
    },
  ];
  const detectedPlatforms: DetectedPlatforms = {
    backend: { detected: true, confidence: 'HIGH' },
  };
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
  };
  const evidenceService: IEvidenceService = {
    loadPreviousEvidence: () => undefined,
    toDetectedPlatformsRecord: () => ({ backend: { detected: true, confidence: 'HIGH' } }),
    buildRulesetState: () => [],
  };
  const policyTrace: ResolvedStagePolicy['trace'] = {
    source: 'default',
    bundle: 'gate-policy.default.PRE_PUSH',
    hash: 'abc123',
    version: 'policy-as-code/default@1.0',
    signature: 'f'.repeat(64),
    policySource: 'computed-local',
    validation: {
      status: 'valid',
      code: 'POLICY_AS_CODE_VALID',
      message: 'ok',
      strict: false,
    },
  };

  let telemetryCaptured:
    | {
      stage: string;
      gateOutcome: string;
      filesScanned: number;
      findingsCount: number;
      policyBundle: string | undefined;
      repoBranch: string | null;
    }
    | undefined;

  emitPlatformGateEvidence(
    {
      stage: 'PRE_PUSH',
      findings,
      gateOutcome: 'BLOCK',
      filesScanned: 5,
      repoRoot: '/repo/root',
      detectedPlatforms,
      skillsRuleSet,
      projectRules: [],
      heuristicRules: [],
      evidenceService,
      policyTrace,
    },
    {
      generateEvidence: () => ({
        evidence: { version: '2.1' },
        write: { ok: true, path: '/tmp/.ai_evidence.json' },
      }),
      emitGateTelemetryEvent: async (params) => {
        telemetryCaptured = {
          stage: params.stage,
          gateOutcome: params.gateOutcome,
          filesScanned: params.filesScanned,
          findingsCount: params.findings.length,
          policyBundle: params.policyTrace?.bundle,
          repoBranch: params.repoState.git.branch,
        };
        return {
          skipped: true,
          otel_dispatched: false,
          event: {} as never,
        };
      },
    }
  );

  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(telemetryCaptured, {
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    filesScanned: 5,
    findingsCount: 1,
    policyBundle: 'gate-policy.default.PRE_PUSH',
    repoBranch: null,
  });
});

test('emitPlatformGateEvidence pide skipDiskWrite en PRE_PUSH PASS cuando .ai_evidence.json está trackeado', () => {
  const findings: ReadonlyArray<Finding> = [];
  const detectedPlatforms: DetectedPlatforms = {};
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
  };
  const evidenceService: IEvidenceService = {
    loadPreviousEvidence: () => undefined,
    toDetectedPlatformsRecord: () => ({}),
    buildRulesetState: () => [],
  };

  let captured: GenerateEvidenceParams | undefined;
  emitPlatformGateEvidence(
    {
      stage: 'PRE_PUSH',
      findings,
      gateOutcome: 'PASS',
      filesScanned: 0,
      repoRoot: '/repo/root',
      detectedPlatforms,
      skillsRuleSet,
      projectRules: [],
      heuristicRules: [],
      evidenceService,
    },
    {
      generateEvidence: (params) => {
        captured = params;
        return { evidence: { version: '2.1' } as never, write: { ok: true, path: '/x' } };
      },
      isEvidencePathTracked: () => true,
    }
  );

  assert.equal(captured?.skipDiskWrite, true);
});

test('emitPlatformGateEvidence no pide skipDiskWrite en PRE_PUSH PASS si la evidencia no está trackeada', () => {
  const findings: ReadonlyArray<Finding> = [];
  const detectedPlatforms: DetectedPlatforms = {};
  const skillsRuleSet: SkillsRuleSetLoadResult = {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
  };
  const evidenceService: IEvidenceService = {
    loadPreviousEvidence: () => undefined,
    toDetectedPlatformsRecord: () => ({}),
    buildRulesetState: () => [],
  };

  let captured: GenerateEvidenceParams | undefined;
  emitPlatformGateEvidence(
    {
      stage: 'PRE_PUSH',
      findings,
      gateOutcome: 'PASS',
      filesScanned: 0,
      repoRoot: '/repo/root',
      detectedPlatforms,
      skillsRuleSet,
      projectRules: [],
      heuristicRules: [],
      evidenceService,
    },
    {
      generateEvidence: (params) => {
        captured = params;
        return { evidence: { version: '2.1' } as never, write: { ok: true, path: '/x' } };
      },
      isEvidencePathTracked: () => false,
    }
  );

  assert.equal(captured?.skipDiskWrite, undefined);
});
