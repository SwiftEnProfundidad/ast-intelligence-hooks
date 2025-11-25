#!/bin/bash

# DIRECT AUDIT - Execute full audit without interactive menu
# Blocks commits on ANY violation across all severity levels (CRITICAL/HIGH/MEDIUM/LOW)

set -euo pipefail

# Get the hooks-system directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SYSTEM_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRASTRUCTURE_DIR="$HOOKS_SYSTEM_DIR/infrastructure"

# Run full audit with strict blocking on ALL severities
export AUDIT_STRICT=1
export BLOCK_ALL_SEVERITIES=1
export NON_INTERACTIVE=1

# Source the orchestrator (but prevent interactive menu)
SKIP_MENU=1 source "$INFRASTRUCTURE_DIR/shell/orchestrators/audit-orchestrator.sh"

# Execute full audit functions directly instead of menu
run_basic_checks
run_eslint_suite
run_ast_intelligence
summarize_all
