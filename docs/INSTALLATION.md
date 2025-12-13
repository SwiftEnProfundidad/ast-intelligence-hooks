# Installation Guide - ast-intelligence-hooks

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation via npm](#installation-via-npm)
3. [Installation via Git](#installation-via-git)
4. [Manual Installation](#manual-installation)
5. [Initial Configuration](#initial-configuration)
6. [Installation Verification](#installation-verification)
7. [Platform-specific Troubleshooting](#platform-specific-troubleshooting)

---

## Prerequisites

### Minimum Requirements

- **Node.js** ≥18.0.0
- **npm** ≥9.0.0 (or compatible yarn/pnpm)
- **Git** (for hooks)

### Optional Tools

- **SourceKitten** (iOS): For advanced Swift analysis
  ```bash
  brew install sourcekitten
  ```

- **Detekt** (Android): For advanced Kotlin analysis
  ```bash
  brew install detekt  # macOS
  # or download from https://github.com/detekt/detekt/releases
  ```

- **GitHub CLI** (gh): For Git Flow automation
  ```bash
  brew install gh  # macOS
  apt install gh   # Linux
  ```

### Verify Requirements

```bash
# Verify Node.js
node --version  # Must be >= 18.0.0

# Verify npm
npm --version   # Must be >= 9.0.0

# Verify Git
git --version
```

### Important: Git Repository Required

⚠️ **This library REQUIRES a Git repository to function properly.**

The installer will automatically check for Git initialization before proceeding. If you don't have Git initialized:

**What won't work without Git:**
- Pre-commit hooks cannot be installed
- Git Flow automation will not work
- Code analysis on commits is disabled

**Initialize Git first:**
```bash
git init
git add .
git commit -m "Initial commit"
```

The installer will detect if Git is missing and show a clear warning:
```
❌ CRITICAL: Git repository not found!
   This library REQUIRES a Git repository to function properly.
   Please run: git init
```

---

## Installation via npm

### Option 1: Local Installation (Recommended)

```bash
# Install as development dependency
npm install --save-dev @pumuki/ast-intelligence-hooks

# Configure hooks
npm run install-hooks
```

### Option 2: Global Installation

```bash
# Install globally
npm install -g @pumuki/ast-intelligence-hooks

# In each project, install hooks
cd /path/to/project
ast-install
```

**Note:** Global installation allows using CLI commands from any directory.

---

## Installation via Git

### Clone and Use Directly

```bash
# Clone the repository
git clone https://github.com/carlos/ast-intelligence-hooks.git
cd ast-intelligence-hooks

# Install dependencies
npm install

# Link globally (optional)
npm link

# In your project
cd /path/to/your-project
npm link @pumuki/ast-intelligence-hooks
npm run install-hooks
```

### As Git Submodule

```bash
# Add as submodule
git submodule add https://github.com/carlos/ast-intelligence-hooks.git hooks-system

# Install dependencies
cd hooks-system
npm install

# Link
npm link

# In the root project
npm link @pumuki/ast-intelligence-hooks
npm run install-hooks
```

---

## Manual Installation

### Step 1: Download Code

```bash
# Download tarball
curl -L https://github.com/carlos/ast-intelligence-hooks/archive/v5.3.0.tar.gz -o ast-intelligence-hooks.tar.gz
tar -xzf ast-intelligence-hooks.tar.gz
cd ast-intelligence-hooks-5.3.0
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build (if necessary)

```bash
# Type checking
npm run typecheck

# Tests
npm test
```

### Step 4: Configure in Your Project

```bash
# Copy to your project
cp -r . /path/to/your-project/hooks-system

# Or link
npm link
```

---

## Initial Configuration

### 1. Detect Platforms

The installer automatically detects your project's platforms:

```bash
npm run install-hooks
```

**Automatic detection:**
- **iOS**: Looks for `*.swift`, `*.xcodeproj`, `Podfile`
- **Android**: Looks for `*.kt`, `*.gradle.kts`, `AndroidManifest.xml`
- **Backend**: Looks for `nest-cli.json`, `tsconfig.json`, `**/controllers`
- **Frontend**: Looks for `next.config.js`, `app/**/page.tsx`

### 2. Configure Git Hooks

```bash
# Automatic installation
npm run install-hooks

# Or manually
ast-install
```

This will create:
- `.git/hooks/pre-commit`: Validation hook before commit
- `.git/hooks/post-commit`: Optional hook after commit

### 3. Configure Cursor AI (Optional)

If you use Cursor AI, configure the MCP Servers:

```bash
# Create configuration directory
mkdir -p .cursor

# Create configuration file
cat > .cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "ai-evidence-watcher": {
      "command": "node",
      "args": [
        "${workspaceFolder}/node_modules/@pumuki/ast-intelligence-hooks/infrastructure/mcp/evidence-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}"
      }
    },
    "ast-intelligence-automation": {
      "command": "node",
      "args": [
        "${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}",
        "AUTO_COMMIT_ENABLED": "true",
        "AUTO_PUSH_ENABLED": "true",
        "AUTO_PR_ENABLED": "false"
      }
    }
  }
}
EOF
```

**Note:** Adjust paths according to your installation method.

### 4. Environment Variables (Optional)

Create a `.env` file in the project root:

```bash
# .env
REPO_ROOT=/path/to/project
HOOK_GUARD_EVIDENCE_STALE_THRESHOLD=180
AUTO_COMMIT_ENABLED=true
AUTO_PUSH_ENABLED=true
AUTO_PR_ENABLED=false
```

### 5. Architecture Configuration (Optional)

**For all platforms:** The library automatically detects your architecture pattern without any configuration. You don't need to create `.ast-architecture.json` unless you want to manually override the automatic detection.

**Detected patterns by platform:**
- **iOS**: MVVM-C, MVVM, MVP, VIPER, TCA, Clean Swift, Feature-First + Clean + DDD
- **Android**: MVVM, MVI, MVP, Clean Architecture, Feature-First + Clean + DDD
- **Backend**: Clean Architecture, Onion, Layered, CQRS, Feature-First + Clean + DDD
- **Frontend**: Component-Based, Atomic Design, State Management, Feature-First + Clean + DDD

If you want to force a specific architecture pattern, create `.ast-architecture.json` in your project root:

```json
{
  "ios": {
    "architecturePattern": "MVVM-C",
    "allowedPatterns": ["MVVM-C", "MVVM"],
    "prohibitedPatterns": ["MVC"]
  },
  "android": {
    "architecturePattern": "FEATURE_FIRST_CLEAN_DDD",
    "allowedPatterns": ["FEATURE_FIRST_CLEAN_DDD", "MVVM"],
    "prohibitedPatterns": ["MVC"]
  },
  "backend": {
    "architecturePattern": "FEATURE_FIRST_CLEAN_DDD",
    "allowedPatterns": ["FEATURE_FIRST_CLEAN_DDD", "CLEAN_ARCHITECTURE"],
    "prohibitedPatterns": ["MVC"]
  },
  "frontend": {
    "architecturePattern": "FEATURE_FIRST_CLEAN_DDD",
    "allowedPatterns": ["FEATURE_FIRST_CLEAN_DDD", "COMPONENT_BASED"],
    "prohibitedPatterns": ["MVC"]
  }
}
```

**Note:** This is rarely needed since automatic detection works for all common patterns across all platforms.

### 6. Configure Exclusions

Create or edit `config/ast-exclusions.json`:

```json
{
  "patterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "*.test.ts",
    "*.spec.ts"
  ]
}
```

---

## Installation Verification

### 1. Verify Package Installation

```bash
# Verify it's installed
npm list @pumuki/ast-intelligence-hooks

# View version
ast-hooks --version
```

### 2. Verify Git Hooks

```bash
# Verify hooks exist
ls -la .git/hooks/pre-commit

# Verify content
cat .git/hooks/pre-commit
```

### 3. Run Test Analysis

```bash
# Full analysis
npm run audit

# Or using CLI
ast-hooks analyze
```

### 4. Verify Violations API

```bash
# List violations (should work even without violations)
npm run violations:list

# View summary
npm run violations:summary
```

### 5. Test Commit

```bash
# Create a test file
echo "// test" > test.ts
git add test.ts

# Try to commit (should run hooks)
git commit -m "test: verify hooks installation"
```

---

## Platform-specific Troubleshooting

### macOS

#### Problem: Permission Denied

```bash
# Give execution permissions
chmod +x node_modules/@pumuki/ast-intelligence-hooks/bin/*

# Or reinstall
npm uninstall @pumuki/ast-intelligence-hooks
npm install --save-dev @pumuki/ast-intelligence-hooks
```

#### Problem: SourceKitten Not Found

```bash
# Install SourceKitten
brew install sourcekitten

# Verify installation
sourcekitten version
```

#### Problem: Git Hooks Don't Run

```bash
# Verify permissions
ls -la .git/hooks/pre-commit

# Give execution permissions
chmod +x .git/hooks/pre-commit

# Verify hook is executable
test -x .git/hooks/pre-commit && echo "OK" || echo "NOT EXECUTABLE"
```

---

### Linux

#### Problem: Node.js Path Incorrect

```bash
# Verify Node.js is in PATH
which node

# If not, add to PATH
export PATH="/usr/local/bin:$PATH"
# Or install via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### Problem: Bash Scripts Don't Work

```bash
# Verify bash is installed
which bash

# If scripts have issues, install dependencies
sudo apt-get update
sudo apt-get install -y bash git nodejs npm
```

#### Problem: Notifications Don't Work

macOS notifications don't work on Linux. This is expected. The system will work normally, just without system notifications.

---

### Windows

#### Problem: Bash Scripts Don't Work

**Solution 1: Use WSL2 (Recommended)**

```bash
# Install WSL2
wsl --install

# Inside WSL2, follow Linux instructions
```

**Solution 2: Use Git Bash**

```bash
# Open Git Bash
# Follow installation instructions normally
# Bash scripts will work in Git Bash
```

#### Problem: Paths with Spaces

```bash
# Avoid paths with spaces in directory names
# If necessary, use quotes
cd "C:\Users\My Name\project"
```

#### Problem: Line Endings (CRLF vs LF)

```bash
# Configure Git to use LF
git config --global core.autocrlf input

# Or only for this project
git config core.autocrlf input
```

---

## Installation in Monorepos

### Typical Structure

```
monorepo/
├── packages/
│   ├── backend/
│   ├── frontend/
│   └── mobile/
├── package.json (root)
└── .git/
```

### Installation

```bash
# At monorepo root
npm install --save-dev @pumuki/ast-intelligence-hooks

# Configure hooks (will run on entire root)
npm run install-hooks

# System will automatically detect all platforms
```

### Per-Package Configuration

```bash
# In each package, you can have specific configurations
# packages/backend/config/ast-exclusions.json
{
  "patterns": [
    "node_modules/**",
    "dist/**"
  ]
}
```

---

## Updating to Latest Version

### Check Current Version

The library includes a version checker to detect if updates are available:

```bash
# Using npm script
npm run check-version

# Or using CLI directly
npx ast-check-version
```

**Example output:**
```
╔══════════════════════════════════════════════════════════════╗
║     AST Intelligence Hooks - Version Check                   ║
╚══════════════════════════════════════════════════════════════╝

Installed version:
  5.3.0 (npm)

Checking latest version on npm...
  Latest: 5.3.1

⚠️  UPDATE AVAILABLE

To update:
  1. Update package:
     npm install --save-dev @pumuki/ast-intelligence-hooks@latest

  2. Re-install hooks (to get latest features):
     npm run install-hooks

What's new in 5.3.1:
  Check CHANGELOG.md: https://github.com/...
```

### Update Process

When a new version is available:

#### Step 1: Update the Package

```bash
# Update to latest version
npm install --save-dev @pumuki/ast-intelligence-hooks@latest

# Or update to specific version
npm install --save-dev @pumuki/ast-intelligence-hooks@5.3.1
```

#### Step 2: Re-install Hooks

**⚠️ IMPORTANT:** After updating, you MUST re-run the installer to get the latest hooks and configurations:

```bash
npm run install-hooks
```

This ensures:
- ✅ Latest Git hooks are installed (with new features)
- ✅ Latest MCP server configurations are updated
- ✅ Latest system files are copied to `scripts/hooks-system/`
- ✅ Any new configuration options are applied

**What gets updated:**
- `.git/hooks/pre-commit` - Updated with latest hook logic
- `.cursor/mcp.json` - Updated MCP server configuration
- `scripts/hooks-system/` - Latest analysis engines and tools
- Configuration files - Latest default settings

#### Step 3: Verify Update

```bash
# Check version
npm run check-version

# Verify hooks work
git commit --allow-empty -m "test: verify hooks after update"
```

### Automatic Update Detection

You can check for updates periodically:

```bash
# Add to your workflow (weekly/monthly)
npm run check-version
```

### For Local Development Installations

If you're using a local installation (`file:../../path/to/library`):

```bash
# Update the library repository itself
cd path/to/ast-intelligence-hooks
git pull origin main
npm install

# Then update your project's installation
cd path/to/your-project
npm install  # Updates to latest from local path
npm run install-hooks  # Re-install with latest changes
```

### Version Compatibility

- **MAJOR versions** (5.x.x → 6.x.x): May include breaking changes
  - Check CHANGELOG.md before updating
  - May require configuration changes
  
- **MINOR versions** (5.3.x → 5.4.x): New features, backward compatible
  - Safe to update
  - May add new rules or features
  
- **PATCH versions** (5.3.0 → 5.3.1): Bug fixes, backward compatible
  - Always safe to update
  - Recommended to stay current

### Why Re-install Hooks After Update?

The `install-hooks` script:
1. Copies latest system files from the library
2. Updates Git hooks with latest validation logic
3. Updates MCP server configurations
4. Applies any new configuration options

Without re-running `install-hooks`, you'll have the new package version but old hooks/configurations.

### Manual Version Check

If you prefer manual checking:

```bash
# View installed version
npm list @pumuki/ast-intelligence-hooks

# View latest available version
npm view @pumuki/ast-intelligence-hooks version
```

---

## Uninstallation

### Uninstall Package

```bash
# Uninstall
npm uninstall @pumuki/ast-intelligence-hooks

# Remove hooks (optional)
rm .git/hooks/pre-commit
rm .git/hooks/post-commit
```

### Clean Configuration

```bash
# Remove configuration files (optional)
rm -rf config/ast-exclusions.json
rm -rf .cursor/mcp.json
rm -rf scripts/hooks-system
```

---

## Next Steps

After installation:

1. ✅ **Review configuration**: Check `config/ast-exclusions.json`
2. ✅ **Make test commit**: Verify hooks work
3. ✅ **Review documentation**: Read [USAGE.md](./USAGE.md) for examples
4. ✅ **Configure CI/CD**: Integrate into your pipeline (see [README.md](../README.md))

---

## References

- [README.md](../README.md) - Main documentation
- [USAGE.md](./USAGE.md) - Usage guide and examples
- [ARCHITECTURE_DETAILED.md](./ARCHITECTURE_DETAILED.md) - System architecture
- [MCP_SERVERS.md](./MCP_SERVERS.md) - MCP Servers configuration
- [DEPENDENCIES.md](./DEPENDENCIES.md) - Dependencies analysis

---

**Last updated**: 2025-01-13  
**Version**: 5.3.0
