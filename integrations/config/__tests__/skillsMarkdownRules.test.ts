import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { extractCompiledRulesFromSkillMarkdown } from '../skillsMarkdownRules';

test('normaliza reglas backend de SOLID/Clean Architecture/God Class a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
      '✅ Seguir Clean Architecture - Domain -> Application -> Infrastructure -> Presentation',
      '✅ No Singleton, en su lugar Inyección de Dependencias - NestJS DI container',
      '✅ Callback hell - usar async/await en lugar de callbacks anidados',
      '❌ God classes - Servicios que mezclan responsabilidades de dominio, aplicación, infraestructura, branching de tipos o contratos en una misma clase',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.backend.callback-hell-usar-async-await',
    'skills.backend.enforce-clean-architecture',
    'skills.backend.no-god-classes',
    'skills.backend.no-singleton',
    'skills.backend.no-solid-violations',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza try-catch silenciosos backend al guideline foundation canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Try-catch silenciosos - Siempre loggear o propagar',
  });

  assert.equal(rules.length, 1);
  assert.equal(
    rules[0]?.id,
    'skills.backend.guideline.backend.try-catch-silenciosos-siempre-loggear-o-propagar'
  );
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.equal(rules[0]?.platform, 'backend');
});

test('normaliza hardcoded values backend al guideline foundation canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Hardcoded values - Config en variables de entorno',
  });

  assert.equal(rules.length, 1);
  assert.equal(
    rules[0]?.id,
    'skills.backend.guideline.backend.hardcoded-values-config-en-variables-de-entorno'
  );
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.equal(rules[0]?.platform, 'backend');
});

test('normaliza magic numbers backend al guideline foundation canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Magic numbers - Usar constantes con nombres descriptivos',
  });

  assert.equal(rules.length, 1);
  assert.equal(
    rules[0]?.id,
    'skills.backend.guideline.backend.magic-numbers-usar-constantes-con-nombres-descriptivos'
  );
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.equal(rules[0]?.platform, 'backend');
});

test('normaliza mocks en producción backend al guideline foundation canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '❌ Mocks en producción - Usar fakes/spies de test; en runtime productivo, solo adaptadores y datos reales',
  });

  assert.equal(rules.length, 1);
  assert.equal(
    rules[0]?.id,
    'skills.backend.guideline.backend.mocks-en-produccion-usar-fakes-spies-de-test'
  );
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.equal(rules[0]?.platform, 'backend');
});

test('normaliza anemic domain models backend al guideline foundation canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '❌ Anemic domain models - Entidades con comportamiento, no solo getters/setters',
  });

  assert.equal(rules.length, 1);
  assert.equal(
    rules[0]?.id,
    'skills.backend.guideline.backend.anemic-domain-models-entidades-con-comportamiento'
  );
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.equal(rules[0]?.platform, 'backend');
});

test('normaliza lógica en controllers backend al guideline foundation canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '❌ Lógica en controllers - Mover lógica de negocio a casos de uso/servicios',
  });

  assert.equal(rules.length, 1);
  assert.equal(
    rules[0]?.id,
    'skills.backend.guideline.backend.logica-en-controllers-mover-logica-de-negocio-a-casos-de-uso-servicios'
  );
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.equal(rules[0]?.platform, 'backend');
});

test('normaliza regla frontend SOLID a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
    sourceContent: '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP) en componentes',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.frontend.no-solid-violations']);
});

