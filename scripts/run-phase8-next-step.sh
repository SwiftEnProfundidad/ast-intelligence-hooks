#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
REPO="${2:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${3:-8}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"
HANDOFF_DOC="docs/validation/consumer-startup-escalation-handoff-latest.md"

echo "[phase8-next-step] out_dir=${OUT_DIR}"

if npm run validation:phase5-latest:ready-check -- "${OUT_DIR}" >/tmp/phase8-next-step-ready.log 2>&1; then
  echo "[phase8-next-step] status=READY"
  echo "[phase8-next-step] next_command=npm run validation:phase8:close-ready -- ${OUT_DIR}"
  echo "[phase8-next-step] note=run close-ready to build final package and finish P8-4."
  exit 0
fi

KNOWN_CAUSE="$(rg -n "known_external_cause:" "${HANDOFF_DOC}" | head -n 1 | sed 's/^[0-9]*:[[:space:]]*//')"
if [[ -z "${KNOWN_CAUSE}" ]]; then
  KNOWN_CAUSE="known_external_cause: <missing>"
fi

echo "[phase8-next-step] status=BLOCKED"
echo "[phase8-next-step] ${KNOWN_CAUSE}"
echo "[phase8-next-step] next_command=npm run validation:phase8:resume-after-billing -- ${REPO} ${LIMIT} ${OUT_DIR} ${MOCK_AB_REPORT}"
echo "[phase8-next-step] note=run resume-after-billing once billing is active, then rerun this status command."
exit 1
