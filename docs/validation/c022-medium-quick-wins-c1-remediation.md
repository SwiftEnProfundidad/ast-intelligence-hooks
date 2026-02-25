# C022 - Quick Wins C1 (Fase C / T1)

Ejecucion formal de `C022.C.T1`: mantener `MEDIUM/LOW` sin regresion y aplicar quick wins de mantenibilidad en `scripts`.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-022j-c-t1-medium-quick-wins`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: demostrar que no existia evidencia formal de `C022.C.T1`.

- comprobacion previa:
  - `.audit_tmp/c022-c-t1-red.out`
- resultado:
  - `has_doc_rc=1`
  - `has_evidence_rc=1`
  - `status=RED_OK`
  - `exit_code=1`

### GREEN

Objetivo: aplicar quick win tipado en backlog `scripts/*` y verificar contrato de fase C.

1. Cambios aplicados (quick win):
   - `scripts/consumer-ci-auth-check-contract.ts`
   - `scripts/consumer-support-bundle-contract.ts`
   - `scripts/framework-menu-evidence-summary-lib.ts`
   - `scripts/framework-menu-legacy-audit-lib.ts`
   - reemplazo de `Record<string, unknown>` por unions tipadas de valores serializables (`string | number | boolean | null | Date`) en contratos y normalizadores.

2. Validacion tecnica:
   - tests focales:
     - `npx --yes tsx@4.21.0 --test scripts/__tests__/consumer-ci-auth-check-lib.test.ts scripts/__tests__/consumer-support-bundle-gh-command-lib.test.ts scripts/__tests__/framework-menu-evidence-summary.test.ts scripts/__tests__/framework-menu-legacy-audit.test.ts scripts/__tests__/framework-menu-matrix-evidence.test.ts`
     - resultado: `tests=32`, `pass=32`, `fail=0`.
   - `typecheck` global:
     - `npm run typecheck`
     - resultado: `OK`.

3. Revalidacion full-repo:
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c022-c-t1/enterprise-menu1.json --menu-log=.audit_tmp/c022-c-t1/menu-option1.out --parity=.audit-reports/c022-c-t1-legacy-parity-menu1.md --parity-log=.audit_tmp/c022-c-t1/parity-menu1.out --out-dir=.audit_tmp/c022-c-t1`
   - salida relevante:
     - `total_violations=19`
     - `coverage_ratio=1`
     - `parity_exit=1` (comparativa legacy informativa; no bloqueante para C022).

4. Validacion de aceptacion C.T1:
   - evidencia:
     - `.audit_tmp/c022-c-t1-green.out`
   - resultado:
     - `status=GREEN_OK`
     - `HIGH: 5 -> 1` (`-4`)
     - `CRITICAL: 18 -> 18` (`0`)
     - `MEDIUM: 0 -> 0` (`0`)
     - `LOW: 0 -> 0` (`0`)
     - `coverage_ratio=1` (`active=417`, `evaluated=417`, `rules_total=417`).

### REFACTOR

- consolidacion de evidencia reproducible (`diff`, pruebas y benchmark) en este documento.
- actualizacion de tracking de ciclo/progreso e indices oficiales.
- avance de fase a `C022.C.T2`.

## Diff reproducible C.T1 (vs cierre fase B)

Fuente: `.audit_tmp/c022-c-t1-diff.json`.

### Severidad

- fase B (`.audit_tmp/c022-b-t3/enterprise-menu1.json`):
  - `CRITICAL=18`, `HIGH=5`, `MEDIUM=0`, `LOW=0`, `total=23`
- post C.T1 (`.audit_tmp/c022-c-t1/enterprise-menu1.json`):
  - `CRITICAL=18`, `HIGH=1`, `MEDIUM=0`, `LOW=0`, `total=19`
- delta:
  - `CRITICAL=0`, `HIGH=-4`, `MEDIUM=0`, `LOW=0`, `total=-4`

### Regla impactada

- `common.types.record_unknown_requires_type`: `4 -> 0` (`-4`).

### Ficheros impactados

- `scripts/consumer-ci-auth-check-contract.ts`: `1 -> 0` (`-1`)
- `scripts/consumer-support-bundle-contract.ts`: `1 -> 0` (`-1`)
- `scripts/framework-menu-evidence-summary-lib.ts`: `1 -> 0` (`-1`)
- `scripts/framework-menu-legacy-audit-lib.ts`: `1 -> 0` (`-1`)

## Evidencia asociada

- `.audit_tmp/c022-c-t1-red.out`
- `.audit_tmp/c022-c-t1-tests.out`
- `.audit_tmp/c022-c-t1-tests.exit`
- `.audit_tmp/c022-c-t1-typecheck.out`
- `.audit_tmp/c022-c-t1-typecheck.exit`
- `.audit_tmp/c022-c-t1/benchmark.out`
- `.audit_tmp/c022-c-t1/benchmark.exit`
- `.audit_tmp/c022-c-t1/enterprise-menu1.json`
- `.audit_tmp/c022-c-t1/menu-option1.out`
- `.audit_tmp/c022-c-t1/parity-menu1.out`
- `.audit-reports/c022-c-t1-legacy-parity-menu1.md`
- `.audit_tmp/c022-c-t1-diff.json`
- `.audit_tmp/c022-c-t1-green.out`

## Salida de T1

- `MEDIUM/LOW` se mantienen en `0` sin regresion.
- quick win en `scripts` reduce `HIGH` (`-4`) sin subir `CRITICAL`.
- cobertura de reglas se mantiene (`coverage_ratio=1`).
- fase C movida a `C022.C.T2`.