test('normaliza regla frontend God Class a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
    sourceContent:
      '❌ God classes - Componentes que mezclan responsabilidades de dominio, aplicación, infraestructura, branching de tipos o contratos en una misma clase',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.frontend.no-god-classes']);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend/frontend de singleton a ids canonicos', () => {
  const backendRules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '✅ No Singleton, en su lugar Inyección de Dependencias - NestJS DI container',
  });

  assert.deepEqual(backendRules.map((rule) => rule.id), ['skills.backend.no-singleton']);
  assert.equal(backendRules.every((rule) => rule.evaluationMode === 'AUTO'), true);

  const frontendRules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
    sourceContent:
      '✅ No Singleton, en su lugar Inyección de Dependencias - Usar providers, context o DI containers',
  });

  assert.deepEqual(frontendRules.map((rule) => rule.id), ['skills.frontend.no-singleton']);
  assert.equal(frontendRules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend/frontend de callback hell a ids canonicos', () => {
  const backendRules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Callback hell - usar async/await en lugar de callbacks anidados',
  });

  assert.deepEqual(backendRules.map((rule) => rule.id), [
    'skills.backend.callback-hell-usar-async-await',
  ]);
  assert.equal(backendRules.every((rule) => rule.evaluationMode === 'AUTO'), true);

  const frontendRules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
    sourceContent: '✅ Callback hell - usar async/await en lugar de callbacks anidados',
  });

  assert.deepEqual(frontendRules.map((rule) => rule.id), [
    'skills.frontend.callback-hell-usar-async-await',
  ]);
  assert.equal(frontendRules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de transacciones a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ **Transacciones** - Para operaciones críticas',
      '✅ **Transacciones** - Para operaciones multi-tabla',
    ].join('\n'),
  });

  assert.deepEqual(
    rules.map((rule) => rule.id).sort(),
    [
      'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas',
      'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla',
    ]
  );
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza regla frontend class components a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
    sourceContent: '✅ **NO class components** - Solo functional components',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.frontend.no-class-components']);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de magic numbers a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Magic numbers - Usar constantes con nombres descriptivos',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de hardcoded values a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Hardcoded values - Config en variables de entorno',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.hardcoded-values-config-en-variables-de-entorno',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de no defaults en produccion a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ No defaults en producción - Fallar si falta config crítica',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de mocks en produccion a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Mocks en producción - solo datos reales',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.mocks-en-produccio-n-solo-datos-reales',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de exception filters a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Exception filters - Catch para manejo global',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.exception-filters-catch-para-manejo-global',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de guards a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Guards - UseGuards(JwtAuthGuard) para autenticación/autorización',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de interceptors a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Interceptors para logging/transformación - No en cada endpoint',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de datos sensibles en logs a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ No loggear datos sensibles - Passwords, tokens, PII',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de password hashing a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '❌ Password hashing - bcrypt con salt rounds >= 10',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.password-hashing-bcrypt-con-salt-rounds-10',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de rate limiting a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ **Rate limiting** - @nestjs/throttler para prevenir brute force',
      '✅ **Rate limiting** - throttler para prevenir abuse',
    ].join('\n'),
  });

  assert.deepEqual(
    rules.map((rule) => rule.id).sort(),
    [
      'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force',
      'skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse',
    ]
  );
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de winston a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ **Winston** - Logger estructurado (JSON logs)',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.winston-logger-estructurado-json-logs',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de loggear errores con contexto a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ **Loggear errores** - Con contexto completo',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.loggear-errores-con-contexto-completo',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas Android Use Cases a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Use Cases** - Lógica de negocio encapsulada',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas Android Repository pattern a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Repository pattern** - Abstraer acceso a datos',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas Android OrdersRep a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Repository pattern** - OrdersRep',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.repository-pattern-ordersrep',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de correlation ids a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ **Correlation IDs** - Para tracing distribuido',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de metricas prometheus a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ **Métricas Prometheus** - prom-client para métricas',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de cors a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ **CORS configurado** - Solo orígenes permitidos',
      '✅ **CORS** - Configurar orígenes permitidos',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id).sort(), [
    'skills.backend.guideline.backend.cors-configurado-solo-ori-genes-permitidos',
    'skills.backend.guideline.backend.cors-configurar-ori-genes-permitidos',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de validationpipe a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ **Pipes para validación global** - ValidationPipe en main.ts',
      '✅ **ValidationPipe global** - En main.ts con whitelist: true',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id).sort(), [
    'skills.backend.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts',
    'skills.backend.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de versionado a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Versionado - /api/v1/, /api/v2/',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.versionado-api-v1-api-v2',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza reglas backend de validation config a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Validation de config - Joi o class-validator para .env',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de class-validator y class-transformer a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ class-validator decorators - @IsString(), @IsEmail(), @Min(), @Max()',
      '✅ class-transformer - @Transform(), @Exclude(), @Expose()',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id).sort(), [
    'skills.backend.guideline.backend.class-transformer-transform-exclude-expose',
    'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza reglas backend de input validation a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Input validation - SIEMPRE validar con DTOs',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza reglas backend de nested validation a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Nested validation - @ValidateNested(), @Type()',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.nested-validation-validatenested-type',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza reglas backend de DTOs en boundaries a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ DTOs en boundaries - Validación en entrada/salida',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza reglas backend de DTOs separados a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ DTOs separados - CreateOrderDto, UpdateOrderDto, OrderResponseDto',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.dtos-separados-createorderdto-updateorderdto-orderresponsedto',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza reglas backend de retornar DTOs a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Retornar DTOs - No exponer entidades directamente',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza equivalentes backend/frontend de arquitectura a detectores canonicos existentes', () => {
  const backendRules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ **Controllers delgados** - Solo routing y validación, lógica en servicios',
      '✅ **Clean por feature** - presentation → application → domain, infrastructure → domain',
      '❌ **try-catch silenciosos** - Siempre loggear o propagar (AST: common.error.empty_catch)',
      '✅ **No logs en producción** - usar logger estructurado',
      '✅ **No any** - usar unknown y luego type guard',
      '✅ **Módulos cohesivos** - Un módulo por feature',
    ].join('\n'),
  });

  assert.deepEqual(backendRules.map((rule) => rule.id).sort(), [
    'skills.backend.avoid-explicit-any',
    'skills.backend.enforce-clean-architecture',
    'skills.backend.no-console-log',
    'skills.backend.no-empty-catch',
    'skills.backend.no-god-classes',
    'skills.backend.no-solid-violations',
  ]);
  assert.equal(backendRules.every((rule) => rule.evaluationMode === 'AUTO'), true);

  const frontendRules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
    sourceContent: [
      '✅ **Componentes pequeños, reutilizables, single responsibility**',
      '✅ **Clean Architecture y Clean Code** - dependencias hacia adentro',
      '✅ **No catch vacíos** - Prohibido silenciar errores',
      '✅ **No any** - Usar unknown si el tipo es desconocido, luego type guard',
    ].join('\n'),
  });

  assert.deepEqual(frontendRules.map((rule) => rule.id).sort(), [
    'skills.frontend.avoid-explicit-any',
    'skills.frontend.enforce-clean-architecture',
    'skills.frontend.no-empty-catch',
    'skills.frontend.no-solid-violations',
  ]);
  assert.equal(frontendRules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('aplica stage canónico PRE_PUSH para no-solid-violations cuando markdown no define stage', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id, 'skills.backend.no-solid-violations');
  assert.equal(rules[0]?.stage, 'PRE_PUSH');
});

