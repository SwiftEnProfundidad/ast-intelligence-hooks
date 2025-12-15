#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AI Session Loader (VS Code Startup)
# ═══════════════════════════════════════════════════════════════
# Automatically loads session context when VS Code opens workspace
# Triggered by: .vscode/tasks.json (runOn: folderOpen)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Paths
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
SESSION_FILE="$REPO_ROOT/.AI_SESSION_START.md"
TOKEN_STATUS="$REPO_ROOT/.AI_TOKEN_STATUS.txt"
VIOLATIONS_REPORT="$REPO_ROOT/.violations-by-priority.md"

# Clear screen
clear

# Banner
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}║            🤖 AI SESSION LOADER                          ║${NC}"
echo -e "${BLUE}║            Workspace Opened - Loading Context...         ║${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo -e "${CYAN}📍 Current Branch: ${MAGENTA}$CURRENT_BRANCH${NC}"
echo ""

# Show last 3 commits
echo -e "${CYAN}📝 Recent Commits:${NC}"
git log --oneline -3 2>/dev/null | sed 's/^/   /' || echo "   No commits yet"
echo ""

# Show session context
if [[ -f "$SESSION_FILE" ]]; then
  echo -e "${CYAN}📖 Session Context:${NC}"

  # Prefer current session from .AI_EVIDENCE.json (auto-updated by ai-start)
  LOCAL_EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"
  if [[ -f "$LOCAL_EVIDENCE_FILE" ]]; then
    CURRENT_SESSION_ID=$(jq -r '.session_id // empty' "$LOCAL_EVIDENCE_FILE" 2>/dev/null || echo "")
    CURRENT_ACTION=$(jq -r '.action // empty' "$LOCAL_EVIDENCE_FILE" 2>/dev/null || echo "")
    if [[ -n "$CURRENT_SESSION_ID" ]]; then
      if [[ -n "$CURRENT_ACTION" && "$CURRENT_ACTION" != "null" ]]; then
        echo "   **Sesión actual (evidence):** $CURRENT_SESSION_ID - $CURRENT_ACTION"
      else
        echo "   **Sesión actual (evidence):** $CURRENT_SESSION_ID"
      fi
    fi
  fi

  # Also show static plan context from .AI_SESSION_START.md (without duplicating Sesión actual)
  head -20 "$SESSION_FILE" | grep -E "Branch activo|Fase del plan|Progreso total|Violations.*restantes" | sed 's/^/   /' || true
  echo ""
fi

# Show token status
if [[ -f "$TOKEN_STATUS" ]]; then
  echo -e "${CYAN}🔋 Token Status:${NC}"
  grep -E "Status:|Used:|Remaining:" "$TOKEN_STATUS" | sed 's/^/   /' || true
  echo ""
fi

# Show top violations
if [[ -f "$VIOLATIONS_REPORT" ]]; then
  echo -e "${CYAN}🎯 Top Violations:${NC}"
  grep -A 4 "## 📊 Summary" "$VIOLATIONS_REPORT" | tail -5 | sed 's/^/   /' 2>/dev/null || echo "   No violations report"
  echo ""
fi

