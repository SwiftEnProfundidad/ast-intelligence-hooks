# Refactor Progress Tracker

Estado consolidado del refactor con seguimiento de tareas y evidencia del avance.

## Leyenda
- ✅ Completada
- 🚧 En progreso
- ⏳ Pendiente

## Fase 1 — Crítico (bloquea release)
- ✅ Corregir `jest.config.js` para descubrir y ejecutar tests TS reales de Jest (`*.spec.ts`) con `babel-jest`.
- ✅ Validar ejecución de suites tras corrección: suites y pruebas recuperadas, cobertura global `4.12%`.
- ✅ Definir baseline mínimo de cobertura para rutas críticas (`gate`, `evidence`, `heuristics`).

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
- ⏳ Reducir backlog de archivos sin test en `core/` e `integrations/`.
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
- ✅ Añadir test unitario para `integrations/git/preCommitFrontend.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushIOS.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushAndroid.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushBackend.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushFrontend.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushIOS.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushAndroid.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushBackend.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/prePushFrontend.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/preCommitIOS.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/preCommitAndroid.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/preCommitBackend.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/preCommitFrontend.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/ciIOS.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/ciAndroid.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/ciBackend.cli.ts`.
- ✅ Añadir test unitario para `integrations/git/ciFrontend.cli.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/text/utils.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/text/android.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/text/ios.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/browser/index.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/security/index.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/typescript/index.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/vm/index.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/process/core.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/process/shell.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/process/spawn.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/callbacks.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/promises.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart1.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart1Metadata.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart1FileOps.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart1DirTimes.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart2.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart2Core.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart2Permissions.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart2Io.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart2Times.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart3.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart3DescriptorIo.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart3Links.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/syncPart3PathOps.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/fs/sync.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/process/index.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/security/securityCredentials.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/security/securityCrypto.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/security/securityJwt.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/security/securityTls.ts`.
- ✅ Añadir test unitario para `core/facts/detectors/utils/astHelpers.ts`.
- ✅ Añadir test unitario para `core/facts/index.ts`.
- ✅ Añadir test unitario para `core/facts/Fact.ts`.
- ✅ Añadir test unitario para `core/facts/FactSet.ts`.
- ✅ Añadir test unitario para `core/facts/FileChangeFact.ts`.
- ✅ Añadir test unitario para `core/facts/FileContentFact.ts`.
- ✅ Añadir test unitario para `core/facts/DependencyFact.ts`.
- ✅ Añadir test unitario para `core/facts/HeuristicFact.ts`.
- ✅ Añadir test unitario para `core/gate/Finding.ts`.
- ✅ Añadir test unitario para `core/gate/GateOutcome.ts`.
- ✅ Añadir test unitario para `core/gate/GatePolicy.ts`.
- ✅ Añadir test unitario para `core/gate/GateStage.ts`.
- ✅ Añadir test unitario para `core/gate/conditionMatches.ts`.
- ✅ Añadir test unitario para `core/gate/evaluateRules.ts`.
- ✅ Añadir test unitario para `core/gate/evaluateGate.ts`.
- ✅ Añadir test unitario para `core/gate/index.ts`.
- ✅ Añadir test unitario para `core/rules/Condition.ts`.
- ✅ Añadir test unitario para `core/rules/Consequence.ts`.
- ✅ Añadir test unitario para `core/rules/RuleDefinition.ts`.
- ✅ Añadir test unitario para `core/rules/RuleSet.ts`.
- ✅ Añadir test unitario para `core/rules/Severity.ts`.
- ✅ Añadir test unitario para `core/rules/index.ts`.
- ✅ Añadir test unitario para `core/rules/presets/index.ts`.
- ✅ Añadir test unitario para `core/rules/presets/rulePackVersions.ts`.
- ✅ Añadir test unitario para `core/rules/presets/androidRuleSet.ts`.
- ✅ Añadir test unitario para `core/rules/presets/backendRuleSet.ts`.
- ✅ Añadir test unitario para `core/rules/presets/frontendRuleSet.ts`.
- ✅ Añadir test unitario para `core/rules/presets/exampleRuleSet.ts`.
- ⏳ Añadir test unitario para `core/rules/presets/iosEnterpriseRuleSet.ts`.

