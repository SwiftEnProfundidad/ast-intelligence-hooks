#!/bin/bash

# Generate Violation Progress Report
# Compares current violations with baseline

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

REPORTS_DIR=".audit-reports"
CURRENT_REPORT="${REPORTS_DIR}/latest_ast_summary.json"
BASELINE_REPORT="${REPORTS_DIR}/baseline_ast_summary.json"

if [[ ! -f "$CURRENT_REPORT" ]]; then
  echo -e "${RED}❌ No current report found${NC}"
  echo -e "   Run: bash scripts/hooks-system/presentation/cli/audit.sh"
  exit 1
fi

if [[ ! -f "$BASELINE_REPORT" ]]; then
  echo -e "${YELLOW}⚠️  No baseline found, using current as baseline${NC}"
  cp "$CURRENT_REPORT" "$BASELINE_REPORT"
fi

echo ""
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}${BOLD}   📊 VIOLATION PROGRESS REPORT${NC}"
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

get_count() {
  local file=$1
  local key=$2
  jq -r "$key // 0" "$file" 2>/dev/null || echo "0"
}

baseline_total=$(get_count "$BASELINE_REPORT" '.totals.total')
baseline_crit=$(get_count "$BASELINE_REPORT" '.levels.CRITICAL')
baseline_high=$(get_count "$BASELINE_REPORT" '.levels.HIGH')
baseline_med=$(get_count "$BASELINE_REPORT" '.levels.MEDIUM')
baseline_low=$(get_count "$BASELINE_REPORT" '.levels.LOW')

current_total=$(get_count "$CURRENT_REPORT" '.totals.total')
current_crit=$(get_count "$CURRENT_REPORT" '.levels.CRITICAL')
current_high=$(get_count "$CURRENT_REPORT" '.levels.HIGH')
current_med=$(get_count "$CURRENT_REPORT" '.levels.MEDIUM')
current_low=$(get_count "$CURRENT_REPORT" '.levels.LOW')

delta_total=$((current_total - baseline_total))
delta_crit=$((current_crit - baseline_crit))
delta_high=$((current_high - baseline_high))
delta_med=$((current_med - baseline_med))
delta_low=$((current_low - baseline_low))

print_metric() {
  local label=$1
  local before=$2
  local after=$3
  local delta=$4
  
  local color=$GREEN
  local symbol="✅"
  if [[ $delta -gt 0 ]]; then
    color=$RED
    symbol="⚠️"
  elif [[ $delta -eq 0 ]]; then
    color=$YELLOW
    symbol="➖"
  fi
  
  printf "  %-30s %6s → %6s   %s%6s%s %s\n" \
    "$label" "$before" "$after" "$color" "$delta" "$NC" "$symbol"
}

echo -e "${CYAN}${BOLD}Violations by Severity:${NC}"
echo ""
print_metric "🔴 CRITICAL" "$baseline_crit" "$current_crit" "$delta_crit"
print_metric "🟠 HIGH" "$baseline_high" "$current_high" "$delta_high"
print_metric "🟡 MEDIUM" "$baseline_med" "$current_med" "$delta_med"
print_metric "🔵 LOW" "$baseline_low" "$current_low" "$delta_low"
echo ""
print_metric "📊 TOTAL VIOLATIONS" "$baseline_total" "$current_total" "$delta_total"

echo ""
echo -e "${CYAN}${BOLD}Code Health Score:${NC}"
if [[ $baseline_total -gt 0 ]]; then
  baseline_health=$((100 - (baseline_total * 100 / 15000)))
  current_health=$((100 - (current_total * 100 / 15000)))
  delta_health=$((current_health - baseline_health))
  
  [[ $baseline_health -lt 0 ]] && baseline_health=0
  [[ $current_health -lt 0 ]] && current_health=0
  
  health_color=$GREEN
  [[ $delta_health -lt 0 ]] && health_color=$RED
  [[ $delta_health -eq 0 ]] && health_color=$YELLOW
  
  printf "  %s%% → %s%%   %s%+d%%%s\n" \
    "$baseline_health" "$current_health" "$health_color" "$delta_health" "$NC"
fi

echo ""
echo -e "${CYAN}${BOLD}Top 10 Violation Types:${NC}"
echo ""
jq -r '.rules | to_entries | sort_by(-.value) | .[0:10] | .[] | "  \(.key): \(.value)"' "$CURRENT_REPORT"

echo ""
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [[ $delta_total -lt 0 ]]; then
  echo -e "${GREEN}✅ Great job! Violations reduced by ${delta_total#-}${NC}"
elif [[ $delta_total -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  Violations increased by $delta_total (temporary - new infrastructure)${NC}"
else
  echo -e "${YELLOW}➖ No net change in violations${NC}"
fi

echo ""
echo -e "${CYAN}Commands:${NC}"
echo -e "  Update baseline: ${BOLD}cp $CURRENT_REPORT $BASELINE_REPORT${NC}"
echo -e "  View details:    ${BOLD}jq . $CURRENT_REPORT | less${NC}"
echo ""

