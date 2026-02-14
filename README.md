# Pumuki AST Intelligence Framework

[![Version](https://img.shields.io/badge/version-6.3.7-1d4ed8)](package.json)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)
[![Build](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-0ea5e9)](package.json)
[![Evidence](https://img.shields.io/badge/evidence-v2.1-7c3aed)](docs/evidence-v2.1.md)

<img src="assets/logo.png" alt="Pumuki" width="100%" />

Enterprise governance for AI-assisted code delivery.

Pumuki turns code changes into traceable and reproducible decisions:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

This gives enterprise teams one deterministic source of truth to decide what is blocked, what is warned, and why, both locally and in CI.

## Table of contents

- [Why Pumuki](#why-pumuki)
- [Quick Start](#quick-start)
- [Automated vs Manual Operations](#automated-vs-manual-operations)
- [Software Lifecycle](#software-lifecycle)
- [Command Reference](#command-reference)
- [MCP: JSON Installation and Configuration](#mcp-json-installation-and-configuration)
- [Architecture and Design Philosophy](#architecture-and-design-philosophy)
- [Contributing and Support](#contributing-and-support)
- [References](#references)

## Why Pumuki

### Real problem in large teams

- Inconsistent quality checks between local and CI.
- Hard-to-audit technical decisions.
- Configuration drift across platforms.
- Operational incidents without reproducible evidence.

### What Pumuki solves

- Stage-aware gate policies (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- Versioned and locked rule bundles (`skills.lock.json`).
- Deterministic evidence contract (`.ai_evidence.json`).
- Operational runbooks for triage, closure, and handoff.

### Where it fits best

- Multi-platform repositories (`ios`, `backend`, `frontend`, `android`).
- Teams with compliance/audit requirements.
- High-change environments with AI-assisted development.

## Quick Start

### Prerequisites

- `Node.js >= 18.0.0`
- `npm >= 9.0.0`
- `git`

### Installation

```bash
git clone https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm ci
```

### Minimal verification

```bash
npm run typecheck
npm run test:deterministic
npm run validation:package-manifest
```

### First run

```bash
npm run framework:menu
```

## Automated vs Manual Operations

### Automated path (default)

The core lifecycle is automated:

- facts extraction,
- rules evaluation,
- stage-aware gate decision,
- `ai_evidence v2.1` generation,
- CI workflow execution.

### Manual path (intentional)

`validation:*` commands are operational controls for:

- triage,
- closure,
- handoff,
- adapter diagnostics,
- rollout guardrails.

Examples:

- `validation:consumer-startup-triage`
- `validation:phase5-execution-closure`
- `validation:phase8:*`
- `validation:adapter-*`

Practical rule:

- normal development: automated pipeline + tests,
- incident/rollout handling: manual runbook commands.

## Software Lifecycle

### Installation (fresh setup)

```bash
npm ci
npm run typecheck
npm run test:deterministic
npm run skills:lock:check
```

### Upgrade

```bash
git pull
npm ci
npm run skills:lock:check
npm run validation:docs-hygiene
npm run test:deterministic
```

### Uninstall (local cleanup)

```bash
rm -rf node_modules
rm -rf .audit-reports
```

If legacy guards are active:

```bash
npm run ast:guard:stop
```

### Dependency conflict troubleshooting

| Symptom | Typical root cause | Recommended action |
| --- | --- | --- |
| local differs from CI | skills lock drift | `npm run skills:lock:check` |
| `tsx` fails to start | incompatible Node runtime | upgrade to `Node >= 18` |
| upgrade regressions | inconsistent lockfile/modules | `rm -rf node_modules package-lock.json && npm install` |
| noisy docs/artifacts | stale `.audit-reports` outputs | `npm run validation:clean-artifacts -- --dry-run` |

## Command Reference

Flag forwarding pattern:

```bash
npm run <script> -- <flags>
```

### Core, CLI, and framework

| Command | Description | Example |
| --- | --- | --- |
| `npm run install-hooks` | Install framework hooks/binaries | `npm run install-hooks` |
| `npm run check-version` | Verify runtime version | `npm run check-version` |
| `npm run audit` | Run AST CLI | `npm run audit -- --help` |
| `npm run ast` | AST CLI alias | `npm run ast -- --help` |
| `npm run framework:menu` | Launch interactive operations menu | `npm run framework:menu` |
| `npm run mcp:evidence` | Start read-only MCP evidence server | `npm run mcp:evidence` |
| `npm run violations` | Violations CLI | `npm run violations -- --help` |
| `npm run violations:list` | List violations | `npm run violations:list` |
| `npm run violations:show` | Show one violation | `npm run violations:show -- <id>` |
| `npm run violations:summary` | Aggregated violations summary | `npm run violations:summary` |
| `npm run violations:top` | Top violations view | `npm run violations:top` |

### Quality and testing

| Command | Description | Example |
| --- | --- | --- |
| `npm run typecheck` | TypeScript check without emit | `npm run typecheck` |
| `npm run test` | Main Jest test suite | `npm run test` |
| `npm run test:evidence` | Evidence-specific tests | `npm run test:evidence` |
| `npm run test:mcp` | MCP tests | `npm run test:mcp` |
| `npm run test:heuristics` | AST heuristics tests | `npm run test:heuristics` |
| `npm run test:stage-gates` | Stage policy/gate tests | `npm run test:stage-gates` |
| `npm run test:deterministic` | Recommended deterministic baseline | `npm run test:deterministic` |
| `npm run validation:package-manifest` | Validate package manifest contract | `npm run validation:package-manifest` |
| `npm run validation:package-smoke` | Blocking package smoke test | `npm run validation:package-smoke` |
| `npm run validation:package-smoke:minimal` | Minimal package smoke test | `npm run validation:package-smoke:minimal` |
| `npm run validation:docs-hygiene` | Documentation guardrail checks | `npm run validation:docs-hygiene` |
| `npm run validation:clean-artifacts -- --dry-run` | Simulated artifact cleanup | `npm run validation:clean-artifacts -- --dry-run` |
| `npm run skills:compile` | Compile skills lock | `npm run skills:compile` |
| `npm run skills:lock:check` | Verify skills lock freshness | `npm run skills:lock:check` |

### Consumer diagnostics and support

| Command | Main flags | Example |
| --- | --- | --- |
| `validation:consumer-ci-artifacts` | `--repo --limit --out` | `npm run validation:consumer-ci-artifacts -- --repo <owner>/<repo> --limit 20 --out .audit-reports/consumer-triage/consumer-ci-artifacts-report.md` |
| `validation:consumer-ci-auth-check` | `--repo --out` | `npm run validation:consumer-ci-auth-check -- --repo <owner>/<repo> --out .audit-reports/consumer-triage/consumer-ci-auth-check.md` |
| `validation:consumer-workflow-lint` | `--repo-path --actionlint-bin --out` | `npm run validation:consumer-workflow-lint -- --repo-path /path/repo --actionlint-bin /tmp/actionlint --out .audit-reports/consumer-triage/consumer-workflow-lint-report.md` |
| `validation:consumer-support-bundle` | `--repo --limit --out` | `npm run validation:consumer-support-bundle -- --repo <owner>/<repo> --limit 20 --out .audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md` |
| `validation:consumer-support-ticket-draft` | `--repo --support-bundle --auth-report --out` | `npm run validation:consumer-support-ticket-draft -- --repo <owner>/<repo> --support-bundle .audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md --auth-report .audit-reports/consumer-triage/consumer-ci-auth-check.md --out .audit-reports/consumer-triage/consumer-support-ticket-draft.md` |
| `validation:consumer-startup-unblock-status` | `--repo --support-bundle --auth-report --workflow-lint-report --out` | `npm run validation:consumer-startup-unblock-status -- --repo <owner>/<repo> --support-bundle .audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md --auth-report .audit-reports/consumer-triage/consumer-ci-auth-check.md --workflow-lint-report .audit-reports/consumer-triage/consumer-workflow-lint-report.md --out .audit-reports/consumer-triage/consumer-startup-unblock-status.md` |
| `validation:consumer-startup-triage` | `--repo --out-dir [--skip-workflow-lint]` | `npm run validation:consumer-startup-triage -- --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --out-dir .audit-reports/consumer-triage-temp --skip-workflow-lint` |

### Phase 5 (closure and handoff)

| Command | Main flags | Example |
| --- | --- | --- |
| `validation:phase5-blockers-readiness` | `--consumer-triage-report --out [--require-adapter-report --adapter-report]` | `npm run validation:phase5-blockers-readiness -- --consumer-triage-report .audit-reports/consumer-triage/consumer-startup-triage-report.md --out .audit-reports/phase5/phase5-blockers-readiness.md` |
| `validation:phase5-execution-closure-status` | `--phase5-blockers-report --consumer-unblock-report --out` | `npm run validation:phase5-execution-closure-status -- --phase5-blockers-report .audit-reports/phase5/phase5-blockers-readiness.md --consumer-unblock-report .audit-reports/consumer-triage/consumer-startup-unblock-status.md --out .audit-reports/phase5/phase5-execution-closure-status.md` |
| `validation:phase5-execution-closure` | `--repo --out-dir [--mock-consumer] [--skip-workflow-lint] [--skip-auth-preflight]` | `npm run validation:phase5-execution-closure -- --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --out-dir .audit-reports/phase5 --mock-consumer` |
| `validation:phase5-external-handoff` | `--repo [--require-mock-ab-report] [--require-artifact-urls] [--artifact-url] [--out]` | `npm run validation:phase5-external-handoff -- --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --require-mock-ab-report` |
| `validation:phase5-latest:refresh` | shell script | `npm run validation:phase5-latest:refresh` |
| `validation:phase5-latest:sync-docs` | shell script | `npm run validation:phase5-latest:sync-docs` |
| `validation:phase5-latest:ready-check` | shell script | `npm run validation:phase5-latest:ready-check` |
| `validation:phase5-post-support:refresh` | shell script | `npm run validation:phase5-post-support:refresh` |

### Phase 8 (operations, anti-loop, status)

| Command | Main flags | Example |
| --- | --- | --- |
| `validation:phase8:resume-after-billing` | shell script | `npm run validation:phase8:resume-after-billing` |
| `validation:phase8:next-step` | shell script | `npm run validation:phase8:next-step` |
| `validation:phase8:doctor` | shell script | `npm run validation:phase8:doctor` |
| `validation:phase8:autopilot` | shell script | `npm run validation:phase8:autopilot` |
| `validation:phase8:status-pack` | shell script | `npm run validation:phase8:status-pack` |
| `validation:phase8:tick` | shell script | `npm run validation:phase8:tick` |
| `validation:phase8:loop-guard` | shell script | `npm run validation:phase8:loop-guard` |
| `validation:phase8:loop-guard-coverage` | shell script | `npm run validation:phase8:loop-guard-coverage` |
| `validation:phase8:mark-followup-state` | `<ticket_id> <posted_by> <POSTED_WAITING_REPLY|SUPPORT_REPLIED> [posted_at] [reply_at] [summary]` | `npm run validation:phase8:mark-followup-state -- 4077449 juancarlosmerlosalbarracin POSTED_WAITING_REPLY` |
| `validation:phase8:mark-followup-posted-now` | `<posted_by> [ticket_id] [posted_at]` | `npm run validation:phase8:mark-followup-posted-now -- juancarlosmerlosalbarracin 4077449` |
| `validation:phase8:mark-followup-replied-now` | `<posted_by> <summary> [ticket_id] [posted_at] [reply_at]` | `npm run validation:phase8:mark-followup-replied-now -- juancarlosmerlosalbarracin "support replied" 4077449` |
| `validation:phase8:ready-handoff` | shell script | `npm run validation:phase8:ready-handoff` |
| `validation:phase8:close-ready` | shell script | `npm run validation:phase8:close-ready` |

### Adapter readiness and legacy compatibility

| Command | Description |
| --- | --- |
| `validation:adapter-session-status` | Build adapter session status report |
| `validation:adapter-real-session-report` | Build adapter real-session report |
| `validation:adapter-readiness` | Build final adapter readiness report |
| `validate:adapter-hooks-local` | Validate legacy local adapter runtime |
| `print:adapter-hooks-config` | Print legacy adapter hook config |
| `install:adapter-hooks-config` | Install legacy adapter hook config |
| `verify:adapter-hooks-runtime` | Verify legacy adapter runtime |
| `assess:adapter-hooks-session` | Assess legacy adapter session |
| `assess:adapter-hooks-session:any` | Assess legacy adapter session including simulated events |

## MCP: JSON Installation and Configuration

### Is MCP mandatory to use Pumuki?

No.

- Pumuki core does not require MCP JSON registration.
- MCP is optional and only needed for external MCP/agent clients.

### MCP JSON example

```json
{
  "mcpServers": {
    "pumuki-evidence": {
      "command": "npm",
      "args": ["run", "mcp:evidence"],
      "cwd": "/absolute/path/to/ast-intelligence-hooks"
    }
  }
}
```

Start locally:

```bash
npm run mcp:evidence
```

## Architecture and Design Philosophy

### Deterministic architecture

`Facts -> Rules -> Gate -> ai_evidence v2.1`

This deterministic flow is the backbone of reproducibility and governance.

### Stage-aware policy model

Each stage has an explicit tolerance profile:

- `PRE_COMMIT`: immediate developer feedback,
- `PRE_PUSH`: stronger repository-level protection,
- `CI`: strict release-grade enforcement.

### Platform-aware by default

Pumuki detects platform scope and applies relevant packs:

- iOS,
- Backend,
- Frontend,
- Android.

### Rule-pack governance

- Rule packs are versioned.
- Skills bundles are locked.
- Drift detection is first-class.

### Evidence-first operations

Operational decisions are backed by deterministic artifacts, not tribal memory.

## Contributing and Support

### Contributing

1. Branch from `develop`.
2. Keep changes scoped and deterministic.
3. Update docs/runbooks when behavior changes.
4. Open a PR with clear context and impact.

### Issues and support

- Bug reports: open a GitHub issue with reproducible context.
- Operational incidents: use `docs/validation/*` runbooks and artifacts.
- Architecture questions: start from `docs/ARCHITECTURE.md` and `docs/evidence-v2.1.md`.

## References

- `PUMUKI.md`
- `docs/ARCHITECTURE.md`
- `docs/evidence-v2.1.md`
- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/validation/README.md`
