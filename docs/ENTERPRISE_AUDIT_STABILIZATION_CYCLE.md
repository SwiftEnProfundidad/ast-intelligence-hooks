# Enterprise Audit Unified Plan

Plan operativo **único** del proyecto para este frente de trabajo.  
Todas las fases y tareas están definidas por anticipación en este archivo.

Estado del plan: `ACTIVO`

## Leyenda
- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Reglas de seguimiento (obligatorias)
- Este es el **único** MD de plan activo para este ciclo.
- Solo puede haber una tarea en `🚧`.
- Cada tarea cerrada pasa a `✅` y se activa la siguiente `🚧`.
- No se crean nuevos MDs de plan sin consentimiento explícito del usuario.
- Nomenclatura obligatoria de tareas: `F{fase}.T{n}` (reinicio de `T` en cada fase).

## Fase 1 — Estabilización técnica base (cerrada)
- ✅ F1.T1 Diagnóstico profundo de cobertura de reglas/skills por stage.
- ✅ F1.T2 Corrección de telemetría de evidencia (`files_scanned` vs `files_affected` + `evaluation_metrics`).
- ✅ F1.T3 Clasificación multi-plataforma determinista (`iOS/Android/Backend/Frontend/Other`).
- ✅ F1.T4 Regresión end-to-end de matriz de menú (happy/sad/edge + canarios).
- ✅ F1.T5 Cierre Git Flow del bloque F1.T1-F1.T4 (commits, PR, merge y validación post-merge).

## Fase 2 — Hardening legacy scripts (cerrada)
- ✅ F2.T1 Hardening de comandos Git Flow (`npm run gitflow*`) con contrato TDD.
- ✅ F2.T2 Saneamiento de aliases legacy rotos de `package.json` (sin targets locales inexistentes).
- ✅ F2.T3 Cierre Git Flow del bloque F2.T1+F2.T2.
  - ✅ Commits atómicos del bloque:
    - `06e2bc2` feat(gitflow): add deterministic gitflow CLI with contract tests
    - `d9bec69` chore(scripts): fix legacy aliases with missing local targets
    - `9a0feb1` docs(plan): set stabilization cycle as sole active tracker
  - ✅ Push de feature ejecutado.
  - ✅ PR a `develop` mergeada:
    - `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/316`
  - ✅ Validación post-merge en `develop`:
    - `npm run typecheck` (verde)
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/gitflow-cli.test.ts scripts/__tests__/package-script-targets.test.ts` (`6/6` verde)
  - ✅ Criterio de salida cumplido: bloque integrado end-to-end sin drift.

## Fase 3 — Cierre de estabilización (cerrada)
- ✅ F3.T1 Sincronización final `main/develop` y verificación de ramas limpias.
  - ✅ PRs de sincronización ejecutadas y mergeadas: `#318`, `#319`, `#320`, `#321`.
  - ✅ Alineación final `main/develop` en el mismo SHA (verificada).
  - ✅ Estado local final: `main`, `develop` y `feature/enterprise-audit-cycle` alineadas y limpias.
- ✅ F3.T2 Cierre formal del ciclo.
  - ✅ Checklist final de evidencias consolidado.
  - ✅ Estado final de salud del repo documentado.
  - ✅ Cierre Git Flow documental completado (`#322`, `#323`, `#327`, `#328`).

## Fase 4 — Cobertura real de reglas/skills y trazabilidad (activa)
Objetivo: garantizar que la auditoría enterprise refleje reglas evaluadas/matcheadas por stage con telemetría y clasificación deterministas.

- ✅ F4.T1 Diagnóstico profundo de cobertura de reglas/skills.
  - Mapear por stage: reglas activas, reglas evaluadas, reglas con findings.
  - Detectar reglas/categorías sin trazabilidad explícita.
  - Criterio de salida: inventario verificable `ruleId -> evaluated -> matched`.
  - Resultado (inventario ejecutado):
    - Perfil `default` (`PUMUKI_ENABLE_AST_HEURISTICS=0`):
      - `PRE_COMMIT`: `evaluated=8`, `matched=0`, `unmatched=8`, `findings=0`, `policy=gate-policy.default.PRE_COMMIT`.
      - `PRE_PUSH`: `evaluated=25`, `matched=0`, `unmatched=25`, `findings=0`, `policy=gate-policy.default.PRE_PUSH`.
      - `CI`: `evaluated=25`, `matched=0`, `unmatched=25`, `findings=0`, `policy=gate-policy.default.CI`.
    - Perfil `heuristics-on` (`PUMUKI_ENABLE_AST_HEURISTICS=1`, `PUMUKI_HEURISTICS_TS_SCOPE=all`):
      - `PRE_COMMIT`: `evaluated=175`, `matched=1`, `unmatched=174`, `findings=4`.
      - `PRE_PUSH`: `evaluated=177`, `matched=1`, `unmatched=176`, `findings=4`.
      - `CI`: `evaluated=177`, `matched=1`, `unmatched=176`, `findings=4`.
      - `matched_rule_ids` común por stage: `skills.backend.no-empty-catch`.
  - Hallazgo principal:
    - En perfil `default` no se evalúan reglas heurísticas AST (solo reglas de skills por stage).
    - La trazabilidad `evaluated_rule_ids/matched_rule_ids/unmatched_rule_ids` existe y es determinista; la diferencia de cobertura depende del perfil activo.

