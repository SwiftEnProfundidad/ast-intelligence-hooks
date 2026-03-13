# Registro Maestro de Seguimiento

## Fuente activa

- Plan activo: `docs/tracking/fases-y-tareas.md`
- Estado del plan: RESET ESTRATEGICO ACTIVO / BACKLOG OPERATIVO VISIBLE
- Ultima task cerrada (`✅`): `P2.F1.T3` Sanear `UX / Reporting` del consumer empezando por `workflow lint`, `skills tooling` y `adapter diagnostics`, para que falle limpio sin stacktraces crudos, detecte capacidades reales del consumer y degrade de forma explicable cuando falten dependencias opcionales, scripts o artefactos del consumer.
- Task activa (`🚧`): `P2.F1.T4` Cerrar la paridad final `source-bin` / paquete instalado y sanear los wrappers restantes del consumer (`menu avanzado`, `export` y ayudas de soporte) para que consuman la misma verdad canónica del core, no reintroduzcan findings legacy y degraden limpio cuando el paquete instalado vaya por detrás del source o falten capacidades opcionales del consumer. El `support ticket draft` ya pasó a ser evidence-driven y dejó de inventar narrativa fija sobre `startup_failure` y repos privados.
- Pendientes priorizados (`⏳`): completar la paridad `source/package` en superficies consumer-facing, consolidar la capa `UX / Reporting` alineada con el core, mantener las notificaciones como capability opcional y revalidar el fixture iOS con el nuevo modelo de policy ya advisory por defecto.

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
