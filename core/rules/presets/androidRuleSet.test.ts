import assert from 'node:assert/strict';
import test from 'node:test';
import { androidRuleSet } from './androidRuleSet';

test('androidRuleSet define reglas locked de plataforma android', () => {
  assert.equal(androidRuleSet.length, 8);

  const ids = androidRuleSet.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'android.solid.dip.concrete-framework-dependency',
    'android.solid.ocp.discriminator-branching',
    'android.solid.isp.fat-interface-dependency',
    'android.solid.lsp.narrowed-precondition-substitution',
    'android.solid.srp.presentation-mixed-responsibilities',
    'android.no-thread-sleep',
    'android.no-global-scope',
    'android.no-run-blocking',
  ]);

  for (const rule of androidRuleSet) {
    assert.equal(rule.platform, 'android');
    assert.equal(rule.locked, true);
    assert.equal(rule.then.kind, 'Finding');
  }

  const semanticRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.srp.presentation-mixed-responsibilities'
  );
  assert.ok(semanticRule);
  assert.equal(semanticRule.when.kind, 'Heuristic');
  assert.deepEqual(semanticRule.scope?.include, ['**/*.kt', '**/*.kts']);

  const dipRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.dip.concrete-framework-dependency'
  );
  assert.ok(dipRule);
  assert.equal(dipRule.when.kind, 'Heuristic');
  assert.deepEqual(dipRule.scope?.include, ['**/*.kt', '**/*.kts']);

  const ispRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.isp.fat-interface-dependency'
  );
  assert.ok(ispRule);
  assert.equal(ispRule.when.kind, 'Heuristic');
  assert.deepEqual(ispRule.scope?.include, ['**/*.kt', '**/*.kts']);

  const lspRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.lsp.narrowed-precondition-substitution'
  );
  assert.ok(lspRule);
  assert.equal(lspRule.when.kind, 'Heuristic');
  assert.deepEqual(lspRule.scope?.include, ['**/*.kt', '**/*.kts']);

  const ocpRule = androidRuleSet.find(
    (rule) => rule.id === 'android.solid.ocp.discriminator-branching'
  );
  assert.ok(ocpRule);
  assert.equal(ocpRule.when.kind, 'Heuristic');
  assert.deepEqual(ocpRule.scope?.include, ['**/*.kt', '**/*.kts']);

  for (const rule of androidRuleSet.filter(
    (entry) =>
      entry.id !== 'android.solid.srp.presentation-mixed-responsibilities'
      && entry.id !== 'android.solid.ocp.discriminator-branching'
      && entry.id !== 'android.solid.isp.fat-interface-dependency'
      && entry.id !== 'android.solid.lsp.narrowed-precondition-substitution'
      && entry.id !== 'android.solid.dip.concrete-framework-dependency'
  )) {
    assert.equal(rule.when.kind, 'FileContent');
    assert.ok(rule.scope?.include?.includes('apps/android/'));
  }
});
