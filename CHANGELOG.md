# Changelog

All notable changes to `pumuki` are documented here.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- No user-facing changes yet.

## [6.3.70] - 2026-04-06

### Fixed

- **PRE_PUSH + `.ai_evidence.json` trackeado**: si el fichero está en el índice de git y el outcome del gate **no** es `BLOCK` (`PASS`/`WARN`), Pumuki **ya no reescribe** `.ai_evidence.json` en disco. Evita que integraciones que ejecutan **pre-commit** dentro de **pre-push** fallen con *files were modified by this hook* pese a `decision=ALLOW`. La telemetría del gate sigue generándose; el snapshot versionado sigue siendo el último producido en **PRE_COMMIT** hasta el siguiente commit. Opt-in al comportamiento anterior: `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE=1`.
- **macOS `gate.blocked` con modal activo**: no se envía el banner `osascript` duplicado cuando ya se muestra el diálogo interactivo (menos confusión con el Centro de notificaciones). Panel Swift: `KeyableFloatingPanel` + `becomesKeyOnlyIfNeeded = false` para que los botones **Desactivar / Silenciar 30 min / Mantener activas** reciban clics de forma fiable.

## [6.3.69] - 2026-04-05

### Changed

- **`gate.blocked` (macOS)**: además del banner/`osascript`, el mismo payload se escribe en **stderr** por defecto para que un bloqueo PRE_COMMIT/PRE_PUSH/CI sea visible aunque macOS no muestre la notificación (Focus, permisos del terminal, etc.). Silenciar solo ese duplicado: `PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR=1`. Sigue aplicando `PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` para cortar cualquier vía stderr.
- **Modal de bloqueo (macOS)**: con notificaciones activas, el diálogo flotante/AppleScript con **Desactivar / Silenciar 30 min / Mantener activas** vuelve a estar **habilitado por defecto** (antes `blockedDialogEnabled` caía en `false` si no venía en JSON). Para desactivar solo el modal sin cortar banners: `"blockedDialogEnabled": false` en `.pumuki/system-notifications.json` o `PUMUKI_MACOS_BLOCKED_DIALOG=0`. Los clics se normalizan mejor (mayúsculas/espacios y salida ruidosa de `osascript`) para que mute/disable persistan en disco.
- **Hooks Git (`runPlatformGate`)**: se fusionan violaciones de política de repo desde `evaluateAiGate` que antes solo impactaban MCP/menú: **`GITFLOW_PROTECTED_BRANCH`** y **higiene de worktree** (`EVIDENCE_PREWRITE_WORKTREE_*`, mismos umbrales `PUMUKI_PREWRITE_WORKTREE_*`) ahora aplican también en **PRE_COMMIT**, **PRE_PUSH** y **CI** cuando la evidencia es válida (git-flow y pending_changes siguen activos aunque falte evidencia vía `evaluateAiGate`).

### Migration

- Si tenías `.pumuki/system-notifications.json` con `"enabled": true` y **omitías** `blockedDialogEnabled` asumiendo que el modal estaba apagado, ahora el modal queda **encendido**. Fija explícitamente `"blockedDialogEnabled": false` para recuperar el comportamiento anterior.

## [6.3.68] - 2026-04-06

### Added

- **PRE_WRITE en la cadena Git (sin IDE)**: los hooks gestionados **`pre-commit`** y **`pre-push`** ejecutan **`pumuki-pre-write`** antes del binario principal. Así el stage **PRE_WRITE** forma parte del flujo real de cualquier repo con Git. Desactivar solo esa parte: `PUMUKI_SKIP_CHAINED_PRE_WRITE=1`.
- **`.pumuki/adapter.json` por defecto**: en **`pumuki install`**, si el fichero no existe, se genera con plantilla **`repo`** (comandos de hooks + MCP enterprise/evidence) para que los procesos stdio y la documentación del repo no dependan de Cursor/Codex.

## [6.3.67] - 2026-04-06

### Fixed

- **Línea base agnóstica al IDE**: el `postinstall` de npm **no** debe acoplar Pumuki a Cursor, Codex ni ningún IDE. Se revierte el experimento **6.3.66** que ejecutaba `pumuki install --with-mcp --agent=cursor` por defecto. El postinstall vuelve a ser solo **`pumuki install`** (hooks Git, estado de lifecycle, evidencia cuando aplica; OpenSpec sigue **omitido** por defecto en ese camino, como en **6.3.63+**).
- **Adaptadores opcionales**: MCP, `.cursor/`, `.claude/`, etc. siguen disponibles con **`pumuki install --with-mcp --agent=<nombre>`** o **`pumuki bootstrap --enterprise`**, explícitos por repo/equipo.

