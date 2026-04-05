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

- Frente activo: `post-parity-ios-suite-y-ux-macos` (paridad iOS AST **cerrada** en línea publicada; rama local con suite + macOS al día).
- Origen: `ast-intelligence-hooks`
- Objetivo reciente en rama `refactor/cli-complexity-reduction-phase4-rebase2`: suite `npm test` verde; commits **atómicos**; notificaciones macOS sin spam en tests; dialog de bloqueo opt-in.
- Estado global: **sin tareas PUMUKI-2xx abiertas en este espejo**; rama **pushed** y **PR abierta** hacia `develop` (ver enlace abajo).

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Donde estamos (operativo)

- ✅ Ajustes de tests (PRE_WRITE en `skills.policy`, doctor/cli JSON, Jest `evaluateRules`) y `npm test` verde en rama `refactor/cli-complexity-reduction-phase4-rebase2`.
- ✅ Notificaciones macOS: dialog modal de anti-spam **desactivado por defecto**; activar con `PUMUKI_MACOS_BLOCKED_DIALOG=1` o `"blockedDialogEnabled": true` en `.pumuki/system-notifications.json`.
- ✅ Historial local en cadena atómica: `fix(macos)` + `docs(tracking)` + tests gate/git/lifecycle/scripts + guardrails + smoke 6.3.61 + `brownfieldHotspots`.
- ✅ Push a `origin/refactor/cli-complexity-reduction-phase4-rebase2` y PR a `develop`: https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/731

## Siguiente frente sugerido

- ⏳ Tras publicar/consumir version con los cambios: validar en macOS que el panel Swift recibe foco y los botones escriben `muteUntil` / `enabled:false` en el repo correcto (no en carpetas temporales de tests).
