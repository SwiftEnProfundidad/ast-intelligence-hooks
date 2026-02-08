# Usage Guide (v2.x)

This guide describes the deterministic gate flow implemented in this repository.

## Prerequisites

- Node.js `>=18`
- npm `>=9`
- Git repository with tracked files

Install dependencies:

```bash
npm ci
```

## Gate stages and policies

| Stage | Input scope | blockOnOrAbove | warnOnOrAbove |
|---|---|---|---|
| `PRE_COMMIT` | `git diff --cached` | `CRITICAL` | `ERROR` |
| `PRE_PUSH` | `upstream..HEAD` | `ERROR` | `WARN` |
| `CI` | `baseRef..HEAD` | `ERROR` | `WARN` |

Policy source: `integrations/gate/stagePolicies.ts`.

## Run locally

### 1) Interactive menu

```bash
npm run framework:menu
```

Menu supports staged evaluation, commit-range evaluation, evidence reading, and CI runner entrypoints.

Optional diagnostics adapters (provider-specific runtime diagnostics and consumer startup triage) are also exposed from the menu, but they are not required for PRE_COMMIT/PRE_PUSH/CI gate outcomes.

Adapter readiness diagnostics are available from the interactive menu as:

- `Build adapter readiness report`
- `Build phase5 execution closure status report`

### 2) Direct stage CLI execution

```bash
# PRE_COMMIT
npx tsx integrations/git/preCommitIOS.cli.ts

# PRE_PUSH
npx tsx integrations/git/prePushBackend.cli.ts

# CI
npx tsx integrations/git/ciFrontend.cli.ts
```

Notes:
- CLI wrappers call shared stage runners via `integrations/git/runCliCommand.ts`.
- Execution path is centralized in `integrations/git/runPlatformGate.ts`.
- Platform detection is multi-platform and combined per run.

### 3) Diagnostics reports (optional adapters)

```bash
# Adapter-only readiness
# (current adapter implementation consumes --adapter-report as input path)
npm run validation:adapter-readiness -- \
  --adapter-report docs/validation/adapter-real-session-report.md \
  --out docs/validation/adapter-readiness.md

# Adapter runtime status/report aliases (provider-agnostic command naming)
npm run validation:adapter-session-status -- \
  --out docs/validation/adapter-session-status.md

npm run validation:adapter-real-session-report -- \
  --status-report docs/validation/adapter-session-status.md \
  --out docs/validation/adapter-real-session-report.md

# Phase 5 consolidated readiness (consumer triage required, adapter report optional by default)
npm run validation:phase5-blockers-readiness -- \
  --consumer-triage-report docs/validation/consumer-startup-triage-report.md \
  --out docs/validation/phase5-blockers-readiness.md

# Phase 5 execution-closure status snapshot
npm run validation:phase5-execution-closure-status -- \
  --phase5-blockers-report docs/validation/phase5-blockers-readiness.md \
  --consumer-unblock-report docs/validation/consumer-startup-unblock-status.md \
  --out docs/validation/phase5-execution-closure-status.md
```

## Scope behavior

### PRE_COMMIT

- Reads staged changes with `git diff --cached --name-status`.
- Builds facts from staged content.

### PRE_PUSH

- Resolves upstream with `git rev-parse @{u}`.
- Evaluates `upstream..HEAD` commit range.

### CI

- Resolves base ref from `GITHUB_BASE_REF` when available.
- Fallback base ref: `origin/main`.
- Evaluates `baseRef..HEAD`.

Resolver source: `integrations/git/resolveGitRefs.ts`.

## Evidence output

Each run writes deterministic evidence to:

- `.ai_evidence.json`

Schema and behavior:

- `version: "2.1"` is the source of truth
- `snapshot` + `ledger`
- `platforms` and `rulesets` tracking
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

### No upstream configured for PRE_PUSH

Set upstream once:

```bash
git branch --set-upstream-to origin/<branch>
```

### Empty evidence or PASS with no findings

Confirm changed files match supported extensions and platform paths expected by detectors.

### CI base ref mismatch

Set `GITHUB_BASE_REF` in CI context or ensure `origin/main` exists.
