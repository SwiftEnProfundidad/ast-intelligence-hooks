#!/usr/bin/env bash
# Audit Orchestrator - Infrastructure Layer
# Coordinates the execution of audit checks following Clean Architecture principles

set -euo pipefail

# Get hooks-system directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect if running from node_modules or scripts/hooks-system
if [[ "$SCRIPT_DIR" == *"node_modules/@pumuki/ast-intelligence-hooks"* ]]; then
  # Running from installed npm package
  # SCRIPT_DIR is: node_modules/@pumuki/ast-intelligence-hooks/infrastructure/shell/orchestrators
  # Need to go up 3 levels: ../../.. = node_modules/@pumuki/ast-intelligence-hooks
  HOOKS_SYSTEM_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
elif [[ "$SCRIPT_DIR" == *"scripts/hooks-system"* ]]; then
  # Running from local scripts/hooks-system
  # SCRIPT_DIR is: scripts/hooks-system/infrastructure/shell/orchestrators
  # Find the hooks-system directory by searching up the path
  CURRENT_DIR="$SCRIPT_DIR"
  while [[ "$CURRENT_DIR" != "/" ]] && [[ "$CURRENT_DIR" != "." ]]; do
    if [[ "$(basename "$CURRENT_DIR")" == "hooks-system" ]]; then
      HOOKS_SYSTEM_DIR="$CURRENT_DIR"
      break
    fi
    CURRENT_DIR="$(dirname "$CURRENT_DIR")"
  done
  if [[ -z "${HOOKS_SYSTEM_DIR:-}" ]] || [[ ! -d "$HOOKS_SYSTEM_DIR" ]]; then
    echo "Error: Could not find hooks-system directory from $SCRIPT_DIR" >&2
    exit 1
  fi
else
  # Fallback: try to find it relative to current directory
  REPO_ROOT="$(pwd)"
  if [[ -d "$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks" ]]; then
    HOOKS_SYSTEM_DIR="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks"
  elif [[ -d "$REPO_ROOT/scripts/hooks-system" ]]; then
    HOOKS_SYSTEM_DIR="$REPO_ROOT/scripts/hooks-system"
  else
    echo "Error: Could not determine HOOKS_SYSTEM_DIR" >&2
    echo "  SCRIPT_DIR: $SCRIPT_DIR" >&2
    echo "  REPO_ROOT: $REPO_ROOT" >&2
    exit 1
  fi
fi

INFRASTRUCTURE_DIR="$HOOKS_SYSTEM_DIR/infrastructure"
AST_DIR="$INFRASTRUCTURE_DIR/ast"

# Source infrastructure modules
source "$INFRASTRUCTURE_DIR/shell/core/constants.sh"
source "$INFRASTRUCTURE_DIR/shell/core/utils.sh"
source "$INFRASTRUCTURE_DIR/storage/file-operations.sh"
source "$INFRASTRUCTURE_DIR/patterns/pattern-checks.sh"
source "$INFRASTRUCTURE_DIR/eslint/eslint-integration.sh"

# Initialize
START_TIME=$(date +%s)
ROOT_DIR=$(pwd)
TMP_DIR="${ROOT_DIR}/.audit_tmp"
REPORTS_DIR="${ROOT_DIR}/.audit-reports"
mkdir -p "$TMP_DIR"
mkdir -p "$REPORTS_DIR"

if [[ -z "${AUDIT_LIBRARY:-}" ]] && [[ -f "$ROOT_DIR/infrastructure/ast/ast-intelligence.js" ]]; then
  export AUDIT_LIBRARY=true
fi

print_signature() {
  printf "${BLUE}"
  cat <<'SIG'
  ██████╗ ██╗   ██╗███╗   ███╗██╗   ██╗██╗  ██╗██╗
  ██╔══██╗██║   ██║████╗ ████║██║   ██║██║ ██╔╝██║
  ██████╔╝██║   ██║██╔████╔██║██║   ██║█████╔╝ ██║
  ██╔═══╝ ██║   ██║██║╚██╔╝██║██║   ██║██╔═██╗ ██║
  ██║     ╚██████╔╝██║ ╚═╝ ██║╚██████╔╝██║  ██╗██║
  ╚═╝      ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝
                        🐈 En memoria de Pumuki 💚
SIG
  printf "${NC}\n"
}

print_final_signature() {
  printf "${BLUE}"
  cat <<'FSIG'
 ██████╗ ██╗   ██╗███╗   ███╗██╗   ██╗██╗  ██╗██╗
 ██╔══██╗██║   ██║████╗ ████║██║   ██║██║ ██╔╝██║
 ██████╔╝██║   ██║██╔████╔██║██║   ██║█████╔╝ ██║
 ██╔═══╝ ██║   ██║██║╚██╔╝██║██║   ██║██╔═██╗ ██║
 ██║     ╚██████╔╝██║ ╚═╝ ██║╚██████╔╝██║  ██╗██║
 ╚═╝      ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝
                       🐈 En memoria de Pumuki 💚
FSIG
  printf "${NC}\n"
  printf "%b🐈 Senior Software Architect - AI-Driven Development%b\n" "$BLUE" "$NC"
  printf "%bGenerated on: %s%b\n" "$BLUE" "$(date '+%Y-%m-%d %H:%M:%S')" "$NC"
  local project_name=$(basename "$ROOT_DIR")
  printf "%bProject: %s%b\n" "$BLUE" "$project_name" "$NC"
}

print_header() {
  printf "\n"
  print_signature
  printf "%b%s%b\n\n" "$BLUE" "$MSG_TITLE" "$NC"
}

ignored_globs() {
  cat <<'EOF'
node_modules
dist
.next
.turbo
.vercel
coverage
build
out
.cache
*.min.*
*.map
*.d.ts
*.lock
*.snap
*.png
*.jpg
*.jpeg
*.gif
*.svg
*.webp
*.ico
*.woff*
*.ttf
*.eot
*.pdf
EOF
}

# Functions moved to their respective modules:
# - list_source_files, count_files -> infrastructure/storage/file-operations.sh
# - check_grep -> infrastructure/patterns/pattern-checks.sh
# - run_eslint_for_app, aggregate_eslint -> infrastructure/eslint/eslint-integration.sh
# - progress_bar, progress_bar_simple -> infrastructure/shell/utils.sh

