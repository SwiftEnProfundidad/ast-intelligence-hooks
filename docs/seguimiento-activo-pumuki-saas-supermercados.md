# Plan Activo Pumuki SAAS Supermercados

## Leyenda

- ✅ Cerrado
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Objetivo

- Resolver e implementar bugs y mejoras reportados en:
  - `/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md`
- Mantener trazabilidad: hallazgo -> fix -> test -> release notes.

## Fase 0. Intake y priorizacion

- ✅ Consolidar hallazgos y deduplicar causas raiz del MD canónico.
- ✅ Priorizar por impacto inicial:
  - P1: `PUMUKI-001`, `PUMUKI-003`, `PUMUKI-005`, `PUMUKI-007`
  - P2: `PUMUKI-002`, `PUMUKI-004`, `PUMUKI-006`

## Fase 1. Bugs P1 (ejecucion tecnica)

- ✅ PUMUKI-001: Compatibilidad de receipt MCP entre stages (`PRE_WRITE` vs `PRE_COMMIT`) sin bloqueo falso.
- ✅ PUMUKI-003: Endurecer resolución de binarios en hooks/scripts para evitar `command not found`.
- ✅ PUMUKI-005: Soporte robusto para repos con `:` en path (evitar dependencia frágil de PATH).
- ✅ PUMUKI-007: Soportar repos sin commits (`HEAD` ausente) sin error ambiguo.

## Fase 2. Mejoras P2

- ✅ PUMUKI-002: Rule-pack opcional de atomicidad Git + trazabilidad de commit message.
- ✅ PUMUKI-004: Mejorar diagnóstico de hooks efectivos en escenarios versionados/custom.
- ✅ PUMUKI-006: Alinear `package_version` reportada por MCP con versión local efectiva del repo consumidor.

## Fase 2.1 Paridad legacy (CLI vs MCP) en SAAS_SUPERMERCADOS

- ✅ PUMUKI-008: Feedback iterativo en chat no equivalente a flujo legacy.
  - Evidencia: en ejecución MCP no aparece feedback operativo por iteración del modelo como en el grafo legacy.
  - Esperado: resumen corto y humano en cada iteración (`stage`, `decision`, `next_action`).
  - Entregable: tool MCP de pre-flight para chat con salida estable y accionable.
- ✅ PUMUKI-009: Desalineación operativa entre `ai_gate_check` y `pre_flight_check`.
  - Evidencia: `ai_gate_check => BLOCKED (EVIDENCE_STALE)` mientras `pre_flight_check => allowed=true`.
  - Esperado: criterio homogéneo o explicación explícita y trazable de por qué uno bloquea y el otro permite.
  - Entregable: decisión unificada desde el mismo evaluador/política.
- ✅ PUMUKI-010: Respuesta no accionable en `auto_execute_ai_start` para confianza media.
  - Evidencia: `success=true`, `action=ask`, `message=Medium confidence (undefined%)...`.
  - Esperado: `next_action` determinista + confidence numérico consistente + remediación concreta.
  - Entregable: contrato MCP estable (`confidence_pct`, `reason_code`, `next_action`).
