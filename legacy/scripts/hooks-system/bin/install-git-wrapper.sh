#!/bin/bash
# Install Git Wrapper to prevent --no-verify bypass

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
WRAPPER_SRC="$REPO_ROOT/scripts/hooks-system/infrastructure/guards/git-wrapper.sh"
WRAPPER_DST="/usr/local/bin/git-protected"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🛡️  Git Wrapper Installation                            ║"
echo "║  Prevents --no-verify bypass                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Make wrapper executable
chmod +x "$WRAPPER_SRC"

# Copy to system path
if sudo cp "$WRAPPER_SRC" "$WRAPPER_DST"; then
  echo -e "${GREEN}✅ Git wrapper installed to $WRAPPER_DST${NC}"
else
  echo -e "${RED}❌ Failed to install wrapper (needs sudo)${NC}"
  exit 1
fi

# Add alias to shell profiles
for PROFILE in ~/.zshrc ~/.bashrc ~/.bash_profile; do
  if [ -f "$PROFILE" ]; then
    if ! grep -q "git-protected" "$PROFILE"; then
      echo "" >> "$PROFILE"
      echo "# Git wrapper - prevents --no-verify bypass" >> "$PROFILE"
      echo "alias git='git-protected'" >> "$PROFILE"
      echo -e "${GREEN}✅ Added alias to $PROFILE${NC}"
    else
      echo -e "${YELLOW}⚠️  Alias already exists in $PROFILE${NC}"
    fi
  fi
done

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ INSTALLATION COMPLETE                                ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  Restart your terminal or run: source ~/.zshrc          ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  --no-verify is now IMPOSSIBLE to use                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
