import assert from 'node:assert/strict';
import test from 'node:test';
import { vmRules } from './vm';

test('vmRules define reglas heurísticas locked para plataforma generic', () => {
  assert.equal(vmRules.length, 1);

  const [rule] = vmRules;
  assert.equal(rule.id, 'heuristics.ts.vm-dynamic-code-execution.ast');
  assert.equal(rule.platform, 'generic');
  assert.equal(rule.severity, 'WARN');
  assert.equal(rule.locked, true);
  assert.equal(rule.when.kind, 'Heuristic');
  assert.equal(rule.when.where?.ruleId, 'heuristics.ts.vm-dynamic-code-execution.ast');
  assert.equal(rule.then.kind, 'Finding');
  assert.equal(rule.then.code, 'HEURISTICS_VM_DYNAMIC_CODE_EXECUTION_AST');
});
