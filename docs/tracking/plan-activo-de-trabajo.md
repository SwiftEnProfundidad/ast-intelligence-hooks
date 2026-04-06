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

- Frente activo: `release-6.3.68-pre-write-git-chain`
- Detalle operativo: ver **Prioridad ordenada** (abajo); una sola fila `🚧`.
- Origen: `ast-intelligence-hooks`
- Contexto: este archivo vive en el repo **Pumuki** pero el orden incluye **impacto en consumidores** (RuralGO, SAAS, Flux) cuando el ciclo de release lo exige; no es “solo un repo”, es el **espejo operativo** acordado en `AGENTS.md`.
- Línea **6.3.68**: PRE_WRITE encadenado en hooks Git + `.pumuki/adapter.json` por defecto; publicar y repin. **6.3.65+** para orden con pre-commit.com + `exec`.
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

## Veredicto técnico: `R_GO` `stash@{0}` (*wip antes de pull develop pumuki*)

Archivos en el stash (solo referencia, no se aplica solo):

| Archivo | Qué contiene | ¿Válido para recuperar? |
|---------|----------------|-------------------------|
| `package.json` | misma línea **`pumuki`** que **`develop` actual** (`^6.3.64`) | **No hace falta**: ya está cubierto en `origin/develop`. |
| `.ai_evidence.json` | recorte masivo a snapshot **casi vacío** (métricas en cero / PASS local) | **No como fuente de verdad**: sobrescribiría evidencia rica con un run mínimo; solo útil si quisieras inspeccionar diff a mano. |
| `docs/validation/refactor/last-run.json` | estado de última corrida local de validación | **Regenerable**; no es crítico conservarlo. |

**Acción recomendada** (después de leer esto): en `R_GO`, si no investigas el diff a propósito, **`git stash drop stash@{0}`** para cerrar el cabo suelto. No implica pérdida del repin (ya en `develop`).

## Prioridad ordenada (siguiente trabajo)

Regla: **una sola** tarea `🚧`; el resto `⏳` hasta promover la siguiente.

1. 🚧 **Housekeeping RuralGO**: ejecutar decisión sobre `stash@{0}` (recomendado: `drop` tras ver tabla arriba) o, si dudas, `git stash show -p stash@{0} | less` y decidir.
2. ⏳ **RuralGO (producto)**: planificar promoción **`develop` → `main`** como release (miles de commits de diferencia con `main`; criterio Vercel / previews aparte).
3. ⏳ **SAAS (operación)**: antes del próximo **push** con hooks estrictos, **recibo MCP** fresco en IDE (o política explícita para bumps de deps sin bloqueo).
4. ⏳ **Pumuki (repo `ast-intelligence-hooks`)**: panel **Swift** notificaciones (foco + persistencia `.pumuki/system-notifications.json`) cuando se priorice UX en el propio producto Pumuki.
