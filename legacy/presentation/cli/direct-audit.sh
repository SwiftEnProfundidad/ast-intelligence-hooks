#!/bin/bash

# DIRECT AUDIT - Execute audit with specified option
# Usage: bash direct-audit.sh [option]
# Options: 1=Full audit, 2=Strict REPO+STAGING, 3=Strict STAGING only, etc.

set -euo pipefail

# Get the hooks-system directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SYSTEM_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRASTRUCTURE_DIR="$HOOKS_SYSTEM_DIR/infrastructure"
ORCHESTRATOR_DIR="$INFRASTRUCTURE_DIR/shell/orchestrators"

# Get option from argument or default to 2
OPTION="${1:-2}"

# Validate option
case "$OPTION" in
  1|2|3|4|5|6|7|8|9)
    # Valid option
    ;;
  *)
    echo "Invalid option: $OPTION"
    echo "Usage: bash direct-audit.sh [1-9]"
    echo "  1=Full audit, 2=Strict REPO+STAGING, 3=Strict STAGING only, etc."
    exit 1
    ;;
esac

# Execute orchestrator with AUDIT_OPTION environment variable (non-interactive mode)
export AUDIT_OPTION="$OPTION"
bash "$ORCHESTRATOR_DIR/audit-orchestrator.sh"
