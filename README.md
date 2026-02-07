# Pumuki AST Intelligence Framework

Deterministic governance framework for AI-assisted development.

This repository is the v2.x implementation focused on a clean pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## What it enforces

- Multi-platform detection in a single run: `ios`, `backend`, `frontend`, `android`.
- Stage-based gate policies:
  - `PRE_COMMIT`: block `CRITICAL`, warn from `ERROR`.
  - `PRE_PUSH`: block `ERROR`, warn from `WARN`.
  - `CI`: block `ERROR`, warn from `WARN`.
- Deterministic evidence store in `.ai_evidence.json` (`version: "2.1"`).
- Rule-pack + override model with locked baseline support.

## Repository scope (current)

- `core/`: pure domain logic (facts, rules, gate).
- `integrations/git/`: staged/range adapters and stage runners.
- `integrations/evidence/`: deterministic evidence build + write.
- `integrations/platform/`: platform detection.
- `integrations/mcp/`: read-only evidence context server.
- `.github/workflows/`: reusable gate workflow + platform workflows.

## Quick start (repo development)

```bash
npm ci
npm run typecheck
npm run test:deterministic
```

## Run gates locally

### Interactive menu

```bash
npm run framework:menu
```

### Direct stage runners (CLI wrappers)

```bash
# PRE_COMMIT (staged changes)
npx tsx integrations/git/preCommitIOS.cli.ts

# PRE_PUSH (upstream..HEAD)
npx tsx integrations/git/prePushBackend.cli.ts

# CI (baseRef..HEAD)
npx tsx integrations/git/ciFrontend.cli.ts
```

Notes:
- Stage wrappers delegate to shared stage runners (`integrations/git/stageRunners.ts`).
- Platform evaluation is combined from detected facts in the same run.

## CI

Platform workflows call the reusable template:

- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`
- `.github/workflows/pumuki-gate-template.yml`

Each run uploads `.ai_evidence.json` as an artifact.

## Evidence and rules

- Evidence schema: `docs/evidence-v2.1.md`
- Rule pack versions: `docs/rule-packs/README.md`
- Rule packs:
  - `docs/rule-packs/ios.md`
  - `docs/rule-packs/backend.md`
  - `docs/rule-packs/frontend.md`
  - `docs/rule-packs/android.md`
  - `docs/rule-packs/heuristics.md`

## Configuration

### Project overrides

Load from:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Locked baseline rules remain locked unless `allowOverrideLocked: true`.

### Heuristic pilot

Set `PUMUKI_ENABLE_AST_HEURISTICS=true` to enable AST heuristic rules.

## MCP context server

Expose read-only evidence context:

```bash
npm run mcp:evidence
```

Reference: `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`.

## Status

Active branch for this refactor line: `enterprise-refactor`.
