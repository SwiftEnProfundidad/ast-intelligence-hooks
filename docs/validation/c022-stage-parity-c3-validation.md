# C022 - Stage Parity Validation (Fase C / T3)

Ejecucion formal de `C022.C.T3`: verificar paridad operativa entre `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH` y `CI local` sin degradar cobertura ni severidad.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-022j-c-t1-medium-quick-wins`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: demostrar ausencia de evidencia C.T3 antes de la ejecucion de paridad.

- evidencia:
  - `.audit_tmp/c022-c-t3-red.out`
  - `.audit_tmp/c022-c-t3-red.exit`
- resultado:
  - `has_stage_summary_rc=1`
  - `has_exits_rc=1`
  - `status=RED_OK`
  - `exit_code=1`
  - faltaban:
    - `.audit_tmp/c022-c-t3/stage-summary.json`
    - `.audit_tmp/c022-c-t3/exits.txt`

### GREEN

Objetivo: ejecutar entrypoints reales y validar contrato operativo por stage.

1. Ejecuciones reales:

```bash
printf '1\n10\n' | PUMUKI_SDD_BYPASS=1 node bin/pumuki-framework.js
node bin/pumuki-pre-write.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-commit.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-push.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-ci.js
```

2. Artefactos generados:
   - `.audit_tmp/c022-c-t3/menu-option1.out`
   - `.audit_tmp/c022-c-t3/pre-write.out`
   - `.audit_tmp/c022-c-t3/pre-commit.out`
   - `.audit_tmp/c022-c-t3/pre-push.out`
   - `.audit_tmp/c022-c-t3/ci.out`
   - `.audit_tmp/c022-c-t3/exits.txt`
   - `.audit_tmp/c022-c-t3/stage-summary.json`
   - `.audit_tmp/c022-c-t3/evidence-hashes.json`

3. Validacion de paridad (`GREEN`):
   - `.audit_tmp/c022-c-t3-green.out`
   - `.audit_tmp/c022-c-t3-green.exit`
   - `status=GREEN_OK`

4. Resultado por entrypoint:
   - `menu_option1`:
     - `exit=0`
   - `pre_write`:
     - `exit=1` (esperado)
     - salida confirma `stage=PRE_WRITE` y bloqueo por `OPENSPEC_MISSING` + `EVIDENCE_GATE_BLOCKED`.
   - `pre_commit`:
     - `exit=0`
   - `pre_push`:
     - `exit=1` (esperado en rama sin upstream)
     - mensaje explicito: `branch has no upstream tracking reference`.
   - `ci`:
     - `exit=0`

5. Validacion ampliada:
   - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts scripts/__tests__/framework-menu-consumer-runtime.test.ts`
   - artefacto: `.audit_tmp/c022-c-t3-static.out`
   - resultado: `tests=26`, `pass=26`, `fail=0`, `exit_code=0`

6. Revalidacion full-repo:
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c022-c-t3/enterprise-menu1.json --menu-log=.audit_tmp/c022-c-t3/benchmark-menu-option1.out --parity=.audit-reports/c022-c-t3-legacy-parity-menu1.md --parity-log=.audit_tmp/c022-c-t3/benchmark-parity-menu1.out --out-dir=.audit_tmp/c022-c-t3`
   - salida relevante (`.audit_tmp/c022-c-t3-benchmark.out`):
     - `total_violations=19`
     - `coverage_ratio=1`
     - `parity_exit=1` (informativo frente a baseline legacy externo)
     - `benchmark_exit=1` (derivado de `parity_exit`)

### REFACTOR

- consolidacion de evidencia operativa de stages y cierre documental de `C022.C.T3`.
- avance del ciclo a fase D con `C022.D.T1` como unica tarea en construccion.

## Evidencia asociada

- `.audit_tmp/c022-c-t3-red.out`
- `.audit_tmp/c022-c-t3-red.exit`
- `.audit_tmp/c022-c-t3-green.out`
- `.audit_tmp/c022-c-t3-green.exit`
- `.audit_tmp/c022-c-t3-static.out`
- `.audit_tmp/c022-c-t3-static.exit`
- `.audit_tmp/c022-c-t3-benchmark.out`
- `.audit_tmp/c022-c-t3-benchmark.exit`
- `.audit_tmp/c022-c-t3/exits.txt`
- `.audit_tmp/c022-c-t3/stage-summary.json`
- `.audit_tmp/c022-c-t3/evidence-hashes.json`
- `.audit_tmp/c022-c-t3/menu-option1.out`
- `.audit_tmp/c022-c-t3/pre-write.out`
- `.audit_tmp/c022-c-t3/pre-commit.out`
- `.audit_tmp/c022-c-t3/pre-push.out`
- `.audit_tmp/c022-c-t3/ci.out`
- `.audit_tmp/c022-c-t3/enterprise-menu1.json`
- `.audit_tmp/c022-c-t3/benchmark-menu-option1.out`
- `.audit_tmp/c022-c-t3/benchmark-parity-menu1.out`
- `.audit-reports/c022-c-t3-legacy-parity-menu1.md`

## Salida de T3

- Paridad operativa validada entre entrypoints en contexto local real.
- Contratos de stage y modos (`engine`/`gate`) consistentes con comportamiento esperado.
- Fase C cerrada y ciclo listo para `C022.D.T1`.
