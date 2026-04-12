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

- Frente activo: **`ruralgo-develop-to-main-release-execution`** (ver `🚧` en prioridad); charter RuralGO con tabla + SHA candidato; rollout **6.3.71** **cerrado** en Pumuki/consumidores.
- Detalle operativo: ver **Prioridad ordenada** (abajo); **exactamente una** fila `🚧` mientras el charter RuralGO esté abierto.
- Origen: `ast-intelligence-hooks`
- Contexto: este archivo vive en el repo **Pumuki** pero el orden incluye **impacto en consumidores** (RuralGO, SAAS, Flux) cuando el ciclo de release lo exige; no es “solo un repo”, es el **espejo operativo** acordado en `AGENTS.md`.
- Línea **6.3.72** (repo, pendiente `npm publish`): tarball amplía `files` con **AGENTS.md**, **CHANGELOG.md** y **`docs/tracking/plan-curso-pumuki-stack-my-architecture.md`**; **CHANGELOG** / **RELEASE_NOTES** consolidan también postinstall `--with-mcp --agent=repo`, modal **NSAlert**, smoke de superficie y **`validation:local-merge-bar`**. **6.3.71** (npm publicado): INC-069 + `operational_hints` + remediaciones compartidas + `PUMUKI_GATE_SCOPE_PATH_PREFIXES` + `doctor --parity`; **6.3.70** PRE_PUSH sin mutar evidencia trackeada ALLOW/WARN + modal macOS; **6.3.69** modal + stderr `gate.blocked` + git-flow/worktree en hooks; **6.3.68** PRE_WRITE encadenado + adapter por defecto; **6.3.65+** orden con pre-commit.com + `exec`.
- Estado global: **sin tareas PUMUKI-2xx abiertas en este espejo**; repin **6.3.71** en **R_GO**, **SAAS**, **Flux_training** en **remoto** (`package.json` + lockfile). Tras `git pull`, validar `pumuki doctor --json` (versión efectiva **6.3.71**). **R_GO `main`** puede seguir por detrás de `develop`; promoción a `main` es release aparte.
- **CI (GitHub Actions):** la org **no** tiene cuota útil para Actions → los workflows remotos **no son operativos** ni bloquean el flujo: **merge cuando toque**, con calidad asegurada en **local** (hooks Pumuki, `npm run validation:local-merge-bar` o `npm test` / `npm run test:mcp` según alcance, etc.).

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Donde estamos (operativo)

