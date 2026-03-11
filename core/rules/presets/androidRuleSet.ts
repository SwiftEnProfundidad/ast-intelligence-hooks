import type { RuleSet } from '../RuleSet';

export const androidRuleSet: RuleSet = [
  {
    id: 'android.solid.dip.concrete-framework-dependency',
    description:
      'Blocks Android application or presentation types that depend directly on concrete framework services instead of abstractions.',
    severity: 'CRITICAL',
    platform: 'android',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.kt', '**/*.kts'],
      exclude: ['**/*Test*/**', '**/*androidTest*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.dip.concrete-framework-dependency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Android application or presentation type depends directly on concrete framework services instead of ports or abstractions.',
      code: 'ANDROID_SOLID_DIP_CONCRETE_FRAMEWORK_DEPENDENCY',
      source: 'android-solid-dip',
    },
  },
  {
    id: 'android.solid.ocp.discriminator-branching',
    description:
      'Blocks Android application or presentation types that branch on a discriminator and require direct modification for new cases instead of extension.',
    severity: 'CRITICAL',
    platform: 'android',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.kt', '**/*.kts'],
      exclude: ['**/*Test*/**', '**/*androidTest*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.ocp.discriminator-branching.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Android application or presentation type branches on a discriminator instead of extending behavior through abstractions.',
      code: 'ANDROID_SOLID_OCP_DISCRIMINATOR_BRANCHING',
      source: 'android-solid-ocp',
    },
  },
  {
    id: 'android.solid.isp.fat-interface-dependency',
    description:
      'Blocks Android application or presentation types that depend on interfaces broader than the members they actually use.',
    severity: 'CRITICAL',
    platform: 'android',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.kt', '**/*.kts'],
      exclude: ['**/*Test*/**', '**/*androidTest*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.isp.fat-interface-dependency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Android application or presentation type depends on an interface broader than the members it actually uses.',
      code: 'ANDROID_SOLID_ISP_FAT_INTERFACE_DEPENDENCY',
      source: 'android-solid-isp',
    },
  },
  {
    id: 'android.solid.lsp.narrowed-precondition-substitution',
    description:
      'Blocks Android application or presentation subtypes that narrow base contract preconditions and become unsafe substitutes.',
    severity: 'CRITICAL',
    platform: 'android',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.kt', '**/*.kts'],
      exclude: ['**/*Test*/**', '**/*androidTest*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.lsp.narrowed-precondition.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Android application or presentation subtype narrows the base contract preconditions and breaks safe substitution.',
      code: 'ANDROID_SOLID_LSP_NARROWED_PRECONDITION_SUBSTITUTION',
      source: 'android-solid-lsp',
    },
  },
  {
    id: 'android.solid.srp.presentation-mixed-responsibilities',
    description:
      'Blocks Android presentation types that mix session, networking, persistence and navigation responsibilities in the same semantic node.',
    severity: 'CRITICAL',
    platform: 'android',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.kt', '**/*.kts'],
      exclude: ['**/*Test*/**', '**/*androidTest*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Android presentation type mixes session, networking, persistence and navigation responsibilities in a single semantic node.',
      code: 'ANDROID_SOLID_SRP_PRESENTATION_MIXED_RESPONSIBILITIES',
      source: 'android-solid-srp',
    },
  },
  {
    id: 'android.no-thread-sleep',
    description: 'Disallows Thread.sleep usage in Android code.',
    severity: 'CRITICAL',
    platform: 'android',
    locked: true,
    scope: {
      include: ['apps/android/'],
    },
    when: {
      kind: 'FileContent',
      contains: ['Thread.sleep('],
    },
    then: {
      kind: 'Finding',
      message: 'Thread.sleep is not allowed in Android code.',
      code: 'ANDROID_NO_THREAD_SLEEP',
    },
  },
  {
    id: 'android.no-global-scope',
    description: 'Avoids GlobalScope usage in Android coroutines.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    scope: {
      include: ['apps/android/'],
    },
    when: {
      kind: 'FileContent',
      contains: ['GlobalScope.'],
    },
    then: {
      kind: 'Finding',
      message: 'Use structured concurrency instead of GlobalScope.',
      code: 'ANDROID_NO_GLOBAL_SCOPE',
    },
  },
  {
    id: 'android.no-run-blocking',
    description: 'Avoids runBlocking in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    scope: {
      include: ['apps/android/'],
      exclude: ['**/*Test*/**', '**/*Spec*/**'],
    },
    when: {
      kind: 'FileContent',
      contains: ['runBlocking('],
    },
    then: {
      kind: 'Finding',
      message: 'runBlocking should be avoided in Android production code.',
      code: 'ANDROID_NO_RUN_BLOCKING',
    },
  },
];
