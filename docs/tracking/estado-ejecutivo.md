# Registro Maestro de Seguimiento

## Objetivo
- Mantener trazabilidad ejecutiva en un solo punto.
- Referenciar un único plan activo con fases, tasks y leyenda.

## Estado actual
- Plan activo: `docs/tracking/plan-activo-de-trabajo.md`
- Estado del plan: EJECUCION
- Última task cerrada (`✅`): `PUMUKI-263` (el bloque `framework-menu-system-notifications-macos` ya separa runner Swift, fallback AppleScript y ejecución de comandos, con `14` tests focales en verde y `typecheck` en verde).
- Task activa (`🚧`): `PUMUKI-264` (atacar `framework-menu-system-notifications-config.ts` separando persistencia, estado de mute y aplicación de decisiones para cerrar el bloque de notificaciones extremo a extremo).
- Pendiente priorizado (`⏳`): ninguno externo; los tres backlogs consumidores siguen en `0` abiertos.

## Historial resumido
- Bloque RuralGO cerrado: `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`.
- Se inicia bloque SAAS_SUPERMERCADOS con plan activo único y legible.

## Regla de operación
- Debe existir exactamente una task `🚧` en el plan activo.
- No se crean nuevos MDs de seguimiento salvo instrucción explícita.
- `docs/README.md` es la fuente de verdad para distinguir documentación oficial, seguimiento permitido y artefactos efímeros.
