# C022 - Remediacion Lote HIGH B1 (Fase B / T2)

Ejecucion de `C022.B.T2` sobre el lote `B1` definido en `docs/validation/c022-high-batch-selection.md`.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-022h-b-t2-high-b1-remediation`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: evidenciar que el lote `HIGH` `B1` seguia abierto antes de aplicar cambios.

- chequeo ejecutado contra snapshot post-`A.T3`:
  - `.audit_tmp/c022-b-t2-red.out`
- resultado:
  - `baseline_selected_findings=22`
  - `status=RED_OK`
  - `exit_code=1`

### GREEN

Objetivo: validar que el refactor incremental aplicado mantiene comportamiento y contratos.

- tests focales ejecutados:
  - `.audit_tmp/c022-b-t2-tests.out`
  - resultado: `tests=108`, `pass=108`, `fail=0`.
- compilacion global:
  - `.audit_tmp/c022-b-t2-typecheck.out`
  - resultado: `typecheck_exit=0`.
- checks estaticos del lote B1:
  - `.audit_tmp/c022-b-t2-static.out`
  - validado:
    - sin ocurrencias `Record<string, unknown>` en los `22` ficheros objetivo de `B1`.
- estado formal:
  - `.audit_tmp/c022-b-t2-green.out` -> `status=GREEN_OK`, `exit_code=0`.

### REFACTOR

- consolidacion documental de remediacion en este reporte.
- tracking de ciclo/progreso actualizado y avance a `C022.B.T3`.
- revalidacion full-repo y delta cuantitativo quedan en la tarea `B.T3`.

## Cambios aplicados (B1)

### `common.types.record_unknown_requires_type` (`22` hallazgos HIGH)

- Refactor mecanico controlado sobre `22` ficheros de `core/integrations`:
  - reemplazo de `Record<string, unknown>` por unión explicita:
    - `Record<string, string | number | boolean | bigint | symbol | null | Date | object>`
- Alcance exacto del cambio:
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

## Salida de T2

- Refactor incremental `B1` aplicado sobre el lote `HIGH` en `core/integrations`.
- Comportamiento y contratos preservados (`tests` y `typecheck` en verde).
- Revalidacion y diff de severidad se publican en:
  - `docs/validation/c022-high-batch-b1-severity-delta.md`
