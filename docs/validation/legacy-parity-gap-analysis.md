# Legacy Parity Gap Analysis

Análisis de paridad/superación frente a baseline legacy para detección de violaciones.

## Alcance y método

- Baseline legacy histórico normalizado:
  - `e0c221d:assets/readme/forensics-violations/20260223-025640/legacy-parity-input.json`
- Evidencia enterprise actual:
  - `.ai_evidence.json`
- Comparativa ejecutada con:

```bash
node --import tsx scripts/build-legacy-parity-report.ts \
  --legacy=.audit_tmp/p-adhoc-lines-010-legacy-baseline.json \
  --enterprise=.ai_evidence.json \
  --out=.audit-reports/p-adhoc-lines-010-legacy-parity.md \
  --allow-scope-mismatch
```

Nota: `strict_scope` se desactiva solo para permitir comparación histórica (`files_scanned 978` vs `981`) manteniendo mismo `stage=PRE_COMMIT` y `repo_root`.

## Resultado de paridad (severidad)

Fuente: `.audit-reports/p-adhoc-lines-010-legacy-parity.md`

- Dominancia global: `FAIL`
- Matriz de severidad:
  - `CRITICAL`: legacy `9` vs enterprise `42` -> `PASS`
  - `HIGH`: legacy `41` vs enterprise `37` -> `FAIL` (gap `-4`)
  - `MEDIUM`: legacy `21` vs enterprise `4` -> `FAIL` (gap `-17`)
  - `LOW`: legacy `0` vs enterprise `0` -> `PASS`

Conclusión: el motor enterprise ya supera baseline en `CRITICAL`, pero aún no supera baseline en `HIGH` y `MEDIUM`.

## Brechas por familia de reglas

Comparativa contra baseline de reglas legacy (forense histórico `LEGACY_VS_INDEPENDENT_SKILLS_AUDIT_REPORT`):

| Familia | Regla | Legacy | Enterprise actual | Gap |
| --- | --- | ---: | ---: | ---: |
| Type safety | `common.types.record_unknown_requires_type` | 33 | 26 | -7 |
| Type safety | `common.types.unknown_without_guard` | 16 | 4 | -12 |
| Type safety | `common.types.undefined_in_base_type` | 1 | 33 | +32 |
| Error handling | `common.error.empty_catch` | 7 | 4 | -3 |
| Error handling | `common.network.missing_error_handling` | 6 | 0 | -6 |
| Workflow | `workflow.bdd.missing_feature_files` | 1 | 1 | 0 |
| Workflow | `workflow.bdd.insufficient_features` | 1 | 1 | 0 |
| Quality hygiene | `common.debug.console` | 3 | 0 | -3 |
| Quality hygiene | `common.quality.todo_fixme` | 1 | 0 | -1 |
| Testing quality | `common.testing.prefer_spy_over_mock` | 1 | 0 | -1 |
| Maintainability | `shell.maintainability.large_script` | 1 | 0 | -1 |

### Lectura de brechas

- Déficit principal en `HIGH/MEDIUM` concentrado en:
  - `unknown_without_guard` (gap 12)
  - `record_unknown_requires_type` (gap 7)
  - `network.missing_error_handling` (gap 6)
- Déficit secundario:
  - `empty_catch` (gap 3)
  - higiene de calidad (`console/todo/spy/large_script`) (gap agregado 6)
- Superávit:
  - `undefined_in_base_type` (+32), ya por encima de legacy.

## Plan de corrección priorizado (impacto)

1. `P0` Recuperar paridad `HIGH/MEDIUM` en type safety:
   - reforzar detectores y cobertura de `unknown_without_guard` y `record_unknown_requires_type`.
   - objetivo mínimo: cerrar gap `12 + 7 = 19`.
2. `P0` Recuperar `error handling` de red:
   - activar/ajustar `common.network.missing_error_handling` (actual `0`, objetivo `>=6`).
3. `P1` Cerrar gap de `empty_catch`:
   - ampliar detectores para igualar/superar baseline (`4 -> >=7`).
4. `P1` Reintroducir señales de higiene:
   - `common.debug.console`, `common.quality.todo_fixme`, `common.testing.prefer_spy_over_mock`, `shell.maintainability.large_script`.
5. `P2` Revalidación final:
   - rerun full audit + parity report.
   - criterio de salida: `CRITICAL/HIGH/MEDIUM` enterprise `>=` legacy en matriz de severidad.
