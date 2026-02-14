# Architecture (v2.x)

## Objective

Provide deterministic governance for AI-assisted development with strict separation of concerns.

Core pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## Invariants

- Evidence is the state source of truth (`.ai_evidence.json`, `version: "2.1"`).
- Gate decision is deterministic for each stage scope and policy.
- Domain logic stays pure in `core/*` (no shell/filesystem/network coupling).
- Integrations adapt external systems and delegate decisions to domain logic.
- Platform detection and rule-pack loading are data-driven from facts.

## Layer model

### Domain (`core/*`)

- Facts model (`core/facts/*`)
- Rule definitions and presets (`core/rules/*`)
- Gate evaluation (`core/gate/*`)

No infrastructure dependencies.

### Integrations (`integrations/*`)

- Git scope and execution adapters (`integrations/git/*`)
- Stage policies (`integrations/gate/*`)
- Platform detection (`integrations/platform/*`)
- Evidence persistence (`integrations/evidence/*`)
- MCP read-only server (`integrations/mcp/*`)

## Stage architecture

Policy source: `integrations/gate/stagePolicies.ts`

- `PRE_COMMIT`
  - Scope: staged (`git diff --cached`)
  - Block from `CRITICAL`
- `PRE_PUSH`
  - Scope: `upstream..HEAD`
  - Block from `ERROR`
- `CI`
  - Scope: `baseRef..HEAD`
  - Block from `ERROR`

## Runtime entrypoints

- Shared execution: `integrations/git/runPlatformGate.ts`
- Stage runners: `integrations/git/stageRunners.ts`
- CLI wrappers: `integrations/git/*.cli.ts`
- Interactive menu: `scripts/framework-menu.ts`

## IDE adapter boundary

- `core/*` and `integrations/*` are IDE-agnostic; they must not depend on editor-specific runtime hooks.
- IDE diagnostics adapters (provider-specific runtime checks/reports) live in `scripts/*` and `docs/validation/*`.
- PRE_COMMIT, PRE_PUSH, and CI gate outcomes depend only on facts/rules/gate/evidence contracts.

## Platform and rule-pack model

Detected platforms can be combined in one run:

- `ios`
- `backend`
- `frontend`
- `android`

Baseline packs:

- `iosEnterpriseRuleSet`
- `backendRuleSet`
- `frontendRuleSet`
- `androidRuleSet`
- `astHeuristicsRuleSet` (feature-flagged)

Version map: `core/rules/presets/rulePackVersions.ts`.

## Evidence architecture

Writer path:

- `integrations/evidence/generateEvidence.ts`
  - `buildEvidence`
  - `writeEvidence`

Evidence properties:

- deterministic snapshot + ledger
- deduped findings
- stable JSON ordering
- platforms and rulesets traceability

Schema reference: `docs/evidence-v2.1.md`.

## CI architecture

- Reusable workflow: `.github/workflows/pumuki-gate-template.yml`
- Platform workflows:
  - `.github/workflows/pumuki-ios.yml`
  - `.github/workflows/pumuki-backend.yml`
  - `.github/workflows/pumuki-frontend.yml`
  - `.github/workflows/pumuki-android.yml`

Each run publishes `.ai_evidence.json` artifact.

## MCP architecture

Current active MCP integration in repo:

- `integrations/mcp/evidenceContextServer.ts`
- `integrations/mcp/evidenceContextServer.cli.ts`

Purpose: read-only exposure of evidence context for agents.

## Architectural guardrails

- Do not move decision logic from `core/*` into integrations.
- Do not couple integrations directly to each other when shared runtime exists.
- Prefer extending facts/rules/policies over adding ad-hoc shell conditions.
