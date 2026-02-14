#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/prepare-adapter-external-ide-replay-closeout-auto.sh \
    <out_file> \
    <replay_executed_at_utc> \
    <operator> \
    <ide_client> \
    <action_id_or_prompt> \
    [trace_window_utc]

Example:
  bash scripts/prepare-adapter-external-ide-replay-closeout-auto.sh \
    .audit-reports/adapter/adapter-external-ide-replay-closeout-2026-02-14.md \
    2026-02-14T20:30:00Z \
    SwiftEnProfundidad \
    cursor \
    replay-one-shot-001
EOF
}

if [[ $# -lt 5 ]]; then
  usage >&2
  exit 1
fi

OUT_FILE="$1"
REPLAY_EXECUTED_AT_UTC="$2"
OPERATOR="$3"
IDE_CLIENT="$4"
ACTION_ID_OR_PROMPT="$5"
TRACE_WINDOW_UTC="${6:-N/A}"

SESSION_REPORT=".audit-reports/adapter/adapter-session-status.md"
REAL_REPORT=".audit-reports/adapter/adapter-real-session-report.md"
READINESS_REPORT=".audit-reports/adapter/adapter-readiness.md"

TRACE_1="$(ls -1t .audit_tmp/cascade-hook-runtime-*.log 2>/dev/null | sed -n '1p' || true)"
TRACE_2="$(ls -1t .audit_tmp/cascade-hook-runtime-*.log 2>/dev/null | sed -n '2p' || true)"

[[ -z "${TRACE_1}" ]] && TRACE_1="N/A"
[[ -z "${TRACE_2}" ]] && TRACE_2="N/A"

if [[ "${TRACE_WINDOW_UTC}" == "N/A" && "${TRACE_1}" != "N/A" ]]; then
  TRACE_WINDOW_UTC="${REPLAY_EXECUTED_AT_UTC} (around captured traces)"
fi

extract_pass_fail() {
  local file="$1"
  local pass_pattern="$2"
  local fail_pattern="$3"
  if [[ -f "${file}" ]] && rg -q "${pass_pattern}" "${file}"; then
    echo "PASS"
    return 0
  fi
  if [[ -f "${file}" ]] && rg -q "${fail_pattern}" "${file}"; then
    echo "FAIL"
    return 0
  fi
  echo "UNKNOWN"
}

ADAPTER_SESSION_STATUS="$(
  extract_pass_fail \
    "${SESSION_REPORT}" \
    'verdict:[[:space:]]*PASS|session-assessment=PASS|validation_result:[[:space:]]*PASS' \
    'verdict:[[:space:]]*FAIL|session-assessment=FAIL|validation_result:[[:space:]]*FAIL'
)"

ADAPTER_REAL_SESSION_REPORT="$(
  extract_pass_fail \
    "${REAL_REPORT}" \
    'verdict:[[:space:]]*PASS|Validation result:[[:space:]]*PASS|validation_result:[[:space:]]*PASS' \
    'verdict:[[:space:]]*FAIL|Validation result:[[:space:]]*FAIL|validation_result:[[:space:]]*FAIL'
)"

ADAPTER_READINESS="$(
  if [[ -f "${READINESS_REPORT}" ]]; then
    rg -o 'verdict:[[:space:]]*(READY|BLOCKED|PENDING)' "${READINESS_REPORT}" \
      | head -n 1 \
      | sed -E 's/^verdict:[[:space:]]*//' || true
  fi
)"
[[ -z "${ADAPTER_READINESS}" ]] && ADAPTER_READINESS="UNKNOWN"

bash scripts/fill-adapter-external-ide-replay-closeout.sh \
  "${OUT_FILE}" \
  "${REPLAY_EXECUTED_AT_UTC}" \
  "${OPERATOR}" \
  "${IDE_CLIENT}" \
  "${ACTION_ID_OR_PROMPT}" \
  "${TRACE_1}" \
  "${TRACE_2}" \
  "${TRACE_WINDOW_UTC}" \
  "${ADAPTER_SESSION_STATUS}" \
  "${ADAPTER_REAL_SESSION_REPORT}" \
  "${ADAPTER_READINESS}"
