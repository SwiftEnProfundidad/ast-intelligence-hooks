#!/usr/bin/env bash
set -u

REPO="${1:-SwiftEnProfundidad/pumuki-actions-healthcheck-temp}"
LIMIT="${2:-8}"
OUT_DIR="${3:-.audit-reports/phase5-latest}"
MOCK_AB_REPORT="${4:-.audit-reports/phase5/mock-consumer-ab-report.md}"
BUNDLE_PATH="${OUT_DIR}/consumer-startup-escalation-bundle-latest.tgz"

echo "[phase5-latest-refresh] repo=${REPO} limit=${LIMIT} out_dir=${OUT_DIR}"

if [[ -f "scripts/check-phase8-loop-guard.sh" ]]; then
  if ! bash scripts/check-phase8-loop-guard.sh; then
    echo "[phase5-latest-refresh] blocked by loop guard; skipping refresh"
    echo "[phase5-latest-refresh] next_action=manual follow-up post/reply tracking in ticket 4077449"
    echo "[phase5-latest-refresh] override_if_support_replied=PHASE8_LOOP_GUARD_OVERRIDE=1 npm run validation:phase5-latest:refresh -- ${REPO} ${LIMIT} ${OUT_DIR} ${MOCK_AB_REPORT}"
    exit 1
  fi
else
  echo "[phase5-latest-refresh] warning: loop guard checker not found (scripts/check-phase8-loop-guard.sh)"
fi

if ! gh workflow run health.yml --repo "${REPO}"; then
  echo "[phase5-latest-refresh] ERROR: failed to trigger workflow_dispatch probe" >&2
  exit 1
fi

echo "[phase5-latest-refresh] probe dispatched"

npx --yes tsx@4.21.0 scripts/run-phase5-execution-closure.ts \
  --repo "${REPO}" \
  --limit "${LIMIT}" \
  --out-dir "${OUT_DIR}" \
  --skip-adapter \
  --skip-workflow-lint
CLOSURE_EXIT=$?

RUN_URL_1="$(gh run list --repo "${REPO}" --limit 2 --json url --jq '.[0].url // ""')"
RUN_URL_2="$(gh run list --repo "${REPO}" --limit 2 --json url --jq '.[1].url // ""')"

HANDOFF_CMD=(
  npx --yes tsx@4.21.0 scripts/build-phase5-external-handoff.ts
  --repo "${REPO}"
  --phase5-status-report "${OUT_DIR}/phase5-execution-closure-status.md"
  --phase5-blockers-report "${OUT_DIR}/phase5-blockers-readiness.md"
  --consumer-unblock-report "${OUT_DIR}/consumer-startup-unblock-status.md"
  --mock-ab-report "${MOCK_AB_REPORT}"
  --run-report "${OUT_DIR}/phase5-execution-closure-run-report.md"
  --out "${OUT_DIR}/phase5-external-handoff.md"
)

if [[ -n "${RUN_URL_1}" ]]; then
  HANDOFF_CMD+=(--artifact-url "${RUN_URL_1}")
fi
if [[ -n "${RUN_URL_2}" ]]; then
  HANDOFF_CMD+=(--artifact-url "${RUN_URL_2}")
fi

"${HANDOFF_CMD[@]}"
HANDOFF_EXIT=$?

tar -czf "${BUNDLE_PATH}" -C "$(pwd)" \
  "${OUT_DIR}/consumer-ci-auth-check.md" \
  "${OUT_DIR}/consumer-ci-artifacts-report.md" \
  "${OUT_DIR}/consumer-startup-failure-support-bundle.md" \
  "${OUT_DIR}/consumer-startup-unblock-status.md" \
  "${OUT_DIR}/consumer-startup-triage-report.md" \
  "${OUT_DIR}/consumer-support-ticket-draft.md" \
  "${OUT_DIR}/phase5-blockers-readiness.md" \
  "${OUT_DIR}/phase5-execution-closure-status.md" \
  "${OUT_DIR}/phase5-execution-closure-run-report.md" \
  "${OUT_DIR}/phase5-external-handoff.md" \
  "docs/validation/consumer-startup-escalation-handoff-latest.md" \
  "docs/validation/github-support-ticket-template-startup-failure.md"

if ! CHECKSUM_LINE="$(shasum -a 256 "${BUNDLE_PATH}")"; then
  echo "[phase5-latest-refresh] ERROR: failed to compute bundle checksum" >&2
  exit 1
fi

echo "[phase5-latest-refresh] closure_exit=${CLOSURE_EXIT} handoff_exit=${HANDOFF_EXIT}"
echo "[phase5-latest-refresh] run_url_1=${RUN_URL_1:-<missing>}"
echo "[phase5-latest-refresh] run_url_2=${RUN_URL_2:-<missing>}"
echo "[phase5-latest-refresh] bundle_checksum=${CHECKSUM_LINE}"

if ! bash scripts/sync-phase5-latest-docs.sh "${OUT_DIR}"; then
  echo "[phase5-latest-refresh] WARN: docs sync failed" >&2
fi

if [[ "${CLOSURE_EXIT}" -eq 0 && "${HANDOFF_EXIT}" -eq 0 ]]; then
  exit 0
fi

exit 1
