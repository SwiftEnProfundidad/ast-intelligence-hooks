import assert from 'node:assert/strict';
import test from 'node:test';
import { securityJwtRules } from './securityJwtRules';

test('securityJwtRules define reglas heurísticas locked de JWT', () => {
  assert.equal(securityJwtRules.length, 3);

  const ids = securityJwtRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.jwt-decode-without-verify.ast',
    'heuristics.ts.jwt-verify-ignore-expiration.ast',
    'heuristics.ts.jwt-sign-no-expiration.ast',
  ]);

  const byId = new Map(securityJwtRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.jwt-decode-without-verify.ast')?.then.code,
    'HEURISTICS_JWT_DECODE_WITHOUT_VERIFY_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.jwt-verify-ignore-expiration.ast')?.then.code,
    'HEURISTICS_JWT_VERIFY_IGNORE_EXPIRATION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.jwt-sign-no-expiration.ast')?.then.code,
    'HEURISTICS_JWT_SIGN_NO_EXPIRATION_AST'
  );

  for (const rule of securityJwtRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
