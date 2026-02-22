# Pumuki

[![npm version](https://img.shields.io/npm/v/pumuki?color=1d4ed8)](https://www.npmjs.com/package/pumuki)
[![CI](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

Enterprise governance framework for AI-assisted software delivery.

Pumuki gives engineering teams a deterministic contract across local development, pre-commit hooks, pre-push quality gates, and CI with one execution model:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## Why Pumuki

Modern teams need fast feedback with strict governance. Pumuki solves that by combining:

- Deterministic enforcement at every stage (`PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, `CI`).
- A single evidence model (`.ai_evidence.json`, v2.1) for auditability and machine consumption.
- Multi-platform governance for iOS, Android, Backend, and Frontend.
- Unified skills rules engine with deterministic precedence (`core -> repo -> custom` by `ruleId`).
- Mandatory OpenSpec/SDD policy checks for enterprise change management.
- Unified CLI and optional MCP servers for agent-driven workflows.

## How It Works

Each execution follows the same pipeline:

1. Facts extraction from staged/range/repo scope.
2. Rule evaluation by platform and policy stage.
3. Gate decision (`PASS`, `WARN`, `BLOCK`) with deterministic thresholds.
4. Evidence emission (`.ai_evidence.json`) including findings, metadata, and rules coverage telemetry.

## Rules Engine Resolution Order

Pumuki resolves skills rules through a single effective lock:

1. **Core rules (embedded)**: compiled from the package snapshot (`skills.sources.json` + synchronized skills).
2. **Repo rules (optional)**: local `skills.lock.json`.
3. **Custom rules (optional)**: `/.pumuki/custom-rules.json`.

Conflict policy is deterministic:

- `custom > repo > core` (last writer wins by `ruleId`).
- Platform-specific rules activate only for detected platforms (`ios/android/backend/frontend`).
- `generic/text` rules remain available as cross-platform governance guards.

Rule evaluation modes:

- `AUTO`: mapped to deterministic detectors/heuristics.
- `DECLARATIVE`: kept active for coverage/traceability without emitting findings until a detector exists.

## Core Capabilities

### 1) Deterministic Stage Gates

- `PRE_WRITE`: write-time governance check (SDD/OpenSpec + AI gate consistency).
- `PRE_COMMIT`: staged/repo checks with fail-fast blocking semantics.
- `PRE_PUSH`: upstream/range checks with stricter CI/CD alignment.
- `CI`: base reference range checks for pipeline governance.

Reference: `integrations/gate/stagePolicies.ts`.

### 2) Evidence v2.1 with Rules Coverage Enforcement

Pumuki emits deterministic evidence with stable ordering and rich telemetry:

- `snapshot` (stage, outcome, findings)
- `snapshot.rules_coverage`:
  - `active_rule_ids`
  - `evaluated_rule_ids`
  - `matched_rule_ids`
  - `unevaluated_rule_ids`
  - `counts` and `coverage_ratio`
- `ledger` (persistent open violations)
- `rulesets`, `platforms`, `sdd_metrics`, `repo_state`

In `PRE_COMMIT`, `PRE_PUSH`, and `CI`, incomplete rules coverage forces block via `governance.rules.coverage.incomplete`.

Reference: `docs/evidence-v2.1.md`.

### 3) Unified Skills Rules Engine (Core + Repo + Custom)

- Core rules are always available at runtime (no external dependency required during audit).
- Repo lock and custom rules are merged into one effective ruleset before stage evaluation.
- Custom rules can be imported from `AGENTS.md`/`SKILLS.md` references or explicit `SKILL.md` paths.
- Advanced menu option `33` imports custom rules directly to `/.pumuki/custom-rules.json`.

### 4) Unified AI Gate Across CLI and MCP

The same evaluator powers local and MCP integrations:

- Missing/invalid/stale evidence detection
- Evidence `BLOCKED` status detection
- Protected branch guardrails (`main/master/develop/dev` by default)
- Policy trace visibility (`default`, `skills.policy`, `hard-mode`)

Reference: `integrations/gate/evaluateAiGate.ts`.

### 5) Mandatory OpenSpec + SDD Policy

Pumuki enforces OpenSpec/SDD as first-class enterprise guardrails:

- Session/state validation in `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, `CI`
- Deterministic policy error codes (for automation and support triage)
- Traceable source attribution (`source: "sdd-policy"`)

### 6) Menu UX v2 (Consumer + Advanced)

Interactive governance menu with:

- Consumer mode focused on day-to-day auditing workflows
- Advanced mode grouped by domains (Gates, Diagnostics, Maintenance, Validation, System)
- Runtime fallback to classic renderer if v2 rendering fails

Controls:

- `PUMUKI_MENU_UI_V2=0|1`
- `PUMUKI_MENU_MODE=consumer|advanced`
- `PUMUKI_MENU_COLOR=0|1`
- `PUMUKI_MENU_WIDTH=<columns>`

### 7) Hard Mode Policy Hardening

Hard mode policy can be enabled through `.pumuki/hard-mode.json` and environment overrides:

- `PUMUKI_HARD_MODE`
- `PUMUKI_HARD_MODE_PROFILE=critical-high|all-severities`

### 8) Lifecycle Management Commands

Managed lifecycle operations include hook setup, updates, diagnostics, and safe teardown:

- `install`
- `update --latest`
- `uninstall --purge-artifacts`
- `remove`
- `doctor`
- `status`

### 9) Adapter Scaffolding

Provider-agnostic adapter scaffolding for consumer repositories:

- `codex`
- `claude`
- `cursor`
- `windsurf`
- `opencode`

### 10) Optional MCP Servers

- Evidence MCP server: read-only context API for evidence consumption.
- Enterprise MCP server: broader operational context integrations.

References:

- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/MCP_SERVERS.md`
- `docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`

## Quick Start (Consumer Repository)

Prerequisites:

- Node.js `>= 18`
- npm `>= 9`
- Git repository

Install:

```bash
npm install --save-exact pumuki
```

Bootstrap lifecycle:

```bash
npx --yes pumuki install
```

Verify setup:

```bash
npx --yes pumuki doctor
npx --yes pumuki status
npx --yes pumuki sdd status
```

Open a change session:

```bash
npx --yes pumuki sdd session --open --change=<change-id>
```

Run stage gates:

```bash
npx --yes pumuki-pre-write
npx --yes pumuki-pre-commit
npx --yes pumuki-pre-push
npx --yes pumuki-ci
```

## Interactive Menu

Framework repository:

```bash
npm run framework:menu
```

Consumer repository:

```bash
npx --yes pumuki-framework
```

Start directly in advanced mode:

```bash
PUMUKI_MENU_MODE=advanced npm run framework:menu
```

Enable modern UI renderer:

```bash
PUMUKI_MENU_UI_V2=1 npm run framework:menu
```

## Option 1 Walkthrough (Consumer Menu)

This walkthrough documents **Option 1: Full audit (repo analysis · PRE_COMMIT)** using real execution output.

### Capture 1 — Consumer Menu (v2)

![Consumer Menu v2](assets/readme/menu-option1/01-menu-consumer-v2.png)

What this shows:

- Consumer menu grouped by operational flows.
- Option `1` is the full repo audit path for `PRE_COMMIT` policy.
- Current menu status reflects the latest evidence context.

### Capture 2 — Option 1 Pre-flight (BLOCK context)

![Option 1 Pre-flight Block](assets/readme/menu-option1/02-option1-preflight-block.png)

What this shows:

- Pre-flight validation runs before gate execution.
- Runtime context includes branch/upstream/worktree/evidence freshness.
- Operational hints explain *why* governance is currently blocked.

### Capture 3 — Option 1 Final Summary (BLOCK)

![Option 1 Final Summary Block](assets/readme/menu-option1/03-option1-final-summary-block.png)

What this shows:

- Deterministic severity summary and metrics.
- Explicit blocking decision with stage and outcome:
  - `Stage: PRE_COMMIT`
  - `Outcome: BLOCK`
- Actionable next step for remediation.

### Capture 4 — Option 1 Pre-flight (PASS scenario)

![Option 1 Pre-flight Pass Scenario](assets/readme/menu-option1/04-option1-preflight-pass.png)

What this shows:

- A clean fixture scenario where the audit run can complete without findings.
- Pre-flight can still show policy warnings (for example branch/evidence guardrails), while the run itself proceeds.

### Capture 5 — Option 1 Final Summary (PASS)

![Option 1 Final Summary Pass](assets/readme/menu-option1/05-option1-final-summary-pass.png)

What this shows:

- Zero violations across severities.
- Deterministic final decision:
  - `Stage: PRE_COMMIT`
  - `Outcome: PASS`
- Guidance to maintain baseline quality.

### Capture 6 — Menu Status After PASS Run

![Menu After Pass Run](assets/readme/menu-option1/06-menu-after-run-pass.png)

What this shows:

- Menu status is updated to `PASS` after successful run.
- Teams can quickly see current governance health before choosing the next action.

## Stage Contracts and Exit Codes

| Stage | Typical scope | Block threshold | Exit code behavior |
|---|---|---|---|
| `PRE_WRITE` | write-time + SDD/OpenSpec policy | `ERROR` (policy-driven) | `0` pass/warn, `1` block/error |
| `PRE_COMMIT` | staged/repo audit | `CRITICAL` | `0` pass/warn, `1` block/error |
| `PRE_PUSH` | upstream/range audit | `ERROR` | `0` pass/warn, `1` block/error |
| `CI` | baseRef..HEAD audit | `ERROR` | `0` pass/warn, `1` block/error |

For stage runners and wrappers see `integrations/git/stageRunners.ts` and `integrations/git/index.ts`.

## Command Reference

### Lifecycle

```bash
npx --yes pumuki install
npx --yes pumuki update --latest
npx --yes pumuki uninstall --purge-artifacts
npx --yes pumuki remove
npx --yes pumuki doctor
npx --yes pumuki status
```

### SDD / OpenSpec

```bash
npx --yes pumuki sdd status
npx --yes pumuki sdd session --open --change=<change-id>
npx --yes pumuki sdd session --refresh
npx --yes pumuki sdd session --close
npx --yes pumuki sdd validate --stage=PRE_COMMIT
```

### Skills Engine

```bash
# Compile local skills lock (repo scope)
npm run skills:compile

# Check lock freshness against source skills
npm run skills:lock:check

# Import custom rules from AGENTS.md/SKILLS.md discovered SKILL.md paths
npm run skills:import:custom

# Import custom rules from explicit SKILL.md sources
npm run skills:import:custom -- --source /abs/path/to/SKILL.md --source ./skills/backend/SKILL.md
```

### Stage Gates

```bash
npx --yes pumuki-pre-write
npx --yes pumuki-pre-commit
npx --yes pumuki-pre-push
npx --yes pumuki-ci
```

### Menu

```bash
npm run framework:menu
PUMUKI_MENU_UI_V2=1 npm run framework:menu
PUMUKI_MENU_MODE=advanced npm run framework:menu
```

### Adapter Scaffolding

```bash
npx --yes pumuki adapter install --agent=codex --dry-run
npx --yes pumuki adapter install --agent=cursor
npm run adapter:install -- --agent=claude
```

### MCP (optional)

```bash
npx --yes pumuki-mcp-evidence
npx --yes pumuki-mcp-enterprise
```

## Advanced Operational Workflows

### Non-interactive consumer matrix (deterministic validation)

Run all key consumer checks (`1/2/3/4/9`) without manual prompts:

```bash
node --import tsx -e "const mod = await import('./scripts/framework-menu-matrix-runner-lib.ts'); const report = await mod.default.runConsumerMenuMatrix({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"
```

Optional controlled canary execution:

```bash
node --import tsx -e "const mod = await import('./scripts/framework-menu-matrix-canary-lib.ts'); const report = await mod.default.runConsumerMenuCanary({ repoRoot: process.cwd() }); console.log(JSON.stringify(report, null, 2));"
```

### Enterprise diagnostics and readiness reports

```bash
npm run validation:consumer-ci-artifacts
npm run validation:consumer-ci-auth-check
npm run validation:consumer-workflow-lint
npm run validation:consumer-support-bundle
npm run validation:consumer-support-ticket-draft
npm run validation:consumer-startup-unblock-status
npm run validation:consumer-startup-triage
npm run validation:mock-consumer-ab-report
npm run validation:adapter-readiness
npm run validation:adapter-session-status
npm run validation:adapter-real-session-report
npm run validation:phase5-blockers-readiness
npm run validation:phase5-execution-closure-status
npm run validation:phase5-execution-closure
npm run validation:phase5-external-handoff
npm run validation:clean-artifacts
```

## Troubleshooting

- Missing upstream for push-based checks:

```bash
git push --set-upstream origin <branch>
```

- Stale/missing evidence: rerun menu option `1/2/3/4` or a direct stage command.
- Protected branch guardrails (`main/master/develop/dev`) can intentionally block commit/push workflows.
- If menu v2 render fails, Pumuki auto-falls back to classic UI.

## Documentation Index

- Usage guide: `docs/USAGE.md`
- API reference: `docs/API_REFERENCE.md`
- Evidence schema v2.1: `docs/evidence-v2.1.md`
- MCP evidence server: `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- MCP consumption guidance: `docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`
- Architecture overview: `docs/ARCHITECTURE.md`

## License

MIT. See `LICENSE`.
