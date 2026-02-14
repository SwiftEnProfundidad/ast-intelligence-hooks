#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"

echo "[phase5-escalation-prepare] out_dir=${OUT_DIR}"

bash scripts/check-phase5-escalation-ready-to-submit.sh "${OUT_DIR}"
bash scripts/build-phase5-support-portal-payload.sh "${OUT_DIR}"

PAYLOAD_FILE="${OUT_DIR}/github-support-portal-payload.txt"

echo
echo "[phase5-escalation-prepare] READY PACKAGE"
echo "[phase5-escalation-prepare] payload_file=${PAYLOAD_FILE}"
echo "[phase5-escalation-prepare] next steps:"
echo "1) Open GitHub Support portal"
echo "2) Copy subject/body from ${PAYLOAD_FILE}"
echo "3) Attach ${OUT_DIR}/consumer-startup-escalation-bundle-latest.tgz"
echo "4) After submission run:"
echo "   npm run validation:phase5-escalation:mark-submitted -- <ticket_id> <submitted_by> \"<follow_up_eta>\""
