# PUMUKI Cycle 03 — Validación Enterprise con SDD Activo

## Objetivo
Ejecutar un ciclo completo y finito de validación en mock consumer con sesión SDD activa para verificar detección real de reglas AST por plataforma (`android/backend/ios/web`) sin short-circuit por política SDD.

## Leyenda
- ✅ Completada
- 🚧 En progreso (solo una tarea activa)
- ⏳ Pendiente

## Regla Anti-Bucle (No Negociable)
- Cada tarea admite máximo `1` ejecución + `1` reintento controlado.
- Si vuelve a fallar, se documenta bloqueo con causa y siguiente acción, y no se itera en bucle.
- No se agregan fases/tareas nuevas durante la ejecución del ciclo 03.

## Criterio de Salida del Ciclo
- Gates con sesión SDD activa evaluando reglas de plataforma (sin bloqueo temprano `SDD_SESSION_MISSING`).
- `.ai_evidence.json` y MCP (`status/summary/findings/rulesets/platforms/ledger`) coherentes con ejecución real.
- Matriz `clean/violations/mixed` estable bajo flujo SDD activo.
- Cierre documental completo en este ciclo y en `docs/REFRACTOR_PROGRESS.md`.

## Fase 0 — Arranque y Alcance
- ✅ C3-F0-T1: Crear documento de ciclo 03 y alinear tracking global.
- 🚧 C3-F0-T2: Congelar alcance del ciclo (entradas/salidas/límites/done) para SDD activo.
- ⏳ C3-F0-T3: Publicar checkpoint único del ciclo 03 (comando + criterio de aceptación).

## Fase 1 — Baseline SDD Activo en Mock
- ⏳ C3-F1-T1: Verificar baseline limpia del mock consumer antes de abrir sesión SDD.
- ⏳ C3-F1-T2: Abrir sesión SDD válida y registrar contexto de cambio.
- ⏳ C3-F1-T3: Confirmar baseline operativa con SDD activo (sin drift).

## Fase 2 — Gates de Plataforma con SDD Activo
- ⏳ C3-F2-T1: Ejecutar `scenario:clean` con SDD activo y validar salida esperada.
- ⏳ C3-F2-T2: Ejecutar `scenario:violations` con SDD activo y validar detección multi-plataforma.
- ⏳ C3-F2-T3: Ejecutar `scenario:mixed` con SDD activo y validar severidades/outcomes esperados.

## Fase 3 — Evidencia + MCP (Cobertura Completa)
- ⏳ C3-F3-T1: Verificar `.ai_evidence.json` con findings de plataforma (no solo policy SDD).
- ⏳ C3-F3-T2: Verificar MCP con facetas no vacías para plataformas/rulesets/findings.
- ⏳ C3-F3-T3: Registrar gaps, FP y FN observados con SDD activo.

## Fase 4 — Cierre
- ⏳ C3-F4-T1: Consolidar conclusiones del ciclo 03.
- ⏳ C3-F4-T2: Actualizar tracker global con cierre administrativo ciclo 03.
- ⏳ C3-F4-T3: Definir siguiente tarea activa (ciclo 04 o mantenimiento).
