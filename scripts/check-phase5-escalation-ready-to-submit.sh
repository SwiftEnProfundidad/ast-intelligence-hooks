#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
HANDOFF_FILE="docs/validation/consumer-startup-escalation-handoff-latest.md"
PAYLOAD_FILE="${OUT_DIR}/github-support-portal-payload.txt"
BUNDLE_FILE="${OUT_DIR}/consumer-startup-escalation-bundle-latest.tgz"

if [[ ! -f "${HANDOFF_FILE}" ]]; then
  echo "[phase5-escalation-ready] missing handoff file: ${HANDOFF_FILE}" >&2
  exit 1
fi

for file in \
  "${OUT_DIR}/consumer-ci-auth-check.md" \
  "${OUT_DIR}/consumer-startup-failure-support-bundle.md" \
  "${OUT_DIR}/consumer-startup-unblock-status.md" \
  "${OUT_DIR}/consumer-support-ticket-draft.md" \
  "${OUT_DIR}/phase5-external-handoff.md" \
  "${BUNDLE_FILE}"
do
  if [[ ! -f "${file}" ]]; then
    echo "[phase5-escalation-ready] missing required artifact: ${file}" >&2
    exit 1
  fi
done

read_handoff_value() {
  local key="$1"
  grep -E "^- ${key}:" "${HANDOFF_FILE}" | head -n1 | sed -E "s/^- ${key}:\\s*//; s/\`//g; s/\r//g" | xargs
}

SUBMISSION_READINESS="$(read_handoff_value "submission_readiness")"
PRE_SUBMISSION_VERIFICATION="$(read_handoff_value "pre_submission_verification")"
EXPECTED_CHECKSUM="$(awk '/Expected:/{flag=1;next} flag && /consumer-startup-escalation-bundle-latest\.tgz/ { print; exit }' "${HANDOFF_FILE}" | grep -Eo '[0-9a-f]{64}' | head -n1 || true)"
ACTUAL_CHECKSUM="$(shasum -a 256 "${BUNDLE_FILE}" | awk '{print $1}')"

if [[ -z "${EXPECTED_CHECKSUM}" ]]; then
  echo "[phase5-escalation-ready] expected checksum not found in handoff" >&2
  exit 1
fi

if [[ "${SUBMISSION_READINESS}" != "READY_TO_SUBMIT" ]]; then
  echo "[phase5-escalation-ready] submission_readiness is not READY_TO_SUBMIT: ${SUBMISSION_READINESS:-<empty>}" >&2
  exit 1
fi

if [[ "${PRE_SUBMISSION_VERIFICATION}" != "PASS" ]]; then
  echo "[phase5-escalation-ready] pre_submission_verification is not PASS: ${PRE_SUBMISSION_VERIFICATION:-<empty>}" >&2
  exit 1
fi

if [[ "${EXPECTED_CHECKSUM}" != "${ACTUAL_CHECKSUM}" ]]; then
  echo "[phase5-escalation-ready] checksum mismatch" >&2
  echo "[phase5-escalation-ready] expected=${EXPECTED_CHECKSUM}" >&2
  echo "[phase5-escalation-ready] actual=${ACTUAL_CHECKSUM}" >&2
  exit 1
fi

if [[ ! -f "${PAYLOAD_FILE}" ]]; then
  echo "[phase5-escalation-ready] payload file missing; generating now"
  bash scripts/build-phase5-support-portal-payload.sh "${OUT_DIR}"
fi

if grep -q "\[MISSING\]" "${PAYLOAD_FILE}"; then
  echo "[phase5-escalation-ready] payload checklist contains missing attachments" >&2
  exit 1
fi

echo "[phase5-escalation-ready] submission_readiness=${SUBMISSION_READINESS}"
echo "[phase5-escalation-ready] pre_submission_verification=${PRE_SUBMISSION_VERIFICATION}"
echo "[phase5-escalation-ready] checksum=${ACTUAL_CHECKSUM}"
echo "[phase5-escalation-ready] payload=${PAYLOAD_FILE}"
echo "[phase5-escalation-ready] READY TO SUBMIT"
