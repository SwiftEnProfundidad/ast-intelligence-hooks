import assert from 'node:assert/strict';
import test from 'node:test';
import { androidRuleSet } from './androidRuleSet';

test('androidRuleSet define reglas locked de plataforma android', () => {
  assert.equal(androidRuleSet.length, 3);

  const ids = androidRuleSet.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'android.no-thread-sleep',
    'android.no-global-scope',
    'android.no-run-blocking',
  ]);

  for (const rule of androidRuleSet) {
    assert.equal(rule.platform, 'android');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'FileContent');
    assert.equal(rule.then.kind, 'Finding');
    assert.ok(rule.scope?.include?.includes('apps/android/'));
  }
});
