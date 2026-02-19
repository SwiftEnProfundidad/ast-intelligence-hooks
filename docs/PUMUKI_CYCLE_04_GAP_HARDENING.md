# PUMUKI Cycle 04 — Hardening de Gaps No Bloqueantes

## Objetivo
Cerrar de forma finita los gaps no bloqueantes detectados en ciclo 03, manteniendo comportamiento de gates estable y evidencia/métricas consistentes.

## Leyenda
- ✅ Completada
- 🚧 En progreso (solo una tarea activa)
- ⏳ Pendiente

## Regla Anti-Bucle (No Negociable)
- Cada tarea admite máximo `1` ejecución + `1` reintento controlado.
- Si vuelve a fallar, se documenta bloqueo con causa y siguiente acción.
- No se agregan fases/tareas nuevas durante la ejecución del ciclo 04.

## Alcance Inicial (derivado de ciclo 03)
- Gap 1: señal MCP `/status` (`evidence.exists`) consistente y no nula cuando la evidencia es válida.
- Gap 2: reducción de ruido por solape de reglas base + skills en findings.
- Gap 3: contrato operativo explícito para `PRE_PUSH/CI` basado en rango real de commits.

## Fase 0 — Arranque y Alcance
- ✅ C4-F0-T1: Crear documento del ciclo 04 y alinear tracking global.
- 🚧 C4-F0-T2: Congelar alcance exacto del ciclo 04 (entradas/salidas/límites/done).
- ⏳ C4-F0-T3: Publicar checkpoint único del ciclo 04 (comando + criterio de aceptación).

### Resultado C4-F0-T1 (Documento Creado)
- Documento creado: `docs/PUMUKI_CYCLE_04_GAP_HARDENING.md`.
- Scope inicial cargado con 3 gaps priorizados y regla de una sola tarea activa.

## Fase 1 — MCP Status Consistency
- ⏳ C4-F1-T1: Definir contrato esperado para `evidence.exists` en `/status`.
- ⏳ C4-F1-T2: Implementar corrección en runtime MCP sin romper payload existente.
- ⏳ C4-F1-T3: Validar endpoint (`/health`, `/status`, `/ai-evidence/*`) en mock con evidencia real.

## Fase 2 — Noise Control (Base + Skills)
- ⏳ C4-F2-T1: Definir criterio explícito de deduplicación/presentación de findings.
- ⏳ C4-F2-T2: Implementar ajuste sin perder trazabilidad por regla (`ruleId`, `source`).
- ⏳ C4-F2-T3: Revalidar conteos en `.ai_evidence.json` y MCP (`findings/rulesets/platforms`).

## Fase 3 — Commit Range Contract
- ⏳ C4-F3-T1: Documentar contrato operativo obligatorio para `PRE_PUSH/CI` con rango real.
- ⏳ C4-F3-T2: Ajustar runbook/checklist para evitar ejecuciones ambiguas.
- ⏳ C4-F3-T3: Verificar patrón final en mock (`clean/violations/mixed`) sin bucles.

## Fase 4 — Cierre
- ⏳ C4-F4-T1: Consolidar conclusiones del ciclo 04.
- ⏳ C4-F4-T2: Actualizar tracker global con cierre administrativo ciclo 04.
- ⏳ C4-F4-T3: Definir siguiente tarea activa (ciclo 05 o mantenimiento).
