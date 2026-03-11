# Registro Maestro de Seguimiento

## Objetivo
- Mantener trazabilidad ejecutiva en un solo punto.
- Referenciar un único plan activo con fases, tasks y leyenda.

## Estado actual
- Plan activo: `docs/tracking/plan-activo-de-trabajo.md`
- Estado del plan: PAUSA OPERATIVA
- Última task cerrada (`✅`): `Release útil + rollout consumers a pumuki@6.3.57` (SAAS, RuralGo y Flux actualizados; `status --json` alineado en `effective/runtime/consumerInstalled/lifecycleInstalled=6.3.57`).
- Task activa (`🚧`): `Pausa operativa` (sin bugs externos abiertos; esperar orden explícita del usuario antes de abrir un frente nuevo).
- Pendientes priorizados (`⏳`):
  - Ninguno. Los MDs externos de `SAAS`, `RuralGo` y `Flux` están cerrados.
- Progreso crítico actual:
  - Los tres MDs externos quedaron cerrados y alineados con leyenda de backlog externo resuelto.
  - `pumuki@6.3.57` ya está publicado en npm y verificado en `SAAS`, `RuralGo` y `Flux`.
  - Los tres consumers quedaron alineados en runtime, lifecycle y manifest sin drift.

## Regla hard anti-bucle
- El MD interno que nos metio en el bucle fue `docs/tracking/plan-activo-de-trabajo.md` cuando se uso como backlog principal.
- Este `estado-ejecutivo.md` reforzo ese mismo bucle al resumir y legitimar prioridades internas que no eran el trabajo principal.
- Desde este punto:
  - `docs/tracking/plan-activo-de-trabajo.md` y este `estado-ejecutivo.md` solo pueden reflejar la prioridad de los bugs externos;
  - no pueden volver a introducir prioridades internas `PUMUKI-2xx` mientras `SAAS`, `RuralGo` o `Flux` tengan bugs abiertos;
  - si se desalinean con los MDs externos, manda el backlog externo.
- Regla dura adicional:
  - si aqui aparece una `🚧` distinta de un bug externo real o de la pausa operativa cuando no haya bugs externos abiertos,
  - este documento se considera incorrecto y debe corregirse antes de continuar con cualquier cambio funcional.

## Historial resumido
- Bloque RuralGO cerrado: `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`.
- Se inicia bloque SAAS_SUPERMERCADOS con plan activo único y legible.

## Regla de operación
- Debe existir exactamente una task `🚧` en el plan activo.
- No se crean nuevos MDs de seguimiento salvo instrucción explícita.
- `docs/README.md` es la fuente de verdad para distinguir documentación oficial, seguimiento permitido y artefactos efímeros.
- Mientras cualquiera de los MDs externos (`SAAS`, `RuralGo`, `Flux`) tenga bugs abiertos, el plan interno queda subordinado a esos bugs y se congelan todas las tasks internas no alineadas con su cierre.
