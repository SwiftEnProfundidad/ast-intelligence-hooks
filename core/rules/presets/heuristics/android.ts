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
    id: 'heuristics.android.coroutines-async-await-no-callbacks.ast',
    description: 'Detects callback-based async usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.coroutines-async-await-no-callbacks.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected callback-based asynchronous work in Android production code where coroutines or Flow should be used.',
      code: 'HEURISTICS_ANDROID_COROUTINES_ASYNC_AWAIT_NO_CALLBACKS_AST',
    },
  },
  {
    id: 'heuristics.android.async-await-paralelismo.ast',
    description: 'Detects async/await parallelism in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.async-await-paralelismo.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected async/await parallelism in Android production code where independent tasks should be composed explicitly.',
      code: 'HEURISTICS_ANDROID_ASYNC_AWAIT_PARALELISMO_AST',
    },
  },
  {
    id: 'heuristics.android.supervisorscope-errores-no-cancelan-otros-jobs.ast',
    description: 'Detects supervisorScope usage in Android coroutine production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.supervisorscope-errores-no-cancelan-otros-jobs.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected supervisorScope usage in Android coroutine code where sibling jobs should remain isolated.',
      code: 'HEURISTICS_ANDROID_SUPERVISORSCOPE_ERRORES_NO_CANCELAN_OTROS_JOBS_AST',
    },
  },
  {
    id: 'heuristics.android.suspend-functions-en-api-service.ast',
    description: 'Detects suspend functions in Android API service production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.suspend-functions-en-api-service.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected suspend functions in Android API service production code where linear coroutine-based contracts should be used.',
      code: 'HEURISTICS_ANDROID_SUSPEND_FUNCTIONS_EN_API_SERVICE_AST',
    },
  },
  {
    id: 'heuristics.android.suspend-functions-para-operaciones-async.ast',
    description: 'Detects suspend functions in Android production Kotlin files for async operations.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.suspend-functions-para-operaciones-async.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected suspend functions in Android production code where async operations should remain explicit.',
      code: 'HEURISTICS_ANDROID_SUSPEND_FUNCTIONS_PARA_OPERACIONES_ASYNC_AST',
    },
  },
  {
    id: 'heuristics.android.dao-data-access-objects-con-suspend-functions.ast',
    description: 'Detects suspend functions in Android DAO production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.dao-data-access-objects-con-suspend-functions.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected suspend functions in Android DAO production code where Room access contracts should stay explicit.',
      code: 'HEURISTICS_ANDROID_DAO_DATA_ACCESS_OBJECTS_CON_SUSPEND_FUNCTIONS_AST',
    },
  },
  {
    id: 'heuristics.android.transaction-para-operaciones-multi-query.ast',
    description: 'Detects @Transaction usage in Android DAO production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.transaction-para-operaciones-multi-query.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected @Transaction usage in Android DAO production code where multi-query work should remain atomic.',
      code: 'HEURISTICS_ANDROID_TRANSACTION_PARA_OPERACIONES_MULTI_QUERY_AST',
    },
  },
  {
    id: 'heuristics.android.stateflow-estado-mutable-observable.ast',
    description: 'Detects StateFlow usage in Android ViewModel production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.stateflow-estado-mutable-observable.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected StateFlow usage in Android ViewModel production code where observable state should remain explicit.',
      code: 'HEURISTICS_ANDROID_STATEFLOW_ESTADO_MUTABLE_OBSERVABLE_AST',
    },
  },
  {
    id: 'heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast',
    description: 'Detects SharedFlow usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected SharedFlow usage in Android production code where events should remain explicit.',
      code: 'HEURISTICS_ANDROID_SHAREDFLOW_HOT_STREAM_PUEDE_NO_TENER_VALOR_PARA_EVENTOS_AST',
    },
  },
  {
    id: 'heuristics.android.flow-builders-flow-emit-flowof-asflow.ast',
    description: 'Detects Flow builder usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.flow-builders-flow-emit-flowof-asflow.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected Flow builder usage in Android production code where streams should remain explicit.',
      code: 'HEURISTICS_ANDROID_FLOW_BUILDERS_FLOW_EMIT_FLOWOF_ASFLOW_AST',
    },
  },
  {
    id: 'heuristics.android.collect-terminal-operator-para-consumir-flow.ast',
    description: 'Detects Flow terminal collection usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.collect-terminal-operator-para-consumir-flow.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected Flow terminal operator usage in Android production code where streams should be consumed explicitly.',
      code: 'HEURISTICS_ANDROID_COLLECT_TERMINAL_OPERATOR_PARA_CONSUMIR_FLOW_AST',
    },
  },
  {
    id: 'heuristics.android.collect-as-state-consumir-flow-en-compose.ast',
    description: 'Detects collectAsState usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.collect-as-state-consumir-flow-en-compose.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected collectAsState usage in Android Compose production code where Flow should be observed as UI state.',
      code: 'HEURISTICS_ANDROID_COLLECT_AS_STATE_CONSUMIR_FLOW_EN_COMPOSE_AST',
    },
  },
  {
    id: 'heuristics.android.remember-evitar-recrear-objetos.ast',
    description: 'Detects remember usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.remember-evitar-recrear-objetos.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected remember usage in Android Compose production code where objects or values should not be recreated on every recomposition.',
      code: 'HEURISTICS_ANDROID_REMEMBER_EVITAR_RECREAR_OBJETOS_AST',
    },
  },
  {
    id: 'heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast',
    description: 'Detects remember usage for stable state across recompositions in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected remember usage in Android Compose production code where state should remain stable across recompositions.',
      code: 'HEURISTICS_ANDROID_REMEMBER_PARA_MANTENER_ESTADO_ENTRE_RECOMPOSICIONES_AST',
    },
  },
  {
    id: 'heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast',
    description: 'Detects derivedStateOf usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected derivedStateOf usage in Android Compose production code where expensive derived values should only recompute when input changes.',
      code: 'HEURISTICS_ANDROID_DERIVEDSTATEOF_CALCULOS_CAROS_SOLO_CUANDO_CAMBIA_INPUT_AST',
    },
  },
  {
    id: 'heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast',
    description: 'Detects derivedStateOf usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected derivedStateOf usage in Android Compose production code where state-derived values should stay explicit and local to Compose.',
      code: 'HEURISTICS_ANDROID_DERIVEDSTATEOF_CALCULOS_DERIVADOS_DE_STATE_AST',
    },
  },
  {
    id: 'heuristics.android.launchedeffect-side-effects-con-lifecycle.ast',
    description: 'Detects LaunchedEffect usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.launchedeffect-side-effects-con-lifecycle.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected LaunchedEffect usage in Android Compose production code where lifecycle-bound side effects should remain explicit.',
      code: 'HEURISTICS_ANDROID_LAUNCHEDEFFECT_SIDE_EFFECTS_CON_LIFECYCLE_AST',
    },
  },
  {
    id: 'heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast',
    description: 'Detects LaunchedEffect keys usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected LaunchedEffect keys usage in Android Compose production code where relaunch keys should remain explicit and stable.',
      code: 'HEURISTICS_ANDROID_LAUNCHEDEFFECT_KEYS_CONTROLAR_CUANDO_SE_RELANZA_EFFECT_AST',
    },
  },
  {
    id: 'heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast',
    description: 'Detects DisposableEffect usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected DisposableEffect usage in Android Compose production code where cleanup should happen when the composable leaves composition.',
      code: 'HEURISTICS_ANDROID_DISPOSABLE_EFFECT_CLEANUP_CUANDO_COMPOSABLE_SALE_DE_COMPOSICIO_N_AST',
    },
  },
  {
    id: 'heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast',
    description: 'Detects @Preview usage in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected @Preview usage in Android Compose production code where UI should be inspectable without running the app.',
      code: 'HEURISTICS_ANDROID_PREVIEW_PREVIEW_PARA_VER_UI_SIN_CORRER_APP_AST',
    },
  },
  {
    id: 'heuristics.android.recomposition-composables-deben-ser-idempotentes.ast',
    description: 'Detects non-idempotent recomposition behavior in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.recomposition-composables-deben-ser-idempotentes.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected non-idempotent recomposition behavior in Android Compose production code where composables should stay pure during recomposition.',
      code: 'HEURISTICS_ANDROID_RECOMPOSITION_COMPOSABLES_DEBEN_SER_IDEMPOTENTES_AST',
    },
  },
  {
    id: 'heuristics.android.uistate-sealed-class-loading-success-error-states.ast',
    description: 'Detects UiState sealed class usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.uistate-sealed-class-loading-success-error-states.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected UiState sealed class usage in Android production code where loading, success, and error states should stay explicit.',
      code: 'HEURISTICS_ANDROID_UISTATE_SEALED_CLASS_LOADING_SUCCESS_ERROR_STATES_AST',
    },
  },
  {
    id: 'heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast',
    description: 'Detects UseCase usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android UseCase usage in production code where business logic should stay encapsulated.',
      code: 'HEURISTICS_ANDROID_USE_CASES_LOGICA_DE_NEGOCIO_ENCAPSULADA_AST',
    },
  },
  {
    id: 'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
    description: 'Detects Android repository abstractions that keep data access behind a stable boundary.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected repository abstraction in Android production code where data access should remain behind a stable boundary.',
      code: 'HEURISTICS_ANDROID_REPOSITORY_PATTERN_ABSTRAER_ACCESO_A_DATOS_AST',
    },
  },
  {
    id: 'heuristics.android.app-startup-androidx-startup-para-lazy-init.ast',
    description: 'Detects androidx.startup Initializer usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.app-startup-androidx-startup-para-lazy-init.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected androidx.startup Initializer usage in Android production code where app initialization should remain lazy and explicit.',
      code: 'HEURISTICS_ANDROID_APP_STARTUP_ANDROIDX_STARTUP_PARA_LAZY_INIT_AST',
    },
  },
  {
    id: 'heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast',
    description: 'Detects BaselineProfileRule usage in Android benchmark or instrumented test files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected BaselineProfileRule usage in Android benchmark or instrumented test code where startup optimization should remain explicit.',
      code: 'HEURISTICS_ANDROID_BASELINE_PROFILES_OPTIMIZACION_DE_STARTUP_AST',
    },
  },
  {
    id: 'heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast',
    description: 'Detects ViewModel source-of-truth state exposure in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected ViewModel source-of-truth state exposure in Android production code where a single state owner should remain explicit.',
      code: 'HEURISTICS_ANDROID_SINGLE_SOURCE_OF_TRUTH_VIEWMODEL_ES_LA_FUENTE_AST',
    },
  },
  {
    id: 'heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast',
    description: 'Detects stable or immutable Compose parameters that can skip recomposition.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected stable or immutable Compose parameters in Android production code where recomposition should be skippable.',
      code: 'HEURISTICS_ANDROID_SKIP_RECOMPOSITION_PARA_METROS_INMUTABLES_O_ESTABLES_AST',
    },
  },
  {
    id: 'heuristics.android.stability-composables-estables-recomponen-menos.ast',
    description: 'Detects stable or immutable Compose models that keep recomposition predictable.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.stability-composables-estables-recomponen-menos.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected stable or immutable Compose model usage in Android production code where recomposition should remain predictable.',
      code: 'HEURISTICS_ANDROID_STABILITY_COMPOSABLES_ESTABLES_RECOMPONEN_MENOS_AST',
    },
  },
  {
    id: 'heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast',
    description: 'Detects positional string formatting placeholders in Android string resources.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected positional string formatting placeholders in Android strings.xml resources where argument order should remain explicit and translation-safe.',
      code: 'HEURISTICS_ANDROID_STRING_FORMATTING_1_S_2_D_PARA_ARGUMENTOS_AST',
    },
  },
  {
    id: 'heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast',
    description: 'Detects @Binds usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected @Binds usage in Android production code where interface bindings should remain explicit and efficient.',
      code: 'HEURISTICS_ANDROID_BINDS_PARA_IMPLEMENTACIONES_DE_INTERFACES_MA_S_EFICIENTE_AST',
    },
  },
  {
    id: 'heuristics.android.provides-para-interfaces-o-third-party.ast',
    description: 'Detects @Provides usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.provides-para-interfaces-o-third-party.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected @Provides usage in Android production code where interface or third-party bindings should remain explicit.',
      code: 'HEURISTICS_ANDROID_PROVIDES_PARA_INTERFACES_O_THIRD_PARTY_AST',
    },
  },
  {
    id: 'heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast',
    description: 'Detects WorkManager dependency usage in Android build files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected WorkManager dependency usage in Android build files where background tasks should remain explicit.',
      code: 'HEURISTICS_ANDROID_WORKMANAGER_ANDROIDX_WORK_WORK_RUNTIME_KTX_AST',
    },
  },
  {
    id: 'heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast',
    description: 'Detects Android libs.versions.toml usage for dependency catalogs.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android libs.versions.toml usage in dependency management files where version catalogs should remain explicit.',
      code: 'HEURISTICS_ANDROID_VERSION_CATALOGS_LIBS_VERSIONS_TOML_PARA_DEPENDENCIAS_AST',
    },
  },
  {
    id: 'heuristics.android.workmanager-background-tasks.ast',
    description: 'Detects WorkManager worker usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.workmanager-background-tasks.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected WorkManager worker usage in Android production code where background tasks should remain explicit.',
      code: 'HEURISTICS_ANDROID_WORKMANAGER_BACKGROUND_TASKS_AST',
    },
  },
  {
    id: 'heuristics.android.androidtest-instrumented-tests-device-emulator.ast',
    description: 'Detects Android instrumented test usage in androidTest files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.androidtest-instrumented-tests-device-emulator.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected Android instrumented tests in androidTest/ where device or emulator coverage should remain explicit.',
      code: 'HEURISTICS_ANDROID_ANDROIDTEST_INSTRUMENTED_TESTS_DEVICE_EMULATOR_AST',
    },
  },
  {
    id: 'heuristics.android.aaa-pattern-arrange-act-assert.ast',
    description: 'Detects AAA test structure in Android test Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.aaa-pattern-arrange-act-assert.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected AAA test structure in Android tests where Arrange, Act, and Assert should remain explicit.',
      code: 'HEURISTICS_ANDROID_AAA_PATTERN_ARRANGE_ACT_ASSERT_AST',
    },
  },
  {
    id: 'heuristics.android.given-when-then-bdd-style.ast',
    description: 'Detects Given-When-Then test structure in Android test Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.given-when-then-bdd-style.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Given-When-Then test structure in Android tests where behavior should remain explicit.',
      code: 'HEURISTICS_ANDROID_GIVEN_WHEN_THEN_BDD_STYLE_AST',
    },
  },
  {
    id: 'heuristics.android.test-unit-tests-jvm.ast',
    description: 'Detects JVM unit test source set usage in Android test/ files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.test-unit-tests-jvm.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected JVM unit tests in Android test/ source set where local unit tests should remain explicit.',
      code: 'HEURISTICS_ANDROID_TEST_UNIT_TESTS_JVM_AST',
    },
  },
  {
    id: 'heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast',
    description: 'Detects state hoisting issues in Android Compose production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected state hoisting issues in Android Compose production code where UI state should be elevated to the appropriate owner.',
      code: 'HEURISTICS_ANDROID_STATE_HOISTING_ELEVAR_ESTADO_AL_NIVEL_APROPIADO_AST',
    },
  },
  {
    id: 'heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast',
    description: 'Detects AndroidX ViewModel usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected AndroidX ViewModel usage in Android production code where state and lifecycle should stay bound to a ViewModel owner.',
      code: 'HEURISTICS_ANDROID_VIEWMODEL_ANDROIDX_LIFECYCLE_VIEWMODEL_AST',
    },
  },
  {
    id: 'heuristics.android.viewmodel-sobrevive-configuration-changes.ast',
    description: 'Detects AndroidX ViewModel usage that should survive configuration changes.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.viewmodel-sobrevive-configuration-changes.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected AndroidX ViewModel usage in Android production code where configuration changes should not destroy observable UI state.',
      code: 'HEURISTICS_ANDROID_VIEWMODEL_SOBREVIVE_CONFIGURATION_CHANGES_AST',
    },
  },
  {
    id: 'heuristics.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente.ast',
    description: 'Detects viewModelScope usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected viewModelScope usage in Android production code where coroutine work should remain tied to the ViewModel lifecycle.',
      code: 'HEURISTICS_ANDROID_VIEWMODELSCOPE_SCOPE_DE_VIEWMODEL_CANCELADO_AUTOMATICAMENTE_AST',
    },
  },
  {
    id: 'heuristics.android.force-unwrap.ast',
    description: 'Detects Kotlin force unwrap (!!) usage in Android production files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.force-unwrap.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Kotlin force unwrap (!!) usage in production code.',
      code: 'HEURISTICS_ANDROID_FORCE_UNWRAP_AST',
    },
  },
  {
    id: 'heuristics.android.java-source.ast',
    description: 'Detects Java source in Android production code where Kotlin is required.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.java-source.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Java source in Android production code where Kotlin is required for new code.',
      code: 'HEURISTICS_ANDROID_JAVA_SOURCE_AST',
    },
  },
  {
    id: 'heuristics.android.asynctask-deprecated.ast',
    description: 'Detects AsyncTask usage in Android production code where Coroutines are required.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.asynctask-deprecated.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected AsyncTask usage in Android production code where Coroutines are required.',
      code: 'HEURISTICS_ANDROID_ASYNCTASK_DEPRECATED_AST',
    },
  },
  {
    id: 'heuristics.android.findviewbyid.ast',
    description: 'Detects findViewById usage in Android production code where View Binding or Compose is required.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.findviewbyid.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected findViewById usage in Android production code where View Binding or Compose is required.',
      code: 'HEURISTICS_ANDROID_FINDVIEWBYID_AST',
    },
  },
  {
    id: 'heuristics.android.rxjava-new-code.ast',
    description: 'Detects RxJava usage in Android production code where Flow is required for new code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.rxjava-new-code.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected RxJava usage in Android production code where Flow is required for new code.',
      code: 'HEURISTICS_ANDROID_RXJAVA_NEW_CODE_AST',
    },
  },
  {
    id: 'heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast',
    description:
      'Detects explicit Dispatchers.Main/IO/Default usage in Android production code where dispatcher selection must remain intentional.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected explicit Dispatchers.Main/IO/Default usage in Android production code where dispatcher selection must remain intentional.',
      code: 'HEURISTICS_ANDROID_DISPATCHERS_MAIN_UI_IO_NETWORK_DISK_DEFAULT_CPU_AST',
    },
  },
  {
    id: 'heuristics.android.withcontext-change-dispatcher.ast',
    description: 'Detects withContext usage in Android production code where dispatcher switching is intentional.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.withcontext-change-dispatcher.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected withContext usage in Android production code where dispatcher switching is intentional.',
      code: 'HEURISTICS_ANDROID_WITHCONTEXT_CHANGE_DISPATCHER_AST',
    },
  },
  {
    id: 'heuristics.android.no-console-log.ast',
    description: 'Detects Android logging usage in production code without a debug-only guard.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.no-console-log.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Android logging usage in production code without a debug-only guard.',
      code: 'HEURISTICS_ANDROID_NO_CONSOLE_LOG_AST',
    },
  },
  {
    id: 'heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast',
    description: 'Detects BuildConfig compile-time constant usage in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected BuildConfig compile-time constant usage in Android production code.',
      code: 'HEURISTICS_ANDROID_BUILDCONFIG_CONSTANTES_EN_TIEMPO_DE_COMPILACION_AST',
    },
  },
  {
    id: 'heuristics.android.hardcoded-strings.ast',
    description: 'Detects hardcoded string literal usage in Android production code where strings.xml should be used.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.hardcoded-strings.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected hardcoded string literal usage in Android production code where strings.xml should be used.',
      code: 'HEURISTICS_ANDROID_HARDCODED_STRINGS_AST',
    },
  },
  {
    id: 'heuristics.android.localization-strings-xml-por-idioma-values-es-values-en.ast',
    description: 'Detects localized strings.xml resources in Android production code where language-specific texts should remain in values-*/strings.xml.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.localization-strings-xml-por-idioma-values-es-values-en.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
      'AST heuristic detected localized strings.xml resources in Android production code where language-specific text should remain in values-*/strings.xml.',
      code: 'HEURISTICS_ANDROID_LOCALIZATION_STRINGS_XML_POR_IDIOMA_VALUES_ES_VALUES_EN_AST',
    },
  },
  {
    id: 'heuristics.android.plurals-values-plurals-xml.ast',
    description: 'Detects plurals.xml resources in Android production code where quantity strings should remain in values-*/plurals.xml.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.plurals-values-plurals-xml.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected plurals.xml resources in Android production code where quantity strings should remain in values-*/plurals.xml.',
      code: 'HEURISTICS_ANDROID_PLURALS_VALUES_PLURALS_XML_AST',
    },
  },
  {
    id: 'heuristics.android.no-singleton.ast',
    description: 'Detects Kotlin singleton object or companion singleton holder usage in Android production code where Hilt or Dagger DI should be used.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.no-singleton.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Kotlin singleton object or companion singleton holder usage in Android production code where Hilt or Dagger DI should be used.',
      code: 'HEURISTICS_ANDROID_NO_SINGLETON_AST',
    },
  },
  {
    id: 'heuristics.android.composable-functions-composable-para-ui.ast',
    description: 'Detects @Composable UI functions in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.composable-functions-composable-para-ui.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected @Composable UI functions in Android production code.',
      code: 'HEURISTICS_ANDROID_COMPOSABLE_FUNCTIONS_COMPOSABLE_PARA_UI_AST',
    },
  },
  {
    id: 'heuristics.android.arguments-pasar-datos-entre-pantallas.ast',
    description: 'Detects explicit navigation arguments passed between Android screens.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.arguments-pasar-datos-entre-pantallas.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected explicit arguments passed between Android navigation screens.',
      code: 'HEURISTICS_ANDROID_ARGUMENTS_PASAR_DATOS_ENTRE_PANTALLAS_AST',
    },
  },
  {
    id: 'heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast',
    description: 'Detects adaptive WindowSizeClass layout usage in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected WindowSizeClass adaptive layout usage in Android production code.',
      code: 'HEURISTICS_ANDROID_ADAPTIVE_LAYOUTS_RESPONSIVE_DESIGN_WINDOW_SIZE_CLASS_AST',
    },
  },
  {
    id: 'heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast',
    description: 'Detects existing Android modules, interfaces and Gradle dependencies usage.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected existing Android structure usage in Kotlin or Gradle files where modules, interfaces and dependencies should be reviewed before introducing changes.',
      code: 'HEURISTICS_ANDROID_ANALIZAR_ESTRUCTURA_EXISTENTE_MO_DULOS_INTERFACES_DEPENDENCIAS_GRADLE_AST',
    },
  },
  {
    id: 'heuristics.android.theme-color-scheme-typography-shapes.ast',
    description: 'Detects MaterialTheme color, typography and shapes usage in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.theme-color-scheme-typography-shapes.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected MaterialTheme usage in Android Compose production code where theme configuration should remain explicit.',
      code: 'HEURISTICS_ANDROID_THEME_COLOR_SCHEME_TYPOGRAPHY_SHAPES_AST',
    },
  },
  {
    id: 'heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast',
    description: 'Detects dark theme support in Android production Compose code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected explicit dark theme support in Android Compose production code where the UI should respect the system color scheme from day one.',
      code: 'HEURISTICS_ANDROID_DARK_THEME_SOPORTAR_DESDE_DI_A_1_ISSYSTEMINDARKTHEME_AST',
    },
  },
  {
    id: 'heuristics.android.timber-logging-library.ast',
    description: 'Detects Timber logging usage in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.timber-logging-library.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Timber logging usage in Android production code.',
      code: 'HEURISTICS_ANDROID_TIMBER_LOGGING_LIBRARY_AST',
    },
  },
  {
    id: 'heuristics.android.analytics-firebase-analytics-o-custom.ast',
    description: 'Detects analytics tracking usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.analytics-firebase-analytics-o-custom.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected analytics tracking usage in Android production code where app instrumentation should remain explicit.',
      code: 'HEURISTICS_ANDROID_ANALYTICS_FIREBASE_ANALYTICS_O_CUSTOM_AST',
    },
  },
  {
    id: 'heuristics.android.android-profiler-cpu-memory-network-profiling.ast',
    description: 'Detects Android Profiler tracing usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.android-profiler-cpu-memory-network-profiling.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected Android profiling instrumentation in Android production code where CPU, memory, and trace capture should remain explicit.',
      code: 'HEURISTICS_ANDROID_ANDROID_PROFILER_CPU_MEMORY_NETWORK_PROFILING_AST',
    },
  },
  {
    id: 'heuristics.android.touch-targets-mi-nimo-48dp.ast',
    description: 'Detects touch target minimum size usage in Android production Compose files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.touch-targets-mi-nimo-48dp.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected minimum touch target usage in Android Compose production code.',
      code: 'HEURISTICS_ANDROID_TOUCH_TARGETS_MI_NIMO_48DP_AST',
    },
  },
  {
    id: 'heuristics.android.text-scaling-soportar-font-scaling-del-sistema.ast',
    description: 'Detects system font scaling support in Android production Compose code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.text-scaling-soportar-font-scaling-del-sistema.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected system font scaling support in Android Compose production code.',
      code: 'HEURISTICS_ANDROID_TEXT_SCALING_SOPORTAR_FONT_SCALING_DEL_SISTEMA_AST',
    },
  },
  {
    id: 'heuristics.android.accessibility-semantics-contentdescription.ast',
    description: 'Detects accessibility semantics/contentDescription usage in Android production Compose files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.accessibility-semantics-contentdescription.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected accessibility semantics/contentDescription usage in Compose production code.',
      code: 'HEURISTICS_ANDROID_ACCESSIBILITY_SEMANTICS_CONTENTDESCRIPTION_AST',
    },
  },
  {
    id: 'heuristics.android.contentdescription-para-ima-genes-y-botones.ast',
    description: 'Detects contentDescription usage in Android production Compose files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.contentdescription-para-ima-genes-y-botones.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected contentDescription usage in Compose production code.',
      code: 'HEURISTICS_ANDROID_CONTENTDESCRIPTION_PARA_IMAGENES_Y_BOTONES_AST',
    },
  },
  {
    id: 'heuristics.android.talkback-screen-reader-de-android.ast',
    description: 'Detects TalkBack-friendly accessibility usage in Android production Compose files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.talkback-screen-reader-de-android.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected TalkBack-related accessibility usage in Compose production code.',
      code: 'HEURISTICS_ANDROID_TALKBACK_SCREEN_READER_DE_ANDROID_AST',
    },
  },
  {
    id: 'heuristics.android.god-activities-single-activity-composables.ast',
    description: 'Detects Android Activities that concentrate Compose shell and composables.',
    severity: 'ERROR',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.god-activities-single-activity-composables.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected an Android Activity that concentrates Compose shell and composable declarations in the same file.',
      code: 'HEURISTICS_ANDROID_GOD_ACTIVITIES_SINGLE_ACTIVITY_COMPOSABLES_AST',
    },
  },
  {
    id: 'heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast',
    description: 'Detects a single Compose Activity shell in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a single Activity Compose shell in Android production code.',
      code: 'HEURISTICS_ANDROID_SINGLE_ACTIVITY_MULTIPLES_COMPOSABLES_FRAGMENTS_NO_ACTIVITIES_AST',
    },
  },
  {
    id: 'heuristics.android.try-catch-manejo-de-errores-en-coroutines.ast',
    description: 'Detects try/catch usage in Android coroutine code where error handling must remain explicit.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.try-catch-manejo-de-errores-en-coroutines.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected try/catch usage in Android coroutine code where error handling must remain explicit.',
      code: 'HEURISTICS_ANDROID_TRY_CATCH_MANEJO_DE_ERRORES_EN_COROUTINES_AST',
    },
  },
];
