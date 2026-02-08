# Framework Work Tracking (TODO)

## Scope

This document tracks the agreed improvements for **Pumuki AST Intelligence Framework**.

## Done

- Refactor `README.md` to position the project as a framework (governance + lifecycle + commands).
- Add Git governance section documenting `ast:gitflow` and `ast:release` with options and flow.
- Add Developer Experience section (notifications + evidence freshness + git-tree guardrails).
- Make `docs/ARCHITECTURE.md` more normative by adding invariants + control primitives.
- Add `human_intent` to `ai_evidence v2.1` and mirror it in `ai_gate` output.
- Enforce `human_intent.expires_at` (ignore stale intent deterministically).
- Add README section for manual hook-system usage (interactive + `AUDIT_OPTION` + command mapping).
- Convert root `ARCHITECTURE.md` into conceptual architecture linked to `docs/ARCHITECTURE.md`.
- Define canonical evidence writer path and deterministic merge strategy.
- Standardize visuals in `docs/images/` to consistent, resolution-independent assets.
- Harden MCP evidence context server with test coverage and deterministic CI suite.
- Rewrite `README.md` and `docs/USAGE.md` to align with deterministic v2.x stage/rules/evidence model.
- Rewrite `README.md` to enterprise-grade English-only standard with explicit architecture/governance/runtime contracts.
- Rewrite `docs/HOW_IT_WORKS.md` and `docs/API_REFERENCE.md` to remove legacy API/runtime references.
- Consolidate release notes to active v2.x line and remove legacy 5.3.4 migration/release docs.
- Rewrite `docs/INSTALLATION.md`, `docs/CONFIGURATION.md`, and `docs/ARCHITECTURE_DETAILED.md` to active v2.x model.
- Rewrite `docs/ARCHITECTURE.md`, `docs/MCP_SERVERS.md`, and `docs/TESTING.md` to active deterministic surface.
- Rewrite remaining operational docs (`CONTRIBUTING`, `DEPENDENCIES`, `CODE_STANDARDS`, `BRANCH_PROTECTION_GUIDE`, `observability`, `alerting-system`) to active v2.x scope.
- Remove obsolete markdown leftovers not part of active v2.x docs surface (`type-safety`, `SEVERITY_AUDIT`, ad-hoc violations plan, legacy audit report in `_AI_DOCS`).
- Complete documentation hygiene pass across `README.md` + `docs/**/*.md` (final consistency + local link validation).
- Run end-to-end validation in sample consumer repositories for multi-platform PRE_COMMIT/PRE_PUSH/CI and capture deterministic evidence behavior.
- Fix evidence/gate mismatch so `snapshot.outcome` mirrors evaluated gate decision across stages.
- Calibrate heuristic maturity by promoting high-confidence rules to `ERROR` in `PRE_PUSH/CI`:
  - `heuristics.ios.anyview.ast`
  - `heuristics.ts.explicit-any.ast`
  - `heuristics.ios.callback-style.ast`
- Validate heuristic maturity matrix with `PUMUKI_ENABLE_AST_HEURISTICS=on` in backend/frontend sample consumer repositories.
- Consolidate evidence signal by suppressing mapped iOS heuristic duplicates when stronger/equal baseline findings exist on the same file.
- Consolidate evidence signal for mapped iOS/backend/frontend semantic families by keeping highest-severity finding per file-family pair.
- Validate post-consolidation matrix to ensure duplicate removal does not change stage gate decisions.
- Add optional `consolidation.suppressed[]` trace in evidence to preserve auditability of removed duplicates.
- Add MCP evidence response filters (`includeSuppressed`, `view=compact|full`) for human/agent-oriented payloads.
- Add MCP `/status` endpoint for lightweight evidence readiness summary (`present/valid/version/stage/outcome/counts`).
- Add targeted evidence fixtures confirming current file-level consolidation behavior when same-family findings appear on different lines.
- Enforce deterministic file-level consolidation when same rule repeats on different lines in one file, with dedicated evidence test coverage.
- Confirm file-level consolidation scope for v2.1 (single representative finding per file-family, including repeated same-rule line occurrences).
- Harden Windsurf cascade hook command with runtime resolver wrapper (`run-hook-with-node.sh`) to reduce `node: command not found` failures in non-interactive shells.
- Document staged rollout strategy for Windsurf hook runtime hardening (compatibility, diagnostics, strict mode).
- Add local runtime diagnostics collector script for Windsurf hooks (`collect-runtime-diagnostics.sh`) with `.audit_tmp` output.
- Run local simulated Windsurf hook validation (pre_write blocks with exit 2, post_write allows with exit 0) and capture artifacts under `docs/validation/windsurf/artifacts/`.
- Add `npm run validate:windsurf-hooks-local` to standardize local Windsurf hook runtime validation.
- Add `npm run print:windsurf-hooks-config` to generate non-stale absolute Windsurf hook config paths.
- Add `npm run install:windsurf-hooks-config` to install refreshed Windsurf config with backup.
- Add `npm run verify:windsurf-hooks-runtime` as preflight guard for Windsurf hooks wiring/runtime.
- Add wrapper-path fallback (`scripts/...` or `legacy/scripts/...`) in Windsurf config tooling + pre-write AST loader.
- Add `npm run assess:windsurf-hooks-session` to auto-evaluate presence of real pre/post hook events from logs.
- Run `assess:windsurf-hooks-session:any` and confirm current local logs produce `session-assessment=PASS`.
- Split session assessment modes:
  - strict real-session mode (default, excludes simulated markers)
  - optional include-simulated mode (`assess:windsurf-hooks-session:any`)
- Enforce documentation language/tone policy:
  - all repository documentation must be English-only
  - rewrite any Spanish sections (including `README.md`) to enterprise-grade English
