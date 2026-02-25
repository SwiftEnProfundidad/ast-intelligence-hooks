# C022 - Normalizacion de reportes clicables (Fase C / T2)

Ejecucion formal de `C022.C.T2`: normalizar trazabilidad clicable y consistencia de salida entre resumen de evidencia de menu y export legacy.

## Rama de trabajo (Git Flow)

- `feature/p-adhoc-lines-022j-c-t1-medium-quick-wins`

## TDD (RED -> GREEN -> REFACTOR)

### RED

Objetivo: forzar el contrato de consistencia cuando `.ai_evidence.json` contiene paths absolutos.

1. Test endurecido:
   - `scripts/__tests__/framework-menu-evidence-summary.test.ts`
   - nuevo caso: `readEvidenceSummaryForMenu normaliza topFiles absolutos a repo-relative`.
2. Ejecucion:
   - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-evidence-summary.test.ts`
3. Resultado esperado:
   - `.audit_tmp/c022-c-t2-red.out`
   - `.audit_tmp/c022-c-t2-red.exit`
   - `exit_code=1`
   - fallo esperado: `topFiles` devolvia path absoluto en lugar de `apps/...` repo-relative.

### GREEN

Objetivo: aplicar normalizacion determinista de paths en `topFiles` del resumen de evidencia.

1. Cambios aplicados:
   - `scripts/framework-menu-evidence-summary-lib.ts`
     - alta de `normalizePath`, `normalizeRepoRoot` y `toRepoRelativePath`.
     - `toTopFiles` pasa a normalizar paths absolutos internos del repo a formato repo-relative.
   - `scripts/__tests__/framework-menu-evidence-summary.test.ts`
     - test contractual para paths absolutos -> repo-relative.

2. Validacion focal:
   - `.audit_tmp/c022-c-t2-green.out`
   - `.audit_tmp/c022-c-t2-green.exit`
   - resultado: `tests=5`, `pass=5`, `fail=0`.

3. Validacion ampliada de consistencia menu/export:
   - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-evidence-summary.test.ts scripts/__tests__/framework-menu-legacy-audit.test.ts`
   - `.audit_tmp/c022-c-t2-green-expanded.out`
   - `.audit_tmp/c022-c-t2-green-expanded.exit`
   - resultado: `tests=24`, `pass=24`, `fail=0`.

4. Validacion de aceptacion C.T2:
   - `topFiles` en resumen de evidencia queda repo-relative cuando la entrada llega absoluta.
   - consistencia clicable mantenida con el formato normalizado ya usado por menu/export legacy.
   - sin regresiones en la suite contractual focal ni en la suite ampliada de consistencia.

### REFACTOR

- consolidacion documental de `C022.C.T2` en este informe.
- actualizacion de tracking para dejar `C022.C.T3` como unica tarea en construccion.

## Evidencia asociada

- `.audit_tmp/c022-c-t2-red.out`
- `.audit_tmp/c022-c-t2-red.exit`
- `.audit_tmp/c022-c-t2-green.out`
- `.audit_tmp/c022-c-t2-green.exit`
- `.audit_tmp/c022-c-t2-green-expanded.out`
- `.audit_tmp/c022-c-t2-green-expanded.exit`

## Salida de T2

- Contrato de consistencia de paths absolutos -> repo-relative cerrado para `readEvidenceSummaryForMenu`.
- Reporte operativo de menu mas consistente con trazabilidad clicable en export legacy.
- Fase C avanza a `C022.C.T3` (paridad operativa de entrypoints).
