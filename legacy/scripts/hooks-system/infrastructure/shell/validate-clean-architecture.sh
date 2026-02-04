#!/usr/bin/env bash
# =============================================================================
# Clean Architecture Validator
# =============================================================================
# Purpose: Auto-validate file paths against Clean Architecture rules
# Author: Carlos Merlos
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VIOLATIONS=0

# =============================================================================
# Frontend Rules (React/TypeScript/Next.js)
# =============================================================================
validate_frontend_file() {
  local file="$1"
  local filename=$(basename "$file")
  local dir=$(dirname "$file")

  # Hook files
  if [[ "$filename" =~ ^use[A-Z].*\.(ts|tsx)$ ]]; then
    if [[ ! "$dir" =~ presentation/hooks$ ]]; then
      echo -e "${RED}❌ VIOLATION: Hook file in wrong location${NC}"
      echo -e "   File: $file"
      echo -e "   Rule: Custom hooks → ${GREEN}presentation/hooks/${NC}"
      echo -e "   Found in: ${RED}$dir${NC}"
      echo -e "   Fix: Move to presentation/hooks/"
      ((VIOLATIONS++))
      return 1
    fi
  fi

  # Config files
  if [[ "$filename" =~ \.config\.(ts|js)$ ]] || [[ "$filename" =~ ^(api|i18n|env)\.(ts|js)$ ]]; then
    if [[ ! "$dir" =~ infrastructure/config$ ]]; then
      echo -e "${RED}❌ VIOLATION: Config file in wrong location${NC}"
      echo -e "   File: $file"
      echo -e "   Rule: Configuration → ${GREEN}infrastructure/config/${NC}"
      echo -e "   Found in: ${RED}$dir${NC}"
      echo -e "   Fix: Move to infrastructure/config/"
      ((VIOLATIONS++))
      return 1
    fi
  fi

  # Store files (Zustand/Redux)
  if [[ "$filename" =~ Store\.(ts|tsx)$ ]] || [[ "$filename" =~ \.store\.(ts|tsx)$ ]]; then
    if [[ ! "$dir" =~ presentation/stores$ ]]; then
      echo -e "${RED}❌ VIOLATION: Store file in wrong location${NC}"
      echo -e "   File: $file"
      echo -e "   Rule: State stores → ${GREEN}presentation/stores/${NC}"
      echo -e "   Found in: ${RED}$dir${NC}"
      echo -e "   Fix: Move to presentation/stores/"
      ((VIOLATIONS++))
      return 1
    fi
  fi

  # Use Case files
  if [[ "$filename" =~ UseCase\.(ts|js)$ ]]; then
    if [[ ! "$dir" =~ application/use-cases$ ]]; then
      echo -e "${RED}❌ VIOLATION: Use Case in wrong location${NC}"
      echo -e "   File: $file"
      echo -e "   Rule: Use Cases → ${GREEN}application/use-cases/${NC}"
      echo -e "   Found in: ${RED}$dir${NC}"
      echo -e "   Fix: Move to application/use-cases/"
      ((VIOLATIONS++))
      return 1
    fi
  fi

  # Repository implementations
  if [[ "$filename" =~ Repository\.(ts|js)$ ]] && [[ ! "$filename" =~ ^I[A-Z] ]]; then
    if [[ ! "$dir" =~ infrastructure/repositories$ ]]; then
      echo -e "${RED}❌ VIOLATION: Repository implementation in wrong location${NC}"
      echo -e "   File: $file"
      echo -e "   Rule: Repository impl → ${GREEN}infrastructure/repositories/${NC}"
      echo -e "   Found in: ${RED}$dir${NC}"
      echo -e "   Fix: Move to infrastructure/repositories/"
      ((VIOLATIONS++))
      return 1
    fi
  fi

  # Repository interfaces
  if [[ "$filename" =~ ^I[A-Z].*Repository\.(ts|js)$ ]]; then
    if [[ ! "$dir" =~ domain/repositories$ ]]; then
      echo -e "${RED}❌ VIOLATION: Repository interface in wrong location${NC}"
      echo -e "   File: $file"
      echo -e "   Rule: Repository interface → ${GREEN}domain/repositories/${NC}"
      echo -e "   Found in: ${RED}$dir${NC}"
      echo -e "   Fix: Move to domain/repositories/"
      ((VIOLATIONS++))
      return 1
    fi
  fi

  # FORBIDDEN DIRECTORIES
  if [[ "$dir" =~ /lib/ ]] && [[ ! "$dir" =~ /node_modules/ ]]; then
    echo -e "${RED}❌ VIOLATION: File in forbidden 'lib/' directory${NC}"
    echo -e "   File: $file"
    echo -e "   Rule: ${RED}NEVER use lib/${NC}"
    echo -e "   Use instead:"
    echo -e "     - infrastructure/ (for services, config)"
    echo -e "     - presentation/ (for hooks, components)"
    ((VIOLATIONS++))
    return 1
  fi

  if [[ "$dir" =~ /utils/ ]] && [[ ! "$dir" =~ /node_modules/ ]]; then
    echo -e "${RED}❌ VIOLATION: File in forbidden 'utils/' directory${NC}"
    echo -e "   File: $file"
    echo -e "   Rule: ${RED}NEVER use utils/${NC}"
    echo -e "   Use instead:"
    echo -e "     - application/ (for business logic)"
    echo -e "     - domain/ (for domain logic)"
    ((VIOLATIONS++))
    return 1
  fi

  if [[ "$dir" =~ /helpers/ ]] && [[ ! "$dir" =~ /node_modules/ ]]; then
    echo -e "${RED}❌ VIOLATION: File in forbidden 'helpers/' directory${NC}"
    echo -e "   File: $file"
    echo -e "   Rule: ${RED}NEVER use helpers/${NC}"
    echo -e "   Use: ${GREEN}application/use-cases/${NC}"
    ((VIOLATIONS++))
    return 1
  fi

  return 0
}

