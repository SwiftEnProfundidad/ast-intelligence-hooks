import assert from 'node:assert/strict';
import test from 'node:test';
import { iosRules } from './ios';

test('iosRules define reglas heurísticas locked para plataforma ios', () => {
  assert.equal(iosRules.length, 45);

  const ids = iosRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ios.force-unwrap.ast',
    'heuristics.ios.anyview.ast',
    'heuristics.ios.force-try.ast',
    'heuristics.ios.force-cast.ast',
    'heuristics.ios.callback-style.ast',
    'heuristics.ios.dispatchqueue.ast',
    'heuristics.ios.dispatchgroup.ast',
    'heuristics.ios.dispatchsemaphore.ast',
    'heuristics.ios.operation-queue.ast',
    'heuristics.ios.task-detached.ast',
    'heuristics.ios.unchecked-sendable.ast',
    'heuristics.ios.preconcurrency.ast',
    'heuristics.ios.nonisolated-unsafe.ast',
    'heuristics.ios.assume-isolated.ast',
    'heuristics.ios.observable-object.ast',
    'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
    'heuristics.ios.passed-value-state-wrapper.ast',
    'heuristics.ios.foreach-indices.ast',
    'heuristics.ios.swiftui.inline-filtering-in-foreach.ast',
    'heuristics.ios.swiftui.explicit-color-static-member.ast',
    'heuristics.ios.contains-user-filter.ast',
    'heuristics.ios.geometryreader.ast',
    'heuristics.ios.font-weight-bold.ast',
    'heuristics.ios.navigation-view.ast',
    'heuristics.ios.foreground-color.ast',
    'heuristics.ios.corner-radius.ast',
    'heuristics.ios.tab-item.ast',
    'heuristics.ios.on-tap-gesture.ast',
    'heuristics.ios.string-format.ast',
    'heuristics.ios.scrollview-shows-indicators.ast',
    'heuristics.ios.sheet-is-presented.ast',
    'heuristics.ios.legacy-onchange.ast',
    'heuristics.ios.uiscreen-main-bounds.ast',
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
    'heuristics.ios.testing.xctassert.ast',
    'heuristics.ios.testing.xctunwrap.ast',
    'heuristics.ios.testing.wait-for-expectations.ast',
    'heuristics.ios.testing.legacy-expectation-description.ast',
    'heuristics.ios.testing.mixed-frameworks.ast',
    'heuristics.ios.core-data.nsmanagedobject-boundary.ast',
    'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast',
    'heuristics.ios.core-data.layer-leak.ast',
    'heuristics.ios.swiftdata.layer-leak.ast',
    'heuristics.ios.core-data.nsmanagedobject-state-leak.ast',
  ]);

  const byId = new Map(iosRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ios.force-unwrap.ast')?.then.code,
    'HEURISTICS_IOS_FORCE_UNWRAP_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.task-detached.ast')?.then.code,
    'HEURISTICS_IOS_TASK_DETACHED_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.preconcurrency.ast')?.then.code,
    'HEURISTICS_IOS_PRECONCURRENCY_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.nonisolated-unsafe.ast')?.then.code,
    'HEURISTICS_IOS_NONISOLATED_UNSAFE_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.assume-isolated.ast')?.then.code,
    'HEURISTICS_IOS_ASSUME_ISOLATED_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.legacy-swiftui-observable-wrapper.ast')?.then.code,
    'HEURISTICS_IOS_LEGACY_SWIFTUI_OBSERVABLE_WRAPPER_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.passed-value-state-wrapper.ast')?.then.code,
    'HEURISTICS_IOS_PASSED_VALUE_STATE_WRAPPER_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.foreach-indices.ast')?.then.code,
    'HEURISTICS_IOS_FOREACH_INDICES_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.swiftui.inline-filtering-in-foreach.ast')?.then.code,
    'HEURISTICS_IOS_SWIFTUI_INLINE_FILTERING_IN_FOREACH_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.swiftui.explicit-color-static-member.ast')?.then.code,
    'HEURISTICS_IOS_SWIFTUI_EXPLICIT_COLOR_STATIC_MEMBER_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.contains-user-filter.ast')?.then.code,
    'HEURISTICS_IOS_CONTAINS_USER_FILTER_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.geometryreader.ast')?.then.code,
    'HEURISTICS_IOS_GEOMETRYREADER_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.font-weight-bold.ast')?.then.code,
    'HEURISTICS_IOS_FONT_WEIGHT_BOLD_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.uiscreen-main-bounds.ast')?.then.code,
    'HEURISTICS_IOS_UISCREEN_MAIN_BOUNDS_AST'
  );
  assert.equal(byId.get('heuristics.ios.foreground-color.ast')?.then.code, 'HEURISTICS_IOS_FOREGROUND_COLOR_AST');
  assert.equal(
    byId.get('heuristics.ios.sheet-is-presented.ast')?.then.code,
    'HEURISTICS_IOS_SHEET_IS_PRESENTED_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.legacy-onchange.ast')?.then.code,
    'HEURISTICS_IOS_LEGACY_ONCHANGE_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.testing.xctassert.ast')?.then.code,
    'HEURISTICS_IOS_TESTING_XCTASSERT_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.testing.xctest-suite-modernizable.ast')?.then.code,
    'HEURISTICS_IOS_TESTING_XCTEST_SUITE_MODERNIZABLE_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.testing.wait-for-expectations.ast')?.then.code,
    'HEURISTICS_IOS_TESTING_WAIT_FOR_EXPECTATIONS_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.testing.legacy-expectation-description.ast')?.then.code,
    'HEURISTICS_IOS_TESTING_LEGACY_EXPECTATION_DESCRIPTION_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.testing.mixed-frameworks.ast')?.then.code,
    'HEURISTICS_IOS_TESTING_MIXED_FRAMEWORKS_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.core-data.nsmanagedobject-async-boundary.ast')?.then.code,
    'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_ASYNC_BOUNDARY_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.core-data.layer-leak.ast')?.then.code,
    'HEURISTICS_IOS_CORE_DATA_LAYER_LEAK_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.swiftdata.layer-leak.ast')?.then.code,
    'HEURISTICS_IOS_SWIFTDATA_LAYER_LEAK_AST'
  );
  assert.equal(
    byId.get('heuristics.ios.core-data.nsmanagedobject-state-leak.ast')?.then.code,
    'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_STATE_LEAK_AST'
  );

  for (const rule of iosRules) {
    assert.equal(rule.platform, 'ios');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
