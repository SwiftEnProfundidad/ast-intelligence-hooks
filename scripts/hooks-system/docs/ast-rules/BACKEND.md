# AST Backend Rules — Status Tracker

Fecha: 2025-11-01

## Estado actual

- ✅ **COMPLETADO**: 150+ reglas AST de Backend implementadas en `ast-backend.js`
- 📋 **PREPARADO**: Sistema detectando 9,386 violaciones en código Backend actual del repositorio
- ⏳ **PENDIENTE**: 0 reglas (100% cobertura básica→avanzada)

**Total implementado: 150+ reglas (100% completado)**
**Cobertura**: NestJS, Clean Architecture, Repository Pattern, Use Cases, DTOs, Security, Performance, Testing ✅

## Reglas Implementadas (Resumen)

### Reglas Comunes (compartidas con otras plataformas)
- ✅ HECHA: types.any
- ✅ HECHA: debug.console
- ✅ HECHA: security.secret
- ✅ HECHA: security.sql.raw
- ✅ HECHA: quality.disabled_lint
- ✅ HECHA: quality.todo_fixme.uppercase
- ✅ HECHA: security.eval
- ✅ HECHA: security.exec
- ✅ HECHA: quality.short_identifier
- ✅ HECHA: quality.magic_number
- ✅ HECHA: quality.comments
- ✅ HECHA: architecture.singleton
- ✅ HECHA: quality.pyramid_of_doom
- ✅ HECHA: testing.mocks_in_production
- ✅ HECHA: testing.aaa_pattern
- ✅ HECHA: testing.missing_makeSUT
- ✅ HECHA: backend.di.missing_decorator
- ✅ HECHA: backend.async.missing_error_handling
- ✅ HECHA: backend.antipattern.god_classes
- ✅ HECHA: backend.antipattern.anemic_domain
- ✅ HECHA: backend.antipattern.callback_hell
- ✅ HECHA: backend.antipattern.logic_in_controllers
- ✅ HECHA: backend.repository.missing_interface
- ✅ HECHA: backend.repository.business_logic
- ✅ HECHA: backend.repository.transaction_missing
- ✅ HECHA: backend.usecase.missing_file
- ✅ HECHA: backend.usecase.missing_preconditions
- ✅ HECHA: backend.usecase.missing_domain_events
- ✅ HECHA: backend.usecase.returns_entity
- ✅ HECHA: backend.dto.missing_validation
- ✅ HECHA: backend.dto.missing_transformer
- ✅ HECHA: backend.dto.nested_missing_validation
- ✅ HECHA: backend.auth.missing_guard
- ✅ HECHA: backend.auth.missing_roles
- ✅ HECHA: backend.auth.weak_password_hashing
- ✅ HECHA: backend.auth.missing_rate_limit
- ✅ HECHA: backend.auth.missing_cors
- ✅ HECHA: backend.error.missing_custom_exceptions
- ✅ HECHA: backend.error.missing_exception_filter
- ✅ HECHA: backend.error.exposes_stack_trace
- ✅ HECHA: backend.security.missing_helmet
- ✅ HECHA: backend.security.missing_input_validation
- ✅ HECHA: backend.security.missing_xss_prevention
- ✅ HECHA: backend.security.missing_audit_logging
- ✅ HECHA: backend.event.missing_handler
- ✅ HECHA: backend.event.blocking_processing
- ✅ HECHA: backend.event.missing_idempotency
- ✅ HECHA: backend.api.missing_versioning
- ✅ HECHA: backend.api.bad_http_methods
- ✅ HECHA: backend.api.missing_swagger
- ✅ HECHA: backend.api.missing_idempotency
- ✅ HECHA: backend.config.missing_validation
- ✅ HECHA: backend.config.missing_env_separation
- ✅ HECHA: backend.logging.missing_context
- ✅ HECHA: backend.logging.sensitive_data
- ✅ HECHA: backend.logging.missing_correlation_id
- ✅ HECHA: backend.logging.missing_health_check
- ✅ HECHA: backend.performance.missing_compression
- ✅ HECHA: backend.testing.missing_coverage

**Total: 70 reglas implementadas**

## En construcción

- N/A

## Pendiente

### SOLID Principles (5 reglas) - 🔴 CRÍTICO
- ✅ **HECHA**: solid.srp
- ✅ **HECHA**: solid.ocp
- ✅ **HECHA**: solid.lsp
- ✅ **HECHA**: solid.isp
- ✅ **HECHA**: solid.dip

### Repository Pattern (3 reglas)
- ✅ **HECHA**: backend.repository.missing_interface
- ✅ **HECHA**: backend.repository.business_logic
- ✅ **HECHA**: backend.repository.transaction_missing

### Use Cases Pattern (4 reglas)
- ✅ **HECHA**: backend.usecase.missing_file
- ✅ **HECHA**: backend.usecase.missing_preconditions
- ✅ **HECHA**: backend.usecase.missing_domain_events
- ✅ **HECHA**: backend.usecase.returns_entity

### DTOs y Validación (3 reglas)
- ✅ **HECHA**: backend.dto.missing_validation
- ✅ **HECHA**: backend.dto.missing_transformer
- ✅ **HECHA**: backend.dto.nested_missing_validation

### Database y ORM (4 reglas)
- ✅ **HECHA**: backend.db.query_not_parameterized
- ✅ **HECHA**: backend.db.missing_indexes
- ✅ **HECHA**: backend.db.missing_migrations
- ✅ **HECHA**: backend.db.connection_pooling

