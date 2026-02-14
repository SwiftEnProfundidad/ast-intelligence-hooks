#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/fill-adapter-external-ide-replay-closeout.sh \
    <out_file> \
    <replay_executed_at_utc> \
    <operator> \
    <ide_client> \
    <action_id_or_prompt> \
    <trace_1> \
    <trace_2> \
    <trace_window_utc> \
    <adapter_session_status> \
    <adapter_real_session_report> \
    <adapter_readiness> \
    [seed_bundle] \
    [payload_doc] \
    [template_doc]

Example:
  bash scripts/fill-adapter-external-ide-replay-closeout.sh \
    .audit-reports/adapter/adapter-external-ide-replay-closeout-2026-02-14.md \
    2026-02-14T20:30:00Z \
    SwiftEnProfundidad \
    cursor \
    "replay-one-shot-001" \
    .audit_tmp/cascade-hook-runtime-pre.log \
    .audit_tmp/cascade-hook-runtime-post.log \
    "2026-02-14T20:29:40Z/2026-02-14T20:31:10Z" \
    PASS \
    PASS \
    READY
EOF
}

if [[ $# -lt 11 ]]; then
  usage >&2
  exit 1
fi

OUT_FILE="$1"
REPLAY_EXECUTED_AT_UTC="$2"
OPERATOR="$3"
IDE_CLIENT="$4"
ACTION_ID_OR_PROMPT="$5"
TRACE_1="$6"
TRACE_2="$7"
TRACE_WINDOW_UTC="$8"
ADAPTER_SESSION_STATUS="$9"
ADAPTER_REAL_SESSION_REPORT="${10}"
ADAPTER_READINESS="${11}"
SEED_BUNDLE="${12:-.audit-reports/adapter/adapter-external-ide-replay-seed-2026-02-14.tgz}"
PAYLOAD_DOC="${13:-.audit-reports/adapter/adapter-external-ide-replay-payload-2026-02-14.md}"
TEMPLATE_DOC="${14:-.audit-reports/adapter/adapter-external-ide-replay-closeout-template-2026-02-14.md}"

mkdir -p "$(dirname "${OUT_FILE}")"

cat >"${OUT_FILE}" <<EOF
# Adapter External IDE Replay Closeout

## Scope
Close \`P8-5b2b2\` with one real IDE-originated replay evidence set.

## Replay Session Metadata
- replay_executed_at_utc: \`${REPLAY_EXECUTED_AT_UTC}\`
- operator: \`${OPERATOR}\`
- ide_client: \`${IDE_CLIENT}\`
- action_id_or_prompt: \`${ACTION_ID_OR_PROMPT}\`

## Captured Runtime Traces
- trace_1: \`${TRACE_1}\`
- trace_2: \`${TRACE_2}\`
- trace_window_utc: \`${TRACE_WINDOW_UTC}\`

## Adapter Reports (post-replay)
- adapter_session_status: \`${ADAPTER_SESSION_STATUS}\`
- adapter_real_session_report: \`${ADAPTER_REAL_SESSION_REPORT}\`
- adapter_readiness: \`${ADAPTER_READINESS}\`

## Evidence Links
- seed_bundle: \`${SEED_BUNDLE}\`
- payload_doc: \`${PAYLOAD_DOC}\`
- template_doc: \`${TEMPLATE_DOC}\`
EOF

echo "[adapter-replay-closeout] out_file=${OUT_FILE}"
shasum -a 256 "${OUT_FILE}"