### Changed

- Plantilla **Cursor** del adaptador: se mantienen **fusión JSON** en `.cursor/mcp.json` y **`.pumuki/adapter.json`** cuando el usuario elige `--agent=cursor` (no en postinstall).

## [6.3.65] - 2026-04-06

### Fixed

- **Integración con pre-commit.com**: si el hook `pre-commit` termina en `exec … pre_commit`, el bloque gestionado por Pumuki se insertaba **después** y nunca se ejecutaba. Ahora se detecta esa plantilla y el bloque Pumuki se coloca **justo después del shebang**, antes del `exec`. Tras actualizar, ejecutar `pumuki install` en el consumer para reescribir `.git/hooks/pre-commit`.

## [6.3.64] - 2026-04-05

### Fixed

- **System notifications fuera de macOS**: el gate ya no bloquea por plataforma; en Linux/Windows/WSL (y similares) el payload se escribe en **stderr** por defecto (`reason: stderr-fallback`). Silenciar con `PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` (vuelve `unsupported-platform` sin escribir).
- **macOS**: si el banner falla (`command-failed`), se aplica el mismo fallback a stderr salvo que el fallback esté desactivado. `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` duplica el texto en stderr además del banner nativo.

## [6.3.63] - 2026-04-05

### Added

- **`npm` postinstall (consumer)**: tras `npm install` en un repo Git, Pumuki ejecuta `pumuki install` de forma automática (`INIT_CWD`), sin OpenSpec bootstrap por defecto en ese camino. Desactivar con `PUMUKI_SKIP_POSTINSTALL=1` o en CI (`CI=true`). No sustituye la configuración manual de MCP en el IDE.
- **Best-effort install**: si `doctor` bloquea el baseline pero `PUMUKI_AUTO_POSTINSTALL=1` (postinstall), se cablean igualmente hooks + estado + evidencia bootstrap con aviso de modo degradado.

## [6.3.62] - 2026-04-05

### Fixed

- macOS system notifications: anti-spam **blocked** dialog is now **opt-in** (`PUMUKI_MACOS_BLOCKED_DIALOG=1` or `"blockedDialogEnabled": true` in `.pumuki/system-notifications.json`); default path stays banner-only. Swift panel wiring hardened (focus, window lifecycle).

### Changed

- CLI / lifecycle test fixtures aligned with `PRE_WRITE` in policy payloads (`source` fields, doctor/status JSON shape).
- Gate / git hook / framework-menu tests refreshed (stage policies, hook summaries, consumer menu layout group titles).
- File-size guardrail overrides updated for current `cli` / gate sources; install smoke fixture version aligned with package semver.

## [6.3.61] - 2026-03-31

### Fixed

- `PRE_WRITE` and `PRE_COMMIT` now block brownfield hotspots before structural debt accumulates.
  - `BrownfieldHotspotGuard` enforces file-size thresholds plus required refactor plans and ADRs for flagged hotspots.
  - Gate policy/profile wiring now treats `PRE_WRITE` as a first-class stage across skills and policy packs.

### Changed

- iOS enforcement now vendors `swift-testing-expert` and `core-data-expert` and adds a versioned SwiftUI modernization snapshot.
  - New auditable rules detect legacy `foregroundColor`, `cornerRadius`, `tabItem`, and `ScrollView(..., showsIndicators: false)` usage.
  - Skills compilation, evidence mapping, and iOS rule-pack docs stay aligned with the new enforcement bundle.

## [6.3.57] - 2026-03-11

### Changed

- Semantic findings now carry richer AST-driven payloads across the gate/evidence pipeline.
  - TypeScript, iOS and Android heuristic extraction adds structured context such as semantic node coverage and platform-specific signal enrichment.
  - Evidence/gate evaluation now preserves that richer traceability for downstream consumers and diagnostics.
- The vendored enterprise skill chain is now canonical in the published package.
  - `vendor/skills/*` and `docs/codex-skills/*-enterprise-rules.md` stay aligned with the runtime package manifest and release tooling.
  - Package validation and sync scripts now follow the canonical `*-enterprise-rules` naming instead of legacy `windsurf-rules-*` paths.

