#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
HANDOFF_FILE="docs/validation/consumer-startup-escalation-handoff-latest.md"
OUTPUT_FILE="${OUT_DIR}/github-support-portal-payload.txt"

if [[ ! -f "${HANDOFF_FILE}" ]]; then
  echo "[phase5-support-payload] ERROR: handoff not found: ${HANDOFF_FILE}" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

SUBJECT="$(awk '
  /^Subject:$/ { in_subject=1; next }
  in_subject && $0 ~ /^`/ {
    gsub(/^`|`$/, "", $0);
    print $0;
    exit;
  }
' "${HANDOFF_FILE}")"

if [[ -z "${SUBJECT}" ]]; then
  echo "[phase5-support-payload] ERROR: could not extract subject from handoff" >&2
  exit 1
fi

BODY="$(awk '
  /^Body:$/ { seen_body=1; next }
  seen_body && /^```text$/ { in_block=1; next }
  in_block && /^```$/ { exit }
  in_block { print }
' "${HANDOFF_FILE}")"

if [[ -z "${BODY}" ]]; then
  echo "[phase5-support-payload] ERROR: could not extract body payload from handoff" >&2
  exit 1
fi

REQUIRED_ATTACHMENTS=(
  "${OUT_DIR}/consumer-ci-auth-check.md"
  "${OUT_DIR}/consumer-startup-failure-support-bundle.md"
  "${OUT_DIR}/consumer-startup-unblock-status.md"
  "${OUT_DIR}/consumer-support-ticket-draft.md"
  "${OUT_DIR}/phase5-external-handoff.md"
  "${OUT_DIR}/consumer-startup-escalation-bundle-latest.tgz"
)

{
  echo "Subject:"
  echo "${SUBJECT}"
  echo
  echo "Body:"
  echo "${BODY}"
  echo
  echo "Attachments checklist:"
  for attachment in "${REQUIRED_ATTACHMENTS[@]}"; do
    if [[ -f "${attachment}" ]]; then
      echo "- [OK] ${attachment}"
    else
      echo "- [MISSING] ${attachment}"
    fi
  done
} > "${OUTPUT_FILE}"

echo "[phase5-support-payload] wrote ${OUTPUT_FILE}"
