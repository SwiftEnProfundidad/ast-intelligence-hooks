#!/bin/bash
# Script Wrapper
# Redirects to the centralized implementation in scripts/hooks-system
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
IMPL="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/scripts/hooks-system/bin/guard-env.sh"
if [[ -f "$IMPL" ]]; then
  # shellcheck disable=SC1090
  source "$IMPL"
  return 0 2>/dev/null || exit 0
fi

IMPL="$REPO_ROOT/node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/guard-env.sh"
if [[ -f "$IMPL" ]]; then
  # shellcheck disable=SC1090
  source "$IMPL"
  return 0 2>/dev/null || exit 0
fi

echo "guard-env.sh implementation not found. Please reinstall dependencies." >&2
return 1 2>/dev/null || exit 1
