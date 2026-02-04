#!/bin/bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [[ -z "$REPO_ROOT" ]]; then
  echo "Git repository root not found" >&2
  exit 1
fi

cd "$REPO_ROOT"

RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

current_branch=$(git branch --show-current 2>/dev/null || echo "")
if [[ -z "$current_branch" ]]; then
  exit 0
fi

# Only enforce on fix/ y feature/
if [[ ! "$current_branch" =~ ^(fix|feature)/ ]]; then
  exit 0
fi

# Ensure working tree clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo -e "${RED}❌ No puedes abandonar ${current_branch} con cambios pendientes.${NC}"
  echo -e "${CYAN}Limpia el árbol (commit, stash o descarta) antes de hacer checkout.${NC}"
  exit 1
fi

# Evidence freshness (máximo 3 minutos)
EVIDENCE_FILE=".AI_EVIDENCE.json"
if [[ -f "$EVIDENCE_FILE" ]]; then
  evidence_ts=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  if [[ -n "$evidence_ts" && "$evidence_ts" != "null" ]]; then
    clean_ts=$(echo "$evidence_ts" | sed 's/\.[0-9]*Z$/Z/')
    evidence_epoch=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$clean_ts" +%s 2>/dev/null || date -d "$clean_ts" +%s 2>/dev/null || echo "0")
    now_epoch=$(date +%s)
    age=$((now_epoch - evidence_epoch))
    if (( age > 180 )); then
      echo -e "${YELLOW}⚠️  La evidencia tiene ${age}s (>3 min). Ejecuta ai-start/update-evidence antes de salir.${NC}"
      exit 1
    fi
  fi
fi

# Ensure último commit incluye tests/specs si hay commits
last_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
commit_count=$(git rev-list --count HEAD 2>/dev/null || echo "0")
if [[ -n "$last_commit" ]] && (( commit_count >= 2 )); then
  files_last_commit=$(git diff --name-only HEAD^ HEAD || echo "")
  if [[ -n "$files_last_commit" ]]; then
    if ! echo "$files_last_commit" | grep -qE "(\.spec\.tsx$|\.spec\.ts$|\.test\.tsx$|\.feature$)"; then
      echo -e "${RED}❌ Último commit sin specs/tests detectados.${NC}"
      echo -e "${CYAN}Aplica BDD→TDD: asegura que cada commit incluya el spec correspondiente antes de abandonar la rama.${NC}"
      exit 1
    fi
  fi
fi

# Ensure build/test artefacts no staged (defensa adicional)
if (( commit_count >= 2 )) && git diff --name-only HEAD^ HEAD | grep -qE "(\.next/|dist/|build/|coverage/)"; then
  echo -e "${YELLOW}⚠️  El último commit contiene artefactos de build/test. Límpialos antes de salir.${NC}"
  exit 1
fi

# A modo informativo, sugerir ejecutar tests antes de salir
echo -e "${CYAN}🐈 Pumuki: recuerda ejecutar tests (npm run test) y build (npm run build) antes de abandonar ${current_branch}.${NC}"

exit 0
