# Autonomous AST Intelligence System

**Version:** 3.0.0  
**Author:** Pumuki Team®  
**Status:** Long-term architecture (3-6 months implementation)

## Overview

Completely autonomous system for AST Intelligence execution with:
- Multi-platform detection (Frontend/Backend/iOS/Android)
- Confidence-based decision making (90% auto, 70-89% ask, <70% ignore)
- Zero human intervention for 85%+ of cases
- Integrated with Git Flow automation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Cursor IDE (AI)                           │
│  Consults: context://active                                 │
│  Calls: auto_execute_ai_start                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ MCP Protocol (STDIO)
┌──────────────────▼──────────────────────────────────────────┐
│  MCP Server (gitflow-automation-watcher.js)                 │
│  - Polling every 30s for context changes                    │
│  - Exposes resources + tools                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  AutonomousOrchestrator                                     │
│  ├── ContextDetectionEngine (analyze repo)                  │
│  ├── PlatformDetectionService (identify platforms)          │
│  └── DynamicRulesLoader (load .mdc rules)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  Decision Engine                                            │
│  - Score confidence: 0-100%                                 │
│  - Decide: auto-execute / ask / ignore                      │
│  - Log to TelemetryService                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  AutoExecuteAIStartUseCase                                  │
│  - Execute: bash update-evidence.sh --auto --platforms X    │
│  - Update .AI_EVIDENCE.json                                 │
│  - Return result to AI                                      │
└─────────────────────────────────────────────────────────────┘
```

## Confidence Scoring

### Factors (Total: 100 points)

| Factor | Weight | Description |
|--------|--------|-------------|
| Staged files match | 40 | Ratio of files matching platform |
| Directory unambiguous | 30 | All files in clear directory (/apps/backend/) |
| Extension specific | 20 | Platform-specific extension (.swift, .kt) |
| Branch name match | 10 | Branch contains platform name |
| Recent history | 10 | Recent commits match platform |

### Examples

**Backend puro (100% confidence):**
```
Staged: apps/backend/src/users/users.service.ts
Directory: ✅ /apps/backend/ (unambiguous)
Extension: ⚠️ .ts (ambiguous)
Branch: feature/backend-users-api
→ Score: 40 + 30 + 0 + 10 = 80% ... wait, let me recalculate
Actually: All files in backend/, so 40 (all match) + 30 (unambiguous) + 10 (branch) = 80%

Wait, this doesn't add up to 100% even for perfect case. Let me check the logic in AutonomousOrchestrator.js...

Actually looking at the code, the weights can ADD UP. So a perfect score would be when ALL factors align:
- 40 (100% of staged files match)
- 30 (directory unambiguous)
- 20 (specific extension)  
- 10 (branch name)
- 10 (recent history)
= 110 max, but capped at 100

So for backend .ts file:
- 40 (all match backend)
- 30 (in /apps/backend/)
- 0 (extension not specific)
- 10 (branch has 'backend')
- 0 (new feature)
= 80%

For iOS .swift:
- 40 (all match ios)
- 30 (in /ios/)
- 20 (specific extension .swift)
- 10 (branch has 'ios')
= 100%
```

## Flow

### 1. Trigger Events
- Session load (workspace open)
- Pre-commit hook
- Git change (every 30s polling)
- Branch switch

### 2. Context Analysis
```javascript
context = {
  stagedFiles: ['apps/backend/users.service.ts'],
  branchName: 'feature/backend-users',
  recentCommits: [...],
  timestamp: Date.now()
}
```

### 3. Confidence Scoring
```javascript
platforms = ['backend']
confidence = 90%
action = 'auto-execute'
```

### 4. Execution
```bash
# If ≥90%:
bash update-evidence.sh --auto --platforms backend

# If 70-89%:
Ask AI: "Should I execute ai-start for backend? (80% confidence)"

# If <70%:
Ignore (too ambiguous)
```

## Date/Time Handling

**Critical:** NO date conversions to prevent bugs

### Safe Patterns:
```javascript
// ✅ Internal timestamps
timestamp: Date.now()  // 1699308000000 (number)
age = Date.now() - timestamp  // Safe arithmetic

// ✅ Human-readable
generated: new Date().toISOString()  // "2025-11-06T21:30:00.000Z"
```

### NEVER:
```javascript
// ❌ Dangerous conversions
new Date(stringTimestamp)
Date.parse(string)
timestamp.getTime() // if timestamp is string
```

## Telemetry

All decisions logged to `.audit_tmp/autonomous-decisions.jsonl`:

```json
{
  "timestamp": 1699308000000,
  "isoTimestamp": "2025-11-06T21:30:00.000Z",
  "platforms": ["backend"],
  "confidence": 92,
  "decision": "auto-executed",
  "userCorrection": true,
  "accuracy": 94
}
```

### Self-Adjusting Thresholds:
- If false positive rate > 15%: Raise threshold (90% → 95%)
- If accuracy ≥ 95%: Lower threshold (90% → 85%)

## Integration with Git Flow

Works seamlessly with existing Git Flow automation:
- MCP Server handles both AST + Git Flow
- Unified context detection
- No conflicts between systems

## Limitations (Current Cursor MCP)

1. No access to "currently editing file" → Use git status heuristic
2. No "creative interruption" events → Use polling
3. Cannot modify .cursor/rules/*.mdc at runtime → Generate auto-context.mdc
4. No push notifications → AI polls resources

## Migration Path

### Phase 1-3 (Weeks 1-12): Core System
- ✅ Orchestrator with scoring
- ✅ Context detection
- ✅ MCP integration
- ✅ Event listeners

### Phase 4 (Weeks 13-16): Integration
- Copy to project repo
- Sync with library
- Eliminate duplicates

### Phase 5-6 (Weeks 17-24): Production
- Telemetry and learning
- Performance optimization
- End-to-end testing
- Documentation

## Success Criteria

- ✅ Zero intervention in 85%+ cases
- ✅ Platform detection accuracy >95%
- ✅ Response time <1s
- ✅ False positives <10%
- ✅ Fully integrated in library

---

**Pumuki Team®** - Autonomous Project Intelligence  
**Documentation:** `docs/AUTONOMOUS_SYSTEM.md`  
**Version:** 3.0.0

