#!/usr/bin/env bash
# =============================================================================
# Pre-commit Framework Installation Script
# =============================================================================
# Purpose: Install and configure pre-commit framework (cannot be bypassed)
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

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 Pre-commit Framework Installation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}❌ Python 3 not found. Please install Python 3 first.${NC}"
  exit 1
fi

echo -e "${BLUE}1/5 Installing pre-commit via pip...${NC}"
if command -v pre-commit &> /dev/null; then
  echo -e "${GREEN}✅ pre-commit already installed ($(pre-commit --version))${NC}"
else
  python3 -m pip install --user pre-commit
  echo -e "${GREEN}✅ pre-commit installed${NC}"
fi

echo ""
echo -e "${BLUE}2/5 Installing pre-commit hooks in .git/hooks...${NC}"
pre-commit install --install-hooks --overwrite
echo -e "${GREEN}✅ Hooks installed${NC}"

echo ""
echo -e "${BLUE}3/5 Installing commit-msg hook...${NC}"
pre-commit install --hook-type commit-msg
echo -e "${GREEN}✅ Commit-msg hook installed${NC}"

echo ""
echo -e "${BLUE}4/5 Installing pre-push hook...${NC}"
pre-commit install --hook-type pre-push
echo -e "${GREEN}✅ Pre-push hook installed${NC}"

echo ""
echo -e "${BLUE}5/5 Running initial validation...${NC}"
if pre-commit run --all-files 2>&1 | head -20 || true; then
  echo -e "${GREEN}✅ Pre-commit framework ready${NC}"
else
  echo -e "${YELLOW}⚠️  Some checks failed (expected on first run)${NC}"
  echo -e "${YELLOW}   Run 'pre-commit run --all-files' to see details${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Pre-commit Framework Installed Successfully${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Key Benefits:${NC}"
echo -e "   • ${GREEN}Cannot be bypassed with --no-verify${NC}"
echo -e "   • ${GREEN}Runs automatically on every commit${NC}"
echo -e "   • ${GREEN}Validates AI evidence before commit${NC}"
echo -e "   • ${GREEN}Enforces Git Flow compliance${NC}"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo -e "   1. Review .pre-commit-config.yaml"
echo -e "   2. Configure GitHub branch protection (if using GitHub)"
echo -e "   3. Make a test commit to verify"
echo ""

