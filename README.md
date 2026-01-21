# Pumuki AST Intelligence Framework

 <p align="center">
  <img src="https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/logo.png" alt="Pumuki AST Intelligence Framework" width="800" />
 </p>

Portable, project‑agnostic, multi‑platform enterprise framework to govern AI‑assisted development through AST analysis, deterministic evidence, AI Gate controls, and operational automation.

![npm](https://img.shields.io/npm/v/pumuki-ast-hooks.svg)
![node](https://img.shields.io/badge/node-%3E%3D18-43853d)
![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Backend%20%7C%20Frontend-blue)
![license](https://img.shields.io/badge/license-MIT-black)

---

## Inicio rápido (30–60s)

```bash
git init
npm install --save-dev pumuki-ast-hooks
npx ast-install
npx ast-hooks audit
```

Modo de instalación por defecto: `npm-runtime`.

Para usar runtime embebido (modo `vendored`):

```bash
HOOK_INSTALL_MODE=vendored npx ast-install
```

---

## Operational visuals (examples)

### Pre‑write enforcement (block before writing)

![Pre-write hook output](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/Hook_02.png)

### AI Gate (blocked example)

![AI Gate blocked example](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/ai_gate.png)

### ai-start (bootstrap + evidence refresh)

![ai-start output](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/ai-start.png)

### Pre-flight check (in-memory validation)

![pre-flight-check output](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/pre-flight-check.png)

### Interactive menu (orchestrator overview)

The framework includes an interactive audit menu that drives the orchestrator (full audit, strict modes, pattern checks, ESLint suites, AST intelligence, export, etc.).

```bash
npx ast-hooks
```

Documentation:

- `docs/USAGE.md` (Interactive Menu, non‑interactive `AUDIT_OPTION`, and typical flows)
- `CHANGELOG.md` (Release notes and changes)
- `docs/RELEASE_NOTES.md` (Historical release notes)

---

## Visual Overview

![AST Intelligence System Overview](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/ast_intelligence_01.svg)

![AST Intelligence Workflow](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/ast_intelligence_02.svg)

![AST Intelligence Audit - Part 1](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/ast_intelligence_03.svg)

![AST Intelligence Audit - Part 2](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/ast_intelligence_04.svg)

![AST Intelligence Audit - Part 3](https://cdn.jsdelivr.net/gh/SwiftEnProfundidad/ast-intelligence-hooks@8f3d85cf2083d71dc778ad78c20a1b5559f23467/assets/ast_intelligence_05.svg)

---

## 1. Identity

### Name

Pumuki AST Intelligence Framework

### Enterprise positioning (one line)

Enterprise governance for AI‑assisted development: persistent evidence, deterministic gate, and multi‑platform AST enforcement.

---

## 2. Clear definition

### 2.1 What the framework is

Pumuki AST Intelligence Framework is a portable, project‑agnostic framework for long‑lived systems that governs AI‑assisted work by combining:

- multi‑platform AST analysis;
- persistent evidence as the source of truth;
- a deterministic gate (ALLOW/BLOCK);
- enforcement before writing, before commit, and in CI/CD;
- MCP integration for agents;
- Git Flow automation;
- a guard/daemon and operational signals.

### 2.2 What problem it solves

AI assistants are probabilistic systems: they can produce a coherent change once and a degrading change on the next run, even with the same prompt. In enterprise repositories this causes:

- architecture drift;
- silent introduction of anti‑patterns;
- security degradation;
- accumulation of technical debt;
- loss of traceability.

Pumuki introduces control and operational reproducibility: it does not rely on “conversation”, it relies on evidence and enforcement.

### 2.3 Why it exists

Without governance, AI:

- does not preserve verifiable context;
- does not apply rules deterministically;
- can break architectural invariants;
- can introduce high‑impact defects that are not obvious in a superficial review.

Pumuki exists to make AI usage compatible with enterprise engineering standards.

### 2.4 Why AI cannot be trusted without governance

Operational reliability is not achieved with prompts. It is achieved with:

- persistent, auditable evidence;
- formal rules per platform;
- deterministic enforcement;
- early blocking of critical violations.

---

## 3. Core principles

### 3.1 Evidence over conversation

Decisions are made based on a persistent evidence file (`.AI_EVIDENCE.json`), not chat memory.

### 3.2 Gated intelligence

Before any AI‑assisted operation, repository state and evidence are validated. If it does not comply, the operation is blocked.

### 3.3 AST, not heuristics

Rules run on real ASTs and code structure, avoiding fragile approximations.

### 3.4 Fail fast, block early

Pumuki blocks as early as possible: pre‑write, pre‑commit, and CI.

### 3.5 Platform‑agnostic governance

A single enforcement model governs iOS, Android, backend, and frontend.

### 3.6 Token economy (cost-aware operation)

This framework treats token usage as an operational cost.

- **Batch checks and avoid redundant scans**.
- **Reuse cached context** when safe.
- **Ask the user for missing info** instead of exploring blindly.
- **Keep responses concise**.

This principle is part of the framework contract and is surfaced to agents via:

- `ai_gate_check` → `mandatory_rules.framework_rules`
- `pre_flight_check` → `framework_rules`

---

## 4. Architecture and mental model

### 4.1 AI Evidence File (`.AI_EVIDENCE.json`)

`.AI_EVIDENCE.json` is the persistent source of truth. It represents the governance state and enables reproducible decisions.

It includes:

- session and branch context;
- violations by severity;
- gate state;
- detected platforms;
- operational watchers;
- cognitive layers.

### 4.2 AI Gate (ALLOW / BLOCK)

The AI Gate decides:

- **ALLOWED**: proceed (following rules).
- **BLOCKED**: the operation is blocked with actionable feedback.

### 4.3 Deterministic enforcement

Enforcement happens in layers:

1) pre‑write in IDEs that support it;
2) Git hooks as a universal fallback;
3) MCP gate/pre‑flight for agents;
4) CI/CD as final enforcement.

