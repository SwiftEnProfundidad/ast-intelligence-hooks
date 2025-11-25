#!/usr/bin/env bash
# =============================================================================
# AI Protocol Validator
# =============================================================================
# Purpose: Ensure AI reads .mdc rules before creating/modifying files
# Author: Carlos Merlos
# Version: 1.0.0
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)"
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🤖 AI Protocol Validator${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# =============================================================================
# Helper Functions
# =============================================================================

# Convert UTC timestamp to epoch seconds (macOS compatible)
utc_to_epoch() {
  local timestamp="$1"
  # Use TZ=UTC to force UTC interpretation
  if command -v gdate >/dev/null 2>&1; then
    # GNU date (if installed via homebrew)
    TZ=UTC gdate -d "$timestamp" +%s 2>/dev/null || echo "0"
  else
    # macOS date - force UTC timezone (handle ISO 8601 with milliseconds)
    local clean_ts=$(echo "$timestamp" | sed 's/\.[0-9]*Z$/Z/')
    TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%SZ" "$clean_ts" +%s 2>/dev/null || echo "0"
  fi
}

# Get current epoch in UTC
current_epoch_utc() {
  if command -v gdate >/dev/null 2>&1; then
    TZ=UTC gdate +%s
  else
    TZ=UTC date +%s
  fi
}

# =============================================================================
# Validation Functions
# =============================================================================

validate_evidence_exists() {
  if [[ ! -f "$EVIDENCE_FILE" ]]; then
    echo -e "${RED}❌ CRITICAL: .AI_EVIDENCE.json NOT FOUND${NC}"
    echo ""
    echo -e "${YELLOW}The AI must update .AI_EVIDENCE.json BEFORE editing files.${NC}"
    echo ""
    echo -e "${CYAN}This ensures the AI:${NC}"
    echo -e "  1. Reads .mdc rules (rulesfront.mdc, rulesback.mdc, etc.)"
    echo -e "  2. Answers 3 questions (file type, similar files, Clean Architecture)"
    echo -e "  3. Shows analysis to user BEFORE implementing"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  return 0
}

validate_json_format() {
  if ! jq empty "$EVIDENCE_FILE" 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: .AI_EVIDENCE.json has INVALID JSON${NC}"
    echo ""
    echo -e "${YELLOW}Fix JSON syntax errors first.${NC}"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  return 0
}

validate_timestamp() {
  local timestamp
  timestamp=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  
  if [[ -z "$timestamp" ]] || [[ "$timestamp" == "null" ]] || [[ "$timestamp" == "" ]]; then
    echo -e "${RED}❌ CRITICAL: .AI_EVIDENCE.json has NO timestamp${NC}"
    echo ""
    echo -e "${YELLOW}The AI must update timestamp when filling the protocol.${NC}"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  
  # Check if timestamp is recent (within last 5 seconds - MAXIMUM STRICT)
  local evidence_epoch
  local current_epoch
  local diff_seconds
  
  evidence_epoch=$(utc_to_epoch "$timestamp")
  current_epoch=$(current_epoch_utc)
  diff_seconds=$((current_epoch - evidence_epoch))
  
  if [[ "$evidence_epoch" == "0" ]]; then
    echo -e "${YELLOW}⚠️  Could not parse timestamp (skipping age check)${NC}"
    return 0
  fi
  
  # Atomic commit workflow: Evidence must be fresh (180 seconds = 3 minutes)
  if [[ $diff_seconds -gt 180 ]]; then
    echo -e "${RED}❌ CRITICAL: .AI_EVIDENCE.json is TOO OLD (${diff_seconds}s ago, >180sec)${NC}"
    echo ""
    echo -e "${YELLOW}🚨 ATOMIC COMMIT MODE (3min window): Update evidence before each atomic commit${NC}"
    echo -e "${YELLOW}   Old evidence = AI did NOT follow 'Read Rules → Answer 3 Questions → Code' protocol${NC}"
    echo ""
    echo -e "${CYAN}Timestamp: $timestamp${NC}"
    echo -e "${CYAN}Age: $((diff_seconds / 60)) minutes $((diff_seconds % 60)) seconds${NC}"
    echo ""
    echo -e "${CYAN}Required workflow:${NC}"
    echo -e "  1. Read .mdc rules file${NC}"
    echo -e "  2. Update .AI_EVIDENCE.json with timestamp + 3 questions${NC}"
    echo -e "  3. Show analysis to user${NC}"
    echo -e "  4. ONLY THEN edit files${NC}"
    echo ""
    echo -e "${RED}→ Commit BLOCKED - Update .AI_EVIDENCE.json NOW${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✅ Timestamp valid (${diff_seconds}s ago)${NC}"
  return 0
}

detect_platform_for_file() {
  local file="$1"
  local ext="${file##*.}"
  local filename=$(basename "$file")
  
  # Check directory first for accurate platform detection
  if [[ "$file" =~ apps/backend/ ]] || [[ "$file" =~ src/.*/backend/ ]]; then
    # Backend files (NestJS)
    echo "rulesbackend.mdc"
    return
  fi
  
  case "$ext" in
    ts|tsx|jsx)
      # Frontend files (React/Next.js)
      echo "rulesfront.mdc"
      ;;
    js)
      # JavaScript - default to frontend unless in backend dir (already checked above)
      echo "rulesfront.mdc"
      ;;
    swift)
      echo "rulesios.mdc"
      ;;
    kt|kts)
      echo "rulesandroid.mdc"
      ;;
    sh|bash)
      # Shell scripts - use backend rules (infrastructure layer)
      echo "rulesbackend.mdc"
      ;;
    *)
      # Unknown - return empty (will be ignored)
      echo ""
      ;;
  esac
}

