#!/usr/bin/env bash
set -euo pipefail

HANDOFF_FILE="${1:-docs/validation/consumer-startup-escalation-handoff-latest.md}"
NOW_UTC="${2:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"

if [[ ! -f "${HANDOFF_FILE}" ]]; then
  echo "[phase8-loop-guard] missing handoff file: ${HANDOFF_FILE}" >&2
  exit 2
fi

extract_field() {
  local key="$1"
  local value
  value="$(
    rg -n "^- ${key}:" "${HANDOFF_FILE}" \
      | head -n 1 \
      | sed -E "s/^[0-9]+:- ${key}:[[:space:]]*//; s/\`//g; s/\r//g" \
      | xargs || true
  )"
  echo "${value}"
}

GUARD_STARTED_AT="$(extract_field "loop_guard_started_at_utc")"
GUARD_NOT_BEFORE="$(extract_field "loop_guard_next_refresh_not_before_utc")"
GUARD_OVERRIDE_CONDITION="$(extract_field "loop_guard_override_condition")"
FOLLOW_UP_STATE="$(extract_field "follow_up_state")"
SUPPORT_REPLY_RECEIVED_AT_UTC="$(extract_field "support_reply_received_at_utc")"

if [[ -z "${GUARD_NOT_BEFORE}" ]]; then
  echo "[phase8-loop-guard] no guard window configured; refresh allowed"
  exit 0
fi

if [[ "${FOLLOW_UP_STATE}" == "SUPPORT_REPLIED" ]]; then
  echo "[phase8-loop-guard] support reply state detected in handoff"
  echo "[phase8-loop-guard] follow_up_state=${FOLLOW_UP_STATE}"
  echo "[phase8-loop-guard] support_reply_received_at_utc=${SUPPORT_REPLY_RECEIVED_AT_UTC:-<unset>}"
  echo "[phase8-loop-guard] refresh allowed"
  exit 0
fi

if [[ "${PHASE8_LOOP_GUARD_OVERRIDE:-0}" == "1" ]]; then
  echo "[phase8-loop-guard] override enabled via PHASE8_LOOP_GUARD_OVERRIDE=1"
  echo "[phase8-loop-guard] override_condition=${GUARD_OVERRIDE_CONDITION:-<unset>}"
  echo "[phase8-loop-guard] refresh allowed"
  exit 0
fi

COMPARE_RESULT="$(
  node -e '
    const now = Date.parse(process.argv[1]);
    const notBefore = Date.parse(process.argv[2]);
    if (Number.isNaN(now) || Number.isNaN(notBefore)) {
      process.stdout.write("INVALID");
      process.exit(0);
    }
    process.stdout.write(now >= notBefore ? "ALLOW" : "BLOCK");
  ' "${NOW_UTC}" "${GUARD_NOT_BEFORE}"
)"

if [[ "${COMPARE_RESULT}" == "INVALID" ]]; then
  echo "[phase8-loop-guard] invalid timestamp format" >&2
  echo "[phase8-loop-guard] now_utc=${NOW_UTC}" >&2
  echo "[phase8-loop-guard] guard_next_refresh_not_before_utc=${GUARD_NOT_BEFORE}" >&2
  exit 2
fi

echo "[phase8-loop-guard] now_utc=${NOW_UTC}"
echo "[phase8-loop-guard] guard_started_at_utc=${GUARD_STARTED_AT:-<unset>}"
echo "[phase8-loop-guard] guard_next_refresh_not_before_utc=${GUARD_NOT_BEFORE}"

if [[ "${COMPARE_RESULT}" == "ALLOW" ]]; then
  echo "[phase8-loop-guard] refresh allowed"
  exit 0
fi

echo "[phase8-loop-guard] refresh blocked by loop guard"
echo "[phase8-loop-guard] override_condition=${GUARD_OVERRIDE_CONDITION:-<unset>}"
echo "[phase8-loop-guard] if support replied already, rerun with PHASE8_LOOP_GUARD_OVERRIDE=1"
exit 1
