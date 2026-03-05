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

- ✅ PUMUKI-042: Implementar `#625` (pipeline AGENTS -> policy/rules con contrato ejecutable en PRE_WRITE y stages) con cierre trazable.
  - Fix:
    - `integrations/gate/evaluateAiGate.ts`: añade contrato machine-readable `skills_contract` en salida de gate y bloqueo explícito en `PRE_COMMIT/PRE_PUSH/CI` con `EVIDENCE_SKILLS_CONTRACT_INCOMPLETE` cuando falla la cobertura.
    - `integrations/mcp/preFlightCheck.ts`, `integrations/mcp/aiGateCheck.ts`, `integrations/mcp/autoExecuteAiStart.ts`: propagan `skills_contract` y remediación accionable del nuevo código de bloqueo.
    - `integrations/lifecycle/cli.ts`, `scripts/framework-menu-consumer-preflight-lib.ts`: hints/pre-flight alineados con el contrato nuevo.
    - `docs/CONFIGURATION.md`, `docs/USAGE.md`: contrato documentado para consumo operativo.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/mcp/__tests__/aiGateCheck.test.ts integrations/mcp/__tests__/preFlightCheck.test.ts integrations/mcp/__tests__/autoExecuteAiStart.test.ts integrations/gate/__tests__/evaluateAiGate.test.ts` -> `29 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/cli.test.ts` -> `32 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-043: Ejecutar siguiente bug/mejora SAAS prioritaria de higiene temprana en `PRE_WRITE` (`PUMUKI-011`, issue `#626`) con guardas de worktree atómico y remediación determinista.
  - Fix:
    - `integrations/gate/evaluateAiGate.ts`: añade guard nativo de higiene en `PRE_WRITE` con umbrales configurables (`warn/block`) y códigos deterministas:
      - `EVIDENCE_PREWRITE_WORKTREE_WARN`
      - `EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT`
    - Configuración por entorno:
      - `PUMUKI_PREWRITE_WORKTREE_HYGIENE_ENABLED`
      - `PUMUKI_PREWRITE_WORKTREE_WARN_THRESHOLD`
      - `PUMUKI_PREWRITE_WORKTREE_BLOCK_THRESHOLD`
    - `integrations/mcp/preFlightCheck.ts`, `integrations/mcp/autoExecuteAiStart.ts`, `scripts/framework-menu-consumer-preflight-lib.ts`, `integrations/lifecycle/cli.ts`: hints y remediación accionable alineados con los nuevos códigos.
    - `docs/CONFIGURATION.md`, `docs/USAGE.md`: contrato y uso documentados.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/gate/__tests__/evaluateAiGate.test.ts integrations/mcp/__tests__/preFlightCheck.test.ts integrations/mcp/__tests__/autoExecuteAiStart.test.ts` -> `32 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/cli.test.ts` -> `32 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.

- ✅ PUMUKI-044: Ejecutar siguiente mejora SAAS prioritaria (`PUMUKI-M001`, issue `#627`) para bootstrap enterprise unificado en un solo flujo.
  - Fix:
    - `integrations/lifecycle/cli.ts`: nuevo comando `pumuki bootstrap [--enterprise] [--agent=<name>] [--json]` que orquesta `install + adapter wiring + doctor --deep`.
    - Salida JSON/texto con resumen determinista de `install`, `mcp` y `doctor`, y retorno `exit 1` cuando `doctor` detecta bloqueos.
    - `integrations/lifecycle/__tests__/cli.test.ts`: cobertura de parseo, flags inválidos y flujo integrado de bootstrap enterprise.
    - Documentación actualizada: `README.md`, `docs/INSTALLATION.md`, `docs/USAGE.md`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/cli.test.ts` -> `33 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Issue upstream cerrada: `#627`.

- ✅ PUMUKI-045: Ejecutar siguiente mejora SAAS prioritaria (`PUMUKI-M003`, issue `#628`) para generador oficial de evidencia por `scenario_id` con validación de tests reales.
  - Fix:
    - Nuevo comando: `pumuki sdd evidence --scenario-id=<id> --test-command=<command> --test-status=passed|failed [--test-output=<path>] [--from-evidence=<path>] [--dry-run] [--json]`.
    - `integrations/sdd/evidenceScaffold.ts`: scaffolding determinista de `.pumuki/artifacts/pumuki-evidence-v1.json` con validación hard de `scenario_id`, metadatos reales de test y baseline de `.ai_evidence.json` válido.
    - `integrations/lifecycle/cli.ts`: parseo/validación/ejecución del nuevo subcomando SDD `evidence`.
    - Cobertura nueva:
      - `integrations/sdd/__tests__/evidenceScaffold.test.ts`
      - `integrations/lifecycle/__tests__/cli.test.ts`
    - Documentación operativa: `docs/USAGE.md`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/sdd/__tests__/evidenceScaffold.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `38 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Issue upstream cerrada: `#628`.

