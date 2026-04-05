# Seguimiento Activo Pumuki

## Leyenda

- ✅ Cerrado
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Regla de uso

- Este es el unico MD interno de seguimiento permitido.
- Es un espejo operativo subordinado a los backlogs externos de `SAAS`, `RuralGo` y `Flux`.
- Solo puede existir una tarea `🚧`.
- Si los MDs externos mandan otra prioridad, este archivo se actualiza en el mismo turno.

## Estado actual

- Frente activo: `post-release-6.3.62-rollout`
- Origen: `ast-intelligence-hooks`
- Contexto: paridad iOS AST **cerrada** en contrato; merge **#731** en `develop`; release **6.3.62** publicada en npm; CI GitHub **no** usada por cuota.
- Estado global: **sin tareas PUMUKI-2xx abiertas en este espejo**; pendiente repin de consumidores y QA macOS en repo real.

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Donde estamos (operativo)

- ✅ Ajustes de tests (PRE_WRITE en `skills.policy`, doctor/cli JSON, Jest `evaluateRules`) y `npm test` verde en rama `refactor/cli-complexity-reduction-phase4-rebase2`.
- ✅ Notificaciones macOS: dialog modal de anti-spam **desactivado por defecto**; activar con `PUMUKI_MACOS_BLOCKED_DIALOG=1` o `"blockedDialogEnabled": true` en `.pumuki/system-notifications.json`.
- ✅ Merge a `develop`: PR https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/731 (CI GitHub no disponible por cuota; validación local previa).
- ✅ Release **6.3.62** publicada en npm; tag `v6.3.62`; consumidores: repin y revalidar `status` / `doctor` / hooks.

## Siguiente frente sugerido

- ⏳ Repinear repos consumidores a `6.3.62` y validar `status` / `doctor` / hooks.
- ⏳ macOS (repo real): panel Swift con foco y botones persistiendo `muteUntil` / `enabled:false` en `.pumuki/system-notifications.json` del repo correcto.
