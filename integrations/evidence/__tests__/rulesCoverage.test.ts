import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSnapshotRulesCoverage } from '../rulesCoverage';

test('normalizeSnapshotRulesCoverage preserva unsupported_auto_rule_ids cuando existen', () => {
  const result = normalizeSnapshotRulesCoverage('PRE_PUSH', {
    stage: 'PRE_PUSH',
    active_rule_ids: ['skills.backend.no-empty-catch'],
    evaluated_rule_ids: ['skills.backend.no-empty-catch'],
    matched_rule_ids: [],
    unevaluated_rule_ids: [],
    unsupported_auto_rule_ids: ['skills.backend.guideline.custom-rule'],
    counts: {
      active: 1,
      evaluated: 1,
      matched: 0,
      unevaluated: 0,
      unsupported_auto: 1,
    },
    coverage_ratio: 1,
  });

  assert.deepEqual(result.unsupported_auto_rule_ids, [
    'skills.backend.guideline.custom-rule',
  ]);
  assert.equal(result.counts.unsupported_auto, 1);
});

test('normalizeSnapshotRulesCoverage omite unsupported_auto cuando no hay reglas sin detector', () => {
  const result = normalizeSnapshotRulesCoverage('PRE_COMMIT', {
    stage: 'PRE_COMMIT',
    active_rule_ids: ['skills.backend.no-empty-catch'],
    evaluated_rule_ids: ['skills.backend.no-empty-catch'],
    matched_rule_ids: ['skills.backend.no-empty-catch'],
    unevaluated_rule_ids: [],
    counts: {
      active: 1,
      evaluated: 1,
      matched: 1,
      unevaluated: 0,
      unsupported_auto: 0,
    },
    coverage_ratio: 1,
  });

  assert.equal('unsupported_auto_rule_ids' in result, false);
  assert.equal(result.counts.unsupported_auto, undefined);
});
