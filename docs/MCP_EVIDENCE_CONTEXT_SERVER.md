# MCP Evidence Context Server

Read-only server to expose deterministic evidence before agent actions.

## Endpoint

- `GET /ai-evidence`: returns `.ai_evidence.json` when `version === "2.1"`
- `GET /ai-evidence?includeSuppressed=false`: compact response without `consolidation.suppressed[]`
- `GET /ai-evidence?view=compact`: alias to hide `consolidation.suppressed[]`
- `GET /ai-evidence?view=full`: explicit full response (default behavior)
- `GET /health`: basic liveness probe

## Runtime

- Default host: `127.0.0.1`
- Default port: `7341`
- Default route: `/ai-evidence`

## CLI

```bash
npm run mcp:evidence
# or:
npx --yes tsx@4.21.0 integrations/mcp/evidenceContextServer.cli.ts
```

Environment variables:

- `PUMUKI_EVIDENCE_HOST`
- `PUMUKI_EVIDENCE_PORT`
- `PUMUKI_EVIDENCE_ROUTE`

## Guarantees

- Read-only: no writes, no mutation endpoints.
- Returns `404` when evidence is missing or not `v2.1`.
- Uses repository root `.ai_evidence.json` as source.
