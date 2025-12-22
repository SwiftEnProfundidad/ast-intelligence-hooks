#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Cleanup Merged Branches
# ═══════════════════════════════════════════════════════════════
# Limpia ramas locales y remotas mergeadas

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"

DRY_RUN="${1:-}"

echo "🧹 Cleaning up merged branches..."
echo ""

# Fetch latest
echo "📥 Fetching latest from remote..."
git fetch --prune origin

# Local branches merged into main
echo ""
echo "📋 Local branches merged into main:"
LOCAL_MERGED_MAIN=$(git branch --merged origin/main | grep -v "^\*" | grep -v "main\|develop" | sed 's/^[[:space:]]*//' || true)

if [[ -z "$LOCAL_MERGED_MAIN" ]]; then
  echo "   (none)"
else
  echo "$LOCAL_MERGED_MAIN" | while read -r branch; do
    echo "   - $branch"
  done
fi

# Local branches merged into develop
echo ""
echo "📋 Local branches merged into develop:"
LOCAL_MERGED_DEVELOP=$(git branch --merged origin/develop | grep -v "^\*" | grep -v "main\|develop" | sed 's/^[[:space:]]*//' || true)

if [[ -z "$LOCAL_MERGED_DEVELOP" ]]; then
  echo "   (none)"
else
  echo "$LOCAL_MERGED_DEVELOP" | while read -r branch; do
    echo "   - $branch"
  done
fi

# Remote branches merged into main
echo ""
echo "📋 Remote branches merged into main:"
REMOTE_MERGED_MAIN=$(git branch -r --merged origin/main | grep -v "origin/main\|origin/HEAD\|origin/develop" | sed 's|origin/||' | sed 's/^[[:space:]]*//' || true)

if [[ -z "$REMOTE_MERGED_MAIN" ]]; then
  echo "   (none)"
else
  echo "$REMOTE_MERGED_MAIN" | head -20
  if [[ $(echo "$REMOTE_MERGED_MAIN" | wc -l) -gt 20 ]]; then
    echo "   ... and $(( $(echo "$REMOTE_MERGED_MAIN" | wc -l) - 20 )) more"
  fi
fi

# Summary
TOTAL_LOCAL=$(echo -e "$LOCAL_MERGED_MAIN\n$LOCAL_MERGED_DEVELOP" | grep -v "^$" | sort -u | wc -l | xargs)
TOTAL_REMOTE=$(echo "$REMOTE_MERGED_MAIN" | grep -v "^$" | wc -l | xargs)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 Summary:"
echo "   Local branches to delete: $TOTAL_LOCAL"
echo "   Remote branches to delete: $TOTAL_REMOTE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [[ "$DRY_RUN" == "--dry-run" ]]; then
  echo "🔍 DRY RUN MODE - No branches will be deleted"
  echo ""
  echo "To actually delete branches, run:"
  echo "  $0"
  exit 0
fi

# Delete local branches
if [[ -n "$LOCAL_MERGED_MAIN" ]] || [[ -n "$LOCAL_MERGED_DEVELOP" ]]; then
  echo "🗑️  Deleting local merged branches..."
  echo -e "$LOCAL_MERGED_MAIN\n$LOCAL_MERGED_DEVELOP" | grep -v "^$" | sort -u | while read -r branch; do
    if git show-ref --verify --quiet refs/heads/"$branch"; then
      echo "   Deleting local: $branch"
      git branch -d "$branch" 2>/dev/null || git branch -D "$branch" 2>/dev/null || true
    fi
  done
fi

# Delete remote branches (requires confirmation)
if [[ -n "$REMOTE_MERGED_MAIN" ]] && [[ $TOTAL_REMOTE -gt 0 ]]; then
  echo ""
  echo "🗑️  Deleting remote merged branches..."
  echo "$REMOTE_MERGED_MAIN" | while read -r branch; do
    if [[ -n "$branch" ]]; then
      echo "   Deleting remote: origin/$branch"
      git push origin --delete "$branch" 2>/dev/null || true
    fi
  done
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
