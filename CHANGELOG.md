# Changelog

All notable changes to `@pumuki/ast-intelligence-hooks` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.5.20] - 2026-01-04

### Fixed
- **Session Loader**: Restored comprehensive session context report on IDE startup
- **Session Loader**: Fixed evidence age calculation for ISO 8601 timestamps with timezone offsets
- **Session Loader**: Removed `exec "$SHELL"` that caused infinite loop on macOS
- **Evidence Parsing**: Added Python-based timestamp parsing for reliable timezone conversion

### Changed
- **Session Loader**: Now displays branch, recent commits, session context, violations summary, and evidence freshness
- **Session Loader**: Added quick commands section for user convenience
- **Session Loader**: Violations summary now reads from `ast-summary.json` with severity breakdown

### Technical Details
- Evidence timestamps with timezone offsets (e.g., `+01:00`) now correctly parsed using Python's `datetime.fromisoformat()`
- Session loader no longer forks shell process, preventing resource exhaustion
- All session information displayed in a single, organized banner

## [5.5.16] - 2026-01-04

### Added
- **Integration Tests**: Complete test suite for `.AI_EVIDENCE.json` structure validation
- **Integration Tests**: Tests for `ai_gate.violations[]` and `severity_metrics` validation
- **Integration Tests**: Tests for `protocol_3_questions` validation
- **Documentation**: Phase 5 Testing and Validation Report (`_AI_DOCS/PHASE5_TESTING_VALIDATION_REPORT.md`)

### Changed
- **Test Directory**: Renamed `__tests__` to `tests` for cleaner structure
- **Test Language**: Translated all test strings from Spanish to English
- **Jest Configuration**: Updated `jest.config.js` to use `tests/**` pattern
- **README**: Restructured with consolidated sections (Installation, Quick Start)
- **README**: Added "Recent Changes" and "Known Issues" sections
- **README**: Updated version from 5.3.9 to 5.5.16

### Fixed
- **Notifications**: Added proper error handling for macOS notifications in `aiGateCheck`
- **Evidence**: Restored full functionality of evidence management system

### Test Results
- 32/32 integration tests passing
- 3 test suites completed
- Execution time: 0.173s

## [5.3.27] - 2026-01-02

### Fixed
- **Critical**: Excluded `Package.swift` from `ios.clean_arch.root_code` (SPM manifest must live at package root).
- **Critical**: Excluded `Package.swift` from `ios.networking.missing_urlsession` (URLs in SPM manifests are not runtime networking).

## [5.3.26] - 2026-01-02

### Fixed
- **Critical**: Installer now copies `scripts/hooks-system/config/` into the target project (includes `config/env.js`) to prevent `MODULE_NOT_FOUND` when running installed AST CLI.
- **Critical**: When `STAGING_ONLY_MODE=1`, AST output is filtered to staged file paths only, preventing non-staged violations from blocking atomic commits.

## [5.3.25] - 2026-01-02

### Fixed
- **Critical**: Fixed `--staged` flag not being respected by CLI
- Modified CLI to correctly pass STAGING_ONLY_MODE environment variable to AST analysis
- Pre-commit hook now analyzes only staged files, not entire repository
- Fixed env.js to read environment variables dynamically

### Changed
- CLI now properly handles `--staged` flag for atomic commits

## [5.3.24] - 2026-01-02

### Fixed
- **Critical**: Reverted incorrect paths from `../../../config/env` to `../../config/env` (2 levels up, not 3)
- Corrected paths in 17 files across application/services and infrastructure
- Pre-commit hook now works correctly with proper path resolution

### Changed
- Fixed import paths in all services and infrastructure modules

## [5.3.23] - 2026-01-02

### Fixed
- **Critical**: Fixed MODULE_NOT_FOUND error during pre-commit hook execution (config/env.js not included in npm package)
- Added explicit inclusion of `scripts/hooks-system/config/` directory in package.json files
- Pre-commit hook now works correctly after installation

### Changed
- Ensured all config files are included in npm distribution

## [5.3.22] - 2026-01-02

### Fixed
- **Critical**: Fixed MODULE_NOT_FOUND error during installation (require path to config/env was incorrect)
- Corrected relative paths from `../../config/env` to `../../../config/env` in 11 files across application/services and infrastructure
- Installation now works correctly with `npx ast-hooks install`

### Changed
- Fixed import paths in McpConfigurator, RealtimeGuardService, EvidenceMonitorService, TokenMetricsService
- Fixed import paths in enforce-english-literals, metrics-server, UnifiedLoggerFactory, intelligent-audit
- Fixed import paths in ast-intelligence, skill-activation-prompt, ast-core

