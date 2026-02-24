# C021 - Baseline Full-Repo

Baseline oficial del ciclo `021` para remediación progresiva de deuda técnica del propio repositorio de Pumuki.

## Ejecución canónica

```bash
node --import tsx scripts/run-c020-benchmark.ts \
  --enterprise=.audit_tmp/c021-0-t2/enterprise-menu1.json \
  --menu-log=.audit_tmp/c021-0-t2/menu-option1.out \
  --parity=.audit-reports/c021-legacy-parity-menu1.md \
  --parity-log=.audit_tmp/c021-0-t2/parity-menu1.out \
  --out-dir=.audit_tmp/c021-0-t2
```

## Artefactos versionados (baseline C021)

- `assets/benchmarks/c021-baseline-precommit-v001.json`
- `assets/benchmarks/c021-baseline-precommit-v001-baseline.json`

## Snapshot de línea base

- `stage`: `PRE_COMMIT`
- `audit_mode`: `engine`
- `outcome`: `BLOCK`
- `files_scanned`: `987`
- `total_violations`: `146`
- `CRITICAL`: `42`
- `HIGH`: `44`
- `MEDIUM`: `60`
- `LOW`: `0`

## Cobertura de reglas

- `active`: `417`
- `evaluated`: `417`
- `unevaluated`: `0`
- `coverage_ratio`: `1.0`

## Top reglas (por ocurrencias)

1. `common.types.unknown_without_guard` → `60`
2. `common.types.undefined_in_base_type` → `33`
3. `common.types.record_unknown_requires_type` → `26`
4. `common.network.missing_error_handling` → `6`
5. `common.error.empty_catch` → `4`

## Top ficheros (por ocurrencias)

1. `scripts/framework-menu-matrix-canary-lib.ts` → `6`
2. `core/facts/extractHeuristicFacts.ts` → `4`
3. `integrations/lifecycle/gitService.ts` → `4`
4. `core/facts/detectors/typescript/index.ts` → `3`
5. `integrations/config/skillsCustomRules.ts` → `3`

## Interpretación operativa

- El motor sigue evaluando la totalidad de reglas activas (`coverage_ratio=1.0`).
- La deuda actual está concentrada en reglas de tipos (`unknown/undefined`) y manejo de errores.
- Esta baseline se usa como punto de comparación para las fases `A/B/C` de remediación.

## NEXT

NEXT: ejecutar `C021.0.T3` y fijar contrato de aceptación/KPI por fases para la remediación `CRITICAL` y `HIGH`.
