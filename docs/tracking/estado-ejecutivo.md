# Registro Maestro de Seguimiento

## Objetivo
- Mantener trazabilidad ejecutiva en un solo punto.
- Referenciar un único plan activo con fases, tasks y leyenda.

## Estado actual
- Plan activo: `docs/tracking/plan-activo-de-trabajo.md`
- Estado del plan: EJECUCION
- Última task cerrada (`✅`): `PUMUKI-254` (el slice final del backlog consumers ya separa `backlog-action-reasons` en contrato tipado + builders/formatter, `backlog-id-issue-map` en contrato + parseo + fachada, y mantiene `backlog-json-contract` como contrato mínimo canónico, con `9` tests focales en verde y `typecheck` en verde).
- Task activa (`🚧`): `PUMUKI-255` (atacar `legacy-parity-report-lib` separando normalización de payload, comparativa por severidad/regla y render markdown para seguir cerrando `scripts/**` con cortes pequeños y revisables).
- Pendiente priorizado (`⏳`): ninguno externo; los tres backlogs consumidores siguen en `0` abiertos.

## Historial resumido
- Bloque RuralGO cerrado: `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`.
- Se inicia bloque SAAS_SUPERMERCADOS con plan activo único y legible.

## Regla de operación
- Debe existir exactamente una task `🚧` en el plan activo.
- No se crean nuevos MDs de seguimiento salvo instrucción explícita.
- `docs/README.md` es la fuente de verdad para distinguir documentación oficial, seguimiento permitido y artefactos efímeros.