### 4.4 Cognitive layers

#### Human Intent (Intentional Memory)

Defines the human goal, constraints, and expiration.

#### Semantic Snapshot (Semantic Memory)

Summarizes project state (health, active platforms, gate state) to prevent drift.

---

## 5. Features (complete)

### 5.1 AST Intelligence (iOS, Android, Backend, Frontend)

Multi‑platform AST‑based analysis:

- iOS (Swift)
- Android (Kotlin)
- Backend (Node.js / NestJS)
- Frontend (React / Next.js)

### 5.2 Pre‑write enforcement

Block before writing when the IDE can intercept operations.

### 5.3 In‑memory AST analysis

Validation over proposed code as a string (without writing to disk).

### 5.4 IDE hooks

IDE integrations to intercept changes before writing (or fallback via Git).

### 5.5 MCP server

MCP server for agents with blocking and non‑blocking tools.

### 5.6 Git hooks

Universal Git‑level enforcement (pre‑commit / pre‑push) to prevent violations from entering history.

### 5.7 Git Flow automation

Automation of feature/fix cycles and releases.

### 5.8 macOS notifications

Operational notifications for gate, evidence, health, guard, and tokens.

### 5.9 Evidence guard daemon

Guard/daemon to keep evidence fresh and reduce drift during long sessions.

### 5.10 CI/CD enforcement

Apply the same rules in pipelines.

---

## 6. Pre‑Write Enforcement

### 6.1 What it does

Analyzes code before writing it to disk. This prevents dangerous or degrading patterns from even entering the working tree.

### 6.2 IDE interception

When the IDE supports pre‑write hooks, the framework intercepts edit/write operations and validates the final content.

### 6.3 Content reconstruction from partial diffs

If the IDE provides partial diffs, the system reconstructs the final content by applying `old_string → new_string` transformations over the current state before analyzing.

### 6.4 Blocking behavior

If CRITICAL/HIGH violations exist, the operation is blocked.

### 6.5 Example (in‑memory pre‑flight)

```javascript
const { analyzeCodeInMemory } = require('./scripts/hooks-system/infrastructure/ast/ast-core');

const virtualFilePath = 'apps/backend/src/users/UserService.ts';
const proposedCode = `
export class UserService {
  // ...
}
`;

const result = analyzeCodeInMemory(proposedCode, virtualFilePath);

if (result.hasCritical || result.hasHigh) {
  throw new Error('BLOCKED: Critical/High violations detected');
}
```