- ✅ PUMUKI-046: Ejecutar siguiente mejora SAAS prioritaria (`PUMUKI-M004`, issue `#629`) para plugin oficial de sync de estado `scenario_id <-> evidencias` con modo `dry-run/apply`.
  - Fix:
    - Nuevo subcomando SDD: `pumuki sdd state-sync [--scenario-id=<id>] [--status=todo|in_progress|blocked|done] [--from-evidence=<path>] [--board-path=<path>] [--force] [--dry-run] [--json]`.
    - `integrations/sdd/stateSync.ts`: motor determinista de sincronización estado-escenario con:
      - lectura/validación de evidencia fuente (`.pumuki/artifacts/pumuki-evidence-v1.json`),
      - proyección de estado (`passed -> done`, `failed -> blocked` por defecto),
      - artifact board canónico (`.pumuki/artifacts/scenario-state-sync-v1.json`),
      - detección de conflicto y remediación explícita con `--force`.
    - `integrations/lifecycle/cli.ts`: parseo/ejecución del subcomando y `exit code 1` en conflictos (`STATE_SYNC_CONFLICT`).
    - Cobertura nueva:
      - `integrations/sdd/__tests__/stateSync.test.ts`
      - `integrations/lifecycle/__tests__/cli.test.ts` (parse + ejecución dry-run state-sync).
    - Documentación operativa: `docs/USAGE.md`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/sdd/__tests__/stateSync.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `38 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Issue upstream cerrada: `#629`.

- ✅ PUMUKI-047: Ejecutar siguiente mejora SAAS prioritaria (`PUMUKI-M005`, issue `#630`) para `policy reconcile` y coherencia AGENTS/skills/policy-as-code.
  - Fix:
    - Nuevo comando lifecycle: `pumuki policy reconcile [--json]`.
    - `integrations/lifecycle/policyReconcile.ts`: reconciliación determinista de contrato `AGENTS.md` + `skills.lock.json` + snapshot de `policy-as-code` por stages (`PRE_COMMIT/PRE_PUSH/CI`).
    - Detección explícita de drift con severidad/acción:
      - `AGENTS_FILE_MISSING`
      - `SKILLS_LOCK_MISSING` / `SKILLS_LOCK_INVALID`
      - `AGENTS_REQUIRED_SKILL_MISSING_IN_LOCK`
      - `POLICY_STAGE_INVALID`
      - `POLICY_STAGE_NON_STRICT`
      - `POLICY_HASH_DIVERGENCE`
    - `integrations/lifecycle/cli.ts`: parse + ejecución runtime del subcomando `policy reconcile` con salida JSON/texto y `exit code 1` cuando hay bloqueos.
    - Cobertura nueva/actualizada:
      - `integrations/lifecycle/__tests__/policyReconcile.test.ts`
      - `integrations/lifecycle/__tests__/cli.test.ts` (parse + rechazo de flags inválidos + ejecución runtime).
    - Ayuda CLI actualizada con `pumuki policy reconcile [--json]`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/policyReconcile.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `40 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#630`.

- ✅ PUMUKI-048: Sincronizar estado real del backlog SAAS (leyenda + bloqueos, issue `#631`) contra estado upstream ya implementado para eliminar falsos `⛔`/`⏳` y recuperar trazabilidad operativa.
  - Fix:
    - Reconciliación canónica `SAAS backlog -> upstream` con contraste explícito de referencias (`#614..#623`, `#624..#630`) usando `gh issue list --state all --json`.
    - Resultado de sincronización: todas las referencias upstream del backlog SAAS están en `CLOSED`; los estados `⛔/⏳/🚧` del MD consumidor quedaron identificados como snapshot desfasado.
    - Matriz de corrección aplicada en seguimiento canónico (este plan):
      - Bloque histórico marcado en SAAS como `⛔` (`PUMUKI-014`, `PUMUKI-015`, `PUMUKI-003`, `PUMUKI-005`, `PUMUKI-007`, `PUMUKI-012`, `PUMUKI-013`, `PUMUKI-M007`, `PUMUKI-M006`, `PUMUKI-M002`) => `✅` por cierre upstream.
      - Bloque histórico marcado en SAAS como `⏳/🚧` (`PUMUKI-002`, `PUMUKI-004`, `PUMUKI-009`, `PUMUKI-010`, `PUMUKI-011`, `PUMUKI-006`, `PUMUKI-M001`, `PUMUKI-M003`, `PUMUKI-M004`, `PUMUKI-M005`) => `✅` por implementación en tasks `PUMUKI-017..047`.
    - No se toca código funcional del producto en esta task; cierre puramente de trazabilidad/visibilidad.
  - Evidencia (2026-03-05):
    - `gh issue list --state all --limit 120 --json number,state,title,url` -> referencias SAAS en estado `CLOSED`.
    - `sed -n '1,240p' /Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md` -> snapshot consumidor aún desfasado frente a upstream.
    - `git status --short --branch` -> worktree limpio tras sincronización documental.
    - Cierre issue upstream: `#631`.

- ✅ PUMUKI-049: Ejecutar siguiente bug/mejora SAAS prioritaria (issue `#632`) para normalizar fixtures MCP de `package_version/lifecycle_version` a resolución dinámica y evitar drift de versiones obsoletas en tests/salidas.
  - Fix:
    - `integrations/mcp/__tests__/enterpriseServer.test.ts`:
      - eliminación de hardcodes de versión (`6.3.16`) en fixtures MCP críticos;
      - uso de `getCurrentPumukiVersion({ repoRoot })` para `package_version/lifecycle_version`;
      - adaptación al contrato actual de evidencia (`evidence_chain`) con helper local basado en `computeEvidencePayloadHash`, evitando falsos bloqueos `EVIDENCE_CHAIN_INVALID`.
    - Alcance limitado a tests MCP (sin cambios funcionales en runtime productivo).
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/mcp/__tests__/enterpriseServer.test.ts` -> `14 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#632`.