## [6.3.56] - 2026-03-11

### Fixed

- `PRE_COMMIT` no longer reintroduces `.ai_evidence.json` into the index when that file is tracked in the repo but was not staged before the gate started.
  - Successful commit flows now restore tracked evidence deterministically instead of contaminating unrelated commits with refreshed evidence.

## [6.3.55] - 2026-03-06

### Fixed

- `status` and `doctor` now detect when the consumer repository path contains the system `PATH` delimiter and `npx/npm exec` can therefore fail to resolve `pumuki`.
  - They now expose:
    - `version.pathExecutionHazard`
    - `version.pathExecutionWarning`
    - `version.pathExecutionWorkaroundCommand`
- `version.alignmentCommand` now switches automatically to a safe local invocation when the repo path makes `PATH`-based execution unsafe.
  - On POSIX consumers such as `SAAS:APP_SUPERMERCADOS`, remediation now points to `node ./node_modules/pumuki/bin/pumuki.js install` instead of an `npx --package ... pumuki install` command that can fail with `sh: pumuki: command not found`.
- Human-readable `pumuki status` and `pumuki doctor` now print both:
  - `execution warning`
  - `execution workaround`
  when this path hazard is detected.

## [6.3.54] - 2026-03-06

### Fixed

- The published npm package now includes `docs/codex-skills/*.md`.
  - Consumers can compile the core skills lock from `skills.sources.json` inside `node_modules/pumuki` instead of silently losing `backend-guidelines`, `frontend-guidelines`, `ios-guidelines`, `swift-concurrency`, `swiftui-expert-skill`, and `android-guidelines`.
- Package manifest validation now treats the vendored codex skill markdown files as required runtime package assets.
  - This prevents future releases from shipping a tarball where skills coverage gates fail in consumers because the package is missing its own core skill sources.

## [6.3.53] - 2026-03-06

### Fixed

- `pumuki watch` now respects the requested `repoRoot` when collecting facts and running the gate in cross-repo mode.
  - Prevents false findings and notifications coming from the current working directory instead of the target checkout.
- `PRE_WRITE` worktree hygiene now uses deduplicated pending file count when repo state provides it.
  - Avoids overcounting partially staged files such as `MM foo.ts`.
- Custom skills bundle hashes now include `ast_node_ids`.
  - Policy/evidence drift detection now changes when AST coverage of `AUTO` rules changes.
- `auto_execute_ai_start` now treats `EVIDENCE_CHAIN_INVALID` as an actionable evidence failure.
  - The next action now tells the user to regenerate or refresh evidence instead of falling back to a generic message.

## [6.3.52] - 2026-03-06

### Fixed

- `pumuki status` and `pumuki doctor` now expose version semantics explicitly instead of mixing runtime, consumer-installed and lifecycle-installed versions under an ambiguous single label.
  - Both commands now include a structured `version` block with:
    - `effective`
    - `runtime`
    - `consumerInstalled`
    - `lifecycleInstalled`
    - `source`
    - `driftFromRuntime`
    - `driftFromLifecycleInstalled`
    - `driftWarning`
- Human-readable output now reports:
  - effective version,
  - runtime version,
  - consumer installed version,
  - lifecycle installed version,
  - and an explicit drift warning when those values diverge.

## [6.3.51] - 2026-03-06

### Fixed

- `PRE_COMMIT` no longer leaves `.ai_evidence.json` dirty after a successful commit when that file was already tracked.
  - The hook now re-stages the refreshed evidence only when the file is already part of the index.
- `PRE_PUSH` now respects the exact hook refspec range (`remoteOid..localOid`) when publishing a specific commit instead of always evaluating `upstream..HEAD`.
- `PRE_PUSH` now suspends SDD session enforcement for historical publishes that target an exact commit different from current `HEAD`.
  - Prevents false `SDD_SESSION_*` / `SDD_CHANGE_*` blocks when replaying already closed commits.
- `pumuki sdd evidence` keeps the repo-bound safety check for `--test-output`, but now suggests an immediate valid ephemeral path inside the repo, such as `.pumuki/runtime/<file>.log`.

## [6.3.50] - 2026-03-05

### Improved

- `GIT_ATOMICITY_TOO_MANY_SCOPES` now includes actionable scope/file breakdown in the blocking payload.
  - Adds `scope_files=...` with per-scope count and sample files.
  - Improves deterministic split guidance in remediation (`Sugerencia split`).
