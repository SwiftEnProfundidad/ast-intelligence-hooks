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
      rules: [
        {
          id: 'skills.backend.no-console-log',
          description: 'backend critical profile rule',
          severity: 'ERROR' as const,
          platform: 'backend' as const,
          when: {
            kind: 'FileContent' as const,
            regex: ['a^'],
          },
          then: {
            kind: 'Finding' as const,
            message: 'backend critical profile rule',
            code: 'SKILLS_BACKEND_NO_CONSOLE_LOG',
          },
        },
      ],
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
    } satisfies SkillsRuleSetLoadResult,
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
      activeRuleIds: ['skills.backend.no-console-log'],
      evaluatedRuleIds: ['skills.backend.no-console-log'],
      matchedRuleIds: ['skills.backend.no-console-log'],
      unmatchedRuleIds: [],
      unevaluatedRuleIds: [],
    },
    findings,
  };

  let resolvedScope: typeof scope | undefined;
  let evaluatedStage: GatePolicy['stage'] | undefined;
  let evaluatedRepoRoot: string | undefined;
  let emittedGateOutcome: GateOutcome | undefined;
  let printedFindings = false;

  const dependencies: Partial<GateDependencies> = {
    evaluateSddForStage: () => ({
      allowed: true,
      code: 'ALLOWED',
      message: 'ok',
    }),
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
