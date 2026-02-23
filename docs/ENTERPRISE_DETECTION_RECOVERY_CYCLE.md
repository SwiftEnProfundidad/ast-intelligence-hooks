# Enterprise Detection Recovery Cycle

Plan operativo unico para recuperar y superar legacy en deteccion real de violaciones, con enforcement estricto por stage y trazabilidad completa.

Estado del plan: `ACTIVO`

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
- Rama del ciclo: `feature/enterprise-detection-recovery`.
- Cierre esperado del ciclo: Git Flow end-to-end (`feature -> develop -> main`).

## Objetivo del ciclo
Garantizar `enterprise >= legacy` en deteccion de violaciones para cualquier repo con Pumuki instalado, eliminando caja negra y forzando reglas `AUTO` siempre ejecutables.

## Fase 0 - Arranque documental y baseline forense
- ✅ F0.T1 Crear este plan en `docs/ENTERPRISE_DETECTION_RECOVERY_CYCLE.md`.
- ✅ F0.T2 Sincronizar `docs/REFRACTOR_PROGRESS.md` con este ciclo como activo y una sola tarea en construccion.
- ✅ F0.T3 Publicar baseline comparativo inicial `legacy vs enterprise` (scope repo, misma entrada) en `docs/LEGACY_VS_ENTERPRISE_PARITY_REPORT.md`.

## Fase 1 - Recuperacion de detectores legacy common
- ✅ F1.T1 Inventariar reglas legacy `common.*` y `workflow.*` ausentes en runtime enterprise.
- ✅ F1.T2 Añadir rule pack enterprise para reglas legacy comunes con severidad canonica enterprise.
- ✅ F1.T3 Integrar detectores AST/texto equivalentes en pipeline `extractHeuristicFacts`.
- ✅ F1.T4 Asegurar trazabilidad por regla (`active -> evaluated -> matched`) sin `unsupported_auto`.

## Fase 2 - Enforcement estricto por stage
- ✅ F2.T1 Endurecer `PRE_WRITE` para bloquear por evidencia ausente/obsoleta/incoherente.
- ✅ F2.T2 Alinear semantica de `PRE_COMMIT`, `PRE_PUSH` y `CI` sin bypass de reglas activas.
- ✅ F2.T3 Reforzar preflight con causas accionables por bloqueo.
- ✅ F2.T4 Validar cobertura por stage (`unevaluated=0`, `unsupported_auto=0`) en modo gate.

## Fase 3 - Paridad-superioridad automatica
- ✅ F3.T1 Crear comparativa reproducible `legacy vs enterprise` con mismas rutas y alcance.
- ✅ F3.T2 Fijar criterio hard-block cuando `enterprise < legacy` por severidad.
- ✅ F3.T3 Publicar reporte `docs/LEGACY_VS_ENTERPRISE_PARITY_REPORT.md`.
- ✅ F3.T4 Confirmar notificacion macOS y reporte de menu opcion `1` con resultados reales.

## Fase 4 - TDD integral y cierre
- ✅ F4.T1 RED/GREEN/REFACTOR en config/gate/facts/evidence para nuevas reglas y detectores.
- ✅ F4.T2 Ejecutar pruebas tecnicas (`test:stage-gates`, `typecheck`) en verde.
- ✅ F4.T3 Auditoria full repo final y reporte consolidado de violaciones.
- 🚧 F4.T4 Cierre Git Flow end-to-end (`feature -> develop -> main`) y documentacion final.
