# Private Actions Healthcheck Repository Result

Date: 2026-02-08  
Repository: `SwiftEnProfundidad/pumuki-actions-healthcheck-temp` (temporary)

## Objective

Verify whether `startup_failure` reproduces outside `R_GO` using a minimal private repository workflow.

## Minimal Workflow

```yaml
name: Health
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: echo "ok"
```

## Result

- Run URL: `https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21797682919`
- Conclusion: `startup_failure`
- Jobs created: `0`

## Interpretation

`startup_failure` reproduces in a brand-new private repository with a minimal valid workflow, strongly indicating an account-level/private-repo Actions restriction.

## Cleanup Status

- Temporary repository could not be deleted automatically due to missing `delete_repo` token scope.
- Repository was archived and labeled as temporary pending manual deletion after scope refresh.
