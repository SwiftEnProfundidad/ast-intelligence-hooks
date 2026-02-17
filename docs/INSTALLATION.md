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
  --adapter-report .audit-reports/adapter/adapter-real-session-report.md \
  --out .audit-reports/adapter/adapter-readiness.md

npm run validation:adapter-session-status -- \
  --out .audit-reports/adapter/adapter-session-status.md

npm run validation:adapter-real-session-report -- \
  --status-report .audit-reports/adapter/adapter-session-status.md \
  --out .audit-reports/adapter/adapter-real-session-report.md
```

Note: the current adapter implementation uses `--adapter-report` as the adapter input flag.

### Direct stage runners

```bash
# PRE_COMMIT
npx tsx integrations/git/preCommitIOS.cli.ts

# PRE_PUSH
npx tsx integrations/git/prePushBackend.cli.ts

# CI
npx tsx integrations/git/ciFrontend.cli.ts
```

## Lifecycle commands (enterprise consumer repositories)

Install the package from npm (canonical enterprise command):

```bash
npm install --save-exact pumuki
```

Install managed Git hooks in the current repository:

```bash
npx --yes pumuki install
```

Run lifecycle doctor before rollout:

```bash
npx --yes pumuki doctor
```

Uninstall and purge untracked Pumuki artifacts:

```bash
npx --yes pumuki uninstall --purge-artifacts
```

One-command cleanup and package removal:

```bash
npx --yes pumuki remove
```

Use this command instead of plain `npm uninstall pumuki` when you need deterministic lifecycle cleanup.
It also removes orphan `node_modules/.package-lock.json` residue when `node_modules` has no other entries.
Plain `npm uninstall pumuki` removes only the dependency entry and leaves managed hooks/lifecycle state untouched.

Update to latest published Pumuki and re-apply hooks:

```bash
npx --yes pumuki update --latest
```

Package-level updates/removal also support short npm commands:

```bash
npm update pumuki
npm uninstall pumuki
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
