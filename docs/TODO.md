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

## In Progress

- Standardize visuals in `docs/images/` to consistent, resolution-independent assets.

## Next

### Documentation

- Add README section explaining manual hook-system usage:
  - interactive menu
  - non-interactive usage via `AUDIT_OPTION`
  - how `npx ast-hooks` maps to those flows
- Convert root `ARCHITECTURE.md` into **Conceptual Architecture** and link to `docs/ARCHITECTURE.md` as the contract.

### Design Constraints

- Avoid drift: define a single canonical writer and a deterministic merge strategy.

## Notes

- README uses inline HTML (`<img>`) for GitHub-friendly full-width rendering.
