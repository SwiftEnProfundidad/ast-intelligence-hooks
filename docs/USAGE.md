# Usage Guide - ast-intelligence-hooks

## Table of Contents

1. [Minimal Example (5 minutes)](#minimal-example-5-minutes)
2. [Basic Commands](#basic-commands)
3. [Git Hooks Integration](#git-hooks-integration)
4. [Programmatic Usage](#programmatic-usage)
5. [Advanced Examples](#advanced-examples)
6. [CI/CD Integration](#cicd-integration)
7. [Rule Configuration](#rule-configuration)

---

## Minimal Example (5 minutes)

### Step 1: Install

```bash
npm install --save-dev @pumuki/ast-intelligence-hooks
npm run install-hooks
```

### Step 2: Make a commit

**For AI/Agentic IDE users (Recommended):**

Use `ai-commit` to automatically update `.AI_EVIDENCE.json` before committing:

```bash
# Create a test file
echo "export const test = () => {};" > test.ts
git add test.ts

# Use ai-commit (recommended for AI-driven commits)
npx ai-commit -m "test: verify hooks"
# Or if installed globally:
ai-commit -m "test: verify hooks"
```

**For manual commits:**

```bash
# Create a test file
echo "export const test = () => {};" > test.ts
git add test.ts

# Standard git commit (hooks will run automatically)
git commit -m "test: verify hooks"
```

### Step 3: View result

If there are violations, you'll see a detailed report. If everything is OK, the commit will complete normally.

Done! You now have AST Intelligence working in your project.

---

## Basic Commands

### Code Analysis

#### Interactive Menu (Recommended)

The library includes an **interactive menu** for selecting audit options:

![Interactive Audit Menu](images/interactive-audit-menu.png)

*Interactive menu showing the PUMUKI Advanced Project Audit interface with 9 options for selecting different audit modes (Full audit, Strict modes, Pattern checks, ESLint, AST Intelligence, etc.)*

```bash
# Run interactive menu (recommended for manual audits)
# From node_modules (when installed via npm):
bash node_modules/@pumuki/ast-intelligence-hooks/presentation/cli/audit.sh

# Or from scripts/hooks-system (local development):
bash scripts/hooks-system/presentation/cli/audit.sh

# Or using the npm binary (if configured):
npx audit
```

**Menu Options:**
1. **Full audit (repo analysis)** - Complete repository analysis
2. **Strict REPO+STAGING (CI/CD)** - Strict mode for CI/CD pipelines
3. **Strict STAGING only (dev)** - Analyze only staged files (pre-commit mode)
4. **Standard CRITICAL/HIGH** - Standard analysis focusing on blocking violations
5. **Pattern checks** - Check for TODO, FIXME, console.log patterns
6. **ESLint Admin+Web** - Run ESLint analysis
7. **AST Intelligence** - Run AST-based code analysis
8. **Export Markdown** - Export results to Markdown format
9. **Exit** - Exit the menu

**Non-interactive mode:**
```bash
# Execute specific option directly (from node_modules):
AUDIT_OPTION=7 bash node_modules/@pumuki/ast-intelligence-hooks/presentation/cli/audit.sh  # AST Intelligence
AUDIT_OPTION=3 bash node_modules/@pumuki/ast-intelligence-hooks/presentation/cli/audit.sh  # Staged files only

# Or from scripts/hooks-system:
AUDIT_OPTION=7 bash scripts/hooks-system/presentation/cli/audit.sh  # AST Intelligence
AUDIT_OPTION=3 bash scripts/hooks-system/presentation/cli/audit.sh  # Staged files only
```

#### Direct Analysis (No Menu)

```bash
# Using npm script (runs AST analysis directly)
npm run audit

# Or using CLI
ast-hooks analyze
```

#### Analysis of Staged Files Only

```bash
# Only files in staging
ast-hooks analyze --staged
```

#### Analysis by Platform

```bash
# Backend only
ast-hooks analyze --platform backend

# Frontend only
ast-hooks analyze --platform frontend

# Multiple platforms
ast-hooks analyze --platform backend,frontend
```

### Query Violations

#### List All Violations

```bash
# Using npm script
npm run violations:list

# Or using CLI
ast-violations list
```

**Example output:**
```
🚨 CRITICAL: backend.api.password_not_hashed
   File: src/users/users.service.ts:45
   Message: Password not hashed. Use bcrypt.
   
⚠️  HIGH: frontend.component.prop_drilling
   File: app/components/UserProfile.tsx:23
   Message: Prop drilling detected. Consider using Context or Zustand.
```

#### View Summary

```bash
npm run violations:summary
```

**Example output:**
```
Violations Summary:
  CRITICAL: 2
  HIGH: 5
  MEDIUM: 12
  LOW: 8
  
Total: 27 violations
Technical Debt: ~15 hours
```

#### Top Violations

```bash
npm run violations:top
```

Shows the most frequent violations grouped by rule.

#### View Specific Violation

```bash
# By ID
ast-violations show backend.api.password_not_hashed

# By file
ast-violations show --file src/users/users.service.ts
```

### System Status

```bash
# View hook status
hook-status

# Health check
ast-hooks health
```

### Watch Mode

```bash
# Continuous monitoring
hook-watch

# In another terminal, edit files and see real-time analysis
```

---

## Git Hooks Integration

### Automatic Pre-commit Hook

Once installed, the hook runs automatically on each `git commit`:

```bash
git add .
git commit -m "feat: add new feature"
# → Hook runs automatically
# → Analyzes only staged files
# → Blocks commit if CRITICAL/HIGH violations found
```

### Temporary Bypass (Emergency)

```bash
# For a specific commit (emergencies only)
GIT_BYPASS_HOOK=1 git commit -m "emergency fix"
```

**⚠️ Warning:** Don't abuse the bypass. Use it only in real emergency cases.

### AI Commit Command

The library provides an `ai-commit` command that **must be used** by agentic IDEs (Cursor, Claude Desktop, Windsurf) when making commits. This ensures `.AI_EVIDENCE.json` is properly updated before the commit.

**Why use `ai-commit`?**

- ✅ Automatically updates `.AI_EVIDENCE.json` timestamp if stale (>2 minutes)
- ✅ Ensures evidence freshness (required by pre-commit hook validation)
- ✅ Creates minimal evidence file if missing
- ✅ Prevents commit failures due to stale evidence

**Usage:**

```bash
# Basic usage (same as git commit)
npx ai-commit -m "feat: add user authentication"

# With multiple flags
npx ai-commit -m "fix: resolve null pointer" --no-verify

# All git commit options are supported
npx ai-commit -m "docs: update README" --author="John Doe <john@example.com>"
```

**How it works:**

1. **Checks evidence freshness**: If `.AI_EVIDENCE.json` timestamp is older than 2 minutes, updates it
2. **Updates timestamp**: Sets timestamp to current UTC time
3. **Stages evidence file**: Automatically adds `.AI_EVIDENCE.json` to staging
4. **Executes commit**: Runs `git commit` with all provided arguments

**When to use:**

- ✅ **Always** when committing from an agentic IDE (Cursor, Claude Desktop, Windsurf)
- ✅ When making commits after editing code for >2 minutes
- ✅ When you see "Evidence is stale" warnings

**When NOT to use:**

- ❌ Manual commits (use `git commit` directly)
- ❌ Commits not involving AI-assisted code changes

**Example workflow:**

```bash
# 1. Make code changes (via AI)
# 2. Stage files
git add src/users/user.service.ts

# 3. Commit using ai-commit (AI-driven commit)
npx ai-commit -m "feat: add user validation logic"

# Output:
# 🤖 AI-COMMIT: Preparando commit...
# ✅ AI_EVIDENCE updated: 2025-12-14T12:34:56.000Z
# 🚀 Executing commit...
# ✅ AI-COMMIT completed
```

### Configure Hook Manually

If you need to customize the hook:

```bash
# Edit .git/hooks/pre-commit
nano .git/hooks/pre-commit
```

**Example of custom hook:**

```bash
#!/bin/bash
# Custom pre-commit hook

# Only analyze backend and frontend
AUDIT_PLATFORMS=backend,frontend npm run audit

# Or strict mode
AUDIT_STRICT=1 npm run audit
```

### Post-commit Hook (Optional)

You can add a post-commit hook to generate reports after each commit:

```bash
# Create .git/hooks/post-commit
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# Generate report after commit
npm run violations:summary > .last-commit-report.txt
EOF

chmod +x .git/hooks/post-commit
```

---

## Programmatic Usage

### Basic Example

```javascript
const { runASTIntelligence } = require('@pumuki/ast-intelligence-hooks');

async function analyzeCode() {
  const result = await runASTIntelligence({
    files: ['src/**/*.ts'],
    platforms: ['backend', 'frontend'],
    strict: false
  });

  // Check for critical violations
  if (result.hasCriticalViolations()) {
    console.error('❌ Critical violations found!');
    result.getCriticalFindings().forEach(finding => {
      console.error(`  - ${finding.getRule()}: ${finding.getMessage()}`);
    });
    process.exit(1);
  }

  // View summary
  console.log(`✅ Analysis complete: ${result.getFindings().length} violations found`);
  console.log(`   Technical Debt: ${result.getTechnicalDebtHours()} hours`);
}

analyzeCode().catch(console.error);
```

### Use Use Cases Directly

```javascript
const { AnalyzeStagedFilesUseCase } = require('@pumuki/ast-intelligence-hooks');
const { FileFindingsRepository } = require('@pumuki/ast-intelligence-hooks/infrastructure/repositories');
const { PlatformDetectionService } = require('@pumuki/ast-intelligence-hooks/application/services');

// Create use case instance
const repository = new FileFindingsRepository();
const detectionService = new PlatformDetectionService();
const useCase = new AnalyzeStagedFilesUseCase(repository, detectionService);

// Execute analysis
async function analyzeStaged() {
  const result = await useCase.execute();
  
  if (result.shouldBlockCommit()) {
    console.error('Commit blocked due to violations');
    return false;
  }
  
  return true;
}
```

### Custom Analysis

```javascript
const { runBackendIntelligence } = require('@pumuki/ast-intelligence-hooks');
const glob = require('glob');

// Analyze only specific files
const files = glob.sync('src/**/*.controller.ts');

const findings = await runBackendIntelligence(files, {
  strict: true,
  excludePatterns: ['**/*.spec.ts']
});

// Process findings
findings.forEach(finding => {
  console.log(`${finding.getSeverity()}: ${finding.getRule()}`);
  console.log(`  File: ${finding.getFile()}`);
  console.log(`  Message: ${finding.getMessage()}\n`);
});
```

### Filter Violations

```javascript
const { AuditResult } = require('@pumuki/ast-intelligence-hooks');

// Get only HIGH and CRITICAL violations
const criticalAndHigh = result.getFindings().filter(f => {
  const severity = f.getSeverity();
  return severity === 'critical' || severity === 'high';
});

// Group by file
const byFile = {};
result.getFindings().forEach(finding => {
  const file = finding.getFile();
  if (!byFile[file]) {
    byFile[file] = [];
  }
  byFile[file].push(finding);
});
```

---

## Advanced Examples

### Example 1: Webhook Integration

```javascript
const { runASTIntelligence } = require('@pumuki/ast-intelligence-hooks');
const express = require('express');

const app = express();
app.use(express.json());

app.post('/webhook/analyze', async (req, res) => {
  const { files, branch } = req.body;
  
  try {
    const result = await runASTIntelligence({
      files: files || ['src/**/*.ts'],
      platforms: ['backend', 'frontend']
    });
    
    res.json({
      success: true,
      violations: result.getFindings().length,
      critical: result.getCriticalFindings().length,
      technicalDebt: result.getTechnicalDebtHours()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000);
```

### Example 2: Custom Report

```javascript
const { runASTIntelligence } = require('@pumuki/ast-intelligence-hooks');
const fs = require('fs');

async function generateCustomReport() {
  const result = await runASTIntelligence({
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    platforms: ['backend', 'frontend']
  });
  
  // Generate custom HTML report
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>AST Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .critical { color: red; }
    .high { color: orange; }
    .medium { color: yellow; }
    .low { color: green; }
  </style>
</head>
<body>
  <h1>AST Analysis Report</h1>
  <p>Total Violations: ${result.getFindings().length}</p>
  <p>Technical Debt: ${result.getTechnicalDebtHours()} hours</p>
  
  <h2>Violations by Severity</h2>
  <ul>
    <li class="critical">CRITICAL: ${result.getCriticalFindings().length}</li>
    <li class="high">HIGH: ${result.getFindings().filter(f => f.getSeverity() === 'high').length}</li>
    <li class="medium">MEDIUM: ${result.getFindings().filter(f => f.getSeverity() === 'medium').length}</li>
    <li class="low">LOW: ${result.getFindings().filter(f => f.getSeverity() === 'low').length}</li>
  </ul>
  
  <h2>Details</h2>
  ${result.getFindings().map(f => `
    <div class="${f.getSeverity()}">
      <strong>${f.getRule()}</strong> - ${f.getFile()}<br>
      ${f.getMessage()}
    </div>
  `).join('')}
</body>
</html>
  `;
  
  fs.writeFileSync('custom-report.html', html);
  console.log('Report generated: custom-report.html');
}

generateCustomReport();
```

### Example 3: Incremental Analysis

```javascript
const { AnalyzeStagedFilesUseCase } = require('@pumuki/ast-intelligence-hooks');
const { execSync } = require('child_process');

// Get only staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8'
    });
    return output.trim().split('\n').filter(f => f);
  } catch (error) {
    return [];
  }
}

// Analyze only staged files
async function analyzeStagedOnly() {
  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('No staged files to analyze');
    return;
  }
  
  console.log(`Analyzing ${stagedFiles.length} staged files...`);
  
  // Here you would use the use case with specific files
  // (simplified for example)
  const useCase = new AnalyzeStagedFilesUseCase(/* dependencies */);
  const result = await useCase.execute();
  
  console.log(`Found ${result.getFindings().length} violations`);
}
```

### Example 4: Notification Integration

```javascript
const { runASTIntelligence } = require('@pumuki/ast-intelligence-hooks');
const { NotificationAdapter } = require('./notification-adapter');

async function analyzeAndNotify() {
  const result = await runASTIntelligence({
    files: ['src/**/*.ts'],
    platforms: ['backend', 'frontend']
  });
  
  const criticalCount = result.getCriticalFindings().length;
  
  if (criticalCount > 0) {
    await NotificationAdapter.send({
      title: '🚨 Critical Violations Found',
      message: `${criticalCount} critical violations detected`,
      priority: 'high'
    });
  }
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: AST Analysis

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  ast-analysis:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install AST Intelligence Hooks
        run: npm install --save-dev @pumuki/ast-intelligence-hooks
      
      - name: Run AST Analysis
        run: npm run audit
        continue-on-error: true
      
      - name: Upload violations report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: ast-violations-report
          path: .audit-reports/
```

### GitLab CI

```yaml
ast_analysis:
  stage: test
  image: node:20
  
  script:
    - npm ci
    - npm install --save-dev @pumuki/ast-intelligence-hooks
    - npm run audit || true
    - npm run violations:summary > violations-summary.txt
  
  artifacts:
    when: always
    paths:
      - .audit-reports/
      - violations-summary.txt
    expire_in: 7 days
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any
  
  stages {
    stage('AST Analysis') {
      steps {
        sh 'npm ci'
        sh 'npm install --save-dev @pumuki/ast-intelligence-hooks'
        sh 'npm run audit || true'
        archiveArtifacts artifacts: '.audit-reports/**', fingerprint: true
      }
    }
  }
  
  post {
    always {
      publishHTML([
        reportDir: '.audit-reports',
        reportFiles: 'report.html',
        reportName: 'AST Analysis Report'
      ])
    }
  }
}
```

### CircleCI

```yaml
version: 2.1

jobs:
  ast-analysis:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run: npm ci
      - run: npm install --save-dev @pumuki/ast-intelligence-hooks
      - run: npm run audit || true
      - store_artifacts:
          path: .audit-reports
          destination: ast-reports

workflows:
  version: 2
  test:
    jobs:
      - ast-analysis
```

---

## Rule Configuration

### Adding Your Own IDE Rules (.mdc files)

This library works seamlessly with **agentic IDE rules** (`.mdc` files) compatible with Cursor, Claude Desktop, Windsurf, and other agentic IDEs. The system automatically searches for rules in multiple locations:

**Search Order:**
1. **Project-level**: `.cursor/rules/`, `.windsurf/rules/`, `.vscode/rules/`, `.kilo/rules/`, `.cline/rules/` (highest priority)
2. **IDE project cache**: `~/.cursor/projects/[project-name]/rules/` (for Cursor)
3. **Global IDE locations**: 
   - `~/.cursor/rules/` (Cursor)
   - `~/Library/Application Support/Cursor/User/rules/` (Cursor - macOS)
   - `~/.config/cursor/rules/` (Cursor - Linux)

**Supported Rule Files:**
- `rulesbackend.mdc` - Backend/Node.js/TypeScript rules
- `rulesfront.mdc` - Frontend/React/Next.js rules
- `rulesios.mdc` - iOS/Swift/SwiftUI rules
- `rulesandroid.mdc` - Android/Kotlin/Jetpack Compose rules
- `rulesgold.mdc` - Universal rules (applies to all platforms)

**How to Add Rules:**

**Option 1: Project-specific rules** (Recommended for team projects)
```bash
# Create rules directory in your project
mkdir -p .cursor/rules

# Add your platform-specific rules
# Example: .cursor/rules/rulesbackend.mdc
```

**Option 2: Global rules** (Recommended for personal rules across all projects)
```bash
# Create global rules directory
mkdir -p ~/.cursor/rules

# Add your rules there - they'll be automatically used by all projects
# Example: ~/.cursor/rules/rulesbackend.mdc
```

**Option 3: Copy from another project**
```bash
# Copy rules from a template project
cp /path/to/template-project/.cursor/rules/*.mdc .cursor/rules/
```

**Important Notes:**
- ✅ Rules are **automatically detected** - no configuration needed
- ✅ Works with any agentic IDE (Cursor, Claude Desktop, Windsurf, etc.)
- ✅ Project-level rules take precedence over global rules
- ✅ The library **does not include** default `.mdc` rules (to avoid conflicts with your team's standards)
- ✅ Rules are used by `ai-start` and evidence generation to provide context to AI assistants

**Example Rule File Structure:**
```markdown
---
alwaysApply: true
---

### Your Team Standards

✅ Always follow Clean Architecture
✅ Use dependency injection
✅ Write tests before implementation
# ... your rules here
```

---

### Exclude Files from Analysis

Create or edit `config/ast-exclusions.json`:

```json
{
  "patterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/migrations/**"
  ]
}
```

### Configure Severity by Rule

Edit `config/language-guard.json`:

```json
{
  "backend": {
    "rules": {
      "backend.api.password_not_hashed": {
        "severity": "critical",
        "enabled": true
      },
      "backend.architecture.domain_import": {
        "severity": "high",
        "enabled": true
      }
    }
  }
}
```

### Customize Quality Gates

```javascript
// In your custom code
const { CommitBlockingRules } = require('@pumuki/ast-intelligence-hooks');

// Extend blocking rules
class CustomCommitBlockingRules extends CommitBlockingRules {
  shouldBlockCommit(auditResult) {
    // Your custom logic
    const criticalCount = auditResult.getCriticalFindings().length;
    const highCount = auditResult.getFindings().filter(f => 
      f.getSeverity() === 'high'
    ).length;
    
    // Block if there are more than 3 critical or more than 10 high
    return criticalCount > 3 || highCount > 10;
  }
}
```

---

## Next Steps

- 📚 [API Reference](./API_REFERENCE.md) - Complete API reference
- 🏗️ [Architecture](./ARCHITECTURE_DETAILED.md) - System architecture
- 🔌 [MCP Servers](./MCP_SERVERS.md) - Cursor AI integration
- 📦 [Installation](./INSTALLATION.md) - Installation guide

---

**Last updated**: 2025-01-13  
**Version**: 5.3.0
