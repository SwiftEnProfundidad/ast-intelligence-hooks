<p align="center">
  <img src="../../assets/logo.png" alt="PUMUKI - AST Intelligence" width="150" />
</p>

# MCP Server: AI Evidence Watcher

## Overview

This MCP server exposes deterministic evidence status to AI agents.

Primary goal:
- Notify the agent when `.AI_EVIDENCE.json` is stale, missing, or invalid.
- Keep the interaction agent-facing (not end-user notifications).

## Watchdog vs MCP

| Component | Purpose | Consumer |
|---|---|---|
| `ai-watchdog.sh` | Local user notifications (macOS) | Human user |
| `evidence-watcher.js` | Evidence context for agent workflows | AI agent |

## MCP Contract

Through MCP, the agent can:
1. Read resources (for example `evidence://status`).
2. Invoke tools (for example `check_evidence_status`).

Without MCP:
- User-triggered evidence refresh is required before agent work.

With MCP:
- Agent reads evidence state and can drive refresh actions in the workflow.

## Exposed Resource

### `evidence://status`

Returns current `.AI_EVIDENCE.json` state:

```json
{
  "status": "stale|fresh|missing|error",
  "message": "Evidence is STALE (350s old, max 180s)",
  "action": "Run: ai-start develop",
  "age": 350,
  "isStale": true,
  "timestamp": "2025-11-06T14:33:45Z",
  "session": "develop",
  "currentBranch": "develop"
}
```

## Exposed Tool

### `check_evidence_status`

- Input: none
- Output: same payload as `evidence://status`

## Cursor Configuration

Configure MCP in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ai-evidence-watcher": {
      "command": "node",
      "args": [
        "${workspaceFolder}/legacy/scripts/hooks-system/infrastructure/mcp/evidence-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

## Local Testing

```bash
# JSON-RPC initialize
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  | node legacy/scripts/hooks-system/infrastructure/mcp/evidence-watcher.js

# Read resource
printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"evidence://status"}}' \
  | REPO_ROOT="$(pwd)" node legacy/scripts/hooks-system/infrastructure/mcp/evidence-watcher.js
```

## Agent Usage Flow

1. Cursor starts MCP server.
2. Agent reads `evidence://status` or invokes `check_evidence_status`.
3. If stale, agent follows repository refresh workflow before execution.

## Roadmap

- Add write-capable tooling only when governance permits controlled mutation.
- Consider push-based updates after deterministic polling baseline is validated.
- Expand rule-aware context hints from changed files.

## Metadata

- Created: 2025-11-06
- Version: 1.0.0
