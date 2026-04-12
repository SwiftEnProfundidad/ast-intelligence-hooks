import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { GatePolicy } from '../../../core/gate/GatePolicy';
import type { RuleSet } from '../../../core/rules/RuleSet';
import { isSeverityAtLeast } from '../../../core/rules/Severity';
import type { SkillsRuleSetLoadResult } from '../../config/skillsRuleSet';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { IEvidenceService } from '../EvidenceService';
import type { IGitService } from '../GitService';
import { runPlatformGate } from '../runPlatformGate';

const buildGitStub = (repoRoot: string): IGitService => {
  return {
    runGit: () => '',
    getStagedFacts: () => [],
    getUnstagedFacts: () => [],
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

const buildOutOfScopeTddBddResult = () => ({
  findings: [],
  snapshot: {
    status: 'skipped' as const,
    scope: {
      in_scope: false,
      is_new_feature: false,
      is_complex_change: false,
      reasons: [],
      metrics: {
        changed_files: 0,
        estimated_loc: 0,
        critical_path_files: 0,
        public_interface_files: 0,
      },
    },
    evidence: {
      path: '',
      state: 'not_required' as const,
      slices_total: 0,
      slices_valid: 0,
      slices_invalid: 0,
      integrity_ok: true,
      errors: [],
    },
    waiver: {
      applied: false,
    },
  },
});

const createSkillRule = (params: {
  id: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARN';
  platform: 'ios' | 'android' | 'backend' | 'frontend';
}): RuleSet[number] => ({
  id: params.id,
  description: params.id,
  severity: params.severity,
  platform: params.platform,
  when: {
    kind: 'FileContent',
    regex: ['a^'],
  },
  then: {
    kind: 'Finding',
    message: params.id,
    code: params.id.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase(),
  },
});

const withSkillsEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T>
): Promise<T> => {
  const previous = process.env.PUMUKI_SKILLS_ENFORCEMENT;

  if (value === undefined) {
    delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
  } else {
    process.env.PUMUKI_SKILLS_ENFORCEMENT = value;
  }

  try {
    return await callback();
  } finally {
    if (previous === undefined) {
      delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_SKILLS_ENFORCEMENT = previous;
    }
  }
};

const withTddBddEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T>
): Promise<T> => {
  const previous = process.env.PUMUKI_TDD_BDD_ENFORCEMENT;

  if (value === undefined) {
    delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
  } else {
    process.env.PUMUKI_TDD_BDD_ENFORCEMENT = value;
  }

  try {
    return await callback();
  } finally {
    if (previous === undefined) {
      delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
    } else {
      process.env.PUMUKI_TDD_BDD_ENFORCEMENT = previous;
    }
  }
};

const evaluateGateFromFindings = (findings: ReadonlyArray<Finding>, policy: GatePolicy) => {
  const hasBlocking = findings.some((finding) =>
    isSeverityAtLeast(finding.severity, policy.blockOnOrAbove)
  );
  if (hasBlocking) {
    return { outcome: 'BLOCK' as const };
  }
  const hasWarnings = findings.some((finding) =>
    !isSeverityAtLeast(finding.severity, policy.blockOnOrAbove) &&
    isSeverityAtLeast(finding.severity, policy.warnOnOrAbove)
  );
  return { outcome: hasWarnings ? ('WARN' as const) : ('PASS' as const) };
};

test('runPlatformGate silent evita salida humana en stdout para contratos JSON', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'rules.backend.no-console-log',
      severity: 'ERROR',
      code: 'NO_CONSOLE_LOG',
      message: 'No usar console.log',
      filePath: 'src/a.ts',
    },
  ];
  let printedFindingsCalled = false;
  let capturedStdout = '';
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown, encoding?: unknown, callback?: unknown) => {
    capturedStdout += String(chunk);
    if (typeof encoding === 'function') {
      encoding();
    }
    if (typeof callback === 'function') {
      callback();
    }
    return true;
  }) as typeof process.stdout.write;

  try {
    const result = await runPlatformGate({
      policy,
      scope: { kind: 'staged' },
      silent: true,
      services: {
        git,
        evidence,
      },
      dependencies: {
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
        }),
        evaluateGate: () => ({ outcome: 'BLOCK' }),
        emitPlatformGateEvidence: () => {},
        printGateFindings: () => {
          printedFindingsCalled = true;
        },
        enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
        evaluateSddForStage: () => ({
          allowed: false,
          code: 'SDD_SESSION_MISSING',
          message: 'session missing',
        }),
        resolveActiveGateWaiver: () => ({
          kind: 'none',
          path: '.pumuki/waivers/gate.json',
        }),
      },
    });

    assert.equal(result, 1);
    assert.equal(printedFindingsCalled, false);
    assert.equal(capturedStdout, '');
  } finally {
    process.stdout.write = originalWrite;
  }
});

test('runPlatformGate usa sddDecisionOverride y evita reevaluar SDD cuando llega una decisión ya resuelta', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  let evaluateSddCalls = 0;

  const result = await runPlatformGate({
    policy,
    scope: {
      kind: 'range',
      fromRef: 'origin/develop',
      toRef: 'abc123',
    },
    sddDecisionOverride: {
      allowed: true,
      code: 'ALLOWED',
      message: 'historical publish override',
    },
    services: {
      git,
      evidence,
    },
    dependencies: {
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
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: () => {},
      printGateFindings: () => {},
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      evaluateSddForStage: () => {
        evaluateSddCalls += 1;
        return {
          allowed: false,
          code: 'SDD_SESSION_MISSING',
          message: 'should not be called',
        };
      },
      resolveActiveGateWaiver: () => ({
        kind: 'none',
        path: '.pumuki/waivers/gate.json',
      }),
    },
  });

  assert.equal(result, 0);
  assert.equal(evaluateSddCalls, 0);
});

