import assert from 'node:assert/strict';
import test from 'node:test';
import { formatRuleCoverageDiagnostics } from '../framework-menu-rule-coverage-diagnostics-format';

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
