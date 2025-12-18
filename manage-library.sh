#!/bin/bash
# ============================================
# Manage Library - Single Script for All Operations
# ============================================
# Usage:
#   ./manage-library.sh reset      - Clean everything
#   ./manage-library.sh update     - Update library after changes
#   ./manage-library.sh install    - Full fresh install
#   ./manage-library.sh            - Show menu

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

LIBRARY_PATH="file:../../Libraries/ast-intelligence-hooks"

# ============================================
# Functions
# ============================================

show_menu() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Manage AST Intelligence Hooks Library                        ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Select an option:${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} Update library (after changes in source)"
    echo -e "  ${GREEN}2)${NC} Remove library (uninstall completely)"
    echo -e "  ${GREEN}3)${NC} Fresh install (reset + install + setup)"
    echo -e "  ${GREEN}q)${NC} Quit"
    echo ""
    read -p "Choice [1-3/q]: " choice
    echo ""
    
    case "$choice" in
        1) update_library ;;
        2) remove_library ;;
        3) fresh_install ;;
        q|Q) echo "Bye!"; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}"; show_menu ;;
    esac
}

update_library() {
    echo -e "${BLUE}🔄 Updating library...${NC}"
    echo ""
    
    if ! grep -q "@pumuki/ast-intelligence-hooks" package.json; then
        echo -e "${YELLOW}⚠️  Library not found in package.json${NC}"
        echo -e "${BLUE}💡 Run 'install' option first${NC}"
        return 1
    fi
    
    if [ -d "node_modules/@pumuki/ast-intelligence-hooks" ]; then
        echo -e "${YELLOW}🧹 Cleaning previous installation...${NC}"
        rm -rf node_modules/@pumuki/ast-intelligence-hooks
    fi
    
    if [ -d "node_modules/.bin" ]; then
        find node_modules/.bin -type l \( -name "ast-*" -o -name "hook-*" -o -name "audit" \) 2>/dev/null | while read -r link; do
            if [ -L "$link" ]; then
                target=$(readlink "$link" 2>/dev/null || echo "")
                if [[ "$target" == *"@pumuki"* ]]; then
                    rm -f "$link" 2>/dev/null || true
                fi
            fi
        done
    fi
    
    echo -e "${YELLOW}📦 Reinstalling library...${NC}"
    npm install
    
    echo -e "${YELLOW}📋 Syncing bin/ scripts...${NC}"
    LIBRARY_BIN="node_modules/@pumuki/ast-intelligence-hooks/bin"
    TARGET_BIN="scripts/hooks-system/bin"
    if [ -d "$LIBRARY_BIN" ] && [ -d "$TARGET_BIN" ]; then
        for script in guard-env.sh start-guards.sh guard-supervisor.js session-loader.sh update-evidence.sh; do
            if [ -f "$LIBRARY_BIN/$script" ]; then
                cp "$LIBRARY_BIN/$script" "$TARGET_BIN/$script"
            fi
        done
        echo -e "${GREEN}  ✅ bin/ scripts synced${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Library updated successfully${NC}"
    echo -e "${BLUE}💡 Restart MCP server and guards: ./scripts/hooks-system/bin/start-guards.sh restart${NC}"
    echo ""
}

remove_library() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Remove Library - Uninstall Completely                       ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    [ -d "scripts/hooks-system" ] && rm -rf scripts/hooks-system && echo -e "${GREEN}✅ Removed scripts/hooks-system/${NC}"
    [ -f ".cursor/mcp.json" ] && rm -f .cursor/mcp.json && echo -e "${GREEN}✅ Removed .cursor/mcp.json${NC}"
    [ -d ".claude" ] && rm -rf .claude && echo -e "${GREEN}✅ Removed .claude/${NC}"
    [ -f ".ast-architecture.json" ] && rm -f .ast-architecture.json && echo -e "${GREEN}✅ Removed .ast-architecture.json${NC}"
    
    if [ -f "package.json" ] && grep -q "@pumuki/ast-intelligence-hooks" package.json; then
        cp package.json package.json.backup
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (pkg.devDependencies) delete pkg.devDependencies['@pumuki/ast-intelligence-hooks'];
        if (pkg.dependencies) delete pkg.dependencies['@pumuki/ast-intelligence-hooks'];
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        "
        echo -e "${GREEN}✅ Removed library from package.json${NC}"
        echo -e "${BLUE}💡 Backup saved as package.json.backup${NC}"
    fi
    
    [ -d "node_modules/@pumuki" ] && rm -rf node_modules/@pumuki && echo -e "${GREEN}✅ Removed node_modules/@pumuki/${NC}"
    
    if [ -d "node_modules/.bin" ]; then
        find node_modules/.bin -type l \( -name "ast-*" -o -name "hook-*" -o -name "audit" \) 2>/dev/null | while read -r link; do
            if [ -L "$link" ]; then
                target=$(readlink "$link" 2>/dev/null || echo "")
                if [[ "$target" == *"@pumuki"* ]]; then
                    rm -f "$link" 2>/dev/null || true
                    echo -e "${GREEN}   ✅ Removed broken symlink: $(basename "$link")${NC}"
                fi
            fi
        done
    fi
    
    [ -f "package-lock.json" ] && rm -f package-lock.json && echo -e "${GREEN}✅ Removed package-lock.json${NC}"
    [ -f ".git/hooks/pre-commit" ] && rm -f .git/hooks/pre-commit && echo -e "${GREEN}✅ Removed pre-commit hook${NC}"
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Library Removed Completely                              ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

