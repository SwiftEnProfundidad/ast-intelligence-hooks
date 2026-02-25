# C022 - Contrato de Aceptación por Fases

Contrato operativo del ciclo `022` para garantizar salida enterprise por fase, con KPI verificables, evidencia mínima obligatoria y criterios de cierre.

## Principios del contrato

- Una sola tarea en construcción en todo momento.
- Remediación por severidad y riesgo: `CRITICAL` → `HIGH` → `MEDIUM/LOW`.
- Cualquier cambio funcional debe mantener trazabilidad de hallazgos (`ruleId`, `file`, `line`).
- No se acepta regresión de cobertura de reglas (`coverage_ratio` no puede bajar de `1.0`).

## KPI globales de ciclo

- Cobertura de reglas: `active = evaluated` y `unevaluated = 0`.
- Reducción neta de violaciones frente a baseline C022 (`61`).
- Cierre de ramas protegidas con sincronización `origin/main...origin/develop = 0/0`.
- Documentación oficial actualizada en cada hito (`docs/`, `docs/validation/`, `REFRACTOR_PROGRESS`).

## Fase A - Remediación prioritaria CRITICAL

### Entrada

- Baseline oficial disponible:
  - `assets/benchmarks/c022-baseline-precommit-v001.json`
  - `assets/benchmarks/c022-baseline-precommit-v001-baseline.json`

### KPI de aceptación

- `CRITICAL` debe disminuir respecto a `34`.
- Sin incremento de `HIGH` por encima de baseline (`27`) como efecto colateral no justificado.
- `coverage_ratio = 1.0` mantenido.

### Evidencia mínima

- Evidencia de ejecución de auditoría full-repo post-lote.
- Diff de severidad comparado contra baseline C022.
- Actualización de tracking de tareas (`C022` + `REFRACTOR_PROGRESS`).

## Fase B - Remediación estructural HIGH

### KPI de aceptación

- `HIGH` debe disminuir respecto a baseline (`27`).
- `CRITICAL` no puede subir frente al cierre de Fase A.
- `MEDIUM` debe permanecer en `0` o mejorar sin regresión neta.

### Evidencia mínima

- Lotes implementados con TDD (red/green/refactor) documentados.
- Auditoría full-repo y diff por severidad/regla/fichero.

## Fase C - Endurecimiento MEDIUM/LOW + DX

### KPI de aceptación

