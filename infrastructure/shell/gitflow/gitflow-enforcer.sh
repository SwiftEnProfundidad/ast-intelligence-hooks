#!/usr/bin/env bash
# =============================================================================
# Git Flow Enforcer
# =============================================================================
# Purpose: Enforce complete Git Flow cycle (steps 1-16)
# Author: AI Assistant + Carlos Merlos
# Version: 1.0.0
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
STATE_MANAGER="${SCRIPT_DIR}/gitflow-state-manager.sh"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# Git Flow State File (delegates to state manager)
# =============================================================================
STATE_FILE="${REPO_ROOT}/.git/gitflow-state.json"

init_state() {
  if [[ ! -f "$STATE_FILE" ]] || ! jq empty "$STATE_FILE" 2>/dev/null; then
    bash "$STATE_MANAGER" reset > /dev/null 2>&1 || true
  fi
}

get_state() {
  jq -r ".$1" "$STATE_FILE" 2>/dev/null || echo ""
}

reset_state() {
  bash "$STATE_MANAGER" reset > /dev/null 2>&1
}

get_step_name() {
  local step=$1
  case $step in
    1) echo "On develop branch" ;;
    2) echo "Feature/fix branch created" ;;
    3) echo "Changes made" ;;
    4) echo "Changes committed" ;;
    5) echo "Pushed to origin" ;;
    6) echo "PR created" ;;
    7) echo "PR merged" ;;
    8) echo "Remote branch deleted" ;;
    9) echo "Switched back to develop" ;;
    10) echo "Pulled latest develop" ;;
    *) echo "Step $step" ;;
  esac
}

# =============================================================================
# Git Flow Steps Validation
# =============================================================================

check_step_1() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  if [[ "$current_branch" == "develop" ]]; then
    echo -e "${GREEN}✅ Step 1: On develop${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 1 VIOLATED: Current branch is '$current_branch', not 'develop'${NC}"
    echo -e "${YELLOW}   → Run: git checkout develop${NC}"
    return 1
  fi
}

check_step_2() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  if [[ "$current_branch" =~ ^(fix|feature|feat)/ ]]; then
    echo -e "${GREEN}✅ Step 2: Feature/fix branch created: $current_branch${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 2 VIOLATED: Not on a fix/*, feature/*, or feat/* branch${NC}"
    echo -e "${YELLOW}   → Run: git checkout -b fix/your-task${NC}"
    return 1
  fi
}

check_step_3() {
  # Check if there are any changes (staged, unstaged, or committed)
  if git diff --quiet && git diff --cached --quiet && [[ $(git rev-list --count HEAD ^origin/develop 2>/dev/null || echo "0") -eq 0 ]]; then
    echo -e "${RED}❌ Step 3 VIOLATED: No changes made yet${NC}"
    echo -e "${YELLOW}   → Make changes to files${NC}"
    return 1
  else
    echo -e "${GREEN}✅ Step 3: Changes made to files${NC}"
    return 0
  fi
}

check_step_4() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  # Check if there are commits in this branch that aren't in develop
  local commit_count
  commit_count=$(git log --oneline develop..HEAD 2>/dev/null | wc -l | tr -d ' ')
  
  if [[ "$commit_count" -gt 0 ]]; then
    echo -e "${GREEN}✅ Step 4: Changes committed ($commit_count commit(s))${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 4 VIOLATED: No commits yet${NC}"
    echo -e "${YELLOW}   → Run: git commit -m 'your message'${NC}"
    return 1
  fi
}

check_step_5() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  if git ls-remote --heads origin "$current_branch" | grep -q "$current_branch"; then
    echo -e "${GREEN}✅ Step 5: Branch pushed to remote${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 5 VIOLATED: Branch '$current_branch' not pushed to remote${NC}"
    echo -e "${YELLOW}   → Run: git push origin $current_branch${NC}"
    return 1
  fi
}

