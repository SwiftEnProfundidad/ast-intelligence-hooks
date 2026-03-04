# AST Intelligence por Nodos (RFC + PoC)

Estado: implementado en modo incremental (issue `#616`).

## Objetivo

Evolucionar de validación heurística clásica a validación AST por nodos, multilenguaje y trazable desde reglas compiladas de skills.

## Alcance implementado (PoC v1)

- Modo dual de validación legacy + AST (`off/shadow/strict`).
- Comparación determinista por regla `skills.*` contra nodos `ast_nodes=[...]` compilados en runtime (`skills-ir:*`).
- Métricas de divergencia por ejecución:
  - `mapped_rules`
  - `divergences`
  - `false_positives`
  - `false_negatives`
  - `latency_ms`
  - `languages`
- Integración directa en gate de `PRE_COMMIT`, `PRE_PUSH`, `CI`.

PoC cubre lenguajes críticos ya usados en el runtime actual:

- TypeScript
- Swift

## Arquitectura objetivo (30/60/90)

### 0-30 días (P0)

- Consolidar modo dual como baseline estable:
  - `off`: desactivado.
  - `shadow`: compara y reporta sin bloquear.
  - `strict`: bloquea si hay divergencias.
- Mantener compatibilidad total con rulepacks existentes.
- Publicar métricas mínimas para auditoría de divergencias.

### 31-60 días (P1)

- Backends AST por lenguaje con extractor dedicado (TS/Swift/Kotlin en prioridad).
- Trazabilidad 1:1 `skill rule -> ast node -> finding`.
- Telemetría con series temporales de FP/FN por stage.

### 61-90 días (P2)

- Rollout gradual por porcentaje/repositorio.
- Políticas por stage para strict automático cuando FP/FN estén bajo umbral.
- Contratos de regresión multi-repo (fixtures enterprise).

## Contrato de compatibilidad (legacy + nuevo)

- El modo legacy sigue siendo la referencia de bloqueo por defecto.
- El modo AST entra en:
  - `shadow` para medir paridad.
  - `strict` para enforcement cuando la paridad sea aceptable.
- No se rompe compatibilidad con bundles/rules actuales; el modo dual usa la metadata runtime `skills-ir:*`.

## Rollout y rollback

### Rollout

1. Activar en `shadow`:

```bash
PUMUKI_AST_INTELLIGENCE_DUAL_MODE=shadow
```

2. Observar divergencias por stage/repositorio.
3. Promover a `strict` cuando divergencias y latencia estén dentro de umbral.

### Rollback inmediato

```bash
PUMUKI_AST_INTELLIGENCE_DUAL_MODE=off
```

## Umbrales recomendados para pasar a strict

- `false_positives` y `false_negatives` cerca de 0 de forma sostenida.
- `latency_ms` aceptable para hooks locales.
- Sin regresiones en `test:stage-gates`.

## Evidencia técnica de esta entrega

- Runtime:
  - `integrations/git/astIntelligenceDualValidation.ts`
  - `integrations/git/runPlatformGate.ts`
  - `integrations/git/runPlatformGateEvaluation.ts`
- Tests:
  - `integrations/git/__tests__/astIntelligenceDualValidation.test.ts`
  - `integrations/git/__tests__/runPlatformGateAstIntelligenceDualMode.test.ts`
  - `integrations/git/__tests__/runPlatformGateEvaluation.test.ts`
- Validación:
  - `npm run -s typecheck`
  - `npm run -s test:stage-gates`
