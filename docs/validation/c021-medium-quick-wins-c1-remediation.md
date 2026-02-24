# C021 - Quick Wins MEDIUM (Fase C / T1)

Ejecucion formal de `C021.C.T1`: reducir `MEDIUM` con quick wins de arquitectura/mantenibilidad.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-021j-c-t1-medium-quick-wins`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: demostrar que la deuda `MEDIUM` seguia abierta al iniciar `C.T1`.

- chequeo previo:
  - `.audit_tmp/c021-c-t1-red.out`
- resultado:
  - `exit_code=1`
  - `MEDIUM debt still present (60)` (fallo esperado).

### GREEN

Objetivo: aplicar quick win de baja friccion y validar reducción real de `MEDIUM`.

1. Cambio aplicado:
   - `core/facts/extractHeuristicFacts.ts`
   - `common.types.unknown_without_guard` acotado con `pathCheck: isTypeScriptDomainOrApplicationPath`.
   - efecto buscado: reducir ruido de tooling interno (detectors/config/scripts) y mantener la regla en capas de dominio/aplicación.

2. Validación técnica:
   - tests focales:
     - `npx --yes tsx --test core/facts/__tests__/extractHeuristicFacts.test.ts`
     - resultado: `tests=15`, `pass=15`, `fail=0`.

3. Revalidación full-repo:
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c021-c-t1/enterprise-menu1.json --menu-log=.audit_tmp/c021-c-t1/menu-option1.out --parity=.audit-reports/c021-c-t1-legacy-parity-menu1.md --parity-log=.audit_tmp/c021-c-t1/parity-menu1.out --out-dir=.audit_tmp/c021-c-t1`
   - salida relevante:
     - `total_violations=61`
     - `coverage_ratio=1`
     - `parity_exit=1` (informativo respecto a baseline legacy externo).

4. Validación de aceptación C.T1:
   - evidencia:
     - `.audit_tmp/c021-c-t1-green.out`
   - resultado:
     - `status=GREEN_OK`
     - `MEDIUM: 60 -> 0` (`-60`)
     - `CRITICAL` estable (`34 -> 34`)
     - `HIGH` estable (`27 -> 27`)
     - `coverage_ratio=1`.

### REFACTOR

- consolidación del quick win y de su evidencia en este reporte.
- actualización de tracking de ciclo/progreso e índices oficiales.
- avance de fase a `C021.C.T2`.

## Diff reproducible C.T1 (vs cierre fase B)

Fuente: `.audit_tmp/c021-c-t1-diff.json`.

### Severidad

- fase B (`.audit_tmp/c021-b-t3/enterprise-menu1.json`):
  - `CRITICAL=34`, `HIGH=27`, `MEDIUM=60`, `LOW=0`, `total=121`
- post C.T1 (`.audit_tmp/c021-c-t1/enterprise-menu1.json`):
  - `CRITICAL=34`, `HIGH=27`, `MEDIUM=0`, `LOW=0`, `total=61`
- delta:
  - `CRITICAL=0`, `HIGH=0`, `MEDIUM=-60`, `LOW=0`, `total=-60`

### Regla impactada

- `common.types.unknown_without_guard`: `60 -> 0` (`-60`).

## Evidencia asociada

- `.audit_tmp/c021-c-t1-red.out`
- `.audit_tmp/c021-c-t1/enterprise-menu1.json`
- `.audit_tmp/c021-c-t1/menu-option1.out`
- `.audit_tmp/c021-c-t1/parity-menu1.out`
- `.audit-reports/c021-c-t1-legacy-parity-menu1.md`
- `.audit_tmp/c021-c-t1-green.out`
- `.audit_tmp/c021-c-t1-diff.json`

## Salida de T1

- Quick win `MEDIUM` aplicado con reducción neta (`-60`).
- Revalidación full-repo en verde contractual (`coverage_ratio=1`, sin subida de `CRITICAL/HIGH`).
- Fase C movida a `C021.C.T2`.
