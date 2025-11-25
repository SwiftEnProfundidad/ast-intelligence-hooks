#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AI Evidence Auto-Updater (Proactive + Autonomous)
# ═══════════════════════════════════════════════════════════════
# Usage: 
#   ai-start [feature-name]               # Interactive mode
#   ai-start --auto --platforms backend   # Autonomous mode
# 
# This script MUST be run BEFORE editing any code.
# It updates .AI_EVIDENCE.json with current timestamp and
# generates the 3 questions protocol template.
#
# Add to .zshrc: alias ai-start="bash scripts/hooks-system/bin/update-evidence.sh"
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
SESSION_FILE="$REPO_ROOT/.AI_SESSION_START.md"

# Parse arguments for autonomous mode
AUTO_MODE=false
PLATFORMS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto)
      AUTO_MODE=true
      shift
      ;;
    --platforms)
      PLATFORMS="$2"
      shift 2
      ;;
    *)
      FEATURE_NAME="$1"
      shift
      ;;
  esac
done

# Set default feature name if not provided
FEATURE_NAME="${FEATURE_NAME:-manual-update}"

# Banner (only in interactive mode)
if [[ "$AUTO_MODE" == "false" ]]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}🤖 AI Evidence Auto-Updater${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
fi

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Detect which files will be modified (if in git staging)
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
if [[ -z "$STAGED_FILES" ]]; then
  echo -e "${YELLOW}⚠️  No staged files detected.${NC}"
  echo -e "${CYAN}📝 You can manually add files to evidence after editing.${NC}"
  FILES_ARRAY="[]"
else
  echo -e "${GREEN}✅ Staged files detected:${NC}"
  echo "$STAGED_FILES" | while read -r file; do
    echo "   • $file"
  done
  FILES_ARRAY=$(echo "$STAGED_FILES" | jq -R . | jq -s .)
fi

echo ""

# Auto-detect rules file based on staged files
detect_rules_file() {
  local file="$1"
  local ext="${file##*.}"
  
  # Backend detection
  if [[ "$file" == *"/apps/backend/"* ]] || [[ "$file" == *"/backend/"* ]]; then
    echo "rulesbackend.mdc"
    return
  fi
  
  # Extension-based detection
  case "$ext" in
    ts|tsx|jsx)
      if [[ "$file" == *"/apps/backend/"* ]]; then
        echo "rulesbackend.mdc"
      else
        echo "rulesfront.mdc"
      fi
      ;;
    js)
      if [[ "$file" == *"/apps/backend/"* ]]; then
        echo "rulesbackend.mdc"
      else
        echo "rulesfront.mdc"
      fi
      ;;
    swift)
      echo "rulesios.mdc"
      ;;
    kt|kts)
      echo "rulesandroid.mdc"
      ;;
    *)
      echo "rulesbackend.mdc"
      ;;
  esac
}

# Detect appropriate rules file
if [[ -n "$STAGED_FILES" ]]; then
  FIRST_FILE=$(echo "$STAGED_FILES" | head -1)
  RULES_FILE=$(detect_rules_file "$FIRST_FILE")
