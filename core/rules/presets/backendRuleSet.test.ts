import assert from 'node:assert/strict';
import test from 'node:test';
import { backendRuleSet } from './backendRuleSet';

test('backendRuleSet define reglas locked para plataforma backend', () => {
  assert.equal(backendRuleSet.length, 3);

  const ids = backendRuleSet.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'backend.no-console-log',
    'backend.no-empty-catch',
    'backend.avoid-explicit-any',
  ]);

  const byId = new Map(backendRuleSet.map((rule) => [rule.id, rule]));
  assert.equal(byId.get('backend.no-console-log')?.severity, 'CRITICAL');
  assert.equal(byId.get('backend.no-empty-catch')?.severity, 'CRITICAL');
  assert.equal(byId.get('backend.avoid-explicit-any')?.severity, 'WARN');

  for (const rule of backendRuleSet) {
    assert.equal(rule.platform, 'backend');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'FileContent');
    assert.equal(rule.then.kind, 'Finding');
    assert.ok(rule.scope?.include?.includes('apps/backend/'));
  }
});