- Gate block summary `next_action` for this code now points explicitly to the `scope_files` breakdown before splitting staging.

## [6.3.49] - 2026-03-05

### Fixed

- `pumuki watch --json` now aligns `lastTick.changed` with real file delta of the evaluated scope.
  - For `scope=staged`, when no staged files are present (`changedFiles=[]`, `evaluatedFiles=[]`), `changed=false`.
  - Avoids ambiguous interpretation where `changed=true` previously represented tick execution instead of actual scoped changes.

## [6.3.48] - 2026-03-05

### Fixed

- `pumuki watch` now enforces manifest integrity guard during gate evaluation:
  - snapshots/restores `package.json`, `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock`,
  - blocks the tick with `MANIFEST_MUTATION_DETECTED` when unexpected mutation is detected and reverted.
- Hook-stage manifest guard (`PRE_COMMIT` / `PRE_PUSH`) now also covers `pnpm-lock.yaml` and `yarn.lock` in addition to npm manifests.
- Prevents silent dependency drift in consumer repos during validation flows when no explicit upgrade command is requested.

## [6.3.47] - 2026-03-05

### Fixed

- Hooks/gates now enforce manifest integrity in `PRE_COMMIT` and `PRE_PUSH`:
  - snapshot + automatic restore for `package.json` and `package-lock.json`,
  - explicit block code `MANIFEST_MUTATION_DETECTED` when unexpected mutation is detected.
- Prevents unintended consumer manifest drift during normal hook/gate execution unless upgrade is explicitly requested by the developer.

## [6.3.46] - 2026-03-05

### Added

- `pumuki watch --json` ahora expone metadata de versión efectiva/runtime:
  - `version.effective`
  - `version.runtime`
  - `version.consumerInstalled`
  - `version.source`
  - `version.driftFromRuntime`
  - `version.driftWarning` (cuando hay desalineación).

### Fixed

- Hooks (`pre-commit`/`pre-push`) ahora auto-reconcilian policy (`--strict --apply`) y reintentan una vez cuando el bloqueo corresponde a códigos de skills coverage:
  - `SKILLS_PLATFORM_COVERAGE_INCOMPLETE_HIGH`
  - `SKILLS_SCOPE_COMPLIANCE_INCOMPLETE_HIGH`
  - `EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE`
  - `EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING`
  - `EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE`
- Se reduce fricción de bootstrap manual repetitivo entre iteraciones al unificar comportamiento de hook con `watch`.

## [6.3.45] - 2026-03-05

### Added

- `pumuki sdd sync-docs` sincroniza por defecto los tres documentos canónicos del consumer cuando existen:
  - `docs/strategy/ruralgo-tracking-hub.md`
  - `docs/technical/08-validation/refactor/operational-summary.md`
  - `docs/validation/refactor/last-run.json`
- `pumuki sdd auto-sync` incluye por defecto artefactos OpenSpec por cambio:
  - `openspec/changes/<change>/tasks.md`
  - `openspec/changes/<change>/design.md`
  - `openspec/changes/<change>/retrospective.md`

### Changed

- MCP tools (`ai_gate_check`, `pre_flight_check`, `auto_execute_ai_start`) ahora incorporan `learning_context` automáticamente desde `openspec/changes/<change>/learning.json` cuando existe cambio activo.

### Fixed

- `sync-docs` crea secciones managed faltantes de forma idempotente y evita conflictos falsos al inicializar documentación canónica nueva.

## [6.3.43] - 2026-03-05

### Changed

- `pumuki sdd evidence` now emits TDD/BDD-compatible contract by default:
  - `version` normalized to `"1"`,
  - includes required `slices[]` payload (`red/green/refactor`) for gate validation.
- Legacy compatibility is preserved in the scaffold payload:
  - keeps `scenario_id`, `test_run`, and `ai_evidence` fields used by existing consumers.

### Fixed

- Resolved consumer regression where scaffolded evidence was rejected as invalid (`TDD_BDD_EVIDENCE_INVALID`):
  - previous payload used `version: "1.0"` without `slices[]`.
- `sdd state-sync` now accepts source evidence versions `1` and `1.0` for backward compatibility during rollout.

## [6.3.42] - 2026-03-05

### Changed

- Blocked modal (macOS Swift helper) now prioritizes readable vertical layout:
  - narrower width range (`360..620`) to avoid oversized horizontal dialogs,
  - dynamic height growth from content fitting size,
  - compact typography for cause/remediation blocks.
