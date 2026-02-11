#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
REPO="${2:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${3:-8}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"

echo "[phase8-autopilot] out_dir=${OUT_DIR}"

if npm run validation:phase8:doctor -- "${OUT_DIR}" "${REPO}" "${LIMIT}" "${MOCK_AB_REPORT}" >/tmp/phase8-autopilot-doctor.log 2>&1; then
  cat /tmp/phase8-autopilot-doctor.log
  echo "[phase8-autopilot] status=READY"
  echo "[phase8-autopilot] running close-ready packaging..."
  npm run validation:phase8:close-ready -- "${OUT_DIR}"
  exit 0
fi

cat /tmp/phase8-autopilot-doctor.log
NEXT_COMMAND="$(rg -n '^\[phase8-doctor\] next_command=' /tmp/phase8-autopilot-doctor.log | head -n 1 | sed -E 's/^[0-9]+:\[phase8-doctor\] next_command=//')"
KNOWN_CAUSE="$(rg -n 'known_external_cause:' /tmp/phase8-autopilot-doctor.log | head -n 1 | sed -E 's/^[0-9]+:\[phase8-doctor\] //')"

[[ -z "${KNOWN_CAUSE}" ]] && KNOWN_CAUSE="known_external_cause: <unknown>"

echo "[phase8-autopilot] status=BLOCKED"
echo "[phase8-autopilot] ${KNOWN_CAUSE}"
if [[ -n "${NEXT_COMMAND}" ]]; then
  echo "[phase8-autopilot] next_command=${NEXT_COMMAND}"
fi
echo "[phase8-autopilot] action_required=reactivate billing (or clear external blocker), then rerun."
exit 1
