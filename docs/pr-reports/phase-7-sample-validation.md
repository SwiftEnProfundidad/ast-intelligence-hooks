# Phase 7 - Sample Consumer Validation

## Objective

Validate PRE_COMMIT / PRE_PUSH / CI stage runners against temporary consumer repositories and confirm deterministic `ai_evidence v2.1` behavior.

## Commits

- `3f9948c` fix(evidence): align snapshot outcome with gate decision
- `077f946` docs(validation): record sample consumer gate verification
- `610fec0` feat(heuristics): promote iOS AnyView heuristic to ERROR for PRE_PUSH and CI
- `05a5352` feat(heuristics): promote explicit-any heuristic to ERROR for PRE_PUSH and CI
- `d51bb6a` feat(heuristics): promote iOS callback-style heuristic to ERROR for PRE_PUSH and CI

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
- Heuristics-enabled backend matrix confirms:
  - clean scenario: `PRE_COMMIT/PRE_PUSH/CI` all `PASS`, exit `0`
  - `explicit-any` scenario: `PRE_COMMIT` non-blocking (`PASS`, exit `0`), `PRE_PUSH/CI` blocking (`BLOCK`, exit `1`)
  - `empty-catch` scenario in backend is dominated by baseline rule (`backend.no-empty-catch: CRITICAL`) and blocks all stages
- Heuristics-enabled frontend matrix confirms:
  - `explicit-any` scenario: `PRE_COMMIT` non-blocking (`PASS`, exit `0`), `PRE_PUSH/CI` blocking (`BLOCK`, exit `1`)
  - `empty-catch` scenario (non-promoted heuristic): `PRE_COMMIT` non-blocking (`PASS`, exit `0`), `PRE_PUSH/CI` non-blocking warnings (`WARN`, exit `0`)
- Rule pack/evaluator consistency:
  - heuristics bundle is always recorded as `heuristics:astHeuristicsRuleSet@0.2.0` when flag is enabled.
- Post-consolidation matrix (`9ce666d`) confirms evidence noise reduction without gate drift:
  - backend `explicit-any`: `PRE_COMMIT` keeps baseline `WARN`; `PRE_PUSH/CI` keep only promoted heuristic `ERROR` (blocking preserved)
  - backend `empty-catch`: only baseline `backend.no-empty-catch:CRITICAL` remains (heuristic duplicate removed)
  - frontend `explicit-any`: heuristic-only path unchanged (`WARN` in `PRE_COMMIT`, `ERROR` in `PRE_PUSH/CI`)
  - frontend `empty-catch`: non-promoted heuristic remains non-blocking (`PASS/WARN` with exit `0`)
