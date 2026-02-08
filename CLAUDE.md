# Claude CLI Profile (v2.x)

This repository uses the deterministic v2.x governance model:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

Primary conventions are defined in:

- `AGENTS.md` (execution rules and constraints)
- `README.md` (operational commands)
- `docs/ARCHITECTURE.md` (canonical architecture contract)

## Minimal Working Contract

1. Respect `AGENTS.md` as the highest repository-level execution policy.
2. Keep `core/*` pure; implement adapters and orchestration under `integrations/*`.
3. Use stage runners (not ad-hoc shell logic) for gate execution:
   - `PRE_COMMIT`: staged scope
   - `PRE_PUSH`: `upstream..HEAD`
   - `CI`: `baseRef..HEAD`
4. Treat `.ai_evidence.json` with `version: "2.1"` as the evidence source of truth.
5. Do not introduce legacy evidence formats or undocumented side channels.

## Recommended Validation Baseline

```bash
npm run typecheck
npm run test:deterministic
npm run test:stage-gates
```

## Stage Entrypoints

Use the stage CLIs under `integrations/git/*.cli.ts` or the interactive wrapper:

```bash
npm run framework:menu
```
