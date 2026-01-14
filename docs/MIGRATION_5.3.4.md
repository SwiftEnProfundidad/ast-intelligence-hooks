# Migration Guide: 5.3.3 → 5.3.4

## Overview

Version 5.3.4 is a **patch release** that fixes critical bugs in the audit orchestrator. This release is **fully backward compatible** and requires no code changes.

## What's Fixed

### 1. Audit Option 2 (Strict REPO+STAGING)

**Problem**: Option 2 was incorrectly analyzing only staged files instead of the entire repository.

**Fix**: 
- Added `unset STAGING_ONLY_MODE` to ensure full repository scan
- Added `export AUDIT_LIBRARY=true` to include library files in analysis
- Fixed environment variable propagation to Node.js process

**Impact**: You'll now see the correct number of violations for your entire repository.

### 2. Staged File Detection

**Problem**: Violations in staged files were not being correctly matched due to path format differences.

**Fix**: Enhanced `compute_staged_summary` to use relative paths for more robust matching.

**Impact**: Better accuracy in detecting violations in staged files.

## Upgrade Instructions

### Step 1: Update the Package

```bash
npm install pumuki-ast-hooks@5.3.4
```

### Step 2: Reinstall Hooks (Recommended)

```bash
npm run install-hooks
```

This ensures you have the latest orchestrator scripts.

### Step 3: Verify Installation

```bash
npx ast-check-version
```

Expected output:
```
Installed version: 5.3.4 (npm)
Latest: 5.3.4
✅ You're up to date!
```

## Testing the Update

### Test Option 2 (Full Repository Audit)

```bash
# Run the audit menu
npm run audit

# Select option 2: "Strict REPO+STAGING"
```

**Expected behavior**:
- Should scan ALL files in your repository (not just staged)
- Should report significantly more violations than before (if you had issues with 5.3.3)
- Should include violations from library files if `AUDIT_LIBRARY=true`

### Test Option 3 (Staging Only)

```bash
# Stage some files
git add src/some-file.ts

# Run audit and select option 3
npm run audit
```

**Expected behavior**:
- Should only analyze staged files
- Should show informative message if no AST-compatible files are staged
- Should correctly detect violations in staged files

## Breaking Changes

**None**. This is a patch release with full backward compatibility.

## Known Issues

None reported for 5.3.4.

## Rollback Instructions

If you need to rollback to 5.3.3:

```bash
npm install pumuki-ast-hooks@5.3.3
npm run install-hooks
```

## Support

- **Issues**: https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/issues
- **Discussions**: https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/discussions
- **Email**: freelancemerlos@gmail.com

## Next Steps

After upgrading, we recommend:

1. Run a full audit on your repository (Option 2)
2. Review and fix any newly detected violations
3. Commit your fixes with proper conventional commit messages

---

**Thank you for using pumuki-ast-hooks!** 🚀
