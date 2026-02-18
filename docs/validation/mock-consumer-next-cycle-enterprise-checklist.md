# Mock Consumer Next-Cycle Enterprise Checklist

Operational checklist for the next mock validation cycle after the post-release hardening closeout.

## Legend

- `✅` completed
- `🚧` in progress (single active item)
- `⏳` pending

## Scope

- Target repository: `pumuki-mock-consumer`
- Goal: keep deterministic matrix + stage/evidence contract stable across cycles.
- Constraint: execute validations in mock repository only (not in framework repository).

## Execution Sequence

1. `⏳` Baseline preflight
   - `git status --short --branch` must be clean.
   - Ensure branch is the expected validation branch.
2. `⏳` Install target package version
   - `npm install --save-exact pumuki@<version>`
   - `npx pumuki install`
3. `⏳` Deterministic matrix run
   - `npm run pumuki:matrix`
   - Expected:
     - `clean => 0/0/0`
     - `violations => 1/1/1`
     - `mixed => 1/1/1`
4. `⏳` Stage/evidence contract run (temp clone)
   - Use a temp clone of mock repo.
   - Open SDD session and run violations path for `PRE_COMMIT`, `PRE_PUSH`, `CI`.
5. `⏳` Ruleset bundle contract verification
   - Confirm stage outputs include:
     - `androidRuleSet@1.0.0`
     - `backendRuleSet@1.0.0`
     - `frontendRuleSet@1.0.0`
     - `iosEnterpriseRuleSet@1.0.0`
     - `project-rules`
     - `gate-policy.default.<stage>`
6. `⏳` Closeout update
   - Append command output summary to handoff pack.
   - Update tracker with `✅` for completed step and move `🚧` to the next item.

## Acceptance Criteria

- Matrix exits match expected deterministic contract exactly.
- Stage summaries expose valid `snapshot.stage` and `snapshot.outcome`.
- Findings totals are stable for equivalent inputs.
- Ruleset bundles are present for all validated stages.
- No ad-hoc bypass needed for standard matrix execution.

## Required Output Artifacts

- Runtime summary in:
  - `docs/validation/mock-consumer-post-release-handoff-pack.md`
- Progress tracking in:
  - `docs/REFRACTOR_PROGRESS.md`

## Common Failure Signatures

- `SDD_SESSION_MISSING`:
  - session lifecycle not initialized for current run.
- `methodology.tdd.backend-domain-change-requires-tests` in `clean`:
  - missing backend domain test artifact in clean scenario.
- `methodology.bdd.backend-application-change-requires-spec` in `clean`:
  - missing backend spec artifact recognized by commit-range diff extensions.
