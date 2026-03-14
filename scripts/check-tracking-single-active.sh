#!/usr/bin/env bash
set -euo pipefail

MASTER_FILE="PUMUKI-RESET-MASTER-PLAN.md"

resolve_default_tracking_file() {
  if [[ -f "${MASTER_FILE}" ]]; then
    printf '%s\n' "${MASTER_FILE}"
    return 0
  fi

  echo "[tracking-single-active] missing master file: ${MASTER_FILE}" >&2
  exit 1
}

if [[ "$#" -gt 0 ]]; then
  FILES=("$@")
else
  FILES=(
    "$(resolve_default_tracking_file)"
  )
fi

HAS_ERROR=0

for FILE in "${FILES[@]}"; do
  if [[ ! -f "${FILE}" ]]; then
    echo "[tracking-single-active] missing file: ${FILE}" >&2
    HAS_ERROR=1
    continue
  fi

  if [[ "${FILE}" == "PUMUKI-RESET-MASTER-PLAN.md" ]]; then
    ACTIVE_PATTERN='^- Estado: 🚧'
  else
    ACTIVE_PATTERN='^- 🚧 (`?P[0-9A-Za-z.-]+`?)'
  fi

  ACTIVE_COUNT="$(rg -n "${ACTIVE_PATTERN}" "${FILE}" | wc -l | tr -d ' ')"
  echo "[tracking-single-active] file=${FILE}"
  echo "[tracking-single-active] in_progress_count=${ACTIVE_COUNT}"

  if [[ "${ACTIVE_COUNT}" -ne 1 ]]; then
    echo "[tracking-single-active] ERROR: expected exactly 1 in-progress task/phase (🚧), found ${ACTIVE_COUNT}." >&2
    echo "[tracking-single-active] current in-progress entries:" >&2
    rg -n "${ACTIVE_PATTERN}" "${FILE}" >&2 || true
    HAS_ERROR=1
  fi
done

if [[ "${HAS_ERROR}" -ne 0 ]]; then
  exit 1
fi

echo "[tracking-single-active] OK: exactly one in-progress task in active tracking file(s)."

node --import tsx scripts/check-self-worktree-hygiene.ts