# =============================================================================
# Backend Rules (NestJS)
# =============================================================================
validate_backend_file() {
  local file="$1"
  local filename=$(basename "$file")
  local dir=$(dirname "$file")

  # Controller files
  if [[ "$filename" =~ \.controller\.(ts|js)$ ]]; then
    if [[ ! "$dir" =~ presentation/controllers$ ]] && [[ ! "$dir" =~ src/[^/]+$ ]]; then
      echo -e "${YELLOW}⚠️  WARNING: Controller not in presentation/controllers${NC}"
      echo -e "   File: $file"
      echo -e "   Recommended: ${GREEN}presentation/controllers/${NC}"
      echo -e "   Current: $dir"
    fi
  fi

  # Guard files
  if [[ "$filename" =~ \.guard\.(ts|js)$ ]]; then
    if [[ ! "$dir" =~ presentation/guards$ ]] && [[ ! "$dir" =~ src/guards$ ]]; then
      echo -e "${YELLOW}⚠️  WARNING: Guard not in presentation/guards${NC}"
      echo -e "   File: $file"
      echo -e "   Recommended: ${GREEN}presentation/guards/${NC}"
    fi
  fi

  # Use Case files
  if [[ "$filename" =~ UseCase\.(ts|js)$ ]] || [[ "$filename" =~ \.use-case\.(ts|js)$ ]]; then
    if [[ ! "$dir" =~ application/use-cases$ ]]; then
      echo -e "${RED}❌ VIOLATION: Use Case in wrong location${NC}"
      echo -e "   File: $file"
      echo -e "   Rule: Use Cases → ${GREEN}application/use-cases/${NC}"
      echo -e "   Found in: ${RED}$dir${NC}"
      ((VIOLATIONS++))
      return 1
    fi
  fi

  # DTO files
  if [[ "$filename" =~ \.dto\.(ts|js)$ ]]; then
    if [[ ! "$dir" =~ application/dtos$ ]] && [[ ! "$dir" =~ src/[^/]+/dto$ ]]; then
      echo -e "${YELLOW}⚠️  WARNING: DTO not in application/dtos${NC}"
      echo -e "   File: $file"
      echo -e "   Recommended: ${GREEN}application/dtos/${NC}"
    fi
  fi

  # FORBIDDEN DIRECTORIES (same as frontend)
  if [[ "$dir" =~ /lib/ ]] && [[ ! "$dir" =~ /node_modules/ ]]; then
    echo -e "${RED}❌ VIOLATION: File in forbidden 'lib/' directory${NC}"
    echo -e "   File: $file"
    echo -e "   Rule: ${RED}NEVER use lib/${NC} → Use ${GREEN}infrastructure/${NC}"
    ((VIOLATIONS++))
    return 1
  fi

  return 0
}

# =============================================================================
# Main Validator
# =============================================================================

validate_staged_files() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}🏗️  Clean Architecture Validator${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  local staged_files=$(git diff --cached --name-only --diff-filter=ACM)

  if [[ -z "$staged_files" ]]; then
    echo -e "${GREEN}✅ No files to validate${NC}"
    return 0
  fi

  local file_count=$(echo "$staged_files" | wc -l | tr -d ' ')
  echo "📁 Validating $file_count staged file(s)..."
  echo ""

  while IFS= read -r file; do
    # Skip non-source files
    [[ "$file" =~ \.(md|json|yml|yaml|txt|lock)$ ]] && continue
    [[ "$file" =~ node_modules/ ]] && continue
    [[ "$file" =~ \.git/ ]] && continue

    # Detect platform and validate
    if [[ "$file" =~ \.(ts|tsx|jsx)$ ]] && [[ "$file" =~ apps/(admin-dashboard|web)/ ]]; then
      validate_frontend_file "$file"
    elif [[ "$file" =~ \.(ts|js)$ ]] && [[ "$file" =~ apps/backend/ ]]; then
      validate_backend_file "$file"
    fi
  done <<< "$staged_files"

  echo ""
  if [[ $VIOLATIONS -gt 0 ]]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ CLEAN ARCHITECTURE VIOLATED: $VIOLATIONS violation(s)${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Fix violations or move files to correct directories.${NC}"
    echo ""
    echo -e "${BLUE}Need help? Run:${NC}"
    echo -e "  ${GREEN}cat .cursorrules${NC}  # See structure rules"
    echo ""
    return 1
  else
    echo -e "${GREEN}✅ Clean Architecture: All files in correct locations${NC}"
    return 0
  fi
}

# Run validation
validate_staged_files
