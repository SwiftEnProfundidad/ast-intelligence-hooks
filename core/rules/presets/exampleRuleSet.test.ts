import assert from 'node:assert/strict';
import test from 'node:test';
import { exampleRuleSet } from './exampleRuleSet';

test('exampleRuleSet exige cambios de tests cuando cambia dominio', () => {
  assert.equal(exampleRuleSet.length, 1);

  const [rule] = exampleRuleSet;
  assert.equal(rule?.id, 'domain-change-without-tests');
  assert.equal(rule?.severity, 'CRITICAL');
  assert.equal(rule?.when.kind, 'All');
  assert.equal(rule?.then.kind, 'Finding');
  assert.equal(rule?.then.code, 'TESTS_REQUIRED');

  if (rule?.when.kind !== 'All') {
    assert.fail('La condición principal debe ser de tipo All');
  }

  const [domainChange, notDomainTestChange] = rule.when.conditions;
  assert.equal(domainChange?.kind, 'FileChange');
  assert.equal(domainChange?.where?.pathPrefix, 'domain/');
  assert.equal(notDomainTestChange?.kind, 'Not');
  assert.equal(notDomainTestChange?.condition.kind, 'FileChange');
  assert.equal(notDomainTestChange?.condition.where?.pathPrefix, 'tests/domain/');
});
