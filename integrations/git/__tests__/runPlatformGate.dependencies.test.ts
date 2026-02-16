import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { GateOutcome } from '../../../core/gate/GateOutcome';
import type { GatePolicy } from '../../../core/gate/GatePolicy';
import type { RuleSet } from '../../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import type { IEvidenceService } from '../EvidenceService';
import type { IGitService } from '../GitService';
import type { GateDependencies } from '../runPlatformGate';
import { runPlatformGate } from '../runPlatformGate';

const buildGitStub = (repoRoot: string): IGitService => {
  return {
    runGit: () => '',
    getStagedFacts: () => [],
    resolveRepoRoot: () => repoRoot,
  };
};

const buildEvidenceStub = (): IEvidenceService => {
  return {
    loadPreviousEvidence: () => undefined,
    toDetectedPlatformsRecord: () => ({}),
    buildRulesetState: () => [],
  };
};

test('runPlatformGate permite inyectar dependencias internas sin monkey patch global', async () => {
  const policy: GatePolicy = {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = {
    kind: 'staged' as const,
    extensions: ['.ts'],
  };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'rules.backend.no-console-log',
      severity: 'WARN',
      code: 'NO_CONSOLE_LOG',
      message: 'No usar console.log',
      filePath: 'src/a.ts',
    },
  ];
  const evaluationResult = {
    detectedPlatforms: { backend: { detected: true, confidence: 'HIGH' as const } },
    skillsRuleSet: {
      rules: [],
      activeBundles: [],
      mappedHeuristicRuleIds: new Set<string>(),
      requiresHeuristicFacts: false,
    } satisfies SkillsRuleSetLoadResult,
    projectRules: [] as RuleSet,
    heuristicRules: [] as RuleSet,
    findings,
  };

  let resolvedScope: typeof scope | undefined;
  let evaluatedStage: GatePolicy['stage'] | undefined;
  let evaluatedRepoRoot: string | undefined;
  let emittedGateOutcome: GateOutcome | undefined;
  let printedFindings = false;

  const dependencies: Partial<GateDependencies> = {
    resolveFactsForGateScope: async (params) => {
      resolvedScope = params.scope as typeof scope;
      return facts;
    },
    evaluatePlatformGateFindings: (params) => {
      evaluatedStage = params.stage;
      evaluatedRepoRoot = params.repoRoot;
      return evaluationResult;
    },
    evaluateGate: () => ({
      outcome: 'PASS',
      blocking: [],
      warnings: [],
    }),
    emitPlatformGateEvidence: (params) => {
      emittedGateOutcome = params.gateOutcome;
    },
    printGateFindings: () => {
      printedFindings = true;
    },
  };

  const exitCode = await runPlatformGate({
    policy,
    scope,
    services: {
      git,
      evidence,
    },
    dependencies,
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(resolvedScope, scope);
  assert.equal(evaluatedStage, policy.stage);
  assert.equal(evaluatedRepoRoot, '/repo/root');
  assert.equal(emittedGateOutcome, 'PASS');
  assert.equal(printedFindings, false);
});
