#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Guard AutoStart Controller
# ═══════════════════════════════════════════════════════════════
# Uso:
#   guard-autostart.sh enable   → Inicia el auto manager si no está corriendo
#   guard-autostart.sh disable  → Detiene el auto manager y los guardianes
#   guard-autostart.sh status   → Muestra estado actual
#   guard-autostart.sh restart  → disable + enable
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
TMP_DIR="$REPO_ROOT/.audit_tmp"
REPORTS_DIR="$REPO_ROOT/.audit-reports"
PID_FILE="$REPO_ROOT/.guard-auto-manager.pid"
LOCK_DIR="$TMP_DIR/guard-auto-manager.lock"
LOG_FILE="$REPORTS_DIR/guard-auto-manager.log"
MANAGER_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/guard-auto-manager.js"
START_GUARDS="$REPO_ROOT/scripts/hooks-system/bin/start-guards.sh"
EVENT_LOG="$REPO_ROOT/.audit_tmp/guard-events.log"

mkdir -p "$TMP_DIR"
mkdir -p "$REPORTS_DIR"
touch "$EVENT_LOG"
source "$REPO_ROOT/scripts/hooks-system/bin/guard-env.sh" 2>/dev/null || true
cd "$REPO_ROOT"

is_manager_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi
  local pid
  pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
  if [[ -z "$pid" ]]; then
    return 1
  fi
  if kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  return 1
}

clean_stale_state() {
  rm -f "$PID_FILE"
  rm -rf "$LOCK_DIR"
}

cleanup_artifacts() {
  rm -rf "$REPO_ROOT/.audit_tmp/token-monitor-loop.lock"
  rm -f "$REPO_ROOT/.audit_tmp/token-monitor-loop.pid"
  rm -rf "$REPO_ROOT/.audit_tmp/guard-supervisor.lock"
}

ensure_guardians_running() {
  if [[ ! -x "$START_GUARDS" ]]; then
    return
  fi
  local status
  status=$("$START_GUARDS" status 2>/dev/null || echo "")
  if ! grep -q "running" <<<"$status"; then
    "$START_GUARDS" start >/dev/null 2>&1 || true
    "$START_GUARDS" status || true
    print_guard_event "Guard supervisor relanzado automáticamente."
  else
    print_guard_event "Guard supervisor operativo."
  fi
}

print_guard_event() {
  if [[ ! -f "$EVENT_LOG" ]]; then
    return
  fi
  local event_line
  event_line=$(tail -n 1 "$EVENT_LOG" 2>/dev/null || true)
  if [[ -n "$event_line" ]]; then
    echo "[$(date '+%H:%M:%S')] Guard event → $event_line"
  elif [[ -n "${1:-}" ]]; then
    echo "[$(date '+%H:%M:%S')] Guard event → ${1}"
  fi
}

start_manager() {
  if [[ ! -x "$MANAGER_SCRIPT" ]]; then
    echo "Guard auto manager not found: $MANAGER_SCRIPT" >&2
    exit 1
  fi
  if is_manager_running; then
    echo "Guard auto manager already running (PID $(cat "$PID_FILE"))"
    return 0
  fi
  clean_stale_state
  nohup node "$MANAGER_SCRIPT" >> "$LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  disown "$pid" || true
  echo "Guard auto manager started (PID $pid)"
}

stop_manager() {
  if ! is_manager_running; then
    clean_stale_state
    echo "Guard auto manager already stopped"
    return 0
  fi
  local pid
  pid=$(cat "$PID_FILE")
  kill "$pid" 2>/dev/null || true
  local waited=0
  while kill -0 "$pid" 2>/dev/null; do
    sleep 0.5
    waited=$((waited + 1))
    if (( waited > 40 )); then
      kill -9 "$pid" 2>/dev/null || true
      break
    fi
  done
  clean_stale_state
  echo "Guard auto manager stopped"
}

status_manager() {
  if is_manager_running; then
    echo "[guard-autostart] running (PID $(cat "$PID_FILE"))"
  else
    echo "[guard-autostart] stopped"
  fi
  if [[ -s "$LOG_FILE" ]]; then
    echo "Log → $LOG_FILE"
  fi
  print_guard_event
}

case "${1:-status}" in
  enable)
    start_manager
    ensure_guardians_running
    ;;
  disable)
    stop_manager
    if [[ -x "$START_GUARDS" ]]; then
      "$START_GUARDS" stop >/dev/null 2>&1 || true
    fi
    cleanup_artifacts
    ;;
  status)
    status_manager
    ;;
  restart)
    stop_manager
    start_manager
    ;;
  *)
    echo "Usage: $0 {enable|disable|status|restart}"
    exit 1
    ;;
esac
