# API Reference (v2.x)

This document describes the active TypeScript API surface used by the deterministic gate flow in this repository.

## Stage policies

File: `integrations/gate/stagePolicies.ts`

- `policyForPreCommit(): GatePolicy`
- `policyForPrePush(): GatePolicy`
- `policyForCI(): GatePolicy`
- `applyHeuristicSeverityForStage(rules, stage): RuleSet`

## Git stage runners

File: `integrations/git/stageRunners.ts`

- `runPreCommitStage(): Promise<number>`
- `runPrePushStage(): Promise<number>`
- `runCiStage(): Promise<number>`

Exit code contract:

- `0` on pass/warn
- `1` on block or runner error

## Platform wrappers (exports)

File: `integrations/git/index.ts`

- `runPreCommitIOS`, `runPreCommitBackend`, `runPreCommitFrontend`, `runPreCommitAndroid`
- `runPrePushIOS`, `runPrePushBackend`, `runPrePushFrontend`, `runPrePushAndroid`
- `runCiIOS`, `runCiBackend`, `runCiFrontend`, `runCiAndroid`
- `evaluateStagedIOS` (legacy compatibility entry still exported)

## Shared execution entry

File: `integrations/git/runPlatformGate.ts`

Primary function:

- `runPlatformGate(params: { policy: GatePolicy; scope: GateScope }): Promise<number>`

Behavior:

- Builds facts from staged or range scope.
- Detects platforms from facts.
- Loads and merges baseline + project rules.
- Applies optional heuristic rule-pack and stage-aware promotion.
- Evaluates findings + gate decision.
- Writes `.ai_evidence.json` via `generateEvidence`.

## Git scope helpers

Files:

- `integrations/git/getCommitRangeFacts.ts`
- `integrations/git/resolveGitRefs.ts`
- `integrations/git/runCliCommand.ts`

Key helpers:

- `getFactsForCommitRange({ fromRef, toRef, extensions })`
- `resolveUpstreamRef()`
- `resolveCiBaseRef()`
- `runCliCommand(runner)`

## Evidence API

Files:

- `integrations/evidence/schema.ts`
- `integrations/evidence/buildEvidence.ts`
- `integrations/evidence/writeEvidence.ts`
- `integrations/evidence/generateEvidence.ts`

Key types:

- `AiEvidenceV2_1`
- `Snapshot`
- `LedgerEntry`
- `PlatformState`
- `RulesetState`

Contract:

- Source of truth: `version: "2.1"`
- Deterministic output order
- Snapshot + ledger merge model

## Rule packs

Files:

- `core/rules/presets/iosEnterpriseRuleSet.ts`
- `core/rules/presets/backendRuleSet.ts`
- `core/rules/presets/frontendRuleSet.ts`
- `core/rules/presets/androidRuleSet.ts`
- `core/rules/presets/astHeuristicsRuleSet.ts`
- `core/rules/presets/rulePackVersions.ts`

## MCP read-only evidence context

Files:

- `integrations/mcp/evidenceContextServer.ts`
- `integrations/mcp/evidenceContextServer.cli.ts`

CLI:

```bash
npm run mcp:evidence
```

Reference: `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`.

## Local execution quick refs

```bash
npm run framework:menu
npm run typecheck
npm run test:deterministic
```
