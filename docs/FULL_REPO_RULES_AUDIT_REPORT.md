# Full Repo Rules Audit Report

## Scope
- Repository: `ast-intelligence-hooks`
- Execution date (UTC): `2026-02-22T22:18:56.584Z`
- Command used (menu option 1): `printf '1\n10\n' | npx ast-hooks audit --scope repo`
- Audit mode: `PRE_COMMIT` full repository snapshot

## Rules Loading Verification

### 1) Skills source parity (local vs vendorizado)
All configured skill sources are synchronized (`SHA-256` identical):

- `windsurf-rules-android` -> `docs/codex-skills/windsurf-rules-android.md`
- `windsurf-rules-backend` -> `docs/codex-skills/windsurf-rules-backend.md`
- `windsurf-rules-frontend` -> `docs/codex-skills/windsurf-rules-frontend.md`
- `windsurf-rules-ios` -> `docs/codex-skills/windsurf-rules-ios.md`
- `swift-concurrency` -> `docs/codex-skills/swift-concurrency.md`
- `swiftui-expert-skill` -> `docs/codex-skills/swiftui-expert-skill.md`

Hashes checked:

- `windsurf-rules-android`: `c4d24bcf258af21bcfc7ae17276683ba802f7eac429dd35b15fa2e11356a339f`
- `windsurf-rules-backend`: `5129e38ac9214d8f506c29ecf6d6bda742a43786d29baeac01f872a561196172`
- `windsurf-rules-frontend`: `f6977fa8f4c18b3957e080701705440f15cc4c9eb2de634b72434bb000c99d7a`
- `windsurf-rules-ios`: `d56ea2aee3eab1768937d8913363e805e70dc9213a3dda43e2d6551b0872ef19`
- `swift-concurrency`: `62e81a46dc206ab6c4b3c5e7555e6007bb4d40db063f135eab263a4a0b9060b3`
- `swiftui-expert-skill`: `dc785e71742a9c215c0d70b2e7bfb1c4dd41553061663f7cf0a748018664b141`

### 2) Bundles loaded by runtime evidence
Loaded in `.AI_EVIDENCE.json` (`rulesets[*].bundle`):

- `backendRuleSet@1.0.0`
- `frontendRuleSet@1.0.0`
- `astHeuristicsRuleSet@0.5.0`
- `gate-policy.default.PRE_COMMIT`
- `android-guidelines@1.0.0`
- `backend-guidelines@1.0.0`
- `frontend-guidelines@1.0.0`
- `ios-concurrency-guidelines@1.0.0`
- `ios-guidelines@1.0.0`
- `ios-swiftui-expert-guidelines@1.0.0`

Lock compilation snapshot (`skills.lock.json`):

- Skill bundles in lock: `6`
- Rules compiled from those bundles: `25`

### 3) Coverage integrity
From `.AI_EVIDENCE.json` -> `snapshot.rules_coverage`:

- Active rules: `409`
- Evaluated rules: `409`
- Matched rules: `3`
- Unevaluated rules: `0`
- Coverage ratio: `1.0` (100%)

From `snapshot.evaluation_metrics`:

- Baseline rules: `6`
- Heuristic rules: `165`
- Skills rules: `238`
- Project custom rules: `0`

### 4) Platform detection during this audit
From `.AI_EVIDENCE.json` -> `platforms`:

- `backend`: detected (`MEDIUM`)
- `frontend`: detected (`MEDIUM`)

## Findings (Complete Repo)

### Severity summary
Note: en métricas internas aparece `ERROR`; en UI del menú v2 se representa como `HIGH`.

- `CRITICAL`: 0
- `ERROR/HIGH`: 3
- `WARN/MEDIUM`: 0
- `INFO/LOW`: 0
- Gate status: `BLOCKED`

### Violations detail
1. Rule: `heuristics.ts.child-process-exec-file-sync.ast`
   - Severity: `ERROR` (`HIGH` en UI)
   - File: `scripts/framework-menu-matrix-canary-lib.ts`
   - Message: `AST heuristic detected execFileSync usage.`

2. Rule: `heuristics.ts.child-process-exec-file-untrusted-args.ast`
   - Severity: `ERROR` (`HIGH` en UI)
   - File: `scripts/framework-menu-matrix-canary-lib.ts`
   - Message: `AST heuristic detected execFile/execFileSync with non-literal args array.`

3. Rule: `heuristics.ts.process-exit.ast`
   - Severity: `ERROR` (`HIGH` en UI)
   - File: `scripts/import-custom-skills.ts`
   - Message: `AST heuristic detected process.exit usage.`

## Audit Conclusion
- The repository audit completed with full rule coverage (`409/409` evaluated, `unevaluated=0`).
- Current gate result is `BLOCKED` by 3 high-severity (`ERROR`) findings.
- No `CRITICAL` violations detected.