validate_rules_read() {
  local rules_files=""
  local rules_verified
  
  # Support BOTH formats: string (legacy) or array (multi-platform)
  # Try array first
  local is_array=$(jq -r 'if (.rules_read | type) == "array" then "true" else "false" end' "$EVIDENCE_FILE" 2>/dev/null || echo "false")
  
  if [[ "$is_array" == "true" ]]; then
    # New format: array of {file, verified, lines_read}
    rules_files=$(jq -r '.rules_read[].file' "$EVIDENCE_FILE" 2>/dev/null | tr '\n' ' ')
    rules_verified=$(jq -r 'all(.rules_read[]; .verified == true)' "$EVIDENCE_FILE" 2>/dev/null || echo "false")
  else
    # Legacy format: {file, verified, lines_read}
    rules_files=$(jq -r '.rules_read.file' "$EVIDENCE_FILE" 2>/dev/null || echo "")
    rules_verified=$(jq -r '.rules_read.verified' "$EVIDENCE_FILE" 2>/dev/null || echo "false")
  fi
  
  if [[ -z "$rules_files" ]] || [[ "$rules_files" == "null" ]] || [[ "$rules_files" == " " ]]; then
    echo -e "${RED}❌ CRITICAL: AI did NOT read any .mdc rules${NC}"
    echo ""
    echo -e "${YELLOW}Required: rulesfront.mdc, rulesback.mdc, rulesios.mdc, or rulesandroid.mdc${NC}"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  
  if [[ "$rules_verified" != "true" ]]; then
    echo -e "${RED}❌ CRITICAL: Rules read but NOT verified${NC}"
    echo ""
    echo -e "${YELLOW}The AI must set 'verified: true' after reading rules.${NC}"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  
  # Validate that correct .mdc was read based on staged files
  local staged_files
  staged_files=$(git diff --cached --name-only --diff-filter=ACM)
  
  local expected_platforms=""
  local violations=0
  
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    local platform
    platform=$(detect_platform_for_file "$file")
    [[ -z "$platform" ]] && continue
    
    # Check if this platform's rules were read
    if [[ ! "$rules_files" =~ $platform ]]; then
      echo -e "${RED}❌ WRONG RULES: File '$file' requires $platform${NC}"
      echo -e "${YELLOW}   But AI read: $rules_files${NC}"
      ((violations++))
    fi
    
    # Track unique platforms
    if [[ ! "$expected_platforms" =~ $platform ]]; then
      expected_platforms="$expected_platforms $platform"
    fi
  done <<< "$staged_files"
  
  if [[ $violations -gt 0 ]]; then
    echo ""
    echo -e "${RED}→ Commit BLOCKED: Wrong .mdc rules read${NC}"
    return 1
  fi
  
  if [[ -n "$expected_platforms" ]]; then
    echo -e "${GREEN}✅ Rules read: $rules_files(correct for staged files)${NC}"
  else
    echo -e "${GREEN}✅ Rules read: $rules_files${NC}"
  fi
  
  return 0
}

