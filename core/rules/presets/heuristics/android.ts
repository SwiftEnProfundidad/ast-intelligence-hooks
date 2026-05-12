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
