#!/bin/bash
# ===== SYNC TO LIBRARY =====
# Sincroniza mejoras de este proyecto a la librería compartida
# Uso: bash scripts/sync-to-library.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

LIBRARY_DIR=~/Library/ast-intelligence-hooks
PROJECT_ROOT=$(git rev-parse --show-toplevel)

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Syncing to Library                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -d "$LIBRARY_DIR" ]; then
    echo -e "${YELLOW}⚠️  Librería no existe, creándola...${NC}"
    mkdir -p "$LIBRARY_DIR"
fi

# Ejecutar script de sync de la librería
if [ -f "$LIBRARY_DIR/sync-from-project.sh" ]; then
    bash "$LIBRARY_DIR/sync-from-project.sh" "$PROJECT_ROOT"
else
    # Sync manual si no existe el script
    echo -e "${BLUE}🔄 Sync manual...${NC}"

    rsync -av --delete \
      --exclude='.audit_tmp' \
      --exclude='node_modules' \
      --exclude='.git' \
      scripts/hooks-system/ \
      "$LIBRARY_DIR/"

    echo -e "${GREEN}✅ Librería actualizada${NC}"
fi

echo ""
echo -e "${GREEN}✅ Sync completado${NC}"
echo -e "${BLUE}📁 Librería:${NC} $LIBRARY_DIR"
echo ""
