import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRuleCoverageDiagnostics,
  formatRuleCoverageDiagnostics,
} from '../framework-menu-rule-coverage-diagnostics-lib';

test('buildRuleCoverageDiagnostics consolida cobertura por stage', async () => {
  const result = await buildRuleCoverageDiagnostics({
    stages: ['PRE_WRITE', 'PRE_COMMIT', 'PRE_PUSH'],
    repoRoot: '/repo',
    dependencies: {
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          bundle: `gate-policy.test.${stage}`,
          policy: {
            stage,
            blockOnOrAbove: 'ERROR',
            warnOnOrAbove: 'WARN',
          },
        },
      }),
      resolveFactsForGateScope: async () => ([
        { kind: 'FileContent', path: 'scripts/a.ts', content: 'x', source: 'test' },
      ]),
      evaluatePlatformGateFindings: () => ({
        detectedPlatforms: {},
        skillsRuleSet: {
          rules: [],
          activeBundles: [],
          mappedHeuristicRuleIds: new Set<string>(),
          requiresHeuristicFacts: false,
        },
        projectRules: [],
        baselineRules: [],
        heuristicRules: [],
        mergedRules: [],
        evaluationFacts: [],
        coverage: {
          factsTotal: 10,
          filesScanned: 3,
          rulesTotal: 100,
          baselineRules: 20,
          heuristicRules: 40,
          skillsRules: 30,
          projectRules: 10,
          matchedRules: 5,
          unmatchedRules: 95,
          evaluatedRuleIds: [
            'skills.backend.no-empty-catch',
            'skills.backend.avoid-explicit-any',
          ],
          matchedRuleIds: ['skills.backend.no-empty-catch'],
          unmatchedRuleIds: ['skills.backend.avoid-explicit-any'],
        },
        findings: [
          {
            ruleId: 'skills.backend.no-empty-catch',
            severity: 'ERROR',
            code: 'NO_EMPTY_CATCH',
            message: 'x',
          },
        ],
      }),
      evaluateSddPolicy: ({ stage }) => ({
        stage,
        decision: {
          allowed: stage !== 'PRE_WRITE',
          code: stage === 'PRE_WRITE' ? 'SDD_SESSION_MISSING' : 'ALLOWED',
          message: 'ok',
        },
        status: {
          repoRoot: '/repo',
          openspec: {
            installed: true,
            version: '1.0.0',
            projectInitialized: true,
            minimumVersion: '1.0.0',
            recommendedVersion: '1.0.0',
            compatible: true,
            parsedVersion: '1.0.0',
          },
          session: {
            repoRoot: '/repo',
            active: true,
            valid: true,
          },
        },
      }),
      createGitService: () => ({
        resolveRepoRoot: () => '/repo',
      }),
    },
  });

  assert.equal(result.stages.length, 3);
  assert.equal(result.stages[0].stage, 'PRE_WRITE');
  assert.equal(result.stages[0].evaluationStage, 'PRE_COMMIT');
  assert.equal(result.stages[0].sdd.allowed, false);
  assert.equal(result.stages[0].sdd.code, 'SDD_SESSION_MISSING');
  assert.match(result.stages[0].policyTraceBundle, /PRE_WRITE->gate-policy\.test\.PRE_COMMIT/);
  assert.equal(result.stages[1].stage, 'PRE_COMMIT');
  assert.equal(result.stages[0].rulesTotal, 100);
  assert.equal(result.stages[0].matchedRules, 5);
  assert.equal(result.stages[0].findingsTotal, 1);
  assert.equal(result.stages[1].policyTraceBundle, 'gate-policy.test.PRE_COMMIT');
});

test('formatRuleCoverageDiagnostics renderiza resumen legible', () => {
  const rendered = formatRuleCoverageDiagnostics({
    repoRoot: '/repo',
    generatedAt: '2026-02-21T00:00:00.000Z',
    stages: [
      {
        stage: 'PRE_COMMIT',
        policyTraceBundle: 'gate-policy.test.PRE_COMMIT',
        evaluationStage: 'PRE_COMMIT',
        factsTotal: 10,
        filesScanned: 3,
        rulesTotal: 100,
        baselineRules: 20,
        heuristicRules: 40,
        skillsRules: 30,
        projectRules: 10,
        matchedRules: 5,
        unmatchedRules: 95,
        findingsTotal: 1,
        findingsBySeverity: {
          CRITICAL: 0,
          ERROR: 1,
          WARN: 0,
          INFO: 0,
        },
        findingsByEnterpriseSeverity: {
          CRITICAL: 0,
          HIGH: 1,
          MEDIUM: 0,
          LOW: 0,
        },
        evaluatedRuleIds: [
          'skills.backend.no-empty-catch',
          'skills.backend.avoid-explicit-any',
        ],
        matchedRuleIds: ['skills.backend.no-empty-catch'],
        unmatchedRuleIds: ['skills.backend.avoid-explicit-any'],
        sdd: {
          allowed: true,
          code: 'ALLOWED',
        },
      },
    ],
  });

  assert.match(rendered, /RULE COVERAGE DIAGNOSTICS/);
  assert.match(rendered, /PRE_COMMIT/);
  assert.match(rendered, /evaluation_stage=PRE_COMMIT/);
  assert.match(rendered, /sdd_code=ALLOWED/);
  assert.match(rendered, /rules_total=100/);
  assert.match(rendered, /matched_rules=5/);
  assert.match(rendered, /findings_by_severity_enterprise=CRITICAL:0\|HIGH:1\|MEDIUM:0\|LOW:0/);
  assert.match(rendered, /evaluated_rule_ids=skills.backend.no-empty-catch,skills.backend.avoid-explicit-any/);
  assert.match(rendered, /matched_rule_ids=skills.backend.no-empty-catch/);
  assert.match(rendered, /unmatched_rule_ids=skills.backend.avoid-explicit-any/);
});
