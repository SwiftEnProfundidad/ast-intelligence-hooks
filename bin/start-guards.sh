#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Start Guards - Realtime notifications and token monitor
# ═══════════════════════════════════════════════════════════════
# Uso: start-guards.sh start|stop|status|restart
# ─ start:   arranca watch-hooks y el monitor de tokens en background
# ─ stop:    detiene los procesos y limpia los pid files
# ─ status:  muestra estado actual
# ─ restart: stop + start
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# Load environment defaults
GUARD_ENV_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/guard-env.sh"
if [[ ! -f "$GUARD_ENV_SCRIPT" ]]; then
  GUARD_ENV_SCRIPT="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/bin/guard-env.sh"
fi
if [[ ! -f "$GUARD_ENV_SCRIPT" ]]; then
  GUARD_ENV_SCRIPT="$REPO_ROOT/bin/guard-env.sh"
fi
if [[ -f "$GUARD_ENV_SCRIPT" ]]; then
  source "$GUARD_ENV_SCRIPT"
fi

REALTIME_PID_FILE="$REPO_ROOT/.realtime-guard.pid"
REALTIME_LOG="$REPO_ROOT/.audit-reports/watch-hooks.log"

GUARD_SUPERVISOR="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/bin/guard-supervisor.js"
if [[ ! -f "$GUARD_SUPERVISOR" ]]; then
  GUARD_SUPERVISOR="$REPO_ROOT/bin/guard-supervisor.js"
fi
REALTIME_CMD="node $GUARD_SUPERVISOR"

TOKEN_PID_FILE="$REPO_ROOT/.token-monitor-guard.pid"
TOKEN_LOG="$REPO_ROOT/.audit-reports/token-monitor-loop.log"

TOKEN_LOOP="$REPO_ROOT/node_modules/@pumuki/ast-intelligence-hooks/infrastructure/watchdog/token-monitor-loop.sh"
if [[ ! -f "$TOKEN_LOOP" ]]; then
  TOKEN_LOOP="$REPO_ROOT/infrastructure/watchdog/token-monitor-loop.sh"
fi
TOKEN_CMD="bash $TOKEN_LOOP"

mkdir -p "$REPO_ROOT/.audit-reports"
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"

needs_evidence_refresh() {
  if [[ ! -f "$EVIDENCE_FILE" ]]; then
    return 0
  fi

  if ! command -v jq >/dev/null 2>&1; then
    return 0
  fi

  local answered
  answered=$(jq -r '.protocol_3_questions.answered // "false"' "$EVIDENCE_FILE" 2>/dev/null)
  if [[ "$answered" != "true" ]]; then
    return 0
  fi

  if jq -r '.protocol_3_questions | to_entries[] | .value' "$EVIDENCE_FILE" 2>/dev/null | grep -q "TODO"; then
    return 0
  fi

  local timestamp
  timestamp=$(jq -r '.timestamp // empty' "$EVIDENCE_FILE" 2>/dev/null)
  if [[ -z "$timestamp" ]]; then
    return 0
  fi

  local diff
  diff=$(python3 - <<PY
import sys
from datetime import datetime, timezone

ts = "$timestamp"

try:
    dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    now_utc = datetime.now(timezone.utc)
    diff = now_utc - dt
    print(int(diff.total_seconds()))
except Exception:
    print(999999)
PY
)
  if [[ -z "$diff" ]]; then
    return 0
  fi

  if (( diff > 600 )); then
    return 0
  fi

  return 1
}

ensure_evidence_refresh() {
  if needs_evidence_refresh; then
    echo "⚙️  Refreshing .AI_EVIDENCE.json before starting guards..."
    CURRENT_BRANCH=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo "manual-update")
    BRANCH_LOWER=$(echo "$CURRENT_BRANCH" | tr '[:upper:]' '[:lower:]')

    PLATFORMS="backend"

    if [[ "$BRANCH_LOWER" == *"frontend"* || "$BRANCH_LOWER" == *"web"* ]]; then
      PLATFORMS="frontend"
    elif [[ "$BRANCH_LOWER" == *"ios"* || "$BRANCH_LOWER" == *"swift"* ]]; then
      PLATFORMS="ios"
    elif [[ "$BRANCH_LOWER" == *"android"* || "$BRANCH_LOWER" == *"kotlin"* ]]; then
      PLATFORMS="android"
    fi

    bash "$REPO_ROOT/scripts/hooks-system/bin/update-evidence.sh" --auto --platforms "$PLATFORMS" "$CURRENT_BRANCH"
  fi
}

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid=$(cat "$pid_file" 2>/dev/null || echo "")
  [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1
}

start_process() {
  local pid_file="$1"
  local command="$2"
  local log_file="$3"

  if is_running "$pid_file"; then
    echo "Already running ($(cat "$pid_file")) -> $command"
    return 0
  fi

  nohup bash -c "$command" >> "$log_file" 2>&1 &
  local pid=$!
  echo "$pid" > "$pid_file"
  echo "Started ($pid) -> $command"
}

stop_process() {
  local pid_file="$1"
  if ! is_running "$pid_file"; then
    [[ -f "$pid_file" ]] && rm -f "$pid_file"
    return 0
  fi
  local pid
  pid=$(cat "$pid_file")
  kill "$pid" 2>/dev/null || true
  rm -f "$pid_file"
  echo "Stopped process $pid"
}

status_process() {
  local name="$1"
  local pid_file="$2"
  if is_running "$pid_file"; then
    echo "[$name] running (PID $(cat "$pid_file"))"
  else
    echo "[$name] stopped"
  fi
}

case "${1:-status}" in
  start)
    ensure_evidence_refresh
    start_process "$REALTIME_PID_FILE" "$REALTIME_CMD" "$REALTIME_LOG"
    start_process "$TOKEN_PID_FILE" "$TOKEN_CMD" "$TOKEN_LOG"
    ;;
  stop)
    stop_process "$REALTIME_PID_FILE"
    stop_process "$TOKEN_PID_FILE"
    ;;
  status)
    status_process "realtime-guard" "$REALTIME_PID_FILE"
    status_process "token-monitor" "$TOKEN_PID_FILE"
    ;;
  restart)
    "$0" stop
    "$0" start
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
