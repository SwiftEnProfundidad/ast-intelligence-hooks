#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AI Watchdog - Background File Monitor (Proactive)
# ═══════════════════════════════════════════════════════════════
# Monitors file changes and validates .AI_EVIDENCE.json freshness
# Usage: bash ai-watchdog.sh start|stop|status
#
# This runs in background and alerts BEFORE you commit if evidence
# is stale (>10 minutes old).
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paths
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"
WATCHDOG_PID_FILE="$REPO_ROOT/.ai-watchdog.pid"
WATCHDOG_LOG="$REPO_ROOT/.audit-reports/watchdog.log"

# Max evidence age (seconds)
MAX_EVIDENCE_AGE=180  # 3 minutes (configurable - adjust based on your workflow)

#───────────────────────────────────────────────────────────────
# Check if fswatch is installed
#───────────────────────────────────────────────────────────────
check_fswatch() {
  if ! command -v fswatch &> /dev/null; then
    echo -e "${YELLOW}⚠️  fswatch not installed${NC}"
    echo ""
    echo "Install with:"
    echo "  macOS: brew install fswatch"
    echo "  Linux: apt-get install fswatch"
    echo ""
    return 1
  fi
  return 0
}

#───────────────────────────────────────────────────────────────
# Check evidence freshness
#───────────────────────────────────────────────────────────────
check_evidence() {
  if [[ ! -f "$EVIDENCE_FILE" ]]; then
    echo -e "${RED}❌ .AI_EVIDENCE.json NOT FOUND${NC}"
    echo ""
    echo "Run: ai-start feature-name"
    echo ""
    return 1
  fi

  # Get evidence timestamp
  local evidence_ts=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "")

  if [[ -z "$evidence_ts" ]] || [[ "$evidence_ts" == "null" ]]; then
    echo -e "${RED}❌ Evidence missing timestamp${NC}"
    return 1
  fi

  # Convert to epoch (handle ISO 8601 with milliseconds)
  # Remove milliseconds if present: 2025-11-06T06:16:40.179Z → 2025-11-06T06:16:40Z
  local clean_ts=$(echo "$evidence_ts" | sed 's/\.[0-9]*Z$/Z/')
  local evidence_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$clean_ts" +%s 2>/dev/null || echo "0")
  local now_epoch=$(date +%s)
  local age=$((now_epoch - evidence_epoch))

  if [[ $age -gt $MAX_EVIDENCE_AGE ]]; then
    echo -e "${RED}❌ Evidence is STALE (${age}s old, max ${MAX_EVIDENCE_AGE}s)${NC}"
    echo ""
    echo "Run: ai-start feature-name"
    echo ""
    return 1
  fi

  echo -e "${GREEN}✅ Evidence fresh (${age}s old)${NC}"
  return 0
}

#───────────────────────────────────────────────────────────────
# Periodic check (runs every 30s)
#───────────────────────────────────────────────────────────────
periodic_check() {
  local last_notification=0
  local notification_cooldown=300  # Don't spam notifications (5 min cooldown)

  while true; do
    sleep 30

    if ! check_evidence >> "$WATCHDOG_LOG" 2>&1; then
      local now=$(date +%s)
      local time_since_last=$((now - last_notification))

      # Only send notification if cooldown expired
      if [[ $time_since_last -gt $notification_cooldown ]]; then
        # Get current branch for notification
        local current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")

        # Send notification (macOS)
        osascript -e "display notification \"Evidence is stale! Run: ai-start $current_branch\" with title \"🐕 AI Watchdog\" sound name \"Basso\"" 2>/dev/null || true

        echo "$(date): ALERT - Evidence stale (periodic check)" >> "$WATCHDOG_LOG"
        last_notification=$now
      fi
    fi
  done
}

#───────────────────────────────────────────────────────────────
# File change monitor (runs on file changes)
#───────────────────────────────────────────────────────────────
file_monitor() {
  # Watch for file changes in key directories
  fswatch -0 \
    --exclude '\.git/' \
    --exclude 'node_modules/' \
    --exclude '\.next/' \
    --exclude 'dist/' \
    --exclude '\.audit-reports/' \
    -e ".*" \
    -i "\\.ts$" \
    -i "\\.tsx$" \
    -i "\\.js$" \
    -i "\\.jsx$" \
    -i "\\.swift$" \
    -i "\\.kt$" \
    "$REPO_ROOT/apps/" \
    "$REPO_ROOT/CustomLintRules/" \
    "$REPO_ROOT/custom-lint-rules/" 2>/dev/null | \
  while read -d "" event; do
    # Log event
    echo "$(date): File changed: $event" >> "$WATCHDOG_LOG"

    # Check evidence freshness
    if ! check_evidence >> "$WATCHDOG_LOG" 2>&1; then
      # Get current branch for notification
      local current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")

      # Send notification (macOS)
      osascript -e "display notification \"Evidence is stale! Run: ai-start $current_branch\" with title \"🐕 AI Watchdog\" sound name \"Basso\"" 2>/dev/null || true

      echo "$(date): ALERT - Evidence stale (file change)" >> "$WATCHDOG_LOG"
    fi
  done
}

