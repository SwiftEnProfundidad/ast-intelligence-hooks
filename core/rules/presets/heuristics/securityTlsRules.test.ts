import assert from 'node:assert/strict';
import test from 'node:test';
import { securityTlsRules } from './securityTlsRules';

test('securityTlsRules define reglas heurísticas locked de TLS', () => {
  assert.equal(securityTlsRules.length, 2);

  const ids = securityTlsRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.tls-reject-unauthorized-false.ast',
    'heuristics.ts.tls-env-override.ast',
  ]);

  const byId = new Map(securityTlsRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.tls-reject-unauthorized-false.ast')?.then.code,
    'HEURISTICS_TLS_REJECT_UNAUTHORIZED_FALSE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.tls-env-override.ast')?.then.code,
    'HEURISTICS_TLS_ENV_OVERRIDE_AST'
  );

  for (const rule of securityTlsRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