- `MEDIUM` debe mantenerse en `0` (sin regresión).
- `LOW` estable o a la baja.
- Paridad operativa mantenida en `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, `CI local`, menú/export.

### Evidencia mínima

- Validación de salidas clicables (`file:line`) en exportes.
- Confirmación de consistencia operativa entre entrypoints.

## Fase D - Certificación y cierre

### KPI de aceptación

- Revalidación integral local en verde (tests/compilación/auditoría).
- Informe oficial de cierre C022 publicado.
- Git Flow cerrado y ramas protegidas sincronizadas `0/0`.
- Retiro del MD temporal de ciclo cerrado y consolidación en doc estable.

### Evidencia mínima

- Informe de certificación C022 en `docs/validation/`.
- PRs de cierre y promote documentadas.
- Estado final de ramas protegido y verificable.

## Condiciones de bloqueo

- Más de una tarea en construcción en tracking.
- Pérdida de cobertura de reglas (`coverage_ratio < 1.0`).
- Regresión severa en `CRITICAL` o `HIGH` sin aprobación explícita.
- Cierre de ciclo sin evidencia versionada.

## Informe Oficial de Cierre C022 (D.T2)

Informe oficial consolidado de certificacion del ciclo `022` sin crear nuevos md en `docs/validation/`.

### Revalidacion integral final (D.T1)

Comandos ejecutados:

```bash
npm run test:stage-gates
npm run test:deterministic
npm run typecheck
node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c022-d-t1/enterprise-menu1.json --menu-log=.audit_tmp/c022-d-t1/benchmark-menu-option1.out --parity=.audit-reports/c022-d-t1-legacy-parity-menu1.md --parity-log=.audit_tmp/c022-d-t1/benchmark-parity-menu1.out --out-dir=.audit_tmp/c022-d-t1
printf '1\n10\n' | PUMUKI_SDD_BYPASS=1 node bin/pumuki-framework.js
node bin/pumuki-pre-write.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-commit.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-push.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-ci.js
```

Evidencias principales:
- `.audit_tmp/c022-d-t1/test-stage-gates.out`
- `.audit_tmp/c022-d-t1/test-deterministic.out`
- `.audit_tmp/c022-d-t1/typecheck.out`
- `.audit_tmp/c022-d-t1/benchmark.out`
- `.audit_tmp/c022-d-t1/exits.txt`
- `.audit_tmp/c022-d-t1/summary.json`

Resultados D.T1:
- `test:stage-gates`: `tests=825`, `pass=821`, `fail=0`, `skipped=4`
- `test:deterministic`: `test:evidence=30/30`, `test:mcp=130/130`, `test:heuristics=15/15`
- `typecheck`: `OK` (`exit_code=0`)
- benchmark: `total_violations=19`, `coverage_ratio=1`, `parity_exit=1` (informativo)
- smoke menu/hooks: `menu=0`, `pre_write=1`, `pre_commit=0`, `pre_push=1`, `ci=0`

### Estado final full-repo

Snapshot final (`.audit_tmp/c022-d-t1/enterprise-menu1.json`):
- `stage=PRE_COMMIT`
- `audit_mode=engine`
- `outcome=BLOCK`
- `files_scanned=987`
- `total_violations=19`
- `CRITICAL=18`, `HIGH=1`, `MEDIUM=0`, `LOW=0`
- `rules_coverage.active=417`
- `rules_coverage.evaluated=417`
- `rules_coverage.unevaluated=0`
- `rules_coverage.coverage_ratio=1`

Delta final vs baseline C022 (`assets/benchmarks/c022-baseline-precommit-v001.json`):
- `total`: `61 -> 19` (`-42`)
- `CRITICAL`: `34 -> 18` (`-16`)
- `HIGH`: `27 -> 1` (`-26`)
- `MEDIUM`: `0 -> 0` (`0`)
- `LOW`: `0 -> 0` (`0`)
- cobertura: `coverage_ratio=1` mantenido (`delta=0`)
- evidencia: `.audit_tmp/c022-d-t2-delta.json`

### Veredicto de certificacion local C022 (D.T2)

- `framework_status=READY_FOR_GITFLOW_CLOSE`
- `repo_quality_status=BLOCKED_BY_REAL_FINDINGS` (bloqueo esperado por deuda residual real)
- `cycle_status=CLOSED_D4`

Condicionantes no bloqueantes del contrato:
- `parity_exit=1` en benchmark legacy (informativo frente a baseline legacy externo).
- `pre_write=1` por `OPENSPEC_MISSING` + `EVIDENCE_GATE_BLOCKED` en entorno local.
- `pre_push=1` por rama local sin upstream.

### Cierre final de ciclo C022 (D.T3 + D.T4)

- `D.T3` completado: promote Git Flow `feature -> develop -> main` y sincronizacion protegida `origin/main...origin/develop = 0/0`.
- `D.T4` completado: retiro del tracking temporal `docs/ENTERPRISE_EXECUTION_CYCLE_022.md`.
- consolidacion estable de cierre:
  - `docs/README.md` (sin ciclo activo abierto, ultimo cierre oficial `C022`)
  - `docs/validation/README.md` (trazabilidad de consolidacion `C022`)
  - este documento como fuente de verdad del cierre oficial de `C022`.

### Backlog post-MVP (diferido)

- `NO_MVP_SAAS_MULTI_REPO`: no se añade SaaS ni multi-repo en MVP.
- alcance diferido para fase posterior a MVP validado en monorepo local.

## NEXT

NEXT: ciclo `C022` cerrado; continuidad operativa en `docs/validation/c023-mvp-hotspots-plan.md`.
