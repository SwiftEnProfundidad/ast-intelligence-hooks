# Templates - Base Configurations

This directory contains configuration templates that you can copy to your project.

## Available Files

### `.cursor/mcp.json`

Configuration for MCP Servers (Cursor AI).

**Usage:**
```bash
mkdir -p .cursor
cp templates/.cursor/mcp.json .cursor/mcp.json
```

**Notes:**
- Adjust paths according to your installation method (npm, git submodule, etc.)
- Available variables: `${workspaceFolder}`, `${workspaceFolderBasename}`

---

### `.pre-commit-config.yaml`

Configuration for pre-commit framework.

**Usage:**
```bash
cp templates/.pre-commit-config.yaml .pre-commit-config.yaml

# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install
```

**Notes:**
- Requires Python and pre-commit installed
- Alternative: Use husky for npm projects

---

### `.env.example`

Environment variables template.

**Usage:**
```bash
cp templates/.env.example .env
# Edit .env with your values
```

**Important:**
- ❌ **NEVER** commit `.env` to version control
- ✅ Always commit `.env.example` as reference
- Add `.env` to `.gitignore`

---

### `config/ast-exclusions.json`

AST analysis exclusions configuration.

**Usage:**
```bash
mkdir -p config
cp templates/config/ast-exclusions.json config/ast-exclusions.json
# Customize according to your project
```

**Customization:**
- Add path patterns to exclude
- Configure exclusions by specific rule
- Adjust severity overrides

---

### `config/detect-secrets-baseline.json`

Baseline for detect-secrets (secret detection).

**Usage:**
```bash
mkdir -p config
cp templates/config/detect-secrets-baseline.json config/detect-secrets-baseline.json
```

**Important:**
- This is an empty template
- Replace real secrets with placeholders
- Use to track false positives

---

## Quick Installation

To install all basic templates:

```bash
# Create structure
mkdir -p .cursor config

# Copy templates
cp templates/.cursor/mcp.json .cursor/mcp.json
cp templates/.env.example .env
cp templates/config/ast-exclusions.json config/ast-exclusions.json
cp templates/config/detect-secrets-baseline.json config/detect-secrets-baseline.json

# Edit .env with your values
nano .env  # or use your preferred editor

# Add .env to .gitignore
echo ".env" >> .gitignore
```

---

## Important Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REPO_ROOT` | Repository root | `process.cwd()` |
| `HOOK_GUARD_EVIDENCE_STALE_THRESHOLD` | Staleness threshold (sec) | `180` |
| `AUTO_COMMIT_ENABLED` | Auto-commit in Git Flow | `true` |
| `AUTO_PUSH_ENABLED` | Auto-push in Git Flow | `true` |
| `AUTO_PR_ENABLED` | Auto-PR in Git Flow | `false` |
| `ENABLE_INTELLIGENT_SEVERITY` | Intelligent severity | `true` |

---

## Project-specific Customization

Each project can customize these templates according to their needs:

1. **Exclusions**: Add specific paths from your project
2. **Severity**: Adjust thresholds according to your quality level
3. **MCP**: Configure servers according to your setup
4. **Variables**: Adjust defaults according to your workflow

---

## More Information

- [INSTALLATION.md](../docs/INSTALLATION.md) - Complete installation guide
- [USAGE.md](../docs/USAGE.md) - Usage guide
- [MCP_SERVERS.md](../docs/MCP_SERVERS.md) - MCP Servers configuration
