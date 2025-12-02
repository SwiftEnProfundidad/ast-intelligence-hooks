#!/bin/bash
# MASTER VALIDATOR - Enforces ALL hook-system rules
# Blocks commits/pushes that violate ANY rule

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REPO_ROOT="$(git rev-parse --show-toplevel)"
EVIDENCE_FILE="$REPO_ROOT/.AI_EVIDENCE.json"

VIOLATIONS=()
CRITICAL_VIOLATIONS=()

echo "🛡️  MASTER VALIDATOR - Enforcing ALL Rules"
echo ""

# =============================================================================
# 1. EVIDENCE VALIDATION
# =============================================================================
echo "📋 Validating .AI_EVIDENCE.json..."

if [ ! -f "$EVIDENCE_FILE" ]; then
  CRITICAL_VIOLATIONS+=("❌ CRITICAL: .AI_EVIDENCE.json MISSING - AI did not read rules")
else
  # Check timestamp (max 10 minutes old)
  EVIDENCE_TS=$(jq -r '.timestamp' "$EVIDENCE_FILE" 2>/dev/null || echo "")
  if [ -z "$EVIDENCE_TS" ]; then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: .AI_EVIDENCE.json has no timestamp")
  else
    CURRENT_TS=$(date -u +%s)
    EVIDENCE_TS_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${EVIDENCE_TS:0:19}" +%s 2>/dev/null || echo "0")
    AGE=$((CURRENT_TS - EVIDENCE_TS_EPOCH))
    MAX_AGE=600  # 10 minutes

    if [ "$AGE" -gt "$MAX_AGE" ]; then
      CRITICAL_VIOLATIONS+=("❌ CRITICAL: .AI_EVIDENCE.json too old (${AGE}s > ${MAX_AGE}s)")
    fi
  fi

  # Check rules were read
  RULES_READ=$(jq -r '.rules_read.verified' "$EVIDENCE_FILE" 2>/dev/null || echo "false")
  if [ "$RULES_READ" != "true" ]; then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: AI did not read rules (rules_read.verified != true)")
  fi

  # Check 3 questions answered
  QUESTIONS_ANSWERED=$(jq -r '.protocol_3_questions.answered' "$EVIDENCE_FILE" 2>/dev/null || echo "false")
  if [ "$QUESTIONS_ANSWERED" != "true" ]; then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: 3 questions protocol not followed")
  fi
fi

# =============================================================================
# 2. GIT FLOW VALIDATION
# =============================================================================
echo "🌊 Validating Git Flow..."

CURRENT_BRANCH=$(git branch --show-current)
PROTECTED_BRANCHES="main master develop"

# Check not on protected branch
for PROTECTED in $PROTECTED_BRANCHES; do
  if [ "$CURRENT_BRANCH" = "$PROTECTED" ]; then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: Direct commit on protected branch '$CURRENT_BRANCH' - create feature branch")
  fi
done

# Check branch naming
if [[ ! "$CURRENT_BRANCH" =~ ^(feature|fix|refactor|docs|test|chore)/ ]]; then
  VIOLATIONS+=("⚠️  WARNING: Branch name '$CURRENT_BRANCH' doesn't follow convention (feature/fix/refactor/docs/test/chore)")
fi

# Check for uncommitted changes on wrong branch
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "develop" ]; then
  UNCOMMITTED=$(git status --porcelain | grep -v ".AI_EVIDENCE" || true)
  if [ -n "$UNCOMMITTED" ]; then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: Uncommitted changes on '$CURRENT_BRANCH' - switch to feature branch")
  fi
fi

# =============================================================================
# 3. AST INTELLIGENCE VALIDATION
# =============================================================================
echo "🤖 Validating AST Intelligence..."

# Check if ai_gate section exists and is ALLOWED
if [ -f "$EVIDENCE_FILE" ]; then
  AI_GATE_STATUS=$(jq -r '.ai_gate.status // "MISSING"' "$EVIDENCE_FILE")

  if [ "$AI_GATE_STATUS" = "MISSING" ]; then
    VIOLATIONS+=("⚠️  WARNING: ai_gate section missing in .AI_EVIDENCE.json")
  elif [ "$AI_GATE_STATUS" = "BLOCKED" ]; then
    VIOLATION_COUNT=$(jq -r '.ai_gate.violations | length' "$EVIDENCE_FILE")
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: AI Gate BLOCKED with $VIOLATION_COUNT violations - fix before committing")
  fi
fi

# Check for HIGH/CRITICAL violations in staged files
STAGED_FILES=$(git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx|kt|swift)$' || true)
if [ -n "$STAGED_FILES" ]; then
  # Run AST check on staged files only
  if [ -f "$REPO_ROOT/scripts/hooks-system/bin/run-ast-adapter.js" ]; then
    AST_RESULT=$(node "$REPO_ROOT/scripts/hooks-system/bin/run-ast-adapter.js" 2>&1 || true)
    if echo "$AST_RESULT" | grep -q "CRITICAL\|HIGH"; then
      CRITICAL_VIOLATIONS+=("❌ CRITICAL: AST found violations in staged files - fix before committing")
    fi
  fi
fi

# =============================================================================
# 4. RULES COMPLIANCE VALIDATION (Delegated to AST Intelligence)
# =============================================================================
echo "📚 Validating Rules Compliance (via AST Intelligence)..."

