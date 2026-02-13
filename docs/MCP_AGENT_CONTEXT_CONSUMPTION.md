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

- `summary` for stage/outcome/has-findings/counts, severity distribution (`severity_counts`), highest severity (`highest_severity`), blocking findings count (`blocking_findings_count`), findings platform distribution (`findings_by_platform`), ledger platform distribution (`ledger_by_platform`), tracked-platform count (`tracked_platforms_count`), detected-platform count (`detected_platforms_count`), non-detected platform count (`non_detected_platforms_count`), policy coverage (`rulesets_by_platform`), and deterministic ruleset signature (`rulesets_fingerprint`)
- `snapshot` for deterministic findings details
- `findings` for filtered violation slices (`severity`, `ruleId`, `platform`, `limit`, `offset`, bounded by `maxLimit=100`)
- `platforms` for targeting (`detectedOnly`, optional `confidence`, `limit`, `offset`, bounded by `maxLimit=100`)
- `ledger` for open-violation continuity (`lastSeenAfter`, `lastSeenBefore`, `limit`, `offset`, bounded by `maxLimit=100`)
- `rulesets` for policy provenance
- `rulesets?platform=...&bundle=...` for deterministic scoped provenance slices
- paginated endpoint responses expose `pagination.has_more` to drive deterministic page iteration
- `rulesets?limit=...&offset=...` for deterministic pagination (`maxLimit=100`)

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

## Pagination Contract Snippets

Status capability contract:

```json
{
  "context_api": {
    "pagination_bounds": {
      "findings": { "max_limit": 100 },
      "rulesets": { "max_limit": 100 },
      "platforms": { "max_limit": 100 },
      "ledger": { "max_limit": 100 }
    }
  }
}
```

Paginated endpoint metadata contract:

```json
{
  "total_count": 3,
  "pagination": {
    "requested_limit": 1,
    "max_limit": 100,
    "limit": 1,
    "offset": 1,
    "has_more": true
  }
}
```

Summary facet contract:

```json
{
  "snapshot": {
    "has_findings": true,
    "severity_counts": {
      "ERROR": 1,
      "WARN": 1
    },
    "highest_severity": "ERROR",
    "blocking_findings_count": 1,
    "findings_by_platform": {
      "backend": 1,
      "ios": 1
    }
  },
  "rulesets_by_platform": {
    "backend": 1,
    "ios": 1
  },
  "ledger_by_platform": {
    "backend": 1,
    "ios": 1
  },
  "tracked_platforms_count": 3,
  "detected_platforms_count": 2,
  "non_detected_platforms_count": 1,
  "rulesets_fingerprint": "222|111"
}
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