#───────────────────────────────────────────────────────────────
# Monitor function (runs both monitors in background)
#───────────────────────────────────────────────────────────────
monitor() {
  mkdir -p "$(dirname "$WATCHDOG_LOG")"

  echo "$(date): Watchdog started (PID $$)" >> "$WATCHDOG_LOG"
  echo "$(date): Starting periodic check (every 30s)..." >> "$WATCHDOG_LOG"
  echo "$(date): Starting file monitor..." >> "$WATCHDOG_LOG"

  # Start periodic check in background
  periodic_check &
  local periodic_pid=$!

  # Start file monitor (blocks here)
  file_monitor

  # If we reach here, file monitor died - kill periodic check
  kill $periodic_pid 2>/dev/null || true
}

#───────────────────────────────────────────────────────────────
# Start watchdog
#───────────────────────────────────────────────────────────────
start_watchdog() {
  if [[ -f "$WATCHDOG_PID_FILE" ]]; then
    local pid=$(cat "$WATCHDOG_PID_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
      echo -e "${YELLOW}⚠️  Watchdog already running (PID $pid)${NC}"
      return 0
    fi
  fi

  echo -e "${BLUE}🚀 Starting AI Watchdog...${NC}"

  if ! check_fswatch; then
    return 1
  fi

  # Start in background
  nohup bash "$0" _monitor > /dev/null 2>&1 &
  local pid=$!

  echo "$pid" > "$WATCHDOG_PID_FILE"

  echo -e "${GREEN}✅ Watchdog started (PID $pid)${NC}"
  echo ""
  echo "  Monitoring: apps/, CustomLintRules/, custom-lint-rules/"
  echo "  Log: .audit-reports/watchdog.log"
  echo ""
  echo "Stop with: bash $(basename "$0") stop"
}

#───────────────────────────────────────────────────────────────
# Stop watchdog
#───────────────────────────────────────────────────────────────
stop_watchdog() {
  if [[ ! -f "$WATCHDOG_PID_FILE" ]]; then
    echo -e "${YELLOW}⚠️  Watchdog not running${NC}"
    return 0
  fi

  local pid=$(cat "$WATCHDOG_PID_FILE")

  if ps -p "$pid" > /dev/null 2>&1; then
    echo -e "${BLUE}🛑 Stopping watchdog (PID $pid)...${NC}"
    kill "$pid" 2>/dev/null || true
    rm "$WATCHDOG_PID_FILE"
    echo -e "${GREEN}✅ Watchdog stopped${NC}"
  else
    echo -e "${YELLOW}⚠️  Watchdog not running (stale PID file)${NC}"
    rm "$WATCHDOG_PID_FILE"
  fi
}

#───────────────────────────────────────────────────────────────
# Show status
#───────────────────────────────────────────────────────────────
show_status() {
  echo -e "${BLUE}════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}🐕 AI WATCHDOG STATUS${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════${NC}"
  echo ""

  if [[ -f "$WATCHDOG_PID_FILE" ]]; then
    local pid=$(cat "$WATCHDOG_PID_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
      echo -e "  Status: ${GREEN}RUNNING${NC}"
      echo "  PID: $pid"
      echo "  Log: .audit-reports/watchdog.log"
      echo ""
      check_evidence
    else
      echo -e "  Status: ${RED}STOPPED${NC} (stale PID)"
      rm "$WATCHDOG_PID_FILE"
    fi
  else
    echo -e "  Status: ${RED}STOPPED${NC}"
  fi

  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════${NC}"
}

#───────────────────────────────────────────────────────────────
# Main
#───────────────────────────────────────────────────────────────
case "${1:-status}" in
  start)
    start_watchdog
    ;;
  stop)
    stop_watchdog
    ;;
  status)
    show_status
    ;;
  _monitor)
    # Internal: run monitor (called by start)
    monitor
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
