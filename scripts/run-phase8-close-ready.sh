#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
PACKAGE_PATH="${OUT_DIR}/phase8-ready-handoff-package.tgz"

echo "[phase8-close-ready] out_dir=${OUT_DIR}"

if ! npm run validation:phase8:ready-handoff -- "${OUT_DIR}"; then
  echo "[phase8-close-ready] chain is not READY; close-ready package not generated" >&2
  exit 1
fi

SUMMARY_PATH="${OUT_DIR}/phase8-ready-handoff-summary.md"
BLOCKERS_PATH="${OUT_DIR}/phase5-blockers-readiness.md"
STATUS_PATH="${OUT_DIR}/phase5-execution-closure-status.md"
HANDOFF_PATH="${OUT_DIR}/phase5-external-handoff.md"
UNBLOCK_PATH="${OUT_DIR}/consumer-startup-unblock-status.md"

for required in "${SUMMARY_PATH}" "${BLOCKERS_PATH}" "${STATUS_PATH}" "${HANDOFF_PATH}" "${UNBLOCK_PATH}"; do
  if [[ ! -f "${required}" ]]; then
    echo "[phase8-close-ready] missing required file: ${required}" >&2
    exit 1
  fi
done

tar -czf "${PACKAGE_PATH}" -C "$(pwd)" \
  "${SUMMARY_PATH}" \
  "${BLOCKERS_PATH}" \
  "${STATUS_PATH}" \
  "${HANDOFF_PATH}" \
  "${UNBLOCK_PATH}"

CHECKSUM_LINE="$(shasum -a 256 "${PACKAGE_PATH}")"

echo "[phase8-close-ready] package=${PACKAGE_PATH}"
echo "[phase8-close-ready] checksum=${CHECKSUM_LINE}"
echo "[phase8-close-ready] next step: attach package and run URLs in final external handoff update."