test('runPlatformGate complementa staged con repo cuando el delta solo cambia carriers del skills_contract', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const git = buildGitStub('/repo/root');
  git.runGit = (args) => {
    if (args.join(' ') === 'diff --cached --name-only') {
      return ['skills.lock.json', 'skills.sources.json'].join('\n');
    }
    return '';
  };
  const evidence = buildEvidenceStub();

  const stagedFacts: ReadonlyArray<Fact> = [];
  const repoFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      source: 'git:repo:working-tree',
      path: 'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
      changeType: 'modified',
    },
    {
      kind: 'FileContent',
      source: 'git:repo:working-tree',
      path: 'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
      content: 'public final class AppShellViewModel { public func restorePersistedSessionIfNeeded() async {} }',
    },
  ];

  let evaluateFacts: ReadonlyArray<Fact> = [];
  let tddFacts: ReadonlyArray<Fact> = [];

  const result = await runPlatformGate({
    policy,
    scope: { kind: 'staged' },
    services: {
      git,
      evidence,
    },
    dependencies: {
      resolveFactsForGateScope: async ({ scope }) => {
        if (scope.kind === 'repo') {
          return repoFacts;
        }
        return stagedFacts;
      },
      evaluatePlatformGateFindings: ({ facts }) => {
        evaluateFacts = facts;
        return {
          detectedPlatforms: {
            ios: { detected: true, confidence: 'HIGH' },
          },
          skillsRuleSet: {
            rules: [createSkillRule({
              id: 'skills.ios.no-force-unwrap',
              severity: 'CRITICAL',
              platform: 'ios',
            })],
            activeBundles: [
              { name: 'ios-guidelines', version: '1.0.0', source: 'test', hash: 'a'.repeat(64), rules: [] },
              { name: 'ios-concurrency-guidelines', version: '1.0.0', source: 'test', hash: 'b'.repeat(64), rules: [] },
              { name: 'ios-swiftui-expert-guidelines', version: '1.0.0', source: 'test', hash: 'c'.repeat(64), rules: [] },
            ],
            mappedHeuristicRuleIds: new Set<string>(),
            requiresHeuristicFacts: true,
            unsupportedAutoRuleIds: [],
          },
          projectRules: [] as RuleSet,
          heuristicRules: [] as RuleSet,
          coverage: {
            factsTotal: facts.length,
            filesScanned: 1,
            rulesTotal: 2,
            baselineRules: 1,
            heuristicRules: 0,
            skillsRules: 1,
            projectRules: 0,
            matchedRules: 1,
            unmatchedRules: 1,
            unevaluatedRules: 0,
            activeRuleIds: [
              'ios.canary-001.presentation-mixed-responsibilities',
              'skills.ios.no-force-unwrap',
            ],
            evaluatedRuleIds: [
              'ios.canary-001.presentation-mixed-responsibilities',
              'skills.ios.no-force-unwrap',
            ],
            matchedRuleIds: ['ios.canary-001.presentation-mixed-responsibilities'],
            unmatchedRuleIds: ['skills.ios.no-force-unwrap'],
            unevaluatedRuleIds: [],
          },
          findings: [
            {
              ruleId: 'ios.canary-001.presentation-mixed-responsibilities',
              severity: 'CRITICAL',
              code: 'IOS_CANARY_001_PRESENTATION_MIXED_RESPONSIBILITIES',
              message: 'semantic canary',
              filePath: 'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
              blocking: true,
              primary_node: {
                kind: 'class',
                name: 'AppShellViewModel',
                lines: [1],
              },
              related_nodes: [
                { kind: 'member', name: 'session bootstrap/restoration', lines: [1] },
              ],
              why: 'why',
              impact: 'impact',
              expected_fix: 'fix',
            },
          ],
        };
      },
      evaluateGate: () => ({ outcome: 'BLOCK' }),
      emitPlatformGateEvidence: () => {},
      printGateFindings: () => {},
      enforceTddBddPolicy: ({ facts }) => {
        tddFacts = facts;
        return buildOutOfScopeTddBddResult();
      },
      evaluateSddForStage: () => ({
        allowed: true,
        code: 'ALLOWED',
        message: 'ok',
      }),
      resolveActiveGateWaiver: () => ({
        kind: 'none',
        path: '.pumuki/waivers/gate.json',
      }),
    },
  });

  assert.equal(result, 1);
  assert.equal(evaluateFacts.some((fact) => {
    return (
      (fact.kind === 'FileChange' || fact.kind === 'FileContent') &&
      fact.path === 'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift'
    );
  }), true);
  assert.deepEqual(tddFacts, stagedFacts);
});

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
    auditMode: 'gate',
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
  let emittedOutcome: 'PASS' | 'WARN' | 'BLOCK' | undefined;
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
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
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
  assert.equal(emittedOutcome, 'PASS');
  assert.equal(sddCheckCalled, true);
});

test('runPlatformGate bloquea en modo strict cuando policy-as-code es inválida', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let emittedFindings: ReadonlyArray<Finding> = [];

  const result = await runPlatformGate({
    policy,
    policyTrace: {
      source: 'default',
      bundle: 'gate-policy.default.PRE_COMMIT',
      hash: 'f'.repeat(64),
      version: 'policy-as-code/default@1.0',
      signature: 'a'.repeat(64),
      policySource: 'file:.pumuki/policy-as-code.json',
      validation: {
        status: 'invalid',
        code: 'POLICY_AS_CODE_SIGNATURE_MISMATCH',
        message: 'mismatch',
        strict: true,
      },
    },
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
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedFindings = paramsArg.findings;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  const policyFinding = emittedFindings.find(
    (finding) => finding.ruleId === 'governance.policy-as-code.invalid'
  );
  assert.ok(policyFinding);
  assert.equal(policyFinding?.code, 'POLICY_AS_CODE_SIGNATURE_MISMATCH');
  assert.equal(policyFinding?.source, 'policy-as-code');
});

test('runPlatformGate bloquea en modo strict cuando policy-as-code está unsigned', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let emittedFindings: ReadonlyArray<Finding> = [];

  const result = await runPlatformGate({
    policy,
    policyTrace: {
      source: 'default',
      bundle: 'gate-policy.default.PRE_COMMIT',
      hash: 'f'.repeat(64),
      version: 'policy-as-code/default@1.0',
      signature: 'a'.repeat(64),
      policySource: 'computed-local',
      validation: {
        status: 'unsigned',
        code: 'POLICY_AS_CODE_UNSIGNED',
        message: 'Policy-as-code contract is missing; runtime policy metadata is unsigned.',
        strict: true,
      },
    },
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
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedFindings = paramsArg.findings;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  const policyFinding = emittedFindings.find(
    (finding) => finding.ruleId === 'governance.policy-as-code.invalid'
  );
  assert.ok(policyFinding);
  assert.equal(policyFinding?.code, 'POLICY_AS_CODE_UNSIGNED');
  assert.equal(policyFinding?.source, 'policy-as-code');
});

test('runPlatformGate bloquea en modo strict cuando policy-as-code está expirada', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'range' as const, baseRef: 'origin/develop', headRef: 'HEAD' };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let emittedFindings: ReadonlyArray<Finding> = [];

  const result = await runPlatformGate({
    policy,
    policyTrace: {
      source: 'default',
      bundle: 'gate-policy.default.PRE_PUSH',
      hash: 'f'.repeat(64),
      version: 'policy-as-code/default@1.0',
      signature: 'a'.repeat(64),
      policySource: 'file:.pumuki/policy-as-code.json',
      validation: {
        status: 'expired',
        code: 'POLICY_AS_CODE_CONTRACT_EXPIRED',
        message: 'Policy-as-code contract expired at 2000-01-01T00:00:00.000Z.',
        strict: true,
      },
    },
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
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedFindings = paramsArg.findings;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  const policyFinding = emittedFindings.find(
    (finding) => finding.ruleId === 'governance.policy-as-code.invalid'
  );
  assert.ok(policyFinding);
  assert.equal(policyFinding?.code, 'POLICY_AS_CODE_CONTRACT_EXPIRED');
  assert.equal(policyFinding?.source, 'policy-as-code');
});

test('runPlatformGate bloquea cuando degraded mode está activo en fail-closed para el stage', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'range' as const, baseRef: 'origin/develop', headRef: 'HEAD' };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let emittedFindings: ReadonlyArray<Finding> = [];

  const result = await runPlatformGate({
    policy,
    policyTrace: {
      source: 'default',
      bundle: 'gate-policy.default.PRE_PUSH',
      hash: 'f'.repeat(64),
      version: 'policy-as-code/default@1.0',
      signature: 'a'.repeat(64),
      policySource: 'computed-local',
      degraded: {
        enabled: true,
        action: 'block',
        reason: 'offline-airgapped',
        source: 'env',
        code: 'DEGRADED_MODE_BLOCKED',
      },
      validation: {
        status: 'valid',
        code: 'POLICY_AS_CODE_VALID',
        message: 'Policy-as-code contract verified successfully.',
        strict: false,
      },
    },
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
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedFindings = paramsArg.findings;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  const degradedFinding = emittedFindings.find(
    (finding) => finding.ruleId === 'governance.degraded-mode.blocked'
  );
  assert.ok(degradedFinding);
  assert.equal(degradedFinding?.code, 'DEGRADED_MODE_BLOCKED');
  assert.equal(degradedFinding?.source, 'degraded-mode');
});

test('runPlatformGate mantiene allow cuando degraded mode está activo en fail-open para el stage', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let emittedFindings: ReadonlyArray<Finding> = [];

  const result = await runPlatformGate({
    policy,
    policyTrace: {
      source: 'default',
      bundle: 'gate-policy.default.PRE_COMMIT',
      hash: 'f'.repeat(64),
      version: 'policy-as-code/default@1.0',
      signature: 'a'.repeat(64),
      policySource: 'computed-local',
      degraded: {
        enabled: true,
        action: 'allow',
        reason: 'offline-airgapped',
        source: 'env',
        code: 'DEGRADED_MODE_ALLOWED',
      },
      validation: {
        status: 'valid',
        code: 'POLICY_AS_CODE_VALID',
        message: 'Policy-as-code contract verified successfully.',
        strict: false,
      },
    },
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
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedFindings = paramsArg.findings;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  const degradedFinding = emittedFindings.find(
    (finding) => finding.ruleId === 'governance.degraded-mode.active'
  );
  assert.ok(degradedFinding);
  assert.equal(degradedFinding?.code, 'DEGRADED_MODE_ALLOWED');
  assert.equal(degradedFinding?.severity, 'INFO');
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
  assert.equal(resolveFactsCalled, true);
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
  assert.equal(resolveFactsCalled, true);
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
  assert.equal(resolveFactsCalled, true);
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

test('runPlatformGate permite short-circuit SDD explícito cuando sddShortCircuit=true', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
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
    }
    | undefined;

  const result = await runPlatformGate({
    policy,
    scope,
    sddShortCircuit: true,
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

test('runPlatformGate en auditMode=engine no hace short-circuit por SDD y persiste auditMode', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'repo' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let resolveFactsCalled = false;
  let emittedAuditMode: 'gate' | 'engine' | undefined;
  let emittedFindings: ReadonlyArray<Finding> = [];

  const result = await runPlatformGate({
    policy,
    scope,
    auditMode: 'engine',
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
        emittedAuditMode = paramsArg.auditMode;
        emittedFindings = paramsArg.findings;
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 1);
  assert.equal(resolveFactsCalled, true);
  assert.equal(emittedAuditMode, 'engine');
  assert.equal(emittedFindings.length, 2);
  assert.equal(emittedFindings[0]?.ruleId, 'sdd.policy.blocked');
  assert.equal(emittedFindings[1]?.ruleId, 'backend.avoid-explicit-any');
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

test('runPlatformGate mantiene cobertura completa por stage en modo gate', async () => {
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
        rulesCoverage?: {
          stage: string;
          unevaluated_rule_ids: string[];
          coverage_ratio: number;
          unsupported_auto_rule_ids?: string[];
          counts: {
            unevaluated: number;
            unsupported_auto?: number;
          };
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
          allowed: true,
          code: 'ALLOWED',
          message: 'ok',
        }),
        resolveFactsForGateScope: async () => [],
        evaluatePlatformGateFindings: () => ({
          detectedPlatforms: { backend: { detected: true, confidence: 'HIGH' } },
          skillsRuleSet: {
            rules: [
              createSkillRule({
                id: 'skills.backend.no-empty-catch',
                severity: 'ERROR',
                platform: 'backend',
              }),
            ] as RuleSet,
            activeBundles: [
              {
                name: 'backend-guidelines',
                version: '1.0.0',
                source: 'file:docs/codex-skills/windsurf-rules-backend.md',
                hash: 'a'.repeat(64),
                rules: [],
              },
            ],
            mappedHeuristicRuleIds: new Set<string>(),
            requiresHeuristicFacts: false,
            unsupportedAutoRuleIds: [],
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
            matchedRules: 0,
            unmatchedRules: 2,
            unevaluatedRules: 0,
            activeRuleIds: ['skills.backend.no-console-log', 'skills.backend.no-empty-catch'],
            evaluatedRuleIds: ['skills.backend.no-console-log', 'skills.backend.no-empty-catch'],
            matchedRuleIds: [],
            unmatchedRuleIds: ['skills.backend.no-console-log', 'skills.backend.no-empty-catch'],
            unevaluatedRuleIds: [],
          },
          findings: [],
        }),
        evaluateGate: () => ({ outcome: 'ALLOW' }),
        emitPlatformGateEvidence: (paramsArg) => {
          emittedArgs = {
            findings: paramsArg.findings,
            gateOutcome: paramsArg.gateOutcome,
            rulesCoverage: paramsArg.rulesCoverage as {
              stage: string;
              unevaluated_rule_ids: string[];
              coverage_ratio: number;
              unsupported_auto_rule_ids?: string[];
              counts: {
                unevaluated: number;
                unsupported_auto?: number;
              };
            },
          };
        },
        printGateFindings: () => {},
      },
    });

    assert.equal(result, 0);
    assert.equal(emittedArgs?.gateOutcome, 'ALLOW');
    assert.equal(emittedArgs?.rulesCoverage?.stage, stage);
    assert.deepEqual(emittedArgs?.rulesCoverage?.unevaluated_rule_ids, []);
    assert.equal(emittedArgs?.rulesCoverage?.counts.unevaluated, 0);
    assert.equal(emittedArgs?.rulesCoverage?.coverage_ratio, 1);
    assert.equal(emittedArgs?.rulesCoverage?.unsupported_auto_rule_ids, undefined);
    assert.equal(emittedArgs?.rulesCoverage?.counts.unsupported_auto, undefined);
    assert.equal(
      emittedArgs?.findings.some(
        (finding) =>
          finding.ruleId === 'governance.rules.coverage.incomplete'
          || finding.ruleId === 'governance.skills.detector-mapping.incomplete'
          || finding.ruleId === 'governance.skills.platform-coverage.incomplete'
      ),
      false
    );
  }
});

test('runPlatformGate mantiene advisory cuando existen reglas AUTO de skills sin detector AST mapeado', async () => {
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
      rulesCoverage?: {
        unsupported_auto_rule_ids?: string[];
        counts?: {
          unsupported_auto?: number;
        };
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
          activeRuleIds: ['skills.backend.no-empty-catch'],
          evaluatedRuleIds: [],
          matchedRuleIds: [],
          unmatchedRuleIds: [],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
          rulesCoverage: paramsArg.rulesCoverage as {
            unsupported_auto_rule_ids?: string[];
            counts?: {
              unsupported_auto?: number;
            };
          },
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'WARN');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.detector-mapping.incomplete'
    ),
    true
  );
  const mappingFinding = emittedArgs?.findings.find(
    (finding) => finding.ruleId === 'governance.skills.detector-mapping.incomplete'
  );
  assert.equal(mappingFinding?.severity, 'WARN');
  assert.match(mappingFinding?.message ?? '', /unsupported_auto_rule_ids/i);
  assert.deepEqual(emittedArgs?.rulesCoverage?.unsupported_auto_rule_ids, [
    'skills.backend.guideline.backend.verificar-que-no-viole-solid-srp-ocp-lsp-isp-dip',
  ]);
  assert.equal(emittedArgs?.rulesCoverage?.counts?.unsupported_auto, 1);
});

test('runPlatformGate bloquea en modo strict cuando existen reglas AUTO de skills sin detector AST mapeado', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
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
    const mappingFinding = emittedArgs?.findings.find(
      (finding) => finding.ruleId === 'governance.skills.detector-mapping.incomplete'
    );
    assert.ok(mappingFinding);
    assert.equal(mappingFinding.severity, 'ERROR');
  });
});

test('runPlatformGate mantiene advisory cuando iOS detectado no tiene triplete de bundles y cobertura de reglas skills', async () => {
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
        detectedPlatforms: { ios: { detected: true, confidence: 'HIGH' } },
        skillsRuleSet: {
          rules: [
            createSkillRule({
              id: 'skills.ios.no-force-try',
              severity: 'ERROR',
              platform: 'ios',
            }),
            createSkillRule({
              id: 'skills.backend.no-empty-catch',
              severity: 'ERROR',
              platform: 'backend',
            }),
            createSkillRule({
              id: 'skills.frontend.no-empty-catch',
              severity: 'ERROR',
              platform: 'frontend',
            }),
            createSkillRule({
              id: 'skills.android.no-runblocking',
              severity: 'ERROR',
              platform: 'android',
            }),
          ] as RuleSet,
          activeBundles: [
            {
              name: 'ios-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-ios.md',
              hash: 'a'.repeat(64),
              rules: [],
            },
          ],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
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
          activeRuleIds: ['skills.backend.no-empty-catch'],
          evaluatedRuleIds: [],
          matchedRuleIds: [],
          unmatchedRuleIds: [],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'WARN');
  const coverageFinding = emittedArgs?.findings.find(
    (finding) => finding.ruleId === 'governance.skills.platform-coverage.incomplete'
  );
  assert.ok(coverageFinding);
  assert.equal(coverageFinding.severity, 'WARN');
  assert.match(coverageFinding.message, /ios/i);
  assert.match(coverageFinding.message, /ios-concurrency-guidelines/i);
  assert.match(coverageFinding.message, /ios-swiftui-expert-guidelines/i);
});

test('runPlatformGate permite cuando plataformas detectadas tienen bundles y reglas skills activas/evaluadas', async () => {
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
        detectedPlatforms: {
          ios: { detected: true, confidence: 'HIGH' },
          backend: { detected: true, confidence: 'HIGH' },
          frontend: { detected: true, confidence: 'HIGH' },
          android: { detected: true, confidence: 'HIGH' },
        },
        skillsRuleSet: {
          rules: [
            createSkillRule({
              id: 'skills.ios.no-force-try',
              severity: 'ERROR',
              platform: 'ios',
            }),
            createSkillRule({
              id: 'skills.backend.no-empty-catch',
              severity: 'ERROR',
              platform: 'backend',
            }),
            createSkillRule({
              id: 'skills.frontend.no-empty-catch',
              severity: 'ERROR',
              platform: 'frontend',
            }),
            createSkillRule({
              id: 'skills.android.no-runblocking',
              severity: 'ERROR',
              platform: 'android',
            }),
          ] as RuleSet,
          activeBundles: [
            {
              name: 'ios-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-ios.md',
              hash: 'a'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-concurrency-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-concurrency.md',
              hash: 'b'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swiftui-expert-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swiftui-expert-skill.md',
              hash: 'c'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swift-testing-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-testing-expert.md',
              hash: 'e'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-core-data-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/core-data-expert.md',
              hash: 'f'.repeat(64),
              rules: [],
            },
            {
              name: 'backend-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-backend.md',
              hash: 'd'.repeat(64),
              rules: [],
            },
            {
              name: 'frontend-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-frontend.md',
              hash: 'e'.repeat(64),
              rules: [],
            },
            {
              name: 'android-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-android.md',
              hash: 'f'.repeat(64),
              rules: [],
            },
          ],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: 0,
          filesScanned: 0,
          rulesTotal: 4,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 4,
          projectRules: 0,
          matchedRules: 0,
          unmatchedRules: 4,
          unevaluatedRules: 0,
          activeRuleIds: [
            'skills.ios.no-force-try',
            'skills.backend.no-empty-catch',
            'skills.frontend.no-empty-catch',
            'skills.android.no-runblocking',
          ],
          evaluatedRuleIds: [
            'skills.ios.no-force-try',
            'skills.backend.no-empty-catch',
            'skills.frontend.no-empty-catch',
            'skills.android.no-runblocking',
          ],
          matchedRuleIds: [],
          unmatchedRuleIds: [
            'skills.ios.no-force-try',
            'skills.backend.no-empty-catch',
            'skills.frontend.no-empty-catch',
            'skills.android.no-runblocking',
          ],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'PASS');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.platform-coverage.incomplete'
    ),
    false
  );
});

test('runPlatformGate mantiene advisory cuando una plataforma detectada no tiene reglas críticas de skills activas', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
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
        detectedPlatforms: {
          ios: { detected: true, confidence: 'HIGH' },
          backend: { detected: true, confidence: 'HIGH' },
        },
        skillsRuleSet: {
          rules: [
            createSkillRule({
              id: 'skills.backend.critical-contract',
              severity: 'ERROR',
              platform: 'backend',
            }),
          ] as RuleSet,
          activeBundles: [
            {
              name: 'ios-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-ios.md',
              hash: 'a'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-concurrency-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-concurrency.md',
              hash: 'b'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swiftui-expert-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swiftui-expert-skill.md',
              hash: 'c'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swift-testing-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-testing-expert.md',
              hash: 'e'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-core-data-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/core-data-expert.md',
              hash: 'f'.repeat(64),
              rules: [],
            },
            {
              name: 'backend-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-backend.md',
              hash: 'd'.repeat(64),
              rules: [],
            },
          ],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
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
          matchedRules: 0,
          unmatchedRules: 2,
          unevaluatedRules: 0,
          activeRuleIds: [
            'skills.ios.no-force-try',
            'skills.backend.critical-contract',
          ],
          evaluatedRuleIds: [
            'skills.ios.no-force-try',
            'skills.backend.critical-contract',
          ],
          matchedRuleIds: [],
          unmatchedRuleIds: [
            'skills.ios.no-force-try',
            'skills.backend.critical-contract',
          ],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'WARN');
  const criticalCoverageFinding = emittedArgs?.findings.find(
    (finding) => finding.ruleId === 'governance.skills.cross-platform-critical.incomplete'
  );
  assert.ok(criticalCoverageFinding);
  assert.equal(criticalCoverageFinding.severity, 'WARN');
  assert.match(criticalCoverageFinding.message, /ios/i);
});

test('runPlatformGate permite cuando plataformas detectadas tienen reglas críticas activas y evaluadas', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
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
        detectedPlatforms: {
          ios: { detected: true, confidence: 'HIGH' },
          backend: { detected: true, confidence: 'HIGH' },
        },
        skillsRuleSet: {
          rules: [
            createSkillRule({
              id: 'skills.ios.critical-thread-safety',
              severity: 'ERROR',
              platform: 'ios',
            }),
            createSkillRule({
              id: 'skills.backend.critical-contract',
              severity: 'CRITICAL',
              platform: 'backend',
            }),
          ] as RuleSet,
          activeBundles: [
            {
              name: 'ios-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-ios.md',
              hash: 'a'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-concurrency-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-concurrency.md',
              hash: 'b'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swiftui-expert-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swiftui-expert-skill.md',
              hash: 'c'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swift-testing-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-testing-expert.md',
              hash: 'e'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-core-data-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/core-data-expert.md',
              hash: 'f'.repeat(64),
              rules: [],
            },
            {
              name: 'backend-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-backend.md',
              hash: 'd'.repeat(64),
              rules: [],
            },
          ],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
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
          matchedRules: 0,
          unmatchedRules: 2,
          unevaluatedRules: 0,
          activeRuleIds: [
            'skills.ios.critical-thread-safety',
            'skills.backend.critical-contract',
          ],
          evaluatedRuleIds: [
            'skills.ios.critical-thread-safety',
            'skills.backend.critical-contract',
          ],
          matchedRuleIds: [],
          unmatchedRuleIds: [
            'skills.ios.critical-thread-safety',
            'skills.backend.critical-contract',
          ],
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

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'ALLOW');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.cross-platform-critical.incomplete'
    ),
    false
  );
});

test('runPlatformGate mantiene advisory cuando el scope de archivos exige skills activas/evaluadas y faltan prefijos', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/orders/order-service.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];

  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'PASS' | 'ALLOW' | 'WARN' | 'BLOCK';
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
      resolveFactsForGateScope: async () => facts,
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: facts.length,
          filesScanned: 1,
          rulesTotal: 1,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 1,
          projectRules: 0,
          matchedRules: 0,
          unmatchedRules: 1,
          unevaluatedRules: 0,
          activeRuleIds: ['skills.ios.no-force-unwrap'],
          evaluatedRuleIds: ['skills.ios.no-force-unwrap'],
          matchedRuleIds: [],
          unmatchedRuleIds: ['skills.ios.no-force-unwrap'],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'WARN');
  const scopeFinding = emittedArgs?.findings.find(
    (finding) => finding.ruleId === 'governance.skills.scope-compliance.incomplete'
  );
  assert.ok(scopeFinding);
  assert.equal(scopeFinding.severity, 'WARN');
  assert.match(scopeFinding.message, /backend/i);
  assert.match(scopeFinding.message, /skills\.backend\./i);
});

test('runPlatformGate permite cuando el scope de archivos tiene prefijos de skills activos y evaluados', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/orders/order-service.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];

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
      resolveFactsForGateScope: async () => facts,
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: facts.length,
          filesScanned: 1,
          rulesTotal: 1,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 1,
          projectRules: 0,
          matchedRules: 0,
          unmatchedRules: 1,
          unevaluatedRules: 0,
          activeRuleIds: ['skills.backend.no-empty-catch'],
          evaluatedRuleIds: ['skills.backend.no-empty-catch'],
          matchedRuleIds: [],
          unmatchedRuleIds: ['skills.backend.no-empty-catch'],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'PASS');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.scope-compliance.incomplete'
    ),
    false
  );
});

test('runPlatformGate aplica soft-enforcement en PRE_COMMIT para coverage de skills en low-risk window', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'apps/frontend/src/ui/labels.tsx',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];

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
      resolveFactsForGateScope: async () => facts,
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {
          frontend: { detected: true, confidence: 'HIGH' },
        },
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: facts.length,
          filesScanned: 1,
          rulesTotal: 1,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 1,
          projectRules: 0,
          matchedRules: 0,
          unmatchedRules: 1,
          unevaluatedRules: 0,
          activeRuleIds: ['skills.backend.no-empty-catch'],
          evaluatedRuleIds: ['skills.backend.no-empty-catch'],
          matchedRuleIds: [],
          unmatchedRuleIds: ['skills.backend.no-empty-catch'],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => {
        const hasWarn = findingsArg.some((finding) => finding.severity === 'WARN');
        const hasError = findingsArg.some((finding) =>
          finding.severity === 'ERROR' || finding.severity === 'CRITICAL'
        );
        if (hasError) {
          return { outcome: 'BLOCK' };
        }
        return { outcome: hasWarn ? 'WARN' : 'ALLOW' };
      },
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'WARN');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.platform-coverage.incomplete'
    ),
    true
  );
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.cross-platform-critical.incomplete'
    ),
    true
  );
  assert.equal(
    emittedArgs?.findings
      .filter((finding) =>
        finding.ruleId === 'governance.skills.platform-coverage.incomplete'
        || finding.ruleId === 'governance.skills.cross-platform-critical.incomplete'
      )
      .every((finding) => finding.severity === 'WARN'),
    true
  );
});

test('runPlatformGate bloquea cuando hay cambios de código y active_rule_ids queda vacío', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/orders/order-service.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];

  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'PASS' | 'ALLOW' | 'WARN' | 'BLOCK';
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
      resolveFactsForGateScope: async () => facts,
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: facts.length,
          filesScanned: 1,
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
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
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
  const finding = emittedArgs?.findings.find(
    (entry) => entry.ruleId === 'governance.rules.active-rule-coverage.empty'
  );
  assert.ok(finding);
  assert.equal(finding.severity, 'ERROR');
  assert.match(finding.message, /code changes/i);
  assert.match(finding.message, /apps\/backend\/src\/orders\/order-service\.ts/i);
});

test('runPlatformGate permite cuando active_rule_ids está vacío pero no hay cambios de código', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'docs/README.md',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];

  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'PASS' | 'ALLOW' | 'WARN' | 'BLOCK';
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
      resolveFactsForGateScope: async () => facts,
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: facts.length,
          filesScanned: 1,
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
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'ALLOW');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.rules.active-rule-coverage.empty'
    ),
    false
  );
});

test('runPlatformGate mantiene advisory cuando test iOS XCTest no usa makeSUT ni trackForMemoryLeaks', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/ios/Tests/Feature/LoginUseCaseTests.swift',
      content: `
import XCTest

final class LoginUseCaseTests: XCTestCase {
  func test_login_deliversTokenOnSuccess() {
    XCTAssertTrue(true)
  }
}
      `.trim(),
      source: 'git:staged',
    },
  ];

  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'PASS' | 'ALLOW' | 'WARN' | 'BLOCK';
    }
    | undefined = undefined;
  let emitted = emittedArgs;

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
      resolveFactsForGateScope: async () => facts,
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {
          ios: { detected: true, confidence: 'HIGH' },
        },
        skillsRuleSet: {
          rules: [
            createSkillRule({
              id: 'skills.ios.critical-test-quality',
              severity: 'ERROR',
              platform: 'ios',
            }),
          ] as RuleSet,
          activeBundles: [
            {
              name: 'ios-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-ios.md',
              hash: 'a'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-concurrency-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-concurrency.md',
              hash: 'b'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swiftui-expert-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swiftui-expert-skill.md',
              hash: 'c'.repeat(64),
              rules: [],
            },
          ],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: facts.length,
          filesScanned: 1,
          rulesTotal: 2,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 2,
          projectRules: 0,
          matchedRules: 0,
          unmatchedRules: 2,
          unevaluatedRules: 0,
          activeRuleIds: ['skills.ios.no-force-unwrap', 'skills.ios.critical-test-quality'],
          evaluatedRuleIds: ['skills.ios.no-force-unwrap', 'skills.ios.critical-test-quality'],
          matchedRuleIds: [],
          unmatchedRuleIds: ['skills.ios.no-force-unwrap', 'skills.ios.critical-test-quality'],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: (findingsArg) => evaluateGateFromFindings(findingsArg, policy),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      emitPlatformGateEvidence: (paramsArg) => {
        emitted = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emitted?.gateOutcome, 'WARN');
  const finding = emitted?.findings.find(
    (entry) => entry.ruleId === 'governance.skills.ios-test-quality.incomplete'
  );
  assert.ok(finding);
  assert.equal(finding.severity, 'WARN');
  assert.match(finding.message, /makeSUT/i);
  assert.match(finding.message, /trackForMemoryLeaks/i);
});

test('runPlatformGate permite cuando test iOS XCTest usa makeSUT y trackForMemoryLeaks', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const scope = { kind: 'staged' as const };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/ios/Tests/Feature/LoginUseCaseTests.swift',
      content: `
import XCTest

final class LoginUseCaseTests: XCTestCase {
  func test_login_deliversTokenOnSuccess() {
    let (sut, _, _) = makeSUT()
    trackForMemoryLeaks(sut)
    XCTAssertTrue(true)
  }

  private func makeSUT() -> (AnyObject, AnyObject, AnyObject) {
    return (NSObject(), NSObject(), NSObject())
  }
}
      `.trim(),
      source: 'git:staged',
    },
  ];

  let emittedArgs:
    | {
      findings: ReadonlyArray<Finding>;
      gateOutcome: 'PASS' | 'ALLOW' | 'WARN' | 'BLOCK';
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
      resolveFactsForGateScope: async () => facts,
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {
          ios: { detected: true, confidence: 'HIGH' },
        },
        skillsRuleSet: {
          rules: [
            createSkillRule({
              id: 'skills.ios.critical-test-quality',
              severity: 'ERROR',
              platform: 'ios',
            }),
          ] as RuleSet,
          activeBundles: [
            {
              name: 'ios-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/windsurf-rules-ios.md',
              hash: 'a'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-concurrency-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swift-concurrency.md',
              hash: 'b'.repeat(64),
              rules: [],
            },
            {
              name: 'ios-swiftui-expert-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/swiftui-expert-skill.md',
              hash: 'c'.repeat(64),
              rules: [],
            },
          ],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: facts.length,
          filesScanned: 1,
          rulesTotal: 2,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 2,
          projectRules: 0,
          matchedRules: 0,
          unmatchedRules: 2,
          unevaluatedRules: 0,
          activeRuleIds: ['skills.ios.no-force-unwrap', 'skills.ios.critical-test-quality'],
          evaluatedRuleIds: ['skills.ios.no-force-unwrap', 'skills.ios.critical-test-quality'],
          matchedRuleIds: [],
          unmatchedRuleIds: ['skills.ios.no-force-unwrap', 'skills.ios.critical-test-quality'],
          unevaluatedRuleIds: [],
        },
        findings: [],
      }),
      evaluateGate: () => ({ outcome: 'ALLOW' }),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'ALLOW');
  assert.equal(
    emittedArgs?.findings.some(
      (finding) => finding.ruleId === 'governance.skills.ios-test-quality.incomplete'
    ),
    false
  );
});

