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
    id: 'heuristics.ts.callback-hell.ast',
    description: 'Detects callback hell patterns in TypeScript/TSX production files.',
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
      message: 'AST heuristic detected callback hell / nested promise callback usage.',
      code: 'HEURISTICS_CALLBACK_HELL_AST',
    },
  },
  {
    id: 'heuristics.ts.magic-numbers.ast',
    description: 'Detects magic number literals in TypeScript/TSX production files.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.magic-numbers.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected magic number literal usage.',
      code: 'HEURISTICS_MAGIC_NUMBERS_AST',
    },
  },
  {
    id: 'heuristics.ts.hardcoded-values.ast',
    description: 'Detects hardcoded config values in TypeScript/TSX production files.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.hardcoded-values.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected hardcoded config value usage.',
      code: 'HEURISTICS_HARDCODED_VALUES_AST',
    },
  },
  {
    id: 'heuristics.ts.env-default-fallback.ast',
    description: 'Detects environment default fallbacks in TypeScript/TSX production files.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.env-default-fallback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected environment default fallback usage.',
      code: 'HEURISTICS_ENV_DEFAULT_FALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.guards-useguards-jwtauthguard.ast',
    description: 'Detects UseGuards(JwtAuthGuard) usage in TypeScript production files.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.guards-useguards-jwtauthguard.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected @UseGuards(JwtAuthGuard) usage.',
      code: 'HEURISTICS_GUARDS_USEGUARDS_JWTAUTHGUARD_AST',
    },
  },
  {
    id: 'heuristics.ts.interceptors-useinterceptors-logging-transform.ast',
    description: 'Detects UseInterceptors logging/transform usage in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.interceptors-useinterceptors-logging-transform.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected @UseInterceptors logging/transform usage.',
      code: 'HEURISTICS_INTERCEPTORS_USEINTERCEPTORS_LOGGING_TRANSFORM_AST',
    },
  },
  {
    id: 'heuristics.ts.no-sensitive-log.ast',
    description: 'Detects sensitive data emitted to logs in TypeScript production files.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.no-sensitive-log.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected sensitive data emitted to logs.',
      code: 'HEURISTICS_NO_SENSITIVE_LOG_AST',
    },
  },
  {
    id: 'heuristics.ts.rate-limiting-throttler.ast',
    description:
      'Detects NestJS throttler rate limiting configured for backend production files.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.rate-limiting-throttler.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NestJS throttler rate limiting.',
      code: 'HEURISTICS_RATE_LIMITING_THROTTLER_AST',
    },
  },
  {
    id: 'heuristics.ts.winston-structured-json-logger.ast',
    description: 'Detects Winston structured JSON logger usage in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.winston-structured-json-logger.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Winston structured JSON logger usage.',
      code: 'HEURISTICS_WINSTON_STRUCTURED_JSON_LOGGER_AST',
    },
  },
  {
    id: 'heuristics.ts.error-logging-full-context.ast',
    description: 'Detects backend error logging without full context in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.error-logging-full-context.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend error logging without full context.',
      code: 'HEURISTICS_ERROR_LOGGING_FULL_CONTEXT_AST',
    },
  },
  {
    id: 'heuristics.ts.correlation-ids.ast',
    description: 'Detects correlation IDs propagation in backend TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.correlation-ids.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected correlation IDs propagation in backend logs.',
      code: 'HEURISTICS_CORRELATION_IDS_AST',
    },
  },
  {
    id: 'heuristics.ts.cors-configured.ast',
    description: 'Detects backend CORS configuration with allowed origins.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.cors-configured.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend CORS configuration with allowed origins.',
      code: 'HEURISTICS_CORS_CONFIGURED_AST',
    },
  },
  {
    id: 'heuristics.ts.validationpipe-global.ast',
    description: 'Detects global ValidationPipe usage with whitelist enabled in backend TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.validationpipe-global.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected global ValidationPipe configuration with whitelist enabled.',
      code: 'HEURISTICS_VALIDATIONPIPE_GLOBAL_AST',
    },
  },
  {
    id: 'heuristics.ts.versionado-api-v1-api-v2.ast',
    description: 'Detects API versioned NestJS controllers.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.versionado-api-v1-api-v2.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend API versioning.',
      code: 'HEURISTICS_VERSIONADO_API_V1_API_V2_AST',
    },
  },
  {
    id: 'heuristics.ts.validation-config.ast',
    description: 'Detects backend config validation in ConfigModule for .env files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.validation-config.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend config validation in ConfigModule.',
      code: 'HEURISTICS_VALIDATION_CONFIG_AST',
    },
  },
  {
    id: 'heuristics.ts.class-validator-decorators.ast',
    description: 'Detects class-validator decorators in backend DTOs.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.class-validator-decorators.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected class-validator decorator usage.',
      code: 'HEURISTICS_CLASS_VALIDATOR_DECORATORS_AST',
    },
  },
  {
    id: 'heuristics.ts.class-transformer-decorators.ast',
    description: 'Detects class-transformer decorators in backend DTOs.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.class-transformer-decorators.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected class-transformer decorator usage.',
      code: 'HEURISTICS_CLASS_TRANSFORMER_DECORATORS_AST',
    },
  },
  {
    id: 'heuristics.ts.input-validation-siempre-validar-con-dtos.ast',
    description: 'Detects backend controller input validated through DTOs.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.input-validation-siempre-validar-con-dtos.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend controller input DTO validation.',
      code: 'HEURISTICS_INPUT_VALIDATION_SIEMPRE_VALIDAR_CON_DTOS_AST',
    },
  },
  {
    id: 'heuristics.ts.nested-validation-validatenested-type.ast',
    description: 'Detects nested validation through ValidateNested and Type decorators.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.nested-validation-validatenested-type.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected nested DTO validation.',
      code: 'HEURISTICS_NESTED_VALIDATION_VALIDATENESTED_TYPE_AST',
    },
  },
  {
    id: 'heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast',
    description: 'Detects backend DTO classes that preserve explicit input/output boundaries.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend DTO boundary classes.',
      code: 'HEURISTICS_DTOS_EN_BOUNDARIES_VALIDACIO_N_EN_ENTRADA_SALIDA_AST',
    },
  },
  {
    id: 'heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast',
    description: 'Detects separated create, update and response DTO contracts in backend code.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected separated backend DTO contracts.',
      code: 'HEURISTICS_DTOS_SEPARADOS_CREATEORDERDTO_UPDATEORDERDTO_ORDERRESPONSEDTO_AST',
    },
  },
  {
    id: 'heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast',
    description: 'Detects backend code returning entities directly instead of DTOs.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend code returning entities directly instead of DTOs.',
      code: 'HEURISTICS_TS_RETURN_DTOS_NO_EXPONER_ENTIDADES_DIRECTAMENTE_AST',
    },
  },
  {
    id: 'heuristics.ts.transacciones-para-operaciones-cri-ticas.ast',
    description: 'Detects backend critical transaction usage in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.transacciones-para-operaciones-cri-ticas.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend transaction usage for critical operations.',
      code: 'HEURISTICS_TS_TRANSACCIONES_PARA_OPERACIONES_CRI_TICAS_AST',
    },
  },
  {
    id: 'heuristics.ts.transacciones-para-operaciones-multi-tabla.ast',
    description: 'Detects backend multi-table transaction usage in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.transacciones-para-operaciones-multi-tabla.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected backend transaction usage for multi-table operations.',
      code: 'HEURISTICS_TS_TRANSACCIONES_PARA_OPERACIONES_MULTI_TABLA_AST',
    },
  },
  {
    id: 'heuristics.ts.prometheus-prom-client.ast',
    description: 'Detects Prometheus metrics instrumentation via prom-client in backend TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.prometheus-prom-client.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Prometheus metrics instrumentation via prom-client.',
      code: 'HEURISTICS_PROMETHEUS_PROM_CLIENT_AST',
    },
  },
  {
    id: 'heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast',
    description:
      'Detects bcrypt password hashing configured with salt rounds below the recommended minimum in TypeScript production files.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected bcrypt salt rounds below the recommended minimum.',
      code: 'HEURISTICS_PASSWORD_HASHING_BCRYPT_SALT_ROUNDS_10_AST',
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
    id: 'heuristics.ts.clean-architecture.ast',
    description:
      'Detects clean architecture dependency direction risks in domain/application TypeScript code.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.clean-architecture.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'AST heuristic detected clean architecture dependency direction risk in domain/application code.',
      code: 'HEURISTICS_CLEAN_ARCHITECTURE_AST',
    },
  },
  {
    id: 'heuristics.ts.react-class-component.ast',
    description: 'Detects React class components in frontend TypeScript/TSX code.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.react-class-component.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected React class component usage.',
      code: 'HEURISTICS_TS_REACT_CLASS_COMPONENT_AST',
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
