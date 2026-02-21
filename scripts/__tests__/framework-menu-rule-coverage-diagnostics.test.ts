import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRuleCoverageDiagnostics,
  formatRuleCoverageDiagnostics,
} from '../framework-menu-rule-coverage-diagnostics-lib';

test('buildRuleCoverageDiagnostics consolida cobertura por stage', async () => {
  const result = await buildRuleCoverageDiagnostics({
    stages: ['PRE_COMMIT', 'PRE_PUSH'],
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
      createGitService: () => ({
        resolveRepoRoot: () => '/repo',
      }),
    },
  });

  assert.equal(result.stages.length, 2);
  assert.equal(result.stages[0].stage, 'PRE_COMMIT');
  assert.equal(result.stages[0].rulesTotal, 100);
  assert.equal(result.stages[0].matchedRules, 5);
  assert.equal(result.stages[0].findingsTotal, 1);
  assert.equal(result.stages[0].policyTraceBundle, 'gate-policy.test.PRE_COMMIT');
});

test('formatRuleCoverageDiagnostics renderiza resumen legible', () => {
  const rendered = formatRuleCoverageDiagnostics({
    repoRoot: '/repo',
    generatedAt: '2026-02-21T00:00:00.000Z',
    stages: [
      {
        stage: 'PRE_COMMIT',
        policyTraceBundle: 'gate-policy.test.PRE_COMMIT',
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
        evaluatedRuleIds: [
          'skills.backend.no-empty-catch',
          'skills.backend.avoid-explicit-any',
        ],
        matchedRuleIds: ['skills.backend.no-empty-catch'],
        unmatchedRuleIds: ['skills.backend.avoid-explicit-any'],
      },
    ],
  });

  assert.match(rendered, /RULE COVERAGE DIAGNOSTICS/);
  assert.match(rendered, /PRE_COMMIT/);
  assert.match(rendered, /rules_total=100/);
  assert.match(rendered, /matched_rules=5/);
  assert.match(rendered, /evaluated_rule_ids=skills.backend.no-empty-catch,skills.backend.avoid-explicit-any/);
  assert.match(rendered, /matched_rule_ids=skills.backend.no-empty-catch/);
  assert.match(rendered, /unmatched_rule_ids=skills.backend.avoid-explicit-any/);
});
