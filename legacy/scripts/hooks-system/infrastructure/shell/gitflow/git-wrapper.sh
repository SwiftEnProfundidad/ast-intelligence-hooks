#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Git Wrapper - Proactive GitFlow Enforcer
# ═══════════════════════════════════════════════════════════════
# Intercepts git commands BEFORE execution to enforce Git Flow
#
# Setup: Add to .zshrc
#   alias git='bash /path/to/git-wrapper.sh'
#
# This wrapper validates:
# - Branch naming (feature/, fix/, chore/, docs/)
# - Commit from correct branch
# - Evidence freshness before commit
# - Issue reference in commits
# ═══════════════════════════════════════════════════════════════

set -euo pipefail
# Protected branches (local enforcement even without GitHub branch protection)
PROTECTED_BRANCHES=("main" "develop")

is_protected_branch() {
  local name="${1#refs/heads/}"
  for protected in "${PROTECTED_BRANCHES[@]}"; do
    if [[ "$name" == "$protected" ]]; then
      return 0
    fi
  done
  return 1
}

extract_refspec_target() {
  local refspec="$1"

  if [[ "$refspec" == ":"* ]]; then
    refspec="${refspec#:}"
  fi

  if [[ "$refspec" == *:* ]]; then
    refspec="${refspec##*:}"
  fi

  refspec="${refspec#refs/heads/}"
  echo "$refspec"
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Git command (real git binary)
GIT_BIN="/usr/bin/git"

# Get repo root
REPO_ROOT=$($GIT_BIN rev-parse --show-toplevel 2>/dev/null || echo "")

#───────────────────────────────────────────────────────────────
# Validate branch name
#───────────────────────────────────────────────────────────────
validate_branch_name() {
  local branch="$1"

  # Allow main, develop, master
  if [[ "$branch" == "main" ]] || [[ "$branch" == "develop" ]] || [[ "$branch" == "master" ]]; then
    return 0
  fi

  # Must follow pattern: type/description
  if [[ ! "$branch" =~ ^(feature|fix|chore|docs|refactor|test|ci)/ ]]; then
    echo -e "${RED}❌ Invalid branch name: $branch${NC}"
    echo ""
    echo "Branch must follow pattern:"
    echo "  feature/description"
    echo "  fix/description"
    echo "  chore/description"
    echo "  docs/description"
    echo ""
    echo "Example: feature/user-authentication"
    echo ""
    return 1
  fi

  return 0
}

#───────────────────────────────────────────────────────────────
# Validate commit from correct branch
#───────────────────────────────────────────────────────────────
validate_commit_branch() {
  local current_branch=$($GIT_BIN branch --show-current 2>/dev/null || echo "")

  if [[ -z "$current_branch" ]]; then
    echo -e "${RED}❌ Detached HEAD - cannot commit${NC}"
    return 1
  fi

  # Cannot commit directly to main/develop
  if [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "develop" ]]; then
    echo -e "${RED}❌ Cannot commit directly to $current_branch${NC}"
    echo ""
    echo "Create a feature branch:"
    echo "  git checkout -b feature/my-feature"
    echo ""
    return 1
  fi

  # Validate branch name
  if ! validate_branch_name "$current_branch"; then
    return 1
  fi

  return 0
}

#───────────────────────────────────────────────────────────────
# Check evidence freshness
#───────────────────────────────────────────────────────────────
check_evidence() {
  local evidence_file="$REPO_ROOT/.AI_EVIDENCE.json"

  if [[ ! -f "$evidence_file" ]]; then
    echo -e "${YELLOW}⚠️  .AI_EVIDENCE.json not found${NC}"
    echo ""
    echo "Run: ai-start feature-name"
    echo ""
    return 1
  fi

  local evidence_ts=$(jq -r '.timestamp' "$evidence_file" 2>/dev/null || echo "")

  if [[ -z "$evidence_ts" ]] || [[ "$evidence_ts" == "null" ]]; then
    return 1
  fi

  # Convert to epoch (handle ISO 8601 with milliseconds)
  local clean_ts=$(echo "$evidence_ts" | sed 's/\.[0-9]*Z$/Z/')
  local evidence_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$clean_ts" +%s 2>/dev/null || echo "0")
  local now_epoch=$(date +%s)
  local age=$((now_epoch - evidence_epoch))

  if [[ $age -gt 180 ]]; then
    echo -e "${YELLOW}⚠️  Evidence is stale (${age}s old, max 3min)${NC}"
    echo ""
    echo "Consider running: ai-start $(git branch --show-current)"
    echo ""
    return 1
  fi

  return 0
}

