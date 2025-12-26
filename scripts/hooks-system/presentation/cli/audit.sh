#!/usr/bin/env bash
# Entry point for the audit hook system
# This script acts as the main CLI interface

set -euo pipefail

# Get the hooks-system directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SYSTEM_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRASTRUCTURE_DIR="$HOOKS_SYSTEM_DIR/infrastructure"

# Source the orchestrator
source "$INFRASTRUCTURE_DIR/shell/orchestrators/audit-orchestrator.sh"

# Execute the main menu
MODE="${1:-}"
if [[ -n "$MODE" ]]; then
  case "$MODE" in
    2) full_audit_strict_repo_and_staging ;;
    3) full_audit_strict_staging_only ;;
    *) interactive_menu ;;
  esac
else
  interactive_menu
fi
