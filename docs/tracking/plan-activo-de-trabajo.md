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

- Frente activo: **`idle`** (ciclo **6.3.64** publicación + repin + doctor consumidores **cerrado**; `npm view pumuki version` → **6.3.64** @latest 2026-04-05).
- Origen: `ast-intelligence-hooks`
- Contexto: línea **6.3.64** estable en npm y consumidores alineados en ramas de trabajo acordadas; siguiente trabajo es **producto** (R_GO release, SAAS MCP al commitear, panel macOS), no backlog PUMUKI-2xx.
- Estado global: **sin tareas PUMUKI-2xx abiertas en este espejo**; repin **6.3.64** en **SAAS** `main`, **Flux_training** `main`, **R_GO** `develop` (PR https://github.com/SwiftEnProfundidad/R_GO/pull/1514 → `b899ee6a1`). **R_GO `main`** sigue muy por detrás de `develop` (orden ~10³ commits); no es un fast-forward de producto: la promoción a `main` es release aparte.

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Donde estamos (operativo)

- ✅ Ajustes de tests (PRE_WRITE en `skills.policy`, doctor/cli JSON, Jest `evaluateRules`) y `npm test` verde en rama `refactor/cli-complexity-reduction-phase4-rebase2`.
- ✅ Notificaciones macOS: dialog modal de anti-spam **desactivado por defecto**; activar con `PUMUKI_MACOS_BLOCKED_DIALOG=1` o `"blockedDialogEnabled": true` en `.pumuki/system-notifications.json`.
- ✅ Notificaciones fuera de macOS: fallback a **stderr** por defecto (`PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` para silenciar); en macOS `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` duplica el texto en terminal.
- ✅ Merge a `develop`: PR https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/732 (`merge` 2026-04-05, commit `413d5308db54dcdd483a5d4a5a5342cc32b51969`). Checks GitHub en rojo por cuota/entorno; merge ejecutado con evidencia local previa (`npm test` / typecheck en rama de release).
- ✅ Publicación **6.3.64** en npm; tag `v6.3.64` en origin.
- ✅ Rama remota **`release/6.3.64`** creada en `origin` (apunta al `develop` actual post-merge).
- ✅ **R_GO `develop` local** alineado con `origin/develop`; `pumuki doctor --json` → **6.3.64** sin drift (evidencia 2026-04-05).
- ✅ **SAAS** `main` al día; `pumuki doctor --json` → **6.3.64** sin drift de versión; `pathExecutionHazard=true` por `:` en la ruta del repo — workaround: `node ./node_modules/pumuki/bin/pumuki.js` (comportamiento ya documentado en Pumuki 6.3.5x+).
- ✅ **Flux_training** `main` al día; tras repin había **drift** `lifecycleInstalled` 6.3.57; resuelto con `pnpm exec pumuki install` → **6.3.64** sin drift (2026-04-05).

## Siguiente frente sugerido (fuera del ciclo Pumuki 6.3.64)

- ⏳ **R_GO**: `git stash list` — revisar `stash@{0}` (*wip antes de pull develop pumuki*); si `develop` ya cubre el repin, **`git stash drop stash@{0}`** o recuperar solo si aún aplica.
- ⏳ **RuralGO**: promoción `develop` → `main` como **release de producto** (Vercel en #1514 en rojo — criterio aparte).
- ⏳ **SAAS**: recibo MCP al abrir sesión IDE antes del próximo **push** con gate estricto (o bump de deps con política acordada).
- ⏳ **macOS**: panel Swift notificaciones (foco + persistencia `.pumuki/system-notifications.json`) cuando se priorice UX.