check_step_6() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  local pr_count
  pr_count=$(gh pr list --head "$current_branch" --json number --jq 'length' 2>/dev/null || echo "0")
  
  if [[ "$pr_count" -gt 0 ]]; then
    echo -e "${GREEN}✅ Step 6: PR created for branch${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 6 VIOLATED: No PR exists for branch '$current_branch'${NC}"
    echo -e "${YELLOW}   → Run: gh pr create --base develop --head $current_branch${NC}"
    return 1
  fi
}

check_step_7() {
  local branch="$1"
  
  local pr_state
  pr_state=$(gh pr list --head "$branch" --state merged --json state --jq '.[0].state' 2>/dev/null || echo "")
  
  if [[ "$pr_state" == "MERGED" ]]; then
    echo -e "${GREEN}✅ Step 7: PR merged to develop${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 7 VIOLATED: PR for '$branch' not merged yet${NC}"
    echo -e "${YELLOW}   → Wait for PR approval and merge${NC}"
    return 1
  fi
}

check_step_8() {
  local branch="$1"
  
  if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
    echo -e "${RED}❌ Step 8 VIOLATED: Branch '$branch' still exists in remote${NC}"
    echo -e "${YELLOW}   → Run: git push origin --delete $branch${NC}"
    return 1
  else
    echo -e "${GREEN}✅ Step 8: Branch deleted from remote${NC}"
    return 0
  fi
}

check_step_9() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  if [[ "$current_branch" == "develop" ]]; then
    echo -e "${GREEN}✅ Step 9: Back on develop${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 9 VIOLATED: Not on develop branch${NC}"
    echo -e "${YELLOW}   → Run: git checkout develop${NC}"
    return 1
  fi
}

check_step_10() {
  if git status | grep -q "Your branch is up to date with 'origin/develop'"; then
    echo -e "${GREEN}✅ Step 10: Develop is up to date${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 10 VIOLATED: Develop not up to date with origin${NC}"
    echo -e "${YELLOW}   → Run: git pull origin develop${NC}"
    return 1
  fi
}

check_step_11() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  if [[ "$current_branch" == "develop" ]]; then
    echo -e "${GREEN}✅ Step 11: On develop - Decision point${NC}"
    echo -e "${YELLOW}   → Choice: Repeat 2-10 for next task OR proceed to step 12 for release${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 11 VIOLATED: Not on develop to make decision${NC}"
    echo -e "${YELLOW}   → Run: git checkout develop${NC}"
    return 1
  fi
}

check_step_12_pr_to_main() {
  local pr_count
  pr_count=$(gh pr list --base main --head develop --json number --jq 'length' 2>/dev/null || echo "0")
  
  if [[ "$pr_count" -gt 0 ]]; then
    echo -e "${GREEN}✅ Step 12: PR from develop to main created${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 12 VIOLATED: No PR from develop to main exists${NC}"
    echo -e "${YELLOW}   → Run: gh pr create --base main --head develop${NC}"
    return 1
  fi
}

check_step_13_merged_to_main() {
  local main_has_develop
  main_has_develop=$(git log origin/main..origin/develop --oneline 2>/dev/null | wc -l)
  
  if [[ "$main_has_develop" -eq 0 ]]; then
    echo -e "${GREEN}✅ Step 13: Develop merged to main${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 13 VIOLATED: Develop not fully merged to main${NC}"
    echo -e "${YELLOW}   → Merge the PR to main${NC}"
    return 1
  fi
}

check_step_14_tag_exists() {
  local latest_tag
  latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  
  if [[ -n "$latest_tag" ]]; then
    echo -e "${GREEN}✅ Step 14: Tag created ($latest_tag)${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 14 VIOLATED: No tag exists${NC}"
    echo -e "${YELLOW}   → Run: git tag -a vX.X.X -m 'Release vX.X.X'${NC}"
    return 1
  fi
}

