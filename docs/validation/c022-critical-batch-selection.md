# C022 - Seleccion de Lote CRITICAL (Fase A / T1)

Seleccion oficial del primer lote `CRITICAL` priorizado por impacto para iniciar la remediacion de la fase A.

## Fuente de verdad

- Baseline C022:
  - `assets/benchmarks/c022-baseline-precommit-v001.json`
  - `assets/benchmarks/c022-baseline-precommit-v001-baseline.json`

## Snapshot de entrada

- `CRITICAL`: `34`
- `HIGH`: `27`
- `MEDIUM`: `0`
- `LOW`: `0`
- `rules_coverage ratio`: `1.0`

## Criterio de priorizacion aplicado

1. Maximo impacto inmediato en `CRITICAL`.
2. Menor blast radius funcional, empezando por `core/` + `integrations/`.
3. Remediacion con TDD sin romper trazabilidad `ruleId/file:line`.

## Lote CRITICAL seleccionado (A1)

### Reglas incluidas

1. `common.types.undefined_in_base_type` (`16`)

Total del lote A1: `16` hallazgos `CRITICAL`.

### Ficheros objetivo del lote A1

- `core/facts/detectors/typescript/index.ts`
- `integrations/config/heuristics.ts`
- `integrations/config/skillsCustomRules.ts`
- `integrations/evidence/buildEvidence.ts`
- `integrations/evidence/repoState.ts`
- `integrations/lifecycle/cli.ts`
- `integrations/lifecycle/gitService.ts`
- `integrations/lifecycle/remove.ts`
- `integrations/lifecycle/state.ts`
- `integrations/mcp/enterpriseServer.ts`
- `integrations/mcp/evidencePayloadCollectionsPaging.ts`
- `integrations/mcp/evidencePayloadConfig.ts`
- `integrations/notifications/emitAuditSummaryNotification.ts`
- `integrations/platform/detectPlatforms.ts`
- `integrations/sdd/openSpecCli.ts`
- `integrations/sdd/sessionStore.ts`

## Backlog CRITICAL restante tras A1 (para siguientes lotes)

- `common.types.undefined_in_base_type` (`17`) en `scripts/*.ts`.
- `workflow.bdd.missing_feature_files` (`1`) en `PROJECT_ROOT`.

## Salida de T1

- Lote `CRITICAL` inicial seleccionado y versionado.
- Riesgo acotado a capa `core/integrations` para arrancar `C022.A.T2`.
- Tracking de ciclo movido a implementacion TDD del lote A1.

## NEXT

NEXT: ejecutar `C022.A.T2` y aplicar remediacion TDD del lote `CRITICAL` A1.