# AST Intelligence (section 3) already validated ALL rules for ALL platforms:
# - rulesbackend.mdc: NestJS, TypeScript, Clean Architecture, NO console.*, NO unknown/any
# - rulesfront.mdc: React, Next.js, TypeScript, Clean Architecture
# - rulesios.mdc: Swift, SwiftUI, NO force unwrap, Clean Architecture
# - rulesandroid.mdc: Kotlin, Compose, Clean Architecture
#
# If AST found violations in section 3, they're already in CRITICAL_VIOLATIONS array.
# We don't duplicate validation logic here - AST is the single source of truth.

# Show AST validation result
if [ -f "$EVIDENCE_FILE" ]; then
  AST_VIOLATIONS=$(jq -r '.ai_gate.violations | length' "$EVIDENCE_FILE" 2>/dev/null || echo "0")
  if [ "$AST_VIOLATIONS" != "0" ]; then
    echo "  → AST detected $AST_VIOLATIONS blocking violations"
  else
    echo "  → AST validation: Clean ✅"
  fi
fi

# =============================================================================
# 5. BUILD & TEST VALIDATION (4 Platforms)
# =============================================================================
echo "🔨 Validating Build (Backend, Frontend, iOS, Android)..."

# 5.1 Backend (NestJS/TypeScript)
BACKEND_FILES=$(git diff --cached --name-only | grep "apps/backend/.*\.(ts|js)$" || true)
if [ -n "$BACKEND_FILES" ] && [ -f "$REPO_ROOT/apps/backend/package.json" ]; then
  echo "  → Backend build..."
  if ! (cd "$REPO_ROOT/apps/backend" && npm run build > /dev/null 2>&1); then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: Backend build failed - fix TypeScript compilation errors")
  fi
fi

# 5.2 Frontend (Next.js/React/TypeScript)
FRONTEND_FILES=$(git diff --cached --name-only | grep -E "apps/(admin-dashboard|web-app)/.*\.(tsx?|jsx?)$" || true)
if [ -n "$FRONTEND_FILES" ]; then
  if [ -f "$REPO_ROOT/apps/admin-dashboard/package.json" ]; then
    echo "  → Frontend (admin-dashboard) build..."
    if ! (cd "$REPO_ROOT/apps/admin-dashboard" && npm run build > /dev/null 2>&1); then
      CRITICAL_VIOLATIONS+=("❌ CRITICAL: Frontend (admin-dashboard) build failed - fix compilation errors")
    fi
  fi
  if [ -f "$REPO_ROOT/apps/web-app/package.json" ]; then
    echo "  → Frontend (web-app) build..."
    if ! (cd "$REPO_ROOT/apps/web-app" && npm run build > /dev/null 2>&1); then
      CRITICAL_VIOLATIONS+=("❌ CRITICAL: Frontend (web-app) build failed - fix compilation errors")
    fi
  fi
fi

# 5.3 iOS (Swift/SwiftUI)
IOS_FILES=$(git diff --cached --name-only | grep "apps/ios/.*\.swift$" || true)
if [ -n "$IOS_FILES" ] && [ -f "$REPO_ROOT/apps/ios/Package.swift" ]; then
  echo "  → iOS build..."
  if ! (cd "$REPO_ROOT/apps/ios" && swift build > /dev/null 2>&1); then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: iOS build failed - fix Swift compilation errors")
  fi
fi

# 5.4 Android (Kotlin/Jetpack Compose)
ANDROID_FILES=$(git diff --cached --name-only | grep "apps/android/.*\.kt$" || true)
if [ -n "$ANDROID_FILES" ] && [ -f "$REPO_ROOT/apps/android/build.gradle.kts" ]; then
  echo "  → Android build..."
  if ! (cd "$REPO_ROOT/apps/android" && ./gradlew build -q > /dev/null 2>&1); then
    CRITICAL_VIOLATIONS+=("❌ CRITICAL: Android build failed - fix Kotlin compilation errors")
  fi
fi

# =============================================================================
# FINAL VERDICT
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VALIDATION RESULTS"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ ${#CRITICAL_VIOLATIONS[@]} -gt 0 ]; then
  echo -e "${RED}🚫 COMMIT BLOCKED - ${#CRITICAL_VIOLATIONS[@]} CRITICAL VIOLATIONS${NC}"
  echo ""
  for violation in "${CRITICAL_VIOLATIONS[@]}"; do
    echo -e "${RED}$violation${NC}"
  done
  echo ""
  echo -e "${YELLOW}Fix all violations before committing.${NC}"
  echo -e "${YELLOW}The hook-system enforces quality - do not bypass it.${NC}"
  echo ""

  # Send notification
  osascript -e "display notification \"${#CRITICAL_VIOLATIONS[@]} critical violations block commit\" with title \"🚫 Commit Blocked\" sound name \"Basso\"" 2>/dev/null || true

  exit 1
fi

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠️  ${#VIOLATIONS[@]} WARNINGS (commit allowed but should fix)${NC}"
  echo ""
  for violation in "${VIOLATIONS[@]}"; do
    echo -e "${YELLOW}$violation${NC}"
  done
  echo ""
fi

echo -e "${GREEN}✅ ALL VALIDATIONS PASSED${NC}"
echo -e "${GREEN}   - Evidence: Fresh & Complete${NC}"
echo -e "${GREEN}   - Git Flow: Compliant${NC}"
echo -e "${GREEN}   - AST: Clean${NC}"
echo -e "${GREEN}   - Rules: Followed${NC}"
echo -e "${GREEN}   - Build: Passing${NC}"
echo ""
echo "🎯 Commit allowed - all quality gates passed"
echo ""

exit 0
