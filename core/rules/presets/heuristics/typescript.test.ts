import assert from 'node:assert/strict';
import test from 'node:test';
import { typescriptRules } from './typescript';

test('typescriptRules define reglas heurísticas locked para plataforma generic', () => {
  assert.equal(typescriptRules.length, 19);

  const ids = typescriptRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.with-statement.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
    'heuristics.ts.god-class-large-class.ast',
  ]);

  const byId = new Map(typescriptRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.empty-catch.ast')?.then.code,
    'HEURISTICS_EMPTY_CATCH_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.debugger.ast')?.then.code,
    'HEURISTICS_DEBUGGER_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.solid.dip.framework-import.ast')?.then.code,
    'HEURISTICS_SOLID_DIP_FRAMEWORK_IMPORT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.solid.dip.concrete-instantiation.ast')?.then.code,
    'HEURISTICS_SOLID_DIP_CONCRETE_INSTANTIATION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.god-class-large-class.ast')?.then.code,
    'HEURISTICS_GOD_CLASS_LARGE_CLASS_AST'
  );

  for (const rule of typescriptRules) {
    assert.equal(rule.platform, 'generic');
    if (rule.id === 'heuristics.ts.god-class-large-class.ast') {
      assert.equal(rule.severity, 'ERROR');
    } else {
      assert.equal(rule.severity, 'WARN');
    }
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
