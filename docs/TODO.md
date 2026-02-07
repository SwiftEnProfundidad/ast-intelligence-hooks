# Framework Work Tracking (TODO)

## Scope

This document tracks the agreed improvements for **Pumuki AST Intelligence Framework**.

## Done

- Refactor `README.md` to position the project as a framework (governance + lifecycle + commands).
- Add Git governance section documenting `ast:gitflow` and `ast:release` with options and flow.
- Add Developer Experience section (notifications + evidence freshness + git-tree guardrails).
- Make `docs/ARCHITECTURE.md` more normative by adding invariants + control primitives.
- Add `human_intent` to `ai_evidence v2.1` and mirror it in `ai_gate` output.
- Enforce `human_intent.expires_at` (ignore stale intent deterministically).
- Add README section for manual hook-system usage (interactive + `AUDIT_OPTION` + command mapping).
- Convert root `ARCHITECTURE.md` into conceptual architecture linked to `docs/ARCHITECTURE.md`.
- Define canonical evidence writer path and deterministic merge strategy.
- Standardize visuals in `docs/images/` to consistent, resolution-independent assets.
- Harden MCP evidence context server with test coverage and deterministic CI suite.
- Rewrite `README.md` and `docs/USAGE.md` to align with deterministic v2.x stage/rules/evidence model.
- Rewrite `docs/HOW_IT_WORKS.md` and `docs/API_REFERENCE.md` to remove legacy API/runtime references.
- Consolidate release notes to active v2.x line and remove legacy 5.3.4 migration/release docs.
- Rewrite `docs/INSTALLATION.md`, `docs/CONFIGURATION.md`, and `docs/ARCHITECTURE_DETAILED.md` to active v2.x model.
- Rewrite `docs/ARCHITECTURE.md`, `docs/ARCH.md`, `docs/MCP_SERVERS.md`, and `docs/TESTING.md` to active deterministic surface.
- Rewrite remaining operational docs (`CONTRIBUTING`, `DEPENDENCIES`, `CODE_STANDARDS`, `BRANCH_PROTECTION_GUIDE`, `observability`, `alerting-system`) to active v2.x scope.
- Remove obsolete markdown leftovers not part of active v2.x docs surface (`type-safety`, `SEVERITY_AUDIT`, ad-hoc violations plan, legacy audit report in `_AI_DOCS`).
- Complete documentation hygiene pass across `README.md` + `docs/**/*.md` (final consistency + local link validation).
- Run end-to-end validation in sample consumer repositories for multi-platform PRE_COMMIT/PRE_PUSH/CI and capture deterministic evidence behavior.
- Fix evidence/gate mismatch so `snapshot.outcome` mirrors evaluated gate decision across stages.
- Calibrate heuristic maturity by promoting high-confidence rules to `ERROR` in `PRE_PUSH/CI`:
  - `heuristics.ios.anyview.ast`
  - `heuristics.ts.explicit-any.ast`
  - `heuristics.ios.callback-style.ast`
- Validate heuristic maturity matrix with `PUMUKI_ENABLE_AST_HEURISTICS=on` in backend/frontend sample consumer repositories.
- Consolidate evidence signal by suppressing mapped iOS heuristic duplicates when stronger/equal baseline findings exist on the same file.
- Consolidate evidence signal for mapped iOS/backend/frontend semantic families by keeping highest-severity finding per file-family pair.
- Validate post-consolidation matrix to ensure duplicate removal does not change stage gate decisions.
- Add optional `consolidation.suppressed[]` trace in evidence to preserve auditability of removed duplicates.

## Next

- Heuristic policy consolidation:
  - Validate whether file-level family consolidation is enough or should evolve to line-aware grouping for multi-occurrence files.
  - Define query/reporting filters that can include/exclude `consolidation.suppressed[]` depending on consumer (human vs agent).
- Keep `docs/pr-reports/*` aligned with real commit history after each implementation step.

## Notes
