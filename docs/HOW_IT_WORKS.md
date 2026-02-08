# How It Works (v2.x)

## Purpose

This repository implements a deterministic quality gate for AI-assisted development.

Pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## End-to-end flow

1. Collect facts from Git scope.
2. Detect active platforms from facts.
3. Load baseline rule packs for detected platforms.
4. Merge project overrides (respecting locked baseline rules).
5. Evaluate rules to produce findings.
6. Evaluate gate outcome using stage policy.
7. Persist deterministic evidence in `.ai_evidence.json`.

## Stage execution model

### PRE_COMMIT

- Scope: staged changes (`git diff --cached --name-status`)
- Policy:
  - `blockOnOrAbove: CRITICAL`
  - `warnOnOrAbove: ERROR`

### PRE_PUSH

- Scope: commit range (`upstream..HEAD`)
- Policy:
  - `blockOnOrAbove: ERROR`
  - `warnOnOrAbove: WARN`

### CI

- Scope: commit range (`baseRef..HEAD`)
- Base ref resolution:
  - `GITHUB_BASE_REF` if present
  - fallback: `origin/main`
- Policy:
  - `blockOnOrAbove: ERROR`
  - `warnOnOrAbove: WARN`

Policy source: `integrations/gate/stagePolicies.ts`.

## Main runtime components

- `integrations/git/runPlatformGate.ts`
  - Shared execution path for staged/range scopes
  - Multi-platform detection + combined evaluation
  - Evidence generation (`generateEvidence`)
- `integrations/git/stageRunners.ts`
  - Stage-specific runners (`runPreCommitStage`, `runPrePushStage`, `runCiStage`)
- `integrations/git/resolveGitRefs.ts`
  - Upstream and CI base reference resolution
- `integrations/evidence/buildEvidence.ts`
  - Deterministic `snapshot + ledger` builder
- `integrations/evidence/writeEvidence.ts`
  - Stable, ordered evidence serialization

## Platform and rule-pack loading

Detected platforms can include `ios`, `backend`, `frontend`, `android` in the same run.

Loaded baseline packs:

- `iosEnterpriseRuleSet`
- `backendRuleSet`
- `frontendRuleSet`
- `androidRuleSet`
- `astHeuristicsRuleSet` (when `PUMUKI_ENABLE_AST_HEURISTICS=true`)

Version map: `core/rules/presets/rulePackVersions.ts`.

## Evidence contract

Output file: `.ai_evidence.json`

- `version: "2.1"` is authoritative
- `snapshot` contains current stage findings and outcome (`PASS` | `WARN` | `BLOCK`)
- `ledger` tracks open violations over time
- `platforms` stores detected platform state
- `rulesets` stores loaded bundles and hashes
- `ai_gate` mirrors compatibility status (`ALLOWED` | `BLOCKED`)

Full schema: `docs/evidence-v2.1.md`.

## Interfaces to run it

### Interactive

```bash
npm run framework:menu
```

### CLI wrappers

```bash
npx tsx integrations/git/preCommitIOS.cli.ts
npx tsx integrations/git/prePushBackend.cli.ts
npx tsx integrations/git/ciFrontend.cli.ts
```

## Operational adapters (optional)

Adapter diagnostics are intentionally outside the deterministic gate runtime.

- They live under `scripts/*` and `docs/validation/*`.
- They do not change PRE_COMMIT/PRE_PUSH/CI outcomes.
- They support rollout diagnostics and incident triage.

Typical commands:

```bash
npm run validation:adapter-readiness -- \
  --windsurf-report docs/validation/windsurf-real-session-report.md \
  --out docs/validation/adapter-readiness.md

npm run validation:phase5-blockers-readiness -- \
  --consumer-triage-report docs/validation/consumer-startup-triage-report.md \
  --out docs/validation/phase5-blockers-readiness.md
```

Note: current adapter readiness command uses `--windsurf-report` as the adapter input file flag.

### CI workflows

- `.github/workflows/pumuki-gate-template.yml`
- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`

## Deterministic validation

```bash
npm run typecheck
npm run test:heuristics
npm run test:deterministic
```
