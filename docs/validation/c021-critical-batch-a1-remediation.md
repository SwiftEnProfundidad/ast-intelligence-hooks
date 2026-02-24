# C021 - Remediacion Lote CRITICAL A1 (Fase A / T2)

Ejecucion de `C021.A.T2` sobre el lote `A1` definido en `docs/validation/c021-critical-batch-selection.md`.

## Alcance ejecutado

- Reglas objetivo del lote:
  - `common.error.empty_catch` (`4`)
  - `skills.backend.no-empty-catch` (`4`)
- Ficheros objetivo:
  - `integrations/lifecycle/gitService.ts`
  - `integrations/lifecycle/update.ts`
  - `scripts/adapter-session-status-writes-log-filter-lib.ts`
  - `scripts/framework-menu-matrix-canary-lib.ts`

## Cambios aplicados (refactor)

- `integrations/lifecycle/gitService.ts`
  - `clearLocalConfig`: `catch {}` eliminado, captura explícita con bloque no vacío.
- `integrations/lifecycle/update.ts`
  - rollback de `runLifecycleUpdate`: `catch {}` eliminado, captura explícita de error de rollback.
- `scripts/adapter-session-status-writes-log-filter-lib.ts`
  - parseo JSON por línea: `catch {}` eliminado, fallback explícito con `continue`.
- `scripts/framework-menu-matrix-canary-lib.ts`
  - limpieza de índice/canary en fallback: bloques `catch` vacíos o con comentario reemplazados por captura explícita no vacía.

Nota: se mantiene la cadena literal `'  } catch {}'` en el canario backend porque representa la violación sintética que debe detectar el motor en pruebas de matriz.

## Evidencia de verificacion local (green)

- Comando ejecutado:
  - `npx --yes tsx --test integrations/lifecycle/__tests__/gitService.test.ts integrations/lifecycle/__tests__/update.test.ts scripts/__tests__/adapter-session-status-report-lib.test.ts scripts/__tests__/framework-menu-matrix-canary.test.ts`
- Resultado:
  - `tests=22`, `pass=22`, `fail=0`.

## Salida de T2

- Lote `A1` remediado en código fuente sin `catch` vacíos en los ficheros objetivo.
- Cobertura de comportamiento preservada en tests focales.
- Revalidacion y delta publicados en:
  - `docs/validation/c021-critical-batch-a1-severity-delta.md`
