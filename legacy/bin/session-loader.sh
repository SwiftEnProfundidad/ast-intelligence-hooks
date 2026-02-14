#!/bin/bash
# AST Session Loader v5.5.22
# Runs on IDE startup to initialize AST hooks, show context and check tokens
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

# Colors
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Files
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"
SESSION_FILE="$REPO_ROOT/.AI_SESSION_START.md"
TOKEN_STATUS="$REPO_ROOT/.audit_tmp/token-status.txt"
VIOLATIONS_REPORT="$REPO_ROOT/.audit_tmp/intelligent-report.txt"

# Run token tracker first
TOKEN_TRACKER="$REPO_ROOT/scripts/hooks-system/infrastructure/watchdog/token-tracker.sh"
if [ -f "$TOKEN_TRACKER" ]; then
    bash "$TOKEN_TRACKER"
fi

# Banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         🤖 AST Intelligence Hooks v5.5.22                ║${NC}"
echo -e "${BLUE}║         Workspace Opened - Loading Context...            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo -e "${CYAN}📍 Current Branch: ${MAGENTA}$CURRENT_BRANCH${NC}"
echo ""

# Recent commits
echo -e "${CYAN}📝 Recent Commits:${NC}"
git log --oneline -3 2>/dev/null | sed 's/^/   /' || echo "   No commits yet"
echo ""

# Session context from evidence
if [[ -f "$EVIDENCE_FILE" ]]; then
    CURRENT_SESSION_ID=$(jq -r '.session_id // empty' "$EVIDENCE_FILE" 2>/dev/null || echo "")
    CURRENT_ACTION=$(jq -r '.action // empty' "$EVIDENCE_FILE" 2>/dev/null || echo "")
    if [[ -n "$CURRENT_SESSION_ID" && "$CURRENT_SESSION_ID" != "null" ]]; then
        echo -e "${CYAN}📖 Session Context:${NC}"
        if [[ -n "$CURRENT_ACTION" && "$CURRENT_ACTION" != "null" ]]; then
            echo "   Session: $CURRENT_SESSION_ID - $CURRENT_ACTION"
        else
            echo "   Session: $CURRENT_SESSION_ID"
        fi
        echo ""
    fi
fi

# Top violations from last audit
if [[ -f "$VIOLATIONS_REPORT" ]]; then
    echo -e "${CYAN}🎯 Top Violations (last audit):${NC}"
    grep -E "CRITICAL|HIGH|MEDIUM|LOW" "$VIOLATIONS_REPORT" 2>/dev/null | head -5 | sed 's/^/   /' || echo "   No violations found"
    echo ""
elif [[ -f "$REPO_ROOT/.audit_tmp/ast-summary.json" ]]; then
    echo -e "${CYAN}🎯 Violations Summary:${NC}"
    CRITICAL=$(jq -r '.levels.CRITICAL // 0' "$REPO_ROOT/.audit_tmp/ast-summary.json" 2>/dev/null || echo "0")
    HIGH=$(jq -r '.levels.HIGH // 0' "$REPO_ROOT/.audit_tmp/ast-summary.json" 2>/dev/null || echo "0")
    MEDIUM=$(jq -r '.levels.MEDIUM // 0' "$REPO_ROOT/.audit_tmp/ast-summary.json" 2>/dev/null || echo "0")
    LOW=$(jq -r '.levels.LOW // 0' "$REPO_ROOT/.audit_tmp/ast-summary.json" 2>/dev/null || echo "0")
    echo "   🔴 CRITICAL: $CRITICAL  🟠 HIGH: $HIGH  🟡 MEDIUM: $MEDIUM  🔵 LOW: $LOW"
    echo ""
fi

# Evidence freshness check
AGE=0
if [[ -f "$EVIDENCE_FILE" ]]; then
    EVIDENCE_TS=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "")
    if [[ -n "$EVIDENCE_TS" ]] && [[ "$EVIDENCE_TS" != "null" ]]; then
        # Parse ISO 8601 with timezone (e.g., 2026-01-04T08:12:13.372+01:00)
        # Remove milliseconds and convert to epoch
        CLEAN_TS=$(echo "$EVIDENCE_TS" | sed -E 's/\.[0-9]+([+-][0-9]{2}:[0-9]{2}|Z)$/\1/')
        
        # Try parsing with timezone offset format
        if [[ "$CLEAN_TS" =~ \+[0-9]{2}:[0-9]{2}$ ]] || [[ "$CLEAN_TS" =~ -[0-9]{2}:[0-9]{2}$ ]]; then
            # Convert to UTC by using Python (more reliable for timezone parsing)
            EVIDENCE_EPOCH=$(python3 -c "from datetime import datetime; import sys; dt = datetime.fromisoformat('$CLEAN_TS'); print(int(dt.timestamp()))" 2>/dev/null || echo "0")
        elif [[ "$CLEAN_TS" =~ Z$ ]]; then
            # UTC format
            EVIDENCE_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CLEAN_TS" +%s 2>/dev/null || echo "0")
        else
            EVIDENCE_EPOCH=0
        fi
        
        if [[ "$EVIDENCE_EPOCH" != "0" ]]; then
            NOW_EPOCH=$(date +%s)
            AGE=$((NOW_EPOCH - EVIDENCE_EPOCH))
            
            if [[ $AGE -gt 180 ]]; then
                echo -e "${YELLOW}⚠️  Evidence is stale (${AGE}s old, max 3min)${NC}"
                echo -e "${YELLOW}   Run: ai-start${NC}"
            else
                echo -e "${GREEN}✅ Evidence fresh (${AGE}s old)${NC}"
            fi
            echo ""
        fi
    fi
fi

# Quick commands
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 Quick Commands:${NC}"
echo "   ai-start                    → Update evidence & start work"
echo "   bash scripts/hooks-system/infrastructure/shell/orchestrators/audit-orchestrator.sh → Full audit"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Final status
if [[ $AGE -gt 180 ]]; then
    echo -e "${YELLOW}⚠️  Run 'ai-start' to refresh evidence before working${NC}"
else
    echo -e "${GREEN}✅ Session loaded - Ready to work!${NC}"
fi
echo ""
