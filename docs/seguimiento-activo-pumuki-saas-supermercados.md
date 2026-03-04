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
- 🚧 Actualizar `CHANGELOG.md` y `docs/RELEASE_NOTES.md` con fixes reales.
- ⏳ Publicar versión cuando las tareas en construcción/pending críticas estén cerradas.
