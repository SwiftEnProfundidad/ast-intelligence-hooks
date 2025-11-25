# Autonomous AST Intelligence Services

**Pumuki Team®**

## Architecture

```
AutonomousOrchestrator
  ├── ContextDetectionEngine (analyzes repo state)
  ├── PlatformDetectionService (identifies platforms)
  └── DynamicRulesLoader (loads .mdc rules)
```

## Key Components

### AutonomousOrchestrator
**Purpose:** Main decision-making engine

**Confidence Scoring:**
- 100%: All staged files in unambiguous directory
- 90%+: Auto-execute (no confirmation)
- 70-89%: Ask user
- <70%: Ignore

**Date handling:** Uses `Date.now()` (milliseconds) for all timestamps - safe for comparisons.

### ContextDetectionEngine
**Purpose:** Analyze current development context

**Detects:**
- Staged files
- Recently modified files
- Recent commit patterns
- Branch name
- Open files (inferred from git status)

**Cache:** 10s TTL to avoid redundant git calls

### DynamicRulesLoader
**Purpose:** Load and aggregate .mdc rules for detected platforms

**Generates:** `.cursor/rules/auto-context.mdc` dynamically

### PlatformDetectionService
**Purpose:** Identify platform from file path/extension

**Cache:** 30s TTL per file

**Ambiguity scoring:**
- 0: Unambiguous (.swift, .kt)
- 10: Clear directory (/apps/backend/)
- 60: Ambiguous extension (.ts)
- 100: Unknown

## Usage

```javascript
const orchestrator = new AutonomousOrchestrator(contextEngine, platformDetector, rulesLoader);
const decision = await orchestrator.analyzeContext();

if (decision.action === 'auto-execute') {
  // Execute ai-start automatically
}
```

## Date/Time Safety

All services use consistent date handling:
- Internal timestamps: `Date.now()` (number, safe)
- ISO strings: `new Date().toISOString()` (metadata only)
- NO dangerous conversions (string ↔ Date)

