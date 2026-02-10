# pumuki-mock-consumer Startup Failure Fix Experiment (Negative Result)

Date: 2026-02-08  
Target repository: `SwiftEnProfundidad/pumuki-mock-consumer`

## Objective

Validate whether fixing semantic workflow lint findings removes persistent GitHub Actions `startup_failure`.

## Experiment Setup

- Base: `origin/develop`
- Isolated worktree and temporary branch:
  - `pumuki/ci-startup-fix-test-20260208124846`
- Minimal workflow fixes applied in temp branch:
  - `.github/workflows/ci-ios.yml`: `runs-on: macos-13 -> macos-14`
  - `.github/workflows/nightly-platform-smoke.yml`: `runs-on: macos-13 -> macos-14`
  - `.github/workflows/lighthouse.yml`: removed unsupported `assertions` input for `treosh/lighthouse-ci-action@v12`

## Triggered Runs

- Push run:
  - `https://github.com/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21797634826`
  - conclusion: `startup_failure`
- Manual dispatch (`branch-protection-drift`):
  - `https://github.com/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21797634821`
  - conclusion: `startup_failure`

## Result

Workflow lint fixes alone did **not** resolve startup failure.

## Interpretation

Semantic workflow-definition issues are not sufficient to explain the incident in this consumer repository context. Remaining candidates are repository/account-level constraints (policy, billing, or platform-level controls).

## Cleanup

- Temporary branch deleted from remote.
- Isolated worktree removed.
- Consumer main workspace left clean.
