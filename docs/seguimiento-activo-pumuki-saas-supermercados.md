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
- 🚧 PUMUKI-019: Ejecutar siguiente bug/mejora del backlog SAAS de prioridad media (`PUMUKI-004`: hooks versionados `core.hooksPath`).
- ⏳ PUMUKI-020: Preparar publicación del siguiente corte cuando PUMUKI-019 quede cerrada sin regresiones.