- Blocked remediation text is now more actionable by default:
  - richer guidance for `EVIDENCE_*`, `PRE_PUSH_UPSTREAM_MISSING`, `SDD_SESSION_*`,
  - remediation truncation budget increased to preserve useful resolution steps.

### Fixed

- Improved multiline wrapping behavior in floating blocked dialog:
  - explicit word wrapping and multiline cell configuration for title/cause/remediation,
  - avoids aggressive truncation in long real-world messages.
- Bottom-right pinning remains stable after dynamic relayout on real displays.

## [6.3.41] - 2026-03-05

### Changed

- macOS blocked notifications now include project context in subtitle:
  - format: `<project> · <stage> · <cause-summary>`,
  - improves differentiation when multiple repos are active.
- Blocked dialog is now enabled by default on macOS for `gate.blocked`:
  - explicit override remains available via `PUMUKI_MACOS_BLOCKED_DIALOG=0|1`,
  - existing anti-spam controls (`mute/disable`) are preserved.

### Fixed

- Notification config parser and persistence now carry `blockedDialogEnabled` deterministically.
- Added regression coverage for:
  - project label rendering in blocked subtitle,
  - default blocked-dialog activation without explicit env flag.

## [6.3.40] - 2026-03-05

### Added

- AST Intelligence dual validation PoC (`#616`) with compatibility-first rollout:
  - new dual mode runtime: `PUMUKI_AST_INTELLIGENCE_DUAL_MODE=off|shadow|strict`,
  - new guard findings:
    - `governance.ast-intelligence.dual-validation.shadow` (`INFO`, non-blocking),
    - `governance.ast-intelligence.dual-validation.mismatch` (`ERROR`, blocking in `strict`),
  - deterministic runtime summary in gate logs:
    - mapped rules, divergences, `false_positives`, `false_negatives`, `latency_ms`, languages.
- RFC + roadmap for AST Intelligence by nodes:
  - `docs/validation/ast-intelligence-validation-roadmap.md`,
  - includes architecture target, 30/60/90 plan, rollout and rollback contract.
- Backlog watcher/reconcile JSON now includes `next_commands[].probe_kind`:
  - `json_contract` for dry-run probe validation.
  - `state_recheck` for apply probe validation.

### Fixed

- Stage gates now block deterministically when code changes are detected but rules coverage has no active rules:
  - new finding `governance.rules.active-rule-coverage.empty`,
  - code `ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH`,
  - prevents false-green `PASS/ALLOW` with `active_rule_ids=[]` on code surfaces.
- iOS XCTest quality enforcement for enterprise gates (`PRE_COMMIT/PRE_PUSH/CI`):
  - new finding `governance.skills.ios-test-quality.incomplete`,
  - code `IOS_TEST_QUALITY_PATTERN_MISSING_HIGH`,
  - blocks when XCTest sources in `apps/ios/**/Tests/**.swift` miss `makeSUT()` and/or `trackForMemoryLeaks()`.
- Fixed findings trace consistency in stage gates:
  - guard-driven blocking conditions are now always propagated to `effectiveFindings`,
  - avoiding opaque `BLOCK` outcomes without explicit finding payload.
- PRE_PUSH scope false positives caused by upstream misalignment now fail fast with deterministic signal:
  - upstream drift is detected earlier (`PRE_PUSH_UPSTREAM_MISALIGNED`) before scope coverage evaluation.
- Local smoke for consumer install now falls back deterministically when `npx --no-install` crashes with runtime import errors (`MODULE_NOT_FOUND`).
- `ai_gate_check` consistency hints now cover legacy `EVIDENCE_*` codes (including `EVIDENCE_INTEGRITY_MISSING`) to reduce hook-vs-MCP diagnosis drift.

## [6.3.39] - 2026-03-04

### Added

- Cross-platform critical skills enforcement in platform gate evaluation:
  - new blocking finding `governance.skills.cross-platform-critical.incomplete` when a detected platform has no critical (`CRITICAL/ERROR`) skills rules active/evaluated.

### Changed

- Adapter-generated hook/CI commands now resolve robustly through:
  - `npx --yes --package pumuki@latest ...`
  - eliminating fragile dependency on local `./node_modules/.bin` availability in consumer repos.
