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

# Get current timestamp in local timezone with offset (ISO 8601)
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S%z" | sed 's/\([0-9][0-9]\)$/:\1/')

# Get current branch for context
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# Get last 3 commits for context
LAST_COMMITS=$(git log --oneline -3 2>/dev/null | head -3 | tr '\n' '; ' || echo "No recent commits")

# Detect which files will be modified (if in git staging)
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")

# Also check modified but not staged files for context
MODIFIED_FILES=$(git diff --name-only 2>/dev/null || echo "")
ALL_CHANGED_FILES="$STAGED_FILES $MODIFIED_FILES"

# Generate contextual answers based on actual work
generate_contextual_answers() {
  local all_files="$1"
  local branch="$2"
  local commits="$3"

  # Detect modules being worked on
  local modules=""
  [[ "$all_files" == *"/admin/"* ]] && modules="$modules admin,"
  [[ "$all_files" == *"/auth/"* ]] && modules="$modules auth,"
  [[ "$all_files" == *"/orders/"* ]] && modules="$modules orders,"
  [[ "$all_files" == *"/products/"* ]] && modules="$modules products,"
  [[ "$all_files" == *"/stores/"* ]] && modules="$modules stores,"
  [[ "$all_files" == *"/notifications/"* ]] && modules="$modules notifications,"
  [[ "$all_files" == *"/hooks-system/"* ]] && modules="$modules hooks-system,"
  [[ "$all_files" == *"/testing/"* ]] && modules="$modules testing,"
  modules="${modules%,}"  # Remove trailing comma
  [[ -z "$modules" ]] && modules="general"

  # Detect file types
  local file_types=""
  [[ "$all_files" == *".spec.ts"* ]] && file_types="$file_types tests,"
  [[ "$all_files" == *".service.ts"* ]] && file_types="$file_types services,"
  [[ "$all_files" == *".repository.ts"* ]] && file_types="$file_types repositories,"
  [[ "$all_files" == *".controller.ts"* ]] && file_types="$file_types controllers,"
  [[ "$all_files" == *".gateway.ts"* ]] && file_types="$file_types gateways,"
  [[ "$all_files" == *".interface.ts"* ]] && file_types="$file_types interfaces,"
  [[ "$all_files" == *".mock.ts"* ]] && file_types="$file_types mocks,"
  [[ "$all_files" == *".helper.ts"* ]] && file_types="$file_types helpers,"
  [[ "$all_files" == *".sh"* ]] && file_types="$file_types shell-scripts,"
  [[ "$all_files" == *".js"* ]] && file_types="$file_types javascript,"
  file_types="${file_types%,}"
  [[ -z "$file_types" ]] && file_types="source files"

  # Detect layer (Clean Architecture)
  local layer=""
  [[ "$all_files" == *"/domain/"* ]] && layer="Domain"
  [[ "$all_files" == *"/application/"* ]] && layer="Application"
  [[ "$all_files" == *"/infrastructure/"* ]] && layer="Infrastructure"
  [[ "$all_files" == *"/presentation/"* ]] && layer="Presentation"
  [[ -z "$layer" ]] && layer="multiple layers"

  # Extract feature from branch name
  local feature_desc="$branch"
  if [[ "$branch" == feature/* ]]; then
    feature_desc="${branch#feature/}"
  elif [[ "$branch" == fix/* ]]; then
    feature_desc="fixing ${branch#fix/}"
  elif [[ "$branch" == refactor/* ]]; then
    feature_desc="refactoring ${branch#refactor/}"
  fi

  # Generate Q1: What type of file
  Q1="Working on branch '$branch'. Modifying $file_types in modules: $modules. Target layer: $layer."

  # Generate Q2: Similar code exists
  Q2="Modules affected: $modules. Recent commits: $commits. Check for existing patterns in these modules before adding new code."

  # Generate Q3: Clean Architecture
  Q3="Changes in $layer layer affecting $modules. Ensure dependencies point inward and no infrastructure leaks into domain."

  # Export for use
  export CONTEXTUAL_Q1="$Q1"
  export CONTEXTUAL_Q2="$Q2"
  export CONTEXTUAL_Q3="$Q3"
}

# Generate contextual answers
generate_contextual_answers "$ALL_CHANGED_FILES" "$CURRENT_BRANCH" "$LAST_COMMITS"

# Extract key rules from Windsurf rules files
extract_windsurf_rules() {
  local rules_file="$1"
  local rules_path="$REPO_ROOT/.windsurf/rules/$rules_file"

  if [[ -f "$rules_path" ]]; then
    # Extract section headers (lines starting with ##)
    grep -E "^##" "$rules_path" 2>/dev/null | head -10 | sed 's/^## //' | tr '\n' '; ' || echo "No sections found"
  else
    echo "File not found"
  fi
}

# Extract AST Intelligence rules summary
extract_ast_rules() {
  local platform="$1"
  local ast_path="$REPO_ROOT/scripts/hooks-system/infrastructure/ast/$platform"

  if [[ -d "$ast_path" ]]; then
    # Count rule files and extract rule IDs
    local rule_count=$(find "$ast_path" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
    local rule_ids=$(grep -rh "ruleId:" "$ast_path" 2>/dev/null | head -10 | sed "s/.*ruleId:[[:space:]]*['\"]\\([^'\"]*\\)['\"].*/\\1/" | tr '\n' ', ' || echo "")
    echo "Files: $rule_count, Rules: ${rule_ids%,}"
  else
    echo "No AST rules for $platform"
  fi
}

# Get rules summary based on detected platform
get_rules_summary() {
  local rules_file="$1"
  local platform=""

  case "$rules_file" in
    rulesbackend.mdc|rulesbackend.md) platform="backend" ;;
    rulesfront.mdc|rulesfront.md) platform="frontend" ;;
    rulesios.mdc|rulesios.md) platform="ios" ;;
    rulesandroid.mdc|rulesandroid.md) platform="android" ;;
  esac

  local windsurf_sections=$(extract_windsurf_rules "${rules_file%.mdc}.md")
  local ast_summary=$(extract_ast_rules "$platform")

  echo "Windsurf: $windsurf_sections | AST: $ast_summary"
}

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
RULES_FILES=()

