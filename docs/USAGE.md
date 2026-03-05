# Usage Guide (v2.x)

This guide describes the deterministic gate flow implemented in this repository.
From v2.x, SDD with OpenSpec is mandatory for enterprise gate execution.

Production operations baseline (SLA/SLO, incident response and alerting):
- `docs/OPERATIONS.md`

Visual walkthrough for menu Option 1 captures:
- `docs/README_MENU_WALKTHROUGH.md`

## Prerequisites

- Node.js `>=18`
- npm `>=9`
- Git repository with tracked files
- OpenSpec session workflow enabled (managed by `pumuki sdd session ...`)

Install dependencies:

```bash
npm ci
```

## Gate stages and policies

| Stage | Input scope | blockOnOrAbove | warnOnOrAbove |
|---|---|---|---|
| `PRE_WRITE` | local write-time check | `ERROR` (SDD policy) | `WARN` |
| `PRE_COMMIT` | `git diff --cached` | `ERROR` | `WARN` |
| `PRE_PUSH` | `upstream..HEAD` | `ERROR` | `WARN` |
| `CI` | `baseRef..HEAD` | `ERROR` | `WARN` |

Policy source: `integrations/gate/stagePolicies.ts`.

Coverage guardrail:

- In `PRE_COMMIT`, `PRE_PUSH` and `CI`, Pumuki requires complete rule evaluation coverage.
- If any active rule is not evaluated (`unevaluated_rule_ids` not empty), gate emits `governance.rules.coverage.incomplete` and forces `BLOCK`.
- If any AUTO skills rule is active without mapped detector (`unsupported_auto_rule_ids` not empty), gate emits `governance.skills.detector-mapping.incomplete` and forces `BLOCK`.
- Coverage telemetry is persisted in `.ai_evidence.json` under `snapshot.rules_coverage`.

Audit mode telemetry:

- `snapshot.audit_mode = gate` for strict enforcement runs.
- `snapshot.audit_mode = engine` for full-diagnostics runs.
- Severity metrics are persisted in both legacy and enterprise projections:
  - `severity_metrics.by_severity` (`CRITICAL/ERROR/WARN/INFO`)
  - `severity_metrics.by_enterprise_severity` (`CRITICAL/HIGH/MEDIUM/LOW`)

## Skills rules engine (effective lock)

Skills are resolved in deterministic precedence order:

1. Core embedded lock (package snapshot, runtime-safe)
2. Repo lock (`skills.lock.json`, optional)
3. Custom local rules (`/.pumuki/custom-rules.json`, optional)

Conflict policy: `custom > repo > core` by `ruleId`.

Platform activation:

- `ios/android/backend/frontend` rules activate only when platform is detected.
- `generic/text` rules remain active as cross-platform constraints.

## Mandatory SDD/OpenSpec flow

Pumuki enforces OpenSpec policy/session before allowing normal gate execution.

Minimal daily flow:

```bash
# bootstrap lifecycle + OpenSpec + MCP wiring + doctor deep
npx --yes pumuki bootstrap --enterprise --agent=codex

# inspect current SDD status
npx --yes pumuki sdd status

# open active change session
npx --yes pumuki sdd session --open --change=<change-id>

# optional refresh during long sessions
npx --yes pumuki sdd session --refresh

# explicit policy validation per stage
npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

If policy blocks, expected decision codes include:
- `OPENSPEC_MISSING`
- `OPENSPEC_VERSION_UNSUPPORTED`
- `OPENSPEC_PROJECT_MISSING`
- `SDD_SESSION_MISSING`
- `SDD_SESSION_INVALID`
- `SDD_CHANGE_MISSING`
- `SDD_CHANGE_ARCHIVED`
- `SDD_VALIDATION_FAILED`
- `SDD_VALIDATION_ERROR`

## Run locally

### 1) Interactive menu

Framework repository (maintainers):

```bash
npm run framework:menu
```

Consumer repository:

```bash
npx --yes --package pumuki@latest pumuki-framework
```

Menu starts in `Consumer` mode by default (focused operational options).
Use `A` to switch to `Advanced` mode (full options), and `C` to return to `Consumer`.
Advanced mode options include short inline contextual help.
If needed, you can start directly in advanced mode:

```bash
PUMUKI_MENU_MODE=advanced npm run framework:menu
```

UI renderer rollout:

```bash
# Classic renderer (default)
PUMUKI_MENU_UI_V2=0 npm run framework:menu

