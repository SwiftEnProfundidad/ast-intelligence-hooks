#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Kill MCP Zombie Processes
# ═══════════════════════════════════════════════════════════════
# Kills any orphaned mcp-ai-evidence-watcher processes
# Run before opening Cursor if you see zombie processes
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧟 Searching for zombie MCP processes...${NC}"
echo ""

# Find all MCP-related processes
PIDS=$( (
  pgrep -f "mcp-ai-evidence-watcher" || true
  pgrep -f "scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation\.js" || true
  pgrep -f "update-evidence\.sh.*--auto.*--refresh-only" || true
) | sort -u || true )

if [[ -z "$PIDS" ]]; then
  echo -e "${GREEN}✅ No zombie processes found!${NC}"
  exit 0
fi

# Count processes
COUNT=$(echo "$PIDS" | wc -l | tr -d ' ')
echo -e "${RED}❌ Found $COUNT zombie process(es):${NC}"
echo ""

# Show process details
echo "$PIDS" | while read -r pid; do
  ps -p "$pid" -o pid,command || true
done

echo ""
echo -e "${YELLOW}🔪 Killing zombie processes...${NC}"

# Kill processes
echo "$PIDS" | while read -r pid; do
  kill -9 "$pid" 2>/dev/null || true
  echo -e "   ${GREEN}✓${NC} Killed PID $pid"
done

echo ""
echo -e "${GREEN}✅ All zombie processes terminated!${NC}"
echo -e "${YELLOW}ℹ️  Safe to restart Cursor now${NC}"
