# Skills Rollout Validation - Consumer CI Artifact Status

Date: 2026-02-08  
Target consumer repository: `SwiftEnProfundidad/R_GO`

## Objective

Collect CI artifact URLs from consumer-repository GitHub Actions runs to complement local stage-run rollout validation.

## Commands Executed

```bash
gh run list --repo SwiftEnProfundidad/R_GO --limit 20 \
  --json databaseId,displayTitle,headBranch,workflowName,status,conclusion,url,createdAt,event

gh api repos/SwiftEnProfundidad/R_GO/actions/runs/<run_id>/artifacts
```

## Observed State

- Recent runs are consistently `startup_failure`.
- `workflowName` is empty in listed runs.
- Run metadata shows `path: "BuildFailed"` and no referenced workflows.
- GitHub Actions check-suite for those commits is completed with `startup_failure` and `latest_check_runs_count: 0`.
- Artifact API returns `total_count: 0` for inspected run IDs.

Sample run URLs:

- `https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21790671740`
- `https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21790670134`
- `https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21790667107`

Sample artifact query result:

- `GET /repos/SwiftEnProfundidad/R_GO/actions/runs/21790671740/artifacts`
- response: `{ "total_count": 0, "artifacts": [] }`

Additional API probe summary:

- `GET /repos/SwiftEnProfundidad/R_GO/actions/runs/21790671740`
  - `name: ""`
  - `path: "BuildFailed"`
  - `conclusion: "startup_failure"`
- `GET /repos/SwiftEnProfundidad/R_GO/check-suites/56738342712`
  - `conclusion: "startup_failure"`
  - `latest_check_runs_count: 0`

## Conclusion

Consumer CI artifact URLs cannot be attached yet because runs are failing at startup and do not emit artifacts.

## Next Action

Restore consumer workflow startup health first, then rerun and capture artifact URLs for:

- `PRE_COMMIT`/`PRE_PUSH`/`CI` evidence artifacts
- corresponding run URL + artifact URL pairs for rollout traceability
