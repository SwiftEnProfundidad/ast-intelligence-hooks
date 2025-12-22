#!/usr/bin/env bash
# ===== INTELLIGENT AUDIT WRAPPER =====
# Integrates Severity Intelligence with existing audit.sh flow
# OPT-IN: Set ENABLE_INTELLIGENT_SEVERITY=true to activate

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if intelligent severity is enabled (OPT-IN)
if [[ "${ENABLE_INTELLIGENT_SEVERITY:-false}" != "true" ]]; then
    # NOT enabled - skip silently
    exit 0
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  INTELLIGENT SEVERITY EVALUATION (BETA)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if ast-summary.json exists
if [[ ! -f ".audit_tmp/ast-summary.json" ]]; then
    echo -e "${YELLOW}⚠️  No ast-summary.json found - skipping intelligent evaluation${NC}"
    exit 0
fi

# Run intelligent audit (Node.js)
cd "$REPO_ROOT"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found - skipping intelligent evaluation${NC}"
    exit 0
fi

# Run intelligent evaluator
node scripts/hooks-system/infrastructure/orchestration/intelligent-audit.js

# Capture exit code
AUDIT_EXIT=$?

# Display reports
if [[ -f ".audit_tmp/intelligent-report.txt" ]]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    cat .audit_tmp/intelligent-report.txt
fi

# Show token usage if critical
if [[ -f ".audit_tmp/token-usage.jsonl" ]]; then
    LAST_USAGE=$(tail -1 .audit_tmp/token-usage.jsonl)
    PERCENT=$(echo "$LAST_USAGE" | jq -r '.percentUsed' 2>/dev/null || echo "0")

    if (( $(echo "$PERCENT > 85" | bc -l 2>/dev/null || echo 0) )); then
        echo ""
        echo -e "${YELLOW}⚠️  Token usage: ${PERCENT}% - Consider wrapping up session${NC}"
    fi
fi

# Exit with audit result
exit $AUDIT_EXIT
