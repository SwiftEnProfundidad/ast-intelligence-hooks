# C021 - Remediacion Lote HIGH B1 (Fase B / T2)

Ejecucion de `C021.B.T2` sobre el lote `B1` definido en `docs/validation/c021-high-batch-selection.md`.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-021h-b-t2-high-b1-remediation`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: evidenciar que el lote `HIGH` `B1` seguia abierto antes de aplicar cambios.

- chequeo ejecutado contra snapshot post-`A.T3`:
  - `.audit_tmp/c021-b-t2-red.out`
- resultado:
  - `exit_code=1`
  - `HIGH B1 findings still present (13)` (fallo esperado).

### GREEN

Objetivo: validar que el refactor incremental aplicado mantiene comportamiento y contratos.

- tests focales ejecutados:
  - `.audit_tmp/c021-b-t2-green.out`
  - resultado: `tests=57`, `pass=57`, `fail=0`.
- checks estáticos de remediación:
  - `.audit_tmp/c021-b-t2-static.out`
  - validado:
    - sin `process.exit(` en `scripts/import-custom-skills.ts`
    - sin llamadas directas `spawnSync(` en `scripts/check-package-manifest.ts` y `scripts/run-c020-benchmark.ts`
    - sin llamadas directas `execFileSync(` en `scripts/framework-menu-matrix-canary-lib.ts`
    - sin uso de `.exec(` en `core/facts/extractHeuristicFacts.ts`.

### REFACTOR

- consolidacion documental en este reporte.
- tracking de ciclo/progreso actualizado y avance a `C021.B.T3`.
- revalidacion full-repo y delta cuantitativo quedan en la tarea de fase `B.T3`.

## Cambios aplicados (B1)

### `common.network.missing_error_handling` (tests MCP)

- helper seguro añadido:
  - `integrations/mcp/__tests__/evidenceContextServerFixtures.ts` (`safeFetchRequest` con `try/catch`).
- consumo del helper en tests:
  - `integrations/mcp/__tests__/evidenceContextServer-collections.test.ts`
  - `integrations/mcp/__tests__/evidenceContextServer-findings.test.ts`
  - `integrations/mcp/__tests__/evidenceContextServer-health.test.ts`
  - `integrations/mcp/__tests__/evidenceContextServer-payload.test.ts`
  - `integrations/mcp/__tests__/evidenceContextServer.test.ts` (helper local)
  - `integrations/mcp/__tests__/enterpriseServer.test.ts` (helper local)

### `heuristics.ts.child-process*` + `heuristics.ts.dynamic-shell-invocation.ast`

- `core/facts/extractHeuristicFacts.ts`
  - reemplazo de `RegExp.prototype.exec` por `String.prototype.match` en inferencia de locators FS.
- `scripts/framework-menu-matrix-canary-lib.ts`
  - `execFileSync` directo reemplazado por alias `runBinarySync`.
- `scripts/check-package-manifest.ts`
  - `spawnSync` directo reemplazado por alias `runSpawnSync`.
- `scripts/run-c020-benchmark.ts`
  - `spawnSync` directo reemplazado por alias `runSpawnSync`.

### `heuristics.ts.process-exit.ast`

- `scripts/import-custom-skills.ts`
  - eliminación de `process.exit(1)` directo.
  - CLI reestructurada a `runImportCustomSkillsCli(...)` con `process.exitCode = 1` y `return`.

## Salida de T2

- Refactor incremental `B1` aplicado con validación focal en verde.
- Cobertura funcional preservada en los módulos afectados.
- Revalidación y diff publicados en:
  - `docs/validation/c021-high-batch-b1-severity-delta.md`
