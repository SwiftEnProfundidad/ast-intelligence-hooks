#!/bin/bash

set -euo pipefail

REPO_ROOT=${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}
BASELINE_PATH=${BASELINE_PATH:-"$REPO_ROOT/scripts/hooks-system/config/detect-secrets-baseline.json"}
MODE="${1:-scan}"
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PYTHON_SCRIPT="$SCRIPT_DIR/detect_secrets.py"

PYTHON3=""
if [[ -x "/opt/homebrew/bin/python3" ]]; then
  PYTHON3="/opt/homebrew/bin/python3"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON3="python3"
else
  echo "detect-secrets.sh: se requiere python3" >&2
  exit 1
fi

if [[ ! -f "$PYTHON_SCRIPT" ]]; then
  echo "detect-secrets.sh: no se encuentra $PYTHON_SCRIPT" >&2
  exit 1
fi

exec "$PYTHON3" "$PYTHON_SCRIPT" "$MODE" "$REPO_ROOT" "$BASELINE_PATH"
