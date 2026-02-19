import type { RuleSet } from '../../RuleSet';

export const typescriptRules: RuleSet = [
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
    id: 'heuristics.ts.new-promise-async.ast',
    description: 'Detects async Promise executor usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.new-promise-async.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected async Promise executor usage.',
      code: 'HEURISTICS_NEW_PROMISE_ASYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.with-statement.ast',
    description: 'Detects with-statement usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.with-statement.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected with-statement usage.',
      code: 'HEURISTICS_WITH_STATEMENT_AST',
    },
  },
  {
    id: 'heuristics.ts.delete-operator.ast',
    description: 'Detects delete-operator usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.delete-operator.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected delete-operator usage.',
      code: 'HEURISTICS_DELETE_OPERATOR_AST',
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
    id: 'heuristics.ts.solid.srp.class-command-query-mix.ast',
    description: 'Detects SRP/CQS violations when classes mix command and query responsibilities.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.solid.srp.class-command-query-mix.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected class-level SRP/CQS mix (commands and queries in the same class).',
      code: 'HEURISTICS_SOLID_SRP_CLASS_COMMAND_QUERY_MIX_AST',
    },
  },
  {
    id: 'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    description: 'Detects ISP/CQS violations when interfaces mix command and query responsibilities.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.solid.isp.interface-command-query-mix.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected interface-level ISP/CQS mix (commands and queries in the same contract).',
      code: 'HEURISTICS_SOLID_ISP_INTERFACE_COMMAND_QUERY_MIX_AST',
    },
  },
  {
    id: 'heuristics.ts.solid.ocp.discriminator-switch.ast',
    description: 'Detects OCP risk when behavior branches by discriminator switch.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.solid.ocp.discriminator-switch.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected OCP risk via discriminator switch branching.',
      code: 'HEURISTICS_SOLID_OCP_DISCRIMINATOR_SWITCH_AST',
    },
  },
  {
    id: 'heuristics.ts.solid.lsp.override-not-implemented.ast',
    description: 'Detects LSP risk when overrides throw not-implemented/unsupported errors.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.solid.lsp.override-not-implemented.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected LSP risk: override throws not-implemented/unsupported.',
      code: 'HEURISTICS_SOLID_LSP_OVERRIDE_NOT_IMPLEMENTED_AST',
    },
  },
  {
    id: 'heuristics.ts.solid.dip.framework-import.ast',
    description: 'Detects DIP risk when domain/application code imports framework dependencies.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.solid.dip.framework-import.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected DIP risk: framework dependency imported in domain/application code.',
      code: 'HEURISTICS_SOLID_DIP_FRAMEWORK_IMPORT_AST',
    },
  },
  {
    id: 'heuristics.ts.solid.dip.concrete-instantiation.ast',
    description:
      'Detects DIP risk when domain/application code instantiates concrete framework dependencies.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.solid.dip.concrete-instantiation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected DIP risk: direct instantiation of concrete framework dependency.',
      code: 'HEURISTICS_SOLID_DIP_CONCRETE_INSTANTIATION_AST',
    },
  },
];
