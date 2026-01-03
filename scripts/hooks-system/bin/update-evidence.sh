#!/bin/bash

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

AUTO_TRIGGER="${AUTO_EVIDENCE_TRIGGER:-}"
AUTO_REASON="${AUTO_EVIDENCE_REASON:-}"
AUTO_SUMMARY="${AUTO_EVIDENCE_SUMMARY:-}"

for arg in "$@"; do
  if [[ "$arg" == "--auto" ]]; then
    AUTO_TRIGGER="${AUTO_TRIGGER:-auto}"
    AUTO_REASON="${AUTO_REASON:-auto}"
    AUTO_SUMMARY="${AUTO_SUMMARY:-auto}"
  fi
done

CLI="$REPO_ROOT/scripts/hooks-system/bin/cli.js"
if [[ ! -f "$CLI" ]]; then
  CLI="$REPO_ROOT/node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/cli.js"
fi

if [[ ! -f "$CLI" ]]; then
  echo "update-evidence.sh CLI not found. Please reinstall dependencies." >&2
  exit 1
fi

AUTO_EVIDENCE_TRIGGER="$AUTO_TRIGGER" AUTO_EVIDENCE_REASON="$AUTO_REASON" AUTO_EVIDENCE_SUMMARY="$AUTO_SUMMARY" \
  node "$CLI" evidence:update
