# Registro Maestro de Seguimiento

## Objetivo
- Mantener trazabilidad ejecutiva en un solo punto.
- Referenciar un único plan activo con fases, tasks y leyenda.

## Estado actual
- Plan activo: `docs/tracking/plan-activo-de-trabajo.md`
- Estado del plan: EJECUCION
- Última task cerrada (`✅`): `PUMUKI-248` (la suite de notificaciones queda separada en `payloads`, `config`, `runner macOS` y un smoke mínimo de la fachada pública, manteniendo `21` tests verdes y `typecheck` en verde).
- Task activa (`🚧`): `PUMUKI-249` (separar el bloque de tests `framework-menu-consumer-runtime` y `framework-menu-consumer-preflight` por responsabilidad para que `scripts/**` quede completamente alineado con la arquitectura nueva).
- Pendiente priorizado (`⏳`): ninguno externo; los tres backlogs consumidores siguen en `0` abiertos.

## Historial resumido
- Bloque RuralGO cerrado: `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`.
- Se inicia bloque SAAS_SUPERMERCADOS con plan activo único y legible.

## Regla de operación
- Debe existir exactamente una task `🚧` en el plan activo.
- No se crean nuevos MDs de seguimiento salvo instrucción explícita.
- `docs/README.md` es la fuente de verdad para distinguir documentación oficial, seguimiento permitido y artefactos efímeros.
