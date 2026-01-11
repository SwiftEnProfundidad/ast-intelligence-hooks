#!/bin/bash

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

AUTO_TRIGGER="${AUTO_EVIDENCE_TRIGGER:-manual}"
AUTO_REASON="${AUTO_EVIDENCE_REASON:-user_invoked}"
AUTO_SUMMARY="${AUTO_EVIDENCE_SUMMARY:-Manual evidence update}"

for arg in "$@"; do
  if [[ "$arg" == "--auto" ]]; then
    AUTO_TRIGGER="auto"
    AUTO_REASON="auto_refresh"
    AUTO_SUMMARY="Automatic evidence refresh"
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
  node "$CLI" evidence:full-update

EXIT_CODE=$?
if [[ "$EXIT_CODE" -ne 0 ]]; then
  echo " Evidence updated but gate reported violations (exit code: $EXIT_CODE)." >&2
  exit 0
fi

exit 0
