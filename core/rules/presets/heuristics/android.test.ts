import assert from 'node:assert/strict';
import test from 'node:test';
import { androidRules } from './android';

test('androidRules define reglas heurísticas locked para plataforma android', () => {
  assert.equal(androidRules.length, 3);

  const ids = androidRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.android.thread-sleep.ast',
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
  ]);

  const byId = new Map(androidRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.android.thread-sleep.ast')?.then.code,
    'HEURISTICS_ANDROID_THREAD_SLEEP_AST'
  );
  assert.equal(
    byId.get('heuristics.android.globalscope.ast')?.then.code,
    'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.run-blocking.ast')?.then.code,
    'HEURISTICS_ANDROID_RUN_BLOCKING_AST'
  );

  for (const rule of androidRules) {
    assert.equal(rule.platform, 'android');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