# Check .AI_EVIDENCE.json freshness
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"
EVIDENCE_AGE=0
if [[ -f "$EVIDENCE_FILE" ]]; then
  EVIDENCE_TS=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  if [[ -n "$EVIDENCE_TS" ]] && [[ "$EVIDENCE_TS" != "null" ]]; then
    # Parse ISO 8601 timestamp with timezone offset (e.g., 2025-12-14T08:04:44+01:00)
    # macOS date command doesn't handle +01:00 format well, so we convert to UTC first
    if [[ "$EVIDENCE_TS" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2})([+-][0-9]{2}):([0-9]{2})$ ]]; then
      # Format with timezone offset: convert to epoch using Python or node
      EVIDENCE_EPOCH=$(python3 -c "from datetime import datetime; print(int(datetime.fromisoformat('$EVIDENCE_TS').timestamp()))" 2>/dev/null || \
        node -e "console.log(Math.floor(new Date('$EVIDENCE_TS').getTime() / 1000))" 2>/dev/null || \
        echo "0")
    elif [[ "$EVIDENCE_TS" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2})Z?$ ]]; then
      # Format without timezone (assume local time)
      CLEAN_TS=$(echo "$EVIDENCE_TS" | sed 's/Z$//' | sed 's/\.[0-9]*$//')
      EVIDENCE_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "$CLEAN_TS" +%s 2>/dev/null || echo "0")
    else
      EVIDENCE_EPOCH=0
    fi
    
    NOW_EPOCH=$(date +%s)
    EVIDENCE_AGE=$((NOW_EPOCH - EVIDENCE_EPOCH))
    
    # Sanity check: if age is negative or unreasonably large (> 1 year), assume parsing failed
    if [[ $EVIDENCE_AGE -lt 0 ]] || [[ $EVIDENCE_AGE -gt 31536000 ]]; then
      EVIDENCE_AGE=0
      AGE_FORMATTED="unknown"
    fi

    # Format age in human-readable format
    if [[ $EVIDENCE_AGE -lt 60 ]]; then
      AGE_FORMATTED="${EVIDENCE_AGE}s"
    elif [[ $EVIDENCE_AGE -lt 3600 ]]; then
      AGE_MIN=$((EVIDENCE_AGE / 60))
      AGE_SEC=$((EVIDENCE_AGE % 60))
      AGE_FORMATTED="${AGE_MIN}m ${AGE_SEC}s"
    elif [[ $EVIDENCE_AGE -lt 86400 ]]; then
      AGE_HOUR=$((EVIDENCE_AGE / 3600))
      AGE_MIN=$(( (EVIDENCE_AGE % 3600) / 60 ))
      AGE_FORMATTED="${AGE_HOUR}h ${AGE_MIN}m"
    else
      AGE_DAYS=$((EVIDENCE_AGE / 86400))
      AGE_HOUR=$(( (EVIDENCE_AGE % 86400) / 3600 ))
      AGE_FORMATTED="${AGE_DAYS}d ${AGE_HOUR}h"
    fi

    if [[ $EVIDENCE_AGE -gt 180 ]]; then
      echo -e "${YELLOW}⚠️  Evidence is stale (${AGE_FORMATTED} old, max 3min)${NC}"
      echo -e "${CYAN}🔄 Auto-updating evidence...${NC}"
      
      # Auto-update evidence if stale
      UPDATE_EVIDENCE_SCRIPT="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh"
      if [[ ! -f "$UPDATE_EVIDENCE_SCRIPT" ]]; then
        # Try scripts/hooks-system path as fallback
        UPDATE_EVIDENCE_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/update-evidence.sh"
      fi
      
      # Try node_modules path if script not found in scripts/
      if [[ ! -x "$UPDATE_EVIDENCE_SCRIPT" ]]; then
        UPDATE_EVIDENCE_SCRIPT="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh"
      fi
      
      if [[ -x "$UPDATE_EVIDENCE_SCRIPT" ]]; then
        # Detect platforms from project structure
        PLATFORMS=""
        [[ -d "$REPO_ROOT/apps/backend" ]] && PLATFORMS="${PLATFORMS}backend,"
        [[ -d "$REPO_ROOT/apps/frontend" ]] && PLATFORMS="${PLATFORMS}frontend,"
        [[ -d "$REPO_ROOT/apps/mobile/ios" ]] && PLATFORMS="${PLATFORMS}ios,"
        [[ -d "$REPO_ROOT/apps/mobile/android" ]] && PLATFORMS="${PLATFORMS}android,"
        PLATFORMS="${PLATFORMS%,}" # Remove trailing comma
        
        if [[ -n "$PLATFORMS" ]]; then
          if "$UPDATE_EVIDENCE_SCRIPT" --auto --platforms "$PLATFORMS" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Evidence updated${NC}"
            # Send macOS notification
            osascript -e "display notification \"Evidence auto-updated at $(date '+%Y-%m-%d %H:%M:%S') (was ${AGE_FORMATTED} old)\" with title \"🔄 Evidence Refreshed\" sound name \"Glass\"" 2>/dev/null || true
          else
            echo -e "${YELLOW}⚠️  Evidence update failed${NC}"
          fi
        else
          echo -e "${YELLOW}⚠️  Could not auto-detect platforms, run manually:${NC}"
          echo -e "${YELLOW}   $UPDATE_EVIDENCE_SCRIPT --auto --platforms <platforms>${NC}"
        fi
      else
        echo -e "${YELLOW}⚠️  Update script not found, run manually:${NC}"
        echo -e "${YELLOW}   ./scripts/hooks-system/bin/update-evidence.sh --auto --platforms <platforms>${NC}"
      fi
      echo ""
    else
      echo -e "${GREEN}✅ Evidence fresh (${AGE_FORMATTED} old)${NC}"
      echo ""
    fi
  fi
fi

# Execute AI Gate Check automatically
echo -e "${CYAN}🚦 Running AI Gate Check...${NC}"
UPDATE_EVIDENCE_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/update-evidence.sh"
if [[ ! -x "$UPDATE_EVIDENCE_SCRIPT" ]]; then
  # Try node_modules path
  UPDATE_EVIDENCE_SCRIPT="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh"
