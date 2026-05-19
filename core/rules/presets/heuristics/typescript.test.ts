import assert from 'node:assert/strict';
import test from 'node:test';
import { typescriptRules } from './typescript';

test('typescriptRules define reglas heurísticas locked para plataforma generic', () => {
  assert.equal(typescriptRules.length, 61);

  const ids = typescriptRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.backend.sensitive-data-logging.ast',
    'heuristics.ts.backend.log-without-context.ast',
    'heuristics.ts.backend.magic-number-literal.ast',
    'heuristics.ts.backend.generic-error-throw.ast',
    'heuristics.ts.backend.raw-throw-expression.ast',
    'heuristics.ts.backend.production-mock-or-spy.ast',
    'heuristics.ts.backend.error-stack-in-http-response.ast',
    'heuristics.ts.backend.inconsistent-error-response.ast',
    'heuristics.ts.backend.error-payload-success-status.ast',
    'heuristics.ts.backend.controller-entity-response.ast',
    'heuristics.ts.backend.anemic-domain-model.ast',
    'heuristics.ts.backend.permissive-cors.ast',
    'heuristics.ts.backend.string-literal-union-enum.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.bcrypt-weak-salt-rounds.ast',
    'heuristics.ts.sql-interpolated-unsafe-call.ast',
    'heuristics.ts.sensitive-token-in-url.ast',
    'heuristics.tsx.non-semantic-clickable.ast',
    'heuristics.tsx.redundant-aria-role.ast',
    'heuristics.ts.frontend-test-direct-network-call.ast',
    'heuristics.ts.callback-hell.ast',
    'heuristics.ts.nested-if-else.ast',
    'heuristics.ts.next-pages-api-route.ast',
    'heuristics.ts.with-statement.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
    'heuristics.ts.nestjs.constructor-di-without-decorator.ast',
    'heuristics.ts.backend.controller-route-without-guard.ast',
    'heuristics.ts.backend.controller-route-without-roles.ast',
    'heuristics.ts.backend.auth-route-without-throttle.ast',
    'heuristics.ts.backend.event-handler-without-on-event.ast',
    'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
    'heuristics.ts.backend.sensitive-cache-write.ast',
    'heuristics.ts.backend.auth-response-without-refresh-token.ast',
    'heuristics.ts.backend.process-env-default-fallback.ast',
    'heuristics.ts.backend.direct-process-env-read.ast',
    'heuristics.ts.backend.config-module-without-validation.ast',
    'heuristics.ts.backend.hard-delete-without-soft-delete.ast',
    'heuristics.ts.backend.dto-property-without-validation.ast',
    'heuristics.ts.backend.dto-property-without-api-property.ast',
    'heuristics.ts.backend.dto-nested-property-without-nested-validation.ast',
    'heuristics.ts.backend.missing-global-validation-pipe.ast',
    'heuristics.ts.backend.missing-helmet-security-headers.ast',
    'heuristics.ts.backend.missing-compression-middleware.ast',
    'heuristics.ts.backend.controller-business-logic.ast',
    'heuristics.ts.backend.repository-business-logic.ast',
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
    byId.get('heuristics.ts.callback-hell.ast')?.then.code,
    'HEURISTICS_CALLBACK_HELL_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.nested-if-else.ast')?.then.code,
    'HEURISTICS_NESTED_IF_ELSE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.next-pages-api-route.ast')?.then.code,
    'HEURISTICS_NEXT_PAGES_API_ROUTE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.bcrypt-weak-salt-rounds.ast')?.then.code,
    'HEURISTICS_BCRYPT_WEAK_SALT_ROUNDS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.sql-interpolated-unsafe-call.ast')?.then.code,
    'HEURISTICS_SQL_INTERPOLATED_UNSAFE_CALL_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.sensitive-token-in-url.ast')?.then.code,
    'HEURISTICS_SENSITIVE_TOKEN_IN_URL_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.sensitive-data-logging.ast')?.then.code,
    'HEURISTICS_BACKEND_SENSITIVE_DATA_LOGGING_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.log-without-context.ast')?.then.code,
    'HEURISTICS_BACKEND_LOG_WITHOUT_CONTEXT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.magic-number-literal.ast')?.then.code,
    'HEURISTICS_BACKEND_MAGIC_NUMBER_LITERAL_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.generic-error-throw.ast')?.then.code,
    'HEURISTICS_BACKEND_GENERIC_ERROR_THROW_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.raw-throw-expression.ast')?.then.code,
    'HEURISTICS_BACKEND_RAW_THROW_EXPRESSION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.production-mock-or-spy.ast')?.then.code,
    'HEURISTICS_BACKEND_PRODUCTION_MOCK_OR_SPY_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.error-stack-in-http-response.ast')?.then.code,
    'HEURISTICS_BACKEND_ERROR_STACK_IN_HTTP_RESPONSE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.inconsistent-error-response.ast')?.then.code,
    'HEURISTICS_BACKEND_INCONSISTENT_ERROR_RESPONSE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.error-payload-success-status.ast')?.then.code,
    'HEURISTICS_BACKEND_ERROR_PAYLOAD_SUCCESS_STATUS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.controller-entity-response.ast')?.then.code,
    'HEURISTICS_BACKEND_CONTROLLER_ENTITY_RESPONSE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.anemic-domain-model.ast')?.then.code,
    'HEURISTICS_BACKEND_ANEMIC_DOMAIN_MODEL_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.permissive-cors.ast')?.then.code,
    'HEURISTICS_BACKEND_PERMISSIVE_CORS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.string-literal-union-enum.ast')?.then.code,
    'HEURISTICS_BACKEND_STRING_LITERAL_UNION_ENUM_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.frontend-test-direct-network-call.ast')?.then.code,
    'HEURISTICS_FRONTEND_TEST_DIRECT_NETWORK_CALL_AST'
  );
  assert.equal(
    byId.get('heuristics.tsx.non-semantic-clickable.ast')?.then.code,
    'HEURISTICS_TSX_NON_SEMANTIC_CLICKABLE_AST'
  );
  assert.equal(
    byId.get('heuristics.tsx.redundant-aria-role.ast')?.then.code,
    'HEURISTICS_TSX_REDUNDANT_ARIA_ROLE_AST'
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
    byId.get('heuristics.ts.nestjs.constructor-di-without-decorator.ast')?.then.code,
    'HEURISTICS_NESTJS_CONSTRUCTOR_DI_WITHOUT_DECORATOR_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.controller-route-without-guard.ast')?.then.code,
    'HEURISTICS_BACKEND_CONTROLLER_ROUTE_WITHOUT_GUARD_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.controller-route-without-roles.ast')?.then.code,
    'HEURISTICS_BACKEND_CONTROLLER_ROUTE_WITHOUT_ROLES_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.auth-route-without-throttle.ast')?.then.code,
    'HEURISTICS_BACKEND_AUTH_ROUTE_WITHOUT_THROTTLE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.event-handler-without-on-event.ast')?.then.code,
    'HEURISTICS_BACKEND_EVENT_HANDLER_WITHOUT_ON_EVENT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.persistence-mutation-without-audit-event.ast')?.then.code,
    'HEURISTICS_BACKEND_PERSISTENCE_MUTATION_WITHOUT_AUDIT_EVENT_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.sensitive-cache-write.ast')?.then.code,
    'HEURISTICS_BACKEND_SENSITIVE_CACHE_WRITE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.auth-response-without-refresh-token.ast')?.then.code,
    'HEURISTICS_BACKEND_AUTH_RESPONSE_WITHOUT_REFRESH_TOKEN_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.process-env-default-fallback.ast')?.then.code,
    'HEURISTICS_BACKEND_PROCESS_ENV_DEFAULT_FALLBACK_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.direct-process-env-read.ast')?.then.code,
    'HEURISTICS_BACKEND_DIRECT_PROCESS_ENV_READ_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.config-module-without-validation.ast')?.then.code,
    'HEURISTICS_BACKEND_CONFIG_MODULE_WITHOUT_VALIDATION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.hard-delete-without-soft-delete.ast')?.then.code,
    'HEURISTICS_BACKEND_HARD_DELETE_WITHOUT_SOFT_DELETE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.dto-property-without-validation.ast')?.then.code,
    'HEURISTICS_BACKEND_DTO_PROPERTY_WITHOUT_VALIDATION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.dto-property-without-api-property.ast')?.then.code,
    'HEURISTICS_BACKEND_DTO_PROPERTY_WITHOUT_API_PROPERTY_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.dto-nested-property-without-nested-validation.ast')?.then.code,
    'HEURISTICS_BACKEND_DTO_NESTED_PROPERTY_WITHOUT_NESTED_VALIDATION_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.missing-helmet-security-headers.ast')?.then.code,
    'HEURISTICS_BACKEND_MISSING_HELMET_SECURITY_HEADERS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.backend.missing-compression-middleware.ast')?.then.code,
    'HEURISTICS_BACKEND_MISSING_COMPRESSION_MIDDLEWARE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.god-class-large-class.ast')?.then.code,
    'HEURISTICS_GOD_CLASS_LARGE_CLASS_AST'
  );

  for (const rule of typescriptRules) {
    assert.equal(rule.platform, 'generic');
    if (
      rule.id === 'heuristics.ts.god-class-large-class.ast' ||
      rule.id === 'heuristics.ts.backend.controller-route-without-guard.ast' ||
      rule.id === 'heuristics.ts.backend.controller-route-without-roles.ast' ||
      rule.id === 'heuristics.ts.backend.auth-route-without-throttle.ast' ||
      rule.id === 'heuristics.ts.backend.event-handler-without-on-event.ast' ||
      rule.id === 'heuristics.ts.backend.persistence-mutation-without-audit-event.ast' ||
      rule.id === 'heuristics.ts.backend.sensitive-cache-write.ast' ||
      rule.id === 'heuristics.ts.backend.auth-response-without-refresh-token.ast' ||
      rule.id === 'heuristics.ts.backend.process-env-default-fallback.ast' ||
      rule.id === 'heuristics.ts.backend.direct-process-env-read.ast' ||
      rule.id === 'heuristics.ts.backend.config-module-without-validation.ast' ||
      rule.id === 'heuristics.ts.backend.hard-delete-without-soft-delete.ast' ||
      rule.id === 'heuristics.ts.backend.dto-property-without-validation.ast' ||
      rule.id === 'heuristics.ts.backend.dto-property-without-api-property.ast' ||
      rule.id === 'heuristics.ts.backend.dto-nested-property-without-nested-validation.ast' ||
      rule.id === 'heuristics.ts.backend.sensitive-data-logging.ast' ||
      rule.id === 'heuristics.ts.backend.log-without-context.ast' ||
      rule.id === 'heuristics.ts.backend.magic-number-literal.ast' ||
      rule.id === 'heuristics.ts.backend.generic-error-throw.ast' ||
      rule.id === 'heuristics.ts.backend.raw-throw-expression.ast' ||
      rule.id === 'heuristics.ts.backend.production-mock-or-spy.ast' ||
      rule.id === 'heuristics.ts.backend.error-stack-in-http-response.ast' ||
      rule.id === 'heuristics.ts.backend.inconsistent-error-response.ast' ||
      rule.id === 'heuristics.ts.backend.error-payload-success-status.ast' ||
      rule.id === 'heuristics.ts.backend.controller-entity-response.ast' ||
      rule.id === 'heuristics.ts.backend.anemic-domain-model.ast' ||
      rule.id === 'heuristics.ts.backend.permissive-cors.ast' ||
      rule.id === 'heuristics.ts.backend.missing-global-validation-pipe.ast' ||
      rule.id === 'heuristics.ts.backend.missing-compression-middleware.ast' ||
      rule.id === 'heuristics.ts.backend.missing-helmet-security-headers.ast' ||
      rule.id === 'heuristics.ts.backend.controller-business-logic.ast' ||
      rule.id === 'heuristics.ts.backend.repository-business-logic.ast' ||
      rule.id === 'heuristics.ts.backend.string-literal-union-enum.ast' ||
      rule.id === 'heuristics.ts.sensitive-token-in-url.ast'
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
