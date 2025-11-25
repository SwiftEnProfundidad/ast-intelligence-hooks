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
  head -20 "$SESSION_FILE" | grep -E "Sesión actual|Branch activo|Fase del plan|Progreso total|Violations.*restantes" | sed 's/^/   /' || true
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
if [[ -f "$EVIDENCE_FILE" ]]; then
  EVIDENCE_TS=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  if [[ -n "$EVIDENCE_TS" ]] && [[ "$EVIDENCE_TS" != "null" ]]; then
    # FIX: Remove milliseconds from ISO 8601 timestamp (2025-01-06T07:55:48.179Z -> 2025-01-06T07:55:48Z)
    CLEAN_TS=$(echo "$EVIDENCE_TS" | sed 's/\.[0-9]*Z$/Z/')
    EVIDENCE_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CLEAN_TS" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    AGE=$((NOW_EPOCH - EVIDENCE_EPOCH))

    if [[ $AGE -gt 180 ]]; then
      echo -e "${YELLOW}⚠️  Evidence is stale (${AGE}s old, max 3min)${NC}"
      echo -e "${YELLOW}   Run: ./scripts/hooks-system/bin/update-evidence.sh --auto --platforms <platforms>${NC}"
      echo -e "${YELLOW}   (alias corto: ai-start $CURRENT_BRANCH)${NC}"
      echo ""
    else
      echo -e "${GREEN}✅ Evidence fresh (${AGE}s old)${NC}"
      echo ""
    fi
  fi
fi

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

# Reminder with exact command
if [[ $AGE -gt 180 ]]; then
  echo -e "${YELLOW}Run this command to refresh evidence:${NC}"
  echo -e "   ${GREEN}./scripts/hooks-system/bin/update-evidence.sh --auto --platforms <platforms>${NC}"
  echo -e "   ${YELLOW}(alias: ai-start $CURRENT_BRANCH)${NC}"
else
  echo -e "${GREEN}Evidence is fresh - You can start working!${NC}"
  echo -e "   ${YELLOW}ℹ️  Usa ./scripts/hooks-system/bin/update-evidence.sh --auto --platforms <platforms> cuando necesites renovarla (alias: ai-start $CURRENT_BRANCH).${NC}"
fi
echo ""

# Return control to user's default shell (zsh)
exec "$SHELL"
