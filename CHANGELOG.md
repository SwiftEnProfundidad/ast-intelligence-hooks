# Changelog

All notable changes to `@pumuki-ast-intelligence-hooks` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.0.8] - 2026-01-13

### Fixed
- **DIP detector for iOS**: generic type parameters constrained by protocols (e.g. `<Client: APIClientProtocol>`) are no longer flagged as concrete dependencies.

## [6.0.7] - 2026-01-13

### Fixed
- **God Class detector (backend)**: baseline-first by default; detector always runs (with or without baseline); thresholds are configurable via env to avoid hardcoded magic numbers.

## [6.0.6] - 2026-01-13

### Fixed
- **iOS Keychain casts**: `ios.types.forbidden_type_cast` ignores Security/Keychain helper files to avoid false positives in secure storage flows.
- **Gate staging filter**: staged file detection ignores deleted files (`--diff-filter=ACMRT`) to prevent stale violations.

## [6.0.3] - 2026-01-12

### Fixed
- **npm README images**: URLs absolutas y metadata del repo corregidas para evitar redirecciones 404.

## [6.0.2] - 2026-01-12

### Fixed
- **README npm images**: enlaces de imágenes actualizados a URLs absolutas para render correcto en npm.

## [6.0.1] - 2026-01-12

### Fixed
- **Connection pooling rule scope**: `common.network.missing_connection_pooling` ahora solo aplica a archivos JS/TS.
- **SPM DI detection**: `ios.spm.dependency_injection` no se reporta cuando `Package.swift` declara `dependencies: []`.
- **Swift Any + Security**: `ios.optionals.type_safety` ignora usos de `Any` cuando hay contexto `Security` (Keychain).
- **Unused Foundation import**: se reconoce el uso de tipos Foundation desde contenido de archivo para evitar falsos positivos.
- **Package metadata**: se elimina dependencia autorreferente `pumuki-ast-hooks` en `package.json`.

## [5.5.60] - 2026-01-08

### Fixed
- **ISP detector excludes ObservableObject classes**: Classes inheriting from ObservableObject are now excluded from ISP unused_dependency detection. Their @Published properties are inherently observed externally via Combine framework.

## [5.5.59] - 2026-01-08

### Fixed
- **Secret detector excludes Swift files**: Swift struct/class properties are no longer flagged as hardcoded secrets. The detector was incorrectly identifying `password` properties in DTOs as secrets.
- **God Class detector excludes Coordinators**: Navigation Coordinators are now excluded from God Class detection. Coordinators are orchestration classes, not business logic classes.

## [5.5.58] - 2026-01-08

### Fixed
- **ISP detector excludes test files**: Test spies/mocks are now excluded from ISP unused_dependency detection. Test doubles are allowed to have unused properties as they implement complete protocols for testing purposes.

## [5.5.57] - 2026-01-08

### Fixed
- **DIP detector recognizes generic type parameters with protocol constraints**: Generic type parameters (e.g., `<Client: APIClientProtocol>`) are no longer incorrectly flagged as concrete dependencies. Generics constrained by protocols are architecturally correct according to DIP.

## [5.5.56] - 2026-01-08

### Fixed
- **Swift files excluded from common.error.empty_catch detector**: Swift files are now only analyzed by iOS-specific detectors using SourceKitten. TypeScript AST parser cannot correctly parse Swift catch blocks, causing false positives in test files with XCTFail/guard case patterns.

## [5.5.55] - 2026-01-08

### Fixed
- **common.error.empty_catch detector improvements**: Enhanced detector to recognize test assertions (XCTFail, XCTAssert, guard case, expect, assert) and error handling patterns (throw, console, logger, log, print) as valid error handling, reducing false positives.

## [5.5.53] - 2026-01-07

### Fixed
- **AI Gate stability**: `ai_gate_check` reliably loads and verifies critical rules (includes `proofOfRead`, `totalRulesCount`, `rulesSample`)
- **AutonomousOrchestrator**: Restored missing wrappers (`detectFromBranchKeywords`, `detectFromEvidenceFile`, `scoreConfidence`) to prevent rule-loading regressions
- **MCP duplication resilience**: Operational guidance to avoid running multiple `ast-intelligence-automation` servers across repos (prevents stale branches and inconsistent gate output)

### Changed
- **Summary includes rule count**: `🚦 ALLOWED: Gate passed. 225 critical rules loaded and verified.`

## [5.5.51] - 2026-01-07

