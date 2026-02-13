# MCP Servers (v2.x)

This repository currently exposes a single active MCP-oriented server implementation:

- **Evidence Context Server** (read-only)

## Evidence Context Server

### Source files

- `integrations/mcp/evidenceContextServer.ts`
- `integrations/mcp/evidenceContextServer.cli.ts`
- `integrations/mcp/index.ts`

### Purpose

Expose deterministic evidence (`.ai_evidence.json`) to external agents without allowing writes.

### Contract

- Serves evidence only when file exists and `version === "2.1"`.
- Returns deterministic JSON payload from local repo root.

### Default runtime

- Host: `127.0.0.1`
- Port: `7341`
- Route: `/ai-evidence`

### Endpoints

- `GET /health`
  - `200 { "status": "ok" }`
- `GET /status`
  - `200` with evidence health summary and `context_api` filter/pagination capabilities
- `GET /ai-evidence`
  - `200` with evidence payload when valid
  - `404` when missing or invalid
- `GET /ai-evidence/summary`
  - `200` with compact deterministic summary (including `snapshot.has_findings`, `snapshot.severity_counts`, `snapshot.findings_by_platform`, `snapshot.highest_severity`, `ledger_by_platform`, and `rulesets_by_platform`)
  - `404` when missing or invalid
- `GET /ai-evidence/snapshot`
  - `200` with deterministic snapshot + findings
  - `404` when missing or invalid
- `GET /ai-evidence/findings`
  - `200` with deterministic findings list
  - supports `?severity=...&ruleId=...&platform=...`
  - supports `?limit=...&offset=...` for deterministic pagination
  - applies deterministic `maxLimit=100` bound
  - paginated responses include `pagination.has_more`
  - `404` when missing or invalid
- `GET /ai-evidence/rulesets`
  - `200` with deterministic sorted rulesets
  - supports `?platform=...&bundle=...` for deterministic filtered slices
  - supports `?limit=...&offset=...` for deterministic pagination (`maxLimit=100`)
  - paginated responses include `pagination.has_more`
  - `404` when missing or invalid
- `GET /ai-evidence/platforms`
  - `200` with detected platforms only
  - supports `?detectedOnly=false` for full platform state
  - supports `?confidence=HIGH|MEDIUM|LOW` for deterministic filtered slices
  - supports `?limit=...&offset=...` for deterministic pagination (`maxLimit=100`)
  - paginated responses include `pagination.has_more`
  - `404` when missing or invalid
- `GET /ai-evidence/ledger`
  - `200` with deterministic sorted open-ledger entries
  - supports `?lastSeenAfter=...&lastSeenBefore=...` for deterministic time-window slices
  - supports `?limit=...&offset=...` for deterministic pagination (`maxLimit=100`)
  - paginated responses include `pagination.has_more`
  - `404` when missing or invalid

### Run locally

```bash
npm run mcp:evidence
```

Or directly:

```bash
npx tsx integrations/mcp/evidenceContextServer.cli.ts
```

### Environment variables

- `PUMUKI_EVIDENCE_HOST`
- `PUMUKI_EVIDENCE_PORT`
- `PUMUKI_EVIDENCE_ROUTE`

Example:

```bash
PUMUKI_EVIDENCE_PORT=7342 npm run mcp:evidence
```

## Testing

Server behavior is covered in:

- `integrations/mcp/__tests__/evidenceContextServer.test.ts`

Run:

```bash
npm run test:mcp
```

## Scope note

Legacy MCP references (older automation/watcher services) are not part of the active v2.x documentation surface.

Consumption pattern reference:

- `docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`
