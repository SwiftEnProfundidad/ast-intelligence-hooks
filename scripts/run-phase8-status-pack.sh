#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
REPO="${2:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${3:-8}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"

echo "[phase8-status-pack] start"
echo "[phase8-status-pack] out_dir=${OUT_DIR}"

if [[ -f "scripts/check-phase8-loop-guard.sh" ]]; then
  if ! bash scripts/check-phase8-loop-guard.sh; then
    echo "[phase8-status-pack] blocked by loop guard; skipping status-pack cycle"
    echo "[phase8-status-pack] next_action=manual follow-up post/reply tracking in ticket 4077449"
    exit 1
  fi
else
  echo "[phase8-status-pack] warning: loop guard checker not found (scripts/check-phase8-loop-guard.sh)"
fi

if ! npm run validation:progress-single-active; then
  echo "[phase8-status-pack] progress guardrail failed" >&2
  exit 1
fi

if npm run validation:phase8:doctor -- "${OUT_DIR}" "${REPO}" "${LIMIT}" "${MOCK_AB_REPORT}"; then
  echo "[phase8-status-pack] chain_status=READY"
  echo "[phase8-status-pack] next_command=npm run validation:phase8:close-ready -- ${OUT_DIR}"
  exit 0
fi

echo "[phase8-status-pack] chain_status=BLOCKED"
echo "[phase8-status-pack] next_command=npm run validation:phase8:resume-after-billing -- ${REPO} ${LIMIT} ${OUT_DIR} ${MOCK_AB_REPORT}"
exit 1
