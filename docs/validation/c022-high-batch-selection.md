# C022 - Seleccion de Lote HIGH (Fase B / T1)

Seleccion oficial del primer lote `HIGH` priorizado por riesgo tecnico para iniciar la remediacion de la fase B.

## Fuente de verdad

- Baseline C022:
  - `assets/benchmarks/c022-baseline-precommit-v001.json`
  - `assets/benchmarks/c022-baseline-precommit-v001-baseline.json`
- Snapshot post fase A:
  - `.audit_tmp/c022-a-t3/enterprise-menu1.json`

## Snapshot de entrada

- Baseline C022:
  - `CRITICAL`: `34`
  - `HIGH`: `27`
  - `MEDIUM`: `0`
  - `LOW`: `0`
- Post fase A:
  - `CRITICAL`: `18`
  - `HIGH`: `27`
  - `MEDIUM`: `0`
  - `LOW`: `0`
  - `rules_coverage ratio`: `1.0`

## Criterio de priorizacion aplicado

1. Maximizar reduccion de `HIGH` por volumen de regla.
2. Minimizar blast radius iniciando por `core/` + `integrations/`.
3. Mantener trazabilidad AST (`ruleId/file:line`) y preparar lote apto para TDD incremental.

## Lote HIGH seleccionado (B1)

### Reglas incluidas

1. `common.types.record_unknown_requires_type` (`22`) en `core/integrations`.

Total lote B1: `22` hallazgos `HIGH`.

### Ficheros objetivo del lote B1

- `core/facts/detectors/browser/index.ts`
- `core/facts/detectors/process/core.ts`
- `core/facts/detectors/process/shell.ts`
- `core/facts/detectors/process/spawn.ts`
- `core/facts/detectors/security/securityCredentials.ts`
- `core/facts/detectors/security/securityCrypto.ts`
- `core/facts/detectors/security/securityJwt.ts`
- `core/facts/detectors/security/securityTls.ts`
- `core/facts/detectors/typescript/index.ts`
- `core/facts/detectors/utils/astHelpers.ts`
- `core/facts/extractHeuristicFacts.ts`
- `core/utils/stableStringify.ts`
- `integrations/config/compileSkillsLock.ts`
- `integrations/config/loadProjectRules.ts`
- `integrations/config/skillsCustomRules.ts`
- `integrations/config/skillsEffectiveLock.ts`
- `integrations/config/skillsLock.ts`
- `integrations/config/skillsPolicy.ts`
- `integrations/config/skillsSources.ts`
- `integrations/mcp/enterpriseServer.ts`
- `integrations/sdd/policy.ts`
- `integrations/sdd/types.ts`

## Backlog HIGH restante tras B1 (para siguientes lotes)

- `common.types.record_unknown_requires_type` (`4`) en `scripts/*.ts`:
  - `scripts/consumer-ci-auth-check-contract.ts`
  - `scripts/consumer-support-bundle-contract.ts`
  - `scripts/framework-menu-evidence-summary-lib.ts`
  - `scripts/framework-menu-legacy-audit-lib.ts`
- `workflow.bdd.insufficient_features` (`1`) en `PROJECT_ROOT`.

## Salida de T1

- Lote `HIGH` inicial seleccionado y versionado para fase B.
- Riesgo acotado a `core/integrations` para arrancar `C022.B.T2`.
- Tracking de ciclo movido a implementacion TDD del lote B1.

## NEXT

NEXT: ejecutar `C022.B.T2` y aplicar remediacion TDD del lote `HIGH` B1.
