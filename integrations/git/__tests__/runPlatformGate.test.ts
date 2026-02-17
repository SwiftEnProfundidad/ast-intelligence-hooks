import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { GatePolicy } from '../../../core/gate/GatePolicy';
import type { RuleSet } from '../../../core/rules/RuleSet';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import type { IEvidenceService } from '../EvidenceService';
import type { IGitService } from '../GitService';
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

test('runPlatformGate devuelve 1 e imprime findings cuando evaluateGate retorna BLOCK', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const policyTrace = {
    source: 'default' as const,
    bundle: 'gate-policy.default.PRE_PUSH',
    hash: 'trace-hash',
  };
  const scope = { kind: 'staged' as const, extensions: ['.ts'] };
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
      severity: 'ERROR',
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
    },
    projectRules: [] as RuleSet,
    heuristicRules: [] as RuleSet,
    findings,
  };

  let capturedResolveFactsArgs:
    | {
      scope: typeof scope;
      git: IGitService;
    }
    | undefined;
  let capturedEvaluationArgs:
    | {
      facts: ReadonlyArray<Fact>;
      stage: GatePolicy['stage'];
      repoRoot: string;
    }
    | undefined;
  let capturedEvaluateGateArgs:
    | {
      findings: ReadonlyArray<Finding>;
      policy: GatePolicy;
    }
    | undefined;
  let capturedEmitArgs:
    | {
      stage: GatePolicy['stage'];
      policyTrace?: typeof policyTrace;
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
      repoRoot: string;
      detectedPlatforms: typeof evaluationResult.detectedPlatforms;
      skillsRuleSet: SkillsRuleSetLoadResult;
      projectRules: RuleSet;
      heuristicRules: RuleSet;
      evidenceService: IEvidenceService;
    }
    | undefined;
  let printedFindings: ReadonlyArray<Finding> | undefined;

  const result = await runPlatformGate({
    policy,
    policyTrace,
    scope,
    services: {
      git,
      evidence,
    },
    dependencies: {
      resolveFactsForGateScope: async (paramsArg) => {
        capturedResolveFactsArgs = paramsArg as { scope: typeof scope; git: IGitService };
        return facts;
      },
      evaluatePlatformGateFindings: (paramsArg) => {
        capturedEvaluationArgs = paramsArg;
        return evaluationResult;
      },
      evaluateGate: (gateFindings, gatePolicy) => {
        capturedEvaluateGateArgs = { findings: gateFindings, policy: gatePolicy };
        return { outcome: 'BLOCK' };
      },
      emitPlatformGateEvidence: (paramsArg) => {
        capturedEmitArgs = paramsArg as typeof capturedEmitArgs;
      },
      printGateFindings: (gateFindings) => {
        printedFindings = gateFindings;
      },
    },
  });

  assert.equal(result, 1);
  assert.deepEqual(capturedResolveFactsArgs, { scope, git });
  assert.deepEqual(capturedEvaluationArgs, {
    facts,
    stage: 'PRE_PUSH',
    repoRoot: '/repo/root',
  });
  assert.ok(capturedEvaluateGateArgs);
  assert.notEqual(capturedEvaluateGateArgs?.findings, findings);
  assert.deepEqual(capturedEvaluateGateArgs?.findings, findings);
  assert.deepEqual(capturedEvaluateGateArgs?.policy, policy);
  assert.deepEqual(capturedEmitArgs, {
    stage: 'PRE_PUSH',
    policyTrace,
    findings,
    gateOutcome: 'BLOCK',
    repoRoot: '/repo/root',
    detectedPlatforms: evaluationResult.detectedPlatforms,
    skillsRuleSet: evaluationResult.skillsRuleSet,
    projectRules: evaluationResult.projectRules,
    heuristicRules: evaluationResult.heuristicRules,
    evidenceService: evidence,
  });
  assert.deepEqual(printedFindings, findings);
});

test('runPlatformGate devuelve 0 y no imprime findings cuando evaluateGate retorna ALLOW', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const findings: ReadonlyArray<Finding> = [];
  const evaluationResult = {
    detectedPlatforms: {},
    skillsRuleSet: {
      rules: [],
      activeBundles: [],
      mappedHeuristicRuleIds: new Set<string>(),
      requiresHeuristicFacts: false,
    },
    projectRules: [] as RuleSet,
    heuristicRules: [] as RuleSet,
    findings,
  };

  let printCalled = false;
  let emittedOutcome: 'ALLOW' | 'WARN' | 'BLOCK' | undefined;

  const result = await runPlatformGate({
    policy,
    scope,
    services: {
      git,
      evidence,
    },
    dependencies: {
      resolveFactsForGateScope: async () => [],
      evaluatePlatformGateFindings: () => evaluationResult,
      evaluateGate: () => ({ outcome: 'ALLOW' }),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedOutcome = paramsArg.gateOutcome;
      },
      printGateFindings: () => {
        printCalled = true;
      },
    },
  });

  assert.equal(result, 0);
  assert.equal(printCalled, false);
  assert.equal(emittedOutcome, 'ALLOW');
});
