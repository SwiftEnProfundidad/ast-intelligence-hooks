# Installation Guide (v2.x)

This guide covers the active setup for the deterministic framework implementation in this repository.
From v2.x, SDD with OpenSpec is part of the default enterprise installation path.

This file is only for installation, bootstrap and first verification.
For daily operation after setup, use:

- `docs/product/USAGE.md`
- `PUMUKI.md`

For production SaaS operation requirements (SLO/SLA, incident model, alerting), see:
- `docs/operations/production-operations-policy.md`

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

The package `postinstall` runs **`pumuki install` only** (Git hooks + lifecycle wiring). It does **not** configure any IDE or MCP; that is intentional so Pumuki stays **repo-generic**. Use step 2 or `pumuki install --with-mcp --agent=<name>` when you want IDE integration.

### 2) Bootstrap managed lifecycle (recommended single command)

```bash
npx --yes pumuki bootstrap --enterprise --agent=codex
```

Behavior:
- Installs managed hooks (`pre-commit`, `pre-push`).
- Auto-installs `@fission-ai/openspec@latest` when OpenSpec is missing/incompatible (when `package.json` exists).
- Scaffolds `openspec/` baseline if missing (`project` file plus archive/spec placeholders).
- Bootstraps `.ai_evidence.json` when missing (deterministic empty baseline with repo state snapshot).
- Scaffolds adapter wiring (`.pumuki/adapter.json` by default) and runs `doctor --deep` automatically.

Fallback (equivalent):

```bash
npx --yes pumuki install --with-mcp --agent=codex
npx --yes pumuki doctor --deep --json
```

### 3) Verify lifecycle and SDD status

```bash
npx --yes pumuki doctor
npx --yes pumuki doctor --deep --json
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
npx --yes --package pumuki@latest pumuki-pre-write
npx --yes --package pumuki@latest pumuki-pre-commit
npx --yes --package pumuki@latest pumuki-pre-push
npx --yes --package pumuki@latest pumuki-ci
```

`PRE_WRITE` JSON shape:

```bash
npx --yes pumuki sdd validate --stage=PRE_WRITE --json
```

Includes chained payload sections: `sdd`, `ai_gate`, and `telemetry.chain`.

### 6) Optional adapter scaffolding (agent/IDE)

```bash
npx --yes pumuki adapter install --agent=codex
npx --yes pumuki adapter install --agent=cursor --dry-run
npm run adapter:install -- --agent=claude
```

Supported agents: `codex`, `claude`, `cursor`, `windsurf`, `opencode`.

## After installation

Once bootstrap is complete, move to the operational docs:

- Daily usage and stage gates:
  - `docs/product/USAGE.md`
- Short operator playbook:
  - `PUMUKI.md`
- MCP references:
  - `docs/mcp/mcp-servers-overview.md`
  - `docs/mcp/evidence-context-server.md`

## Troubleshooting

### PRE_PUSH fails due to missing upstream

```bash
git push --set-upstream origin <branch>
```

### CI cannot resolve base ref

Ensure `GITHUB_BASE_REF` is present, or that `origin/main` (preferred) or `main` exists.
CI fallback order is `origin/main` -> `main` -> `HEAD`.

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

### Hooks/adapter use fragile `npx` binary resolution

Run deep doctor diagnostics and verify `adapter-wiring`:

```bash
npx --yes pumuki doctor --deep --json
```

If doctor reports fragile commands in adapter wiring, repair with:

```bash
npx --yes pumuki adapter install --agent=codex
```

Notes for repos with `:` in path:
- Avoid adapter/hook commands that mutate `PATH` inline (for example `PATH="...:$PATH" npx ...`).
- Prefer generated commands from `pumuki adapter install` (local bin / local node entry / `npx --package` fallback).
