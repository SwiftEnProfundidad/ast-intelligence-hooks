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
    id: 'heuristics.ios.type-erasure.any.ast',
    description: 'Detects Swift Any/AnyObject/AnyHashable type erasure in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.type-erasure.any.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Swift Any/AnyObject/AnyHashable type erasure in production code.',
      code: 'HEURISTICS_IOS_TYPE_ERASURE_ANY_AST',
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
    id: 'heuristics.ios.combine.sink-without-store.ast',
    description: 'Detects Combine sink/assign subscriptions that are not retained with store(in:).',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.combine.sink-without-store.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Combine sink/assign without store(in:); keep cancellables retained explicitly.',
      code: 'HEURISTICS_IOS_COMBINE_SINK_WITHOUT_STORE_AST',
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
    id: 'heuristics.ios.concurrency.long-task-without-cancellation-check.ast',
    description: 'Detects long-running async Swift loops without Task cancellation checks.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.long-task-without-cancellation-check.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a long async operation without cooperative Task cancellation checks.',
      code: 'HEURISTICS_IOS_CONCURRENCY_LONG_TASK_WITHOUT_CANCELLATION_CHECK_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.async-without-await.ast',
    description: 'Detects private async functions that do not await in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.async-without-await.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a private async function without await; remove async unless a protocol/override boundary requires it.',
      code: 'HEURISTICS_IOS_CONCURRENCY_ASYNC_WITHOUT_AWAIT_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.dummy-await.ast',
    description: 'Detects dummy awaits inserted to silence async_without_await instead of fixing the async boundary.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.dummy-await.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a dummy await used as a Swift concurrency lint workaround.',
      code: 'HEURISTICS_IOS_CONCURRENCY_DUMMY_AWAIT_AST',
    },
  },
  {
    id: 'heuristics.ios.error.empty-catch.ast',
    description: 'Detects Swift catch blocks that silently swallow errors.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.error.empty-catch.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected an empty Swift catch block.',
      code: 'HEURISTICS_IOS_ERROR_EMPTY_CATCH_AST',
    },
  },
  {
    id: 'heuristics.ios.error.nserror-throw.ast',
    description: 'Detects direct NSError throws where typed Swift Error enums should be used.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.error.nserror-throw.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected throw NSError(...) in iOS production code.',
      code: 'HEURISTICS_IOS_ERROR_NSERROR_THROW_AST',
    },
  },
  {
    id: 'heuristics.ios.networking.endpoint-enum-ocp.ast',
    description: 'Detects API endpoint catalogs modeled as Swift enums instead of data-driven endpoint values.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.networking.endpoint-enum-ocp.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected API endpoint modeled as enum; use a data-driven APIEndpoint struct to preserve OCP.',
      code: 'HEURISTICS_IOS_NETWORKING_ENDPOINT_ENUM_OCP_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.onappear-task.ast',
    description: 'Detects Task launches from SwiftUI onAppear where .task can provide lifecycle cancellation.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.onappear-task.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Task launched from SwiftUI onAppear; .task/.task(id:) provides lifecycle-aware cancellation.',
      code: 'HEURISTICS_IOS_SWIFTUI_ONAPPEAR_TASK_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.onchange-task.ast',
    description:
      'Detects Task launches from SwiftUI onChange where .task(id:) should own value-dependent cancellation.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.onchange-task.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Task launched from SwiftUI onChange; .task(id:) should own value-dependent cancellation.',
      code: 'HEURISTICS_IOS_SWIFTUI_ONCHANGE_TASK_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.onchange-readonly-var.ast',
    description: 'Detects local var declarations inside SwiftUI onChange closures where let should be used for read-only derived values.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.onchange-readonly-var.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected local var inside SwiftUI onChange; prefer let for read-only derived values.',
      code: 'HEURISTICS_IOS_SWIFTUI_ONCHANGE_READONLY_VAR_AST',
    },
  },
  {
    id: 'heuristics.ios.memory.strong-delegate.ast',
    description: 'Detects strong delegate/dataSource references in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.memory.strong-delegate.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a strong delegate/dataSource reference; weak delegates remain the preferred baseline to avoid retain cycles.',
      code: 'HEURISTICS_IOS_MEMORY_STRONG_DELEGATE_AST',
    },
  },
  {
    id: 'heuristics.ios.architecture.cross-feature-import.ast',
    description: 'Detects Swift feature modules importing sibling feature modules directly.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.architecture.cross-feature-import.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a Swift feature importing another feature module directly.',
      code: 'HEURISTICS_IOS_ARCHITECTURE_CROSS_FEATURE_IMPORT_AST',
    },
  },
  {
    id: 'heuristics.ios.architecture.layer-direction-violation.ast',
    description: 'Detects Swift imports that violate iOS Clean Architecture layer direction.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.architecture.layer-direction-violation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected an import that violates Clean Architecture layer direction in iOS code.',
      code: 'HEURISTICS_IOS_ARCHITECTURE_LAYER_DIRECTION_VIOLATION_AST',
    },
  },
  {
    id: 'heuristics.ios.architecture.excessive-public-api.ast',
    description: 'Detects excessive public/open API surface in iOS app implementation files.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.architecture.excessive-public-api.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected excessive public/open Swift API surface in iOS app code.',
      code: 'HEURISTICS_IOS_ARCHITECTURE_EXCESSIVE_PUBLIC_API_AST',
    },
  },
  {
    id: 'heuristics.ios.memory.strong-self-escaping-closure.ast',
    description: 'Detects strong self captures in escaping iOS closures.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.memory.strong-self-escaping-closure.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected strong self capture in an escaping iOS closure; weak or unowned captures remain the preferred baseline when ownership is not explicit.',
      code: 'HEURISTICS_IOS_MEMORY_STRONG_SELF_ESCAPING_CLOSURE_AST',
    },
  },
  {
    id: 'heuristics.ios.memory.unowned-self-capture.ast',
    description: 'Detects unowned captures in iOS closures.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.memory.unowned-self-capture.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected unowned capture in an iOS closure; use weak capture unless lifetime is explicitly guaranteed.',
      code: 'HEURISTICS_IOS_MEMORY_UNOWNED_SELF_CAPTURE_AST',
    },
  },
  {
    id: 'heuristics.ios.memory.manual-management.ast',
    description: 'Detects manual memory management that bypasses Swift ARC.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.memory.manual-management.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected manual memory management that bypasses Swift ARC.',
      code: 'HEURISTICS_IOS_MEMORY_MANUAL_MANAGEMENT_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.makesut-without-memory-tracking.ast',
    description: 'Detects iOS test makeSUT helpers that do not register SUTs for memory-leak tracking.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.makesut-without-memory-tracking.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected makeSUT() in an iOS test without trackForMemoryLeaks(sut).',
      code: 'HEURISTICS_IOS_TESTING_MAKESUT_WITHOUT_MEMORY_TRACKING_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.direct-sut-instantiation-without-makesut.ast',
    description: 'Detects direct SUT construction in iOS tests without a makeSUT factory.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.direct-sut-instantiation-without-makesut.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected direct SUT instantiation in an iOS test without makeSUT().',
      code: 'HEURISTICS_IOS_TESTING_DIRECT_SUT_INSTANTIATION_WITHOUT_MAKESUT_AST',
    },
  },
  {
    id: 'heuristics.ios.maintainability.nested-if-pyramid.ast',
    description: 'Detects deeply nested if pyramids in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.maintainability.nested-if-pyramid.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected nested if pyramid in iOS code; prefer guard clauses and early returns.',
      code: 'HEURISTICS_IOS_MAINTAINABILITY_NESTED_IF_PYRAMID_AST',
    },
  },
  {
    id: 'heuristics.ios.maintainability.comment-trivia.ast',
    description: 'Detects source comments in iOS production Swift code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.maintainability.comment-trivia.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected source comments in iOS production code; prefer self-documenting names and extracted concepts.',
      code: 'HEURISTICS_IOS_MAINTAINABILITY_COMMENT_TRIVIA_AST',
    },
  },
  {
    id: 'heuristics.ios.maintainability.warning-suppression.ast',
    description: 'Detects local warning or lint suppression directives in iOS production Swift code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.maintainability.warning-suppression.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected local warning/lint suppression in iOS production code; fix the underlying issue instead of hiding diagnostics.',
      code: 'HEURISTICS_IOS_MAINTAINABILITY_WARNING_SUPPRESSION_AST',
    },
  },
  {
    id: 'heuristics.ios.architecture.custom-singleton.ast',
    description: 'Detects custom static shared singletons in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.architecture.custom-singleton.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a custom static shared singleton in iOS production code; dependency injection remains the preferred baseline for app-owned services.',
      code: 'HEURISTICS_IOS_ARCHITECTURE_CUSTOM_SINGLETON_AST',
    },
  },
  {
    id: 'heuristics.ios.architecture.swinject.ast',
    description: 'Detects Swinject usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.architecture.swinject.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Swinject usage; manual dependency injection or SwiftUI Environment remain the preferred native baseline.',
      code: 'HEURISTICS_IOS_ARCHITECTURE_SWINJECT_AST',
    },
  },
  {
    id: 'heuristics.ios.architecture.tca-composable-architecture.ast',
    description: 'Detects The Composable Architecture usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.architecture.tca-composable-architecture.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected The Composable Architecture usage; native SwiftUI state, use cases, actors and explicit environment boundaries remain the preferred baseline.',
      code: 'HEURISTICS_IOS_ARCHITECTURE_TCA_COMPOSABLE_ARCHITECTURE_AST',
    },
  },
  {
    id: 'heuristics.ios.architecture.massive-view-controller.ast',
    description: 'Detects UIViewController classes with direct infrastructure/data access.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.architecture.massive-view-controller.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a UIViewController with direct infrastructure/data access; move data access behind application/domain boundaries.',
      code: 'HEURISTICS_IOS_ARCHITECTURE_MASSIVE_VIEW_CONTROLLER_AST',
    },
  },
  {
    id: 'heuristics.ios.maintainability.magic-number-layout.ast',
    description: 'Detects SwiftUI layout magic numbers in presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.maintainability.magic-number-layout.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected SwiftUI layout magic numbers; named constants or design tokens remain the preferred baseline.',
      code: 'HEURISTICS_IOS_MAINTAINABILITY_MAGIC_NUMBER_LAYOUT_AST',
    },
  },
  {
    id: 'heuristics.ios.uikit.manual-frame-layout.ast',
    description: 'Detects UIKit manual frame CGRect layout in iOS presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.uikit.manual-frame-layout.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected UIKit manual frame layout; use Auto Layout constraints or SwiftUI relative layout.',
      code: 'HEURISTICS_IOS_UIKIT_MANUAL_FRAME_LAYOUT_AST',
    },
  },
  {
    id: 'heuristics.ios.safety.non-iboutlet-iuo.ast',
    description: 'Detects implicitly unwrapped optionals outside IBOutlet wiring.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.safety.non-iboutlet-iuo.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected an implicitly unwrapped optional outside IBOutlet wiring; explicit optionals or initialization guarantees remain the preferred baseline.',
      code: 'HEURISTICS_IOS_SAFETY_NON_IBOUTLET_IUO_AST',
    },
  },
  {
    id: 'heuristics.ios.logging.adhoc-print.ast',
    description: 'Detects print/debugPrint/dump/NSLog/os_log usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.logging.adhoc-print.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected print/debugPrint/dump/NSLog/os_log usage in iOS production code.',
      code: 'HEURISTICS_IOS_LOGGING_ADHOC_PRINT_AST',
    },
  },
  {
    id: 'heuristics.ios.logging.sensitive-data.ast',
    description: 'Detects sensitive data in iOS logging calls.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.logging.sensitive-data.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected sensitive data in an iOS logging call.',
      code: 'HEURISTICS_IOS_LOGGING_SENSITIVE_DATA_AST',
    },
  },
  {
    id: 'heuristics.ios.security.hardcoded-sensitive-string.ast',
    description: 'Detects hardcoded sensitive Swift string values in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.security.hardcoded-sensitive-string.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected hardcoded sensitive Swift string; Keychain, secure config or environment-specific secrets remain the preferred baseline.',
      code: 'HEURISTICS_IOS_SECURITY_HARDCODED_SENSITIVE_STRING_AST',
    },
  },
  {
    id: 'heuristics.ios.localization.unlocalized-dateformatter.ast',
    description: 'Detects DateFormatter fixed date formats without an explicit locale in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.localization.unlocalized-dateformatter.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected DateFormatter dateFormat usage without an explicit locale; localized date formatting remains the preferred baseline.',
      code: 'HEURISTICS_IOS_LOCALIZATION_UNLOCALIZED_DATEFORMATTER_AST',
    },
  },
  {
    id: 'heuristics.ios.networking.alamofire.ast',
    description: 'Detects Alamofire usage in iOS production code; URLSession is the preferred baseline for new code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.networking.alamofire.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Alamofire usage in iOS production code; URLSession remains the preferred baseline for new code.',
      code: 'HEURISTICS_IOS_NETWORKING_ALAMOFIRE_AST',
    },
  },
  {
    id: 'heuristics.ios.json.jsonserialization.ast',
    description: 'Detects JSONSerialization usage in iOS production code; Codable is the preferred baseline for new code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.json.jsonserialization.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected JSONSerialization usage in iOS production code; Codable remains the preferred baseline for new code.',
      code: 'HEURISTICS_IOS_JSON_JSONSERIALIZATION_AST',
    },
  },
  {
    id: 'heuristics.ios.dependencies.cocoapods.ast',
    description: 'Detects CocoaPods dependency files in iOS projects; Swift Package Manager is the preferred baseline for new code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.dependencies.cocoapods.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected CocoaPods dependency files in an iOS project; Swift Package Manager remains the preferred baseline for new code.',
      code: 'HEURISTICS_IOS_DEPENDENCIES_COCOAPODS_AST',
    },
  },
  {
    id: 'heuristics.ios.dependencies.carthage.ast',
    description: 'Detects Carthage dependency files in iOS projects; Swift Package Manager is the preferred baseline for new code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.dependencies.carthage.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Carthage dependency files in an iOS project; Swift Package Manager remains the preferred baseline for new code.',
      code: 'HEURISTICS_IOS_DEPENDENCIES_CARTHAGE_AST',
    },
  },
  {
    id: 'heuristics.ios.dependencies.swiftpm-branch-dependency.ast',
    description: 'Detects branch-based SwiftPM dependencies in iOS Package.swift.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.dependencies.swiftpm-branch-dependency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a branch-based SwiftPM dependency.',
      code: 'HEURISTICS_IOS_DEPENDENCIES_SWIFTPM_BRANCH_DEPENDENCY_AST',
    },
  },
  {
    id: 'heuristics.ios.dependencies.swift-tools-version-below-6-2.ast',
    description: 'Detects iOS Package.swift manifests below Swift tools 6.2.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.dependencies.swift-tools-version-below-6-2.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Package.swift using swift-tools-version below 6.2.',
      code: 'HEURISTICS_IOS_DEPENDENCIES_SWIFT_TOOLS_VERSION_BELOW_6_2_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.swiftpm-default-isolation-not-mainactor.ast',
    description: 'Detects SwiftPM iOS manifests whose default isolation is not MainActor.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.swiftpm-default-isolation-not-mainactor.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Package.swift .defaultIsolation not set to MainActor.',
      code: 'HEURISTICS_IOS_CONCURRENCY_SWIFTPM_DEFAULT_ISOLATION_NOT_MAINACTOR_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.swiftpm-strict-concurrency-below-complete.ast',
    description: 'Detects SwiftPM iOS manifests using targeted/minimal StrictConcurrency.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.swiftpm-strict-concurrency-below-complete.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Package.swift StrictConcurrency below complete.',
      code: 'HEURISTICS_IOS_CONCURRENCY_SWIFTPM_STRICT_CONCURRENCY_BELOW_COMPLETE_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.strict-concurrency-below-complete.ast',
    description: 'Detects Xcode iOS targets with strict concurrency checking below complete.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.strict-concurrency-below-complete.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected SWIFT_STRICT_CONCURRENCY below complete in an iOS Xcode project.',
      code: 'HEURISTICS_IOS_CONCURRENCY_STRICT_CONCURRENCY_BELOW_COMPLETE_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.default-actor-isolation-not-mainactor.ast',
    description: 'Detects Xcode iOS targets whose default actor isolation is not MainActor.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.default-actor-isolation-not-mainactor.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected SWIFT_DEFAULT_ACTOR_ISOLATION not set to MainActor in an iOS Xcode project.',
      code: 'HEURISTICS_IOS_CONCURRENCY_DEFAULT_ACTOR_ISOLATION_NOT_MAINACTOR_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.upcoming-feature-disabled.ast',
    description: 'Detects Xcode iOS targets with required Swift upcoming features disabled.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.upcoming-feature-disabled.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected disabled Swift upcoming feature settings in an iOS Xcode project.',
      code: 'HEURISTICS_IOS_CONCURRENCY_UPCOMING_FEATURE_DISABLED_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.ui-state-without-mainactor.ast',
    description: 'Detects observable iOS UI state owners without @MainActor isolation.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.ui-state-without-mainactor.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected observable iOS UI state without @MainActor isolation.',
      code: 'HEURISTICS_IOS_CONCURRENCY_UI_STATE_WITHOUT_MAINACTOR_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.shared-mutable-state-without-actor.ast',
    description: 'Detects shared mutable iOS state owners without actor isolation.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.shared-mutable-state-without-actor.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected shared mutable iOS state without actor isolation.',
      code: 'HEURISTICS_IOS_CONCURRENCY_SHARED_MUTABLE_STATE_WITHOUT_ACTOR_AST',
    },
  },
  {
    id: 'heuristics.ios.naming.non-pascal-case-type.ast',
    description: 'Detects Swift type declarations that are not PascalCase.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.naming.non-pascal-case-type.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Swift type declaration without PascalCase.',
      code: 'HEURISTICS_IOS_NAMING_NON_PASCAL_CASE_TYPE_AST',
    },
  },
  {
    id: 'heuristics.ios.uikit.cell-without-reuse.ast',
    description: 'Detects UITableView/UICollectionView cell providers that create cells without dequeue reuse.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.uikit.cell-without-reuse.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected UIKit cell provider creating cells without dequeueReusableCell.',
      code: 'HEURISTICS_IOS_UIKIT_CELL_WITHOUT_REUSE_AST',
    },
  },
  {
    id: 'heuristics.ios.security.userdefaults-sensitive-data.ast',
    description: 'Detects sensitive data stored in UserDefaults/AppStorage; Keychain is the preferred baseline for secrets.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.security.userdefaults-sensitive-data.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected sensitive data stored in UserDefaults/AppStorage; native Keychain remains the preferred baseline for secrets.',
      code: 'HEURISTICS_IOS_SECURITY_USERDEFAULTS_SENSITIVE_DATA_AST',
    },
  },
  {
    id: 'heuristics.ios.security.insecure-transport.ast',
    description: 'Detects insecure HTTP transport or permissive ATS configuration in iOS projects.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.security.insecure-transport.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected insecure iOS transport configuration; HTTPS and ATS remain the preferred baseline.',
      code: 'HEURISTICS_IOS_SECURITY_INSECURE_TRANSPORT_AST',
    },
  },
  {
    id: 'heuristics.ios.localization.localizable-strings.ast',
    description: 'Detects legacy Localizable.strings files where String Catalogs are the preferred iOS baseline.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.localization.localizable-strings.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Localizable.strings usage; String Catalogs (.xcstrings) remain the preferred baseline for new localization work.',
      code: 'HEURISTICS_IOS_LOCALIZATION_LOCALIZABLE_STRINGS_AST',
    },
  },
  {
    id: 'heuristics.ios.interface-builder.storyboard-xib.ast',
    description: 'Detects Storyboard/XIB usage where programmatic UI should be used.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.interface-builder.storyboard-xib.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Storyboard/XIB usage; programmatic SwiftUI/UIKit UI remains the preferred baseline.',
      code: 'HEURISTICS_IOS_INTERFACE_BUILDER_STORYBOARD_XIB_AST',
    },
  },
  {
    id: 'heuristics.ios.localization.hardcoded-ui-string.ast',
    description: 'Detects hardcoded user-facing SwiftUI text where String(localized:) and String Catalogs are preferred.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.localization.hardcoded-ui-string.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected hardcoded user-facing SwiftUI text; String(localized:) and String Catalogs remain the preferred baseline.',
      code: 'HEURISTICS_IOS_LOCALIZATION_HARDCODED_UI_STRING_AST',
    },
  },
  {
    id: 'heuristics.ios.assets.loose-resource.ast',
    description: 'Detects loose image resource loading where Asset Catalogs are the preferred iOS baseline.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.assets.loose-resource.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected loose image resource loading in iOS production code; Asset Catalogs remain the preferred baseline.',
      code: 'HEURISTICS_IOS_ASSETS_LOOSE_RESOURCE_AST',
    },
  },
  {
    id: 'heuristics.ios.accessibility.fixed-font-size.ast',
    description: 'Detects fixed font sizes where Dynamic Type semantic styles are the preferred iOS baseline.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.accessibility.fixed-font-size.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fixed font sizing in iOS production code; Dynamic Type semantic text styles remain the preferred baseline.',
      code: 'HEURISTICS_IOS_ACCESSIBILITY_FIXED_FONT_SIZE_AST',
    },
  },
  {
    id: 'heuristics.ios.localization.physical-text-alignment.ast',
    description: 'Detects physical left/right text alignment where leading/trailing are the preferred RTL-safe iOS baseline.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.localization.physical-text-alignment.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected physical left/right text alignment in iOS production code; leading/trailing remain the preferred RTL-safe baseline.',
      code: 'HEURISTICS_IOS_LOCALIZATION_PHYSICAL_TEXT_ALIGNMENT_AST',
    },
  },
  {
    id: 'heuristics.ios.performance.blocking-sleep.ast',
    description: 'Detects blocking sleep calls where cancellable async scheduling is the preferred iOS baseline.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.performance.blocking-sleep.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected blocking sleep usage in iOS production code; async clocks, suspension or cancellable scheduling remain the preferred baseline.',
      code: 'HEURISTICS_IOS_PERFORMANCE_BLOCKING_SLEEP_AST',
    },
  },
  {
    id: 'heuristics.ios.concurrency.thread-centric-debugging.ast',
    description: 'Detects Thread.current, Thread.isMainThread and pthread thread identity checks in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.concurrency.thread-centric-debugging.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected thread-centric debugging in Swift Concurrency code.',
      code: 'HEURISTICS_IOS_CONCURRENCY_THREAD_CENTRIC_DEBUGGING_AST',
    },
  },
  {
    id: 'heuristics.ios.accessibility.icon-only-control-label.ast',
    description: 'Detects icon-only SwiftUI controls without explicit accessibility labels.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.accessibility.icon-only-control-label.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected an icon-only SwiftUI control without accessibilityLabel; explicit accessible labels remain the preferred baseline.',
      code: 'HEURISTICS_IOS_ACCESSIBILITY_ICON_ONLY_CONTROL_LABEL_AST',
    },
  },
  {
    id: 'heuristics.ios.accessibility.missing-accessibility-identifier.ast',
    description: 'Detects interactive SwiftUI controls without accessibilityIdentifier.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.accessibility.missing-accessibility-identifier.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected an interactive SwiftUI control without accessibilityIdentifier; stable identifiers are required for UI automation and traceability.',
      code: 'HEURISTICS_IOS_ACCESSIBILITY_MISSING_ACCESSIBILITY_IDENTIFIER_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.missing-bindable-observable-binding.ast',
    description: 'Detects injected @Observable values used as bindings without @Bindable.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.missing-bindable-observable-binding.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected an injected @Observable used as a binding without @Bindable.',
      code: 'HEURISTICS_IOS_SWIFTUI_MISSING_BINDABLE_OBSERVABLE_BINDING_AST',
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
    id: 'heuristics.ios.preconcurrency.ast',
    description: 'Detects @preconcurrency usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.preconcurrency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected @preconcurrency usage.',
      code: 'HEURISTICS_IOS_PRECONCURRENCY_AST',
    },
  },
  {
    id: 'heuristics.ios.nonisolated-unsafe.ast',
    description: 'Detects nonisolated(unsafe) usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.nonisolated-unsafe.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected nonisolated(unsafe) usage.',
      code: 'HEURISTICS_IOS_NONISOLATED_UNSAFE_AST',
    },
  },
  {
    id: 'heuristics.ios.assume-isolated.ast',
    description: 'Detects assumeIsolated usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.assume-isolated.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected assumeIsolated usage.',
      code: 'HEURISTICS_IOS_ASSUME_ISOLATED_AST',
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
    id: 'heuristics.ios.swiftui.legacy-preview-provider.ast',
    description: 'Detects PreviewProvider usage where modern SwiftUI #Preview macros should be used.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.legacy-preview-provider.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected PreviewProvider usage; use #Preview macros for modern SwiftUI previews.',
      code: 'HEURISTICS_IOS_SWIFTUI_LEGACY_PREVIEW_PROVIDER_AST',
    },
  },
  {
    id: 'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
    description: 'Detects @StateObject and @ObservedObject usage in modern SwiftUI production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected @StateObject/@ObservedObject usage in a modern SwiftUI path.',
      code: 'HEURISTICS_IOS_LEGACY_SWIFTUI_OBSERVABLE_WRAPPER_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.environment-object.ast',
    description: 'Detects @EnvironmentObject usage in SwiftUI presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.environment-object.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected @EnvironmentObject in SwiftUI presentation code; prefer explicit dependencies or narrowly scoped Environment values.',
      code: 'HEURISTICS_IOS_SWIFTUI_ENVIRONMENT_OBJECT_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.test-double-without-protocol.ast',
    description: 'Detects Swift Mock/Fake/Spy/Stub classes without protocol conformance.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.test-double-without-protocol.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a Swift test double class without protocol conformance.',
      code: 'HEURISTICS_IOS_TESTING_TEST_DOUBLE_WITHOUT_PROTOCOL_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.production-test-double.ast',
    description: 'Detects Mock/Fake/Spy/Stub usage in iOS production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.production-test-double.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Mock/Fake/Spy/Stub usage in iOS production code.',
      code: 'HEURISTICS_IOS_TESTING_PRODUCTION_TEST_DOUBLE_AST',
    },
  },
  {
    id: 'heuristics.ios.accessibility.low-contrast-static-color-pair.ast',
    description: 'Detects static SwiftUI foreground/background color pairs with insufficient contrast.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.accessibility.low-contrast-static-color-pair.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a static SwiftUI foreground/background color pair with insufficient contrast.',
      code: 'HEURISTICS_IOS_ACCESSIBILITY_LOW_CONTRAST_STATIC_COLOR_PAIR_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.non-private-state-ownership.ast',
    description: 'Detects @State/@StateObject declarations without private visibility in SwiftUI presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.non-private-state-ownership.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected @State/@StateObject without private visibility; SwiftUI owned state should be private.',
      code: 'HEURISTICS_IOS_SWIFTUI_NON_PRIVATE_STATE_OWNERSHIP_AST',
    },
  },
  {
    id: 'heuristics.ios.passed-value-state-wrapper.ast',
    description: 'Detects passed values stored as @State or @StateObject through init ownership in SwiftUI production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.passed-value-state-wrapper.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a passed value stored as @State/@StateObject via init wrapper ownership.',
      code: 'HEURISTICS_IOS_PASSED_VALUE_STATE_WRAPPER_AST',
    },
  },
  {
    id: 'heuristics.ios.foreach-indices.ast',
    description: 'Detects ForEach(...indices...) usage in SwiftUI presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.foreach-indices.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected ForEach(...indices...) usage where stable element identity may be preferred.',
      code: 'HEURISTICS_IOS_FOREACH_INDICES_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.foreach-self-identity.ast',
    description: 'Detects SwiftUI ForEach usage with id: \.self instead of stable domain identity.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.foreach-self-identity.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected ForEach(..., id: \.self) usage; prefer a stable domain identity such as id: \.id or Identifiable models.',
      code: 'HEURISTICS_IOS_SWIFTUI_FOREACH_SELF_IDENTITY_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.inline-foreach-transform.ast',
    description: 'Detects inline filter/map/sort transformations inside SwiftUI ForEach calls.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.inline-foreach-transform.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected inline filter/map/sort work inside ForEach; prefiltered or cached collections remain the preferred baseline.',
      code: 'HEURISTICS_IOS_SWIFTUI_INLINE_FOREACH_TRANSFORM_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.self-print-changes.ast',
    description: 'Detects SwiftUI Self._printChanges() debugging helpers in production views.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.self-print-changes.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Self._printChanges() in SwiftUI presentation code; remove debug-only render diagnostics from production views.',
      code: 'HEURISTICS_IOS_SWIFTUI_SELF_PRINT_CHANGES_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.foreach-conditional-view-count.ast',
    description: 'Detects conditional view counts inside SwiftUI ForEach rows.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.foreach-conditional-view-count.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected conditional view count inside ForEach; keep a constant number of views per element by moving branching into row views or modifiers.',
      code: 'HEURISTICS_IOS_SWIFTUI_FOREACH_CONDITIONAL_VIEW_COUNT_AST',
    },
  },
  {
    id: 'heuristics.ios.contains-user-filter.ast',
    description: 'Detects contains() usage in user-facing filter flows where localizedStandardContains() may be preferred.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.contains-user-filter.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected contains() in a user-facing filter where localizedStandardContains() may be preferred.',
      code: 'HEURISTICS_IOS_CONTAINS_USER_FILTER_AST',
    },
  },
  {
    id: 'heuristics.ios.geometryreader.ast',
    description: 'Detects GeometryReader usage in SwiftUI presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.geometryreader.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected GeometryReader usage that may be replaceable with modern layout APIs.',
      code: 'HEURISTICS_IOS_GEOMETRYREADER_AST',
    },
  },
  {
    id: 'heuristics.ios.font-weight-bold.ast',
    description: 'Detects fontWeight(.bold) usage in SwiftUI presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.font-weight-bold.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fontWeight(.bold) usage where bold() may be preferred.',
      code: 'HEURISTICS_IOS_FONT_WEIGHT_BOLD_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.explicit-color-static-member.ast',
    description: 'Detects Color.* static member usage where SwiftUI static member lookup is available.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.explicit-color-static-member.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Color.* static member usage where SwiftUI static member lookup may be preferred.',
      code: 'HEURISTICS_IOS_SWIFTUI_EXPLICIT_COLOR_STATIC_MEMBER_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.closure-based-viewbuilder-content.ast',
    description: 'Detects closure-based SwiftUI content properties where @ViewBuilder let content: Content is preferred.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.closure-based-viewbuilder-content.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected closure-based content storage; @ViewBuilder let content: Content remains the preferred SwiftUI container baseline.',
      code: 'HEURISTICS_IOS_SWIFTUI_CLOSURE_BASED_VIEWBUILDER_CONTENT_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.large-config-context-prop.ast',
    description: 'Detects broad Config/Context properties stored directly on SwiftUI Views.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.large-config-context-prop.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a SwiftUI View storing a broad config/context object; pass only needed values to reduce update fan-out.',
      code: 'HEURISTICS_IOS_SWIFTUI_LARGE_CONFIG_CONTEXT_PROP_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.conditional-same-view-identity.ast',
    description:
      'Detects SwiftUI if/else branches that rebuild the same View type for state-only visual changes.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.conditional-same-view-identity.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected conditional branches rebuilding the same SwiftUI View type; prefer conditional modifiers or values to preserve view identity.',
      code: 'HEURISTICS_IOS_SWIFTUI_CONDITIONAL_SAME_VIEW_IDENTITY_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.parent-owned-sheet-action.ast',
    description:
      'Detects SwiftUI sheets that receive save/cancel/dismiss callbacks from the parent view.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.parent-owned-sheet-action.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a SwiftUI sheet receiving parent-owned action callbacks; sheets should own save/cancel actions and call dismiss() internally.',
      code: 'HEURISTICS_IOS_SWIFTUI_PARENT_OWNED_SHEET_ACTION_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.redundant-reactive-state-assignment.ast',
    description: 'Detects onChange/onReceive state assignments without a value-change guard.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.redundant-reactive-state-assignment.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected reactive state assignment without a value-change guard; check for value changes before assigning state in hot paths.',
      code: 'HEURISTICS_IOS_SWIFTUI_REDUNDANT_REACTIVE_STATE_ASSIGNMENT_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.non-lazy-scroll-foreach.ast',
    description: 'Detects ScrollView content backed by non-lazy stacks and ForEach.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.non-lazy-scroll-foreach.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected ScrollView with a non-lazy stack feeding ForEach; LazyVStack/LazyHStack remain the preferred baseline for large scrollable collections.',
      code: 'HEURISTICS_IOS_SWIFTUI_NON_LAZY_SCROLL_FOREACH_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.body-object-creation.ast',
    description: 'Detects expensive formatter object creation inside SwiftUI body.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.body-object-creation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected formatter object creation inside SwiftUI body; keep body simple and move expensive objects out of render paths.',
      code: 'HEURISTICS_IOS_SWIFTUI_BODY_OBJECT_CREATION_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.image-data-decoding.ast',
    description: 'Detects UIImage(data:) decoding in SwiftUI presentation paths.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.image-data-decoding.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected UIImage(data:) in SwiftUI presentation; downsample image data before rendering large images.',
      code: 'HEURISTICS_IOS_SWIFTUI_IMAGE_DATA_DECODING_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.manual-rendering-without-imagerenderer.ast',
    description: 'Detects manual SwiftUI view rendering where ImageRenderer should be used.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.manual-rendering-without-imagerenderer.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected manual SwiftUI view rendering without ImageRenderer.',
      code: 'HEURISTICS_IOS_SWIFTUI_MANUAL_RENDERING_WITHOUT_IMAGERENDERER_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.large-viewbuilder-function.ast',
    description: 'Detects large @ViewBuilder helper functions in SwiftUI presentation code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.large-viewbuilder-function.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a large @ViewBuilder helper function; keep @ViewBuilder functions small and extract complex sections into subviews.',
      code: 'HEURISTICS_IOS_SWIFTUI_LARGE_VIEWBUILDER_FUNCTION_AST',
    },
  },
  {
    id: 'heuristics.ios.accessibility.animation-without-reduce-motion.ast',
    description: 'Detects SwiftUI animations that do not account for reduce motion.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.accessibility.animation-without-reduce-motion.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected SwiftUI animation without reduce motion handling.',
      code: 'HEURISTICS_IOS_ACCESSIBILITY_ANIMATION_WITHOUT_REDUCE_MOTION_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.inline-action-logic.ast',
    description: 'Detects inline control-flow logic inside SwiftUI action handlers.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.inline-action-logic.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected inline logic inside a SwiftUI action handler; action handlers should reference methods and keep view declarations focused.',
      code: 'HEURISTICS_IOS_SWIFTUI_INLINE_ACTION_LOGIC_AST',
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
    id: 'heuristics.ios.navigation.path-without-restoration.ast',
    description: 'Detects SwiftUI NavigationPath state without an explicit restoration contract.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.navigation.path-without-restoration.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NavigationPath without an explicit restoration contract.',
      code: 'HEURISTICS_IOS_NAVIGATION_PATH_WITHOUT_RESTORATION_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.untyped-navigation-link-destination.ast',
    description: 'Detects untyped SwiftUI NavigationLink destination usage.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.untyped-navigation-link-destination.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected untyped NavigationLink destination usage; prefer NavigationLink(value:) with navigationDestination(for:) for type-safe navigation.',
      code: 'HEURISTICS_IOS_SWIFTUI_UNTYPED_NAVIGATION_LINK_DESTINATION_AST',
    },
  },
  {
    id: 'heuristics.ios.foreground-color.ast',
    description: 'Detects foregroundColor usage in modern SwiftUI code paths.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.foreground-color.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected foregroundColor usage.',
      code: 'HEURISTICS_IOS_FOREGROUND_COLOR_AST',
    },
  },
  {
    id: 'heuristics.ios.corner-radius.ast',
    description: 'Detects cornerRadius usage in modern SwiftUI code paths.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.corner-radius.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected cornerRadius usage.',
      code: 'HEURISTICS_IOS_CORNER_RADIUS_AST',
    },
  },
  {
    id: 'heuristics.ios.tab-item.ast',
    description: 'Detects tabItem usage where the modern Tab API may be preferred.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.tab-item.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected tabItem usage.',
      code: 'HEURISTICS_IOS_TAB_ITEM_AST',
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
    id: 'heuristics.ios.accessibility.on-tap-without-button-trait.ast',
    description: 'Detects tappable SwiftUI elements without button accessibility traits.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.accessibility.on-tap-without-button-trait.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected onTapGesture without button accessibility trait.',
      code: 'HEURISTICS_IOS_ACCESSIBILITY_ON_TAP_WITHOUT_BUTTON_TRAIT_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.glass-interactive-static-element.ast',
    description: 'Detects Liquid Glass interactive styling on static SwiftUI elements.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.glass-interactive-static-element.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Liquid Glass .interactive() on a static SwiftUI element.',
      code: 'HEURISTICS_IOS_SWIFTUI_GLASS_INTERACTIVE_STATIC_ELEMENT_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftui.glasseffectid-without-namespace.ast',
    description: 'Detects SwiftUI glassEffectID usage without @Namespace or Namespace.ID ownership.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftui.glasseffectid-without-namespace.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected glassEffectID without @Namespace or Namespace.ID.',
      code: 'HEURISTICS_IOS_SWIFTUI_GLASSEFFECTID_WITHOUT_NAMESPACE_AST',
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
    id: 'heuristics.ios.scrollview-shows-indicators.ast',
    description: 'Detects ScrollView initializer usage with showsIndicators: false in modern SwiftUI code paths.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.scrollview-shows-indicators.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected ScrollView(showsIndicators: false) usage.',
      code: 'HEURISTICS_IOS_SCROLLVIEW_SHOWS_INDICATORS_AST',
    },
  },
  {
    id: 'heuristics.ios.sheet-is-presented.ast',
    description: 'Detects .sheet(isPresented:) usage where .sheet(item:) may be preferred in SwiftUI flows.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.sheet-is-presented.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected .sheet(isPresented:) usage where .sheet(item:) may be preferred.',
      code: 'HEURISTICS_IOS_SHEET_IS_PRESENTED_AST',
    },
  },
  {
    id: 'heuristics.ios.legacy-onchange.ast',
    description: 'Detects legacy single-parameter onChange usage in modern SwiftUI code paths.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.legacy-onchange.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected legacy onChange usage where modern overloads may be preferred.',
      code: 'HEURISTICS_IOS_LEGACY_ONCHANGE_AST',
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
  {
    id: 'heuristics.ios.testing.xctest-import.ast',
    description: 'Detects legacy XCTest import usage in iOS unit and integration tests.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.xctest-import.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected XCTest-only test usage where Swift Testing may be preferred.',
      code: 'HEURISTICS_IOS_TESTING_XCTEST_IMPORT_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.xctest-suite-modernizable.ast',
    description:
      'Detects XCTestCase/test... suites that may be modernizable to Swift Testing in iOS unit and integration tests.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.xctest-suite-modernizable.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected XCTestCase/test... suite that may be modernizable to Swift Testing with import Testing and @Test.',
      code: 'HEURISTICS_IOS_TESTING_XCTEST_SUITE_MODERNIZABLE_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.xctassert.ast',
    description: 'Detects XCTest assertion macros in modern iOS tests.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.xctassert.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected XCTest assertion usage where #expect may be preferred.',
      code: 'HEURISTICS_IOS_TESTING_XCTASSERT_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.xctunwrap.ast',
    description: 'Detects XCTUnwrap usage in modern iOS tests.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.xctunwrap.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected XCTUnwrap usage where #require may be preferred.',
      code: 'HEURISTICS_IOS_TESTING_XCTUNWRAP_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.wait-for-expectations.ast',
    description: 'Detects wait(for:), waitForExpectations(timeout:) and waitForExistence(timeout:) usage in async iOS tests.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.wait-for-expectations.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected wait(for:)/waitForExpectations/waitForExistence usage where an explicit async wait contract may be preferred.',
      code: 'HEURISTICS_IOS_TESTING_WAIT_FOR_EXPECTATIONS_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.legacy-expectation-description.ast',
    description: 'Detects expectation(description:) scaffolding without modern fulfillment or confirmation flow in iOS tests.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.legacy-expectation-description.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected expectation(description:) usage without modern fulfillment/confirmation flow.',
      code: 'HEURISTICS_IOS_TESTING_LEGACY_EXPECTATION_DESCRIPTION_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.mixed-frameworks.ast',
    description:
      'Detects XCTestCase suites mixed with Swift Testing markers in the same iOS test file.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.mixed-frameworks.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected XCTestCase and Swift Testing markers mixed in the same test file without explicit compatibility reason.',
      code: 'HEURISTICS_IOS_TESTING_MIXED_FRAMEWORKS_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.quick-nimble.ast',
    description: 'Detects Quick/Nimble usage in iOS Swift tests.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.quick-nimble.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Quick/Nimble usage where native Swift Testing remains the preferred baseline.',
      code: 'HEURISTICS_IOS_TESTING_QUICK_NIMBLE_AST',
    },
  },
  {
    id: 'heuristics.ios.testing.third-party-ui-test-framework.ast',
    description: 'Detects third-party iOS UI test frameworks where native XCUITest is required.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.testing.third-party-ui-test-framework.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected third-party iOS UI test framework usage; use native XCUITest.',
      code: 'HEURISTICS_IOS_TESTING_THIRD_PARTY_UI_TEST_FRAMEWORK_AST',
    },
  },
  {
    id: 'heuristics.ios.core-data.nsmanagedobject-boundary.ast',
    description: 'Detects NSManagedObject usage in shared iOS boundaries.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.core-data.nsmanagedobject-boundary.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NSManagedObject in a shared boundary.',
      code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_BOUNDARY_AST',
    },
  },
  {
    id: 'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast',
    description: 'Detects async iOS APIs that expose NSManagedObject directly.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NSManagedObject in an async boundary.',
      code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_ASYNC_BOUNDARY_AST',
    },
  },
  {
    id: 'heuristics.ios.core-data.layer-leak.ast',
    description: 'Detects Core Data APIs leaking into iOS application or presentation layers.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.core-data.layer-leak.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Core Data APIs leaking into application/presentation code.',
      code: 'HEURISTICS_IOS_CORE_DATA_LAYER_LEAK_AST',
    },
  },
  {
    id: 'heuristics.ios.swiftdata.layer-leak.ast',
    description: 'Detects SwiftData APIs leaking into iOS application or presentation layers.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.swiftdata.layer-leak.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected SwiftData APIs leaking into application/presentation code.',
      code: 'HEURISTICS_IOS_SWIFTDATA_LAYER_LEAK_AST',
    },
  },
  {
    id: 'heuristics.ios.core-data.nsmanagedobject-state-leak.ast',
    description: 'Detects NSManagedObject leaking into SwiftUI state or ViewModel state.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.core-data.nsmanagedobject-state-leak.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NSManagedObject leaking into SwiftUI state or a ViewModel.',
      code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_STATE_LEAK_AST',
    },
  },
];
