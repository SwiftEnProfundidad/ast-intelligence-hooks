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
- ✅ C4-F0-T2: Congelar alcance exacto del ciclo 04 (entradas/salidas/límites/done).
- ✅ C4-F0-T3: Publicar checkpoint único del ciclo 04 (comando + criterio de aceptación).

### Resultado C4-F0-T1 (Documento Creado)
- Documento creado: `docs/PUMUKI_CYCLE_04_GAP_HARDENING.md`.
- Scope inicial cargado con 3 gaps priorizados y regla de una sola tarea activa.

### Alcance Congelado (C4-F0-T2)
- Entradas obligatorias:
  - baseline limpia en `ast-intelligence-hooks` antes de cada ejecución de tarea del ciclo.
  - `pumuki-mock-consumer` operativo para validación de contratos de evidencia/MCP y comportamiento de gates.
  - evidencia activa disponible en mock (`.ai_evidence.json`) para validaciones de consistencia.
- Salidas obligatorias:
  - contrato MCP `/status` sin ambigüedad para `evidence.exists` cuando `valid=true`.
  - estrategia explícita de reducción de ruido por solape reglas base+skills sin perder trazabilidad.
  - guía operativa explícita para `PRE_PUSH/CI` con rango real de commits, incluida en documentación ejecutable.
- Límites (fuera de alcance ciclo 04):
  - rediseño completo de arquitectura de rules engine.
  - añadir nuevos dominios/plataformas de reglas fuera de `android/backend/frontend/ios`.
  - depender de CI remota para declarar cierre del ciclo.
- Definición exacta de done ciclo 04:
  - fases `C4-F0..C4-F4` en `✅` o bloqueo explícito documentado.
  - una única tarea `🚧` visible en todo momento en documentos de seguimiento.
  - evidencia final coherente entre ejecución real, `.ai_evidence.json`, MCP y tracker global.

### Resultado C4-F0-T2 (Alcance Congelado)
- Alcance formalmente congelado en este documento con entradas/salidas/límites/done.
- Se habilita `C4-F0-T3` como siguiente tarea activa única.

### Checkpoint Único del Ciclo 04 (C4-F0-T3)
- Fecha de checkpoint: `2026-02-27`.
- Comando único de checkpoint:
  - `cd /Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer && npm install --save-exact pumuki@latest && npx pumuki install && npm run pumuki:matrix`
- Criterio de aceptación del checkpoint:
  - matriz operativa estable:
    - `clean`: `pre-commit=0`, `pre-push=0`, `ci=0`
    - `violations`: `pre-commit=1`, `pre-push=1`, `ci=1`
    - `mixed`: `pre-commit=1`, `pre-push=1`, `ci=1`
  - salida final incluye `All scenario matrix checks passed`.
  - sin aparición de `SDD_SESSION_MISSING` en ejecuciones con sesión SDD activa.
  - el ciclo 04 mantiene una única tarea en progreso en tracker/doc.

### Resultado C4-F0-T3 (Checkpoint Publicado)
- Checkpoint único publicado con comando reproducible y criterio de aceptación explícito.
- Se activa la fase de implementación técnica: `C4-F1-T1`.

## Fase 1 — MCP Status Consistency
- ✅ C4-F1-T1: Definir contrato esperado para `evidence.exists` en `/status`.
- 🚧 C4-F1-T2: Implementar corrección en runtime MCP sin romper payload existente.
- ⏳ C4-F1-T3: Validar endpoint (`/health`, `/status`, `/ai-evidence/*`) en mock con evidencia real.

### Resultado C4-F1-T1 (Contrato `evidence.exists` Definido)
- Endpoint objetivo: `GET /status` de `pumuki-mcp-evidence`.
- Contrato normativo (`status.evidence`):
  - `exists`: **booleano obligatorio** (`true|false`, nunca `null`).
  - `valid`: **booleano obligatorio** (`true|false`, nunca `null`).
  - `findings_count`: entero `>= 0`.
- Reglas semánticas mínimas:
  - Caso A — evidencia ausente:
    - `exists=false`, `valid=false`, `findings_count=0`.
  - Caso B — evidencia presente y válida:
    - `exists=true`, `valid=true`, `findings_count>=0`.
  - Caso C — evidencia presente pero inválida/no parseable:
    - `exists=true`, `valid=false`, `findings_count=0`.
- Restricción de compatibilidad:
  - no romper shape actual de `/status`; solo eliminar ambigüedad (`exists=null`).
- Criterio de salida para la tarea de implementación (`C4-F1-T2`):
  - runtime devuelve `exists` booleano en todos los casos anteriores y mantiene estabilidad del resto del payload.

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
