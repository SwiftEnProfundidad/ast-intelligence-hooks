import assert from 'node:assert/strict';
import test from 'node:test';
import { androidRules } from './android';

test('androidRules define reglas heurísticas locked para plataforma android', () => {
  assert.equal(androidRules.length, 8);

  const ids = androidRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.android.thread-sleep.ast',
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]);

  const byId = new Map(androidRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.android.thread-sleep.ast')?.then.code,
    'HEURISTICS_ANDROID_THREAD_SLEEP_AST'
  );
  assert.equal(
    byId.get('heuristics.android.globalscope.ast')?.then.code,
    'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.run-blocking.ast')?.then.code,
    'HEURISTICS_ANDROID_RUN_BLOCKING_AST'
  );
  assert.equal(
    byId.get('heuristics.android.solid.srp.presentation-mixed-responsibilities.ast')?.then.code,
    'HEURISTICS_ANDROID_SOLID_SRP_PRESENTATION_MIXED_RESPONSIBILITIES_AST'
  );
  assert.equal(
    byId.get('heuristics.android.solid.ocp.discriminator-branching.ast')?.then.code,
    'HEURISTICS_ANDROID_SOLID_OCP_DISCRIMINATOR_BRANCHING_AST'
  );
  assert.equal(
    byId.get('heuristics.android.solid.dip.concrete-framework-dependency.ast')?.then.code,
    'HEURISTICS_ANDROID_SOLID_DIP_CONCRETE_FRAMEWORK_DEPENDENCY_AST'
  );
  assert.equal(
    byId.get('heuristics.android.solid.isp.fat-interface-dependency.ast')?.then.code,
    'HEURISTICS_ANDROID_SOLID_ISP_FAT_INTERFACE_DEPENDENCY_AST'
  );
  assert.equal(
    byId.get('heuristics.android.solid.lsp.narrowed-precondition.ast')?.then.code,
    'HEURISTICS_ANDROID_SOLID_LSP_NARROWED_PRECONDITION_AST'
  );

  for (const rule of androidRules) {
    assert.equal(rule.platform, 'android');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
