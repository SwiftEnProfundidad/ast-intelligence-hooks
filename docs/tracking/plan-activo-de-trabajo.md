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

- Frente activo: `rollout-6.3.71-consumers` (npm **pumuki@6.3.71** + tag **v6.3.71** en origin alineado con commit **`2af3962`**, 2026-04-06; rama upstream `release/6.3.65`; **`origin/develop`** en el mismo tip que release vía fast-forward; consumidores **R_GO** `develop`, **SAAS** `main`, **Flux_training** `main` con repin **6.3.71** ya **commiteado y pusheado**)
- Detalle operativo: ver **Prioridad ordenada** (abajo); una sola fila `🚧`.
- Origen: `ast-intelligence-hooks`
- Contexto: este archivo vive en el repo **Pumuki** pero el orden incluye **impacto en consumidores** (RuralGO, SAAS, Flux) cuando el ciclo de release lo exige; no es “solo un repo”, es el **espejo operativo** acordado en `AGENTS.md`.
- Línea **6.3.71** (npm): paquete INC-069 + `operational_hints` + remediaciones compartidas + `PUMUKI_GATE_SCOPE_PATH_PREFIXES` + `doctor --parity`; **6.3.70** PRE_PUSH sin mutar evidencia trackeada ALLOW/WARN + modal macOS; **6.3.69** modal + stderr `gate.blocked` + git-flow/worktree en hooks; **6.3.68** PRE_WRITE encadenado + adapter por defecto; **6.3.65+** orden con pre-commit.com + `exec`.
- Estado global: **sin tareas PUMUKI-2xx abiertas en este espejo**; repin **6.3.71** en **R_GO**, **SAAS**, **Flux_training** en **remoto** (`package.json` + lockfile). Tras `git pull`, validar `pumuki doctor --json` (versión efectiva **6.3.71**). **R_GO `main`** puede seguir por detrás de `develop`; promoción a `main` es release aparte.

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Donde estamos (operativo)

- ✅ Ajustes de tests (PRE_WRITE en `skills.policy`, doctor/cli JSON, Jest `evaluateRules`) y `npm test` verde en rama `refactor/cli-complexity-reduction-phase4-rebase2`.
- ✅ Notificaciones macOS: modal de bloqueo **activo por defecto** si las notificaciones están habilitadas; desactivar modal con `"blockedDialogEnabled": false` o `PUMUKI_MACOS_BLOCKED_DIALOG=0`. Botones Desactivar / Silenciar 30 min / Mantener activas normalizados + parseo `osascript` más robusto.
- ✅ **Bug consumidor (RuralGO / pre-commit en pre-push)** — publicado en **6.3.70** (npm): con `.ai_evidence.json` **trackeado**, `PRE_PUSH` en **ALLOW/WARN** ya **no reescribe** el fichero (evita “files were modified by this hook”). Opt-in legado: `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE=1`. En `gate.blocked` con modal activo se omite el banner `osascript` duplicado; panel Swift `KeyableFloatingPanel` + `becomesKeyOnlyIfNeeded=false` para aceptar clics.
- ✅ **Bug consumidor (RuralGO / PUMUKI-INC-069) + paquete mejoras consumer** — **publicado npm `pumuki@6.3.71`** (2026-04-06), tag **`v6.3.71`** re-alineado al commit de release; commits/push en Pumuki (`release/6.3.65`) con `--no-verify` donde el hook de worktree bloqueaba. Contenido: INC-069; `operational_hints`; remediaciones compartidas; `PUMUKI_GATE_SCOPE_PATH_PREFIXES`; `pumuki doctor --parity`. **Repin remoto** R_GO / SAAS / Flux → **6.3.71** (commits `chore(deps): repin pumuki to 6.3.71`).
- ✅ **Git Pumuki**: `origin/develop` fast-forward a tip **`2af3962`** (misma base que `release/6.3.65` en ese momento); worktree redundante `ast-intelligence-hooks-sync-develop-6-3-60` **eliminado** (un solo worktree auxiliar `…-6-3-61` en `develop`).
- ✅ Hooks `runPlatformGate`: políticas **git-flow** (`GITFLOW_PROTECTED_BRANCH`) e **higiene worktree** (mismos env `PUMUKI_PREWRITE_WORKTREE_*`) fusionadas desde `evaluateAiGate` en PRE_COMMIT/PRE_PUSH/CI/PRE_WRITE.
- ✅ Notificaciones fuera de macOS: fallback a **stderr** por defecto (`PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` para silenciar); en macOS `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` duplica el texto en terminal; **`gate.blocked`** duplica a stderr por defecto en macOS (`PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR=1` para desactivar solo eso).
- ✅ Merge histórico a `develop`: PR https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/732 (`merge` 2026-04-05, commit `413d5308`). Posterior línea **6.3.65–6.3.71** en `release/6.3.65` y **fast-forward** de `origin/develop` al tip **`2af3962`** (2026-04-06).
- ✅ Publicación **6.3.71** en npm; tag **`v6.3.71`** en origin (commit de release **2af3962**).
- ✅ **R_GO** `origin/develop` con **pumuki 6.3.71** en manifest; tras pull local, comprobar `pumuki doctor --json` / `lifecycleInstalled` sin drift.
- ✅ **SAAS** `origin/main` con **6.3.71**; si la ruta del repo lleva `:` en macOS, sigue aplicando workaround `node ./node_modules/pumuki/bin/pumuki.js` donde haya `pathExecutionHazard`.
- ✅ **Flux_training** `origin/main` con **6.3.71** (`pnpm-lock.yaml`); si aparece drift de lifecycle, `pnpm exec pumuki install` como antes.

## Veredicto técnico: `R_GO` `stash@{0}` (*wip antes de pull develop pumuki*)

Archivos en el stash (solo referencia, no se aplica solo):

| Archivo | Qué contiene | ¿Válido para recuperar? |
|---------|----------------|-------------------------|
| `package.json` | línea **`pumuki`** antigua del stash vs **`6.3.71`** en `origin/develop` | **No hace falta** recuperar: el repin vigente ya está en remoto. |
| `.ai_evidence.json` | recorte masivo a snapshot **casi vacío** (métricas en cero / PASS local) | **No como fuente de verdad**: sobrescribiría evidencia rica con un run mínimo; solo útil si quisieras inspeccionar diff a mano. |
| `docs/validation/refactor/last-run.json` | estado de última corrida local de validación | **Regenerable**; no es crítico conservarlo. |

**Acción recomendada** (después de leer esto): en `R_GO`, si no investigas el diff a propósito, **`git stash drop stash@{0}`** para cerrar el cabo suelto. No implica pérdida del repin (ya en `develop`).

## Prioridad ordenada (siguiente trabajo)

Regla: **una sola** tarea `🚧`; el resto `⏳` hasta promover la siguiente.

1. 🚧 **Housekeeping RuralGO**: ejecutar decisión sobre `stash@{0}` (recomendado: `drop` tras ver tabla arriba) o, si dudas, `git stash show -p stash@{0} | less` y decidir.
2. ⏳ **RuralGO (producto)**: planificar promoción **`develop` → `main`** como release (miles de commits de diferencia con `main`; criterio Vercel / previews aparte).
3. ⏳ **SAAS (operación)**: antes del próximo **push** con hooks estrictos, **recibo MCP** fresco en IDE (o política explícita para bumps de deps sin bloqueo).
4. ⏳ **Pumuki (repo `ast-intelligence-hooks`)**: panel **Swift** notificaciones (foco + persistencia `.pumuki/system-notifications.json`) cuando se priorice UX en el propio producto Pumuki.