fi
if [[ -x "$UPDATE_EVIDENCE_SCRIPT" ]]; then
  # Update evidence and run audit to get ai_gate (don't use --refresh-only, we need audit)
  if "$UPDATE_EVIDENCE_SCRIPT" --auto >/dev/null 2>&1; then
    # Read gate status from evidence
    if [[ -f "$EVIDENCE_FILE" ]]; then
      GATE_STATUS=$(jq -r '.ai_gate.status // "UNKNOWN"' "$EVIDENCE_FILE" 2>/dev/null || echo "UNKNOWN")
      CRITICAL_COUNT=$(jq -r '[.ai_gate.violations[]? | select(.severity == "CRITICAL")] | length' "$EVIDENCE_FILE" 2>/dev/null || echo "0")
      HIGH_COUNT=$(jq -r '[.ai_gate.violations[]? | select(.severity == "HIGH")] | length' "$EVIDENCE_FILE" 2>/dev/null || echo "0")
      
      if [[ "$GATE_STATUS" == "BLOCKED" ]]; then
        TOTAL_BLOCKING=$((CRITICAL_COUNT + HIGH_COUNT))
        if [[ $TOTAL_BLOCKING -gt 0 ]]; then
          echo -e "${RED}   🚫 BLOCKED: ${TOTAL_BLOCKING} blocking violations (${CRITICAL_COUNT} CRITICAL, ${HIGH_COUNT} HIGH)${NC}"
          osascript -e "display notification \"${TOTAL_BLOCKING} blocking violations detected\" with title \"🚫 AI Gate Blocked\" sound name \"Basso\"" 2>/dev/null || true
        else
          echo -e "${GREEN}   ✅ Gate passed${NC}"
        fi
      else
        echo -e "${GREEN}   ✅ Gate passed${NC}"
      fi
    fi
  else
    echo -e "${YELLOW}   ⚠️  Gate check failed${NC}"
  fi
else
  echo -e "${YELLOW}   ⚠️  Update script not found${NC}"
fi
echo ""

# Start realtime guards (watch-hooks + token monitor)
GUARDS_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/start-guards.sh"
if [[ -x "$GUARDS_SCRIPT" ]]; then
  echo -e "${CYAN}🛡️  Background guards:${NC}"
  "$GUARDS_SCRIPT" start || true
  echo ""
fi

# Show quick commands
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 QUICK COMMANDS                                       ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  ${NC}ai-start <feature>     ${CYAN}Update evidence & start work${NC}     ${BLUE}║${NC}"
echo -e "${BLUE}║  ${NC}./scripts/hooks-system/bin/update-evidence.sh --auto --platforms <platforms>${CYAN}Autonomous refresh${NC} ${BLUE}║${NC}"
echo -e "${BLUE}║  ${NC}git status             ${CYAN}Check current changes${NC}           ${BLUE}║${NC}"
echo -e "${BLUE}║  ${NC}git log -3             ${CYAN}View recent commits${NC}             ${BLUE}║${NC}"
echo -e "${BLUE}║  ${NC}bash audit.sh          ${CYAN}Run full audit${NC}                  ${BLUE}║${NC}"
echo -e "${BLUE}║  ${NC}cat .violations-*      ${CYAN}View violations report${NC}          ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Auto-start watchdog (DISABLED - notifications were looping)
# WATCHDOG_PID_FILE="$REPO_ROOT/.ai-watchdog.pid"
# if [[ ! -f "$WATCHDOG_PID_FILE" ]]; then
#   echo -e "${CYAN}🐕 Starting AI Watchdog...${NC}"
#   bash "$REPO_ROOT/scripts/hooks-system/infrastructure/watchdog/ai-watchdog.sh" start 2>/dev/null || echo "   (fswatch not available)"
#   echo ""
# fi

# Show readiness
echo -e "${GREEN}✅ Session loaded - Ready to work!${NC}"
echo ""

# Reminder with exact command (only if evidence was stale)
if [[ $EVIDENCE_AGE -gt 180 ]]; then
  echo -e "${YELLOW}ℹ️  Evidence refreshed. You can start working!${NC}"
  echo -e "   ${CYAN}To manually refresh: ./scripts/hooks-system/bin/update-evidence.sh --auto --platforms <platforms>${NC}"
  echo -e "   ${CYAN}(alias: ai-start $CURRENT_BRANCH)${NC}"
elif [[ $EVIDENCE_AGE -gt 0 ]]; then
  echo -e "${GREEN}✅ Evidence is fresh - You can start working!${NC}"
fi
echo ""

# Return control to user's default shell (zsh)
exec "$SHELL"
