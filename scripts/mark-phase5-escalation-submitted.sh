#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <support_ticket_id> <submitted_by> <follow_up_eta> [submitted_at_utc]" >&2
  exit 1
fi

SUPPORT_TICKET_ID="$1"
SUBMITTED_BY="$2"
FOLLOW_UP_ETA="$3"
SUBMITTED_AT_UTC="${4:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"

HANDOFF_FILE="docs/validation/consumer-startup-escalation-handoff-latest.md"

if [[ ! -f "${HANDOFF_FILE}" ]]; then
  echo "[mark-phase5-escalation-submitted] ERROR: file not found: ${HANDOFF_FILE}" >&2
  exit 1
fi

awk \
  -v support_ticket_id="${SUPPORT_TICKET_ID}" \
  -v submitted_by="${SUBMITTED_BY}" \
  -v follow_up_eta="${FOLLOW_UP_ETA}" \
  -v submitted_at_utc="${SUBMITTED_AT_UTC}" '
  {
    if ($0 ~ /^- support_ticket_id:/) {
      print "- support_ticket_id: `" support_ticket_id "`";
    } else if ($0 ~ /^- submitted_at_utc:/) {
      print "- submitted_at_utc: `" submitted_at_utc "`";
    } else if ($0 ~ /^- submitted_by:/) {
      print "- submitted_by: `" submitted_by "`";
    } else if ($0 ~ /^- follow_up_eta:/) {
      print "- follow_up_eta: `" follow_up_eta "`";
    } else if ($0 ~ /^- submission_blocker:/) {
      print "- submission_blocker: `NONE`";
    } else {
      print $0;
    }
  }
' "${HANDOFF_FILE}" > "${HANDOFF_FILE}.tmp"

mv "${HANDOFF_FILE}.tmp" "${HANDOFF_FILE}"

echo "[mark-phase5-escalation-submitted] updated ${HANDOFF_FILE}"
echo "[mark-phase5-escalation-submitted] support_ticket_id=${SUPPORT_TICKET_ID}"
echo "[mark-phase5-escalation-submitted] submitted_at_utc=${SUBMITTED_AT_UTC}"
echo "[mark-phase5-escalation-submitted] submitted_by=${SUBMITTED_BY}"
echo "[mark-phase5-escalation-submitted] follow_up_eta=${FOLLOW_UP_ETA}"