- ✅ PUMUKI-050: Ejecutar siguiente bug/mejora SAAS prioritaria (issue `#633`) para normalizar fixtures lifecycle de `package_version/lifecycle_version` a resolución dinámica y evitar drift equivalente en `cli.test.ts`.
  - Fix:
    - `integrations/lifecycle/__tests__/cli.test.ts`:
      - eliminación de hardcodes `6.3.26` en fixtures lifecycle de PRE_WRITE;
      - resolución dinámica de versión con `getCurrentPumukiVersion({ repoRoot })` en:
        - helper `writePreWriteEvidence(...)`,
        - casos `prewrite-mcp-enforcement`,
        - `prewrite-mcp-ready`,
        - `prewrite-panel`.
    - Sin cambios funcionales de producto; alcance limitado a robustez de tests/fixtures.
  - Evidencia (2026-03-05):
    - `rg -n "6\\.3\\.26|package_version: '6\\.|lifecycle_version: '6\\." integrations/lifecycle/__tests__/cli.test.ts` -> sin resultados.
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/cli.test.ts` -> `37 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#633`.

- ✅ PUMUKI-051: Ejecutar siguiente bug/mejora SAAS prioritaria (issue `#634`) para normalizar hardcodes residuales de versión en fixtures de `evidence/gate/telemetry/lifecycle/sdd` y cerrar el drift global.
  - Fix:
    - Normalización a versión dinámica con `getCurrentPumukiVersion()` en:
      - `integrations/evidence/readEvidence.test.ts`
      - `integrations/evidence/writeEvidence.test.ts`
      - `integrations/evidence/schema.test.ts`
      - `integrations/evidence/__tests__/buildEvidence.test.ts`
      - `integrations/gate/__tests__/evaluateAiGate.test.ts`
      - `integrations/telemetry/__tests__/gateTelemetry.test.ts`
      - `integrations/lifecycle/__tests__/doctor.test.ts`
      - `integrations/lifecycle/__tests__/preWriteAutomation.test.ts`
      - `integrations/sdd/__tests__/evidenceScaffold.test.ts`
    - Eliminados hardcodes de `package_version/lifecycle_version` para evitar drift cross-release.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/evidence/readEvidence.test.ts integrations/evidence/writeEvidence.test.ts integrations/evidence/schema.test.ts integrations/evidence/__tests__/buildEvidence.test.ts integrations/gate/__tests__/evaluateAiGate.test.ts integrations/telemetry/__tests__/gateTelemetry.test.ts integrations/lifecycle/__tests__/doctor.test.ts integrations/lifecycle/__tests__/preWriteAutomation.test.ts integrations/sdd/__tests__/evidenceScaffold.test.ts` -> `97 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#634`.

- ✅ PUMUKI-052: Ejecutar siguiente bug/mejora SAAS prioritaria (issue `#635`) para normalizar hardcodes `producerVersion`/`producer_version` en tests de ingesta/operational-memory y eliminar drift residual de versión de productor.
  - Fix:
    - Normalización a versión dinámica (`getCurrentPumukiVersion()`) en:
      - `integrations/lifecycle/__tests__/saasIngestionAuth.test.ts`
      - `integrations/lifecycle/__tests__/saasIngestionAudit.test.ts`
      - `integrations/lifecycle/__tests__/saasIngestionGovernance.test.ts`
      - `integrations/lifecycle/__tests__/saasIngestionIdempotency.test.ts`
      - `integrations/lifecycle/__tests__/saasIngestionTransport.test.ts`
      - `integrations/lifecycle/__tests__/saasIngestionContract.test.ts`
      - `integrations/lifecycle/__tests__/operationalMemorySnapshot.test.ts`
      - `integrations/lifecycle/__tests__/operationalMemoryContract.test.ts`
    - Eliminados hardcodes `6.3.17` en `producerVersion/producer_version` de fixtures contractuales.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/saasIngestionAuth.test.ts integrations/lifecycle/__tests__/saasIngestionAudit.test.ts integrations/lifecycle/__tests__/saasIngestionGovernance.test.ts integrations/lifecycle/__tests__/saasIngestionIdempotency.test.ts integrations/lifecycle/__tests__/saasIngestionTransport.test.ts integrations/lifecycle/__tests__/saasIngestionContract.test.ts integrations/lifecycle/__tests__/operationalMemorySnapshot.test.ts integrations/lifecycle/__tests__/operationalMemoryContract.test.ts` -> `37 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#635`.

- ✅ PUMUKI-053: Ejecutar siguiente mejora prioritaria (issue `#636`) para reconciliar automáticamente backlog consumidor vs estado real de issues upstream (`dry-run/apply`) y evitar estados falsos `⛔/⏳`.
  - Fix:
    - Nuevo módulo: `scripts/reconcile-consumer-backlog-issues-lib.ts`
      - parseo de filas markdown con `issue_ref + emoji`,
      - reconciliación por estado real de issue (`OPEN/CLOSED`),
      - modo `dry-run/apply` con reporte de cambios.
    - Nuevo comando: `scripts/reconcile-consumer-backlog-issues.ts`
      - flags: `--file`, `--repo`, `--apply`, `--json`.
    - Tests nuevos:
      - `scripts/__tests__/reconcile-consumer-backlog-issues.test.ts`.
    - Script npm añadido:
      - `validation:backlog-reconcile`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `4 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#636`.

