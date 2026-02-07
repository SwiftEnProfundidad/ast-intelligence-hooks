# Phase 4 - Evidence, Rule Packs, and MCP Documentation

## Objective

Document evidence v2.1, rule pack versioning, and read-only MCP evidence context exposure.

## Commits

- `0ce51f3` docs(rules): add v2.1 evidence and versioned rule pack docs
- `865ffb1` feat(mcp): add read-only evidence context server
- `4f13746` docs(ast): add post-validation heuristics reintroduction plan
- `3cf08a7` test(mcp): add evidence context server coverage and runnable CLI script
- `82180dc` ci(mcp): run evidence context server tests in deterministic workflow
- `d1fecb7` docs(roadmap): track markdown cleanup backlog and phase-5 progress

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
  - `integrations/mcp/__tests__/evidenceContextServer.test.ts`
- AST heuristics post-validation strategy:
  - `docs/AST_HEURISTICS_REINTRODUCTION_PLAN.md`
- V2 usage and onboarding cleanup:
  - `README.md`
  - `docs/USAGE.md`

## Validation status

- MCP server TypeScript compilation path validated.
- `npm run test:mcp` validates health, missing evidence, invalid version, and valid `v2.1` read path.
- Docs aligned with deterministic evidence contract `version: "2.1"`.
- Primary user docs now avoid legacy severity model and obsolete hook-system menu options.
