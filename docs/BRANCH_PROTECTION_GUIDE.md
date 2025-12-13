# GitHub Branch Protection Rules - Configuration Guide

This guide explains how to configure branch protection rules for `ast-intelligence-hooks` to enable safe contributions from the community.

## Recommended Settings for `main` Branch

### Access Level: `Contribute`

For an open-source project where we want contributions, use these settings:

---

## Branch Protection Rules Configuration

### 1. **Require a pull request before merging**

✅ **Enable this**

**Required number of approvals:**
- **Set to: 1** (minimum)
- This ensures at least one maintainer reviews PRs

**Dismiss stale pull request approvals when new commits are pushed:**
- ✅ **Enable** (recommended)
- Ensures reviewers see the latest code

**Require review from Code Owners:**
- ⚠️ **Optional** (enable if you have CODEOWNERS file)
- Useful if you have specific maintainers for certain areas

---

### 2. **Require status checks to pass before merging**

✅ **Enable this**

**Required status checks:**
Add these checks (if you have GitHub Actions):

- `test` - All tests pass
- `lint` - Linting passes
- `typecheck` - TypeScript type checking

**Require branches to be up to date before merging:**
- ✅ **Enable** (recommended)
- Ensures PR is based on latest main branch

---

### 3. **Require conversation resolution before merging**

✅ **Enable this**
- Ensures all review comments are addressed

---

### 4. **Require signed commits**

⚠️ **Optional** (recommended for security)
- Requires contributors to sign their commits
- More secure but adds friction for new contributors

**Recommendation:** Enable for organizations, optional for personal projects

---

### 5. **Require linear history**

⚠️ **Optional**
- Prevents merge commits (enforces rebase)
- Cleaner history but can be frustrating for contributors

**Recommendation:** Keep **disabled** initially, enable later if needed

---

### 6. **Require deployment to succeed before merging**

❌ **Disable** (unless you have automated deployments)
- Only needed if you deploy automatically on merge

---

### 7. **Do not allow bypassing the above settings**

✅ **Enable this** (important!)
- Prevents admins from accidentally merging without reviews
- Applies rules to everyone including admins

**BUT:** You'll need to allow yourself as admin to bypass for emergency fixes
- Check: **"Restrict who can push to matching branches"**
- Add yourself as exception if needed

---

### 8. **Restrict who can push to matching branches**

⚠️ **Optional**

**If enabled:**
- Only listed people can push directly to main
- Others must use PRs (recommended for open source)

**Recommendation:** Enable this, but add yourself as exception for emergencies

---

### 9. **Allow force pushes**

❌ **Disable**
- Never allow force pushes to main
- Can rewrite history and break things

**Exception:** Only allow for branches matching patterns like `release/*` if needed

---

### 10. **Allow deletions**

❌ **Disable**
- Prevents accidental deletion of main branch

---

## Summary: Recommended Configuration

✅ **Enable:**
1. Require pull request before merging (1 approval minimum)
2. Dismiss stale approvals
3. Require status checks to pass
4. Require branches to be up to date
5. Require conversation resolution
6. Do not allow bypassing settings (with admin exception)
7. Restrict who can push (with admin exception)

⚠️ **Optional:**
- Require signed commits (for security)
- Require review from Code Owners (if CODEOWNERS exists)

❌ **Disable:**
- Require linear history (too strict for contributors)
- Allow force pushes
- Allow deletions

---

## Step-by-Step Setup in GitHub

1. Go to: `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/settings/branches`

2. Click **"Add rule"** or **"Add branch protection rule"**

3. **Branch name pattern:** `main`

4. **Configure:**

   - ✅ Check: "Require a pull request before merging"
     - Number of approvals: `1`
     - ✅ Check: "Dismiss stale pull request approvals when new commits are pushed"

   - ✅ Check: "Require status checks to pass before merging"
     - (Add status checks if you have CI/CD)
     - ✅ Check: "Require branches to be up to date before merging"

   - ✅ Check: "Require conversation resolution before merging"

   - ✅ Check: "Do not allow bypassing the above settings"
     - Add yourself as exception if needed

   - ✅ Check: "Restrict who can push to matching branches"
     - Add yourself as exception for emergency fixes

   - ❌ Uncheck: "Allow force pushes"

   - ❌ Uncheck: "Allow deletions"

5. Click **"Create"** or **"Save changes"**

---

## Additional Recommendations

### Create CODEOWNERS File

Create `.github/CODEOWNERS` to automatically request reviews from maintainers:

```
# Default owner
* @your-github-username

# Specific areas
/docs/ @your-github-username
/bin/ @your-github-username
/infrastructure/ @your-github-username
```

### Enable GitHub Actions (if using)

1. Go to: `Settings > Actions > General`
2. Enable Actions
3. Create workflows in `.github/workflows/`

Example workflow to add:
- `test.yml` - Run tests on PRs
- `lint.yml` - Run linting on PRs
- `typecheck.yml` - Run type checking on PRs

---

## For Contributors

With these settings, contributors will:

1. Fork the repository
2. Create a branch from `main`
3. Make changes
4. Push to their fork
5. Create a PR to `main`
6. Wait for at least 1 approval
7. Address any review comments
8. Maintainer merges the PR

---

## Emergency Access

If you need to bypass rules for emergencies:

1. Use GitHub's "Bypass branch protection" option (if enabled)
2. Or temporarily disable the rule, make the change, re-enable
3. Or use admin override (if "Do not allow bypassing" is disabled for admins)

---

**Last updated**: 2025-01-13

