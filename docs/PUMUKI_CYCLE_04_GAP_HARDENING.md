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
- ✅ C4-F1-T2: Implementar corrección en runtime MCP sin romper payload existente.
- ✅ C4-F1-T3: Validar endpoint (`/health`, `/status`, `/ai-evidence/*`) en mock con evidencia real.

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

### Resultado C4-F1-T2 (Runtime MCP Corregido)
- Implementación aplicada en `integrations/mcp/evidencePayloadStatus.ts`:
  - `evidence.exists` presente y booleano en `missing`, `invalid` y `valid`.
  - `evidence.findings_count=0` garantizado en ramas degradadas.
  - compatibilidad preservada con `evidence.present` (sin ruptura de shape existente).
- Cobertura actualizada en tests MCP:
  - `integrations/mcp/__tests__/evidencePayloadStatus.test.ts`
  - `integrations/mcp/__tests__/evidencePayloads.test.ts`
  - `integrations/mcp/__tests__/evidenceContextServer.test.ts`
  - `integrations/mcp/__tests__/evidenceContextServer-health.test.ts`
- Documentación alineada del contrato `/status`:
  - `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
  - `docs/MCP_SERVERS.md`
- Validación ejecutada (verde) con `tsx --test` sobre las 4 suites MCP afectadas.

### Resultado C4-F1-T3 (Validación Endpoint en Mock Real)
- Repositorio mock validado: `/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer`.
- Evidencia usada: `.ai_evidence.json` real del mock (`version=2.1`, `stage=PRE_COMMIT`, `outcome=PASS`).
- Endpoints verificados con respuesta `200`:
  - `/health`
  - `/status`
  - `/ai-evidence`
  - `/ai-evidence/summary`
  - `/ai-evidence/findings?limit=3`
  - `/ai-evidence/rulesets`
  - `/ai-evidence/platforms?detectedOnly=false`
  - `/ai-evidence/ledger?limit=3`
- Contrato MCP confirmado en `/status.evidence`:
  - `exists=true` (booleano)
  - `present=true` (compatibilidad)
  - `valid=true` (booleano)
  - `findings_count=0` (numérico)
- Cierre de fase 1: completado sin regresiones de contrato.

## Fase 2 — Noise Control (Base + Skills)
- ✅ C4-F2-T1: Definir criterio explícito de deduplicación/presentación de findings.
- ✅ C4-F2-T2: Implementar ajuste sin perder trazabilidad por regla (`ruleId`, `source`).
- ✅ C4-F2-T3: Revalidar conteos en `.ai_evidence.json` y MCP (`findings/rulesets/platforms`).

### Resultado C4-F2-T2 (Deduplicación Runtime Implementada)
- Implementación aplicada en `integrations/evidence/buildEvidence.ts`:
  - colisión semántica calculada con `stage + platform + file + anchorLine + semanticFamily`.
  - `anchorLine` normalizado (`min(lines)` o `0` cuando no existe).
  - inferencia de `platform` por ruta de archivo (y fallback por prefijo de `ruleId`).
  - precedencia de selección en empate:
    - severidad (`CRITICAL > ERROR > WARN > INFO`),
    - origen (`project-rules > skills > platform-preset > heuristics`),
    - `ruleId` lexicográfico,
    - tuple estable (`code/message/matchedBy/source`) como desempate final.
  - trazabilidad preservada para findings suprimidos en `consolidation.suppressed[]`:
    - `ruleId`, `file`, `lines`, `replacedByRuleId`, `replacementRuleId`, `platform`, `reason`.
- Cobertura actualizada en `integrations/evidence/__tests__/buildEvidence.test.ts`:
  - adaptaciones por deduplicación por ancla (ya no por archivo completo),
  - nuevo test de precedencia completa de origen.
- Validación ejecutada en verde:
  - `npx --yes tsx --test integrations/evidence/__tests__/buildEvidence.test.ts integrations/git/__tests__/stageRunners.test.ts`
  - resultado: `28/28` tests `pass`.

### Resultado C4-F2-T3 (Paridad `.ai_evidence.json` vs MCP Confirmada)
- Revalidación ejecutada en mock real:
  - repo: `/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer`
  - servidor MCP arrancado con `repoRoot=mock` usando `startEvidenceContextServer`.
  - evidencia sintética temporal generada con `buildEvidence` (deduplicación activa) y restauración automática de baseline al finalizar.
- Conteos esperados desde `.ai_evidence.json` temporal:
  - `findingsCount=2`
  - `rulesetsCount=3`
  - `platformsCount=3`
  - `suppressedCount=3`
- Conteos observados en MCP:
  - `/status.evidence.findings_count=2`
  - `/status.evidence.suppressed_findings_count=3`
  - `/ai-evidence/findings.total_count=2`
  - `/ai-evidence/rulesets.total_count=3`
  - `/ai-evidence/platforms?detectedOnly=false.total_count=3`
  - `/status.evidence.exists=true` (booleano)
- Veredicto: paridad `findings/rulesets/platforms/suppressed` = `true` en todos los checks (`ok=true`).

### Resultado C4-F2-T1 (Criterio de Deduplicación y Presentación)
- Objetivo de deduplicación:
  - evitar ruido cuando la misma violación semántica aparece duplicada por regla base y regla de skills en el mismo contexto técnico.
- Definición de “misma violación” (clave de colisión):
  - `stage` + `platform` + `file normalizado` + `linea ancla` (`min(lines)` o `0` si no hay) + `semantic_family`.
  - `semantic_family` se toma de un mapa explícito (`rulesFamilyMap`) mantenido en código; si no existe mapeo, la familia por defecto es el `ruleId`.
- Política de resolución (selección de finding canónico):
  - prioridad 1: mayor severidad (`CRITICAL > ERROR > WARN > INFO`).
  - prioridad 2: precedencia de origen (`project-rules > skills > platform-preset > heuristics`).
  - prioridad 3: `ruleId` lexicográfico (desempate determinista).
- Regla de preservación de trazabilidad:
  - los findings no canónicos no se descartan silenciosamente.
  - cada finding suprimido se registra en `consolidation.suppressed[]` con:
    - `ruleId` original suprimido,
    - `replacementRuleId`/`replacedByRuleId`,
    - `file`, `platform`,
    - `reason=semantic-family-precedence`.
- Regla de presentación en snapshot:
  - `snapshot.findings[]` contiene solo findings canónicos (sin duplicados semánticos por colisión).
  - orden estable: `file`, `linea ancla`, `severity desc`, `ruleId`.
- Contrato métrico esperado tras implementación (`C4-F2-T2`):
  - `snapshot.findings_count` = total canónico.
  - `consolidation.suppressed.length` = total deduplicado por solape.
  - no se pierde cobertura: `canónicos + suprimidos` representa el universo detectado original.

## Fase 3 — Commit Range Contract
- ✅ C4-F3-T1: Documentar contrato operativo obligatorio para `PRE_PUSH/CI` con rango real.
- ✅ C4-F3-T2: Ajustar runbook/checklist para evitar ejecuciones ambiguas.
- ✅ C4-F3-T3: Verificar patrón final en mock (`clean/violations/mixed`) sin bucles.

### Resultado C4-F3-T1 (Contrato Operativo `PRE_PUSH/CI` Documentado)
- Fuente normativa de implementación:
  - `integrations/git/resolveGitRefs.ts`
  - `integrations/git/stageRunners.ts`
- Contrato obligatorio `PRE_PUSH`:
  - precondición: la rama debe tener upstream resoluble vía `git rev-parse @{u}`.
  - si no hay upstream:
    - salida obligatoria `exit=1`,
    - mensaje guía explícito: configurar upstream (`git push --set-upstream origin <branch>`),
    - no se evalúa rango ambiguo.
  - si hay upstream:
    - scope de evaluación = `upstreamRef..HEAD` (`kind=range`).
- Contrato obligatorio `CI`:
  - scope de evaluación = `fromRef..HEAD` (`kind=range`).
  - resolución determinista de `fromRef`:
    1. `GITHUB_BASE_REF` si es resoluble como ref literal.
    2. `origin/${GITHUB_BASE_REF}` si el literal no resuelve.
    3. `origin/main` si no hay base de entorno válida.
    4. `main` si no existe `origin/main`.
    5. `HEAD` como fallback final determinista.
- Reglas anti-ambigüedad del contrato:
  - `PRE_PUSH` nunca hace fallback a `HEAD` si falta upstream: falla seguro.
  - `CI` sí tiene fallback controlado y explícito para evitar ruptura por entorno incompleto.
  - el rango efectivo siempre es trazable por stage (`PRE_PUSH`/`CI`) y consistente con evidencia emitida.

### Resultado C4-F3-T2 (Runbook/Checklist Ajustados Sin Ambigüedad)
- Documentación normativa alineada para ejecución por rango:
  - `docs/HOW_IT_WORKS.md` actualizado con:
    - `PRE_PUSH` fail-safe explícito sin fallback a `HEAD` cuando falta upstream.
    - orden completo de fallback de base para `CI`: literal `GITHUB_BASE_REF`, `origin/${GITHUB_BASE_REF}`, `origin/main`, `main`, `HEAD`.
- Checklist operativo de mock endurecido:
  - `docs/validation/mock-consumer-next-cycle-enterprise-checklist.md` actualizado con:
    - precondición obligatoria de upstream antes de `PRE_PUSH`,
    - comandos explícitos para `PRE_COMMIT`, `PRE_PUSH`, `CI`,
    - ejecución explícita de `CI` con `GITHUB_BASE_REF=<base-branch>`,
    - reglas anti-ambigüedad obligatorias para separar checklist estándar y pruebas de fallback.
- Resultado: el flujo operativo queda reproducible y sin interpretación implícita de rangos en la ejecución estándar del checklist.

### Resultado C4-F3-T3 (Patrón Final Verificado en Mock)
- Verificación ejecutada en clon temporal limpio del mock para no alterar baseline local con cambios sin trackear:
  - `TMP_REPO=/tmp/pumuki-c4-f3-t3-uCuUe9/repo`
- Comandos ejecutados:
  - `npm install --save-exact pumuki@latest`
  - `npx pumuki install`
  - `npm run pumuki:matrix`
- Resultado observado:
  - `clean`: `pre-commit=0`, `pre-push=0`, `ci=0` -> `PASS`
  - `violations`: `pre-commit=1`, `pre-push=1`, `ci=1` -> `PASS`
  - `mixed`: `pre-commit=1`, `pre-push=1`, `ci=1` -> `PASS`
  - salida final: `All scenario matrix checks passed for package: pumuki@latest`
- Veredicto: patrón final de stages validado sin bucles y con contrato esperado estable.

## Fase 4 — Cierre
- ✅ C4-F4-T1: Consolidar conclusiones del ciclo 04.
- ✅ C4-F4-T2: Actualizar tracker global con cierre administrativo ciclo 04.
- ✅ C4-F4-T3: Definir siguiente tarea activa (ciclo 05 o mantenimiento).

### Resultado C4-F4-T1 (Conclusiones Consolidadas del Ciclo 04)
- Objetivo del ciclo 04: **cumplido**.
  - Gap 1 (`MCP /status evidence.exists`): cerrado con contrato booleano explícito, tests MCP en verde y validación real en mock.
  - Gap 2 (ruido por solape base+skills): cerrado con deduplicación semántica determinista y trazabilidad completa en `consolidation.suppressed`.
  - Gap 3 (ambigüedad `PRE_PUSH/CI` por rango): cerrado con contrato de resolución explícito + checklist/runbook operativo sin ambigüedad.
- Verificación operativa final:
  - patrón de matriz en mock validado (`clean=0/0/0`, `violations=1/1/1`, `mixed=1/1/1`) con salida de cierre estable.
- Calidad de cierre:
  - una única tarea activa mantenida en tracker durante la ejecución.
  - alcance sin expansión respecto a lo congelado en `C4-F0-T2`.
  - resultados documentados con trazabilidad de contrato, implementación y validación.

### Resultado C4-F4-T2 (Cierre Administrativo Reflejado en Tracker Global)
- `docs/REFRACTOR_PROGRESS.md` actualizado con la secuencia completa de tareas `C4-F0..C4-F4` ejecutadas hasta `C4-F4-T2`.
- Estado administrativo del ciclo 04 alineado entre:
  - tracker de ciclo (`docs/PUMUKI_CYCLE_04_GAP_HARDENING.md`)
  - tracker global (`docs/REFRACTOR_PROGRESS.md`)
- Regla de visibilidad cumplida:
  - una sola tarea activa en todo momento, movida a `C4-F4-T3`.

### Resultado C4-F4-T3 (Siguiente Tarea Activa Definida)
- Ciclo 04 queda formalmente cerrado con `C4-F0..C4-F4` en `✅`.
- Se define como siguiente tarea activa global:
  - `C5-F0-T1`: crear documento de ciclo 05 en `docs/PUMUKI_CYCLE_05_ENTERPRISE_OPERATIONS.md`.
- Alcance mínimo de esa próxima tarea (solo definición, no ejecución en esta iteración):
  - objetivo del ciclo 05,
  - alcance congelado inicial,
  - backlog visible con tareas atómicas y regla de una única tarea en progreso.
