#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Hook-System Guard E2E Suite
# Verifica evidencia obsoleta, reinicios, monitor de tokens y locks
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
START_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/start-guards.sh"
AUTOSTART_SCRIPT="$REPO_ROOT/scripts/hooks-system/bin/guard-autostart.sh"
SUPERVISOR_LOG="$REPO_ROOT/.audit-reports/guard-supervisor.log"
DEBUG_LOG="$REPO_ROOT/.audit-reports/guard-debug.log"
NOTIFICATIONS_LOG="$REPO_ROOT/.audit-reports/notifications.log"
TOKEN_STATUS_FILE="$REPO_ROOT/.AI_TOKEN_STATUS.txt"
TOKEN_STATE_FILE="$REPO_ROOT/.audit_tmp/token-monitor.state"
LOCK_DIR="$REPO_ROOT/.audit_tmp/token-monitor-loop.lock"
PID_FILE="$REPO_ROOT/.guard-supervisor.pid"
TOKEN_PID_FILE="$REPO_ROOT/.audit_tmp/token-monitor-loop.pid"
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"
ACTIVITY_FILE="$REPO_ROOT/.guard-test-activity"
TMP_DIR="$REPO_ROOT/.audit_tmp"
HEARTBEAT_FILE="$REPO_ROOT/.audit_tmp/e2e-heartbeat.json"

info() {
  printf '\n[E2E] %s\n' "$1"
}

die() {
  printf '\n[E2E][ERROR] %s\n' "$1" >&2
  exit 1
}