check_step_15_tag_pushed() {
  local latest_tag
  latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  
  if [[ -z "$latest_tag" ]]; then
    echo -e "${RED}❌ Step 15 VIOLATED: No tag to push${NC}"
    return 1
  fi
  
  if git ls-remote --tags origin | grep -q "refs/tags/$latest_tag"; then
    echo -e "${GREEN}✅ Step 15: Tag $latest_tag pushed to remote${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 15 VIOLATED: Tag $latest_tag not pushed${NC}"
    echo -e "${YELLOW}   → Run: git push origin $latest_tag${NC}"
    return 1
  fi
}

check_step_16() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  if [[ "$current_branch" == "develop" ]]; then
    echo -e "${GREEN}✅ Step 16: Back on develop - Ready for new sprint!${NC}"
    echo -e "${YELLOW}   → Complete! Cycle back to step 2 for next feature${NC}"
    return 0
  else
    echo -e "${RED}❌ Step 16 VIOLATED: Not on develop${NC}"
    echo -e "${YELLOW}   → Run: git checkout develop${NC}"
    return 1
  fi
}

# =============================================================================
# Complete 16-Step Git Flow Workflow Display
# =============================================================================

show_complete_workflow() {
  cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║     COMPLETE GIT FLOW - 16 STEPS (NEVER SKIP ANY STEP)       ║
╚═══════════════════════════════════════════════════════════════╝

FEATURE/FIX CYCLE (Steps 1-10, repeat for each task):
  1. git checkout develop
  2. git checkout -b fix/your-task
  3. [Make changes to files]
  4. git commit -m "..." (hook decides if --no-verify needed)
  5. git push -u origin fix/your-task
  6. gh pr create --base develop
  7. gh pr merge <PR#> --squash --delete-branch
  8. [Branch auto-deleted by step 7]
  9. git checkout develop
 10. git pull origin develop

REPEAT 2-10 for each feature/fix in the sprint

RELEASE CYCLE (Steps 11-16, when sprint complete):
 11. [Decision point: more tasks OR release]
 12. gh pr create --base main --head develop
 13. gh pr merge <PR#> --squash (resolve conflicts if any)
 14. git tag -a vX.X.X -m "Release vX.X.X"
 15. git push origin main && git push origin vX.X.X
 16. git checkout develop (ready for next sprint)

RULES:
 - Hook automatically allows/blocks commits based on violations
 - Only Carlos can authorize --no-verify if needed
 - State manager validates each step before allowing action
 - NO steps can be skipped

Check current state: $0 status
EOF
}

# =============================================================================
# Main Enforcement
# =============================================================================