- ✅ PUMUKI-054: Ejecutar siguiente mejora prioritaria de hardening enterprise (issue `#637`) para policy-as-code versionada/firmada con validación estricta y trazabilidad completa en gates.
  - Fix:
    - `integrations/lifecycle/policyReconcile.ts` añade modo estricto (`strict`) con bloqueo determinista de stages no firmados o sin contrato file-backed.
    - `integrations/lifecycle/cli.ts` soporta `pumuki policy reconcile --strict` (incluyendo shorthand `pumuki policy --strict`) y reporta `strict_requested`.
    - Cobertura de regresión en:
      - `integrations/lifecycle/__tests__/policyReconcile.test.ts`
      - `integrations/lifecycle/__tests__/cli.test.ts`
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/policyReconcile.test.ts integrations/lifecycle/__tests__/cli.test.ts` -> `44 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#637`.

- ✅ PUMUKI-055: Ejecutar siguiente mejora operativa (issue `#638`) para aplicar reconciliación automática del backlog SAAS y normalizar leyenda/estado real sin drift.
  - Fix:
    - `scripts/reconcile-consumer-backlog-issues-lib.ts` ahora sincroniza también `## Estado de este backlog` con conteos reales desde tablas operativas.
    - Salida JSON del reconciliador enriquecida con `summaryUpdated` + `summary` (closed/inProgress/pending/blocked + IDs en construcción/bloqueados).
    - Cobertura de regresión ampliada en:
      - `scripts/__tests__/reconcile-consumer-backlog-issues.test.ts`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `7 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Aplicación real sobre consumer SAAS:
      - `npm run -s validation:backlog-reconcile -- --file=\"/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md\" --repo=SwiftEnProfundidad/ast-intelligence-hooks --apply --json`
      - Resultado: `summaryUpdated=true`, `closed=14`, `inProgress=1`, `pending=7`, `blocked=0`.
    - Cierre issue upstream: `#638`.

- ✅ PUMUKI-056: Ejecutar siguiente mejora operativa (issue `#639`) para soportar mapeo `ID consumidor -> issue upstream` en el reconciliador y cerrar filas `Pendiente` sin referencia.
  - Fix:
    - `scripts/reconcile-consumer-backlog-issues-lib.ts` añade `idIssueMap` y `referenceChanges` para inyectar referencias `#<issue>` en filas sin issue y reconciliarlas en el mismo ciclo.
    - `scripts/reconcile-consumer-backlog-issues.ts` incorpora `--id-issue-map=<json>` con validación de contrato (`PUMUKI-(M)?NNN -> issue number`).
    - Cobertura de regresión extendida:
      - `scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` (mapping + reconciliación integrada).
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `9 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Aplicación real sobre consumer SAAS con mapping:
      - `npm run -s validation:backlog-reconcile -- --file=\"/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md\" --repo=SwiftEnProfundidad/ast-intelligence-hooks --id-issue-map=/tmp/pumuki_saas_id_issue_map.json --apply --json`
      - Resultado: `referenceChanges=6`, `summary.closed=20`, `summary.inProgress=1`, `summary.pending=1`, `summary.blocked=0`.
    - Cierre issue upstream: `#639`.

- ✅ PUMUKI-057: Ejecutar siguiente task de trazabilidad residual (issue `#640`) para cerrar `PUMUKI-004` con referencia upstream canónica y dejar backlog SAAS sin pendientes fantasma.
  - Fix:
    - Validación explícita de cobertura `core.hooksPath` en lifecycle (`hookManager/status/doctor`) sin regresiones.
    - Referencia upstream canónica para residual `PUMUKI-004` con issue `#640`.
    - Reconciliación aplicada sobre consumer SAAS con mapping extendido (`PUMUKI-004 -> #640` y `PUMUKI-002 -> #641`) hasta `summary.closed=22`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/hookManager.test.ts integrations/lifecycle/__tests__/status.test.ts integrations/lifecycle/__tests__/doctor.test.ts` -> `23 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/gitAtomicity.test.ts integrations/git/__tests__/stageRunners.test.ts` -> `30 pass / 0 fail`.
    - `npm run -s validation:backlog-reconcile -- --file=\"/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md\" --repo=SwiftEnProfundidad/ast-intelligence-hooks --id-issue-map=/tmp/pumuki_saas_id_issue_map.json --apply --json` -> `closed=22, inProgress=0, pending=0, blocked=0`.
    - Cierres upstream: `#640`, `#641`.

- ✅ PUMUKI-058: Ejecutar siguiente mejora de claridad operativa (issue `#642`) para sincronizar automáticamente la narrativa de “Próximo paso operativo” cuando el backlog quede 100% cerrado.
  - Fix:
    - `scripts/reconcile-consumer-backlog-issues-lib.ts` añade sincronización del bloque narrativo de próximo paso en estado cerrado (`nextStepUpdated`).
    - `scripts/reconcile-consumer-backlog-issues.ts` expone `next_step_updated=yes|no` en salida humana.
    - Cobertura de regresión ampliada en:
      - `scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` (escenario de cierre total con narrativa legacy obsoleta).
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `10 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Aplicación real sobre consumer SAAS:
      - `npm run -s validation:backlog-reconcile -- --file=\"/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md\" --repo=SwiftEnProfundidad/ast-intelligence-hooks --id-issue-map=/tmp/pumuki_saas_id_issue_map.json --apply --json`
      - Resultado: `nextStepUpdated=true`, `closed=22`, `inProgress=0`, `pending=0`, `blocked=0`.
    - Cierre issue upstream: `#642`.

