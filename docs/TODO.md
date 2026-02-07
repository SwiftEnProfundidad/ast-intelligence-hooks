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

## Next

- Documentation hygiene pass:
  - Audit all `*.md` files for stale legacy references (old hooks, daemons, removed workflows, obsolete commands).
  - Mark each document as keep/update/archive/delete and execute cleanup incrementally by phase.
  - Continue with secondary docs after user-facing cleanup (`docs/HOW_IT_WORKS.md`, `docs/API_REFERENCE.md`, legacy migration/release docs).
  - Keep `docs/pr-reports/*` aligned with real commit history after each implementation step.

## Notes

- README uses inline HTML (`<img>`) for GitHub-friendly full-width rendering.