reset_project() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Reset Project - Remove AST Intelligence Hooks              ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    [ -d "scripts/hooks-system" ] && rm -rf scripts/hooks-system && echo -e "${GREEN}✅ Removed scripts/hooks-system/${NC}"
    [ -f ".cursor/mcp.json" ] && rm -f .cursor/mcp.json && echo -e "${GREEN}✅ Removed .cursor/mcp.json${NC}"
    [ -d ".claude" ] && rm -rf .claude && echo -e "${GREEN}✅ Removed .claude/${NC}"
    [ -f ".ast-architecture.json" ] && rm -f .ast-architecture.json && echo -e "${GREEN}✅ Removed .ast-architecture.json${NC}"
    
    if [ -f "package.json" ] && grep -q "@pumuki/ast-intelligence-hooks" package.json; then
        cp package.json package.json.backup
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (pkg.devDependencies) delete pkg.devDependencies['@pumuki/ast-intelligence-hooks'];
        if (pkg.dependencies) delete pkg.dependencies['@pumuki/ast-intelligence-hooks'];
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        "
        echo -e "${GREEN}✅ Removed library from package.json${NC}"
        echo -e "${BLUE}💡 Backup saved as package.json.backup${NC}"
    fi
    
    [ -d "node_modules/@pumuki" ] && rm -rf node_modules/@pumuki && echo -e "${GREEN}✅ Removed node_modules/@pumuki/${NC}"
    
    if [ -d "node_modules/.bin" ]; then
        find node_modules/.bin -type l \( -name "ast-*" -o -name "hook-*" -o -name "audit" \) 2>/dev/null | while read -r link; do
            if [ -L "$link" ]; then
                target=$(readlink "$link" 2>/dev/null || echo "")
                if [[ "$target" == *"@pumuki"* ]]; then
                    rm -f "$link" 2>/dev/null || true
                    echo -e "${GREEN}   ✅ Removed broken symlink: $(basename "$link")${NC}"
                fi
            fi
        done
    fi
    
    [ -f "package-lock.json" ] && rm -f package-lock.json && echo -e "${GREEN}✅ Removed package-lock.json${NC}"
    [ -f ".git/hooks/pre-commit" ] && rm -f .git/hooks/pre-commit && echo -e "${GREEN}✅ Removed pre-commit hook${NC}"
    
    echo ""
    read -p "Remove node_modules completely? [y/N]: " reply
    case "$reply" in
        [yY]) [ -d "node_modules" ] && rm -rf node_modules && echo -e "${GREEN}✅ Removed node_modules/${NC}" ;;
        *) echo -e "${BLUE}ℹ️  Keeping node_modules/${NC}" ;;
    esac
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Project Reset Complete                                  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

fresh_install() {
    echo -e "${BLUE}🚀 Starting fresh install...${NC}"
    echo ""
    
    reset_project <<< "y"
    
    echo -e "${YELLOW}[1/3] Installing basic dependencies...${NC}"
    npm install
    echo ""
    
    echo -e "${YELLOW}[2/3] Installing library...${NC}"
    npm install --save-dev "$LIBRARY_PATH"
    echo ""
    
    echo -e "${YELLOW}[3/3] Installing hooks and MCP servers...${NC}"
    npm run install-hooks
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Fresh Install Complete                                  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "   1. Restart Cursor/IDE to activate MCP servers"
    echo -e "   2. Run first audit: npm run audit"
    echo ""
}

# ============================================
# Main
# ============================================

case "${1:-}" in
    update)
        update_library
        ;;
    remove|uninstall)
        remove_library
        ;;
    reset)
        reset_project
        ;;
    install)
        fresh_install
        ;;
    *)
        show_menu
        ;;
esac

