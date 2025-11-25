#!/usr/bin/env bash
# File Operations - Infrastructure Layer
# File listing and counting utilities

list_source_files() {
  local dir="$1"
  find "$dir" -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" -o -name "*.cjs" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.next/*" \
    -not -path "*/.turbo/*" \
    -not -path "*/.vercel/*" \
    -not -path "*/coverage/*" \
    -not -path "*/build/*" \
    -not -path "*/out/*" \
    -not -path "*/.cache/*" \
    -not -name "*.d.ts" \
    -not -name "*.map" \
    -not -name "*.min.*" \
    -not -name "*.snap"
}

count_files() {
  local list_file="$1"
  if [[ -f "$list_file" ]]; then
    wc -l < "$list_file" | tr -d ' '
  else
    echo 0
  fi
}

