#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${2:-8}"
OUT_DIR="${3:-.audit-reports/phase5-latest}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"

echo "[phase8-tick] repo=${REPO}"
echo "[phase8-tick] limit=${LIMIT}"
echo "[phase8-tick] out_dir=${OUT_DIR}"

if [[ -f "scripts/check-phase8-loop-guard.sh" ]]; then
  if ! bash scripts/check-phase8-loop-guard.sh; then
    echo "[phase8-tick] blocked by loop guard; skipping refresh"
    echo "[phase8-tick] override_if_support_replied=PHASE8_LOOP_GUARD_OVERRIDE=1 npm run validation:phase8:tick -- ${REPO} ${LIMIT} ${OUT_DIR} ${MOCK_AB_REPORT}"
    exit 1
  fi
else
  echo "[phase8-tick] warning: loop guard checker not found (scripts/check-phase8-loop-guard.sh)"
fi

if ! npm run validation:phase5-latest:refresh -- "${REPO}" "${LIMIT}" "${OUT_DIR}" "${MOCK_AB_REPORT}"; then
  echo "[phase8-tick] refresh completed with BLOCKED chain (expected while external blocker persists)"
fi

if npm run validation:phase8:status-pack -- "${OUT_DIR}" "${REPO}" "${LIMIT}" "${MOCK_AB_REPORT}"; then
  echo "[phase8-tick] READY chain confirmed"
  echo "[phase8-tick] next_command=npm run validation:phase8:close-ready -- ${OUT_DIR}"
  exit 0
fi

echo "[phase8-tick] chain still BLOCKED"
echo "[phase8-tick] next_command=npm run validation:phase8:resume-after-billing -- ${REPO} ${LIMIT} ${OUT_DIR} ${MOCK_AB_REPORT}"
exit 1