- ✅ F4.T2 Corrección de telemetría de evidencia.
  - Persistir métricas de evaluación en `.ai_evidence.json` sin romper contrato.
  - Corregir semántica de `files_scanned` y separarla de `files_affected`.
  - Criterio de salida: evidencia consistente entre ejecuciones y scopes.
  - Resultado:
    - `snapshot.files_scanned` pasa a persistirse de forma determinista (incluyendo valor `0` en bootstrap/scope vacío).
    - `snapshot.evaluation_metrics` pasa a persistirse siempre con shape estable (vacío normalizado cuando no hay cobertura).
    - `files_affected` se mantiene derivado de findings únicos y desacoplado de `files_scanned`.
    - Se consolidó refactor con helper compartido `integrations/evidence/evaluationMetrics.ts`.
  - Validación TDD:
    - `npx --yes tsx@4.21.0 --test integrations/evidence/__tests__/buildEvidence.test.ts integrations/git/__tests__/runPlatformGate.test.ts integrations/git/__tests__/runPlatformGateEvidence.test.ts integrations/lifecycle/__tests__/install.test.ts`
    - `npm run typecheck`

- ✅ F4.T3 Ajuste de clasificación multi-plataforma en menú legacy++.
  - Mantener siempre `iOS/Android/Backend/Frontend/Other` (incluidos ceros).
  - Garantizar asignación determinista por `path` y `ruleId`.
  - Criterio de salida: mismo input => misma matriz por plataforma.
  - Resultado:
    - Clasificación por `path` reforzada para repos sin `apps/*` (segmentos `ios/android/backend/frontend/web`).
    - Precedencia de clasificación mantenida: `path` antes de `ruleId`, evitando drift en repos mixtos.
    - `files_affected` normaliza separadores (`\\` vs `/`) para evitar conteo duplicado del mismo fichero.
  - Validación TDD:
    - `npx --yes tsx@4.21.0 --test integrations/evidence/platformSummary.test.ts`
    - `npx --yes tsx@4.21.0 --test integrations/evidence/platformSummary.test.ts integrations/evidence/__tests__/buildEvidence.test.ts scripts/__tests__/framework-menu-legacy-audit.test.ts`
    - `npm run typecheck`

- ✅ F4.T4 TDD de regresión end-to-end.
  - RED/GREEN/REFACTOR para happy, sad y edge paths de auditoría.
  - Añadir canarios controlados por plataforma y por stage.
  - Criterio de salida: tests deterministas en verde.
  - Resultado:
    - Se amplió el canario de matriz para soportar `ios/android/backend/frontend` con escenarios por stage (`PRE_COMMIT/PRE_PUSH/CI`) y opción de menú resoluble (`1/2`).
    - Se añadió cobertura edge para canario `CI+android` con contrato determinista de detección.
    - Se validó regresión completa de matriz (`happy/sad/edge`) + runtime consumer.
  - Validación TDD:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-canary.test.ts`
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-baseline.test.ts scripts/__tests__/framework-menu-matrix-evidence.test.ts scripts/__tests__/framework-menu-matrix-runner.test.ts scripts/__tests__/framework-menu-matrix-canary.test.ts scripts/__tests__/framework-menu-consumer-runtime.test.ts`
    - `npm run typecheck`

- 🚧 F4.T5 Cierre Git Flow y handoff.
  - Commits atómicos por bloque funcional.
  - PR a `develop`, merge y validación post-merge.
  - Actualizar documentación de uso si cambia el contrato de evidencia/auditoría.
  - Criterio de salida: ciclo cerrado sin tareas huérfanas.