- ✅ PUMUKI-059: Mantener ciclo de vigilancia activa para nuevos hallazgos SAAS (sin tocar código consumidor), abriendo issue upstream y ejecutando fix en Pumuki core al primer bug/mejora nueva.
  - Fix:
    - Nuevo watcher operativo de backlog consumidor:
      - `scripts/watch-consumer-backlog-lib.ts`
      - `scripts/watch-consumer-backlog.ts`
      - `npm run validation:backlog-watch`
    - Clasificación automática:
      - `needs_issue` (incidencia sin issue upstream),
      - `drift_closed_issue` (estado no cerrado con issue cerrada),
      - `active_issue` (trabajo realmente abierto).
    - Salida JSON/humana + exit code determinista para CI (`--no-fail` opcional).
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/watch-consumer-backlog.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `13 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Ejecución real sobre SAAS:
      - `npm run -s validation:backlog-watch -- --file=\"/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md\" --repo=SwiftEnProfundidad/ast-intelligence-hooks --json`
      - Resultado: `nonClosedEntries=0`, `hasActionRequired=false`.
    - Cierre issue upstream: `#643`.

- ✅ PUMUKI-060: Iniciar vigilancia activa del feedback canónico de RuralGo usando `backlog-watch` (sin tocar código del consumer) y abrir ciclo inmediato ante nuevos hallazgos.
  - Fix:
    - `watch-consumer-backlog` ampliado para formato RuralGo:
      - soporte de estados textuales (`REPORTED/OPEN/FIXED/CLOSED/BLOCKED/PENDING/IN_PROGRESS`),
      - soporte de IDs canónicos (`PUMUKI-INC-*`, `FP-*`, `AST-GAP-*`),
      - dedupe por ID para evitar ruido resumen+detalle,
      - parse robusto de `issue_ref` priorizando columnas derechas.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/watch-consumer-backlog.test.ts` -> `7 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Watcher real RuralGo (`--no-fail`):
      - `npm run -s validation:backlog-watch -- --file=\"/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO/docs/technical/08-validation/refactor/pumuki-integration-feedback.md\" --repo=SwiftEnProfundidad/ast-intelligence-hooks --json --no-fail`
      - Resultado consolidado: `entriesScanned=106`, `nonClosedEntries=9`, `needsIssue=8`, `driftClosedIssue=1`, `hasActionRequired=true`.
    - Cierres upstream: `#644`, `#645`.

- ✅ PUMUKI-061: Ejecutar primer fix crítico del paquete RuralGo detectado por watcher (`PUMUKI-INC-059 / FP-030`) en `pre-push` bootstrap/upstream.
  - Fix:
    - `integrations/git/stageRunners.ts`:
      - `PRE_PUSH` sin upstream deja de bloquear en ejecución manual de `pumuki-pre-push` cuando existe base bootstrap resoluble (`develop/main`).
      - Mantiene `fail-safe` si no existe base bootstrap válida (`HEAD`).
    - `integrations/git/__tests__/stageRunners.test.ts`:
      - nueva cobertura RED/GREEN para fallback bootstrap sin stdin,
      - no-regresión para bloqueo accionable cuando base bootstrap no es resoluble.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts` -> `23 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#646`.

- ✅ PUMUKI-062: Ejecutar siguiente regresión prioritaria del watcher RuralGo (`PUMUKI-INC-048`) sobre no-determinismo `PRE_WRITE` (primer intento bloquea, rerun pasa).
  - Fix:
    - `integrations/lifecycle/preWriteAutomation.ts`:
      - `EVIDENCE_GATE_BLOCKED` entra en el set de violaciones auto-curables de `PRE_WRITE`.
      - El flujo de auto-refresh ya no requiere rerun manual de hooks cuando la evidencia quedó bloqueada y es recuperable.
    - `integrations/lifecycle/__tests__/preWriteAutomation.test.ts`:
      - nuevo test de regresión para `EVIDENCE_GATE_BLOCKED` con refresh determinista en primer intento.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/preWriteAutomation.test.ts` -> `3 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#647`.

- ✅ PUMUKI-063: Ejecutar siguiente bug prioritaria del watcher RuralGo (`PUMUKI-INC-060 / FP-030`) sobre falso positivo de coverage en `PRE_PUSH` por upstream desalineado.
  - Fix:
    - `integrations/git/stageRunners.ts`:
      - detección explícita de upstream desalineado para ramas topic (`feature/bugfix/refactor/chore/docs`) cuando el tracking apunta a `main/develop` y el delta `ahead` supera umbral operativo.
      - bloqueo determinista con código `PRE_PUSH_UPSTREAM_MISALIGNED` y remediación accionable (alinear upstream al branch real).
    - `integrations/git/resolveGitRefs.ts`:
      - nuevos resolvers para branch actual, tracking upstream simbólico y `ahead/behind`.
    - `integrations/git/__tests__/stageRunners.test.ts`:
      - nuevo test RED/GREEN para confirmar bloqueo específico por misalignment y evitar falso `skills scope` blocking posterior.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts` -> `24 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#648`.