# Modern renderer (grouped sections + status badges)
PUMUKI_MENU_UI_V2=1 npm run framework:menu
```

If v2 rendering fails at runtime, Pumuki automatically falls back to classic renderer.

To avoid host-specific defaults for consumer diagnostics prompts, set:

```bash
export PUMUKI_CONSUMER_REPO_PATH=/absolute/path/to/consumer-repo
```

Optional diagnostics adapters (runtime diagnostics and consumer startup triage) are also exposed from the menu, but they are not required for PRE_COMMIT/PRE_PUSH/CI gate outcomes.

Adapter readiness diagnostics are available from the interactive menu as:

- `Build adapter readiness report`
- `Build phase5 execution closure status report`
- `Run phase5 execution closure (one-shot orchestration)`
- `Clean local validation artifacts`

### 1.1) Non-interactive consumer matrix (1/2/3/4/9)

For deterministic validation without interactive prompts, run the matrix helper:

```bash
node --import tsx -e "const mod = await import('./scripts/framework-menu-matrix-runner-lib.ts'); const report = await mod.default.runConsumerMenuMatrix({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"
```

Expected output shape:

```json
{
  "byOption": {
    "1": { "stage": "PRE_COMMIT", "outcome": "BLOCK|PASS", "filesScanned": 0, "totalViolations": 0, "diagnosis": "scope-empty|repo-clean|violations-detected|unknown" },
    "2": { "stage": "PRE_PUSH", "outcome": "BLOCK|PASS", "filesScanned": 0, "totalViolations": 0, "diagnosis": "scope-empty|repo-clean|violations-detected|unknown" },
    "3": { "stage": "PRE_COMMIT", "outcome": "BLOCK|PASS", "filesScanned": 0, "totalViolations": 0, "diagnosis": "scope-empty|repo-clean|violations-detected|unknown" },
    "4": { "stage": "PRE_PUSH", "outcome": "BLOCK|PASS", "filesScanned": 0, "totalViolations": 0, "diagnosis": "scope-empty|repo-clean|violations-detected|unknown" },
    "9": { "stage": "PRE_PUSH|PRE_COMMIT", "outcome": "BLOCK|PASS", "filesScanned": 0, "totalViolations": 0, "diagnosis": "scope-empty|repo-clean|violations-detected|unknown" }
  }
}
```

Diagnosis semantics:

- `scope-empty`: selected scope has no files to evaluate (common in option `3` staged-only or option `4` working-tree).
- `repo-clean`: files were scanned and no violations were detected.
- `violations-detected`: one or more findings were produced.
- `unknown`: evidence is missing/invalid or report normalization could not resolve status.

Optional canary execution (controlled temporary violation + cleanup):

```bash
node --import tsx -e "const mod = await import('./scripts/framework-menu-matrix-canary-lib.ts'); const report = await mod.default.runConsumerMenuCanary({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"
```

### 1.2) Consumer pre-flight (legacy parity)

Consumer options `1/2/3/4` run a pre-flight check before gate execution.
The pre-flight evaluates:

- `repo_state` (branch, upstream, dirty/staged/unstaged, ahead/behind)
- AI gate consistency (`pumuki -> mcp -> ai_gate -> ai_evidence`)
- stale/missing/invalid evidence signals
- git-flow protected branch violations

Stage mapping:

- Option `1` (`repo`) -> `PRE_COMMIT`
- Option `2` (`repo+staged`) -> `PRE_PUSH`
- Option `3` (`staged`) -> `PRE_COMMIT`
- Option `4` (`working tree`) -> `PRE_PUSH`

If a scope is empty, the menu prints an explicit operational hint (`Scope vacío`), so `PASS` with zero findings is distinguishable from a clean repository scan.

System notifications (macOS) can be enabled from advanced menu option `31` (persisted in `.pumuki/system-notifications.json`).
Custom skills import is available in advanced menu option `33` (writes `/.pumuki/custom-rules.json`).
Menu-driven audits apply SDD guardrails with the same strict semantics as stage runners (no bypass).

### 2) Direct stage CLI execution

```bash
# PRE_COMMIT
npx --yes --package pumuki@latest pumuki-pre-commit

# PRE_PUSH
npx --yes --package pumuki@latest pumuki-pre-push

