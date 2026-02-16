# Refactor Progress Tracker

Estado consolidado del refactor con seguimiento de tareas y evidencia del avance.

## Leyenda
- ✅ Completada
- 🚧 En progreso
- ⏳ Pendiente

## Fase 1 — Crítico (bloquea release)
- ✅ Corregir `jest.config.js` para descubrir y ejecutar tests TS reales de Jest (`*.spec.ts`) con `babel-jest`.
- ✅ Validar ejecución de suites tras corrección: suites y pruebas recuperadas, cobertura global `4.12%`.
- 🚧 Definir baseline mínimo de cobertura para rutas críticas (`gate`, `evidence`, `heuristics`).

## Fase 2 — Alto (calidad)
- ⏳ Dividir `integrations/mcp/evidenceFacets.ts` por dominios de facetas.
- ⏳ Dividir `integrations/mcp/evidencePayloads.ts` por builders/contextos.
- ✅ Particionar `integrations/gate/__tests__/stagePolicies-promotions-first.test.ts` en suites pequeñas.
- ✅ Particionar `integrations/gate/__tests__/stagePolicies-promotions-second.test.ts` en suites pequeñas.
- ✅ Particionar `integrations/gate/__tests__/stagePolicies-promotions-third.test.ts` en suites pequeñas.
- ✅ Consolidar micro-módulos redundantes en `scripts/`:
  - `consumer-support-bundle-gh-*`
  - `framework-menu-runners-validation-*`
  - `consumer-support-bundle-markdown-sections-*`
- 🚧 Reducir backlog de archivos sin test en `core/` e `integrations/`.
- ✅ Añadir test unitario para `integrations/git/runPlatformGateOutput.ts`.
- ✅ Añadir test unitario para `integrations/git/runPlatformGateFacts.ts`.
- ✅ Añadir test unitario para `integrations/git/runPlatformGateEvidence.ts`.
- ✅ Añadir test unitario para `integrations/git/runPlatformGateEvaluation.ts`.
- ✅ Añadir test unitario para `integrations/git/runPlatformGate.ts`.
- ✅ Añadir test unitario para `integrations/git/getCommitRangeFacts.ts`.
- ✅ Añadir test unitario para `integrations/git/baselineRuleSets.ts`.
- ✅ Añadir test unitario para `integrations/git/GitService.ts`.
- ✅ Añadir test unitario para `integrations/git/runCliCommand.ts`.
- ✅ Añadir test unitario para `integrations/git/ciIOS.ts`.
- ✅ Añadir test unitario para `integrations/git/ciAndroid.ts`.
- ✅ Añadir test unitario para `integrations/git/ciBackend.ts`.
- ✅ Añadir test unitario para `integrations/git/ciFrontend.ts`.
- ✅ Añadir test unitario para `integrations/git/preCommitIOS.ts`.
- ✅ Añadir test unitario para `integrations/git/preCommitAndroid.ts`.
- ✅ Añadir test unitario para `integrations/git/preCommitBackend.ts`.
- 🚧 Añadir test unitario para `integrations/git/preCommitFrontend.ts`.

## Fase 3 — Medio (deuda técnica)
- ⏳ Reducir acoplamiento en `integrations/git/runPlatformGate.ts`.
- ⏳ Particionar detectores grandes (`core/facts/detectors/fs/sync.ts`, `core/facts/detectors/process/index.ts`).
- ⏳ Resolver ciclos detectados por `madge` en scripts de `phase5`/`mock-consumer`.

## Fase 4 — Bajo (nice-to-have)
- ⏳ Añadir guardrail de tamaño de archivo/imports en CI.
- ⏳ Normalizar documentación mínima en módulos críticos.

## Notas
- Estrategia obligatoria: commits atómicos por tarea.
- Limpieza inmediata de ramas feature tras merge completado.