- ✅ PUMUKI-011: Notificación macOS obligatoria en cualquier bloqueo de gate/fase.
  - Requisito hard: cuando Pumuki bloquee (`PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, `CI`), lanzar notificación nativa macOS con sonido.
  - Contenido mínimo: `🔴 BLOQUEADO`, causa exacta (`code + message`) y `cómo solucionarlo` (`next_action`).
  - Entregable: comportamiento consistente en CLI, hooks y herramientas MCP con formato humano.
  - Ajuste UX (2026-03-04): mensaje corto y legible para humanos.
  - Nuevo formato: subtítulo con causa resumida + cuerpo iniciando por `Solución: ...` para que no se corte la remediación.
  - ✅ PoC (2026-03-04): modo opcional de diálogo completo para bloqueo en macOS con `PUMUKI_MACOS_BLOCKED_DIALOG=1` (banner corto + modal con causa/solución completas).
  - ✅ PoC anti-spam (2026-03-04): diálogo con acciones de control (`Mantener activas`, `Silenciar 30 min`, `Desactivar`) + timeout automático de 15s para no bloquear flujo.

## Decisión de producto (hard)

- La automatización es obligatoria: minimizar pasos manuales en bootstrap, pre-flight, gate y remediación.
- Objetivo operativo: que instalación + wiring de agente dejen el flujo listo para ejecutar y reportar bloqueos sin intervención manual extra.

## Aclaración operativa (para no perderse)

- CLI: lo ejecutan hooks Git (`pre-commit`, `pre-push`) y comandos manuales (`pumuki ...`).
- MCP: lo consume el agente/herramienta (Codex/Cursor/Windsurf...) cuando está configurado.
- `pumuki install`: instala hooks Git y bootstrap base.
- `pumuki adapter install --agent=<...>`: cablea hooks de agente + servidores MCP en el entorno del agente.

## Fase 3. Cierre

- ✅ Ejecutar suite de tests de regresión afectada.
  - Evidencia (2026-03-04): `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-system-notifications.test.ts integrations/git/__tests__/stageRunners.test.ts integrations/lifecycle/__tests__/lifecycle.test.ts` -> `44 pass / 0 fail`.
- ✅ Actualizar `CHANGELOG.md` y `docs/RELEASE_NOTES.md` con fixes reales.
  - Evidencia (2026-03-04): se documenta en `6.3.38` (CHANGELOG) y en `v6.3.38` (RELEASE_NOTES) el paquete de mejoras `PUMUKI-011` + baseline test alignment.
- ✅ Publicar versión cuando las tareas en construcción/pending críticas estén cerradas.
  - Evidencia (2026-03-04): `npm publish --access public` => `+ pumuki@6.3.38` y verificación remota `npm view pumuki version` => `6.3.38`.

## Fase 4. Post-release

- ✅ Monitorizar feedback de repos consumidores y registrar nuevos hallazgos canónicos.
  - Evidencia (2026-03-04): se activa nuevo frente real en consumer repo con backlog dedicado en `/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md`.
- ✅ Priorizar nuevos bugs/mejoras y abrir siguiente ciclo de implementación.
  - Evidencia (2026-03-04): ciclo técnico arrancado en `ast-intelligence-hooks` con ejecución sobre bugs reales reportados desde SAAS.

## Fase 4.1 Ciclo técnico actual (core Pumuki)

- ✅ PUMUKI-012: Endurecer comandos de adapter templates para hooks/CI sin dependencia frágil de `./node_modules/.bin`.
  - Fix: `integrations/lifecycle/adapter.templates.json` ahora usa `npx --yes --package pumuki@latest ...` en `pre_write/pre_commit/pre_push/ci`.
  - Test: `integrations/lifecycle/__tests__/adapter.test.ts`, `integrations/lifecycle/__tests__/doctor.test.ts`, `integrations/lifecycle/__tests__/cli.test.ts`.
- ✅ PUMUKI-013: Blindar resolución de rango Git cuando `HEAD`/refs no son resolubles (repos sin commits o refs ambiguas).
  - Fix: `integrations/git/getCommitRangeFacts.ts` añade guardas `rev-parse --verify` + fallback seguro sin crash.
  - Test: `integrations/git/__tests__/getCommitRangeFacts.test.ts` (nuevo caso repo sin commits) y `integrations/git/__tests__/runPlatformGateFacts.test.ts`.
- ✅ PUMUKI-014: Enforcement crítico transversal por plataforma (sin huecos entre skills activas y evaluación real).
  - Fix: `integrations/git/runPlatformGate.ts` incorpora `governance.skills.cross-platform-critical.incomplete` y bloquea cuando una plataforma detectada no tiene reglas críticas (`CRITICAL/ERROR`) activas/evaluadas.
  - Test: `integrations/git/__tests__/runPlatformGate.test.ts` añade casos de bloqueo/allow para cobertura crítica multi-plataforma.
- ✅ PUMUKI-015: Ejecutar validación extendida de no-regresión (suite stage-gates focal + smoke de hooks) y cerrar trazabilidad final de este bloque crítico.
  - Evidencia (2026-03-04): `npm run -s test:stage-gates` -> `1018 pass / 0 fail / 4 skip`.
  - Fixes incluidos para estabilizar la suite:
    - `integrations/lifecycle/__tests__/saasIngestionBuilder.test.ts` (fixture de evidencia v2.1 con `evidence_chain` válido).
    - `scripts/__tests__/framework-menu-consumer-preflight.test.ts` (contrato `evidence.source` completo en fixtures).
    - `scripts/__tests__/architecture-file-size-guardrails.test.ts` (override explícito para `integrations/lifecycle/cli.ts` en límites de líneas/imports).
- ✅ PUMUKI-016: Preparar release notes del siguiente corte con trazabilidad de commits y validación ejecutada.
  - Evidencia (2026-03-04):
    - `CHANGELOG.md` actualizado en `[Unreleased]` con `adapter hooks`, `commit-range` y `cross-platform critical enforcement`.
    - `docs/RELEASE_NOTES.md` actualizado con bloque `next cut candidate, post v6.3.38`.
- ✅ PUMUKI-017: Ejecutar siguiente bug/mejora del backlog SAAS (`PUMUKI-002`: enforcement de atomicidad Git por defecto) con RED->GREEN->REFACTOR.
  - Fix:
    - `integrations/git/gitAtomicity.ts` activa atomicidad por defecto (`enabled: true`) manteniendo override por env/config.
    - `integrations/git/__tests__/gitAtomicity.test.ts` actualiza contrato base a enforcement activo por defecto.
  - Evidencia (2026-03-04):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/gitAtomicity.test.ts` -> `3 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts` -> `21 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/cli.test.ts` -> `29 pass / 0 fail`.
- ✅ PUMUKI-018: Preparar cierre de corte/publicación tras validación acumulada de PUMUKI-012..017.
  - Evidencia (2026-03-04):
    - `npm run -s test:stage-gates` -> `1018 pass / 0 fail / 4 skip` tras ajuste de regresión en `integrations/git/__tests__/hookGateSummary.test.ts`.
    - Smoke complementario ya validado dentro del bloque: `gitAtomicity`, `stageRunners`, `lifecycle/cli`, `typecheck`.
- ✅ PUMUKI-019: Ejecutar siguiente bug/mejora del backlog SAAS de prioridad media (`PUMUKI-004`: hooks versionados `core.hooksPath`).
  - Fix:
    - `integrations/lifecycle/hookManager.ts` añade resolución robusta de hooks con fallback a `.git/config` (`core.hooksPath`) cuando no está disponible `git rev-parse --git-path hooks`.
    - `integrations/lifecycle/status.ts` y `integrations/lifecycle/doctor.ts` exponen metadatos de ruta efectiva (`hooksDirectory`, `hooksDirectoryResolution`).
    - `integrations/lifecycle/cli.ts` imprime ruta efectiva de hooks en `status` y `doctor` modo texto para diagnóstico humano.
  - Evidencia (2026-03-04):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/hookManager.test.ts integrations/lifecycle/__tests__/status.test.ts integrations/lifecycle/__tests__/doctor.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `50 pass / 0 fail`.
    - `npm run -s test:stage-gates` -> `1020 pass / 0 fail / 4 skip`.
    - `npm run -s typecheck` -> `PASS`.
- ✅ PUMUKI-020: Preparar publicación del siguiente corte cuando PUMUKI-019 quede cerrada sin regresiones.
  - Evidencia (2026-03-04):
    - `npm publish --access public` => `+ pumuki@6.3.39`.
    - Verificación remota: `npm view pumuki version` => `6.3.39`.

## Fase 4.2 Siguiente bloque SAAS (ordenado y sin saltos)

- ✅ PUMUKI-021: Consolidar backlog SAAS activo contra issues upstream reales y ejecutar el siguiente bug/mejora prioritaria sin cambiar de frente.
  - Alcance inmediato:
    - Contrastar estado de `#614+` para separar `OPEN` real vs `ya resuelto`.
    - Elegir una única siguiente implementación técnica y ejecutar `RED -> GREEN -> REFACTOR`.
  - Resultado:
    - Fix ejecutado sobre `#622`: bloqueo determinista cuando hay cambios de código y `active_rule_ids=[]`.
    - Nuevo finding de gate: `governance.rules.active-rule-coverage.empty` (`ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH`).
  - Evidencia (2026-03-04):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGate.test.ts` -> `30 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGate.test.ts integrations/git/__tests__/stageRunners.test.ts` -> `51 pass / 0 fail`.

- ✅ PUMUKI-022: Ejecutar siguiente bug/mejora SAAS prioritaria de enforcement iOS tests (`#623`) sin abrir frentes paralelos.
  - Fix:
    - Nuevo guard determinista de calidad de tests iOS en gate: `governance.skills.ios-test-quality.incomplete`.
    - Nuevo código de bloqueo: `IOS_TEST_QUALITY_PATTERN_MISSING_HIGH`.
    - Criterio hard en `PRE_COMMIT/PRE_PUSH/CI`: para fuentes `XCTest` en `apps/ios/**/Tests/**.swift`, exigir `makeSUT()` y `trackForMemoryLeaks()`.
    - Ajuste de consistencia: findings de guards de cobertura se incluyen siempre en `effectiveFindings` cuando aplican, evitando bloqueos “opacos”.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGate.test.ts` -> `32 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts` -> `21 pass / 0 fail`.
    - `npm run -s test:stage-gates` -> `1024 pass / 0 fail / 4 skip`.

- ✅ PUMUKI-023: Ejecutar siguiente bug/mejora SAAS prioritaria (`#614`) para cerrar issue P0 abierta con evidencia reproducible y decidir cierre o ampliación de implementación.
  - Fix:
    - `integrations/gate/evaluateAiGate.ts` añade enforcement transversal en `PRE_WRITE` por plataforma detectada:
      - `EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE` (prefijos `skills.<scope>.` en `active/evaluated_rule_ids`).
      - `EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING` (bundles requeridos por plataforma detectada en `rulesets`).
    - `integrations/mcp/preFlightCheck.ts` añade hints accionables para ambos códigos.
    - `integrations/mcp/autoExecuteAiStart.ts` añade `next_action` determinista para ambos códigos.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/gate/__tests__/evaluateAiGate.test.ts integrations/mcp/__tests__/preFlightCheck.test.ts integrations/mcp/__tests__/autoExecuteAiStart.test.ts` -> `20 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-024: Ejecutar siguiente bug/mejora SAAS prioritaria (`#615`) y cerrar trazabilidad con RED->GREEN->REFACTOR + evidencia reproducible.
  - Fix:
    - `core/rules/Consequence.ts` amplía contrato con `source` opcional.
    - `core/gate/evaluateRules.ts` fusiona `source` del fact + `source` del rule consequence para trazabilidad determinista.
    - `integrations/config/skillsRuleSet.ts` emite metadata `skills-ir:*` por regla compilada (origen de skill, path, modo de evaluación y nodos AST mapeados).
    - `integrations/config/__tests__/skillsRuleSet.test.ts` verifica que la regla runtime incluya traza `skills-ir` con nodos AST.
    - `core/gate/evaluateRules.test.ts` verifica que el finding preserve traza combinada (`fact|skills-ir`).
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test core/gate/evaluateRules.test.ts integrations/config/__tests__/skillsRuleSet.test.ts integrations/git/__tests__/runPlatformGateEvaluation.test.ts integrations/git/__tests__/runPlatformGate.test.ts` -> `56 pass / 0 fail`.
    - `npm run -s test:stage-gates` -> `1027 pass / 0 fail / 4 skip`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-025: Ejecutar siguiente bug/mejora SAAS prioritaria (`#616`) para cerrar definición técnica del roadmap AST por nodos con entregable ejecutable y trazable.
  - Fix:
    - PoC runtime de validación dual legacy+AST: `integrations/git/astIntelligenceDualValidation.ts` (`off/shadow/strict`).
    - Integración en gate principal: `integrations/git/runPlatformGate.ts`.
    - Re-export para compatibilidad interna: `integrations/git/runPlatformGateEvaluation.ts`.
    - RFC legible + roadmap 30/60/90 + rollout/rollback: `docs/validation/ast-intelligence-roadmap.md`.
    - Documentación operativa de configuración/uso: `docs/CONFIGURATION.md`, `docs/USAGE.md`, `docs/validation/README.md`, `docs/README.md`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/astIntelligenceDualValidation.test.ts integrations/git/__tests__/runPlatformGateAstIntelligenceDualMode.test.ts integrations/git/__tests__/runPlatformGateEvaluation.test.ts scripts/__tests__/architecture-file-size-guardrails.test.ts` -> `12 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - `npm run -s test:stage-gates` -> `1033 pass / 0 fail / 4 skip`.

- ✅ PUMUKI-026: Ejecutar siguiente mejora SAAS prioritaria (`#617`) para aprendizaje/sync SDD desde evidencia operativa con flujo seguro `dry-run -> apply`.
  - Fix:
    - Alias CLI `pumuki sdd sync` (equivalente a `sync-docs`).
    - Nuevo flag `--from-evidence=<path>` en `sync-docs`, `sync`, `learn` y `auto-sync`.
    - `sync-docs/learn/auto-sync` leen evidencia desde ruta alternativa y la exponen en contexto (`fromEvidencePath`).
    - Learning artifact añade `scoring` determinista (`heuristic-v1`) para dry-run/apply.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/sdd/__tests__/syncDocs.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `44 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-027: Ejecutar siguiente mejora SAAS prioritaria (`#618`) para `pumuki watch` proactivo con notificaciones/alertas sin spam y controles de silencio.
  - Fix:
    - Nuevo comando `pumuki watch` en CLI lifecycle.
    - Configuración operativa: `--stage`, `--scope`, `--severity`, `--interval-ms`, `--notify-cooldown-ms`, `--no-notify`, `--once|--iterations`.
    - Motor local de watch en `integrations/lifecycle/watch.ts` con ciclo `change -> evaluate -> notify`.
    - Anti-spam determinista por firma+cooldown y umbral de severidad configurable para alertas.
    - Integración con notificación de bloqueo (`gate.blocked`) y resumen (`audit.summary`) sin alterar política de bloqueo del gate.
    - Documentación de uso y límites en `docs/USAGE.md`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/watch.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `34 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-028: Ejecutar siguiente bug SAAS prioritaria (`#619`) para robustecer resolución de binarios `pumuki` vía `npx` en hooks/CLI.
  - Fix:
    - Nuevo resolvedor determinista para smoke/install: `scripts/package-install-smoke-command-resolution-lib.ts`.
    - Prioridad de ejecución robusta en repos consumidor:
      - `./node_modules/.bin/<bin>` (local)
      - `node ./node_modules/pumuki/bin/<bin>.js` (fallback local)
      - `npx --yes --package pumuki@latest <bin>` (fallback final)
    - Integración del resolvedor en lifecycle smoke:
      - `scripts/package-install-smoke-lifecycle-lib.ts`
      - `scripts/package-install-smoke-execution-steps-lib.ts`
    - Diagnóstico hardening en `doctor --deep`:
      - `integrations/lifecycle/doctor.ts` ahora marca `adapter-wiring` en `fail/warning` cuando detecta comandos frágiles sin `--package` ni fallback local.
      - Test de regresión: `integrations/lifecycle/__tests__/doctor.test.ts`.
    - Documentación de uso/remediación actualizada:
      - comandos directos de hooks con `--package pumuki@latest` en `README.md`, `docs/INSTALLATION.md`, `docs/USAGE.md`, `docs/MCP_SERVERS.md`.
      - troubleshooting explícito para `doctor --deep` y reparación con `pumuki adapter install --agent=codex`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/package-install-smoke-command-resolution-lib.test.ts integrations/lifecycle/__tests__/doctor.test.ts integrations/lifecycle/__tests__/hookBlock.test.ts integrations/lifecycle/__tests__/hookManager.test.ts` -> `30 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-029: Ejecutar siguiente bug SAAS prioritaria (`#620`) para robustecer ejecución en repos con `:` en path y cerrar trazabilidad sin regresiones.
  - Fix:
    - El smoke de instalación usa `consumerRepo` con `:` en Unix/macOS para cubrir path problemático de forma explícita:
      - `scripts/package-install-smoke-workspace-factory-lib.ts`.
      - Test de regresión: `scripts/__tests__/package-install-smoke-workspace-factory-lib.test.ts`.
    - `doctor --deep` endurece `adapter-wiring` para detectar comandos con mutación inline de `PATH` (`PATH="...:$PATH"`), aunque incluyan `--package`:
      - `integrations/lifecycle/doctor.ts`.
      - Test de regresión: `integrations/lifecycle/__tests__/doctor.test.ts`.
    - Documentación operativa para rutas con `:` y remediación en:
      - `docs/INSTALLATION.md`
      - `docs/USAGE.md`
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/package-install-smoke-workspace-factory-lib.test.ts scripts/__tests__/package-install-smoke-command-resolution-lib.test.ts integrations/lifecycle/__tests__/doctor.test.ts` -> `15 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-030: Ejecutar siguiente bug SAAS prioritaria (`#621`) para robustecer bootstrap en repos sin `HEAD` inicial y cerrar trazabilidad con RED->GREEN->REFACTOR.
  - Fix:
    - `integrations/git/gitAtomicity.ts`: fallback seguro cuando refs no son resolubles (`HEAD` ausente) para `diff/log` sin romper stage.
    - `integrations/git/GitService.ts`: ejecución de `git` con `stdio` capturado (`pipe`) para evitar ruido fatal en bootstrap controlado.
    - `integrations/git/__tests__/gitAtomicity.test.ts`: cobertura RED->GREEN para repos sin commit inicial y aserción explícita de no ruido `ambiguous argument`.
    - `integrations/git/__tests__/stageRunners.test.ts`: validación de `runCiStage` en repo virgen con git-atomicity activa.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/gitAtomicity.test.ts integrations/git/__tests__/stageRunners.test.ts integrations/git/__tests__/GitService.test.ts` -> `34 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-031: Ejecutar siguiente bug SAAS prioritaria (`#622`) para evitar `PASS` con `active_rule_ids` vacío cuando hay cambios de código y cerrar trazabilidad con RED->GREEN->REFACTOR.
  - Fix:
    - `integrations/gate/evaluateAiGate.ts`: guard adicional en `PRE_WRITE` para bloquear evidencia con `active_rule_ids=[]` cuando hay plataformas de código detectadas (`ios/android/backend/frontend`).
    - Código de bloqueo añadido: `EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES`.
    - Se mantiene compatibilidad en escenarios sin superficie de código detectada (no falso bloqueo).
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/gate/__tests__/evaluateAiGate.test.ts` -> `17 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-032: Ejecutar siguiente bug SAAS prioritaria (`#623`) para enforcement AST de calidad de tests iOS (`makeSUT` + `trackForMemoryLeaks`) y cerrar trazabilidad con RED->GREEN->REFACTOR.
  - Fix:
    - `integrations/gate/evaluateAiGate.ts`: en PRE_WRITE se exige regla crítica iOS `skills.ios.critical-test-quality` cuando iOS está detectado.
    - Nuevo código de bloqueo explícito: `EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING`.
    - Se mantiene comportamiento no bloqueante en plataformas no-iOS (sin falsos bloqueos).
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/gate/__tests__/evaluateAiGate.test.ts integrations/git/__tests__/runPlatformGate.test.ts` -> `51 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-033: Ejecutar siguiente bug SAAS prioritaria (`#614`) para enforcement AST transversal multi-plataforma y cerrar trazabilidad con RED->GREEN->REFACTOR.
  - Fix:
    - `integrations/gate/evaluateAiGate.ts`: guard transversal en PRE_WRITE para plataformas detectadas con reglas críticas mínimas por ámbito (`android/backend/frontend`) además de la cobertura iOS ya cerrada.
    - Nuevo código de bloqueo explícito: `EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE`.
    - El gate ahora bloquea determinísticamente cuando hay cobertura de prefijo pero falta enforcement crítico transversal por plataforma.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/gate/__tests__/evaluateAiGate.test.ts integrations/git/__tests__/runPlatformGate.test.ts` -> `53 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-034: Ejecutar siguiente bug SAAS prioritaria (`#615`) para compilación dinámica skills `.codex` -> reglas AST por nodos y cerrar trazabilidad con RED->GREEN->REFACTOR.
  - Fix:
    - `integrations/config/skillsLock.ts`: nuevo IR mínimo en lock por regla (`astNodeIds`) con validación, normalización y hash determinista.
    - `integrations/config/skillsMarkdownRules.ts`: compilador markdown detecta nodos AST explícitos (`heuristics.*.ast`) y convierte reglas no canónicas a `AUTO` cuando tienen nodos.
    - `integrations/config/skillsDetectorRegistry.ts`: resolver dinámico por regla compilada (`astNodeIds`) con fallback al registry estático por `ruleId`.
    - `integrations/config/skillsRuleSet.ts`: evaluador runtime consume IR dinámico por nodos para construir condiciones heurísticas y trazabilidad `skills-ir`.
    - `integrations/config/skillsCustomRules.ts`: persiste/carga `ast_node_ids` en `.pumuki/custom-rules.json` para mantener paridad end-to-end.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/config/__tests__/skillsMarkdownRules.test.ts integrations/config/__tests__/skillsRuleSet.test.ts integrations/config/skillsLock.test.ts integrations/config/__tests__/skillsCustomRules.test.ts` -> `29 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test core/gate/evaluateRules.test.ts integrations/config/__tests__/skillsMarkdownRules.test.ts integrations/config/__tests__/skillsRuleSet.test.ts integrations/git/__tests__/runPlatformGateEvaluation.test.ts integrations/git/__tests__/runPlatformGate.test.ts` -> `61 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-035: Ejecutar siguiente mejora SAAS prioritaria (`#616`) para motor AST Intelligence por nodos multilenguaje desde `.codex` (siguiente bloque tras cerrar #615).
  - Fix:
    - `integrations/git/__tests__/astIntelligenceDualValidation.test.ts`: nueva cobertura multilenguaje real en dual-mode (`typescript + kotlin`) con `divergences=0`.
    - `docs/validation/ast-intelligence-roadmap.md`: RFC actualizado para reflejar Kotlin dentro del alcance PoC implementado.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/astIntelligenceDualValidation.test.ts integrations/git/__tests__/runPlatformGateAstIntelligenceDualMode.test.ts integrations/git/__tests__/runPlatformGateEvaluation.test.ts` -> `12 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-036: Ejecutar siguiente mejora SAAS prioritaria (`#617`) para `sdd learn/sync` desde evidencia operativa y cierre trazable de issue upstream.
  - Fix:
    - `integrations/sdd/syncDocs.ts`: hardening de seguridad para `--from-evidence` con resolución repo-bound; bloquea rutas fuera del repo root (path traversal).
    - `integrations/sdd/__tests__/syncDocs.test.ts`: nuevo test de bloqueo cuando `--from-evidence` intenta escapar con `../`.
    - `integrations/lifecycle/__tests__/cli.test.ts`: cobertura CLI para retorno `code=1` cuando `sdd sync --from-evidence` apunta fuera del repo root.
    - `docs/CONFIGURATION.md`: límite de seguridad documentado para `--from-evidence`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/sdd/__tests__/syncDocs.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `47 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-037: Ejecutar siguiente mejora SAAS prioritaria (`#618`) para `pumuki watch` proactivo (notificaciones + anti-spam) y cierre trazable de issue upstream.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/watch.test.ts` -> `3 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/cli.test.ts` -> `32 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Issue upstream cerrada: `#618`.

- ✅ PUMUKI-038: Ejecutar siguiente bug SAAS prioritaria (`#619`) para cerrar trazabilidad upstream de resolución robusta de binarios `pumuki` vía `npx` en hooks/CLI.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/package-install-smoke-command-resolution-lib.test.ts integrations/lifecycle/__tests__/doctor.test.ts integrations/lifecycle/__tests__/hookBlock.test.ts integrations/lifecycle/__tests__/hookManager.test.ts` -> `31 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Issue upstream cerrada: `#619`.

- ✅ PUMUKI-039: Ejecutar siguiente bug SAAS prioritaria (`#620`) para cerrar trazabilidad upstream de robustez en repos con `:` en path.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/package-install-smoke-workspace-factory-lib.test.ts scripts/__tests__/package-install-smoke-command-resolution-lib.test.ts integrations/lifecycle/__tests__/doctor.test.ts` -> `15 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Issue upstream cerrada: `#620`.

- ✅ PUMUKI-040: Revisar el backlog SAAS actualizado y abrir/ejecutar la siguiente incidencia nueva no cubierta (sin saltar a RuralGo hasta cerrar SAAS).
  - Evidencia (2026-03-05):
    - Verificación upstream consolidada: `#614 #615 #616 #617 #618 #619 #620 #621 #622 #623` en estado `CLOSED`.
    - Nueva incidencia abierta desde backlog SAAS (`PUMUKI-009`): `#624` (`install --with-mcp y healthcheck de wiring MCP`).

- ✅ PUMUKI-041: Implementar `#624` (`install --with-mcp` + healthcheck MCP) con RED -> GREEN -> REFACTOR y cierre trazable.
  - Fix:
    - `integrations/lifecycle/cli.ts`: soporte `install --with-mcp` con `--agent=<name>` opcional.
    - `integrations/lifecycle/cli.ts`: tras instalar con MCP, wiring adapter + healthcheck MCP visible (check `adapter-wiring` de `doctor --deep`).
    - `integrations/lifecycle/__tests__/cli.test.ts`: cobertura de parseo y flujo install con wiring MCP.
    - `docs/INSTALLATION.md`, `docs/USAGE.md`: documentación de comando y healthcheck.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/cli.test.ts` -> `32 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Issue upstream cerrada: `#624`.

- 🚧 PUMUKI-042: Implementar `#625` (pipeline AGENTS -> policy/rules con contrato ejecutable en PRE_WRITE y stages) con cierre trazable.
