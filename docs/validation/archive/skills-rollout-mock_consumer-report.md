# Skills Rollout Validation Report - pumuki-mock-consumer Consumer Repository

Date: 2026-02-08  
Framework branch: `enterprise-refactor`  
Consumer repository: `../pumuki-mock-consumer` (`develop`, upstream `origin/develop`)

## Scope

Validate the shared stage runners from this framework in a real consumer repository and capture evidence artifacts.

Executed stages:

- `PRE_COMMIT`
- `PRE_PUSH`
- `CI`
- `PRE_PUSH` rerun (determinism check)

## Commands

All commands executed from `../pumuki-mock-consumer`:

```bash
npx --yes tsx@4.21.0 /.../ast-intelligence-hooks/integrations/git/preCommitBackend.cli.ts
npx --yes tsx@4.21.0 /.../ast-intelligence-hooks/integrations/git/prePushBackend.cli.ts
npx --yes tsx@4.21.0 /.../ast-intelligence-hooks/integrations/git/ciBackend.cli.ts
npx --yes tsx@4.21.0 /.../ast-intelligence-hooks/integrations/git/prePushBackend.cli.ts
```

## Exit Codes

- `PRE_COMMIT`: `0`
- `PRE_PUSH`: `0`
- `CI`: `0`
- `PRE_PUSH` rerun: `0`

## Evidence Summary

Artifacts directory:

- `docs/validation/skills-rollout/artifacts/mock_consumer/`

Per stage evidence:

- `pre_commit.ai_evidence.json`
- `pre_push.ai_evidence.json`
- `ci.ai_evidence.json`
- `pre_push_rerun.ai_evidence.json`

Observed payload summary:

- `version`: `2.1`
- `snapshot.outcome`: `PASS` in all executed stages
- `snapshot.findings`: `[]`
- `platforms`: `{}`

Interpretation:

- The consumer range/staged scope used in this run produced no matching facts for platform detection.
- This validates orchestration + evidence generation path, but does not yet exercise positive platform detection paths.

## Determinism Result

Raw hash comparison for `PRE_PUSH` and rerun differs due to `timestamp`.

Normalized comparison (`jq -S 'del(.timestamp)'`) result:

- `cmp exit = 0` (semantic payload stable)

Supporting files:

- `pre_push.sha256`
- `pre_push_rerun.sha256`
- `pre_push.normalized.sha256`
- `pre_push_rerun.normalized.sha256`
- `pre_push.normalized.json`
- `pre_push_rerun.normalized.json`

## Notes

- `../pumuki-mock-consumer` was left clean after run (`.ai_evidence.json` removed from consumer workspace).
- This report is a first real-consumer execution checkpoint for Phase 5 rollout validation.
- Full matrix completion still requires consumer runs that activate each target platform (iOS/backend/frontend/android) with non-empty facts.
