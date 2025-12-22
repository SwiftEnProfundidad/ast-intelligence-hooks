#!/bin/bash
# Prevent --no-verify usage

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if git command used --no-verify
if [[ "$*" == *"--no-verify"* ]] || [[ "$GIT_NO_VERIFY" == "1" ]]; then
  echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                                                          ║${NC}"
  echo -e "${RED}║  ❌ --no-verify IS ABSOLUTELY FORBIDDEN                 ║${NC}"
  echo -e "${RED}║                                                          ║${NC}"
  echo -e "${RED}║  The hook system is designed to prevent bad code.       ║${NC}"
  echo -e "${RED}║  Bypassing it defeats 6 months of work.                 ║${NC}"
  echo -e "${RED}║                                                          ║${NC}"
  echo -e "${RED}║  If hooks block you, FIX THE VIOLATIONS.                ║${NC}"
  echo -e "${RED}║  Do NOT bypass the system.                              ║${NC}"
  echo -e "${RED}║                                                          ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}This violation has been logged and will be reported.${NC}"
  echo ""

  # Log violation
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) - NO_VERIFY_ATTEMPT - User: $USER - Branch: $(git branch --show-current)" >> .audit_tmp/no-verify-violations.log

  # Send notification
  osascript -e 'display notification "Attempt to use --no-verify blocked!" with title "🚫 Hook System Violation" sound name "Basso"' 2>/dev/null || true

  exit 1
fi

exit 0