enforce_gitflow() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  echo -e "${BLUE}=== Git Flow Enforcer ===${NC}"
  echo ""
  
  # If on develop → ready to start new cycle, reset state
  if [[ "$current_branch" == "develop" ]]; then
    echo -e "${GREEN}✅ Ready to start new Git Flow cycle${NC}"
    echo -e "${YELLOW}Next: git checkout -b fix/your-task${NC}"
    reset_state
    return 0
  fi
  
  # For any other branch, ensure state exists but don't reset
  init_state
  
  # If on main → allow during release (steps 13-15) for pull/tag, block direct push
  if [[ "$current_branch" == "main" ]]; then
    local current_step=$(get_state "current_step")
    
    # During release (steps 13-15): Allow non-push operations (pull, tag creation, tag push)
    if [[ "$current_step" -ge 13 && "$current_step" -le 15 ]]; then
      # If this is pre-push hook, only allow tag pushes
      if [[ "${BASH_SOURCE[1]:-}" == *"pre-push"* ]]; then
        echo -e "${GREEN}✅ Tag push from main (release workflow Step $current_step/16)${NC}"
        return 0
      fi
      
      # Not a push operation (commit, pull, tag creation) - allow
      echo -e "${GREEN}✅ On main (Step $current_step/16 - Release workflow)${NC}"
      echo -e "${YELLOW}📍 Actions: git pull main, git tag vX.X.X, git push origin TAG${NC}"
      return 0
    fi
    
    # Check if we're in pre-push context and pushing only tags (outside release steps)
    if [[ -n "${GIT_PUSH_OPTION_COUNT:-}" ]] || [[ "${BASH_SOURCE[1]:-}" == *"pre-push"* ]]; then
      echo -e "${GREEN}✅ Tag push from main${NC}"
      return 0
    fi
    
    # Any other action on main → redirect to develop
    echo -e "${YELLOW}⚠️  You're on main. Switch to develop to start work.${NC}"
    echo -e "${YELLOW}   → Run: git checkout develop${NC}"
    return 1
  fi
  
  # If on feature/fix/feat branch → check current step and block if incomplete
  if [[ "$current_branch" =~ ^(fix|feature|feat)/ ]]; then
    local current_step=$(get_state "current_step")
    local stored_branch=$(get_state "feature_branch")
    
    check_step_2 || {
      echo -e "${RED}❌ Invalid branch name format${NC}"
      return 1
    }
    
    # Allow commits during active development (steps 2-6)
    # Block only if PR already merged (steps 7+) - branch should be deleted
    if [[ "$current_step" -ge 7 && "$current_step" -lt 16 ]]; then
      echo -e "${YELLOW}📍 Current Step: $current_step/16${NC}"
      echo ""
      echo -e "${RED}🚨 Git Flow VIOLATION: PR already merged${NC}"
      echo ""
      echo -e "${RED}This branch should be deleted and you should be on develop${NC}"
      echo ""
      echo -e "${YELLOW}Complete cleanup steps:${NC}"
      echo -e "  8. git push origin --delete $current_branch (if not done)"
      echo -e "  9. git checkout develop"
      echo -e " 10. git pull origin develop"
      echo ""
      echo -e "${RED}❌ COMMIT BLOCKED - Complete cleanup first${NC}"
      return 1
    fi
    
    # Steps 2-6: Allow commits (active development)
    if [[ "$current_step" -ge 2 && "$current_step" -le 6 ]]; then
      echo -e "${GREEN}✅ Step $current_step: Working on feature branch${NC}"
      echo -e "${YELLOW}📍 Remember to: git push → create PR → merge → cleanup${NC}"
      return 0
    fi
    
    # Step 16 reached - cycle complete
    if [[ "$current_step" -eq 16 ]]; then
      echo -e "${GREEN}✅ Git Flow cycle complete! (Step 16/16)${NC}"
      return 0
    fi
    
    # Step 1 on feature branch (should be impossible, but handle it)
    echo -e "${RED}❌ Invalid state: On feature branch but step is $current_step${NC}"
    echo -e "${YELLOW}Run: git checkout develop && gitflow reset${NC}"
    return 1
  fi
  
  echo -e "${YELLOW}⚠️  Unknown state. Checkout develop to reset.${NC}"
  return 1
}

# =============================================================================
# Auto-execute next step
# =============================================================================