test('normaliza SOLID iOS a regla canonica bloqueante desde PRE_WRITE', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-guidelines',
    sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
    sourceContent: '✅ **Verificar que NO viole SOLID** (SRP, OCP, LSP, ISP, DIP)',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id, 'skills.ios.no-solid-violations');
  assert.equal(rules[0]?.platform, 'ios');
  assert.equal(rules[0]?.stage, 'PRE_WRITE');
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('respeta stage explícito en markdown para no-solid-violations', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '✅ PRE_COMMIT: Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id, 'skills.backend.no-solid-violations');
  assert.equal(rules[0]?.stage, 'PRE_COMMIT');
});

test('normaliza reglas SwiftUI modernas a ids canonicos de snapshot phase 2', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swiftui-expert-guidelines',
    sourcePath: 'docs/codex-skills/swiftui-expert-skill.md',
    sourceContent: [
      '✅ Always use foregroundStyle() instead of foregroundColor().',
      '✅ Always use clipShape(.rect(cornerRadius:)) instead of cornerRadius().',
      '✅ For iOS 18 and later, prefer the Tab API over tabItem().',
      '✅ Use .scrollIndicators(.hidden) modifier instead of showsIndicators: false.',
      '✅ Use .sheet(item:) instead of .sheet(isPresented:) for model-based content.',
      '✅ Use onChange(of:) { old, new in } or onChange(of:) { } instead of legacy single-parameter closures.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-corner-radius',
    'skills.ios.no-foreground-color',
    'skills.ios.no-legacy-onchange',
    'skills.ios.no-scrollview-shows-indicators',
    'skills.ios.no-sheet-is-presented',
    'skills.ios.no-tab-item',
  ]);
});

