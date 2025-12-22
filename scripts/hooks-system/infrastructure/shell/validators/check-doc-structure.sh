#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
EXIT_CODE=0

# git diff --cached --name-status includes lines like:
#  A  path/file
#  R100    old/path    new/path
# Use read with up to 3 columns to capture rename targets.

while IFS=$'\t' read -r status path_a path_b; do
  [[ -z "${status:-}" ]] && continue

  case "$status" in
    A*|C*)
      target="$path_a"
      ;;
    R*)
      target="$path_b"
      ;;
    *)
      continue
      ;;
  esac

  [[ "${target:-}" != *.md ]] && continue

  if [[ "$target" == scripts/hooks-system/* ]]; then
    echo "❌ Documentación nueva detectada en '$target'. Usa docs/technical/hook-system/ como ubicación." >&2
    EXIT_CODE=1
    continue
  fi

  if [[ "$status" == R* ]]; then
    # Renames mantienen el contenido previo; sólo validamos ubicación prohibida.
    continue
  fi

  if [[ "$target" == docs/technical/hook-system/* ]]; then
    line1="$(sed -n '1p' "$ROOT_DIR/$target" | tr -d '\r')"
    line2="$(sed -n '2p' "$ROOT_DIR/$target" | tr -d '\r')"
    line3="$(sed -n '3p' "$ROOT_DIR/$target" | tr -d '\r')"

    if [[ "$line1" != Location:* || "$line2" != Related\ to:* || "$line3" != Owner:* ]]; then
      echo "❌ '$target' debe comenzar con cabecera de metadatos (Location, Related to, Owner). Usa docs/templates/HOOK_DOC_TEMPLATE.md." >&2
      EXIT_CODE=1
      continue
    fi

    # Validar que Location coincide con ruta real
    expected="Location: $target"
    if [[ "$line1" != "$expected" ]]; then
      echo "❌ '$target' → el campo Location debe ser '$expected'." >&2
      EXIT_CODE=1
    fi
  fi

done < <(git diff --cached --name-status --diff-filter=ACR)

exit $EXIT_CODE
