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

const buildGitStub = (repoRoot: string): IGitService => ({
  runGit: () => '',
  getStagedFacts: () => [],
  getRepoFacts: () => [],
  getRepoAndStagedFacts: () => [],
  getStagedAndUnstagedFacts: () => [],
  resolveRepoRoot: () => repoRoot,
});

const buildEvidenceStub = (): IEvidenceService => ({
  loadPreviousEvidence: () => undefined,
  toDetectedPlatformsRecord: () => ({}),
  buildRulesetState: () => [],
});

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

const createSkillsRuleSetWithRuntimeIr = (): SkillsRuleSetLoadResult => ({
  rules: [
    {
      id: 'skills.backend.no-console-log',
      description: 'No console.log',
      severity: 'ERROR',
      platform: 'backend',
      when: {
        kind: 'FileContent',
        regex: ['a^'],
      },
      then: {
        kind: 'Finding',
        message: 'No console.log',
        source:
          'skills-ir:rule=skills.backend.no-console-log;source_skill=backend-guidelines;' +
          'source_path=/skills/backend/SKILL.md;evaluation_mode=AUTO;' +
          'ast_nodes=[heuristics.ts.console-log.ast]',
      },
    },
  ],
  activeBundles: [
    {
      name: 'backend-guidelines',
      source: '/skills/backend/SKILL.md',
      hash: 'hash-backend-guidelines',
      rules: ['skills.backend.no-console-log'],
    },
  ],
  mappedHeuristicRuleIds: new Set<string>(['heuristics.ts.console-log.ast']),
  requiresHeuristicFacts: true,
});

const buildEvaluationResult = (params: {
  findings: ReadonlyArray<Finding>;
  evaluationFacts: ReadonlyArray<Fact>;
}) => ({
  detectedPlatforms: {
    backend: {
      detected: true,
      confidence: 'HIGH' as const,
    },
  },
  skillsRuleSet: createSkillsRuleSetWithRuntimeIr(),
  projectRules: [] as RuleSet,
  baselineRules: [] as RuleSet,
  heuristicRules: [] as RuleSet,
  mergedRules: [] as RuleSet,
  evaluationFacts: params.evaluationFacts,
  coverage: {
    factsTotal: params.evaluationFacts.length,
    filesScanned: 1,
    rulesTotal: 1,
    baselineRules: 0,
    heuristicRules: 0,
    skillsRules: 1,
    projectRules: 0,
    matchedRules: params.findings.length,
    unmatchedRules: 0,
    unevaluatedRules: 0,
    activeRuleIds: ['skills.backend.no-console-log'],
    evaluatedRuleIds: ['skills.backend.no-console-log'],
    matchedRuleIds: params.findings.map((finding) => finding.ruleId),
    unmatchedRuleIds: [],
    unevaluatedRuleIds: [],
  },
  findings: params.findings,
});

test('runPlatformGate bloquea cuando dual mode strict detecta divergencias legacy vs AST', async () => {
  const previousMode = process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE;
  process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE = 'strict';

  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/service.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];
  const heuristicFacts: ReadonlyArray<Fact> = [
    ...facts,
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'HEURISTICS_TS_CONSOLE_LOG_AST',
      message: 'console.log detectado',
      filePath: 'apps/backend/src/service.ts',
      source: 'heuristics:ast',
    },
  ];
  const evaluationResult = buildEvaluationResult({
    findings: [],
    evaluationFacts: heuristicFacts,
  });

  let printedFindings: ReadonlyArray<Finding> = [];

  try {
    const result = await runPlatformGate({
      policy,
      scope: {
        kind: 'staged',
        extensions: ['.ts'],
      },
      services: {
        git: buildGitStub('/repo/root'),
        evidence: buildEvidenceStub(),
      },
      dependencies: {
        resolveFactsForGateScope: async () => facts,
        evaluatePlatformGateFindings: () => evaluationResult,
        evaluateGate: () => ({ outcome: 'PASS' }),
        emitPlatformGateEvidence: () => undefined,
        printGateFindings: (gateFindings) => {
          printedFindings = gateFindings;
        },
        evaluateSddForStage: () => ({
          allowed: true,
          code: 'ALLOWED',
          message: 'ok',
        }),
        enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      },
    });

    assert.equal(result, 1);
    assert.ok(
      printedFindings.some(
        (finding) =>
          finding.ruleId === 'governance.ast-intelligence.dual-validation.mismatch'
      )
    );
  } finally {
    if (previousMode === undefined) {
      delete process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE;
    } else {
      process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE = previousMode;
    }
  }
});

test('runPlatformGate mantiene PASS en shadow cuando solo hay divergencia informativa dual mode', async () => {
  const previousMode = process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE;
  process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE = 'shadow';

  const policy: GatePolicy = {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/service.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];
  const heuristicFacts: ReadonlyArray<Fact> = [
    ...facts,
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'HEURISTICS_TS_CONSOLE_LOG_AST',
      message: 'console.log detectado',
      filePath: 'apps/backend/src/service.ts',
      source: 'heuristics:ast',
    },
  ];
  const evaluationResult = buildEvaluationResult({
    findings: [],
    evaluationFacts: heuristicFacts,
  });

  let emittedFindings: ReadonlyArray<Finding> = [];
  let printedFindings: ReadonlyArray<Finding> = [];

  try {
    const result = await runPlatformGate({
      policy,
      scope: {
        kind: 'staged',
        extensions: ['.ts'],
      },
      services: {
        git: buildGitStub('/repo/root'),
        evidence: buildEvidenceStub(),
      },
      dependencies: {
        resolveFactsForGateScope: async () => facts,
        evaluatePlatformGateFindings: () => evaluationResult,
        evaluateGate: () => ({ outcome: 'PASS' }),
        emitPlatformGateEvidence: (paramsArg) => {
          emittedFindings = paramsArg.findings;
        },
        printGateFindings: (gateFindings) => {
          printedFindings = gateFindings;
        },
        evaluateSddForStage: () => ({
          allowed: true,
          code: 'ALLOWED',
          message: 'ok',
        }),
        enforceTddBddPolicy: () => buildOutOfScopeTddBddResult(),
      },
    });

    assert.equal(result, 0);
    assert.equal(printedFindings.length, 0);
    assert.ok(
      emittedFindings.some(
        (finding) =>
          finding.ruleId === 'governance.ast-intelligence.dual-validation.shadow'
      )
    );
  } finally {
    if (previousMode === undefined) {
      delete process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE;
    } else {
      process.env.PUMUKI_AST_INTELLIGENCE_DUAL_MODE = previousMode;
    }
  }
});