test('normaliza reglas SwiftUI state ownership a ids canonicos del slice phase6', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swiftui-expert-guidelines',
    sourcePath: 'docs/codex-skills/swiftui-expert-skill.md',
    sourceContent: [
      '- **Never declare passed values as `@State` or `@StateObject`** (they only accept initial values)',
      '- Use `@State` with `@Observable` classes (not `@StateObject`)',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-legacy-swiftui-observable-wrapper',
    'skills.ios.no-passed-value-state-wrapper',
  ]);
});

test('normaliza reglas SwiftUI state visibility a ids canonicos del slice phase6b', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swiftui-expert-guidelines',
    sourcePath: 'docs/codex-skills/swiftui-expert-skill.md',
    sourceContent: [
      '- Always mark `@State` and `@StateObject` as private to make dependencies clear.',
      '- Mark state wrappers as private so ownership stays explicit.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.guideline.ios-swiftui-expert.always-mark-state-and-stateobject-as-private-makes-dependencies-clear',
  ]);
});

test('normaliza reglas SwiftUI list/search/layout a ids canonicos del slice phase7', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swiftui-expert-guidelines',
    sourcePath: 'docs/codex-skills/swiftui-expert-skill.md',
    sourceContent: [
      '- Use stable identity for `ForEach` (never `.indices` for dynamic content)',
      '- Use `localizedStandardContains()` for user-input filtering (not `contains()`)',
      '- Avoid layout thrash (deep hierarchies, excessive `GeometryReader`)',
      '- Use `bold()` instead of `fontWeight(.bold)` for straightforward text emphasis.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-contains-user-filter',
    'skills.ios.no-font-weight-bold',
    'skills.ios.no-foreach-indices',
    'skills.ios.no-geometryreader',
  ]);
});

test('normaliza reglas Core Data a ids canonicos del slice phase8', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-core-data-guidelines',
    sourcePath: 'docs/codex-skills/core-data-expert.md',
    sourceContent: [
      '- ✅ Keep Core Data orchestration inside infrastructure or repository layers instead of presentation code.',
      '- ✅ Keep SwiftData orchestration inside infrastructure or repository layers instead of application or presentation code.',
      '- ❌ Leaking context-scoped managed objects into SwiftUI state or view models.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-core-data-layer-leak',
    'skills.ios.no-nsmanagedobject-state-leak',
    'skills.ios.no-swiftdata-layer-leak',
  ]);
});

test('normaliza reglas Swift Concurrency a ids canonicos del slice phase9', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-concurrency-guidelines',
    sourcePath: 'docs/codex-skills/swift-concurrency.md',
    sourceContent: [
      '- ✅ Avoid `@preconcurrency` in production code without a documented safety invariant and a removal ticket.',
      '- ✅ Avoid `nonisolated(unsafe)` in production code without a documented safety invariant and a removal ticket.',
      '- ✅ Prefer explicit actor isolation or `await MainActor.run` instead of `MainActor.assumeIsolated`.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-assume-isolated',
    'skills.ios.no-nonisolated-unsafe',
    'skills.ios.no-preconcurrency',
  ]);
});

test('normaliza reglas Swift Testing async a ids canonicos del slice phase4', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swift-testing-guidelines',
    sourcePath: 'docs/codex-skills/swift-testing-expert.md',
    sourceContent: [
      '✅ Prefer await fulfillment(of:) over wait(for:) and waitForExpectations(timeout:) in async XCTest migration paths.',
      '✅ Prefer confirmation over expectation(description:) scaffolding when modern Swift Testing flow is available.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-legacy-expectation-description',
    'skills.ios.no-wait-for-expectations',
  ]);
});