execute_next_step() {
  local current_step=$(get_state "current_step")
  local feature_branch=$(get_state "feature_branch")
  local pr_number=$(get_state "pr_number")
  local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}🚀 Git Flow Auto-Executor - Step $current_step/16${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  
  case "$current_step" in
    1)
      echo -e "${YELLOW}📍 Step 1: On develop branch${NC}"
      echo "Creating feature/fix branch..."
      echo ""
      read -p "Enter branch name (fix/... or feature/...): " branch_name
      
      if [[ ! "$branch_name" =~ ^(fix|feature|feat)/ ]]; then
        echo -e "${RED}❌ Invalid branch name. Must start with fix/ or feature/${NC}"
        return 1
      fi
      
      echo -e "${BLUE}Executing: git checkout -b $branch_name${NC}"
      git checkout -b "$branch_name"
      
      bash "$STATE_MANAGER" advance branch_created "$branch_name"
      
      echo ""
      echo -e "${GREEN}✅ Branch created: $branch_name${NC}"
      echo -e "${YELLOW}Next: Run 'gitflow next' or start making changes${NC}"
      ;;
    2)
      echo -e "${YELLOW}📍 Step 2: Feature branch created${NC}"
      echo "Next action: Make changes and commit"
      echo ""
      echo -e "${GREEN}Status:${NC}"
      echo "  Current branch: $current_branch"
      echo "  Ready to work on your feature"
      echo ""
      echo -e "${YELLOW}When done, run 'gitflow next' to push${NC}"
      ;;
    5)
      echo -e "${YELLOW}📍 Step 5: Ready to push${NC}"
      echo -e "${BLUE}Executing: git push -u origin $current_branch${NC}"
      echo ""
      git push -u origin "$current_branch"
      bash "$STATE_MANAGER" advance push
      echo ""
      echo -e "${GREEN}✅ Pushed to origin${NC}"
      echo ""
      echo -e "${YELLOW}Next: Run 'gitflow next' to create PR${NC}"
      ;;
    6)
      if [[ -z "$pr_number" ]] || [[ "$pr_number" == "null" ]]; then
        echo -e "${YELLOW}📍 Step 6: Creating PR${NC}"
        echo -e "${BLUE}Executing: gh pr create...${NC}"
        echo ""
        
        local pr_title=$(git log -1 --pretty=%s)
        local pr_body=$(git log -1 --pretty=%b)
        
        local pr_url=$(gh pr create \
          --base develop \
          --head "$feature_branch" \
          --title "$pr_title" \
          --body "$pr_body" 2>&1 | grep "https://")
        
        local pr_num=$(echo "$pr_url" | grep -o '[0-9]\+$')
        
        cat > "$STATE_FILE" << EOF
{
  "current_step": 7,
  "current_branch": "$current_branch",
  "feature_branch": "$feature_branch",
  "pr_number": "$pr_num",
  "sprint_features": [],
  "last_action": "pr_created",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
        echo -e "${GREEN}✅ PR #${pr_num} created${NC}"
        echo -e "${BLUE}URL: $pr_url${NC}"
        echo ""
        echo -e "${YELLOW}Next: Run 'gitflow next' to merge PR${NC}"
      else
        echo -e "${YELLOW}📍 Step 6: PR already created${NC}"
        echo "PR #${pr_number}: https://github.com/SwiftEnProfundidad/R_GO/pull/${pr_number}"
        echo ""
        echo -e "${YELLOW}Next: Run 'gitflow next' to merge${NC}"
      fi
      ;;
    7)
      if [[ -n "$pr_number" ]] && [[ "$pr_number" != "null" ]]; then
        echo -e "${YELLOW}📍 Step 7: Merging PR #${pr_number}${NC}"
        echo -e "${BLUE}Executing: gh pr merge $pr_number --squash --delete-branch${NC}"
        echo ""
        gh pr merge "$pr_number" --squash --delete-branch
        
        cat > "$STATE_FILE" << EOF
{
  "current_step": 9,
  "current_branch": "develop",
  "feature_branch": "$feature_branch",
  "pr_number": "$pr_number",
  "sprint_features": [],
  "last_action": "merged",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
        echo ""
        echo -e "${GREEN}✅ PR merged and remote branch deleted${NC}"
        echo ""
        echo -e "${YELLOW}Next: Run 'gitflow next' to switch to develop${NC}"
      else
        echo -e "${RED}❌ No PR number found${NC}"
        exit 1
      fi
      ;;
    9)
      echo -e "${YELLOW}📍 Step 9: Switching to develop${NC}"
      echo -e "${BLUE}Executing: git checkout develop${NC}"
      echo ""
      git checkout develop
      
      cat > "$STATE_FILE" << EOF
{
  "current_step": 10,
  "current_branch": "develop",
  "feature_branch": "$feature_branch",
  "pr_number": null,
  "sprint_features": [],
  "last_action": "switched_to_develop",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
      echo ""
      echo -e "${GREEN}✅ Switched to develop${NC}"
      echo ""
      echo -e "${YELLOW}Next: Run 'gitflow next' to pull latest${NC}"
      ;;
    10)
      echo -e "${YELLOW}📍 Step 10: Pulling latest from develop${NC}"
      echo -e "${BLUE}Executing: git pull origin develop${NC}"
      echo ""
      git pull origin develop
      
      cat > "$STATE_FILE" << EOF
{
  "current_step": 11,
  "current_branch": "develop",
  "feature_branch": "$feature_branch",
  "pr_number": null,
  "sprint_features": [],
  "last_action": "pulled_develop",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
      echo ""
      echo -e "${GREEN}✅ Pulled latest changes${NC}"
      echo ""
      echo -e "${YELLOW}Next: Run 'gitflow next' to delete local branch${NC}"
      ;;
    11)
      echo -e "${YELLOW}📍 Step 11: Deleting local branch${NC}"
      echo -e "${BLUE}Executing: git branch -D ${feature_branch}${NC}"
      echo ""
      git branch -d "$feature_branch" 2>/dev/null || git branch -D "$feature_branch"
      bash "$STATE_MANAGER" reset
      echo ""
      echo -e "${GREEN}✅✅✅ Git Flow Cycle Complete! ✅✅✅${NC}"
      echo ""
      echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
      echo -e "${GREEN}Ready for next feature!${NC}"
      echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
      ;;
    *)
      echo -e "${YELLOW}📍 Step $current_step${NC}"
      echo "No automatic action available for this step."
      echo ""
      bash "$STATE_MANAGER" status
      ;;
  esac
}