### Fixed
- **MCP Project Isolation**: Configuration now writes to project-scoped files (`.windsurf/mcp.json`, `.cursor/mcp.json`) instead of global config, preventing cross-project conflicts and 60s timeouts when multiple projects are open simultaneously
- **mandatory_rules in timeout**: Gate timeout responses now include `mandatory_rules` object for consistency
- **gitflow-enforcer.sh**: Bash 3.2 compatible with scripts+tests exception

### Changed
- **AI Gate enforces rule loading**: Gate now **BLOCKS** if critical platform rules cannot be loaded (not just warning)
- **Proof of read**: Gate output includes `proofOfRead`, `totalRulesCount`, and `rulesSample` to demonstrate rules were actually loaded and processed
- **Summary includes rule count**: `🚦 ALLOWED: Gate passed. 225 critical rules loaded and verified.`

### Added
- **CQRS rule**: Added Command Query Responsibility Segregation rule to iOS, Android, Backend, and Frontend platforms

## [5.5.48] - 2026-01-06

### Fixed
- **iOS SRP / God Class false positives**: Swift navigation handlers (clases pequeñas sin estado) ya no se reportan incorrectamente como `ios.solid.srp.god_class`.
  - `bodyLength` ahora se calcula por nodo con `bodyoffset/bodylength` sobre el contenido real del fichero (líneas), evitando métricas incoherentes.
  - Se alinea el criterio con cohesión: se omiten candidatos sin propiedades o con <2 métodos significativos (excluyendo `init*` y `deinit`).

### Added
- **AST rule**: `common.error.empty_catch` (CRITICAL) para detectar `catch` vacíos.

## [5.5.52] - 2026-01-08

### Fixed
- **MCP ai_gate_check**: `mandatory_rules` ya no puede ser `null`.
  - Si `analyzeContext()` falla o no detecta plataformas, se usa fallback con `PlatformDetectionService`.
  - Si aun así no se detecta nada, se fuerza fallback determinista: `backend`, `frontend`, `ios`, `android`.
  - Si la carga de reglas falla, se devuelve un objeto `mandatory_rules` con `criticalRules: []` y `error`.

## [5.5.45] - 2026-01-05

### Added
- **iOSModernPracticesRules**: Nuevo analizador para Swift 6.2 / iOS 17+ que detecta:
  - **Librerías prohibidas**: Alamofire, Swinject, Quick/Nimble, RxSwift, SwiftyJSON, Realm, etc.
  - **Gestores de dependencias prohibidos**: CocoaPods (Podfile), Carthage (Cartfile)
  - **Patrones GCD obsoletos**: DispatchQueue.main.async, DispatchGroup, DispatchSemaphore
  - **SwiftUI deprecado**: ObservableObject, @Published, @StateObject, @ObservedObject, NavigationView, AnyView
  - **APIs legacy**: NSLocalizedString, JSONSerialization, NSAttributedString
  - **Anti-patterns**: .onAppear { Task { } } en vez de .task, completion handlers

### Changed
- **rulesios.mdc**: Actualizado con directrices completas para iOS 26, Swift 6.2, Liquid Glass design

## [5.5.44] - 2026-01-05

### Fixed
- **gitflow-enforcer**: Lint hooks-system se ejecuta contra el `package.json` del repo (y muestra output en caso de fallo) para evitar falsos negativos en pre-push

## [5.5.43] - 2026-01-05

### Fixed
- **evidence-guard**: Auto-refresh no falla cuando el quality gate bloquea (mantiene el estado del gate en evidencia, pero no rompe el daemon por `exit code 1`)

## [5.5.42] - 2026-01-05

### Fixed
- **exports**: Exported `./package.json` so consumers can safely read the installed version via `require('pumuki-ast-hooks/package.json')` (Node 20+ compatible)

## [5.5.41] - 2026-01-05

### Fixed
- **God class detection**: Removed exclusions for AST library files - library now self-audits (practice what we preach)
- **God class detection**: Adjusted hybrid thresholds - files >1000 lines OR (>500 lines + complexity) now detected as CRITICAL
- **Shell script analysis**: Added detection for God scripts (>500 lines) in `.sh/.bash/.zsh` files
- **text-scanner.js**: Fixed empty catch block with debug logging for unreadable files
- **intelligent-audit.js**: Enhanced console output with detailed God class analysis and metrics

### Changed
- **BREAKING**: AST library files (`ast-backend.js`, `ast-core.js`, `ast-intelligence.js`) are no longer excluded from God class detection
- **God class baseline**: Now uses hybrid detection combining statistical baseline with absolute thresholds

### Added
- **Shell script analysis**: New rule `shell.antipattern.god_script` for massive shell files
- **Shell script analysis**: New rule `shell.maintainability.large_script` for large shell files (>200 lines)
- **Audit output**: Detailed violation analysis section showing God classes with file paths and metrics

