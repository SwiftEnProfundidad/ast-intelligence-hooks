#!/usr/bin/env bash
# Entry point for the audit hook system
# This script acts as the main CLI interface

set -euo pipefail

# Get the hooks-system directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Robustly find HOOKS_SYSTEM_DIR (works for both local development and node_modules installation)
if [[ "$SCRIPT_DIR" == *"/node_modules/@pumuki/ast-intelligence-hooks/scripts/hooks-system/presentation/cli"* ]]; then
    # Installed in node_modules (package includes scripts/hooks-system/...)
    PACKAGE_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
    HOOKS_SYSTEM_DIR="$PACKAGE_ROOT/scripts/hooks-system"
elif [[ "$SCRIPT_DIR" == *"/node_modules/@pumuki/ast-intelligence-hooks/presentation/cli"* ]]; then
    # Installed in node_modules (legacy package layout)
    HOOKS_SYSTEM_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    # Local development or other structure
    HOOKS_SYSTEM_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

INFRASTRUCTURE_DIR="$HOOKS_SYSTEM_DIR/infrastructure"

# If a mode was provided, set AUDIT_OPTION before sourcing the orchestrator
MODE="${1:-}"
if [[ -n "$MODE" ]]; then
  export AUDIT_OPTION="$MODE"
fi

# Source the orchestrator
source "$INFRASTRUCTURE_DIR/shell/orchestrators/audit-orchestrator.sh"
