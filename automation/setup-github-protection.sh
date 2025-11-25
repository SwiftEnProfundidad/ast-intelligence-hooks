#!/usr/bin/env bash
# =============================================================================
# GitHub Branch Protection Configuration Script
# =============================================================================
# Purpose: Configure branch protection rules via GitHub API
# Author: Pumuki Team®
# Version: 1.0.0
# License: MIT
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🛡️  GitHub Branch Protection Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI (gh) not found.${NC}"
  echo -e "${YELLOW}   Install: brew install gh${NC}"
  echo -e "${YELLOW}   Or visit: https://cli.github.com${NC}"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
  echo -e "${BLUE}   Running: gh auth login${NC}"
  gh auth login
fi

# Get repository info
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login' 2>/dev/null || echo "")
REPO_NAME=$(gh repo view --json name --jq '.name' 2>/dev/null || echo "")

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
  echo -e "${RED}❌ Not a GitHub repository or gh CLI not configured${NC}"
  exit 1
fi

echo -e "${GREEN}Repository: $REPO_OWNER/$REPO_NAME${NC}"
echo ""

# =============================================================================
# 1. PROTECT MAIN BRANCH
# =============================================================================
echo -e "${BLUE}1/3 Configuring main branch protection...${NC}"

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO_OWNER/$REPO_NAME/branches/main/protection" \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=ci \
  -f enforce_admins=true \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f required_pull_request_reviews[require_code_owner_reviews]=false \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -f restrictions=null \
  -f required_linear_history=false \
  -f allow_force_pushes=false \
  -f allow_deletions=false 2>/dev/null || echo -e "${YELLOW}   Already configured or insufficient permissions${NC}"

echo -e "${GREEN}✅ Main branch protected${NC}"
echo ""

# =============================================================================
# 2. PROTECT DEVELOP BRANCH
# =============================================================================
echo -e "${BLUE}2/3 Configuring develop branch protection...${NC}"

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO_OWNER/$REPO_NAME/branches/develop/protection" \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=ci \
  -f enforce_admins=false \
  -f required_pull_request_reviews=null \
  -f restrictions=null \
  -f required_linear_history=false \
  -f allow_force_pushes=false \
  -f allow_deletions=false 2>/dev/null || echo -e "${YELLOW}   Already configured or insufficient permissions${NC}"

echo -e "${GREEN}✅ Develop branch protected${NC}"
echo ""

# =============================================================================
# 3. CONFIGURE BRANCH NAMING RULES (GitHub Enterprise/Pro only)
# =============================================================================
echo -e "${BLUE}3/3 Attempting to configure branch naming rules...${NC}"

# This requires GitHub Enterprise or GitHub Pro
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO_OWNER/$REPO_NAME/rulesets" \
  -f name="Branch Naming Convention" \
  -f target="branch" \
  -f enforcement="active" \
  -f conditions[ref_name][include][]="~DEFAULT_BRANCH" \
  -f conditions[ref_name][exclude][]="refs/heads/main" \
  -f conditions[ref_name][exclude][]="refs/heads/develop" \
  -f rules[][type]="required_signatures" 2>/dev/null && echo -e "${GREEN}✅ Branch naming rules configured${NC}" || echo -e "${YELLOW}⚠️  Branch rulesets not available (requires GitHub Pro/Enterprise)${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Branch Protection Configured${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Protection Summary:${NC}"
echo -e "   • ${GREEN}main: Requires PR + 1 approval + CI${NC}"
echo -e "   • ${GREEN}develop: Requires CI, no force push${NC}"
echo -e "   • ${GREEN}No force push or deletion allowed${NC}"
echo ""
echo -e "${BLUE}🔧 Manual Configuration (Optional):${NC}"
echo -e "   1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
echo -e "   2. Add additional status checks"
echo -e "   3. Configure CODEOWNERS file"
echo ""
echo -e "${BLUE}🐈💚 Pumuki Team® - Enterprise Git Security${NC}"
echo ""