validate_3_questions() {
  local answered
  answered=$(jq -r '.protocol_3_questions.answered' "$EVIDENCE_FILE" 2>/dev/null || echo "false")
  
  if [[ "$answered" != "true" ]]; then
    echo -e "${RED}❌ CRITICAL: 3 Questions Protocol NOT answered${NC}"
    echo ""
    echo -e "${YELLOW}The AI must answer:${NC}"
    echo -e "  1. What type of file am I creating?"
    echo -e "  2. Does something similar already exist?"
    echo -e "  3. Does this violate Clean Architecture or SOLID?"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  
  # Validate that questions have content
  local q1 q2 q3
  q1=$(jq -r '.protocol_3_questions.question_1_file_type' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  q2=$(jq -r '.protocol_3_questions.question_2_similar_exists' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  q3=$(jq -r '.protocol_3_questions.question_3_clean_architecture' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  
  if [[ -z "$q1" ]] || [[ "$q1" == "null" ]] || [[ -z "$q2" ]] || [[ "$q2" == "null" ]] || [[ -z "$q3" ]] || [[ "$q3" == "null" ]]; then
    echo -e "${RED}❌ CRITICAL: 3 Questions answered=true but questions are EMPTY${NC}"
    echo ""
    echo -e "${YELLOW}The AI must fill all 3 questions with actual analysis.${NC}"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✅ 3 Questions Protocol: Answered${NC}"
  return 0
}

validate_files_match() {
  local evidence_files
  evidence_files=$(jq -r '.files_to_modify[]' "$EVIDENCE_FILE" 2>/dev/null | sed 's/ (NEW)$//' || echo "")
  
  if [[ -z "$evidence_files" ]]; then
    echo -e "${YELLOW}⚠️  No files declared in evidence (might be OK if no files created)${NC}"
    return 0
  fi
  
  local staged_files
  staged_files=$(git diff --cached --name-only --diff-filter=ACM)
  
  # Check for staged files NOT in evidence (STRICT)
  local undeclared=0
  while IFS= read -r sfile; do
    [[ -z "$sfile" ]] && continue
    # Skip non-source files
    [[ "$sfile" =~ \.(json|md|txt|yml|yaml)$ ]] && continue
    # Skip .AI_EVIDENCE.json itself
    [[ "$sfile" == ".AI_EVIDENCE.json" ]] && continue
    
    local found=false
    while IFS= read -r efile; do
      [[ -z "$efile" ]] && continue
      if echo "$sfile" | grep -q "$efile"; then
        found=true
        break
      fi
    done <<< "$evidence_files"
    
    if [[ "$found" == "false" ]]; then
      echo -e "${RED}❌ UNDECLARED FILE: $sfile (not in .AI_EVIDENCE.json)${NC}"
      ((undeclared++))
    fi
  done <<< "$staged_files"
  
  if [[ $undeclared -gt 0 ]]; then
    echo ""
    echo -e "${RED}🚨 STRICT MODE: All source files MUST be declared in .AI_EVIDENCE.json${NC}"
    echo -e "${YELLOW}   AI created/modified files WITHOUT updating evidence first${NC}"
    echo ""
    echo -e "${CYAN}Fix: Update .AI_EVIDENCE.json 'files_to_modify' array with ALL staged files${NC}"
    echo ""
    echo -e "${RED}→ Commit BLOCKED${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✅ All staged files declared in evidence${NC}"
  return 0
}

# =============================================================================
# Main Validation
# =============================================================================

VIOLATIONS=0

echo "📁 Validating AI implementation protocol..."
echo ""

validate_evidence_exists || ((VIOLATIONS++))
[[ $VIOLATIONS -gt 0 ]] && exit 1

validate_json_format || ((VIOLATIONS++))
[[ $VIOLATIONS -gt 0 ]] && exit 1

validate_timestamp || ((VIOLATIONS++))
validate_rules_read || ((VIOLATIONS++))
validate_3_questions || ((VIOLATIONS++))
validate_files_match || ((VIOLATIONS++))

echo ""

if [[ $VIOLATIONS -gt 0 ]]; then
  echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}❌ AI PROTOCOL VALIDATION FAILED${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}The AI must update .AI_EVIDENCE.json BEFORE editing files.${NC}"
  echo ""
  echo -e "${CYAN}This ensures:${NC}"
  echo -e "  • AI reads your .mdc rules"
  echo -e "  • AI shows you the 3 questions analysis"
  echo -e "  • Files go to correct Clean Architecture locations"
  echo ""
  echo -e "${RED}Fix the evidence file and try again.${NC}"
  echo ""
  exit 1
else
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✅ AI Protocol: Valid${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  exit 0
fi

