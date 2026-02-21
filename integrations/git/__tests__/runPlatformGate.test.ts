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
    getRepoFacts: () => [],
    getRepoAndStagedFacts: () => [],
    getStagedAndUnstagedFacts: () => [],
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
      filesScanned: number;
      repoRoot: string;
      detectedPlatforms: typeof evaluationResult.detectedPlatforms;
      skillsRuleSet: SkillsRuleSetLoadResult;
      projectRules: RuleSet;
      heuristicRules: RuleSet;
      evidenceService: IEvidenceService;
      sddDecision?: {
        allowed: boolean;
        code: string;
        message: string;
      };
    }
    | undefined;
  let printedFindings: ReadonlyArray<Finding> | undefined;
  let sddCheckCalled = false;

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
      evaluateSddForStage: () => {
        sddCheckCalled = true;
        return {
          allowed: true,
          code: 'ALLOWED',
          message: 'ok',
        };
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
    filesScanned: 1,
    repoRoot: '/repo/root',
    detectedPlatforms: evaluationResult.detectedPlatforms,
    skillsRuleSet: evaluationResult.skillsRuleSet,
    projectRules: evaluationResult.projectRules,
    heuristicRules: evaluationResult.heuristicRules,
    evidenceService: evidence,
    sddDecision: {
      allowed: true,
      code: 'ALLOWED',
      message: 'ok',
    },
  });
  assert.deepEqual(printedFindings, findings);
  assert.equal(sddCheckCalled, true);
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
  let sddCheckCalled = false;

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
      evaluateSddForStage: () => {
        sddCheckCalled = true;
        return {
          allowed: true,
          code: 'ALLOWED',
          message: 'ok',
        };
      },
    },
  });

  assert.equal(result, 0);
  assert.equal(printCalled, false);
  assert.equal(emittedOutcome, 'ALLOW');
  assert.equal(sddCheckCalled, true);
});

test('runPlatformGate devuelve 1 cuando SDD bloquea PRE_COMMIT', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let resolveFactsCalled = false;
  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
      filesScanned: number;
      sddDecision?: {
        allowed: boolean;
        code: string;
        message: string;
      };
    }
    | undefined;

  const result = await runPlatformGate({
    policy,
    scope,
    services: {
      git,
      evidence,
    },
    dependencies: {
      evaluateSddForStage: () => ({
        allowed: false,
        code: 'SDD_SESSION_MISSING',
        message: 'session missing',
      }),
      resolveFactsForGateScope: async () => {
        resolveFactsCalled = true;
        return [];
      },
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        findings: [],
      }),
      evaluateGate: () => ({ outcome: 'ALLOW' }),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = paramsArg;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  assert.equal(resolveFactsCalled, false);
  assert.equal(emittedArgs?.gateOutcome, 'BLOCK');
  assert.equal(emittedArgs?.filesScanned, 0);
  assert.equal(emittedArgs?.findings.length, 1);
  assert.equal(emittedArgs?.findings[0]?.ruleId, 'sdd.policy.blocked');
  assert.equal(emittedArgs?.findings[0]?.source, 'sdd-policy');
  assert.deepEqual(emittedArgs?.sddDecision, {
    allowed: false,
    code: 'SDD_SESSION_MISSING',
    message: 'session missing',
  });
});

