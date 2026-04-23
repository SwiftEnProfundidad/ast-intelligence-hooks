# PUMUKI Operator Playbook

This file is a concise operator-focused companion to `README.md`.

If you are new to the framework, start in `README.md` first.
If you need the full installation or daily usage contract, use:
 
- `docs/product/INSTALLATION.md`
- `docs/product/USAGE.md`

## 1) Core Model

Pumuki runs deterministic governance over code changes:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## 2) Minimal Consumer Flow

Bootstrap path:

```bash
npm install --save-exact pumuki
npx --yes pumuki bootstrap --enterprise --agent=codex
```

Start SDD session:

```bash
npx pumuki sdd session --open --change=<change-id>
```

Run gates:

```bash
npx --yes --package pumuki@latest pumuki-pre-write
npx --yes --package pumuki@latest pumuki-pre-commit
npx --yes --package pumuki@latest pumuki-pre-push
npx --yes --package pumuki@latest pumuki-ci
```

## 3) Lifecycle Operations

```bash
npx --yes pumuki status
npx --yes pumuki doctor
npx --yes pumuki update --latest
npx --yes pumuki remove
```

Version drift contract:

- `pumuki status --json` and `pumuki doctor --json` expose:
  - `version.effective`
  - `version.runtime`
  - `version.consumerInstalled`
  - `version.lifecycleInstalled`
  - `version.driftWarning`
  - `version.alignmentCommand`
  - `version.pathExecutionHazard`
  - `version.pathExecutionWarning`
  - `version.pathExecutionWorkaroundCommand`
- If `driftWarning` appears, align the consumer package and lifecycle state with `version.alignmentCommand`. When the consumer declares a Node runtime via `volta`, `.nvmrc`, or `package.json.engines.node`, the remediation command prepends the matching runtime switch before the Pumuki install step.
- If `pathExecutionHazard=true`, the safe workaround is the local node invocation printed by Pumuki, for example:

```bash
node ./node_modules/pumuki/bin/pumuki.js install
```

For the full lifecycle, SDD, menu and troubleshooting surface, continue in:

- `docs/product/USAGE.md`

## 4) Deterministic Evidence

Each run can emit `.ai_evidence.json` with stage, findings, rulesets, platforms, and SDD telemetry.

Reference:

- `docs/mcp/ai-evidence-v2.1-contract.md`

## 5) MCP (Optional)

MCP is optional and intended for external agent/client consumption.

- Evidence server binary: `pumuki-mcp-evidence`
- Enterprise server binary: `pumuki-mcp-enterprise`

References:

- `docs/mcp/evidence-context-server.md`
- `docs/mcp/mcp-servers-overview.md`

## 6) Framework Maintainers

For maintainers of this repository:

```bash
npm run typecheck
npm run test
npm run test:deterministic
npm run validation:package-manifest
```

Use menu when needed:

```bash
npm run framework:menu
```
