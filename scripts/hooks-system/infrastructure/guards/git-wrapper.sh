#!/bin/bash
# Git Wrapper - Prevents --no-verify bypass
# Install: alias git='/path/to/git-wrapper.sh'

RED='\033[0;31m'
NC='\033[0m'

REAL_GIT=$(which git | grep -v "git-wrapper" | head -1)

# Check for --no-verify in arguments
if [[ "$*" == *"--no-verify"* ]]; then
  echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ ABSOLUTELY FORBIDDEN: --no-verify                   ║${NC}"
  echo -e "${RED}║                                                          ║${NC}"
  echo -e "${RED}║  Hook system took 6 months to build.                    ║${NC}"
  echo -e "${RED}║  It exists to PREVENT bad code.                         ║${NC}"
  echo -e "${RED}║                                                          ║${NC}"
  echo -e "${RED}║  FIX THE VIOLATIONS. DO NOT BYPASS.                     ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"

  # Log attempt
  mkdir -p .audit_tmp
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|BLOCKED|--no-verify|$USER|$(git branch --show-current 2>/dev/null)||$*" >> .audit_tmp/bypass-attempts.log

  # Notify
  osascript -e 'display notification "Blocked --no-verify attempt!" with title "🚫 Hook Bypass Blocked" sound name "Basso"' 2>/dev/null || true

  exit 1
fi

# Execute real git
exec "$REAL_GIT" "$@"
