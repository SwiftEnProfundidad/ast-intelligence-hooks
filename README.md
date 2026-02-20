# Pumuki

[![npm version](https://img.shields.io/npm/v/pumuki?color=1d4ed8)](https://www.npmjs.com/package/pumuki)
[![CI](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

Enterprise governance framework for AI-assisted code delivery.

Pumuki enforces deterministic quality decisions across local hooks and CI with a single execution model:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## Why Pumuki

- Deterministic and auditable gate decisions.
- Stage-aware enforcement (`PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, `CI`).
- Multi-platform rule evaluation (iOS, Android, Backend, Frontend).
- OpenSpec + SDD policy enforcement.
- Evidence-first workflow via `.ai_evidence.json`.
- Optional MCP servers for agent consumption.

## Install in a Consumer Repository

Prerequisites:

- `Node.js >= 18`
- `npm >= 9`
- `git`

Install package:

```bash
npm install --save-exact pumuki
```

Install managed lifecycle/hooks:

```bash
npx pumuki install
```

Verify state:

```bash
npx pumuki doctor
npx pumuki status
npx pumuki sdd status
```

## Daily Commands

Gate binaries:

```bash
npx pumuki-pre-write
npx pumuki-pre-commit
npx pumuki-pre-push
npx pumuki-ci
```

Lifecycle commands:

```bash
npx pumuki install
npx pumuki update --latest
npx pumuki uninstall --purge-artifacts
npx pumuki remove
```

Notes:

- `pumuki remove` is the complete teardown command (hooks + artifacts + dependency removal logic).
- `npm uninstall pumuki` only removes dependency entries and does not clean managed lifecycle state.

## OpenSpec SDD (Mandatory Policy)

Pumuki enforces OpenSpec/SDD as a first-class policy guardrail.

- `PRE_WRITE`: requires valid OpenSpec installation/project/session.
- `PRE_COMMIT`, `PRE_PUSH`, `CI`: require valid active session and `openspec validate --changes`.
- Blocking decisions are emitted in evidence with source `sdd-policy`.

Session flow:

```bash
npx pumuki sdd session --open --change=<change-id>
npx pumuki sdd status
npx pumuki sdd validate --stage=PRE_COMMIT
```

Emergency bypass (incident-only):

```bash
PUMUKI_SDD_BYPASS=1 npx pumuki sdd validate --stage=PRE_COMMIT
```

## Evidence Contract

Each run can emit `.ai_evidence.json` with deterministic structure.

Key fields include:

- `snapshot.stage`
- `snapshot.outcome`
- `snapshot.findings[]`
- `snapshot.rulesets[]`
- `snapshot.platforms[]`
- `snapshot.sdd_metrics`

Reference: `docs/evidence-v2.1.md`

## MCP Servers (Optional)

Pumuki core does not require MCP. MCP is optional for external clients/agents.

Evidence server (consumer repo):

```json
{
  "mcpServers": {
    "pumuki-evidence": {
      "command": "npx",
      "args": ["--yes", "pumuki-mcp-evidence"],
      "cwd": "/absolute/path/to/consumer-repo"
    }
  }
}
```

Enterprise server (consumer repo):

```json
{
  "mcpServers": {
    "pumuki-enterprise": {
      "command": "npx",
      "args": ["--yes", "pumuki-mcp-enterprise"],
      "cwd": "/absolute/path/to/consumer-repo"
    }
  }
}
```

## Develop Pumuki (This Repository)

```bash
git clone https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm ci
```

Recommended validation baseline:

```bash
npm run typecheck
npm run test
npm run test:deterministic
npm run validation:package-manifest
npm run validation:docs-hygiene
npm run skills:lock:check
```

Interactive framework menu:

```bash
npm run framework:menu
```

## Package Binaries

Published binaries:

- `pumuki`
- `pumuki-framework`
- `pumuki-pre-write`
- `pumuki-pre-commit`
- `pumuki-pre-push`
- `pumuki-ci`
- `pumuki-mcp-evidence`
- `pumuki-mcp-enterprise`

## Troubleshooting

- Hook drift or lifecycle mismatch:

```bash
npx pumuki doctor
npx pumuki status
```

- Stale environment after major updates:

```bash
rm -rf node_modules package-lock.json
npm install
```

- Missing upstream for `PRE_PUSH` workflows:

```bash
git push --set-upstream origin <branch>
```

## Documentation

Primary docs index: `docs/README.md`

Core references:

- `docs/ARCHITECTURE.md`
- `docs/USAGE.md`
- `docs/INSTALLATION.md`
- `docs/CONFIGURATION.md`
- `docs/API_REFERENCE.md`
- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/MCP_SERVERS.md`
- `docs/validation/README.md`

## Contributing

- `docs/CONTRIBUTING.md`
- `docs/CODE_STANDARDS.md`
- `CHANGELOG.md`

## License

MIT (`LICENSE`)
