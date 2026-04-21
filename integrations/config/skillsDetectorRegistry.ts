import { normalizeSkillsAstNodeIds, type SkillsCompiledRule } from './skillsLock';

type SkillsDetectorKind = 'heuristic';

type SkillsDetectorBinding = {
  detectorId: string;
  detectorKind: SkillsDetectorKind;
  mappedHeuristicRuleIds: ReadonlyArray<string>;
};

const heuristicDetector = (
  detectorId: string,
  mappedHeuristicRuleIds: ReadonlyArray<string>
): SkillsDetectorBinding => ({
  detectorId,
  detectorKind: 'heuristic',
  mappedHeuristicRuleIds,
});

const registryByRuleId: Record<string, SkillsDetectorBinding> = {
  'skills.ios.no-force-unwrap': heuristicDetector('ios.force-unwrap', [
    'heuristics.ios.force-unwrap.ast',
  ]),
  'skills.ios.no-force-try': heuristicDetector('ios.force-try', [
    'heuristics.ios.force-try.ast',
  ]),
  'skills.ios.no-anyview': heuristicDetector('ios.anyview', ['heuristics.ios.anyview.ast']),
  'skills.ios.no-force-cast': heuristicDetector('ios.force-cast', [
    'heuristics.ios.force-cast.ast',
  ]),
  'skills.ios.no-callback-style-outside-bridges': heuristicDetector(
    'ios.callback-style',
    ['heuristics.ios.callback-style.ast']
  ),
  'skills.ios.no-dispatchqueue': heuristicDetector('ios.dispatchqueue', [
    'heuristics.ios.dispatchqueue.ast',
  ]),
  'skills.ios.no-dispatchgroup': heuristicDetector('ios.dispatchgroup', [
    'heuristics.ios.dispatchgroup.ast',
  ]),
  'skills.ios.no-dispatchsemaphore': heuristicDetector('ios.dispatchsemaphore', [
    'heuristics.ios.dispatchsemaphore.ast',
  ]),
  'skills.ios.no-operation-queue': heuristicDetector('ios.operation-queue', [
    'heuristics.ios.operation-queue.ast',
  ]),
  'skills.ios.no-task-detached': heuristicDetector('ios.task-detached', [
    'heuristics.ios.task-detached.ast',
  ]),
  'skills.ios.no-unchecked-sendable': heuristicDetector('ios.unchecked-sendable', [
    'heuristics.ios.unchecked-sendable.ast',
  ]),
  'skills.ios.no-preconcurrency': heuristicDetector('ios.preconcurrency', [
    'heuristics.ios.preconcurrency.ast',
  ]),
  'skills.ios.no-nonisolated-unsafe': heuristicDetector('ios.nonisolated-unsafe', [
    'heuristics.ios.nonisolated-unsafe.ast',
  ]),
  'skills.ios.no-assume-isolated': heuristicDetector('ios.assume-isolated', [
    'heuristics.ios.assume-isolated.ast',
  ]),
  'skills.ios.no-observable-object': heuristicDetector('ios.observable-object', [
    'heuristics.ios.observable-object.ast',
  ]),
  'skills.ios.no-legacy-swiftui-observable-wrapper': heuristicDetector(
    'ios.legacy-swiftui-observable-wrapper',
    ['heuristics.ios.legacy-swiftui-observable-wrapper.ast']
  ),
  'skills.ios.no-passed-value-state-wrapper': heuristicDetector('ios.passed-value-state-wrapper', [
    'heuristics.ios.passed-value-state-wrapper.ast',
  ]),
  'skills.ios.no-navigation-view': heuristicDetector('ios.navigation-view', [
    'heuristics.ios.navigation-view.ast',
  ]),
  'skills.ios.no-foreground-color': heuristicDetector('ios.foreground-color', [
    'heuristics.ios.foreground-color.ast',
  ]),
  'skills.ios.no-corner-radius': heuristicDetector('ios.corner-radius', [
    'heuristics.ios.corner-radius.ast',
  ]),
  'skills.ios.no-tab-item': heuristicDetector('ios.tab-item', [
    'heuristics.ios.tab-item.ast',
  ]),
  'skills.ios.no-on-tap-gesture': heuristicDetector('ios.on-tap-gesture', [
    'heuristics.ios.on-tap-gesture.ast',
  ]),
  'skills.ios.no-string-format': heuristicDetector('ios.string-format', [
    'heuristics.ios.string-format.ast',
  ]),
  'skills.ios.no-foreach-indices': heuristicDetector('ios.foreach-indices', [
    'heuristics.ios.foreach-indices.ast',
  ]),
  'skills.ios.no-contains-user-filter': heuristicDetector('ios.contains-user-filter', [
    'heuristics.ios.contains-user-filter.ast',
  ]),
  'skills.ios.no-geometryreader': heuristicDetector('ios.geometryreader', [
    'heuristics.ios.geometryreader.ast',
  ]),
  'skills.ios.no-font-weight-bold': heuristicDetector('ios.font-weight-bold', [
    'heuristics.ios.font-weight-bold.ast',
  ]),
  'skills.ios.no-scrollview-shows-indicators': heuristicDetector(
    'ios.scrollview-shows-indicators',
    ['heuristics.ios.scrollview-shows-indicators.ast']
  ),
  'skills.ios.no-sheet-is-presented': heuristicDetector('ios.sheet-is-presented', [
    'heuristics.ios.sheet-is-presented.ast',
  ]),
  'skills.ios.no-legacy-onchange': heuristicDetector('ios.legacy-onchange', [
    'heuristics.ios.legacy-onchange.ast',
  ]),
  'skills.ios.no-uiscreen-main-bounds': heuristicDetector('ios.uiscreen-main-bounds', [
    'heuristics.ios.uiscreen-main-bounds.ast',
  ]),
  'skills.ios.prefer-swift-testing': heuristicDetector('ios.testing.xctest-import', [
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
  ]),
  'skills.ios.no-xctassert': heuristicDetector('ios.testing.xctassert', [
    'heuristics.ios.testing.xctassert.ast',
  ]),
  'skills.ios.no-xctunwrap': heuristicDetector('ios.testing.xctunwrap', [
    'heuristics.ios.testing.xctunwrap.ast',
  ]),
  'skills.ios.no-wait-for-expectations': heuristicDetector('ios.testing.wait-for-expectations', [
    'heuristics.ios.testing.wait-for-expectations.ast',
  ]),
  'skills.ios.no-legacy-expectation-description': heuristicDetector(
    'ios.testing.legacy-expectation-description',
    ['heuristics.ios.testing.legacy-expectation-description.ast']
  ),
  'skills.ios.no-mixed-testing-frameworks': heuristicDetector('ios.testing.mixed-frameworks', [
    'heuristics.ios.testing.mixed-frameworks.ast',
  ]),
  'skills.ios.no-nsmanagedobject-boundary': heuristicDetector(
    'ios.core-data.nsmanagedobject-boundary',
    ['heuristics.ios.core-data.nsmanagedobject-boundary.ast']
  ),
  'skills.ios.no-nsmanagedobject-async-boundary': heuristicDetector(
    'ios.core-data.nsmanagedobject-async-boundary',
    ['heuristics.ios.core-data.nsmanagedobject-async-boundary.ast']
  ),
  'skills.ios.no-core-data-layer-leak': heuristicDetector('ios.core-data.layer-leak', [
    'heuristics.ios.core-data.layer-leak.ast',
  ]),
  'skills.ios.no-nsmanagedobject-state-leak': heuristicDetector(
    'ios.core-data.nsmanagedobject-state-leak',
    ['heuristics.ios.core-data.nsmanagedobject-state-leak.ast']
  ),
  'skills.backend.no-empty-catch': heuristicDetector('typescript.empty-catch', [
    'heuristics.ts.empty-catch.ast',
  ]),
  'skills.backend.no-console-log': heuristicDetector('typescript.console-log', [
    'heuristics.ts.console-log.ast',
  ]),
  'skills.backend.avoid-explicit-any': heuristicDetector('typescript.explicit-any', [
    'heuristics.ts.explicit-any.ast',
  ]),
  'skills.backend.no-solid-violations': heuristicDetector('typescript.solid', [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ]),
  'skills.backend.enforce-clean-architecture': heuristicDetector(
    'typescript.clean-architecture',
    [
      'heuristics.ts.solid.dip.framework-import.ast',
      'heuristics.ts.solid.dip.concrete-instantiation.ast',
    ]
  ),
  'skills.backend.no-god-classes': heuristicDetector('typescript.god-class', [
    'heuristics.ts.god-class-large-class.ast',
  ]),
  'skills.backend.guideline.backend.callback-hell-usar-async-await': heuristicDetector(
    'typescript.new-promise-async',
    ['heuristics.ts.new-promise-async.ast']
  ),
  'skills.backend.guideline.backend.try-catch-silenciosos-siempre-loggear-o-propagar':
    heuristicDetector('typescript.empty-catch', ['heuristics.ts.empty-catch.ast']),
  'skills.frontend.no-empty-catch': heuristicDetector('typescript.empty-catch', [
    'heuristics.ts.empty-catch.ast',
  ]),
  'skills.frontend.no-console-log': heuristicDetector('typescript.console-log', [
    'heuristics.ts.console-log.ast',
  ]),
  'skills.frontend.avoid-explicit-any': heuristicDetector('typescript.explicit-any', [
    'heuristics.ts.explicit-any.ast',
  ]),
  'skills.frontend.no-solid-violations': heuristicDetector('typescript.solid', [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ]),
  'skills.frontend.enforce-clean-architecture': heuristicDetector(
    'typescript.clean-architecture',
    [
      'heuristics.ts.solid.dip.framework-import.ast',
      'heuristics.ts.solid.dip.concrete-instantiation.ast',
    ]
  ),
  'skills.frontend.no-god-classes': heuristicDetector('typescript.god-class', [
    'heuristics.ts.god-class-large-class.ast',
  ]),
  'skills.android.no-thread-sleep': heuristicDetector('android.thread-sleep', [
    'heuristics.android.thread-sleep.ast',
  ]),
  'skills.android.no-globalscope': heuristicDetector('android.globalscope', [
    'heuristics.android.globalscope.ast',
  ]),
  'skills.android.no-runblocking': heuristicDetector('android.run-blocking', [
    'heuristics.android.run-blocking.ast',
  ]),
};

export const listSkillsDetectorBindings = (): ReadonlyArray<{
  ruleId: string;
  binding: SkillsDetectorBinding;
}> => {
  return Object.entries(registryByRuleId)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ruleId, binding]) => ({
      ruleId,
      binding,
    }));
};

export const resolveSkillsDetectorBinding = (
  ruleId: string
): SkillsDetectorBinding | undefined => {
  return registryByRuleId[ruleId];
};

export const resolveMappedHeuristicRuleIds = (
  ruleId: SkillsCompiledRule['id']
): ReadonlyArray<string> => {
  return registryByRuleId[ruleId]?.mappedHeuristicRuleIds ?? [];
};

export const resolveMappedHeuristicRuleIdsForCompiledRule = (
  rule: SkillsCompiledRule
): ReadonlyArray<string> => {
  const dynamicAstNodeIds = normalizeSkillsAstNodeIds(rule.astNodeIds);
  if (dynamicAstNodeIds.length > 0) {
    return dynamicAstNodeIds;
  }
  return resolveMappedHeuristicRuleIds(rule.id);
};
