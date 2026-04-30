import assert from 'node:assert/strict';
import test from 'node:test';
import { typescriptRules } from './typescript';

test('typescriptRules define reglas heurísticas locked para plataforma generic', () => {
  assert.equal(typescriptRules.length, 47);

  const ids = typescriptRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.callback-hell.ast',
    'heuristics.ts.magic-numbers.ast',
    'heuristics.ts.hardcoded-values.ast',
    'heuristics.ts.env-default-fallback.ast',
    'heuristics.ts.guards-useguards-jwtauthguard.ast',
    'heuristics.ts.interceptors-useinterceptors-logging-transform.ast',
    'heuristics.ts.no-sensitive-log.ast',
    'heuristics.ts.rate-limiting-throttler.ast',
    'heuristics.ts.winston-structured-json-logger.ast',
    'heuristics.ts.error-logging-full-context.ast',
    'heuristics.ts.correlation-ids.ast',
    'heuristics.ts.cors-configured.ast',
    'heuristics.ts.validationpipe-global.ast',
    'heuristics.ts.versionado-api-v1-api-v2.ast',
    'heuristics.ts.validation-config.ast',
    'heuristics.ts.class-validator-decorators.ast',
    'heuristics.ts.class-transformer-decorators.ast',
    'heuristics.ts.input-validation-siempre-validar-con-dtos.ast',
    'heuristics.ts.nested-validation-validatenested-type.ast',
    'heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast',
    'heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast',
    'heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast',
    'heuristics.ts.transacciones-para-operaciones-cri-ticas.ast',
    'heuristics.ts.transacciones-para-operaciones-multi-tabla.ast',
    'heuristics.ts.prometheus-prom-client.ast',
    'heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast',
    'heuristics.ts.with-statement.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
    'heuristics.ts.clean-architecture.ast',
    'heuristics.ts.react-class-component.ast',
    'heuristics.ts.god-class-large-class.ast',
  ]);

  const byId = new Map(typescriptRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.empty-catch.ast')?.then.code,
    'HEURISTICS_EMPTY_CATCH_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.debugger.ast')?.then.code,
    'HEURISTICS_DEBUGGER_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.solid.dip.framework-import.ast')?.then.code,
    'HEURISTICS_SOLID_DIP_FRAMEWORK_IMPORT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.solid.dip.concrete-instantiation.ast')?.then.code,
    'HEURISTICS_SOLID_DIP_CONCRETE_INSTANTIATION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.clean-architecture.ast')?.then.code,
    'HEURISTICS_CLEAN_ARCHITECTURE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.react-class-component.ast')?.then.code,
    'HEURISTICS_TS_REACT_CLASS_COMPONENT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.god-class-large-class.ast')?.then.code,
    'HEURISTICS_GOD_CLASS_LARGE_CLASS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.callback-hell.ast')?.then.code,
    'HEURISTICS_CALLBACK_HELL_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.magic-numbers.ast')?.then.code,
    'HEURISTICS_MAGIC_NUMBERS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.hardcoded-values.ast')?.then.code,
    'HEURISTICS_HARDCODED_VALUES_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.env-default-fallback.ast')?.then.code,
    'HEURISTICS_ENV_DEFAULT_FALLBACK_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.guards-useguards-jwtauthguard.ast')?.then.code,
    'HEURISTICS_GUARDS_USEGUARDS_JWTAUTHGUARD_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.interceptors-useinterceptors-logging-transform.ast')?.then.code,
    'HEURISTICS_INTERCEPTORS_USEINTERCEPTORS_LOGGING_TRANSFORM_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.no-sensitive-log.ast')?.then.code,
    'HEURISTICS_NO_SENSITIVE_LOG_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast')?.then.code,
    'HEURISTICS_PASSWORD_HASHING_BCRYPT_SALT_ROUNDS_10_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.rate-limiting-throttler.ast')?.then.code,
    'HEURISTICS_RATE_LIMITING_THROTTLER_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.winston-structured-json-logger.ast')?.then.code,
    'HEURISTICS_WINSTON_STRUCTURED_JSON_LOGGER_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.error-logging-full-context.ast')?.then.code,
    'HEURISTICS_ERROR_LOGGING_FULL_CONTEXT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.correlation-ids.ast')?.then.code,
    'HEURISTICS_CORRELATION_IDS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.cors-configured.ast')?.then.code,
    'HEURISTICS_CORS_CONFIGURED_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.validationpipe-global.ast')?.then.code,
    'HEURISTICS_VALIDATIONPIPE_GLOBAL_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.versionado-api-v1-api-v2.ast')?.then.code,
    'HEURISTICS_VERSIONADO_API_V1_API_V2_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.validation-config.ast')?.then.code,
    'HEURISTICS_VALIDATION_CONFIG_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.class-validator-decorators.ast')?.then.code,
    'HEURISTICS_CLASS_VALIDATOR_DECORATORS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.class-transformer-decorators.ast')?.then.code,
    'HEURISTICS_CLASS_TRANSFORMER_DECORATORS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast')?.then.code,
    'HEURISTICS_DTOS_EN_BOUNDARIES_VALIDACIO_N_EN_ENTRADA_SALIDA_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.input-validation-siempre-validar-con-dtos.ast')?.then.code,
    'HEURISTICS_INPUT_VALIDATION_SIEMPRE_VALIDAR_CON_DTOS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.nested-validation-validatenested-type.ast')?.then.code,
    'HEURISTICS_NESTED_VALIDATION_VALIDATENESTED_TYPE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast')
      ?.then.code,
    'HEURISTICS_DTOS_SEPARADOS_CREATEORDERDTO_UPDATEORDERDTO_ORDERRESPONSEDTO_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast')?.then.code,
    'HEURISTICS_TS_RETURN_DTOS_NO_EXPONER_ENTIDADES_DIRECTAMENTE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.transacciones-para-operaciones-cri-ticas.ast')?.then.code,
    'HEURISTICS_TS_TRANSACCIONES_PARA_OPERACIONES_CRI_TICAS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.transacciones-para-operaciones-multi-tabla.ast')?.then.code,
    'HEURISTICS_TS_TRANSACCIONES_PARA_OPERACIONES_MULTI_TABLA_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.prometheus-prom-client.ast')?.then.code,
    'HEURISTICS_PROMETHEUS_PROM_CLIENT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast')?.then.code,
    'HEURISTICS_PASSWORD_HASHING_BCRYPT_SALT_ROUNDS_10_AST'
  );

  for (const rule of typescriptRules) {
    assert.equal(rule.platform, 'generic');
    if (
      rule.id === 'heuristics.ts.clean-architecture.ast' ||
      rule.id === 'heuristics.ts.god-class-large-class.ast' ||
      rule.id === 'heuristics.ts.magic-numbers.ast' ||
      rule.id === 'heuristics.ts.hardcoded-values.ast' ||
    rule.id === 'heuristics.ts.env-default-fallback.ast' ||
    rule.id === 'heuristics.ts.guards-useguards-jwtauthguard.ast' ||
    rule.id === 'heuristics.ts.no-sensitive-log.ast' ||
    rule.id === 'heuristics.ts.rate-limiting-throttler.ast' ||
    rule.id === 'heuristics.ts.react-class-component.ast' ||
    rule.id === 'heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast'
    ) {
      assert.equal(rule.severity, 'ERROR');
    } else {
      assert.equal(rule.severity, 'WARN');
    }
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
