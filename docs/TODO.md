# Framework Work Tracking (TODO)

## Scope

This document tracks the agreed improvements for **Pumuki AST Intelligence Framework**.

## Done

- Refactor `README.md` to position the project as a framework (governance + lifecycle + commands).
- Add Git governance section documenting `ast:gitflow` and `ast:release` with options and flow.
- Add Developer Experience section (notifications + evidence freshness + git-tree guardrails).
- Make `docs/ARCHITECTURE.md` more normative by adding invariants + control primitives.

## In Progress

- Standardize visuals in `docs/images/` to consistent, resolution-independent assets.

## Next

### Documentation

- Add README section explaining manual hook-system usage:
  - interactive menu
  - non-interactive usage via `AUDIT_OPTION`
  - how `npx ast-hooks` maps to those flows
- Convert root `ARCHITECTURE.md` into **Conceptual Architecture** and link to `docs/ARCHITECTURE.md` as the contract.

### Framework Features

- Add `human_intent` to both:
  - `.AI_EVIDENCE.json` (source of truth)
  - AI Gate output/state (must not drift)

### Design Constraints

- Avoid drift: define a single canonical writer and a deterministic merge strategy.
- Ensure `expires_at` is enforced (ignore stale intent).

## Notes

- README uses inline HTML (`<img>`) for GitHub-friendly full-width rendering.