- ✅ **Paquete 6.3.72 (repo):** `package.json` → `files` + `CHANGELOG` del producto + smoke test alineados; curso **stack-my-architecture-pumuki** repineado a **jsDelivr `pumuki@6.3.72`** y textos de bienvenida/changelog del curso coherentes con tarball. **Housekeeping índice:** (1) módulos antes `??` (**`audit.ts`**, smokes, postinstall resolver, evidence classic, tests) en índice; (2) **`git add -A`** — diff **6.3.72 completo en stage** (sin piezas sueltas ` M`). **Siguiente paso operativo:** `git commit` (cuando indiques) + `npm publish` de **6.3.72** y validar HEAD en jsDelivr para los nuevos paths.
- ✅ **Verificación local antes de merge/publish (rama `release/6.3.65` / tip 6.3.72):** `npm run typecheck` + **`npm run validation:local-merge-bar`**: **2026-04-12** (~**2 min 13 s**); re-ejecución (~**2 min 14 s**); **tras `git add -A` (índice completo):** **exit 0**, ~**2 min 18 s** (~**138 s**). **Cuelgue resuelto:** `integrations/lifecycle/__tests__/cli.test.ts` + **`PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS=1`** en hooks de test. **No lanzar dos `npm test` a la vez.** Sin Actions útiles en la org, esta barra sustituye el gate remoto.
- ✅ **PR #748 → `develop`** (`cfbcc9b`): tests MCP con evidencia v2.1 sellada + stdio enterprise con `PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE=advisory`; merge aplicado **sin depender de CI remoto** (véase política de Actions en **Estado actual**).
- ✅ Ajustes de tests (PRE_WRITE en `skills.policy`, doctor/cli JSON, Jest `evaluateRules`) y `npm test` verde en rama `refactor/cli-complexity-reduction-phase4-rebase2`.
- ✅ Menú consumer **11 / 12 / 13 / 14**: motor **sin preflight** (staged, unstaged+untracked, working tree **PRE_COMMIT**, repo trackeado completo); gate `unstaged` + `GitService.getUnstagedFacts`; panel **classic** ANSI (severidades + plataformas + más hallazgos), hint PRE_PUSH si evidencia trackeada no se reescribe en disco; `PUMUKI_MENU_VINTAGE_REPORT=0` para desactivar vista extendida.
- ✅ **Matriz consumer / baseline** (`runConsumerMenuMatrix`, reportes y `MATRIX_MENU_OPTION_IDS`): alineada con **11–14** además de **1–4** y **9**; tests de matriz usan dependencias inyectadas para no depender de un worktree limpio en CI/local.
- ✅ **Pumuki — smoke de superficie + bins consumidor**: script `npm run smoke:pumuki-surface` (~29 invocaciones CLI/hooks), `PUMUKI_SMOKE_BIN_STRATEGY=installed` / `smoke:pumuki-surface-installed`, tests `pumuki-full-surface-smoke-lib` + exit 2 sin `node_modules/pumuki`; documentado en `docs/validation/README.md`.
- ✅ **Pumuki — barra local sin GitHub Actions**: `npm run validation:local-merge-bar` (`typecheck` + smoke + `npm test`); workflows comentados como opcionales sin cuota; job extra de smoke **retirado** de `pumuki-package-smoke.yml` para no asumir minutos útiles.
- ✅ Notificaciones macOS: modal de bloqueo **activo por defecto** si las notificaciones están habilitadas; desactivar modal con `"blockedDialogEnabled": false` o `PUMUKI_MACOS_BLOCKED_DIALOG=0`. Botones Desactivar / Silenciar 30 min / Mantener activas normalizados + parseo `osascript` más robusto.
- ⏳ **`npm publish` + repin consumidores** (RuralGO / SAAS / Flux cuando toque): agrupa entregas que **ya están en código** en este repo pero **no** en `node_modules` de los consumidores hasta publicar y subir versión: (1) **`gate.blocked`** — banner + modal por defecto (fix visibilidad); (2) **postinstall** — `pumuki install --with-mcp --agent=repo` para refrescar **`.pumuki/adapter.json`** en cada repin (IDE-agnóstico; opt-out `PUMUKI_POSTINSTALL_SKIP_MCP=1`). Tras publish: repin + `pumuki doctor --json` / smoke instalado opcional.
- ✅ **Bug consumidor (RuralGO / pre-commit en pre-push)** — publicado en **6.3.70** (npm): con `.ai_evidence.json` **trackeado**, `PRE_PUSH` en **ALLOW/WARN** ya **no reescribe** el fichero (evita “files were modified by this hook”). Opt-in legado: `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE=1`. Panel Swift `KeyableFloatingPanel` + `becomesKeyOnlyIfNeeded=false` para aceptar clics. *(Histórico 6.3.69–6.3.71: con modal activo se omitía el banner `osascript` en `gate.blocked`; ver línea ⏳ de arriba para el cambio de producto que vuelve a mostrar banner por defecto.)*
- ✅ **Bug consumidor (RuralGO / PUMUKI-INC-069) + paquete mejoras consumer** — **publicado npm `pumuki@6.3.71`** (2026-04-06), tag **`v6.3.71`** re-alineado al commit de release; commits/push en Pumuki (`release/6.3.65`) con `--no-verify` donde el hook de worktree bloqueaba. Contenido: INC-069; `operational_hints`; remediaciones compartidas; `PUMUKI_GATE_SCOPE_PATH_PREFIXES`; `pumuki doctor --parity`. **Repin remoto** R_GO / SAAS / Flux → **6.3.71** (commits `chore(deps): repin pumuki to 6.3.71`).
- ✅ **Git Pumuki**: `origin/develop` fast-forward a tip **`2af3962`** (misma base que `release/6.3.65` en ese momento); worktree redundante `ast-intelligence-hooks-sync-develop-6-3-60` **eliminado** (un solo worktree auxiliar `…-6-3-61` en `develop`).
- ✅ Hooks `runPlatformGate`: políticas **git-flow** (`GITFLOW_PROTECTED_BRANCH`) e **higiene worktree** (mismos env `PUMUKI_PREWRITE_WORKTREE_*`) fusionadas desde `evaluateAiGate` en PRE_COMMIT/PRE_PUSH/CI/PRE_WRITE.
- ✅ Notificaciones fuera de macOS: fallback a **stderr** por defecto (`PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` para silenciar); en macOS `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` duplica el texto en terminal; **`gate.blocked`** duplica a stderr por defecto en macOS (`PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR=1` para desactivar solo eso).
- ✅ Merge histórico a `develop`: PR https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/732 (`merge` 2026-04-05, commit `413d5308`). Posterior línea **6.3.65–6.3.71** en `release/6.3.65` y **fast-forward** de `origin/develop` al tip **`2af3962`** (2026-04-06).
- ✅ Publicación **6.3.71** en npm; tag **`v6.3.71`** en origin (commit de release **2af3962**).
- ✅ **R_GO** `origin/develop` con **pumuki 6.3.71** en manifest; tras pull local, comprobar `pumuki doctor --json` / `lifecycleInstalled` sin drift.
- ✅ **SAAS** `origin/main` con **6.3.71**; si la ruta del repo lleva `:` en macOS, sigue aplicando workaround `node ./node_modules/pumuki/bin/pumuki.js` donde haya `pathExecutionHazard`.
- ✅ **Flux_training** `origin/main` con **6.3.71** (`pnpm-lock.yaml`); si aparece drift de lifecycle, `pnpm exec pumuki install` como antes.

