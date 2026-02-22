# All Skills AST Enforcement Cycle

Plan operativo unico para asegurar que Pumuki aplique SIEMPRE todas las skills del core con detectores AST reales, sin fallback declarativo silencioso.

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
- Rama del ciclo: `feature/all-skills-ast-enforcement`.
- Cierre esperado del ciclo: Git Flow end-to-end (`feature -> develop -> main`).

## Objetivo del ciclo
Garantizar que todas las reglas derivadas de skills se apliquen por plataforma y fichero en todos los stages (`PRE_COMMIT`, `PRE_PUSH`, `CI`) y en la opcion `1` del menu interactivo, con trazabilidad completa y sin caja negra.

## Fase 0 — Arranque y baseline del ciclo
- ✅ F0.T1 Crear este plan `docs/ALL_SKILLS_AST_ENFORCEMENT_CYCLE.md` con estructura oficial.
- ✅ F0.T2 Sincronizar tracker `docs/REFRACTOR_PROGRESS.md` y dejar una sola tarea activa del ciclo.
- ✅ F0.T3 Cerrar continuidad operativa del ciclo previo y declarar este como ciclo activo unico.

## Fase 1 — Contrato duro de integridad de skills
- ✅ F1.T1 RED: tests de integridad para fallar si existe regla `AUTO` sin detector AST mapeado.
- ✅ F1.T2 GREEN: eliminar fallback declarativo y exponer `unsupportedAutoRuleIds` en el ruleset de skills.
- ✅ F1.T3 GREEN: bloquear gate cuando existan reglas `AUTO` sin detector mapeado.
- ✅ F1.T4 REFACTOR: ajustar evidencia y mensajes accionables con detalle de reglas sin detector.

## Fase 2 — Cobertura real de reglas SOLID/SRP y God Class
- ✅ F2.T1 RED: tests de mapeo para reglas de skills SOLID/SRP/God Class.
- ✅ F2.T2 GREEN: ampliar mapeo de skills -> heuristics para SOLID/SRP/Clean Architecture.
- ✅ F2.T3 GREEN: introducir detector AST de God Class (>500 lineas en clases TS) y su rule preset.
- ✅ F2.T4 REFACTOR: unificar severidad y trazabilidad de nuevas detecciones.

## Fase 3 — Aplicacion por plataforma y fichero
- ✅ F3.T1 RED: tests multi-plataforma (backend + ios) aplicando reglas correctas por fichero.
- ✅ F3.T2 GREEN: reforzar filtros por plataforma detectada y scope de ruta/fichero.
- ✅ F3.T3 GREEN: asegurar misma semantica en `PRE_COMMIT`, `PRE_PUSH`, `CI` y menu opcion `1`.
- ✅ F3.T4 REFACTOR: limpiar contratos y utilidades de evaluacion por stage.

## Fase 4 — TDD end-to-end y validacion completa
- ✅ F4.T1 RED/GREEN/REFACTOR de suites `skillsRuleSet`, `runPlatformGateEvaluation`, `runPlatformGate`.
- ✅ F4.T2 Validacion funcional en menu opcion `1` y evidencia runtime con coverage consistente.
- ✅ F4.T3 Auditoria full-repo de Pumuki con skills activas y reporte por severidad.
- ✅ F4.T4 Cierre Git Flow end-to-end (`feature -> develop -> main`) con tracker final actualizado.

## Cierre del ciclo
- Merge `feature -> develop`: PR `#346`
- Merge `develop -> main`: PR `#347` (admin merge por policy de rama)

## Politica cerrada del ciclo
- No se permite una regla de skill `AUTO` sin detector AST.
- No se permite fallback declarativo silencioso para reglas `AUTO`.
- La aplicacion de reglas se decide por plataforma detectada y fichero compatible.
- Evidencia y menu deben mostrar trazabilidad suficiente para eliminar caja negra.
