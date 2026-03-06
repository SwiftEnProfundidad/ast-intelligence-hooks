# Registro Maestro de Seguimiento

## Objetivo
- Mantener trazabilidad ejecutiva en un solo punto.
- Referenciar un único plan activo con fases, tasks y leyenda.

## Estado actual
- Plan activo: `docs/tracking/plan-activo-de-trabajo.md`
- Estado del plan: EJECUCION
- Última task cerrada (`✅`): `PUMUKI-253` (el bloque backlog consumers ya separa `watch-consumer-backlog` en `types + parse + gh + facade` y `reconcile-consumer-backlog-issues` en `types + parse + sync + facade`, con `34` tests focales en verde y `typecheck` en verde).
- Task activa (`🚧`): `PUMUKI-254` (cerrar el slice de backlog consumers limpiando helpers compartidos como `backlog-action-reasons`, `backlog-id-issue-map` y el contrato JSON para que el bloque quede redondo y revisable extremo a extremo).
- Pendiente priorizado (`⏳`): ninguno externo; los tres backlogs consumidores siguen en `0` abiertos.

## Historial resumido
- Bloque RuralGO cerrado: `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`.
- Se inicia bloque SAAS_SUPERMERCADOS con plan activo único y legible.

## Regla de operación
- Debe existir exactamente una task `🚧` en el plan activo.
- No se crean nuevos MDs de seguimiento salvo instrucción explícita.
- `docs/README.md` es la fuente de verdad para distinguir documentación oficial, seguimiento permitido y artefactos efímeros.
