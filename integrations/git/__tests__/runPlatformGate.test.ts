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
    coverage: {
      factsTotal: 1,
      filesScanned: 1,
      rulesTotal: 1,
      baselineRules: 0,
      heuristicRules: 0,
      skillsRules: 1,
      projectRules: 0,
      matchedRules: 1,
      unmatchedRules: 0,
      unevaluatedRules: 0,
      activeRuleIds: ['rules.backend.no-console-log'],
      evaluatedRuleIds: ['rules.backend.no-console-log'],
      matchedRuleIds: ['rules.backend.no-console-log'],
      unmatchedRuleIds: [],
      unevaluatedRuleIds: [],
    },
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
    evaluationMetrics: {
      facts_total: 1,
      rules_total: 1,
      baseline_rules: 0,
      heuristic_rules: 0,
      skills_rules: 1,
      project_rules: 0,
      matched_rules: 1,
      unmatched_rules: 0,
      evaluated_rule_ids: ['rules.backend.no-console-log'],
      matched_rule_ids: ['rules.backend.no-console-log'],
      unmatched_rule_ids: [],
    },
    rulesCoverage: {
      stage: 'PRE_PUSH',
      active_rule_ids: ['rules.backend.no-console-log'],
      evaluated_rule_ids: ['rules.backend.no-console-log'],
      matched_rule_ids: ['rules.backend.no-console-log'],
      unevaluated_rule_ids: [],
      counts: {
        active: 1,
        evaluated: 1,
        matched: 1,
        unevaluated: 0,
      },
      coverage_ratio: 1,
    },
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
  assert.deepEqual(emittedArgs?.evaluationMetrics, {
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
  assert.deepEqual(emittedArgs?.evaluationMetrics, {
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
  assert.deepEqual(emittedArgs?.evaluationMetrics, {
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

test('runPlatformGate bloquea por cobertura incompleta de reglas en PRE_COMMIT/PRE_PUSH/CI', async () => {
  const stages: GatePolicy['stage'][] = ['PRE_COMMIT', 'PRE_PUSH', 'CI'];

  for (const stage of stages) {
    const policy: GatePolicy = {
      stage,
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    };
    const scope =
      stage === 'CI'
        ? ({ kind: 'range' as const, fromRef: 'origin/main', toRef: 'HEAD' })
        : ({ kind: 'staged' as const });
    const git = buildGitStub('/repo/root');
    const evidence = buildEvidenceStub();

    let emittedArgs:
      | {
        findings: ReadonlyArray<Finding>;
        gateOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
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
          allowed: true,
          code: 'ALLOWED',
          message: 'ok',
        }),
        resolveFactsForGateScope: async () => [],
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
          coverage: {
            factsTotal: 0,
            filesScanned: 0,
            rulesTotal: 2,
            baselineRules: 0,
            heuristicRules: 0,
            skillsRules: 2,
            projectRules: 0,
            matchedRules: 1,
            unmatchedRules: 0,
            unevaluatedRules: 1,
            activeRuleIds: ['skills.backend.no-console-log', 'skills.backend.no-empty-catch'],
            evaluatedRuleIds: ['skills.backend.no-empty-catch'],
            matchedRuleIds: ['skills.backend.no-empty-catch'],
            unmatchedRuleIds: [],
            unevaluatedRuleIds: ['skills.backend.no-console-log'],
          },
          findings: [],
        }),
        evaluateGate: () => ({ outcome: 'ALLOW' }),
        emitPlatformGateEvidence: (paramsArg) => {
          emittedArgs = {
            findings: paramsArg.findings,
            gateOutcome: paramsArg.gateOutcome,
          };
        },
        printGateFindings: () => {},
      },
    });

    assert.equal(result, 1);
    assert.equal(emittedArgs?.gateOutcome, 'BLOCK');
    assert.equal(emittedArgs?.findings.some((finding) => finding.ruleId === 'governance.rules.coverage.incomplete'), true);
    const coverageFinding = emittedArgs?.findings.find(
      (finding) => finding.ruleId === 'governance.rules.coverage.incomplete'
    );
    assert.equal(coverageFinding?.severity, 'ERROR');
    assert.match(coverageFinding?.message ?? '', /unevaluated_rule_ids/i);
    assert.match(coverageFinding?.message ?? '', /coverage_ratio/i);
  }
});

test('runPlatformGate bloquea cuando existen reglas AUTO de skills sin detector AST mapeado', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'repo' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'ALLOW' | 'WARN' | 'BLOCK';
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
        allowed: true,
        code: 'ALLOWED',
        message: 'ok',
      }),
      resolveFactsForGateScope: async () => [],
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: { backend: { detected: true, confidence: 'HIGH' } },
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [
            'skills.backend.guideline.backend.verificar-que-no-viole-solid-srp-ocp-lsp-isp-dip',
          ],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: 0,
          filesScanned: 0,
          rulesTotal: 0,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 0,
          projectRules: 0,
          matchedRules: 0,
          unmatchedRules: 0,
          unevaluatedRules: 0,
          activeRuleIds: [],
          evaluatedRuleIds: [],
          matchedRuleIds: [],
          unmatchedRuleIds: [],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: () => ({ outcome: 'ALLOW' }),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  assert.equal(emittedArgs?.gateOutcome, 'BLOCK');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.detector-mapping.incomplete'
    ),
    true
  );
  const mappingFinding = emittedArgs?.findings.find(
    (finding) => finding.ruleId === 'governance.skills.detector-mapping.incomplete'
  );
  assert.equal(mappingFinding?.severity, 'ERROR');
  assert.match(mappingFinding?.message ?? '', /unsupported_auto_rule_ids/i);
});