# CI
npx --yes --package pumuki@latest pumuki-ci

# PRE_WRITE (SDD + AI Gate pre-write policy check)
npx --yes --package pumuki@latest pumuki-pre-write
```

### 2.1) Lifecycle + SDD + Loop CLI (install / uninstall / remove / update / doctor / status / sdd / loop)

Canonical npm package commands:

```bash
npm install --save-exact pumuki
npm update pumuki
npm uninstall pumuki
```

`npm upgrade pumuki` is valid where npm maps `upgrade` to `update`.

```bash
# recommended: one-shot enterprise bootstrap
npx --yes pumuki bootstrap --enterprise --agent=codex

# fallback: separated flow
npx --yes pumuki install --with-mcp --agent=codex

# inspect enterprise baseline safety checks
npx --yes pumuki doctor
# include deterministic adapter/mcp wiring health checks
npx --yes pumuki doctor --deep --json

# show lifecycle status
npx --yes pumuki status

# proactive local watch (worktree + anti-spam notifications)
npx --yes pumuki watch --stage=PRE_COMMIT --scope=workingTree --severity=high --interval-ms=3000 --notify-cooldown-ms=30000

# one-shot watch tick (scripts/diagnostics)
npx --yes pumuki watch --once --json

# show SDD/OpenSpec status snapshot
npx --yes pumuki sdd status

# validate SDD policy by stage
npx --yes pumuki sdd validate --stage=PRE_COMMIT

# manage SDD session lifecycle
npx --yes pumuki sdd session --open --change=<change-id>
npx --yes pumuki sdd session --refresh
npx --yes pumuki sdd session --close

# reconcile AGENTS/skills.lock/policy-as-code contract
npx --yes pumuki policy reconcile --json

# scaffold deterministic scenario evidence from real test metadata
npx --yes pumuki sdd evidence --scenario-id=<scenario-id> --test-command='npm run test -- --grep <scenario-id>' --test-status=passed --dry-run --json

# sync scenario state into board artifact (dry-run/apply + conflict-safe)
npx --yes pumuki sdd state-sync --scenario-id=<scenario-id> --status=in_progress --dry-run --json

# local hotspots analytics and SaaS publication diagnostics
npx --yes pumuki analytics hotspots report --top=10 --since-days=90 --json
npx --yes pumuki analytics hotspots diagnose --json

# local deterministic loop sessions (fail-fast gate per attempt)
npx --yes pumuki loop run --objective="stabilize gate before commit" --max-attempts=3 --json
npx --yes pumuki loop status --session=<session-id> --json
npx --yes pumuki loop stop --session=<session-id> --json
npx --yes pumuki loop resume --session=<session-id> --json
npx --yes pumuki loop list --json
npx --yes pumuki loop export --session=<session-id> --output-json=.audit-reports/loop-session.json

# update dependency to latest and re-apply hooks
npx --yes pumuki update --latest

# uninstall managed hooks and purge untracked evidence artifacts
npx --yes pumuki uninstall --purge-artifacts

# one-command cleanup + dependency removal from package.json
npx --yes pumuki remove

# adapter scaffolding for agent/IDE repositories
npx --yes pumuki adapter install --agent=codex --dry-run
npx --yes pumuki adapter install --agent=cursor
npm run adapter:install -- --agent=claude

