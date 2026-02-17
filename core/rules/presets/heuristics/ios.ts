import type { RuleSet } from '../../RuleSet';

export const iosRules: RuleSet = [
  {
    id: 'heuristics.ios.force-unwrap.ast',
    description: 'Detects Swift force unwrap usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.force-unwrap.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected force unwrap usage.',
      code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
    },
  },
  {
    id: 'heuristics.ios.anyview.ast',
    description: 'Detects Swift AnyView type-erasure usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.anyview.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected AnyView usage.',
      code: 'HEURISTICS_IOS_ANYVIEW_AST',
    },
  },
  {
    id: 'heuristics.ios.force-try.ast',
    description: 'Detects Swift force try usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.force-try.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected force try usage.',
      code: 'HEURISTICS_IOS_FORCE_TRY_AST',
    },
  },
  {
    id: 'heuristics.ios.force-cast.ast',
    description: 'Detects Swift force cast usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.force-cast.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected force cast usage.',
      code: 'HEURISTICS_IOS_FORCE_CAST_AST',
    },
  },
  {
    id: 'heuristics.ios.callback-style.ast',
    description: 'Detects callback-style signatures outside approved iOS bridge layers.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.callback-style.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected callback-style API signature outside bridge layers.',
      code: 'HEURISTICS_IOS_CALLBACK_STYLE_AST',
    },
  },
  {
    id: 'heuristics.ios.dispatchqueue.ast',
    description: 'Detects DispatchQueue usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.dispatchqueue.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected DispatchQueue usage.',
      code: 'HEURISTICS_IOS_DISPATCHQUEUE_AST',
    },
  },
  {
    id: 'heuristics.ios.dispatchgroup.ast',
    description: 'Detects DispatchGroup usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.dispatchgroup.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected DispatchGroup usage.',
      code: 'HEURISTICS_IOS_DISPATCHGROUP_AST',
    },
  },
  {
    id: 'heuristics.ios.dispatchsemaphore.ast',
    description: 'Detects DispatchSemaphore usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.dispatchsemaphore.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected DispatchSemaphore usage.',
      code: 'HEURISTICS_IOS_DISPATCHSEMAPHORE_AST',
    },
  },
  {
    id: 'heuristics.ios.operation-queue.ast',
    description: 'Detects OperationQueue usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.operation-queue.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected OperationQueue usage.',
      code: 'HEURISTICS_IOS_OPERATION_QUEUE_AST',
    },
  },
  {
    id: 'heuristics.ios.task-detached.ast',
    description: 'Detects Task.detached usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.task-detached.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Task.detached usage.',
      code: 'HEURISTICS_IOS_TASK_DETACHED_AST',
    },
  },
  {
    id: 'heuristics.ios.unchecked-sendable.ast',
    description: 'Detects @unchecked Sendable usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.unchecked-sendable.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected @unchecked Sendable usage.',
      code: 'HEURISTICS_IOS_UNCHECKED_SENDABLE_AST',
    },
  },
  {
    id: 'heuristics.ios.observable-object.ast',
    description: 'Detects ObservableObject usage in modern iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.observable-object.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected ObservableObject usage.',
      code: 'HEURISTICS_IOS_OBSERVABLE_OBJECT_AST',
    },
  },
  {
    id: 'heuristics.ios.navigation-view.ast',
    description: 'Detects NavigationView usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.navigation-view.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NavigationView usage.',
      code: 'HEURISTICS_IOS_NAVIGATION_VIEW_AST',
    },
  },
  {
    id: 'heuristics.ios.on-tap-gesture.ast',
    description: 'Detects onTapGesture usage in iOS production code where Button is preferred.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.on-tap-gesture.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected onTapGesture usage where Button may be preferred.',
      code: 'HEURISTICS_IOS_ON_TAP_GESTURE_AST',
    },
  },
  {
    id: 'heuristics.ios.string-format.ast',
    description: 'Detects String(format:) usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.string-format.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected String(format:) usage.',
      code: 'HEURISTICS_IOS_STRING_FORMAT_AST',
    },
  },
  {
    id: 'heuristics.ios.uiscreen-main-bounds.ast',
    description: 'Detects UIScreen.main.bounds usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.uiscreen-main-bounds.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected UIScreen.main.bounds usage.',
      code: 'HEURISTICS_IOS_UISCREEN_MAIN_BOUNDS_AST',
    },
  },
];
