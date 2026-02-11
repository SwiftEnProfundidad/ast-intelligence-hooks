#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
SUPPORT_BUNDLE="${OUT_DIR}/consumer-startup-failure-support-bundle.md"
BUNDLE_ARCHIVE="${OUT_DIR}/consumer-startup-escalation-bundle-latest.tgz"
DOC_HANDOFF="docs/validation/consumer-startup-escalation-handoff-latest.md"
DOC_ROLLOUT="docs/validation/phase8-external-rollout-pack.md"
DOC_TODO="docs/TODO.md"

require_file() {
  local file="$1"
  if [[ ! -f "${file}" ]]; then
    echo "[phase5-sync-docs] ERROR: missing file: ${file}" >&2
    exit 1
  fi
}

extract_metric() {
  local key="$1"
  local value
  value="$(sed -nE "s/^-[[:space:]]*${key}:[[:space:]]*([0-9]+).*/\1/p" "${SUPPORT_BUNDLE}" | head -n1)"
  if [[ -z "${value}" ]]; then
    echo "[phase5-sync-docs] ERROR: missing metric ${key} in ${SUPPORT_BUNDLE}" >&2
    exit 1
  fi
  printf '%s' "${value}"
}

require_file "${SUPPORT_BUNDLE}"
require_file "${BUNDLE_ARCHIVE}"
require_file "${DOC_HANDOFF}"
require_file "${DOC_ROLLOUT}"
require_file "${DOC_TODO}"

STARTUP_FAILURE_RUNS="$(extract_metric startup_failure_runs)"
STARTUP_STALLED_RUNS="$(extract_metric startup_stalled_runs)"
OLDEST_QUEUED_AGE="$(extract_metric oldest_queued_run_age_minutes)"

LATEST_RUN_URL="$(grep -Eo 'https://github\.com/[^ ]+/actions/runs/[0-9]+' "${SUPPORT_BUNDLE}" | head -n1 || true)"
RUN_URL_1="$(grep -Eo 'https://github\.com/[^ ]+/actions/runs/[0-9]+' "${SUPPORT_BUNDLE}" | sed -n '1p' || true)"
RUN_URL_2="$(grep -Eo 'https://github\.com/[^ ]+/actions/runs/[0-9]+' "${SUPPORT_BUNDLE}" | sed -n '2p' || true)"
RUN_URL_3="$(grep -Eo 'https://github\.com/[^ ]+/actions/runs/[0-9]+' "${SUPPORT_BUNDLE}" | sed -n '3p' || true)"
LATEST_RUN_ID="$(printf '%s' "${LATEST_RUN_URL}" | sed -E 's#.*/##')"

if [[ -z "${LATEST_RUN_URL}" || -z "${LATEST_RUN_ID}" ]]; then
  echo "[phase5-sync-docs] ERROR: could not extract latest run URL from ${SUPPORT_BUNDLE}" >&2
  exit 1
fi

BUNDLE_SIZE="$(du -h "${BUNDLE_ARCHIVE}" | awk '{print $1}')"
BUNDLE_SHA256="$(shasum -a 256 "${BUNDLE_ARCHIVE}" | awk '{print $1}')"
NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

export NOW_UTC STARTUP_FAILURE_RUNS STARTUP_STALLED_RUNS OLDEST_QUEUED_AGE BUNDLE_SIZE BUNDLE_SHA256 LATEST_RUN_URL LATEST_RUN_ID