run_basic_checks() {
  printf "%b%s%b\n" "$YELLOW" "$MSG_COLLECT" "$NC"
  local files_list="$TMP_DIR/files.txt"
  list_source_files "$ROOT_DIR" > "$files_list"
  local total_files
  total_files=$(count_files "$files_list")
  printf "  Files scanned: %s\n" "$total_files"

  printf "\n%b%s%b\n" "$YELLOW" "$MSG_PATTERNS" "$NC"
  run_pattern_checks "$files_list" > "$TMP_DIR/pattern-summary.raw" 2>> "$TMP_DIR/pattern-summary.raw"
  local pattern_keys="TO""DO""_FI""XME|CON""SOLE""_LOG|ANY_TYPE|SQL_RAW|HARDCODED_SECRET|DISABLED_LINT"
  grep -E "^(${pattern_keys}):[0-9]+\$" "$TMP_DIR/pattern-summary.raw" > "$TMP_DIR/pattern-summary.txt" || true
}

run_eslint_suite() {
  run_eslint_suite_impl "$ROOT_DIR" "$TMP_DIR"
}

full_audit() {
  run_basic_checks
  run_eslint_suite
  run_ast_intelligence
  compute_staged_summary
  summarize_all
}

full_audit_strict_repo_and_staging() {
  export AUDIT_STRICT=1
  export BLOCK_ALL_SEVERITIES=1
  export BLOCK_ON_REPO_VIOLATIONS=1
  full_audit
}

full_audit_strict_staging_only() {
  export AUDIT_STRICT=1
  export BLOCK_ALL_SEVERITIES=1
  export STAGING_ONLY_MODE=1

  printf "%b%s%b\n" "$YELLOW" "🎯 STRICT STAGING-ONLY MODE" "$NC"
  printf "Analyzing only staged files with strict quality gates...\n\n"

  if ! command -v git >/dev/null 2>&1; then
    printf "%b[ERROR] Git not available%b\n" "$RED" "$NC"
    exit 1
  fi

  local staged_count=$(git diff --cached --name-only --diff-filter=ACM | wc -l | tr -d ' ')
  if [[ "$staged_count" == "0" ]]; then
    printf "%b[INFO] No staged files%b\n" "$YELLOW" "$NC"
    exit 0
  fi

  printf "Staged files: %s\n\n" "$staged_count"

  run_ast_intelligence
  compute_staged_summary

  local gate_crit=${STAGED_CRIT:-0}
  local gate_high=${STAGED_HIGH:-0}
  local gate_med=${STAGED_MED:-0}
  local gate_low=${STAGED_LOW:-0}

  printf "\n%b═══════════════════════════════════════════════════════════════%b\n" "$BLUE" "$NC"
  printf "%bSTAGING AREA VERDICT%b\n" "$BLUE" "$NC"
  printf "%b═══════════════════════════════════════════════════════════════%b\n" "$BLUE" "$NC"

  if (( gate_crit > 0 || gate_high > 0 || gate_med > 0 || gate_low > 0 )); then
    printf "\n%b❌ COMMIT BLOCKED - STRICT MODE%b\n" "$RED" "$NC"
    printf "  🔴 CRITICAL: %s\n" "$gate_crit"
    printf "  🟠 HIGH:     %s\n" "$gate_high"
    printf "  🟡 MEDIUM:   %s\n" "$gate_med"
    printf "  🔵 LOW:      %s\n" "$gate_low"
    printf "\n  Action: Fix ALL violations in staged files.\n"
    printf "\n"
    print_final_signature
    exit 1
  else
    printf "\n%b✅ STAGING CLEAN - COMMIT ALLOWED%b\n" "$GREEN" "$NC"
    printf "  🔴 CRITICAL: 0\n"
    printf "  🟠 HIGH:     0\n"
    printf "  🟡 MEDIUM:   0\n"
    printf "  🔵 LOW:      0\n"
    printf "\n  All staged files pass strict quality gates.\n"
    printf "  Ready to commit! 🚀\n\n"
    print_final_signature
    exit 0
  fi
}

full_audit_standard() {
  export AUDIT_STRICT=1
  export BLOCK_ALL_SEVERITIES=0
  export STAGING_ONLY_MODE=1

  printf "%b%s%b\n" "$YELLOW" "🎯 STANDARD MODE (CRITICAL/HIGH in staging)" "$NC"
  printf "Analyzing only staged files - blocks on CRITICAL/HIGH only...\n\n"

  if ! command -v git >/dev/null 2>&1; then
    printf "%b[ERROR] Git not available%b\n" "$RED" "$NC"
    exit 1
  fi

  local staged_count=$(git diff --cached --name-only --diff-filter=ACM | wc -l | tr -d ' ')
  if [[ "$staged_count" == "0" ]]; then
    printf "%b[INFO] No staged files%b\n" "$YELLOW" "$NC"
    exit 0
  fi

  printf "Staged files: %s\n\n" "$staged_count"

  run_ast_intelligence
  compute_staged_summary

  local gate_crit=${STAGED_CRIT:-0}
  local gate_high=${STAGED_HIGH:-0}
  local gate_med=${STAGED_MED:-0}
  local gate_low=${STAGED_LOW:-0}

  printf "\n%b═══════════════════════════════════════════════════════════════%b\n" "$BLUE" "$NC"
  printf "%bSTAGING AREA VERDICT%b\n" "$BLUE" "$NC"
  printf "%b═══════════════════════════════════════════════════════════════%b\n" "$BLUE" "$NC"

  if (( gate_crit > 0 || gate_high > 0 )); then
    printf "\n%b❌ COMMIT BLOCKED - CRITICAL/HIGH%b\n" "$RED" "$NC"
    printf "  🔴 CRITICAL: %s\n" "$gate_crit"
    printf "  🟠 HIGH:     %s\n" "$gate_high"
    printf "  🟡 MEDIUM:   %s (allowed)\n" "$gate_med"
    printf "  🔵 LOW:      %s (allowed)\n" "$gate_low"
    printf "\n  Action: Fix CRITICAL/HIGH violations in staged files.\n"
    printf "\n"
    print_final_signature
    exit 1
  else
    printf "\n%b✅ STAGING CLEAN - COMMIT ALLOWED%b\n" "$GREEN" "$NC"
    printf "  🔴 CRITICAL: 0\n"
    printf "  🟠 HIGH:     0\n"
    printf "  🟡 MEDIUM:   %s (allowed)\n" "$gate_med"
    printf "  🔵 LOW:      %s (allowed)\n" "$gate_low"
    printf "\n  Staged files pass critical/high quality gates.\n"
    printf "  Ready to commit! 🚀\n\n"
    print_final_signature
    exit 0
  fi
}
compute_staged_summary() {
  if ! command -v git >/dev/null 2>&1; then return; fi
  local staged_file="$TMP_DIR/staged.txt"
  git diff --cached --name-only --diff-filter=ACM | sed "s|^|$ROOT_DIR/|" > "$staged_file" || true
  if [[ ! -s "$staged_file" ]]; then return; fi
  printf "\n%bStaging Area%b\n" "$YELLOW" "$NC"
  printf "─────────────────────────────────────────────────────────────\n"

  run_pattern_checks "$staged_file" > "$TMP_DIR/pattern-staged.raw"
  local pattern_keys_staged="TO""DO""_FI""XME|CON""SOLE""_LOG|ANY_TYPE|SQL_RAW|HARDCODED_SECRET|DISABLED_LINT"
  grep -E "^(${pattern_keys_staged}):[0-9]+\$" "$TMP_DIR/pattern-staged.raw" > "$TMP_DIR/pattern-staged.txt" || true
  while IFS=: read -r k v; do
    [[ -z "$k" ]] && continue
    printf "  %s %s: %s\n" "$([[ $k =~ ANY_TYPE|SQL_RAW|HARDCODED_SECRET ]] && echo "$EMJ_ERR" || echo "$EMJ_WARN")" "$k" "${v:-0}"
  done < "$TMP_DIR/pattern-staged.txt"

  if [[ -f "$TMP_DIR/ast-summary.json" ]] && command -v jq >/dev/null 2>&1; then
    local scrit=0 shigh=0 smed=0 slow=0
    while IFS= read -r fpath; do
      [[ -z "$fpath" ]] && continue
      local ccrit chigh cmed clow
      ccrit=$(jq -r --arg p "$fpath" '[ .findings[] | select(.filePath == $p) | .severity | if .=="critical" or .=="error" then 1 else 0 end ] | add // 0' "$TMP_DIR/ast-summary.json")
      chigh=$(jq -r --arg p "$fpath" '[ .findings[] | select(.filePath == $p) | .severity | if .=="high" then 1 else 0 end ] | add // 0' "$TMP_DIR/ast-summary.json")
      cmed=$(jq -r --arg p "$fpath" '[ .findings[] | select(.filePath == $p) | .severity | if .=="warning" or .=="medium" then 1 else 0 end ] | add // 0' "$TMP_DIR/ast-summary.json")
      clow=$(jq -r --arg p "$fpath" '[ .findings[] | select(.filePath == $p) | .severity | if .=="info" or .=="low" then 1 else 0 end ] | add // 0' "$TMP_DIR/ast-summary.json")
      scrit=$((scrit + ccrit)); shigh=$((shigh + chigh)); smed=$((smed + cmed)); slow=$((slow + clow))
    done < "$staged_file"
    printf "  Staged AST → 🔴 CRITICAL:%s 🟠 HIGH:%s 🟡 MEDIUM:%s 🔵 LOW:%s\n" "${scrit:-0}" "${shigh:-0}" "${smed:-0}" "${slow:-0}"
    export STAGED_CRIT=${scrit:-0}
    export STAGED_HIGH=${shigh:-0}
    export STAGED_MED=${smed:-0}
    export STAGED_LOW=${slow:-0}
  fi
}

