#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${2:-8}"
OUT_DIR="${3:-.audit-reports/phase5-latest}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"

echo "[phase5-post-support-refresh] repo=${REPO} limit=${LIMIT} out_dir=${OUT_DIR}"

bash scripts/refresh-phase5-latest-escalation.sh "${REPO}" "${LIMIT}" "${OUT_DIR}" "${MOCK_AB_REPORT}"
bash scripts/check-phase5-latest-ready-chain.sh "${OUT_DIR}"

echo "[phase5-post-support-refresh] READY chain confirmed after refresh"
