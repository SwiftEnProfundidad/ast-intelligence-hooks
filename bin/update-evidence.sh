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

# Detect if running from node_modules (installed package) or from scripts/hooks-system (local dev)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"node_modules/@pumuki/ast-intelligence-hooks"* ]]; then
  # Running from installed package in node_modules
  HOOKS_SYSTEM_DIR="$SCRIPT_DIR/../.."
  # In node_modules, the actual hooks-system is in the package root, but scripts are in bin/
  # So we need to find the real hooks-system directory in the project
  if [[ -d "$REPO_ROOT/scripts/hooks-system" ]]; then
    HOOKS_SYSTEM_DIR="$REPO_ROOT/scripts/hooks-system"
  else
    # Fallback: use node_modules path structure
    HOOKS_SYSTEM_DIR="$SCRIPT_DIR/.."
  fi
else
  # Running from local scripts/hooks-system (development mode)
  HOOKS_SYSTEM_DIR="$REPO_ROOT/scripts/hooks-system"
fi

# Parse arguments for autonomous mode
AUTO_MODE=false
PLATFORMS=""
REFRESH_ONLY=false

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
    --refresh-only)
      REFRESH_ONLY=true
      shift
      ;;
    *)
      FEATURE_NAME="$1"
      shift
      ;;
  esac
done

# FEATURE_NAME may be provided as first argument; if not, it will default
# to a name derived from the current branch (configured after reading CURRENT_BRANCH).

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

if [[ "$REFRESH_ONLY" == "false" && ("$CURRENT_BRANCH" == "develop" || "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master") ]]; then
  echo -e "${RED}❌ AI Gate: Protected branch '$CURRENT_BRANCH'.${NC}"
  echo -e "${YELLOW}➡️  Create a feature branch (git checkout -b feature/xxx) before editing code.${NC}"
  exit 1
fi

# Derive default feature name from current branch if not provided
DEFAULT_FEATURE_NAME="manual-update"
if [[ -n "$CURRENT_BRANCH" && "$CURRENT_BRANCH" != "unknown" ]]; then
  DEFAULT_FEATURE_NAME=$(echo "$CURRENT_BRANCH" | sed 's#[/ ]#-#g')
fi
FEATURE_NAME="${FEATURE_NAME:-$DEFAULT_FEATURE_NAME}"

# Get last 3 commits for context
LAST_COMMITS=$(git log --oneline -3 2>/dev/null | head -3 | tr '\n' '; ' || echo "No recent commits")

