import assert from 'node:assert/strict';
import test from 'node:test';
import { frontendRuleSet } from './frontendRuleSet';

test('frontendRuleSet define reglas locked para plataforma frontend', () => {
  assert.equal(frontendRuleSet.length, 3);

  const ids = frontendRuleSet.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'frontend.no-console-log',
    'frontend.no-debugger',
    'frontend.avoid-single-letter-variables',
  ]);

  const byId = new Map(frontendRuleSet.map((rule) => [rule.id, rule]));
  assert.equal(byId.get('frontend.no-console-log')?.severity, 'CRITICAL');
  assert.equal(byId.get('frontend.no-debugger')?.severity, 'WARN');
  assert.equal(byId.get('frontend.avoid-single-letter-variables')?.severity, 'WARN');

  for (const rule of frontendRuleSet) {
    assert.equal(rule.platform, 'frontend');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'FileContent');
    assert.equal(rule.then.kind, 'Finding');
    assert.ok(rule.scope?.include?.includes('apps/frontend/'));
  }
});
