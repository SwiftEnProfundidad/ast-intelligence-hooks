# Consumer Startup Failure Support Bundle

- generated_at: 2026-02-08T12:14:35.737Z
- target_repo: `SwiftEnProfundidad/R_GO`
- repo_visibility: `private` (private=true)
- runs_checked: 20
- startup_failure_runs: 20

## GH Auth Status

```text
github.com
  ✓ Logged in to github.com account SwiftEnProfundidad (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

## Run Summary

| run_id | workflow | event | branch | status | conclusion | url |
| --- | --- | --- | --- | --- | --- | --- |
| 21797965465 | (empty) | push | develop | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797965465 |
| 21797965431 | (empty) | pull_request | fix/admin-tenant-scope-hardening | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797965431 |
| 21797647486 | (empty) | schedule | main | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797647486 |
| 21797644994 | (empty) | pull_request | fix/admin-tenant-scope-hardening | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797644994 |
| 21797635751 | (empty) | push | fix/admin-tenant-scope-hardening | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797635751 |
| 21797634826 | (empty) | push | pumuki/ci-startup-fix-test-20260208124846 | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797634826 |
| 21797634821 | branch-protection-drift | workflow_dispatch | pumuki/ci-startup-fix-test-20260208124846 | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797634821 |
| 21797507933 | (empty) | push | develop | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797507933 |
| 21797505622 | (empty) | pull_request | fix/filters-tenant-scoping | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797505622 |
| 21797505584 | (empty) | push | main | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797505584 |
| 21797503163 | (empty) | pull_request | fix/filters-tenant-scoping | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797503163 |
| 21797501247 | (empty) | push | fix/filters-tenant-scoping | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797501247 |
| 21797452388 | (empty) | push | develop | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797452388 |
| 21797451099 | (empty) | push | main | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797451099 |
| 21797451068 | (empty) | pull_request | fix/filters-region-normalization | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797451068 |
| 21797449978 | (empty) | pull_request | fix/filters-region-normalization | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797449978 |
| 21797448313 | (empty) | push | fix/filters-region-normalization | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797448313 |
| 21797396563 | (empty) | schedule | main | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797396563 |
| 21796731599 | (empty) | schedule | main | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21796731599 |
| 21795995947 | (empty) | schedule | main | completed | startup_failure | https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21795995947 |

## Run Diagnostics

### Run 21797965465

- url: https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797965465
- workflowName: (empty)
- event: push
- conclusion: startup_failure
- path: BuildFailed
- referenced_workflows: 0
- jobs.total_count: 0
- artifacts.total_count: 0

### Run 21797965431

- url: https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797965431
- workflowName: (empty)
- event: pull_request
- conclusion: startup_failure
- path: BuildFailed
- referenced_workflows: 0
- jobs.total_count: 0
- artifacts.total_count: 0

### Run 21797647486

- url: https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797647486
- workflowName: (empty)
- event: schedule
- conclusion: startup_failure
- path: BuildFailed
- referenced_workflows: 0
- jobs.total_count: 0
- artifacts.total_count: 0

### Run 21797644994

- url: https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797644994
- workflowName: (empty)
- event: pull_request
- conclusion: startup_failure
- path: BuildFailed
- referenced_workflows: 0
- jobs.total_count: 0
- artifacts.total_count: 0

### Run 21797635751

- url: https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797635751
- workflowName: (empty)
- event: push
- conclusion: startup_failure
- path: BuildFailed
- referenced_workflows: 0
- jobs.total_count: 0
- artifacts.total_count: 0

## Support Payload (Copy/Paste)

```text
Persistent GitHub Actions startup_failure in private repository.

Repository: SwiftEnProfundidad/R_GO
Visibility: private
Runs checked: 20
startup_failure runs: 20

Sample run URLs:
- https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797965465
- https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797965431
- https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21797647486

Observed pattern: workflow startup fails before jobs are created (jobs.total_count=0) and artifacts are absent (artifacts.total_count=0).
Please verify account/repo-level restrictions for private Actions execution (policy, billing, quotas, or platform controls).
```

