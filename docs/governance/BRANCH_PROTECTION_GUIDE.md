# Branch Protection Guide (v2.x)

Recommended protection for `main` in this repository.

## Core protection settings

Enable:

- Require pull request before merging
- Require at least 1 approval
- Dismiss stale approvals on new commits
- Require conversation resolution
- Require status checks to pass
- Require branch to be up to date before merge
- Restrict direct pushes to maintainers
- Disallow force pushes
- Disallow branch deletion

## Suggested required checks

Use the active workflow/job checks from this repository:

- `Lint`
- `Type Check`
- `Build Verification`
- `Pumuki Deterministic Tests`
- `Pumuki Heuristics Tests`
- `iOS Gate`
- `Backend Gate`
- `Frontend Gate`
- `Android Gate`

Depending on your GitHub check context naming, these may appear as workflow/job variants. Configure the exact check names shown in your branch protection UI.

## Optional checks

- Signed commits (recommended for stricter governance)
- CODEOWNERS review requirement

## Setup steps

1. Open repository settings: `Settings -> Branches`
2. Add rule for `main`
3. Enable the core settings above
4. Add required checks from recent successful runs
5. Save and verify with a test PR

## Maintenance

When workflow names/jobs change, update required checks in branch protection immediately to avoid accidental bypasses or merge deadlocks.
