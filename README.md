# @pumuki/ast-intelligence-hooks

[![npm version](https://img.shields.io/npm/v/@pumuki/ast-intelligence-hooks.svg?label=npm)](https://www.npmjs.com/package/@pumuki/ast-intelligence-hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-%3E%3D9.0.0-red.svg)](https://www.npmjs.com/)
[![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Backend%20%7C%20Frontend-blue.svg)]()

> **Enterprise-grade AST Intelligence System** with multi-platform support (iOS, Android, Backend, Frontend) and strict enforcement of Feature-First + DDD + Clean Architecture.

---

## 📖 Table of Contents

- [What is it?](#what-is-it)
- [What problems does it solve?](#what-problems-does-it-solve)
- [Features](#features)
- [Use Cases](#use-cases)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [📚 Documentation Guide - Step by Step](#-documentation-guide---step-by-step)
- [Architecture](#architecture)
- [MCP Servers](#mcp-servers)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

---

## What is it?

`ast-intelligence-hooks` is an intelligent static analysis system that automatically validates that your code complies with **Clean Architecture**, **Domain-Driven Design (DDD)**, and **Feature-First Architecture** principles.

### Key Features

- ✅ **798+ rules** for architectural and code validation
- ✅ **Multi-platform**: iOS (Swift), Android (Kotlin), Backend (TypeScript/NestJS), Frontend (React/Next.js)
- ✅ **Integrated Git Hooks**: Automatic validation on every commit
- ✅ **AST Analysis**: Deep code analysis using Abstract Syntax Trees
- ✅ **MCP Servers**: Integration with Cursor AI for automation
- ✅ **Clean Architecture**: Strict implementation of SOLID principles

---

## What problems does it solve?

### ❌ Common Problems

1. **Clean Architecture Violations**
   - Domain layer importing frameworks
   - Infrastructure coupled to Presentation
   - Circular dependencies

2. **Undetected Code Smells**
   - Magic numbers without constants
   - Functions that are too long
   - Classes with too many responsibilities

3. **Lack of Architectural Consistency**
   - Incorrect folder structure
   - Forbidden imports between layers
   - Missing separation of concerns

4. **Production-time Errors**
   - Security violations (passwords without hash)
   - Performance issues
   - Untestable code

### ✅ Solutions

- **Automatic validation** before each commit
- **798+ rules** specific to each platform
- **Detailed reports** with correction suggestions
- **CI/CD integration** for continuous validation

---

## Features

### 🎯 Platform-specific Analysis

#### Backend (TypeScript/NestJS)
- 150+ Clean Architecture rules
- **Automatic architecture detection**: Clean Architecture, Onion, Layered, Feature-First + Clean + DDD, CQRS
- DDD pattern validation
- Circular dependency detection
- Decorator and module analysis

#### Frontend (React/Next.js)
- 200+ architecture rules
- **Automatic architecture detection**: Component-Based, Atomic Design, Feature-First + Clean + DDD, State Management patterns
- Server/Client Components validation
- Hooks and state management analysis
- Prop drilling detection

#### iOS (Swift/SwiftUI)
- 150+ iOS-specific rules
- **Automatic architecture detection**: MVVM-C, MVVM, MVP, VIPER, TCA, Clean Swift, Feature-First + Clean + DDD
- SwiftUI best practices analysis
- Potential memory leak detection

#### Android (Kotlin/Jetpack Compose)
- 200+ Android-specific rules
- **Automatic architecture detection**: MVVM, MVI, MVP, Clean Architecture, Feature-First + Clean + DDD
- Compose pattern analysis
- Common anti-pattern detection

### 🏗️ Automatic Architecture Detection

All platforms now support **automatic architecture pattern detection**:
- **No configuration needed** - works out of the box
- Detects patterns by analyzing project structure, imports, and code
- Supports manual override via `.ast-architecture.json` (optional)
- Works for iOS, Android, Backend, and Frontend

See [HOW_IT_WORKS.md](./docs/HOW_IT_WORKS.md#architecture-detection-by-platform) for details on detected patterns per platform.

### 🤖 MCP Integration

- **evidence-watcher**: Automatic monitoring of `.AI_EVIDENCE.json`
- **ast-intelligence-automation**: Complete Git Flow automation and context detection
- Native integration with Cursor AI

### 🔒 Quality Gates

- **CRITICAL/HIGH**: Automatically block commits
- **MEDIUM/LOW**: Generate warnings in reports
- **Configurable**: Adjust levels according to your project

---

## Use Cases

### 1. Automatic Validation on Pre-commit

```bash
# Runs automatically on each git commit
git commit -m "feat: add new feature"
# → Analyzes only staged files
# → Blocks commit if CRITICAL/HIGH violations found
# → Generates violation report
```

### 2. Full Project Analysis

```bash
# Analyzes entire codebase
npm run audit

# Or using CLI
ast-hooks analyze
```

### 3. CI/CD Integration

```yaml
# .github/workflows/ci.yml
- name: Run AST Analysis
  run: npm run audit
```

### 4. Programmatic Usage

```javascript
const { runASTIntelligence } = require('@pumuki/ast-intelligence-hooks');

const result = await runASTIntelligence({
  files: ['src/**/*.ts'],
  platforms: ['backend'],
  strict: true
});

if (result.hasCriticalViolations()) {
  console.error('❌ Critical violations found!');
  process.exit(1);
}
```

### 5. Continuous Monitoring

```bash
# Watch mode for development
hook-watch

# System status
hook-status
```

---

## Installation

### Prerequisites

- **Node.js** ≥18.0.0
- **npm** ≥9.0.0
- **Git** (for hooks)

### Option 1: Installation via npm (Recommended)

```bash
npm install --save-dev @pumuki/ast-intelligence-hooks
```

### Option 2: Installation via Git

```bash
npm install --save-dev git+https://github.com/carlos/ast-intelligence-hooks.git
```

### Option 3: Manual Installation

```bash
git clone https://github.com/carlos/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm install
npm link
```

### Configure Git Hooks

```bash
# Install hooks automatically
npm run install-hooks

# Or manually
ast-install
```

For more details, see [INSTALLATION.md](./docs/INSTALLATION.md).

---

## Quick Start

### 1. Install the library

```bash
npm install --save-dev @pumuki/ast-intelligence-hooks
```

### 2. Configure hooks

```bash
npm run install-hooks
```

### 3. Make a test commit

```bash
git add .
git commit -m "test: verify hooks"
```

The hooks will run automatically and validate your code.

### 4. View full report

```bash
npm run audit
```

### 5. Check violations

```bash
# List all violations
npm run violations:list

# View summary
npm run violations:summary

# Top violations
npm run violations:top
```

---

## 📚 Documentation Guide - Step by Step

This section provides a recommended reading order to fully understand the library and its capabilities.

### For New Users (Start Here)

1. **[HOW_IT_WORKS.md](./docs/HOW_IT_WORKS.md)** ⭐ **START HERE**
   - Complete step-by-step explanation of what the library does
   - Installation process breakdown
   - How each component works (Git hooks, MCP servers, AST analysis)
   - Execution flows and real-world examples
   - **Read this first to understand the system!**

1. **[INSTALLATION.md](./docs/INSTALLATION.md)** - Start here! Complete installation guide with platform-specific instructions
   - Prerequisites and requirements
   - Installation methods (npm, Git, manual)
   - Initial configuration
   - Verification steps

2. **[USAGE.md](./docs/USAGE.md)** - Learn how to use the library
   - Minimal example (5 minutes)
   - Basic commands
   - Git hooks integration
   - Programmatic usage
   - Advanced examples
   - CI/CD integration

3. **[Quick Start](#quick-start)** (this README) - Get up and running quickly
   - Fast setup in 5 steps
   - First test commit

### For Understanding the System

4. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - High-level architecture overview
   - System layers
   - Data flow
   - Key components
   - Quality gates

5. **[ARCHITECTURE_DETAILED.md](./docs/ARCHITECTURE_DETAILED.md)** - Deep dive into architecture
   - Detailed layer architecture
   - Module dependencies
   - Extension points
   - Key files mapping

### For Integration and Advanced Usage

6. **[MCP_SERVERS.md](./docs/MCP_SERVERS.md)** - MCP integration with Cursor AI
   - evidence-watcher setup
   - ast-intelligence-automation setup
   - Usage examples
   - Troubleshooting

7. **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - Complete API documentation
   - Core services
   - Use Cases
   - Domain entities
   - Entry points

### For Configuration and Customization

8. **[CODE_STANDARDS.md](./docs/CODE_STANDARDS.md)** - Code style and conventions
   - ESLint configuration
   - TypeScript conventions
   - Clean code principles
   - Git commit format

9. **[DEPENDENCIES.md](./docs/DEPENDENCIES.md)** - Dependencies analysis
   - Runtime dependencies
   - Development dependencies
   - Optional tools
   - Platform compatibility

### For Development and Testing

10. **[TESTING.md](./docs/TESTING.md)** - Testing guide
    - Test structure
    - Running tests
    - Writing new tests
    - Best practices

### Quick Reference

- **Need to install?** → [INSTALLATION.md](./docs/INSTALLATION.md)
- **Need examples?** → [USAGE.md](./docs/USAGE.md) or `examples/` folder
- **Need API docs?** → [API_REFERENCE.md](./docs/API_REFERENCE.md)
- **Need to configure?** → [USAGE.md](./docs/USAGE.md#rule-configuration)
- **Need to understand architecture?** → [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Architecture

The project follows **strict Clean Architecture** with 4 well-defined layers:

```
┌─────────────────────────────────────────┐
│  PRESENTATION LAYER                     │
│  - CLI Interface                        │
│  - Git Hooks                            │
│  - MCP Servers                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  APPLICATION LAYER                      │
│  - Use Cases                            │
│  - Services                             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  DOMAIN LAYER                           │
│  - Entities                             │
│  - Business Rules                       │
│  - Repository Interfaces                │
└──────────────┬──────────────────────────┘
               ▲
┌──────────────┴──────────────────────────┐
│  INFRASTRUCTURE LAYER                   │
│  - AST Analyzers                        │
│  - Repository Implementations           │
│  - External Tools                       │
└─────────────────────────────────────────┘
```

**Principles:**
- **Dependencies inward**: Presentation → Application → Domain
- **Domain without dependencies**: Zero external dependencies
- **Dependency Inversion**: Interfaces in Domain, implementations in Infrastructure

For more details, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [ARCHITECTURE_DETAILED.md](./docs/ARCHITECTURE_DETAILED.md).

---

## MCP Servers

The project includes two MCP Servers for integration with Cursor AI:

### evidence-watcher

Monitors the status of `.AI_EVIDENCE.json` and allows AI to verify if it's up to date.

**Resources:**
- `evidence://status`: Evidence status (fresh/stale/missing)

**Tools:**
- `check_evidence_status`: Checks if the evidence is stale

### ast-intelligence-automation

Automates the complete Git Flow cycle: commit → push → PR → merge, plus context detection and AI gate checks.

**Resources:**
- `evidence://status`: Evidence status
- `gitflow://state`: Git Flow workflow state
- `context://active`: Active project context

**Tools:**
- `auto_complete_gitflow`: Automatically completes Git Flow cycle
- `sync_branches`: Syncs develop/main branches
- `cleanup_stale_branches`: Cleans up merged branches
- `auto_execute_ai_start`: Automatically executes ai-start
- `validate_and_fix`: Validates and fixes common issues
- `ai_gate_check`: Gate check before tasks

For more details, see [MCP_SERVERS.md](./docs/MCP_SERVERS.md).

---

## API Reference

### Main Functions

#### `runASTIntelligence(options)`

Analyzes code using AST Intelligence.

```javascript
const { runASTIntelligence } = require('@pumuki/ast-intelligence-hooks');

const result = await runASTIntelligence({
  files: ['src/**/*.ts'],
  platforms: ['backend', 'frontend'],
  strict: false
});
```

**Options:**
- `files` (string[]): File patterns to analyze
- `platforms` (string[]): Platforms to analyze (`ios`, `android`, `backend`, `frontend`)
- `strict` (boolean): If true, blocks on any violation

**Returns:** `AuditResult`

---

#### `AnalyzeCodebaseUseCase`

Use Case for full codebase analysis.

```javascript
const { AnalyzeCodebaseUseCase } = require('@pumuki/ast-intelligence-hooks');

const useCase = new AnalyzeCodebaseUseCase(/* dependencies */);
const result = await useCase.execute('/path/to/codebase');
```

---

#### `AnalyzeStagedFilesUseCase`

Use Case for analyzing only staged files.

```javascript
const { AnalyzeStagedFilesUseCase } = require('@pumuki/ast-intelligence-hooks');

const useCase = new AnalyzeStagedFilesUseCase(/* dependencies */);
const result = await useCase.execute();
```

---

### Domain Entities

#### `AuditResult`

Aggregated result of an analysis.

```javascript
const { AuditResult } = require('@pumuki/ast-intelligence-hooks');

result.getFindings();              // All violations
result.getCriticalFindings();      // Only CRITICAL
result.hasCriticalViolations();    // Boolean
result.getTechnicalDebtHours();    // Estimated hours
```

#### `Finding`

Individual violation found.

```javascript
const { Finding } = require('@pumuki/ast-intelligence-hooks');

finding.getSeverity();     // 'critical' | 'high' | 'medium' | 'low'
finding.getRule();         // Rule ID
finding.getMessage();      // Descriptive message
finding.getFile();         // File where it was found
```

For more details, see [API_REFERENCE.md](./docs/API_REFERENCE.md).

---

## Configuration

### Environment Variables

```bash
# Repository root
export REPO_ROOT=/path/to/project

# Evidence stale threshold (seconds)
export HOOK_GUARD_EVIDENCE_STALE_THRESHOLD=180

# Auto-commit in Git Flow
export AUTO_COMMIT_ENABLED=true
export AUTO_PUSH_ENABLED=true
export AUTO_PR_ENABLED=false

# Analysis mode
export AUDIT_STRICT=false
export AUDIT_STAGED_ONLY=false
export AUDIT_CRITICAL_HIGH_ONLY=false
```

### Configuration Files

- `config/ast-exclusions.json`: Exclude files from analysis
- `config/language-guard.json`: Language-specific guard configuration
- `config/doc-standards.json`: Documentation standards
- `.cursor/mcp.json`: MCP Servers configuration (see [MCP_SERVERS.md](./docs/MCP_SERVERS.md))

### Customize Rules

Rules are in `skills/` by platform:
- `skills/backend-guidelines/`
- `skills/frontend-guidelines/`
- `skills/ios-guidelines/`
- `skills/android-guidelines/`

For more details, see [USAGE.md](./docs/USAGE.md).

---

## Best Practices

### 1. Install Hooks in All Projects

```bash
# In each new project
npm install --save-dev @pumuki/ast-intelligence-hooks
npm run install-hooks
```

### 2. Use in CI/CD

```yaml
# .github/workflows/ci.yml
- name: AST Analysis
  run: npm run audit
```

### 3. Review Violations Regularly

```bash
# Weekly
npm run violations:summary
```

### 4. Configure Appropriate Exclusions

```json
// config/ast-exclusions.json
{
  "patterns": [
    "node_modules/**",
    "dist/**",
    "build/**"
  ]
}
```

### 5. Use MCP Servers with Cursor AI

Configure MCP Servers in `.cursor/mcp.json` for complete automation.

---

## FAQ

### Can I use this in existing projects?

Yes, it's backward compatible. Hooks only validate new code you commit.

### How to temporarily disable hooks?

```bash
# For a specific commit
GIT_BYPASS_HOOK=1 git commit -m "emergency fix"
```

### Does it work with monorepos?

Yes, automatically detects monorepo structure and analyzes each module.

### Can I add custom rules?

Yes, you can extend rules in `skills/` or create your own analyzers.

### Does it work on Windows?

Works with WSL2 or Git Bash. Not tested on native Windows.

### What if I have many violations?

Start by fixing CRITICAL and HIGH. MEDIUM and LOW are warnings and don't block commits.

### How to update evidence?

```bash
# Automatically via MCP
# Or manually
./bin/update-evidence.sh --auto --platforms backend,frontend
```

For more questions, check the issues on GitHub.

---

## Available Commands

### CLI Commands

```bash
# Analysis
ast-hooks analyze              # Full analysis
ast-hooks analyze --staged     # Only staged files

# Violations
ast-violations list            # List all
ast-violations summary         # Summary
ast-violations top             # Top violations
ast-violations show <id>       # Show specific violation

# Hooks
hook-status                    # System status
hook-watch                     # Watch mode
hook-predict                   # Violation prediction
hook-playbook                  # Execute playbook

# Git Flow
gitflow check                  # Verify Git Flow
gitflow status                 # Current status
gitflow workflow               # View full workflow
```

### npm Scripts

```bash
npm run audit                  # Full analysis
npm run install-hooks          # Install hooks
npm test                       # Run tests
npm run lint                   # Linter
npm run typecheck              # Type checking
```

---

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the code of conduct
- Ensure tests pass (`npm test`)
- Add tests for new features
- Update documentation if necessary

For coding standards, see [CODE_STANDARDS.md](./docs/CODE_STANDARDS.md).

---

## License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) for more details.

---

## Credits

Developed by **Pumuki Team®**

- **Author**: Juan Carlos Merlos Albarracín (Software Architect)
- **Contact**: freelancemerlos@gmail.com
- **Version**: 5.3.1
- **Repository**: [GitHub](https://github.com/carlos/ast-intelligence-hooks)

---

## Useful Links

- 📚 [Complete Documentation](./docs/)
- 🏗️ [Detailed Architecture](./docs/ARCHITECTURE.md) | [Architecture Detailed](./docs/ARCHITECTURE_DETAILED.md)
- 🔌 [MCP Servers](./docs/MCP_SERVERS.md)
- 📖 [API Reference](./docs/API_REFERENCE.md)
- 📦 [Installation Guide](./docs/INSTALLATION.md)
- 💡 [Usage Guide](./docs/USAGE.md)
- 🔍 [Dependencies Analysis](./docs/DEPENDENCIES.md)
- 🧪 [Testing Guide](./docs/TESTING.md)
- 📋 [Code Standards](./docs/CODE_STANDARDS.md)

---

**⭐ If this project is useful to you, please consider giving it a star on GitHub.**