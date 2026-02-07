#!/usr/bin/env bash

# Captures runtime diagnostics for Windsurf cascade hooks into .audit_tmp.
# Usage:
#   collect-runtime-diagnostics.sh
#   PUMUKI_HOOK_DIAGNOSTIC=1 collect-runtime-diagnostics.sh

set -eu

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

REPO_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel 2>/dev/null || pwd)"
OUTPUT_DIR="${REPO_ROOT}/.audit_tmp"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
WRAPPER_LOG="${OUTPUT_DIR}/cascade-hook-runtime-${TIMESTAMP}.log"
SMOKE_LOG="${OUTPUT_DIR}/cascade-hook-smoke-${TIMESTAMP}.log"

mkdir -p "${OUTPUT_DIR}"

{
  echo "[pumuki:cascade-hooks] collecting runtime diagnostics"
  echo "[pumuki:cascade-hooks] timestamp=${TIMESTAMP}"
  echo "[pumuki:cascade-hooks] repo_root=${REPO_ROOT}"
  echo "[pumuki:cascade-hooks] strict_node=${PUMUKI_HOOK_STRICT_NODE:-0}"
  echo "[pumuki:cascade-hooks] diagnostic=${PUMUKI_HOOK_DIAGNOSTIC:-0}"
  bash "${SCRIPT_DIR}/run-hook-with-node.sh" --diagnose
} >"${WRAPPER_LOG}" 2>&1

{
  printf '%s' '{"agent_action_name":"post_write_code","tool_info":{"file_path":"apps/backend/src/example.ts","edits":[{"old_string":"","new_string":"const smoke = true;"}]}}'
} | bash "${SCRIPT_DIR}/run-hook-with-node.sh" post-write-code-hook.js >"${SMOKE_LOG}" 2>&1 || true

echo "[pumuki:cascade-hooks] runtime diagnostics written to ${WRAPPER_LOG}"
echo "[pumuki:cascade-hooks] smoke log written to ${SMOKE_LOG}"

