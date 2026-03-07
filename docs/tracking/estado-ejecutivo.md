# Registro Maestro de Seguimiento

## Objetivo
- Mantener trazabilidad ejecutiva en un solo punto.
- Referenciar un único plan activo con fases, tasks y leyenda.

## Estado actual
- Plan activo: `docs/tracking/plan-activo-de-trabajo.md`
- Estado del plan: EJECUCION
- Última task cerrada (`✅`): `PUMUKI-281` (la fachada `framework-menu-system-notifications-macos-dialog-mode.ts` ya separa resolución del modo, dispatch Swift y fallback AppleScript, con `22` tests focales en verde y `typecheck` en verde).
- Task activa (`🚧`): `PUMUKI-282` (atacar `framework-menu-system-notifications-macos.ts`, separando orquestación de banner, dispatch del diálogo bloqueante y resultado final de entrega para rematar la fachada macOS con el repo limpio).
- Pendiente priorizado (`⏳`): ninguno externo; los tres backlogs consumidores siguen en `0` abiertos.

## Historial resumido
- Bloque RuralGO cerrado: `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`.
- Se inicia bloque SAAS_SUPERMERCADOS con plan activo único y legible.

## Regla de operación
- Debe existir exactamente una task `🚧` en el plan activo.
- No se crean nuevos MDs de seguimiento salvo instrucción explícita.
- `docs/README.md` es la fuente de verdad para distinguir documentación oficial, seguimiento permitido y artefactos efímeros.