get_recommendation() {
  local rule_id="$1"
  local count="$2"
  case "$rule_id" in
    "types.any")
      printf "  → Replace 'any' with specific types. Use TypeScript strict mode.\n"
      printf "  → Impact: Type safety compromised, potential runtime errors.\n"
      ;;
    "security.secret")
      printf "  → Move secrets to environment variables (.env).\n"
      printf "  → Impact: %bCRITICAL%b - Credentials exposed in source code.\n" "$RED" "$NC"
      ;;
    "security.sql.raw")
      printf "  → Use parameterized queries or ORM methods.\n"
      printf "  → Impact: %bCRITICAL%b - SQL injection vulnerability.\n" "$RED" "$NC"
      ;;
    "architecture.layering")
      printf "  → Fix dependency direction: domain should not depend on infrastructure.\n"
      printf "  → Impact: %bCRITICAL%b - Clean Architecture violation.\n" "$RED" "$NC"
      ;;
    "performance.pagination")
      printf "  → Add .range() or .limit() to Supabase queries.\n"
      printf "  → Impact: %bMEDIUM%b - Potential memory issues with large datasets.\n" "$YELLOW" "$NC"
      ;;
    "performance.nplus1")
      printf "  → Batch queries or use eager loading patterns.\n"
      printf "  → Impact: %bMEDIUM%b - Excessive database calls.\n" "$YELLOW" "$NC"
      ;;
    "debug.console")
      printf "  → Replace with proper logging service (Winston, Pino).\n"
      printf "  → Impact: %bLOW%b - Debug code in production.\n" "$BLUE" "$NC"
      ;;
    *)
      printf "  → Review and fix violations.\n"
      ;;
  esac
}

print_platform_summary() {
  local platform="$1"
  local json_file="$2"
  if ! command -v jq >/dev/null 2>&1; then
    return
  fi
  local crit high med low files
  crit=$(jq -r --arg p "$platform" '.platformDetails[$p].CRITICAL // 0' "$json_file" 2>/dev/null || echo "0")
  high=$(jq -r --arg p "$platform" '.platformDetails[$p].HIGH // 0' "$json_file" 2>/dev/null || echo "0")
  med=$(jq -r --arg p "$platform" '.platformDetails[$p].MEDIUM // 0' "$json_file" 2>/dev/null || echo "0")
  low=$(jq -r --arg p "$platform" '.platformDetails[$p].LOW // 0' "$json_file" 2>/dev/null || echo "0")
  files=$(jq -r --arg p "$platform" '.platformDetails[$p].files | length // 0' "$json_file" 2>/dev/null || echo "0")
  if [[ "$crit" == "0" && "$high" == "0" && "$med" == "0" && "$low" == "0" ]]; then
    return
  fi
  printf "\n  Platform: %s\n" "$platform"
  printf "  ──────────────────────────────────────────────\n"
  printf "  🔴 CRITICAL: %s  🟠 HIGH: %s  🟡 MEDIUM: %s  🔵 LOW: %s\n" "$crit" "$high" "$med" "$low"
  printf "  Files affected: %s\n" "$files"
  local top_rules
  top_rules=$(jq -r --arg p "$platform" '.platformDetails[$p].rules | to_entries | sort_by(-.value) | .[0:5] | .[] | (.key + ": " + (.value | tostring))' "$json_file" 2>/dev/null | sed 's/^/    /' || echo "")
  if [[ -n "$top_rules" ]]; then
    printf "  Top violations:\n%s\n" "$top_rules"
  fi
}

