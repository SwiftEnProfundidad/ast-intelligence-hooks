# MCP Servers - Model Context Protocol

## Table of Contents

1. [Introduction](#introduction)
2. [evidence-watcher](#evidence-watcher)
3. [ast-intelligence-automation](#ast-intelligence-automation)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

MCP Servers (Model Context Protocol) allow AI in agentic IDEs to interact directly with the project, automating common tasks and providing real-time context.

### What is MCP?

MCP (Model Context Protocol) is a **standard open protocol** (JSON-RPC 2.0) that allows AI clients (agentic IDEs) to communicate with external servers that provide:

- **Resources**: Data that AI can read (like project state)
- **Tools**: Functions that AI can execute (like creating PRs, checking status)
- **Events**: Notifications about system changes

### Compatibility

MCP is **IDE-agnostic** and works with any client that implements the protocol, including:
- **Cursor** - `.cursor/mcp.json` (project or global)
- **Claude Desktop** - Global configuration file
- **Windsurf** - `.windsurf/mcp.json` (project or global)
- **Any other MCP-compatible client**

The servers provided by this library are **standard MCP servers** and work with all MCP-compatible clients. The installer automatically detects and configures for multiple IDEs when possible.

### Protocol

MCP Servers use **JSON-RPC 2.0** over stdin/stdout to communicate with agentic IDEs.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

---

## evidence-watcher

### Description

Monitors the status of `.AI_EVIDENCE.json` and allows AI to verify if the evidence is up to date (fresh) or outdated (stale).

### Purpose

**Automatically notify AI when evidence is stale**, allowing AI to update context automatically without manual user intervention.

### Resources

#### `evidence://status`

Current status of `.AI_EVIDENCE.json`:

**Format:**
```json
{
  "status": "fresh|stale|missing|error",
  "message": "Evidence is STALE (350s old, max 180s)",
  "action": "Run: ai-start develop",
  "age": 350,
  "isStale": true,
  "timestamp": "2025-11-06T14:33:45Z",
  "session": "develop",
  "currentBranch": "develop"
}
```

**States:**
- `fresh`: Evidence up to date (< 180 seconds)
- `stale`: Evidence outdated (≥ 180 seconds)
- `missing`: `.AI_EVIDENCE.json` file doesn't exist
- `error`: Error reading or parsing the file

**Staleness Threshold:**
- Default: **180 seconds (3 minutes)**
- Configurable: Environment variable `HOOK_GUARD_EVIDENCE_STALE_THRESHOLD`

### Tools

#### `check_evidence_status`

Checks if `.AI_EVIDENCE.json` is stale.

**Input:**
```json
{}
```

**Output:**
Same format as `evidence://status` (see above)

**Example usage from Cursor:**
```javascript
// AI can call this tool automatically
const status = await mcp.callTool('check_evidence_status', {});
if (status.isStale) {
  // AI can update evidence automatically
  await updateEvidence();
}
```

### Configuration

**Location:** `infrastructure/mcp/evidence-watcher.js`

**Configuration in `.cursor/mcp.json`:**
```json
{
  "mcpServers": {
    "ai-evidence-watcher": {
      "command": "node",
      "args": [
        "${workspaceFolder}/infrastructure/mcp/evidence-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REPO_ROOT` | Repository root | `process.cwd()` |
| `HOOK_GUARD_EVIDENCE_STALE_THRESHOLD` | Staleness threshold in seconds | `180` |

### Manual Testing

```bash
# Test 1: Initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  REPO_ROOT=$(pwd) node infrastructure/mcp/evidence-watcher.js

# Test 2: List resources
echo '{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}' | \
  REPO_ROOT=$(pwd) node infrastructure/mcp/evidence-watcher.js

# Test 3: Read evidence status
echo '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"evidence://status"}}' | \
  REPO_ROOT=$(pwd) node infrastructure/mcp/evidence-watcher.js

# Test 4: Check evidence status (tool)
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"check_evidence_status","arguments":{}}}' | \
  REPO_ROOT=$(pwd) node infrastructure/mcp/evidence-watcher.js
```

---

## ast-intelligence-automation

### Description

Comprehensive development automation MCP server that provides: evidence management, Git Flow automation, context detection, validation & fixes, and AI gate checks. Automates the complete development workflow from any MCP-compatible agentic IDE.

### Purpose

**Fully automate development workflow** including Git Flow, evidence management, validation, and context detection, eliminating repetitive manual steps.

### Resources

#### `evidence://status`

Status of `.AI_EVIDENCE.json` (same as evidence-watcher).

**Format:** See [evidence-watcher - Resources](#evidence-status)

#### `gitflow://state`

Current Git Flow workflow state.

**Format:**
```json
{
  "step": 0,
  "status": "uninitialized|in_progress|completed|error",
  "currentBranch": "feature/my-task",
  "lastCommit": "abc123",
  "prUrl": "https://github.com/user/repo/pull/42",
  "error": null
}
```

**States:**
- `uninitialized`: No active Git Flow workflow
- `in_progress`: Workflow in progress
- `completed`: Workflow completed
- `error`: Error in workflow

#### `context://active`

Active project context detected automatically.

**Format:**
```json
{
  "platforms": ["backend", "frontend"],
  "filesChanged": 5,
  "confidence": 0.85,
  "suggestedActions": ["update_evidence", "run_tests"]
}
```

### Tools

#### `check_evidence_status`

Checks if `.AI_EVIDENCE.json` is stale (same as evidence-watcher).

**Input:**
```json
{}
```

**Output:**
See [evidence-watcher - check_evidence_status](#check_evidence_status)

---

#### `auto_complete_gitflow`

Automates the complete Git Flow cycle: commit → push → PR → merge.

**Input:**
```json
{
  "commitMessage": "chore: auto-commit changes",  // Optional
  "prTitle": "Merge feature/my-task into develop",  // Optional
  "prBody": "Automated PR created by Git Flow Automation",  // Optional
  "autoMerge": false  // Optional, default: false
}
```

**Output:**
```json
{
  "success": true,
  "message": "Git Flow cycle completed",
  "currentBranch": "develop",
  "results": [
    "Current branch: feature/my-task",
    "✅ No uncommitted changes",
    "✅ Pushed to origin",
    "✅ PR created: https://github.com/user/repo/pull/42",
    "✅ PR merged and branch deleted",
    "✅ Switched to develop and pulled latest"
  ]
}
```

**Steps executed:**
1. Verify you're on a `feature/`, `fix/` or `hotfix/` branch
2. Commit uncommitted changes (if any)
3. Push to origin
4. Create PR to `develop` (requires GitHub CLI)
5. If `autoMerge: true`, merge PR and delete branch
6. Return to `develop` and pull

**Requirements:**
- GitHub CLI (`gh`) installed to create PRs
- Must be on a `feature/`, `fix/` or `hotfix/` branch

---

#### `sync_branches`

Synchronizes `develop` and `main` branches with remote.

**Input:**
```json
{
  "returnToBranch": "develop"  // Optional, default: "develop"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Branches synchronized",
  "results": [
    "✅ Fetched from remote",
    "✅ Develop updated",
    "✅ Main updated",
    "✅ Returned to develop"
  ]
}
```

**Steps executed:**
1. `git fetch --all --prune`
2. `git checkout develop && git pull origin develop`
3. `git checkout main && git pull origin main`
4. `git checkout {returnToBranch}` (default: develop)

---

#### `cleanup_stale_branches`

Deletes merged branches (local and remote).

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "message": "Stale branches cleaned up",
  "branchesDeleted": ["feature/old-task", "fix/bug-123"],
  "results": [
    "✅ Deleted local branch: feature/old-task",
    "✅ Deleted remote branch: origin/feature/old-task"
  ]
}
```

**Steps executed:**
1. List merged local branches
2. List merged remote branches
3. Delete merged local branches (except `main`, `develop`, `master`)
4. Delete merged remote branches (requires GitHub CLI)

**Note:** Requires GitHub CLI to delete remote branches.

---

#### `auto_execute_ai_start`

Analyzes context and automatically executes `ai-start` if it detects modified code files (≥30% confidence).

**Input:**
```json
{
  "forceAnalysis": false  // Optional, default: false
}
```

**Output:**
```json
{
  "success": true,
  "message": "AI start executed automatically",
  "confidence": 0.85,
  "platformsDetected": ["backend", "frontend"],
  "filesAnalyzed": 5,
  "evidenceUpdated": true
}
```

**Logic:**
1. Analyzes modified files with `ContextDetectionEngine`
2. Calculates confidence based on percentage of code files
3. If confidence ≥ 30% (or `forceAnalysis: true`):
   - Executes `ai-start {currentBranch}`
   - Updates `.AI_EVIDENCE.json`
   - Sends macOS notification with sound
4. If confidence < 30%: Does nothing

**Confidence threshold:** 30% (configurable in code)

---

#### `validate_and_fix`

Validates common problems and fixes them automatically when possible.

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "message": "Validation completed",
  "issuesFound": 2,
  "issuesFixed": 1,
  "results": [
    "✅ Evidence is fresh",
    "⚠️  Branches out of sync",
    "✅ Branches synchronized",
    "✅ Validation complete"
  ]
}
```

**Validations performed:**
1. Check evidence status (stale/fresh)
2. Check branch synchronization (develop/main)
3. Check merged branches without cleanup
4. Attempt to fix automatically when possible

---

#### `ai_gate_check`

**🚦 MANDATORY**: Must be called at the START of EVERY AI response.

Checks if there are violations blocking work and returns `BLOCKED` or `ALLOWED`.

**Input:**
```json
{}
```

**Output:**
```json
{
  "status": "ALLOWED|BLOCKED",
  "message": "All checks passed",
  "violations": [],
  "blockingReason": null
}
```

**When it returns `BLOCKED`:**
- There are CRITICAL or HIGH violations
- Evidence is stale and must be updated first
- There are critical synchronization problems

**Recommended usage:**
```javascript
// AI must call this FIRST before any task
const gateCheck = await mcp.callTool('ai_gate_check', {});
if (gateCheck.status === 'BLOCKED') {
  // DO NOT proceed with task
  // Show user message about what to fix
  return;
}
// Continue with user task
```

---

### Configuration

**Location:** `infrastructure/mcp/gitflow-automation-watcher.js`

**Configuration in `.cursor/mcp.json`:**
```json
{
  "mcpServers": {
    "ast-intelligence-automation": {
      "command": "node",
      "args": [
        "${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}",
        "AUTO_COMMIT_ENABLED": "true",
        "AUTO_PUSH_ENABLED": "true",
        "AUTO_PR_ENABLED": "false"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REPO_ROOT` | Repository root | `process.cwd()` |
| `AUTO_COMMIT_ENABLED` | Enable auto-commit | `true` |
| `AUTO_PUSH_ENABLED` | Enable auto-push | `true` |
| `AUTO_PR_ENABLED` | Enable auto-PR (disabled by default) | `false` |
| `MAX_EVIDENCE_AGE` | Staleness threshold in seconds | `180` |

### Requirements

- **Git**: Installed and configured
- **GitHub CLI** (`gh`): For creating/merging PRs and cleaning remote branches
  ```bash
  # Install GitHub CLI
  brew install gh  # macOS
  # or
  apt install gh   # Linux
  ```

### Manual Testing

```bash
# Test 1: Initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  REPO_ROOT=$(pwd) node scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js

# Test 2: List tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
  REPO_ROOT=$(pwd) node scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js

# Test 3: Check evidence status
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_evidence_status","arguments":{}}}' | \
  REPO_ROOT=$(pwd) node scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js

# Test 4: AI Gate Check
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"ai_gate_check","arguments":{}}}' | \
  REPO_ROOT=$(pwd) node scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js
```

---

## Configuration

### Complete Configuration Example

Example configuration for `.cursor/mcp.json` (Cursor) or similar file for other IDEs:

```json
{
  "mcpServers": {
    "ai-evidence-watcher": {
      "command": "node",
      "args": [
        "${workspaceFolder}/infrastructure/mcp/evidence-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}"
      }
    },
    "ast-intelligence-automation": {
      "command": "node",
      "args": [
        "${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}",
        "AUTO_COMMIT_ENABLED": "true",
        "AUTO_PUSH_ENABLED": "true",
        "AUTO_PR_ENABLED": "false"
      }
    }
  }
}
```

### File Locations by IDE

#### Cursor
- **Project-level**: `.cursor/mcp.json` (recommended, created automatically by installer)
- **Global**: `~/.cursor/mcp.json` (macOS/Linux) or `%APPDATA%\Cursor\mcp.json` (Windows)

#### Claude Desktop
- **Global**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- **Global**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Global**: `~/.config/claude_desktop_config.json` (Linux)

#### Windsurf
- **Project-level**: `.windsurf/mcp.json`
- **Global**: `~/.windsurf/mcp.json`

### Available Variables

Most IDEs provide these variables in `mcp.json`:

- `${workspaceFolder}`: Full path of current workspace
- `${workspaceFolderBasename}`: Workspace name (last part of path)

**Note**: Variable names may vary slightly between IDEs. Consult your IDE's MCP documentation for specifics.

---

## Usage Examples

### Example 1: Check Evidence Status

```javascript
// AI in Cursor can do this automatically
const status = await mcp.callTool('check_evidence_status', {});
if (status.isStale) {
  console.log(`⚠️ Evidence stale: ${status.message}`);
  console.log(`💡 Action: ${status.action}`);
}
```

### Example 2: Complete Git Flow Automatically

```javascript
// User says: "Commit, push and create PR for this branch"
const result = await mcp.callTool('auto_complete_gitflow', {
  commitMessage: 'feat: add new feature',
  prTitle: 'Add new feature',
  prBody: 'This PR adds a new feature to the application',
  autoMerge: false
});

if (result.success) {
  console.log(`✅ Git Flow completed: ${result.message}`);
  result.results.forEach(msg => console.log(`  ${msg}`));
}
```

### Example 3: Sync Branches Before Working

```javascript
// AI can sync branches automatically before starting
const sync = await mcp.callTool('sync_branches', {
  returnToBranch: 'develop'
});

if (sync.success) {
  console.log('✅ Branches synchronized');
}
```

### Example 4: Gate Check Before Task

```javascript
// AI MUST do this at the start of each response
const gateCheck = await mcp.callTool('ai_gate_check', {});

if (gateCheck.status === 'BLOCKED') {
  // DO NOT proceed with task
  return {
    blocked: true,
    reason: gateCheck.blockingReason,
    message: gateCheck.message
  };
}

// Continue with task normally
```

### Example 5: Auto-execute AI Start

```javascript
// AI can detect changes and update evidence automatically
const aiStart = await mcp.callTool('auto_execute_ai_start', {
  forceAnalysis: false
});

if (aiStart.success && aiStart.evidenceUpdated) {
  console.log(`✅ Evidence updated (confidence: ${aiStart.confidence})`);
}
```

---

## Troubleshooting

### MCP Server Doesn't Start

**Symptom:** Cursor cannot start the MCP server.

**Solution:**
1. Verify Node.js is installed: `node --version` (requires ≥18.0.0)
2. Verify file path is correct in `mcp.json`
3. Verify execution permissions: `chmod +x infrastructure/mcp/*.js`
4. Check Cursor logs (View → Output → MCP)

### Error: "Cannot find module"

**Symptom:** MCP server fails with module not found error.

**Solution:**
1. Install dependencies: `npm install`
2. Verify `REPO_ROOT` points to correct directory
3. Verify required modules are in `node_modules`

### GitHub CLI Not Available

**Symptom:** `auto_complete_gitflow` fails when creating PRs.

**Solution:**
1. Install GitHub CLI:
   ```bash
   brew install gh  # macOS
   apt install gh   # Linux
   ```
2. Authenticate: `gh auth login`
3. If you can't install GitHub CLI, create PRs manually from GitHub

### Evidence Always Appears as Stale

**Symptom:** `check_evidence_status` always returns `isStale: true`.

**Solution:**
1. Verify `.AI_EVIDENCE.json` exists in project root
2. Verify file has a valid `timestamp` field
3. Run `ai-start {branch}` to update evidence
4. Verify file read permissions

### Auto-commit Doesn't Work

**Symptom:** `auto_complete_gitflow` doesn't commit changes.

**Solution:**
1. Verify `AUTO_COMMIT_ENABLED=true` in `mcp.json`
2. Verify there are uncommitted changes: `git status`
3. Verify write permissions in Git repository

### MCP Server Hangs

**Symptom:** MCP server doesn't respond to requests.

**Solution:**
1. Restart your IDE/agentic client
2. Verify there are no zombie processes: `ps aux | grep mcp`
3. Kill zombie processes: `pkill -f "mcp.*watcher"`
4. Check server stderr logs

---

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io) - Official MCP standard
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp) - Cursor-specific implementation
- [ARCHITECTURE_DETAILED.md](./ARCHITECTURE_DETAILED.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API reference

---

## Development Notes

### Add a New MCP Server

1. Create file in `infrastructure/mcp/new-watcher.js`
2. Implement `MCPServer` class with methods:
   - `handleMessage(message)`: Handles JSON-RPC requests
   - `start()`: Starts the server
3. Expose resources and tools via JSON-RPC
4. Add to `.cursor/mcp.json`
5. Create tests in `infrastructure/mcp/__tests__/`

### JSON-RPC 2.0 Protocol

MCP servers must implement these methods:

- `initialize`: Server initialization
- `resources/list`: List available resources
- `resources/read`: Read a specific resource
- `tools/list`: List available tools
- `tools/call`: Execute a tool

**Request format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {}
  }
}
```

**Response format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Result here"
      }
    ]
  }
}
```

---

**Last updated**: 2025-01-13  
**Version**: 5.3.0  
**Author**: Pumuki Team®
