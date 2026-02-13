# MCP Evidence Context Server

Read-only server to expose deterministic evidence before agent actions.

## Endpoint

- `GET /ai-evidence`: returns `.ai_evidence.json` when `version === "2.1"`
- `GET /ai-evidence?includeSuppressed=false`: compact response without `consolidation.suppressed[]`
- `GET /ai-evidence?view=compact`: alias to hide `consolidation.suppressed[]`
- `GET /ai-evidence?view=full`: explicit full response (default behavior)
- `GET /ai-evidence/summary`: compact deterministic summary (`stage/outcome/counts/detected platforms`)
- `GET /ai-evidence/snapshot`: deterministic snapshot payload (`stage/outcome/findings_count/findings[]`)
- `GET /ai-evidence/findings`: deterministic findings list with optional filters (`severity`, `ruleId`, `platform`)
- `GET /ai-evidence/rulesets`: deterministic sorted list of loaded rulesets (`platform/bundle/hash`)
- `GET /ai-evidence/rulesets?platform=...&bundle=...`: deterministic filtered rulesets slice
- `GET /ai-evidence/platforms`: detected platforms only (default)
- `GET /ai-evidence/platforms?detectedOnly=false`: all tracked platforms with detection state
- `GET /ai-evidence/platforms?detectedOnly=false&confidence=LOW`: deterministic filtered slice by confidence
- `GET /ai-evidence/ledger`: deterministic sorted ledger entries (`ruleId/file/lines/firstSeen/lastSeen`)
- `GET /health`: basic liveness probe
- `GET /status`: lightweight summary (`present/valid/version/stage/outcome/counts`) without returning full evidence payload

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
