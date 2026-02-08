# R_GO Workflow Lint Findings (Startup-Failure Triage)

Date: 2026-02-08  
Target repository: `SwiftEnProfundidad/R_GO`

## Objective

Run semantic workflow lint checks to detect invalid GitHub Actions workflow definitions that may explain persistent `startup_failure` runs with no jobs.

## Command Used

```bash
/tmp/actionlint-bin/actionlint -color -shellcheck= -pyflakes= \
  /Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO/.github/workflows/*.yml
```

## Findings

1. Unknown runner label in iOS workflow:

- file: `.github/workflows/ci-ios.yml`
- line: `runs-on: macos-13`
- lint: unknown label (`runner-label`)

2. Invalid action input in Lighthouse workflow:

- file: `.github/workflows/lighthouse.yml`
- line: `assertions: ...`
- lint: input `assertions` not defined for `treosh/lighthouse-ci-action@v12` (`action`)

3. Unknown runner label in nightly smoke workflow:

- file: `.github/workflows/nightly-platform-smoke.yml`
- line: `runs-on: macos-13`
- lint: unknown label (`runner-label`)

## Interpretation

These semantic workflow-definition errors are strong candidates for `startup_failure` with empty job graphs in `R_GO`.

## Next Action

Fix the invalid workflow definitions in `R_GO`, then re-run:

- `workflow_dispatch` smoke run
- `npm run validation:consumer-ci-artifacts -- --repo SwiftEnProfundidad/R_GO ...`

Expected post-fix signal:

- no startup-failure runs
- non-empty jobs list
- artifact endpoints return expected outputs when upload steps exist
