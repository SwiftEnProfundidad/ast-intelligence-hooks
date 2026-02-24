# C021 - Delta de severidad tras remediacion A1 (Fase A / T3)

Ejecucion formal de `C021.A.T3`: revalidacion full-repo y publicacion de delta contra baseline C021.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-021f-a-t3-revalidation-delta`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: demostrar que aun no existia evidencia post-remediacion para `A.T3`.

- comando:
  - `node -e "..."` (check de existencia de `.audit_tmp/c021-a-t3/enterprise-menu1.json`)
- resultado:
  - `exit_code=1` (fallo esperado)
- evidencia:
  - `.audit_tmp/c021-a-t3-red.out`

### GREEN

Objetivo: generar evidencia full-repo post-remediacion y validar contrato de fase A.

1. Revalidacion full-repo:
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c021-a-t3/enterprise-menu1.json --menu-log=.audit_tmp/c021-a-t3/menu-option1.out --parity=.audit-reports/c021-a-t3-legacy-parity-menu1.md --parity-log=.audit_tmp/c021-a-t3/parity-menu1.out --out-dir=.audit_tmp/c021-a-t3`
   - salida relevante:
     - `total_violations=134`
     - `coverage_ratio=1`
     - `parity_exit=1` (comparativa legacy informativa, no bloqueante para delta C021)

2. Validacion de aceptacion (delta C021):
   - chequeos aplicados:
     - `CRITICAL` debe bajar frente a baseline (`42`)
     - `HIGH` no puede subir frente a baseline (`44`)
     - `coverage_ratio` debe mantenerse en `1`
   - resultado:
     - `status=GREEN_OK`
   - evidencia:
     - `.audit_tmp/c021-a-t3-green.out`

### REFACTOR

Objetivo: consolidar resultado y trazabilidad documental sin cambiar comportamiento.

- reporte oficial publicado en este documento.
- tracking de ciclo/progreso/indices actualizado.
- siguiente tarea activada con una sola entrada en construccion.

## Delta de severidad (baseline C021 vs post A1)

- baseline (`assets/benchmarks/c021-baseline-precommit-v001-baseline.json`):
  - `CRITICAL=42`, `HIGH=44`, `MEDIUM=60`, `LOW=0`, `total=146`
- post A1 (`.audit_tmp/c021-a-t3/enterprise-menu1.json`):
  - `CRITICAL=34`, `HIGH=40`, `MEDIUM=60`, `LOW=0`, `total=134`
- delta:
  - `CRITICAL=-8`
  - `HIGH=-4`
  - `MEDIUM=0`
  - `LOW=0`
  - `total=-12`

## Evidencia asociada

- `.audit_tmp/c021-a-t3-red.out`
- `.audit_tmp/c021-a-t3/enterprise-menu1.json`
- `.audit_tmp/c021-a-t3/menu-option1.out`
- `.audit_tmp/c021-a-t3/parity-menu1.out`
- `.audit-reports/c021-a-t3-legacy-parity-menu1.md`
- `.audit_tmp/c021-a-t3-green.out`

## Salida de T3

- Revalidacion full-repo completada.
- Delta C021 publicado con mejora neta en `CRITICAL` y `HIGH`.
- Cobertura de reglas mantenida (`coverage_ratio=1`).
- Fase A completada y ciclo movido a `C021.B.T1`.
