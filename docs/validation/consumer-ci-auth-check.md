# Consumer CI Auth Check

- generated_at: 2026-02-08T12:30:03.391Z
- target_repo: `SwiftEnProfundidad/R_GO`
- required_scopes: repo, workflow, user
- detected_scopes: gist, read:org, repo, workflow
- missing_scopes: user
- verdict: BLOCKED

## GH Auth Status

```text
github.com
  ✓ Logged in to github.com account SwiftEnProfundidad (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

## Repository Actions Permissions Probe

```json
{
  "enabled": true,
  "allowed_actions": "all",
  "sha_pinning_required": false
}
```

## Billing Probe

- error: Command failed: gh api users/SwiftEnProfundidad/settings/billing/actions gh: Not Found (HTTP 404) gh: This API operation needs the "user" scope. To request it, run: gh auth refresh -h github.com -s user

## Remediation

- Refresh auth adding `user` scope: `gh auth refresh -h github.com -s user`
- Re-run billing probe after scope refresh: `gh api users/<owner>/settings/billing/actions`

