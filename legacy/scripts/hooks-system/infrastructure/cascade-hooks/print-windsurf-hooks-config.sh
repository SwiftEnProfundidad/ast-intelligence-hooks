#!/usr/bin/env bash

# Prints a Windsurf hooks.json template with absolute paths for this repository.
# Usage:
#   print-windsurf-hooks-config.sh > ~/.codeium/windsurf/hooks.json

set -eu

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

REPO_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel 2>/dev/null || pwd)"
WRAPPER_PATH="${REPO_ROOT}/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh"

cat <<JSON
{
  "hooks": {
    "pre_write_code": [
      {
        "command": "bash \"${WRAPPER_PATH}\" pre-write-code-hook.js",
        "show_output": true,
        "timeout_ms": 10000
      }
    ],
    "post_write_code": [
      {
        "command": "bash \"${WRAPPER_PATH}\" post-write-code-hook.js",
        "show_output": false,
        "timeout_ms": 5000
      }
    ]
  }
}
JSON

