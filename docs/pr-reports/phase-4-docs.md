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
  - `docs/HOW_IT_WORKS.md`
  - `docs/API_REFERENCE.md`
- Core operational docs cleanup:
  - `docs/INSTALLATION.md`
  - `docs/CONFIGURATION.md`
  - `docs/ARCHITECTURE_DETAILED.md`
- Architecture/MCP/testing cleanup:
  - `docs/ARCHITECTURE.md`
  - `docs/ARCH.md`
  - `docs/MCP_SERVERS.md`
  - `docs/TESTING.md`
- Operational docs cleanup:
  - `docs/CONTRIBUTING.md`
  - `docs/DEPENDENCIES.md`
  - `docs/CODE_STANDARDS.md`
  - `docs/BRANCH_PROTECTION_GUIDE.md`
  - `docs/observability.md`
  - `docs/alerting-system.md`
- Residual markdown cleanup:
  - removed `docs/type-safety.md`
  - removed `docs/SEVERITY_AUDIT.md`
  - removed `docs/VIOLATIONS_RESOLUTION_PLAN.md` (untracked local residual)
  - removed `_AI_DOCS/AUDIT_REPORT_EXHAUSTIVO_2026-01-04.md`
- Release notes cleanup:
  - `docs/RELEASE_NOTES.md` consolidated to active v2.x line
  - removed obsolete `docs/RELEASE_NOTES_5.3.4.md`
  - removed obsolete `docs/MIGRATION_5.3.4.md`

## Validation status

- MCP server TypeScript compilation path validated.
- `npm run test:mcp` validates health, missing evidence, invalid version, and valid `v2.1` read path.
- Docs aligned with deterministic evidence contract `version: "2.1"`.
- Primary user docs now avoid legacy severity model and obsolete hook-system menu options.
- Secondary core docs now reflect the active v2.x TypeScript API and deterministic stage pipeline.
- Legacy 5.3.4 release/migration docs are no longer part of active documentation surface.
- Installation/configuration/architecture detailed docs now align with active stage runners, policies, evidence v2.1, and CI template flow.
- Architecture summary, MCP server docs, and testing guide now document only the active deterministic runtime and scripts.
- Remaining operational docs now reflect active v2.x governance surface and avoid legacy runtime claims.
- Residual non-authoritative markdown artifacts were removed from active workspace surface.
- Final markdown link consistency check passed for `README.md` and `docs/**/*.md` (no broken local links).