- Normalize legacy skills documentation language to enterprise English (`legacy/skills/**/*.md`).
- Remove residual tracked system file `docs/.DS_Store` from repository history moving forward.
- Enforce `skills.lock.json` freshness in CI (`npm run skills:lock:check` in workflow).
- Add consumer-repository rollout validation runbook for skills enforcement (`docs/validation/skills-rollout-consumer-repositories.md`).
- Execute first real consumer-repository rollout validation checkpoint and publish artifacts/report (`docs/validation/skills-rollout-r_go-report.md`).
- Complete positive multi-platform rollout validation in consumer context and publish report (`docs/validation/skills-rollout-r_go-multi-platform-report.md`).
- Assess consumer GitHub Actions artifact availability and document rollout blocker when workflows are in startup failure (`docs/validation/skills-rollout-consumer-ci-artifacts.md`).
- Add startup-failure troubleshooting playbook for consumer CI (`docs/validation/consumer-ci-startup-failure-playbook.md`).
- Add CLI helper to collect consumer CI run/artifact status into deterministic Markdown reports (`scripts/collect-consumer-ci-artifacts.ts`).
- Record comparative public/private CI signal for startup-failure root-cause triage (`docs/validation/skills-rollout-consumer-ci-artifacts.md`).
- Execute controlled Actions access-level check (`none -> user -> none`) and record outcome for startup-failure triage (`docs/validation/skills-rollout-consumer-ci-artifacts.md`).
- Record manual requirement for billing-scope verification (`gh auth refresh -s user`) when non-interactive automation cannot complete authorization.
- Capture semantic workflow lint findings from consumer repository as startup-failure candidates (`docs/validation/skills-rollout-r_go-workflow-lint.md`).
- Add helper command to generate consumer workflow lint reports from `actionlint` (`scripts/lint-consumer-workflows.ts`).
- Run branch-only remediation experiment in consumer repo and record negative result when startup failure persists (`docs/validation/skills-rollout-r_go-startup-fix-experiment.md`).
- Add GitHub Support ticket template for startup-failure escalation in private consumer repos (`docs/validation/github-support-ticket-template-startup-failure.md`).
- Open consumer-tracking issue for startup-failure unblock plan (`SwiftEnProfundidad/R_GO#582`).
- Reproduce startup failure in a brand-new private temp repo to confirm account-level scope (`docs/validation/private-actions-healthcheck-temp.md`).
- Add helper command to build support-ready startup-failure bundles (`scripts/build-consumer-startup-failure-support-bundle.ts`).
- Extend startup-failure support bundle output with repository Actions policy and billing-scope probe diagnostics.
- Document Windsurf stale direct-`node` hook failure signature and remediation workflow in runtime validation playbook.

## Next

- Windsurf pre/post tool hooks reliability (`bash: node: command not found`):
  - Execute `docs/validation/windsurf-hook-runtime-validation.md` in a real Windsurf session and compare against `docs/validation/windsurf-hook-runtime-local-report.md`.

## Skills Enforcement Roadmap (Enterprise)

### Goal

Ensure user/team skills are enforced by Pumuki in a deterministic, CI-reproducible way without coupling audits to `~/.codex`.

### Guardrails

- Keep enforcement inputs versioned in repository scope.
- Keep `core/*` pure; implement loading/adaptation in `integrations/*`.
- Do not read `~/.codex/**` during CI gate execution.
- Trace every applied skills bundle in `.ai_evidence.json` (`rulesets[]`).

### Phase 1: Contract and Lockfile

- [x] Define `skills.lock.json` schema (bundle, version, hash, compiled rules, generated_at).
- [x] Define `skills.policy.json` schema (stage severity policy and enabled/disabled rule sets).
- [x] Add schema validation tests and deterministic hash tests.
- [x] Document repository ownership model for both files.

### Phase 2: Compilation Flow (Local Authoring)

- [x] Add local command to compile skills sources into `skills.lock.json`.
- [x] Start with explicit mapping templates (manual curated mapping), not free-text runtime parsing.
- [x] Add fixture-based tests for compilation determinism.
- [x] Record compiler version in lock metadata.

### Phase 3: Gate Integration

- [x] Load `skills.lock.json` + `skills.policy.json` via `integrations/config/*`.
- [x] Convert compiled entries to RuleSet and merge with baseline/project rules.
- [x] Enforce locked baseline semantics through existing `mergeRuleSets`.
- [x] Register skills bundle in evidence `rulesets[]` with stable hash.

### Phase 4: Stage Calibration

- [x] Define stage behavior for skills-derived rules:
  - PRE_COMMIT: warn-first for non-critical skill rules.
  - PRE_PUSH/CI: block on calibrated critical/error skills-derived rules.
- [x] Add policy tests for stage promotion behavior.
- [x] Add regression tests for evidence outcomes per stage.

### Phase 5: Rollout and DX

- [x] Add docs for maintainers: "how to update skills lock safely".
- [x] Add CI check to fail when lock is stale versus source policy inputs.
- [x] Add migration guide for teams moving from personal skills-only to repository-enforced skills.
- [x] Add minimal menu entry to display active skills bundle/version/hash.

### Current Status

- [x] Phase 1 completed (contracts + validators + deterministic hash tests).
- [x] Phase 2 completed (compiler + templates + deterministic fixtures + stale check).
- [x] Documentation milestone: define Phase 5 rollout validation procedure for sample consumer repositories.
- [x] Execution milestone: complete the Phase 5 matrix with consumer runs that produce positive platform detection for iOS/backend/frontend/android and attach stage artifacts/logs.
- [ ] Next execution milestone: confirm and resolve private-repo Actions policy/billing constraint in consumer repo, then attach CI artifact URLs to rollout reports.

## Notes
