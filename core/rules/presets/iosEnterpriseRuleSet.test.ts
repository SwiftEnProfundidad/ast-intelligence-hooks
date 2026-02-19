import assert from 'node:assert/strict';
import test from 'node:test';
import { iosEnterpriseRuleSet } from './iosEnterpriseRuleSet';

test('iosEnterpriseRuleSet define reglas locked para plataforma ios', () => {
  assert.equal(iosEnterpriseRuleSet.length, 8);

  const ids = iosEnterpriseRuleSet.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'ios.tdd.domain-changes-require-tests',
    'ios.no-gcd',
    'ios.no-anyview',
    'ios.no-print',
    'ios.no-jsonserialization',
    'ios.no-alamofire',
    'ios.no-force-unwrap',
    'ios.no-completion-handlers-outside-bridges',
  ]);

  const byId = new Map(iosEnterpriseRuleSet.map((rule) => [rule.id, rule]));
  assert.equal(byId.get('ios.no-print')?.severity, 'ERROR');
  assert.equal(byId.get('ios.no-print')?.stage, 'PRE_PUSH');
  assert.equal(byId.get('ios.no-gcd')?.severity, 'CRITICAL');
  assert.equal(byId.get('ios.tdd.domain-changes-require-tests')?.when.kind, 'All');
  assert.equal(byId.get('ios.no-completion-handlers-outside-bridges')?.when.kind, 'Any');

  for (const rule of iosEnterpriseRuleSet) {
    assert.equal(rule.platform, 'ios');
    assert.equal(rule.locked, true);
    assert.equal(rule.then.kind, 'Finding');
    assert.ok(rule.scope?.include?.includes('**/*.swift'));
  }
});
