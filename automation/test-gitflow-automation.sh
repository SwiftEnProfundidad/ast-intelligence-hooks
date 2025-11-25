#!/usr/bin/env bash
# =============================================================================
# Git Flow Automation - End-to-End Testing
# =============================================================================
# Purpose: Test complete automation system
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

TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Git Flow Automation - End-to-End Testing${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =============================================================================
# TEST 1: Pre-commit Framework
# =============================================================================
echo -e "${CYAN}TEST 1: Pre-commit Framework Installation${NC}"
if command -v pre-commit &> /dev/null; then
    echo -n "   pre-commit installed... "
    test_result
else
    echo -n "   pre-commit NOT installed... "
    false
    test_result
fi

# =============================================================================
# TEST 2: Pre-commit Config
# =============================================================================
echo -e "${CYAN}TEST 2: Pre-commit Configuration${NC}"
if [ -f ".pre-commit-config.yaml" ]; then
    echo -n "   .pre-commit-config.yaml exists... "
    test_result

    # Validate YAML
    if python3 -c "import yaml; yaml.safe_load(open('.pre-commit-config.yaml'))" 2>/dev/null; then
        echo -n "   YAML is valid... "
        test_result
    else
        echo -n "   YAML is invalid... "
        false
        test_result
    fi
else
    echo -n "   .pre-commit-config.yaml missing... "
    false
    test_result
fi

# =============================================================================
# TEST 3: Git Hooks Installed
# =============================================================================
echo -e "${CYAN}TEST 3: Git Hooks Installation${NC}"
if [ -f ".git/hooks/pre-commit" ]; then
    echo -n "   pre-commit hook installed... "
    test_result
else
    echo -n "   pre-commit hook NOT installed... "
    false
    test_result
fi

# =============================================================================
# TEST 4: CLI Scripts Executable
# =============================================================================
echo -e "${CYAN}TEST 4: CLI Scripts${NC}"
if [ -x "scripts/automation/cursor-gitflow-cli.sh" ]; then
    echo -n "   cursor-gitflow-cli.sh executable... "
    test_result
else
    echo -n "   cursor-gitflow-cli.sh NOT executable... "
    false
    test_result
fi

# =============================================================================
# TEST 5: MCP Server Exists
# =============================================================================
echo -e "${CYAN}TEST 5: MCP Server${NC}"
if [ -f "scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js" ]; then
    echo -n "   gitflow-automation-watcher.js exists... "
    test_result

    # Test syntax
    if node -c "scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js" 2>/dev/null; then
        echo -n "   JavaScript syntax valid... "
        test_result
    else
        echo -n "   JavaScript syntax invalid... "
        false
        test_result
    fi
else
    echo -n "   MCP server missing... "
    false
    test_result
fi

# =============================================================================
# TEST 6: GitHub Actions Workflows
# =============================================================================
echo -e "${CYAN}TEST 6: GitHub Actions Workflows${NC}"

WORKFLOWS=(
    "auto-branch-cleanup.yml"
    "auto-sync-release.yml"
    "pre-merge-validation.yml"
    "post-merge-automation.yml"
    "health-monitoring.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -n "   $workflow exists... "
        test_result
    else
        echo -n "   $workflow missing... "
        false
        test_result
    fi
done

# =============================================================================
# TEST 7: Monitoring Scripts
# =============================================================================
echo -e "${CYAN}TEST 7: Monitoring Scripts${NC}"

if [ -x "scripts/monitoring/git-health-monitor.sh" ]; then
    echo -n "   git-health-monitor.sh executable... "
    test_result
else
    echo -n "   git-health-monitor.sh missing/not executable... "
    false
    test_result
fi

if [ -x "scripts/monitoring/audit-logger.sh" ]; then
    echo -n "   audit-logger.sh executable... "
    test_result
else
    echo -n "   audit-logger.sh missing/not executable... "
    false
    test_result
fi

if [ -x "scripts/automation/auto-rollback.sh" ]; then
    echo -n "   auto-rollback.sh executable... "
    test_result
else
    echo -n "   auto-rollback.sh missing/not executable... "
    false
    test_result
fi

# =============================================================================
# TEST 8: Package.json Scripts
# =============================================================================
echo -e "${CYAN}TEST 8: NPM Scripts${NC}"

NPM_SCRIPTS=(
    "gitflow:start"
    "gitflow:complete"
    "gitflow:sync"
    "gitflow:cleanup"
    "gitflow:status"
    "setup:pre-commit"
    "setup:github-protection"
)

for script in "${NPM_SCRIPTS[@]}"; do
    if grep -q "\"$script\"" package.json; then
        echo -n "   npm run $script defined... "
        test_result
    else
        echo -n "   npm run $script missing... "
        false
        test_result
    fi
done

# =============================================================================
# TEST 9: Cursor Rules
# =============================================================================
echo -e "${CYAN}TEST 9: Cursor Rules${NC}"

if [ -f ".cursor/rules/auto-gitflow.mdc" ]; then
    echo -n "   auto-gitflow.mdc exists... "
    test_result
else
    echo -n "   auto-gitflow.mdc missing... "
    false
    test_result
fi

# =============================================================================
# TEST 10: Library Sync
# =============================================================================
echo -e "${CYAN}TEST 10: Library Synchronization${NC}"

LIB_PATH="/Users/juancarlosmerlosalbarracin/Libraries/ast-intelligence-hooks"

if [ -d "$LIB_PATH/automation" ]; then
    echo -n "   Library automation/ exists... "
    test_result

    if [ -f "$LIB_PATH/automation/cursor-gitflow-cli.sh" ]; then
        echo -n "   cursor-gitflow-cli.sh in library... "
        test_result
    else
        echo -n "   cursor-gitflow-cli.sh NOT in library... "
        false
        test_result
    fi
else
    echo -n "   Library automation/ missing... "
    false
    test_result
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Results${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))

echo -e "${BLUE}Success Rate: ${PERCENTAGE}%${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 ALL TESTS PASSED${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}✅ Git Flow Automation system is ready${NC}"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "  1. Run: ${CYAN}npm run setup:pre-commit${NC}"
    echo -e "  2. Run: ${CYAN}npm run setup:github-protection${NC}"
    echo -e "  3. Test with: ${CYAN}npm run gitflow:status${NC}"
    echo ""
    echo -e "${BLUE}🐈💚 Pumuki Team® - Testing Complete${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Please review failed tests above${NC}"
    echo -e "${YELLOW}Run individual tests manually to debug${NC}"
    echo ""
    echo -e "${BLUE}🐈💚 Pumuki Team® - Fix Issues and Re-test${NC}"
    echo ""
    exit 1
fi
