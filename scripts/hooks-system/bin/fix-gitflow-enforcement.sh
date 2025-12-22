#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Fix Git Flow Enforcement
# ═══════════════════════════════════════════════════════════════
# Activa el git-wrapper.sh y limpia ramas obsoletas

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
GIT_WRAPPER_PATH="$REPO_ROOT/scripts/hooks-system/infrastructure/shell/gitflow/git-wrapper.sh"

echo "🔧 Fixing Git Flow Enforcement..."
echo ""

# 1. Verificar que git-wrapper.sh existe
if [[ ! -f "$GIT_WRAPPER_PATH" ]]; then
  echo "❌ Error: git-wrapper.sh not found at $GIT_WRAPPER_PATH"
  exit 1
fi

# 2. Hacer ejecutable
chmod +x "$GIT_WRAPPER_PATH"

# 3. Verificar que está en .zshrc
if ! grep -q "GIT_WRAPPER_PATH" ~/.zshrc 2>/dev/null; then
  echo "⚠️  Warning: GIT_WRAPPER_PATH not found in ~/.zshrc"
  echo "   Adding it now..."
  cat >> ~/.zshrc << 'EOF'

# Git Flow Enforcement (portable - auto-detect project root)
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
export GIT_WRAPPER_PATH="$PROJECT_ROOT/scripts/hooks-system/infrastructure/shell/gitflow/git-wrapper.sh"
if [ -f "$GIT_WRAPPER_PATH" ]; then
    alias git='bash "$GIT_WRAPPER_PATH"'
fi
EOF
  echo "✅ Added to ~/.zshrc"
else
  echo "✅ Already in ~/.zshrc"
fi

# 4. Activar alias en sesión actual
echo ""
echo "🔄 Activating alias in current session..."
export GIT_WRAPPER_PATH="$GIT_WRAPPER_PATH"
alias git='bash "$GIT_WRAPPER_PATH"'

# 5. Forzar rehash en zsh
hash -r git 2>/dev/null || true

# 6. Verificar que funciona
echo ""
echo "🧪 Testing git-wrapper..."
if bash "$GIT_WRAPPER_PATH" --version > /dev/null 2>&1; then
  echo "✅ git-wrapper.sh is executable and working"
else
  echo "❌ Error: git-wrapper.sh failed to execute"
  exit 1
fi

echo ""
echo "✅ Git Flow Enforcement fixed!"
echo ""
echo "📝 Next steps:"
echo "   1. Close and reopen your terminal (or run: source ~/.zshrc)"
echo "   2. Run: git --version (should show wrapper is active)"
echo "   3. Try: git commit (should enforce Git Flow rules)"
echo ""
