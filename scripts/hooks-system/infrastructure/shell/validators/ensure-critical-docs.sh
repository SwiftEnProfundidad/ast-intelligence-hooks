#!/bin/bash
# Protect critical documentation from accidental deletion

set -euo pipefail

TARGET="docs/technical/PLAN_PROGRESIVO_PLATAFORMAS.md"

# Ensure the file still exists in working tree
if [[ ! -f "$TARGET" ]]; then
  echo "❌ Required document '$TARGET' is missing. Restaurar el archivo antes de commitear."
  exit 1
fi

# Prevent staged deletions
if git diff --cached --name-only --diff-filter=D | grep -q "^${TARGET}$"; then
  echo "❌ No está permitido borrar '$TARGET'. Reviértelo antes de commitear."
  exit 1
fi

exit 0
