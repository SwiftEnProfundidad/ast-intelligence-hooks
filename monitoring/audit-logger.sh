#!/usr/bin/env bash
# =============================================================================
# Audit Logger
# =============================================================================
# Purpose: Complete audit trail for all Git operations (compliance/traceability)
# Author: Pumuki Team®
# Version: 1.0.0
# License: MIT
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# Audit log location
AUDIT_DIR=".audit_tmp"
AUDIT_LOG="$AUDIT_DIR/git-operations.jsonl"

# Ensure audit directory exists
mkdir -p "$AUDIT_DIR"

# =============================================================================
# LOG FUNCTION
# =============================================================================

log_operation() {
    local operation_type="$1"
    local details="$2"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Get Git context
    local current_branch
    current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    
    local current_commit
    current_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    local user_name
    user_name=$(git config user.name 2>/dev/null || echo "unknown")
    
    local user_email
    user_email=$(git config user.email 2>/dev/null || echo "unknown")
    
    # Create audit entry (JSONL format)
    local audit_entry
    audit_entry=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg operation "$operation_type" \
        --arg details "$details" \
        --arg branch "$current_branch" \
        --arg commit "$current_commit" \
        --arg user "$user_name" \
        --arg email "$user_email" \
        '{
            timestamp: $timestamp,
            operation: $operation,
            details: $details,
            context: {
                branch: $branch,
                commit: $commit,
                user: $user,
                email: $email
            }
        }')
    
    # Append to audit log (JSONL format - one JSON per line)
    echo "$audit_entry" >> "$AUDIT_LOG"
}

# =============================================================================
# MAIN
# =============================================================================

OPERATION="${1:-log}"
DETAILS="${2:-No details provided}"

case "$OPERATION" in
    commit)
        log_operation "COMMIT" "$DETAILS"
        echo "✅ Logged: COMMIT"
        ;;
    
    push)
        log_operation "PUSH" "$DETAILS"
        echo "✅ Logged: PUSH"
        ;;
    
    merge)
        log_operation "MERGE" "$DETAILS"
        echo "✅ Logged: MERGE"
        ;;
    
    pr_created)
        log_operation "PR_CREATED" "$DETAILS"
        echo "✅ Logged: PR_CREATED"
        ;;
    
    pr_merged)
        log_operation "PR_MERGED" "$DETAILS"
        echo "✅ Logged: PR_MERGED"
        ;;
    
    branch_created)
        log_operation "BRANCH_CREATED" "$DETAILS"
        echo "✅ Logged: BRANCH_CREATED"
        ;;
    
    branch_deleted)
        log_operation "BRANCH_DELETED" "$DETAILS"
        echo "✅ Logged: BRANCH_DELETED"
        ;;
    
    rollback)
        log_operation "ROLLBACK" "$DETAILS"
        echo "✅ Logged: ROLLBACK"
        ;;
    
    show)
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}📊 Audit Log (Last 20 entries)${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        if [ -f "$AUDIT_LOG" ]; then
            tail -20 "$AUDIT_LOG" | jq -r '[.timestamp, .operation, .details, .context.branch] | @tsv' | \
                awk -F'\t' '{printf "%-20s %-15s %-40s %s\n", $1, $2, substr($3,1,40), $4}'
        else
            echo -e "${YELLOW}⚠️  No audit log found${NC}"
        fi
        echo ""
        ;;
    
    export)
        OUTPUT_FILE="${2:-.audit-export-$(date +%Y%m%d).jsonl}"
        echo "📤 Exporting audit log to: $OUTPUT_FILE"
        
        if [ -f "$AUDIT_LOG" ]; then
            cp "$AUDIT_LOG" "$OUTPUT_FILE"
            echo "✅ Exported $(wc -l < "$AUDIT_LOG") entries"
        else
            echo -e "${YELLOW}⚠️  No audit log to export${NC}"
        fi
        ;;
    
    stats)
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}📊 Audit Statistics${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        if [ -f "$AUDIT_LOG" ]; then
            local total
            total=$(wc -l < "$AUDIT_LOG" | tr -d ' ')
            echo -e "${BLUE}Total operations:${NC} $total"
            echo ""
            
            echo -e "${BLUE}Operations by type:${NC}"
            jq -r '.operation' "$AUDIT_LOG" | sort | uniq -c | sort -rn | \
                awk '{printf "   %-15s %s\n", $2":", $1}'
            echo ""
            
            echo -e "${BLUE}Most active branches:${NC}"
            jq -r '.context.branch' "$AUDIT_LOG" | grep -v null | sort | uniq -c | sort -rn | head -5 | \
                awk '{printf "   %-20s %s operations\n", $2, $1}'
            echo ""
            
            echo -e "${BLUE}Most active users:${NC}"
            jq -r '.context.user' "$AUDIT_LOG" | grep -v null | sort | uniq -c | sort -rn | head -5 | \
                awk '{printf "   %-20s %s operations\n", $2, $1}'
            echo ""
        else
            echo -e "${YELLOW}⚠️  No audit log found${NC}"
        fi
        ;;
    
    *)
        log_operation "CUSTOM" "$OPERATION: $DETAILS"
        echo "✅ Logged: $OPERATION"
        ;;
esac

echo ""
echo -e "${BLUE}📁 Audit log: $AUDIT_LOG${NC}"
echo -e "${BLUE}🐈💚 Pumuki Team® - Audit Logging${NC}"
echo ""

