# Pumuki Refactor Progress (v2.x)

## Legend

- ✅ Hecho
- 🚧 En construcción
- ⏳ Pendiente

## Phase 1 - Deterministic Core + Evidence v2.1

- ✅ Arquitectura determinista activa: `Facts -> Rules -> Gate -> ai_evidence v2.1`.
- ✅ Schema `ai_evidence` v2.1 (`snapshot + ledger`) implementado como source of truth.
- ✅ Serialización de evidencia estable (orden determinista).
- ✅ Preservación de intent humano y expiración soportadas.

## Phase 2 - Stage Policies + Shared Runners

- ✅ Policies por stage consolidadas (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- ✅ Flujo compartido de ejecución centralizado en `integrations/git/runPlatformGate.ts`.
- ✅ Runners unificados en `integrations/git/stageRunners.ts`.
- ✅ Salida de gate normalizada a `0/1`.

## Phase 3 - Multi-platform Gate (iOS, Backend, Frontend, Android)

- ✅ `PRE_COMMIT` implementado para iOS, backend, frontend y android.
- ✅ `PRE_PUSH` implementado para iOS, backend, frontend y android.
- ✅ `CI` implementado para iOS, backend, frontend y android.
- ✅ Detección combinada de plataformas activa (`integrations/platform/detectPlatforms.ts`).

## Phase 4 - Rule Packs + Skills Enforcement

- ✅ Rule packs baseline disponibles (ios, backend, frontend, android, heuristics).
- ✅ Versionado de rule packs definido (`core/rules/presets/rulePackVersions.ts`).
- ✅ Skills lock/policy compiler + validadores integrados en gate.
- ✅ Promoción de severidad por stage para heurísticas críticas implementada.

## Phase 5 - CI/Packaging Reliability

- ✅ Workflows CI ejecutan gate stages y publican artefactos de evidencia.
- ✅ Guardrail de manifiesto de paquete activo.
- ✅ Smoke de paquete (`block` + `minimal`) en verde.
- ✅ Comando stage-gates simplificado y determinista.

## Phase 6 - CLI / Operational UX

- ✅ Menú interactivo del framework implementado (`scripts/framework-menu.ts` + módulos).
- ✅ Orquestación one-shot de cierre Phase 5 disponible (`validation:phase5-execution-closure`).
- ✅ Scripts operativos de triage/soporte/unblock implementados.
- ✅ Reporte A/B para mock consumer implementado.

## Phase 7 - Documentation Governance

- ✅ Guardrail de cobertura de índice de docs activo.
- ✅ Guardrail de neutralidad proveedor/IDE activo.
- ✅ Guardrail English-only activo.
- ✅ Guardrail de integridad de referencias markdown activo.
- ✅ Guardrail baseline para markdown root activo.
- ✅ `CHANGELOG.md` normalizado al baseline enterprise v2.

## Phase 8 - External Validation / Rollout Closure

- 🚧 Desbloqueo de startup-failure en consumer privado pendiente de rerun con diagnóstico fresco.
- 🚧 Handoff externo de Phase 5 pendiente de artefactos y URLs finales.
- 🚧 Validación real de hooks pre/post tool en sesión externa pendiente (`node: command not found`).

## Phase 9 - Advanced AST Heuristics

- ✅ Heurísticas AST tipadas iniciales activas.
- 🚧 Expansión de heurísticas semánticas de alto valor en curso.
- ⏳ Extensión incremental adicional tras cierre de rollout externo.

## Phase 10 - MCP / Context API Expansion

- ✅ Servidor MCP read-only para evidencia implementado.
- 🚧 Superficie API de contexto ampliada parcialmente (`summary`, `rulesets`, `platforms`) y en evolución.
- ⏳ Patrones formales de consumo cross-agent pendientes.

## Current Focus

- 🚧 Cerrar bloqueadores externos de rollout (consumer privado + handoff).
- 🚧 Completar validación real de runtime de hooks pre/post tool.
- 🚧 Mantener guardrails de docs/quality en verde mientras se cierran bloqueadores.
