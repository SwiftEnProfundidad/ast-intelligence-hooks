#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AI Token Tracker - Monitor Cursor token usage and warn on limits
# ═══════════════════════════════════════════════════════════════
# This script tracks token usage in the current AI session and
# warns when approaching the 1M token limit.
#
# Triggered by:
# - session-loader.sh (on startup)
# - update-evidence.sh (after each evidence update)
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
TOKEN_USAGE_LOG="$REPO_ROOT/.audit_tmp/token-usage.jsonl"
SESSION_FILE="$REPO_ROOT/.AI_SESSION_START.md"

# Constants
MAX_TOKENS=1000000
WARNING_THRESHOLD_85=850000
WARNING_THRESHOLD_90=900000
CRITICAL_THRESHOLD_95=950000

#───────────────────────────────────────────────────────────────
# Get current token count from Cursor (estimation)
#───────────────────────────────────────────────────────────────
get_token_estimate() {
  # Heuristic: Count tokens based on:
  # 1. Lines in .AI_SESSION_START.md (context loaded)
  # 2. Recent files edited
  # 3. Recent commits
  
  local base_context=50000 # Baseline for rules, memories, etc.
  local session_tokens=0
  local file_tokens=0
  local commit_tokens=0
  
  # Session context tokens (1 line ≈ 10 tokens)
  if [[ -f "$SESSION_FILE" ]]; then
    local session_lines=$(wc -l < "$SESSION_FILE" 2>/dev/null || echo "0")
    session_tokens=$((session_lines * 10))
  fi
  
  # Recent files edited (estimate from git log)
  local files_changed=$(git diff --name-only HEAD~10..HEAD 2>/dev/null | wc -l || echo "0")
  file_tokens=$((files_changed * 500)) # Assume 500 tokens per file changed
  
  # Recent commits (1 commit ≈ 200 tokens)
  local commits=$(git log --oneline -50 2>/dev/null | wc -l || echo "0")
  commit_tokens=$((commits * 200))
  
  # Total estimate
  local total=$((base_context + session_tokens + file_tokens + commit_tokens))
  
  echo "$total"
}

#───────────────────────────────────────────────────────────────
# Calculate percentage used
#───────────────────────────────────────────────────────────────
calculate_percentage() {
  local used=$1
  local max=$2
  
  # Use bc for floating point division
  local percent=$(echo "scale=2; ($used * 100) / $max" | bc 2>/dev/null || echo "0")
  
  echo "$percent"
}

#───────────────────────────────────────────────────────────────
# Get status color and emoji
#───────────────────────────────────────────────────────────────
get_status_indicator() {
  local used=$1
  local percent=$2
  
  if [[ $used -ge $CRITICAL_THRESHOLD_95 ]]; then
    echo "${RED}🔴 CRITICAL${NC}"
  elif [[ $used -ge $WARNING_THRESHOLD_90 ]]; then
    echo "${RED}⚠️  DANGER${NC}"
  elif [[ $used -ge $WARNING_THRESHOLD_85 ]]; then
    echo "${YELLOW}⚠️  WARNING${NC}"
  elif [[ $used -ge 500000 ]]; then
    echo "${CYAN}📊 MODERATE${NC}"
  else
    echo "${GREEN}✅ HEALTHY${NC}"
  fi
}

#───────────────────────────────────────────────────────────────
# Get recommendation message
#───────────────────────────────────────────────────────────────
get_recommendation() {
  local used=$1
  
  if [[ $used -ge $CRITICAL_THRESHOLD_95 ]]; then
    echo "🚨 URGENT: Start new session NOW to avoid context loss"
  elif [[ $used -ge $WARNING_THRESHOLD_90 ]]; then
    echo "⚠️  Consider wrapping up and starting new session soon"
  elif [[ $used -ge $WARNING_THRESHOLD_85 ]]; then
    echo "📝 Plan to conclude work in this session within 1-2 hours"
  else
    echo "Continue working normally"
  fi
}

#───────────────────────────────────────────────────────────────
# Update token status file
#───────────────────────────────────────────────────────────────
update_token_status() {
  local tokens_used=$1
  local percent=$2
  local status=$3
  local recommendation=$4
  
  cat > "$TOKEN_STATUS_FILE" <<EOF
═══════════════════════════════════════════════════════════
🔋 AI TOKEN STATUS
═══════════════════════════════════════════════════════════

Status:     $status
Used:       ${tokens_used} / ${MAX_TOKENS} tokens (${percent}%)
Remaining:  $((MAX_TOKENS - tokens_used)) tokens

Recommendation:
  $recommendation

Last updated: $(date '+%Y-%m-%d %H:%M:%S')
═══════════════════════════════════════════════════════════
EOF
}

#───────────────────────────────────────────────────────────────
# Log token usage to JSONL
#───────────────────────────────────────────────────────────────
log_token_usage() {
  local tokens_used=$1
  local percent=$2
  
  mkdir -p "$(dirname "$TOKEN_USAGE_LOG")"
  
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local session_id=$(git branch --show-current 2>/dev/null || echo "unknown")
  
  # Append to JSONL
  cat >> "$TOKEN_USAGE_LOG" <<EOF
{"timestamp":"$timestamp","session":"$session_id","tokensUsed":$tokens_used,"maxTokens":$MAX_TOKENS,"percentUsed":$percent}
EOF
}

#───────────────────────────────────────────────────────────────
# Main execution
#───────────────────────────────────────────────────────────────
main() {
  # Get current token estimate
  local tokens_used=$(get_token_estimate)
  
  # Calculate percentage
  local percent=$(calculate_percentage "$tokens_used" "$MAX_TOKENS")
  
  # Get status indicator
  local status=$(get_status_indicator "$tokens_used" "$percent")
  
  # Get recommendation
  local recommendation=$(get_recommendation "$tokens_used")
  
  # Update status file
  update_token_status "$tokens_used" "$percent" "$status" "$recommendation"
  
  # Log to JSONL
  log_token_usage "$tokens_used" "$percent"
  
  # Print to console
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}🔋 Token Status:${NC} $status"
  echo -e "${CYAN}   Used:${NC} ${tokens_used} / ${MAX_TOKENS} (${percent}%)"
  echo -e "${CYAN}   Remaining:${NC} $((MAX_TOKENS - tokens_used)) tokens"
  echo ""
  echo -e "${YELLOW}💡 Recommendation:${NC}"
  echo -e "   $recommendation"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  # Return exit code based on status
  if [[ $tokens_used -ge $CRITICAL_THRESHOLD_95 ]]; then
    return 2 # Critical
  elif [[ $tokens_used -ge $WARNING_THRESHOLD_85 ]]; then
    return 1 # Warning
  else
    return 0 # OK
  fi
}

# Execute
main "$@"

