#!/bin/bash
# =============================================================================
# AI-COMMIT: Script para commits desde la IA
# =============================================================================
# Este script actualiza .AI_EVIDENCE.json antes del commit.
# Uso: ai-commit -m "commit message"
# =============================================================================

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"

echo "🤖 AI-COMMIT: Preparando commit..."

# Detect if running from node_modules (installed package) or from scripts/hooks-system (local dev)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"node_modules/@pumuki/ast-intelligence-hooks"* ]]; then
  HOOKS_SYSTEM_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
  if [[ -d "$REPO_ROOT/scripts/hooks-system" ]]; then
    HOOKS_SYSTEM_DIR="$REPO_ROOT/scripts/hooks-system"
  fi
else
  HOOKS_SYSTEM_DIR="$REPO_ROOT/scripts/hooks-system"
fi

# STEP 1: Update AI_EVIDENCE timestamp if old (>2min)
if [ -f "$EVIDENCE_FILE" ] && command -v jq >/dev/null 2>&1; then
    CURRENT_TS=$(jq -r '.timestamp // empty' "$EVIDENCE_FILE" 2>/dev/null)
    SHOULD_UPDATE=1

    if [ -n "$CURRENT_TS" ] && [ "$CURRENT_TS" != "null" ]; then
        CLEAN_TS=$(echo "$CURRENT_TS" | sed 's/\.[0-9]*Z$/Z/')
        CURRENT_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CLEAN_TS" +%s 2>/dev/null || date -d "$CLEAN_TS" +%s 2>/dev/null || echo "0")
        NOW_EPOCH=$(date +%s)
        DIFF=$((NOW_EPOCH - CURRENT_EPOCH))

        if [ "$DIFF" -lt 120 ]; then
            SHOULD_UPDATE=0
            echo "ℹ️  AI_EVIDENCE timestamp fresh ($DIFF s old) - skipping update"
        fi
    fi

    if [ "$SHOULD_UPDATE" -eq 1 ]; then
        NEW_TS=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
        jq --arg ts "$NEW_TS" '.timestamp = $ts' "$EVIDENCE_FILE" > "$EVIDENCE_FILE.tmp"
        mv "$EVIDENCE_FILE.tmp" "$EVIDENCE_FILE"
        git add "$EVIDENCE_FILE"
        echo "✅ AI_EVIDENCE updated: $NEW_TS"
    fi
else
    if [ ! -f "$EVIDENCE_FILE" ]; then
        echo "⚠️  AI_EVIDENCE does not exist, creating minimal..."
        echo '{"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"}' > "$EVIDENCE_FILE"
        git add "$EVIDENCE_FILE"
    fi
fi

# STEP 2: Execute git commit with passed arguments
echo "🚀 Executing commit..."
git commit "$@"

echo "✅ AI-COMMIT completed"
