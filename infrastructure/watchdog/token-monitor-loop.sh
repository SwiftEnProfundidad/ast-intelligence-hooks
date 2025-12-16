#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Token Monitor Loop
# ═══════════════════════════════════════════════════════════════
# Ejecuta el monitor de tokens en bucle para disparar alertas
# periódicas sin intervención manual.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SCRIPT="$REPO_ROOT/infrastructure/watchdog/token-monitor.js"
INTERVAL=${TOKEN_MONITOR_INTERVAL:-300}

trap 'exit 0' SIGINT SIGTERM

while true; do
  node "$SCRIPT" || true
  sleep "$INTERVAL"
done
