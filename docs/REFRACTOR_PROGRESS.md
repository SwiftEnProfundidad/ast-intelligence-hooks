# Refactor Progress Tracker

Estado operativo del plan activo para restaurar capacidades enterprise sin romper la arquitectura actual.

## Leyenda
- ✅ Completada
- 🚧 En progreso (única activa)
- ⏳ Pendiente

## Fase 0 — Arranque y Preflight
- ✅ Ejecutar preflight obligatorio (`pwd`, `git rev-parse --show-toplevel`, `git status`).
- ✅ Verificar skills disponibles y aplicar skills relevantes para backend/integrations.
- ✅ Levantar contexto técnico de evidencia, lifecycle y MCP.

## Fase 1 — Evidencia determinista y estado de repo
- ✅ Añadir `repo_state` al esquema/build/write de evidencia con TDD.
- ✅ Extender tests de schema/build/write/read para el nuevo bloque `repo_state`.

## Fase 2 — Bootstrap de evidencia en install
- ✅ Generar `.ai_evidence.json` bootstrap al ejecutar `pumuki install` (sin findings, snapshot estable).
- ✅ Cubrir con tests de lifecycle install e idempotencia.

## Fase 3 — AI Gate unificado (MCP + pre-write)
- ✅ Implementar evaluador reusable de AI Gate (SDD + evidencia + gitflow/repo state).
- ✅ Integrar evaluador en `pumuki-pre-write`.
- ✅ Integrar evaluador en MCP enterprise `ai_gate_check`.
- ✅ Verificar contrato de salida consistente entre CLI y MCP.

## Fase 4 — Adapters enterprise (agnóstico de IDE en core/integrations)
- ✅ Añadir scaffolding `scripts/adapters/*` para diagnósticos y entrada de agentes.
- ✅ Añadir comandos lifecycle para instalar/actualizar config adapter en repos consumer.
- ✅ Mantener boundary test de desacoplo IDE (`core`/`integrations` sin acoplamiento proveedor).

## Fase 5 — Cierre técnico
- ✅ Ejecutar suites de test afectadas y resolver regresiones.
- ✅ Actualizar documentación técnica impactada.
- ✅ Re-ejecutar `npm run test:deterministic` tras actualización de documentación.
- ✅ Marcar cierre de fase y dejar siguiente ciclo listo sin tareas huérfanas.

## Fase 6 — Restauración Legacy Enterprise (TDD estricto)
- ✅ RED: definir test de integración para cadena obligatoria `pumuki -> MCP -> ai_gate -> ai_evidence` en `PRE_WRITE`.
- ✅ GREEN: implementar wiring mínimo para que el test anterior pase sin romper contratos existentes.
- ✅ REFACTOR (1/2): consolidar salida JSON de `PRE_WRITE` con `telemetry.chain`.
- ✅ REFACTOR (2/2): actualizar documentación técnica final del flujo y cerrar fase.
- ✅ Refactor retroactivo aplicado a implementaciones previas:
  - `integrations/evidence/repoState.ts` (helpers de git/lifecycle, simplificación de lectura segura).
  - `integrations/lifecycle/install.ts` (bootstrap de evidencia encapsulado).
  - `integrations/lifecycle/adapter.ts` (resolución de templates con caché y naming claro).
  - `integrations/gate/evaluateAiGate.ts` (factory de violaciones y reducción de duplicación).
  - `integrations/lifecycle/cli.ts` (builder explícito para envelope JSON de `PRE_WRITE`).
- ✅ Validación post-refactor ejecutada:
  - `npm run test:deterministic`
  - `tsx --test integrations/lifecycle/__tests__/install.test.ts integrations/lifecycle/__tests__/adapter.test.ts integrations/lifecycle/__tests__/lifecycle.test.ts integrations/gate/__tests__/evaluateAiGate.test.ts`

## Fase 7 — Cierre Operativo del Ciclo
- ✅ Consolidar diff final del ciclo y preparar propuesta de commits atómicos.
- ✅ Ejecutar cierre final de ciclo (estado listo para commit/release según confirmación de usuario).
- ✅ Propuesta de commits atómicos consolidada:
  - `feat(evidence): persistir repo_state + hard_mode en contrato v2.1`
    - `integrations/evidence/schema.ts`
    - `integrations/evidence/buildEvidence.ts`
    - `integrations/evidence/writeEvidence.ts`
    - `integrations/evidence/repoState.ts`
    - `integrations/evidence/generateEvidence.ts`
    - `integrations/git/runPlatformGateEvidence.ts`
    - `integrations/evidence/__tests__/buildEvidence.test.ts`
    - `integrations/evidence/__tests__/repoState.test.ts`
    - `integrations/evidence/readEvidence.test.ts`
    - `integrations/evidence/schema.test.ts`
    - `integrations/evidence/writeEvidence.test.ts`
  - `feat(gate): unificar ai_gate PRE_WRITE y trace de hard mode/profile`
    - `integrations/gate/evaluateAiGate.ts`
    - `integrations/gate/stagePolicies.ts`
    - `integrations/gate/__tests__/evaluateAiGate.test.ts`
    - `integrations/gate/__tests__/stagePolicies.test.ts`
  - `feat(mcp): exponer policy trace en ai_gate_check enterprise`
    - `integrations/mcp/enterpriseServer.ts`
    - `integrations/mcp/__tests__/enterpriseServer.test.ts`
  - `feat(lifecycle): bootstrap de evidencia + adapter install para agentes`
    - `integrations/lifecycle/cli.ts`
    - `integrations/lifecycle/install.ts`
    - `integrations/lifecycle/adapter.ts`
    - `integrations/lifecycle/adapter.templates.json`
    - `integrations/lifecycle/__tests__/install.test.ts`
    - `integrations/lifecycle/__tests__/lifecycle.test.ts`
    - `integrations/lifecycle/__tests__/adapter.test.ts`
    - `scripts/adapters/*`
  - `feat(menu): acción de configuración hard mode enterprise`
    - `scripts/framework-menu.ts`
    - `scripts/framework-menu-actions-diagnostics-maintenance-lib.ts`
    - `scripts/framework-menu-runners.ts`
    - `scripts/framework-menu-runners-validation.ts`
    - `scripts/framework-menu-runners-validation-hardmode-lib.ts`
    - `scripts/__tests__/framework-menu-hard-mode-config.test.ts`
  - `docs(framework): actualizar contratos de evidencia, MCP y uso`
    - `docs/evidence-v2.1.md`
    - `docs/MCP_SERVERS.md`
    - `docs/API_REFERENCE.md`
    - `docs/INSTALLATION.md`
    - `docs/USAGE.md`
    - `docs/REFRACTOR_PROGRESS.md`

