#!/usr/bin/env bash

# Installs adapter hooks.json using absolute paths generated from this repository.
# Usage:
#   install-adapter-hooks-config.sh
#   install-adapter-hooks-config.sh --dry-run

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

GENERATOR="${SCRIPT_DIR}/print-adapter-hooks-config.sh"
TARGET_DIR="${HOME}/.codeium/adapter"
TARGET_FILE="${TARGET_DIR}/hooks.json"
LEGACY_TARGET_DIR="${HOME}/.codeium/windsurf"
LEGACY_TARGET_FILE="${LEGACY_TARGET_DIR}/hooks.json"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_FILE="${TARGET_FILE}.bak.${TIMESTAMP}"
LEGACY_BACKUP_FILE="${LEGACY_TARGET_FILE}.bak.${TIMESTAMP}"

if [ "${DRY_RUN}" -eq 1 ]; then
  echo "[pumuki:cascade-hooks] dry run enabled"
  echo "[pumuki:cascade-hooks] target=${TARGET_FILE}"
  echo "[pumuki:cascade-hooks] legacy_target=${LEGACY_TARGET_FILE}"
  echo "[pumuki:cascade-hooks] generated config:"
  bash "${GENERATOR}"
  exit 0
fi

mkdir -p "${TARGET_DIR}"
mkdir -p "${LEGACY_TARGET_DIR}"

if [ -f "${TARGET_FILE}" ]; then
  cp "${TARGET_FILE}" "${BACKUP_FILE}"
  echo "[pumuki:cascade-hooks] backup created: ${BACKUP_FILE}"
fi

if [ -f "${LEGACY_TARGET_FILE}" ]; then
  cp "${LEGACY_TARGET_FILE}" "${LEGACY_BACKUP_FILE}"
  echo "[pumuki:cascade-hooks] backup created: ${LEGACY_BACKUP_FILE}"
fi

bash "${GENERATOR}" > "${TARGET_FILE}"
cp "${TARGET_FILE}" "${LEGACY_TARGET_FILE}"
echo "[pumuki:cascade-hooks] installed hooks config: ${TARGET_FILE}"
echo "[pumuki:cascade-hooks] installed legacy compatibility config: ${LEGACY_TARGET_FILE}"
