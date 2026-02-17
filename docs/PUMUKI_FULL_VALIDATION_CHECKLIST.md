# Pumuki Full Validation Checklist

Master checklist to validate the full Pumuki cycle end-to-end before rollout in enterprise consumer repositories.

## Legend

- ✅ Done
- 🚧 In progress
- ⏳ Pending

## Validation policy

- Execute tasks in order.
- Close one task at a time.
- Keep evidence for each task (command output + expected result).
- Any warning/error found during execution must be fixed immediately before continuing.

## Scope

This checklist covers:

- npm package distribution and command surface.
- lifecycle management (`install`, `doctor`, `status`, `update`, `uninstall`, `remove`).
- stage gates (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- multi-platform evaluation (iOS, backend, frontend, android).
- rulesets, stage policies, and override behavior.
- deterministic evidence v2.1.
- MCP evidence context server.
- framework operational CLI/menu.
- deterministic/regression suites.
- mock-consumer execution matrix.

## Task board

### A. Package and distribution

- ⏳ A1. Verify npm metadata and dist-tags (`latest`, `next`) match target release.
- ⏳ A2. Verify package can be installed from npm in a clean consumer repository.
- ⏳ A3. Verify published binaries are available after install:
  - `pumuki`
  - `pumuki-pre-commit`
  - `pumuki-pre-push`
  - `pumuki-ci`
  - `pumuki-mcp-evidence`
- ⏳ A4. Verify `VERSION`, `package.json` version, and release notes/changelog are aligned.

### B. Lifecycle management

- ⏳ B1. `pumuki install` installs only managed hook blocks and lifecycle state.
- ⏳ B2. `pumuki doctor` returns PASS on a clean baseline.
- ⏳ B3. `pumuki status` reflects installed lifecycle and managed hooks.
- ⏳ B4. `pumuki update --latest` keeps managed hooks idempotent and healthy.
- ⏳ B5. `pumuki uninstall --purge-artifacts` removes managed hooks and known artifacts.
- ⏳ B6. `pumuki remove` removes all Pumuki traces and keeps third-party dependencies untouched.
- ⏳ B7. Safety guard: tracked `node_modules` blocks install/update as expected.
- ⏳ B8. Re-run install/remove cycle twice to validate idempotency.

### C. Stage gate runtime

- ⏳ C1. `pumuki-pre-commit` evaluates staged scope only (`git diff --cached`).
- ⏳ C2. `pumuki-pre-push` evaluates `upstream..HEAD`.
- ⏳ C3. `pumuki-ci` evaluates `baseRef..HEAD` (`GITHUB_BASE_REF` or fallback).
- ⏳ C4. Exit codes are deterministic (`0` allow, `1` block).
- ⏳ C5. Gate behavior is consistent between direct binaries and hook-triggered execution.

### D. Platform detection and combined evaluation

- ⏳ D1. iOS selector coverage (`*.swift`) works in mixed repositories.
- ⏳ D2. Backend selector coverage (`apps/backend/**/*.ts`) works in mixed repositories.
- ⏳ D3. Frontend selector coverage (`apps/frontend|apps/web`) works in mixed repositories.
- ⏳ D4. Android selector coverage (`*.kt`, `*.kts`) works in mixed repositories.
- ⏳ D5. Multi-platform commit/range triggers combined ruleset loading and combined gate output.
- ⏳ D6. Platform false positives are not observed outside selector scope.

### E. Rulesets, policies, and overrides

- ⏳ E1. Baseline packs load correctly:
  - `iosEnterpriseRuleSet`
  - `backendRuleSet`
  - `frontendRuleSet`
  - `androidRuleSet`
- ⏳ E2. Stage policy thresholds match expected defaults:
  - PRE_COMMIT: block `CRITICAL`, warn `ERROR`
  - PRE_PUSH: block `ERROR`, warn `WARN`
  - CI: block `ERROR`, warn `WARN`
- ⏳ E3. Project overrides apply without breaking locked baseline semantics.
- ⏳ E4. Locked rules remain enforced when overrides are not explicitly allowed.

### F. Evidence v2.1 contract

- ⏳ F1. `.ai_evidence.json` is generated for each stage run.
- ⏳ F2. Evidence schema fields are valid (`version`, `snapshot`, `ledger`).
- ⏳ F3. Evidence includes active platforms and loaded rulesets.
- ⏳ F4. Evidence ordering is deterministic across equivalent runs.
- ⏳ F5. Suppression/ledger fields remain machine-readable and stable.

### G. MCP evidence context server

- 🚧 G1. Start MCP evidence server (`pumuki-mcp-evidence`) from consumer repo context.
- ⏳ G2. Validate MCP context endpoints/facets respond with valid payload shape.
- ⏳ G3. Validate MCP reads latest `.ai_evidence.json` deterministically.
- ⏳ G4. Validate MCP behavior when evidence file is missing/corrupted.

### H. Framework operational UX

- ⏳ H1. `npm run framework:menu` opens and executes expected actions.
- ⏳ H2. Menu actions that map to gate/lifecycle commands produce expected outputs.
- ⏳ H3. Menu actions that generate validation reports create files in expected locations.

### I. Deterministic test and validation suites

- ⏳ I1. `npm run typecheck` passes.
- ⏳ I2. `npm run test` passes.
- ⏳ I3. `npm run test:deterministic` passes.
- ⏳ I4. `npm run test:heuristics` passes.
- ⏳ I5. `npm run test:mcp` passes.
- ⏳ I6. `npm run test:stage-gates` passes.
- ⏳ I7. `npm run validation:package-manifest` passes.
- ⏳ I8. `npm run validation:lifecycle-smoke` passes.
- ⏳ I9. `npm run validation:package-smoke` passes.
- ⏳ I10. `npm run validation:package-smoke:minimal` passes.
- ⏳ I11. `npm run validation:docs-hygiene` passes.

### J. Mock consumer full cycle

- ⏳ J1. Clean scenario: pre-commit/pre-push/ci => all pass (`0`).
- ⏳ J2. Violations scenario: pre-commit/pre-push/ci => block (`1`) as expected.
- ⏳ J3. Mixed scenario: deterministic combined blocking/warning behavior.
- ⏳ J4. Lifecycle cleanup after each scenario leaves repository baseline clean.
- ⏳ J5. Re-run matrix to confirm repeatability (same outcomes on rerun).

### K. Failure and recovery paths

- ⏳ K1. PRE_PUSH without upstream produces clear guidance and safe failure path.
- ⏳ K2. CI without `GITHUB_BASE_REF` correctly falls back to default base ref.
- ⏳ K3. Hook drift recovery: `doctor` detects and `install`/`update` restores managed blocks.
- ⏳ K4. Partial lifecycle state mismatch is detected and recoverable.

### L. Release closure

- ⏳ L1. README/USAGE/INSTALLATION commands match current runtime behavior.
- ⏳ L2. CHANGELOG includes all user-visible behavior changes.
- ⏳ L3. Release package tested in mock consumer from npm (not local path).
- ⏳ L4. Final go/no-go report created with links to evidence artifacts and logs.

## Exit criteria

All tasks A1-L4 must be ✅ with stored command evidence and no unresolved warnings/errors.
