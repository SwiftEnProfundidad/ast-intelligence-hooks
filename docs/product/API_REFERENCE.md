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
- `1` on `PRE_PUSH` when no upstream tracking branch is configured (fail-safe).

## Platform wrappers (exports)

File: `integrations/git/index.ts`

- `runPreCommitIOS`, `runPreCommitBackend`, `runPreCommitFrontend`, `runPreCommitAndroid`
- `runPrePushIOS`, `runPrePushBackend`, `runPrePushFrontend`, `runPrePushAndroid`
- `runCiIOS`, `runCiBackend`, `runCiFrontend`, `runCiAndroid`
- `evaluateStagedIOS` (legacy compatibility entry still exported)

## Shared execution entry

File: `integrations/git/runPlatformGate.ts`

Primary function:

- `runPlatformGate(params: { policy: GatePolicy; scope: GateScope; auditMode?: 'gate' | 'engine'; sddShortCircuit?: boolean }): Promise<number>`

Behavior:

- Builds facts from staged or range scope.
- Detects platforms from facts.
- Loads and merges baseline + project rules.
- Applies optional heuristic rule-pack and stage-aware promotion.
- Evaluates findings + gate decision.
- Supports dual runtime contract:
  - `auditMode='gate'`: strict enforcement (SDD short-circuit by default)
  - `auditMode='engine'`: full diagnostics (no SDD short-circuit by default)
- Computes rules coverage telemetry (`active/evaluated/matched/unevaluated`) per stage.
- Emits `governance.rules.coverage.incomplete` and forces `BLOCK` when active rules remain unevaluated in `PRE_COMMIT`, `PRE_PUSH`, or `CI`.
- Emits `governance.skills.detector-mapping.incomplete` and forces `BLOCK` when AUTO skills rules have no mapped detector.
- Writes `.ai_evidence.json` via `generateEvidence`.

## Skills rules engine APIs

Files:

- `integrations/config/coreSkillsLock.ts`
- `integrations/config/skillsEffectiveLock.ts`
- `integrations/config/skillsCustomRules.ts`
- `integrations/config/skillsRuleSet.ts`

Key functions:

- `loadCoreSkillsLock(): SkillsLockV1 | undefined`
- `loadEffectiveSkillsLock(repoRoot?): SkillsLockV1 | undefined`
- `loadCustomSkillsRulesFile(repoRoot?): CustomSkillsRulesFileV1 | undefined`
- `loadCustomSkillsLock(repoRoot?): SkillsLockV1 | undefined`
- `resolveSkillImportSources({ repoRoot?, explicitSources? }): string[]`
- `importCustomSkillsRules({ repoRoot?, sourceFiles? }): CustomSkillsImportResult`
- `loadSkillsRuleSetForStage(stage, repoRoot?, detectedPlatforms?)`

Deterministic precedence:

- `core + repo + custom` merged into one effective lock.
- Conflict policy: `custom > repo > core` by `ruleId` during ruleset materialization.

## Git scope helpers

Files:

- `integrations/git/getCommitRangeFacts.ts`
- `integrations/git/resolveGitRefs.ts`
- `integrations/git/runCliCommand.ts`

Key helpers:

- `getFactsForCommitRange({ fromRef, toRef, extensions })`
- `resolveUpstreamRef()` (`string | null`; `null` when upstream is missing)
- `resolveCiBaseRef()`
- `runCliCommand(runner)`

## AI Gate evaluator

File: `integrations/gate/evaluateAiGate.ts`

- `evaluateAiGate({ repoRoot, stage, maxAgeSecondsByStage?, protectedBranches? })`

Contract:

- Unified evaluation for `PRE_WRITE|PRE_COMMIT|PRE_PUSH|CI`.
- Blocks on:
  - missing/invalid/stale `.ai_evidence.json`
  - evidence `ai_gate.status = BLOCKED`
  - protected branch use (`main/master/develop/dev` by default)
- Returns deterministic payload: `status`, `allowed`, `violations[]`, `evidence`, `repo_state`.
- Evidence source contract (auditability):
  - `evidence.source.source`
  - `evidence.source.path`
  - `evidence.source.digest`
  - `evidence.source.generated_at`

## PRE_WRITE JSON envelope

File: `integrations/lifecycle/cli.ts`

- `pumuki sdd validate --stage=PRE_WRITE --json`
- Returns deterministic envelope:
  - `sdd`
  - `ai_gate`
  - `telemetry.chain = "pumuki->ai_gate->ai_evidence"`
  - `telemetry.stage`

## SaaS diagnostics CLI

File: `integrations/lifecycle/cli.ts`

- `pumuki analytics hotspots report [--top=<n>] [--since-days=<n>] [--json]`
- `pumuki analytics hotspots diagnose [--json]`

Exit code contract:

- `0` when diagnostics status is `healthy` or `degraded`
- `1` when diagnostics status is `blocked`

## Lifecycle status / doctor version contract

Files:

