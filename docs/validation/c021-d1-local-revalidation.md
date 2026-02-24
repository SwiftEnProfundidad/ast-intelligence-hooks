# C021 - Revalidacion Local Integral Final (Fase D / T1)

Ejecucion formal de `C021.D.T1`: revalidacion local integral (`tests`, `typecheck`, `benchmark`, smoke menu/hooks`) para preparar certificacion final del ciclo.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-021m-d-t1-local-revalidation`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: dejar evidencia de precondicion antes de consolidar D.T1.

- evidencia:
  - `.audit_tmp/c021-d-t1-red.out`
- resultado:
  - `exit_code=1`
  - faltaba `summary.json` en la comprobacion de precondicion.

### GREEN

Objetivo: ejecutar bateria integral y validar contrato operativo completo.

1. Comandos de revalidacion:

```bash
npm run test:stage-gates
npm run test:deterministic
npm run typecheck
node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c021-d-t1/enterprise-menu1.json --menu-log=.audit_tmp/c021-d-t1/benchmark-menu-option1.out --parity=.audit-reports/c021-d-t1-legacy-parity-menu1.md --parity-log=.audit_tmp/c021-d-t1/benchmark-parity-menu1.out --out-dir=.audit_tmp/c021-d-t1
printf '1\n10\n' | PUMUKI_SDD_BYPASS=1 node bin/pumuki-framework.js
node bin/pumuki-pre-write.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-commit.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-push.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-ci.js
```

2. Resultados de calidad:
   - `test:stage-gates` (`.audit_tmp/c021-d-t1/test-stage-gates.out`):
     - `tests=824`, `pass=820`, `fail=0`, `skipped=4`
   - `test:deterministic` (`.audit_tmp/c021-d-t1/test-deterministic.out`):
     - `test:evidence`: `tests=30`, `pass=30`, `fail=0`
     - `test:mcp`: `tests=130`, `pass=130`, `fail=0`
     - `test:heuristics`: `tests=15`, `pass=15`, `fail=0`
   - `typecheck` (`.audit_tmp/c021-d-t1/typecheck.out`): `exit_code=0`

3. Benchmark full-repo:
   - `.audit_tmp/c021-d-t1/benchmark.out`
   - `stage=PRE_COMMIT`, `audit_mode=engine`, `outcome=BLOCK`
   - `total_violations=61`
   - `coverage_ratio=1`
   - `parity_exit=1` (comparativa legacy informativa).

4. Smoke menu/hooks:
   - evidencias:
     - `.audit_tmp/c021-d-t1/menu-option1.out`
     - `.audit_tmp/c021-d-t1/pre-write.out`
     - `.audit_tmp/c021-d-t1/pre-commit.out`
     - `.audit_tmp/c021-d-t1/pre-push.out`
     - `.audit_tmp/c021-d-t1/ci.out`
     - `.audit_tmp/c021-d-t1/exits.txt`
     - `.audit_tmp/c021-d-t1/summary.json`
   - contrato operativo:
     - `menu_option1=0` (`engine`, `BLOCK`, `61`, `coverage_ratio=1`)
     - `pre_write=1` esperado (`OPENSPEC_MISSING` + `EVIDENCE_GATE_BLOCKED`)
     - `pre_commit=0` (`gate`, `PASS`, `files_scanned=0`, `coverage_ratio=1`)
     - `pre_push=1` esperado (sin upstream tracking)
     - `ci=0` (`gate`, `PASS`, `files_scanned=0`, `coverage_ratio=1`)

5. Validacion contractual GREEN:
   - `.audit_tmp/c021-d-t1-green.out`
   - `status=GREEN_OK`
   - `exit_code=0`

### REFACTOR

- consolidacion de evidencia integral en un único reporte oficial de fase D.
- cierre de `C021.D.T1` y avance de tarea activa a `C021.D.T2`.

## Diff reproducible D.T1 (vs cierre C.T3)

Fuente: `.audit_tmp/c021-d-t1-diff.json`.

- post C.T3: `CRITICAL=34`, `HIGH=27`, `MEDIUM=0`, `LOW=0`, `total=61`
- post D.T1: `CRITICAL=34`, `HIGH=27`, `MEDIUM=0`, `LOW=0`, `total=61`
- delta: `CRITICAL=0`, `HIGH=0`, `MEDIUM=0`, `LOW=0`, `total=0`
- cobertura mantenida: `active=417`, `evaluated=417`, `unevaluated=0`, `coverage_ratio=1`

## Evidencia asociada

- `.audit_tmp/c021-d-t1-red.out`
- `.audit_tmp/c021-d-t1-green.out`
- `.audit_tmp/c021-d-t1/test-stage-gates.out`
- `.audit_tmp/c021-d-t1/test-deterministic.out`
- `.audit_tmp/c021-d-t1/typecheck.out`
- `.audit_tmp/c021-d-t1/benchmark.out`
- `.audit_tmp/c021-d-t1/benchmark-menu-option1.out`
- `.audit_tmp/c021-d-t1/benchmark-parity-menu1.out`
- `.audit-reports/c021-d-t1-legacy-parity-menu1.md`
- `.audit_tmp/c021-d-t1/enterprise-menu1.json`
- `.audit_tmp/c021-d-t1/menu-option1.out`
- `.audit_tmp/c021-d-t1/pre-write.out`
- `.audit_tmp/c021-d-t1/pre-commit.out`
- `.audit_tmp/c021-d-t1/pre-push.out`
- `.audit_tmp/c021-d-t1/ci.out`
- `.audit_tmp/c021-d-t1/exits.txt`
- `.audit_tmp/c021-d-t1/summary.json`
- `.audit_tmp/c021-d-t1-diff.json`

## Salida de T1

- Revalidacion local integral completada sin regresiones de severidad ni cobertura.
- Contratos de smoke menu/hooks coherentes con el contexto local actual (incluyendo bloqueos esperados).
- Fase D preparada para `C021.D.T2` (informe oficial de cierre C021).