perl -0pi -e 's/- generated_at: .*\n/"- generated_at: $ENV{NOW_UTC}\n"/e' "${DOC_HANDOFF}"
perl -0pi -e "s/- \`startup_failure_runs: [0-9]+\`/- \`startup_failure_runs: ${STARTUP_FAILURE_RUNS}\`/g" "${DOC_HANDOFF}"
perl -0pi -e "s/- \`startup_stalled_runs: [0-9]+\`/- \`startup_stalled_runs: ${STARTUP_STALLED_RUNS}\`/g" "${DOC_HANDOFF}"
perl -0pi -e "s/- \`oldest_queued_run_age_minutes: [0-9]+\`/- \`oldest_queued_run_age_minutes: ${OLDEST_QUEUED_AGE}\`/g" "${DOC_HANDOFF}"
perl -0pi -e "s/- size: \`[^\`]+\`/- size: \`${BUNDLE_SIZE}\`/g" "${DOC_HANDOFF}"
perl -0pi -e "s/- sha256: \`[0-9a-f]{64}\`/- sha256: \`${BUNDLE_SHA256}\`/g" "${DOC_HANDOFF}"
perl -0pi -e "s#- \`[0-9a-f]{64}  \\.audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest\\.tgz\`#- \`${BUNDLE_SHA256}  .audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz\`#g" "${DOC_HANDOFF}"
perl -0pi -e "s#- \`https://github\\.com/[^\`]+/actions/runs/[0-9]+\`#- \`${LATEST_RUN_URL}\`#" "${DOC_ROLLOUT}"
perl -0pi -e "s/- \`startup_failure_runs: [0-9]+\`/- \`startup_failure_runs: ${STARTUP_FAILURE_RUNS}\`/" "${DOC_ROLLOUT}"
perl -0pi -e "s/- \`startup_stalled_runs: [0-9]+\`/- \`startup_stalled_runs: ${STARTUP_STALLED_RUNS}\`/" "${DOC_ROLLOUT}"
perl -0pi -e "s/- \`oldest_queued_run_age_minutes: [0-9]+\`/- \`oldest_queued_run_age_minutes: ${OLDEST_QUEUED_AGE}\`/" "${DOC_ROLLOUT}"
perl -0pi -e "s/- \`startup_failure_runs: [0-9]+\`/- \`startup_failure_runs: ${STARTUP_FAILURE_RUNS}\`/" "${DOC_TODO}"
perl -0pi -e "s/- \`startup_stalled_runs: [0-9]+\`/- \`startup_stalled_runs: ${STARTUP_STALLED_RUNS}\`/" "${DOC_TODO}"
perl -0pi -e "s/- \`oldest_queued_run_age_minutes: [0-9]+\`/- \`oldest_queued_run_age_minutes: ${OLDEST_QUEUED_AGE}\`/" "${DOC_TODO}"
perl -0pi -e "s/- latest probe: \`[0-9]+\`/- latest probe: \`${LATEST_RUN_ID}\`/" "${DOC_TODO}"
perl -0pi -e "s/sha256: [0-9a-f]{64}/sha256: ${BUNDLE_SHA256}/" "${DOC_TODO}"

# Keep Support Ticket Payload and checklist values aligned to latest evidence.
awk \
  -v s1="${STARTUP_FAILURE_RUNS}" \
  -v s2="${STARTUP_STALLED_RUNS}" \
  -v s3="${OLDEST_QUEUED_AGE}" \
  -v u1="${RUN_URL_1}" \
  -v u2="${RUN_URL_2}" \
  -v u3="${RUN_URL_3}" \
  '
  BEGIN {
    in_payload=0;
    in_checklist_urls=0;
    url_count_payload=0;
    url_count_checklist=0;
  }
  /^## Support Ticket Payload \(Ready To Paste\)/ { in_payload=1 }
  in_payload && /^## Submission Tracking/ { in_payload=0 }

  in_payload && /- startup_failure_runs:/ { print "- startup_failure_runs: " s1; next }
  in_payload && /- startup_stalled_runs:/ { print "- startup_stalled_runs: " s2; next }
  in_payload && /- oldest_queued_run_age_minutes:/ { print "- oldest_queued_run_age_minutes: " s3; next }
  in_payload && /^- https:\/\/github\.com\/.*\/actions\/runs\/[0-9]+$/ {
    url_count_payload++;
    if (url_count_payload==1 && u1!="") { print "- " u1; next }
    if (url_count_payload==2 && u2!="") { print "- " u2; next }
    if (url_count_payload==3 && u3!="") { print "- " u3; next }
  }

  /^3\. Add latest run URLs \(minimum 2\) in the case body:/ { in_checklist_urls=1; print; next }
  in_checklist_urls && /^4\. After pressing submit, update `Submission Tracking` in this file:/ { in_checklist_urls=0; print; next }
  in_checklist_urls && /^   - `https:\/\/github\.com\/.*\/actions\/runs\/[0-9]+`$/ {
    url_count_checklist++;
    if (url_count_checklist==1 && u1!="") { print "   - `" u1 "`"; next }
    if (url_count_checklist==2 && u2!="") { print "   - `" u2 "`"; next }
  }

  { print }
  ' "${DOC_HANDOFF}" > "${DOC_HANDOFF}.tmp"
mv "${DOC_HANDOFF}.tmp" "${DOC_HANDOFF}"

echo "[phase5-sync-docs] out_dir=${OUT_DIR}"
echo "[phase5-sync-docs] startup_failure_runs=${STARTUP_FAILURE_RUNS}"
echo "[phase5-sync-docs] startup_stalled_runs=${STARTUP_STALLED_RUNS}"
echo "[phase5-sync-docs] oldest_queued_run_age_minutes=${OLDEST_QUEUED_AGE}"
echo "[phase5-sync-docs] latest_run=${LATEST_RUN_URL}"
echo "[phase5-sync-docs] bundle_sha256=${BUNDLE_SHA256}"