#───────────────────────────────────────────────────────────────
# Validate Git Flow Content (Intelligent Semantic Analysis)
#───────────────────────────────────────────────────────────────
validate_gitflow_content() {
  local current_branch=$($GIT_BIN branch --show-current 2>/dev/null || echo "")

  # Skip if on main/develop
  if [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "develop" ]]; then
    return 0
  fi

  # Skip if not a feature/fix branch
  if [[ ! "$current_branch" =~ ^(feature|fix|feat)/ ]]; then
    return 0
  fi

  # Count commits in this branch (compare with develop)
  local commit_count=$($GIT_BIN rev-list --count develop..HEAD 2>/dev/null || echo "0")

  # Skip if first commit
  if [[ $commit_count -eq 0 ]]; then
    return 0
  fi

  # Get commit messages for semantic analysis
  local commit_messages=$($GIT_BIN log --oneline --format="%s" develop..HEAD 2>/dev/null || echo "")

  # ═══════════════════════════════════════════════════════════════
  # SEMANTIC ANALYSIS: Detect multiple features by keywords
  # ═══════════════════════════════════════════════════════════════

  # Use grep -c and ensure single integer output
  local has_android=$(echo "$commit_messages" | grep -cE "android|kotlin|detekt|ast.*rule|compose" 2>/dev/null | head -1 | tr -d '\n' || echo "0")
  local has_mcp=$(echo "$commit_messages" | grep -cE "mcp|server.*notification|cursor.*integration" 2>/dev/null | head -1 | tr -d '\n' || echo "0")
  local has_watchdog=$(echo "$commit_messages" | grep -cE "watchdog|monitor|timestamp.*parsing" 2>/dev/null | head -1 | tr -d '\n' || echo "0")
  local has_gitflow=$(echo "$commit_messages" | grep -cE "git.*flow|enforcer|wrapper|branch" 2>/dev/null | head -1 | tr -d '\n' || echo "0")
  local has_hooks=$(echo "$commit_messages" | grep -cE "hook|pre-commit|session.*loader|evidence" 2>/dev/null | head -1 | tr -d '\n' || echo "0")
  local has_frontend=$(echo "$commit_messages" | grep -cE "frontend|react|next|dashboard" 2>/dev/null | head -1 | tr -d '\n' || echo "0")
  local has_backend=$(echo "$commit_messages" | grep -cE "backend|nestjs|api|controller" 2>/dev/null | head -1 | tr -d '\n' || echo "0")

  # Count distinct features (>2 commits per feature to count)
  # Convert to integer safely
  has_android=$((has_android + 0))
  has_mcp=$((has_mcp + 0))
  has_watchdog=$((has_watchdog + 0))
  has_gitflow=$((has_gitflow + 0))
  has_hooks=$((has_hooks + 0))
  has_frontend=$((has_frontend + 0))
  has_backend=$((has_backend + 0))

  local feature_count=0
  [[ $has_android -ge 2 ]] && ((feature_count++))
  [[ $has_mcp -ge 2 ]] && ((feature_count++))
  [[ $has_watchdog -ge 2 ]] && ((feature_count++))
  [[ $has_gitflow -ge 2 ]] && ((feature_count++))
  [[ $has_hooks -ge 2 ]] && ((feature_count++))
  [[ $has_frontend -ge 2 ]] && ((feature_count++))
  [[ $has_backend -ge 2 ]] && ((feature_count++))

  # ═══════════════════════════════════════════════════════════════
  # DECISION: Multiple features in one branch?
  # ═══════════════════════════════════════════════════════════════

  # If 3+ distinct features → WARNING
  if [[ $feature_count -ge 3 ]]; then
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  GIT FLOW WARNING: Multiple Features in One Branch${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}🐈 Pumuki detectó múltiples features no relacionadas:${NC}"
    echo ""
    echo -e "${CYAN}📊 Branch: ${current_branch}${NC}"
    echo -e "${CYAN}📊 Total commits: ${commit_count}${NC}"
    echo -e "${CYAN}📊 Features detectadas: ${feature_count}${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Análisis semántico de commits:${NC}"
    [[ $has_android -ge 2 ]] && echo "   🤖 Android AST ($has_android commits)"
    [[ $has_mcp -ge 2 ]] && echo "   📡 MCP Server ($has_mcp commits)"
    [[ $has_watchdog -ge 2 ]] && echo "   👁️  Watchdog ($has_watchdog commits)"
    [[ $has_gitflow -ge 2 ]] && echo "   🔄 Git Flow ($has_gitflow commits)"
    [[ $has_hooks -ge 2 ]] && echo "   🪝 Hooks System ($has_hooks commits)"
    [[ $has_frontend -ge 2 ]] && echo "   🎨 Frontend ($has_frontend commits)"
    [[ $has_backend -ge 2 ]] && echo "   🔧 Backend ($has_backend commits)"
    echo ""
    echo -e "${YELLOW}💡 BEST PRACTICE:${NC}"
    echo "   One branch = One cohesive feature/epic"
    echo "   Multiple features = Separate PRs for better review"
    echo ""
    echo -e "${CYAN}🐈 Pumuki sugiere:${NC}"
    echo "   A) Si es un EPIC (features relacionadas) → Continúa"
    echo "   B) Si son features INDEPENDIENTES → Considera split"
    echo ""
    echo -e "${YELLOW}📝 Commits en esta rama:${NC}"
    echo "$commit_messages" | head -10 | sed 's/^/   /'
    if [[ $commit_count -gt 10 ]]; then
      echo "   ... y $((commit_count - 10)) más"
    fi
    echo ""
    echo -e "${CYAN}Esto es un WARNING (no bloqueante) - Tú decides! 🐈${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
  fi

  # If 15+ commits → Additional info
  if [[ $commit_count -ge 15 ]]; then
    echo -e "${CYAN}🐈 Pumuki nota: ${commit_count} commits es mucho para un PR${NC}"
    echo -e "${CYAN}   Considera squash o split antes de merge${NC}"
    echo ""
  fi

  return 0
}

