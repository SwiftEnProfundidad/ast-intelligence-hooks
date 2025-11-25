#!/usr/bin/env bash
# =============================================================================
# Auto Rollback System
# =============================================================================
# Purpose: Automatically rollback failed merges/deployments
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
NC='\033[0m'

ROLLBACK_LOG=".git/rollback.log"

log_rollback() {
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[$timestamp] $1" >> "$ROLLBACK_LOG"
}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔄 Auto Rollback System${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =============================================================================
# CHECK FOR ROLLBACK TRIGGER
# =============================================================================

TRIGGER="${1:-auto}"
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${BLUE}Trigger: $TRIGGER${NC}"
echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"
echo ""

# =============================================================================
# DETECT FAILURE CONDITIONS
# =============================================================================

echo -e "${BLUE}🔍 Detecting failure conditions...${NC}"
echo ""

SHOULD_ROLLBACK=false
ROLLBACK_REASON=""

# Condition 1: Tests failing (>50% failure rate)
echo -e "${BLUE}1/5 Checking test results...${NC}"
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    TEST_OUTPUT=$(npm run test:ci 2>&1 || true)
    
    if echo "$TEST_OUTPUT" | grep -qE 'FAIL.*[5-9][0-9]%|FAIL.*100%'; then
        echo -e "${RED}❌ >50% tests failing${NC}"
        SHOULD_ROLLBACK=true
        ROLLBACK_REASON="Critical test failures (>50%)"
        log_rollback "TRIGGER: >50% tests failing"
    else
        echo -e "${GREEN}✅ Tests passing or <50% failures${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Test framework not available${NC}"
fi
echo ""

# Condition 2: Build failing
echo -e "${BLUE}2/5 Checking build status...${NC}"
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    if ! npm run build 2>&1 | tee /tmp/build-output.log; then
        echo -e "${RED}❌ Build failing${NC}"
        SHOULD_ROLLBACK=true
        ROLLBACK_REASON="Build failure"
        log_rollback "TRIGGER: Build failing"
    else
        echo -e "${GREEN}✅ Build successful${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Build system not available${NC}"
fi
echo ""

# Condition 3: Linter errors (critical only)
echo -e "${BLUE}3/5 Checking for critical linter errors...${NC}"
if command -v npm &> /dev/null && grep -q '"lint:check"' package.json 2>/dev/null; then
    LINT_OUTPUT=$(npm run lint:check 2>&1 || true)
    
    if echo "$LINT_OUTPUT" | grep -qE 'error.*[1-9][0-9]{2,}|error.*[5-9][0-9]'; then
        echo -e "${RED}❌ Critical linter errors (>50)${NC}"
        SHOULD_ROLLBACK=true
        ROLLBACK_REASON="Critical linter errors"
        log_rollback "TRIGGER: Critical linter errors"
    else
        echo -e "${GREEN}✅ No critical linter errors${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Linter not configured${NC}"
fi
echo ""

# Condition 4: Recent commit has keyword "ROLLBACK" or "REVERT"
echo -e "${BLUE}4/5 Checking recent commit messages...${NC}"
RECENT_COMMIT=$(git log -1 --pretty=%B)

if echo "$RECENT_COMMIT" | grep -qiE 'ROLLBACK|REVERT|CRITICAL'; then
    echo -e "${YELLOW}⚠️  Rollback keyword detected in commit${NC}"
    SHOULD_ROLLBACK=true
    ROLLBACK_REASON="Rollback keyword in commit"
    log_rollback "TRIGGER: Rollback keyword in commit message"
else
    echo -e "${GREEN}✅ No rollback keywords${NC}"
fi
echo ""

# Condition 5: Manual trigger
echo -e "${BLUE}5/5 Checking manual trigger...${NC}"
if [ "$TRIGGER" = "manual" ]; then
    echo -e "${YELLOW}⚠️  Manual rollback requested${NC}"
    SHOULD_ROLLBACK=true
    ROLLBACK_REASON="Manual rollback requested"
    log_rollback "TRIGGER: Manual rollback"
else
    echo -e "${GREEN}✅ No manual trigger${NC}"
fi
echo ""

# =============================================================================
# EXECUTE ROLLBACK IF NEEDED
# =============================================================================

if [ "$SHOULD_ROLLBACK" = true ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}🚨 ROLLBACK TRIGGERED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}Reason: $ROLLBACK_REASON${NC}"
    echo ""
    
    # Get last known good commit (last commit before current)
    LAST_GOOD_COMMIT=$(git rev-parse HEAD~1)
    LAST_GOOD_MESSAGE=$(git log -1 --pretty=%B HEAD~1)
    
    echo -e "${BLUE}Last known good commit:${NC}"
    echo -e "   Hash: $LAST_GOOD_COMMIT"
    echo -e "   Message: $LAST_GOOD_MESSAGE"
    echo ""
    
    # Create rollback branch
    ROLLBACK_BRANCH="rollback/auto-$(date +%Y%m%d-%H%M%S)"
    echo -e "${BLUE}Creating rollback branch: $ROLLBACK_BRANCH${NC}"
    git checkout -b "$ROLLBACK_BRANCH"
    
    # Revert to last good commit
    echo -e "${BLUE}Reverting to last good commit...${NC}"
    git reset --hard "$LAST_GOOD_COMMIT"
    
    # Push rollback branch
    echo -e "${BLUE}Pushing rollback branch...${NC}"
    git push -u origin "$ROLLBACK_BRANCH"
    
    log_rollback "ROLLBACK EXECUTED: Reverted to $LAST_GOOD_COMMIT ($ROLLBACK_REASON)"
    
    echo ""
    echo -e "${GREEN}✅ Rollback completed${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Review rollback branch: $ROLLBACK_BRANCH"
    echo -e "  2. Fix the issues that caused the rollback"
    echo -e "  3. Create new feature branch from develop"
    echo ""
    
    # Create GitHub issue (if gh CLI available)
    if command -v gh &> /dev/null; then
        echo -e "${BLUE}Creating GitHub issue for tracking...${NC}"
        
        ISSUE_URL=$(gh issue create \
            --title "🚨 Auto Rollback: $ROLLBACK_REASON" \
            --body "## 🚨 Automatic Rollback Executed

**Reason:** $ROLLBACK_REASON

**Rollback Branch:** \`$ROLLBACK_BRANCH\`

**Reverted to:** $LAST_GOOD_COMMIT

**Original Commit Message:**
\`\`\`
$LAST_GOOD_MESSAGE
\`\`\`

### 🔍 Analysis Required

Please investigate and fix:
1. Root cause of failure
2. Why automated checks didn't catch this
3. Add additional validation if needed

### 🔧 Recovery Steps

1. Checkout rollback branch: \`git checkout $ROLLBACK_BRANCH\`
2. Review changes
3. Create fix in new feature branch
4. Test thoroughly before merging

---
🐈💚 **Pumuki Team®** - Automated Rollback System" \
            --label "bug,rollback,urgent")
        
        echo -e "${GREEN}✅ Issue created: $ISSUE_URL${NC}"
        log_rollback "GitHub issue created: $ISSUE_URL"
    fi
    
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}🐈💚 Pumuki Team® - Auto Rollback Complete${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    exit 1
else
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ No Rollback Needed${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}Repository is healthy, no rollback required${NC}"
    log_rollback "INFO: Health check passed, no rollback needed"
    echo ""
    echo -e "${BLUE}🐈💚 Pumuki Team® - System Stable${NC}"
    echo ""
    
    exit 0
fi

