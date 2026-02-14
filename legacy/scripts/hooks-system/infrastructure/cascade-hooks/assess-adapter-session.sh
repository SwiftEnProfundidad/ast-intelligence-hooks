#!/usr/bin/env bash

# Assesses whether an adapter session produced both pre-write and post-write events.
# Usage:
#   assess-adapter-session.sh
#   assess-adapter-session.sh "2026-02-07T00:00:00.000Z"
#   assess-adapter-session.sh --include-simulated
#   assess-adapter-session.sh --include-simulated "2026-02-07T00:00:00.000Z"

set -eu

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

exec bash "${SCRIPT_DIR}/assess-windsurf-session.sh" "$@"
