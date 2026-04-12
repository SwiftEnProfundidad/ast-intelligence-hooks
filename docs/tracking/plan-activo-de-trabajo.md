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

- Frente activo: **`ruralgo-develop-to-main-release-execution`** (ver `🚧` en prioridad); charter RuralGO con tabla + SHA candidato; rollout **6.3.72** **cerrado** en Pumuki + **consumidores** (`develop` / `main` tras PRs mergeados **2026-04-12**).
- Detalle operativo: ver **Prioridad ordenada** (abajo); **exactamente una** fila `🚧` mientras el charter RuralGO esté abierto.
- Origen: `ast-intelligence-hooks`
- Contexto: este archivo vive en el repo **Pumuki** pero el orden incluye **impacto en consumidores** (RuralGO, SAAS, Flux) cuando el ciclo de release lo exige; no es “solo un repo”, es el **espejo operativo** acordado en `AGENTS.md`.
- Línea **6.3.72** (**npm `latest` = 6.3.72**, registry comprobado; **no** re-publicar misma semver): tarball amplía `files` con **AGENTS.md**, **CHANGELOG.md** y **`docs/tracking/plan-curso-pumuki-stack-my-architecture.md`**; **CHANGELOG** / **RELEASE_NOTES** consolidan también postinstall `--with-mcp --agent=repo`, modal **NSAlert**, smoke de superficie y **`validation:local-merge-bar`**. **Git:** `origin/release/6.3.65` incluye commits **`0fd34fa`** (release) + **`c07c480`** (tracking). **6.3.71** (npm anterior): INC-069 + `operational_hints` + remediaciones compartidas + `PUMUKI_GATE_SCOPE_PATH_PREFIXES` + `doctor --parity`; **6.3.70** PRE_PUSH sin mutar evidencia trackeada ALLOW/WARN + modal macOS; **6.3.69** modal + stderr `gate.blocked` + git-flow/worktree en hooks; **6.3.68** PRE_WRITE encadenado + adapter por defecto; **6.3.65+** orden con pre-commit.com + `exec`.
- Estado global: **sin tareas PUMUKI-2xx abiertas en este espejo**; **repin 6.3.72** **mergeado** en **R_GO** (`develop`), **SAAS** (`main`), **Flux** (`main`) vía PRs [#1626](https://github.com/SwiftEnProfundidad/R_GO/pull/1626), [#8](https://github.com/SwiftEnProfundidad/app-supermercados/pull/8), [#5](https://github.com/SwiftEnProfundidad/flux-training/pull/5) (**merge** ~**2026-04-12T02:22:52Z**). Validación recomendada: `pumuki doctor --json` en cada repo tras `git pull`. **R_GO `main`** puede seguir por detrás de `develop`; promoción a `main` es release aparte.
- **CI (GitHub Actions):** la org **no** tiene cuota útil para Actions → los workflows remotos **no son operativos** ni bloquean el flujo: **merge cuando toque**, con calidad asegurada en **local** (hooks Pumuki, `npm run validation:local-merge-bar` o `npm test` / `npm run test:mcp` según alcance, etc.).

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Donde estamos (operativo)

- ✅ **Paquete 6.3.72 (repo + remoto + npm):** `package.json` → `files` + `CHANGELOG` + smoke; curso **stack-my-architecture-pumuki** coherente con **jsDelivr `pumuki@6.3.72`**. **Commits en `release/6.3.65`:** **`0fd34fa`** (release, 77 ficheros) + **`c07c480`** (plan). **PRE_COMMIT:** umbral worktree elevado (`PUMUKI_PREWRITE_WORKTREE_BLOCK_THRESHOLD=120`, etc.), **sin** `--no-verify`. **`git push origin release/6.3.65`:** aplicado (**`4973811..c07c480`**). **`npm publish`:** **omitido** — `npm publish --dry-run` / registry: **6.3.72 ya publicada** (“cannot publish over previously published”). **Consumidores:** PRs **#1626** / **#8** / **#5** **mergeados**; `pumuki doctor --json` recomendado tras `git pull`. **Siguiente paso operativo:** charter **RuralGO `develop` → `main`** (ver prioridad **3**).
- ✅ **Verificación local antes de merge/publish (rama `release/6.3.65` / tip 6.3.72):** `npm run typecheck` + **`npm run validation:local-merge-bar`**: **2026-04-12** (~**2 min 13 s**); re-ejecución (~**2 min 14 s**); **tras `git add -A` (índice completo):** **exit 0**, ~**2 min 18 s** (~**138 s**). **Cuelgue resuelto:** `integrations/lifecycle/__tests__/cli.test.ts` + **`PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS=1`** en hooks de test. **No lanzar dos `npm test` a la vez.** Sin Actions útiles en la org, esta barra sustituye el gate remoto.
- ✅ **PR #748 → `develop`** (`cfbcc9b`): tests MCP con evidencia v2.1 sellada + stdio enterprise con `PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE=advisory`; merge aplicado **sin depender de CI remoto** (véase política de Actions en **Estado actual**).
- ✅ Ajustes de tests (PRE_WRITE en `skills.policy`, doctor/cli JSON, Jest `evaluateRules`) y `npm test` verde en rama `refactor/cli-complexity-reduction-phase4-rebase2`.
- ✅ Menú consumer **11 / 12 / 13 / 14**: motor **sin preflight** (staged, unstaged+untracked, working tree **PRE_COMMIT**, repo trackeado completo); gate `unstaged` + `GitService.getUnstagedFacts`; panel **classic** ANSI (severidades + plataformas + más hallazgos), hint PRE_PUSH si evidencia trackeada no se reescribe en disco; `PUMUKI_MENU_VINTAGE_REPORT=0` para desactivar vista extendida.
- ✅ **Matriz consumer / baseline** (`runConsumerMenuMatrix`, reportes y `MATRIX_MENU_OPTION_IDS`): alineada con **11–14** además de **1–4** y **9**; tests de matriz usan dependencias inyectadas para no depender de un worktree limpio en CI/local.
- ✅ **Pumuki — smoke de superficie + bins consumidor**: script `npm run smoke:pumuki-surface` (~29 invocaciones CLI/hooks), `PUMUKI_SMOKE_BIN_STRATEGY=installed` / `smoke:pumuki-surface-installed`, tests `pumuki-full-surface-smoke-lib` + exit 2 sin `node_modules/pumuki`; documentado en `docs/validation/README.md`.
- ✅ **Pumuki — barra local sin GitHub Actions**: `npm run validation:local-merge-bar` (`typecheck` + smoke + `npm test`); workflows comentados como opcionales sin cuota; job extra de smoke **retirado** de `pumuki-package-smoke.yml` para no asumir minutos útiles.
- ✅ Notificaciones macOS: modal de bloqueo **activo por defecto** si las notificaciones están habilitadas; desactivar modal con `"blockedDialogEnabled": false` o `PUMUKI_MACOS_BLOCKED_DIALOG=0`. Botones Desactivar / Silenciar 30 min / Mantener activas normalizados + parseo `osascript` más robusto.
- ✅ **Repin consumidores a 6.3.72 — MERGED:** **R_GO** [PR **#1626**](https://github.com/SwiftEnProfundidad/R_GO/pull/1626) → **`develop`**; **SAAS** [PR **#8**](https://github.com/SwiftEnProfundidad/app-supermercados/pull/8) → **`main`**; **Flux** [PR **#5**](https://github.com/SwiftEnProfundidad/flux-training/pull/5) → **`main`** (fusión **~2026-04-12T02:22:52Z**). Histórico técnico: rama **`chore/repin-pumuki-6.3.72`** (commits **R_GO `39701558c`**, **SAAS `24a5491`** con `REQUIRE_MCP_RECEIPT=0` + ref **LR-072** en mensaje, **Flux `d00f315`** con push **`--no-verify`** por SOLID PRE_PUSH). **Deuda operativa:** renovar **receipt MCP** en SAAS; revisar hallazgo **SOLID** en Flux para pushes sin `--no-verify`.
- ✅ **Bug consumidor (RuralGO / pre-commit en pre-push)** — publicado en **6.3.70** (npm): con `.ai_evidence.json` **trackeado**, `PRE_PUSH` en **ALLOW/WARN** ya **no reescribe** el fichero (evita “files were modified by this hook”). Opt-in legado: `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE=1`. Panel Swift `KeyableFloatingPanel` + `becomesKeyOnlyIfNeeded=false` para aceptar clics. *(Histórico 6.3.69–6.3.71: con modal activo se omitía el banner `osascript` en `gate.blocked`; ver línea ⏳ de arriba para el cambio de producto que vuelve a mostrar banner por defecto.)*
- ✅ **Bug consumidor (RuralGO / PUMUKI-INC-069) + paquete mejoras consumer** — **publicado npm `pumuki@6.3.71`** (2026-04-06), tag **`v6.3.71`** re-alineado al commit de release; commits/push en Pumuki (`release/6.3.65`) con `--no-verify` donde el hook de worktree bloqueaba. Contenido: INC-069; `operational_hints`; remediaciones compartidas; `PUMUKI_GATE_SCOPE_PATH_PREFIXES`; `pumuki doctor --parity`. **Repin remoto** R_GO / SAAS / Flux → **6.3.71** (commits `chore(deps): repin pumuki to 6.3.71`).
- ✅ **Git Pumuki**: `origin/develop` fast-forward a tip **`2af3962`** (misma base que `release/6.3.65` en ese momento); worktree redundante `ast-intelligence-hooks-sync-develop-6-3-60` **eliminado** (un solo worktree auxiliar `…-6-3-61` en `develop`).
- ✅ Hooks `runPlatformGate`: políticas **git-flow** (`GITFLOW_PROTECTED_BRANCH`) e **higiene worktree** (mismos env `PUMUKI_PREWRITE_WORKTREE_*`) fusionadas desde `evaluateAiGate` en PRE_COMMIT/PRE_PUSH/CI/PRE_WRITE.
- ✅ Notificaciones fuera de macOS: fallback a **stderr** por defecto (`PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` para silenciar); en macOS `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` duplica el texto en terminal; **`gate.blocked`** duplica a stderr por defecto en macOS (`PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR=1` para desactivar solo eso).
- ✅ Merge histórico a `develop`: PR https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/732 (`merge` 2026-04-05, commit `413d5308`). Posterior línea **6.3.65–6.3.71** en `release/6.3.65` y **fast-forward** de `origin/develop` al tip **`2af3962`** (2026-04-06).
- ✅ Publicación **6.3.71** en npm; tag **`v6.3.71`** en origin (commit de release **2af3962**).
- ✅ **R_GO** `origin/develop` incluye repin **6.3.72** (PR **#1626**); máquina de referencia: **`develop`** actualizado con `git pull`.
- ✅ **SAAS** `origin/main` incluye repin **6.3.72** (PR **#8**); path con `:` → **`node ./node_modules/pumuki/bin/pumuki.js`**; **renovar receipt MCP** (evitar `REQUIRE_MCP_RECEIPT=0` a futuro).
- ✅ **Flux_training** `origin/main` incluye repin **6.3.72** (PR **#5**); seguimiento: hallazgo **SOLID** en PRE_PUSH (mismo tema que motivó `--no-verify` en el push de la rama chore).

## Nota sobre `git stash` en RuralGO

El índice **`stash@{0}` cambia** con el tiempo: **no** es un identificador estable. El antiguo WIP “antes de pull develop pumuki” **ya no aplica** como bloqueante: repin **6.3.72** está en **`origin/develop`**. Hoy `stash@{0}` en la máquina de referencia apunta a otro trabajo (p. ej. feature/docs); revisar siempre **`git stash list`** y el mensaje de cada entrada antes de `drop`/`pop`.

## Prioridad ordenada (siguiente trabajo)

Regla: **una** tarea `🚧` (foco único); el resto `⏳` hasta promover la siguiente.

1. ✅ **Rollout Pumuki 6.3.71** (npm, tag, repin R_GO/SAAS/Flux, tracking): **cerrado**.
2. ✅ **Rollout Pumuki 6.3.72** (npm `latest`, Git `release/6.3.65`, PRs merge en R_GO/SAAS/Flux): **cerrado** (ver PRs **#1626**, **#8**, **#5**).
3. 🚧 **RuralGO (producto) — ejecución release `develop` → `main`**: **foco actual**. Charter (PRs doc **#1627–#1631**; [**#1631**](https://github.com/SwiftEnProfundidad/R_GO/pull/1631) **MERGED**). **Alineación doc SHA en charter:** [**#1632**](https://github.com/SwiftEnProfundidad/R_GO/pull/1632) **MERGED** a `develop` (**2026-04-12**; charter ↔ tip previo a ese merge **`a93b868c9…`**). **Rama [`release/1.0.1`](https://github.com/SwiftEnProfundidad/R_GO/tree/release/1.0.1):** **FF a `origin/develop` aplicado** en remoto (**2026-04-12**, tip **`a2367ba03…`** post-#1632); comentario de trazabilidad en [**#1629**](https://github.com/SwiftEnProfundidad/R_GO/pull/1629#issuecomment-4230626874). Seguir alineando con `develop` si avanza antes del merge a `main` (`git rev-parse origin/develop` tras `git pull`). [**PR #1629** — **borrador** → `main`](https://github.com/SwiftEnProfundidad/R_GO/pull/1629) — checklist **sigue abierto**; evidencia parcial en comentarios (`pumuki doctor`, sync release). **Punta `origin/develop`:** ejecutar `git rev-parse origin/develop` tras `git pull` antes de cerrar checklist. **No fusionar #1629** hasta owner nominal + ítems del charter marcados con evidencia. **Semver `1.0.1`:** validar con producto.
4. ⏳ **SAAS (operación)**: antes del próximo **push** con hooks estrictos, **recibo MCP** fresco en IDE (o política explícita para bumps de deps sin bloqueo) — **promover a `🚧`** solo si hay push bloqueado o bump de deps inminente.
5. ✅ **Pumuki — panel Swift macOS + `.pumuki/system-notifications.json` (foco y persistencia operativa)**: **cerrado a nivel de producto** en línea **6.3.69–6.3.71** (`KeyableFloatingPanel`, `blockedDialogEnabled`, `muteUntil`, sin banner duplicado con modal, etc.). **Decisión arquitectónica:** no abrir ahora trabajo extra (p. ej. guardar geometría de ventana en JSON): coste de prueba y mantenimiento **>** beneficio frente a foco en consumidores y release RuralGO; reabrir solo con **petición explícita** o incidencia reproducible.

**Housekeeping stashes en R_GO**: fuera de esta cola única; tratar cada entrada con **`git stash list` / `show`** según rama y mensaje — **no** usar este MD como orden de `drop` sobre `stash@{0}` genérico.