# skills engine helpers
npm run skills:compile
npm run skills:lock:check
npm run skills:import:custom
npm run skills:import:custom -- --source /abs/path/to/SKILL.md --source ./skills/backend/SKILL.md
```

`pumuki remove` is the enterprise-safe removal path because it performs lifecycle cleanup before package uninstall.
When no modules remain, it also prunes orphan `node_modules/.package-lock.json` residue.
Plain `npm uninstall pumuki` removes only the dependency; it does not remove managed hooks or lifecycle state.

Loop runtime behavior:
- `pumuki loop run` creates a session in `.pumuki/loop-sessions/`.
- Each run executes one gate attempt on `workingTree`.
- Gate policy is strict fail-fast: a blocked attempt returns exit code `1` and status `blocked`.
- Per-attempt evidence is persisted as `.pumuki/loop-sessions/<session-id>.attempt-<n>.json`.

Watch runtime behavior:
- `pumuki watch` evaluates gate policy on local changes and emits terminal summaries on each evaluation tick.
- `--severity` defines notification threshold (`critical|high|medium|low`) without changing gate block policy.
- `--notify-cooldown-ms` enables anti-spam throttling for repeated alerts with equal signature.
- `--no-notify` keeps watch output without OS notifications.
- `--once` or `--iterations=<n>` is recommended for CI/scripts to avoid long-running sessions.

<a id="backlog-tooling"></a>
Backlog tooling behavior (`watch` + `reconcile` scripts):
- mapping precedence is deterministic: inline `#issue` -> `--id-issue-map-from` -> `--id-issue-map` -> `--resolve-missing-via-gh`.
- `watch-consumer-backlog` is non-destructive and reports action-required drift.
- `watch-consumer-backlog` reports heading drift (`heading_drift`) when section headers `### ✅/🚧/⏳/⛔ <ID>` diverge from effective table status.
- `watch-consumer-backlog --json` exposes `heading_drift_count` for low-friction alerting parsers.
- `watch-consumer-backlog --json` exposes `classification_counts` (`needs_issue`, `drift_closed_issue`, `active_issue`, `heading_drift`).
- `watch-consumer-backlog --json` exposes `action_required_reasons` when findings are active.
- `watch-consumer-backlog --json` exposes `next_command` when action is required (safe reconcile sequence).
- `watch-consumer-backlog --json` exposes `next_command_reason` when `next_command` is present.
- `watch-consumer-backlog --json` exposes `next_commands[]` (ordered dry-run/apply steps) when action is required.
- `watch-consumer-backlog --json` includes `next_commands[].id` (1-based stable order).
- `watch-consumer-backlog --json` includes `next_commands[].safety` (`read_only` | `mutating`) for orchestration safety.
- `watch-consumer-backlog --json` includes `next_commands[].idempotent` for retry-safe orchestration.
- `watch-consumer-backlog --json` includes `next_commands[].estimated_duration_ms` for timeout/scheduling hints.
- `watch-consumer-backlog --json` includes `next_commands[].requires_confirmation` for safe mutating-step execution.
- `watch-consumer-backlog --json` includes `next_commands[].depends_on` for step sequencing (`null` for dry-run, `dry_run` for apply).
- `watch-consumer-backlog --json` includes `next_commands[].description` for human-readable step guidance.
- `watch-consumer-backlog` (modo humano) imprime `action_required_reasons=<...|none>`.
- `watch-consumer-backlog` (modo humano) añade hint `--no-fail` cuando hay acción requerida.
- `reconcile-consumer-backlog-issues` supports dry-run/apply and now reports mapping source (`none|json|markdown|merged`).
- `reconcile-consumer-backlog-issues --json` includes heading sync metadata (`headingUpdated`, `headingChanges`) for section headings `### ✅/🚧/⏳/⛔ <ID>`.
- `reconcile-consumer-backlog-issues --json` exposes `heading_changes_count` for lightweight consumers.
- `reconcile-consumer-backlog-issues --json` exposes `classification_counts` (changes + summary counters) for dashboards.
- `reconcile-consumer-backlog-issues --json` exposes `action_required_reasons` for pending deltas in dry-run/apply flows.
- `reconcile-consumer-backlog-issues --json` exposes `next_command` when there are actionable deltas (`--json` + `--apply` sequence).
- `reconcile-consumer-backlog-issues --json` exposes `next_command_reason` when `next_command` is present.
- `reconcile-consumer-backlog-issues --json` exposes `next_commands[]` (ordered dry-run/apply steps) when action is required.
- `reconcile-consumer-backlog-issues --json` includes `next_commands[].id` (1-based stable order).
- `reconcile-consumer-backlog-issues --json` includes `next_commands[].safety` (`read_only` | `mutating`) for orchestration safety.
- `reconcile-consumer-backlog-issues --json` includes `next_commands[].idempotent` for retry-safe orchestration.
- `reconcile-consumer-backlog-issues --json` includes `next_commands[].estimated_duration_ms` for timeout/scheduling hints.
- `reconcile-consumer-backlog-issues --json` includes `next_commands[].requires_confirmation` for safe mutating-step execution.
- `reconcile-consumer-backlog-issues --json` includes `next_commands[].depends_on` for step sequencing (`null` for dry-run, `dry_run` for apply).
- `reconcile-consumer-backlog-issues --json` includes `next_commands[].description` for human-readable step guidance.
- `reconcile-consumer-backlog-issues` (modo humano) muestra `heading_changes=<n>` y lista las líneas afectadas cuando hay drift en encabezados.
- `reconcile-consumer-backlog-issues` (modo humano) imprime `action_required_reasons=<...|none>`.
- `reconcile-consumer-backlog-issues` (modo humano) añade hint de flujo seguro cuando hay deltas: `--json` (dry-run) y luego `--apply`.
<a id="backlog-reasons"></a>
- Both commands build reasons through shared logic in `scripts/backlog-action-reasons-lib.ts` to keep JSON/human parity.

