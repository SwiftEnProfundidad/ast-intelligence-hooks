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
- **Issue**: Pre-commit displayed `@pumuki/ast-intelligence-hooks v5.3.1`.
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
