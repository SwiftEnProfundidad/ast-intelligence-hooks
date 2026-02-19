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
- ✅ C3-F0-T2: Congelar alcance del ciclo (entradas/salidas/límites/done) para SDD activo.
- ✅ C3-F0-T3: Publicar checkpoint único del ciclo 03 (comando + criterio de aceptación).

### Alcance Congelado (C3-F0-T2)
- Entradas obligatorias:
  - `ast-intelligence-hooks` en baseline limpia y rama operativa sincronizada.
  - `pumuki-mock-consumer` disponible y limpio para ejecutar escenarios.
  - sesión SDD activa y válida antes de evaluar gates de plataforma.
- Salidas obligatorias:
  - evidencia de ejecución con findings de plataforma en `.ai_evidence.json` (sin short-circuit SDD).
  - validación MCP consistente sobre `status/summary/findings/rulesets/platforms/ledger`.
  - cierre documental del ciclo 03 en este documento y `docs/REFRACTOR_PROGRESS.md`.
- Límites (fuera de alcance del ciclo 03):
  - cambios de arquitectura de Pumuki no necesarios para validación.
  - añadir nuevos rule packs o cambiar semántica de reglas AST.
  - depender de CI remota para declarar éxito del ciclo.
- Definición exacta de done del ciclo 03:
  - fases `C3-F0..C3-F4` en `✅` o bloqueo explícito documentado.
  - una única tarea `🚧` visible en todo momento.
  - evidencia final coherente entre consola, `.ai_evidence.json` y MCP.

### Checkpoint Único del Ciclo 03 (C3-F0-T3)
- Fecha de checkpoint: `2026-02-27`.
- Comando único de checkpoint:
  - `cd /Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer && npm install --save-exact pumuki@latest && npx pumuki install && npx pumuki sdd session --open --change=cycle-03-sdd-active-checkpoint && npm run pumuki:matrix`
- Criterio de aceptación del checkpoint:
  - no aparece `SDD_SESSION_MISSING` en la ejecución.
  - `clean`: `pre-commit=0`, `pre-push=0`, `ci=0`.
  - `violations`: `pre-commit=1`, `pre-push=1`, `ci=1`.
  - `mixed`: `pre-commit=1`, `pre-push=1`, `ci=1`.
  - `.ai_evidence.json` contiene findings de plataforma (`apps/android|backend|ios|web`) en `violations`/`mixed`.
  - salida final contiene `All scenario matrix checks passed`.

## Fase 1 — Baseline SDD Activo en Mock
- ✅ C3-F1-T1: Verificar baseline limpia del mock consumer antes de abrir sesión SDD.
- 🚧 C3-F1-T2: Abrir sesión SDD válida y registrar contexto de cambio.
- ⏳ C3-F1-T3: Confirmar baseline operativa con SDD activo (sin drift).

### Resultado C3-F1-T1 (Baseline Limpia Pre-SDD)
- Repositorio validado: `/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer`.
- Estado baseline:
  - `git status --short --branch` limpio en `feat/pumuki-validation...origin/feat/pumuki-validation`.
  - `HEAD`: `2ed6f2b`.
  - `main`: `a57b79c`.
  - upstream activo: `origin/feat/pumuki-validation`.
  - remote `origin`: `/tmp/pumuki-mock-consumer-remote.git`.
- Conclusión:
  - baseline operativa lista para abrir sesión SDD (`C3-F1-T2`) sin drift previo.

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
