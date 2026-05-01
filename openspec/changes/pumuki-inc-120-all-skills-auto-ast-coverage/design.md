## Context

Pumuki is a brownfield enforcement product. Consumers depend on a stable audit menu and on AST Intelligence findings that reflect the active skill contract across iOS, Android, backend, and frontend scopes. This change is constrained by existing CLI surfaces and by the hard rule that retired tracking mirrors must not compete with `PUMUKI-RESET-MASTER-PLAN.md`.

## Goals / Non-Goals

**Goals:**

- Preserve the legacy consumer menu and audit output format while retaining internal engine flows.
- Classify active skills into AST-enforced and operational-only categories.
- Prevent detector false positives from treating neutral names such as report keys or base contract nodes as configuration secrets.
- Keep evidence summaries tied to rule and platform coverage rather than path heuristics alone.

**Non-Goals:**

- Redesign the Pumuki CLI from scratch.
- Replace the skills lock format.
- Declare every unsupported detector mapped in this slice before the mapping implementation is complete.

## Decisions

- Keep consumer menu labels simple and stable, with advanced engine flows hidden from the default consumer view.
- Use exact identifier tokens for hardcoded-configuration detection instead of substring matching.
- Treat numeric literals `0` and `1`, enum declarations, and type-only contexts as neutral for magic-number detection.
- Use `PUMUKI-RESET-MASTER-PLAN.md` as the only live tracking source for this repo.

## Risks / Trade-offs

- Unsupported detector mappings may still block strict governance until the full PUMUKI-INC-120 mapping is completed -> mitigate by committing small verified slices and keeping the blocker explicit.
- OpenSpec validation can become noisy if artifacts are created without real scope -> mitigate by keeping this change tied to concrete detector, menu, evidence, and skill coverage work.
