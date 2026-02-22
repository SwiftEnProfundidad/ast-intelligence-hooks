# Enterprise Rule Coverage Cycle

Plan operativo unico para el nuevo ciclo enterprise de cobertura real de reglas.

Estado del plan: `CERRADO`

## Leyenda
- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Reglas de seguimiento
- Este es el unico MD de plan activo para este ciclo.
- Solo puede haber una tarea en `🚧`.
- Cada tarea cerrada pasa a `✅` y se activa la siguiente `🚧`.
- Nomenclatura obligatoria: `F{fase}.T{n}`.

## Objetivo del ciclo
Eliminar falsos verdes en auditoria garantizando trazabilidad completa por stage:
`regla activa -> regla evaluada -> regla matcheada`.

## Fase 1 — Instrumentacion de cobertura de reglas
- ✅ F1.T1 Inventariar fuente unica de reglas activas por stage (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- ✅ F1.T2 Capturar `evaluated_rule_ids` durante evaluacion de reglas.
- ✅ F1.T3 Calcular `unevaluated_rule_ids = active - evaluated` de forma determinista.
- ✅ F1.T4 Exponer contrato runtime estable de cobertura por stage sin romper contratos existentes.

## Fase 2 — Persistencia en evidencia
- ✅ F2.T1 Extender schema/tipos de evidencia con `snapshot.rules_coverage`.
- ✅ F2.T2 Persistir arrays ordenadas y deduplicadas con `counts` por stage.
- ✅ F2.T3 Garantizar compatibilidad backward para evidencia historica sin `rules_coverage`.

## Fase 3 — Enforcement bloqueante
- ✅ F3.T1 Emitir finding `governance.rules.coverage.incomplete` cuando existan reglas activas no evaluadas.
- ✅ F3.T2 Aplicar severidad `HIGH` con bloqueo en `PRE_COMMIT`, `PRE_PUSH` y `CI`.
- ✅ F3.T3 Incluir mensaje accionable con `unevaluated_rule_ids` y `coverage_ratio`.

## Fase 4 — TDD end-to-end
- ✅ F4.T1 RED/GREEN/REFACTOR de motor de cobertura (unit tests).
- ✅ F4.T2 RED/GREEN/REFACTOR de evidencia y persistencia (`rules_coverage`).
- ✅ F4.T3 RED/GREEN/REFACTOR de stage policies para bloqueo por cobertura incompleta.
- ✅ F4.T4 Matriz e2e `happy/sad/edge` determinista con staging y escenarios de compatibilidad.

## Fase 5 — Cierre de ciclo
- ✅ F5.T1 Actualizar documentacion tecnica impactada (`USAGE`, `API_REFERENCE`, `evidence-v2.1`, etc.).
- ✅ F5.T2 Ejecutar validacion final (tests + typecheck) y consolidar evidencia de cierre.
- ✅ F5.T3 Cierre Git Flow end-to-end: commits atomicos, PR a `develop`, merge y sync `develop -> main`.

## Politica cerrada del ciclo
- Bloqueo por cobertura incompleta en: `PRE_COMMIT`, `PRE_PUSH`, `CI`.
- Severidad del bloqueo: `HIGH`.
- Fuera de alcance: rediseño UX de menu legacy++ (se tratara en ciclo posterior).

## Cierre
- Ciclo completado con contrato de cobertura de reglas estable en runtime/evidence.
- `main` y `develop` sincronizadas en remoto (`origin/main...origin/develop = 0 0`).
