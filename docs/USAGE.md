# Usage Guide (v2.x)

This guide describes the deterministic gate flow implemented in this repository.
From v2.x, SDD with OpenSpec is mandatory for enterprise gate execution.

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
| `PRE_COMMIT` | `git diff --cached` | `CRITICAL` | `ERROR` |
| `PRE_PUSH` | `upstream..HEAD` | `ERROR` | `WARN` |
| `CI` | `baseRef..HEAD` | `ERROR` | `WARN` |

Policy source: `integrations/gate/stagePolicies.ts`.

## Mandatory SDD/OpenSpec flow

Pumuki enforces OpenSpec policy/session before allowing normal gate execution.

Minimal daily flow:

```bash
# bootstrap lifecycle + OpenSpec baseline when needed
npx --yes pumuki install

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
npx --yes pumuki-framework
```

Menu starts in `Consumer` mode by default (focused operational options).
Use `A` to switch to `Advanced` mode (full options), and `C` to return to `Consumer`.
Each option now includes a short inline description in the interactive list.
If needed, you can start directly in advanced mode:

```bash
PUMUKI_MENU_MODE=advanced npm run framework:menu
```

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

### 2) Direct stage CLI execution

```bash
# PRE_COMMIT
npx --yes pumuki-pre-commit

# PRE_PUSH
npx --yes pumuki-pre-push

# CI
npx --yes pumuki-ci

# PRE_WRITE (SDD pre-write policy check)
npx --yes pumuki-pre-write
```

### 2.1) Lifecycle + SDD CLI (install / uninstall / remove / update / doctor / status / sdd)

Canonical npm package commands:

```bash
npm install --save-exact pumuki
npm update pumuki
npm uninstall pumuki
```

`npm upgrade pumuki` is valid where npm maps `upgrade` to `update`.

```bash
# install managed hooks
npx --yes pumuki install

# inspect enterprise baseline safety checks
npx --yes pumuki doctor

# show lifecycle status
npx --yes pumuki status

# show SDD/OpenSpec status snapshot
npx --yes pumuki sdd status

# validate SDD policy by stage
npx --yes pumuki sdd validate --stage=PRE_COMMIT

# manage SDD session lifecycle
npx --yes pumuki sdd session --open --change=<change-id>
npx --yes pumuki sdd session --refresh
npx --yes pumuki sdd session --close

# update dependency to latest and re-apply hooks
npx --yes pumuki update --latest

# uninstall managed hooks and purge untracked evidence artifacts
npx --yes pumuki uninstall --purge-artifacts

# one-command cleanup + dependency removal from package.json
npx --yes pumuki remove
```

`pumuki remove` is the enterprise-safe removal path because it performs lifecycle cleanup before package uninstall.
When no modules remain, it also prunes orphan `node_modules/.package-lock.json` residue.
Plain `npm uninstall pumuki` removes only the dependency; it does not remove managed hooks or lifecycle state.

OpenSpec integration behavior:
- `pumuki install` auto-bootstraps OpenSpec (`@fission-ai/openspec`) when missing/incompatible and scaffolds `openspec/` project baseline when absent.
- `pumuki update --latest` migrates legacy `openspec` package to `@fission-ai/openspec` before hook reinstall.

Safety rule:
- If tracked files exist under `node_modules/`, `pumuki install` and `pumuki update` intentionally fail.
- This prevents lifecycle contamination in enterprise repositories.

Notes:
- CLI wrappers call shared stage runners via `integrations/git/runCliCommand.ts`.
- Execution path is centralized in `integrations/git/runPlatformGate.ts`.
- Platform detection is multi-platform and combined per run.

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

- Runs SDD pre-write guardrail before continuing editing flow.
- Requires OpenSpec installed, compatible, initialized, and valid active session.

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
