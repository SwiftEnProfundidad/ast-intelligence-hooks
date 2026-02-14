#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage:
  bash scripts/mark-phase8-followup-posted-now.sh \
    <follow_up_posted_by> \
    [support_ticket_id] \
    [follow_up_last_posted_at_utc]
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

FOLLOW_UP_POSTED_BY="$1"
SUPPORT_TICKET_ID="${2:-4077449}"
FOLLOW_UP_LAST_POSTED_AT_UTC="${3:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"

bash scripts/mark-phase8-support-followup-state.sh \
  "${SUPPORT_TICKET_ID}" \
  "${FOLLOW_UP_POSTED_BY}" \
  "POSTED_WAITING_REPLY" \
  "${FOLLOW_UP_LAST_POSTED_AT_UTC}" \
  "PENDING_SUPPORT_REPLY" \
  "PENDING_SUPPORT_REPLY"

echo "[mark-phase8-followup-posted-now] support_ticket_id=${SUPPORT_TICKET_ID}"
echo "[mark-phase8-followup-posted-now] follow_up_last_posted_by=${FOLLOW_UP_POSTED_BY}"
echo "[mark-phase8-followup-posted-now] follow_up_last_posted_at_utc=${FOLLOW_UP_LAST_POSTED_AT_UTC}"
