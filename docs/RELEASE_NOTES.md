# Release Notes - v6.3.3

**Release Date**: January 28, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.3.x

---

## ✅ Fixes

- **iOS false positives**: `ios.weak_self` ahora detecta capture lists con `weak/unowned self`.
- **Task cancellation**: `ios.concurrency.task_cancellation` reconoce `Task.isCancelled` y `Task.checkCancellation` (incl. `try?`).
- **BDD triad**: `workflow.triad.tests_without_implementation` respeta la cabecera `Implementation:` en `.feature`.
- **Gate evidence**: `ai_gate` no bloquea por violaciones solo MEDIUM/LOW en la evidencia.
- **Protocol Q2**: la respuesta incluye referencia a commits recientes.
- **Backend config**: `backend.config.missing_validation` se aplica solo a apps backend reales.
- **WorkflowRules**: `AUDIT_LIBRARY_SELF` se valida con `env.getBool`.

---

# Release Notes - v6.0.16

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **Exclude patterns**: `excludePatterns` now prevent unintended global exclusions in intelligent-audit.

---

# Release Notes - v6.0.15

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **Exclusions-aware gate**: `ast-exclusions.json` filters violations for gate/evidence in intelligent-audit.
- **iOS DIP generics**: `any` generic constraint names now match normalized bounds.
- **iOS AST exclusions**: rule exclusions are applied per file in the iOS analyzer.

---

# Release Notes - v6.0.14

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **iOS DIP detector**: `UseCase`/`Repository` protocol-like types are never treated as concrete.

---

# Release Notes - v6.0.13

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **iOS DIP detector**: protocol-like types are detected even with trailing punctuation (e.g. `LoginUseCase,`).

---

# Release Notes - v6.0.12

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **iOS DIP detector**: protocol-like types are detected even with composition markers (e.g. `LoginUseCase & Sendable`).

---

# Release Notes - v6.0.11

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **iOS DIP detector**: protocol-like types are detected even with generics (e.g. `RegisterUseCase<Auth>`).

---

# Release Notes - v6.0.10

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **iOS DIP detector**: protocol-like types are detected even with module prefixes or optional markers (e.g. `Domain.LoginUseCase?`).

---

# Release Notes - v6.0.9

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **iOS DIP detector**: protocol-named types like `LoginUseCase` are treated as abstract unless they are `*Impl`.

---

# Release Notes - v6.0.8

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **iOS DIP detector**: protocol-constrained generics (e.g. `<Client: APIClientProtocol>`) are treated as abstract dependencies.

---

# Release Notes - v6.0.7

**Release Date**: January 13, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 6.0.x

---

## ✅ Fixes

- **God Class detection (backend)**: baseline-first by default; optional hard cap via env; detector always runs (with or without baseline).

---

# Release Notes - v5.5.25

**Release Date**: January 4, 2026
**Type**: Performance Patch Release
**Compatibility**: Fully backward compatible with 5.5.x

---

## ⚡ Performance Fix

### Problem

The evidence guard daemon was running full AST analysis on every refresh (every 3 minutes), causing:

- **35-minute delays** between evidence updates
- **Notifications not appearing** until analysis completed
- **High CPU usage** during full repository scans

### Root Cause

Evidence guard was calling `intelligent-audit.js` directly:

```javascript
const astScript = 'node_modules/pumuki-ast-hooks/scripts/hooks-system/infrastructure/orchestration/intelligent-audit.js';
spawn('node', [astScript], { stdio: 'ignore' });
```

This script performs a full repository scan (1687 files, 11356 violations) which takes 35 minutes.

### Solution

Use `update-evidence.sh` which performs incremental analysis on staged files only:

```javascript
spawn('bash', [this.updateScript, '--auto'], { stdio: 'ignore' });
```

### Impact

- **Before**: Evidence refresh takes 35 minutes, notifications delayed
- **After**: Evidence refresh takes seconds, notifications appear immediately
- Refresh interval remains 180 seconds but now completes in seconds instead of minutes

---

## 📦 Installation / Upgrade
```bash
npm install --save-dev pumuki-ast-hooks@5.5.25
npm run install-hooks
npm run ast:guard:restart
```

---

# Release Notes - v5.5.52

**Release Date**: January 8, 2026
**Type**: Patch Release
**Compatibility**: Fully backward compatible with 5.5.x

---

## 🚦 MCP AI Gate: mandatory_rules always present

### Problem
`ai_gate_check` could return `mandatory_rules: null` when context/platform detection failed, forcing manual rule loading.

