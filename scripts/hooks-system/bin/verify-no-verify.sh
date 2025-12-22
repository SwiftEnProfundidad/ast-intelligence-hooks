#!/bin/bash

# Script de verificación: Comprobar que NO se ha usado --no-verify sin autorización
# Uso: ./scripts/verify-no-verify-policy.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMITS_TO_CHECK=10

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 VERIFICACIÓN: Política de --no-verify${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Branch actual: ${YELLOW}${BRANCH}${NC}"
echo -e "Commits a revisar: ${COMMITS_TO_CHECK}"
echo ""

# Buscar en los últimos commits si hay mensajes que indiquen bypass del hook
echo -e "${BLUE}📋 Analizando últimos commits...${NC}"
echo ""

VIOLATIONS_FOUND=0

while read -r commit_hash; do
  # Obtener mensaje completo (subject + body)
  commit_full_message=$(git log -1 --pretty=format:"%B" "$commit_hash")
  commit_subject=$(git log -1 --pretty=format:"%s" "$commit_hash")

  # Buscar patrones sospechosos en el mensaje de commit
  if echo "$commit_full_message" | grep -iE "(bypass.?hook|skip.?hook|--no-verify|no.?verify)" > /dev/null 2>&1; then
    # Verificar si tiene autorización explícita en el mensaje completo
    if echo "$commit_full_message" | grep -iE "(authorized|autorizado|approved)" > /dev/null 2>&1; then
      echo -e "  ${GREEN}✅${NC} ${commit_hash:0:7}: Bypass AUTORIZADO"
      echo -e "     ${YELLOW}→${NC} ${commit_subject:0:80}..."
    else
      echo -e "  ${RED}❌${NC} ${commit_hash:0:7}: Bypass SIN AUTORIZACIÓN EXPLÍCITA"
      echo -e "     ${RED}→${NC} ${commit_subject:0:80}..."
      VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
    fi
  fi
done < <(git log -${COMMITS_TO_CHECK} --pretty=format:"%H")

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ VERIFICACIÓN EXITOSA${NC}"
  echo -e "${GREEN}   No se encontraron usos no autorizados de --no-verify${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ VERIFICACIÓN FALLIDA${NC}"
  echo -e "${RED}   Se encontraron ${VIOLATIONS_FOUND} commits con bypass sin autorización explícita${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  Acción requerida:${NC}"
  echo -e "   1. Revisar los commits marcados"
  echo -e "   2. Verificar si tienen autorización del usuario"
  echo -e "   3. Si NO tienen autorización, revertir o documentar"
  echo ""
  exit 1
fi