## Fase 8 — Hard Mode UX/Config en Menú Interactivo
- ✅ GREEN: soportar perfil `PUMUKI_HARD_MODE_PROFILE=critical-high` en `stagePolicies` con traza determinista.
- ✅ RED: añadir test para mapeo enterprise de severidades (`CRITICAL/HIGH/MEDIUM/LOW`) a severidades de gate.
- ✅ GREEN: implementar mapeo enterprise de severidades (`CRITICAL/HIGH/MEDIUM/LOW`) a severidades de gate y exportarlo en `stagePolicies`.
- ✅ REFACTOR: aplicar el mapeo enterprise en la resolución de umbrales de hard mode para eliminar conversiones ad-hoc futuras.
- ✅ RED: añadir test de menú para acción explícita de configuración hard mode/enforcement enterprise.
- ✅ GREEN: implementar acción de menú (id `18`) para configurar hard mode/enforcement enterprise.
- ✅ RED: añadir test de `captureRepoState` para reflejar configuración hard mode persistida en `.pumuki/hard-mode.json`.
- ✅ GREEN: persistir configuración hard mode en archivo determinista y exponerla en `repo_state` dentro de evidencia.
- ✅ RED: añadir test para que `stagePolicies` aplique hard mode/profile desde `.pumuki/hard-mode.json` sin variables de entorno.
- ✅ GREEN: aplicar `.pumuki/hard-mode.json` en `stagePolicies` para `PRE_COMMIT/PRE_PUSH/CI` con traza consistente.
- ✅ RED: definir test de integración para propagar la misma política hard mode persistida en `PRE_WRITE`/MCP.
- ✅ GREEN/REFACTOR: implementar integración `PRE_WRITE`/MCP y cerrar regresión con pruebas de menú + gate.

## Fase 9 — Operación de Integración
- ✅ Ejecutar commits atómicos del diff consolidado (en el orden propuesto) tras confirmación explícita del usuario.
  - ✅ Commit 1/6: `feat(evidence): persistir repo_state + hard_mode en contrato v2.1`.
  - ✅ Commit 2/6: `feat(gate): unificar ai_gate PRE_WRITE y trace de hard mode/profile`.
  - ✅ Commit 3/6: `feat(mcp): exponer policy trace en ai_gate_check enterprise`.
  - ✅ Commit 4/6: `feat(lifecycle): bootstrap de evidencia + adapter install para agentes`.
  - ✅ Commit 5/6: `feat(menu): acción de configuración hard mode enterprise`.
  - ✅ Commit 6/6: `docs(framework): actualizar contratos de evidencia, MCP y uso`.
- ✅ Actualizar `README.md` a formato enterprise pre-bump (quickstart, hard mode, PRE_WRITE chain, lifecycle/adapters, MCP y mapa documental).
- ✅ Ejecutar bump/release y publicación npm (`v6.3.17`).
- ✅ Ejecutar sincronización final (`develop`/`main`) cuando el usuario lo autorice.

## Fase 10 — Estado Operativo
- ✅ Esperar nuevas instrucciones de producto/arquitectura para el siguiente ciclo.

## Fase 11 — Hard Mode UX y README UX
- ✅ TDD: añadir selector real en menú para hard mode con dos modos (`critical-high` y `all-severities`) y persistencia en `.pumuki/hard-mode.json`.
- ✅ Ajustar `README.md` para snippets profesionales compatibles con copiado automático en GitHub/npm.

## Fase 12 — Siguiente paso operativo
- ✅ Esperar validación del usuario para siguiente bloque de implementación.

## Fase 13 — Menú Legacy++ (Bloque 1)
- ✅ TDD: añadir panel operativo en menú interactivo con recuento de findings, severidades y top ficheros violados desde `.ai_evidence.json`.
- ✅ Integrar el panel en `framework-menu` manteniendo SRP y contratos actuales.

## Fase 14 — Menú Legacy++ (Bloque 2)
- ✅ TDD: añadir tres modos de auditoría operativa en menú (`repo completo`, `repo+staged`, `staged+unstaged`) sin eliminar opciones actuales.
- ✅ TDD: rediseñar menú `consumer` a formato legado (opciones 1..9) manteniendo `advanced`.
- ✅ TDD: generar salida de auditoría con secciones legacy (`QUICK SUMMARY`, breakdown por plataforma, top violations, métricas y resumen final).
- ✅ TDD: alinear renderer legacy con layout visual de referencia (`assets/ast_intelligence_01.svg`..`05.svg`) usando paneles de terminal, cabecera operativa y cierre ejecutivo.
- ✅ Sincronizar sandbox self-audit (`_sandbox/pumuki-self-audit-20260220-173115`) con el bloque de menú/auditoría legacy para validación local sin publish.
- ✅ Sincronizar sandbox con el último renderer panelizado para eliminar salida plana antigua y validar ejecución real (`npm run framework:menu`, opción `1`).
- ✅ TDD: estabilizar panel renderer con ajuste por ancho de terminal y word-wrap para eliminar bordes rotos/line-wrap defectuoso en `METRICS`.
- ✅ TDD: aplicar tema visual legacy (jerarquía + color ANSI + paneles consistentes) para acercar UI/UX CLI a `assets/ast_intelligence_01.svg`..`05.svg` manteniendo menú actual.
- ✅ TDD: ajustar color de borde/jerarquía y margen de ancho del panel para reducir clipping visual y acercar contraste al look legacy.
- ✅ TDD: evitar short-circuit total en auditoría de menú cuando SDD bloquea, manteniendo `sdd.policy.blocked` pero evaluando findings adicionales del repo.
- ✅ TDD: habilitar heurísticas TypeScript de repo completo en auditoría de menú (`PUMUKI_HEURISTICS_TS_SCOPE=all`) para detectar violaciones fuera de `apps/*`.
- ✅ TDD: convertir breakdown de plataforma en mini-cards estilo legacy dentro del panel AST para acercar UI/UX a `assets/ast_intelligence_01.svg`..`05.svg`.
- ✅ TDD: cambiar evaluación de reglas para emitir findings por match real (por archivo/heurística) en vez de colapsar a 1 finding por regla, elevando fidelidad de auditoría.
- ✅ TDD: mostrar siempre `iOS/Android/Backend/Frontend/Other` en breakdown (incluyendo cero), y clasificar plataforma por `ruleId` cuando el path no aporta contexto.
- ✅ TDD: calibrar matriz enterprise de severidades heurísticas (CRITICAL/ERROR/WARN) en `PRE_COMMIT/PRE_PUSH/CI`, evitando sobrepromoción global a `ERROR`.
- ✅ TDD: clasificar `heuristics.ts.*` por plataforma (Backend por defecto, Frontend para familias browser) para evitar concentrar findings válidos en `Other`.
- ✅ TDD: enriquecer breakdown con vista por `ruleset` además de plataforma en la salida legacy.
- ✅ Añadir acción de diagnóstico rápido para listar ficheros violados con recuento detallado desde evidencia.

