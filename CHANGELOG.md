# Changelog

All notable changes to `pumuki` are documented here.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
