#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Token Monitor Loop
# ═══════════════════════════════════════════════════════════════
# Ejecuta el monitor de tokens en bucle para disparar alertas
# periódicas sin intervención manual.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SCRIPT="$REPO_ROOT/scripts/hooks-system/infrastructure/watchdog/token-monitor.sh"
INTERVAL=${TOKEN_MONITOR_INTERVAL:-300}

trap 'exit 0' SIGINT SIGTERM

while true; do
  # Ejecutamos el monitor y nunca fallamos para mantener el loop vivo
  bash "$SCRIPT" >/dev/null 2>&1 || true
  sleep "$INTERVAL"
done