- Git atomicity enforcement is now enabled by default:
  - base guard is active out-of-the-box for `PRE_COMMIT/PRE_PUSH/CI`,
  - existing env/config overrides are preserved for controlled opt-out or threshold tuning.
- Lifecycle hook diagnostics now expose effective hooks path resolution:
  - `status`/`doctor` include `hooksDirectory` and `hooksDirectoryResolution`,
  - console output now prints the effective hook path used for evaluation.

### Fixed

- Commit-range facts resolution no longer crashes or degrades ambiguously when refs are not resolvable (for example repos without `HEAD` yet):
  - guarded `rev-parse --verify` + safe fallback behavior in git-range facts collection.
- `core.hooksPath` hardening for versioned hooks:
  - hook path resolution now falls back to local `.git/config` (`core.hooksPath`) when `git rev-parse --git-path hooks` is unavailable,
  - non-regression coverage added for both versioned hooks and fallback resolution.
- Stage-gates non-regression suite stabilization:
  - updated lifecycle ingestion and preflight fixtures to the current evidence v2.1 contract (`evidence_chain` and `evidence.source`),
  - aligned architecture guardrail overrides for the current orchestrator module size/import profile (`integrations/lifecycle/cli.ts`).

## [6.3.38] - 2026-03-04

### Added

- Optional macOS blocked dialog flow for gate failures (`PUMUKI_MACOS_BLOCKED_DIALOG=1`):
  - full cause + remediation detail in modal dialog,
  - anti-spam user controls in dialog:
    - `Mantener activas`
    - `Silenciar 30 min`
    - `Desactivar`
  - auto-timeout (`15s`) to avoid hanging local execution when no user interaction happens.

### Changed

- Blocked macOS notification UX is now short and human-readable by default:
  - title in Spanish (`🔴 Pumuki bloqueado`),
  - compact subtitle with stage + summarized cause,
  - message starts with `Solución: ...` so remediation is visible in banner-limited space.
- Added mute-aware notification delivery:
  - support for `muteUntil` in `.pumuki/system-notifications.json`,
  - suppressed delivery while mute window is active (`reason=muted`).

### Fixed

- Stabilized `stageRunners` test baseline against current core-skills contract:
  - test harness now keeps core skills enabled (`PUMUKI_DISABLE_CORE_SKILLS=0`) to avoid false gate blocks from scope/platform compliance rules,
  - restored passing regression set for affected suite.

## [6.3.24] - 2026-02-27

### Added

- New deterministic local loop runner workflow in lifecycle CLI:
  - `pumuki loop run --objective=<text> [--max-attempts=<n>]`
  - `pumuki loop status --session=<id>`
  - `pumuki loop stop --session=<id>`
  - `pumuki loop resume --session=<id>`
  - `pumuki loop list`
  - `pumuki loop export --session=<id> --output-json=<path>`
- Session contract and local deterministic store for loop execution:
  - `integrations/lifecycle/loopSessionContract.ts`
  - `integrations/lifecycle/loopSessionStore.ts`
- Per-attempt loop evidence snapshots:
  - `.pumuki/loop-sessions/<session-id>.attempt-<n>.json`

### Changed

- `pumuki loop run` now executes one strict fail-fast gate attempt (`workingTree` scope) and persists outcome/evidence atomically.
- Documentation updated with loop commands and runtime semantics:
  - `README.md`
  - `docs/product/USAGE.md`

### Fixed

- Stabilized waiver test against clock drift by using a future deterministic expiry in:
  - `integrations/git/__tests__/tddBddEnforcement.test.ts`
- Aligned `VERSION` file with active package line (`v6.3.24`).

## [6.3.23] - 2026-02-27

### Changed

- Restored README hero behavior to the prior full-width classic brand rendering:
  - `<img src="assets/logo.png" alt="Pumuki" width="100%" />`
- Keeps a deterministic, simple image path for npm and GitHub renderers.

## [6.3.22] - 2026-02-27

### Changed

- Final README hero render fix for npm/GitHub consistency:
  - switched hero asset reference from SVG to raster banner PNG:
    - `![Pumuki](assets/logo_banner.png)`
  - added generated `assets/logo_banner.png` (2400x720) to avoid npm SVG rendering differences.

## [6.3.21] - 2026-02-27

### Changed

- Forced root `README.md` hero banner to explicit full-width rendering using HTML:
  - `<img src=\"assets/logo_banner.svg\" alt=\"Pumuki\" width=\"100%\" />`

## [6.3.20] - 2026-02-27