## Fase 15 — Cierre técnico del bloque Legacy++
- ✅ Ejecutar validación final de regresión (`npm test`) y preparar cierre operativo del bloque para revisión del usuario.
- ✅ Consolidar cleanup final del diff de menú legacy y proponer paquete de commits atómicos.
  - `feat(menu-legacy): renderer panelizado + mini-cards por plataforma + breakdown por ruleset`
    - `scripts/framework-menu-legacy-audit-lib.ts`
    - `scripts/framework-menu-evidence-summary-lib.ts`
    - `scripts/framework-menu-gate-lib.ts`
    - `scripts/framework-menu.ts`
  - `feat(menu-legacy): acciones consumer + diagnóstico de ficheros violados`
    - `scripts/framework-menu-consumer-actions-lib.ts`
    - `scripts/framework-menu-consumer-runtime-lib.ts`
    - `scripts/framework-menu-actions-gates-stage-lib.ts`
    - `scripts/framework-menu-actions-diagnostics-maintenance-lib.ts`
    - `scripts/framework-menu-action-contract.ts`
    - `scripts/framework-menu-prompts.ts`
  - `test(menu-legacy): cobertura de auditoría, scopes y acciones consumer`
    - `scripts/__tests__/framework-menu-legacy-audit.test.ts`
    - `scripts/__tests__/framework-menu-evidence-summary.test.ts`
    - `scripts/__tests__/framework-menu-scope-audits.test.ts`
    - `scripts/__tests__/framework-menu-consumer-actions.test.ts`
  - `test(gate): cobertura jest al 100% para evaluateRules + compatibilidad de stage policy`
    - `core/gate/__tests__/evaluateRules.spec.ts`
    - `core/gate/__tests__/conditionMatches.spec.ts`
    - `integrations/gate/stagePolicies.ts`
    - `integrations/gate/__tests__/stagePolicies.test.ts`

## Fase 16 — Espera operativa
- ✅ TDD: unificar renderer del menú consumer con renderer legacy para eliminar drift visual y bordes rotos por ANSI/anchura.
- ✅ TDD: reducir ruido operativo del `Full audit` silenciando el volcado raw de findings y dejando salida ejecutiva panelizada.
- ✅ Diagnóstico de métricas: `Files scanned` estaba cayendo a `files afectados` cuando evidencia no incluye `snapshot.files_scanned`.
- ✅ Corregir contrato de evidencia y renderer para reportar `Files scanned` real (facts auditados) y recalibrar `Code Health Score`.
- ✅ Diagnóstico de cobertura actual: en este repo se auditan 911 ficheros TS/JS (0 Swift/Kotlin/TSX), findings concentrados en `heuristics.ts.*` sobre `scripts/*` e `integrations/*`, con bloqueo adicional por `sdd.policy.blocked`.
- ✅ Validar con el usuario la nueva lectura operativa del menú (`files_scanned` persistido + score recalibrado) antes de cierre definitivo.
- ✅ Ejecutar auditoría completa del código base de Pumuki (scope repo) y consolidar backlog real por regla/fichero desde `.ai_evidence.json`.
- ✅ Corregir lote 1 de violaciones AST en framework (`execFileSync`/`spawnSync`/`process.exit`/`console.*`) con TDD y volver a auditar.
  - Resultado en worktree audit: `63 -> 3` findings, `BLOCK -> PASS` (quedan solo reglas `child_process` nucleares).
- ✅ Corregir lote residual de `child_process` (`integrations/git/GitService.ts`, `scripts/check-package-manifest.ts`) y propagar compatibilidad en lifecycle/sdd.
  - Resultado: auditoría `repo` en menú (`runRepoGateSilent`) con `0 findings`, `files_scanned=911`, `outcome=PASS`.
  - Validación: `npm test -- --runInBand` en verde tras correcciones de regresión.
- ✅ Consolidar reporte operativo al usuario con estado de tests + auditoría repo/worktree.
- ✅ Diseñar plan de commits atómicos sobre el diff actual (orden, alcance y riesgo por bloque).
- ✅ Ejecutar plan de commits atómicos sobre el diff completo.
- ✅ Validar alcance de “TODAS las reglas/skills” para plataformas sin código nativo en este repo (iOS/Android/Frontend).
  - Diagnóstico estructural: `swift=0`, `kt/kts=0`, `tsx=0`, `apps/ios=0`, `apps/android=0`, `apps/backend=0`, `apps/web|apps/frontend=0`.
  - Resultado operativo esperado: auditoría `repo` con `files_scanned=911`, `findings=0`, `outcome=PASS` y sin detección de plataformas de app en `snapshot.platforms`.
  - Causa raíz: el detector de plataformas está orientado a repos consumer (`apps/*`), este repo es framework/core (`core/`, `integrations/`, `scripts/`).

## Fase 17 — Expansión Semántica Multi-Plataforma para Repo Framework
- ✅ Diseñar/implementar clasificación base de plataforma para repos de framework (sin `apps/*`) usando señal por `ruleId` + familias heurísticas (`ios.*`, `android.*`, `frontend.*`, `backend.*`) y fallback `other`.
  - ✅ RED: test en `scripts/__tests__/framework-menu-legacy-audit.test.ts` exige que `heuristics.ts.child-process-*` compute como `Backend` (repo framework).
  - ✅ GREEN: ajustar `detectPlatformByRuleId` en `scripts/framework-menu-legacy-audit-lib.ts` para mapear familia `heuristics.ts.*` a `Backend` por defecto y mantener excepciones de `Frontend` browser.
