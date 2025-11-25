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

REALTIME_PID_FILE="$REPO_ROOT/.realtime-guard.pid"
REALTIME_LOG="$REPO_ROOT/.audit-reports/watch-hooks.log"
REALTIME_CMD="node $REPO_ROOT/scripts/hooks-system/bin/watch-hooks.js"

TOKEN_PID_FILE="$REPO_ROOT/.token-monitor-guard.pid"
TOKEN_LOG="$REPO_ROOT/.audit-reports/token-monitor-loop.log"
TOKEN_CMD="bash $REPO_ROOT/scripts/hooks-system/infrastructure/watchdog/token-monitor-loop.sh"

mkdir -p "$REPO_ROOT/.audit-reports"

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
