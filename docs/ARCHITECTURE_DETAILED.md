# Detailed Architecture (v2.x)

This document describes the active deterministic architecture implemented in this repository.

## Design goal

Provide a reproducible decision system for AI-assisted development with a strict separation between domain and integrations.

Primary pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## Layer boundaries

### `core/` (domain)

Pure logic without I/O or shell dependencies:

- `core/facts/*`
- `core/rules/*`
- `core/gate/*`

Responsibilities:

- Represent facts and conditions.
- Evaluate rules against facts.
- Evaluate gate outcome from findings.

### `integrations/` (adapters)

Runtime adapters around the domain:

- `integrations/git/*`
- `integrations/platform/*`
- `integrations/gate/*`
- `integrations/evidence/*`
- `integrations/mcp/*`

Responsibilities:

- Collect facts from Git scopes (staged/range).
- Resolve refs (`@{u}`, `GITHUB_BASE_REF`).
- Load rule packs and project overrides.
- Build/write deterministic evidence.
- Expose read-only evidence context via MCP endpoint.

Boundary rule:

- IDE/editor-specific diagnostics (for example Windsurf runtime validation) stay in `scripts/*` and `docs/validation/*`; they must not participate in core gate decisions.

## Stage execution architecture

### Shared runtime entry

`integrations/git/runPlatformGate.ts`

Responsibilities:

1. Build facts from selected scope.
2. Detect active platforms from facts.
3. Load baseline packs for detected platforms.
4. Optionally add heuristic facts/rules.
5. Merge project overrides.
6. Evaluate findings and gate decision.
7. Generate `.ai_evidence.json`.
8. Return process code (`0`/`1`).

### Stage runners

`integrations/git/stageRunners.ts`

- `runPreCommitStage()`
- `runPrePushStage()`
- `runCiStage()`

Policy source: `integrations/gate/stagePolicies.ts`.

Ref resolution source: `integrations/git/resolveGitRefs.ts`.

## Multi-platform model

Platform detection is combined in a single run:

- `ios`
- `backend`
- `frontend`
- `android`

Detector source: `integrations/platform/detectPlatforms.ts`.

Detected platforms drive baseline rule-pack loading and evidence `platforms` state.

## Rules architecture

Baseline packs:

- `iosEnterpriseRuleSet`
- `backendRuleSet`
- `frontendRuleSet`
- `androidRuleSet`
- `astHeuristicsRuleSet` (feature-flagged)

Versioning source:

- `core/rules/presets/rulePackVersions.ts`

Merge strategy:

- Baseline first, then project overrides.
- Locked baseline protections are enforced unless explicitly relaxed.

## Evidence architecture (v2.1)

Schema source: `integrations/evidence/schema.ts`.

Writer path:

- `integrations/evidence/generateEvidence.ts`
  - `buildEvidence`
  - `writeEvidence`

Deterministic properties:

- `snapshot` + `ledger`
- deduped findings
- stable output order
- per-run `rulesets` hash traceability

## CI architecture

Reusable template:

- `.github/workflows/pumuki-gate-template.yml`

Platform workflows:

- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`

All workflows use shared runner path + upload `.ai_evidence.json` artifact.

## MCP architecture

Read-only context server:

- `integrations/mcp/evidenceContextServer.ts`
- CLI: `integrations/mcp/evidenceContextServer.cli.ts`

Contract:

- serves evidence only when `version === "2.1"`
- health endpoint + deterministic error behavior

## Extension points (current model)

- Add typed facts in `core/facts/*`.
- Add declarative rules in `core/rules/presets/*`.
- Add platform detector in `integrations/platform/*`.
- Add stage/runner wrappers in `integrations/git/*` reusing shared runtime.

Constraint:

- Keep domain pure (`core/*`), keep shell and file I/O in integrations.
