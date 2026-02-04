#!/bin/bash
# Protect critical documentation from accidental deletion

set -euo pipefail

# List of critical documents that must exist
CRITICAL_DOCS=(
  "docs/planning/ROADMAP.md"
  "docs/planning/LIBRARY_FIVE_STARS_ROADMAP.md"
  "docs/technical/hook-system/README.md"
)

# Check each critical document
for TARGET in "${CRITICAL_DOCS[@]}"; do
  if [[ ! -f "$TARGET" ]]; then
    echo "❌ Required document '$TARGET' is missing."
    exit 1
  fi

  if git diff --cached --name-only --diff-filter=D | grep -q "^${TARGET}$"; then
    echo "❌ Cannot delete critical document '$TARGET'."
    exit 1
  fi
done

exit 0
