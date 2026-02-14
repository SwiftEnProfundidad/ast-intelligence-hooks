#!/bin/bash
# Script Wrapper
# Redirects to the centralized implementation in scripts/hooks-system
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

LOCK_DIR="$REPO_ROOT/.audit_tmp/guard-supervisor.lock"
if [[ -d "$LOCK_DIR" ]]; then
  if ! ps -ax -o command= | grep -F "$REPO_ROOT/scripts/hooks-system/bin/guard-supervisor.js" | grep -v grep >/dev/null 2>&1; then
    if ! ps -ax -o command= | grep -F "$REPO_ROOT/node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/guard-supervisor.js" | grep -v grep >/dev/null 2>&1; then
      rm -rf "$LOCK_DIR" 2>/dev/null || true
    fi
  fi
fi
IMPL="$REPO_ROOT/scripts/hooks-system/bin/start-guards.sh"
if [[ -f "$IMPL" ]]; then
  exec bash "$IMPL" "$@"
fi

IMPL="$REPO_ROOT/node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/start-guards.sh"
if [[ -f "$IMPL" ]]; then
  exec bash "$IMPL" "$@"
fi

echo "start-guards.sh implementation not found. Please reinstall dependencies." >&2
exit 1
