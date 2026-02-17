# Pumuki AST Intelligence Framework

[![Version](https://img.shields.io/npm/v/pumuki?color=1d4ed8)](https://www.npmjs.com/package/pumuki)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)
[![Build](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-0ea5e9)](package.json)
[![Evidence](https://img.shields.io/badge/evidence-v2.1-7c3aed)](docs/evidence-v2.1.md)

<img src="assets/logo.png" alt="Pumuki" width="100%" />

Deterministic governance for AI-assisted software delivery.

Pumuki converts code changes into traceable, reproducible decisions:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## Table of Contents

- [Overview](#overview)
- [Capabilities](#capabilities)
- [Quick Start for Consumer Repositories](#quick-start-for-consumer-repositories)
- [Lifecycle Commands](#lifecycle-commands)
- [Gate Commands](#gate-commands)
- [Architecture and Policy Model](#architecture-and-policy-model)
- [MCP Evidence Context Server (Optional)](#mcp-evidence-context-server-optional)
- [Framework Development (This Repository)](#framework-development-this-repository)
- [Deterministic Validation Suite](#deterministic-validation-suite)
- [Troubleshooting](#troubleshooting)
- [Contributing and Support](#contributing-and-support)
- [References](#references)

## Overview

Pumuki is a provider-agnostic framework for enforcing deterministic quality gates across multi-platform repositories.

It is designed for enterprise teams that need:

- consistent gate behavior across local and CI,
- auditable decisions backed by deterministic evidence,
- versioned and lockable rule packs,
- operational runbooks for incidents and rollout management.

Canonical npm package name: `pumuki`.

Legacy package `pumuki-ast-hooks` is deprecated and frozen at `6.3.7`.

## Capabilities

- Stage-aware gate policies: `PRE_COMMIT`, `PRE_PUSH`, `CI`.
- Multi-platform detection and combined evaluation: iOS, Backend, Frontend, Android.
- Rules + overrides with locked baseline semantics.
- Deterministic evidence (`.ai_evidence.json`) for machine and human workflows.
- Optional read-only MCP evidence server for agent consumption.

## Quick Start for Consumer Repositories

### Prerequisites

- `Node.js >= 18.0.0`
- `npm >= 9.0.0`
- `git`

### 1) Install

```bash
npm install --save-exact pumuki
```

### 2) Install managed hooks in your repository

Run from the target repository root:

```bash
npx pumuki install
```

### 3) Verify lifecycle status

```bash
npx pumuki doctor
npx pumuki status
```

### 4) Run stage gates manually (optional)

```bash
npx pumuki-pre-commit
npx pumuki-pre-push
npx pumuki-ci
```

### 5) Expected outputs

- Gate exit code: `0` (allow) or `1` (block).
- Deterministic evidence file: `.ai_evidence.json`.

### Update and remove

```bash
npm update pumuki
npx pumuki update --latest

npx --yes pumuki remove
```

`pumuki remove` performs managed uninstall + artifact purge in one command.

## Lifecycle Commands

The `pumuki` binary provides repository lifecycle operations:

| Command | Purpose |
| --- | --- |
| `pumuki install` | Install managed `pre-commit` and `pre-push` hook blocks |
| `pumuki uninstall --purge-artifacts` | Remove managed hooks and purge known artifacts |
| `pumuki remove` | One-command cleanup + package uninstall in consumer repos |
| `pumuki update --latest` | Update package and re-apply managed hooks |
| `pumuki doctor` | Safety checks (hook drift, tracked `node_modules`, lifecycle state) |
| `pumuki status` | Current lifecycle snapshot |

## Gate Commands

Dedicated gate binaries are available:

| Binary | Stage |
| --- | --- |
| `pumuki-pre-commit` | `PRE_COMMIT` |
| `pumuki-pre-push` | `PRE_PUSH` |
| `pumuki-ci` | `CI` |

## Architecture and Policy Model

### Deterministic pipeline

`Facts -> Rules -> Gate -> ai_evidence v2.1`

- Facts are extracted from staged files or commit ranges.
- Rules are evaluated with platform-aware packs and project overrides.
- Gate applies stage policy thresholds.
- Evidence is generated as deterministic, machine-readable contract.

### Default stage policies

| Stage | Block on or above | Warn on or above |
| --- | --- | --- |
| `PRE_COMMIT` | `CRITICAL` | `ERROR` |
| `PRE_PUSH` | `ERROR` | `WARN` |
| `CI` | `ERROR` | `WARN` |

### Platform detection selectors

| Platform | Detection selector |
| --- | --- |
| iOS | `*.swift` |
| Backend | `apps/backend/**/*.ts` |
| Frontend | `apps/frontend/**/*.{ts,tsx,js,jsx}` and `apps/web/**/*.{ts,tsx,js,jsx}` |
| Android | `*.kt`, `*.kts` |

## MCP Evidence Context Server (Optional)

MCP is optional. Pumuki core does not depend on MCP.

### Consumer repository usage

Use the published binary from npm:

```json
{
  "mcpServers": {
    "pumuki-evidence": {
      "command": "npx",
      "args": ["--yes", "pumuki-mcp-evidence"],
      "cwd": "/absolute/path/to/your-consumer-repo"
    }
  }
}
```

### Framework repository usage

If you are developing this framework locally:

```bash
npm run mcp:evidence
```

## Framework Development (This Repository)

Use this path only when working on Pumuki itself (not as a consumer).

```bash
git clone https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm ci
```

Recommended maintainer baseline:

```bash
npm run typecheck
npm run test
npm run test:deterministic
npm run validation:package-manifest
npm run skills:lock:check
```

Operational menu:

```bash
npm run framework:menu
```

## Deterministic Validation Suite

Core validation commands used by maintainers:

| Command | Purpose |
| --- | --- |
| `npm run test:deterministic` | Evidence + MCP + heuristics deterministic baseline |
| `npm run validation:package-manifest` | Package contract and publish guardrails |
| `npm run validation:package-smoke` | Blocking install/lifecycle smoke in temp consumer |
| `npm run validation:package-smoke:minimal` | Minimal smoke path |
| `npm run validation:lifecycle-smoke` | Lifecycle round-trip check |
| `npm run validation:docs-hygiene` | Documentation governance checks |
| `npm run validation:clean-artifacts -- --dry-run` | Preview cleanup of generated artifacts |

## Troubleshooting

| Symptom | Typical cause | Action |
| --- | --- | --- |
| Gate behaves differently in local and CI | Skills lock or policy drift | `npm run skills:lock:check` |
| `tsx` runtime errors | Unsupported Node runtime | Upgrade to `Node >= 18` |
| Upgrade side effects | Inconsistent modules/lockfile state | `rm -rf node_modules package-lock.json && npm install` |
| Consumer repo still has artifacts after tests | Lifecycle was not removed | `npx --yes pumuki remove` |

## Contributing and Support

### Contributing

1. Branch from `develop`.
2. Keep changes deterministic and scoped.
3. Update docs and runbooks when behavior changes.
4. Open PR with impact, risk, and verification notes.

### Support

- Product and bug issues: GitHub issues.
- Operational incidents: `docs/validation/*` runbooks.
- Architecture references: `docs/ARCHITECTURE.md` and `docs/evidence-v2.1.md`.

## References

- `PUMUKI.md`
- `docs/ARCHITECTURE.md`
- `docs/evidence-v2.1.md`
- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/validation/README.md`
