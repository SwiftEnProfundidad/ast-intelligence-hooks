# C022 - Delta de severidad tras remediacion HIGH B1 (Fase B / T3)

Ejecucion formal de `C022.B.T3`: revalidacion full-repo y publicacion de diff reproducible contra baseline C022.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-022i-b-t3-high-revalidation-diff`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: demostrar que no existia evidencia post-remediacion de `B.T3`.

- comprobacion previa:
  - `.audit_tmp/c022-b-t3-red.out`
- resultado:
  - `has_post_enterprise_evidence_rc=1`
  - `status=RED_OK`
  - `exit_code=1`

### GREEN

Objetivo: generar evidencia full-repo post-B1 y validar contrato de fase B.

1. Revalidacion full-repo:
   - comando:
     - `node --import tsx scripts/run-c020-benchmark.ts --enterprise=.audit_tmp/c022-b-t3/enterprise-menu1.json --menu-log=.audit_tmp/c022-b-t3/menu-option1.out --parity=.audit-reports/c022-b-t3-legacy-parity-menu1.md --parity-log=.audit_tmp/c022-b-t3/parity-menu1.out --out-dir=.audit_tmp/c022-b-t3`
   - salida relevante:
     - `total_violations=23`
     - `coverage_ratio=1`
     - `parity_exit=1` (comparativa legacy informativa, no bloqueante para diff C022)

2. Validacion de aceptacion (fase B):
   - chequeos aplicados:
     - `HIGH` debe bajar vs baseline C022 (`27`)
     - `CRITICAL` no puede subir vs cierre de fase A (`18`)
     - `coverage_ratio` debe mantenerse en `1`
     - tests focales en verde (`108/108`)
     - `typecheck` global en verde
   - resultado:
     - `.audit_tmp/c022-b-t3-green.out` -> `status=GREEN_OK`, `exit_code=0`

### REFACTOR

- consolidacion del diff reproducible en este documento.
- ajuste de contencion incluido durante `B.T3`:
  - se removio `| undefined` de la union de `Record<string, ...>` aplicada en `B.T2`,
    para evitar regresion sobre `common.types.undefined_in_base_type`.
- actualizacion de tracking de ciclo/progreso e indices oficiales.

## Diff de severidad

### Baseline C022 (`assets/benchmarks/c022-baseline-precommit-v001-baseline.json`)

- `CRITICAL=34`
- `HIGH=27`
- `MEDIUM=0`
- `LOW=0`
- `total=61`

### Post fase B (`.audit_tmp/c022-b-t3/enterprise-menu1.json`)

- `CRITICAL=18`
- `HIGH=5`
- `MEDIUM=0`
- `LOW=0`
- `total=23`

### Delta vs baseline C022

- `CRITICAL=-16`
- `HIGH=-22`
- `MEDIUM=0`
- `LOW=0`
- `total=-38`

### Delta vs cierre fase A (`.audit_tmp/c022-a-t3/enterprise-menu1.json`)

- `CRITICAL=0`
- `HIGH=-22`
- `MEDIUM=0`
- `LOW=0`
- `total=-22`

## Diff reproducible por regla y fichero

Fuente de diff: `.audit_tmp/c022-b-t3-diff.json`.

### Top reglas con mejora (delta negativo)

1. `common.types.record_unknown_requires_type`: `26 -> 4` (`-22`)
2. `common.types.undefined_in_base_type`: `33 -> 17` (`-16`)

### Top ficheros con mejora (delta negativo)

1. `core/facts/detectors/typescript/index.ts`
2. `integrations/config/heuristics.ts`
3. `integrations/config/skillsCustomRules.ts`
4. `integrations/evidence/buildEvidence.ts`
5. `integrations/evidence/repoState.ts`
6. `integrations/lifecycle/cli.ts`
7. `integrations/lifecycle/gitService.ts`
8. `integrations/lifecycle/remove.ts`
9. `integrations/lifecycle/state.ts`
10. `integrations/mcp/enterpriseServer.ts`
11. `integrations/mcp/evidencePayloadCollectionsPaging.ts`
12. `integrations/mcp/evidencePayloadConfig.ts`
13. `integrations/notifications/emitAuditSummaryNotification.ts`
14. `integrations/platform/detectPlatforms.ts`
15. `integrations/sdd/openSpecCli.ts`
16. `integrations/sdd/sessionStore.ts`
17. `core/facts/detectors/browser/index.ts`
18. `core/facts/detectors/process/core.ts`
19. `core/facts/detectors/process/shell.ts`
20. `core/facts/detectors/process/spawn.ts`

### Regresiones

- No se detectan reglas ni ficheros con delta positivo.

## Evidencia asociada

- `.audit_tmp/c022-b-t3-red.out`
- `.audit_tmp/c022-b-t3/benchmark.out`
- `.audit_tmp/c022-b-t3/benchmark.exit`
- `.audit_tmp/c022-b-t3/enterprise-menu1.json`
- `.audit_tmp/c022-b-t3/menu-option1.out`
- `.audit_tmp/c022-b-t3/parity-menu1.out`
- `.audit-reports/c022-b-t3-legacy-parity-menu1.md`
- `.audit_tmp/c022-b-t3-tests.out`
- `.audit_tmp/c022-b-t3-typecheck.out`
- `.audit_tmp/c022-b-t3-typecheck.exit`
- `.audit_tmp/c022-b-t3-diff.json`
- `.audit_tmp/c022-b-t3-green.out`

## Salida de T3

- Revalidacion full-repo de fase B completada.
- Diff reproducible publicado (`severidad/reglas/ficheros`) contra baseline C022.
- KPI de fase B cumplidos (`HIGH` baja, `CRITICAL` no sube vs cierre fase A, `coverage_ratio=1`).
- Fase B cerrada y ciclo movido a `C022.C.T1`.