## Fase 3 — Medio (deuda técnica)
- ✅ Reducir acoplamiento en `integrations/git/runPlatformGate.ts`.
- ✅ Particionar detectores grandes (`core/facts/detectors/fs/sync.ts`, `core/facts/detectors/process/index.ts`).
- ✅ Resolver ciclos detectados por `madge` en scripts de `phase5`/`mock-consumer`.

## Fase 4 — Bajo (nice-to-have)
- ✅ Añadir guardrail de tamaño de archivo/imports en CI.
- ✅ Normalizar documentación mínima en módulos críticos.

## Operaciones de entorno
- ✅ Convertir `ast-intelligence-hooks` en repositorio Git standalone (sin dependencia de `worktree` legacy).
- ✅ Verificar integridad post-conversión (`.git` directorio propio, branch/HEAD intactos, estado limpio).
- ✅ Ejecutar siguiente lote de refactor solicitado por el usuario.
- ✅ Ejecutar demo end-to-end de Pumuki sobre mock consumer (pack → install → stages).
- ✅ Validar estado base del mock consumer antes de reinstalar Pumuki.
- ✅ Resetear `pumuki-mock-consumer` a estado base sin instalación activa de `pumuki-ast-hooks`.
- ✅ Limpiar worktree del mock consumer (tracked restaurado, untracked aislado fuera del repo).
- ✅ Diagnosticar residuos en mock: `node_modules/pumuki-ast-hooks` y `node_modules/.package-lock.json` están versionados (tracked), no ignorados.
- ✅ Corregir empaquetado NPM para incluir runtime faltante (`core/utils`, heuristics presets, AST detectors) y desbloquear runtime en consumidor mock.
- ✅ Implementar lifecycle enterprise (`pumuki install|uninstall|update|doctor|status`) con estado local en `git config` y hooks idempotentes.
- ✅ Integrar guardrail lifecycle round-trip en `validation:package-smoke` (`install -> stages -> uninstall`) con verificación de `git status` estable.
- ✅ Validar guardrails del lote (`validation:package-manifest`, `validation:package-smoke`, `validation:package-smoke:minimal`).
- ✅ Alinear el lote de lifecycle con reglas activas del repositorio (cambios mínimos y comportamiento determinista).
- ✅ Revalidar lifecycle en local (`typecheck`, `lifecycle tests`, `validation:package-manifest`, `validation:lifecycle-smoke`, `validation:package-smoke`).
- ✅ Corregir `test:mcp` para suite MCP dividida y revalidar `test:deterministic` completo.
- ✅ Añadir comando de una sola ejecución `pumuki remove` (cleanup + desinstalación de paquete) y validar E2E en consumidor temporal.
- ✅ Sincronizar documentación afectada por lifecycle (`README`, `CHANGELOG`, `INSTALLATION`, `USAGE`) en el mismo lote.
- ✅ Endurecer `pumuki remove` para podar residuo huérfano `node_modules/.package-lock.json` y validar con test dedicado.
- ✅ Completar `pumuki-mock-consumer` con escenarios reproducibles multi-plataforma (`clean`, `violations`, `mixed`) y script de aplicación de escenarios.
- ✅ Añadir espejo iOS en `apps/ios/` dentro del mock (manteniendo `ios/`) para cubrir compatibilidad legacy y heurísticas modernas.
- 🚧 Ejecutar matriz E2E completa en `pumuki-mock-consumer` (`install -> pre-commit/pre-push/ci -> remove`) sobre escenarios `clean`, `violations` y `mixed`.

## Notas
- Estrategia obligatoria: commits atómicos por tarea.
- Limpieza inmediata de ramas feature tras merge completado.
