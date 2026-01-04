#!/bin/bash
# AST Session Loader
# Runs on IDE startup to initialize AST hooks and check tokens
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

# Run token tracker to warn about approaching limits
TOKEN_TRACKER="$REPO_ROOT/scripts/hooks-system/infrastructure/watchdog/token-tracker.sh"
if [ -f "$TOKEN_TRACKER" ]; then
    bash "$TOKEN_TRACKER"
fi

# Display AST hooks status
echo "🚀 AST Intelligence Hooks v5.5.17"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ AST Hooks loaded successfully"
echo "📁 Repository: $REPO_ROOT"
echo "🤖 AI Gate: Active"
echo "🔍 Evidence Monitoring: Active"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tip: Run 'ai-start' to initialize AI context for your current branch"
echo "💡 Tip: Run 'bash scripts/hooks-system/infrastructure/shell/orchestrators/audit-orchestrator.sh' for full audit"
echo ""
