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

Read-only endpoints:

- `GET /health`
- `GET /status`
  - includes `context_api.endpoints[]`, `context_api.filters`, and `context_api.pagination_bounds` capabilities
- `GET /ai-evidence`
- `GET /ai-evidence/summary`
  - snapshot metadata includes `has_findings` (fast boolean gate for non-empty findings)
  - snapshot metadata includes `severity_counts` (deterministic key order)
  - snapshot metadata includes `findings_by_platform` (deterministic platform-key order)
  - snapshot metadata includes `highest_severity` (deterministic severity ranking)
  - includes `ledger_by_platform` (deterministic platform-key order)
  - includes `rulesets_by_platform` (deterministic platform-key order)
  - includes `detected_platforms_count` (deterministic count of currently detected platforms)
- `GET /ai-evidence/snapshot`
- `GET /ai-evidence/findings`
- `GET /ai-evidence/findings?limit=...&offset=...`
  - deterministic bound: `maxLimit=100`
  - pagination metadata includes `has_more` when `limit` is provided
- `GET /ai-evidence/rulesets`
- `GET /ai-evidence/rulesets?platform=...&bundle=...`
- `GET /ai-evidence/rulesets?limit=...&offset=...`
  - deterministic bound: `maxLimit=100`
  - pagination metadata includes `has_more` when `limit` is provided
- `GET /ai-evidence/platforms`
- `GET /ai-evidence/platforms?detectedOnly=false&confidence=...`
- `GET /ai-evidence/platforms?detectedOnly=false&limit=...&offset=...`
  - deterministic bound: `maxLimit=100`
  - pagination metadata includes `has_more` when `limit` is provided
- `GET /ai-evidence/ledger`
- `GET /ai-evidence/ledger?lastSeenAfter=...&lastSeenBefore=...`
- `GET /ai-evidence/ledger?lastSeenAfter=...&lastSeenBefore=...&limit=...&offset=...`
  - deterministic bound: `maxLimit=100`
  - pagination metadata includes `has_more` when `limit` is provided

Reference: `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`.
Consumption: `docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`.

## Local execution quick refs

```bash
npm run framework:menu
npm run validation:adapter-readiness
npm run typecheck
npm run test:deterministic
```

## Optional diagnostics adapters

Files:

- `scripts/build-adapter-readiness.ts`
- `scripts/adapter-readiness-lib.ts`
- `scripts/build-phase5-blockers-readiness.ts`
- `scripts/phase5-blockers-readiness-lib.ts`
- `scripts/build-phase5-execution-closure-status.ts`
- `scripts/phase5-execution-closure-status-lib.ts`
- `scripts/run-phase5-execution-closure.ts`
- `scripts/phase5-execution-closure-lib.ts`
- `scripts/clean-validation-artifacts.ts`
- `scripts/clean-validation-artifacts-lib.ts`
- `scripts/framework-menu.ts`

Commands:

- `npm run validation:adapter-readiness`
- `npm run validation:adapter-session-status`
- `npm run validation:adapter-real-session-report`
- `npm run validation:phase5-blockers-readiness`
- `npm run validation:phase5-execution-closure-status`
- `npm run validation:phase5-execution-closure`
- `npm run validation:phase5-external-handoff`
- `npm run validation:clean-artifacts`

`validation:phase5-execution-closure` notes:

- defaults to output directory `.audit-reports/phase5`
- runs auth preflight and fails fast on auth/scope blockers
- supports `--skip-auth-preflight` when preflight must be bypassed

Framework menu action:

- `Build adapter readiness report`
- `Build phase5 execution closure status report`
- `Run phase5 execution closure (one-shot orchestration)`
- `Build phase5 external handoff report`
- `Clean local validation artifacts`

Deterministic argument builders exported from menu module:

- `buildAdapterReadinessCommandArgs({ scriptPath, adapterReportFile, outFile })`
- `buildCleanValidationArtifactsCommandArgs({ scriptPath, dryRun })`
- `buildPhase5BlockersReadinessCommandArgs({ scriptPath, adapterReportFile, consumerTriageReportFile, outFile })`
- `buildPhase5ExecutionClosureStatusCommandArgs({ scriptPath, phase5BlockersReportFile, consumerUnblockReportFile, adapterReadinessReportFile, outFile, requireAdapterReadiness })`
- `buildPhase5ExternalHandoffCommandArgs({ scriptPath, repo, phase5StatusReportFile, phase5BlockersReportFile, consumerUnblockReportFile, mockAbReportFile, runReportFile, outFile, artifactUrls, requireArtifactUrls, requireMockAbReport })`
- `buildPhase5ExecutionClosureCommandArgs({ scriptPath, repo, limit, outDir, runWorkflowLint, includeAuthPreflight, repoPath, actionlintBin, includeAdapter, requireAdapterReadiness })`

Current adapter implementation note:

- The adapter report input flag is named `adapterReportFile` / `--adapter-report` for compatibility with existing runbooks.
