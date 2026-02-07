# Phase 7 - Sample Consumer Validation

## Objective

Validate PRE_COMMIT / PRE_PUSH / CI stage runners against temporary consumer repositories and confirm deterministic `ai_evidence v2.1` behavior.

## Commits

- `3f9948c` fix(evidence): align snapshot outcome with gate decision

## Scope

- End-to-end stage execution using temporary git repositories:
  - `integrations/git/preCommitIOS.cli.ts`
  - `integrations/git/prePushIOS.cli.ts`
  - `integrations/git/ciIOS.cli.ts`
- Evidence consistency fix:
  - `integrations/evidence/buildEvidence.ts`
  - `integrations/git/runPlatformGate.ts`
  - `integrations/evidence/__tests__/buildEvidence.test.ts`

## Validation status

- Multi-platform validation sample (`apps/ios`, `apps/backend`, `apps/frontend`, `apps/android`) confirms:
  - platform detection includes all active platforms (`ios`, `backend`, `frontend`, `android`)
  - rulesets bundle list includes all detected baseline packs plus backend/gold pack metadata
  - all stages emit deterministic `version: "2.1"` evidence
- Stage policy validation sample (`ERROR`-only case) confirms:
  - `PRE_COMMIT` -> gate outcome `WARN`, exit code `0`
  - `PRE_PUSH` -> gate outcome `BLOCK`, exit code `1`
  - `CI` -> gate outcome `BLOCK`, exit code `1`
- Regression fixed:
  - evidence snapshot outcome now mirrors evaluated gate decision instead of severity-only fallback.
