# Registro Maestro de Seguimiento

## Fuente activa

- Plan activo: `docs/tracking/fases-y-tareas.md`
- Estado del plan: RESET ESTRATEGICO ACTIVO / BACKLOG OPERATIVO VISIBLE
- Ultima task cerrada (`✅`): `P2.F1.T2` Extraer `Policy Packs`, aislar `Experimental`, estabilizar `watch`, alinear `menu/export` con la evidencia canonica y fijar la semantica `source-bin` frente al paquete instalado del consumer.
- Task activa (`🚧`): `P2.F1.T3` Sanear `UX / Reporting` del consumer empezando por `workflow lint`, `skills tooling` y `adapter diagnostics`, para que falle limpio sin stacktraces crudos, detecte capacidades reales del consumer y degrade de forma explicable cuando falten dependencias opcionales, scripts o artefactos del consumer; dentro del slice ya queda corregida la dependencia artificial de `/tmp/actionlint-bin/actionlint` y el siguiente foco es revalidar el fixture iOS con el nuevo default `actionlint`.
- Pendientes priorizados (`⏳`): completar la capa `UX / Reporting` limpia del consumer, cerrar la línea `workflow lint` con revalidación de fixture, consolidar la cuarentena de `Experimental`, mantener las notificaciones como capability opcional y revalidar el fixture iOS con el nuevo modelo de policy ya advisory por defecto.

## Reglas hard

- Este archivo es solo un espejo corto y subordinado.
- La unica fuente activa del tracking interno es `docs/tracking/fases-y-tareas.md`.
- Los MDs externos de `SAAS`, `RuralGo` y `Flux` mandan sobre cualquier prioridad interna.
- Si el tracking interno se desalineara con los MDs externos, este archivo y el plan activo deben corregirse en el mismo turno.

## Compatibilidad y archivo

- Puente legacy retirado: `docs/tracking/plan-activo-de-trabajo.md`
- Historicos conservados:
  - `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`
  - `docs/tracking/historico-contrato-aceptacion-c022.md`
