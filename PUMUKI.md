# PUMUKI Playbook - Enterprise Governance, Practically Explained

This document is the complete didactic and operational guide to understand and run Pumuki without ambiguity.

Goal: enable a junior profile to operate the framework with production-level criteria.

## 1) What is Pumuki (one sentence)

Pumuki is a deterministic governance framework that transforms code changes into auditable quality and risk decisions.

Pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## 2) What problem it solves

In enterprise teams, the real problem is not only finding issues. The hard part is getting one consistent decision model across:

- local development,
- git hooks,
- CI,
- and external operational workflows.

Pumuki solves this with:

- versioned and locked rules,
- stage-aware policies,
- deterministic evidence,
- runbooks for incidents and handoff.

## 3) What is automated vs what is manual

### Automated

- Facts extraction.
- Rules evaluation.
- Gate evaluation by stage (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- `.ai_evidence.json` generation.
- CI workflow execution.

### Manual (intentionally)

`validation:*` commands are designed for guided operations:

- triage,
- closure,
- handoff,
- adapter diagnostics,
- rollout controls.

Golden rule:

- normal development: automated path,
- incident/rollout handling: manual runbook path.

## 4) MCP: when you need it and when you do not

### You do not need MCP JSON for core usage

You can run the full Pumuki core without registering any MCP server in JSON files.

### You do need MCP JSON for external MCP/agent clients

If you want to consume evidence from an MCP-compatible external client, register the server:

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

Local start:

```bash
npm run mcp:evidence
```

## 5) Reference architecture map

- `core/facts/*`: AST and semantic facts.
- `core/rules/*`: rules and heuristics.
- `core/gate/*`: final decision engine.
- `integrations/git/*`: stage runners and git scopes.
- `integrations/gate/stagePolicies.ts`: stage thresholds.
- `integrations/evidence/*`: deterministic evidence.
- `integrations/platform/*`: platform detection.
- `integrations/mcp/*`: read-only evidence MCP server.

## 6) End-to-end lifecycle (step by step)

1. You change code.
2. Pumuki extracts facts.
3. Pumuki evaluates rule packs.
4. Pumuki applies the stage policy.
5. Pumuki writes evidence.
6. If there is an operational blocker, you run targeted `validation:*` commands.
7. You document outcomes in `.audit-reports/*` artifacts.

## 7) Junior-ready practical guide (with project mock cases)

### Setup

```bash
npm ci
npm run typecheck
npm run test:deterministic
npm run skills:lock:check
```

### Practical case A - Mock startup triage

```bash
npm run validation:consumer-startup-triage -- \
  --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  --out-dir .audit-reports/consumer-triage-temp \
  --skip-workflow-lint
```

Expected output: refreshed triage artifacts in `.audit-reports/consumer-triage-temp`.

### Practical case B - Mock execution closure (Phase 5)

```bash
npm run validation:phase5-execution-closure -- \
  --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  --out-dir .audit-reports/phase5 \
  --mock-consumer
```

Expected output: closure chain artifacts (`blockers`, `status`, `handoff`) under `.audit-reports/phase5`.

### Practical case C - External handoff package

```bash
npm run validation:phase5-external-handoff -- \
  --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  --require-mock-ab-report
```

Expected output: a handoff-ready report for external stakeholders.

### Practical case D - External status diagnostics (Phase 8)

```bash
npm run validation:phase8:doctor
npm run validation:phase8:status-pack
```

Expected output: clear state diagnostics and anti-loop progress pack.

### Practical case E - Adapter readiness chain

```bash
npm run validation:adapter-session-status -- --out .audit-reports/adapter/adapter-session-status.md
npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md
npm run validation:adapter-readiness -- --adapter-report .audit-reports/adapter/adapter-real-session-report.md --out .audit-reports/adapter/adapter-readiness.md
```

Expected output: deterministic adapter readiness verdict for rollout decisions.

## 8) How to avoid operational loops

- Do not open technical sub-tasks when the blocker is external.
- Update handoff/runbook status and wait for a real external event.
- If the front is no longer a priority, explicitly mark it as `de-scoped`.

## 9) Full-understanding checklist

You should be able to answer yes to all:

- Do I clearly separate automated flow from manual operations?
- Do I know exactly when MCP JSON is required?
- Can I execute mock triage and closure end to end?
- Do I know where evidence and status artifacts live (`.ai_evidence.json`, `.audit-reports/*`)?
- Can I map each operational problem to the right command quickly?

## 10) Executive summary

Pumuki reduces delivery risk by turning quality governance into a reproducible system that is:

- technical,
- auditable,
- operational,
- and enterprise-scalable.

For a concise project overview, read `README.md`.
For hands-on operational execution, use this playbook.
