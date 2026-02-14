#!/usr/bin/env bash

# Installs Windsurf hooks.json using absolute paths generated from this repository.
# Usage:
#   install-windsurf-hooks-config.sh
#   install-windsurf-hooks-config.sh --dry-run

set -eu

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

GENERATOR="${SCRIPT_DIR}/print-windsurf-hooks-config.sh"
TARGET_DIR="${HOME}/.codeium/windsurf"
TARGET_FILE="${TARGET_DIR}/hooks.json"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_FILE="${TARGET_FILE}.bak.${TIMESTAMP}"

if [ "${DRY_RUN}" -eq 1 ]; then
  echo "[pumuki:cascade-hooks] dry run enabled"
  echo "[pumuki:cascade-hooks] target=${TARGET_FILE}"
  echo "[pumuki:cascade-hooks] generated config:"
  bash "${GENERATOR}"
  exit 0
fi

mkdir -p "${TARGET_DIR}"

if [ -f "${TARGET_FILE}" ]; then
  cp "${TARGET_FILE}" "${BACKUP_FILE}"
  echo "[pumuki:cascade-hooks] backup created: ${BACKUP_FILE}"
fi

bash "${GENERATOR}" > "${TARGET_FILE}"
echo "[pumuki:cascade-hooks] installed hooks config: ${TARGET_FILE}"