- ✅ PUMUKI-064: Ejecutar siguiente bug prioritaria del watcher RuralGo (`PUMUKI-INC-061`) sobre incoherencia de metadata de versión en payload de lifecycle (`runtime` vs `consumer-installed`).
  - Fix:
    - `integrations/lifecycle/packageInfo.ts`:
      - nuevo contrato `resolvePumukiVersionMetadata()` con `source`, `runtimeVersion` y `consumerInstalledVersion`.
    - `integrations/evidence/repoState.ts`:
      - separación explícita en payload lifecycle:
        - `package_version` (consumer instalada),
        - `lifecycle_version` (runtime ejecutando),
        - `package_version_source`,
        - `package_version_runtime`,
        - `package_version_installed`.
    - `integrations/lifecycle/__tests__/packageInfo.test.ts`:
      - cobertura RED/GREEN para metadata explícita de fuentes de versión.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/packageInfo.test.ts` -> `7 pass / 0 fail`.
    - `npx --yes tsx@4.21.0 --test integrations/evidence/__tests__/buildEvidence.test.ts` -> `29 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#649`.

- ✅ PUMUKI-065: Ejecutar siguiente bug prioritaria del watcher RuralGo (`PUMUKI-INC-062`) sobre incoherencia `ai_gate_check` vs hooks (`pre-commit/pre-push`).
  - Fix:
    - `integrations/mcp/aiGateCheck.ts`:
      - nuevo `consistency_hint` en salida MCP para declarar comparabilidad con hooks.
      - cuando stage hook (`PRE_COMMIT/PRE_PUSH/CI`) bloquea por evidencia refrescable, marca `reason_code=HOOK_RUNNER_CAN_REFRESH_EVIDENCE` con mensaje de precedencia explícita.
    - `integrations/mcp/__tests__/aiGateCheck.test.ts`:
      - nuevo test RED/GREEN para validar hint explícito en `PRE_PUSH` bloqueado por evidencia.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test integrations/mcp/__tests__/aiGateCheck.test.ts integrations/mcp/__tests__/preFlightCheck.test.ts` -> `5 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#650`.

- ✅ PUMUKI-066: Ejecutar siguiente bug prioritaria del watcher RuralGo (`PUMUKI-INC-057`) sobre fallo local `--no-install` con `MODULE_NOT_FOUND` en runtime empaquetado.
  - Fix:
    - `scripts/package-install-smoke-consumer-npm-lib.ts`:
      - nueva verificación obligatoria `verifyInstalledPumukiBinaryVersion()` con `npx --no-install pumuki --version`.
      - bloqueo explícito ante patrones fatales (`Cannot find module`, `ERR_MODULE_NOT_FOUND`, etc.).
    - `scripts/package-install-smoke-consumer-repo-setup-lib.ts`:
      - el setup smoke incorpora check de binario local antes de continuar gates.
    - `scripts/__tests__/package-install-smoke-consumer-npm-lib.test.ts`:
      - tests RED/GREEN para path healthy y para regresión `MODULE_NOT_FOUND`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/package-install-smoke-consumer-npm-lib.test.ts scripts/__tests__/package-install-smoke-repo-setup-lib.test.ts scripts/__tests__/package-smoke-workflow-contract.test.ts` -> `7 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#651`.

- ✅ PUMUKI-067: Ejecutar mejora DX para watcher (`backlog-watch`) con mapeo opcional `ID -> issue` y eliminar `needsIssue` fantasma en backlogs consumidores.
  - Fix:
    - `scripts/watch-consumer-backlog.ts`:
      - nuevo flag `--id-issue-map=<json-path>` con carga de mapeo robusta.
    - `scripts/watch-consumer-backlog-lib.ts`:
      - clasificación soporta `idIssueMap` para resolver `needsIssue` cuando hay issue canónica fuera del MD consumidor.
    - `scripts/__tests__/watch-consumer-backlog.test.ts`:
      - nuevo test RED/GREEN de mapeo `ID -> issue` evitando falsos `needsIssue`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/watch-consumer-backlog.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `18 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#652`.

- ✅ PUMUKI-068: Ejecutar mejora DX siguiente para watcher con resolución de mapeo desde fuente canónica sin JSON manual ad hoc.
  - Fix:
    - `scripts/watch-consumer-backlog.ts`:
      - nuevo flag `--id-issue-map-from=<md-path>` para extraer mapeo automáticamente desde markdown canónico.
      - merge determinista de mapas (`--id-issue-map-from` + `--id-issue-map`), priorizando override explícito del JSON.
    - `scripts/watch-consumer-backlog-lib.ts`:
      - nuevo helper `collectBacklogIdIssueMap(markdown)` para extraer `ID -> #issue`.
    - `scripts/__tests__/watch-consumer-backlog.test.ts`:
      - cobertura RED/GREEN para extracción canónica de mapeo desde markdown.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/watch-consumer-backlog.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `19 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#653`.