Backlog tooling quick reference:

| Command | Objective |
|---|---|
| `npm run -s test:backlog-tooling` | Ejecutar suite focal de regresión del tooling de backlog. |
| `scripts/watch-consumer-backlog.ts --json` | Detectar drift accionable sin mutar archivos. |
| `scripts/reconcile-consumer-backlog-issues.ts --json` | Simular reconciliación (dry-run) y revisar cambios planeados. |
| `scripts/reconcile-consumer-backlog-issues.ts --apply` | Aplicar reconciliación sobre el backlog consumidor. |

Backlog tooling quick nav (terminal):

```bash
rg -n "backlog-tooling|backlog-reasons" docs/USAGE.md README.md
```

Backlog tooling quick examples:

```bash
# focused local regression pack for backlog tooling
npm run -s test:backlog-tooling

# watch: canonical markdown source + explicit override + optional gh lookup
npx --yes tsx@4.21.0 scripts/watch-consumer-backlog.ts \
  --file=/abs/path/consumer/PUMUKI_BUGS_MEJORAS.md \
  --repo=SwiftEnProfundidad/ast-intelligence-hooks \
  --id-issue-map-from=/abs/path/canonical/pumuki-integration-feedback.md \
  --id-issue-map=/abs/path/override.json \
  --resolve-missing-via-gh \
  --json

# reconcile dry-run: same source chain
npx --yes tsx@4.21.0 scripts/reconcile-consumer-backlog-issues.ts \
  --file=/abs/path/consumer/PUMUKI_BUGS_MEJORAS.md \
  --repo=SwiftEnProfundidad/ast-intelligence-hooks \
  --id-issue-map-from=/abs/path/canonical/pumuki-integration-feedback.md \
  --id-issue-map=/abs/path/override.json \
  --resolve-missing-via-gh \
  --json

# reconcile apply: mutate backlog in-place once dry-run is clean
npx --yes tsx@4.21.0 scripts/reconcile-consumer-backlog-issues.ts \
  --file=/abs/path/consumer/PUMUKI_BUGS_MEJORAS.md \
  --repo=SwiftEnProfundidad/ast-intelligence-hooks \
  --id-issue-map-from=/abs/path/canonical/pumuki-integration-feedback.md \
  --resolve-missing-via-gh \
  --apply
```

OpenSpec integration behavior:
- `pumuki bootstrap --enterprise --agent=<name>` orquesta `install + adapter wiring + doctor --deep` en un solo paso.
- `pumuki install` auto-bootstraps OpenSpec (`@fission-ai/openspec`) when missing/incompatible and scaffolds `openspec/` project baseline when absent.
- `pumuki install --with-mcp` adds adapter/MCP wiring bootstrap and prints MCP health summary on completion.
- `pumuki update --latest` migrates legacy `openspec` package to `@fission-ai/openspec` before hook reinstall.

Safety rule:
- If tracked files exist under `node_modules/`, `pumuki install` and `pumuki update` intentionally fail.
- This prevents lifecycle contamination in enterprise repositories.

Notes:
- CLI wrappers call shared stage runners via `integrations/git/runCliCommand.ts`.
- Execution path is centralized in `integrations/git/runPlatformGate.ts`.
- Platform detection is multi-platform and combined per run.

### 2.2) SaaS ingestion diagnostics runbook (operacion + rollback local)

Operación estándar:

```bash
# 1) generar reporte local de hotspots (fuente para contrato SaaS)
npx --yes pumuki analytics hotspots report --top=10 --since-days=90 --json

# 2) ejecutar diagnóstico SaaS multi-tenant
npx --yes pumuki analytics hotspots diagnose --json
```

