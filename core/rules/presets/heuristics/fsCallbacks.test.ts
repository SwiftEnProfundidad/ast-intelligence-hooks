import assert from 'node:assert/strict';
import test from 'node:test';
import { fsCallbacksRules } from './fsCallbacks';
import { fsCallbacksFileOperationsRules } from './fsCallbacksFileOperationsRules';
import { fsCallbacksMetadataRules } from './fsCallbacksMetadataRules';

test('fsCallbacksRules compone reglas heurísticas locked de fs callback APIs', () => {
  const expected = [...fsCallbacksFileOperationsRules, ...fsCallbacksMetadataRules];

  assert.equal(fsCallbacksRules.length, 45);
  assert.deepEqual(fsCallbacksRules, expected);

  const ids = fsCallbacksRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('heuristics.ts.fs-read-file-callback.ast'));
  assert.ok(ids.includes('heuristics.ts.fs-opendir-callback.ast'));
  assert.ok(ids.includes('heuristics.ts.fs-ftruncate-callback.ast'));

  for (const rule of fsCallbacksRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