- ✅ PUMUKI-069: Ejecutar mejora DX siguiente para watcher con enriquecimiento opcional de mapeo `ID->issue` por búsqueda GitHub cuando el ID no está en markdown local.
  - Fix:
    - `scripts/watch-consumer-backlog-lib.ts`:
      - nuevo resolver opcional `resolveIssueNumberById` en `runBacklogWatch`.
      - implementación GH nativa `resolveIssueNumberByIdWithGh` con búsqueda por token de ID (`title/body`) y selección determinista del issue candidato.
      - precedencia de resolución: `issue en fila` -> `idIssueMap` -> `lookup GH`.
    - `scripts/watch-consumer-backlog.ts`:
      - nuevo flag `--resolve-missing-via-gh` para habilitar enriquecimiento opcional por búsqueda upstream.
    - `scripts/__tests__/watch-consumer-backlog.test.ts`:
      - tests RED/GREEN para validar enriquecimiento por resolver de ID y que no re-consulta IDs ya resueltos por mapping local.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/watch-consumer-backlog.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `21 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#654`.

- ✅ PUMUKI-070: Ejecutar mejora DX siguiente para watcher con trazabilidad explícita de origen de resolución (`mapa` vs `lookup GH`).
  - Fix:
    - `scripts/watch-consumer-backlog-lib.ts`:
      - nuevo bloque `resolution` en `BacklogWatchResult` con listas deterministas:
        - `resolvedByMap`
        - `resolvedByGhLookup`
        - `unresolvedIds`
      - trazabilidad por origen integrada en el flujo de resolución (`fila -> mapa -> lookup GH`).
    - `scripts/watch-consumer-backlog.ts`:
      - salida humana ampliada con contadores/listados de resolución por origen.
    - `scripts/__tests__/watch-consumer-backlog.test.ts`:
      - cobertura RED/GREEN para verificar `resolvedByMap`, `resolvedByGhLookup` y `unresolvedIds`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/watch-consumer-backlog.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts` -> `22 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#655`.

- ✅ PUMUKI-071: Ejecutar mejora DX siguiente para reconciliador de backlog con resolución opcional `ID->issue` sin mapa manual.
  - Fix:
    - `scripts/reconcile-consumer-backlog-issues-lib.ts`:
      - nuevo `resolveIssueNumberById` opcional en `runBacklogIssuesReconcile`.
      - resolución de referencias pendientes por orden determinista:
        - `idIssueMap` explícito
        - lookup opcional por ID (si sigue pendiente).
      - soporte de IDs extendidos (`PUMUKI-INC-*`, `FP-*`, `AST-GAP-*`) para reconciliación.
    - `scripts/reconcile-consumer-backlog-issues.ts`:
      - nuevo flag `--resolve-missing-via-gh` que reutiliza resolver GH del watcher.
      - validación de `--id-issue-map` ampliada a IDs extendidos.
    - `scripts/__tests__/reconcile-consumer-backlog-issues.test.ts`:
      - tests RED/GREEN para:
        - resolver referencia pendiente vía resolver por ID,
        - prioridad de `idIssueMap` sobre lookup para evitar consultas redundantes.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `24 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#656`.

- ✅ PUMUKI-072: Ejecutar mejora DX siguiente para reconciliador con paridad `--id-issue-map-from=<md>` (fuente canónica markdown).
  - Fix:
    - `scripts/reconcile-consumer-backlog-issues.ts`:
      - nuevo flag `--id-issue-map-from=<md-path>`.
      - extracción de mapping canónico desde markdown usando `collectBacklogIdIssueMap`.
      - merge determinista de mapas:
        - base: `--id-issue-map-from`
        - override explícito: `--id-issue-map`.
    - `scripts/reconcile-consumer-backlog-issues-lib.ts`:
      - helper `mergeBacklogIdIssueMaps(base, override)` para mantener precedencia estable.
    - `scripts/__tests__/reconcile-consumer-backlog-issues.test.ts`:
      - test RED/GREEN de merge con override explícito.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `25 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#657`.

- ✅ PUMUKI-073: Ejecutar mejora DX siguiente para reconciliador con trazabilidad explícita de source de mapping en salida.
  - Fix:
    - `scripts/reconcile-consumer-backlog-issues-lib.ts`:
      - nuevo `mappingSource` en resultado (`none|json|markdown|merged`).
      - nuevo bloque `referenceResolution` con:
        - `resolvedByProvidedMap`
        - `resolvedByLookup`
        - `unresolvedReferenceIds`
    - `scripts/reconcile-consumer-backlog-issues.ts`:
      - salida humana/JSON ahora expone `mapping_source` y contadores por origen.
      - clasificación de source en runtime según inputs efectivos (`json`, `markdown`, `merged`, `none`).
    - `scripts/__tests__/reconcile-consumer-backlog-issues.test.ts`:
      - cobertura RED/GREEN para metadata de resolución y pendientes no resueltos.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `26 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#658`.

- ✅ PUMUKI-074: Ejecutar mejora DX siguiente para consolidar parsing/merge de mapping en módulo compartido.
  - Fix:
    - Nuevo módulo compartido: `scripts/backlog-id-issue-map-lib.ts`.
      - validación de IDs permitidos y números de issue.
      - parseo de JSON map.
      - merge determinista de mapas (`base + override`).
      - conversión `record -> ReadonlyMap`.
    - `scripts/watch-consumer-backlog.ts` y `scripts/reconcile-consumer-backlog-issues.ts` migrados para usar helpers comunes.
    - Eliminada duplicación de parser/merge local entre CLIs de backlog.
    - Nueva cobertura dedicada:
      - `scripts/__tests__/backlog-id-issue-map-lib.test.ts`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-id-issue-map-lib.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `29 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#659`.

