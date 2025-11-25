#!/usr/bin/env bash
# =============================================================================
# Git Health Monitor
# =============================================================================
# Purpose: Monitor Git repository health and send alerts
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

HEALTH_LOG=".git/health-monitor.log"

log_health() {
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[$timestamp] $1" >> "$HEALTH_LOG"
}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏥 Git Repository Health Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ISSUES_FOUND=0

# =============================================================================
# 1. CHECK FOR ORPHANED BRANCHES
# =============================================================================
echo -e "${BLUE}1/8 Checking for orphaned branches...${NC}"

ORPHANED=$(git branch -r --no-merged develop | \
  grep -v 'origin/HEAD' | \
  grep -v 'origin/main' | \
  grep -v 'origin/develop' || true)

if [ -n "$ORPHANED" ]; then
    ORPHANED_COUNT=$(echo "$ORPHANED" | wc -l | tr -d ' ')
    echo -e "${YELLOW}⚠️  Found $ORPHANED_COUNT orphaned branches:${NC}"
    echo "$ORPHANED" | head -5
    log_health "WARNING: $ORPHANED_COUNT orphaned branches detected"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No orphaned branches${NC}"
fi
echo ""

# =============================================================================
# 2. CHECK FOR STALE BRANCHES (>30 days old)
# =============================================================================
echo -e "${BLUE}2/8 Checking for stale branches...${NC}"

STALE_BRANCHES=$(git for-each-ref --sort=-committerdate refs/remotes/ --format='%(committerdate:relative)|%(refname:short)' | \
  grep -E 'months?|years?' | \
  grep -v 'origin/main' | \
  grep -v 'origin/develop' || true)

if [ -n "$STALE_BRANCHES" ]; then
    STALE_COUNT=$(echo "$STALE_BRANCHES" | wc -l | tr -d ' ')
    echo -e "${YELLOW}⚠️  Found $STALE_COUNT stale branches:${NC}"
    echo "$STALE_BRANCHES" | head -5
    log_health "WARNING: $STALE_COUNT stale branches (>30 days old)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No stale branches${NC}"
fi
echo ""

# =============================================================================
# 3. CHECK FOR UNCOMMITTED CHANGES
# =============================================================================
echo -e "${BLUE}3/8 Checking for uncommitted changes...${NC}"

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    git status --short | head -5
    log_health "WARNING: Uncommitted changes in working directory"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi
echo ""

# =============================================================================
# 4. CHECK BRANCH SYNC STATUS
# =============================================================================
echo -e "${BLUE}4/8 Checking branch sync status...${NC}"

CURRENT_BRANCH=$(git branch --show-current)
UPSTREAM=$(git rev-list --count "$CURRENT_BRANCH..origin/$CURRENT_BRANCH" 2>/dev/null || echo "0")
DOWNSTREAM=$(git rev-list --count "origin/$CURRENT_BRANCH..$CURRENT_BRANCH" 2>/dev/null || echo "0")

if [ "$UPSTREAM" != "0" ]; then
    echo -e "${YELLOW}⚠️  Branch behind origin by $UPSTREAM commits${NC}"
    log_health "WARNING: $CURRENT_BRANCH behind origin by $UPSTREAM commits"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ "$DOWNSTREAM" != "0" ]; then
    echo -e "${YELLOW}⚠️  Branch ahead of origin by $DOWNSTREAM commits${NC}"
    log_health "INFO: $CURRENT_BRANCH ahead of origin by $DOWNSTREAM commits"
else
    echo -e "${GREEN}✅ Branch in sync with origin${NC}"
fi
echo ""

# =============================================================================
# 5. CHECK FOR LARGE FILES
# =============================================================================
echo -e "${BLUE}5/8 Checking for large files...${NC}"

LARGE_FILES=$(find . -type f -size +1M \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/.next/*' \
  -not -path '*/build/*' 2>/dev/null | head -5 || true)

if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Large files detected (>1MB):${NC}"
    echo "$LARGE_FILES"
    log_health "WARNING: Large files detected in repository"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No large files${NC}"
fi
echo ""

# =============================================================================
# 6. CHECK DISK USAGE (.git directory)
# =============================================================================
echo -e "${BLUE}6/8 Checking .git directory size...${NC}"

GIT_SIZE=$(du -sh .git 2>/dev/null | awk '{print $1}')
echo -e "${BLUE}   .git size: $GIT_SIZE${NC}"

# Parse size (rough check for >500MB)
GIT_SIZE_NUM=$(du -sm .git 2>/dev/null | awk '{print $1}')
if [ "$GIT_SIZE_NUM" -gt 500 ]; then
    echo -e "${YELLOW}⚠️  .git directory is large (${GIT_SIZE}), consider git gc${NC}"
    log_health "WARNING: .git directory size is ${GIT_SIZE}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ .git size is healthy${NC}"
fi
echo ""

# =============================================================================
# 7. CHECK FOR MERGE CONFLICTS IN FILES
# =============================================================================
echo -e "${BLUE}7/8 Checking for unresolved merge conflicts...${NC}"

CONFLICT_MARKERS=$(git grep -l '^<<<<<<< ' 2>/dev/null || true)

if [ -n "$CONFLICT_MARKERS" ]; then
    echo -e "${RED}❌ Unresolved merge conflicts found:${NC}"
    echo "$CONFLICT_MARKERS"
    log_health "CRITICAL: Unresolved merge conflicts detected"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No merge conflicts${NC}"
fi
echo ""

# =============================================================================
# 8. CHECK AI EVIDENCE FRESHNESS
# =============================================================================
echo -e "${BLUE}8/8 Checking AI Evidence...${NC}"

if [ -f ".AI_EVIDENCE.json" ]; then
    EVIDENCE_TIME=$(jq -r '.timestamp' .AI_EVIDENCE.json 2>/dev/null || echo "")
    if [ -n "$EVIDENCE_TIME" ]; then
        EVIDENCE_AGE=$(( $(date +%s) - $(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$EVIDENCE_TIME" +%s 2>/dev/null || echo "0") ))
        
        if [ "$EVIDENCE_AGE" -gt 180 ]; then
            echo -e "${YELLOW}⚠️  AI Evidence is stale (${EVIDENCE_AGE}s old)${NC}"
            log_health "WARNING: AI Evidence is stale (${EVIDENCE_AGE}s old)"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        else
            echo -e "${GREEN}✅ AI Evidence is fresh${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  AI Evidence has no timestamp${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No .AI_EVIDENCE.json found${NC}"
fi
echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Repository Health: EXCELLENT${NC}"
    echo -e "${GREEN}   No issues detected${NC}"
    log_health "INFO: Health check passed, 0 issues"
else
    echo -e "${YELLOW}⚠️  Repository Health: NEEDS ATTENTION${NC}"
    echo -e "${YELLOW}   $ISSUES_FOUND issue(s) detected${NC}"
    log_health "WARNING: Health check found $ISSUES_FOUND issues"
    
    echo ""
    echo -e "${BLUE}Recommended actions:${NC}"
    echo -e "  1. Run: ${YELLOW}npm run gitflow:cleanup${NC} (clean stale branches)"
    echo -e "  2. Run: ${YELLOW}npm run gitflow:sync${NC} (sync branches)"
    echo -e "  3. Run: ${YELLOW}git gc --aggressive${NC} (optimize .git)"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Health log: ${HEALTH_LOG}${NC}"
echo -e "${BLUE}🐈💚 Pumuki Team® - Git Health Monitoring${NC}"
echo ""

# Exit with error if critical issues found
if [ $ISSUES_FOUND -gt 3 ]; then
    exit 1
fi

exit 0

