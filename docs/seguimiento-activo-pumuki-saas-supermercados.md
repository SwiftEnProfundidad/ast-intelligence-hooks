# Plan Activo Pumuki SAAS Supermercados

## Leyenda

- ✅ Cerrado
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Objetivo

- Resolver e implementar bugs y mejoras reportados en:
  - `/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md`
- Mantener trazabilidad: hallazgo -> fix -> test -> release notes.

## Fase 0. Intake y priorizacion

- ✅ Consolidar hallazgos y deduplicar causas raiz del MD canónico.
- ✅ Priorizar por impacto inicial:
  - P1: `PUMUKI-001`, `PUMUKI-003`, `PUMUKI-005`, `PUMUKI-007`
  - P2: `PUMUKI-002`, `PUMUKI-004`, `PUMUKI-006`

## Fase 1. Bugs P1 (ejecucion tecnica)

- ✅ PUMUKI-001: Compatibilidad de receipt MCP entre stages (`PRE_WRITE` vs `PRE_COMMIT`) sin bloqueo falso.
- ✅ PUMUKI-003: Endurecer resolución de binarios en hooks/scripts para evitar `command not found`.
- ✅ PUMUKI-005: Soporte robusto para repos con `:` en path (evitar dependencia frágil de PATH).
- ✅ PUMUKI-007: Soportar repos sin commits (`HEAD` ausente) sin error ambiguo.

## Fase 2. Mejoras P2

- 🚧 PUMUKI-002: Rule-pack opcional de atomicidad Git + trazabilidad de commit message.
- ✅ PUMUKI-004: Mejorar diagnóstico de hooks efectivos en escenarios versionados/custom.
- ✅ PUMUKI-006: Alinear `package_version` reportada por MCP con versión local efectiva del repo consumidor.

## Fase 2.1 Nuevos hallazgos (iteración SAAS_SUPERMERCADOS)

- ⏳ PUMUKI-008: Feedback iterativo en chat no equivalente a flujo legacy.
  - Evidencia: en ejecución MCP no aparece feedback operativo por iteración del modelo como en el grafo legacy.
  - Esperado: resumen corto en cada iteración (`stage`, `decision`, `next_action`) para user/dev.
- ⏳ PUMUKI-009: Desalineación operativa entre `ai_gate_check` y `pre_flight_check`.
  - Evidencia: `ai_gate_check => BLOCKED (EVIDENCE_STALE)` mientras `pre_flight_check => allowed=true`.
  - Esperado: criterio homogéneo o explicación explícita de por qué uno bloquea y el otro permite.
- ⏳ PUMUKI-010: Respuesta no accionable en `auto_execute_ai_start` para confianza media.
  - Evidencia: `success=true`, `action=ask`, `message=Medium confidence (undefined%)...`.
  - Esperado: `next_action` determinista + confidence numérico consistente + remediación concreta.

## Fase 3. Cierre

- ⏳ Ejecutar suite de tests de regresión afectada.
- ⏳ Actualizar `CHANGELOG.md` y `docs/RELEASE_NOTES.md` con fixes reales.
- ⏳ Publicar versión cuando las tareas en construcción/pending críticas estén cerradas.