# JSON-safe string (prevent invalid JSON when commit messages contain quotes)
LAST_COMMITS_JSON=$(printf '%s' "$LAST_COMMITS" | jq -Rs .)

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

  # Detect work type first
  local work_type="code"
  local is_docs_only=false
  local is_config_only=false
  local is_tests_only=false

  # Check if only documentation
  if [[ -n "$all_files" ]]; then
    local non_doc_files=$(echo "$all_files" | tr ' ' '\n' | grep -v "\.md$" | grep -v "^$" | head -1)
    if [[ -z "$non_doc_files" ]]; then
      is_docs_only=true
      work_type="documentation"
    fi
  fi

  # Check if only config files
  if [[ "$all_files" == *".json"* ]] || [[ "$all_files" == *".yaml"* ]] || [[ "$all_files" == *".yml"* ]]; then
    if [[ "$all_files" != *".ts"* ]] && [[ "$all_files" != *".js"* ]] && [[ "$all_files" != *".swift"* ]]; then
      is_config_only=true
      work_type="configuration"
    fi
  fi

  # Check if only tests
  if [[ "$all_files" == *".spec.ts"* ]] || [[ "$all_files" == *".test.ts"* ]]; then
    local non_test_files=$(echo "$all_files" | tr ' ' '\n' | grep -v "\.spec\." | grep -v "\.test\." | grep -v "^$" | head -1)
    if [[ -z "$non_test_files" ]]; then
      is_tests_only=true
      work_type="testing"
    fi
  fi

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
  [[ "$all_files" == *"docs/"* ]] && modules="$modules documentation,"
  [[ "$all_files" == *".windsurf/"* ]] && modules="$modules ide-config,"
  [[ "$all_files" == *".cursor/"* ]] && modules="$modules ide-config,"
  [[ "$all_files" == *".vscode/"* ]] && modules="$modules ide-config,"
  modules="${modules%,}"
  [[ -z "$modules" ]] && modules="general"

  # Detect file types (all platforms)
  local file_types=""
  # Documentation
  [[ "$all_files" == *".md"* ]] && file_types="$file_types markdown,"
  # Backend/Frontend TypeScript
  [[ "$all_files" == *".spec.ts"* ]] && file_types="$file_types tests,"
  [[ "$all_files" == *".service.ts"* ]] && file_types="$file_types services,"
  [[ "$all_files" == *".repository.ts"* ]] && file_types="$file_types repositories,"
  [[ "$all_files" == *".controller.ts"* ]] && file_types="$file_types controllers,"
  [[ "$all_files" == *".gateway.ts"* ]] && file_types="$file_types gateways,"
  [[ "$all_files" == *".interface.ts"* ]] && file_types="$file_types interfaces,"
  [[ "$all_files" == *".mock.ts"* ]] && file_types="$file_types mocks,"
  [[ "$all_files" == *".helper.ts"* ]] && file_types="$file_types helpers,"
  [[ "$all_files" == *".ts"* ]] && file_types="$file_types typescript,"
  [[ "$all_files" == *".tsx"* ]] && file_types="$file_types react-components,"
  [[ "$all_files" == *".jsx"* ]] && file_types="$file_types react-components,"
  # iOS Swift
  [[ "$all_files" == *".swift"* ]] && file_types="$file_types swift,"
  [[ "$all_files" == *"Tests.swift"* ]] && file_types="$file_types swift-tests,"
  [[ "$all_files" == *"ViewModel.swift"* ]] && file_types="$file_types viewmodels,"
  [[ "$all_files" == *"View.swift"* ]] && file_types="$file_types swiftui-views,"
  [[ "$all_files" == *"UseCase.swift"* ]] && file_types="$file_types use-cases,"
  [[ "$all_files" == *"Repository.swift"* ]] && file_types="$file_types repositories,"
  # Android Kotlin
  [[ "$all_files" == *".kt"* ]] && file_types="$file_types kotlin,"
  [[ "$all_files" == *".kts"* ]] && file_types="$file_types gradle-kotlin,"
  [[ "$all_files" == *"Test.kt"* ]] && file_types="$file_types kotlin-tests,"
  [[ "$all_files" == *"ViewModel.kt"* ]] && file_types="$file_types viewmodels,"
  [[ "$all_files" == *"Activity.kt"* ]] && file_types="$file_types activities,"
  [[ "$all_files" == *"Fragment.kt"* ]] && file_types="$file_types fragments,"
  [[ "$all_files" == *"UseCase.kt"* ]] && file_types="$file_types use-cases,"
  [[ "$all_files" == *"Repository.kt"* ]] && file_types="$file_types repositories,"
  # Scripts and config
  [[ "$all_files" == *".sh"* ]] && file_types="$file_types shell-scripts,"
  [[ "$all_files" == *".js"* ]] && file_types="$file_types javascript,"
  [[ "$all_files" == *".json"* ]] && file_types="$file_types json-config,"
  [[ "$all_files" == *".yaml"* ]] && file_types="$file_types yaml-config,"
  [[ "$all_files" == *".yml"* ]] && file_types="$file_types yaml-config,"
  [[ "$all_files" == *".xml"* ]] && file_types="$file_types xml-config,"
  [[ "$all_files" == *".plist"* ]] && file_types="$file_types plist-config,"
  [[ "$all_files" == *".gradle"* ]] && file_types="$file_types gradle,"
  file_types="${file_types%,}"
  [[ -z "$file_types" ]] && file_types="mixed files"

  # Detect layer (Clean Architecture) - only for code
  local layer="N/A"
  if [[ "$is_docs_only" == "false" ]] && [[ "$is_config_only" == "false" ]]; then
    [[ "$all_files" == *"/domain/"* ]] && layer="Domain"
    [[ "$all_files" == *"/application/"* ]] && layer="Application"
    [[ "$all_files" == *"/infrastructure/"* ]] && layer="Infrastructure"
    [[ "$all_files" == *"/presentation/"* ]] && layer="Presentation"
    [[ "$layer" == "N/A" ]] && layer="multiple layers"
  fi

  # Extract feature from branch name
  local action="working on"
  if [[ "$branch" == feature/* ]]; then
    action="implementing feature"
  elif [[ "$branch" == fix/* ]]; then
    action="fixing"
  elif [[ "$branch" == refactor/* ]]; then
    action="refactoring"
  elif [[ "$branch" == chore/* ]]; then
    action="maintenance task"
  elif [[ "$branch" == docs/* ]]; then
    action="documenting"
  fi

  # Generate contextual Q1 based on work type
  if [[ "$is_docs_only" == "true" ]]; then
    Q1="Documentation task on branch '$branch'. Modifying $file_types in: $modules. No code rules apply - focus on clarity and accuracy."
  elif [[ "$is_config_only" == "true" ]]; then
    Q1="Configuration task on branch '$branch'. Modifying $file_types. Ensure config changes are backward compatible."
  elif [[ "$is_tests_only" == "true" ]]; then
    Q1="Testing task on branch '$branch'. Modifying $file_types in: $modules. Follow AAA pattern (Arrange-Act-Assert)."
  else
    Q1="Code task on branch '$branch'. Modifying $file_types in: $modules. Target layer: $layer."
  fi

  # Generate contextual Q2 based on work type
  if [[ "$is_docs_only" == "true" ]]; then
    Q2="Documentation in: $modules. Recent commits: $commits. Check for duplicate docs before creating new ones."
  elif [[ "$is_tests_only" == "true" ]]; then
    Q2="Tests for: $modules. Recent commits: $commits. Check existing test helpers and mocks before creating new ones."
  else
    Q2="Modules affected: $modules. Recent commits: $commits. Check for existing patterns before adding new code."
  fi

  # Generate contextual Q3 based on work type
  if [[ "$is_docs_only" == "true" ]]; then
    Q3="Documentation changes in $modules. Keep docs in sync with code. Update related READMEs if needed."
  elif [[ "$is_config_only" == "true" ]]; then
    Q3="Config changes. Validate JSON/YAML syntax. Check for environment-specific values."
  elif [[ "$is_tests_only" == "true" ]]; then
    Q3="Test changes in $modules. Ensure tests are isolated, deterministic, and follow naming conventions."
  else
    Q3="Code changes in $layer layer affecting $modules. Ensure dependencies point inward (Domain <- App <- Infra)."
  fi

  # Export work type for rules selection
  export WORK_TYPE="$work_type"
  export CONTEXTUAL_Q1="$Q1"
  export CONTEXTUAL_Q2="$Q2"
  export CONTEXTUAL_Q3="$Q3"
}

# Generate contextual answers
generate_contextual_answers "$ALL_CHANGED_FILES" "$CURRENT_BRANCH" "$LAST_COMMITS"

# Extract key rules from IDE rules files (supports multiple IDEs)
# Searches: project-level first, then global Cursor config
extract_ide_rules() {
  local rules_file="$1"
  local rules_path=""
  local home_dir="${HOME}"

  # 1. Try project-level rules first (project-specific overrides)
  for ide_dir in ".windsurf" ".cursor" ".vscode" ".kilo" ".cline"; do
    local candidate="$REPO_ROOT/$ide_dir/rules/$rules_file"
    if [[ -f "$candidate" ]]; then
      rules_path="$candidate"
      break
    fi
    # Also try without .mdc extension
    candidate="$REPO_ROOT/$ide_dir/rules/${rules_file%.mdc}.md"
    if [[ -f "$candidate" ]]; then
      rules_path="$candidate"
      break
    fi
  done

  # 2. If not found in project, try Cursor project-specific cache location
  # Cursor stores rules per project in: ~/.cursor/projects/[sanitized-path]/rules/
  if [[ -z "$rules_path" ]] || [[ ! -f "$rules_path" ]]; then
    # Try to find in Cursor's project cache (where Cursor actually stores project rules)
    local sanitized_repo=$(echo "$REPO_ROOT" | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')
    local cursor_project_cache="$home_dir/.cursor/projects/$sanitized_repo/rules/$rules_file"
    if [[ -f "$cursor_project_cache" ]]; then
      rules_path="$cursor_project_cache"
    fi
  fi

  # 3. If still not found, try global Cursor locations and other projects as fallback
  if [[ -z "$rules_path" ]] || [[ ! -f "$rules_path" ]]; then
    # Try Cursor global config locations
    local global_paths=(
      "$home_dir/.cursor/rules/$rules_file"
      "$home_dir/.cursor/rules/${rules_file%.mdc}.md"
      "$home_dir/Library/Application Support/Cursor/User/rules/$rules_file"
      "$home_dir/Library/Application Support/Cursor/User/rules/${rules_file%.mdc}.md"
      "$home_dir/.config/cursor/rules/$rules_file"
      "$home_dir/.config/cursor/rules/${rules_file%.mdc}.md"
    )

    for candidate in "${global_paths[@]}"; do
      if [[ -f "$candidate" ]]; then
        rules_path="$candidate"
        break
      fi
    done
  fi

  # 4. Also check other Cursor project caches (look for rules in R_GO_local or other template projects)
  if [[ -z "$rules_path" ]] || [[ ! -f "$rules_path" ]]; then
    # Search in all Cursor project caches for this rules file
    if [[ -d "$home_dir/.cursor/projects" ]]; then
      local found_rule=$(find "$home_dir/.cursor/projects" -type f \( -name "$rules_file" -o -name "${rules_file%.mdc}.md" \) 2>/dev/null | head -1)
      if [[ -n "$found_rule" ]] && [[ -f "$found_rule" ]]; then
        rules_path="$found_rule"
      fi
    fi
  fi

  # 5. Also check for @rulesgold or goldrules (common naming)
  if [[ -z "$rules_path" ]] || [[ ! -f "$rules_path" ]]; then
    local gold_names=(
      "rulesgold.mdc"
      "goldrules.mdc"
      "@rulesgold.mdc"
      "rules-gold.mdc"
    )
    
    # Try project-level gold rules
    for ide_dir in ".cursor" ".vscode"; do
      for gold_name in "${gold_names[@]}"; do
        local candidate="$REPO_ROOT/$ide_dir/rules/$gold_name"
        if [[ -f "$candidate" ]]; then
          rules_path="$candidate"
          break 2
        fi
      done
    done

    # Try library-installed gold rules (from node_modules)
    if [[ -z "$rules_path" ]] || [[ ! -f "$rules_path" ]]; then
      for gold_name in "${gold_names[@]}"; do
        local library_gold="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/.cursor/rules/$gold_name"
        if [[ -f "$library_gold" ]]; then
          rules_path="$library_gold"
          break
        fi
      done
    fi

    # Try global gold rules
    if [[ -z "$rules_path" ]] || [[ ! -f "$rules_path" ]]; then
      for gold_name in "${gold_names[@]}"; do
        local global_gold=(
          "$home_dir/.cursor/rules/$gold_name"
          "$home_dir/Library/Application Support/Cursor/User/rules/$gold_name"
        )
        for candidate in "${global_gold[@]}"; do
          if [[ -f "$candidate" ]]; then
            rules_path="$candidate"
            break 2
          fi
        done
      done
    fi
  fi

  if [[ -n "$rules_path" ]] && [[ -f "$rules_path" ]]; then
    grep -E "^##" "$rules_path" 2>/dev/null | head -10 | sed 's/^## //' | tr '\n' '; ' || echo "No sections found"
  else
    echo "No IDE rules found"
  fi
}

# Extract AST Intelligence rules summary
extract_ast_rules() {
  local platform="$1"
  local ast_path="$HOOKS_SYSTEM_DIR/infrastructure/ast/$platform"
  
  # If hooks-system doesn't exist in project, try node_modules
  if [[ ! -d "$ast_path" ]] && [[ "$HOOKS_SYSTEM_DIR" != *"node_modules"* ]]; then
    local nm_path="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/infrastructure/ast/$platform"
    if [[ -d "$nm_path" ]]; then
      ast_path="$nm_path"
    fi
  fi

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

  local ide_sections=$(extract_ide_rules "${rules_file%.mdc}.md")
  local ast_summary=$(extract_ast_rules "$platform")

  echo "IDE Rules: $ide_sections | AST: $ast_summary"
}

run_ast_early_check() {
  if [[ "$AUTO_MODE" == "true" ]]; then
    return 0
  fi

  if [[ "${AST_EARLY_CHECK:-1}" != "1" ]]; then
    return 0
  fi

  local ast_adapter="$HOOKS_SYSTEM_DIR/bin/run-ast-adapter.js"
  if [[ ! -f "$ast_adapter" ]]; then
    # Try node_modules path
    ast_adapter="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/infrastructure/ast/run-ast-adapter.js"
    if [[ ! -f "$ast_adapter" ]]; then
      return 0
    fi
  fi

  echo -e "${BLUE}🧠 Running AST early check on staged files...${NC}"
  local ast_output
  ast_output=$(node "$ast_adapter" 2>/dev/null || echo "[]")

  local findings_count
  findings_count=$(echo "$ast_output" | jq 'length' 2>/dev/null || echo "0")

  if [[ "$findings_count" -gt 0 ]]; then
    echo -e "${YELLOW}🧠 AST Early Check: $findings_count findings on staged files (see AST reports/pre-commit).${NC}"
  else
    echo -e "${GREEN}🧠 AST Early Check: no findings on staged files.${NC}"
  fi

  if [[ "$(uname 2>/dev/null)" == "Darwin" ]]; then
    local platforms_label
    platforms_label=$(echo "$PLATFORMS_JSON" | jq -r 'join(", ")' 2>/dev/null || echo "")

    local msg
    if [[ "$findings_count" -gt 0 ]]; then
      msg="AST early check: $findings_count findings"
    else
      msg="AST early check: no findings"
    fi

    if [[ -n "$platforms_label" ]]; then
      msg+=" on $platforms_label"
    fi

    osascript -e "display notification \"$msg\" with title \"AST Hooks\" sound name \"default\"" >/dev/null 2>&1 || true
  fi
}

start_ast_watch_if_needed() {
  if [[ "$AUTO_MODE" == "true" ]]; then
    return 0
  fi

  if [[ "${AST_WATCH_AUTO:-1}" != "1" ]]; then
    return 0
  fi

  local watcher_script="$HOOKS_SYSTEM_DIR/bin/watch-hooks.js"
  if [[ ! -f "$watcher_script" ]]; then
    # Try node_modules path
    watcher_script="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/bin/watch-hooks.js"
    if [[ ! -f "$watcher_script" ]]; then
      return 0
    fi
  fi

  local pid_file="$REPO_ROOT/.ast_watch.pid"
  if [[ -f "$pid_file" ]]; then
    local existing_pid
    existing_pid=$(cat "$pid_file" 2>/dev/null || echo "")
    if [[ -n "$existing_pid" ]]; then
      local ps_out
      ps_out=$(ps -p "$existing_pid" -o args= 2>/dev/null || true)
      if echo "$ps_out" | grep -q "watch-hooks.js"; then
        echo -e "${CYAN}ℹ️  AST watch already running (PID $existing_pid).${NC}"
        if [[ "$(uname 2>/dev/null)" == "Darwin" ]]; then
          osascript -e "display notification \"AST watch already running (PID $existing_pid)\" with title \"AST Hooks\" sound name \"default\"" >/dev/null 2>&1 || true
        fi
        return 0
      fi
    fi
  fi

  local log_file="$REPO_ROOT/.ast_watch.log"
  node "$watcher_script" >"$log_file" 2>&1 &
  local new_pid=$!
  echo "$new_pid" > "$pid_file"
  echo -e "${GREEN}✅ AST watch started in background (PID $new_pid).${NC}"
  if [[ "$(uname 2>/dev/null)" == "Darwin" ]]; then
    osascript -e "display notification \"AST watch started (PID $new_pid)\" with title \"AST Hooks\" sound name \"default\"" >/dev/null 2>&1 || true
  fi
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
  # Documentation - no code rules
  if [[ "$ext" == "md" ]]; then
    echo "none"
    return
  fi

  # Hook-system / tooling scripts (Multi-platform library) - NOT platform-specific
  # These files support ALL 4 platforms (Backend, Frontend, iOS, Android)
  if [[ "$file" == *"scripts/hooks-system/"* ]] || [[ "$file" == *"scripts/hook-system/"* ]]; then
    echo "infrastructure"  # Multi-platform library, not tied to single platform
    return
  fi

  # Backend detection (NestJS apps) - relative paths like 'apps/backend/...'
  if [[ "$file" == *"apps/backend/"* ]] || [[ "$file" == *"src/backend/"* ]]; then
    echo "rulesbackend.mdc"
    return
  fi

  # Frontend detection
  if [[ "$file" == *"apps/frontend/"* ]] || [[ "$file" == *"apps/web/"* ]] || [[ "$file" == *"src/frontend/"* ]]; then
    echo "rulesfront.mdc"
    return
  fi

  # iOS detection
  if [[ "$file" == *"ios/"* ]] || [[ "$file" == *"iOS/"* ]] || [[ "$file" == *"Apps/iOS/"* ]]; then
    echo "rulesios.mdc"
    return
  fi

  # Android detection
  if [[ "$file" == *"android/"* ]] || [[ "$file" == *"Android/"* ]] || [[ "$file" == *"Apps/Android/"* ]]; then
    echo "rulesandroid.mdc"
    return
  fi

  # Extension-based detection (fallback)
  case "$ext" in
    ts)
      echo "rulesbackend.mdc"
      ;;
    tsx|jsx)
      echo "rulesfront.mdc"
      ;;
    js|mjs|cjs)
      echo "rulesbackend.mdc"
      ;;
    swift)
      echo "rulesios.mdc"
      ;;
    kt|kts)
      echo "rulesandroid.mdc"
      ;;
    sh|json|yaml|yml|xml|plist|gradle)
      echo "none"
      ;;
    *)
      echo "none"
      ;;
  esac
}

# Detect appropriate rules file
RULES_FILES=()

# Always include rulesgold.mdc if available (generic rules that apply to all projects)
GOLD_RULES_PATH=""
for gold_name in "rulesgold.mdc" "goldrules.mdc" "@rulesgold.mdc" "rules-gold.mdc"; do
  # Check library-installed rules first (highest priority for generic rules)
  if [[ -f "$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/.cursor/rules/$gold_name" ]]; then
    GOLD_RULES_PATH="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/.cursor/rules/$gold_name"
    break
  fi
  # Check project-level
  if [[ -f "$REPO_ROOT/.cursor/rules/$gold_name" ]]; then
    GOLD_RULES_PATH="$REPO_ROOT/.cursor/rules/$gold_name"
    break
  fi
  # Check global
  if [[ -f "${HOME}/.cursor/rules/$gold_name" ]]; then
    GOLD_RULES_PATH="${HOME}/.cursor/rules/$gold_name"
    break
  fi
done

if [[ -n "$GOLD_RULES_PATH" ]] && [[ -f "$GOLD_RULES_PATH" ]]; then
  RULES_FILES+=("rulesgold.mdc")
fi

if [[ -n "$STAGED_FILES" ]]; then
  # Infer platforms from ALL staged files (skip only evidence metadata files)
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue

    if [[ "$file" == ".AI_EVIDENCE.json" ]] || [[ "$file" == ".AI_SESSION_START.md" ]]; then
      continue
    fi

    rules_for_file=$(detect_rules_file "$file")
    if [[ "$rules_for_file" != "none" ]]; then
      # Use default expansion to avoid unbound variable errors under set -u
      if [[ ! " ${RULES_FILES[*]-} " =~ " $rules_for_file " ]]; then
        RULES_FILES+=("$rules_for_file")
      fi
    fi
  done <<< "$STAGED_FILES"

  # Always prepend rulesgold.mdc if available (generic rules apply to all)
  if [[ -n "$GOLD_RULES_PATH" ]] && [[ -f "$GOLD_RULES_PATH" ]]; then
    if [[ ! " ${RULES_FILES[*]-} " =~ " rulesgold.mdc " ]]; then
      RULES_FILES=("rulesgold.mdc" "${RULES_FILES[@]}")
    fi
  fi

  # Fallback: if no platform-specific rules detected, use first staged file
  if [[ ${#RULES_FILES[@]} -eq 0 ]]; then
    PRIMARY_FILE=$(echo "$STAGED_FILES" | head -1)
    RULES_FILE=$(detect_rules_file "$PRIMARY_FILE")
    RULES_FILES+=("$RULES_FILE")
  fi
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

    # Always prepend rulesgold.mdc if available (generic rules apply to all)
    if [[ -n "$GOLD_RULES_PATH" ]] && [[ -f "$GOLD_RULES_PATH" ]]; then
      if [[ ! " ${RULES_FILES[*]-} " =~ " rulesgold.mdc " ]]; then
        RULES_FILES=("rulesgold.mdc" "${RULES_FILES[@]}")
      fi
    fi

    # For single selection, maintain backward compatibility
    RULES_FILE="${RULES_FILES[0]}"
  fi
fi

# Default RULES_FILE to first detected rules file (if any)
RULES_FILE="${RULES_FILES[0]:-none}"

PLATFORMS_JSON="[]"
if [[ ${#RULES_FILES[@]} -gt 0 ]]; then
  platforms_tmp=""
  for rf in "${RULES_FILES[@]}"; do
    platform=""
    case "$rf" in
      rulesbackend.mdc|rulesbackend.md) platform="backend" ;;
      rulesfront.mdc|rulesfront.md) platform="frontend" ;;
      rulesios.mdc|rulesios.md) platform="ios" ;;
      rulesandroid.mdc|rulesandroid.md) platform="android" ;;
    esac
    if [[ -n "$platform" ]]; then
      if [[ -n "$platforms_tmp" ]]; then
        platforms_tmp+=","
      fi
      platforms_tmp+="\"$platform\""
    fi
  done
  if [[ -n "$platforms_tmp" ]]; then
    PLATFORMS_JSON="[$platforms_tmp]"
  fi
fi

echo -e "${GREEN}✅ Rules selected:${NC}"
if [[ ${#RULES_FILES[@]} -le 1 ]]; then
  echo "   • ${RULES_FILES[0]:-none}"
else
  for rule in "${RULES_FILES[@]}"; do
    echo "   • $rule"
  done
fi
echo ""

# Prepare temp file for atomic write
TMP_FILE=$(mktemp "${EVIDENCE_FILE}.tmp.XXXXXX")

# Get all modified files (staged + unstaged) and split into code vs infra
CODE_MODIFIED_FOR_JSON="[]"
INFRA_MODIFIED_FOR_JSON="[]"
if [[ -n "$ALL_CHANGED_FILES" ]] && [[ "$ALL_CHANGED_FILES" != " " ]]; then
  FILTERED_FILES=$(echo "$ALL_CHANGED_FILES" | tr ' ' '\n' | grep -v "^$" | sort -u | head -20 || true)
  if [[ -n "$FILTERED_FILES" ]]; then
    CODE_FILES=""
    INFRA_FILES=""

    while IFS= read -r f; do
      [[ -z "$f" ]] && continue

      # Classify by extension and purpose
      case "$f" in
        # Backend code (TypeScript/JavaScript in apps/backend)
        apps/backend/src/*.ts|apps/backend/src/*.js)
          CODE_FILES+="$f"$'\n'
          ;;
        # Frontend code (React/Next.js)
        apps/admin-dashboard/src/*.tsx|apps/admin-dashboard/src/*.ts|apps/admin-dashboard/src/*.jsx|apps/admin-dashboard/src/*.js)
          CODE_FILES+="$f"$'\n'
          ;;
        apps/web-app/src/*.tsx|apps/web-app/src/*.ts|apps/web-app/src/*.jsx|apps/web-app/src/*.js)
          CODE_FILES+="$f"$'\n'
          ;;
        # iOS code (Swift)
        apps/ios/*.swift|apps/ios/**/*.swift)
          CODE_FILES+="$f"$'\n'
          ;;
        # Android code (Kotlin)
        apps/android/*.kt|apps/android/**/*.kt)
          CODE_FILES+="$f"$'\n'
          ;;
        # Hook-system code (JavaScript/Shell - FIRST CLASS CODE)
        scripts/hooks-system/*.js|scripts/hooks-system/**/*.js|scripts/hooks-system/*.sh|scripts/hooks-system/**/*.sh)
          CODE_FILES+="$f"$'\n'
          ;;
        # Infrastructure (docs, configs, metadata - NOT code)
        *.md|*.json|*.yaml|*.yml|*.toml|.AI_*|docs/*|.cursor/*|.vscode/*|.windsurf/*|.pre-commit-config.yaml|package.json|tsconfig.json|*.baseline.json)
          INFRA_FILES+="$f"$'\n'
          ;;
        # Default: if in src/ directory → CODE, else → INFRA
        */src/*)
          CODE_FILES+="$f"$'\n'
          ;;
        *)
          INFRA_FILES+="$f"$'\n'
          ;;
      esac
    done <<< "$FILTERED_FILES"

    if [[ -n "$CODE_FILES" ]]; then
      CODE_MODIFIED_FOR_JSON=$(echo "$CODE_FILES" | grep -v "^$" | jq -R . | jq -s . 2>/dev/null || echo "[]")
    fi

    if [[ -n "$INFRA_FILES" ]]; then
      INFRA_MODIFIED_FOR_JSON=$(echo "$INFRA_FILES" | grep -v "^$" | jq -R . | jq -s . 2>/dev/null || echo "[]")
    fi
  fi
fi

# Get rules summary based on work type (single-platform case)
if [[ "$WORK_TYPE" == "documentation" ]]; then
  RULES_SUMMARY="N/A - Documentation only (no code rules apply)"
  RULES_FILE="none"
elif [[ "$WORK_TYPE" == "configuration" ]]; then
  RULES_SUMMARY="N/A - Configuration only (validate syntax)"
  RULES_FILE="none"
else
  RULES_SUMMARY=$(get_rules_summary "$RULES_FILE")
fi

# Generate contextual answers
generate_contextual_answers "$ALL_CHANGED_FILES" "$CURRENT_BRANCH" "$LAST_COMMITS"

# JSON-safe protocol answers (prevent invalid JSON when answers contain quotes)
CONTEXTUAL_Q1_JSON=$(printf '%s' "${CONTEXTUAL_Q1:-}" | jq -Rs .)
CONTEXTUAL_Q2_JSON=$(printf '%s' "${CONTEXTUAL_Q2:-}" | jq -Rs .)
CONTEXTUAL_Q3_JSON=$(printf '%s' "${CONTEXTUAL_Q3:-}" | jq -Rs .)

# Generate evidence JSON with multi-platform support
if [[ ${#RULES_FILES[@]} -le 1 ]]; then
  # Single platform (backward compatible)
  cat > "$TMP_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "session_id": "$FEATURE_NAME",
  "action": "$(echo $FEATURE_NAME | sed 's/-/_/g')",
  "work_type": "$WORK_TYPE",
  "platforms": $PLATFORMS_JSON,
  "files_modified": $CODE_MODIFIED_FOR_JSON,
  "infra_modified": $INFRA_MODIFIED_FOR_JSON,
  "rules_read": {
    "file": "$RULES_FILE",
    "verified": true,
    "summary": "$RULES_SUMMARY"
  },
  "protocol_3_questions": {
    "answered": true,
    "question_1_file_type": $CONTEXTUAL_Q1_JSON,
    "question_2_similar_exists": $CONTEXTUAL_Q2_JSON,
    "question_3_clean_architecture": $CONTEXTUAL_Q3_JSON
  },
  "current_context": {
    "branch": "$CURRENT_BRANCH",
    "last_commits": $LAST_COMMITS_JSON
  },
  "justification": "Context-aware evidence for branch '$CURRENT_BRANCH'. Auto-detected modules and file types from current work.",
  "approved_by": "Pumuki Team®"
}
EOF
else
  # Multiple platforms
  RULES_JSON="["
  for i in "${!RULES_FILES[@]}"; do
    if [[ $i -gt 0 ]]; then
      RULES_JSON+=","
    fi
    rule_summary=$(get_rules_summary "${RULES_FILES[$i]}")
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
  "work_type": "$WORK_TYPE",
  "platforms": $PLATFORMS_JSON,
  "files_modified": $CODE_MODIFIED_FOR_JSON,
  "infra_modified": $INFRA_MODIFIED_FOR_JSON,
  "rules_read": $RULES_JSON,
  "also_read": [".AI_SESSION_START.md"],
  "protocol_3_questions": {
    "answered": true,
    "question_1_file_type": $CONTEXTUAL_Q1_JSON,
    "question_2_similar_exists": $CONTEXTUAL_Q2_JSON,
    "question_3_clean_architecture": $CONTEXTUAL_Q3_JSON
  },
  "current_context": {
    "branch": "$CURRENT_BRANCH",
    "last_commits": $LAST_COMMITS_JSON
  },
  "justification": "Context-aware evidence for branch '$CURRENT_BRANCH'. Auto-detected modules and file types from current work.",
  "approved_by": "Pumuki Team®"
}
EOF
fi

mv "$TMP_FILE" "$EVIDENCE_FILE"

# Execute audit first to get violations, then call intelligent-audit to add ai_gate
# Always run audit if ai_gate is missing or if not in refresh-only mode
NEEDS_AUDIT=false
if [[ "$REFRESH_ONLY" == "false" ]]; then
  NEEDS_AUDIT=true
elif [[ -f "$EVIDENCE_FILE" ]]; then
  # Check if ai_gate section exists in evidence
  if ! grep -q '"ai_gate"' "$EVIDENCE_FILE" 2>/dev/null; then
    NEEDS_AUDIT=true
  fi
fi

if [[ "$NEEDS_AUDIT" == "true" ]]; then
  # Run AST audit to detect violations (only staged files for evidence)
  # Clean previous ast-summary.json to avoid reading violations from full repo audits
  rm -f "$REPO_ROOT/.audit_tmp/ast-summary.json" 2>/dev/null || true
  
  export STAGING_ONLY_MODE=1
  AST_SCRIPT="$HOOKS_SYSTEM_DIR/infrastructure/ast/ast-intelligence.js"
  if [[ ! -f "$AST_SCRIPT" ]]; then
    AST_SCRIPT="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/infrastructure/ast/ast-intelligence.js"
  fi
  if [[ -f "$AST_SCRIPT" ]]; then
    node "$AST_SCRIPT" >/dev/null 2>&1 || true
  fi
  unset STAGING_ONLY_MODE
fi

# Call intelligent-audit to add ai_gate, watchers, git_flow sections
INTELLIGENT_AUDIT="$HOOKS_SYSTEM_DIR/infrastructure/orchestration/intelligent-audit.js"
if [[ ! -f "$INTELLIGENT_AUDIT" ]]; then
  # Try node_modules path
  INTELLIGENT_AUDIT="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/infrastructure/orchestration/intelligent-audit.js"
fi
if [[ -f "$INTELLIGENT_AUDIT" ]]; then
  node "$INTELLIGENT_AUDIT" >/dev/null 2>&1 || true
fi

if [[ "$AUTO_MODE" == "true" ]]; then
  if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"AI evidence updated at $TIMESTAMP\" with title \"✅ Evidence Updated\" sound name \"Glass\"" 2>/dev/null || true
  fi
  echo "{\"success\":true,\"timestamp\":\"$TIMESTAMP\",\"session\":\"$FEATURE_NAME\",\"platforms\":\"$PLATFORMS\",\"mode\":\"autonomous\"}"
  exit 0
fi

run_ast_early_check
start_ast_watch_if_needed

SYNC_SCRIPT="$HOOKS_SYSTEM_DIR/bin/sync-autonomous-orchestrator.sh"
if [[ ! -x "$SYNC_SCRIPT" ]]; then
  # Try node_modules path
  SYNC_SCRIPT="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/bin/sync-autonomous-orchestrator.sh"
fi
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
  echo ""
fi

# Show token status if available
TOKEN_STATUS="$REPO_ROOT/.AI_TOKEN_STATUS.txt"
if [[ -f "$TOKEN_STATUS" ]]; then
  cat "$TOKEN_STATUS"
  echo ""
fi

echo -e "${GREEN}🚀 You can now start editing code${NC}"