Interpretación de estado (`diagnose`):
- `healthy`: contrato válido, sin errores de publicación en auditoría.
- `degraded`: falta contrato/auditoría o hay señales parciales no bloqueantes.
- `blocked`: contrato inválido o existen errores de publicación; el comando retorna `exit 1`.

Rollback seguro al modo local (sin impacto en gate local):

```bash
# restaurar configuración por defecto (si había overrides)
unset PUMUKI_SAAS_INGESTION_PAYLOAD_PATH
unset PUMUKI_SAAS_INGESTION_AUDIT_PATH
unset PUMUKI_SAAS_INGESTION_METRICS_PATH

# limpiar artefactos de publicación SaaS local
rm -f .pumuki/artifacts/hotspots-saas-ingestion-v1.json
rm -f .pumuki/artifacts/saas-ingestion-audit.ndjson
rm -f .pumuki/artifacts/saas-ingestion-metrics.json
```

Verificación post-rollback:
- `npx --yes pumuki analytics hotspots diagnose --json` puede quedar en `degraded` por artefactos ausentes.
- El flujo local de gate (`pre-write/pre-commit/pre-push/ci`) sigue operativo y no depende de publicación SaaS.

### 3) Diagnostics reports (optional adapters)

```bash
# Adapter-only readiness
# (current adapter implementation consumes --adapter-report as input path)
npm run validation:adapter-readiness -- \
  --adapter-report .audit-reports/adapter/adapter-real-session-report.md \
  --out .audit-reports/adapter/adapter-readiness.md

# Adapter runtime status/report aliases (provider-agnostic command naming)
npm run validation:adapter-session-status -- \
  --out .audit-reports/adapter/adapter-session-status.md

npm run validation:adapter-real-session-report -- \
  --status-report .audit-reports/adapter/adapter-session-status.md \
  --out .audit-reports/adapter/adapter-real-session-report.md

# Phase 5 consolidated readiness (consumer triage required, adapter report optional by default)
npm run validation:phase5-blockers-readiness -- \
  --consumer-triage-report .audit-reports/consumer-triage/consumer-startup-triage-report.md \
  --out .audit-reports/phase5/phase5-blockers-readiness.md

# Phase 5 execution-closure status snapshot
npm run validation:phase5-execution-closure-status -- \
  --phase5-blockers-report .audit-reports/phase5/phase5-blockers-readiness.md \
  --consumer-unblock-report .audit-reports/consumer-triage/consumer-startup-unblock-status.md \
  --out .audit-reports/phase5/phase5-execution-closure-status.md

# One-shot: run full Phase 5 execution-closure orchestration
npm run validation:phase5-execution-closure -- \
  --repo <owner>/<repo> \
  --out-dir .audit-reports/phase5 \
  --skip-workflow-lint

# Local mock-consumer closure (no external GH dependency)
npm run validation:phase5-execution-closure -- \
  --repo <owner>/<repo> \
  --out-dir .audit-reports/phase5 \
  --mock-consumer

# Optional: disable auth preflight fail-fast
npm run validation:phase5-execution-closure -- \
  --repo <owner>/<repo> \
  --out-dir .audit-reports/phase5 \
  --skip-workflow-lint \
  --skip-auth-preflight

# Optional: clean local generated validation artifacts
npm run validation:clean-artifacts
npm run validation:clean-artifacts -- --dry-run
```

## Scope behavior

### PRE_COMMIT

- Reads staged changes with `git diff --cached --name-status`.
- Builds facts from staged content.
- Requires valid SDD/OpenSpec status (session + active change + validation).

### PRE_PUSH

- Resolves upstream with `git rev-parse @{u}`.
- Fails safe (`exit 1`) with guidance when no upstream is configured.
- Evaluates `upstream..HEAD` commit range.
- Requires valid SDD/OpenSpec status (session + active change + validation).

### CI

- Resolves base ref from `GITHUB_BASE_REF` when available.
- Fallback base ref order: `origin/main` -> `main` -> `HEAD`.
- Evaluates `baseRef..HEAD`.
- Requires valid SDD/OpenSpec status (session + active change + validation).

### PRE_WRITE

