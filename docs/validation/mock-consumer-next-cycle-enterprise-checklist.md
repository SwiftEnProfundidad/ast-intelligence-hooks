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
   - PRE_PUSH precondition must be true:
     - `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
   - Upstream recovery (pick one mode only):
     - Local mock mode (no valid remote): `git branch --set-upstream-to=main <branch>`
     - Remote mode (valid `origin`): `git push --set-upstream origin <branch>`
   - Pass condition for block 1:
     - `git status --short` => empty
     - `git rev-parse --abbrev-ref HEAD` => expected branch
     - `git rev-parse --abbrev-ref --symbolic-full-name @{u}` => non-empty ref
2. `⏳` Install target package version
   - `npm install --save-exact pumuki@<version>`
   - `npx pumuki install`
   - Pass condition for block 2:
     - `npx pumuki install` exits `0`
     - hooks report as managed in output
3. `⏳` Deterministic matrix run
   - `npm run pumuki:matrix`
   - Expected:
    - `clean => 0/0/0`
    - `violations => 1/1/1`
    - `mixed => 1/1/1`
   - Pass condition for block 3:
     - process exit `0`
     - output contains `All scenario matrix checks passed`
4. `⏳` Stage/evidence contract run (temp clone)
   - Use a temp clone of mock repo.
   - Open SDD session and run violations path for `PRE_COMMIT`, `PRE_PUSH`, `CI`.
   - Use explicit commands (no implicit range resolution):
     - `npx pumuki-pre-commit`
     - `npx pumuki-pre-push`
     - `GITHUB_BASE_REF=<base-branch> npx pumuki-ci`
   - Validate stage tag after each run:
     - `jq -r '.snapshot.stage + \" \" + .snapshot.outcome' .ai_evidence.json`
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

## Command Template (No Ambiguity)

```bash
cd /Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer

# Block 1: preflight
git status --short --branch
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u}

# If @{u} fails:
# - local mock mode: git branch --set-upstream-to=main <branch>
# - remote mode:     git push --set-upstream origin <branch>

# Block 2: install
npm install --save-exact pumuki@latest
npx pumuki install

# Block 3: matrix
npm run pumuki:matrix
```

## Stop Rule (Mandatory)

- If any block fails, stop immediately.
- Record the failure signature and command output.
- Do not continue to the next block until the failing block is resolved or explicitly marked as blocked.

## Acceptance Criteria

- Matrix exits match expected deterministic contract exactly.
- Stage summaries expose valid `snapshot.stage` and `snapshot.outcome`.
- Findings totals are stable for equivalent inputs.
- Ruleset bundles are present for all validated stages.
- No ad-hoc bypass needed for standard matrix execution.
- PRE_PUSH is never executed without upstream configured.
- CI runs use explicit `GITHUB_BASE_REF=<base-branch>` in validation checklist flows (fallback testing is handled as a separate dedicated test case).

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

## Anti-Ambiguity Rules (Mandatory)

1. Never validate PRE_PUSH on a branch without upstream.
2. Never validate CI range behavior without setting `GITHUB_BASE_REF` in the command line.
3. If fallback behavior needs validation, execute it in a dedicated task with explicit subcases (`origin/main`, `main`, `HEAD`) and do not mix it with standard checklist execution.