- ✅ Añadir cobertura TDD de clasificación multi-plataforma en evidencia/menú legacy (casos: repo framework puro, repo mixto, repo consumer clásico).
  - ✅ RED confirmado repo mixto: `readLegacyAuditSummary en repo mixto prioriza path apps/* frente a fallback heuristics.ts.*` falla con `2 !== 1` en `Backend` tras el fallback global.
  - ✅ Evidencia RED: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-legacy-audit.test.ts` (10 pass / 1 fail).
- ✅ GREEN: priorizar clasificación por `path` para `apps/*` en repos mixtos y dejar fallback `heuristics.ts.*` para contexto framework puro.
  - ✅ Implementación: `scripts/framework-menu-legacy-audit-lib.ts` (`detectPlatform` ahora evalúa `path` antes de `ruleId`).
  - ✅ Validación: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-legacy-audit.test.ts` (11/11).
- ✅ REFACTOR + integración: resumir plataformas siempre presentes (incluyendo cero) en `.ai_evidence.json` y renderer legacy sin depender de `apps/*`.
  - ✅ `buildEvidence` emite `snapshot.platforms` con `iOS/Android/Backend/Frontend/Other`, `files_affected`, `by_severity`, `top_violations`.
  - ✅ `writeEvidence` normaliza y persiste `snapshot.platforms` de forma determinista.
  - ✅ `framework-menu-legacy-audit` prioriza `snapshot.platforms` cuando está presente (fallback a cálculo por findings si no existe).
  - ✅ Validación TDD:
    - `npx --yes tsx@4.21.0 --test integrations/evidence/__tests__/buildEvidence.test.ts` (21/21)
    - `npx --yes tsx@4.21.0 --test integrations/evidence/writeEvidence.test.ts` (3/3)
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-legacy-audit.test.ts` (12/12)
- ✅ Cierre de fase 17 (parte 1): barrido final de regresión del bloque (`framework-menu-*` + `integrations/evidence/*`).
  - ✅ Validación ejecutada:
    - `npx --yes tsx@4.21.0 --test integrations/evidence/*.test.ts integrations/evidence/__tests__/buildEvidence.test.ts scripts/__tests__/framework-menu-*.test.ts`
    - Resultado: `87/87` tests en verde.
- ✅ Cierre de fase 17 (parte 2): preparar paquete de commit atómico del bloque multi-plataforma/evidence legacy.
  - ✅ Commit atómico propuesto 1/3
    - `feat(evidence): add snapshot platform summaries for legacy severity matrix`
    - `integrations/evidence/platformSummary.ts`
    - `integrations/evidence/schema.ts`
    - `integrations/evidence/buildEvidence.ts`
    - `integrations/evidence/writeEvidence.ts`
    - `integrations/evidence/__tests__/buildEvidence.test.ts`
  - ✅ Commit atómico propuesto 2/3
    - `feat(menu-legacy): consume snapshot.platforms for deterministic platform breakdown`
    - `scripts/framework-menu-legacy-audit-lib.ts`
    - `scripts/__tests__/framework-menu-legacy-audit.test.ts`
  - ✅ Commit atómico propuesto 3/3
    - `docs(progress): close phase 17 multi-platform semantic expansion`
    - `docs/REFRACTOR_PROGRESS.md`
- ✅ Siguiente paso ejecutado: commits atómicos 1/3, 2/3 y 3/3 aplicados.
  - ✅ `e43a737` — `feat(evidence): add snapshot platform summaries for legacy severity matrix`
  - ✅ `2ea42b5` — `feat(menu-legacy): consume snapshot.platforms for deterministic platform breakdown`
  - ✅ `a0d9626` — `docs(progress): close phase 17 multi-platform semantic expansion`
- ✅ Push ejecutado a remoto: `main -> origin/main` con los commits de cierre de Fase 17 (`83ba57d` incluido).
- ✅ PR abierta y mergeada para el ajuste pendiente de tracking de Fase 17.
- ✅ Validación manual en menú completada (`npm run framework:menu`, opción `1`) con renderer legacy y `snapshot.platforms` end-to-end.

## Fase 18 — Self-Audit Real del Repo Framework (sin `apps/*`)
- ✅ RED: añadir test en `integrations/config/__tests__/skillsRuleSet.test.ts` para fallback sin prefijos de plataforma cuando no existen carpetas `apps/*`.
- ✅ GREEN: implementar fallback en `integrations/config/skillsRuleSet.ts` para convertir reglas `skills.*` a condición heurística sin `filePathPrefix` cuando el árbol de plataforma no existe en el repo.
- ✅ REFACTOR: estabilizar tests existentes creando carpetas `apps/ios|backend|frontend|web` en fixtures que validan scoping estricto por prefijos.
- ✅ Validación técnica ejecutada:
  - `npx --yes tsx@4.21.0 --test integrations/config/__tests__/skillsRuleSet.test.ts` (6/6)

## Fase 19 — Hardening de comandos Git Flow
- ✅ T6 completada: `npm run gitflow*` ya no depende de rutas inexistentes.
  - ✅ RED:
    - `scripts/__tests__/gitflow-cli.test.ts` creado para contrato `check/status/workflow/reset` + comando inválido.
    - Evidencia inicial: `npx --yes tsx@4.21.0 --test scripts/__tests__/gitflow-cli.test.ts` con fallo `5/5` por `bin/gitflow` ausente.
  - ✅ GREEN:
    - `bin/gitflow` implementado con wrapper TS.
    - `scripts/gitflow.ts` y `scripts/gitflow-cli-lib.ts` añadidos con salida determinista y reset no destructivo.
  - ✅ REFACTOR + validación:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/gitflow-cli.test.ts` (`5/5` pass).
    - `npm run gitflow --silent`, `npm run gitflow:status --silent`, `npm run gitflow:workflow --silent`, `npm run gitflow:reset --silent`.
    - `npm run typecheck`.
- 🚧 T7 en progreso: saneamiento de aliases legacy rotos en `package.json` (paths inexistentes restantes).
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGateEvaluation.test.ts scripts/__tests__/framework-menu-gate-lib.test.ts` (3/3)
  - `npm run framework:menu` (opción `1`) ahora devuelve findings reales en este repo (`skills.backend.no-empty-catch: 3`).
- ✅ Ajustar opción `2` del menú consumer para ejecutar `repo+staged` con política `PRE_PUSH` (antes corría como `PRE_COMMIT`).
  - ✅ RED: test nuevo en `scripts/__tests__/framework-menu-gate-lib.test.ts` exigiendo `snapshot.stage === PRE_PUSH`.
  - ✅ GREEN: nueva función `runRepoAndStagedPrePushGateSilent` en `scripts/framework-menu-gate-lib.ts` y wiring en `scripts/framework-menu.ts`.
  - ✅ Validación: opción `2` del menú ahora genera `.ai_evidence.json` con `{ stage: PRE_PUSH, findings: 6, files_scanned: 925 }`.
- ✅ Ajustar opción `4` del menú consumer para ejecutar `working-tree` con política `PRE_PUSH` (consistente con “CRITICAL/HIGH”).
  - ✅ RED: test nuevo en `scripts/__tests__/framework-menu-gate-lib.test.ts` exigiendo `snapshot.stage === PRE_PUSH` para `runWorkingTreePrePushGateSilent`.
  - ✅ GREEN: nueva función `runWorkingTreePrePushGateSilent` en `scripts/framework-menu-gate-lib.ts` y wiring en `scripts/framework-menu.ts`.
  - ✅ Validación: opción `4` del menú ahora genera `.ai_evidence.json` con `{ stage: PRE_PUSH, findings: 0, files_scanned: 5 }`.
- ✅ Re-semántica visual aplicada en menú consumer para matriz `1/2/3/4` con stage explícito en labels.
  - ✅ `1) Full audit (repo analysis · PRE_COMMIT)`
  - ✅ `2) Strict REPO+STAGING (CI/CD · PRE_PUSH)`
  - ✅ `3) Strict STAGING only (dev · PRE_COMMIT)`
  - ✅ `4) Standard CRITICAL/HIGH (working tree · PRE_PUSH)`
  - ✅ Validación TDD:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-consumer-actions.test.ts scripts/__tests__/framework-menu-gate-lib.test.ts` (4/4)
  - ✅ Validación manual:
    - `npm run framework:menu` muestra labels actualizados con scope/stage explícito.
- ✅ Validación funcional final ejecutada sobre matriz `1/2/3/4/9` (menú consumer) con evidencia real end-to-end.
  - ✅ Opción `1` → `{ stage: PRE_COMMIT, outcome: BLOCK, findings: 3, files_scanned: 925 }`
  - ✅ Opción `2` → `{ stage: PRE_PUSH, outcome: BLOCK, findings: 6, files_scanned: 925 }`
  - ✅ Opción `3` → `{ stage: PRE_COMMIT, outcome: PASS, findings: 0, files_scanned: 0 }`
  - ✅ Opción `4` → `{ stage: PRE_PUSH, outcome: PASS, findings: 0, files_scanned: 7 }`
  - ✅ Opción `9` (diagnóstico de ficheros) muestra top actual:
    - `integrations/lifecycle/gitService.ts`
    - `integrations/lifecycle/update.ts`
    - `scripts/adapter-session-status-writes-log-filter-lib.ts`
- ✅ Cierre de Fase 18 confirmado con matriz funcional `1/2/3/4/9` validada en ejecución real.
- ✅ Commit atómico local ejecutado:
  - ✅ `135acdd` — `feat(menu): normalize consumer stage/scope and enable framework self-audit skills`
  - ✅ Alcance incluido:
    - `integrations/config/skillsRuleSet.ts`
    - `integrations/config/__tests__/skillsRuleSet.test.ts`
    - `scripts/framework-menu.ts`
    - `scripts/framework-menu-gate-lib.ts`
    - `scripts/framework-menu-consumer-actions-lib.ts`
    - `scripts/__tests__/framework-menu-gate-lib.test.ts`
    - `scripts/__tests__/framework-menu-consumer-actions.test.ts`
    - `docs/REFRACTOR_PROGRESS.md`
- ✅ Próxima tarea anterior completada: push ejecutado a `origin/main` con los commits locales pendientes (`135acdd`, `c1631e3`).
- ✅ Diagnóstico cerrado: el menú no está “ciego”; la matriz real en este repo es:
  - ✅ Opción `1` (`repo · PRE_COMMIT`) → `findings=3`, `files_scanned=925`, `outcome=BLOCK`.
  - ✅ Opción `2` (`repo+staged · PRE_PUSH`) → `findings=6`, `files_scanned=925`, `outcome=BLOCK`.
  - ✅ Opción `3` (`staged · PRE_COMMIT`) puede devolver `0` cuando no hay staged (comportamiento esperado).
  - ✅ Opción `4` (`working tree · PRE_PUSH`) puede devolver `0` cuando no hay cambios relevantes en working tree.
- ✅ Validación canaria controlada ejecutada: una violación temporal en `scripts/` dispara findings y clasificación en `Backend`, confirmando que el motor de reglas sí detecta.
- ✅ TDD UX/diagnóstico aplicado:
  - ✅ RED: `scripts/__tests__/framework-menu-consumer-runtime.test.ts` (2 fallos esperados).
  - ✅ GREEN: aviso explícito de `Scope vacío` en opción `3` (staged) y opción `4` (working tree) cuando `files_scanned=0`.
  - ✅ REFACTOR: consolidado en `scripts/framework-menu-consumer-runtime-lib.ts` con helper único.
  - ✅ Tests en verde:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-consumer-runtime.test.ts scripts/__tests__/framework-menu-consumer-actions.test.ts` (3/3)
- ✅ Próxima tarea anterior completada: push ejecutado en remoto del commit `37bee29` (ajuste UX de `scope vacío` + tests).
- ✅ Próxima tarea anterior completada: validación manual final de matriz del menú consumer (`1/2/3/4/9`) ejecutada en `main`.
  - ✅ Opción `1` → `Files scanned: 926`, `Total violations: 3`, `Stage: PRE_COMMIT`, `Outcome: BLOCK`.
  - ✅ Opción `2` → `Files scanned: 926`, `Total violations: 6`, `Stage: PRE_PUSH`, `Outcome: BLOCK`.
  - ✅ Opción `3` → `Files scanned: 0`, `Total violations: 0`, `Stage: PRE_COMMIT`, `Outcome: PASS`, con hint `Scope vacío (staged)`.
  - ✅ Opción `4` → `Files scanned: 0`, `Total violations: 0`, `Stage: PRE_PUSH`, `Outcome: PASS`, con hint `Scope vacío (working tree)`.
  - ✅ Opción `9` → top files visibles:
    - `integrations/lifecycle/gitService.ts`
    - `integrations/lifecycle/update.ts`
    - `scripts/adapter-session-status-writes-log-filter-lib.ts`
- ✅ Próxima tarea anterior completada: commit atómico del cierre de validación manual ejecutado en local.
- ✅ Próxima tarea anterior completada: push final de sincronización ejecutado (`fb3c30d -> origin/main`) y rama alineada.
- ✅ Próxima tarea anterior completada: estado final limpio validado (`git status` = `main...origin/main`) y bloque cerrado.
- ✅ Próxima tarea anterior completada: instrucción recibida para abrir nuevo bloque.

## Fase 19 — Automatización de Matriz de Menú Consumer (1/2/3/4/9)
- ✅ RED: crear test de integración que ejecute la matriz `1/2/3/4/9` y valide contrato mínimo por opción (`stage`, `outcome`, `files_scanned`, `total_violations`).
  - ✅ Test añadido: `scripts/__tests__/framework-menu-matrix-runner.test.ts`.
  - ✅ Estado RED confirmado: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-runner.test.ts` falla con `MODULE_NOT_FOUND` de `../framework-menu-matrix-runner-lib`.
- ✅ GREEN: implementar runner determinista de matriz (sin interacción manual) para menú consumer.
  - ✅ Implementado: `scripts/framework-menu-matrix-runner-lib.ts` con ejecución secuencial de opciones `1/2/3/4/9` y reporte tipado por opción.
  - ✅ Validación GREEN: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-runner.test.ts` (1/1).
- ✅ REFACTOR: extraer utilidades comunes de parseo/validación de `.ai_evidence.json` usadas por la matriz.
  - ✅ Nueva utilidad: `scripts/framework-menu-matrix-evidence-lib.ts` (`readMatrixOptionReport`, `toMatrixOptionReport`, tipos compartidos de matriz).
  - ✅ Runner simplificado: `scripts/framework-menu-matrix-runner-lib.ts` ahora usa `runOption(...)` + utilidad compartida, sin duplicación de normalización.
  - ✅ Validación post-refactor: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-runner.test.ts` (1/1).
- ✅ RED: crear test canario controlado que inyecte una violación temporal y exija detección efectiva en `repo` (`option 1`).
  - ✅ Test añadido: `scripts/__tests__/framework-menu-matrix-canary.test.ts`.
  - ✅ Estado RED confirmado: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-canary.test.ts` falla con `MODULE_NOT_FOUND` de `../framework-menu-matrix-canary-lib`.
- ✅ GREEN: implementar helper canario reutilizable y cleanup garantizado tras ejecución.
  - ✅ Implementado: `scripts/framework-menu-matrix-canary-lib.ts`.
  - ✅ Cubre creación de violación temporal, ejecución de `option 1` (`repo`) y cleanup garantizado en `finally`.
  - ✅ Validación GREEN: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-canary.test.ts` (1/1).
- ✅ REFACTOR: consolidar salida de diagnóstico para diferenciar explícitamente `scope vacío` vs `repo limpio`.
  - ✅ `scripts/framework-menu-matrix-evidence-lib.ts` ahora emite `diagnosis` por opción: `scope-empty | repo-clean | violations-detected | unknown`.
  - ✅ `scripts/framework-menu-matrix-runner-lib.ts` y `scripts/framework-menu-matrix-canary-lib.ts` adaptados al nuevo contrato tipado.
  - ✅ RED del refactor añadido y validado: `scripts/__tests__/framework-menu-matrix-evidence.test.ts`.
  - ✅ Validación post-refactor:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-evidence.test.ts scripts/__tests__/framework-menu-matrix-runner.test.ts scripts/__tests__/framework-menu-matrix-canary.test.ts` (5/5).
- ✅ Validación: ejecutar suite nueva + suites relacionadas del menú y dejar evidencia de resultados en esta fase.
  - ✅ Ejecutado:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-*.test.ts scripts/__tests__/framework-menu-consumer-runtime.test.ts scripts/__tests__/framework-menu-consumer-actions.test.ts scripts/__tests__/framework-menu-gate-lib.test.ts`
  - ✅ Resultado: `11/11` tests en verde.
- ✅ Documentación: actualizar `docs/USAGE.md` con ejecución no interactiva de la matriz y lectura de resultados.
  - ✅ Añadida sección `1.1) Non-interactive consumer matrix (1/2/3/4/9)` con comando, contrato de salida y semántica de `diagnosis`.
  - ✅ Añadido comando opcional de canary no interactivo (`runConsumerMenuCanary`) con cleanup garantizado.
- ✅ Cierre: commit atómico + push y actualización final de esta fase en `REFRACTOR_PROGRESS.md`.
- ✅ Operación GitHub: PR `#313` abierta y mergeada en `main` (`feat/phase-19-menu-matrix-automation`), con borrado de rama.
- ✅ Diagnóstico operativo: las notificaciones macOS del flujo legacy no están implementadas en el core actual (`bin/`, `scripts/`, `integrations` sin `osascript`/`terminal-notifier`), por lo que en este repo el comportamiento normal hoy es **sin notificaciones del sistema**.
- ✅ Próxima tarea anterior completada: abrir nuevo bloque de paridad legacy tras validación del usuario.

## Fase 20 — Paridad Legacy Enterprise (pendientes críticos)
- ✅ T1 (RED): definir tests de notificación macOS para eventos críticos (`BLOCK`, evidencia stale, violación git-flow) con fallback no-macOS.
  - ✅ Test añadido: `scripts/__tests__/framework-menu-system-notifications.test.ts`.
  - ✅ Evidencia RED: `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-system-notifications.test.ts` falla con `MODULE_NOT_FOUND` de `../framework-menu-system-notifications-lib`.
- ✅ T2 (GREEN): implementar motor de notificaciones del sistema (macOS) con toggle en configuración/menú interactivo.
  - ✅ Motor implementado: `scripts/framework-menu-system-notifications-lib.ts` (`buildSystemNotificationPayload`, `emitSystemNotification`, config persistida).
  - ✅ Toggle de menú implementado: acción `31` en advanced menu + prompt `askSystemNotificationsEnabled`.
  - ✅ Config persistida: `.pumuki/system-notifications.json` (runner `runSystemNotificationsConfig`).
  - ✅ Validación GREEN:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-system-notifications.test.ts scripts/__tests__/framework-menu-hard-mode-config.test.ts scripts/__tests__/framework-menu-srp-contract.test.ts` (15/15).
- ✅ T3 (REFACTOR): integrar enforcement estricto de cadena `pumuki -> mcp -> ai_gate -> ai_evidence` en flujo operativo sin intervención manual.
  - ✅ Nuevo helper MCP reusable: `integrations/mcp/aiGateCheck.ts` (`runEnterpriseAiGateCheck`).
  - ✅ `enterpriseServer` usa helper MCP para `ai_gate_check` (ruta única de evaluación).
  - ✅ `lifecycle cli` en `PRE_WRITE` ahora usa helper MCP y emite telemetría de cadena:
    - `telemetry.chain = pumuki->mcp->ai_gate->ai_evidence`
    - `telemetry.mcp_tool = ai_gate_check`
  - ✅ Validación TDD:
    - `npx --yes tsx@4.21.0 --test integrations/mcp/__tests__/aiGateCheck.test.ts integrations/lifecycle/__tests__/lifecycle.test.ts integrations/mcp/__tests__/enterpriseServer.test.ts` (28/28).
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-system-notifications.test.ts scripts/__tests__/framework-menu-hard-mode-config.test.ts scripts/__tests__/framework-menu-srp-contract.test.ts` (15/15).
- ✅ T4 (RED/GREEN/REFACTOR): restaurar paridad funcional de pre-flight legacy (repo-state, git-flow, stale-evidence, hints operativos) sobre arquitectura actual.
  - ✅ RED:
    - `scripts/__tests__/framework-menu-consumer-preflight.test.ts` (nuevo) exige hints operativos + notificaciones para `EVIDENCE_STALE` y `GITFLOW_PROTECTED_BRANCH`.
    - `scripts/__tests__/framework-menu-consumer-runtime.test.ts` exige ejecución de preflight por stage en opciones `1/2/3/4`.
    - Evidencia RED confirmada:
      - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-consumer-preflight.test.ts scripts/__tests__/framework-menu-consumer-runtime.test.ts`
      - Fallos esperados: `MODULE_NOT_FOUND` de preflight lib y stages vacíos en runtime.
  - ✅ GREEN:
    - Nuevo módulo `scripts/framework-menu-consumer-preflight-lib.ts`:
      - `runConsumerPreflight(...)` (repo-state + ai gate + hints + emisión de notificaciones).
      - `formatConsumerPreflight(...)` (panel legacy de preflight operativo).
    - Wiring en `scripts/framework-menu-consumer-runtime-lib.ts`:
      - preflight automático por stage antes de ejecutar opciones de auditoría (`1/2/3/4`).
      - soporte de inyección `runPreflight` para testabilidad y contratos estables.
    - Validación GREEN:
      - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-consumer-preflight.test.ts scripts/__tests__/framework-menu-consumer-runtime.test.ts` (5/5).
  - ✅ REFACTOR + regresión:
    - Validación extendida de menú legacy/consumer/notificaciones:
      - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-consumer-*.test.ts scripts/__tests__/framework-menu-gate-lib.test.ts scripts/__tests__/framework-menu-legacy-audit.test.ts scripts/__tests__/framework-menu-system-notifications.test.ts`
      - Resultado: `25/25` tests en verde.
- ✅ T5 (cierre): validar end-to-end en self-audit del propio repo, actualizar documentación oficial y preparar bloque de commits atómicos.
  - ✅ Validación end-to-end self-audit ejecutada (repo framework real):
    - `node --import tsx -e "const m = await import('./scripts/framework-menu-matrix-runner-lib.ts'); const report = await m.default.runConsumerMenuMatrix({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"`
    - Resultado matriz:
      - `1` -> `stage=PRE_COMMIT`, `outcome=BLOCK`, `filesScanned=932`, `totalViolations=4`
      - `2` -> `stage=PRE_PUSH`, `outcome=BLOCK`, `filesScanned=932`, `totalViolations=8`
      - `3` -> `stage=PRE_COMMIT`, `outcome=PASS`, `filesScanned=0`, `diagnosis=scope-empty`
      - `4` -> `stage=PRE_PUSH`, `outcome=PASS`, `filesScanned=18`, `diagnosis=repo-clean`
      - `9` -> `stage=PRE_PUSH`, `outcome=PASS`, `filesScanned=18`, `diagnosis=repo-clean`
    - Canary controlado:
      - `node --import tsx -e "const m = await import('./scripts/framework-menu-matrix-canary-lib.ts'); const report = await m.default.runConsumerMenuCanary({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"`
      - Resultado: `detected=true`, `ruleIds` contiene `skills.backend.no-empty-catch`.
  - ✅ Validación de regresión técnica (T3+T4+menú legacy) en verde:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-*.test.ts integrations/mcp/__tests__/aiGateCheck.test.ts integrations/lifecycle/__tests__/lifecycle.test.ts integrations/mcp/__tests__/enterpriseServer.test.ts`
    - Resultado: `95/95` tests passing.
  - ✅ Documentación oficial actualizada para el cierre:
    - `README.md` (pre-flight chain + opción 31 de notificaciones).
    - `docs/USAGE.md` (sección `1.2` de pre-flight consumer con mapeo por stage y hints operativos).
    - `docs/API_REFERENCE.md` (pre-flight consumer en quick refs).
  - ✅ Paquete de commits atómicos preparado:
    - ✅ Commit 1/3
      - `feat(mcp): enforce pre-write chain through enterprise ai_gate_check helper`
      - `integrations/mcp/aiGateCheck.ts`
      - `integrations/mcp/enterpriseServer.ts`
      - `integrations/mcp/__tests__/aiGateCheck.test.ts`
      - `integrations/lifecycle/cli.ts`
      - `integrations/lifecycle/__tests__/lifecycle.test.ts`
    - ✅ Commit 2/3
      - `feat(menu): restore legacy preflight parity and system notifications`
      - `scripts/framework-menu-consumer-preflight-lib.ts`
      - `scripts/framework-menu-consumer-runtime-lib.ts`
      - `scripts/framework-menu-system-notifications-lib.ts`
      - `scripts/framework-menu-runners-validation-notifications-lib.ts`
      - `scripts/framework-menu-runners-validation.ts`
      - `scripts/framework-menu-runners.ts`
      - `scripts/framework-menu-actions-diagnostics-maintenance-lib.ts`
      - `scripts/framework-menu-prompts.ts`
      - `scripts/framework-menu.ts`
      - `scripts/__tests__/framework-menu-consumer-preflight.test.ts`
      - `scripts/__tests__/framework-menu-consumer-runtime.test.ts`
      - `scripts/__tests__/framework-menu-system-notifications.test.ts`
      - `scripts/__tests__/framework-menu-hard-mode-config.test.ts`
    - ✅ Commit 3/3
      - `docs(framework): document consumer preflight and close phase 20`
      - `README.md`
      - `docs/USAGE.md`
      - `docs/API_REFERENCE.md`
      - `docs/REFRACTOR_PROGRESS.md`

## Fase 21 — Operación siguiente
- ✅ Ejecutar commits atómicos/push del bloque Fase 20.
  - ✅ Commits atómicos aplicados localmente:
    - `51c2afb` — `feat(mcp): enforce pre-write chain through enterprise ai_gate_check helper`
    - `3ecefc3` — `feat(menu): restore legacy preflight parity and system notifications`
    - `d530976` — `docs(framework): document consumer preflight and close phase 20`
  - ✅ Push ejecutado: `main -> origin/main` (`1cfce00..d530976`).
  - ✅ Nota operativa: en este ciclo no se abrió PR porque los commits ya estaban en rama `main` local; el cierre se realizó con sincronización directa a remoto.

## Fase 22 — Espera Operativa
- ✅ Ejecutar validación operativa post-push del menú consumer (matriz `1/2/3/4/9`).
  - ✅ Comando:
    - `node --import tsx -e "const m = await import('./scripts/framework-menu-matrix-runner-lib.ts'); const report = await m.default.runConsumerMenuMatrix({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"`
  - ✅ Resultado:
    - `1` -> `PRE_COMMIT`, `BLOCK`, `filesScanned=939`, `violations=4`
    - `2` -> `PRE_PUSH`, `BLOCK`, `filesScanned=939`, `violations=8`
    - `3` -> `PRE_COMMIT`, `PASS`, `filesScanned=0`, `diagnosis=scope-empty`
    - `4` -> `PRE_PUSH`, `PASS`, `filesScanned=0`, `diagnosis=scope-empty`
    - `9` -> `PRE_PUSH`, `PASS`, `filesScanned=0`, `diagnosis=scope-empty`

## Fase 23 — Espera Operativa
- ✅ Re-ejecutar validación operativa rápida post-sync del menú consumer (matriz `1/2/3/4/9`).
  - ✅ Comando:
    - `node --import tsx -e "const m = await import('./scripts/framework-menu-matrix-runner-lib.ts'); const report = await m.default.runConsumerMenuMatrix({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"`
  - ✅ Resultado:
    - `1` -> `PRE_COMMIT`, `BLOCK`, `filesScanned=939`, `violations=4`
    - `2` -> `PRE_PUSH`, `BLOCK`, `filesScanned=939`, `violations=8`
    - `3` -> `PRE_COMMIT`, `PASS`, `filesScanned=0`, `diagnosis=scope-empty`
    - `4` -> `PRE_PUSH`, `PASS`, `filesScanned=0`, `diagnosis=scope-empty`
    - `9` -> `PRE_PUSH`, `PASS`, `filesScanned=0`, `diagnosis=scope-empty`

## Fase 24 — Espera Operativa
- ✅ Ejecutar commit + push del tracker pendiente (`REFRACTOR_PROGRESS.md`) tras validación rápida.
  - ✅ Commit: `docs(progress): record post-push matrix validation` (`e158480`).
  - ✅ Push: `main -> origin/main` (`32a9a5d..e158480`).

## Fase 25 — Espera Operativa
- ✅ Plan histórico cerrado para evitar duplicidades de fases.
- ✅ Plan anterior archivado explícitamente en `docs/ENTERPRISE_AUDIT_CYCLE_CLOSED.md`.
- ✅ Nuevo plan activo documentado fuera de este tracker histórico en `docs/ENTERPRISE_AUDIT_CYCLE_ACTIVE.md`.
- ✅ Separación ejecutada: histórico y ciclo activo ya no comparten el mismo MD.

## Fase 26 — Arranque del Nuevo Plan de Auditoría
- ✅ Cerrar ciclo previo y dejar trazabilidad de cierre en documento dedicado.
- ✅ Crear nuevo MD de planificación independiente para el ciclo actual.
- ✅ Renombrar rama de trabajo para eliminar referencia confusa a fase numérica (`feature/fase-19-audit-stability` → `feature/enterprise-audit-cycle`).
- ✅ Cerrar `T1` del plan activo con inventario verificable de reglas por stage (`evaluated_rule_ids`, `matched_rule_ids`, `unmatched_rule_ids`).
- ✅ Cerrar `T2` del plan activo con persistencia de `files_affected` + `evaluation_metrics` en `.ai_evidence.json`, sin romper contrato v2.1.
- ✅ Cerrar `T3` del plan activo unificando clasificación multi-plataforma (`path` + `ruleId`) entre evidencia y menú legacy para eliminar drift.
- ✅ Cerrar `T4` del plan activo con ciclo `RED/GREEN/REFACTOR` en runner/canary de matriz (`happy/sad/edge`, canarios por `stage/plataforma`).
- ✅ Validación global de cierre ejecutada:
  - `npm test -- --runInBand` (suite completa en verde).
  - `npm run typecheck` (`tsc --noEmit` en verde).
- ✅ Commits atómicos de `T5` ya aplicados:
  - `56079b9` feat(audit): persist evaluation telemetry and rule-coverage diagnostics
  - `ddd09c9` feat(menu-matrix): add deterministic baseline and stage/platform canaries
  - `0baf617` fix(types): align ai-gate and rule evaluation contracts
- ✅ Cierre Git Flow de `T5` completado:
  - Push de rama `feature/enterprise-audit-cycle` a remoto.
  - PR `#314` abierta y mergeada contra `develop`.
  - Validación post-merge en `develop`:
    - `npm run typecheck` (verde).
    - matriz `framework-menu-matrix*` (`11/11` verde).
- ✅ Estado actual: el ciclo operativo activo está en `docs/ENTERPRISE_AUDIT_STABILIZATION_CYCLE.md`.

## Fase 27 — Release Flow (`develop` -> `main`)
- ✅ PR de release abierta desde `develop` hacia `main`.
  - URL: `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/315`
  - Título: `chore: merge develop into main (enterprise audit cycle)`
- ✅ Merge ejecutado de PR `#315` hacia `main`.
  - Estado PR: `MERGED` (`2026-02-21T23:40:40Z`).
  - Head/Base: `develop -> main`.
  - Validación post-merge:
    - `main` sincronizada con remoto (`git status -sb` limpio).
- ✅ Restauración y sincronización de rama `develop` tras borrado remoto por `--delete-branch`.
  - `develop` remoto recreada desde `main`.
  - `main` y `develop` quedan alineadas en el mismo SHA para retomar Git Flow.
- ✅ Contexto operativo restaurado en rama de trabajo `feature/enterprise-audit-cycle`.

## Estado de referencia (sin fases nuevas)
- ✅ `docs/REFRACTOR_PROGRESS.md` se mantiene como histórico.
- ✅ El seguimiento operativo del ciclo actual vive solo en `docs/ENTERPRISE_AUDIT_STABILIZATION_CYCLE.md`.
- ✅ Bloque `T8` cerrado en `docs/ENTERPRISE_AUDIT_STABILIZATION_CYCLE.md` (PR `#316` mergeada en `develop`).
- 🚧 Tarea activa actual: `T9` en `docs/ENTERPRISE_AUDIT_STABILIZATION_CYCLE.md`.