test('runPlatformGate permite continuar cuando existe waiver de gate válido para stage bloqueante', async () => {
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
      gateOutcome: 'PASS' | 'ALLOW' | 'WARN' | 'BLOCK';
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
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: 0,
          filesScanned: 0,
          rulesTotal: 1,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 0,
          projectRules: 1,
          matchedRules: 1,
          unmatchedRules: 0,
          unevaluatedRules: 0,
          activeRuleIds: ['project.blocking.rule'],
          evaluatedRuleIds: ['project.blocking.rule'],
          matchedRuleIds: ['project.blocking.rule'],
          unmatchedRuleIds: [],
          unevaluatedRuleIds: [],
        },
        findings: [
          {
            ruleId: 'project.blocking.rule',
            severity: 'ERROR',
            code: 'PROJECT_BLOCKING_RULE',
            message: 'blocking test rule',
            filePath: 'src/blocking.ts',
          },
        ],
      }),
      evaluateGate: () => ({ outcome: 'BLOCK' }),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      resolveActiveGateWaiver: () => ({
        kind: 'applied',
        path: '.pumuki/waivers/gate.json',
        waiver: {
          id: 'waiver-1',
          stage: 'PRE_PUSH',
          reason: 'maintenance',
          owner: 'tech-lead',
          approved_at: '2026-03-03T20:00:00.000Z',
          expires_at: '2099-12-31T23:59:59.000Z',
        },
      }),
      emitPlatformGateEvidence: (paramsArg) => {
        emittedArgs = {
          findings: paramsArg.findings,
          gateOutcome: paramsArg.gateOutcome,
        };
      },
      printGateFindings: () => {},
    },
  });

  assert.equal(result, 0);
  assert.equal(emittedArgs?.gateOutcome, 'PASS');
  assert.equal(
    emittedArgs?.findings.some((finding) => finding.ruleId === 'governance.waiver.applied'),
    true
  );
});

test('runPlatformGate bloquea cuando el waiver de gate está expirado', async () => {
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
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: 0,
          filesScanned: 0,
          rulesTotal: 1,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 0,
          projectRules: 1,
          matchedRules: 1,
          unmatchedRules: 0,
          unevaluatedRules: 0,
          activeRuleIds: ['project.blocking.rule'],
          evaluatedRuleIds: ['project.blocking.rule'],
          matchedRuleIds: ['project.blocking.rule'],
          unmatchedRuleIds: [],
          unevaluatedRuleIds: [],
        },
        findings: [
          {
            ruleId: 'project.blocking.rule',
            severity: 'ERROR',
            code: 'PROJECT_BLOCKING_RULE',
            message: 'blocking test rule',
            filePath: 'src/blocking.ts',
          },
        ],
      }),
      evaluateGate: () => ({ outcome: 'BLOCK' }),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      resolveActiveGateWaiver: () => ({
        kind: 'expired',
        path: '.pumuki/waivers/gate.json',
        waiver: {
          id: 'waiver-expired',
          stage: 'PRE_PUSH',
          reason: 'expired maintenance',
          owner: 'tech-lead',
          approved_at: '2024-01-01T00:00:00.000Z',
          expires_at: '2024-01-15T00:00:00.000Z',
        },
      }),
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
    emittedArgs?.findings.some((finding) => finding.ruleId === 'governance.waiver.expired'),
    true
  );
});

test('runPlatformGate bloquea cuando el waiver de gate es inválido', async () => {
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
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
          unsupportedAutoRuleIds: [],
        },
        projectRules: [] as RuleSet,
        heuristicRules: [] as RuleSet,
        coverage: {
          factsTotal: 0,
          filesScanned: 0,
          rulesTotal: 1,
          baselineRules: 0,
          heuristicRules: 0,
          skillsRules: 0,
          projectRules: 1,
          matchedRules: 1,
          unmatchedRules: 0,
          unevaluatedRules: 0,
          activeRuleIds: ['project.blocking.rule'],
          evaluatedRuleIds: ['project.blocking.rule'],
          matchedRuleIds: ['project.blocking.rule'],
          unmatchedRuleIds: [],
          unevaluatedRuleIds: [],
        },
        findings: [
          {
            ruleId: 'project.blocking.rule',
            severity: 'ERROR',
            code: 'PROJECT_BLOCKING_RULE',
            message: 'blocking test rule',
            filePath: 'src/blocking.ts',
          },
        ],
      }),
      evaluateGate: () => ({ outcome: 'BLOCK' }),
      enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      resolveActiveGateWaiver: () => ({
        kind: 'invalid',
        path: '.pumuki/waivers/gate.json',
        reason: 'invalid schema: owner is required',
      }),
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
    emittedArgs?.findings.some((finding) => finding.ruleId === 'governance.waiver.invalid'),
    true
  );
});

test('runPlatformGate degrada TDD/BDD a advisory por defecto en cambios nuevos sin contrato de evidencia', async () => {
  await withTddBddEnforcementEnv(undefined, async () => {
    await withTempDir('pumuki-run-platform-gate-tdd-missing-', async (repoRoot) => {
      const policy: GatePolicy = {
        stage: 'PRE_PUSH',
        blockOnOrAbove: 'CRITICAL',
        warnOnOrAbove: 'ERROR',
      };
      const scope = { kind: 'staged' as const };
      const git = buildGitStub(repoRoot);
      const evidence = buildEvidenceStub();
      const facts: ReadonlyArray<Fact> = [
        {
          kind: 'FileChange',
          path: 'apps/backend/src/orders/create-order.ts',
          changeType: 'added',
          source: 'git:staged',
        },
        {
          kind: 'FileContent',
          path: 'apps/backend/src/orders/create-order.ts',
          content: 'export function createOrder() { return { ok: true }; }',
          source: 'git:staged',
        },
      ];

      let emittedFindings: ReadonlyArray<Finding> = [];
      let emittedOutcome: 'ALLOW' | 'WARN' | 'BLOCK' | undefined;
      let emittedTddBddStatus:
        | 'skipped'
        | 'passed'
        | 'advisory'
        | 'blocked'
        | 'waived'
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
          resolveFactsForGateScope: async () => facts,
          evaluatePlatformGateFindings: () => ({
            detectedPlatforms: { backend: { detected: true, confidence: 'HIGH' } },
            skillsRuleSet: {
              rules: [],
              activeBundles: [],
              mappedHeuristicRuleIds: new Set<string>(),
              requiresHeuristicFacts: false,
            },
            projectRules: [] as RuleSet,
            heuristicRules: [] as RuleSet,
            coverage: {
              factsTotal: facts.length,
              filesScanned: 1,
              rulesTotal: 1,
              baselineRules: 1,
              heuristicRules: 0,
              skillsRules: 0,
              projectRules: 1,
              matchedRules: 1,
              unmatchedRules: 0,
              unevaluatedRules: 0,
              activeRuleIds: ['rules.backend.dummy'],
              evaluatedRuleIds: ['rules.backend.dummy'],
              matchedRuleIds: ['rules.backend.dummy'],
              unmatchedRuleIds: [],
              unevaluatedRuleIds: [],
            },
            findings: [],
          }),
          evaluateGate: (findings) => evaluateGateFromFindings(findings, policy),
          emitPlatformGateEvidence: (paramsArg) => {
            emittedFindings = paramsArg.findings;
            emittedOutcome = paramsArg.gateOutcome;
            emittedTddBddStatus = paramsArg.tddBdd?.status;
          },
          printGateFindings: () => {},
        },
      });

      assert.equal(result, 0);
      assert.equal(emittedOutcome, 'WARN');
      assert.equal(emittedTddBddStatus, 'advisory');
      assert.equal(
        emittedFindings.some(
          (finding) =>
            finding.ruleId === 'generic_evidence_integrity_required'
            && finding.severity === 'WARN'
        ),
        true
      );
    });
  });
});

