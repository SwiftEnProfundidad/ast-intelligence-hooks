# Skills Phase 5 Rollout Validation (Consumer Repositories)

## Objective

Validate that repository-enforced skills (`skills.lock.json` + `skills.policy.json`) behave deterministically across `PRE_COMMIT`, `PRE_PUSH`, and `CI` in real consumer repositories.

## Scope

- Framework line: `enterprise-refactor`
- Evidence contract: `.ai_evidence.json` with `version: "2.1"`
- Target platforms in consumer repos:
  - iOS (`.swift`)
  - Backend (`apps/backend/**/*.ts`)
  - Frontend (`apps/frontend/**/*.{ts,tsx,js,jsx}`)
  - Android (`.kt`, `.kts`)

## Preconditions

1. Consumer repository is pinned to a framework revision that includes:
   - stage runners (`PRE_COMMIT`, `PRE_PUSH`, `CI`)
   - deterministic evidence v2.1
   - skills lock/policy integration
2. `skills.lock.json`, `skills.policy.json`, and `skills.sources.json` are committed.
3. Local runtime and CI use the same Node major version.
4. Baseline checks are green:
   - `npm ci`
   - `npm run skills:lock:check`
   - `npm run test:deterministic`

## Validation Matrix

Use this table per consumer repository and append execution links/artifacts.

| Consumer Repo | Stage | Command | Expected Gate Behavior | Evidence Checks |
| --- | --- | --- | --- | --- |
| iOS consumer | PRE_COMMIT | `npx tsx integrations/git/preCommitIOS.cli.ts` | Blocks on `CRITICAL`, warns on `ERROR` | `snapshot.stage=PRE_COMMIT`, `version=2.1`, skills ruleset trace present |
| iOS consumer | PRE_PUSH | `npx tsx integrations/git/prePushIOS.cli.ts` | Blocks on `ERROR`, warns on `WARN` | `snapshot.stage=PRE_PUSH`, range scope reflected by findings |
| iOS consumer | CI | `npx tsx integrations/git/ciIOS.cli.ts` | Blocks on `ERROR`, warns on `WARN` | `snapshot.stage=CI`, deterministic rerun unchanged |
| Backend consumer | PRE_COMMIT | `npx tsx integrations/git/preCommitBackend.cli.ts` | Blocks on `CRITICAL`, warns on `ERROR` | `platforms.backend.detected=true` |
| Backend consumer | PRE_PUSH | `npx tsx integrations/git/prePushBackend.cli.ts` | Blocks on `ERROR`, warns on `WARN` | `snapshot.stage=PRE_PUSH` |
| Backend consumer | CI | `npx tsx integrations/git/ciBackend.cli.ts` | Blocks on `ERROR`, warns on `WARN` | CI artifact contains `.ai_evidence.json` |
| Frontend consumer | PRE_COMMIT | `npx tsx integrations/git/preCommitFrontend.cli.ts` | Blocks on `CRITICAL`, warns on `ERROR` | `platforms.frontend.detected=true` |
| Frontend consumer | PRE_PUSH | `npx tsx integrations/git/prePushFrontend.cli.ts` | Blocks on `ERROR`, warns on `WARN` | `snapshot.stage=PRE_PUSH` |
| Frontend consumer | CI | `npx tsx integrations/git/ciFrontend.cli.ts` | Blocks on `ERROR`, warns on `WARN` | CI artifact contains `.ai_evidence.json` |
| Android consumer | PRE_COMMIT | `npx tsx integrations/git/preCommitAndroid.cli.ts` | Blocks on `CRITICAL`, warns on `ERROR` | `platforms.android.detected=true` |
| Android consumer | PRE_PUSH | `npx tsx integrations/git/prePushAndroid.cli.ts` | Blocks on `ERROR`, warns on `WARN` | `snapshot.stage=PRE_PUSH` |
| Android consumer | CI | `npx tsx integrations/git/ciAndroid.cli.ts` | Blocks on `ERROR`, warns on `WARN` | CI artifact contains `.ai_evidence.json` |

## Evidence Assertions

Validate each run with deterministic checks:

```bash
jq -r '.version' .ai_evidence.json
jq -r '.snapshot.stage' .ai_evidence.json
jq -r '.snapshot.outcome' .ai_evidence.json
jq -r '.rulesets[]?.bundle' .ai_evidence.json
jq -r '.platforms | keys[]' .ai_evidence.json
```

Expected:

- version equals `2.1`
- stage equals executed stage
- `rulesets[]` includes active baseline/project/skills bundles
- platform keys match detected facts

## Determinism Check

Run the same stage twice without code changes:

1. Execute stage command.
2. Save `sha256` of `.ai_evidence.json` (raw).
3. Execute stage command again.
4. Compare normalized payloads with `timestamp` removed.

Why normalized compare:

- `timestamp` is expected to change between executions.
- Determinism target is stable semantic content (snapshot/findings/platforms/rulesets), not byte-identical wall-clock metadata.

Example:

```bash
cp .ai_evidence.json /tmp/evidence-1.json
# re-run the same stage command
cp .ai_evidence.json /tmp/evidence-2.json

jq -S 'del(.timestamp)' /tmp/evidence-1.json > /tmp/evidence-1.normalized.json
jq -S 'del(.timestamp)' /tmp/evidence-2.json > /tmp/evidence-2.normalized.json
cmp -s /tmp/evidence-1.normalized.json /tmp/evidence-2.normalized.json
```

## Artifact Checklist (Per Consumer Repo)

- Command logs (`PRE_COMMIT`, `PRE_PUSH`, `CI`)
- `.ai_evidence.json` per stage
- Determinism hash comparison output
- CI artifact URL
- Commit SHA and branch evaluated

## Current Execution Status

This runbook is prepared and versioned. Execution in external consumer repositories must be attached to this file (or sibling reports under `docs/validation/`) before marking Phase 5 rollout validation as complete.

## Execution Reports

- `docs/validation/archive/skills-rollout-consumer-ci-artifacts.md` (consumer GitHub Actions artifact availability status)

Archived historical reports:

- `docs/validation/archive/skills-rollout-r_go-report.md` (initial real-consumer checkpoint)
- `docs/validation/archive/skills-rollout-r_go-multi-platform-report.md` (positive multi-platform detection across `PRE_COMMIT`, `PRE_PUSH`, and `CI`)
- `docs/validation/archive/skills-rollout-r_go-workflow-lint.md` (semantic workflow lint findings linked to startup-failure triage)
- `docs/validation/archive/skills-rollout-r_go-startup-fix-experiment.md` (branch-only remediation test outcome)
- `docs/validation/archive/private-actions-healthcheck.md` (account-level private Actions reproduction evidence)

Generated diagnostic outputs (not versioned by default):

- `docs/validation/consumer-ci-artifacts-report.md`
- `docs/validation/consumer-workflow-lint-report.md`
- `docs/validation/consumer-startup-failure-support-bundle.md`
- `docs/validation/consumer-ci-auth-check.md`
- `docs/validation/consumer-support-ticket-draft.md`
