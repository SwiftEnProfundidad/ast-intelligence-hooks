#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage:
  bash scripts/mark-phase8-support-followup-state.sh \
    <support_ticket_id> \
    <follow_up_posted_by> \
    <follow_up_state: POSTED_WAITING_REPLY|SUPPORT_REPLIED> \
    [follow_up_last_posted_at_utc] \
    [support_reply_received_at_utc] \
    [support_reply_summary]
EOF
}

if [[ $# -lt 3 ]]; then
  usage
  exit 1
fi

SUPPORT_TICKET_ID="$1"
FOLLOW_UP_POSTED_BY="$2"
FOLLOW_UP_STATE="$3"
FOLLOW_UP_LAST_POSTED_AT_UTC="${4:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"
SUPPORT_REPLY_RECEIVED_AT_UTC="${5:-PENDING}"
SUPPORT_REPLY_SUMMARY="${6:-PENDING}"

case "${FOLLOW_UP_STATE}" in
  POSTED_WAITING_REPLY|SUPPORT_REPLIED) ;;
  *)
    echo "[mark-phase8-followup] invalid follow_up_state: ${FOLLOW_UP_STATE}" >&2
    usage
    exit 1
    ;;
esac

HANDOFF_FILE="docs/validation/consumer-startup-escalation-handoff-latest.md"

if [[ ! -f "${HANDOFF_FILE}" ]]; then
  echo "[mark-phase8-followup] ERROR: file not found: ${HANDOFF_FILE}" >&2
  exit 1
fi

update_or_append_field() {
  local key="$1"
  local value="$2"
  local file="$3"

  awk \
    -v key="${key}" \
    -v value="${value}" '
    BEGIN { updated = 0 }
    {
      if ($0 ~ "^- " key ":") {
        print "- " key ": `" value "`";
        updated = 1;
      } else {
        print $0;
      }
    }
    END {
      if (!updated) {
        print "- " key ": `" value "`";
      }
    }
  ' "${file}" > "${file}.tmp"

  mv "${file}.tmp" "${file}"
}

update_or_append_field "support_ticket_id" "${SUPPORT_TICKET_ID}" "${HANDOFF_FILE}"
update_or_append_field "follow_up_last_posted_at_utc" "${FOLLOW_UP_LAST_POSTED_AT_UTC}" "${HANDOFF_FILE}"
update_or_append_field "follow_up_last_posted_by" "${FOLLOW_UP_POSTED_BY}" "${HANDOFF_FILE}"
update_or_append_field "follow_up_state" "${FOLLOW_UP_STATE}" "${HANDOFF_FILE}"
update_or_append_field "support_reply_received_at_utc" "${SUPPORT_REPLY_RECEIVED_AT_UTC}" "${HANDOFF_FILE}"
update_or_append_field "support_reply_summary" "${SUPPORT_REPLY_SUMMARY}" "${HANDOFF_FILE}"

if [[ "${FOLLOW_UP_STATE}" == "SUPPORT_REPLIED" ]]; then
  update_or_append_field "loop_guard_next_refresh_not_before_utc" "${FOLLOW_UP_LAST_POSTED_AT_UTC}" "${HANDOFF_FILE}"
fi

echo "[mark-phase8-followup] updated ${HANDOFF_FILE}"
echo "[mark-phase8-followup] support_ticket_id=${SUPPORT_TICKET_ID}"
echo "[mark-phase8-followup] follow_up_last_posted_at_utc=${FOLLOW_UP_LAST_POSTED_AT_UTC}"
echo "[mark-phase8-followup] follow_up_last_posted_by=${FOLLOW_UP_POSTED_BY}"
echo "[mark-phase8-followup] follow_up_state=${FOLLOW_UP_STATE}"
echo "[mark-phase8-followup] support_reply_received_at_utc=${SUPPORT_REPLY_RECEIVED_AT_UTC}"
echo "[mark-phase8-followup] support_reply_summary=${SUPPORT_REPLY_SUMMARY}"
