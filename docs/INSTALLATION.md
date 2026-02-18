# Installation Guide (v2.x)

This guide covers the active setup for the deterministic framework implementation in this repository.
From v2.x, SDD with OpenSpec is part of the default enterprise installation path.

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

## Enterprise consumer installation (recommended)

### 1) Install package

```bash
npm install --save-exact pumuki
```

### 2) Install managed lifecycle and OpenSpec bootstrap

```bash
npx --yes pumuki install
```

Behavior:
- Installs managed hooks (`pre-commit`, `pre-push`).
- Auto-installs `@fission-ai/openspec@latest` when OpenSpec is missing/incompatible (when `package.json` exists).
- Scaffolds `openspec/` baseline if missing (`project` file plus archive/spec placeholders).

### 3) Verify lifecycle and SDD status

```bash
npx --yes pumuki doctor
npx --yes pumuki status
npx --yes pumuki sdd status
```

### 4) Open active SDD session

```bash
npx --yes pumuki sdd session --open --change=<change-id>
```

Optional maintenance:

```bash
npx --yes pumuki sdd session --refresh
npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

### 5) Run gates

```bash
npx --yes pumuki-pre-write
npx --yes pumuki-pre-commit
npx --yes pumuki-pre-push
npx --yes pumuki-ci
```

## Run the framework locally

### Interactive menu

```bash
npm run framework:menu
```

Menu starts in `Consumer` mode by default (focused options for day-to-day gate usage).
Use `A` to switch to the full `Advanced` menu and `C` to switch back.
Each option includes a short inline description.

### Direct stage runners

```bash
# PRE_WRITE
npx --yes pumuki-pre-write

# PRE_COMMIT
npx --yes pumuki-pre-commit

# PRE_PUSH
npx --yes pumuki-pre-push

# CI
npx --yes pumuki-ci
```

## Lifecycle + SDD commands

```bash
# package level
npm install --save-exact pumuki
npm update pumuki
npm uninstall pumuki

# lifecycle
npx --yes pumuki install
npx --yes pumuki update --latest
npx --yes pumuki doctor
npx --yes pumuki status
npx --yes pumuki uninstall --purge-artifacts
npx --yes pumuki remove

# sdd
npx --yes pumuki sdd status
npx --yes pumuki sdd validate --stage=PRE_WRITE
npx --yes pumuki sdd validate --stage=PRE_COMMIT
npx --yes pumuki sdd validate --stage=PRE_PUSH
npx --yes pumuki sdd validate --stage=CI
npx --yes pumuki sdd session --open --change=<change-id>
npx --yes pumuki sdd session --refresh
npx --yes pumuki sdd session --close
```

Notes:
- `pumuki remove` is the deterministic teardown path (`hooks + state + managed artifacts + dependency removal`).
- Plain `npm uninstall pumuki` removes only the dependency entry.
- `pumuki update --latest` migrates legacy `openspec` package to `@fission-ai/openspec` when required.

## Guardrails

- `pumuki install` / `pumuki update` block when tracked files exist under `node_modules`.
- `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, and `CI` enforce SDD/OpenSpec policy.

Emergency bypass (incident-only):

```bash
PUMUKI_SDD_BYPASS=1 npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

Remove bypass immediately after remediation.

## CI workflows

The repository ships reusable and platform workflows:

- `.github/workflows/pumuki-gate-template.yml`
- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`

Each run uploads `.ai_evidence.json` artifact.

## MCP servers

```bash
npm run mcp:evidence
npm run mcp:enterprise
```

References:
- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/MCP_SERVERS.md`

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

### SDD blocks installation or gates

```bash
npx --yes pumuki sdd status
npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

Then reopen/refresh active session:

```bash
npx --yes pumuki sdd session --open --change=<change-id>
npx --yes pumuki sdd session --refresh
```