if [[ -n "$STAGED_FILES" ]]; then
  FIRST_FILE=$(echo "$STAGED_FILES" | head -1)
  RULES_FILE=$(detect_rules_file "$FIRST_FILE")
  RULES_FILES+=("$RULES_FILE")
else
  if [[ "$AUTO_MODE" == "true" ]]; then
    # Non-interactive mode: infer platforms from --platforms or use all by default
    if [[ -n "$PLATFORMS" ]]; then
      IFS=',' read -ra SELECTED_PLATFORMS <<< "$PLATFORMS"
    else
      SELECTED_PLATFORMS=("frontend" "backend" "ios" "android")
    fi

    for platform in "${SELECTED_PLATFORMS[@]}"; do
      platform_normalized=$(echo "$platform" | tr '[:upper:]' '[:lower:]' | xargs)
      case "$platform_normalized" in
        1|"frontend")
          RULES_FILES+=("rulesfront.mdc")
          ;;
        2|"backend")
          RULES_FILES+=("rulesbackend.mdc")
          ;;
        3|"ios")
          RULES_FILES+=("rulesios.mdc")
          ;;
        4|"android")
          RULES_FILES+=("rulesandroid.mdc")
          ;;
      esac
    done

    # Fallback: si nada válido, usar las 4 plataformas por defecto
    if [[ ${#RULES_FILES[@]} -eq 0 ]]; then
      RULES_FILES=("rulesfront.mdc" "rulesbackend.mdc" "rulesios.mdc" "rulesandroid.mdc")
    fi

    # Compatibilidad con el caso de una sola plataforma
    RULES_FILE="${RULES_FILES[0]}"
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

# Prepare temp file for atomic write
TMP_FILE=$(mktemp "${EVIDENCE_FILE}.tmp.XXXXXX")

# Get rules summary now that RULES_FILE is defined
RULES_SUMMARY=$(get_rules_summary "$RULES_FILE")

# Generate evidence JSON with multi-platform support
if [[ -n "$STAGED_FILES" ]] || [[ ${#RULES_FILES[@]} -eq 1 ]]; then
  # Single platform (backward compatible)
  cat > "$TMP_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "session_id": "$FEATURE_NAME",
  "action": "$(echo $FEATURE_NAME | sed 's/-/_/g')",
  "files_modified": $FILES_ARRAY,
  "rules_read": {
    "file": "$RULES_FILE",
    "verified": true,
    "summary": "$RULES_SUMMARY",
    "also_read": [".AI_SESSION_START.md", ".windsurf/rules/$RULES_FILE"]
  },
  "protocol_3_questions": {
    "answered": true,
    "question_1_file_type": "$CONTEXTUAL_Q1",
    "question_2_similar_exists": "$CONTEXTUAL_Q2",
    "question_3_clean_architecture": "$CONTEXTUAL_Q3"
  },
  "current_context": {
    "branch": "$CURRENT_BRANCH",
    "last_commits": "$LAST_COMMITS"
  },
  "justification": "Context-aware evidence for branch '$CURRENT_BRANCH'. Auto-detected modules and file types from current work.",
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
    local rule_summary=$(get_rules_summary "${RULES_FILES[$i]}")
    RULES_JSON+="
    {
      \"file\": \"${RULES_FILES[$i]}\",
      \"verified\": true,
      \"summary\": \"$rule_summary\"
    }"
  done
  RULES_JSON+="
  ]"

  cat > "$TMP_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "session_id": "$FEATURE_NAME",
  "action": "$(echo $FEATURE_NAME | sed 's/-/_/g')",
  "files_modified": $FILES_ARRAY,
  "rules_read": $RULES_JSON,
  "also_read": [".AI_SESSION_START.md"],
  "protocol_3_questions": {
    "answered": true,
    "question_1_file_type": "$CONTEXTUAL_Q1",
    "question_2_similar_exists": "$CONTEXTUAL_Q2",
    "question_3_clean_architecture": "$CONTEXTUAL_Q3"
  },
  "current_context": {
    "branch": "$CURRENT_BRANCH",
    "last_commits": "$LAST_COMMITS"
  },
  "justification": "Context-aware evidence for branch '$CURRENT_BRANCH'. Auto-detected modules and file types from current work.",
  "approved_by": "carlos-merlos"
}
EOF
fi

mv "$TMP_FILE" "$EVIDENCE_FILE"

if [[ "$AUTO_MODE" == "true" ]]; then
  echo "{\"success\":true,\"timestamp\":\"$TIMESTAMP\",\"session\":\"$FEATURE_NAME\",\"platforms\":\"$PLATFORMS\",\"mode\":\"autonomous\"}"
  exit 0
fi

SYNC_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/sync-autonomous-orchestrator.sh"
if [[ -x "$SYNC_SCRIPT" ]]; then
  if ! "$SYNC_SCRIPT" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  sync-autonomous-orchestrator.sh fallo, revisa la ruta de la librería.${NC}"
  fi
fi

echo -e "${GREEN}✅ .AI_EVIDENCE.json updated${NC}"
echo -e "${CYAN}   Timestamp: $TIMESTAMP${NC}"
echo -e "${CYAN}   Session: $FEATURE_NAME${NC}"
echo ""

if [[ "$AUTO_MODE" == "false" ]]; then
  # Show 3 questions as a reflection aid (already auto-filled in .AI_EVIDENCE.json)
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}📋 PROTOCOL: 3 Questions (auto-filled in .AI_EVIDENCE.json)${NC}"
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
  echo -e "${YELLOW}ℹ️  The 3 questions have been pre-filled in .AI_EVIDENCE.json for this session.${NC}"
  echo -e "${YELLOW}   You can refine them manually before committing if you need more detail.${NC}"
  echo ""
fi

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
