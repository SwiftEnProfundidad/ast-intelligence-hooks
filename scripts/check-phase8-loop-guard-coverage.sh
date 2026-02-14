#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
GUARD_REF="scripts/check-phase8-loop-guard.sh"

REQUIRED_FILES=(
  "scripts/refresh-phase5-latest-escalation.sh"
  "scripts/run-phase5-post-support-refresh.sh"
  "scripts/run-phase8-tick.sh"
  "scripts/run-phase8-autopilot.sh"
  "scripts/run-phase8-after-billing-reactivation.sh"
  "scripts/run-phase8-next-step.sh"
  "scripts/run-phase8-status-pack.sh"
  "scripts/run-phase8-doctor.sh"
)

echo "[phase8-loop-guard-coverage] root=${ROOT}"
echo "[phase8-loop-guard-coverage] guard_ref=${GUARD_REF}"

MISSING=0

for file in "${REQUIRED_FILES[@]}"; do
  target="${ROOT}/${file}"
  if [[ ! -f "${target}" ]]; then
    echo "[phase8-loop-guard-coverage] MISSING_FILE ${file}" >&2
    MISSING=1
    continue
  fi

  if rg -q "${GUARD_REF}" "${target}"; then
    echo "[phase8-loop-guard-coverage] COVERED ${file}"
  else
    echo "[phase8-loop-guard-coverage] MISSING_GUARD ${file}" >&2
    MISSING=1
  fi
done

if [[ "${MISSING}" -ne 0 ]]; then
  echo "[phase8-loop-guard-coverage] FAILED" >&2
  exit 1
fi

echo "[phase8-loop-guard-coverage] PASS"
