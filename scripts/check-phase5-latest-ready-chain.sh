#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"

STATUS_REPORT="${OUT_DIR}/phase5-execution-closure-status.md"
BLOCKERS_REPORT="${OUT_DIR}/phase5-blockers-readiness.md"
HANDOFF_REPORT="${OUT_DIR}/phase5-external-handoff.md"
UNBLOCK_REPORT="${OUT_DIR}/consumer-startup-unblock-status.md"

for file in "${STATUS_REPORT}" "${BLOCKERS_REPORT}" "${HANDOFF_REPORT}" "${UNBLOCK_REPORT}"; do
  if [[ ! -f "${file}" ]]; then
    echo "[phase5-ready-check] missing report: ${file}" >&2
    exit 1
  fi
done

extract_verdict() {
  local file="$1"
  local verdict
  verdict="$(grep -E '(^|\s)- verdict:\s*' "${file}" | head -n1 | sed -E 's/.*- verdict:\s*//; s/`//g; s/\r//g' || true)"
  if [[ -z "${verdict}" ]]; then
    verdict="$(grep -E '(^|\s)- status:\s*' "${file}" | head -n1 | sed -E 's/.*- status:\s*//; s/`//g; s/\r//g' || true)"
  fi
  echo "${verdict}" | xargs
}

PHASE5_STATUS="$(extract_verdict "${STATUS_REPORT}")"
PHASE5_BLOCKERS="$(extract_verdict "${BLOCKERS_REPORT}")"
PHASE5_HANDOFF="$(extract_verdict "${HANDOFF_REPORT}")"
CONSUMER_UNBLOCK="$(extract_verdict "${UNBLOCK_REPORT}")"

echo "[phase5-ready-check] phase5-execution-closure-status=${PHASE5_STATUS:-UNKNOWN}"
echo "[phase5-ready-check] phase5-blockers-readiness=${PHASE5_BLOCKERS:-UNKNOWN}"
echo "[phase5-ready-check] phase5-external-handoff=${PHASE5_HANDOFF:-UNKNOWN}"
echo "[phase5-ready-check] consumer-startup-unblock-status=${CONSUMER_UNBLOCK:-UNKNOWN}"

if [[ "${PHASE5_STATUS}" == "READY" && "${PHASE5_BLOCKERS}" == "READY" && "${PHASE5_HANDOFF}" == "READY" && "${CONSUMER_UNBLOCK}" == "READY" ]]; then
  echo "[phase5-ready-check] READY chain confirmed"
  exit 0
fi

echo "[phase5-ready-check] chain not ready yet"
exit 1
