# Observability (v2.x)

The active deterministic framework in this repository does not expose a dedicated metrics pipeline in `integrations/*`.

## Current observability sources

- `.ai_evidence.json`
  - stage outcome (`PASS|WARN|BLOCK`)
  - findings snapshot
  - ledger continuity
  - detected platforms and loaded rulesets
- CI workflow results
  - gate workflow statuses
  - deterministic test workflow statuses
- Uploaded artifacts
  - `ai-evidence*` artifacts from gate workflows

## Local inspection

```bash
cat .ai_evidence.json
npm run test:deterministic
```

## CI inspection

- Review runs from:
  - `.github/workflows/pumuki-gate-template.yml`
  - `.github/workflows/pumuki-evidence-tests.yml`
  - `.github/workflows/pumuki-heuristics-tests.yml`

## Note

If metrics/telemetry are introduced later, document them only when implemented in active runtime code.
