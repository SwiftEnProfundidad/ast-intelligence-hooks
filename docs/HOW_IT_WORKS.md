# How It Works - Step by Step Guide

## Table of Contents

1. [Overview](#overview)
2. [Installation Process](#installation-process)
3. [What Gets Installed](#what-gets-installed)
4. [How Each Component Works](#how-each-component-works)
5. [Execution Flow](#execution-flow)
6. [Real-World Examples](#real-world-examples)
7. [Troubleshooting](#troubleshooting)

---

## Overview

`ast-intelligence-hooks` is a comprehensive code quality system that integrates seamlessly into your development workflow. It combines **Git hooks**, **MCP servers**, and **AST analysis** to ensure code quality and automate development tasks.

### Core Components

1. **Git Hook (pre-commit)**: Automatically analyzes code before commits
2. **MCP Server (ast-intelligence-automation)**: Provides AI tools and resources for Cursor
3. **AST Analysis Engine**: Scans code for violations of Clean Architecture, SOLID, and coding standards

---

## Installation Process

### Step 0: Git Repository Check ⚠️

**What happens:**

- The installer checks if you're in a Git repository (automatically at Step 0)
- Verifies that `.git` directory exists
- Tests that `git rev-parse --show-toplevel` works correctly

**Why it matters:**

- **Required for**: Git hooks, Git Flow automation, commit-time analysis
- **Without Git**: The library cannot function properly

**Automatic Detection:**
The installer now automatically detects if Git is missing and shows a clear warning before proceeding. This prevents incomplete installations.

**If Git is missing:**

```
❌ CRITICAL: Git repository not found!
   This library REQUIRES a Git repository to function properly.
   Please run: git init

⚠️  Without Git:
   • Pre-commit hooks cannot be installed
   • Git Flow automation will not work
   • Code analysis on commits is disabled
```

**Action required:**

```bash
git init
git add .
git commit -m "Initial commit"
```

---

### Step 1: Platform Detection

**What happens:**

- Scans project files for platform indicators
- Detects iOS (`.swift`, `.xcodeproj`, `Podfile`)
- Detects Android (`.kt`, `.gradle.kts`, `AndroidManifest.xml`)
- Detects Backend (`nest-cli.json`, `tsconfig.json`, `controllers/`)
- Detects Frontend (`next.config.js`, `app/**/page.tsx`)

**Output:**

```
✓ Detected: backend, frontend
```

**Impact:**

- Only relevant rules are loaded for detected platforms
- Platform-specific analysis is enabled

---

### Step 2: ESLint Configuration

**What happens:**

- Installs ESLint configs for detected platforms
- Creates `.eslintrc.js` files with appropriate rules
- Configures TypeScript/JavaScript linting

**Files created:**

- `.eslintrc.js` (project root)
- Platform-specific configs in `scripts/hooks-system/`

---

### Step 3: Directory Structure

**What happens:**

- Creates `scripts/hooks-system/` directory structure
- Sets up folders for: `domain/`, `application/`, `infrastructure/`, `presentation/`

**Structure created:**

```
scripts/hooks-system/
├── domain/
├── application/
├── infrastructure/
│   ├── ast/
│   ├── mcp/
│   └── guards/
└── presentation/
```

---

### Step 4: Copy System Files

**What happens:**

- Copies all AST analysis engines from the library
- Installs MCP server scripts
- Copies rule definitions and validators

**Files copied:**

- `infrastructure/ast/ast-intelligence.js` - Main analysis engine
- `infrastructure/mcp/ast-intelligence-automation.js` - MCP server
- Platform-specific analyzers (iOS, Android, Backend, Frontend)

---

### Step 5: Project Configuration

**What happens:**

- Creates `.ast-intelligence.config.js` in project root
- Configures platform settings
- Sets up ignore patterns

**Configuration file:**

```javascript
module.exports = {
  platforms: ['backend', 'frontend'],
  ignore: ['node_modules/', 'dist/', '.git/'],
  // ... more config
};
```

---

### Step 6: IDE Configuration and MCP Servers

**What happens:**

- Creates `.cursor/` directory (or `.windsurf/`, `.vscode/`, etc. for other agentic IDEs)
- Creates `.cursor/mcp.json` with MCP server configuration
- Creates `.cursor/settings.json` with IDE-specific settings

**Note on Rules:** The library automatically searches for agentic IDE rules (`.mdc` files) in:

- Project-level: `.cursor/rules/`, `.windsurf/rules/`, `.vscode/rules/` (highest priority)
- Global locations: `~/.cursor/rules/`, `~/Library/Application Support/Cursor/User/rules/`
- Other IDE project caches

Rules are used by `ai-start` when generating `.ai_evidence.json` to provide context to AI assistants. See [Usage Guide - Adding Your Own IDE Rules](../docs/USAGE.md#adding-your-own-ide-rules-mdc-files) for details.

**MCP Configuration (`.cursor/mcp.json`):**

```json
{
  "mcpServers": {
    "ast-intelligence-automation": {
      "command": "/opt/homebrew/opt/node@20/bin/node",
      "args": [
        "${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation.js"
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
```

**Token economy (contract):**

- The MCP tools expose a cost-aware guidance rule to agents.
- `ai_gate_check` returns it under `mandatory_rules.framework_rules`.
- `pre_flight_check` returns it under `framework_rules`.
- Agents should batch checks, avoid redundant scans, reuse cached context where safe, and ask the user for missing info to reduce token cost.

**What this enables:**

- Cursor AI can read project state (evidence status, gitflow state, context)
- Cursor AI can execute tools (gate checks, gitflow automation, validation)

---

### Step 7: Git Hooks Installation

**What happens:**

- Creates `.git/hooks/pre-commit` script
- Makes it executable (`chmod +x`)
- Hook analyzes staged files before commit

**Pre-commit hook script:**

```bash
#!/bin/bash
# AST Intelligence Hooks - Pre-commit
# Auto-generated by pumuki-ast-hooks v5.3.1

# Check for bypass
if [[ -n "${GIT_BYPASS_HOOK}" ]]; then
  echo "⚠️  Bypassing AST hooks (GIT_BYPASS_HOOK=1)"
  exit 0
fi

# Change to project root
cd "$(git rev-parse --show-toplevel)" || exit 1

# Analyze staged files
# ... (analysis logic)
```

---

## What Gets Installed

### ✅ Files Created

1. **`.cursor/mcp.json`** - MCP server configuration
2. **`.cursor/settings.json`** - Cursor IDE settings
3. **`.git/hooks/pre-commit`** - Git pre-commit hook
4. **`scripts/hooks-system/`** - Complete system directory with all analyzers
5. **`.ast-intelligence.config.js`** - Project configuration
6. **`.eslintrc.js`** - ESLint configuration

### ✅ NPM Scripts Added

Check your `package.json` for these scripts:

```json
{
  "scripts": {
    "audit": "ast-hooks ast",
    "violations:list": "ast-hooks violations list",
    "violations:summary": "ast-hooks violations summary",
    "violations:top": "ast-hooks violations top"
  }
}
```

---

## How Each Component Works

### 1. Git Hook (pre-commit) - ⚡ **ACTIVE**

**Status:** Always ready, executes automatically

**When it runs:**

- Every time you execute `git commit`
- Only analyzes staged files (`.ts`, `.tsx`, `.js`, `.jsx`, `.swift`, `.kt`)

**What it does:**

1. Checks for bypass flag (`GIT_BYPASS_HOOK=1`)
2. Changes to project root directory
3. Filters staged files by extension
4. If no relevant files → allows commit
5. If files found → runs AST analysis
6. Checks for CRITICAL or HIGH violations
7. If violations found → **BLOCKS commit** with detailed report
8. If no violations → allows commit to proceed

**Example output (blocked):**

```
🚨 CRITICAL: backend.service.singleton_pattern
   File: src/users/users.service.ts:12
   Rule: No Singleton pattern
   Message: Singleton pattern detected. Use Dependency Injection.

❌ Commit blocked: Critical violations detected
```

**Example output (allowed):**

```
✅ No violations detected
[commit proceeds normally]
```

**Important:**

- Only CRITICAL and HIGH violations block commits
- MEDIUM and LOW violations are reported but don't block
- You can bypass temporarily with `GIT_BYPASS_HOOK=1 git commit`

---

### 2. MCP Server (ast-intelligence-automation) - 👁️ **PASSIVE**

**Status:** Running, waiting for Cursor AI to use it

**Important:** The MCP server does **NOT** do anything automatically. It's a "toolbox" that Cursor AI can use when needed.

#### 📚 Resources (Cursor can READ these)

**`evidence://status`**

- Status of `.ai_evidence.json` file
- Returns: `fresh`, `stale`, `missing`, or `error`
- Age in seconds, timestamp, current branch
- Cursor uses this to know if project context is up-to-date

**`gitflow://state`**

- Current Git Flow workflow state
- Returns: branch name, last commit, PR URL, status
- Cursor uses this to understand Git state

**`context://active`**

- Automatically detected project context
- Returns: platforms detected, files changed, confidence level
- Cursor uses this to understand what you're working on

#### 🛠️ Tools (Cursor can EXECUTE these)

**`check_evidence_status`**

- Checks if `.ai_evidence.json` is stale
- Cursor calls this to verify evidence freshness

**`ai_gate_check` ⚠️ MANDATORY**

- **Must be called at START of EVERY AI response**
- Checks if there are blocking violations
- Returns: `ALLOWED` or `BLOCKED`
- If `BLOCKED`: AI should NOT proceed with task

**`auto_complete_gitflow`**

- Automates complete Git Flow cycle
- Commit → Push → Create PR → Merge (optional)
- Cursor can call this when you ask for Git Flow automation

**`sync_branches`**

- Synchronizes `develop` and `main` branches
- Fetches, pulls, updates local branches
- Cursor can call this to ensure branches are in sync

**`validate_and_fix`**

- Validates common problems
- Fixes automatically when possible
- Cursor can call this to check/fix issues

**`auto_execute_ai_start`**

- Analyzes context and executes `ai-start` if needed
- Detects if code files were modified (≥30% confidence)
- Updates `.ai_evidence.json` automatically
- Cursor can call this to update evidence when changes are detected

---

### 3. AST Analysis Engine

**Status:** Executed on-demand (by hooks or manual commands)

**What it does:**

- Parses code files into Abstract Syntax Trees (AST)
- Applies rule checkers for each platform
- Detects violations of:
  - Clean Architecture principles
  - SOLID principles
  - Platform-specific best practices
- Calculates severity (CRITICAL, HIGH, MEDIUM, LOW)
- Generates detailed violation reports

**Rule categories:**

- **Architecture violations**: Dependency direction, layer violations
- **SOLID violations**: Singleton, God classes, tight coupling
- **Platform-specific**: iOS patterns, Android patterns, NestJS patterns, React patterns

#### Architecture Detection by Platform

**All Platforms - Automatic Pattern Detection:**

The library automatically detects architecture patterns for **all platforms** (iOS, Android, Backend, Frontend) without any configuration needed.

**iOS - Detected Patterns:**

- Feature-First + Clean + DDD
- MVVM-C (MVVM + Coordinator)
- MVVM
- MVP
- VIPER
- TCA (The Composable Architecture)
- Clean Swift

**Android - Detected Patterns:**

- Feature-First + Clean + DDD
- MVVM (Model-View-ViewModel)
- MVI (Model-View-Intent)
- MVP (Model-View-Presenter)
- Clean Architecture (Domain-Data-Presentation)

**Backend - Detected Patterns:**

- Feature-First + Clean + DDD
- Clean Architecture (Hexagonal/Ports & Adapters)
- Onion Architecture
- Layered Architecture (3-tier)
- CQRS (Command Query Responsibility Segregation)

**Frontend - Detected Patterns:**

- Feature-First + Clean + DDD
- Component-Based Architecture
- Atomic Design Pattern
- State Management patterns (Zustand, Redux, Context)

**Automatic Detection:**

- The library analyzes your project structure, imports, and code patterns
- No configuration file needed - detection happens automatically
- Works with any architecture pattern you use
- All platforms support automatic detection

**Optional Manual Override (All Platforms):**

If you want to force a specific architecture pattern (rarely needed), you can create `.ast-architecture.json` in your project root:

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

**Note:** This file is completely optional for all platforms. The library works perfectly without it, using automatic detection. Manual override is rarely needed since automatic detection works for all common patterns.

---

## Execution Flow

### Flow 1: Making a Commit

```
You: git commit -m "feat: add user service"
   ↓
Git Hook (pre-commit) activates
   ↓
Scans staged files: [src/users/users.service.ts]
   ↓
AST Analysis Engine processes file
   ↓
Rule Checkers analyze code
   ↓
Violation Detected: Singleton pattern
   ↓
Severity: CRITICAL
   ↓
Hook blocks commit
   ↓
Displays error message with details
   ↓
You fix the code (use Dependency Injection)
   ↓
git commit again
   ↓
Hook runs again
   ↓
No violations found
   ↓
Commit proceeds ✅
```

### Flow 2: Cursor AI Using MCP

```
You ask Cursor: "Create a user service"
   ↓
Cursor calls: ai_gate_check
   ↓
MCP checks: Are there blocking violations?
   ↓
Response: ALLOWED
   ↓
Cursor proceeds with task
   ↓
Cursor detects code changes
   ↓
Cursor calls: auto_execute_ai_start
   ↓
MCP analyzes changes (85% confidence - code files modified)
   ↓
MCP executes: ai-start develop
   ↓
Evidence updated (.ai_evidence.json refreshed)
   ↓
Cursor continues with task
   ↓
You finish and ask: "Commit and push this"
   ↓
Cursor calls: auto_complete_gitflow
   ↓
MCP: Commits → Pushes → Creates PR
   ↓
Task complete ✅
```

### Flow 3: Manual Analysis

```
You run: npm run audit
   ↓
CLI tool executes AST analysis
   ↓
Scans all project files (or staged files with --staged)
   ↓
Generates comprehensive report
   ↓
Shows violations grouped by severity
   ↓
You review and fix issues
   ↓
Run audit again to verify fixes
```

---

## Real-World Examples

### Example 1: Singleton Violation Detected

**Scenario:** You create a service with Singleton pattern

**Code:**

```typescript
class UserService {
  private static instance: UserService;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new UserService();
    }
    return this.instance;
  }
}
```

**When you commit:**

```
$ git commit -m "feat: add user service"

🚨 CRITICAL: backend.service.singleton_pattern
   File: src/users/users.service.ts:5
   Rule: No Singleton pattern
   Message: Singleton pattern detected. Use Dependency Injection.

❌ Commit blocked: Critical violations detected
```

**Fix:**

```typescript
@Injectable()
export class UserService {
  // Use Dependency Injection instead
}
```

**Commit again:**

```
$ git commit -m "feat: add user service"

✅ No violations detected
[master abc1234] feat: add user service
 1 file changed, 15 insertions(+)
```

---

### Example 2: Evidence Becomes Stale

**Scenario:** You modify code, evidence is 5 minutes old

**Cursor AI workflow:**

1. You ask: "Add authentication to this endpoint"
2. Cursor calls `ai_gate_check` → `ALLOWED`
3. Cursor reads `evidence://status` → `stale` (age: 350s)
4. Cursor calls `auto_execute_ai_start`
5. MCP detects 85% confidence (code files modified)
6. MCP executes `ai-start develop`
7. Evidence updated (fresh timestamp)
8. Cursor proceeds with task using fresh context

---

### Example 3: Git Flow Automation

**Scenario:** You're on `feature/user-auth` branch, finished work

**You ask Cursor:** "Commit, push and create PR"

**Cursor workflow:**

1. Cursor calls `auto_complete_gitflow` with your message
2. MCP verifies you're on feature branch ✅
3. MCP commits changes (if any) ✅
4. MCP pushes to origin ✅
5. MCP creates PR to `develop` ✅
6. MCP returns PR URL
7. Cursor shows you: "✅ PR created: <https://github.com/user/repo/pull/42>"

---

## Troubleshooting

### Problem: "Git repository not found"

**Cause:** You're not in a Git repository

**Solution:**

```bash
git init
git add .
git commit -m "Initial commit"
```

Then re-run the installer:

```bash
npm run install-hooks
```

---

### Problem: Commit blocked but I need to commit now

**Temporary bypass:**

```bash
GIT_BYPASS_HOOK=1 git commit -m "emergency fix"
```

**⚠️ Warning:** Only use for emergencies. Fix violations as soon as possible.

---

### Problem: MCP server not showing in Cursor

**Check 1:** Verify `.cursor/mcp.json` exists

```bash
cat .cursor/mcp.json
```

**Check 2:** Verify Node path is correct

```bash
which node
# Update .cursor/mcp.json with correct path
```

**Check 3:** Restart Cursor completely

**Check 4:** Check Cursor logs

- View → Output → MCP

---

### Problem: Hook not running

**Check 1:** Verify hook exists and is executable

```bash
ls -la .git/hooks/pre-commit
# Should show: -rwxr-xr-x
```

**Check 2:** Make executable if needed

```bash
chmod +x .git/hooks/pre-commit
```

**Check 3:** Test hook manually

```bash
.git/hooks/pre-commit
```

---

### Problem: Evidence always stale

**Check 1:** Verify `.ai_evidence.json` exists

```bash
ls -la .ai_evidence.json
```

**Check 2:** Update evidence manually

```bash
npm run ai-start develop
```

**Check 3:** Check file permissions

```bash
chmod 644 .ai_evidence.json
```

---

## Next Steps

Now that you understand how it works:

1. **Test the Git hook**: Make a commit with intentional violations
2. **Use MCP tools**: Ask Cursor to check evidence status or sync branches
3. **Run manual analysis**: Use `npm run audit` to see all violations
4. **Read the docs**: Check `docs/USAGE.md` for detailed usage examples

---

**Last updated**: 2025-01-13  
**Version**: 5.3.1  
**Author**: Juan Carlos Merlos Albarracín (Senior Software Architect - AI-Driven Development) <freelancemerlos@gmail.com>
