#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AI Token Monitor (Continuous Feedback)
# ═══════════════════════════════════════════════════════════════
# Tracks token consumption and alerts when approaching limit
# Called from: post-commit hook
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
TOKEN_STATUS_FILE="$REPO_ROOT/.AI_TOKEN_STATUS.txt"
TOKEN_LOG_FILE="$REPO_ROOT/.audit-reports/token-usage.log"

# Token limits
TOKEN_LIMIT=1000000
TOKEN_WARNING_THRESHOLD=900000  # 90%
TOKEN_ALERT_THRESHOLD=950000     # 95%

# Estimate tokens from recent activity
estimate_tokens() {
  local commits_count=$(git rev-list --count HEAD --since="1 hour ago" 2>/dev/null || echo "1")
  local files_modified=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | wc -l || echo "5")
  
  # Rough estimation: 
  # - Each commit ~10K tokens (reads, writes, analysis)
  # - Each file modified ~2K tokens
  # - Base session overhead ~5K tokens
  
  local estimated=$((commits_count * 10000 + files_modified * 2000 + 5000))
  echo $estimated
}

# Get cumulative tokens from log
get_cumulative_tokens() {
  if [[ -f "$TOKEN_LOG_FILE" ]]; then
    local last_session=$(tail -1 "$TOKEN_LOG_FILE" | cut -d'|' -f3)
    echo "${last_session:-0}"
  else
    echo "0"
  fi
}

# Log token usage
log_tokens() {
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local tokens="$1"
  
  mkdir -p "$(dirname "$TOKEN_LOG_FILE")"
  echo "${timestamp}|$(git rev-parse --short HEAD 2>/dev/null)||${tokens}" >> "$TOKEN_LOG_FILE"
}

# Main logic
ESTIMATED_TOKENS=$(estimate_tokens)
CUMULATIVE_TOKENS=$(get_cumulative_tokens)
NEW_TOTAL=$((CUMULATIVE_TOKENS + ESTIMATED_TOKENS))

# Log this session
log_tokens "$NEW_TOTAL"

# Calculate percentages
PERCENT=$((NEW_TOTAL * 100 / TOKEN_LIMIT))
REMAINING=$((TOKEN_LIMIT - NEW_TOTAL))

# Determine alert level
if [[ $NEW_TOTAL -ge $TOKEN_ALERT_THRESHOLD ]]; then
  ALERT_LEVEL="CRITICAL"
  COLOR=$RED
elif [[ $NEW_TOTAL -ge $TOKEN_WARNING_THRESHOLD ]]; then
  ALERT_LEVEL="WARNING"
  COLOR=$YELLOW
else
  ALERT_LEVEL="OK"
  COLOR=$GREEN
fi

# Generate status file
cat > "$TOKEN_STATUS_FILE" <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔋 TOKEN USAGE - Current Session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: $ALERT_LEVEL
Tokens Used: $(printf "%'d" $NEW_TOTAL) / $(printf "%'d" $TOKEN_LIMIT) ($PERCENT%)
Remaining: $(printf "%'d" $REMAINING) tokens

EOF

if [[ "$ALERT_LEVEL" == "CRITICAL" ]]; then
  cat >> "$TOKEN_STATUS_FILE" <<EOF
🚨 CRITICAL: Approaching token limit!
   → Save your work and prepare for context switch
   → Context will reset at $TOKEN_LIMIT tokens
   → Current progress will be saved to .AI_SESSION_START.md

EOF
elif [[ "$ALERT_LEVEL" == "WARNING" ]]; then
  cat >> "$TOKEN_STATUS_FILE" <<EOF
⚠️  WARNING: High token usage
   → You have ~$(printf "%'d" $REMAINING) tokens remaining
   → Consider wrapping up current task
   → Major refactors may require new context

EOF
else
  cat >> "$TOKEN_STATUS_FILE" <<EOF
✅ Token usage healthy
   → Continue working normally
   → Will alert at 900K tokens (90%)

EOF
fi

cat >> "$TOKEN_STATUS_FILE" <<EOF
Last updated: $(date +"%Y-%m-%d %H:%M:%S")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

# Display banner in terminal
echo ""
echo -e "${COLOR}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${COLOR}🔋 TOKEN MONITOR${NC}"
echo -e "${COLOR}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Status: ${COLOR}${ALERT_LEVEL}${NC}"
echo -e "  Used: $(printf "%'d" $NEW_TOTAL) / $(printf "%'d" $TOKEN_LIMIT) (${PERCENT}%)"
echo -e "  Remaining: ${COLOR}$(printf "%'d" $REMAINING)${NC} tokens"
echo ""

if [[ "$ALERT_LEVEL" == "CRITICAL" ]]; then
  echo -e "${RED}🚨 CRITICAL: Approaching limit! Prepare for context switch.${NC}"
elif [[ "$ALERT_LEVEL" == "WARNING" ]]; then
  echo -e "${YELLOW}⚠️  WARNING: High usage. Consider wrapping up.${NC}"
fi

echo -e "${COLOR}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Exit with appropriate code
if [[ "$ALERT_LEVEL" == "CRITICAL" ]]; then
  exit 2  # Critical warning
elif [[ "$ALERT_LEVEL" == "WARNING" ]]; then
  exit 1  # Warning
else
  exit 0  # OK
fi