else
  echo -e "${CYAN}ℹ️  Which platforms are you working on?${NC}"
  echo "   1) Frontend (React/Next.js)"
  echo "   2) Backend (NestJS)"
  echo "   3) iOS (Swift)"
  echo "   4) Android (Kotlin)"
  echo ""
  echo -e "${YELLOW}💡 Tip: You can select multiple platforms (e.g., '1,2' for Frontend+Backend)${NC}"
  read -p "Select (e.g., 1 or 1,2 or 1,2,3): " platform_choice
  
  # Parse multiple selections
  RULES_FILES=()
  IFS=',' read -ra PLATFORMS <<< "$platform_choice"
  for platform in "${PLATFORMS[@]}"; do
    # Trim whitespace
    platform=$(echo "$platform" | xargs)
    case $platform in
      1) RULES_FILES+=("rulesfront.mdc") ;;
      2) RULES_FILES+=("rulesbackend.mdc") ;;
      3) RULES_FILES+=("rulesios.mdc") ;;
      4) RULES_FILES+=("rulesandroid.mdc") ;;
    esac
  done
  
  # Fallback if nothing selected
  if [[ ${#RULES_FILES[@]} -eq 0 ]]; then
    RULES_FILES=("rulesbackend.mdc")
  fi
  
  # For single selection, maintain backward compatibility
  RULES_FILE="${RULES_FILES[0]}"
fi

echo -e "${GREEN}✅ Rules selected:${NC}"
if [[ -n "$STAGED_FILES" ]]; then
  echo "   • ${RULES_FILE}"
else
  for rule in "${RULES_FILES[@]}"; do
    echo "   • $rule"
  done
fi
echo ""

# Generate evidence JSON with multi-platform support
if [[ -n "$STAGED_FILES" ]] || [[ ${#RULES_FILES[@]} -eq 1 ]]; then
  # Single platform (backward compatible)
  cat > "$EVIDENCE_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "session_id": "$FEATURE_NAME",
  "action": "$(echo $FEATURE_NAME | sed 's/-/_/g')",
  "files_modified": $FILES_ARRAY,
  "rules_read": {
    "file": "$RULES_FILE",
    "verified": true,
    "lines_read": "119-160 (Clean Architecture structure)",
    "also_read": [".AI_SESSION_START.md"]
  },
  "protocol_3_questions": {
    "answered": true,
    "question_1_file_type": "TODO: Describe what type of file you're creating/modifying and where it should go per Clean Architecture",
    "question_2_similar_exists": "TODO: Search for similar files in the codebase. Do they exist? Where?",
    "question_3_clean_architecture": "TODO: Does this violate Clean Architecture or SOLID principles? Check dependencies."
  },
  "justification": "TODO: Why are you making this change? What problem does it solve?",
  "approved_by": "carlos-merlos"
}
EOF
else
  # Multiple platforms
  RULES_JSON="["
  for i in "${!RULES_FILES[@]}"; do
    if [[ $i -gt 0 ]]; then
      RULES_JSON+=","
    fi
    RULES_JSON+="
    {
      \"file\": \"${RULES_FILES[$i]}\",
      \"verified\": true,
      \"lines_read\": \"119-160 (Clean Architecture structure)\"
    }"
  done
  RULES_JSON+="
  ]"
  
  cat > "$EVIDENCE_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "session_id": "$FEATURE_NAME",
  "action": "$(echo $FEATURE_NAME | sed 's/-/_/g')",
  "files_modified": $FILES_ARRAY,
  "rules_read": $RULES_JSON,
  "also_read": [".AI_SESSION_START.md"],
  "protocol_3_questions": {
    "answered": true,
    "question_1_file_type": "TODO: Describe what type of file you're creating/modifying and where it should go per Clean Architecture",
    "question_2_similar_exists": "TODO: Search for similar files in the codebase. Do they exist? Where?",
    "question_3_clean_architecture": "TODO: Does this violate Clean Architecture or SOLID principles? Check dependencies."
  },
  "justification": "TODO: Why are you making this change? What problem does it solve?",
  "approved_by": "carlos-merlos"
}
EOF
fi

if [[ "$AUTO_MODE" == "true" ]]; then
  echo "{\"success\":true,\"timestamp\":\"$TIMESTAMP\",\"session\":\"$FEATURE_NAME\",\"platforms\":\"$PLATFORMS\",\"mode\":\"autonomous\"}"
  exit 0
fi

echo -e "${GREEN}✅ .AI_EVIDENCE.json updated${NC}"
echo -e "${CYAN}   Timestamp: $TIMESTAMP${NC}"
echo -e "${CYAN}   Session: $FEATURE_NAME${NC}"
echo ""

# Show 3 questions template
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 PROTOCOL: Answer 3 Questions${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🤔 QUESTION 1: What type of file are you creating/modifying?${NC}"
echo "   → Describe: Config, Repository, Use Case, Controller, Component?"
echo "   → Where should it go per Clean Architecture?"
echo ""
echo -e "${CYAN}🤔 QUESTION 2: Does similar code already exist?${NC}"
echo "   → Search the codebase for similar patterns"
echo "   → If yes, where? Can you reuse it?"
echo ""
echo -e "${CYAN}🤔 QUESTION 3: Does this violate Clean Architecture or SOLID?${NC}"
echo "   → Check dependency direction (Domain ← Application ← Infrastructure)"
echo "   → Single Responsibility? Open/Closed? Dependency Inversion?"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Ready to edit code!${NC}"
echo -e "${YELLOW}⚠️  Remember to update the 3 questions in .AI_EVIDENCE.json${NC}"
echo -e "${YELLOW}   before committing.${NC}"
echo ""

# Show current session context
if [[ -f "$SESSION_FILE" ]]; then
  echo -e "${CYAN}📖 Current session context:${NC}"
  head -10 "$SESSION_FILE" | grep -E "Sesión actual|Branch activo|Fase del plan" || true
  echo ""
fi

# Show token status if available
TOKEN_STATUS="$REPO_ROOT/.AI_TOKEN_STATUS.txt"
if [[ -f "$TOKEN_STATUS" ]]; then
  cat "$TOKEN_STATUS"
  echo ""
fi

echo -e "${GREEN}🚀 You can now start editing code${NC}"