test('normaliza reglas Swift Testing de suites a ids canonicos del slice phase5', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swift-testing-guidelines',
    sourcePath: 'docs/codex-skills/swift-testing-expert.md',
    sourceContent: [
      '- ✅ Prefer `@Test` functions over `test...` methods when the target already supports Swift Testing.',
      '- ❌ Mixing legacy XCTest style into new Swift Testing suites without an explicit compatibility reason.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-mixed-testing-frameworks',
    'skills.ios.prefer-swift-testing',
  ]);
});

test('normaliza equivalentes iOS seguros a detectores canonicos existentes', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-enterprise-guidelines',
    sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
    sourceContent: [
      '✅ **No force unwrapping (!)** - Casi nunca usar ! (excepción: IBOutlets)',
      '✅ **XCTest** - Solo para proyectos legacy o UI tests',
      '❌ New XCTest-only unit tests when Swift Testing is available.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-force-unwrap',
    'skills.ios.prefer-swift-testing',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza force unwrap Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Null safety** - NO !! (force unwrap), usar ?, ?:, let, requireNotNull',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.no-force-unwrap']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Timber Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Timber** - Logging library',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.guideline.android.timber-logging-library']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Analytics Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Analytics** - Firebase Analytics o custom',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.analytics-firebase-analytics-o-custom',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Android Profiler Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Android Profiler** - CPU, Memory, Network profiling',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza no logs en produccion Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **NO logs en producción** - if (BuildConfig.DEBUG) Log.d()',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.no-console-log']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Timber Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Timber** - Logging library',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.guideline.android.timber-logging-library']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza BuildConfig Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **BuildConfig** - Constantes en tiempo de compilación',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Touch targets Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Touch targets** - mínimo 48dp',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.touch-targets-mi-nimo-48dp',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza reglas Android SOLID y Clean Architecture a ids canonicos existentes', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: [
      '✅ **Verificar que NO viole SOLID** (SRP, OCP, LSP, ISP, DIP)',
      '✅ **Seguir Clean Architecture** - Domain → Data → Presentation',
      '✅ **Clean por feature** - presentation → application → domain, data → domain',
    ].join('\n'),
  });

  assert.deepEqual(
    rules.map((rule) => rule.id).sort(),
    ['skills.android.enforce-clean-architecture', 'skills.android.no-solid-violations']
  );
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
  assert.equal(rules.every((rule) => rule.stage === 'PRE_PUSH'), true);
});

