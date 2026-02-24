# C022 - Baseline Full-Repo

Baseline oficial del ciclo `022` para remediación progresiva de deuda técnica del propio repositorio de Pumuki.

## Ejecución canónica

```bash
node --import tsx scripts/run-c020-benchmark.ts \
  --enterprise=.audit_tmp/c022-0-t2/enterprise-menu1.json \
  --menu-log=.audit_tmp/c022-0-t2/menu-option1.out \
  --parity=.audit-reports/c022-legacy-parity-menu1.md \
  --parity-log=.audit_tmp/c022-0-t2/parity-menu1.out \
  --out-dir=.audit_tmp/c022-0-t2
```

## Artefactos versionados (baseline C022)

- `assets/benchmarks/c022-baseline-precommit-v001.json`
- `assets/benchmarks/c022-baseline-precommit-v001-baseline.json`

## Snapshot de línea base

- `stage`: `PRE_COMMIT`
- `audit_mode`: `engine`
- `outcome`: `BLOCK`
- `files_scanned`: `987`
- `total_violations`: `61`
- `CRITICAL`: `34`
- `HIGH`: `27`
- `MEDIUM`: `0`
- `LOW`: `0`

## Cobertura de reglas

- `active`: `417`
- `evaluated`: `417`
- `unevaluated`: `0`
- `coverage_ratio`: `1.0`

## Top reglas (por ocurrencias)

1. `common.types.undefined_in_base_type` → `33`
2. `common.types.record_unknown_requires_type` → `26`
3. `workflow.bdd.insufficient_features` → `1`
4. `workflow.bdd.missing_feature_files` → `1`

## Top ficheros (por ocurrencias)

1. `core/facts/detectors/typescript/index.ts` → `2`
2. `integrations/config/skillsCustomRules.ts` → `2`
3. `integrations/mcp/enterpriseServer.ts` → `2`
4. `PROJECT_ROOT` → `2`
5. `core/facts/detectors/browser/index.ts` → `1`

## Interpretación operativa

- El motor sigue evaluando la totalidad de reglas activas (`coverage_ratio=1.0`).
- La deuda actual está concentrada en reglas de tipos y faltas de disciplina BDD.
- Esta baseline se usa como punto de comparación para las fases `A/B/C` del ciclo `022`.

## NEXT

NEXT: ejecutar `C022.A.T2` y aplicar remediacion TDD del lote `CRITICAL` A1.