### Results
- CRITICAL violations increased from 8 to 25 (+17) due to proper detection of massive library files
- God classes detected increased from 8 to 15 (+7)
- Shell scripts now analyzed: 2 God scripts detected (including `audit-orchestrator.sh` with 1188 lines)

## [5.5.40] - 2026-01-04

### Fixed
- **severity-evaluator.js**: Intelligent evaluation now respects base severity floor (CRITICAL/HIGH cannot be downgraded)
- **intelligent-audit.js**: Robust staged-files matching to avoid missing violations in evidence
- **.AI_EVIDENCE.json**: Now consistent with pre-commit hook blocking behavior

### Added
- **tests/integration/severity-floor.spec.js**: Regression tests for severity floor invariance

## [5.5.39] - 2026-01-04

### Added
- **InstallService**: `cleanupDuplicateRules()` method to remove .md duplicate files when .mdc exists
- **InstallService**: Cleanup controlled by `HOOK_CLEANUP_DUPLICATES` environment variable (disabled by default)
- **Tests**: Added test suite for cleanup duplicate rules functionality

### Fixed
- **InstallService**: Integrated cleanup step into installation flow (step 7.5/8)

## [5.5.38] - 2026-01-04

### Fixed
- **auto-context.mdc**: Evidence now generates always-on context file with actual rules content (gold + detected platforms)
- **auto-context.mdc**: Writes to both `.cursor/rules` and `.windsurf/rules` to support Cursor/Windsurf engines
- **auto-context.mdc**: Skips writing when running inside library repo to avoid dirtying tracked templates

### Added
- **intelligent-audit.js**: `buildAutoContextFrontmatter`, `buildAutoContextContent`, `writeAutoContextFiles` functions

## [5.5.37] - 2026-01-04

### Fixed
- **.AI_EVIDENCE.json**: Removed hardcoded `platforms.*.detected` values and compute platforms from staged files + violation categories
- **.AI_EVIDENCE.json**: Removed hardcoded `rules_read` flags and record actual loaded rules via `DynamicRulesLoader`

### Added
- **.AI_EVIDENCE.json**: `rules_read` now uses evidence entries array (`{file, verified, summary, path}`)
- **.AI_EVIDENCE.json**: Added `rules_read_flags` legacy field to preserve previous boolean-flag format

## [5.5.36] - 2026-01-04

### Fixed
- **check-version.js**: Fixed blocking issue when checking npm version (incorrect package name: `@pumuki/ast-intelligence-hooks` → `pumuki-ast-hooks`)
- **gitflow-release.js**: Fixed main sync to checkout main before pulling (avoids pulling main into develop)

### Added
- **gitflow-release.js**: New script for release cycle (develop → main)
- **npm run ast:release**: New command for automated release PRs with optional auto-merge and tagging

## [5.5.35] - 2026-01-04

### Added
- **Git Flow Release Cycle**: New `npm run ast:release` command for creating release PRs (develop → main)
- **Release Automation**: Automatic PR creation from develop to main with optional auto-merge
- **Git Tag Support**: Optional git tag creation with `--tag` flag

### Technical Details
- Separation of concerns: `ast:gitflow` for features, `ast:release` for releases
- Release cycle steps:
  1. Validates branch (must be develop)
  2. Syncs develop with origin
  3. Syncs main with origin
  4. Creates PR: develop → main
  5. Optionally auto-merges PR
  6. Optionally creates git tag
- Follows Git Flow best practices with clear separation between development and release workflows

## [5.5.34] - 2026-01-04

### Added
- **Git Flow Auto-Create Branch**: Automatically creates feature branch when on `develop`/`main` based on changes
- **Smart Branch Naming**: Generates branch names based on file types (feature/, fix/, chore/, docs/, etc.)

### Technical Details
- When running `npm run ast:gitflow` on protected branch, script now:
  - Analyzes changed files to infer branch type
  - Generates descriptive branch name with timestamp
  - Creates and switches to new feature branch automatically
  - Continues with complete Git Flow cycle
- Branch naming logic:
  - `fix/` - Files containing "fix", "bug", "error"
  - `test/` - Test files or "spec" files
  - `docs/` - Documentation files (README, CHANGELOG)
  - `refactor/` - Files containing "refactor", "cleanup"
  - `ci/` - CI/CD files (workflow, github actions)
  - `chore/` - Config files, package.json
  - `feature/` - Default for other changes

## [5.5.33] - 2026-01-04

