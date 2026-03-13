# Registro Maestro de Seguimiento

## Fuente activa

- Plan activo: `docs/tracking/fases-y-tareas.md`
- Estado del plan: RESET ESTRATEGICO ACTIVO / BACKLOG OPERATIVO VISIBLE
- Ultima task cerrada (`✅`): `P2.F1.T4` Cerrar la paridad final `source-bin` / paquete instalado y sanear los wrappers restantes del consumer (`menu avanzado`, `export`, ayudas de soporte y DX visible de hooks) para que consuman la misma verdad canónica del core, no reintroduzcan findings legacy y degraden limpio cuando el paquete instalado vaya por detrás del source o falten capacidades opcionales del consumer.
- Task activa (`🚧`): `P2.F2.T1` Revalidar y reducir la deuda viva de `Core / Policy / Experimental` que sigue abierta en `Fixture Repo 01`, priorizando `lifecycle CLI`, `bootstrap hygiene`, `doctor/policy fallback`, `CI/session bootstrap`, falsos positivos de heurísticas y fricciones de `evidence` para decidir qué se estabiliza en Core, qué se mueve a `Policy Packs` y qué se congela de forma definitiva en `Experimental`.
- Pendientes priorizados (`⏳`): cerrar la deuda estructural que aún sobrevive al reset del core (`PUM-001`, `PUM-003` a `PUM-016`) y dejar el fixture iOS con una foto donde el ruido restante ya sea claramente `Core / Policy / Experimental`, no `UX / Reporting`.

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
