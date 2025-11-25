#!/bin/bash
# Autonomous AST Intelligence - Status Dashboard

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
TELEMETRY_FILE="$REPO_ROOT/.audit_tmp/autonomous-decisions.jsonl"
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🤖 Autonomous AST Intelligence - Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [[ ! -f "$EVIDENCE_FILE" ]]; then
  echo -e "${YELLOW}⚠️  No .AI_EVIDENCE.json found${NC}"
  exit 1
fi

TIMESTAMP=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "unknown")
SESSION=$(jq -r '.session_id' "$EVIDENCE_FILE" 2>/dev/null || echo "unknown")

CURRENT_TIME=$(date -u +"%s")
EVIDENCE_TIME=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$TIMESTAMP" +"%s" 2>/dev/null || echo "0")
AGE=$((CURRENT_TIME - EVIDENCE_TIME))

echo -e "${CYAN}📊 Current State:${NC}"
echo -e "   Session: ${GREEN}$SESSION${NC}"
echo -e "   Evidence Age: ${AGE}s"
if [[ $AGE -lt 180 ]]; then
  echo -e "   Status: ${GREEN}✅ Fresh${NC}"
else
  echo -e "   Status: ${YELLOW}⚠️  Stale${NC}"
fi
echo ""

if [[ -f "$TELEMETRY_FILE" ]]; then
  echo -e "${CYAN}📈 Autonomous Decisions (Last 7 days):${NC}"
  
  CUTOFF=$((CURRENT_TIME - 604800))
  TOTAL=$(awk -v cutoff="$CUTOFF" '
    {
      if (match($0, /"timestamp":([0-9]+)/, arr)) {
        if (arr[1] >= cutoff * 1000) count++
      }
    }
    END { print count+0 }
  ' "$TELEMETRY_FILE")
  
  AUTO_EXEC=$(grep -c '"decision":"auto-executed"' "$TELEMETRY_FILE" 2>/dev/null || echo "0")
  ASKED=$(grep -c '"decision":"ask-user"' "$TELEMETRY_FILE" 2>/dev/null || echo "0")
  IGNORED=$(grep -c '"decision":"ignored"' "$TELEMETRY_FILE" 2>/dev/null || echo "0")
  
  echo -e "   Total Decisions: ${TOTAL}"
  echo -e "   Auto-executed: ${GREEN}${AUTO_EXEC}${NC}"
  echo -e "   Asked User: ${YELLOW}${ASKED}${NC}"
  echo -e "   Ignored: ${IGNORED}"
  echo ""
  
  WITH_FEEDBACK=$(grep -c '"userCorrection":[^n]' "$TELEMETRY_FILE" 2>/dev/null || echo "0")
  if [[ $WITH_FEEDBACK -gt 0 ]]; then
    CORRECT=$(grep '"userCorrection":true' "$TELEMETRY_FILE" | wc -l | tr -d ' ')
    ACCURACY=$(awk "BEGIN {printf \"%.0f\", ($CORRECT / $WITH_FEEDBACK) * 100}")
    
    echo -e "${CYAN}🎯 Accuracy:${NC}"
    echo -e "   Decisions with Feedback: ${WITH_FEEDBACK}"
    echo -e "   Correct: ${GREEN}${CORRECT}${NC}"
    echo -e "   Accuracy: ${GREEN}${ACCURACY}%${NC}"
  else
    echo -e "${YELLOW}⚠️  No user feedback yet${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No telemetry data yet${NC}"
  echo -e "   (Will be created after first autonomous decision)"
fi

echo ""
echo -e "${CYAN}⚙️  Current Thresholds:${NC}"
echo -e "   Auto-execute: ≥ 90%"
echo -e "   Ask user: 70-89%"
echo -e "   Ignore: < 70%"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🐈💚 Pumuki Team® - Autonomous Project Intelligence${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

