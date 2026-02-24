# C022 - Delta de severidad tras remediacion A1 (Fase A / T3)

Ejecucion formal de `C022.A.T3`: revalidacion full-repo y publicacion de delta contra baseline C022.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-022f-a-t3-critical-severity-delta`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: demostrar que aun no existia reporte oficial de delta para `A.T3`.

- evidencia:
  - `.audit_tmp/c022-a-t3-red.out`
- resultado:
  - `has_delta_doc_rc=1`
  - `baseline_critical=34`
  - `status=RED_OK`
  - `exit_code=1`

### GREEN

Objetivo: revalidar full-repo tras `A1`, comprobar contrato de fase A y publicar delta reproducible.

1. Revalidacion full-repo:
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c022-a-t3/enterprise-menu1.json --menu-log=.audit_tmp/c022-a-t3/menu-option1.out --parity=.audit-reports/c022-a-t3-legacy-parity-menu1.md --parity-log=.audit_tmp/c022-a-t3/parity-menu1.out --out-dir=.audit_tmp/c022-a-t3`
   - salida relevante:
     - `total_violations=45`
     - `coverage_ratio=1`
     - `parity_exit=1` (comparativa legacy informativa, no bloqueante para delta C022)

2. Validacion de aceptacion (fase A):
   - chequeos aplicados:
     - `CRITICAL` debe bajar frente a baseline C022 (`34`)
     - `HIGH` no puede subir frente a baseline C022 (`27`)
     - `coverage_ratio` debe mantenerse en `1`
     - lote `A1` en `core/integrations` para `common.types.undefined_in_base_type` debe seguir en `0`
   - resultado:
     - `status=GREEN_OK`
   - evidencia:
     - `.audit_tmp/c022-a-t3-green.out`

### REFACTOR

- consolidacion del delta reproducible en este documento.
- actualizacion de tracking de ciclo/progreso e indices oficiales.
- ajuste tipado incluido en esta task para mantener compilacion global:
  - `integrations/config/skillsCustomRules.ts` (`loadCustomSkillsLock` tipado explicito `SkillsLockV1 | undefined`).
- verificacion de compilacion:
  - `npm run typecheck` -> `exit_code=0` (`.audit_tmp/c022-a-t3-typecheck.exit`).

## Delta de severidad (baseline C022 vs post A1)

- baseline (`assets/benchmarks/c022-baseline-precommit-v001-baseline.json`):
  - `CRITICAL=34`, `HIGH=27`, `MEDIUM=0`, `LOW=0`, `total=61`
- post A1 (`.audit_tmp/c022-a-t3/enterprise-menu1.json`):
  - `CRITICAL=18`, `HIGH=27`, `MEDIUM=0`, `LOW=0`, `total=45`
- delta:
  - `CRITICAL=-16`
  - `HIGH=0`
  - `MEDIUM=0`
  - `LOW=0`
  - `total=-16`

## Diff reproducible por regla y fichero

Fuente: `.audit_tmp/c022-a-t3-diff.json`.

### Reglas con mejora (delta negativo)

1. `common.types.undefined_in_base_type`: `33 -> 17` (`-16`)

### Ficheros con mejora (delta negativo, top)

1. `core/facts/detectors/typescript/index.ts`: `2 -> 1` (`-1`)
2. `integrations/config/heuristics.ts`: `1 -> 0` (`-1`)
3. `integrations/config/skillsCustomRules.ts`: `2 -> 1` (`-1`)
4. `integrations/evidence/buildEvidence.ts`: `1 -> 0` (`-1`)
5. `integrations/evidence/repoState.ts`: `1 -> 0` (`-1`)
6. `integrations/lifecycle/cli.ts`: `4 -> 2` (`-2`)
7. `integrations/lifecycle/gitService.ts`: `2 -> 1` (`-1`)
8. `integrations/lifecycle/remove.ts`: `1 -> 0` (`-1`)
9. `integrations/lifecycle/state.ts`: `1 -> 0` (`-1`)
10. `integrations/mcp/enterpriseServer.ts`: `2 -> 1` (`-1`)
11. `integrations/mcp/evidencePayloadCollectionsPaging.ts`: `1 -> 0` (`-1`)
12. `integrations/mcp/evidencePayloadConfig.ts`: `1 -> 0` (`-1`)
13. `integrations/notifications/emitAuditSummaryNotification.ts`: `1 -> 0` (`-1`)
14. `integrations/platform/detectPlatforms.ts`: `1 -> 0` (`-1`)
15. `integrations/sdd/openSpecCli.ts`: `1 -> 0` (`-1`)
16. `integrations/sdd/sessionStore.ts`: `1 -> 0` (`-1`)

### Regresiones

- No se detectan reglas ni ficheros con delta positivo en esta revalidacion.

## Evidencia asociada

- `.audit_tmp/c022-a-t3-red.out`
- `.audit_tmp/c022-a-t3/benchmark.out`
- `.audit_tmp/c022-a-t3/benchmark.exit`
- `.audit_tmp/c022-a-t3/enterprise-menu1.json`
- `.audit_tmp/c022-a-t3/menu-option1.out`
- `.audit_tmp/c022-a-t3/parity-menu1.out`
- `.audit-reports/c022-a-t3-legacy-parity-menu1.md`
- `.audit_tmp/c022-a-t3-diff.json`
- `.audit_tmp/c022-a-t3-green.out`
- `.audit_tmp/c022-a-t3-typecheck.out`
- `.audit_tmp/c022-a-t3-typecheck.exit`

## Salida de T3

- Revalidacion full-repo de fase A completada.
- Delta C022 publicado con reduccion neta en `CRITICAL` y cobertura mantenida (`coverage_ratio=1`).
- Fase A cerrada y ciclo movido a `C022.B.T1`.