### Solution
`ai_gate_check` now guarantees `mandatory_rules` is always returned:
- Fallback to `PlatformDetectionService` when `analyzeContext()` fails or returns no platforms.
- Deterministic fallback to `backend`, `frontend`, `ios`, `android` when detection is inconclusive.
- If rule loading fails, returns a non-null object with `criticalRules: []` and an `error` field.

### Impact
- The AI can reliably read and apply rules on every iteration.
- Removes a class of regressions caused by missing rule payload in MCP responses.

---

## 📦 Installation / Upgrade

```bash
npm install --save-dev pumuki-ast-hooks@5.5.52
npm run install-hooks
```

---

# Release Notes - v5.5.24

**Release Date**: January 4, 2026
**Type**: Patch Release
**Compatibility**: Fully backward compatible with 5.5.x

---

## 🔔 Notifications Fix

### Problem

macOS notifications had empty catch blocks that silently failed:

```javascript
try {
  execSync('osascript ...');
} catch (e) {
}
```

### Solution

Use `MacNotificationSender` service with proper error handling:

```javascript
const MacNotificationSender = require('../../application/services/notification/MacNotificationSender');
const notificationSender = new MacNotificationSender(null);
notificationSender.send({ message: notifMsg, level });
```

### Impact

- Notifications now appear on every evidence update
- Proper error logging when notifications fail
- Consistent behavior across all notification types

---

## 📦 Installation / Upgrade
```bash
npm install --save-dev pumuki-ast-hooks@5.5.24
npm run install-hooks
```

---

# Release Notes - v5.5.22

**Release Date**: January 4, 2026  
**Type**: Critical Patch Release  
**Compatibility**: Fully backward compatible with 5.5.x

---

## 🔴 CRITICAL Fix

### Root Cause Analysis

The session-loader fork bomb was caused by an **architectural flaw** in the wrapper pattern:

```
scripts/hooks-system/bin/session-loader.sh (WRAPPER)
  → calls: bash "$REPO_ROOT/scripts/hooks-system/bin/session-loader.sh"
    → which is THE SAME FILE
      → INFINITE RECURSION → FORK BOMB
```

### Solution

Replaced the 6-line self-referential wrapper with the **complete 108-line implementation** directly in `scripts/hooks-system/bin/session-loader.sh`.

### Impact

- **Before**: Any project installing the library would get the broken wrapper, causing fork bombs on IDE startup
- **After**: Projects get a fully working session-loader that displays context correctly

---

## 📦 Installation / Upgrade
```bash
npm install --save-dev pumuki-ast-hooks@5.5.22
npm run install-hooks
```

---

# Release Notes - v5.5.21

**Release Date**: January 4, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 5.5.x

---

## 🎯 Overview

This release fixes a critical fork bomb issue in the installer caused by wrapper scripts being copied to incorrect locations, preventing recursive calls that would exhaust system resources.

---

## 🐛 Bug Fixes

### Fixed: Fork bomb in session-loader
- **Issue**: Wrapper scripts (`session-loader.sh`, `cli.js`, `install.js`) were copied from `/bin/` to `scripts/hooks-system/bin/`, causing them to call themselves recursively
- **Resolution**: Modified `FileSystemInstallerService` to exclude wrapper scripts when copying the `bin/` directory
- **Impact**: Session loader now works correctly without causing fork resource exhaustion or infinite loops

### Technical Details
- Wrapper scripts in the library's `/bin/` directory are now excluded during installation
- This prevents the wrapper from being copied to the location where it would call itself
- Installation process is now safe and doesn't cause resource exhaustion

---

## 📦 Installation / Upgrade
```bash
npm install --save-dev pumuki-ast-hooks@5.5.21
npm run install-hooks
```

---

# Release Notes - v5.5.20

**Release Date**: January 4, 2026  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 5.5.x

---

## 🎯 Overview

This release restores the comprehensive session context report on IDE startup and fixes critical bugs in the session loader, including infinite loop prevention and correct timestamp parsing for evidence freshness checks.

---

## 🐛 Bug Fixes

### Fixed: Session loader infinite loop on macOS
- **Issue**: `exec "$SHELL"` at the end of session-loader.sh caused fork resource exhaustion
- **Resolution**: Removed shell exec, script now completes without forking
- **Impact**: IDE startup no longer hangs or creates zombie processes

### Fixed: Evidence age calculation showing incorrect values
- **Issue**: ISO 8601 timestamps with timezone offsets (e.g., `2026-01-04T08:12:13.372+01:00`) were parsed incorrectly, showing millions of seconds
- **Resolution**: Added Python-based timestamp parsing using `datetime.fromisoformat()` for reliable timezone conversion
- **Impact**: Evidence freshness check now displays correct age in seconds

