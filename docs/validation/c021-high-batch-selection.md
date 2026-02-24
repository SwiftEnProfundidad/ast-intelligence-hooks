# C021 - Seleccion de Lote HIGH (Fase B / T1)

Seleccion oficial del primer lote `HIGH` priorizado por riesgo para iniciar la fase B tras cierre de la fase A.

## Evidencia fuente

- Snapshot post-fase A (`A.T3`):
  - `.audit_tmp/c021-a-t3/enterprise-menu1.json`
- Validacion de seleccion (GREEN reproducible):
  - `.audit_tmp/c021-b-t1-green.out`

## TDD (RED -> GREEN -> REFACTOR)

### RED

- comprobacion previa de inexistencia del documento de seleccion:
  - `.audit_tmp/c021-b-t1-red.out`
- resultado:
  - `exit_code=1` (fallo esperado antes de publicar la seleccion).

### GREEN

- analisis reproducible de `HIGH` sobre snapshot post-A:
  - `high_total=40`
  - `selected_total=13`
  - `remaining_high=27`
- resultado:
  - `status=GREEN_OK`
  - `coverage_ratio=1`

### REFACTOR

- consolidacion de seleccion en este documento.
- actualizacion de tracking (`C021` y `REFRACTOR_PROGRESS`) con una sola tarea en construccion.

## Criterio de priorizacion aplicado

1. Riesgo operativo y de seguridad primero:
   - ejecucion de procesos/shell (`exec/spawn/process.exit`) y errores de manejo de red.
2. Blast radius acotado para fase B inicial:
   - `11` rutas concretas y trazables (`file:line`), en lugar de iniciar por lote masivo de tipos (`26`).
3. Preparar remediacion incremental sin degradar `coverage_ratio`.

## Lote HIGH seleccionado (B1)

### Reglas incluidas

1. `common.network.missing_error_handling` (`6`)
2. `heuristics.ts.child-process-spawn-sync.ast` (`2`)
3. `heuristics.ts.child-process-exec-file-sync.ast` (`1`)
4. `heuristics.ts.child-process-exec-file-untrusted-args.ast` (`1`)
5. `heuristics.ts.child-process-exec.ast` (`1`)
6. `heuristics.ts.dynamic-shell-invocation.ast` (`1`)
7. `heuristics.ts.process-exit.ast` (`1`)

Total lote `B1`: `13` hallazgos `HIGH`.

### Ficheros objetivo del lote B1 (`file:line`)

- `core/facts/extractHeuristicFacts.ts:308`
- `integrations/mcp/__tests__/enterpriseServer.test.ts:55`
- `integrations/mcp/__tests__/evidenceContextServer-collections.test.ts:17`
- `integrations/mcp/__tests__/evidenceContextServer-findings.test.ts:36`
- `integrations/mcp/__tests__/evidenceContextServer-health.test.ts:9`
- `integrations/mcp/__tests__/evidenceContextServer-payload.test.ts:15`
- `integrations/mcp/__tests__/evidenceContextServer.test.ts:52`
- `scripts/check-package-manifest.ts:61`
- `scripts/framework-menu-matrix-canary-lib.ts:153`
- `scripts/import-custom-skills.ts:45`
- `scripts/run-c020-benchmark.ts:62`

## Backlog HIGH restante tras B1

- `common.types.record_unknown_requires_type` (`26`)
- `workflow.bdd.insufficient_features` (`1`)

Total restante `HIGH`: `27`.

## Salida de T1

- Lote `HIGH` inicial (`B1`) seleccionado y versionado con evidencia reproducible.
- Riesgo priorizado en errores de red y ejecucion de procesos/shell.
- Tracking movido a `C021.B.T2` para remediacion incremental del lote B1.

## NEXT

NEXT: fase B cerrada (`B1` remediada + diff publicado). Avanzar a `C021.C.T1` para reducir `MEDIUM` con quick wins.
