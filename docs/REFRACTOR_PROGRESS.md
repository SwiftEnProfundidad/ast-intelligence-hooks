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
- 🚧 Esperar nuevas instrucciones de producto/arquitectura para el siguiente ciclo.
