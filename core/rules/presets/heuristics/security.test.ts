import assert from 'node:assert/strict';
import test from 'node:test';
import { securityRules } from './security';
import { securityCredentialsRules } from './securityCredentialsRules';
import { securityCryptoRules } from './securityCryptoRules';
import { securityJwtRules } from './securityJwtRules';
import { securityTlsRules } from './securityTlsRules';

test('securityRules compone reglas heurísticas locked de seguridad', () => {
  const expected = [
    ...securityCredentialsRules,
    ...securityCryptoRules,
    ...securityJwtRules,
    ...securityTlsRules,
  ];

  assert.equal(securityRules.length, 12);
  assert.deepEqual(securityRules, expected);

  const ids = securityRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('heuristics.ts.hardcoded-secret-token.ast'));
  assert.ok(ids.includes('heuristics.ts.weak-crypto-hash.ast'));
  assert.ok(ids.includes('heuristics.ts.jwt-decode-without-verify.ast'));
  assert.ok(ids.includes('heuristics.ts.tls-reject-unauthorized-false.ast'));

  for (const rule of securityRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
