# PUMUKI + OpenSpec SDD Roadmap

## Leyenda
- ✅ Completada
- 🚧 En construcción
- ⏳ Pendiente

## Fase 1 — Núcleo SDD
- ✅ Implementar módulo `integrations/sdd/` (cliente OpenSpec + policy + sesión SDD).
- ✅ Añadir comandos `pumuki sdd status|session|validate`.
- ✅ Definir contrato de salida JSON para decisiones SDD.
- ✅ Añadir persistencia de sesión SDD por repositorio.

## Fase 2 — Enforcement en Gates
- ✅ Integrar SDD gate en `PRE_COMMIT`.
- ✅ Integrar SDD gate en `PRE_PUSH`.
- ✅ Integrar SDD gate en `CI`.
- ✅ Integrar enforcement ligero en `pre-write`.
- ✅ Añadir bypass de emergencia auditado (`PUMUKI_SDD_BYPASS=1`).

## Fase 3 — Lifecycle y Auto-Bootstrap OpenSpec
- ✅ Extender `pumuki install` para auto-bootstrap OpenSpec.
- ✅ Extender `pumuki update` para compat/migración OpenSpec.
- ✅ Extender `pumuki uninstall/remove` para limpieza segura de artefactos gestionados.
- ✅ Añadir matriz de compatibilidad de versión mínima OpenSpec.

## Fase 4 — MCP Enterprise (Legacy válido + guardrails)
- ✅ Crear `pumuki-mcp-enterprise`.
- ✅ Exponer recursos `evidence://status`, `gitflow://state`, `context://active`, `sdd://status`, `sdd://active-change`.
- ✅ Exponer tools legacy-style con seguridad (`ai_gate_check`, `check_sdd_status`, `validate_and_fix`, `sync_branches`, `cleanup_stale_branches`).
- ✅ Enforzar gate/session para tools críticas.
- ✅ Aplicar `dry-run` por defecto en operaciones sensibles.

## Fase 5 — Evidencia, Telemetría y Contratos
- ✅ Añadir `sdd_metrics` en `.ai_evidence.json`.
- ✅ Añadir findings `source: "sdd-policy"` en bloqueos SDD.
- ✅ Garantizar orden determinista de payload/evidencia.
- ✅ Añadir tests de contrato de esquema SDD + evidencia.

## Fase 6 — QA Técnica en Pumuki
- ✅ Añadir tests unitarios `integrations/sdd/*`.
- ✅ Añadir tests unitarios/integración `integrations/mcp-enterprise/*`.
- ✅ Reforzar tests lifecycle (install/update/remove) con OpenSpec bootstrap.
- ✅ Revalidar `test:deterministic` + nuevas suites.

## Fase 7 — Documentación y Release
- ✅ Actualizar `README.md` para SDD obligatorio con OpenSpec.
- ✅ Actualizar `docs/USAGE.md` (flujo diario y comandos SDD).
- ✅ Actualizar `docs/INSTALLATION.md` (bootstrap + compat).
- ✅ Actualizar `docs/MCP_SERVERS.md` (MCP enterprise).
- ✅ Actualizar `CHANGELOG.md` y preparar release.

## Fase 8 — Cierre Operativo
- ✅ Ejecutar checklist final de aceptación enterprise.
- ✅ Cerrar fase con evidencia de no regresión.

### Resultado de cierre Fase 8
- Checklist final consolidado en `docs/PUMUKI_FULL_VALIDATION_CHECKLIST.md` con tareas en `✅`.
- Evidencia de no regresión:
  - suites de validación en verde en el bloque final (`npm test -- ...buildEvidence/evidencePayloadStatus/evidencePayloads/evidenceContextServer*`).
  - matriz mock y contratos stage/evidence/MCP estabilizados en los ciclos operativos cerrados.
