#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage:
  bash scripts/mark-phase8-followup-replied-now.sh \
    <follow_up_posted_by> \
    <support_reply_summary> \
    [support_ticket_id] \
    [follow_up_last_posted_at_utc] \
    [support_reply_received_at_utc]
EOF
}

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

FOLLOW_UP_POSTED_BY="$1"
SUPPORT_REPLY_SUMMARY="$2"
SUPPORT_TICKET_ID="${3:-4077449}"
FOLLOW_UP_LAST_POSTED_AT_UTC="${4:-}"
SUPPORT_REPLY_RECEIVED_AT_UTC="${5:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"
HANDOFF_FILE="docs/validation/consumer-startup-escalation-handoff-latest.md"

if [[ -z "${FOLLOW_UP_LAST_POSTED_AT_UTC}" ]]; then
  FOLLOW_UP_LAST_POSTED_AT_UTC="$(
    rg -n "^- follow_up_last_posted_at_utc:" "${HANDOFF_FILE}" \
      | head -n 1 \
      | sed -E 's/^[0-9]+:- follow_up_last_posted_at_utc:[[:space:]]*//; s/`//g; s/\r//g' \
      | xargs || true
  )"
fi

if [[ -z "${FOLLOW_UP_LAST_POSTED_AT_UTC}" || "${FOLLOW_UP_LAST_POSTED_AT_UTC}" == "PENDING_MANUAL_POST" ]]; then
  FOLLOW_UP_LAST_POSTED_AT_UTC="${SUPPORT_REPLY_RECEIVED_AT_UTC}"
fi

bash scripts/mark-phase8-support-followup-state.sh \
  "${SUPPORT_TICKET_ID}" \
  "${FOLLOW_UP_POSTED_BY}" \
  "SUPPORT_REPLIED" \
  "${FOLLOW_UP_LAST_POSTED_AT_UTC}" \
  "${SUPPORT_REPLY_RECEIVED_AT_UTC}" \
  "${SUPPORT_REPLY_SUMMARY}"

echo "[mark-phase8-followup-replied-now] support_ticket_id=${SUPPORT_TICKET_ID}"
echo "[mark-phase8-followup-replied-now] follow_up_last_posted_by=${FOLLOW_UP_POSTED_BY}"
echo "[mark-phase8-followup-replied-now] follow_up_last_posted_at_utc=${FOLLOW_UP_LAST_POSTED_AT_UTC}"
echo "[mark-phase8-followup-replied-now] support_reply_received_at_utc=${SUPPORT_REPLY_RECEIVED_AT_UTC}"