### Fixed: Session loader showing minimal context
- **Issue**: Session loader was simplified to basic status only, losing branch info, commits, violations summary
- **Resolution**: Restored full context report with branch, recent commits, session context, violations summary, and evidence freshness
- **Impact**: Users now see complete project context on IDE startup

---

## 🔧 Improvements

### Enhanced Session Loader Output
- Displays current branch with color coding
- Shows last 3 commits with one-line format
- Reads session context from `.ai_evidence.json`
- Shows violations summary from `ast-summary.json` with severity breakdown (CRITICAL/HIGH/MEDIUM/LOW)
- Displays evidence freshness with correct age calculation
- Added quick commands section for common actions

### Technical Details
- Evidence timestamps with timezone offsets now correctly parsed
- Session loader no longer forks shell process
- All session information displayed in a single, organized banner
- Violations summary reads from JSON report for accurate counts

---

## 📦 Installation / Upgrade
```bash
npm install --save-dev pumuki-ast-hooks@5.5.20
npm run install-hooks
```

---

# Release Notes - v5.3.15

**Release Date**: December 30, 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 5.3.x

---

## 🎯 Overview

This release fixes MCP configuration in Windsurf to avoid collisions when multiple projects are open in parallel. It now uses a single global entry with an absolute path to the repo’s local binary and removes the legacy hardcode in the CLI configurator.

---

## 🐛 Bug Fixes

### Fixed: MCP collision when opening multiple repos in Windsurf
- **Issue**: MCP was generated per workspace with a fixed legacy ID, causing duplicates/cancellations of `ai_gate_check`.
- **Resolution**: Configuration only in `~/.codeium/windsurf/mcp_config.json` with fixed ID `ast-intelligence-automation` pointing to the local binary; legacy hardcode removed in `pumuki-mcp.js`.
- **Impact**: MCP no longer collides when working with multiple repos simultaneously.

---

## 📚 Documentation
- New guide: `docs/MCP_CONFIGURATION.md` explaining global configuration and `ai_gate_check` validation in Windsurf.

---

## 📦 Installation / Upgrade
```bash
npm install --save-dev pumuki-ast-hooks@5.3.15
npm run install-hooks
```

---

# Release Notes - v5.3.20

**Release Date**: December 31, 2025  
**Type**: Patch Release (compatible with 5.3.x)
**Compatibility**: Fully backward compatible with 5.3.x

---

## 🎯 Overview
- Removed runtime side-effects in the library: Express/CORS stripped from entry point; `dotenv.config()` removed from config.
- Fixed syntax in `ast-backend.js` (test block) to ensure lint/parse correctness.
- Published npm `pumuki-ast-hooks@5.3.20` (tag `latest`).

---

## 🐛 Bug Fixes

### Fixed: Runtime side-effects
- **Issue**: Library had runtime side-effects due to Express/CORS and `dotenv.config()`.
- **Resolution**: Removed Express/CORS from entry point and `dotenv.config()` from config.
- **Impact**: Library no longer has runtime side-effects.

### Fixed: Syntax in `ast-backend.js`
- **Issue**: Syntax error in `ast-backend.js` (test block) caused lint/parse issues.
- **Resolution**: Fixed syntax in `ast-backend.js` (test block).
- **Impact**: `ast-backend.js` now lint/parse correct.

---

## 📚 Documentation
- CHANGELOG updated with 5.3.20.
- Installation notes reviewed for safe npm consumption.

---

# Release Notes - v5.3.9

**Release Date**: December 29, 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 5.3.x

---

## 🎯 Overview

Version 5.3.9 refines installer version resolution and removes silent `catch` blocks. The installation wizard now shows the correct version even when executed from consuming projects.

---

## 🐛 Bug Fixes

### Fixed: Wizard showing `vunknown`
- **Issue**: The installer showed `vunknown` when it couldn’t find `package.json` in some environments.
- **Resolution**: Robust search for `package.json` across multiple paths (repo and `node_modules`) with warnings instead of silent catches.
- **Impact**: Wizard and pre-commit now show the correct version.

### Fixed: Hooks showing old version
- **Issue**: Pre-commit displayed `pumuki-ast-hooks v5.3.1`.
- **Resolution**: `GitEnvironmentService` receives the resolved version and uses it in the hook.
- **Impact**: Hook reflects the actual installed version (`pumuki-ast-hooks`).

---

