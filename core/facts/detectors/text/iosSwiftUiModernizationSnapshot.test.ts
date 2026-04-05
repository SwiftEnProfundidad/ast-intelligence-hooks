import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getIosSwiftUiModernizationEntry,
  IOS_SWIFTUI_MODERNIZATION_SNAPSHOT,
  listIosSwiftUiModernizationEntries,
} from './iosSwiftUiModernizationSnapshot';

test('iosSwiftUiModernizationSnapshot expone snapshot versionado y determinista', () => {
  assert.equal(IOS_SWIFTUI_MODERNIZATION_SNAPSHOT.snapshotId, 'ios-swiftui-modernization-v2');
  assert.equal(IOS_SWIFTUI_MODERNIZATION_SNAPSHOT.version, '2.0.0');
  assert.equal(IOS_SWIFTUI_MODERNIZATION_SNAPSHOT.sourceSkill, 'swiftui-expert-skill');
  assert.deepEqual(
    listIosSwiftUiModernizationEntries().map((entry) => entry.id),
    [
      'foreground-color',
      'corner-radius',
      'tab-item',
      'scrollview-shows-indicators',
      'sheet-is-presented',
      'legacy-onchange',
    ]
  );
});

test('iosSwiftUiModernizationSnapshot resuelve entradas canonicas con ruleIds y heuristics alineados', () => {
  const foregroundColor = getIosSwiftUiModernizationEntry('foreground-color');
  const tabItem = getIosSwiftUiModernizationEntry('tab-item');
  const legacyOnChange = getIosSwiftUiModernizationEntry('legacy-onchange');

  assert.ok(foregroundColor);
  assert.equal(foregroundColor.ruleId, 'skills.ios.no-foreground-color');
  assert.equal(foregroundColor.heuristicRuleId, 'heuristics.ios.foreground-color.ast');

  assert.ok(tabItem);
  assert.equal(tabItem.ruleId, 'skills.ios.no-tab-item');
  assert.equal(tabItem.heuristicRuleId, 'heuristics.ios.tab-item.ast');
  assert.equal(tabItem.minimumIos, '18.0');

  assert.ok(legacyOnChange);
  assert.equal(legacyOnChange.ruleId, 'skills.ios.no-legacy-onchange');
  assert.equal(legacyOnChange.heuristicRuleId, 'heuristics.ios.legacy-onchange.ast');
  assert.equal(legacyOnChange.minimumIos, '17.0');
});
