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
- 🚧 Validar alcance de “TODAS las reglas/skills” para plataformas sin código nativo en este repo (iOS/Android/Frontend).
