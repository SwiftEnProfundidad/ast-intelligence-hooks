#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest_dir="$repo_root/docs/codex-skills"

mkdir -p "$dest_dir"

declare -a mappings=(
  "windsurf-rules-android:/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-android/SKILL.md"
  "windsurf-rules-backend:/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-backend/SKILL.md"
  "windsurf-rules-frontend:/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-frontend/SKILL.md"
  "windsurf-rules-ios:/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-ios/SKILL.md"
  "swift-concurrency:/Users/juancarlosmerlosalbarracin/.codex/skills/swift-concurrency/SKILL.md"
  "swiftui-expert-skill:/Users/juancarlosmerlosalbarracin/.codex/skills/swiftui-expert-skill/SKILL.md"
)

echo "Sincronizando skills en: $dest_dir"

for mapping in "${mappings[@]}"; do
  name="${mapping%%:*}"
  src="${mapping#*:}"
  dst="$dest_dir/$name.md"

  if [[ ! -f "$src" ]]; then
    echo "ERROR: no existe la skill origen: $src" >&2
    exit 1
  fi

  cp "$src" "$dst"
  echo "OK  $name -> $dst"
done

echo "Sincronizacion completada."