wait_for_text() {
  local file="$1"
  local pattern="$2"
  local timeout="${3:-30}"
  local end=$((SECONDS + timeout))
  while (( SECONDS < end )); do
    if [[ -f "$file" ]] && grep -q "$pattern" "$file"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

wait_for_condition() {
  local command="$1"
  local timeout="${2:-30}"
  local end=$((SECONDS + timeout))
  while (( SECONDS < end )); do
    if bash -c "$command" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

wait_for_new_token_line() {
  local previous="$1"
  local timeout="${2:-30}"
  local end=$((SECONDS + timeout))
  while (( SECONDS < end )); do
    local latest
    latest=$(grep 'tokenMonitor started (pid' "$SUPERVISOR_LOG" | tail -1)
    if [[ -n "$latest" && "$latest" != "$previous" ]]; then
      echo "$latest"
      return 0
    fi
    sleep 1
  done
  return 1
}

wait_for_new_guard_pid() {
  local previous="$1"
  local timeout="${2:-30}"
  local end=$((SECONDS + timeout))
  while (( SECONDS < end )); do
    local latest
    latest=$(grep 'guard started (pid' "$SUPERVISOR_LOG" | tail -1)
    if [[ -n "$latest" && "$latest" != "$previous" ]]; then
      echo "$latest"
      return 0
    fi
    sleep 1
  done
  return 1
}

current_git_unique_count() {
  node - <<'NODE'
const path = require('path');
try {
  const { getGitTreeState } = require(path.join(process.cwd(), 'scripts', 'hooks-system', 'application', 'services', 'GitTreeState.js'));
  const state = getGitTreeState({ repoRoot: process.cwd() }) || {};
  process.stdout.write(String(state.uniqueCount || 0));
} catch (error) {
  process.stdout.write('0');
}
NODE
}

backup_evidence() {
  mkdir -p "$TMP_DIR"
  if [[ -f "$EVIDENCE_FILE" ]]; then
    cp "$EVIDENCE_FILE" "$TMP_DIR/guard-e2e-evidence.bak"
  else
    python3 - <<'PY' > "$EVIDENCE_FILE"
from datetime import datetime, timezone
print('{"timestamp":"' + datetime.now(timezone.utc).isoformat() + '"}')
PY
    touch "$TMP_DIR/guard-e2e-created"
  fi
}

restore_evidence() {
  if [[ -f "$TMP_DIR/guard-e2e-evidence.bak" ]]; then
    mv "$TMP_DIR/guard-e2e-evidence.bak" "$EVIDENCE_FILE"
  elif [[ -f "$TMP_DIR/guard-e2e-created" ]]; then
    rm -f "$EVIDENCE_FILE" "$TMP_DIR/guard-e2e-created"
  fi
}

reset_logs() {
  mkdir -p "$REPO_ROOT/.audit-reports"
  : > "$SUPERVISOR_LOG"
  : > "$DEBUG_LOG"
  : > "$NOTIFICATIONS_LOG"
  rm -f "$TOKEN_STATUS_FILE" "$TOKEN_STATE_FILE" "$TOKEN_PID_FILE"
  rm -rf "$LOCK_DIR"
  pkill -9 -f "token-monitor-loop.sh" >/dev/null 2>&1 || true
  pkill -9 -f "token-monitor.js" >/dev/null 2>&1 || true
  rm -f "$TMP_DIR/dirty-tree-state.json" "$TMP_DIR/gitflow-sync-state.json"
}

start_guard() {
  local phase="$1"
  info "Preparando entorno ($phase)"
  "$START_SCRIPT" stop >/dev/null 2>&1 || true
  reset_logs
  info "Arrancando guard supervisor ($phase)"
  "$START_SCRIPT" start >/dev/null
  wait_for_text "$SUPERVISOR_LOG" "guard started" 40 || die "guard-supervisor no registró realtime guard ($phase)"
  wait_for_text "$SUPERVISOR_LOG" "tokenMonitor started" 40 || die "guard-supervisor no registró token monitor ($phase)"
  CURRENT_GUARD_LINE=$(grep 'guard started (pid' "$SUPERVISOR_LOG" | tail -1)
  CURRENT_TOKEN_LINE=$(grep 'tokenMonitor started (pid' "$SUPERVISOR_LOG" | tail -1)
  [[ -n "$CURRENT_GUARD_LINE" ]] || die "No se obtuvo PID de realtime guard ($phase)"
  [[ -n "$CURRENT_TOKEN_LINE" ]] || die "No se obtuvo PID de token monitor ($phase)"
}

stop_guard() {
  local verify=${1:-check}
  info "Deteniendo guardianes"
  "$START_SCRIPT" stop >/dev/null 2>&1 || true
  wait_for_condition "[[ ! -f '$PID_FILE' ]]" 15 || die "PID del supervisor persiste tras stop"
  if [[ $verify == check ]]; then
    wait_for_condition "[[ ! -d '$LOCK_DIR' ]]" 20 || die "Lock del token monitor persiste tras stop"
  else
    sleep 1
  fi
}

fresh_evidence() {
  python3 - <<'PY' > "$EVIDENCE_FILE"
from datetime import datetime, timezone
print('{"timestamp":"' + datetime.now(timezone.utc).isoformat() + '"}')
PY
}

cleanup() {
  stop_guard skip >/dev/null 2>&1 || true
  restore_evidence
  rm -f "$REPO_ROOT/.guard-test-activity"
  rm -rf "$REPO_ROOT/.guard-dirty-test"
  if [[ -n "${LOG_NOISE_PID:-}" ]]; then
    kill "$LOG_NOISE_PID" >/dev/null 2>&1 || true
    wait "$LOG_NOISE_PID" 2>/dev/null || true
  fi
  if [[ -x "$AUTOSTART_SCRIPT" ]]; then
    "$AUTOSTART_SCRIPT" disable >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

backup_evidence

# ──────────────────────────────────────────────────────────────
# Pre-flight: Git wrapper validation
# ──────────────────────────────────────────────────────────────
info "Pre-flight: git wrapper valida creación de ramas"
WRAPPER_BIN="$REPO_ROOT/scripts/hooks-system/infrastructure/shell/gitflow/git-wrapper.sh"
if "$WRAPPER_BIN" branch invalid-branch-name >/dev/null 2>&1; then
  die "El wrapper permitió crear rama sin prefijo git flow"
fi
if ! "$WRAPPER_BIN" branch feature/e2e-branch-wrapper >/dev/null 2>&1; then
  die "El wrapper bloqueó rama válida feature/e2e-branch-wrapper"
fi
git branch -D feature/e2e-branch-wrapper >/dev/null 2>&1 || true
restore_evidence

# ──────────────────────────────────────────────────────────────
# Fase 1: Alerta de evidencia y JSON corrupto (sin gracia)
# ──────────────────────────────────────────────────────────────
export HOOK_GUARD_AUTO_REFRESH=false
export HOOK_GUARD_EVIDENCE_STALE_THRESHOLD=5000
export HOOK_GUARD_EVIDENCE_POLL_INTERVAL=1000
export HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL=4000
export HOOK_GUARD_INACTIVITY_GRACE_MS=0
export HOOK_GUARD_EMBEDDED_TOKEN_MONITOR=false
export HOOK_GUARD_AUTORELOAD_DEBOUNCE=500
export HOOK_GUARD_AUTORELOAD_FORCE=5000
export TOKEN_MONITOR_INTERVAL=2
export TOKEN_MONITOR_REMINDER_SECONDS=12
export TOKEN_MONITOR_MIN_DELTA=50000
export TOKEN_MONITOR_FORCE_LEVEL=WARNING
export HOOK_GUARD_GITFLOW_AUTOSYNC=false
export HOOK_GUARD_GITFLOW_AUTOCLEAN=false
export HOOK_GUARD_HEARTBEAT_PATH=.audit_tmp/e2e-heartbeat.json
export HOOK_GUARD_HEARTBEAT_INTERVAL=4000
export HOOK_GUARD_HEARTBEAT_MAX_AGE=2500
export HOOK_GUARD_HEARTBEAT_CHECK_INTERVAL=700
export HOOK_GUARD_HEARTBEAT_NOTIFY_COOLDOWN=2000

start_guard "fase 1"

info "Caso 0: heartbeat activo"
wait_for_condition "[[ -f '$HEARTBEAT_FILE' ]]" 30 || die "No se generó archivo de heartbeat"
python3 - <<PY || die "Heartbeat inicial no válido"
import json, pathlib, sys
path = pathlib.Path(r"""$HEARTBEAT_FILE""")
data = json.loads(path.read_text())
if data.get("status") != "healthy":
    sys.exit("Heartbeat inicial no está en estado healthy")
PY

info "Caso 0b: heartbeat detecta staleness"
python3 - <<PY
import json, pathlib, datetime
path = pathlib.Path(r"""$HEARTBEAT_FILE""")
data = json.loads(path.read_text())
data["timestamp"] = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=120)).isoformat()
path.write_text(json.dumps(data))
PY
wait_for_text "$DEBUG_LOG" "HEARTBEAT_ALERT|stale" 30 || die "No se detectó heartbeat obsoleto"
wait_for_text "$DEBUG_LOG" "HEARTBEAT_RECOVERED" 30 || die "No se registró recuperación de heartbeat"

info "Caso 1: alerta por evidencia obsoleta"
python3 - <<'PY' > "$EVIDENCE_FILE"
from datetime import datetime, timedelta, timezone
stamp = datetime.now(timezone.utc) - timedelta(minutes=20)
print('{"timestamp":"' + stamp.isoformat() + '"}')
PY
wait_for_text "$DEBUG_LOG" "force-dialog" 20 || die "No se forzó modal de evidencia obsoleta"
wait_for_text "$NOTIFICATIONS_LOG" "WARN" 20 || die "No se registró notificación warn"

info "Caso 2: evidencia corrupta"
printf '{"timestamp":' > "$EVIDENCE_FILE"
wait_for_text "$DEBUG_LOG" "EVIDENCE_READ_ERROR" 15 || die "No se detectó JSON corrupto"

stop_guard skip
fresh_evidence
sleep 2

# ──────────────────────────────────────────────────────────────
# Fase 2: Supresión por actividad, token monitor, restart y stop
# ──────────────────────────────────────────────────────────────
export HOOK_GUARD_INACTIVITY_GRACE_MS=6000
BASE_UNIQUE=$(current_git_unique_count)
if ! [[ "$BASE_UNIQUE" =~ ^[0-9]+$ ]]; then
  BASE_UNIQUE=0
fi
DIRTY_LIMIT=$((BASE_UNIQUE + 2))
if (( DIRTY_LIMIT < 10 )); then
  DIRTY_LIMIT=10
fi
export HOOK_GUARD_DIRTY_TREE_LIMIT=$DIRTY_LIMIT
export HOOK_GUARD_DIRTY_TREE_INTERVAL=1000
export HOOK_GUARD_DIRTY_TREE_REMINDER=12000
start_guard "fase 2"
PHASE2_INITIAL_TOKEN_LINE="$CURRENT_TOKEN_LINE"

info "Dirty tree limit para pruebas: $DIRTY_LIMIT (base $BASE_UNIQUE)"

info "Caso 3: supresión por actividad reciente"
DEBUG_LINES_BEFORE=$(wc -l < "$DEBUG_LOG" 2>/dev/null || echo 0)
touch "$REPO_ROOT/.guard-test-activity"
sleep 2
python3 - <<'PY' > "$EVIDENCE_FILE"
from datetime import datetime, timedelta, timezone
stamp = datetime.now(timezone.utc) - timedelta(minutes=20)
print('{"timestamp":"' + stamp.isoformat() + '"}')
PY
wait_for_text "$DEBUG_LOG" "STALE_SUPPRESSED" 20 || die "No se registró supresión tras actividad"
DEBUG_LINES_AFTER=$(wc -l < "$DEBUG_LOG" 2>/dev/null || echo 0)
if (( DEBUG_LINES_AFTER <= DEBUG_LINES_BEFORE )); then
  die "No se generó nueva entrada de STALED_SUPPRESSED"
fi

fresh_evidence
sleep 2

info "Caso 3b: árbol git sucio respeta cooldown"
DIRTY_TARGET=$((DIRTY_LIMIT + 2))
DIRTY_FILES=()
for ((index = 1; index <= DIRTY_TARGET; index++)); do
  file="$REPO_ROOT/.guard-dirty-file-${index}.tmp"
  DIRTY_FILES+=("$file")
  touch "$file"
  sleep 0.2
done
wait_for_text "$DEBUG_LOG" "DIRTY_TREE_ALERT" 25 || die "No se registró alerta de árbol sucio"
ALERT_COUNT=$(grep -c "DIRTY_TREE_ALERT" "$DEBUG_LOG" 2>/dev/null || echo 0)
sleep 2
ALERT_COUNT_AFTER=$(grep -c "DIRTY_TREE_ALERT" "$DEBUG_LOG" 2>/dev/null || echo 0)
if (( ALERT_COUNT_AFTER != ALERT_COUNT )); then
  die "Se generaron múltiples alertas de árbol sucio sin respetar cooldown"
fi
wait_for_text "$DEBUG_LOG" "DIRTY_TREE_SUPPRESSED" 15 || die "No se registró supresión de alerta durante cooldown"
TREE_NOTIFS=$(grep -c "El árbol git está saturado" "$NOTIFICATIONS_LOG" 2>/dev/null || echo 0)
sleep 2
TREE_NOTIFS_AFTER=$(grep -c "El árbol git está saturado" "$NOTIFICATIONS_LOG" 2>/dev/null || echo 0)
if (( TREE_NOTIFS_AFTER > TREE_NOTIFS )); then
  die "Se emitieron notificaciones duplicadas de árbol sucio"
fi
for file in "${DIRTY_FILES[@]}"; do
  rm -f "$file"
done
wait_for_text "$DEBUG_LOG" "DIRTY_TREE_CLEAR" 25 || die "No se registró limpieza del árbol sucio"

fresh_evidence
sleep 2

info "Caso 4: monitor de tokens en WARNING sin duplicados"
wait_for_text "$TOKEN_STATUS_FILE" "Status: WARNING" 60 || die "Token monitor no generó WARNING"
INITIAL_WARN_COUNT=$(grep -c "Pumuki Token Monitor" "$NOTIFICATIONS_LOG" || true)
sleep 6
SECOND_WARN_COUNT=$(grep -c "Pumuki Token Monitor" "$NOTIFICATIONS_LOG" || true)
if (( SECOND_WARN_COUNT > INITIAL_WARN_COUNT )); then
  die "Se detectaron notificaciones duplicadas antes del reminder"
fi

info "Caso 5: auto-restart al modificar script vigilado"
touch "$REPO_ROOT/scripts/hooks-system/infrastructure/watchdog/token-monitor.js"
wait_for_text "$SUPERVISOR_LOG" "Restarting guards" 25 || die "No se registró reinicio programado"
wait_for_text "$SUPERVISOR_LOG" "tokenMonitor started" 25 || die "Token monitor no reiniciado"
if ! NEW_TOKEN_LINE=$(wait_for_new_token_line "$PHASE2_INITIAL_TOKEN_LINE" 40); then
  die "El token monitor no cambió de PID tras reinicio"
fi

info "Caso 6: apagado limpio"
stop_guard

# ──────────────────────────────────────────────────────────────
# Fase 2b: Auto-refresh ignora ruido interno de logs
# ──────────────────────────────────────────────────────────────
export HOOK_GUARD_AUTO_REFRESH=true
export HOOK_GUARD_EVIDENCE_STALE_THRESHOLD=4000
export HOOK_GUARD_EVIDENCE_POLL_INTERVAL=1000
export HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL=3000
export HOOK_GUARD_INACTIVITY_GRACE_MS=0
export HOOK_GUARD_EMBEDDED_TOKEN_MONITOR=false

start_guard "fase 2b"

info "Caso 7: auto-refresh ignora updates de logs internos"
(
  while true; do
    touch "$DEBUG_LOG" "$SUPERVISOR_LOG"
    sleep 0.4
  done
) &
LOG_NOISE_PID=$!

python3 - <<'PY' > "$EVIDENCE_FILE"
from datetime import datetime, timedelta, timezone
stamp = datetime.now(timezone.utc) - timedelta(minutes=25)
print('{"timestamp":"' + stamp.isoformat() + '"}')
PY

wait_for_text "$DEBUG_LOG" "AUTO_REFRESH_SUCCESS|stale" 40 || die "No se registró auto-refresh exitoso"
wait_for_text "$NOTIFICATIONS_LOG" "Evidencia renovada automáticamente" 40 || die "No se notificó la renovación automática"

kill "$LOG_NOISE_PID" 2>/dev/null || true
wait "$LOG_NOISE_PID" 2>/dev/null || true

stop_guard skip
fresh_evidence
sleep 2

# ──────────────────────────────────────────────────────────────
# Fase 3: Auto manager (enable/disable + restart resiliente)
# ──────────────────────────────────────────────────────────────
export HOOK_GUARD_AUTO_REFRESH=false
export HOOK_GUARD_EVIDENCE_STALE_THRESHOLD=5000
export HOOK_GUARD_EVIDENCE_POLL_INTERVAL=1000
export HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL=4000
export HOOK_GUARD_INACTIVITY_GRACE_MS=0

if [[ ! -x "$AUTOSTART_SCRIPT" ]]; then
  die "guard-autostart.sh no disponible"
fi

export GUARD_AUTOSTART_MONITOR_INTERVAL=2000
export GUARD_AUTOSTART_RESTART_COOLDOWN=1000
export GUARD_AUTOSTART_STOP_SUPERVISOR_ON_EXIT=true

rm -rf "$REPO_ROOT/.audit_tmp/guard-auto-manager.lock" "$REPO_ROOT/.guard-auto-manager.pid"
reset_logs

info "Caso 8: autostart habilita supervisor"
AUTOSTART_ENABLE_OUTPUT=$("$AUTOSTART_SCRIPT" enable 2>&1 || true)
if [[ -n "${AUTOSTART_ENABLE_OUTPUT// }" ]]; then
  echo "$AUTOSTART_ENABLE_OUTPUT" | sed 's/^/   /'
fi
wait_for_text "$SUPERVISOR_LOG" "guard started" 40 || die "Autostart no arrancó el guard supervisor"
wait_for_text "$SUPERVISOR_LOG" "tokenMonitor started" 40 || die "Autostart no arrancó el token monitor"
wait_for_condition "[[ -f '$REPO_ROOT/.guard-auto-manager.pid' ]]" 20 || die "PID del auto manager no creado"
INITIAL_GUARD_LINE=$(grep 'guard started (pid' "$SUPERVISOR_LOG" | tail -1)
[[ -n "$INITIAL_GUARD_LINE" ]] || die "No se obtuvo PID inicial del guard en autostart"
INITIAL_GUARD_PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
[[ -n "$INITIAL_GUARD_PID" ]] || die "No se obtuvo PID del supervisor tras autostart"

info "Caso 9: autostart reinicia supervisor tras caída"
kill "$INITIAL_GUARD_PID" 2>/dev/null || die "No se pudo enviar señal al guard"
if ! NEW_GUARD_LINE=$(wait_for_new_guard_pid "$INITIAL_GUARD_LINE" 40); then
  die "Autostart no relanzó el guard tras caída"
fi
wait_for_condition "[[ -f '$PID_FILE' ]]" 20 || die "No se recreó PID del guard"

info "Caso 10: autostart disable detiene procesos"
DISABLE_OUTPUT=$("$AUTOSTART_SCRIPT" disable 2>&1 || true)
if [[ -n "${DISABLE_OUTPUT// }" ]]; then
  echo "$DISABLE_OUTPUT" | sed 's/^/   /'
fi
wait_for_condition "[[ ! -f '$REPO_ROOT/.guard-auto-manager.pid' ]]" 20 || die "PID del auto manager persiste tras disable"
wait_for_condition "[[ ! -f '$PID_FILE' ]]" 20 || die "Supervisor sigue activo tras disable"
wait_for_condition "[[ ! -d '$LOCK_DIR' ]]" 20 || die "Lock de token monitor persiste tras disable"

# ──────────────────────────────────────────────────────────────
# Fase 4: Auto-sync GitFlow (develop → main)
# ──────────────────────────────────────────────────────────────
if [[ -n "$(/usr/bin/git status --porcelain)" ]]; then
  info "Fase 4: se omite auto-sync porque el working tree no está limpio"
else
export HOOK_GUARD_GITFLOW_AUTOSYNC=true
export HOOK_GUARD_GITFLOW_AUTOSYNC_INTERVAL=2000
export HOOK_GUARD_GITFLOW_AUTOSYNC_COOLDOWN=2000
export HOOK_GUARD_GITFLOW_AUTOCLEAN=false
export HOOK_GUARD_GITFLOW_MAIN_BRANCH=chore/autosync-main
export HOOK_GUARD_GITFLOW_DEVELOP_BRANCH=feature/autosync-develop
export HOOK_GUARD_GITFLOW_REQUIRE_CLEAN=false

GH_STUB_DIR="$TMP_DIR/fake-gh"
GH_STUB_LOG="$TMP_DIR/gh-stub.log"
mkdir -p "$GH_STUB_DIR"
cat <<SH > "$GH_STUB_DIR/gh"
#!/bin/bash
echo "\$@" >> "$GH_STUB_LOG"
if [[ "\$1" == "pr" && "\$2" == "list" ]]; then
  echo "[]"
  exit 0
fi
if [[ "\$1" == "pr" && "\$2" == "create" ]]; then
  echo "https://example.com/auto/pr/123"
  exit 0
fi
exit 0
SH
chmod +x "$GH_STUB_DIR/gh"
ORIGINAL_PATH="$PATH"
export PATH="$GH_STUB_DIR:$PATH"

"$WRAPPER_BIN" branch -d chore/autosync-main >/dev/null 2>&1 || true
"$WRAPPER_BIN" branch -d feature/autosync-develop >/dev/null 2>&1 || true

"$WRAPPER_BIN" branch chore/autosync-main >/dev/null 2>&1 || true
"$WRAPPER_BIN" branch feature/autosync-develop >/dev/null 2>&1 || true

/usr/bin/git checkout feature/autosync-develop >/dev/null 2>&1 || die "No se pudo cambiar a feature/autosync-develop"
git commit --allow-empty -m "feat: autosync sentinel" >/dev/null 2>&1 || die "No se pudo generar commit sentinela"
/usr/bin/git checkout develop >/dev/null 2>&1 || die "No se pudo volver a develop para autosync"

start_guard "fase 4 autosync"

wait_for_text "$DEBUG_LOG" "GITFLOW_AUTOSYNC_PR_CREATED" 60 || die "No se registró creación automática de PR develop→main"
if ! grep -q "pr create" "$GH_STUB_LOG" 2>/dev/null; then
  die "El stub de gh no registró creación de PR"
fi

stop_guard skip

git branch -D feature/autosync-develop >/dev/null 2>&1 || true
git branch -D chore/autosync-main >/dev/null 2>&1 || true
rm -f "$GH_STUB_LOG"
rm -rf "$GH_STUB_DIR"
export PATH="$ORIGINAL_PATH"
restore_evidence
export HOOK_GUARD_GITFLOW_AUTOSYNC=false
fi

info "✅ Todas las pruebas de guardianes pasaron"