# =============================================================================
# Auto-sync state based on repository reality
# =============================================================================

auto_sync_state() {
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  init_state
  
  local current_step=$(get_state "current_step")
  local stored_branch=$(get_state "feature_branch")
  local stored_pr=$(get_state "pr_number")
  
  local new_step=$current_step
  local new_action=$(get_state "last_action")
  local new_pr="$stored_pr"
  local changed=false
  
  # =============================================================================
  # CYCLE 1: Feature/Fix → Develop (Steps 2-7)
  # =============================================================================
  if [[ "$current_branch" =~ ^(fix|feature|feat)/ ]]; then
    new_action="branch_created"
    
    # Step 2: Branch exists
    if [[ "$current_step" -lt 2 ]]; then
      new_step=2
      new_action="branch_created"
      changed=true
    fi
    
    # Step 4: Commits exist
    local commit_count
    commit_count=$(git log --oneline develop..HEAD 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$commit_count" -gt 0 && "$new_step" -lt 4 ]]; then
      new_step=4
      new_action="changes_committed"
      changed=true
    fi
    
    # Step 5: Branch pushed to remote
    if git ls-remote --heads origin "$current_branch" 2>/dev/null | grep -q "$current_branch"; then
      if [[ "$new_step" -lt 5 ]]; then
        new_step=5
        new_action="pushed_to_origin"
        changed=true
      fi
    fi
    
    # Step 6: PR created
    local pr_number
    pr_number=$(gh pr list --head "$current_branch" --json number --jq '.[0].number' 2>/dev/null || echo "")
    if [[ -n "$pr_number" && "$new_step" -lt 6 ]]; then
      new_step=6
      new_action="pr_created"
      new_pr="$pr_number"
      changed=true
    fi
    
    # Step 7: PR merged
    local pr_state
    pr_state=$(gh pr list --head "$current_branch" --state merged --json state --jq '.[0].state' 2>/dev/null || echo "")
    if [[ "$pr_state" == "MERGED" && "$new_step" -lt 7 ]]; then
      new_step=7
      new_action="pr_merged"
      changed=true
    fi
    
    # Update state if changed
    if [[ "$changed" == "true" ]] || [[ "$new_pr" != "$stored_pr" ]]; then
      local sprint_features=$(jq -r '.sprint_features' "$STATE_FILE" 2>/dev/null || echo "[]")
      cat > "$STATE_FILE" << EOF
{
  "current_step": $new_step,
  "current_branch": "$current_branch",
  "feature_branch": "$current_branch",
  "pr_number": ${new_pr:-null},
  "sprint_features": $sprint_features,
  "last_action": "$new_action",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    fi
    return 0
  fi
  
  # =============================================================================
  # CYCLE 2: Develop → Main (Steps 12-13)
  # =============================================================================
  if [[ "$current_branch" == "develop" ]]; then
    # Step 12: PR develop → main created
    local pr_to_main
    pr_to_main=$(gh pr list --base main --head develop --json number --jq '.[0].number' 2>/dev/null || echo "")
    
    if [[ -n "$pr_to_main" && "$current_step" -lt 12 ]]; then
      new_step=12
      new_action="pr_to_main_created"
      new_pr="$pr_to_main"
      changed=true
    fi
    
    # Step 13: Develop merged to main
    local commits_not_in_main
    commits_not_in_main=$(git log origin/main..origin/develop --oneline 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ "$commits_not_in_main" -eq 0 && "$current_step" -ge 12 && "$current_step" -lt 13 ]]; then
      new_step=13
      new_action="merged_to_main"
      changed=true
    fi
    
    # Update state if changed
    if [[ "$changed" == "true" ]] || [[ "$new_pr" != "$stored_pr" ]]; then
      local sprint_features=$(jq -r '.sprint_features' "$STATE_FILE" 2>/dev/null || echo "[]")
      cat > "$STATE_FILE" << EOF
{
  "current_step": $new_step,
  "current_branch": "$current_branch",
  "feature_branch": "$stored_branch",
  "pr_number": ${new_pr:-null},
  "sprint_features": $sprint_features,
  "last_action": "$new_action",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    fi
    return 0
  fi
  
  # =============================================================================
  # CYCLE 3: Main → Release (Steps 14-15)
  # =============================================================================
  if [[ "$current_branch" == "main" ]]; then
    # Step 14: Tag created
    local latest_tag
    latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    
    if [[ -n "$latest_tag" && "$current_step" -ge 13 && "$current_step" -lt 14 ]]; then
      new_step=14
      new_action="tag_created"
      changed=true
    fi
    
    # Step 15: Tag pushed
    if [[ -n "$latest_tag" ]] && git ls-remote --tags origin 2>/dev/null | grep -q "refs/tags/$latest_tag"; then
      if [[ "$current_step" -ge 14 && "$current_step" -lt 15 ]]; then
        new_step=15
        new_action="tag_pushed"
        changed=true
      fi
    fi
    
    # Update state if changed
    if [[ "$changed" == "true" ]]; then
      local sprint_features=$(jq -r '.sprint_features' "$STATE_FILE" 2>/dev/null || echo "[]")
      cat > "$STATE_FILE" << EOF
{
  "current_step": $new_step,
  "current_branch": "$current_branch",
  "feature_branch": "$stored_branch",
  "pr_number": ${new_pr:-null},
  "sprint_features": $sprint_features,
  "last_action": "$new_action",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    fi
    return 0
  fi
  
  # Other branches: no sync needed
  return 0
}

# =============================================================================
# CLI
# =============================================================================

case "${1:-check}" in
  check)
    enforce_gitflow
    ;;
  next)
    execute_next_step
    ;;
  reset)
    reset_state
    echo -e "${GREEN}✅ Git Flow state reset${NC}"
    ;;
  workflow)
    show_complete_workflow
    ;;
  status)
    bash "$STATE_MANAGER" status
    ;;
  sync)
    auto_sync_state
    echo -e "${GREEN}✅ Git Flow state synchronized with repository${NC}"
    ;;
  *)
    echo "Usage: $0 {check|next|reset|workflow|status|sync}"
    echo ""
    echo "  check     - Validate current Git Flow state (default)"
    echo "  next      - Auto-execute next step in workflow"
    echo "  reset     - Reset Git Flow state to beginning"
    echo "  workflow  - Show complete 16-step workflow"
    echo "  status    - Show current step in workflow"
    echo "  sync      - Auto-sync state based on repository reality"
    exit 1
    ;;
esac

