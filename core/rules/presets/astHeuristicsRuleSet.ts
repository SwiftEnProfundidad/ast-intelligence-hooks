import type { RuleSet } from '../RuleSet';

export const astHeuristicsRuleSet: RuleSet = [
  {
    id: 'heuristics.ts.empty-catch.ast',
    description: 'Detects empty catch blocks in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.empty-catch.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected an empty catch block.',
      code: 'HEURISTICS_EMPTY_CATCH_AST',
    },
  },
  {
    id: 'heuristics.ts.explicit-any.ast',
    description: 'Detects explicit any usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.explicit-any.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected explicit any usage.',
      code: 'HEURISTICS_EXPLICIT_ANY_AST',
    },
  },
  {
    id: 'heuristics.ts.console-log.ast',
    description: 'Detects console.log invocations in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.console-log.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected console.log usage.',
      code: 'HEURISTICS_CONSOLE_LOG_AST',
    },
  },
  {
    id: 'heuristics.ts.console-error.ast',
    description: 'Detects console.error invocations in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.console-error.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected console.error usage.',
      code: 'HEURISTICS_CONSOLE_ERROR_AST',
    },
  },
  {
    id: 'heuristics.ts.eval.ast',
    description: 'Detects eval invocations in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.eval.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected eval usage.',
      code: 'HEURISTICS_EVAL_AST',
    },
  },
  {
    id: 'heuristics.ts.function-constructor.ast',
    description: 'Detects Function constructor usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.function-constructor.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Function constructor usage.',
      code: 'HEURISTICS_FUNCTION_CONSTRUCTOR_AST',
    },
  },
  {
    id: 'heuristics.ts.set-timeout-string.ast',
    description: 'Detects setTimeout string callbacks in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.set-timeout-string.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected setTimeout with a string callback.',
      code: 'HEURISTICS_SET_TIMEOUT_STRING_AST',
    },
  },
  {
    id: 'heuristics.ts.set-interval-string.ast',
    description: 'Detects setInterval string callbacks in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.set-interval-string.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected setInterval with a string callback.',
      code: 'HEURISTICS_SET_INTERVAL_STRING_AST',
    },
  },
  {
    id: 'heuristics.ts.debugger.ast',
    description: 'Detects debugger statements in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.debugger.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected debugger statement usage.',
      code: 'HEURISTICS_DEBUGGER_AST',
    },
  },
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
];
