import assert from 'node:assert/strict';
import test from 'node:test';
import { iosNonNegotiableRuleSet } from './iosNonNegotiableRuleSet';

test('iosNonNegotiableRuleSet define reglas locked de plataforma ios', () => {
  assert.equal(iosNonNegotiableRuleSet.length, 4);

  const ids = iosNonNegotiableRuleSet.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'ios.no_anyview',
    'ios.no_dispatchqueue',
    'ios.no_completion_handlers',
    'ios.no_print',
  ]);

  const byId = new Map(iosNonNegotiableRuleSet.map((rule) => [rule.id, rule]));
  assert.equal(byId.get('ios.no_anyview')?.then.code, 'IOS_NO_ANYVIEW');
  assert.equal(byId.get('ios.no_dispatchqueue')?.then.code, 'IOS_NO_DISPATCHQUEUE');
  assert.equal(byId.get('ios.no_completion_handlers')?.then.code, 'IOS_NO_COMPLETION_HANDLERS');
  assert.equal(byId.get('ios.no_print')?.then.code, 'IOS_NO_PRINT');

  for (const rule of iosNonNegotiableRuleSet) {
    assert.equal(rule.platform, 'ios');
    assert.equal(rule.severity, 'CRITICAL');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'FileChange');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.pathPrefix, 'ios/');
  }
});