- `integrations/lifecycle/packageInfo.ts`
- `integrations/lifecycle/status.ts`
- `integrations/lifecycle/doctor.ts`

Machine-readable fields exposed by both `pumuki status --json` and `pumuki doctor --json`:

- `version.effective`
- `version.runtime`
- `version.consumerInstalled`
- `version.lifecycleInstalled`
- `version.source`
- `version.driftFromRuntime`
- `version.driftFromLifecycleInstalled`
- `version.driftWarning`
- `version.alignmentCommand`
- `version.pathExecutionHazard`
- `version.pathExecutionWarning`
- `version.pathExecutionWorkaroundCommand`

Compatibility note:

- `packageVersion` is preserved for backward compatibility.
- `packageVersion` mirrors `version.effective`.

Interpretation contract:

- `effective`: version currently governing the consumer decision path.
- `runtime`: version of the executing package instance.
- `consumerInstalled`: version installed in the consumer repository.
- `lifecycleInstalled`: version recorded in managed lifecycle metadata.
- `driftWarning`: compact human-readable explanation when those values diverge.
- `alignmentCommand`: exact remediation command to align dependency and lifecycle state with the current runtime version. When the consumer repo declares a Node runtime via `volta`, `.nvmrc`, or `package.json.engines.node`, this command prepends the matching runtime switch before the Pumuki install step.
- `pathExecutionHazard`: boolean flag raised when the repo root contains the platform `PATH` delimiter and `npx/npm exec` can fail to resolve `pumuki`.
- `pathExecutionWarning`: compact warning explaining why `PATH` resolution is unsafe in that repo.
- `pathExecutionWorkaroundCommand`: safe local-node entrypoint to use when `pathExecutionHazard=true`.

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
- `RepoState`

Contract:

- Source of truth: `version: "2.1"`
- Deterministic output order
- Snapshot + ledger merge model
- Snapshot persists `audit_mode` (`gate` | `engine`) for runtime traceability.
- Snapshot includes deterministic `rules_coverage` contract:
  - `active_rule_ids[]`
  - `evaluated_rule_ids[]`
  - `matched_rule_ids[]`
  - `unevaluated_rule_ids[]`
  - `unsupported_auto_rule_ids[]` (optional; present when AUTO skills have no detector mapping)
  - `counts` + `coverage_ratio`
- Severity metrics include dual projections:
  - legacy: `severity_metrics.by_severity` (`CRITICAL/ERROR/WARN/INFO`)
  - enterprise: `severity_metrics.by_enterprise_severity` (`CRITICAL/HIGH/MEDIUM/LOW`)

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
  - snapshot metadata includes `findings_files_count` (deterministic count of distinct files with findings)
  - snapshot metadata includes `findings_rules_count` (deterministic count of distinct rule IDs in findings)
  - snapshot metadata includes `findings_with_lines_count` (deterministic count of findings with line metadata)
  - snapshot metadata includes `findings_without_lines_count` (deterministic count of findings without line metadata)
  - includes `rulesets_platforms_count` (deterministic count of distinct platforms covered by loaded rulesets)
  - includes `rulesets_bundles_count` (deterministic count of distinct loaded ruleset bundles)
  - includes `rulesets_hashes_count` (deterministic count of distinct loaded ruleset hashes)
  - includes `ledger_files_count` (deterministic count of distinct files with open ledger entries)
  - includes `ledger_rules_count` (deterministic count of distinct rule IDs with open ledger entries)
  - includes `suppressed_replacement_rules_count` (deterministic count of distinct replacement rule IDs in suppressed findings)
  - includes `suppressed_platforms_count` (deterministic count of distinct platforms represented in suppressed findings)
  - includes `suppressed_files_count` (deterministic count of distinct files represented in suppressed findings)
  - includes `suppressed_rules_count` (deterministic count of distinct original rule IDs represented in suppressed findings)
  - snapshot metadata includes `severity_counts` (deterministic key order)
  - snapshot metadata includes `findings_by_platform` (deterministic platform-key order)
  - snapshot metadata includes `highest_severity` (deterministic severity ranking)
  - snapshot metadata includes `blocking_findings_count` (count of CRITICAL+ERROR findings)
  - includes `ledger_by_platform` (deterministic platform-key order)
  - includes `rulesets_by_platform` (deterministic platform-key order)
  - includes `rulesets_fingerprint` (deterministic ordered hash signature)
  - includes `platform_confidence_counts` (deterministic counts by platform confidence level)
  - includes `suppressed_findings_count` (deterministic count of suppressed findings in consolidation)
  - includes `tracked_platforms_count` (deterministic count of currently tracked platforms)
  - includes `detected_platforms_count` (deterministic count of currently detected platforms)
  - includes `non_detected_platforms_count` (deterministic count of currently tracked but non-detected platforms)
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

Reference: `docs/mcp/evidence-context-server.md`.
Consumption: `docs/mcp/agent-context-consumption.md`.

## Local execution quick refs

