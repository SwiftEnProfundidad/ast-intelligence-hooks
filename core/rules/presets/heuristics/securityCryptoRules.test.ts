import assert from 'node:assert/strict';
import test from 'node:test';
import { securityCryptoRules } from './securityCryptoRules';

test('securityCryptoRules define reglas heurísticas locked de criptografía', () => {
  assert.equal(securityCryptoRules.length, 3);

  const ids = securityCryptoRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.weak-crypto-hash.ast',
    'heuristics.ts.buffer-alloc-unsafe.ast',
    'heuristics.ts.buffer-alloc-unsafe-slow.ast',
  ]);

  const byId = new Map(securityCryptoRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.weak-crypto-hash.ast')?.then.code,
    'HEURISTICS_WEAK_CRYPTO_HASH_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.buffer-alloc-unsafe.ast')?.then.code,
    'HEURISTICS_BUFFER_ALLOC_UNSAFE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.buffer-alloc-unsafe-slow.ast')?.then.code,
    'HEURISTICS_BUFFER_ALLOC_UNSAFE_SLOW_AST'
  );

  for (const rule of securityCryptoRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
