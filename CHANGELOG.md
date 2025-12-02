# Changelog

All notable changes to `@pumuki/ast-intelligence-hooks` will be documented in this file.

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

