#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
REPO="${2:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${3:-8}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"

BUNDLE_REPORT="${OUT_DIR}/consumer-startup-failure-support-bundle.md"
HANDOFF_DOC="docs/validation/consumer-startup-escalation-handoff-latest.md"

echo "[phase8-doctor] out_dir=${OUT_DIR}"

if [[ -f "scripts/check-phase8-loop-guard.sh" ]]; then
  if ! bash scripts/check-phase8-loop-guard.sh; then
    echo "[phase8-doctor] status=BLOCKED"
    echo "[phase8-doctor] blocked_by=loop_guard"
    echo "[phase8-doctor] next_action=manual follow-up post/reply tracking in ticket 4077449"
    exit 1
  fi
else
  echo "[phase8-doctor] warning: loop guard checker not found (scripts/check-phase8-loop-guard.sh)"
fi

if [[ ! -f "${BUNDLE_REPORT}" ]]; then
  echo "[phase8-doctor] missing report: ${BUNDLE_REPORT}" >&2
  exit 1
fi

if [[ ! -f "${HANDOFF_DOC}" ]]; then
  echo "[phase8-doctor] missing handoff doc: ${HANDOFF_DOC}" >&2
  exit 1
fi

STARTUP_FAILURE_RUNS="$(rg -n "^- startup_failure_runs:" "${BUNDLE_REPORT}" | head -n 1 | sed -E 's/^[0-9]+:- startup_failure_runs:[[:space:]]*//')"
STARTUP_STALLED_RUNS="$(rg -n "^- startup_stalled_runs:" "${BUNDLE_REPORT}" | head -n 1 | sed -E 's/^[0-9]+:- startup_stalled_runs:[[:space:]]*//')"
OLDEST_QUEUED_AGE="$(rg -n "^- oldest_queued_run_age_minutes:" "${BUNDLE_REPORT}" | head -n 1 | sed -E 's/^[0-9]+:- oldest_queued_run_age_minutes:[[:space:]]*//')"
LATEST_RUN_URL="$(rg -o 'https://github.com/[^[:space:]]+/actions/runs/[0-9]+' "${BUNDLE_REPORT}" | head -n 1 || true)"
KNOWN_CAUSE="$(rg -n "known_external_cause:" "${HANDOFF_DOC}" | head -n 1 | sed -E 's/^[0-9]+:[[:space:]]*//')"

[[ -z "${STARTUP_FAILURE_RUNS}" ]] && STARTUP_FAILURE_RUNS="<unknown>"
[[ -z "${STARTUP_STALLED_RUNS}" ]] && STARTUP_STALLED_RUNS="<unknown>"
[[ -z "${OLDEST_QUEUED_AGE}" ]] && OLDEST_QUEUED_AGE="<unknown>"
[[ -z "${LATEST_RUN_URL}" ]] && LATEST_RUN_URL="<missing>"
[[ -z "${KNOWN_CAUSE}" ]] && KNOWN_CAUSE="known_external_cause: <unknown>"

echo "[phase8-doctor] startup_failure_runs=${STARTUP_FAILURE_RUNS}"
echo "[phase8-doctor] startup_stalled_runs=${STARTUP_STALLED_RUNS}"
echo "[phase8-doctor] oldest_queued_run_age_minutes=${OLDEST_QUEUED_AGE}"
echo "[phase8-doctor] latest_run_url=${LATEST_RUN_URL}"
echo "[phase8-doctor] ${KNOWN_CAUSE}"

if npm run validation:phase5-latest:ready-check -- "${OUT_DIR}" >/tmp/phase8-doctor-ready.log 2>&1; then
  echo "[phase8-doctor] chain_status=READY"
  echo "[phase8-doctor] next_command=npm run validation:phase8:close-ready -- ${OUT_DIR}"
  exit 0
fi

echo "[phase8-doctor] chain_status=BLOCKED"
echo "[phase8-doctor] next_command=npm run validation:phase8:resume-after-billing -- ${REPO} ${LIMIT} ${OUT_DIR} ${MOCK_AB_REPORT}"
exit 1
