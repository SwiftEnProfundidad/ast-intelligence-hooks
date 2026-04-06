import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEvidenceOperationalHints } from '../operationalHints';

test('buildEvidenceOperationalHints sets requires_second_pass from extra', () => {
  const hints = buildEvidenceOperationalHints({
    stage: 'PRE_COMMIT',
    outcome: 'PASS',
    findings: [],
    extra: {
      requires_second_pass: true,
      second_pass_reason: 'test_reason',
    },
  });
  assert.equal(hints.requires_second_pass, true);
  assert.equal(hints.second_pass_reason, 'test_reason');
  assert.ok(hints.human_summary_lines.some((line) => line.includes('git add')));
});

test('buildEvidenceOperationalHints counts severities in breakdown', () => {
  const hints = buildEvidenceOperationalHints({
    stage: 'PRE_COMMIT',
    outcome: 'BLOCK',
    findings: [
      {
        ruleId: 'r1',
        severity: 'ERROR',
        code: 'E1',
        message: 'bad',
        file: 'f.ts',
      },
      {
        ruleId: 'r2',
        severity: 'WARN',
        code: 'W1',
        message: 'warn',
        file: 'f.ts',
      },
    ],
  });
  assert.equal(hints.rule_execution_breakdown?.matched_blocking_count, 1);
  assert.equal(hints.rule_execution_breakdown?.matched_warn_count, 1);
});
