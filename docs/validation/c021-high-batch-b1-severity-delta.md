# C021 - Delta de severidad tras remediacion HIGH B1 (Fase B / T3)

Ejecucion formal de `C021.B.T3`: revalidacion full-repo y publicacion de diff reproducible contra baseline C021.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-021i-b-t3-high-revalidation-diff`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: demostrar que no existia evidencia de `B.T3` antes de ejecutar la revalidacion.

- comprobacion previa:
  - `.audit_tmp/c021-b-t3-red.out`
- resultado:
  - `exit_code=1` (fallo esperado por falta de `enterprise-menu1.json` de `B.T3`).

### GREEN

Objetivo: generar evidencia full-repo post-remediacion B1 y validar contrato de fase B.

1. Revalidacion full-repo:
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c021-b-t3/enterprise-menu1.json --menu-log=.audit_tmp/c021-b-t3/menu-option1.out --parity=.audit-reports/c021-b-t3-legacy-parity-menu1.md --parity-log=.audit_tmp/c021-b-t3/parity-menu1.out --out-dir=.audit_tmp/c021-b-t3`
   - salida relevante:
     - `total_violations=121`
     - `coverage_ratio=1`
     - `parity_exit=1` (comparativa legacy informativa, no bloqueante para diff C021).

2. Validacion de aceptacion (fase B):
   - chequeos aplicados:
     - `HIGH` debe bajar vs baseline C021 (`44`)
     - `CRITICAL` no puede subir vs cierre de fase A (`34`)
     - `coverage_ratio` debe mantenerse en `1`
   - resultado:
     - `status=GREEN_OK`
   - evidencia:
     - `.audit_tmp/c021-b-t3-green.out`

### REFACTOR

- consolidacion del diff reproducible en este documento.
- actualizacion de tracking de ciclo/progreso e indices oficiales.
- avance a fase C (`C021.C.T1`) con una sola tarea en construccion.

## Diff de severidad

### Baseline C021 (`assets/benchmarks/c021-baseline-precommit-v001-baseline.json`)

- `CRITICAL=42`
- `HIGH=44`
- `MEDIUM=60`
- `LOW=0`
- `total=146`

### Post fase B (`.audit_tmp/c021-b-t3/enterprise-menu1.json`)

- `CRITICAL=34`
- `HIGH=27`
- `MEDIUM=60`
- `LOW=0`
- `total=121`

### Delta vs baseline C021

- `CRITICAL=-8`
- `HIGH=-17`
- `MEDIUM=0`
- `LOW=0`
- `total=-25`

### Delta vs cierre fase A (`.audit_tmp/c021-a-t3/enterprise-menu1.json`)

- `CRITICAL=0`
- `HIGH=-13`
- `MEDIUM=0`
- `LOW=0`
- `total=-13`

## Diff reproducible por regla y fichero

Fuente de diff: `.audit_tmp/c021-b-t3-diff.json`.

### Top reglas con mejora (delta negativo)

1. `common.network.missing_error_handling`: `6 -> 0` (`-6`)
2. `common.error.empty_catch`: `4 -> 0` (`-4`)
3. `skills.backend.no-empty-catch`: `4 -> 0` (`-4`)
4. `skills.frontend.no-empty-catch`: `4 -> 0` (`-4`)
5. `heuristics.ts.child-process-spawn-sync.ast`: `2 -> 0` (`-2`)
6. `heuristics.ts.child-process-exec-file-sync.ast`: `1 -> 0` (`-1`)
7. `heuristics.ts.child-process-exec-file-untrusted-args.ast`: `1 -> 0` (`-1`)
8. `heuristics.ts.child-process-exec.ast`: `1 -> 0` (`-1`)
9. `heuristics.ts.dynamic-shell-invocation.ast`: `1 -> 0` (`-1`)
10. `heuristics.ts.process-exit.ast`: `1 -> 0` (`-1`)

### Top ficheros con mejora (delta negativo)

1. `scripts/framework-menu-matrix-canary-lib.ts`: `6 -> 1` (`-5`)
2. `integrations/lifecycle/gitService.ts`: `4 -> 1` (`-3`)
3. `integrations/lifecycle/update.ts`: `3 -> 0` (`-3`)
4. `scripts/adapter-session-status-writes-log-filter-lib.ts`: `3 -> 0` (`-3`)
5. `core/facts/extractHeuristicFacts.ts`: `4 -> 2` (`-2`)
6. `integrations/mcp/__tests__/enterpriseServer.test.ts`: `1 -> 0` (`-1`)
7. `integrations/mcp/__tests__/evidenceContextServer-collections.test.ts`: `1 -> 0` (`-1`)
8. `integrations/mcp/__tests__/evidenceContextServer-findings.test.ts`: `1 -> 0` (`-1`)
9. `integrations/mcp/__tests__/evidenceContextServer-health.test.ts`: `1 -> 0` (`-1`)
10. `integrations/mcp/__tests__/evidenceContextServer-payload.test.ts`: `1 -> 0` (`-1`)
11. `integrations/mcp/__tests__/evidenceContextServer.test.ts`: `1 -> 0` (`-1`)
12. `scripts/check-package-manifest.ts`: `2 -> 1` (`-1`)
13. `scripts/import-custom-skills.ts`: `1 -> 0` (`-1`)
14. `scripts/run-c020-benchmark.ts`: `2 -> 1` (`-1`)

## Evidencia asociada

- `.audit_tmp/c021-b-t3-red.out`
- `.audit_tmp/c021-b-t3/enterprise-menu1.json`
- `.audit_tmp/c021-b-t3/menu-option1.out`
- `.audit_tmp/c021-b-t3/parity-menu1.out`
- `.audit-reports/c021-b-t3-legacy-parity-menu1.md`
- `.audit_tmp/c021-b-t3-green.out`
- `.audit_tmp/c021-b-t3-diff.json`

## Salida de T3

- Revalidacion full-repo de fase B completada.
- Diff reproducible publicado (`severidad/reglas/ficheros`) contra baseline C021.
- KPI de fase B cumplidos (`HIGH` baja, `CRITICAL` no sube, `coverage_ratio=1`).
- Fase B cerrada y ciclo movido a `C021.C.T1`.
