#!/usr/bin/env bash

# Runs a local (terminal) simulation of Windsurf pre/post hook runtime behavior.
# Produces artifacts under docs/validation/windsurf/artifacts.

set -eu

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

REPO_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel 2>/dev/null || pwd)"
ARTIFACTS_DIR="${REPO_ROOT}/docs/validation/windsurf/artifacts"
WRAPPER_SCRIPT="${SCRIPT_DIR}/run-hook-with-node.sh"
COLLECT_SCRIPT="${SCRIPT_DIR}/collect-runtime-diagnostics.sh"

mkdir -p "${ARTIFACTS_DIR}"

bash "${COLLECT_SCRIPT}" > "${ARTIFACTS_DIR}/collector-run.txt" 2>&1

set +e
printf '%s' '{"agent_action_name":"pre_write_code","tool_info":{"file_path":"apps/backend/src/example.ts","edits":[{"old_string":"","new_string":"function t(){ try { return 1; } catch {} }"}]}}' \
  | PUMUKI_HOOK_DIAGNOSTIC=1 bash "${WRAPPER_SCRIPT}" pre-write-code-hook.js \
  > "${ARTIFACTS_DIR}/pre-write-simulated.txt" 2>&1
PRE_EXIT=$?

printf '%s' '{"agent_action_name":"post_write_code","tool_info":{"file_path":"apps/backend/src/example.ts","edits":[{"old_string":"","new_string":"const ok = true;"}]}}' \
  | PUMUKI_HOOK_DIAGNOSTIC=1 bash "${WRAPPER_SCRIPT}" post-write-code-hook.js \
  > "${ARTIFACTS_DIR}/post-write-simulated.txt" 2>&1
POST_EXIT=$?
set -e

{
  echo "PRE_EXIT=${PRE_EXIT}"
  echo "POST_EXIT=${POST_EXIT}"
} > "${ARTIFACTS_DIR}/exit-codes.txt"

LATEST_RUNTIME="$(ls -1t "${REPO_ROOT}"/.audit_tmp/cascade-hook-runtime-*.log 2>/dev/null | head -n 1 || true)"
LATEST_SMOKE="$(ls -1t "${REPO_ROOT}"/.audit_tmp/cascade-hook-smoke-*.log 2>/dev/null | head -n 1 || true)"

if [ -n "${LATEST_RUNTIME}" ]; then
  tail -n 80 "${LATEST_RUNTIME}" > "${ARTIFACTS_DIR}/latest-runtime-tail.txt"
fi
if [ -n "${LATEST_SMOKE}" ]; then
  tail -n 80 "${LATEST_SMOKE}" > "${ARTIFACTS_DIR}/latest-smoke-tail.txt"
fi

if [ -f "${REPO_ROOT}/.audit_tmp/cascade-hook.log" ]; then
  tail -n 120 "${REPO_ROOT}/.audit_tmp/cascade-hook.log" > "${ARTIFACTS_DIR}/cascade-hook-tail.txt"
fi
if [ -f "${REPO_ROOT}/.audit_tmp/cascade-writes.log" ]; then
  tail -n 120 "${REPO_ROOT}/.audit_tmp/cascade-writes.log" > "${ARTIFACTS_DIR}/cascade-writes-tail.txt"
fi

echo "PRE_EXIT=${PRE_EXIT}"
echo "POST_EXIT=${POST_EXIT}"
echo "Artifacts directory: ${ARTIFACTS_DIR}"

