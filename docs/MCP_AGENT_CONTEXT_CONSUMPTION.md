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
4. Load active ruleset provenance:
   - `GET /ai-evidence/rulesets`
5. Load active platform state:
   - `GET /ai-evidence/platforms`
6. Load full evidence only when needed:
   - `GET /ai-evidence` (or `?view=compact`)

## Deterministic Decision Gate (Agent Side)

Before generating code or applying edits, the agent should enforce:

- `/status.evidence.valid === true`
- `/status.evidence.version === "2.1"`
- `/ai-evidence/summary.snapshot.stage` is known (`PRE_COMMIT`, `PRE_PUSH`, `CI`)
- `/ai-evidence/summary.platforms` is non-empty for platform-scoped tasks

If any check fails, agent behavior should downgrade to:

- read-only diagnosis
- explicit blocker report
- no production code mutation

## Minimal Payload Strategy

Use compact endpoints first:

- `summary` for stage/outcome/counts
- `platforms` for targeting
- `rulesets` for policy provenance

Fetch full `/ai-evidence` only when:

- deep violation details are required
- consolidation/suppression analysis is required

## Example Flow

```bash
curl -s http://127.0.0.1:7341/health
curl -s http://127.0.0.1:7341/status
curl -s http://127.0.0.1:7341/ai-evidence/summary
curl -s http://127.0.0.1:7341/ai-evidence/rulesets
curl -s http://127.0.0.1:7341/ai-evidence/platforms
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
