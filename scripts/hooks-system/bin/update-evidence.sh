#!/bin/bash
# Script Wrapper
# Redirects to the centralized implementation in scripts/hooks-system
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
IMPL="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/scripts/hooks-system/bin/update-evidence.sh"
if [[ -f "$IMPL" ]]; then
  exec bash "$IMPL" "$@"
fi

IMPL="$REPO_ROOT/node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/update-evidence.sh"
if [[ -f "$IMPL" ]]; then
  exec bash "$IMPL" "$@"
fi

echo "update-evidence.sh implementation not found. Please reinstall dependencies." >&2
exit 1
