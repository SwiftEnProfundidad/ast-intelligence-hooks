#!/usr/bin/env bash

# Resolves a usable Node.js runtime for Windsurf hooks, even when PATH is minimal.
# Usage:
#   run-hook-with-node.sh pre-write-code-hook.js
#   run-hook-with-node.sh post-write-code-hook.js

set -u

HOOK_SCRIPT_NAME="${1:-}"
if [ -z "$HOOK_SCRIPT_NAME" ]; then
  echo "[pumuki:cascade-hooks] missing hook script argument" >&2
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_SCRIPT_PATH="${SCRIPT_DIR}/${HOOK_SCRIPT_NAME}"

if [ ! -f "$HOOK_SCRIPT_PATH" ]; then
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
    nvm_candidate="$(
      ls -1d "${HOME}"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -n 1
    )"
    if [ -n "${nvm_candidate}" ] && [ -x "${nvm_candidate}" ]; then
      printf '%s\n' "${nvm_candidate}"
      return 0
    fi
  fi

  if [ -n "${HOME:-}" ] && [ -d "${HOME}/.local/share/fnm/node-versions" ]; then
    local fnm_candidate
    fnm_candidate="$(
      ls -1d "${HOME}"/.local/share/fnm/node-versions/*/installation/bin/node 2>/dev/null | sort -V | tail -n 1
    )"
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

NODE_BIN="$(resolve_node_binary || true)"
if [ -z "$NODE_BIN" ]; then
  echo "[pumuki:cascade-hooks] node runtime not found. Set NODE_BINARY or update PATH." >&2
  echo "[pumuki:cascade-hooks] PATH=${PATH:-<empty>}" >&2
  exit 0
fi

exec "$NODE_BIN" "$HOOK_SCRIPT_PATH"