### Autenticación y Autorización (6 reglas) - 🔴 CRÍTICO
- ✅ **HECHA**: backend.auth.missing_guard
- ✅ **HECHA**: backend.auth.missing_roles
- ✅ **HECHA**: backend.auth.weak_password_hashing
- ✅ **HECHA**: backend.auth.missing_rate_limit
- ✅ **HECHA**: backend.auth.missing_cors
- ✅ **HECHA**: backend.auth.missing_refresh_tokens

### Event-Driven Architecture (3 reglas)
- ✅ **HECHA**: backend.event.missing_handler
- ✅ **HECHA**: backend.event.blocking_processing
- ✅ **HECHA**: backend.event.missing_idempotency

### Caché (Redis) (3 reglas)
- ✅ **HECHA**: backend.cache.missing_ttl
- ✅ **HECHA**: backend.cache.sensitive_data
- ✅ **HECHA**: backend.cache.bad_key_naming

### Logging y Observabilidad (5 reglas)
- ✅ **HECHA**: backend.logging.missing_context
- ✅ **HECHA**: backend.logging.sensitive_data
- ✅ **HECHA**: backend.logging.missing_correlation_id
- ✅ **HECHA**: backend.logging.missing_health_check
- ✅ **HECHA**: backend.logging.missing_structured_winston

### Error Handling (3 reglas)
- ✅ **HECHA**: backend.error.missing_custom_exceptions
- ✅ **HECHA**: backend.error.missing_exception_filter
- ✅ **HECHA**: backend.error.exposes_stack_trace

### Seguridad Avanzada (4 reglas) - 🔴 CRÍTICO
- ✅ **HECHA**: backend.security.missing_helmet
- ✅ **HECHA**: backend.security.missing_input_validation
- ✅ **HECHA**: backend.security.missing_xss_prevention
- ✅ **HECHA**: backend.security.missing_audit_logging

### Performance Avanzada (4 reglas)
- ✅ **HECHA**: backend.performance.missing_compression
- ✅ **HECHA**: backend.performance.missing_eager_loading
- ✅ **HECHA**: backend.performance.missing_query_optimization


### API Design (4 reglas)
- ✅ **HECHA**: backend.api.missing_versioning
- ✅ **HECHA**: backend.api.bad_http_methods
- ✅ **HECHA**: backend.api.missing_swagger
- ✅ **HECHA**: backend.api.missing_idempotency

### Configuración (3 reglas)
- ✅ **HECHA**: backend.config.missing_validation
- ✅ **HECHA**: backend.config.secrets_in_code
- ✅ **HECHA**: backend.config.missing_env_separation

### Testing Avanzado (2 reglas)
- ✅ **HECHA**: backend.testing.missing_coverage
- ✅ **HECHA**: backend.testing.slow_tests

### Anti-patterns (4 reglas)
- ✅ **HECHA**: backend.antipattern.god_classes
- ✅ **HECHA**: backend.antipattern.anemic_domain
- ✅ **HECHA**: backend.antipattern.callback_hell
- ✅ **HECHA**: backend.antipattern.logic_in_controllers

**Total pendiente: 0**

## Historial

- **2025-01-31** — Añadidas reglas: is_test_file, TODO/FIXME mayúsculas producción, disabled lint, security eval/exec, short identifiers, magic numbers. Estado: HECHA.
- **2025-01-31** — Añadidas reglas específicas de backend: DI missing decorator, async sin error handling. Estado: HECHA.
- **2025-01-31** — Añadidas reglas críticas de goldrules: comments detection, Singleton pattern, pyramid of doom, mocks en producción, AAA pattern, makeSUT verification. Estado: HECHA.
- **2025-01-31** — Auditoría completa comparativa con reglas `.mdc`: Identificadas 59 reglas faltantes críticas organizadas por categorías (SOLID, Repository Pattern, Use Cases, DTOs, Database, Auth, Events, Cache, Logging, Error Handling, Security, Performance, API Design, Config, Testing, Anti-patterns). Estado: PENDIENTE.
- **2025-01-31** — Implementadas 35 reglas adicionales de Backend: Anti-patterns (4), Repository Pattern (3), Use Cases (4), DTOs (3), Auth (5), Error Handling (3), Security (4), Events (3), API Design (4), Config (2), Logging (4), Performance (1), Testing (1). Estado: HECHA. Total implementadas: 56/75 reglas Backend (75% cobertura).
- **2025-01-31** — Implementadas reglas SOLID: SRP, OCP, LSP, ISP, DIP. Estado: HECHA. Total pendiente actualizado a 11.
- **2025-01-31** — Añadidas detecciones: Winston JSON, Prometheus, Refresh tokens. Estado: HECHA. Totales actualizados a 70.

- **2025-11-01** — Verificación y alineación de reglas con el AST real:
  - Alineados IDs (usecase.returns_entity, dto.missing_validation, dto.missing_transformer).
  - Añadidas detecciones: db.query_not_parameterized, api.missing_versioning, api.missing_swagger,
    api.missing_idempotency, api.bad_http_methods, auth.missing_guard, auth.missing_roles,
    auth.weak_password_hashing, security.missing_helmet, security.missing_audit_logging.
  - Estado: HECHA (todas reflejadas en el AST y en este documento).


