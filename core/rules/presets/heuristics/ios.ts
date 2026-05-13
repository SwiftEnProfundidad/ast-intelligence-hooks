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
    description: 'Detects wait(for:) and waitForExpectations(timeout:) usage in async iOS tests.',
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
      message: 'AST heuristic detected wait(for:)/waitForExpectations usage where await fulfillment(of:) may be preferred.',
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