test('normaliza hardcoded strings Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **Hardcoded strings** - Usar strings.xml',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.hardcoded-strings-usar-strings-xml']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza strings.xml localizado Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Localization** - strings.xml por idioma (values-es, values-en)',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza no singleton Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **No Singleton** - Usar Inyección de Dependencias (Hilt/Dagger)',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.no-singleton-usar-inyeccio-n-de-dependencias-hilt-dagger',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Hilt Android a detectores canonicos existentes', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: [
      '✅ **Hilt** - com.google.dagger:hilt-android',
      '✅ **Hilt** - DI framework (NO manual factories)',
      '✅ **@HiltAndroidApp** - Application class',
      '✅ **@AndroidEntryPoint** - Activity, Fragment, ViewModel',
      '✅ **@Inject constructor** - Constructor injection',
      '✅ **@Module + @InstallIn** - Provide dependencies',
      '✅ **@ViewModelScoped** - Para dependencias de ViewModel',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.androidentrypoint-activity-fragment-viewmodel',
    'skills.android.guideline.android.hilt-com-google-dagger-hilt-android',
    'skills.android.guideline.android.hilt-di-framework-no-manual-factories',
    'skills.android.guideline.android.hiltandroidapp-application-class',
    'skills.android.guideline.android.inject-constructor-constructor-injection',
    'skills.android.guideline.android.module-installin-provide-dependencies',
    'skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza viewModelScope Android a detectores canonicos existentes', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: [
      '✅ **viewModelScope** - Scope de ViewModel, cancelado automáticamente',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza WorkManager Android a detectores canonicos existentes', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: [
      '✅ **WorkManager** - androidx.work:work-runtime-ktx',
      '✅ **WorkManager** - Background tasks',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx',
    'skills.android.guideline.android.workmanager-background-tasks',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza Binds Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: ['✅ **@Binds** - Para implementaciones de interfaces (más eficiente)'].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza Provides Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: ['✅ **@Provides** - Para interfaces o third-party'].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.provides-para-interfaces-o-third-party',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza version catalogs Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Version catalogs** - libs.versions.toml para dependencias',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza androidTest Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **androidTest** - Instrumented tests (Device/Emulator)',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Plurals Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Plurals** - values/plurals.xml',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.plurals-values-plurals-xml',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza reglas Android de testing estructurado a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: [
      '✅ **AAA pattern** - Arrange, Act, Assert',
      '✅ **Given-When-Then** - BDD style',
      '✅ **test/** - Unit tests (JVM)',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.aaa-pattern-arrange-act-assert',
    'skills.android.guideline.android.given-when-then-bdd-style',
    'skills.android.guideline.android.test-unit-tests-jvm',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza Compose Android a detectores canonicos existentes', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: [
      '✅ **Composable functions** - @Composable para UI',
      '✅ **Arguments** - Pasar datos entre pantallas',
      '✅ **Theme** - Color scheme, typography, shapes',
      '✅ **Accessibility** - semantics, contentDescription',
      '✅ **Text scaling** - Soportar font scaling del sistema',
      '✅ **contentDescription** - Para imágenes y botones',
      '✅ **TalkBack** - Screen reader de Android',
      '❌ **God Activities** - Single Activity + Composables',
      '✅ **Single Activity** - Múltiples Composables/Fragments, no Activities',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.accessibility-semantics-contentdescription',
    'skills.android.guideline.android.arguments-pasar-datos-entre-pantallas',
    'skills.android.guideline.android.composable-functions-composable-para-ui',
    'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones',
    'skills.android.guideline.android.god-activities-single-activity-composables',
    'skills.android.guideline.android.single-activity-mu-ltiples-composables-fragments-no-activities',
    'skills.android.guideline.android.talkback-screen-reader-de-android',
    'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema',
    'skills.android.guideline.android.theme-color-scheme-typography-shapes',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza Adaptive layouts Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Adaptive layouts** - Responsive design (WindowSizeClass)',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Analizar estructura existente Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Analizar estructura existente** - Módulos, interfaces, dependencias, Gradle',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Dark theme Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Dark theme** - Soportar desde día 1 (isSystemInDarkTheme())',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Java en codigo nuevo Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: [
      '❌ **Java en código nuevo** - Solo Kotlin',
      '✅ **NO Java en código nuevo** - Kotlin para todo',
    ].join('\n'),
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.no-java-new-code']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza AsyncTask Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **AsyncTask** - Deprecated, usar Coroutines',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.asynctask-deprecated-usar-coroutines']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza coroutines async-await sin callbacks Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **Coroutines** - async/await, NO callbacks',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.coroutines-async-await-no-callbacks',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza async/await paralelismo Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **async/await** - Paralelismo',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.async-await-paralelismo',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza suspend functions Android API service a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **suspend functions** - En API service',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.suspend-functions-en-api-service',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza suspend functions Android async a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **suspend functions** - Para operaciones async',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.suspend-functions-para-operaciones-async',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza DAO Android con suspend functions a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **@Dao** - Data Access Objects con suspend functions',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.dao-data-access-objects-con-suspend-functions',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Transaction Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **@Transaction** - Para operaciones multi-query',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.transaction-para-operaciones-multi-query',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza StateFlow Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **StateFlow** - Estado mutable observable',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.stateflow-estado-mutable-observable',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza SharedFlow Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **SharedFlow** - Hot stream, puede no tener valor, para eventos',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Flow builders Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Flow builders** - flow { emit() }, flowOf(), asFlow()',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.flow-builders-flow-emit-flowof-asflow',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza collect Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **collect** - Terminal operator para consumir Flow',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza collectAsState Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **collectAsState** - Consumir Flow en Compose',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza remember Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **remember** - Evitar recrear objetos',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.remember-evitar-recrear-objetos',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza remember state retention Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **remember** - Para mantener estado entre recomposiciones',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza derivedStateOf Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **derivedStateOf** - Cálculos caros solo cuando cambia input',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza derivedStateOf derivado de state Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **derivedStateOf** - Cálculos derivados de state',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza LaunchedEffect Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **LaunchedEffect** - Side effects con lifecycle',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza LaunchedEffect keys Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **LaunchedEffect keys** - Controlar cuándo se relanza effect',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza DisposableEffect Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **DisposableEffect** - Cleanup cuando Composable sale de composición',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Preview Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Preview** - @Preview para ver UI sin correr app',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Recomposition Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Recomposition** - Composables deben ser idempotentes',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza state hoisting Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **State hoisting** - Elevar estado al nivel apropiado',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza UiState Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **UiState** - Loading, Success, Error states',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza single source of truth Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Single source of truth** - ViewModel es la fuente',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza App startup Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **App startup** - androidx.startup para lazy init',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Baseline Profiles Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Baseline Profiles** - Optimización de startup',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Skip recomposition Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Skip recomposition** - Parámetros inmutables o estables',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Stability Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **Stability** - Composables estables recomponen menos',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.stability-composables-estables-recomponen-menos',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza String formatting Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **String formatting** - %1$s, %2$d para argumentos',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza ViewModel Android a detectores canonicos existentes', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **ViewModel** - AndroidX Lifecycle ViewModel',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza ViewModel configuracion Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **ViewModel** - Sobrevive cambios de configuración',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.viewmodel-sobrevive-configuration-changes',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza findViewById Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **findViewById** - View Binding o Compose',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.findviewbyid-view-binding-o-compose']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza RxJava Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **RxJava** - Usar Flow en nuevo código',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.rxjava-new-code']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza Dispatchers Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **Dispatchers** - Main (UI), IO (network/disk), Default (CPU)',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.dispatchers-main-ui-io-network-disk-default-cpu',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza withContext Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **withContext** - Cambiar dispatcher',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.android.withcontext-change-dispatcher']);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza supervisorScope Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '✅ **supervisorScope** - Errores no cancelan otros jobs',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('normaliza try-catch Android a detector canonico existente', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'android-guidelines',
    sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
    sourceContent: '❌ **try-catch** - Manejo de errores en coroutines',
  });

  assert.deepEqual(rules.map((rule) => rule.id), [
    'skills.android.try-catch-manejo-de-errores-en-coroutines',
  ]);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
});

