# PUMUKI Operator Playbook

This file is a concise operator-focused companion to `README.md`.

If you are new to the framework, start in `README.md` first.

## 1) Core Model

Pumuki runs deterministic governance over code changes:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## 2) Minimal Consumer Flow

Install and bootstrap:

```bash
npm install --save-exact pumuki
npx pumuki install
```

Start SDD session:

```bash
npx pumuki sdd session --open --change=<change-id>
```

Run gates:

```bash
npx pumuki-pre-write
npx pumuki-pre-commit
npx pumuki-pre-push
npx pumuki-ci
```

## 3) Lifecycle Operations

```bash
npx pumuki status
npx pumuki doctor
npx pumuki update --latest
npx pumuki remove
```

## 4) Deterministic Evidence

Each run can emit `.ai_evidence.json` with stage, findings, rulesets, platforms, and SDD telemetry.

Reference:

- `docs/evidence-v2.1.md`

## 5) MCP (Optional)

MCP is optional and intended for external agent/client consumption.

- Evidence server binary: `pumuki-mcp-evidence`
- Enterprise server binary: `pumuki-mcp-enterprise`

References:

- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/MCP_SERVERS.md`

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
