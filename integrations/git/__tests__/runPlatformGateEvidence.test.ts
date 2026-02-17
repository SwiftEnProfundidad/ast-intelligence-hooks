import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from '../../../core/gate/Finding';
import { rulePackVersions } from '../../../core/rules/presets/rulePackVersions';
import type { RuleSet } from '../../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import type { ResolvedStagePolicy } from '../../gate/stagePolicies';
import type { DetectedPlatforms } from '../../platform/detectPlatforms';
import type { IEvidenceService } from '../EvidenceService';
import { emitPlatformGateEvidence } from '../runPlatformGateEvidence';

type GenerateEvidenceParams = {
  stage: string;
  findings: ReadonlyArray<Finding>;
  gateOutcome: string;
  previousEvidence: unknown;
  detectedPlatforms: unknown;
  loadedRulesets: unknown;
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
  assert.deepEqual(capturedGenerateEvidenceParams?.previousEvidence, previousEvidence);
  assert.deepEqual(capturedGenerateEvidenceParams?.detectedPlatforms, detectedPlatformsRecord);
  assert.deepEqual(capturedGenerateEvidenceParams?.loadedRulesets, rulesetState);
});