test('reglas no canonicas extraidas desde markdown se degradan a DECLARATIVE para evitar AUTO no mapeado', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '- Must review deployment budget notes before release.',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id.startsWith('skills.backend.guideline.'), true);
  assert.equal(rules[0]?.evaluationMode, 'DECLARATIVE');
});

test('reglas no canonicas con nodos AST explicitos se compilan como AUTO con astNodeIds dinámicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '- Must enforce complex transaction boundary safety with AST nodes (`heuristics.ts.explicit-any.ast`) and (`heuristics.ts.empty-catch.ast`).',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.deepEqual(rules[0]?.astNodeIds, [
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.explicit-any.ast',
  ]);
});

test('skills estructurales de las cuatro plataformas no expresan God/Massive como umbral de lineas', () => {
  const skillPaths = [
    'docs/codex-skills/ios-enterprise-rules.md',
    'docs/codex-skills/android-enterprise-rules.md',
    'docs/codex-skills/backend-enterprise-rules.md',
    'docs/codex-skills/frontend-enterprise-rules.md',
    'vendor/skills/ios-enterprise-rules/SKILL.md',
    'vendor/skills/android-enterprise-rules/SKILL.md',
    'vendor/skills/backend-enterprise-rules/SKILL.md',
    'vendor/skills/frontend-enterprise-rules/SKILL.md',
  ];

  const forbiddenStructuralThreshold =
    /\b(?:god classes?|god activities|massive view controllers?)\b[^\n]*(?:[<>]=?\s*\d+|\d+\s*(?:lines|lineas|lineas|líneas))/iu;

  const offenders = skillPaths.flatMap((relativePath) => {
    const content = readFileSync(join(process.cwd(), relativePath), 'utf8');
    return content
      .split('\n')
      .map((line, index) => ({ line, lineNumber: index + 1, relativePath }))
      .filter(({ line }) => forbiddenStructuralThreshold.test(line))
      .map(({ line, lineNumber, relativePath }) => `${relativePath}:${lineNumber}: ${line.trim()}`);
  });

  assert.deepEqual(offenders, []);
});