## [5.3.21] - 2026-01-02

### Fixed
- **Critical**: Pre-commit hook now correctly uses `--staged` flag to analyze only staged files instead of entire repository
- **Critical**: Fixed regex character classes in pre-commit blocking condition (escaped `[CRITICAL]` and `[HIGH]` to prevent false positives)
- Pre-commit hook now respects `commitGating.stagingAreaOnly=true` configuration
- Removed false positive blocking when CRITICAL=0 and HIGH=0 (no actual violations)

### Changed
- Hook generator now always includes `--staged` flag when invoking `ast-hooks ast`
- Improved pre-commit hook regex to match only actual violation counts (CRITICAL=[1-9][0-9]*|HIGH=[1-9][0-9]*)

## [5.3.20] - 2025-12-31

### Fixed
- Removed runtime Express/CORS side-effects from the library entry point (`index.js` has no server or CORS).
- Removed `dotenv.config()` side-effect from `config.js` (no env pollution for consumers).
- Fixed broken test block in `ast-backend.js` (lint/syntax OK).

### Changed
- Published npm package `pumuki-ast-hooks@5.3.20` (tag latest).
- Updated docs/notes for safe installation.

## [5.3.18] - 2025-12-30

### Fixed
- AST analysis now correctly audits the hook-system repository itself (was detecting only 1 violation instead of ~485)
- Removed filters in `shouldIgnore()` that excluded `scripts/hooks-system/` and `/infrastructure/ast/` when `AUDIT_LIBRARY=false`
- Fixed `platformOf()` blocking analysis of `/infrastructure/ast/` files
- Added missing `env` module import in `ast-backend.js` that caused `ReferenceError` and prevented backend analysis

### Changed
- AST now analyzes all hook-system code regardless of `AUDIT_LIBRARY` flag, ensuring self-audit capability

## [5.3.16] - 2025-12-30

### Fixed
- MCP is no longer configured per workspace in Windsurf; single global entry with absolute path to the local binary (avoids collisions with multiple repos open).
- Removed legacy hardcode from CLI configurator (`pumuki-mcp.js`) and aligned with the global configuration.
- MCP server now resolves repo root via REPO_ROOT first (no cross-repo bleed when multiple servers run) and serverId is per repo.

### Changed
- Documentation: new guide `docs/MCP_CONFIGURATION.md` explaining global configuration and `ai_gate_check` validation.

## [5.3.17] - 2025-12-30

### Added
- CLI `ast-hooks ast --staged` activa `STAGING_ONLY_MODE=1` para auditorías solo sobre staged files.

### Changed
- Pre-commit hook usa `ast-hooks ast --staged` cuando hay archivos staged (análisis incremental); sin staged, sale limpio.
- No se altera el modo repo completo: las opciones de menú/CI siguen analizando todo el repositorio cuando corresponde.

## [5.3.14] - 2025-12-29

### Added
- Default architecture rules for Android, Frontend, and Backend platforms

### Changed
- Unified configuration approach across all platforms

## [5.3.13] - 2025-12-29

### Added
- iOS default patterns: MVP, MVVM, VIPER, HEXAGONAL, TCA
- Prohibit MVVM-C and MVC by default
- Enforce event-driven navigation for iOS architectures (including TCA)

### Changed
- Updated package version to 5.3.13
- Synced default project config to iOS allowed/prohibited patterns and navigation

## [5.3.9] - 2025-12-29

### Fixed
- **Critical**: Version resolution now logs warnings instead of silent catch
  - Reads `package.json` from multiple candidate paths (repo/node_modules)
  - Avoids wizard showing `vunknown` when run from consuming projects
  - Pre-commit hook comment uses resolved version

## [5.3.10] - 2025-12-29

### Fixed
- **Critical**: AST execution now runs from project ROOT (not library path)
  - Ensures `git rev-parse` resolves the correct repo
  - Fixes identical violation counts across different projects
  - Corrects staging-only audits to match staged files in the project

## [5.3.8] - 2025-12-29

### Fixed
- **Critical**: Version was hardcoded as "v5.3.1" in installation wizard
  - Now reads version dynamically from package.json
  - Wizard header and pre-commit hook show correct version
  - GitEnvironmentService now receives version as parameter

### Changed
- InstallService reads version from package.json at startup
- Pre-commit hook comment now shows correct package name: `pumuki-ast-hooks`

## [5.3.7] - 2025-12-29

