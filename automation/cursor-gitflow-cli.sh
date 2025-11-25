#!/usr/bin/env bash
# =============================================================================
# Cursor Git Flow CLI
# =============================================================================
# Purpose: Command-line interface for automated Git Flow
# Author: Pumuki Team®
# Version: 1.0.0
# License: MIT
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# FUNCTIONS
# =============================================================================

print_usage() {
    cat << EOF
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${BLUE}🤖 Cursor Git Flow CLI${NC}
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${GREEN}Usage:${NC}
  cursor-gitflow <command> [options]

${GREEN}Commands:${NC}
  ${CYAN}start <name>${NC}       Start new feature/fix
                     Example: cursor-gitflow start feature/auth

  ${CYAN}complete${NC}           Complete Git Flow cycle (commit → push → PR → merge)
                     Automated end-to-end workflow

  ${CYAN}sync${NC}               Synchronize develop ↔ main branches

  ${CYAN}cleanup${NC}            Delete merged branches (local + remote)

  ${CYAN}status${NC}             Show current Git Flow status

  ${CYAN}help${NC}               Show this help message

${GREEN}Examples:${NC}
  # Start new feature
  cursor-gitflow start feature/user-authentication

  # Complete entire Git Flow automatically
  cursor-gitflow complete

  # Sync branches
  cursor-gitflow sync

  # Clean up merged branches
  cursor-gitflow cleanup

${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${BLUE}🐈💚 Pumuki Team® - Enterprise Git Automation${NC}
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

EOF
}

cmd_start() {
    local branch_name="$1"
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🚀 Starting Git Flow: ${branch_name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Validate branch name
    if ! echo "$branch_name" | grep -qE '^(feature|fix|hotfix)/[a-z0-9-]+$'; then
        echo -e "${RED}❌ Invalid branch name: $branch_name${NC}"
        echo -e "${YELLOW}   Must match: feature/*, fix/*, or hotfix/*${NC}"
        echo -e "${YELLOW}   Example: feature/user-authentication${NC}"
        exit 1
    fi
    
    # Ensure we're on develop
    echo -e "${BLUE}1/4 Switching to develop...${NC}"
    git checkout develop
    git pull origin develop
    echo -e "${GREEN}✅ On develop, up to date${NC}"
    echo ""
    
    # Create new branch
    echo -e "${BLUE}2/4 Creating branch: ${branch_name}...${NC}"
    git switch -c "$branch_name"
    echo -e "${GREEN}✅ Branch created${NC}"
    echo ""
    
    # Update AI evidence
    echo -e "${BLUE}3/4 Updating AI evidence...${NC}"
    if [ -f "$REPO_ROOT/scripts/hooks-system/bin/update-evidence.sh" ]; then
        bash "$REPO_ROOT/scripts/hooks-system/bin/update-evidence.sh" "$branch_name" 2>&1 | head -10 || true
    fi
    echo -e "${GREEN}✅ Evidence updated${NC}"
    echo ""
    
    # Show status
    echo -e "${BLUE}4/4 Status:${NC}"
    git status --short
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Ready to work on: ${branch_name}${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Make your changes"
    echo -e "  2. Run: ${CYAN}cursor-gitflow complete${NC}"
    echo ""
}

cmd_complete() {
    local current_branch
    current_branch=$(git branch --show-current)
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔄 Completing Git Flow: ${current_branch}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Validate on feature/fix branch
    if ! echo "$current_branch" | grep -qE '^(feature|fix|hotfix)/'; then
        echo -e "${RED}❌ Not on a feature/fix/hotfix branch${NC}"
        echo -e "${YELLOW}   Current: $current_branch${NC}"
        echo -e "${YELLOW}   Run: cursor-gitflow start feature/your-task${NC}"
        exit 1
    fi
    
    # Step 1: Commit changes (if any)
    echo -e "${BLUE}1/6 Checking for uncommitted changes...${NC}"
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo -e "${YELLOW}   Found uncommitted changes, committing...${NC}"
        git add -A
        
        # Generate commit message (basic version, AI can improve this)
        local short_desc
        short_desc=$(echo "$current_branch" | sed 's/^[^\/]*\///' | sed 's/-/ /g')
        git commit -m "feat: ${short_desc}"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${GREEN}✅ No uncommitted changes${NC}"
    fi
    echo ""
    
    # Step 2: Push to origin
    echo -e "${BLUE}2/6 Pushing to origin...${NC}"
    git push -u origin "$current_branch"
    echo -e "${GREEN}✅ Pushed${NC}"
    echo ""
    
    # Step 3: Create PR
    echo -e "${BLUE}3/6 Creating pull request...${NC}"
    if command -v gh &> /dev/null; then
        local pr_url
        pr_url=$(gh pr create \
            --base develop \
            --head "$current_branch" \
            --title "$(git log -1 --pretty=%s)" \
            --body "Automated PR created by Pumuki Team® Git Flow CLI

## Changes
$(git log develop..HEAD --oneline | head -10)

---
🐈💚 Pumuki Team® - Automated Git Flow")
        
        echo -e "${GREEN}✅ PR created: ${pr_url}${NC}"
        echo ""
        
        # Step 4: Wait for CI (optional)
        echo -e "${BLUE}4/6 Checking CI status...${NC}"
        local pr_number
        pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$')
        
        sleep 3 # Give CI time to start
        local ci_status
        ci_status=$(gh pr view "$pr_number" --json statusCheckRollup --jq '.statusCheckRollup[].conclusion' | head -1 || echo "pending")
        
        if [ "$ci_status" = "SUCCESS" ] || [ "$ci_status" = "success" ]; then
            echo -e "${GREEN}✅ CI passed${NC}"
        else
            echo -e "${YELLOW}⚠️  CI status: ${ci_status}${NC}"
            echo -e "${YELLOW}   Skipping auto-merge (CI not ready)${NC}"
            echo ""
            echo -e "${BLUE}Manual steps:${NC}"
            echo -e "  1. Wait for CI to pass"
            echo -e "  2. Review PR: ${pr_url}"
            echo -e "  3. Merge manually or run: ${CYAN}gh pr merge ${pr_number}${NC}"
            exit 0
        fi
        echo ""
        
        # Step 5: Merge PR
        echo -e "${BLUE}5/6 Merging pull request...${NC}"
        echo -e "${YELLOW}   Manual approval required${NC}"
        echo -e "${YELLOW}   Review PR: ${pr_url}${NC}"
        echo ""
        read -p "Merge now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gh pr merge "$pr_number" --merge --delete-branch
            echo -e "${GREEN}✅ PR merged and branch deleted${NC}"
        else
            echo -e "${YELLOW}⚠️  Skipped merge${NC}"
            echo -e "${BLUE}   To merge later: ${CYAN}gh pr merge ${pr_number}${NC}"
            exit 0
        fi
        echo ""
        
        # Step 6: Cleanup and sync
        echo -e "${BLUE}6/6 Cleanup and sync...${NC}"
        git checkout develop
        git pull origin develop
        git branch -D "$current_branch" 2>/dev/null || true
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        echo ""
        
    else
        echo -e "${YELLOW}❌ GitHub CLI (gh) not found${NC}"
        echo -e "${YELLOW}   Install: brew install gh${NC}"
        echo -e "${BLUE}Manual steps:${NC}"
        echo -e "  1. Create PR manually on GitHub"
        echo -e "  2. Wait for review and CI"
        echo -e "  3. Merge PR"
        echo -e "  4. Run: ${CYAN}cursor-gitflow cleanup${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Git Flow Completed Successfully${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}🐈💚 Pumuki Team® - Automated Git Flow${NC}"
    echo ""
}

cmd_sync() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔄 Synchronizing Branches${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Fetch all
    echo -e "${BLUE}1/3 Fetching from remote...${NC}"
    git fetch --all --prune
    echo -e "${GREEN}✅ Fetched${NC}"
    echo ""
    
    # Update develop
    echo -e "${BLUE}2/3 Updating develop...${NC}"
    git checkout develop
    git pull origin develop
    echo -e "${GREEN}✅ Develop updated${NC}"
    echo ""
    
    # Update main
    echo -e "${BLUE}3/3 Updating main...${NC}"
    git checkout main
    git pull origin main
    git checkout develop
    echo -e "${GREEN}✅ Main updated, back on develop${NC}"
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Branches Synchronized${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

cmd_cleanup() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🧹 Cleaning Up Merged Branches${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Get merged branches
    echo -e "${BLUE}1/3 Finding merged branches...${NC}"
    local merged_branches
    merged_branches=$(git branch --merged develop | grep -v '^\*' | grep -v 'develop' | grep -v 'main' | sed 's/^[* ]*//' || true)
    
    if [ -z "$merged_branches" ]; then
        echo -e "${GREEN}✅ No merged branches to clean${NC}"
        echo ""
        return 0
    fi
    
    local count
    count=$(echo "$merged_branches" | wc -l | tr -d ' ')
    echo -e "${YELLOW}Found $count merged branches:${NC}"
    echo "$merged_branches" | while read -r branch; do
        echo -e "   • $branch"
    done
    echo ""
    
    # Delete local branches
    echo -e "${BLUE}2/3 Deleting local branches...${NC}"
    echo "$merged_branches" | while read -r branch; do
        git branch -D "$branch" 2>/dev/null || true
        echo -e "${GREEN}   ✅ Deleted local: $branch${NC}"
    done
    echo ""
    
    # Delete remote branches (if gh CLI available)
    echo -e "${BLUE}3/3 Deleting remote branches...${NC}"
    if command -v gh &> /dev/null; then
        echo "$merged_branches" | while read -r branch; do
            # Check if exists on remote
            if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
                gh api -X DELETE "/repos/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/git/refs/heads/${branch}" 2>/dev/null || true
                echo -e "${GREEN}   ✅ Deleted remote: $branch${NC}"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not available, skip remote cleanup${NC}"
        echo -e "${BLUE}   Manual: git push origin --delete <branch-name>${NC}"
    fi
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Cleaned $count Branches${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

cmd_status() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Git Flow Status${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Current branch
    local current_branch
    current_branch=$(git branch --show-current)
    echo -e "${BLUE}Current Branch:${NC} ${CYAN}$current_branch${NC}"
    echo ""
    
    # Evidence status
    echo -e "${BLUE}AI Evidence:${NC}"
    if [ -f ".AI_EVIDENCE.json" ]; then
        local evidence_time
        evidence_time=$(jq -r '.timestamp' .AI_EVIDENCE.json 2>/dev/null || echo "unknown")
        local evidence_age
        evidence_age=$(( $(date +%s) - $(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$evidence_time" +%s 2>/dev/null || echo "0") ))
        
        if [ "$evidence_age" -gt 180 ]; then
            echo -e "   ${YELLOW}⚠️  Stale (${evidence_age}s old)${NC}"
        else
            echo -e "   ${GREEN}✅ Fresh (${evidence_age}s old)${NC}"
        fi
    else
        echo -e "   ${RED}❌ Missing${NC}"
    fi
    echo ""
    
    # Git status
    echo -e "${BLUE}Working Directory:${NC}"
    if git diff --quiet && git diff --cached --quiet; then
        echo -e "   ${GREEN}✅ Clean${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Uncommitted changes${NC}"
        git status --short | head -5
    fi
    echo ""
    
    # Branch sync status
    echo -e "${BLUE}Sync Status:${NC}"
    local upstream downstream
    upstream=$(git rev-list --count "$current_branch..origin/$current_branch" 2>/dev/null || echo "0")
    downstream=$(git rev-list --count "origin/$current_branch..$current_branch" 2>/dev/null || echo "0")
    
    if [ "$upstream" != "0" ]; then
        echo -e "   ${YELLOW}⚠️  Behind origin by $upstream commits${NC}"
    elif [ "$downstream" != "0" ]; then
        echo -e "   ${YELLOW}⚠️  Ahead of origin by $downstream commits${NC}"
    else
        echo -e "   ${GREEN}✅ In sync with origin${NC}"
    fi
    echo ""
    
    # List local branches
    echo -e "${BLUE}Local Branches:${NC}"
    git branch -vv | head -10
    echo ""
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    start)
        if [ -z "${2:-}" ]; then
            echo -e "${RED}❌ Missing branch name${NC}"
            echo -e "${YELLOW}Usage: cursor-gitflow start feature/your-task${NC}"
            exit 1
        fi
        cmd_start "$2"
        ;;
    
    complete)
        cmd_complete
        ;;
    
    sync)
        cmd_sync
        ;;
    
    cleanup)
        cmd_cleanup
        ;;
    
    status)
        cmd_status
        ;;
    
    help|--help|-h)
        print_usage
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac

