# Changelog

All notable changes to `@pumuki/ast-intelligence-hooks` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

