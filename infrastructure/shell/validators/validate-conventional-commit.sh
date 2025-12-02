#!/usr/bin/env bash

set -euo pipefail

MSG_FILE="${1:-}"

if [[ -z "$MSG_FILE" ]] || [[ ! -f "$MSG_FILE" ]]; then
    exit 0
fi

MSG=$(cat "$MSG_FILE")

# =============================================================================
# 1. VALIDATE CONVENTIONAL COMMITS FORMAT
# =============================================================================
CONVENTIONAL_HOOK="${HOME}/.cache/pre-commit/repokqr3d6ev/py_env-python3/bin/conventional-pre-commit"

if [[ ! -f "$CONVENTIONAL_HOOK" ]]; then
    CONVENTIONAL_HOOK=$(find "${HOME}/.cache/pre-commit" -name "conventional-pre-commit" -type f 2>/dev/null | head -1)
fi

if [[ -n "$CONVENTIONAL_HOOK" ]] && [[ -f "$CONVENTIONAL_HOOK" ]]; then
    "$CONVENTIONAL_HOOK" -- "$MSG_FILE" || exit 1
fi

# =============================================================================
# 2. VALIDATE ENGLISH LANGUAGE (Intelligent Detection)
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LANG_DETECTOR="${SCRIPT_DIR}/../../validators/detect-commit-language.js"

if [[ -f "$LANG_DETECTOR" ]] && command -v node >/dev/null 2>&1; then
    node "$LANG_DETECTOR" "$MSG_FILE"
    exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        exit $exit_code
    fi
else
    echo "⚠️  Language detector not available, skipping language validation"
fi

exit 0
