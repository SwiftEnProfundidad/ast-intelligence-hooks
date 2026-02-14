#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  shift
fi

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 [--dry-run] <support_ticket_id> <submitted_by> <follow_up_eta> [submitted_at_utc]" >&2
  exit 1
fi

SUPPORT_TICKET_ID="$1"
SUBMITTED_BY="$2"
FOLLOW_UP_ETA="$3"
SUBMITTED_AT_UTC="${4:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"

HANDOFF_FILE="docs/validation/consumer-startup-escalation-handoff-latest.md"
PROGRESS_FILE="docs/REFRACTOR_PROGRESS.md"
TODO_FILE="docs/TODO.md"

if [[ ! -f "${HANDOFF_FILE}" || ! -f "${PROGRESS_FILE}" || ! -f "${TODO_FILE}" ]]; then
  echo "[phase5-escalation-close] required docs not found" >&2
  exit 1
fi

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "[phase5-escalation-close] DRY RUN"
  echo "[phase5-escalation-close] would mark submission metadata:"
  echo "  support_ticket_id=${SUPPORT_TICKET_ID}"
  echo "  submitted_by=${SUBMITTED_BY}"
  echo "  follow_up_eta=${FOLLOW_UP_ETA}"
  echo "  submitted_at_utc=${SUBMITTED_AT_UTC}"
  echo "[phase5-escalation-close] would switch queue:"
  echo "  P8-2b: 🚧 -> ✅"
  echo "  P8-3:  ⏳ -> 🚧"
  exit 0
fi

bash scripts/mark-phase5-escalation-submitted.sh "${SUPPORT_TICKET_ID}" "${SUBMITTED_BY}" "${FOLLOW_UP_ETA}" "${SUBMITTED_AT_UTC}"

awk \
  -v ticket="${SUPPORT_TICKET_ID}" \
  -v submitted_by="${SUBMITTED_BY}" \
  -v submitted_at="${SUBMITTED_AT_UTC}" '
  {
    if ($0 ~ /^- 🚧 `P8-2b`/) {
      print "- ✅ `P8-2b` Submit GitHub Support escalation using packaged evidence bundle and fill `Submission Tracking` fields in handoff (submitted: `" ticket "` by `" submitted_by "` at `" submitted_at "`).";
    } else if ($0 ~ /^- ⏳ `P8-3`/) {
      print "- 🚧 `P8-3` Re-run post-submission refresh sequence after support feedback and validate new run behavior.";
    } else {
      print $0;
    }
  }
' "${PROGRESS_FILE}" > "${PROGRESS_FILE}.tmp"

mv "${PROGRESS_FILE}.tmp" "${PROGRESS_FILE}"

awk \
  -v ticket="${SUPPORT_TICKET_ID}" \
  -v submitted_by="${SUBMITTED_BY}" \
  -v submitted_at="${SUBMITTED_AT_UTC}" \
  -v eta="${FOLLOW_UP_ETA}" '
  {
    if ($0 ~ /submission readiness is `READY_TO_SUBMIT`/) {
      print "    - submission sent to GitHub Support: ticket `" ticket "`, submitted by `" submitted_by "` at `" submitted_at "`.";
      print "    - follow-up ETA registered: `" eta "`.";
    } else {
      print $0;
    }
  }
' "${TODO_FILE}" > "${TODO_FILE}.tmp"

mv "${TODO_FILE}.tmp" "${TODO_FILE}"

echo "[phase5-escalation-close] submission closed in docs"
echo "[phase5-escalation-close] support_ticket_id=${SUPPORT_TICKET_ID}"
echo "[phase5-escalation-close] next active queue item: P8-3"
