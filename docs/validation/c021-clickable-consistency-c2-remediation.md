# C021 - Normalizacion de reportes clicables (Fase C / T2)

Ejecucion formal de `C021.C.T2`: normalizar trazabilidad clicable y consistencia de salida entre hooks, menu y export markdown.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-021k-c-t2-clickable-consistency`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: forzar los contratos de consistencia que aun no estaban garantizados.

1. Tests endurecidos:
   - `scripts/__tests__/adapter-session-status-report-lib.test.ts`
   - `scripts/__tests__/framework-menu-legacy-audit.test.ts`
2. Ejecucion:
   - `npx --yes tsx --test scripts/__tests__/framework-menu-legacy-audit.test.ts scripts/__tests__/adapter-session-status-report-lib.test.ts`
3. Resultado esperado:
   - `.audit_tmp/c021-c-t2-red.out`
   - `exit_code=1`
   - fallos esperados (`3`):
     - hooks no normalizaba paths absolutos,
     - writes log no normalizaba paths absolutos,
     - menu/export mantenia paths absolutos en vez de repo-relative.

### GREEN

Objetivo: aplicar normalizacion determinista de paths y cerrar consistencia de salida.

1. Cambios aplicados:
   - `scripts/adapter-session-status-log-utils-lib.ts`
     - helper `toRepoRelativePath` + hardening de `isPathInsideRepo`.
   - `scripts/adapter-session-status-hook-log-filter-lib.ts`
     - correccion de regex de parseo de logs,
     - normalizacion de file paths a repo-relative,
     - filtrado de lineas simuladas limitado a `__pumuki_simulated__`.
   - `scripts/adapter-session-status-writes-log-filter-lib.ts`
     - normalizacion de `file` JSON a repo-relative para entradas dentro del repo.
   - `scripts/framework-menu-legacy-audit-lib.ts`
     - normalizacion de findings a repo-relative desde `readLegacyAuditSummary` para salida consistente en menu (`file:line`) y export (`./path#Lline`).

2. Validacion focal:
   - `.audit_tmp/c021-c-t2-green.out`
   - `tests=24`, `pass=24`, `fail=0`
   - `status=GREEN_OK`

3. Validacion ampliada runtime/menu:
   - `.audit_tmp/c021-c-t2-static.out`
   - `tests=38`, `pass=38`, `fail=0`

4. Typecheck:
   - `.audit_tmp/c021-c-t2-typecheck.out`
   - `exit_code=0`

5. Revalidacion full-repo (no degradacion severidades/cobertura):
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c021-c-t2/enterprise-menu1.json --menu-log=.audit_tmp/c021-c-t2/menu-option1.out --parity=.audit-reports/c021-c-t2-legacy-parity-menu1.md --parity-log=.audit_tmp/c021-c-t2/parity-menu1.out --out-dir=.audit_tmp/c021-c-t2`
   - salida relevante (`.audit_tmp/c021-c-t2-benchmark.out`):
     - `total_violations=61`
     - `coverage_ratio=1`
     - `parity_exit=1` (comparativa legacy informativa).

6. Validacion de aceptacion C.T2:
   - paths absolutos normalizados a repo-relative en hooks/menu/export.
   - trazabilidad clicable mantenida (`file:line` en menu, `./path#Lline` en markdown).
   - sin subida de `CRITICAL/HIGH/MEDIUM/LOW`.

### REFACTOR

- consolidacion de helpers de normalizacion sin introducir capas nuevas.
- cierre documental de `C021.C.T2` y avance de tarea activa a `C021.C.T3`.

## Diff reproducible C.T2 (vs cierre C.T1)

Fuente: `.audit_tmp/c021-c-t2-diff.json`.

### Severidad

- post C.T1 (`.audit_tmp/c021-c-t1/enterprise-menu1.json`):
  - `CRITICAL=34`, `HIGH=27`, `MEDIUM=0`, `LOW=0`, `total=61`
- post C.T2 (`.audit_tmp/c021-c-t2/enterprise-menu1.json`):
  - `CRITICAL=34`, `HIGH=27`, `MEDIUM=0`, `LOW=0`, `total=61`
- delta:
  - `CRITICAL=0`, `HIGH=0`, `MEDIUM=0`, `LOW=0`, `total=0`

### Cobertura

- `rules_coverage.active=417`
- `rules_coverage.evaluated=417`
- `rules_coverage.unevaluated=0`
- `coverage_ratio=1`

## Evidencia asociada

- `.audit_tmp/c021-c-t2-red.out`
- `.audit_tmp/c021-c-t2-red-status.out`
- `.audit_tmp/c021-c-t2-green.out`
- `.audit_tmp/c021-c-t2-static.out`
- `.audit_tmp/c021-c-t2-typecheck.out`
- `.audit_tmp/c021-c-t2-benchmark.out`
- `.audit_tmp/c021-c-t2/enterprise-menu1.json`
- `.audit_tmp/c021-c-t2/menu-option1.out`
- `.audit_tmp/c021-c-t2/parity-menu1.out`
- `.audit-reports/c021-c-t2-legacy-parity-menu1.md`
- `.audit_tmp/c021-c-t2-diff.json`

## Salida de T2

- Contrato de consistencia hooks/menu/export normalizado con paths repo-relative.
- Reportes clicables estables y deterministicos para diagnostico (`file:line` y `./path#Lline`).
- Fase C lista para `C021.C.T3` (paridad operativa de entrypoints).
