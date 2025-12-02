#!/bin/bash
set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HOOKS_DIR="$PROJECT_DIR/.claude/hooks"

cd "$HOOKS_DIR"
cat | npx tsx skill-activation-prompt.ts
