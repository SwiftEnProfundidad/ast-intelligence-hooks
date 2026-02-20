# Changelog

All notable changes to `pumuki` are documented here.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No changes yet.

## [6.3.17] - 2026-02-20

### Added

- Introduced deterministic `repo_state.lifecycle.hard_mode` capture in evidence generation (`.pumuki/hard-mode.json` persisted and normalized into `.ai_evidence.json`).
- Added lifecycle adapter scaffolding command surface:
  - `pumuki adapter install --agent=<codex|claude|cursor|windsurf|opencode> [--dry-run]`
  - `npm run adapter:install -- --agent=<name>`
- Added framework menu hard-mode configuration action for enterprise operation (`Configure hard mode enforcement (enterprise)`).

### Changed

- Unified AI Gate contract now carries resolved policy trace for all stages, including `PRE_WRITE` mapped deterministically to `PRE_COMMIT` policy resolution.
- Enterprise MCP tool `ai_gate_check` now returns resolved policy metadata (`policy.stage`, `policy.resolved_stage`, `policy.trace`) in the tool result envelope.
- Refreshed `README.md` with enterprise-first onboarding structure (quickstart, hard mode, PRE_WRITE chain contract, lifecycle/adapters, MCP map).

### Fixed

- Closed PRE_WRITE/MCP policy drift by propagating the same hard-mode persisted policy trace used in `PRE_COMMIT/PRE_PUSH/CI`.

## [6.3.16] - 2026-02-20

### Fixed

- MCP evidence `/status` now guarantees `evidence.exists` as a strict boolean across `missing`, `invalid`, and `valid` evidence states (no `null` ambiguity), while preserving `evidence.present` as compatibility alias.
- Evidence runtime consolidation now deduplicates base/skills overlaps with deterministic semantic collision keys (`stage+platform+file+anchor+family`), preserving suppressed traceability metadata (`replacedByRuleId`, `replacementRuleId`, `platform`, `reason`).
- Runtime dependency `ts-morph` minimum version is now `>=27.0.2`, removing the high-severity production chain `ts-morph -> @ts-morph/common -> minimatch<10.2.1`; `npm audit --omit=dev` is now clean (`0` vulnerabilities).
- Fixed strict TypeScript typing in `integrations/evidence/buildEvidence.ts` (`normalizeAnchorLine`) to avoid union narrowing errors during `tsc --noEmit`.

### Changed

- Consolidated official documentation index and references to the active enterprise set only.
- Updated governance references from `CLAUDE.md` to `PUMUKI.md` across active docs.

### Removed

- Deprecated documentation artifacts and duplicated image mirrors under `docs/images/*`.
- Legacy docs-hygiene command path from package scripts and framework menu maintenance actions.
- Docs-hygiene-only guardrail tests and helper scripts that were not part of runtime enforcement.

## [6.3.15] - 2026-02-19

### Fixed

- Removed unused runtime dependency `glob` from `dependencies` to eliminate the vulnerable consumer chain `pumuki -> glob -> minimatch` without changing the Node.js support baseline (`>=18`).
- Regenerated lockfile after dependency cleanup to keep published manifest deterministic.

## [6.3.14] - 2026-02-18

### Added

- New lifecycle command `pumuki remove` to perform enterprise cleanup and dependency removal in one step:
  - removes managed hooks and lifecycle local state,
  - purges untracked evidence artifacts,
  - uninstalls `pumuki` from the consumer `package.json`,
  - package canonical name migrated from `pumuki-ast-hooks` to `pumuki` for enterprise UX (`npm install pumuki`),
  - prunes orphan `node_modules/.package-lock.json` residue when `node_modules` has no other content.
- OpenSpec+SDD enterprise baseline:
  - new SDD integration module at `integrations/sdd/*` (policy, session store, OpenSpec CLI adapter),
  - new commands `pumuki sdd status`, `pumuki sdd session`, `pumuki sdd validate`,
  - new pre-write gate command `pumuki-pre-write` / `pumuki:sdd:pre-write`,
  - SDD enforcement integrated across `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, and `CI`,
  - emergency bypass support `PUMUKI_SDD_BYPASS=1` with explicit evidence traceability.
- New enterprise MCP server `pumuki-mcp-enterprise`:
  - resources: `evidence://status`, `gitflow://state`, `context://active`, `sdd://status`, `sdd://active-change`,
  - tools: `ai_gate_check`, `check_sdd_status`, `validate_and_fix`, `sync_branches`, `cleanup_stale_branches`,
  - fail-safe response envelope for `/tool` executions with deterministic JSON.

### Changed

- Stage-gates test execution now uses glob-based test targets for easier maintenance.
- Lifecycle bootstrap/update now manage OpenSpec compatibility automatically:
  - `pumuki install` bootstraps OpenSpec when missing,
  - `pumuki update --latest` migrates legacy `openspec` package to `@fission-ai/openspec` when needed.
- Evidence v2.1 payload now includes SDD observability:
  - `sdd_metrics` section in snapshot payload,
  - SDD blocking findings emitted with `source: "sdd-policy"`.
- Active documentation guardrails now enforce:
  - English-only baseline for active enterprise docs.
  - Local markdown reference integrity for active docs.
- Interactive framework menu now defaults to `Consumer` mode and separates the full surface behind `Advanced` mode (`A` to switch, `C` to return), with short inline help per option.

### Fixed

- Package smoke runner export wiring was restored for staged payload setup (`validation:package-smoke` / `validation:package-smoke:minimal`).
- `pumuki remove` now prunes only directories traceable to the Pumuki dependency tree, guaranteeing third-party dependency folders are never removed.
- `pumuki-pre-push` now fails safe when the branch has no upstream configured, returning `exit 1` with an explicit guidance message instead of silently evaluating `HEAD..HEAD`.
- Lifecycle git command execution now suppresses expected git stderr in fail-safe paths to avoid noisy output during deterministic tests.
- Framework menu report actions now resolve runner scripts from both consumer repo root and installed package root, enabling report generation from `npx pumuki-framework` in consumer repositories.
- Evidence traceability is now attached deterministically at evaluation time:
  - findings include `filePath`/`lines` when traceable from matched facts,
  - evidence v2.1 persists `matchedBy` and `source` for snapshot + compatibility violations,
  - baseline/skills findings no longer collapse to `file: "unknown"` when matching facts are available.

### Refactored

- Script-level SRP split for Phase 5 closure/status builders and adapter real-session evaluation/parsing helpers.

## [6.3.5] - 2026-02-10

### Added

- Deterministic guardrails for active documentation quality:
  - IDE/provider-agnostic language in active docs.
  - English-only baseline in active docs.
  - Index coverage and markdown-reference integrity checks.

### Changed

- Stage-gates suite expanded to include docs quality and package smoke export-contract guardrails.

### Fixed

- Package smoke staged payload export contract regression in repo setup helpers.

## Notes

- Canonical v2.x release narrative and operational detail live in:
  - `docs/RELEASE_NOTES.md`
- Historical commit-level trace remains available via:
  - `git log`
  - `git show`
