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

- Frente activo: `post-release-6.3.64-consumer-autowire`
- Origen: `ast-intelligence-hooks`
- Contexto: **6.3.64** publicada en npm; `postinstall` cablea `pumuki install` en consumidores Git; notificaciones con fallback stderr fuera de macOS; MCP IDE sigue explícito.
- Estado global: **sin tareas PUMUKI-2xx abiertas en este espejo**; pendiente repin/validación en RuralGO y demás consumidores.

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Donde estamos (operativo)

- ✅ Ajustes de tests (PRE_WRITE en `skills.policy`, doctor/cli JSON, Jest `evaluateRules`) y `npm test` verde en rama `refactor/cli-complexity-reduction-phase4-rebase2`.
- ✅ Notificaciones macOS: dialog modal de anti-spam **desactivado por defecto**; activar con `PUMUKI_MACOS_BLOCKED_DIALOG=1` o `"blockedDialogEnabled": true` en `.pumuki/system-notifications.json`.
- ✅ Notificaciones fuera de macOS: fallback a **stderr** por defecto (`PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` para silenciar); en macOS `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` duplica el texto en terminal.
- ✅ Merge a `develop`: PR https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/731 (CI GitHub no disponible por cuota; validación local previa).
- ✅ Publicación **6.3.64** en npm; tag `v6.3.64`; alinear `develop` / `release/6.3.64` en `origin` tras merge.

## Siguiente frente sugerido

- ⏳ Repin consumidores a `6.3.64`; validar `npm install` → hooks; `pumuki status` / `doctor` / commit de prueba.
- ⏳ macOS (repo real): panel Swift con foco y botones persistiendo `muteUntil` / `enabled:false` en `.pumuki/system-notifications.json` del repo correcto.
