# Registro Maestro de Seguimiento

## Objetivo
- Mantener trazabilidad ejecutiva en un solo punto.
- Referenciar un único plan activo con fases, tasks y leyenda.

## Estado actual
- Plan activo: `docs/tracking/plan-activo-de-trabajo.md`
- Estado del plan: EJECUCION
- Última task cerrada (`✅`): `PUMUKI-282` (la fachada `framework-menu-system-notifications-macos.ts` ya separa orquestación de banner, dispatch del diálogo bloqueante y resultado final de entrega, con `11` tests focales en verde y `typecheck` en verde).
- Task activa (`🚧`): `PUMUKI-283` (retomar el problema principal de Pumuki: cerrar `PUMUKI-019` en `SAAS`, forzando detección real de plataformas/skills requeridas y bloqueo semántico en consumers).
- Pendiente priorizado (`⏳`): `SAAS · PUMUKI-019` (bug crítico de enforcement real de skills/reglas en consumer).
- Progreso crítico actual:
  - el paquete del hub `42_PAQUETE_ACTUAL_PARA_PUMUKI.md` ya tiene respuesta formal de Pumuki;
  - ya hay avance real en:
    - `skills reconciliation`
    - `required/effective lock`
    - endurecimiento de `evaluateAiGate` para skills requeridas sin plataformas activas;
  - `IOS-CANARY-001` sigue en `STOP` hasta que exista un finding semántico bloqueante, repetible y con shape completo.

## Historial resumido
- Bloque RuralGO cerrado: `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`.
- Se inicia bloque SAAS_SUPERMERCADOS con plan activo único y legible.

## Regla de operación
- Debe existir exactamente una task `🚧` en el plan activo.
- No se crean nuevos MDs de seguimiento salvo instrucción explícita.
- `docs/README.md` es la fuente de verdad para distinguir documentación oficial, seguimiento permitido y artefactos efímeros.
