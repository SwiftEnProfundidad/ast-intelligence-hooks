#!/bin/bash

# Script de solicitud de aprobación para --no-verify
# Este script DEBE ser llamado por la IA antes de usar --no-verify

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${RED}${BOLD}╔═════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║  🚨 AI REQUESTING --no-verify AUTHORIZATION                ║${NC}"
echo -e "${RED}${BOLD}╚═════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}${BOLD}GIT HOOK BLOCKED COMMIT${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
echo ""

# Obtener violations de staging del último audit
if [ -f /tmp/mock_consumer_local/pattern-staged.txt ]; then
  echo -e "${CYAN}Violations detected in STAGING AREA:${NC}"
  echo ""

  CRIT=$(grep "^CRITICAL:" /tmp/mock_consumer_local/pattern-staged.txt 2>/dev/null | cut -d: -f2 || echo "0")
  HIGH=$(grep "^HIGH:" /tmp/mock_consumer_local/pattern-staged.txt 2>/dev/null | cut -d: -f2 || echo "0")
  MED=$(grep "^MEDIUM:" /tmp/mock_consumer_local/pattern-staged.txt 2>/dev/null | cut -d: -f2 || echo "0")
  LOW=$(grep "^LOW:" /tmp/mock_consumer_local/pattern-staged.txt 2>/dev/null | cut -d: -f2 || echo "0")

  echo -e "  ${RED}🔴 CRITICAL:${NC} ${CRIT:-0}"
  echo -e "  ${YELLOW}🟠 HIGH:${NC}     ${HIGH:-0}"
  echo -e "  ${YELLOW}🟡 MEDIUM:${NC}   ${MED:-0}"
  echo -e "  ${BLUE}🔵 LOW:${NC}      ${LOW:-0}"
  echo ""
fi

# Mostrar información del branch actual
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${CYAN}Current branch:${NC} ${YELLOW}${BRANCH}${NC}"
echo ""

# Obtener archivos staged
STAGED_FILES=$(git diff --cached --name-only | wc -l | tr -d ' ')
echo -e "${CYAN}Files in staging:${NC} ${STAGED_FILES}"
git diff --cached --name-status | head -10 | sed 's/^/  /'
if [ "$STAGED_FILES" -gt 10 ]; then
  echo "  ... and $((STAGED_FILES - 10)) more files"
fi
echo ""

echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${YELLOW}${BOLD}⚠️  AI NEEDS YOUR DECISION:${NC}"
echo ""
echo -e "  ${GREEN}${BOLD}A)${NC} Fix the violations now (stay strict)"
echo -e "     ${BLUE}→${NC} AI will analyze and fix detected violations"
echo -e "     ${BLUE}→${NC} Commit will be clean"
echo ""
echo -e "  ${YELLOW}${BOLD}B)${NC} Authorize --no-verify (bypass hook)"
echo -e "     ${BLUE}→${NC} AI will commit with --no-verify"
echo -e "     ${BLUE}→${NC} Violations will be documented in commit message"
echo -e "     ${BLUE}→${NC} You can verify later with: verify-policy command"
echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${CYAN}${BOLD}Type your choice:${NC}"
echo -e "  'A' or 'fix'       → Fix violations"
echo -e "  'B' or 'authorize' → Authorize --no-verify"
echo -e "  'cancel'           → Cancel commit"
echo ""
read -p "Your choice: " choice

case "${choice,,}" in
  a|fix)
    echo ""
    echo -e "${GREEN}✅ User chose: FIX VIOLATIONS${NC}"
    echo -e "${YELLOW}AI will now analyze and fix the violations...${NC}"
    echo ""
    exit 10
    ;;
  b|authorize|autorizo)
    echo ""
    echo -e "${YELLOW}✅ User AUTHORIZED --no-verify${NC}"
    echo ""
    read -p "Reason for authorization: " reason
    echo ""
    echo -e "${GREEN}Authorization granted:${NC}"
    echo -e "  Reason: ${reason}"
    echo ""
    echo -e "${YELLOW}AI will now commit with --no-verify and document authorization${NC}"
    echo ""
    # Guardar la autorización en un archivo temporal para que la IA la use
    echo "AUTHORIZED by @carlos-merlos" > /tmp/no_verify_approval.txt
    echo "Reason: $reason" >> /tmp/no_verify_approval.txt
    echo "Timestamp: $(date)" >> /tmp/no_verify_approval.txt
    exit 0
    ;;
  cancel|c)
    echo ""
    echo -e "${RED}❌ Commit cancelled by user${NC}"
    echo ""
    exit 1
    ;;
  *)
    echo ""
    echo -e "${RED}❌ Invalid choice. Commit cancelled.${NC}"
    echo ""
    exit 1
    ;;
esac
