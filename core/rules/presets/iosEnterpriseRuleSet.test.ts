import assert from 'node:assert/strict';
import test from 'node:test';
import { iosEnterpriseRuleSet } from './iosEnterpriseRuleSet';
import { evaluateRules } from '../../gate/evaluateRules';

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
  assert.equal(byId.get('ios.no-force-unwrap')?.when.kind, 'All');
  assert.equal(byId.get('ios.no-force-unwrap')?.when.conditions[0]?.kind, 'Heuristic');

  for (const rule of iosEnterpriseRuleSet) {
    assert.equal(rule.platform, 'ios');
    assert.equal(rule.locked, true);
    assert.equal(rule.then.kind, 'Finding');
    assert.ok(rule.scope?.include?.includes('**/*.swift'));
  }
});

test('ios.no-force-unwrap no bloquea comparaciones seguras != nil', () => {
  const rule = iosEnterpriseRuleSet.find((candidate) => candidate.id === 'ios.no-force-unwrap');
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/ListRouting/Application/UseCases/SyncShoppingListUseCase.swift',
      content: 'if waitersByKey[key] != nil { consume() }',
      source: 'unit-test',
    },
  ]);

  assert.deepEqual(findings, []);
});

test('ios.no-force-unwrap bloquea cuando la heuristica detecta force unwrap real', () => {
  const rule = iosEnterpriseRuleSet.find((candidate) => candidate.id === 'ios.no-force-unwrap');
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/ListRouting/Application/UseCases/SyncShoppingListUseCase.swift',
      content: 'let user = repository.currentUser!',
      source: 'unit-test',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.force-unwrap.ast',
      severity: 'WARN',
      code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
      message: 'AST heuristic detected force unwrap usage.',
      filePath: 'apps/ios/Sources/ListRouting/Application/UseCases/SyncShoppingListUseCase.swift',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.no-force-unwrap');
  assert.equal(findings[0]?.code, 'IOS_NO_FORCE_UNWRAP');
});
