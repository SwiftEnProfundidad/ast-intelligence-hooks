#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-docs/tracking/historico-validacion-ruralgo-03-03-2026.md}"

if [[ ! -f "${FILE}" ]]; then
  echo "[progress-single-active] missing file: ${FILE}" >&2
  exit 1
fi

ACTIVE_PATTERN="^- 🚧 \`P[0-9A-Za-z.-]+\` "
ACTIVE_COUNT="$(rg -n "${ACTIVE_PATTERN}" "${FILE}" | wc -l | tr -d ' ')"

echo "[progress-single-active] file=${FILE}"
echo "[progress-single-active] in_progress_count=${ACTIVE_COUNT}"

if [[ "${ACTIVE_COUNT}" -eq 1 ]]; then
  echo "[progress-single-active] OK: exactly one in-progress task."
  exit 0
fi

echo "[progress-single-active] ERROR: expected exactly 1 in-progress task (🚧), found ${ACTIVE_COUNT}." >&2
echo "[progress-single-active] current in-progress entries:" >&2
rg -n "${ACTIVE_PATTERN}" "${FILE}" >&2 || true
exit 1
