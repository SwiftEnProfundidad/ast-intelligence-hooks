import assert from 'node:assert/strict';
import test from 'node:test';
import { androidRules } from './android';

test('androidRules define reglas heurísticas locked para plataforma android', () => {
  assert.equal(androidRules.length, 18);

  const ids = androidRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.android.thread-sleep.ast',
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.flow.livedata-state-exposure.ast',
    'heuristics.android.security.local-properties-tracked.ast',
    'heuristics.android.persistence.shared-preferences-usage.ast',
    'heuristics.android.coroutines.manual-scope-in-viewmodel.ast',
    'heuristics.android.coroutines.dispatchers-main-boundary-leak.ast',
    'heuristics.android.coroutines.hardcoded-background-dispatcher.ast',
    'heuristics.android.coroutines.with-context.ast',
    'heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast',
    'heuristics.android.coroutines.supervisor-scope.ast',
    'heuristics.android.coroutines.try-catch.ast',
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]);

  const byId = new Map(androidRules.map((rule) => [rule.id, rule]));
  const coroutineRuleIds = [
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
  ];

  for (const ruleId of coroutineRuleIds) {
    assert.equal(byId.get(ruleId)?.platform, 'android');
    assert.equal(byId.get(ruleId)?.locked, true);
  }

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
    byId.get('heuristics.android.flow.livedata-state-exposure.ast')?.then.code,
    'HEURISTICS_ANDROID_FLOW_LIVEDATA_STATE_EXPOSURE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.security.local-properties-tracked.ast')?.then.code,
    'HEURISTICS_ANDROID_SECURITY_LOCAL_PROPERTIES_TRACKED_AST'
  );
  assert.equal(
    byId.get('heuristics.android.persistence.shared-preferences-usage.ast')?.then.code,
    'HEURISTICS_ANDROID_PERSISTENCE_SHARED_PREFERENCES_USAGE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.coroutines.manual-scope-in-viewmodel.ast')?.then.code,
    'HEURISTICS_ANDROID_COROUTINES_MANUAL_SCOPE_IN_VIEWMODEL_AST'
  );
  assert.equal(
    byId.get('heuristics.android.coroutines.dispatchers-main-boundary-leak.ast')?.then.code,
    'HEURISTICS_ANDROID_COROUTINES_DISPATCHERS_MAIN_BOUNDARY_LEAK_AST'
  );
  assert.equal(
    byId.get('heuristics.android.coroutines.hardcoded-background-dispatcher.ast')?.then.code,
    'HEURISTICS_ANDROID_COROUTINES_HARDCODED_BACKGROUND_DISPATCHER_AST'
  );
  assert.equal(
    byId.get('heuristics.android.coroutines.with-context.ast')?.then.code,
    'HEURISTICS_ANDROID_COROUTINES_WITH_CONTEXT_AST'
  );
  assert.equal(
    byId.get('heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast')?.then.code,
    'HEURISTICS_ANDROID_COROUTINES_LIFECYCLE_SCOPE_BOUNDARY_LEAK_AST'
  );
  assert.equal(
    byId.get('heuristics.android.coroutines.supervisor-scope.ast')?.then.code,
    'HEURISTICS_ANDROID_COROUTINES_SUPERVISOR_SCOPE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.coroutines.try-catch.ast')?.then.code,
    'HEURISTICS_ANDROID_COROUTINES_TRY_CATCH_AST'
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
