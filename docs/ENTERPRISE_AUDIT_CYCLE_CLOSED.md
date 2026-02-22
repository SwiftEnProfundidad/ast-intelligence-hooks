# Plan de Auditoría Enterprise (Cerrado)

Estado: `CERRADO`  
Motivo de cierre: separar histórico y abrir un nuevo plan independiente sin mezclar ciclos.  
Continuación activa: `ninguna (pendiente de nuevo ciclo)`.

## Cierre adicional — Enterprise Audit Stabilization Cycle

Estado: `CERRADO`  
Plan archivado: `docs/ENTERPRISE_AUDIT_STABILIZATION_CYCLE.md`  
Fecha de cierre: `2026-02-22`

### Resumen ejecutivo
- Ciclo de estabilización completado (`T1..T10` en `✅`).
- Sincronización de ramas largas completada y verificada:
  - `origin/main` y `origin/develop` en el mismo SHA.
- Cierre Git Flow documentado con PRs:
  - `#318`, `#319`, `#320`, `#321`, `#322`.

### Criterio de salida
- Evidencias y tracker histórico actualizados.
- Ramas `main/develop` sincronizadas y feature de trabajo re-alineada.
- Ciclo archivado sin tareas huérfanas.

## Leyenda
- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Scope del ciclo
- Reforzar trazabilidad de auditoría (`qué se evaluó`, `qué matcheó`, `qué quedó fuera`).
- Eliminar ambigüedad de resultados a cero.
- Mantener UI legacy++ y contratos actuales sin romper compatibilidad.
- Ejecutar Git Flow completo (`feature/* -> PR develop -> merge`).

## Backlog de tareas
- ✅ T1. Baseline reproducible de auditoría
  - Ejecutar matriz de opciones consumer (`1,2,3,4,5,6,7,9`) en dos rondas consecutivas.
  - Consolidar tabla por opción: `stage`, `outcome`, `files_scanned`, `files_affected`, `findings`, `bySeverity`.
  - Detectar drift entre rondas y registrar causa preliminar.
  - Criterio de salida: baseline estable y repetible.
  - Resultado (2 rondas, estable):
    - `1` -> `stage=PRE_COMMIT`, `outcome=BLOCK`, `files_scanned=939`, `findings=4`
    - `2` -> `stage=PRE_PUSH`, `outcome=BLOCK`, `files_scanned=939`, `findings=8`
    - `3` -> `stage=PRE_COMMIT`, `outcome=PASS`, `files_scanned=0`, `findings=0`, `diagnosis=scope-empty`
    - `4` -> `stage=PRE_PUSH`, `outcome=PASS`, `files_scanned=2`, `findings=0`, `diagnosis=repo-clean`
    - `9` -> `stage=PRE_PUSH`, `outcome=PASS`, `files_scanned=2`, `findings=0`, `diagnosis=repo-clean`
  - Drift:
    - `stable=true` en todas las opciones (`1/2/3/4/9`) y sin campos divergentes.

- 🚧 T2. Diagnóstico profundo de cobertura de reglas/skills
  - Mapear por stage: reglas activas, reglas evaluadas, reglas con findings.
  - Detectar reglas/categorías sin trazabilidad explícita.
  - Criterio de salida: inventario verificable `ruleId -> evaluated -> matched`.

- ⏳ T3. Corrección de telemetría de evidencia
  - Persistir métricas de evaluación en `.ai_evidence.json` sin romper contrato.
  - Corregir semántica de `files_scanned` y separar de `files_affected`.
  - Criterio de salida: evidencia consistente entre ejecuciones y scopes.

- ⏳ T4. Ajuste de clasificación multi-plataforma en menú legacy++
  - Mantener siempre `iOS/Android/Backend/Frontend/Other` (incluidos ceros).
  - Garantizar asignación determinista por `path` y `ruleId`.
  - Criterio de salida: mismo input => misma matriz por plataforma.

- ⏳ T5. TDD de regresión end-to-end
  - RED/GREEN/REFACTOR para happy, sad y edge paths de auditoría.
  - Añadir canarios controlados por plataforma y por stage.
  - Criterio de salida: tests deterministas en verde.

- ⏳ T6. Cierre Git Flow y handoff
  - Commits atómicos por bloque funcional.
  - PR a `develop`, merge y validación post-merge.
  - Actualizar documentación de uso si cambia el contrato de evidencia/auditoría.
  - Criterio de salida: ciclo cerrado sin tareas huérfanas.
