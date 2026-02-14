#!/usr/bin/env bash

# Verifies adapter hooks.json wiring and wrapper runtime diagnostics.
# Usage:
#   verify-adapter-hooks-runtime.sh

set -eu

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

REPO_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel 2>/dev/null || pwd)"
WRAPPER_PATH=""
for candidate in \
  "${REPO_ROOT}/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh" \
  "${REPO_ROOT}/legacy/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh"
do
  if [ -x "${candidate}" ]; then
    WRAPPER_PATH="${candidate}"
    break
  fi
done

if [ -z "${WRAPPER_PATH}" ]; then
  echo "[pumuki:cascade-hooks] unable to resolve executable wrapper path in repo" >&2
  exit 1
fi

ADAPTER_HOOKS_CONFIG="${HOME}/.codeium/adapter/hooks.json"
WINDSURF_HOOKS_CONFIG="${HOME}/.codeium/windsurf/hooks.json"
if [ ! -f "${ADAPTER_HOOKS_CONFIG}" ] && [ ! -f "${WINDSURF_HOOKS_CONFIG}" ]; then
  echo "[pumuki:cascade-hooks] missing adapter config: ${ADAPTER_HOOKS_CONFIG}" >&2
  echo "[pumuki:cascade-hooks] fallback legacy config also missing: ${WINDSURF_HOOKS_CONFIG}" >&2
  exit 1
fi

validate_hooks_config() {
  local config_path="$1"

  if ! grep -q '"pre_write_code"' "${config_path}"; then
    echo "[pumuki:cascade-hooks] hooks.json missing pre_write_code section (${config_path})" >&2
    exit 1
  fi
  if ! grep -q '"post_write_code"' "${config_path}"; then
    echo "[pumuki:cascade-hooks] hooks.json missing post_write_code section (${config_path})" >&2
    exit 1
  fi

  if grep -E -q '"command"[[:space:]]*:[[:space:]]*"node[[:space:]]+[^"]*(pre-write-code-hook|post-write-code-hook)\.js' "${config_path}"; then
    echo "[pumuki:cascade-hooks] detected stale direct-node hook command in ${config_path}" >&2
    echo "[pumuki:cascade-hooks] this configuration is prone to: bash: node: command not found" >&2
    echo "[pumuki:cascade-hooks] remediation:" >&2
    echo "  1) npm run install:adapter-hooks-config" >&2
    echo "  2) npm run verify:adapter-hooks-runtime" >&2
    exit 1
  fi

  if ! grep -q "${WRAPPER_PATH//\//\\/}" "${config_path}"; then
    echo "[pumuki:cascade-hooks] hooks.json does not point to expected wrapper path" >&2
    echo "[pumuki:cascade-hooks] expected: ${WRAPPER_PATH}" >&2
    echo "[pumuki:cascade-hooks] config: ${config_path}" >&2
    echo "[pumuki:cascade-hooks] remediation: npm run install:adapter-hooks-config" >&2
    exit 1
  fi

  if ! grep -q 'pre-write-code-hook.js' "${config_path}"; then
    echo "[pumuki:cascade-hooks] hooks.json missing pre-write command target: pre-write-code-hook.js (${config_path})" >&2
    echo "[pumuki:cascade-hooks] remediation: npm run install:adapter-hooks-config" >&2
    exit 1
  fi

  if ! grep -q 'post-write-code-hook.js' "${config_path}"; then
    echo "[pumuki:cascade-hooks] hooks.json missing post-write command target: post-write-code-hook.js (${config_path})" >&2
    echo "[pumuki:cascade-hooks] remediation: npm run install:adapter-hooks-config" >&2
    exit 1
  fi
}

ACTIVE_CONFIGS=()
if [ -f "${ADAPTER_HOOKS_CONFIG}" ]; then
  ACTIVE_CONFIGS+=("${ADAPTER_HOOKS_CONFIG}")
fi
if [ -f "${WINDSURF_HOOKS_CONFIG}" ]; then
  ACTIVE_CONFIGS+=("${WINDSURF_HOOKS_CONFIG}")
fi

for config_path in "${ACTIVE_CONFIGS[@]}"; do
  validate_hooks_config "${config_path}"
done

if [ ! -x "${WRAPPER_PATH}" ]; then
  echo "[pumuki:cascade-hooks] wrapper script is not executable: ${WRAPPER_PATH}" >&2
  exit 1
fi

bash "${WRAPPER_PATH}" --diagnose >/dev/null

echo "[pumuki:cascade-hooks] verify OK"
for config_path in "${ACTIVE_CONFIGS[@]}"; do
  echo "[pumuki:cascade-hooks] config=${config_path}"
done
echo "[pumuki:cascade-hooks] wrapper=${WRAPPER_PATH}"