test('runPlatformGate bloquea por policy TDD/BDD en modo strict para cambios nuevos sin contrato de evidencia', async () => {
  await withTddBddEnforcementEnv('strict', async () => {
    await withTempDir('pumuki-run-platform-gate-tdd-missing-strict-', async (repoRoot) => {
      const policy: GatePolicy = {
        stage: 'PRE_PUSH',
        blockOnOrAbove: 'CRITICAL',
      warnOnOrAbove: 'ERROR',
    };
    const scope = { kind: 'staged' as const };
    const git = buildGitStub(repoRoot);
    const evidence = buildEvidenceStub();
    const facts: ReadonlyArray<Fact> = [
      {
        kind: 'FileChange',
        path: 'apps/backend/src/orders/create-order.ts',
        changeType: 'added',
        source: 'git:staged',
      },
      {
        kind: 'FileContent',
        path: 'apps/backend/src/orders/create-order.ts',
        content: 'export function createOrder() { return { ok: true }; }',
        source: 'git:staged',
      },
    ];

    let emittedFindings: ReadonlyArray<Finding> = [];
    let emittedOutcome: 'ALLOW' | 'WARN' | 'BLOCK' | undefined;

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
        resolveFactsForGateScope: async () => facts,
        evaluatePlatformGateFindings: () => ({
          detectedPlatforms: { backend: { detected: true, confidence: 'HIGH' } },
          skillsRuleSet: {
            rules: [],
            activeBundles: [],
            mappedHeuristicRuleIds: new Set<string>(),
            requiresHeuristicFacts: false,
          },
          projectRules: [] as RuleSet,
          heuristicRules: [] as RuleSet,
          coverage: {
            factsTotal: facts.length,
            filesScanned: 1,
            rulesTotal: 1,
            baselineRules: 1,
            heuristicRules: 0,
            skillsRules: 0,
            projectRules: 1,
            matchedRules: 1,
            unmatchedRules: 0,
            unevaluatedRules: 0,
            activeRuleIds: ['rules.backend.dummy'],
            evaluatedRuleIds: ['rules.backend.dummy'],
            matchedRuleIds: ['rules.backend.dummy'],
            unmatchedRuleIds: [],
            unevaluatedRuleIds: [],
          },
          findings: [],
        }),
        evaluateGate: () => ({ outcome: 'ALLOW' }),
        emitPlatformGateEvidence: (paramsArg) => {
          emittedFindings = paramsArg.findings;
          emittedOutcome = paramsArg.gateOutcome;
        },
        printGateFindings: () => {},
      },
    });

      assert.equal(result, 1);
      assert.equal(emittedOutcome, 'BLOCK');
      assert.equal(
        emittedFindings.some(
          (finding) =>
            finding.ruleId === 'generic_evidence_integrity_required'
            && finding.severity === 'ERROR'
        ),
        true
      );
    });
  });
});

test('runPlatformGate bloquea PRE_WRITE en hotspot de Presentation por tamaño estructural', async () => {
  await withTempDir('pumuki-run-platform-gate-hotspot-prewrite-', async (repoRoot) => {
    const policy: GatePolicy = {
      stage: 'PRE_WRITE',
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    };
    const git = buildGitStub(repoRoot);
    const evidence = buildEvidenceStub();
    const oversizedContent = Array.from({ length: 901 }, (_, index) => `export const line${index} = ${index};`).join('\n');
    const facts: ReadonlyArray<Fact> = [
      {
        kind: 'FileChange',
        path: 'apps/frontend/presentation/AppShell.tsx',
        changeType: 'modified',
        source: 'git:working-tree',
      },
      {
        kind: 'FileContent',
        path: 'apps/frontend/presentation/AppShell.tsx',
        content: oversizedContent,
        source: 'git:working-tree',
      },
    ];

    let emittedFindings: ReadonlyArray<Finding> = [];
    let emittedOutcome: 'ALLOW' | 'WARN' | 'BLOCK' | undefined;

    const result = await runPlatformGate({
      policy,
      scope: { kind: 'workingTree' },
      services: {
        git,
        evidence,
      },
      dependencies: {
        resolveFactsForGateScope: async () => facts,
        evaluatePlatformGateFindings: () => ({
          detectedPlatforms: { frontend: { detected: true, confidence: 'HIGH' } },
          skillsRuleSet: {
            rules: [],
            activeBundles: [],
            mappedHeuristicRuleIds: new Set<string>(),
            requiresHeuristicFacts: false,
          },
          projectRules: [] as RuleSet,
          heuristicRules: [] as RuleSet,
          coverage: {
            factsTotal: facts.length,
            filesScanned: 1,
            rulesTotal: 1,
            baselineRules: 0,
            heuristicRules: 0,
            skillsRules: 1,
            projectRules: 0,
            matchedRules: 1,
            unmatchedRules: 0,
            unevaluatedRules: 0,
            activeRuleIds: ['skills.frontend.no-empty-catch'],
            evaluatedRuleIds: ['skills.frontend.no-empty-catch'],
            matchedRuleIds: ['skills.frontend.no-empty-catch'],
            unmatchedRuleIds: [],
            unevaluatedRuleIds: [],
          },
          findings: [],
        }),
        evaluateGate: () => ({ outcome: 'ALLOW' }),
        emitPlatformGateEvidence: (paramsArg) => {
          emittedFindings = paramsArg.findings;
          emittedOutcome = paramsArg.gateOutcome;
        },
        printGateFindings: () => {},
        enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      },
    });

    assert.equal(result, 1);
    assert.equal(emittedOutcome, 'BLOCK');
    assert.equal(
      emittedFindings.some((finding) => finding.ruleId === 'governance.hotspot.file_over_limit'),
      true
    );
  });
});

test('runPlatformGate bloquea PRE_COMMIT cuando toca hotspot marcado sin plan ni ADR', async () => {
  await withTempDir('pumuki-run-platform-gate-flagged-hotspot-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'config'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'config', 'pumuki-hotspots.json'),
      `${JSON.stringify({
        hotspots: [
          {
            path: 'apps/frontend/presentation/LegacyShell.tsx',
            reason: 'legacy hotspot',
            requires_refactor_plan: true,
            requires_adr: true,
          },
        ],
      }, null, 2)}\n`,
      'utf8'
    );

    const policy: GatePolicy = {
      stage: 'PRE_COMMIT',
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    };
    const git = buildGitStub(repoRoot);
    const evidence = buildEvidenceStub();
    const facts: ReadonlyArray<Fact> = [
      {
        kind: 'FileChange',
        path: 'apps/frontend/presentation/LegacyShell.tsx',
        changeType: 'modified',
        source: 'git:staged',
      },
      {
        kind: 'FileContent',
        path: 'apps/frontend/presentation/LegacyShell.tsx',
        content: 'export const LegacyShell = () => null;',
        source: 'git:staged',
      },
    ];

    let emittedFindings: ReadonlyArray<Finding> = [];

    const result = await runPlatformGate({
      policy,
      scope: { kind: 'staged' },
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
        resolveFactsForGateScope: async () => facts,
        evaluatePlatformGateFindings: () => ({
          detectedPlatforms: { frontend: { detected: true, confidence: 'HIGH' } },
          skillsRuleSet: {
            rules: [],
            activeBundles: [],
            mappedHeuristicRuleIds: new Set<string>(),
            requiresHeuristicFacts: false,
          },
          projectRules: [] as RuleSet,
          heuristicRules: [] as RuleSet,
          coverage: {
            factsTotal: facts.length,
            filesScanned: 1,
            rulesTotal: 1,
            baselineRules: 0,
            heuristicRules: 0,
            skillsRules: 1,
            projectRules: 0,
            matchedRules: 1,
            unmatchedRules: 0,
            unevaluatedRules: 0,
            activeRuleIds: ['skills.frontend.no-empty-catch'],
            evaluatedRuleIds: ['skills.frontend.no-empty-catch'],
            matchedRuleIds: ['skills.frontend.no-empty-catch'],
            unmatchedRuleIds: [],
            unevaluatedRuleIds: [],
          },
          findings: [],
        }),
        evaluateGate: () => ({ outcome: 'ALLOW' }),
        emitPlatformGateEvidence: (paramsArg) => {
          emittedFindings = paramsArg.findings;
        },
        printGateFindings: () => {},
        enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
        resolveActiveGateWaiver: () => ({
          kind: 'none',
          path: '.pumuki/waivers/gate.json',
        }),
      },
    });

    assert.equal(result, 1);
    assert.equal(
      emittedFindings.some((finding) => finding.ruleId === 'governance.hotspot.flagged_file_without_plan'),
      true
    );
    assert.equal(
      emittedFindings.some((finding) => finding.ruleId === 'governance.hotspot.missing_adr_for_structural_change'),
      true
    );
  });
});

