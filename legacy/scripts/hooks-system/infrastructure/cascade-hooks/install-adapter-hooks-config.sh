#!/usr/bin/env bash

set -eu

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

exec bash "${SCRIPT_DIR}/install-windsurf-hooks-config.sh" "$@"
