# Changelog

All notable changes to `pumuki-ast-hooks` are documented here.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New lifecycle command `pumuki remove` to perform enterprise cleanup and dependency removal in one step:
  - removes managed hooks and lifecycle local state,
  - purges untracked evidence artifacts,
  - uninstalls `pumuki-ast-hooks` from the consumer `package.json`,
  - prunes orphan `node_modules/.package-lock.json` residue when `node_modules` has no other content.

### Changed

- Stage-gates test execution now uses glob-based test targets for easier maintenance.
- Active documentation guardrails now enforce:
  - English-only baseline for active enterprise docs.
  - Local markdown reference integrity for active docs.

### Fixed

- Package smoke runner export wiring was restored for staged payload setup (`validation:package-smoke` / `validation:package-smoke:minimal`).

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
