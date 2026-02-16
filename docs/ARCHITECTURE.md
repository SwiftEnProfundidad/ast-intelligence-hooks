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

## Critical Module Map

Critical modules must document, at minimum:

- purpose (single responsibility),
- stable entrypoints (files consumed by other modules),
- deterministic invariants (behavior that must not change between refactors).

### MCP evidence payload and facets

Purpose:
- deterministic transformation from evidence snapshots to MCP facets/payloads.

Stable entrypoints:
- `integrations/mcp/evidenceFacetsBase.ts`
- `integrations/mcp/evidenceFacetsSuppressed.ts`
- `integrations/mcp/evidenceFacetsSuppressedBase.ts`
- `integrations/mcp/evidenceFacetsSuppressedRelations.ts`
- `integrations/mcp/evidenceFacetsSuppressedShare.ts`
- `integrations/mcp/evidenceFacetsSuppressedShareCore.ts`
- `integrations/mcp/evidenceFacetsSuppressedShareTriage.ts`
- `integrations/mcp/evidenceFacetsSnapshot.ts`
- `integrations/mcp/evidencePayloadConfig.ts`
- `integrations/mcp/evidencePayloadCollections.ts`
- `integrations/mcp/evidencePayloadSummary.ts`

Deterministic invariants:
- facet computation is pure from evidence inputs (no side effects).
- facet keys and tuple naming stay stable across releases.
- suppression and share metrics remain reproducible for the same snapshot.

### Git gate runtime

Purpose:
- orchestrate facts, rules, policies, and evidence emission for stage-gate decisions.

Stable entrypoints:
- `integrations/git/runPlatformGate.ts`
- `integrations/git/baselineRuleSets.ts`

Deterministic invariants:
- gate outcome depends only on facts + policy evaluation.
- evidence emission always includes stage/policy/ruleset traceability.
- stage runners remain thin wrappers over shared orchestration.

### Detector partitions

Purpose:
- expose stable detector barrels while keeping implementations split by concern.

Stable entrypoints:
- `core/facts/detectors/fs/sync.ts`
- `core/facts/detectors/process/index.ts`

Partition files:
- `core/facts/detectors/fs/syncPart1.ts`
- `core/facts/detectors/fs/syncPart2.ts`
- `core/facts/detectors/fs/syncPart3.ts`
- `core/facts/detectors/process/core.ts`
- `core/facts/detectors/process/shell.ts`
- `core/facts/detectors/process/spawn.ts`

Deterministic invariants:
- barrels define the public detector surface.
- partition internals may move, exported behavior and fact shapes must stay stable.
