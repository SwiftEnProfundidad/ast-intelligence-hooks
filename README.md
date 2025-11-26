# 🐈💚 @pumuki/ast-intelligence-hooks

Enterprise hook-system automation for RuralGO projects.

[![npm version](https://img.shields.io/npm/v/@pumuki/ast-intelligence-hooks.svg)](https://www.npmjs.com/package/@pumuki/ast-intelligence-hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **TL;DR**  
> Centralised notifications, monitoring, recovery and CI utilities for multi-platform repositories following strict Clean Architecture.

---

## Table of contents

1. [Overview](#overview)
2. [Quick start](#quick-start)
3. [Repository structure](#repository-structure)
4. [Core capabilities](#core-capabilities)
5. [Installation & configuration](#installation--configuration)
6. [Daily workflow](#daily-workflow)
7. [Monitoring & recovery](#monitoring--recovery)
8. [CLI reference](#cli-reference)
9. [Testing](#testing)
10. [Release process](#release-process)
11. [Backlog & roadmap](#backlog--roadmap)
12. [Maintainers](#maintainers)

---

## Overview

`@pumuki/ast-intelligence-hooks` bundles every guard-related component used by RuralGO:

- Notification centre with deduplication, queues and cooldowns.
- Evidence freshness protocol enforcement.
- Token usage monitoring (Cursor API + heuristics).
- Git tree, heartbeat and health checks.
- Auto-recovery with exponential backoff.
- CLI install wizard, watchdog utilities and `ast-sync` tooling.
- Venture-ready documentation (installation, troubleshooting, release plan).

All code follows Clean Architecture (Domain → Application → Infrastructure → Presentation) and is published as an installable NPM package or consumable via `ast-sync`.

---

## Quick start

### Option A – NPM package
```bash
npm install @pumuki/ast-intelligence-hooks
```

### Option B – Local sync (source of truth)
```bash
# From the library master repo
npx ast-sync push --strategy=merge

# In a target project
npx ast-sync pull --strategy=merge
```

Refer to [INSTALL.md](./INSTALL.md) for detailed sync strategies and automation options.

---

## Repository structure

```
hooks-system/
├── domain/                   # Business entities & rules (Finding, AuditResult, CommitBlockingRules)
├── application/              # Use cases & services (analysis, evidence, recovery)
├── infrastructure/           # Implementations, logging factories, watchdog CLIs
│   ├── cli/                  # install-wizard, ast-sync helpers
│   ├── logging/              # UnifiedLogger factory
│   └── watchdog/             # token-monitor, health-check, auto-recovery
├── presentation/             # (Legacy) CLI menu / shell entry points
├── tests/                    # Jest suites (unit + integration)
└── docs/                     # Installation, troubleshooting, release, architecture
```

---

## Core capabilities

- **NotificationCenterService** – queue, cooldowns, retry logic, JSON logs.
- **Monitoring suite** – evidence freshness, git tree, token usage, heartbeat, health aggregator.
- **AutoRecoveryManager** – exponential backoff, jitter, strategy registry, NotificationCenter integration.
- **Evidence protocol** – `.AI_EVIDENCE.json` validation + enforcement in guard scripts.
- **Guard orchestration** – `guard-supervisor` + `guard-auto-manager` consuming the services via DI.
- **CLI toolkit** – install wizard, health-check, auto-recovery, token monitor loop.
- **Testing** – Jest unit suites and `guard-system.integration.spec.js`.
- **Documentation** – installation, troubleshooting, release plan, refactoring sessions report.

---

## Installation & configuration

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the install wizard**
   ```bash
   node scripts/hooks-system/infrastructure/cli/install-wizard.js
   ```
   - Creates `.hook-system/config.json` (if missing).
   - Generates symlink `.git/hooks/guard-supervisor`.
   - Logs actions in `.audit-reports/install-wizard.log`.

3. **Manual fallback (optional)**
   - Copy `scripts/hooks-system/bin/guard-supervisor.js` to `.git/hooks/guard-supervisor`.
   - Ensure executable permissions: `chmod +x .git/hooks/guard-supervisor`.
   - Populate `.hook-system/config.json` with notification/recovery defaults.
   - Run `node infrastructure/watchdog/health-check.js`.

---

## Daily workflow

1. **Refresh evidence**  
   Update `.AI_EVIDENCE.json` (timestamp + protocol 3 preguntas) before editing files.  
   *(Protocol enforced by guards and release plan).*

2. **Start guards**
   ```bash
   scripts/hooks-system/bin/start-guards.sh start
   scripts/hooks-system/bin/start-guards.sh status
   ```

3. **Run watchdog CLIs (optional but recommended)**
   - `node infrastructure/watchdog/health-check.js`
   - `node infrastructure/watchdog/auto-recovery.js heartbeat-stale guard-supervisor`
   - `node infrastructure/watchdog/token-monitor.js`

4. **Review logs**
   - `.audit-reports/notification-center.log`
   - `.audit-reports/guard-auto-manager.log`
   - `.audit_tmp/health-status.json`

---

## Monitoring & recovery

| Component                | Output                                | Trigger                                  |
|--------------------------|----------------------------------------|-------------------------------------------|
| NotificationCenter       | `.audit-reports/notification-center.log` | Deduplicated notifications + JSON events |
| HealthCheckService       | `.audit_tmp/health-status.json`         | Aggregated status (evidence, tokens, git)|
| AutoRecoveryManager      | `.audit-reports/guard-auto-manager.log` | `auto_recovery_*` events                  |
| TokenMonitorService      | `.audit_tmp/AI_TOKEN_STATUS.txt`        | token_warning / token_critical            |
| EvidenceMonitorService   | Notification `evidence_*`               | stale or missing evidence                 |

All monitoring events funnel through NotificationCenter; macOS notifications (`osascript` / `terminal-notifier`) are used when available.

### Evidence & health (domain-driven)

- `EvidenceStatus` (Domain layer) models the current state of `.AI_EVIDENCE.json` (timestamp, age, platforms, branch, infra changes, etc.).
- `GetEvidenceStatusUseCase` + `FileSystemEvidenceRepository` provide a stable API for MCP servers, CLI and shell scripts to read evidence status.
- The `ast-hooks health` command returns a JSON snapshot including:
  - `evidence.status` (`fresh`, `stale`, `invalid`) and `evidence.isStale`.
  - `evidence.ageSeconds` and `evidence.maxAgeSeconds`.
  - `astWatch.running`, `astWatch.pid` and `astWatch.logPath` when the AST watcher is active.

MCP resources expose the same information to AI assistants:

- `ai://gate` – mandatory AI gate check (evidence freshness + Git Flow).
- `evidence://status` – current evidence status.
- `gitflow://state` – Git Flow cycle state and current branch.
- `context://active` – active context analysis with platform confidence.

---

## CLI reference

| Command                                    | Description                                   |
|--------------------------------------------|-----------------------------------------------|
| `start-guards.sh start|stop|status`        | Launch or inspect watch-hooks & token monitor |
| `node infrastructure/watchdog/health-check.js` | Generate health snapshot                   |
| `node infrastructure/watchdog/auto-recovery.js <reason> <key>` | Schedule recovery attempts |
| `node infrastructure/watchdog/token-monitor.js` | Manual token usage evaluation              |
| `node infrastructure/cli/install-wizard.js`   | Interactive setup wizard                     |
| `npx ast-sync push/pull`                      | Sync library with target project             |
| `ast-hooks health`                           | Health snapshot of evidence + AST watcher (JSON) |
| `ast-hooks watch`                            | Start continuous AST watcher (pre-commit friendly) |

---

## Testing

```bash
# Run all unit + integration suites
npm test

# Target a specific domain
npm test -- application/services/recovery/AutoRecoveryManager.spec.js
```

CI should execute the full suite; integration tests spawn the CLIs and validate generated artifacts.

---

## Release process

See [docs/technical/hook-system/releases/RELEASE_PLAN.md](docs/technical/hook-system/releases/RELEASE_PLAN.md) for the detailed checklist. Summary:

1. `npm version 6.0.0` & `npm publish --dry-run`.
2. Validate install wizard on a clean clone.
3. Execute health-check and auto-recovery CLIs.
4. Publish release notes + attach logs & metrics.
5. Rollout to projects via `npx ast-sync pull`.
6. Monitor NotificationCenter events for 24h.

Rollback: checkout tag `v5.2.0`, restore `.hook-system` backups, disable recovery strategies if necessary.

---

## Backlog & roadmap

- NotificationQueue standalone module (advanced queueing, persistence) – planned for v7.0.
- Generic NotificationCenter plugin interface – roadmap item.
- LibrarySyncService unit tests – upcoming enhancement.
- Automated language guard for tests/descriptions (enforce English strings).
- Optional auto-refresh of `.AI_EVIDENCE.json` without losing protocol traceability.

---

## Maintainers

- Pumuki Team® – architecture, governance, release management.  
- Contact: `team@pumuki.dev`

Licensed under the MIT License.
# 🐈💚 @pumuki/ast-intelligence-hooks

**Pumuki Team®** - Enterprise-grade AST Intelligence System

Sistema profesional de auditoría de código multi-plataforma siguiendo **Clean Architecture estricta**.

[![npm version](https://img.shields.io/npm/v/@pumuki/ast-intelligence-hooks.svg)](https://www.npmjs.com/package/@pumuki/ast-intelligence-hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- ✅ **Multi-platform**: iOS (Swift), Android (Kotlin), Backend (NestJS), Frontend (React/Next.js)
- ✅ **Clean Architecture**: Strict separation of layers (Domain, Application, Infrastructure, Presentation)
- ✅ **Feature-First + DDD**: Domain-Driven Design with bounded contexts
- ✅ **800+ Rules**: Exhaustive code quality analysis
- ✅ **Git Flow Enterprise**: Automatic workflow enforcement
- ✅ **NPM Distribution**: Simple installation, reusable across multiple projects

## 📦 Installation

```bash
npm install @pumuki/ast-intelligence-hooks
```

See [INSTALL.md](./INSTALL.md) for advanced installation options.

## 🎯 Architecture

```
hooks-system/
├── domain/                           # DOMAIN LAYER (no dependencies)
│   ├── entities/
│   │   ├── Finding.js               # Finding Entity (128 lines)
│   │   └── AuditResult.js           # Aggregate Root (210 lines)
│   ├── repositories/
│   │   └── IFindingsRepository.js   # Interface (30 lines)
│   └── rules/
│       └── CommitBlockingRules.js   # Business Rules (147 lines)
│
├── application/                      # APPLICATION LAYER (depends on Domain)
│   ├── use-cases/
│   │   ├── AnalyzeCodebaseUseCase.js       # UC: Full analysis (80 lines)
│   │   ├── AnalyzeStagedFilesUseCase.js    # UC: Staged only (85 lines)
│   │   ├── GenerateAuditReportUseCase.js   # UC: Reports (165 lines)
│   │   └── BlockCommitUseCase.js           # UC: Commit block (110 lines)
│   └── services/
│       └── PlatformDetectionService.js     # Platform detection (130 lines)
│
├── infrastructure/                   # INFRASTRUCTURE LAYER (implements Domain)
│   ├── repositories/
│   │   └── FileFindingsRepository.js       # Impl IFindingsRepository (95 lines)
│   ├── adapters/
│   │   └── LegacyAnalyzerAdapter.js        # Adapter Pattern (75 lines)
│   ├── external-tools/
│   │   └── GitOperations.js                # Git wrapper (60 lines)
│   ├── ast/                                 # AST Intelligence (4 platforms)
│   │   ├── ast-intelligence.js             # Orchestrator (304 lines)
│   │   ├── ast-core.js                     # Shared utilities (209 lines)
│   │   ├── backend/
│   │   │   └── ast-backend.js              # 150+ Backend rules (866 lines)
│   │   ├── frontend/
│   │   │   └── ast-frontend.js             # 150+ Frontend rules (881 lines)
│   │   ├── ios/
│   │   │   ├── ast-ios.js                  # iOS orchestrator (79 lines)
│   │   │   ├── parsers/
│   │   │   │   └── SourceKittenParser.js   # Native Swift (483 lines)
│   │   │   └── analyzers/
│   │   │       └── iOSEnterpriseAnalyzer.js # 170+ iOS rules (766 lines)
│   │   ├── android/
│   │   │   └── ast-android.js              # 175+ Android rules (459 lines)
│   │   ├── common/
│   │   │   └── ast-common.js               # Common rules (50 lines)
│   │   └── text/
│   │       └── text-scanner.js             # Text scanner (470 lines)
│   ├── eslint/
│   │   └── eslint-integration.sh           # ESLint wrapper
│   ├── patterns/
│   │   └── pattern-checks.sh               # Pattern checks
│   └── shell/
│       ├── audit-orchestrator.sh           # Shell orchestrator (683 lines)
│       ├── constants.sh
│       └── utils.sh
│
├── presentation/                     # PRESENTATION LAYER (depends on Application)
│   └── cli/
│       ├── MenuCLI.js                      # Interactive menu (230 lines) ✅ NEW
│       ├── audit.sh                        # Legacy shell entry
│       └── direct-audit.sh                 # Legacy direct entry
│
├── main.js                          # MAIN ENTRY POINT + DI CONTAINER (170 lines)
└── docs/                            # Documentation
    ├── ARCHITECTURE_AUDIT.md               # Architecture audit (850 lines)
    ├── ENTERPRISE_AST_IMPLEMENTATION.md    # Enterprise plan (1188 lines)
    ├── CLEAN_ARCHITECTURE_PLAN.md          # Refactoring plan (423 lines)
    ├── AST_IOS.md                          # 170+ iOS rules
    ├── AST_ANDROID.md                      # 175+ Android rules
    ├── AST_BACKEND.md                      # 150+ Backend rules
    └── AST_FRONTEND.md                     # 150+ Frontend rules
```

## 📚 Clean Architecture Principles

### 1️⃣ Domain Layer (Core - No Dependencies)
**Responsibility**: Pure business logic, framework-agnostic

**Components**:
- ✅ **Entities**: Finding (128 lines), AuditResult (210 lines)
  - Objects with identity and behavior
  - isCritical(), getTechnicalDebtHours(), filterByPlatform()
  
- ✅ **Repositories (Interfaces)**: IFindingsRepository (30 lines)
  - Persistence contracts
  - save(), load(), clear()
  
- ✅ **Business Rules**: CommitBlockingRules (147 lines)
  - Logic for when to block commits
  - Technical debt calculation
  - Maintainability index

**Characteristics**:
- 🚫 ZERO external dependencies
- ✅ 100% testable with pure unit tests
- ✅ Entities with behavior (NO anemic domain model)

---

### 2️⃣ Application Layer (Use Cases - Depends ONLY on Domain)
**Responsibility**: Orchestration of application logic

**Components**:
- ✅ **Use Cases** (440 lines total):
  - AnalyzeCodebaseUseCase (80 lines) - Full analysis
  - AnalyzeStagedFilesUseCase (85 lines) - Staged files only
  - GenerateAuditReportUseCase (165 lines) - Reports (console/JSON/HTML)
  - BlockCommitUseCase (110 lines) - Block decision
  
- ✅ **Services** (130 lines):
  - PlatformDetectionService - Detects Backend/Frontend/iOS/Android

**Flow**:
```
CLI → Use Case → Domain Entities → Repository Interface
                      ↓
                Business Rules (Domain)
```

---

### 3️⃣ Infrastructure Layer (Implementations - Implements Domain)
**Responsibility**: Technical details and frameworks

**Components**:
- ✅ **Repositories** (95 lines):
  - FileFindingsRepository implements IFindingsRepository
  - JSON persistence in .audit_tmp/
  
- ✅ **Adapters** (75 lines):
  - LegacyAnalyzerAdapter - Converts legacy to Domain entities
  
- ✅ **External Tools** (60 lines):
  - GitOperations - Git commands wrapper
  
- ✅ **AST Intelligence** (5,500+ lines):
  - **Backend**: 150+ TypeScript/NestJS rules (866 lines)
  - **Frontend**: 150+ React/Next.js rules (881 lines)
  - **iOS**: 170+ Swift rules (native SourceKitten) (766+483 lines)
  - **Android**: 175+ Kotlin/Compose rules (459 lines)
  - **Common**: Cross-platform rules (50 lines)
  - **Text Scanner**: Kotlin/Swift text analysis (470 lines)

---

### 4️⃣ Presentation Layer (UI - Depends on Application)
**Responsibility**: User interface and formatting

**Components**:
- ✅ **MenuCLI.js** (230 lines) - NEW Clean Architecture CLI
  - Professional interactive menu
  - Dependency Injection via DIContainer
  - 5 audit modes
  
- 🔧 **Legacy Scripts** (migration pending):
  - audit.sh - Shell entry point
  - direct-audit.sh - Direct execution

---

## 🚀 Usage

### Mode 1: Clean Architecture (RECOMMENDED) ✅
```bash
# Main entry point with Clean Architecture
node scripts/hooks-system/main.js

# Or with interactive menu
node scripts/hooks-system/presentation/cli/MenuCLI.js
```

### Mode 2: Legacy Shell (Compatible)
```bash
# Shell interactive menu
bash scripts/hooks-system/presentation/cli/audit.sh

# Direct execution
bash scripts/hooks-system/presentation/cli/direct-audit.sh
```

---

## 🔄 Execution Flow (Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER (CLI)                   │
│              MenuCLI.js or main.js                      │
└────────────────────┬────────────────────────────────────┘
                     │ calls
                     ▼
┌────────────────────────────────────────────────────────┐
│           APPLICATION LAYER (Use Cases)                │
│  AnalyzeCodebaseUseCase                                │
│  GenerateAuditReportUseCase                            │
│  BlockCommitUseCase                                    │
└────────────────────┬───────────────────────────────────┘
                     │ uses
                     ▼
┌────────────────────────────────────────────────────────┐
│              DOMAIN LAYER (Entities)                   │
│  Finding, AuditResult                                  │
│  CommitBlockingRules (Business Logic)                  │
└────────────────────────────────────────────────────────┘
                     ▲ implements
┌────────────────────┴───────────────────────────────────┐
│         INFRASTRUCTURE LAYER (Technical)               │
│  FileFindingsRepository                                │
│  LegacyAnalyzerAdapter                                 │
│  Backend/Frontend/iOS/Android Analyzers                │
│  GitOperations, SourceKittenParser                     │
└────────────────────────────────────────────────────────┘
```

**Golden Rule**: Dependencies always point **INWARD** (towards Domain).

---

## 📊 Quality Metrics

### Clean Architecture Compliance
- ✅ **Domain Layer**: 100% implemented
- ✅ **Application Layer**: 100% implemented
- ✅ **Infrastructure Layer**: 95% implemented (adapters for legacy)
- ✅ **Presentation Layer**: 80% implemented (new CLI + legacy shell)

### AST Intelligence Coverage
- ✅ **iOS**: 170+ rules (100%) - Native SourceKitten
- ✅ **Android**: 175+ rules (100%) - Text scanner
- ✅ **Backend**: 150+ rules (100%) - TypeScript AST
- ✅ **Frontend**: 150+ rules (100%) - TypeScript AST

### Generated Code
- **Domain Layer**: 515 lines
- **Application Layer**: 570 lines
- **Infrastructure Layer**: 230 lines (new) + 5,500 lines (AST)
- **Presentation Layer**: 230 lines (new)
- **Total Clean Architecture**: ~7,045 professional lines

---

## 🎯 Key Benefits of the New Architecture

### 1. Testability
```javascript
// BEFORE: Hard to test (tied to filesystem)
function runAudit() {
  const files = fs.readdirSync('.');
  // ... mixed logic
}

// AFTER: Easy to test (dependency injection)
class AnalyzeCodebaseUseCase {
  constructor(analyzers, repository, detectionService) {
    // Injected dependencies
  }
  
  async execute(targetPath) {
    // Pure logic, easy to mock
  }
}
```

### 2. Maintainability
- ✅ Each layer has a single responsibility
- ✅ Changes in Infrastructure DO NOT affect Domain
- ✅ Easy to add new platforms
- ✅ Easy to switch from JSON to Database

### 3. Scalability
- ✅ Add analyzer: only Infrastructure
- ✅ Change blocking rules: only Domain
- ✅ Add web CLI: only Presentation

---

## 🔧 Dependency Injection Container

`main.js` acts as a **DI Container** that wires all layers:

```javascript
const { DIContainer } = require('./scripts/hooks-system/main.js');

const container = new DIContainer();

// Get configured Use Cases
const analyzeUseCase = container.getAnalyzeCodebaseUseCase();
const result = await analyzeUseCase.execute('/path/to/code');
```

---

## 📝 Quick Commands

```bash
# Full analysis (new Clean Architecture)
node scripts/hooks-system/main.js

# Interactive menu
node scripts/hooks-system/presentation/cli/MenuCLI.js

# Staged files only
AUDIT_STAGED_ONLY=1 node scripts/hooks-system/main.js

# Strict mode (block on any violation)
AUDIT_STRICT=1 node scripts/hooks-system/main.js

# Block only CRITICAL/HIGH
AUDIT_CRITICAL_HIGH_ONLY=1 node scripts/hooks-system/main.js

# Bypass (emergency)
GIT_BYPASS_HOOK=1 git commit -m "emergency fix"
```

---

## 📚 Additional Documentation

- **Architecture Audit**: `docs/ARCHITECTURE_AUDIT.md`
- **Enterprise AST Plan**: `docs/ENTERPRISE_AST_IMPLEMENTATION.md`
- **Clean Architecture Plan**: `CLEAN_ARCHITECTURE_PLAN.md`
- **iOS Rules**: `docs/AST_IOS.md` (170+ rules)
- **Android Rules**: `docs/AST_ANDROID.md` (175+ rules)
- **Backend Rules**: `docs/AST_BACKEND.md` (150+ rules)
- **Frontend Rules**: `docs/AST_FRONTEND.md` (150+ rules)

---

## ✅ Current Status

**Clean Architecture**: ✅ **95% COMPLETED**
- ✅ Domain Layer: 100%
- ✅ Application Layer: 100%
- ✅ Infrastructure Layer: 95% (legacy adapters)
- ✅ Presentation Layer: 80% (new CLI + legacy shell)

**AST Intelligence**: ✅ **645+ TOTAL RULES**
- ✅ iOS: 170+ rules (Native SourceKitten)
- ✅ Android: 175+ rules (text scanner)
- ✅ Backend: 150+ rules (TypeScript AST)
- ✅ Frontend: 150+ rules (TypeScript AST)

---

**Architect**: Senior Solutions Architect  
**Version**: V3.0.0-clean-architecture  
**Date**: 2025-11-01

