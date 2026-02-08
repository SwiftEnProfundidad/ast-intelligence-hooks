# Installation Guide (v2.x)

This guide covers the active setup for the deterministic framework implementation in this repository.

## Prerequisites

- Node.js `>=18`
- npm `>=9`
- Git repository initialized

Verify:

```bash
node --version
npm --version
git --version
```

## Clone and install

```bash
git clone https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm ci
```

## Validate local environment

```bash
npm run typecheck
npm run test:deterministic
```

If both commands pass, the workspace is ready.

## Run the framework locally

### Interactive menu

```bash
npm run framework:menu
```

Menu includes deterministic gate actions and optional operational diagnostics adapters.

Optional adapter readiness check:

```bash
npm run validation:adapter-readiness -- \
  --windsurf-report docs/validation/windsurf-real-session-report.md \
  --out docs/validation/adapter-readiness.md

npm run validation:adapter-session-status -- \
  --out docs/validation/windsurf-session-status.md

npm run validation:adapter-real-session-report -- \
  --status-report docs/validation/windsurf-session-status.md \
  --out docs/validation/windsurf-real-session-report.md
```

Note: the current adapter implementation uses `--windsurf-report` as the adapter input flag.

### Direct stage runners

```bash
# PRE_COMMIT
npx tsx integrations/git/preCommitIOS.cli.ts

# PRE_PUSH
npx tsx integrations/git/prePushBackend.cli.ts

# CI
npx tsx integrations/git/ciFrontend.cli.ts
```

## Optional: enable heuristic pilot

```bash
PUMUKI_ENABLE_AST_HEURISTICS=true npx tsx integrations/git/prePushIOS.cli.ts
```

## CI workflows

The repository ships reusable and platform workflows:

- `.github/workflows/pumuki-gate-template.yml`
- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`

Each run uploads `.ai_evidence.json` artifact.

## MCP evidence context server

Start read-only evidence server:

```bash
npm run mcp:evidence
```

Reference: `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`.

## Evidence file

Execution writes deterministic state to `.ai_evidence.json`.

Schema reference: `docs/evidence-v2.1.md`.

## Troubleshooting

### PRE_PUSH fails due to missing upstream

```bash
git branch --set-upstream-to origin/<branch>
```

### CI cannot resolve base ref

Ensure `GITHUB_BASE_REF` is present or that `origin/main` exists.

### No findings while expecting violations

Confirm changed files match supported platform paths/extensions consumed by platform detectors.