test('runPlatformGate devuelve 1 cuando SDD bloquea PRE_PUSH', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let resolveFactsCalled = false;
  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
      filesScanned: number;
      sddDecision?: {
        allowed: boolean;
        code: string;
        message: string;
      };
    }
    | undefined;

  const result = await runPlatformGate({
    policy,
    scope,
    services: {
      git,
      evidence,
    },
    dependencies: {
      evaluateSddForStage: () => ({
        allowed: false,
        code: 'SDD_VALIDATION_FAILED',
        message: 'validate failed',
      }),
      resolveFactsForGateScope: async () => {
        resolveFactsCalled = true;
        return [];
      },
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        findings: [],
      }),
      evaluateGate: () => ({ outcome: 'ALLOW' }),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = paramsArg;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  assert.equal(resolveFactsCalled, false);
  assert.equal(emittedArgs?.gateOutcome, 'BLOCK');
  assert.equal(emittedArgs?.filesScanned, 0);
  assert.equal(emittedArgs?.findings.length, 1);
  assert.equal(emittedArgs?.findings[0]?.ruleId, 'sdd.policy.blocked');
  assert.equal(emittedArgs?.findings[0]?.source, 'sdd-policy');
  assert.deepEqual(emittedArgs?.sddDecision, {
    allowed: false,
    code: 'SDD_VALIDATION_FAILED',
    message: 'validate failed',
  });
});

test('runPlatformGate devuelve 1 cuando SDD bloquea CI', async () => {
  const policy: GatePolicy = {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'range' as const, fromRef: 'origin/main', toRef: 'HEAD' };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let resolveFactsCalled = false;
  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
      filesScanned: number;
      sddDecision?: {
        allowed: boolean;
        code: string;
        message: string;
      };
    }
    | undefined;

  const result = await runPlatformGate({
    policy,
    scope,
    services: {
      git,
      evidence,
    },
    dependencies: {
      evaluateSddForStage: () => ({
        allowed: false,
        code: 'SDD_VALIDATION_FAILED',
        message: 'ci validate failed',
      }),
      resolveFactsForGateScope: async () => {
        resolveFactsCalled = true;
        return [];
      },
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        findings: [],
      }),
      evaluateGate: () => ({ outcome: 'ALLOW' }),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = paramsArg;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  assert.equal(resolveFactsCalled, false);
  assert.equal(emittedArgs?.gateOutcome, 'BLOCK');
  assert.equal(emittedArgs?.filesScanned, 0);
  assert.equal(emittedArgs?.findings.length, 1);
  assert.equal(emittedArgs?.findings[0]?.ruleId, 'sdd.policy.blocked');
  assert.equal(emittedArgs?.findings[0]?.source, 'sdd-policy');
  assert.deepEqual(emittedArgs?.sddDecision, {
    allowed: false,
    code: 'SDD_VALIDATION_FAILED',
    message: 'ci validate failed',
  });
});

test('runPlatformGate sin short-circuit SDD sigue evaluando findings de reglas y conserva bloqueo', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'repo' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let resolveFactsCalled = false;
  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
      filesScanned: number;
      sddDecision?: {
        allowed: boolean;
        code: string;
        message: string;
      };
    }
    | undefined;

  const result = await runPlatformGate({
    policy,
    scope,
    sddShortCircuit: false,
    services: {
      git,
      evidence,
    },
    dependencies: {
      evaluateSddForStage: () => ({
        allowed: false,
        code: 'SDD_SESSION_MISSING',
        message: 'session missing',
      }),
      resolveFactsForGateScope: async () => {
        resolveFactsCalled = true;
        return [];
      },
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        findings: [
          {
            ruleId: 'backend.avoid-explicit-any',
            severity: 'ERROR',
            code: 'NO_ANY',
            message: 'Avoid any',
            filePath: 'integrations/x.ts',
          },
        ],
      }),
      evaluateGate: () => ({ outcome: 'ALLOW' }),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = paramsArg;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  assert.equal(resolveFactsCalled, true);
  assert.equal(emittedArgs?.gateOutcome, 'BLOCK');
  assert.equal(emittedArgs?.filesScanned, 0);
  assert.equal(emittedArgs?.findings.length, 2);
  assert.equal(emittedArgs?.findings[0]?.ruleId, 'sdd.policy.blocked');
  assert.equal(emittedArgs?.findings[1]?.ruleId, 'backend.avoid-explicit-any');
  assert.deepEqual(emittedArgs?.sddDecision, {
    allowed: false,
    code: 'SDD_SESSION_MISSING',
    message: 'session missing',
  });
});
