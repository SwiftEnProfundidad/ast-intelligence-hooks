# Enterprise Audit Stabilization Cycle

Plan operativo **único** del ciclo vigente.  
Todas las fases/tareas están definidas por anticipación; no se añaden tareas nuevas durante ejecución.

## Leyenda
- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Reglas de ejecución del plan
- El seguimiento activo vive solo en este archivo.
- Solo puede haber una tarea en `🚧`.
- Cada tarea cerrada pasa a `✅` y se activa la siguiente `🚧`.
- Si aparece trabajo fuera de alcance, se crea un ciclo nuevo (no se muta este backlog).

## Fase 1 — Estabilización técnica base
- ✅ T1. Diagnóstico profundo de cobertura de reglas/skills por stage.
- ✅ T2. Corrección de telemetría de evidencia (`files_scanned` vs `files_affected` + `evaluation_metrics`).
- ✅ T3. Clasificación multi-plataforma determinista (`iOS/Android/Backend/Frontend/Other`).
- ✅ T4. Regresión end-to-end de matriz de menú (happy/sad/edge + canarios).
- ✅ T5. Cierre Git Flow del bloque T1-T4 (commits, PR, merge y validación post-merge).

## Fase 2 — Hardening legacy scripts
- ✅ T6. Hardening de comandos Git Flow (`npm run gitflow*`) con contrato TDD.
- ✅ T7. Saneamiento de aliases legacy rotos de `package.json` (sin targets locales inexistentes).
- 🚧 T8. Cierre Git Flow del bloque T6+T7.
  - Preparar commits atómicos del bloque.
  - Push de feature.
  - PR a `develop`, merge y validación post-merge (`typecheck` + tests del bloque).
  - Criterio de salida: bloque integrado end-to-end sin drift.

## Fase 3 — Cierre del ciclo
- ⏳ T9. Sincronización final `main/develop` y verificación de ramas limpias.
- ⏳ T10. Cierre formal del ciclo:
  - checklist final de evidencias,
  - estado final de salud del repo,
  - archivo del ciclo en documento de cierre.

