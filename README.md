# Pumuki AST Intelligence Framework

Enterprise-grade deterministic governance framework for AI-assisted software delivery.

This repository contains the active v2.x framework line, built around a strict evaluation pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## Executive Summary

Pumuki enforces consistent engineering standards across platforms and delivery stages by turning source changes into typed facts, evaluating those facts against versioned rule packs, applying stage policies, and emitting deterministic evidence.

The framework is designed for reproducibility, CI parity, and auditability.

Documentation index: `docs/README.md`

## Core Guarantees

- Deterministic evidence in `.ai_evidence.json` with `version: "2.1"`.
- Stage-aware gate policies with explicit block/warn thresholds:
  - `PRE_COMMIT`: block on `CRITICAL`, warn on `ERROR`.
  - `PRE_PUSH`: block on `ERROR`, warn on `WARN`.
  - `CI`: block on `ERROR`, warn on `WARN`.
- Multi-platform evaluation in a single pass when facts include:
  - `ios`
  - `backend`
  - `frontend`
  - `android`
- Rule-pack traceability through ruleset bundle identifiers and hashes.
- Read-only MCP evidence surface for external agent consumption.

## Architecture Boundaries

- `core/`
  - Pure domain logic only: facts, rules, gate, condition matching.
  - No infrastructure coupling.
- `integrations/git/`
  - Stage runners, Git scopes (staged/range), platform gate orchestration.
- `integrations/evidence/`
  - Deterministic evidence build/write pipeline.
- `integrations/platform/`
  - Platform detection from facts.
- `integrations/mcp/`
  - Read-only evidence context server.

## Repository Operations

### Install and validate baseline

```bash
npm ci
npm run typecheck
npm run test:deterministic
```

### Run gates locally

Interactive:

```bash
npm run framework:menu
```

The interactive menu includes stage evaluation plus optional diagnostics/adapters (provider-specific adapter reports and consumer diagnostics), and operational checks (`docs/validation` hygiene and `skills:lock:check`).

Direct stage wrappers:

```bash
# PRE_COMMIT (staged scope)
npx tsx integrations/git/preCommitIOS.cli.ts

# PRE_PUSH (upstream..HEAD)
npx tsx integrations/git/prePushBackend.cli.ts

# CI (baseRef..HEAD)
npx tsx integrations/git/ciFrontend.cli.ts
```

### Deterministic test suites

```bash
npm run test:evidence
npm run test:mcp
npm run test:heuristics
npm run test:deterministic
```

### Validation docs hygiene

```bash
npm run validation:docs-hygiene
```

### Skills lock freshness

```bash
npm run skills:lock:check
```

## Rule Packs and Overrides

Rule-pack catalog:

- `docs/rule-packs/README.md`
- `docs/rule-packs/ios.md`
- `docs/rule-packs/backend.md`
- `docs/rule-packs/frontend.md`
- `docs/rule-packs/android.md`
- `docs/rule-packs/heuristics.md`

Project-level overrides are loaded from:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Locked baseline rules remain immutable unless `allowOverrideLocked: true`.

## Evidence Contract

- Schema: `docs/evidence-v2.1.md`
- Source of truth: `.ai_evidence.json` (`version: "2.1"`)
- Snapshot + ledger model with deterministic serialization
- Optional consolidation trace for suppressed equivalent findings

## MCP Evidence Context Server

Start server:

```bash
npm run mcp:evidence
```

Endpoints:

- `GET /health`
- `GET /status`
- `GET /ai-evidence`
- `GET /ai-evidence?includeSuppressed=false`
- `GET /ai-evidence?view=compact`
- `GET /ai-evidence?view=full`

Reference: `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`

## IDE Adapters (Optional)

Pumuki gate execution is IDE-agnostic by design.

- The deterministic gate flow (`Facts -> Rules -> Gate -> ai_evidence`) runs through `core/*` and `integrations/*`.
- IDE/editor adapter diagnostics are isolated under `scripts/*` and `docs/validation/*`.
- PRE_COMMIT / PRE_PUSH / CI do not require any IDE adapter command to pass.
- Adapter diagnostics are operational and optional:
  - `docs/validation/README.md`
  - `docs/validation/phase5-execution-closure.md`

## Consumer CI Diagnostics

Generate a consumer-repository CI run/artifact report (for rollout validation and startup-failure triage):

