# Phase 4 - Evidence, Rule Packs, and MCP Documentation

## Objective

Document evidence v2.1, rule pack versioning, and read-only MCP evidence context exposure.

## Commits

- `0ce51f3` docs(rules): add v2.1 evidence and versioned rule pack docs
- `865ffb1` feat(mcp): add read-only evidence context server
- `4f13746` docs(ast): add post-validation heuristics reintroduction plan

## Scope

- Rule pack versioning metadata:
  - `core/rules/presets/rulePackVersions.ts`
- Evidence and rule pack docs:
  - `docs/evidence-v2.1.md`
  - `docs/rule-packs/*`
- MCP read-only context server:
  - `integrations/mcp/evidenceContextServer.ts`
  - `integrations/mcp/evidenceContextServer.cli.ts`
  - `integrations/mcp/index.ts`
  - `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- AST heuristics post-validation strategy:
  - `docs/AST_HEURISTICS_REINTRODUCTION_PLAN.md`

## Validation status

- MCP server TypeScript compilation path validated.
- Docs aligned with deterministic evidence contract `version: "2.1"`.
