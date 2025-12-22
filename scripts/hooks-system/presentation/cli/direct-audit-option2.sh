#!/bin/bash

# DIRECT AUDIT OPTION 2 - Strict REPO+STAGING (CI/CD)
# Execute option 2 directly without interactive menu

set -euo pipefail

# Get the hooks-system directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SYSTEM_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRASTRUCTURE_DIR="$HOOKS_SYSTEM_DIR/infrastructure"

# Set environment for option 2: Strict REPO+STAGING
export AUDIT_STRICT=1
export BLOCK_ALL_SEVERITIES=1
export BLOCK_ON_REPO_VIOLATIONS=1
export NON_INTERACTIVE=1

# Source the orchestrator but skip menu
SKIP_MENU=1 source "$INFRASTRUCTURE_DIR/shell/orchestrators/audit-orchestrator.sh" || true

# Execute option 2 directly: full_audit_strict_repo_and_staging
full_audit_strict_repo_and_staging
