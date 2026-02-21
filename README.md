# Pumuki

[![npm version](https://img.shields.io/npm/v/pumuki?color=1d4ed8)](https://www.npmjs.com/package/pumuki)
[![CI](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

Enterprise governance framework for AI-assisted software delivery.

Pumuki enforces deterministic decisions across local hooks, PRE_WRITE guardrails, and CI using one execution model:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## What Pumuki Solves

Pumuki gives teams a single operational contract for AI-era code quality:

- Deterministic gate decisions with auditable evidence.
- Unified stage model: `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, `CI`.
- Multi-platform rule evaluation (iOS, Android, Backend, Frontend).
- Mandatory OpenSpec/SDD policy enforcement.
- Optional MCP runtime for agent integrations.

## Core Capabilities

### 1) Deterministic Gate + Evidence

Every stage can emit `.ai_evidence.json` with stable structure (`version: 2.1`) including:

- `snapshot` (stage/outcome/findings)
- `ledger` (persistent open violations)
- `rulesets` and `platforms`
- `sdd_metrics`
- `repo_state` (`git` + lifecycle + optional hard mode state)

Reference: `docs/evidence-v2.1.md`.

### 2) Unified AI Gate for PRE_WRITE/MCP

The same AI gate evaluator is shared across CLI and MCP:

- stale/missing/invalid evidence detection
- blocked evidence gate status detection
- protected branch guardrail (`main/master/develop/dev`)
- policy trace visibility (`default`, `skills.policy`, `hard-mode`)

Reference: `integrations/gate/evaluateAiGate.ts`.

### 3) Mandatory OpenSpec + SDD Policy

Pumuki enforces OpenSpec/SDD as first-class guardrails:

- `PRE_WRITE`: OpenSpec installed/project/session valid.
- `PRE_COMMIT`, `PRE_PUSH`, `CI`: valid session + stage validation.
- Blocking SDD findings are traceable via `source: "sdd-policy"`.

### 4) Lifecycle and Enterprise Safety

Managed lifecycle commands (`install/update/uninstall/remove`) include:

- hook management (`pre-commit`, `pre-push`)
- OpenSpec bootstrap/migration
- deterministic evidence bootstrap
- safety block when tracked files exist under `node_modules/`

### 5) Adapter Scaffolding (IDE/Agent)

Provider-agnostic adapter scaffolding for consumer repositories:

- `codex`
- `claude`
- `cursor`
- `windsurf`
- `opencode`

## Quick Start (Consumer Repository)

Prerequisites:

- `Node.js >= 18`
- `npm >= 9`
- `git`

All command/code snippets below are fenced so GitHub and npm renderers can expose native copy controls.

### 1) Install package

```bash
npm install --save-exact pumuki
```

### 2) Install managed lifecycle + bootstrap

```bash
npx --yes pumuki install
```

### 3) Verify environment

```bash
npx --yes pumuki doctor
npx --yes pumuki status
npx --yes pumuki sdd status
```

### 4) Open an SDD session

```bash
npx --yes pumuki sdd session --open --change=<change-id>
```

### 5) Run gates

```bash
npx --yes pumuki-pre-write
npx --yes pumuki-pre-commit
npx --yes pumuki-pre-push
npx --yes pumuki-ci
```

## Hard Mode (Policy Hardening)

Pumuki supports hard-mode policy resolution via `.pumuki/hard-mode.json`.

Example:

```json
{
  "enabled": true,
  "profile": "critical-high"
}
```

Current profile support:

- `critical-high`
- `all-severities`

Environment overrides:

- `PUMUKI_HARD_MODE` (`true|false|1|0|on|off`)
- `PUMUKI_HARD_MODE_PROFILE` (`critical-high|all-severities`)

Runtime traceability:

- policy trace is exposed in AI Gate outputs
- hard mode state is captured in `repo_state.lifecycle.hard_mode`

## PRE_WRITE Contract

For deterministic pre-write integrations:

```bash
npx --yes pumuki sdd validate --stage=PRE_WRITE --json
```

Returns a chained envelope with:

- `sdd`
- `ai_gate`
- `telemetry.chain = "pumuki->ai_gate->ai_evidence"`

## Lifecycle Commands

```bash
npx --yes pumuki install
npx --yes pumuki update --latest
npx --yes pumuki uninstall --purge-artifacts
npx --yes pumuki remove
npx --yes pumuki doctor
npx --yes pumuki status
```

Important:

- `pumuki remove` is the full teardown path (hooks + artifacts + dependency cleanup logic).
- `npm uninstall pumuki` only removes dependency entries.

## Adapter Commands

```bash
npx --yes pumuki adapter install --agent=codex --dry-run
npx --yes pumuki adapter install --agent=cursor
npm run adapter:install -- --agent=claude
```

## MCP Servers (Optional)

Pumuki core does not depend on MCP, but MCP is available for external agents.

Evidence MCP:

```bash
npx --yes pumuki-mcp-evidence
```

Enterprise MCP:

```bash
npx --yes pumuki-mcp-enterprise
```

References:

- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/MCP_SERVERS.md`
- `docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`

## Framework Repository (This Repo)

```bash
git clone https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm ci
```

Recommended baseline:

```bash
npm run typecheck
npm run test
npm run test:deterministic
npm run validation:package-manifest
npm run skills:lock:check
```

Interactive menu:

```bash
npm run framework:menu
```

Consumer menu notes:

- options `1/2/3/4` execute a pre-flight check before running gates
- pre-flight validates repo-state, git-flow constraints, and AI gate chain (`pumuki -> mcp -> ai_gate -> ai_evidence`)
- option `31` in advanced menu toggles macOS system notifications (persisted in `.pumuki/system-notifications.json`)

Consumer repositories typically run:

```bash
npx --yes pumuki-framework
```

## Published Binaries

- `pumuki`
- `pumuki-framework`
- `pumuki-pre-write`
- `pumuki-pre-commit`
- `pumuki-pre-push`
- `pumuki-ci`
- `pumuki-mcp-evidence`
- `pumuki-mcp-enterprise`

## Troubleshooting

Hook/lifecycle drift:

```bash
npx --yes pumuki doctor
npx --yes pumuki status
```

Missing upstream for `PRE_PUSH`:

```bash
git push --set-upstream origin <branch>
```

Emergency SDD bypass (incident-only):

```bash
PUMUKI_SDD_BYPASS=1 npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

## Documentation Map

Primary index: `docs/README.md`

Core docs:

- `docs/ARCHITECTURE.md`
- `docs/INSTALLATION.md`
- `docs/USAGE.md`
- `docs/CONFIGURATION.md`
- `docs/API_REFERENCE.md`
- `docs/evidence-v2.1.md`
- `docs/MCP_SERVERS.md`
- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/validation/README.md`

Contributor docs:

- `docs/CONTRIBUTING.md`
- `docs/CODE_STANDARDS.md`
- `CHANGELOG.md`

## License

MIT (`LICENSE`)
