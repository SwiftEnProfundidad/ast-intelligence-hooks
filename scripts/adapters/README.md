# Adapter Scaffolding

Utilities for generating agent adapter configuration files in consumer repositories.

## Command

```bash
npm run adapter:install -- --agent=<name> [--dry-run]
```

Examples:

```bash
npm run adapter:install -- --agent=codex
npm run adapter:install -- --agent=cursor --dry-run
```

The command delegates to lifecycle adapter install and writes deterministic JSON templates.
