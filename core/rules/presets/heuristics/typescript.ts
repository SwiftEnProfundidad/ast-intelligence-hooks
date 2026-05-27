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
    id: 'heuristics.ts.backend.sensitive-data-logging.ast',
    description: 'Detects sensitive identifiers passed to backend logging sinks.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.sensitive-data-logging.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected sensitive data passed to a logging sink.',
      code: 'HEURISTICS_BACKEND_SENSITIVE_DATA_LOGGING_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.log-without-context.ast',
    description: 'Detects backend logger calls that omit request, user or trace context.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.log-without-context.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend log call without request/user/trace context.',
      code: 'HEURISTICS_BACKEND_LOG_WITHOUT_CONTEXT_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.magic-number-literal.ast',
    description: 'Detects inline numeric literals in backend TypeScript code.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.magic-number-literal.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected an inline numeric literal; use a named constant.',
      code: 'HEURISTICS_BACKEND_MAGIC_NUMBER_LITERAL_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.generic-error-throw.ast',
    description: 'Detects generic Error throws in backend TypeScript code.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.generic-error-throw.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected throw new Error in backend code; use a specific exception.',
      code: 'HEURISTICS_BACKEND_GENERIC_ERROR_THROW_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.raw-throw-expression.ast',
    description: 'Detects backend throw statements that throw raw literals, objects, or identifiers instead of typed exceptions.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.raw-throw-expression.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected raw throw expression in backend code; throw a typed exception.',
      code: 'HEURISTICS_BACKEND_RAW_THROW_EXPRESSION_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.production-mock-or-spy.ast',
    description: 'Detects mock or spy test primitives in backend production TypeScript code.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.production-mock-or-spy.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected mock or spy usage in backend production code.',
      code: 'HEURISTICS_BACKEND_PRODUCTION_MOCK_OR_SPY_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.error-stack-in-http-response.ast',
    description: 'Detects stack traces exposed in backend HTTP responses.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.error-stack-in-http-response.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected stack trace exposure in a backend HTTP response.',
      code: 'HEURISTICS_BACKEND_ERROR_STACK_IN_HTTP_RESPONSE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.inconsistent-error-response.ast',
    description: 'Detects backend error responses that do not expose the consistent statusCode/message/timestamp/path contract.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.inconsistent-error-response.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected inconsistent backend error response contract.',
      code: 'HEURISTICS_BACKEND_INCONSISTENT_ERROR_RESPONSE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.error-payload-success-status.ast',
    description: 'Detects backend error payloads sent with success HTTP status codes.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.error-payload-success-status.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend error payload sent with a success HTTP status.',
      code: 'HEURISTICS_BACKEND_ERROR_PAYLOAD_SUCCESS_STATUS_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.controller-entity-response.ast',
    description: 'Detects backend controllers that expose domain entities directly instead of response DTOs.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.controller-entity-response.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend controller exposing domain entities directly.',
      code: 'HEURISTICS_BACKEND_CONTROLLER_ENTITY_RESPONSE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.anemic-domain-model.ast',
    description: 'Detects backend domain entities that expose state without business behavior.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.anemic-domain-model.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected an anemic backend domain entity without behavior.',
      code: 'HEURISTICS_BACKEND_ANEMIC_DOMAIN_MODEL_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.permissive-cors.ast',
    description: 'Detects permissive backend CORS configuration in NestJS/Express bootstrap code.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.permissive-cors.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected permissive backend CORS configuration.',
      code: 'HEURISTICS_BACKEND_PERMISSIVE_CORS_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.string-literal-union-enum.ast',
    description: 'Detects backend fixed string literal unions that should be represented as enums or centralized typed constants.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.string-literal-union-enum.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a backend fixed string literal union; use an enum or centralized typed constants.',
      code: 'HEURISTICS_BACKEND_STRING_LITERAL_UNION_ENUM_AST',
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
    id: 'heuristics.ts.bcrypt-weak-salt-rounds.ast',
    description: 'Detects bcrypt hashing calls with numeric salt rounds below 10.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.bcrypt-weak-salt-rounds.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected bcrypt salt rounds below 10.',
      code: 'HEURISTICS_BCRYPT_WEAK_SALT_ROUNDS_AST',
    },
  },
  {
    id: 'heuristics.ts.sql-interpolated-unsafe-call.ast',
    description: 'Detects interpolated template SQL passed to unsafe query/raw calls.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.sql-interpolated-unsafe-call.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected interpolated SQL passed to an unsafe query/raw call.',
      code: 'HEURISTICS_SQL_INTERPOLATED_UNSAFE_CALL_AST',
    },
  },
  {
    id: 'heuristics.ts.sensitive-token-in-url.ast',
    description: 'Detects sensitive credential query parameters in network call URLs.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.sensitive-token-in-url.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected sensitive token or credential in a network URL.',
      code: 'HEURISTICS_SENSITIVE_TOKEN_IN_URL_AST',
    },
  },
  {
    id: 'heuristics.tsx.non-semantic-clickable.ast',
    description: 'Detects non-semantic JSX elements with click handlers and no keyboard accessibility evidence.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.tsx.non-semantic-clickable.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected non-semantic clickable JSX without keyboard accessibility.',
      code: 'HEURISTICS_TSX_NON_SEMANTIC_CLICKABLE_AST',
    },
  },
  {
    id: 'heuristics.tsx.redundant-aria-role.ast',
    description: 'Detects redundant ARIA roles on semantic JSX elements where native semantics should be used.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.tsx.redundant-aria-role.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected redundant ARIA role on semantic JSX.',
      code: 'HEURISTICS_TSX_REDUNDANT_ARIA_ROLE_AST',
    },
  },
  {
    id: 'heuristics.ts.frontend-test-direct-network-call.ast',
    description: 'Detects direct fetch/axios/request calls in frontend test files where MSW should own API mocking.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.frontend-test-direct-network-call.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected direct network call usage in a frontend test; use MSW handlers instead.',
      code: 'HEURISTICS_FRONTEND_TEST_DIRECT_NETWORK_CALL_AST',
    },
  },
  {
    id: 'heuristics.ts.callback-hell.ast',
    description: 'Detects nested callback functions passed to calls in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.callback-hell.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected nested callback usage.',
      code: 'HEURISTICS_CALLBACK_HELL_AST',
    },
  },
  {
    id: 'heuristics.ts.nested-if-else.ast',
    description: 'Detects nested if/else control flow where early returns should be preferred.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.nested-if-else.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected nested if/else control flow; prefer early returns.',
      code: 'HEURISTICS_NESTED_IF_ELSE_AST',
    },
  },
  {
    id: 'heuristics.ts.next-pages-api-route.ast',
    description: 'Detects legacy Next.js pages/api route handlers where app/api route handlers should be used.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.next-pages-api-route.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected a legacy Next.js pages/api default route handler; use app/api route handlers.',
      code: 'HEURISTICS_NEXT_PAGES_API_ROUTE_AST',
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
  {
    id: 'heuristics.ts.nestjs.constructor-di-without-decorator.ast',
    description:
      'Detects NestJS classes with constructor dependencies but without an explicit provider/controller decorator.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.nestjs.constructor-di-without-decorator.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected NestJS constructor dependency injection without an explicit class decorator.',
      code: 'HEURISTICS_NESTJS_CONSTRUCTOR_DI_WITHOUT_DECORATOR_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.controller-route-without-guard.ast',
    description: 'Detects NestJS controller route handlers without UseGuards at method or class level.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.controller-route-without-guard.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NestJS controller route without UseGuards.',
      code: 'HEURISTICS_BACKEND_CONTROLLER_ROUTE_WITHOUT_GUARD_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.controller-route-without-roles.ast',
    description:
      'Detects guarded NestJS controller route handlers without an explicit Roles decorator or roles metadata.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.controller-route-without-roles.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected guarded NestJS controller route without role metadata.',
      code: 'HEURISTICS_BACKEND_CONTROLLER_ROUTE_WITHOUT_ROLES_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.auth-route-without-throttle.ast',
    description:
      'Detects NestJS authentication routes such as login, register, refresh or password reset without @Throttle rate limiting.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.auth-route-without-throttle.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected authentication route without rate limiting.',
      code: 'HEURISTICS_BACKEND_AUTH_ROUTE_WITHOUT_THROTTLE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.event-handler-without-on-event.ast',
    description: 'Detects backend event handler classes or methods without an explicit @OnEvent subscription.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.event-handler-without-on-event.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend event handler without @OnEvent.',
      code: 'HEURISTICS_BACKEND_EVENT_HANDLER_WITHOUT_ON_EVENT_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
    description:
      'Detects backend persistence mutations without a nearby audit log, event store append, or domain event emission.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected backend persistence mutation without audit log or domain event.',
      code: 'HEURISTICS_BACKEND_PERSISTENCE_MUTATION_WITHOUT_AUDIT_EVENT_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.sensitive-cache-write.ast',
    description: 'Detects backend cache writes that store tokens, passwords, secrets, email or other sensitive data.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.sensitive-cache-write.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected sensitive data written to backend cache.',
      code: 'HEURISTICS_BACKEND_SENSITIVE_CACHE_WRITE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.auth-response-without-refresh-token.ast',
    description: 'Detects backend auth responses that return an access token without a refresh token.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.auth-response-without-refresh-token.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected auth response without refresh token.',
      code: 'HEURISTICS_BACKEND_AUTH_RESPONSE_WITHOUT_REFRESH_TOKEN_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.process-env-default-fallback.ast',
    description: 'Detects backend process.env configuration reads with literal production fallbacks.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.process-env-default-fallback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected process.env fallback; fail fast when critical backend configuration is missing.',
      code: 'HEURISTICS_BACKEND_PROCESS_ENV_DEFAULT_FALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.direct-process-env-read.ast',
    description: 'Detects direct backend process.env reads outside the configuration boundary.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.direct-process-env-read.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected direct process.env access; use NestJS ConfigModule/ConfigService.',
      code: 'HEURISTICS_BACKEND_DIRECT_PROCESS_ENV_READ_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.config-module-without-validation.ast',
    description: 'Detects NestJS ConfigModule.forRoot calls without environment validation.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.config-module-without-validation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected ConfigModule.forRoot without validationSchema or validate.',
      code: 'HEURISTICS_BACKEND_CONFIG_MODULE_WITHOUT_VALIDATION_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.hard-delete-without-soft-delete.ast',
    description: 'Detects backend physical delete calls where soft delete with deletedAt/deleted_at should be used.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.hard-delete-without-soft-delete.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend physical delete; use soft delete with deletedAt/deleted_at.',
      code: 'HEURISTICS_BACKEND_HARD_DELETE_WITHOUT_SOFT_DELETE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.dto-property-without-validation.ast',
    description:
      'Detects DTO properties without class-validator or class-transformer decorators.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.dto-property-without-validation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected DTO property without class-validator/class-transformer decorator.',
      code: 'HEURISTICS_BACKEND_DTO_PROPERTY_WITHOUT_VALIDATION_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.dto-property-without-api-property.ast',
    description:
      'Detects DTO properties without Swagger ApiProperty or ApiPropertyOptional decorators.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.dto-property-without-api-property.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected DTO property without Swagger ApiProperty decorator.',
      code: 'HEURISTICS_BACKEND_DTO_PROPERTY_WITHOUT_API_PROPERTY_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.dto-nested-property-without-nested-validation.ast',
    description: 'Detects nested DTO properties without ValidateNested/Type decorators.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.dto-nested-property-without-nested-validation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected nested DTO property without nested validation decorators.',
      code: 'HEURISTICS_BACKEND_DTO_NESTED_PROPERTY_WITHOUT_NESTED_VALIDATION_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.missing-global-validation-pipe.ast',
    description:
      'Detects NestJS bootstrap code without a strict global ValidationPipe configured with whitelist=true.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.missing-global-validation-pipe.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected NestJS bootstrap without global ValidationPipe whitelist.',
      code: 'HEURISTICS_BACKEND_MISSING_GLOBAL_VALIDATION_PIPE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.missing-helmet-security-headers.ast',
    description:
      'Detects NestJS bootstrap code without Helmet middleware for security headers.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.missing-helmet-security-headers.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected NestJS bootstrap without Helmet security headers middleware.',
      code: 'HEURISTICS_BACKEND_MISSING_HELMET_SECURITY_HEADERS_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.missing-compression-middleware.ast',
    description:
      'Detects NestJS bootstrap code without compression middleware for large responses.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.missing-compression-middleware.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NestJS bootstrap without compression middleware.',
      code: 'HEURISTICS_BACKEND_MISSING_COMPRESSION_MIDDLEWARE_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.controller-business-logic.ast',
    description:
      'Detects NestJS controller route handlers that contain business logic or direct persistence access instead of delegating to services/use cases.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.controller-business-logic.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected business logic inside a NestJS controller route handler.',
      code: 'HEURISTICS_BACKEND_CONTROLLER_BUSINESS_LOGIC_AST',
    },
  },
  {
    id: 'heuristics.ts.backend.repository-business-logic.ast',
    description:
      'Detects backend repository methods that contain business decision branches instead of staying limited to CRUD, queries and data mapping.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.backend.repository-business-logic.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected business decision logic inside a backend repository.',
      code: 'HEURISTICS_BACKEND_REPOSITORY_BUSINESS_LOGIC_AST',
    },
  },
  {
    id: 'heuristics.ts.god-class-large-class.ast',
    description: 'Detects God Class candidates when one class mixes multiple responsibility nodes.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.god-class-large-class.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected God Class candidate by mixed responsibility nodes in one class declaration.',
      code: 'HEURISTICS_GOD_CLASS_LARGE_CLASS_AST',
    },
  },
];
