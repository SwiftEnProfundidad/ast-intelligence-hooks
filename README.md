# Pumuki AST Intelligence Framework

Enterprise-grade deterministic governance framework for AI-assisted software delivery.

This repository contains the active v2.x framework line, built around a strict evaluation pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## Executive Summary

Pumuki enforces consistent engineering standards across platforms and delivery stages by turning source changes into typed facts, evaluating those facts against versioned rule packs, applying stage policies, and emitting deterministic evidence.

The framework is designed for reproducibility, CI parity, and auditability.

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

## Windsurf Hook Runtime Hardening

Runtime and configuration commands:

```bash
npm run print:windsurf-hooks-config
npm run install:windsurf-hooks-config
npm run verify:windsurf-hooks-runtime
npm run validate:windsurf-hooks-local
npm run assess:windsurf-hooks-session
npm run assess:windsurf-hooks-session:any
```

Validation docs:

- `docs/validation/windsurf-hook-runtime-validation.md`
- `docs/validation/windsurf-hook-runtime-local-report.md`

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
- Phase reports: `docs/pr-reports/*`
- Release notes: `docs/RELEASE_NOTES.md`

