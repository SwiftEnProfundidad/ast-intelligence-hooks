#!/usr/bin/env bash

# Verifies Windsurf hooks.json wiring and wrapper runtime diagnostics.
# Usage:
#   verify-windsurf-hooks-runtime.sh

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
HOOKS_CONFIG="${HOME}/.codeium/windsurf/hooks.json"

if [ ! -f "${HOOKS_CONFIG}" ]; then
  echo "[pumuki:cascade-hooks] missing Windsurf config: ${HOOKS_CONFIG}" >&2
  exit 1
fi

if ! grep -q '"pre_write_code"' "${HOOKS_CONFIG}"; then
  echo "[pumuki:cascade-hooks] hooks.json missing pre_write_code section" >&2
  exit 1
fi
if ! grep -q '"post_write_code"' "${HOOKS_CONFIG}"; then
  echo "[pumuki:cascade-hooks] hooks.json missing post_write_code section" >&2
  exit 1
fi

if ! grep -q "${WRAPPER_PATH//\//\\/}" "${HOOKS_CONFIG}"; then
  echo "[pumuki:cascade-hooks] hooks.json does not point to expected wrapper path" >&2
  echo "[pumuki:cascade-hooks] expected: ${WRAPPER_PATH}" >&2
  exit 1
fi

if [ ! -x "${WRAPPER_PATH}" ]; then
  echo "[pumuki:cascade-hooks] wrapper script is not executable: ${WRAPPER_PATH}" >&2
  exit 1
fi

bash "${WRAPPER_PATH}" --diagnose >/dev/null

echo "[pumuki:cascade-hooks] verify OK"
echo "[pumuki:cascade-hooks] config=${HOOKS_CONFIG}"
echo "[pumuki:cascade-hooks] wrapper=${WRAPPER_PATH}"