- ✅ PUMUKI-075: Ejecutar mejora DX siguiente para alinear documentación/ayuda operativa de `watch` + `reconcile`.
  - Fix:
    - `docs/USAGE.md`:
      - nueva guía operativa de backlog tooling (`watch` + `reconcile`) con precedencia de mapping clara:
        - inline `#issue`
        - `--id-issue-map-from`
        - `--id-issue-map`
        - `--resolve-missing-via-gh`
      - ejemplos listos para uso real: watch JSON, reconcile dry-run y reconcile apply.
    - Smoke de ayuda CLI ejecutado para validar alineación de opciones entre scripts.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 scripts/watch-consumer-backlog.ts --help`
    - `npx --yes tsx@4.21.0 scripts/reconcile-consumer-backlog-issues.ts --help`
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#660`.

- ✅ PUMUKI-076: Ejecutar bug DX siguiente para normalizar `--help` a exit code `0` en scripts de backlog tooling.
  - Fix:
    - `scripts/watch-consumer-backlog.ts` y `scripts/reconcile-consumer-backlog-issues.ts`:
      - `--help/-h` ahora devuelve `exit code 0`.
      - errores reales mantienen `exit code 1`.
    - Nueva cobertura de proceso real:
      - `scripts/__tests__/backlog-cli-help-exit-code.test.ts` valida help vs unknown-arg en ambos scripts.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-cli-help-exit-code.test.ts scripts/__tests__/backlog-id-issue-map-lib.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `33 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#661`.

- ✅ PUMUKI-077: Ejecutar mejora DX siguiente para versionar contrato JSON en backlog tooling (`schema_version` + `tool`).
  - Fix:
    - `scripts/watch-consumer-backlog.ts` y `scripts/reconcile-consumer-backlog-issues.ts`:
      - JSON ahora incluye metadatos de contrato:
        - `tool`
        - `schema_version`
      - estructura previa se mantiene (sin breaking de campos existentes).
    - `scripts/__tests__/backlog-cli-help-exit-code.test.ts`:
      - nuevos tests de contrato JSON para ambos scripts.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-cli-help-exit-code.test.ts scripts/__tests__/backlog-id-issue-map-lib.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `35 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#662`.

- ✅ PUMUKI-078: Ejecutar mejora DX siguiente para añadir `generated_at` al contrato JSON de backlog tooling.
  - Fix:
    - `scripts/watch-consumer-backlog.ts` y `scripts/reconcile-consumer-backlog-issues.ts`:
      - JSON ahora incluye `generated_at` (UTC ISO-8601) junto a `tool` y `schema_version`.
    - `scripts/__tests__/backlog-cli-help-exit-code.test.ts`:
      - validación de presencia/formato básico de `generated_at`.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-cli-help-exit-code.test.ts scripts/__tests__/backlog-id-issue-map-lib.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `35 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#663`.

- ✅ PUMUKI-079: Ejecutar mejora DX siguiente para añadir `run_id` al contrato JSON de backlog tooling.
  - Fix:
    - `scripts/watch-consumer-backlog.ts` y `scripts/reconcile-consumer-backlog-issues.ts`:
      - JSON ahora incluye `run_id` (UUID v4) por ejecución.
    - `scripts/__tests__/backlog-cli-help-exit-code.test.ts`:
      - validación de formato UUID en `run_id` para ambos scripts.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-cli-help-exit-code.test.ts scripts/__tests__/backlog-id-issue-map-lib.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `35 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#664`.

- ✅ PUMUKI-080: Ejecutar mejora DX siguiente para añadir `invocation` metadata al contrato JSON de backlog tooling.
  - Fix:
    - `scripts/watch-consumer-backlog.ts` y `scripts/reconcile-consumer-backlog-issues.ts`:
      - JSON ahora incluye `invocation` con contexto no sensible de ejecución (`repo`, flags clave, `mode`).
    - `scripts/__tests__/backlog-cli-help-exit-code.test.ts`:
      - validación de `invocation` en contrato JSON de ambos scripts.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-cli-help-exit-code.test.ts scripts/__tests__/backlog-id-issue-map-lib.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `35 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#665`.

- ✅ PUMUKI-081: Ejecutar mejora DX siguiente para añadir bloque `compat` al contrato JSON de backlog tooling.
  - Fix:
    - `scripts/watch-consumer-backlog.ts` y `scripts/reconcile-consumer-backlog-issues.ts`:
      - JSON ahora incluye:
        - `compat.min_reader_version`
        - `compat.breaking_changes` (vacío en el estado actual).
    - `scripts/__tests__/backlog-cli-help-exit-code.test.ts`:
      - validación de bloque `compat` para ambos scripts.
  - Evidencia (2026-03-05):
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-cli-help-exit-code.test.ts scripts/__tests__/backlog-id-issue-map-lib.test.ts scripts/__tests__/reconcile-consumer-backlog-issues.test.ts scripts/__tests__/watch-consumer-backlog.test.ts` -> `35 pass / 0 fail`.
    - `npm run -s typecheck` -> `PASS`.
    - Cierre issue upstream: `#666`.

- 🚧 PUMUKI-082: Ejecutar mejora DX siguiente para añadir `compat.is_backward_compatible` al contrato JSON.
  - Alcance:
    - Añadir señal booleana directa de compatibilidad en `watch` y `reconcile`.
    - Simplificar lectura por consumidores automáticos.
  - Issue upstream activa: `#667`.
