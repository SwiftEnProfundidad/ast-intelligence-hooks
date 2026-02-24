# C021 - Contrato de Aceptación por Fases

Contrato operativo del ciclo `021` para garantizar salida enterprise por fase, con KPI verificables, evidencia mínima obligatoria y criterios de cierre.

## Principios del contrato

- Una sola tarea en construcción en todo momento.
- Remediación por severidad y riesgo: `CRITICAL` → `HIGH` → `MEDIUM/LOW`.
- Cualquier cambio funcional debe mantener trazabilidad de hallazgos (`ruleId`, `file`, `line`).
- No se acepta regresión de cobertura de reglas (`coverage_ratio` no puede bajar de `1.0`).

## KPI globales de ciclo

- Cobertura de reglas: `active = evaluated` y `unevaluated = 0`.
- Reducción neta de violaciones frente a baseline C021 (`146`).
- Cierre de ramas protegidas con sincronización `origin/main...origin/develop = 0/0`.
- Documentación oficial actualizada en cada hito (`docs/`, `docs/validation/`, `REFRACTOR_PROGRESS`).

## Fase A - Remediación prioritaria CRITICAL

### Entrada

- Baseline oficial disponible:
  - `assets/benchmarks/c021-baseline-precommit-v001.json`
  - `assets/benchmarks/c021-baseline-precommit-v001-baseline.json`

### KPI de aceptación

- `CRITICAL` debe disminuir respecto a `42`.
- Sin incremento de `HIGH` por encima de baseline (`44`) como efecto colateral no justificado.
- `coverage_ratio = 1.0` mantenido.

### Evidencia mínima

- Evidencia de ejecución de auditoría full-repo post-lote.
- Diff de severidad comparado contra baseline C021.
- Actualización de tracking de tareas (`C021` + `REFRACTOR_PROGRESS`).

## Fase B - Remediación estructural HIGH

### KPI de aceptación

- `HIGH` debe disminuir respecto a baseline (`44`).
- `CRITICAL` no puede subir frente al cierre de Fase A.
- `MEDIUM` puede fluctuar de forma controlada, pero no con degradación estructural neta.

### Evidencia mínima

- Lotes implementados con TDD (red/green/refactor) documentados.
- Auditoría full-repo y diff por severidad/regla/fichero.

## Fase C - Endurecimiento MEDIUM/LOW + DX

### KPI de aceptación

- Reducción de `MEDIUM` respecto a baseline (`60`).
- `LOW` estable o a la baja.
- Paridad operativa mantenida en `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, `CI local`, menú/export.

### Evidencia mínima

- Validación de salidas clicables (`file:line`) en exportes.
- Confirmación de consistencia operativa entre entrypoints.

## Fase D - Certificación y cierre

### KPI de aceptación

- Revalidación integral local en verde (tests/compilación/auditoría).
- Informe oficial de cierre C021 publicado.
- Git Flow cerrado y ramas protegidas sincronizadas `0/0`.
- Retiro del MD temporal de ciclo cerrado y consolidación en doc estable.

### Evidencia mínima

- Informe de certificación C021 en `docs/validation/`.
- PRs de cierre y promote documentadas.
- Estado final de ramas protegido y verificable.

## Condiciones de bloqueo

- Más de una tarea en construcción en tracking.
- Pérdida de cobertura de reglas (`coverage_ratio < 1.0`).
- Regresión severa en `CRITICAL` o `HIGH` sin aprobación explícita.
- Cierre de ciclo sin evidencia versionada.

## NEXT

NEXT: ejecutar `C021.D.T4` para retiro del MD temporal de ciclo y consolidacion documental estable.