### Changed

- Restored root `README.md` hero image to full-width banner rendering (`assets/logo_banner.svg`).

## [6.3.19] - 2026-02-27

### Changed

- Restored root `README.md` hero image to classic `assets/logo.png` rendering.

### Added

- Added a friendly GitHub star reminder section at the end of root `README.md`.

## [6.3.18] - 2026-02-27

### Added

- Added production operations policy document at `docs/operations/production-operations-policy.md` with:
  - SaaS operation scope
  - minimum SLO/SLA targets
  - incident severity and response expectations
  - alerting baseline and go-live checklist
- Added dedicated README walkthrough document at `docs/operations/framework-menu-consumer-walkthrough.md` for menu Option 1 captures.
- Added explicit collaboration section in root `README.md` with contributor expectations and minimum validation commands.

### Changed

- Root `README.md` was rebuilt with enterprise-first structure:
  - audience split (consumer, maintainers, platform owners)
  - 5-minute consumer quick start moved to top
  - framework-only commands separated from consumer commands
  - troubleshooting expanded with validated failure modes and required flags
  - documentation index expanded and normalized
- Updated docs index and usage/install guides to include operations policy and walkthrough references:
  - `docs/README.md`
  - `docs/product/USAGE.md`
  - `docs/product/INSTALLATION.md`
- Validation command documentation now reflects real prerequisites and execution semantics:
  - required flags for `validation:*` scripts (`--repo`, `--repo-path`, `--skip-workflow-lint`)
  - non-zero diagnostic verdict behavior documented (`BLOCKED`, `PENDING`, `MISSING_INPUTS`).

### Fixed

- Corrected legacy parity report command syntax in docs to required `--legacy=<path>` and `--enterprise=<path>` argument format.
- Corrected custom skills import documentation to use real absolute `SKILL.md` source paths instead of placeholder pseudo-paths.

## [6.3.17] - 2026-02-20

### Added

- Introduced deterministic `repo_state.lifecycle.hard_mode` capture in evidence generation (`.pumuki/hard-mode.json` persisted and normalized into `.ai_evidence.json`).
- Added lifecycle adapter scaffolding command surface:
  - `pumuki adapter install --agent=<codex|claude|cursor|windsurf|opencode> [--dry-run]`
  - `npm run adapter:install -- --agent=<name>`
- Added framework menu hard-mode configuration action for enterprise operation (`Configure hard mode enforcement (enterprise)`).

### Changed

- Unified AI Gate contract now carries resolved policy trace for all stages, including `PRE_WRITE` mapped deterministically to `PRE_COMMIT` policy resolution.
- Enterprise MCP tool `ai_gate_check` now returns resolved policy metadata (`policy.stage`, `policy.resolved_stage`, `policy.trace`) in the tool result envelope.
- Refreshed `README.md` with enterprise-first onboarding structure (quickstart, hard mode, PRE_WRITE chain contract, lifecycle/adapters, MCP map).

### Fixed

- Closed PRE_WRITE/MCP policy drift by propagating the same hard-mode persisted policy trace used in `PRE_COMMIT/PRE_PUSH/CI`.

## [6.3.16] - 2026-02-20

### Fixed

- MCP evidence `/status` now guarantees `evidence.exists` as a strict boolean across `missing`, `invalid`, and `valid` evidence states (no `null` ambiguity), while preserving `evidence.present` as compatibility alias.
- Evidence runtime consolidation now deduplicates base/skills overlaps with deterministic semantic collision keys (`stage+platform+file+anchor+family`), preserving suppressed traceability metadata (`replacedByRuleId`, `replacementRuleId`, `platform`, `reason`).
- Runtime dependency `ts-morph` minimum version is now `>=27.0.2`, removing the high-severity production chain `ts-morph -> @ts-morph/common -> minimatch<10.2.1`; `npm audit --omit=dev` is now clean (`0` vulnerabilities).
- Fixed strict TypeScript typing in `integrations/evidence/buildEvidence.ts` (`normalizeAnchorLine`) to avoid union narrowing errors during `tsc --noEmit`.

### Changed

- Consolidated official documentation index and references to the active enterprise set only.
- Updated governance references from `CLAUDE.md` to `PUMUKI.md` across active docs.

### Removed

- Deprecated documentation artifacts and duplicated image mirrors under `docs/images/*`.
- Legacy docs-hygiene command path from package scripts and framework menu maintenance actions.
- Docs-hygiene-only guardrail tests and helper scripts that were not part of runtime enforcement.

