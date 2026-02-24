# C021 - Seleccion de Lote CRITICAL (Fase A / T1)

Seleccion oficial del primer lote `CRITICAL` priorizado por impacto para iniciar la remediacion de la fase A.

## Fuente de verdad

- Baseline C021:
  - `assets/benchmarks/c021-baseline-precommit-v001.json`
  - `assets/benchmarks/c021-baseline-precommit-v001-baseline.json`

## Snapshot de entrada

- `CRITICAL`: `42`
- `HIGH`: `44`
- `MEDIUM`: `60`
- `LOW`: `0`
- `rules_coverage ratio`: `1.0`

## Criterio de priorizacion aplicado

1. Maximo impacto inmediato en `CRITICAL`.
2. Menor blast radius funcional (ficheros acotados).
3. Remediacion con TDD sin romper trazabilidad `ruleId/file:line`.

## Lote CRITICAL seleccionado (A1)

### Reglas incluidas

1. `common.error.empty_catch` (`4`)
2. `skills.backend.no-empty-catch` (`4`)

Total del lote A1: `8` hallazgos `CRITICAL`.

### Ficheros objetivo del lote A1

- `integrations/lifecycle/gitService.ts`
- `integrations/lifecycle/update.ts`
- `scripts/adapter-session-status-writes-log-filter-lib.ts`
- `scripts/framework-menu-matrix-canary-lib.ts`

## Backlog CRITICAL restante tras A1 (para siguientes lotes)

- `common.types.undefined_in_base_type` (`33`)
- `workflow.bdd.missing_feature_files` (`1`)

## Salida de T1

- Lote `CRITICAL` inicial seleccionado y versionado.
- Riesgo acotado a 4 ficheros para arrancar `C021.A.T2`.
- Tracking de ciclo movido a implementacion TDD del lote A1.

## NEXT

NEXT: lote A1 completado en fase A. Avanzar a `C021.B.T1` para seleccionar lote `HIGH` priorizado por riesgo.
