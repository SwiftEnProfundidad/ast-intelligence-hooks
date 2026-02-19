import assert from 'node:assert/strict';
import test from 'node:test';
import { fsSyncAppendRules } from './fsSyncAppendRules';

test('fsSyncAppendRules define regla heurística locked de fs append sync', () => {
  assert.equal(fsSyncAppendRules.length, 1);

  const [rule] = fsSyncAppendRules;
  assert.equal(rule.id, 'heuristics.ts.fs-append-file-sync.ast');
  assert.equal(rule.platform, 'generic');
  assert.equal(rule.severity, 'WARN');
  assert.equal(rule.locked, true);
  assert.equal(rule.when.kind, 'Heuristic');
  assert.equal(rule.when.where?.ruleId, 'heuristics.ts.fs-append-file-sync.ast');
  assert.equal(rule.then.kind, 'Finding');
  assert.equal(rule.then.code, 'HEURISTICS_FS_APPEND_FILE_SYNC_AST');
});
