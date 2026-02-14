#!/bin/bash
# Script Wrapper
# Redirects to the centralized implementation in scripts/hooks-system

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
IMPL="$REPO_ROOT/scripts/hooks-system/infrastructure/watchdog/token-monitor-loop.sh"

if [[ -f "$IMPL" ]]; then
  exec bash "$IMPL" "$@"
fi

echo "token-monitor-loop.sh implementation not found at: $IMPL" >&2
exit 1