summarize_all() {
  printf "\n"
  printf "%b═══════════════════════════════════════════════════════════════%b\n" "$BLUE" "$NC"
  printf "%b%s%b\n" "$BLUE" "$MSG_SUMMARY" "$NC"
  printf "%b═══════════════════════════════════════════════════════════════%b\n\n" "$BLUE" "$NC"

  # Quick summary at the top
  local es_err es_warn crit high med low total_violations files_scanned
  es_err=$(grep -o 'errors=[0-9]\+' "$TMP_DIR/eslint-summary.txt" 2>/dev/null | head -n1 | sed 's/[^0-9]//g')
  es_warn=$(grep -o 'warnings=[0-9]\+' "$TMP_DIR/eslint-summary.txt" 2>/dev/null | head -n1 | sed 's/[^0-9]//g')
  es_err=${es_err:-0}; es_warn=${es_warn:-0}

  if [[ -f "$TMP_DIR/ast-summary.json" ]]; then
    if command -v jq >/dev/null 2>&1; then
      crit=$(jq -r '.levels.CRITICAL // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
      high=$(jq -r '.levels.HIGH // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
      med=$(jq -r '.levels.MEDIUM // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
      low=$(jq -r '.levels.LOW // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
    else
      crit=$(grep -o '"CRITICAL"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
      high=$(grep -o '"HIGH"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
      med=$(grep -o '"MEDIUM"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
      low=$(grep -o '"LOW"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
    fi
    crit=${crit:-0}; high=${high:-0}; med=${med:-0}; low=${low:-0}
  else
    crit=0; high=0; med=0; low=0
  fi

  total_violations=$((crit + high + med + low))
  files_scanned=$(if [[ -f "$TMP_DIR/files.txt" ]]; then wc -l < "$TMP_DIR/files.txt" | tr -d ' '; else echo "0"; fi)

  # Quick summary header
  printf "%b╔═══════════════════════════════════════════════════════════════╗%b\n" "$BLUE" "$NC"
  printf "%b║ %-61s ║%b\n" "$BLUE" "QUICK SUMMARY" "$NC"
  printf "%b╚═══════════════════════════════════════════════════════════════╝%b\n\n" "$BLUE" "$NC"

  printf "  %bFiles Scanned:%b      %s\n" "$BLUE" "$NC" "$files_scanned"
  printf "  %bTotal Violations:%b   %s\n" "$YELLOW" "$NC" "$total_violations"
  printf "  %bESLint Errors:%b      %s\n" "$RED" "$NC" "$es_err"
  printf "  %bCritical Issues:%b   %s\n" "$RED" "$NC" "$crit"
  printf "  %bHigh Priority:%b     %s\n\n" "$YELLOW" "$NC" "$high"

  if (( crit > 0 || high > 0 || es_err > 0 )); then
    printf "  %b⚠️  STATUS: ACTION REQUIRED%b\n" "$RED" "$NC"
    printf "  %b   Critical or high-severity issues detected%b\n\n" "$YELLOW" "$NC"
  else
    printf "  %b✅ STATUS: ALL CLEAR%b\n" "$GREEN" "$NC"
    printf "  %b   No critical issues detected%b\n\n" "$GREEN" "$NC"
  fi

  printf "%b1. PATTERN CHECKS%b\n" "$YELLOW" "$NC"
  printf "─────────────────────────────────────────────────────────────\n"
  local patterns_file="$TMP_DIR/pattern-summary.txt"
  if [[ -f "$patterns_file" ]]; then
    local total_patterns=0
    local has_violations=0
    while IFS=: read -r key val; do
      [[ -z "$key" ]] && continue
      val=${val:-0}
      if [[ $val -gt 0 ]]; then
        has_violations=1
        total_patterns=$((total_patterns + val))
        case "$key" in
          TODO_FIXME) printf "  %s %s: %s\n" "$EMJ_WARN" "$key" "$val" ;;
          CONSOLE_LOG) printf "  %s %s: %s\n" "$EMJ_WARN" "$key" "$val" ;;
          ANY_TYPE) printf "  %s %s: %s\n" "$EMJ_ERR" "$key" "$val" ;;
          SQL_RAW) printf "  %s %s: %s\n" "$EMJ_ERR" "$key" "$val" ;;
          HARDCODED_SECRET) printf "  %s %s: %s\n" "$EMJ_ERR" "$key" "$val" ;;
          DISABLED_LINT) printf "  %s %s: %s\n" "$EMJ_INFO" "$key" "$val" ;;
          *) printf "  %s: %s\n" "$key" "$val" ;;
        esac
      fi
    done < "$patterns_file"
    if [[ $has_violations -eq 0 ]]; then
      printf "  %b✅ No pattern violations detected%b\n" "$GREEN" "$NC"
    fi
  else
    printf "  No pattern summary available.\n"
  fi

  printf "\n%b2. ESLINT AUDIT RESULTS%b\n" "$YELLOW" "$NC"
  printf "─────────────────────────────────────────────────────────────\n"
  if [[ -f "$TMP_DIR/eslint-summary.txt" ]]; then
    es_err=$(grep -o 'errors=[0-9]\+' "$TMP_DIR/eslint-summary.txt" | head -n1 | sed 's/[^0-9]//g')
    es_warn=$(grep -o 'warnings=[0-9]\+' "$TMP_DIR/eslint-summary.txt" | head -n1 | sed 's/[^0-9]//g')
    es_err=${es_err:-0}; es_warn=${es_warn:-0}
    if [[ $es_err -gt 0 ]]; then
      printf "  %bESLint:%b 🔴 errors=%s 🟡 warnings=%s\n" "$RED" "$NC" "$es_err" "$es_warn"
    else
      printf "  %bESLint:%b 🔴 errors=%s 🟡 warnings=%s\n" "$GREEN" "$NC" "$es_err" "$es_warn"
    fi
  else
    printf "  No ESLint summary available.\n"
  fi

  if [[ -f "$TMP_DIR/ast-summary.json" ]]; then
    local has_staged="0"
    if [[ -n "${STAGED_CRIT-}" || -s "$TMP_DIR/staged.txt" ]]; then has_staged="1"; fi

    # Staging Area breakdown (always show section)
    printf "\n%b3. AST INTELLIGENCE - SEVERITY BREAKDOWN (Staging Area)%b\n" "$YELLOW" "$NC"
    printf "─────────────────────────────────────────────────────────────\n"
    if [[ -s "$TMP_DIR/staged.txt" ]]; then
      local scr=${STAGED_CRIT:-0}
      local shi=${STAGED_HIGH:-0}
      local sme=${STAGED_MED:-0}
      local slo=${STAGED_LOW:-0}
      local total_s=$((scr + shi + sme + slo))
      printf "  %b🔴 CRITICAL:%b %s violations" "$RED" "$NC" "$scr"; if [[ $total_s -gt 0 ]]; then printf " (%d%%)" $((scr * 100 / total_s)); fi; printf "\n"
      printf "  %b🟠 HIGH:%b     %s violations" "$YELLOW" "$NC" "$shi"; if [[ $total_s -gt 0 ]]; then printf " (%d%%)" $((shi * 100 / total_s)); fi; printf "\n"
      printf "  %b🟡 MEDIUM:%b   %s violations" "$YELLOW" "$NC" "$sme"; if [[ $total_s -gt 0 ]]; then printf " (%d%%)" $((sme * 100 / total_s)); fi; printf "\n"
      printf "  %b🔵 LOW:%b      %s violations" "$BLUE" "$NC" "$slo"; if [[ $total_s -gt 0 ]]; then printf " (%d%%)" $((slo * 100 / total_s)); fi; printf "\n"
    else
      printf "  No staged files to analyze.\n"
    fi

    # Repository breakdown (always)
    printf "\n%b3. AST INTELLIGENCE - SEVERITY BREAKDOWN (Repository)%b\n" "$YELLOW" "$NC"
    printf "─────────────────────────────────────────────────────────────\n"
    local total_r=$((crit + high + med + low))
    printf "  %b🔴 CRITICAL:%b %s violations" "$RED" "$NC" "$crit"; if [[ $total_r -gt 0 ]]; then printf " (%d%%)" $((crit * 100 / total_r)); fi; printf "\n"
    printf "  %b🟠 HIGH:%b     %s violations" "$YELLOW" "$NC" "$high"; if [[ $total_r -gt 0 ]]; then printf " (%d%%)" $((high * 100 / total_r)); fi; printf "\n"
    printf "  %b🟡 MEDIUM:%b   %s violations" "$YELLOW" "$NC" "$med"; if [[ $total_r -gt 0 ]]; then printf " (%d%%)" $((med * 100 / total_r)); fi; printf "\n"
    printf "  %b🔵 LOW:%b      %s violations" "$BLUE" "$NC" "$low"; if [[ $total_r -gt 0 ]]; then printf " (%d%%)" $((low * 100 / total_r)); fi; printf "\n"

    printf "\n%b4. PLATFORM-SPECIFIC ANALYSIS%b\n" "$YELLOW" "$NC"
    printf "─────────────────────────────────────────────────────────────\n"
    if command -v jq >/dev/null 2>&1; then
      print_platform_summary "Backend" "$TMP_DIR/ast-summary.json"
      print_platform_summary "Frontend" "$TMP_DIR/ast-summary.json"
      print_platform_summary "iOS" "$TMP_DIR/ast-summary.json"
      print_platform_summary "Android" "$TMP_DIR/ast-summary.json"
      print_platform_summary "Other" "$TMP_DIR/ast-summary.json"
    else
      local be fe ios android oth
      be=$(grep -o '"Backend"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | sed 's/[^0-9]//g')
      fe=$(grep -o '"Frontend"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | sed 's/[^0-9]//g')
      ios=$(grep -o '"iOS"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | sed 's/[^0-9]//g')
      android=$(grep -o '"Android"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | sed 's/[^0-9]//g')
          oth=$(grep -o '"Other"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | sed 's/[^0-9]//g')
      printf "Backend: %s\n" "${be:-0}"
      printf "Frontend: %s\n" "${fe:-0}"
      printf "iOS: %s\n" "${ios:-0}"
      printf "Android: %s\n" "${android:-0}"
      printf "Other: %s\n" "${oth:-0}"
    fi

    printf "\n%b5. TOP VIOLATIONS & REMEDIATION%b\n" "$YELLOW" "$NC"
    printf "─────────────────────────────────────────────────────────────\n"
    if command -v jq >/dev/null 2>&1; then
      local jq_cmd violations_output
      jq_cmd=".rules | to_entries | sort_by(-.value) | .[0:10] | .[] | (.key + \":\" + (.value | tostring))"
      violations_output=$(jq -r "$jq_cmd" "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "")

      if [[ -n "$violations_output" ]]; then
        local rule_count=0
        while IFS=: read -r rule count; do
          if [[ -n "$rule" && -n "$count" && "$count" -gt 0 ]]; then
            rule_count=$((rule_count + 1))
            printf "\n  %b🔍 %s%b (%s violations)\n" "$BLUE" "$rule" "$NC" "$count"
            get_recommendation "$rule" "$count" | sed 's/^/    /'
          fi
        done <<< "$violations_output"

        if [[ $rule_count -eq 0 ]]; then
          printf "  %b✅ No violations detected%b\n" "$GREEN" "$NC"
        fi
      else
        printf "  %b✅ No violations detected%b\n" "$GREEN" "$NC"
      fi
    else
      printf "  Install jq for detailed recommendations.\n"
    fi

    printf "\n%b6. EXECUTIVE SUMMARY%b\n" "$YELLOW" "$NC"
    printf "─────────────────────────────────────────────────────────────\n"
    # Use variables already defined at the top of the function
    local total_violations=$((crit + high + med + low))

    printf "\n"
    printf "  %b— METRICS —%b\n" "$BLUE" "$NC"
    printf "  Total violations detected: %s\n" "$total_violations"
    printf "  ESLint errors:            %s\n" "$es_err"
    printf "  ESLint warnings:          %s\n" "$es_warn"
    printf "  Critical issues:          %s\n" "$crit"
    printf "  High priority issues:     %s\n" "$high"
    printf "  Files scanned:            %s\n\n" "$files_scanned"

    # Calculate code health score (0-100)
    local health_score=100
    if [[ $files_scanned -gt 0 ]]; then
      # Base score: penalize violations per file
      local violations_per_file=$(( total_violations * 100 / files_scanned ))
      if [[ $violations_per_file -gt 100 ]]; then
        violations_per_file=100
      fi
      health_score=$(( 100 - violations_per_file ))

      # Additional penalties
      if [[ $crit -gt 0 ]]; then
        health_score=$(( health_score - 10 ))
      fi
      if [[ $high -gt 50 ]]; then
        health_score=$(( health_score - 10 ))
      fi
      if [[ $es_err -gt 0 ]]; then
        health_score=$(( health_score - 5 ))
      fi

      # Ensure score is within bounds
      if [[ $health_score -lt 0 ]]; then
        health_score=0
      fi
      if [[ $health_score -gt 100 ]]; then
        health_score=100
      fi
    fi

    printf "  %bCode Health Score:%b " "$BLUE" "$NC"
    if [[ $health_score -ge 80 ]]; then
      printf "%b%d%% (Excellent)%b\n" "$GREEN" "$health_score" "$NC"
    elif [[ $health_score -ge 60 ]]; then
      printf "%b%d%% (Good)%b\n" "$YELLOW" "$health_score" "$NC"
    elif [[ $health_score -ge 40 ]]; then
      printf "%b%d%% (Needs Improvement)%b\n" "$YELLOW" "$health_score" "$NC"
    else
      printf "%b%d%% (Critical)%b\n" "$RED" "$health_score" "$NC"
    fi

    printf "\n"
    local gcrit=$crit; local ghigh=$high
    if [[ -n "${STAGED_CRIT-}" ]]; then gcrit=${STAGED_CRIT-0}; fi
    if [[ -n "${STAGED_HIGH-}" ]]; then ghigh=${STAGED_HIGH-0}; fi
    if (( gcrit > 0 || ghigh > 0 || es_err > 0 )); then
      printf "  %b╔═══════════════════════════════════════════════════════════════╗%b\n" "$RED" "$NC"
      printf "  %b║ %-61s ║%b\n" "$RED" "ACTION REQUIRED: Critical or high-severity issues" "$NC"
      printf "  %b║ %-61s ║%b\n" "$RED" "detected. Please review and fix before proceeding." "$NC"
      printf "  %b╚═══════════════════════════════════════════════════════════════╝%b\n" "$RED" "$NC"

      printf "\n  %b📋 Quick Actions:%b\n" "$YELLOW" "$NC"
      if [[ $gcrit -gt 0 ]]; then
        printf "    1. Fix %s CRITICAL issues (security, architecture violations)\n" "$gcrit"
      fi
      if [[ $ghigh -gt 0 ]]; then
        printf "    2. Address %s HIGH priority issues (types.any, etc.)\n" "$ghigh"
      fi
      if [[ $es_err -gt 0 ]]; then
        printf "    3. Resolve %s ESLint errors\n" "$es_err"
      fi
      printf "    4. Review top violations section for specific recommendations\n"
    else
      printf "  %b✅ No critical issues detected%b\n" "$GREEN" "$NC"
      printf "  %b   Code quality is within acceptable standards.%b\n" "$GREEN" "$NC"
    fi
  fi

  local end_time=$(date +%s)
  local elapsed=$(( end_time - START_TIME ))
  printf "\n%b7. AUDIT METADATA%b\n" "$YELLOW" "$NC"
  printf "─────────────────────────────────────────────────────────────\n"
  printf "  Elapsed time: %ss\n" "$elapsed"
  printf "  Timestamp: %s\n" "$(date '+%Y-%m-%d %H:%M:%S')"
  printf "  Files scanned: %s\n" "$(if [[ -f "$TMP_DIR/files.txt" ]]; then wc -l < "$TMP_DIR/files.txt" | tr -d ' '; else echo "0"; fi)"

  # Re-read final counts for consistency (use same variables as defined earlier)
  local final_crit final_high final_med final_low final_es_err final_es_warn
  if [[ -f "$TMP_DIR/ast-summary.json" ]]; then
    if command -v jq >/dev/null 2>&1; then
      final_crit=$(jq -r '.levels.CRITICAL // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
      final_high=$(jq -r '.levels.HIGH // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
      final_med=$(jq -r '.levels.MEDIUM // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
      final_low=$(jq -r '.levels.LOW // 0' "$TMP_DIR/ast-summary.json" 2>/dev/null || echo "0")
    else
      final_crit=$(grep -o '"CRITICAL"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
      final_high=$(grep -o '"HIGH"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
      final_med=$(grep -o '"MEDIUM"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
      final_low=$(grep -o '"LOW"\s*:\s*[0-9]\+' "$TMP_DIR/ast-summary.json" | head -n1 | sed 's/[^0-9]//g')
    fi
    final_crit=${final_crit:-0}; final_high=${final_high:-0}; final_med=${final_med:-0}; final_low=${final_low:-0}
  else
    final_crit=0; final_high=0; final_med=0; final_low=0
  fi
  final_es_err=$(grep -o 'errors=[0-9]\+' "$TMP_DIR/eslint-summary.txt" 2>/dev/null | head -n1 | sed 's/[^0-9]//g')
  final_es_warn=$(grep -o 'warnings=[0-9]\+' "$TMP_DIR/eslint-summary.txt" 2>/dev/null | head -n1 | sed 's/[^0-9]//g')
  final_es_err=${final_es_err:-0}; final_es_warn=${final_es_warn:-0}

  # Final summary with emojis before signature
  printf "\n%b═══════════════════════════════════════════════════════════════%b\n" "$BLUE" "$NC"
  printf "%bFINAL SUMMARY - VIOLATIONS BY SEVERITY%b\n" "$BLUE" "$NC"
  printf "%b═══════════════════════════════════════════════════════════════%b\n\n" "$BLUE" "$NC"

  local final_total=$((final_crit + final_high + final_med + final_low))
  printf "  %b🔴 CRITICAL:%b %s\n" "$RED" "$NC" "$final_crit"
  printf "  %b🟠 HIGH:%b     %s\n" "$YELLOW" "$NC" "$final_high"
  printf "  %b🟡 MEDIUM:%b   %s\n" "$YELLOW" "$NC" "$final_med"
  printf "  %b🔵 LOW:%b      %s\n" "$BLUE" "$NC" "$final_low"
  printf "\n  Total violations: %s\n" "$final_total"
  if [[ $final_es_err -gt 0 ]]; then
    printf "  %bESLint errors:%b %s\n" "$RED" "$NC" "$final_es_err"
  fi
  if [[ $final_es_warn -gt 0 ]]; then
    printf "  %bESLint warnings:%b %s\n" "$YELLOW" "$NC" "$final_es_warn"
  fi

  if [[ "${AUDIT_STRICT:-0}" == "1" ]]; then
    if [[ "${GIT_BYPASS_HOOK:-0}" == "1" ]]; then
      printf "\n%b[COMMIT BYPASSED]%b (GIT_BYPASS_HOOK=1)\n" "$YELLOW" "$NC"
      print_final_signature
      exit 0
    fi
    local gate_crit gate_high gate_med gate_low gate_es

    # Decide gate values based on mode
    if [[ "${BLOCK_ON_REPO_VIOLATIONS:-0}" == "1" ]]; then
      # OPTION 2: Block if REPO has violations (ultra-strict for CI/CD)
      gate_crit=$final_crit
      gate_high=$final_high
      gate_med=$final_med
      gate_low=$final_low
      gate_es=$final_es_err
    else
      # OPTIONS 3,4: Block only on STAGING violations (dev-friendly)
      gate_crit=${STAGED_CRIT:-0}
      gate_high=${STAGED_HIGH:-0}
      gate_med=${STAGED_MED:-0}
      gate_low=${STAGED_LOW:-0}
      gate_es=0
    fi

    # Check if we should block on ALL severity levels or just CRITICAL/HIGH
    if [[ "${BLOCK_ALL_SEVERITIES:-0}" == "1" ]]; then
      # Block on ANY violation (CRITICAL + HIGH + MEDIUM + LOW)
      if (( gate_crit > 0 || gate_high > 0 || gate_med > 0 || gate_low > 0 || gate_es > 0 )); then
        printf "\n"
        if [[ "${BLOCK_ON_REPO_VIOLATIONS:-0}" == "1" ]]; then
          printf "%b[COMMIT BLOCKED - STRICT REPO+STAGING]%b\n" "$RED" "$NC"
          printf "  CRITICAL violations (repository): %s\n" "$gate_crit"
          printf "  HIGH violations (repository):     %s\n" "$gate_high"
          printf "  MEDIUM violations (repository):   %s\n" "$gate_med"
          printf "  LOW violations (repository):      %s\n" "$gate_low"
          printf "  ESLint errors (repository):       %s\n" "$gate_es"
          printf "  Action: Clean entire repository before committing.\n"
        else
          printf "%b[COMMIT BLOCKED - STRICT STAGING]%b\n" "$RED" "$NC"
          printf "  CRITICAL violations in staging: %s\n" "$gate_crit"
          printf "  HIGH violations in staging:     %s\n" "$gate_high"
          printf "  MEDIUM violations in staging:   %s\n" "$gate_med"
          printf "  LOW violations in staging:      %s\n" "$gate_low"
          printf "  Action: Fix violations in staged files before committing.\n"
        fi
        printf "\n"
        print_final_signature
        exit 1
      fi
    else
      # Standard mode: Block only on CRITICAL/HIGH IN STAGING
      if (( gate_crit > 0 || gate_high > 0 )); then
        printf "\n"
        printf "%b[COMMIT BLOCKED - CRITICAL/HIGH]%b\n" "$RED" "$NC"
        printf "  CRITICAL violations in staging: %s\n" "$gate_crit"
        printf "  HIGH violations in staging:     %s\n" "$gate_high"
        printf "  Action: Fix critical/high violations in staged files before committing.\n"
        printf "\n"
        print_final_signature
        exit 1
      fi
    fi
  fi

  printf "\n"
  print_final_signature

  save_audit_reports
}

save_audit_reports() {
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local report_prefix="${REPORTS_DIR}/audit_${timestamp}"

  if [[ -f "$TMP_DIR/ast-summary.json" ]]; then
    cp "$TMP_DIR/ast-summary.json" "${report_prefix}_ast_summary.json"
  fi

  if [[ -f "$TMP_DIR/ast-findings.json" ]]; then
    cp "$TMP_DIR/ast-findings.json" "${report_prefix}_ast_findings.json"
  fi

  if [[ -f "$TMP_DIR/pattern-summary.txt" ]]; then
    cp "$TMP_DIR/pattern-summary.txt" "${report_prefix}_patterns.txt"
  fi

  if [[ -f "$TMP_DIR/eslint-summary.txt" ]]; then
    cp "$TMP_DIR/eslint-summary.txt" "${report_prefix}_eslint.txt"
  fi

  local latest_summary="${REPORTS_DIR}/latest_ast_summary.json"
  local latest_findings="${REPORTS_DIR}/latest_ast_findings.json"
  local latest_critical="${REPORTS_DIR}/latest_critical.json"
  local latest_high="${REPORTS_DIR}/latest_high.json"
  local latest_medium="${REPORTS_DIR}/latest_medium.json"
  local latest_low="${REPORTS_DIR}/latest_low.json"

  if [[ -f "$TMP_DIR/ast-summary.json" ]]; then
    cp "$TMP_DIR/ast-summary.json" "$latest_summary"
    cp "$TMP_DIR/ast-summary.json" "${REPORTS_DIR}/baseline_ast_summary.json"

    if command -v jq >/dev/null 2>&1; then
      jq '{
        severity: "CRITICAL",
        count: ([.findings[] | select(.severity == "critical" or .severity == "error")] | length),
        findings: [.findings[] | select(.severity == "critical" or .severity == "error") | {
          ruleId,
          file: (.filePath | split("/") | .[-1]),
          fullPath: .filePath,
          line,
          message
        }]
      }' "$TMP_DIR/ast-summary.json" > "$latest_critical" 2>/dev/null || true

      jq '{
        severity: "HIGH",
        count: ([.findings[] | select(.severity == "high" or .severity == "warning")] | length),
        findings: [.findings[] | select(.severity == "high" or .severity == "warning") | {
          ruleId,
          file: (.filePath | split("/") | .[-1]),
          fullPath: .filePath,
          line,
          message
        }]
      }' "$TMP_DIR/ast-summary.json" > "$latest_high" 2>/dev/null || true

      jq '{
        severity: "MEDIUM",
        count: ([.findings[] | select(.severity == "medium" or .severity == "info")] | length),
        findings: [.findings[] | select(.severity == "medium" or .severity == "info") | {
          ruleId,
          file: (.filePath | split("/") | .[-1]),
          fullPath: .filePath,
          line,
          message
        }]
      }' "$TMP_DIR/ast-summary.json" > "$latest_medium" 2>/dev/null || true

      jq '{
        severity: "LOW",
        count: ([.findings[] | select(.severity == "low" or .severity == "note")] | length),
        findings: [.findings[] | select(.severity == "low" or .severity == "note") | {
          ruleId,
          file: (.filePath | split("/") | .[-1]),
          fullPath: .filePath,
          line,
          message
        }]
      }' "$TMP_DIR/ast-summary.json" > "$latest_low" 2>/dev/null || true
    fi
  fi
  if [[ -f "$TMP_DIR/ast-findings.json" ]]; then
    cp "$TMP_DIR/ast-findings.json" "$latest_findings"
  fi
}

export_markdown() {
  local out="${TMP_DIR}/audit-report.md"
  printf "# Audit Report\n\n" > "$out"
  printf "## %s\n\n" "$MSG_SUMMARY" >> "$out"
  if [[ -f "${TMP_DIR}/pattern-summary.txt" ]]; then
    cat "${TMP_DIR}/pattern-summary.txt" >> "$out"
    printf "\n" >> "$out"
  fi
  if [[ -f "${TMP_DIR}/eslint-summary.txt" ]]; then
    cat "${TMP_DIR}/eslint-summary.txt" >> "$out"
    printf "\n" >> "$out"
  fi
  printf "%s %s\n" "$EMJ_OK" "$out"
}

run_ast_intelligence() {
  printf "%b⚙️ AST Intelligence%b\n" "$YELLOW" "$NC"
  printf "%bRunning AST analysis...%b " "$YELLOW" "$NC" >&2

  # Capture AST output and format it better
  local ast_output
  local ast_exit_code=0

  # Ensure TMP_DIR exists
  mkdir -p "$TMP_DIR"

  # Determine NODE_PATH to include library's node_modules
  # Try multiple locations: HOOKS_SYSTEM_DIR/node_modules, or project root node_modules
  local node_path_parts=()
  
  # If HOOKS_SYSTEM_DIR has its own node_modules
  if [[ -d "$HOOKS_SYSTEM_DIR/node_modules" ]]; then
    node_path_parts+=("$HOOKS_SYSTEM_DIR/node_modules")
  fi
  
  # Also check if we're in a project with node_modules/@pumuki/ast-intelligence-hooks
  local repo_root=""
  if [[ "$HOOKS_SYSTEM_DIR" == *"scripts/hooks-system"* ]]; then
    # Running from scripts/hooks-system, go to repo root
    repo_root="$(cd "$HOOKS_SYSTEM_DIR/../.." && pwd)"
  elif [[ "$HOOKS_SYSTEM_DIR" == *"node_modules/@pumuki/ast-intelligence-hooks"* ]]; then
    # Running from node_modules, go to repo root
    repo_root="$(cd "$HOOKS_SYSTEM_DIR/../../.." && pwd)"
  else
    # Try current directory
    repo_root="$(pwd)"
  fi
  
  if [[ -n "$repo_root" ]] && [[ -d "$repo_root/node_modules/@pumuki/ast-intelligence-hooks/node_modules" ]]; then
    node_path_parts+=("$repo_root/node_modules/@pumuki/ast-intelligence-hooks/node_modules")
  fi
  
  if [[ -n "$repo_root" ]] && [[ -d "$repo_root/node_modules" ]]; then
    node_path_parts+=("$repo_root/node_modules")
  fi

  # Build NODE_PATH
  local node_path_value="${NODE_PATH:-}"
  for path_part in "${node_path_parts[@]}"; do
    if [[ -n "$node_path_value" ]]; then
      node_path_value="$path_part:$node_path_value"
    else
      node_path_value="$path_part"
    fi
  done

  # Execute AST with proper error handling and NODE_PATH
  # Change to HOOKS_SYSTEM_DIR so Node.js resolves modules correctly
  if [[ -n "$node_path_value" ]]; then
    ast_output=$(cd "$HOOKS_SYSTEM_DIR" && export NODE_PATH="$node_path_value" && export AUDIT_TMP="$TMP_DIR" && node "${AST_DIR}/ast-intelligence.js" 2>&1) || ast_exit_code=$?
  else
    ast_output=$(cd "$HOOKS_SYSTEM_DIR" && export AUDIT_TMP="$TMP_DIR" && node "${AST_DIR}/ast-intelligence.js" 2>&1) || ast_exit_code=$?
  fi

  # Check if AST script failed
  if [[ $ast_exit_code -ne 0 ]]; then
    printf "%b⚠️  AST Intelligence encountered errors (exit code: $ast_exit_code)%b\n" "$YELLOW" "$NC"
    printf "%bOutput:%b\n%s\n" "$YELLOW" "$NC" "$ast_output"
  fi

  # Verify JSON file was created
  if [[ ! -f "$TMP_DIR/ast-summary.json" ]]; then
    printf "%b⚠️  AST summary JSON not found - AST may have failed%b\n" "$RED" "$NC"
    printf "%bDebug info:%b\n" "$YELLOW" "$NC"
    printf "  AST script: %s\n" "${AST_DIR}/ast-intelligence.js"
    printf "  Output dir: %s\n" "$TMP_DIR"
    printf "  AST output preview:\n%s\n" "$(echo "$ast_output" | head -20)"
    return 1
  fi

  # Processing AST findings
  printf "%bProcessing AST findings...%b\n" "$YELLOW" "$NC"

  # Show raw output for debugging (first 20 lines)
  if [[ "${DEBUG_AST:-0}" == "1" ]]; then
    printf "%bDebug - AST output:%b\n%s\n" "$BLUE" "$NC" "$(echo "$ast_output" | head -20)"
    printf "%bDebug - JSON file exists:%b %s\n" "$BLUE" "$NC" "$([ -f "$TMP_DIR/ast-summary.json" ] && echo "YES" || echo "NO")"
    if [[ -f "$TMP_DIR/ast-summary.json" ]]; then
      printf "%bDebug - JSON preview:%b\n%s\n" "$BLUE" "$NC" "$(head -30 "$TMP_DIR/ast-summary.json")"
    fi
  fi

  local violation_count=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^AST\ Intelligence ]]; then
      printf "  %s\n" "$line"
    elif [[ "$line" =~ ^(🔴|🟡|🔵|🟠) ]]; then
      violation_count=$((violation_count + 1))
      if [[ $violation_count -le 10 ]]; then
        printf "  %s\n" "$line"
      fi
    elif [[ "$line" =~ ^AST\ Totals ]]; then
      printf "  %b%s%b\n" "$GREEN" "$line" "$NC"
    elif [[ "$line" =~ ^AST\ SUMMARY ]]; then
      # Skip summary lines, they're already parsed from JSON
      continue
    fi
  done < <(echo "$ast_output" | grep -E "^(🔴|🟡|🔵|🟠|AST Intelligence|AST Totals|AST SUMMARY)" || true)

  if [[ $violation_count -gt 10 ]]; then
    printf "  ... and %d more violations (see ast-summary.json for details)\n" $((violation_count - 10))
  fi

  printf "%b✅ AST Intelligence completed%b\n\n" "$GREEN" "$NC"
}

interactive_menu() {
  print_header
  PS3="Choose an option: "
  select opt in "Full audit (repo analysis)" "Strict REPO+STAGING (CI/CD)" "Strict STAGING only (dev)" "Standard CRITICAL/HIGH" "Pattern checks" "ESLint Admin+Web" "AST Intelligence" "Export Markdown" "Exit"; do
    case $REPLY in
      1) full_audit; break ;;
      2) full_audit_strict_repo_and_staging; break ;;
      3) full_audit_strict_staging_only; break ;;
      4) full_audit_standard; break ;;
      5) print_header; run_basic_checks; summarize_all; break ;;
      6) print_header; run_eslint_suite; summarize_all; break ;;
      7) print_header; run_ast_intelligence; break ;;
      8) export_markdown; break ;;
      9) printf "%s\n" "$MSG_BYE"; exit 0 ;;
      *)
        if [[ -t 0 ]]; then
          printf "Invalid option\n"
        else
          print_header
          full_audit_strict_repo_and_staging
          exit $?
        fi
        ;;
    esac
  done
}

# Non-interactive mode: if AUDIT_OPTION is set, execute directly
if [[ -n "${AUDIT_OPTION:-}" ]]; then
  case "$AUDIT_OPTION" in
    1) print_header; full_audit; exit $? ;;
    2) print_header; full_audit_strict_repo_and_staging; exit $? ;;
    3) print_header; full_audit_strict_staging_only; exit $? ;;
    4) print_header; full_audit_standard; exit $? ;;
    5) print_header; run_basic_checks; summarize_all; exit $? ;;
    6) print_header; run_eslint_suite; summarize_all; exit $? ;;
    7) print_header; run_ast_intelligence; exit $? ;;
    8) export_markdown; exit $? ;;
    9) exit 0 ;;
    *)
      printf "%bInvalid AUDIT_OPTION: %s%b\n" "$RED" "$AUDIT_OPTION" "$NC"
      exit 1
      ;;
  esac
fi

# Fallback: interactive menu para uso humano
interactive_menu
