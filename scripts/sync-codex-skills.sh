#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$ROOT_DIR/docs/codex-skills"

mkdir -p "$DEST_DIR"

synced_count=0

sync_one() {
  local source_path="$1"
  local dest_path="$2"

  if [[ -f "$source_path" ]]; then
    cp "$source_path" "$dest_path"
    echo "synced: $source_path -> $dest_path"
    synced_count=$((synced_count + 1))
    return
  fi

  echo "warning: missing source: $source_path" >&2
  printf 'TODO: sincronizar desde %s\n' "$source_path" > "$dest_path"
}

sync_one "/Users/juancarlosmerlosalbarracin/.agents/skills/android-enterprise-rules/SKILL.md" "$DEST_DIR/android-enterprise-rules.md"
sync_one "/Users/juancarlosmerlosalbarracin/.agents/skills/backend-enterprise-rules/SKILL.md" "$DEST_DIR/backend-enterprise-rules.md"
sync_one "/Users/juancarlosmerlosalbarracin/.agents/skills/frontend-enterprise-rules/SKILL.md" "$DEST_DIR/frontend-enterprise-rules.md"
sync_one "/Users/juancarlosmerlosalbarracin/.agents/skills/ios-enterprise-rules/SKILL.md" "$DEST_DIR/ios-enterprise-rules.md"
sync_one "/Users/juancarlosmerlosalbarracin/.codex/skills/swift-concurrency/SKILL.md" "$DEST_DIR/swift-concurrency.md"
sync_one "/Users/juancarlosmerlosalbarracin/.codex/skills/swiftui-expert-skill/SKILL.md" "$DEST_DIR/swiftui-expert-skill.md"

if [[ "$synced_count" -ge 1 ]]; then
  echo "done: synchronized $synced_count skill file(s) into $DEST_DIR"
  exit 0
fi

echo "error: no skill files synchronized" >&2
exit 1
