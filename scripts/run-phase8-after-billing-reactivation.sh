#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${2:-8}"
OUT_DIR="${3:-.audit-reports/phase5-latest}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"

echo "[phase8-after-billing] repo=${REPO}"
echo "[phase8-after-billing] limit=${LIMIT}"
echo "[phase8-after-billing] out_dir=${OUT_DIR}"

if ! npm run validation:phase5-post-support:refresh -- "${REPO}" "${LIMIT}" "${OUT_DIR}" "${MOCK_AB_REPORT}"; then
  echo "[phase8-after-billing] chain is still not READY after refresh" >&2
  echo "[phase8-after-billing] next step: inspect ${OUT_DIR}/consumer-startup-unblock-status.md and rerun once billing is active." >&2
  exit 1
fi

echo "[phase8-after-billing] READY chain confirmed"
echo "[phase8-after-billing] next step: close P8-4 and regenerate final external handoff bundle."