### Fixed
- **iOS Security Analyzer**: Fixed false positive in `ios.security.missing_ssl_pinning` rule
- **iOS Security Analyzer**: Now recognizes SSL pinning implementations using `URLSessionDelegate` + `URLAuthenticationChallenge`
- **iOS Enterprise Analyzer**: Fixed same false positive in `ios.networking.missing_ssl_pinning` rule

### Technical Details
- Previous implementation only checked for `ServerTrustPolicy` or `pinning` keywords
- Files implementing SSL pinning with `URLSessionDelegate` were incorrectly flagged
- Added detection for `URLSessionDelegate` + `URLAuthenticationChallenge` pattern
- This fixes false positives on files like `SSLPinningDelegate.swift` that properly implement SSL pinning

## [5.5.32] - 2026-01-04

### Added
- **Git Flow Automation**: Complete Git Flow cycle automation with `npm run ast:gitflow`
- **Protected Branch Blocking**: Pre-commit hook now blocks commits on `main`, `master`, and `develop` branches
- **Pre-Push Hook**: Automatically installed hook that blocks push to protected branches and validates Git Flow naming conventions
- **Auto PR Creation**: Automatic Pull Request creation using GitHub CLI (`gh`)
- **Auto-Merge Support**: Optional automatic PR merge with `--auto-merge` flag
- **Branch Cleanup**: Automatic deletion of merged branches (both local and remote)
- **Branch Synchronization**: Automatic synchronization of `develop` and `main` branches with remote
- **Binary**: Added `ast-gitflow` binary to package.json for direct execution
- **NPM Script**: Added `ast:gitflow` npm script for easy access

### Changed
- **GitEnvironmentService**: Updated to automatically install pre-push hook during installation
- **Pre-Commit Hook**: Enhanced to validate current branch and block commits on protected branches
- **ConfigurationGeneratorService**: Added `ast:gitflow` script to generated package.json

### Technical Details
- Git Flow cycle includes: validate branch → commit changes → push to origin → create PR → optional merge → cleanup branches → sync branches
- Hooks enforce Git Flow best practices without requiring manual intervention
- All Git Flow operations can be performed via single command or individual steps
- Compatible with GitHub CLI for PR operations

## [5.5.25] - 2026-01-04

### Fixed
- **Evidence Guard Performance**: Removed slow full AST analysis (35 minutes) from evidence guard refresh loop
- **Evidence Guard**: Now uses fast `update-evidence.sh` (seconds) instead of `intelligent-audit.js`
- **Evidence Updates**: Evidence now refreshes every 3 minutes as intended, notifications work correctly

### Technical Details
- Evidence guard was calling `intelligent-audit.js` directly with full repository scan
- This caused 35-minute delays between evidence updates and notifications
- Solution: Use `update-evidence.sh` which performs incremental analysis on staged files only
- Refresh interval remains 180 seconds but now completes in seconds instead of minutes

## [5.5.24] - 2026-01-04

### Fixed
- **Notifications**: Replaced empty catch blocks with proper error handling via `MacNotificationSender`
- **Notifications**: macOS notifications now sent on every evidence update with proper error management
- **Intelligent Audit**: Uses `MacNotificationSender` service for consistent notification behavior

### Technical Details
- Previous implementation had empty catch blocks that silently failed
- `MacNotificationSender` provides terminal-notifier and osascript fallbacks with error logging
- Notifications show "AI Evidence has been refreshed automatically" or "AI Gate BLOCKED - X violations"

## [5.5.22] - 2026-01-04

### Fixed
- **Session Loader**: CRITICAL - Replaced self-referential wrapper in `scripts/hooks-system/bin/session-loader.sh` with complete implementation
- **Fork Bomb**: Root cause was wrapper calling `$REPO_ROOT/scripts/hooks-system/bin/session-loader.sh` (itself) causing infinite recursion
- **Consuming Projects**: Session loader now works correctly in all consuming projects without resource exhaustion

### Technical Details
- The wrapper pattern was architecturally flawed - it redirected to the same file path
- Solution: Full 108-line implementation directly in `scripts/hooks-system/bin/session-loader.sh`
- This ensures installing the library copies working code, not a broken wrapper

## [5.5.21] - 2026-01-04

### Fixed
- **Installer**: Fixed fork bomb caused by wrapper scripts being copied to incorrect location
- **Installer**: Excluded `session-loader.sh`, `cli.js`, `install.js` from bin/ copy to prevent recursive calls
- **FileSystemInstallerService**: Added exclusion logic for wrapper scripts that would cause infinite loops

### Technical Details
- Wrapper scripts in `/bin/` are now excluded when copying to `scripts/hooks-system/bin/`
- This prevents the wrapper from calling itself recursively during installation
- Session loader now works correctly without causing resource exhaustion

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
