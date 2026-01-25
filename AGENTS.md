# Pumuki AST Intelligence - AI Agents Guide

## Operational Flow (MANDATORY)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. SESSION START                                               │
│     npx ast-hooks audit  →  Refresh .AI_EVIDENCE.json           │
│     npm run ast:guard:status  →  Verify guard is active         │
├─────────────────────────────────────────────────────────────────┤
│  2. GATE CHECK (before any action)                              │
│     MCP: ai_gate_check()                                        │
│     If BLOCKED → DO NOT edit, fix violations first              │
├─────────────────────────────────────────────────────────────────┤
│  3. PRE-FLIGHT (before each write)                              │
│     MCP: pre_flight_check({ action_type, target_file })         │
│     If blocked=true → DO NOT write                              │
├─────────────────────────────────────────────────────────────────┤
│  4. CHANGES                                                     │
│     Edit files (only if gate/pre-flight = ALLOWED)              │
├─────────────────────────────────────────────────────────────────┤
│  5. VALIDATION                                                  │
│     npm test  →  Tests pass                                     │
│     npm run lint  →  No errors                                  │
│     npx ast-hooks audit  →  Update evidence                     │
├─────────────────────────────────────────────────────────────────┤
│  6. DEFINITION OF DONE                                          │
│     ✅ Gate status = ALLOWED                                    │
│     ✅ Tests pass                                                │
│     ✅ Lint passes                                               │
│     ✅ .AI_EVIDENCE.json updated                                │
└─────────────────────────────────────────────────────────────────┘
```

## If BLOCKED

1. Read `.AI_EVIDENCE.json` → section `ai_gate.violations`
2. Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
3. Fix violations one by one
4. Re-run `npx ast-hooks audit`
5. Verify gate with MCP `ai_gate_check()`

## Available Commands

| Command | Description |
|---------|-------------|
| `npx ast-hooks audit` | Full audit + update evidence |
| `npm run ast` | Alias for audit |
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint linter |
| `npm run ast:guard:status` | Guard daemon status |
| `npm run gitflow` | Verify Git Flow compliance |

## Human vs Enforceable Rules

### Human Rules (guidance, non-blocking)
- Prefer composition over inheritance
- Self-descriptive names in English
- Minimal documentation
- KISS / YAGNI

### Enforceable Rules (block if violated)
- `backend.antipattern.god_classes` → CRITICAL
- `common.error.empty_catch` → CRITICAL
- `ios.solid.dip.concrete_dependency` → HIGH
- `common.testing.prefer_spy_over_mock` → HIGH

See `skills/skill-rules.json` for complete list of enforceable rules.

## Repository Structure

```
ast-intelligence-hooks/
├── bin/                    # Executable CLIs
├── scripts/hooks-system/   # System core
│   ├── application/        # Use cases, services
│   ├── domain/             # Entities, ports
│   ├── infrastructure/     # Adapters, AST
│   └── presentation/       # MCP server, CLI
├── skills/                 # Platform guidelines
├── docs/                   # Documentation
├── packs/                  # Portable packs by platform
└── .windsurf/skills/       # Windsurf skills
```

## Non-Negotiable Principles

- **Do not invent commands** (use only those in package.json)
- **Small and verifiable changes**
- **BDD → TDD** (feature files → specs → implementation)
- **No code comments** (self-descriptive names)
- **Strict SOLID** (SRP, OCP, LSP, ISP, DIP)
- **No Singletons** (use Dependency Injection)

---
🐈💚 Pumuki Team® - AST Intelligence Framework