### Fixed
- **Critical**: Fixed `ROOT_DIR` hardcoded to `pwd` instead of using git repository root
  - Previous versions used `ROOT_DIR=$(pwd)` which caused audits to analyze wrong directory
  - Now uses `git rev-parse --show-toplevel` to correctly determine repository root
  - This was causing identical violation counts across different projects (hardcoded path issue)
  - Verified: R_GO and library now show different violation counts correctly

## [5.3.6] - 2025-12-29

### Fixed
- **Critical**: Fixed jq logic in `compute_staged_summary` using `any()` for correct staged file matching
  - Previous version incorrectly filtered violations, showing "0 violations in staging" even when violations existed
  - Now correctly detects violations in staged files
  - Verified with 62 staged files in R_GO project

## [5.3.5] - 2025-12-29

### Fixed
- **Performance**: Optimized `compute_staged_summary` to use single-pass jq filtering instead of loop per file
  - Previous implementation was O(n*m) where n=staged files, m=violations
  - New implementation is O(m) with single jq pass
  - Fixes timeout/slowness with large numbers of staged files (500+)

### Changed
- Improved path matching in staging summary to use both `endswith` and `contains` for better reliability

## [5.3.4] - 2025-12-29

### 🐛 Fixed

- **Audit Orchestrator**: Fixed `STAGING_ONLY_MODE` being incorrectly set in option 2 (Strict REPO+STAGING)
  - Option 2 now correctly analyzes all repository files instead of only staged files
  - Added `unset STAGING_ONLY_MODE` to ensure full repository scan
- **Library Audit**: Fixed `AUDIT_LIBRARY` environment variable not being passed to Node.js process
  - Variable is now correctly exported when executing AST intelligence script
  - Ensures library's own files are included when `AUDIT_LIBRARY=true`
- **Staged Summary**: Improved file path matching for staged files
  - Now uses relative paths for more robust matching across different path formats
  - Better detection of violations in staged files

### 🔧 Changed

- Enhanced `compute_staged_summary` function with relative path matching
- Improved error handling in audit orchestrator

### 📝 Documentation

- Updated CHANGELOG with detailed release notes
- Added migration guide for users upgrading from 5.3.3

## [6.0.0] - 2025-12-02

### 🎉 Major Release - Complete Rewrite

#### ✨ Added
- **Master Validator**: 5-layer validation system (Evidence, Git Flow, AST, Rules, Build)
- **Git Wrapper**: Prevents `--no-verify` bypass completely - hooks are now inviolable
- **Detailed Violations Format**: Enhanced `.AI_EVIDENCE.json` with full violation objects
  - `file`, `line`, `severity`, `rule`, `message`, `category`, `severity_score`
- **Multi-Platform Build Validation**: Backend (NestJS), Frontend (Next.js), iOS (Swift), Android (Kotlin)
- **Portable Architecture**: Zero hardcoded paths, dynamic project root detection
- **Smart File Classification**: `.js`/`.sh` as first-class code, not infrastructure

#### 🔒 Security
- Pre-commit hooks impossible to bypass
- AI Gate blocking based on severity (CRITICAL/HIGH)
- Comprehensive violation tracking per file and line
- PII detection in logs

#### �� Portability
- Dynamic project root detection via `git rev-parse`
- Environment variable configuration
- Generic structure for any project
- No project-specific hardcoded paths
- Installable via `npm install` locally

#### 🎯 Breaking Changes
- `.AI_EVIDENCE.json` format enhanced:
  - `ai_gate.violations` now array of objects (was strings)
  - `files_modified` now includes `.js`/`.sh` hook-system code
  - `infra_modified` only for docs/configs (`.md`, `.json`, `.yaml`)
- File classification by extension and platform
- Requires git-wrapper installation for --no-verify block
- Master Validator integrated as first pre-commit hook

#### 🏗️ Architecture
- Clean Architecture compliance in all layers
- SOLID principles enforcement
- Modular design (Domain, Application, Infrastructure, Presentation)
- Library-first approach (reusable across projects)

#### 🛠️ Technical
- AST Intelligence as single source of truth for violations
- Delegates all rule validation (no hardcoded patterns in validators)
- Platform-aware detection (iOS, Android, Backend, Frontend)
- Enhanced error messages with actionable guidance

### Installation

```bash
# Local installation (before npm publish)
npm install /Users/juancarlosmerlosalbarracin/Libraries/ast-intelligence-hooks

# After publish (future)
npm install @pumuki/ast-intelligence-hooks
```

### Usage

```bash
# Install hooks in project
npx ast-install

# Run audit
npx ast-hooks audit

# Check violations
npx ast-violations list
```

---

## [5.2.0] - Previous Version
- Initial multi-platform support
- Basic AST analysis
- Git Flow integration