```bash
npm run framework:menu
npm run adapter:install -- --agent=codex --dry-run
npx --yes pumuki adapter install --agent=cursor
npm run toolkit:adapter-readiness
npm run typecheck
npm run test:deterministic
```

Menu UI rollout controls:

- `PUMUKI_MENU_UI_V2=0|1` (`0` default = classic, `1` = modern grouped renderer)
- `PUMUKI_MENU_MODE=consumer|advanced`
- `PUMUKI_MENU_COLOR`, `PUMUKI_MENU_WIDTH`
- v2 renderer failures auto-fallback to classic renderer

Consumer menu pre-flight:

- options `1/2/3/4` execute pre-flight before gate evaluation
- pre-flight checks `repo_state`, stale/missing evidence, git-flow protected branches, and AI gate chain consistency
- stage mapping is deterministic: `1/3 -> PRE_COMMIT`, `2/4 -> PRE_PUSH`
- consumer mode is a read-only shell: `1/2/3/4` are gate flows, `8` is the matching markdown export, and `5/6/7/9` are `Legacy Read-Only Diagnostics`
- in modern UI mode (`PUMUKI_MENU_UI_V2=1`) options are grouped by domains while preserving IDs and execution wiring
- advanced maintenance option `33` imports custom rules from `AGENTS.md/SKILLS.md` to `/.pumuki/custom-rules.json`
- menu audits no longer bypass SDD; `sdd.policy.blocked` can be emitted in menu-driven runs
- advanced options `28/29/30/32` are legacy read-only audits: they help inspect evidence snapshots, but they do not redefine the canonical gate verdict
- acceptance baseline helper: `npm run validation:consumer-matrix-baseline -- --repo-root /absolute/path/to/<fixture> --fixture <name> --rounds 3 --json`
- baseline outputs are written under `.audit-reports/fixture-matrix/<fixture>/consumer-menu-matrix-baseline/{report.json,summary.md}` and return exit `1` on drift
- baseline `report.json` also carries `status.policyValidation`, `status.experimentalFeatures`, `doctor.blocking`, and `doctor.layerSummary`
- validated acceptance snapshots on `2026-03-14`: `ios-architecture-showcase=stable YES`, `SAAS:APP_SUPERMERCADOS=stable YES`, `R_GO=stable YES`

## Optional support toolkit

Primary namespace is `toolkit:*`. Legacy `validation:*` aliases remain only for compatibility.

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

- `npm run toolkit:adapter-readiness`
- `npm run toolkit:adapter-session-status`
- `npm run toolkit:adapter-real-session-report`
- `npm run toolkit:phase5-blockers-readiness`
- `npm run toolkit:phase5-execution-closure-status`
- `npm run toolkit:phase5-execution-closure`
- `npm run toolkit:clean-artifacts`

`toolkit:phase5-execution-closure` notes:

- defaults to output directory `.audit-reports/phase5`
- runs auth preflight and fails fast on auth/scope blockers
- supports `--skip-auth-preflight` when preflight must be bypassed

Framework menu action:

- `Toolkit: build adapter readiness report`
- `Toolkit: build phase5 execution closure status report`
- `Toolkit: run phase5 execution closure`
- `Toolkit: clean local validation artifacts`

Frozen legacy support namespace:

- `npm run toolkit:legacy:phase5-external-handoff`
- `npm run toolkit:legacy:phase5-latest:refresh`
- `npm run toolkit:legacy:phase5-latest:ready-check`
- `npm run toolkit:legacy:phase5-escalation:prepare`
- `npm run toolkit:legacy:phase8:doctor`
- `npm run toolkit:legacy:phase8:close-ready`

Legacy advanced menu action:

- `Toolkit legacy: build phase5 external handoff report`

Deterministic argument builders exported from menu module:

- `buildAdapterReadinessCommandArgs({ scriptPath, adapterReportFile, outFile })`
- `buildCleanValidationArtifactsCommandArgs({ scriptPath, dryRun })`
- `buildImportCustomSkillsCommandArgs()`
- `buildPhase5BlockersReadinessCommandArgs({ scriptPath, adapterReportFile, consumerTriageReportFile, outFile })`
- `buildPhase5ExecutionClosureStatusCommandArgs({ scriptPath, phase5BlockersReportFile, consumerUnblockReportFile, adapterReadinessReportFile, outFile, requireAdapterReadiness })`
- `buildPhase5ExternalHandoffCommandArgs({ scriptPath, repo, phase5StatusReportFile, phase5BlockersReportFile, consumerUnblockReportFile, mockAbReportFile, runReportFile, outFile, artifactUrls, requireArtifactUrls, requireMockAbReport })`
- `buildPhase5ExecutionClosureCommandArgs({ scriptPath, repo, limit, outDir, runWorkflowLint, includeAuthPreflight, repoPath, actionlintBin, includeAdapter, requireAdapterReadiness })`

Current adapter implementation note:

- The adapter report input flag is named `adapterReportFile` / `--adapter-report` for compatibility with existing runbooks.