- Runs SDD pre-write guardrail and then AI Gate validation before continuing editing flow.
- Requires OpenSpec installed, compatible, initialized, and valid active session.
- AI Gate blocks on missing/invalid/stale evidence, blocked evidence gate status, or protected branch usage.
- AI Gate applies early worktree hygiene for atomicity:
  - warning code: `EVIDENCE_PREWRITE_WORKTREE_WARN`
  - blocking code: `EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT`
  - configurable via `PUMUKI_PREWRITE_WORKTREE_HYGIENE_ENABLED`, `PUMUKI_PREWRITE_WORKTREE_WARN_THRESHOLD`, `PUMUKI_PREWRITE_WORKTREE_BLOCK_THRESHOLD`
- `pumuki sdd validate --stage=PRE_WRITE --json` returns an envelope with:
  - `sdd` (SDD decision payload)
  - `ai_gate` (AI Gate evaluation payload)
  - `ai_gate.skills_contract` (mapping `scope -> required skills/rules -> coverage active/evaluated`)
  - `telemetry.chain = "pumuki->ai_gate->ai_evidence"`

Resolver source: `integrations/git/resolveGitRefs.ts`.

## Evidence output

Each run writes deterministic evidence to:

- `.ai_evidence.json`

Schema and behavior:

- `version: "2.1"` is the source of truth
- `snapshot` + `ledger`
- `platforms` and `rulesets` tracking
- `snapshot.sdd_metrics` tracks stage-level SDD enforcement metadata
- SDD blocks emit finding `sdd.policy.blocked` with `source: "sdd-policy"`
- Rule coverage may include `unsupported_auto_rule_ids` when AUTO skills still lack detector mapping; this forces governance block in gated stages.
- `repo_state` captures deterministic git/lifecycle runtime snapshot
- stable JSON ordering for deterministic diffs

Reference: `docs/evidence-v2.1.md`.

## Rule packs and overrides

Baseline packs:

- `iosEnterpriseRuleSet`
- `backendRuleSet`
- `frontendRuleSet`
- `androidRuleSet`
- `astHeuristicsRuleSet` (optional)

Version map: `core/rules/presets/rulePackVersions.ts`.

Project overrides:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Locked rules can only be downgraded when `allowOverrideLocked: true`.

## Heuristic pilot flag

Enable AST semantic heuristics:

```bash
PUMUKI_ENABLE_AST_HEURISTICS=true npx tsx integrations/git/prePushIOS.cli.ts
```

Details: `docs/rule-packs/heuristics.md`.

## AST Intelligence dual mode (comparación legacy vs AST)

Activar modo dual:

```bash
PUMUKI_AST_INTELLIGENCE_DUAL_MODE=shadow npx --yes --package pumuki@latest pumuki-pre-commit
```

Modos soportados:

- `off` (default): no ejecuta comparación dual.
- `shadow`: añade señal informativa de divergencias sin bloquear.
- `strict`: bloquea cuando hay divergencias entre legacy y AST por nodos.

## CI workflows

- `.github/workflows/pumuki-gate-template.yml`
- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`

All upload `.ai_evidence.json` as artifact.

## Deterministic validation suite

```bash
npm run typecheck
npm run test:heuristics
npm run test:deterministic
```

## Troubleshooting

### SDD blocks local workflow

Inspect status and decision:

```bash
npx --yes pumuki sdd status
npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

Open or refresh session if needed:

```bash
npx --yes pumuki sdd session --open --change=<change-id>
npx --yes pumuki sdd session --refresh
```

### No upstream configured for PRE_PUSH

PRE_PUSH fails safe by design when the branch has no upstream.
Set upstream once:

```bash
git push --set-upstream origin <branch>
```

### Fragile hook/adapter command resolution

Use deep diagnostics to detect weak command wiring:

```bash
npx --yes pumuki doctor --deep --json
```

If `adapter-wiring` reports fragile resolution, regenerate adapter commands:

```bash
npx --yes pumuki adapter install --agent=codex
```

For repos whose absolute path includes `:`, avoid inline `PATH="...:$PATH"` wrappers in hooks/adapters.
Use generated commands from `pumuki adapter install` to keep resolution deterministic.

### Empty evidence or PASS with no findings

Confirm changed files match supported extensions and platform paths expected by detectors.

### CI base ref mismatch

Set `GITHUB_BASE_REF` in CI context, or ensure at least one default base exists:
`origin/main` (preferred) or `main` (fallback before `HEAD`).

### Emergency bypass (incident-only)

```bash
PUMUKI_SDD_BYPASS=1 npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

Use only for controlled incident recovery and remove bypass immediately after remediation.
