#!/usr/bin/env bash

# Resolves a usable Node.js runtime for Windsurf hooks, even when PATH is minimal.
# Usage:
#   run-hook-with-node.sh pre-write-code-hook.js
#   run-hook-with-node.sh post-write-code-hook.js

set -u

DIAGNOSTIC_ONLY=0
HOOK_SCRIPT_NAME="${1:-}"
if [ "${HOOK_SCRIPT_NAME}" = "--diagnose" ]; then
  DIAGNOSTIC_ONLY=1
  HOOK_SCRIPT_NAME="${2:-}"
fi

if [ -z "${HOOK_SCRIPT_NAME}" ] && [ "${DIAGNOSTIC_ONLY}" -ne 1 ]; then
  echo "[pumuki:cascade-hooks] missing hook script argument" >&2
  exit 0
fi

SCRIPT_SOURCE="${BASH_SOURCE[0]}"
if [[ "${SCRIPT_SOURCE}" == */* ]]; then
  SCRIPT_DIR="$(cd "${SCRIPT_SOURCE%/*}" && pwd)"
else
  SCRIPT_DIR="$(pwd)"
fi

HOOK_SCRIPT_PATH=""
if [ -n "${HOOK_SCRIPT_NAME}" ]; then
  HOOK_SCRIPT_PATH="${SCRIPT_DIR}/${HOOK_SCRIPT_NAME}"
fi

if [ "${DIAGNOSTIC_ONLY}" -ne 1 ] && [ ! -f "$HOOK_SCRIPT_PATH" ]; then
  echo "[pumuki:cascade-hooks] hook script not found: ${HOOK_SCRIPT_PATH}" >&2
  exit 0
fi

resolve_node_binary() {
  if [ -n "${NODE_BINARY:-}" ] && [ -x "${NODE_BINARY}" ]; then
    printf '%s\n' "${NODE_BINARY}"
    return 0
  fi

  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi

  if [ -n "${NVM_BIN:-}" ] && [ -x "${NVM_BIN}/node" ]; then
    printf '%s\n' "${NVM_BIN}/node"
    return 0
  fi

  if [ -n "${VOLTA_HOME:-}" ] && [ -x "${VOLTA_HOME}/bin/node" ]; then
    printf '%s\n' "${VOLTA_HOME}/bin/node"
    return 0
  fi

  if [ -n "${HOME:-}" ] && [ -x "${HOME}/.volta/bin/node" ]; then
    printf '%s\n' "${HOME}/.volta/bin/node"
    return 0
  fi

  if [ -n "${HOME:-}" ] && [ -x "${HOME}/.asdf/shims/node" ]; then
    printf '%s\n' "${HOME}/.asdf/shims/node"
    return 0
  fi

  if [ -n "${HOME:-}" ] && [ -d "${HOME}/.nvm/versions/node" ]; then
    local nvm_candidate
    local nvm_matches
    local nvm_path
    nvm_candidate=""
    shopt -s nullglob
    nvm_matches=("${HOME}"/.nvm/versions/node/*/bin/node)
    shopt -u nullglob
    for nvm_path in "${nvm_matches[@]}"; do
      if [ -x "${nvm_path}" ]; then
        nvm_candidate="${nvm_path}"
      fi
    done
    if [ -n "${nvm_candidate}" ] && [ -x "${nvm_candidate}" ]; then
      printf '%s\n' "${nvm_candidate}"
      return 0
    fi
  fi

  if [ -n "${HOME:-}" ] && [ -d "${HOME}/.local/share/fnm/node-versions" ]; then
    local fnm_candidate
    local fnm_matches
    local fnm_path
    fnm_candidate=""
    shopt -s nullglob
    fnm_matches=("${HOME}"/.local/share/fnm/node-versions/*/installation/bin/node)
    shopt -u nullglob
    for fnm_path in "${fnm_matches[@]}"; do
      if [ -x "${fnm_path}" ]; then
        fnm_candidate="${fnm_path}"
      fi
    done
    if [ -n "${fnm_candidate}" ] && [ -x "${fnm_candidate}" ]; then
      printf '%s\n' "${fnm_candidate}"
      return 0
    fi
  fi

  for candidate in \
    "/opt/homebrew/bin/node" \
    "/usr/local/bin/node" \
    "/usr/bin/node"
  do
    if [ -x "${candidate}" ]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  return 1
}

print_runtime_diagnostics() {
  local node_bin="${1:-}"
  if [ -n "${node_bin}" ]; then
    local node_version
    node_version="$("${node_bin}" --version 2>/dev/null || echo "unknown")"
    echo "[pumuki:cascade-hooks] node_bin=${node_bin}" >&2
    echo "[pumuki:cascade-hooks] node_version=${node_version}" >&2
  else
    echo "[pumuki:cascade-hooks] node_bin=<not found>" >&2
  fi
  echo "[pumuki:cascade-hooks] script_dir=${SCRIPT_DIR}" >&2
  echo "[pumuki:cascade-hooks] hook_script=${HOOK_SCRIPT_PATH:-<none>}" >&2
  echo "[pumuki:cascade-hooks] strict_node=${PUMUKI_HOOK_STRICT_NODE:-0}" >&2
  echo "[pumuki:cascade-hooks] PATH=${PATH:-<empty>}" >&2
}

NODE_BIN="$(resolve_node_binary || true)"
if [ -z "$NODE_BIN" ]; then
  echo "[pumuki:cascade-hooks] node runtime not found. Set NODE_BINARY or update PATH." >&2
  print_runtime_diagnostics ""
  if [ "${PUMUKI_HOOK_STRICT_NODE:-0}" = "1" ]; then
    exit 2
  fi
  exit 0
fi

if [ "${PUMUKI_HOOK_DIAGNOSTIC:-0}" = "1" ] || [ "${DIAGNOSTIC_ONLY}" -eq 1 ]; then
  print_runtime_diagnostics "${NODE_BIN}"
fi

if [ "${DIAGNOSTIC_ONLY}" -eq 1 ]; then
  exit 0
fi

exec "$NODE_BIN" "$HOOK_SCRIPT_PATH"
