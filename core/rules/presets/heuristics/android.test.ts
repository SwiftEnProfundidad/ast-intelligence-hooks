import assert from 'node:assert/strict';
import test from 'node:test';
import { androidRules } from './android';

test('androidRules define reglas heurísticas locked para plataforma android', () => {
  assert.equal(androidRules.length, 40);

  const ids = androidRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.android.thread-sleep.ast',
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.flow.livedata-state-exposure.ast',
    'heuristics.android.flow.viewmodel-flow-without-statein.ast',
    'heuristics.android.flow.sharedflow-used-as-state.ast',
    'heuristics.android.security.legacy-fingerprint-api.ast',
    'heuristics.android.concurrency.asynctask.ast',
    'heuristics.android.architecture.god-activity.ast',
    'heuristics.android.startup.application-oncreate-heavy-init.ast',
    'heuristics.android.compose.non-lazy-scrollable-collection.ast',
    'heuristics.android.compose.unstable-launched-effect-key.ast',
    'heuristics.android.compose.launched-effect-busy-loop.ast',
    'heuristics.android.observability.production-logging.ast',
    'heuristics.android.compose.modifier-background-before-padding.ast',
    'heuristics.android.accessibility.missing-content-description.ast',
    'heuristics.android.accessibility.fontscale-disabled.ast',
    'heuristics.android.compose.incomplete-material-theme.ast',
    'heuristics.android.compose.legacy-bottom-navigation.ast',
    'heuristics.android.navigation.imperative-navigation.ast',
    'heuristics.android.compose.object-creation-without-remember.ast',
    'heuristics.android.compose.state-creation-without-remember.ast',
    'heuristics.android.null-safety.force-unwrap.ast',
    'heuristics.android.security.local-properties-tracked.ast',
    'heuristics.android.persistence.shared-preferences-usage.ast',
    'heuristics.android.testing.junit4-usage.ast',
    'heuristics.android.testing.production-mock-usage.ast',
    'heuristics.android.ui.hardcoded-string.ast',
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
    byId.get('heuristics.android.flow.viewmodel-flow-without-statein.ast')?.then.code,
    'HEURISTICS_ANDROID_FLOW_VIEWMODEL_FLOW_WITHOUT_STATEIN_AST'
  );
  assert.equal(
    byId.get('heuristics.android.flow.sharedflow-used-as-state.ast')?.then.code,
    'HEURISTICS_ANDROID_FLOW_SHAREDFLOW_USED_AS_STATE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.security.legacy-fingerprint-api.ast')?.then.code,
    'HEURISTICS_ANDROID_SECURITY_LEGACY_FINGERPRINT_API_AST'
  );
  assert.equal(
    byId.get('heuristics.android.concurrency.asynctask.ast')?.then.code,
    'HEURISTICS_ANDROID_CONCURRENCY_ASYNCTASK_AST'
  );
  assert.equal(
    byId.get('heuristics.android.architecture.god-activity.ast')?.then.code,
    'HEURISTICS_ANDROID_ARCHITECTURE_GOD_ACTIVITY_AST'
  );
  assert.equal(
    byId.get('heuristics.android.startup.application-oncreate-heavy-init.ast')?.then.code,
    'HEURISTICS_ANDROID_STARTUP_APPLICATION_ONCREATE_HEAVY_INIT_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.non-lazy-scrollable-collection.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_NON_LAZY_SCROLLABLE_COLLECTION_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.unstable-launched-effect-key.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_UNSTABLE_LAUNCHED_EFFECT_KEY_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.launched-effect-busy-loop.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_LAUNCHED_EFFECT_BUSY_LOOP_AST'
  );
  assert.equal(
    byId.get('heuristics.android.observability.production-logging.ast')?.then.code,
    'HEURISTICS_ANDROID_OBSERVABILITY_PRODUCTION_LOGGING_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.modifier-background-before-padding.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_MODIFIER_BACKGROUND_BEFORE_PADDING_AST'
  );
  assert.equal(
    byId.get('heuristics.android.accessibility.missing-content-description.ast')?.then.code,
    'HEURISTICS_ANDROID_ACCESSIBILITY_MISSING_CONTENT_DESCRIPTION_AST'
  );
  assert.equal(
    byId.get('heuristics.android.accessibility.fontscale-disabled.ast')?.then.code,
    'HEURISTICS_ANDROID_ACCESSIBILITY_FONTSCALE_DISABLED_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.incomplete-material-theme.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_INCOMPLETE_MATERIAL_THEME_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.legacy-bottom-navigation.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_LEGACY_BOTTOM_NAVIGATION_AST'
  );
  assert.equal(
    byId.get('heuristics.android.navigation.imperative-navigation.ast')?.then.code,
    'HEURISTICS_ANDROID_NAVIGATION_IMPERATIVE_NAVIGATION_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.object-creation-without-remember.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_OBJECT_CREATION_WITHOUT_REMEMBER_AST'
  );
  assert.equal(
    byId.get('heuristics.android.compose.state-creation-without-remember.ast')?.then.code,
    'HEURISTICS_ANDROID_COMPOSE_STATE_CREATION_WITHOUT_REMEMBER_AST'
  );
  assert.equal(
    byId.get('heuristics.android.null-safety.force-unwrap.ast')?.then.code,
    'HEURISTICS_ANDROID_NULL_SAFETY_FORCE_UNWRAP_AST'
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
    byId.get('heuristics.android.testing.junit4-usage.ast')?.then.code,
    'HEURISTICS_ANDROID_TESTING_JUNIT4_USAGE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.testing.production-mock-usage.ast')?.then.code,
    'HEURISTICS_ANDROID_TESTING_PRODUCTION_MOCK_USAGE_AST'
  );
  assert.equal(
    byId.get('heuristics.android.ui.hardcoded-string.ast')?.then.code,
    'HEURISTICS_ANDROID_UI_HARDCODED_STRING_AST'
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