test('runPlatformGate permite hotspot marcado cuando ADR y plan existen', async () => {
  await withTempDir('pumuki-run-platform-gate-hotspot-allow-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'config'), { recursive: true });
    mkdirSync(join(repoRoot, 'docs', 'architecture', 'adr'), { recursive: true });
    mkdirSync(join(repoRoot, 'docs', 'refactor'), { recursive: true });
    writeFileSync(join(repoRoot, 'docs', 'architecture', 'adr', 'ADR-042-hotspot.md'), '# adr\n', 'utf8');
    writeFileSync(join(repoRoot, 'docs', 'refactor', 'legacy-shell-split-plan.md'), '# plan\n', 'utf8');
    writeFileSync(
      join(repoRoot, 'config', 'pumuki-hotspots.json'),
      `${JSON.stringify({
        hotspots: [
          {
            path: 'apps/frontend/presentation/LegacyShell.tsx',
            reason: 'legacy hotspot',
            requires_refactor_plan: true,
            requires_adr: true,
            refactor_plan_paths: ['docs/refactor/legacy-shell-split-plan.md'],
            adr_paths: ['docs/architecture/adr/ADR-042-hotspot.md'],
          },
        ],
      }, null, 2)}\n`,
      'utf8'
    );

    const policy: GatePolicy = {
      stage: 'PRE_COMMIT',
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    };
    const git = buildGitStub(repoRoot);
    const evidence = buildEvidenceStub();
    const facts: ReadonlyArray<Fact> = [
      {
        kind: 'FileChange',
        path: 'apps/frontend/presentation/LegacyShell.tsx',
        changeType: 'modified',
        source: 'git:staged',
      },
      {
        kind: 'FileContent',
        path: 'apps/frontend/presentation/LegacyShell.tsx',
        content: 'export const LegacyShell = () => null;',
        source: 'git:staged',
      },
    ];

    let emittedFindings: ReadonlyArray<Finding> = [];
    let emittedOutcome: 'ALLOW' | 'WARN' | 'BLOCK' | undefined;

    const result = await runPlatformGate({
      policy,
      scope: { kind: 'staged' },
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
        resolveFactsForGateScope: async () => facts,
        evaluatePlatformGateFindings: () => ({
          detectedPlatforms: { frontend: { detected: true, confidence: 'HIGH' } },
          skillsRuleSet: {
            rules: [
              createSkillRule({
                id: 'skills.frontend.no-empty-catch',
                severity: 'ERROR',
                platform: 'frontend',
              }),
            ] as RuleSet,
            activeBundles: [
              {
                name: 'frontend-guidelines',
                version: '1.0.0',
                source: 'file:docs/codex-skills/frontend-enterprise-rules.md',
                hash: 'a'.repeat(64),
                rules: [],
              },
            ],
            mappedHeuristicRuleIds: new Set<string>(),
            requiresHeuristicFacts: false,
          },
          projectRules: [] as RuleSet,
          heuristicRules: [] as RuleSet,
          coverage: {
            factsTotal: facts.length,
            filesScanned: 1,
            rulesTotal: 1,
            baselineRules: 0,
            heuristicRules: 0,
            skillsRules: 1,
            projectRules: 0,
            matchedRules: 1,
            unmatchedRules: 0,
            unevaluatedRules: 0,
            activeRuleIds: ['skills.frontend.no-empty-catch'],
            evaluatedRuleIds: ['skills.frontend.no-empty-catch'],
            matchedRuleIds: ['skills.frontend.no-empty-catch'],
            unmatchedRuleIds: [],
            unevaluatedRuleIds: [],
          },
          findings: [],
        }),
        evaluateGate: () => ({ outcome: 'ALLOW' }),
        emitPlatformGateEvidence: (paramsArg) => {
          emittedFindings = paramsArg.findings;
          emittedOutcome = paramsArg.gateOutcome;
        },
        printGateFindings: () => {},
        enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
        resolveActiveGateWaiver: () => ({
          kind: 'none',
          path: '.pumuki/waivers/gate.json',
        }),
      },
    });

    assert.equal(result, 0);
    assert.equal(emittedOutcome, 'ALLOW');
    assert.equal(
      emittedFindings.some((finding) => finding.ruleId.startsWith('governance.hotspot.')),
      false
    );
  });
});

test('runPlatformGate aplica memory shadow sin alterar decision bloqueante actual', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  };
  const scope = { kind: 'staged' as const, extensions: ['.ts'] };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let shadowCalled = false;
  let emittedOutcome: 'ALLOW' | 'WARN' | 'BLOCK' | undefined;
  let emittedMemoryShadow:
    | {
      recommended_outcome: 'ALLOW' | 'WARN' | 'BLOCK';
      actual_outcome: 'ALLOW' | 'WARN' | 'BLOCK';
      confidence: number;
      reason_codes: string[];
    }
    | undefined;

  const previousShadowFlag = process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED;
  process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED = '1';
  try {
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
        buildMemoryShadowRecommendation: () => {
          shadowCalled = true;
          return {
            recommendedOutcome: 'BLOCK',
            confidence: 0.99,
            reasonCodes: ['shadow.test'],
          };
        },
        emitPlatformGateEvidence: (paramsArg) => {
          emittedOutcome = paramsArg.gateOutcome;
          emittedMemoryShadow = paramsArg.memoryShadow;
        },
        printGateFindings: () => {},
      },
    });

    assert.equal(shadowCalled, true);
    assert.equal(result, 0);
    assert.equal(emittedOutcome, 'ALLOW');
    assert.deepEqual(emittedMemoryShadow, {
      recommended_outcome: 'BLOCK',
      actual_outcome: 'ALLOW',
      confidence: 0.99,
      reason_codes: ['shadow.test'],
    });
  } finally {
    if (typeof previousShadowFlag === 'string') {
      process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED = previousShadowFlag;
    } else {
      delete process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED;
    }
  }
});

test('runPlatformGate aplica fallback seguro cuando falla memory shadow', async () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  };
  const scope = { kind: 'staged' as const, extensions: ['.ts'] };
  const git = buildGitStub('/repo/root');
  const evidence = buildEvidenceStub();

  let shadowCalled = false;
  let emittedOutcome: 'ALLOW' | 'WARN' | 'BLOCK' | undefined;
  let emittedMemoryShadow:
    | {
      recommended_outcome: 'ALLOW' | 'WARN' | 'BLOCK';
      actual_outcome: 'ALLOW' | 'WARN' | 'BLOCK';
      confidence: number;
      reason_codes: string[];
    }
    | undefined;

  const previousShadowFlag = process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED;
  process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED = '1';
  try {
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
        buildMemoryShadowRecommendation: () => {
          shadowCalled = true;
          throw new Error('shadow_unavailable');
        },
        emitPlatformGateEvidence: (paramsArg) => {
          emittedOutcome = paramsArg.gateOutcome;
          emittedMemoryShadow = paramsArg.memoryShadow;
        },
        printGateFindings: () => {},
      },
    });

    assert.equal(shadowCalled, true);
    assert.equal(result, 0);
    assert.equal(emittedOutcome, 'ALLOW');
    assert.equal(emittedMemoryShadow, undefined);
  } finally {
    if (typeof previousShadowFlag === 'string') {
      process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED = previousShadowFlag;
    } else {
      delete process.env.PUMUKI_OPERATIONAL_MEMORY_SHADOW_ENABLED;
    }
  }
});
