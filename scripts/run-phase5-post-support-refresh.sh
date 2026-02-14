#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${2:-8}"
OUT_DIR="${3:-.audit-reports/phase5-latest}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"

echo "[phase5-post-support-refresh] repo=${REPO} limit=${LIMIT} out_dir=${OUT_DIR}"

if [[ -f "scripts/check-phase8-loop-guard.sh" ]]; then
  if ! bash scripts/check-phase8-loop-guard.sh; then
    echo "[phase5-post-support-refresh] blocked by loop guard; skipping refresh"
    echo "[phase5-post-support-refresh] next_action=post follow-up manually and/or wait support reply in ticket 4077449"
    echo "[phase5-post-support-refresh] override_if_support_replied=PHASE8_LOOP_GUARD_OVERRIDE=1 npm run validation:phase5-post-support:refresh -- ${REPO} ${LIMIT} ${OUT_DIR} ${MOCK_AB_REPORT}"
    exit 1
  fi
else
  echo "[phase5-post-support-refresh] warning: loop guard checker not found (scripts/check-phase8-loop-guard.sh)"
fi

bash scripts/refresh-phase5-latest-escalation.sh "${REPO}" "${LIMIT}" "${OUT_DIR}" "${MOCK_AB_REPORT}"
bash scripts/check-phase5-latest-ready-chain.sh "${OUT_DIR}"

echo "[phase5-post-support-refresh] READY chain confirmed after refresh"
