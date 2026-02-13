# MCP Agent Context Consumption Pattern

## Purpose

Define a deterministic, provider-agnostic pattern for agents to consume Pumuki evidence context before taking repository actions.

This contract is read-only and does not modify gate decisions.

## Scope

Applies to any agent runtime (CLI, IDE extension, automation worker) that can perform HTTP requests.

## Required Pre-Action Sequence

1. Probe liveness:
   - `GET /health`
2. Validate evidence availability and baseline:
   - `GET /status`
3. Load compact execution context:
   - `GET /ai-evidence/summary`
4. Load deterministic snapshot details:
   - `GET /ai-evidence/snapshot`
5. Load deterministic findings list and optional filter/pagination slices:
   - `GET /ai-evidence/findings`
6. Load active ruleset provenance (and optional scoped/paginated filters):
   - `GET /ai-evidence/rulesets`
7. Load active platform state (and optional confidence/pagination slices):
   - `GET /ai-evidence/platforms`
8. Load active ledger continuity context (and optional time-window slice):
   - `GET /ai-evidence/ledger`
9. Load full evidence only when needed:
   - `GET /ai-evidence` (or `?view=compact`)

## Deterministic Decision Gate (Agent Side)

Before generating code or applying edits, the agent should enforce:

- `/status.evidence.valid === true`
- `/status.evidence.version === "2.1"`
- `/status.context_api.filters` exposes required filter keys before composing filtered requests
- `/status.context_api.pagination_bounds` exposes deterministic `max_limit` values per paginated endpoint
- `/ai-evidence/summary.snapshot.stage` is known (`PRE_COMMIT`, `PRE_PUSH`, `CI`)
- `/ai-evidence/summary.platforms` is non-empty for platform-scoped tasks

If any check fails, agent behavior should downgrade to:

- read-only diagnosis
- explicit blocker report
- no production code mutation

## Minimal Payload Strategy

Use compact endpoints first:

- `summary` for stage/outcome/counts
- `snapshot` for deterministic findings details
- `findings` for filtered violation slices (`severity`, `ruleId`, `platform`, `limit`, `offset`, bounded by `maxLimit=100`)
- `platforms` for targeting (`detectedOnly`, optional `confidence`, `limit`, `offset`, bounded by `maxLimit=100`)
- `ledger` for open-violation continuity (`lastSeenAfter`, `lastSeenBefore`, `limit`, `offset`, bounded by `maxLimit=100`)
- `rulesets` for policy provenance
- `rulesets?platform=...&bundle=...` for deterministic scoped provenance slices
- paginated endpoint responses expose `pagination.has_more` to drive deterministic page iteration
- `rulesets?limit=...&offset=...` for deterministic pagination (`maxLimit=100`)
- `ledger` for active recurring-violation continuity (`lastSeenAfter`/`lastSeenBefore`)

Fetch full `/ai-evidence` only when:

- deep violation details are required
- consolidation/suppression analysis is required

## Example Flow

```bash
curl -s http://127.0.0.1:7341/health
curl -s http://127.0.0.1:7341/status
curl -s http://127.0.0.1:7341/ai-evidence/summary
curl -s http://127.0.0.1:7341/ai-evidence/snapshot
curl -s "http://127.0.0.1:7341/ai-evidence/findings?severity=ERROR"
curl -s "http://127.0.0.1:7341/ai-evidence/findings?limit=20&offset=0"
curl -s http://127.0.0.1:7341/ai-evidence/rulesets
curl -s "http://127.0.0.1:7341/ai-evidence/rulesets?platform=backend&bundle=backend"
curl -s "http://127.0.0.1:7341/ai-evidence/rulesets?limit=20&offset=0"
curl -s http://127.0.0.1:7341/ai-evidence/platforms
curl -s "http://127.0.0.1:7341/ai-evidence/platforms?detectedOnly=false&confidence=LOW"
curl -s "http://127.0.0.1:7341/ai-evidence/platforms?detectedOnly=false&limit=20&offset=0"
curl -s http://127.0.0.1:7341/ai-evidence/ledger
curl -s "http://127.0.0.1:7341/ai-evidence/ledger?lastSeenAfter=2026-02-01t00:00:00.000z"
curl -s "http://127.0.0.1:7341/ai-evidence/ledger?lastSeenAfter=2026-02-01t00:00:00.000z&limit=20&offset=0"
```

## Failure Handling

- `404` on `/ai-evidence*`: evidence missing/invalid for v2.1.
- `status=degraded`: regenerate evidence before action.
- transport/connectivity failure: retry with bounded attempts, then fail closed.

## Security and Boundary Notes

- Context server is read-only.
- No credentials are embedded in responses.
- No writes are allowed through MCP evidence endpoints.

## Related References

- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/MCP_SERVERS.md`
- `docs/API_REFERENCE.md`
- `docs/REFRACTOR_PROGRESS.md`
