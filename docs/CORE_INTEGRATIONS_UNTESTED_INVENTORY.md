# Deterministic Inventory: core/integrations without direct tests

## Criteria
- Scope: `*.ts` files under `core/` and `integrations/`, excluding `__tests__/`, `*.test.ts`, `*.spec.ts`, and `*.d.ts`.
- A file is considered "without direct test" when no sibling `file.test.ts` / `file.spec.ts` exists (or under local `__tests__/`).
- Deterministic impact prioritization: `score = (reverse_dependencies * 20) + loc`.
- Priority levels: `P1` (deps>=8 or loc>=220), `P2` (deps>=4 or loc>=140), `P3` (deps>=2 or loc>=70), `P4` otherwise.

## Summary
- Total source files analyzed: **204**
- Total test files detected: **208**
- Total without direct test: **22**
- Priority distribution: P1=1, P2=1, P3=9, P4=11

## Top 60 by impact
| Priority | Score | RevDeps | LOC | File |
|---|---:|---:|---:|---|
| P1 | 399 | 5 | 299 | `integrations/gate/stagePolicies.ts` |
| P2 | 138 | 4 | 58 | `integrations/platform/detectPlatforms.ts` |
| P3 | 172 | 2 | 132 | `integrations/mcp/evidenceContextServer.ts` |
| P3 | 131 | 3 | 71 | `integrations/mcp/evidencePayloadConfig.ts` |
| P3 | 103 | 2 | 63 | `integrations/sdd/types.ts` |
| P3 | 87 | 2 | 47 | `integrations/mcp/evidenceFacetsRulesets.ts` |
| P3 | 79 | 3 | 19 | `integrations/mcp/evidenceFacetsPlatforms.ts` |
| P3 | 75 | 2 | 35 | `integrations/mcp/evidenceFacetsFindings.ts` |
| P3 | 71 | 3 | 11 | `integrations/sdd/index.ts` |
| P3 | 66 | 3 | 6 | `integrations/mcp/evidenceFacets.ts` |
| P3 | 64 | 2 | 24 | `integrations/mcp/evidenceFacetsLedger.ts` |
| P4 | 82 | 1 | 62 | `integrations/mcp/evidencePayloadSummary.ts` |
| P4 | 46 | 1 | 26 | `integrations/platform/detectFrontend.ts` |
| P4 | 42 | 1 | 22 | `integrations/platform/detectAndroid.ts` |
| P4 | 39 | 1 | 19 | `integrations/platform/detectBackend.ts` |
| P4 | 22 | 1 | 2 | `integrations/mcp/evidenceFacetsSuppressedShare.ts` |
| P4 | 13 | 0 | 13 | `integrations/git/index.ts` |
| P4 | 13 | 0 | 13 | `integrations/mcp/evidenceContextServer.cli.ts` |
| P4 | 9 | 0 | 9 | `integrations/mcp/enterpriseServer.cli.ts` |
| P4 | 4 | 0 | 4 | `integrations/mcp/evidenceFacetsSnapshot.ts` |
| P4 | 3 | 0 | 3 | `integrations/mcp/evidenceFacetsBase.ts` |
| P4 | 2 | 0 | 2 | `integrations/mcp/index.ts` |

## Full artifact
- See full list in `docs/CORE_INTEGRATIONS_UNTESTED_INVENTORY.json`.

## Selected Initial Atomic Batch (Batch 01)
- `integrations/gate/stagePolicies.ts` (P1, score 399)
- `integrations/platform/detectPlatforms.ts` (P2, score 138)
- `integrations/mcp/evidenceContextServer.ts` (P3, score 172)

### Selection criteria
- Impact-first selection (score + priority) over the deterministic inventory.
- Cross-domain coverage (`gate`, `platform`, `mcp`) to reduce early systemic risk.
- Strict operational limit: maximum 3 files to keep the cycle atomic and traceable.

### Batch 01 exit criteria
- At least one direct unit test exists for each file in the batch.
- Batch tests pass locally.
- Tracker is updated with Batch 01 as ✅ and Batch 02 as the only 🚧 active task.