```bash
# One-shot triage bundle (auth + artifacts + support bundle + ticket draft + unblock status)
npm run validation:consumer-startup-triage -- \
  --repo <owner>/<repo> \
  --out-dir docs/validation \
  --skip-workflow-lint

# Optional: include semantic workflow lint in the one-shot triage run
npm run validation:consumer-startup-triage -- \
  --repo <owner>/<repo> \
  --repo-path /Users/you/Projects/consumer-repo \
  --actionlint-bin /tmp/actionlint-bin/actionlint

npm run validation:consumer-ci-artifacts -- --repo <owner>/<repo> --limit 20 \
  --out docs/validation/consumer-ci-artifacts-report.md

# Optional: run semantic workflow lint on consumer repo (requires actionlint binary)
npm run validation:consumer-workflow-lint -- \
  --repo-path /Users/you/Projects/consumer-repo \
  --actionlint-bin /tmp/actionlint-bin/actionlint \
  --out docs/validation/consumer-workflow-lint-report.md

# Build support bundle (ready-to-paste payload for GitHub Support)
npm run validation:consumer-support-bundle -- --repo <owner>/<repo> --limit 20 \
  --out docs/validation/consumer-startup-failure-support-bundle.md

# Auth/scopes precheck for private-repo Actions diagnostics
npm run validation:consumer-ci-auth-check -- --repo <owner>/<repo> \
  --out docs/validation/consumer-ci-auth-check.md

# Build GitHub Support ticket draft from support bundle + auth report
npm run validation:consumer-support-ticket-draft -- \
  --repo <owner>/<repo> \
  --support-bundle docs/validation/consumer-startup-failure-support-bundle.md \
  --auth-report docs/validation/consumer-ci-auth-check.md \
  --out docs/validation/consumer-support-ticket-draft.md

# Build consolidated unblock status for startup_failure incident
npm run validation:consumer-startup-unblock-status -- \
  --repo <owner>/<repo> \
  --support-bundle docs/validation/consumer-startup-failure-support-bundle.md \
  --auth-report docs/validation/consumer-ci-auth-check.md \
  --workflow-lint-report docs/validation/consumer-workflow-lint-report.md \
  --out docs/validation/consumer-startup-unblock-status.md

# Build consolidated readiness report for pending Phase 5 diagnostics blockers (adapter report optional)
npm run validation:phase5-blockers-readiness -- \
  --consumer-triage-report docs/validation/consumer-startup-triage-report.md \
  --out docs/validation/phase5-blockers-readiness.md

# Optional strict mode: require adapter report in readiness verdict
npm run validation:phase5-blockers-readiness -- \
  --require-adapter-report \
  --adapter-report docs/validation/adapter-real-session-report.md \
  --consumer-triage-report docs/validation/consumer-startup-triage-report.md \
  --out docs/validation/phase5-blockers-readiness.md

# Build Phase 5 execution-closure status snapshot
npm run validation:phase5-execution-closure-status -- \
  --phase5-blockers-report docs/validation/phase5-blockers-readiness.md \
  --consumer-unblock-report docs/validation/consumer-startup-unblock-status.md \
  --out docs/validation/phase5-execution-closure-status.md

# Optional: generate adapter-only readiness report
# (current adapter implementation consumes --adapter-report as input path)
npm run validation:adapter-readiness -- \
  --adapter-report docs/validation/adapter-real-session-report.md \
  --out docs/validation/adapter-readiness.md

# Optional adapter status/report aliases (provider-agnostic command naming)
npm run validation:adapter-session-status -- \
  --out docs/validation/adapter-session-status.md

npm run validation:adapter-real-session-report -- \
  --status-report docs/validation/adapter-session-status.md \
  --out docs/validation/adapter-real-session-report.md
```

Related docs:

- `docs/validation/README.md`
- `docs/validation/archive/skills-rollout-consumer-ci-artifacts.md`
- `docs/validation/consumer-ci-startup-failure-playbook.md`
- `docs/validation/phase5-execution-closure.md`

## CI Model

Platform workflows use reusable gate orchestration and upload `.ai_evidence.json` as artifact:

- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`
- `.github/workflows/pumuki-gate-template.yml`

## Governance and Traceability

- Active refactor branch: `enterprise-refactor`
- Roadmap tracking: `docs/TODO.md`
- Release notes: `docs/RELEASE_NOTES.md`
