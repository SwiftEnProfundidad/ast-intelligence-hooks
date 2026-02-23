import type { SkillsCompiledRule } from './skillsLock';

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
  'skills.ios.no-observable-object': heuristicDetector('ios.observable-object', [
    'heuristics.ios.observable-object.ast',
  ]),
  'skills.ios.no-navigation-view': heuristicDetector('ios.navigation-view', [
    'heuristics.ios.navigation-view.ast',
  ]),
  'skills.ios.no-on-tap-gesture': heuristicDetector('ios.on-tap-gesture', [
    'heuristics.ios.on-tap-gesture.ast',
  ]),
  'skills.ios.no-string-format': heuristicDetector('ios.string-format', [
    'heuristics.ios.string-format.ast',
  ]),
  'skills.ios.no-uiscreen-main-bounds': heuristicDetector('ios.uiscreen-main-bounds', [
    'heuristics.ios.uiscreen-main-bounds.ast',
  ]),
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
