import type { RuleSet } from '../../RuleSet';

export const androidRules: RuleSet = [
  {
    id: 'heuristics.android.thread-sleep.ast',
    description: 'Detects Thread.sleep usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.thread-sleep.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Thread.sleep usage in production Kotlin code.',
      code: 'HEURISTICS_ANDROID_THREAD_SLEEP_AST',
    },
  },
  {
    id: 'heuristics.android.globalscope.ast',
    description: 'Detects GlobalScope usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.globalscope.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected GlobalScope coroutine usage in production Kotlin code.',
      code: 'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST',
    },
  },
  {
    id: 'heuristics.android.run-blocking.ast',
    description: 'Detects runBlocking usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.run-blocking.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected runBlocking usage in production Kotlin code.',
      code: 'HEURISTICS_ANDROID_RUN_BLOCKING_AST',
    },
  },
  {
    id: 'heuristics.android.flow.livedata-state-exposure.ast',
    description:
      'Detects LiveData state exposure in Android presentation code where StateFlow or SharedFlow should be preferred.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.flow.livedata-state-exposure.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected LiveData state exposure in Android presentation code.',
      code: 'HEURISTICS_ANDROID_FLOW_LIVEDATA_STATE_EXPOSURE_AST',
    },
  },
  {
    id: 'heuristics.android.flow.viewmodel-flow-without-statein.ast',
    description:
      'Detects Android ViewModel state exposed as cold Flow without stateIn conversion to StateFlow.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.flow.viewmodel-flow-without-statein.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected ViewModel exposing cold Flow state without stateIn.',
      code: 'HEURISTICS_ANDROID_FLOW_VIEWMODEL_FLOW_WITHOUT_STATEIN_AST',
    },
  },
  {
    id: 'heuristics.android.flow.sharedflow-used-as-state.ast',
    description:
      'Detects SharedFlow or MutableSharedFlow used as ViewModel state instead of events.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.flow.sharedflow-used-as-state.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected SharedFlow used as ViewModel state.',
      code: 'HEURISTICS_ANDROID_FLOW_SHAREDFLOW_USED_AS_STATE_AST',
    },
  },
  {
    id: 'heuristics.android.security.legacy-fingerprint-api.ast',
    description:
      'Detects legacy FingerprintManager API usage where androidx.biometric.BiometricPrompt is the supported baseline.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.security.legacy-fingerprint-api.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected legacy FingerprintManager API usage; use androidx.biometric.BiometricPrompt.',
      code: 'HEURISTICS_ANDROID_SECURITY_LEGACY_FINGERPRINT_API_AST',
    },
  },
  {
    id: 'heuristics.android.architecture.custom-singleton-object.ast',
    description:
      'Detects custom Kotlin object singletons in Android production code where Hilt/Dagger dependency injection is expected.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.architecture.custom-singleton-object.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected a custom Kotlin object singleton in Android production code; use Hilt/Dagger dependency injection.',
      code: 'HEURISTICS_ANDROID_ARCHITECTURE_CUSTOM_SINGLETON_OBJECT_AST',
    },
  },
  {
    id: 'heuristics.android.di.hilt-injection-without-entrypoint.ast',
    description:
      'Detects Activity or Fragment Hilt field injection without @AndroidEntryPoint.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.di.hilt-injection-without-entrypoint.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Hilt field injection in Activity/Fragment without @AndroidEntryPoint.',
      code: 'HEURISTICS_ANDROID_DI_HILT_INJECTION_WITHOUT_ENTRYPOINT_AST',
    },
  },
  {
    id: 'heuristics.android.concurrency.asynctask.ast',
    description:
      'Detects deprecated AsyncTask usage in Android production code where coroutines should be used.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.concurrency.asynctask.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected deprecated AsyncTask usage in Android production code.',
      code: 'HEURISTICS_ANDROID_CONCURRENCY_ASYNCTASK_AST',
    },
  },
  {
    id: 'heuristics.android.architecture.god-activity.ast',
    description:
      'Detects Android Activity classes that mix UI entrypoint with product responsibilities instead of staying as thin single-activity shells.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.architecture.god-activity.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected an Android Activity mixing UI entrypoint with product responsibilities.',
      code: 'HEURISTICS_ANDROID_ARCHITECTURE_GOD_ACTIVITY_AST',
    },
  },
  {
    id: 'heuristics.android.startup.application-oncreate-heavy-init.ast',
    description:
      'Detects heavy library initialization inside Android Application.onCreate where AndroidX Startup Initializer or lazy feature initialization should be used.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.startup.application-oncreate-heavy-init.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected heavy initialization inside Application.onCreate.',
      code: 'HEURISTICS_ANDROID_STARTUP_APPLICATION_ONCREATE_HEAVY_INIT_AST',
    },
  },
  {
    id: 'heuristics.android.compose.non-lazy-scrollable-collection.ast',
    description:
      'Detects scrollable Column/Row collection rendering where LazyColumn or LazyRow should be used for virtualization.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.non-lazy-scrollable-collection.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected non-lazy scrollable collection rendering in Compose.',
      code: 'HEURISTICS_ANDROID_COMPOSE_NON_LAZY_SCROLLABLE_COLLECTION_AST',
    },
  },
  {
    id: 'heuristics.android.compose.unstable-launched-effect-key.ast',
    description:
      'Detects LaunchedEffect calls without meaningful state keys, such as Unit, true, false, null or no key.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.unstable-launched-effect-key.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected LaunchedEffect without a stable restart key.',
      code: 'HEURISTICS_ANDROID_COMPOSE_UNSTABLE_LAUNCHED_EFFECT_KEY_AST',
    },
  },
  {
    id: 'heuristics.android.compose.launched-effect-busy-loop.ast',
    description:
      'Detects non-cooperative busy loops inside LaunchedEffect blocks.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.launched-effect-busy-loop.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected non-cooperative loop inside LaunchedEffect.',
      code: 'HEURISTICS_ANDROID_COMPOSE_LAUNCHED_EFFECT_BUSY_LOOP_AST',
    },
  },
  {
    id: 'heuristics.android.observability.production-logging.ast',
    description:
      'Detects unguarded Android production logging through println, System.out/err, Log.* or Timber.*.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.observability.production-logging.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected unguarded Android production logging.',
      code: 'HEURISTICS_ANDROID_OBSERVABILITY_PRODUCTION_LOGGING_AST',
    },
  },
  {
    id: 'heuristics.android.compose.modifier-background-before-padding.ast',
    description:
      'Detects Compose Modifier chains that apply background before padding, changing the painted area unexpectedly.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.modifier-background-before-padding.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Modifier.background before padding.',
      code: 'HEURISTICS_ANDROID_COMPOSE_MODIFIER_BACKGROUND_BEFORE_PADDING_AST',
    },
  },
  {
    id: 'heuristics.android.accessibility.missing-content-description.ast',
    description:
      'Detects Compose Image/Icon calls without an explicit contentDescription.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.accessibility.missing-content-description.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Image/Icon without contentDescription.',
      code: 'HEURISTICS_ANDROID_ACCESSIBILITY_MISSING_CONTENT_DESCRIPTION_AST',
    },
  },
  {
    id: 'heuristics.android.accessibility.fontscale-disabled.ast',
    description:
      'Detects Android Compose code that disables system text scaling by forcing fontScale to 1.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.accessibility.fontscale-disabled.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected disabled Android system font scaling.',
      code: 'HEURISTICS_ANDROID_ACCESSIBILITY_FONTSCALE_DISABLED_AST',
    },
  },
  {
    id: 'heuristics.android.compose.incomplete-material-theme.ast',
    description:
      'Detects MaterialTheme declarations missing colorScheme, typography or shapes.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.incomplete-material-theme.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected incomplete MaterialTheme declaration.',
      code: 'HEURISTICS_ANDROID_COMPOSE_INCOMPLETE_MATERIAL_THEME_AST',
    },
  },
  {
    id: 'heuristics.android.compose.legacy-bottom-navigation.ast',
    description:
      'Detects legacy Material 2 BottomNavigation/BottomNavigationItem usage where Material 3 NavigationBar should be used.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.legacy-bottom-navigation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected legacy BottomNavigation usage.',
      code: 'HEURISTICS_ANDROID_COMPOSE_LEGACY_BOTTOM_NAVIGATION_AST',
    },
  },
  {
    id: 'heuristics.android.navigation.imperative-navigation.ast',
    description:
      'Detects imperative Android navigation through startActivity(Intent) or FragmentManager transactions where Navigation Compose should be used.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.navigation.imperative-navigation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected imperative Android navigation.',
      code: 'HEURISTICS_ANDROID_NAVIGATION_IMPERATIVE_NAVIGATION_AST',
    },
  },
  {
    id: 'heuristics.android.compose.object-creation-without-remember.ast',
    description:
      'Detects expensive object creation inside Composable functions without remember.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.object-creation-without-remember.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected object creation inside a Composable without remember.',
      code: 'HEURISTICS_ANDROID_COMPOSE_OBJECT_CREATION_WITHOUT_REMEMBER_AST',
    },
  },
  {
    id: 'heuristics.android.compose.state-creation-without-remember.ast',
    description:
      'Detects mutableStateOf or derivedStateOf created inside Composable functions without remember.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.compose.state-creation-without-remember.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Compose state creation without remember.',
      code: 'HEURISTICS_ANDROID_COMPOSE_STATE_CREATION_WITHOUT_REMEMBER_AST',
    },
  },
  {
    id: 'heuristics.android.null-safety.force-unwrap.ast',
    description:
      'Detects Kotlin force unwrap (!!) usage in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.null-safety.force-unwrap.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Kotlin force unwrap (!!) usage.',
      code: 'HEURISTICS_ANDROID_NULL_SAFETY_FORCE_UNWRAP_AST',
    },
  },
  {
    id: 'heuristics.android.security.local-properties-tracked.ast',
    description:
      'Detects tracked Android local.properties files that may expose machine-local SDK paths or secrets.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.security.local-properties-tracked.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected tracked Android local.properties file.',
      code: 'HEURISTICS_ANDROID_SECURITY_LOCAL_PROPERTIES_TRACKED_AST',
    },
  },
  {
    id: 'heuristics.android.persistence.shared-preferences-usage.ast',
    description:
      'Detects SharedPreferences usage in Android production Kotlin code where DataStore may be preferred.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.persistence.shared-preferences-usage.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected SharedPreferences usage in Android production Kotlin code.',
      code: 'HEURISTICS_ANDROID_PERSISTENCE_SHARED_PREFERENCES_USAGE_AST',
    },
  },
  {
    id: 'heuristics.android.testing.junit4-usage.ast',
    description:
      'Detects JUnit4 usage in Android Kotlin tests where JUnit5 is preferred.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.testing.junit4-usage.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected JUnit4 usage in Android Kotlin tests.',
      code: 'HEURISTICS_ANDROID_TESTING_JUNIT4_USAGE_AST',
    },
  },
  {
    id: 'heuristics.android.testing.production-mock-usage.ast',
    description:
      'Detects mock or spy usage in Android production Kotlin code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.testing.production-mock-usage.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected mock or spy usage in Android production Kotlin code.',
      code: 'HEURISTICS_ANDROID_TESTING_PRODUCTION_MOCK_USAGE_AST',
    },
  },
  {
    id: 'heuristics.android.ui.hardcoded-string.ast',
    description:
      'Detects hardcoded user-facing Android UI strings in production Kotlin code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.ui.hardcoded-string.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected hardcoded Android UI string in production Kotlin code.',
      code: 'HEURISTICS_ANDROID_UI_HARDCODED_STRING_AST',
    },
  },
  {
    id: 'heuristics.android.coroutines.manual-scope-in-viewmodel.ast',
    description:
      'Detects manual CoroutineScope construction inside Android ViewModel classes where viewModelScope should be preferred.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines.manual-scope-in-viewmodel.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected manual CoroutineScope inside an Android ViewModel.',
      code: 'HEURISTICS_ANDROID_COROUTINES_MANUAL_SCOPE_IN_VIEWMODEL_AST',
    },
  },
  {
    id: 'heuristics.android.coroutines.dispatchers-main-boundary-leak.ast',
    description:
      'Detects Dispatchers.Main usage outside Android presentation code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines.dispatchers-main-boundary-leak.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Dispatchers.Main outside Android presentation code.',
      code: 'HEURISTICS_ANDROID_COROUTINES_DISPATCHERS_MAIN_BOUNDARY_LEAK_AST',
    },
  },
  {
    id: 'heuristics.android.coroutines.hardcoded-background-dispatcher.ast',
    description:
      'Detects hard-coded Dispatchers.IO or Dispatchers.Default usage in Android domain/application code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines.hardcoded-background-dispatcher.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected hard-coded background dispatcher in Android domain/application code.',
      code: 'HEURISTICS_ANDROID_COROUTINES_HARDCODED_BACKGROUND_DISPATCHER_AST',
    },
  },
  {
    id: 'heuristics.android.coroutines.with-context.ast',
    description:
      'Detects withContext usage in Android domain/application code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines.with-context.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected withContext usage in Android domain/application code.',
      code: 'HEURISTICS_ANDROID_COROUTINES_WITH_CONTEXT_AST',
    },
  },
  {
    id: 'heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast',
    description:
      'Detects lifecycleScope usage in Android domain/application code where lifecycle ownership belongs to UI lifecycle owners.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected lifecycleScope usage in Android domain/application code.',
      code: 'HEURISTICS_ANDROID_COROUTINES_LIFECYCLE_SCOPE_BOUNDARY_LEAK_AST',
    },
  },
  {
    id: 'heuristics.android.coroutines.supervisor-scope.ast',
    description:
      'Detects supervisorScope usage in Android domain/application code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines.supervisor-scope.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected supervisorScope usage in Android domain/application code.',
      code: 'HEURISTICS_ANDROID_COROUTINES_SUPERVISOR_SCOPE_AST',
    },
  },
  {
    id: 'heuristics.android.coroutines.try-catch.ast',
    description:
      'Detects try-catch error handling in Android coroutine code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines.try-catch.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected try-catch handling in Android coroutine code.',
      code: 'HEURISTICS_ANDROID_COROUTINES_TRY_CATCH_AST',
    },
  },
  {
    id: 'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    description:
      'Detects Android presentation types mixing session, networking, persistence and navigation responsibilities.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android presentation code mixing multiple responsibilities.',
      code: 'HEURISTICS_ANDROID_SOLID_SRP_PRESENTATION_MIXED_RESPONSIBILITIES_AST',
    },
  },
  {
    id: 'heuristics.android.solid.ocp.discriminator-branching.ast',
    description:
      'Detects Android application or presentation code branching on discriminators instead of extending behavior.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.ocp.discriminator-branching.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android discriminator branching that weakens OCP.',
      code: 'HEURISTICS_ANDROID_SOLID_OCP_DISCRIMINATOR_BRANCHING_AST',
    },
  },
  {
    id: 'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    description:
      'Detects Android application or presentation code depending on concrete framework infrastructure.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.dip.concrete-framework-dependency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android concrete framework dependency in a high-level layer.',
      code: 'HEURISTICS_ANDROID_SOLID_DIP_CONCRETE_FRAMEWORK_DEPENDENCY_AST',
    },
  },
  {
    id: 'heuristics.android.solid.isp.fat-interface-dependency.ast',
    description:
      'Detects Android application or presentation code depending on interfaces broader than the members used.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.isp.fat-interface-dependency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android dependency on a fat interface.',
      code: 'HEURISTICS_ANDROID_SOLID_ISP_FAT_INTERFACE_DEPENDENCY_AST',
    },
  },
  {
    id: 'heuristics.android.solid.lsp.narrowed-precondition.ast',
    description:
      'Detects Android application or presentation subtypes that narrow preconditions and break substitution.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.lsp.narrowed-precondition.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android subtype narrowing a contract precondition.',
      code: 'HEURISTICS_ANDROID_SOLID_LSP_NARROWED_PRECONDITION_AST',
    },
  },
];