## [6.3.15] - 2026-02-19

### Fixed

- Removed unused runtime dependency `glob` from `dependencies` to eliminate the vulnerable consumer chain `pumuki -> glob -> minimatch` without changing the Node.js support baseline (`>=18`).
- Regenerated lockfile after dependency cleanup to keep published manifest deterministic.

## [6.3.14] - 2026-02-18

### Added

- New lifecycle command `pumuki remove` to perform enterprise cleanup and dependency removal in one step:
  - removes managed hooks and lifecycle local state,
  - purges untracked evidence artifacts,
  - uninstalls `pumuki` from the consumer `package.json`,
  - package canonical name migrated from `pumuki-ast-hooks` to `pumuki` for enterprise UX (`npm install pumuki`),
  - prunes orphan `node_modules/.package-lock.json` residue when `node_modules` has no other content.
- OpenSpec+SDD enterprise baseline:
  - new SDD integration module at `integrations/sdd/*` (policy, session store, OpenSpec CLI adapter),
  - new commands `pumuki sdd status`, `pumuki sdd session`, `pumuki sdd validate`,
  - new pre-write gate command `pumuki-pre-write` / `pumuki:sdd:pre-write`,
  - SDD enforcement integrated across `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, and `CI`,
  - emergency bypass support `PUMUKI_SDD_BYPASS=1` with explicit evidence traceability.
- New enterprise MCP server `pumuki-mcp-enterprise`:
  - resources: `evidence://status`, `gitflow://state`, `context://active`, `sdd://status`, `sdd://active-change`,
  - tools: `ai_gate_check`, `check_sdd_status`, `validate_and_fix`, `sync_branches`, `cleanup_stale_branches`,
  - fail-safe response envelope for `/tool` executions with deterministic JSON.

### Changed

- Stage-gates test execution now uses glob-based test targets for easier maintenance.
- Lifecycle bootstrap/update now manage OpenSpec compatibility automatically:
  - `pumuki install` bootstraps OpenSpec when missing,
  - `pumuki update --latest` migrates legacy `openspec` package to `@fission-ai/openspec` when needed.
- Evidence v2.1 payload now includes SDD observability:
  - `sdd_metrics` section in snapshot payload,
  - SDD blocking findings emitted with `source: "sdd-policy"`.
- Active documentation guardrails now enforce:
  - English-only baseline for active enterprise docs.
  - Local markdown reference integrity for active docs.
- Interactive framework menu now defaults to `Consumer` mode and separates the full surface behind `Advanced` mode (`A` to switch, `C` to return), with short inline help per option.

### Fixed

- Package smoke runner export wiring was restored for staged payload setup (`validation:package-smoke` / `validation:package-smoke:minimal`).
- `pumuki remove` now prunes only directories traceable to the Pumuki dependency tree, guaranteeing third-party dependency folders are never removed.
- `pumuki-pre-push` now fails safe when the branch has no upstream configured, returning `exit 1` with an explicit guidance message instead of silently evaluating `HEAD..HEAD`.
- Lifecycle git command execution now suppresses expected git stderr in fail-safe paths to avoid noisy output during deterministic tests.
- Framework menu report actions now resolve runner scripts from both consumer repo root and installed package root, enabling report generation from `npx pumuki-framework` in consumer repositories.
- Evidence traceability is now attached deterministically at evaluation time:
  - findings include `filePath`/`lines` when traceable from matched facts,
  - evidence v2.1 persists `matchedBy` and `source` for snapshot + compatibility violations,
  - baseline/skills findings no longer collapse to `file: "unknown"` when matching facts are available.

### Refactored

- Script-level SRP split for Phase 5 closure/status builders and adapter real-session evaluation/parsing helpers.

## [6.3.5] - 2026-02-10

### Added

- Deterministic guardrails for active documentation quality:
  - IDE/provider-agnostic language in active docs.
  - English-only baseline in active docs.
  - Index coverage and markdown-reference integrity checks.

### Changed

- Stage-gates suite expanded to include docs quality and package smoke export-contract guardrails.

### Fixed

- Package smoke staged payload export contract regression in repo setup helpers.

## Notes

- Canonical v2.x release narrative and operational detail live in:
  - `docs/operations/RELEASE_NOTES.md`
- Historical commit-level trace remains available via:
  - `git log`
  - `git show`