## 🔧 Improvements
- Warning logs when `package.json` cannot be read.
- Version resolution tolerant to both local repos and npm packages.

---

# Release Notes - v5.3.4

**Release Date**: December 29, 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible with 5.3.x

---

## 🎯 Overview

Version 5.3.4 addresses critical bugs in the audit orchestrator that were preventing correct analysis of repository files. This patch ensures that audit options work as intended and provide accurate violation reports.

---

## 🐛 Bug Fixes

### Fixed: Audit Option 2 Analyzing Only Staged Files

**Issue**: Option 2 (Strict REPO+STAGING) was incorrectly configured with `STAGING_ONLY_MODE=1`, causing it to analyze only staged files instead of the entire repository.

**Impact**: Users running full repository audits were only seeing violations from staged files, missing thousands of potential issues in the codebase.

**Resolution**:
- Added `unset STAGING_ONLY_MODE` in `full_audit_strict_repo_and_staging()` function
- Added `export AUDIT_LIBRARY=true` to include library files in analysis
- Fixed environment variable propagation to Node.js subprocess

**Files Changed**:
- `scripts/hooks-system/infrastructure/shell/orchestrators/audit-orchestrator.sh`

**Verification**:
```bash
# Before: Only staged files analyzed
npm run audit  # Option 2 → ~376 files, ~546 violations

# After: Full repository analyzed
npm run audit  # Option 2 → All files, correct violation count
```

---

### Fixed: AUDIT_LIBRARY Not Passed to Node.js Process

**Issue**: The `AUDIT_LIBRARY` environment variable was set in the shell but not exported to the Node.js subprocess executing `ast-intelligence.js`.

**Impact**: When auditing the library itself, files in `scripts/hooks-system/` were being incorrectly filtered out.

**Resolution**:
- Modified `run_ast_intelligence()` to explicitly export `AUDIT_LIBRARY` when spawning Node.js process
- Ensured variable is available in both execution paths (with and without `NODE_PATH`)

**Files Changed**:
- `scripts/hooks-system/infrastructure/shell/orchestrators/audit-orchestrator.sh` (lines 1014, 1016)

---

### Improved: Staged File Path Matching

**Issue**: Violations in staged files were not being correctly matched due to differences between absolute and relative path formats.

**Impact**: Staged file summary showed incorrect violation counts.

**Resolution**:
- Enhanced `compute_staged_summary()` to use both relative and absolute paths for matching
- Implemented more robust path comparison using `endswith()` logic
- Added `staged-rel.txt` for relative path storage

**Files Changed**:
- `scripts/hooks-system/infrastructure/shell/orchestrators/audit-orchestrator.sh` (lines 337-370)

---

## 🔧 Improvements (5.3.4)

### Enhanced Error Messages

- Improved informative messages when no AST-compatible files are staged (Option 3)
- Better debug output for troubleshooting audit issues

### Code Quality

- Cleaned up debug console.log statements
- Improved code organization in audit orchestrator

---

## 📦 Installation

### New Installation

```bash
npm install --save-dev pumuki-ast-hooks@5.3.9
npm run install-hooks
```

### Upgrade from 5.3.3

```bash
npm install --save-dev pumuki-ast-hooks@5.3.4
npm run install-hooks  # Recommended to update orchestrator scripts
```

See [Migration Guide](./MIGRATION_5.3.4.md) for detailed upgrade instructions.

---

## ✅ Verification

After upgrading, verify the fixes:

### Test 1: Full Repository Audit (Option 2)

```bash
npm run audit
# Select option 2: "Strict REPO+STAGING"
```

**Expected**: Should analyze ALL files in repository, not just staged files.

### Test 2: Staging Only Audit (Option 3)

```bash
git add src/some-file.ts
npm run audit
# Select option 3: "Strict STAGING only"
```

**Expected**: Should analyze only staged files and show correct violations.

---

## 🔄 Breaking Changes

**None**. This is a fully backward-compatible patch release.

---

## 📚 Documentation

- [CHANGELOG](../CHANGELOG.md)
- [Migration Guide](./MIGRATION_5.3.4.md)
- [Installation Guide](./INSTALLATION.md)
- [API Reference](./API_REFERENCE.md)

---

## 🙏 Acknowledgments

Thanks to all users who reported issues and helped identify these bugs.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/discussions)
- **Email**: freelancemerlos@gmail.com

---

## 🚀 What's Next?

Stay tuned for upcoming features in future releases:
- Enhanced violation reporting
- Performance optimizations
- Additional platform support

---

**Full Changelog**: [5.3.3...5.3.9](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/compare/v5.3.3...v5.3.9)