---

## 7. MCP Integration

### 7.1 Purpose

MCP provides a standard contract so agents can consume governance tools (gate and pre‑flight) before modifying the repository.

### 7.2 Tools (blocking vs non‑blocking)

#### Blocking

- `ai_gate_check`
- `pre_flight_check`

#### Non‑blocking

- `read_platform_rules`
- `set_human_intent`
- `get_human_intent`
- `clear_human_intent`
- `suggest_human_intent`
- `auto_execute_ai_start`
- `check_evidence_status`
- `validate_and_fix`
- `sync_branches`
- `cleanup_stale_branches`
- `auto_complete_gitflow`
- `record_test_created`
- `reset_tdd_session`

### 7.3 Blocking vs non‑blocking

Blocking tools return ALLOWED/BLOCKED and stop the flow if violations are detected.

---

## 8. Git Governance

### 8.1 `ast:gitflow`

Automates the feature/fix → develop cycle.

### 8.2 `ast:release`

Automates the develop → main release.

### 8.3 Full Git Flow cycle

The Git Flow cycle includes branch validation, commits, push, PR, merge (by policy), cleanup, and sync.

---

## 9. Sección de comandos (OBLIGATORIO – NO CAMBIAR)

### Instalación (dev)

```bash
npm install --save-dev pumuki-ast-hooks
npx ast-install
```

### Instalación (legacy)

```bash
npm install --save-dev pumuki-ast-hooks
npx ast-install
```

### Actualización

```bash
npm install --save-dev pumuki-ast-hooks@latest
npx ast-install
```

### Desinstalación

```bash
npx ast-uninstall
npm uninstall pumuki-ast-hooks
```

### Instalar hooks

```bash
npm run install-hooks
```

### Menú interactivo

```bash
npx ast-hooks
```

### Verificación de versión

```bash
npm run ast:check-version
```

### Auditoría

```bash
npm run audit
```

### Git Flow

```bash
npm run ast:gitflow
```

### Release

```bash
npm run ast:release
```

### Guard start/stop/status/logs

```bash
npm run ast:guard:start
npm run ast:guard:stop
npm run ast:guard:status
npm run ast:guard:logs
```

### Refresco de evidencia

```bash
npm run ast:refresh
```

---

## 10. IDE Compatibility Matrix

| IDE | Hook Support | Blocks Before Write? | Fallback |
| --- | --- | --- | --- |
| Windsurf | `pre_write_code` | Yes | Git pre-commit |
| Claude Code | `PreToolUse` (Write/Edit/MultiEdit) | Yes | Git pre-commit |
| OpenCode | `tool.execute.before` | Yes | Git pre-commit |
| Cursor | Post-write (`afterFileEdit`) | No | Git pre-commit |
| Codex CLI | Approval policies only | Manual | Git pre-commit |
| Kilo Code | Not documented | No | Git pre-commit |

---

## 10. Rule Exclusions (`ast-exclusions.json`)

Use `config/ast-exclusions.json` to suppress specific rules for specific files.

Example:

```json
{
  "exclusions": {
    "rules": {
      "ios.solid.dip.concrete_dependency": {
        "files": [
          "apps/ios/Infrastructure/Repositories/Auth/AuthLoginRepositoryImpl.swift"
        ],
        "excludePatterns": [
          "**/*Auth*Repository*.swift"
        ]
      }
    }
  }
}
```

Rules without `files`/`paths`/`globs` are treated as global exclusions.

---

## 11. Typical Enterprise Use Cases

- Long‑running feature development with AI assistance.
- Regulated systems where traceability and control are mandatory.
- Platform teams governing multiple repositories.
- Monorepos and multi‑team repositories with architecture drift risk.

---

## 12. Intended Audience

Designed for:

- senior engineers;
- software architects;
- platform teams;
- teams responsible for SDLC quality, security, and governance.

---

## 13. Maturity & Stability

Production‑ready, version‑evolving, and designed for CI/CD integration.

---

## 14. License

MIT