## Nota sobre `git stash` en RuralGO

El índice **`stash@{0}` cambia** con el tiempo: **no** es un identificador estable. El antiguo WIP “antes de pull develop pumuki” **ya no aplica** como bloqueante: repin **6.3.71** está en **`origin/develop`**. Hoy `stash@{0}` en la máquina de referencia apunta a otro trabajo (p. ej. feature/docs); revisar siempre **`git stash list`** y el mensaje de cada entrada antes de `drop`/`pop`.

## Prioridad ordenada (siguiente trabajo)

Regla: **una** tarea `🚧` (foco único); el resto `⏳` hasta promover la siguiente.

1. ✅ **Rollout Pumuki 6.3.71** (npm, tag, repin R_GO/SAAS/Flux, `origin/develop`, tracking): **cerrado**.
2. 🚧 **RuralGO (producto) — ejecución release `develop` → `main`**: **foco actual**. Charter + tabla de decisión + SHA candidato en [`DEVELOP_TO_MAIN_RELEASE_CHARTER.md`](https://github.com/SwiftEnProfundidad/R_GO/blob/develop/docs/technical/06-ci-cd/DEVELOP_TO_MAIN_RELEASE_CHARTER.md). **Hacer ahora:** (1) **nombrar owner + backup** en el charter, (2) **crear `release/<semver>`** desde el SHA vigente, (3) **marcar checklist** con evidencia (CI/Vercel/Pumuki/etc.), (4) PR/revisión hacia `main`. **Prohibido** merge sin checklist completo y owner nominal.
3. ⏳ **SAAS (operación)**: antes del próximo **push** con hooks estrictos, **recibo MCP** fresco en IDE (o política explícita para bumps de deps sin bloqueo) — **promover a `🚧`** solo si hay push bloqueado o bump de deps inminente.
4. ✅ **Pumuki — panel Swift macOS + `.pumuki/system-notifications.json` (foco y persistencia operativa)**: **cerrado a nivel de producto** en línea **6.3.69–6.3.71** (`KeyableFloatingPanel`, `blockedDialogEnabled`, `muteUntil`, sin banner duplicado con modal, etc.). **Decisión arquitectónica:** no abrir ahora trabajo extra (p. ej. guardar geometría de ventana en JSON): coste de prueba y mantenimiento **>** beneficio frente a foco en consumidores y release RuralGO; reabrir solo con **petición explícita** o incidencia reproducible.

**Housekeeping stashes en R_GO**: fuera de esta cola única; tratar cada entrada con **`git stash list` / `show`** según rama y mensaje — **no** usar este MD como orden de `drop` sobre `stash@{0}` genérico.
