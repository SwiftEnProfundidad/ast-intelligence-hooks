import assert from 'node:assert/strict';
import test from 'node:test';
import { securityCredentialsRules } from './securityCredentialsRules';

test('securityCredentialsRules define reglas heurísticas locked de credenciales', () => {
  assert.equal(securityCredentialsRules.length, 4);

  const ids = securityCredentialsRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.hardcoded-secret-token.ast',
    'heuristics.ts.insecure-token-math-random.ast',
    'heuristics.ts.insecure-token-date-now.ast',
    'heuristics.ts.weak-token-randomuuid.ast',
  ]);

  const byId = new Map(securityCredentialsRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.hardcoded-secret-token.ast')?.then.code,
    'HEURISTICS_HARDCODED_SECRET_TOKEN_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.insecure-token-math-random.ast')?.then.code,
    'HEURISTICS_INSECURE_TOKEN_MATH_RANDOM_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.insecure-token-date-now.ast')?.then.code,
    'HEURISTICS_INSECURE_TOKEN_DATE_NOW_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.weak-token-randomuuid.ast')?.then.code,
    'HEURISTICS_WEAK_TOKEN_RANDOMUUID_AST'
  );

  for (const rule of securityCredentialsRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