#───────────────────────────────────────────────────────────────
# Handle git commit
#───────────────────────────────────────────────────────────────
handle_commit() {
  # Validate branch
  if ! validate_commit_branch; then
    return 1
  fi

  # Validate git flow content (intelligent semantic analysis)
  validate_gitflow_content

  # Auto-discard token status artefact to keep commits clean
  if [[ -n "$REPO_ROOT" ]] && [[ -f "$REPO_ROOT/.AI_TOKEN_STATUS.txt" ]]; then
    $GIT_BIN -C "$REPO_ROOT" checkout -- .AI_TOKEN_STATUS.txt 2>/dev/null || true
  fi

  # ═══════════════════════════════════════════════════════════════
  # ATOMIC COMMIT ENFORCER - Intelligent analysis
  # ═══════════════════════════════════════════════════════════════
  local staged_files=$($GIT_BIN diff --cached --name-only)
  local staged_count=$(echo "$staged_files" | wc -l | xargs)

  # ═══════════════════════════════════════════════════════════════
  # INTELLIGENT ANALYSIS: Check if files are related
  # ═══════════════════════════════════════════════════════════════

  # Detect projects/modules touched
  local projects=$(echo "$staged_files" | grep -E "^apps/[^/]+" | sed 's|^apps/\([^/]*\).*|\1|' | sort -u)
  local project_count=$(echo "$projects" | grep -v "^$" | wc -l | xargs)

  # Detect root-level modules
  local root_modules=$(echo "$staged_files" | grep -E "^(custom-rules|scripts|\.github|\.vscode|\.cursor)" | sed 's|^\([^/]*\).*|\1|' | sort -u)
  local root_module_count=$(echo "$root_modules" | grep -v "^$" | wc -l | xargs)

  # Detect file type patterns (backend, frontend, mobile)
  local has_backend=$(echo "$staged_files" | grep -E "^apps/backend/" | head -1)
  local has_frontend=$(echo "$staged_files" | grep -E "^apps/(admin-dashboard|web)/" | head -1)
  local has_mobile=$(echo "$staged_files" | grep -E "^apps/mobile/" | head -1)

  local concerns_count=0
  [[ -n "$has_backend" ]] && ((concerns_count++))
  [[ -n "$has_frontend" ]] && ((concerns_count++))
  [[ -n "$has_mobile" ]] && ((concerns_count++))

  # ═══════════════════════════════════════════════════════════════
  # FEATURE COHESION ANALYSIS: Are files related by feature?
  # ═══════════════════════════════════════════════════════════════

  # Extract feature/module names from paths
  # Backend: apps/backend/src/orders/... → "orders"
  # Frontend: apps/admin-dashboard/src/orders/... → "orders"
  # Mobile: apps/mobile/Orders/... → "Orders"
  local backend_features=$(echo "$staged_files" | grep -E "^apps/backend/src/[^/]+" | sed 's|^apps/backend/src/\([^/]*\).*|\1|' | sort -u | tr '[:upper:]' '[:lower:]')
  local frontend_features=$(echo "$staged_files" | grep -E "^apps/(admin-dashboard|web)/src/[^/]+" | sed 's|^apps/[^/]*/src/\([^/]*\).*|\1|' | sort -u | tr '[:upper:]' '[:lower:]')
  local mobile_features=$(echo "$staged_files" | grep -E "^apps/mobile/[^/]+" | sed 's|^apps/mobile/\([^/]*\).*|\1|' | sort -u | tr '[:upper:]' '[:lower:]')

  # Combine all features and check for overlap
  local all_features=$(echo -e "$backend_features\n$frontend_features\n$mobile_features" | grep -v "^$" | sort -u)
  local unique_feature_count=$(echo "$all_features" | wc -l | xargs)

  # Check if features are related (same feature name across platforms)
  local features_related=false
  local common_features=""
  if [[ $concerns_count -gt 1 ]]; then
    # If multiple concerns, check if they share feature names
    if [[ -n "$backend_features" ]] && [[ -n "$frontend_features" ]]; then
      common_features=$(comm -12 <(echo "$backend_features" | sort) <(echo "$frontend_features" | sort))
    fi
    if [[ -z "$common_features" ]] && [[ -n "$backend_features" ]] && [[ -n "$mobile_features" ]]; then
      common_features=$(comm -12 <(echo "$backend_features" | sort) <(echo "$mobile_features" | sort))
    fi
    if [[ -z "$common_features" ]] && [[ -n "$frontend_features" ]] && [[ -n "$mobile_features" ]]; then
      common_features=$(comm -12 <(echo "$frontend_features" | sort) <(echo "$mobile_features" | sort))
    fi

    if [[ -n "$common_features" ]]; then
      features_related=true
    fi
  else
    # Single concern → always related
    features_related=true
  fi

  # ═══════════════════════════════════════════════════════════════
  # DECISION LOGIC
  # ═══════════════════════════════════════════════════════════════

  local should_block=false
  local should_warn=false
  local reason=""

  # Rule 1: Multiple concerns BUT unrelated features → BLOCK
  # Rule 1b: Multiple concerns AND related features → ALLOW (cross-platform feature)
  if [[ $concerns_count -gt 1 ]] && [[ $features_related == false ]]; then
    should_block=true
    reason="Mixes multiple concerns (backend + frontend + mobile) with UNRELATED features"
  fi

  # Rule 2: Multiple unrelated projects → BLOCK
  if [[ $project_count -gt 1 ]] && [[ $concerns_count -gt 0 ]]; then
    should_block=true
    reason="Mixes multiple projects: $(echo "$projects" | tr '\n' ' ')"
  fi

  # Rule 3: >50 files but same feature → WARNING (allow)
  if [[ $staged_count -gt 50 ]] && [[ $should_block == false ]]; then
    should_warn=true
    reason="Large commit (${staged_count} files) - Ensure it's ONE complete feature"
  fi

  # ═══════════════════════════════════════════════════════════════
  # BLOCK: Multiple concerns or unrelated projects
  # ═══════════════════════════════════════════════════════════════
  if [[ $should_block == true ]]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ ATOMIC COMMIT VIOLATION - Multiple Concerns Detected${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${RED}Reason: ${reason}${NC}"
    echo ""
    echo -e "${YELLOW}Commit atomicity requires:${NC}"
    echo "  ✅ ONE complete feature (entity + repo + usecase + tests)"
    echo "  ✅ ONE concern (backend OR frontend OR mobile) OR"
    echo "  ✅ Cross-platform feature with SAME feature name (orders + orders + Orders)"
    echo "  ✅ Compiles + Tests pass"
    echo ""
    echo -e "${CYAN}Analysis:${NC}"
    echo "  📊 Total files: ${staged_count}"
    if [[ $project_count -gt 0 ]]; then
      echo "  📦 Projects: $(echo "$projects" | tr '\n' ' ')"
    fi
    if [[ $concerns_count -gt 0 ]]; then
      echo "  🔀 Concerns: ${concerns_count} (backend=${has_backend:+YES}, frontend=${has_frontend:+YES}, mobile=${has_mobile:+YES})"
    fi
    if [[ -n "$backend_features" ]]; then
      echo "  🔧 Backend features: $(echo "$backend_features" | tr '\n' ' ')"
    fi
    if [[ -n "$frontend_features" ]]; then
      echo "  🎨 Frontend features: $(echo "$frontend_features" | tr '\n' ' ')"
    fi
    if [[ -n "$mobile_features" ]]; then
      echo "  📱 Mobile features: $(echo "$mobile_features" | tr '\n' ' ')"
    fi
    echo ""
    echo -e "${YELLOW}💡 Tip: Cross-platform commits are OK if files share the SAME feature name${NC}"
    echo "   Example: backend/src/orders/... + admin-dashboard/src/orders/... + mobile/Orders/... ✅"
    echo ""
    echo -e "${CYAN}Solution: Split into separate commits:${NC}"
    echo ""
    echo "1. Backend changes:"
    echo "   git reset HEAD"
    echo "   git add apps/backend/** custom-rules/**"
    echo "   git commit -m \"feat(backend): ...\""
    echo ""
    echo "2. Frontend changes:"
    echo "   git add apps/admin-dashboard/**"
    echo "   git commit -m \"feat(frontend): ...\""
    echo ""
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Staged files (first 20):${NC}"
    echo "$staged_files" | head -20
    if [[ $staged_count -gt 20 ]]; then
      echo "   ... and $((staged_count - 20)) more"
    fi
    echo ""
    return 1
  fi

  # ═══════════════════════════════════════════════════════════════
  # INFO: Cross-platform feature detected (multiple concerns but related)
  # ═══════════════════════════════════════════════════════════════
  if [[ $concerns_count -gt 1 ]] && [[ $features_related == true ]] && [[ $should_block == false ]]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ CROSS-PLATFORM FEATURE DETECTED${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}Files are related by feature - Commit allowed!${NC}"
    echo ""
    if [[ -n "$common_features" ]]; then
      echo -e "${CYAN}Shared features: ${common_features}${NC}"
    fi
    echo ""
  fi

  # ═══════════════════════════════════════════════════════════════
  # WARNING: Large commit but seems related
  # ═══════════════════════════════════════════════════════════════
  if [[ $should_warn == true ]]; then
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  LARGE COMMIT WARNING${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}You have ${staged_count} files staged.${NC}"
    echo ""
    echo -e "${CYAN}This is OK if:${NC}"
    echo "  ✅ It's ONE complete feature (entity + repo + usecase + DTOs + tests + mappers)"
    echo "  ✅ All files are related (same module/feature)"
    echo "  ✅ Code compiles"
    echo "  ✅ Tests pass"
    echo ""
    echo -e "${CYAN}Analysis:${NC}"
    if [[ $project_count -gt 0 ]]; then
      echo "  📦 Project: $(echo "$projects" | tr '\n' ' ')"
    fi
    if [[ -n "$root_modules" ]]; then
      echo "  📁 Modules: $(echo "$root_modules" | tr '\n' ' ')"
    fi
    echo ""
    echo -e "${YELLOW}Proceeding with commit...${NC}"
    echo ""
  fi

  # Check evidence (warning only)
  check_evidence || true

  # Execute real git commit
  $GIT_BIN "$@"
}

#───────────────────────────────────────────────────────────────
# Handle git checkout -b (branch creation)
#───────────────────────────────────────────────────────────────
handle_branch_creation() {
  local branch_name="${3:-}"

  if [[ -z "$branch_name" ]]; then
    $GIT_BIN "$@"
    return $?
  fi

  # Validate branch name
  if ! validate_branch_name "$branch_name"; then
    return 1
  fi

  echo -e "${GREEN}✅ Branch name valid: $branch_name${NC}"

  # Execute real git
  $GIT_BIN "$@"

  # Update evidence automatically
  if [[ -f "$REPO_ROOT/scripts/hooks-system/bin/update-evidence.sh" ]]; then
    echo ""
    echo -e "${CYAN}📝 Updating evidence for new branch...${NC}"
    bash "$REPO_ROOT/scripts/hooks-system/bin/update-evidence.sh" "$branch_name" < /dev/null || true
  elif [[ -f "$REPO_ROOT/bin/update-evidence.sh" ]]; then
    echo ""
    echo -e "${CYAN}📝 Updating evidence for new branch...${NC}"
    bash "$REPO_ROOT/bin/update-evidence.sh" "$branch_name" < /dev/null || true
  fi
}

#───────────────────────────────────────────────────────────────
# Handle git push
#───────────────────────────────────────────────────────────────
handle_push() {
  shift # drop 'push'
  local git_args=("$@")
  local current_branch=$($GIT_BIN branch --show-current 2>/dev/null || echo "")
  local override="${GITFLOW_ALLOW_PROTECTED_PUSH:-false}"

  if [[ "$override" != "true" ]]; then
    if is_protected_branch "$current_branch"; then
      echo -e "${RED}❌ Push directo desde rama protegida ($current_branch) bloqueado.${NC}"
      echo ""
      echo -e "${CYAN}👉 Usa el flujo Git Flow: crea una rama feature/fix y abre PR hacia develop.${NC}"
      echo ""
      return 1
    fi

    local args_without_cmd=("${git_args[@]}")
    local delete_mode=false
    local remote_seen=false

    for arg in "${args_without_cmd[@]}"; do
      if [[ "$arg" == "--" ]]; then
        continue
      fi

      if [[ "$arg" == -* ]]; then
        case "$arg" in
          --force|-f|--force-with-lease)
            echo -e "${RED}❌ Force push bloqueado por política interna.${NC}"
            echo "   → Usa PR + merge controlado."
            return 1
            ;;
          --delete|-d)
            delete_mode=true
            continue
            ;;
          --delete=*)
            local target="${arg#*=}"
            target="${target#origin/}"
            target="${target#refs/heads/}"
            if is_protected_branch "$target"; then
              echo -e "${RED}❌ Eliminación de rama protegida ($target) bloqueada.${NC}"
              return 1
            fi
            continue
            ;;
          *)
            continue
            ;;
        esac
      fi

      if [[ "$delete_mode" == true ]]; then
        local target="${arg#origin/}"
        target="${target#refs/heads/}"
        if is_protected_branch "$target"; then
          echo -e "${RED}❌ Eliminación de rama protegida ($target) bloqueada.${NC}"
          return 1
        fi
        delete_mode=false
        continue
      fi

      if [[ "$remote_seen" == false ]]; then
        remote_seen=true
        continue
      fi

      local target
      target=$(extract_refspec_target "$arg")
      if [[ -n "$target" ]] && is_protected_branch "$target"; then
        echo -e "${RED}❌ Push directo a rama protegida ($target) bloqueado.${NC}"
        echo ""
        echo -e "${CYAN}👉 Usa Pull Request o el ciclo Git Flow (gitflow-enforcer.sh cycle).${NC}"
        echo ""
        return 1
      fi
    done
  fi

  echo -e "${BLUE}🚀 Pushing with guardrails...${NC}"
  $GIT_BIN push "${git_args[@]}"

  if [[ "$override" != "true" ]]; then
    echo ""
    echo -e "${CYAN}📍 Próximo paso recomendado: gh pr create --base develop --head $current_branch${NC}"
    echo ""
  fi
}

#───────────────────────────────────────────────────────────────
# Main wrapper logic
#───────────────────────────────────────────────────────────────
main() {
  local cmd="${1:-}"

  # If not in git repo, just execute
  if [[ -z "$REPO_ROOT" ]]; then
    exec $GIT_BIN "$@"
  fi

  case "$cmd" in
    commit)
      handle_commit "$@"
      ;;
    checkout)
      if [[ "${2:-}" == "-b" ]]; then
        handle_branch_creation "$@"
      else
        $GIT_BIN "$@"
      fi
      ;;
    push)
      handle_push "$@"
      ;;
    *)
      # Pass through to real git
      exec $GIT_BIN "$@"
      ;;
  esac
}

main "$@"
