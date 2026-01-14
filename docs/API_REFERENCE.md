# Hook System API Documentation

## Overview

The Hook System provides automated quality gates and intelligent AST analysis for multi-platform projects. It ensures code quality, security, and architectural compliance through pre-commit hooks and CI/CD integration.

## Core Services

### GitOperations

Centralized Git operations for the hook system.

#### Methods

- `getStagedFiles()`: Returns array of staged file paths
- `getWorkingDirectoryFiles()`: Returns array of modified files in working directory
- `getAllChangedFiles()`: Returns all changed files (staged + working directory)
- `isInGitRepository()`: Boolean check for Git repository
- `getRepositoryRoot()`: Returns absolute path to repository root

**Location**: `infrastructure/core/GitOperations.js`

### SeverityConfig

Centralized severity mapping and utilities.

#### Constants

- `SEVERITY_LEVELS`: Numeric severity rankings (CRITICAL: 4, HIGH: 3, etc.)
- `SEVERITY_MAP`: String mappings for different severity formats
- `SEVERITY_ICONS`: Emoji icons for each severity level
- `SEVERITY_LABELS`: Human-readable labels

#### Methods

- `getSeverityValue(severity)`: Normalizes severity string
- `getSeverityIcon(severity)`: Returns emoji icon
- `getSeverityLabel(severity)`: Returns human-readable label
- `isBlocking(severity)`: Checks if severity blocks commits
- `filterBySeverity(violations, severity)`: Filters violations by severity
- `sortBySeverity(violations)`: Sorts violations by severity (highest first)

**Location**: `domain/entities/SeverityConfig.js`

## Entry Points

### Command Line Scripts

Located in `bin/` directory:

- `run-ast-adapter.js`: AST analysis adapter for pre-commit hooks
- `violations-api.js`: Query interface for violations data
- `update-evidence.sh`: Updates .AI_EVIDENCE.json with metrics
- `ai-commit.sh`: Intelligent commit wrapper
- `pumuki-audit.js`: Global audit runner

### Orchestrators

Located in `infrastructure/shell/orchestrators/`:

- `audit-orchestrator.sh`: Main audit menu and pre-commit integration
- `intelligent-audit.js`: Severity intelligence evaluator

### Guards

Located in `infrastructure/guards/`:

- `master-validator.sh`: Primary pre-commit validation gate

## Configuration

### Files

- `config/detect-secrets-baseline.json`: Secret detection baseline
- `config/rules.json`: AST rule definitions
- `config/paths.conf`: Path configurations

### Environment Variables

- `ENABLE_INTELLIGENT_SEVERITY`: Enable/disable intelligent severity evaluation
- `PRE_COMMIT`: Set to 'true' during pre-commit hooks

## Architecture

```
node_modules/pumuki-ast-hooks/
├── application/          # Business logic (Use Cases, Services)
├── domain/               # Core entities (SeverityConfig, etc.)
├── infrastructure/       # Technical implementations
│   ├── ast/              # AST analysis engines
│   ├── core/             # Core utilities (GitOperations)
│   ├── guards/           # Validation gates
│   ├── reporting/        # Report generation
│   └── shell/            # Shell scripts
├── bin/                  # CLI entry points
├── config/               # Configuration files
├── hooks/                # Git hook templates
└── presentation/         # CLI interface
```

## Usage Examples

### Basic AST Analysis

```bash
# Run AST analysis on staged files
npm run audit

# Or using CLI directly
npx ast-hooks analyze

# Query violations by severity
npm run violations:list

# Or using CLI
npx ast-violations list
```

### Pre-commit Integration

The system automatically runs during `git commit` via pre-commit hooks installed with `npm run install-hooks`.

### Manual Audit

```bash
# Run full audit
npm run audit

# With intelligent severity
ENABLE_INTELLIGENT_SEVERITY=true npm run audit

# Using CLI
npx ast-hooks analyze
```

## Testing

Run integration tests:

```bash
npm test -- scripts/hooks-system/__tests__/integration.test.js
```

## Development

### Adding New Rules

1. Add rule definition to `config/rules.json`
2. Implement rule logic in appropriate AST analyzer
3. Update SeverityConfig if new severity levels needed
4. Add tests in `__tests__/` directory

### Extending Git Operations

1. Add new methods to `GitOperations` class
2. Update integration tests
3. Document in this API reference

---

## 🐈💚 Pumuki Team® - Hook System API Reference
