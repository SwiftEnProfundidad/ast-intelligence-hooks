#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Violations Categorizer (Automatic Report Generator)
# ═══════════════════════════════════════════════════════════════
# Generates actionable violation reports by priority
# Called from: post-commit hook
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paths
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
AST_SUMMARY="$REPO_ROOT/.audit-reports/latest_ast_summary.json"
OUTPUT_FILE="$REPO_ROOT/.violations-by-priority.md"

# Check if AST summary exists
if [[ ! -f "$AST_SUMMARY" ]]; then
  echo -e "${YELLOW}⚠️  No AST summary found. Run audit first.${NC}"
  exit 0
fi

# Extract totals
CRITICAL=$(jq -r '.levels.CRITICAL // 0' "$AST_SUMMARY")
HIGH=$(jq -r '.levels.HIGH // 0' "$AST_SUMMARY")
MEDIUM=$(jq -r '.levels.MEDIUM // 0' "$AST_SUMMARY")
LOW=$(jq -r '.levels.LOW // 0' "$AST_SUMMARY")
TOTAL=$((CRITICAL + HIGH + MEDIUM + LOW))

# Generate markdown report
cat > "$OUTPUT_FILE" <<EOF
# 🎯 Violations by Priority

**Generated:** $(date +"%Y-%m-%d %H:%M:%S")  
**Commit:** $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")  
**Branch:** $(git branch --show-current 2>/dev/null || echo "N/A")

---

## 📊 Summary

| Severity | Count | Percentage |
|----------|-------|------------|
| 🔴 CRITICAL | $CRITICAL | $((CRITICAL * 100 / (TOTAL > 0 ? TOTAL : 1)))% |
| 🟠 HIGH | $HIGH | $((HIGH * 100 / (TOTAL > 0 ? TOTAL : 1)))% |
| 🟡 MEDIUM | $MEDIUM | $((MEDIUM * 100 / (TOTAL > 0 ? TOTAL : 1)))% |
| 🔵 LOW | $LOW | $((LOW * 100 / (TOTAL > 0 ? TOTAL : 1)))% |
| **TOTAL** | **$TOTAL** | **100%** |

---

## 🔴 CRITICAL Violations (Top 10)

EOF

# Extract top 10 critical violations
jq -r '
  [.findings[] | select(.level == "critical")] |
  sort_by(-.count // -1) |
  .[:10] |
  .[] |
  "### \(.ruleId // "unknown") (\(.count // 1) occurrences)\n\n**Platform:** \(.platform // "unknown")  \n**Severity:** \(.level // "critical")\n\n**Description:** \(.description // "No description")\n\n**Fix:** \(.fix // "Review and fix violations")\n\n---\n"
' "$AST_SUMMARY" >> "$OUTPUT_FILE" 2>/dev/null || echo "No CRITICAL violations found." >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" <<EOF

## 🟠 HIGH Violations (Top 10)

EOF

# Extract top 10 high violations
jq -r '
  [.findings[] | select(.level == "high")] |
  sort_by(-.count // -1) |
  .[:10] |
  .[] |
  "### \(.ruleId // "unknown") (\(.count // 1) occurrences)\n\n**Platform:** \(.platform // "unknown")  \n**Severity:** \(.level // "high")\n\n**Description:** \(.description // "No description")\n\n**Fix:** \(.fix // "Review and fix violations")\n\n---\n"
' "$AST_SUMMARY" >> "$OUTPUT_FILE" 2>/dev/null || echo "No HIGH violations found." >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" <<EOF

## 📈 Platform Distribution

EOF

# Platform stats
jq -r '
  .platforms |
  to_entries |
  sort_by(-.value) |
  .[] |
  "- **\(.key):** \(.value) violations"
' "$AST_SUMMARY" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" <<EOF

---

## 🎯 Recommended Actions

EOF

# Generate action items based on violations
if [[ $CRITICAL -gt 0 ]]; then
  cat >> "$OUTPUT_FILE" <<EOF
### 🔴 Priority 1: Fix CRITICAL issues ($CRITICAL)

EOF
  jq -r '
    [.findings[] | select(.level == "critical")] |
    sort_by(-.count // -1) |
    .[:3] |
    .[] |
    "1. **\(.ruleId // "unknown")** (\(.count // 1) violations)\n   - \(.fix // "Review and fix")\n"
  ' "$AST_SUMMARY" >> "$OUTPUT_FILE" 2>/dev/null || echo "No critical actions needed.\n" >> "$OUTPUT_FILE"
fi

if [[ $HIGH -gt 100 ]]; then
  cat >> "$OUTPUT_FILE" <<EOF

### 🟠 Priority 2: Address HIGH issues ($HIGH)

Top 3 by volume:
EOF
  jq -r '
    [.findings[] | select(.level == "high")] |
    sort_by(-.count // -1) |
    .[:3] |
    .[] |
    "1. **\(.ruleId // "unknown")** (\(.count // 1) violations)\n   - \(.fix // "Review and fix")\n"
  ' "$AST_SUMMARY" >> "$OUTPUT_FILE" 2>/dev/null
fi

cat >> "$OUTPUT_FILE" <<EOF

---

## 📝 Next Steps

1. Fix all CRITICAL violations first
2. Address HIGH violations by volume (top 10)
3. Run audit again: \`bash scripts/hooks-system/presentation/cli/audit.sh\`
4. Commit fixes atomically with proper evidence

**Report:** \`.violations-by-priority.md\`  
**Detailed JSON:** \`.audit-reports/latest_ast_summary.json\`
EOF

# Display summary in terminal
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 VIOLATIONS REPORT GENERATED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🔴 CRITICAL: ${RED}$CRITICAL${NC}"
echo -e "  🟠 HIGH:     ${YELLOW}$HIGH${NC}"
echo -e "  🟡 MEDIUM:   $MEDIUM"
echo -e "  🔵 LOW:      $LOW"
echo -e "  ────────────────"
echo -e "  📊 TOTAL:    $TOTAL"
echo ""
echo -e "${GREEN}✅ Report saved: .violations-by-priority.md${NC}"
echo ""

if [[ $CRITICAL -gt 0 ]]; then
  echo -e "${RED}⚠️  ACTION REQUIRED: Fix $CRITICAL CRITICAL violations${NC}"
elif [[ $HIGH -gt 100 ]]; then
  echo -e "${YELLOW}⚠️  HIGH violations need attention: $HIGH found${NC}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

