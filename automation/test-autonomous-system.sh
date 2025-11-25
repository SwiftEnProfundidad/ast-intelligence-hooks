#!/bin/bash
# End-to-End Testing: Autonomous AST Intelligence System

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
TEST_RESULTS=()

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🧪 Testing Autonomous AST Intelligence System${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

test_scenario() {
  local name="$1"
  local expected_confidence="$2"
  local expected_action="$3"
  shift 3
  local files=("$@")
  
  echo -e "${CYAN}Testing: $name${NC}"
  
  git stash -q 2>/dev/null || true
  
  git checkout -b "test/$name" 2>/dev/null || git checkout "test/$name"
  
  for file in "${files[@]}"; do
    mkdir -p "$(dirname "$file")"
    echo "// Test file" > "$file"
    git add "$file"
  done
  
  node -e "
    const AutonomousOrchestrator = require('./scripts/hooks-system/application/services/AutonomousOrchestrator');
    const ContextDetectionEngine = require('./scripts/hooks-system/application/services/ContextDetectionEngine');
    const PlatformDetectionService = require('./scripts/hooks-system/application/services/PlatformDetectionService');
    
    (async () => {
      const contextEngine = new ContextDetectionEngine('$REPO_ROOT');
      const platformDetector = new PlatformDetectionService();
      const orchestrator = new AutonomousOrchestrator(contextEngine, platformDetector, null);
      
      const result = await orchestrator.analyzeContext();
      console.log(JSON.stringify(result, null, 2));
    })();
  " > /tmp/test-result.json 2>&1
  
  CONFIDENCE=$(jq -r '.confidence' /tmp/test-result.json 2>/dev/null || echo "0")
  ACTION=$(jq -r '.action' /tmp/test-result.json 2>/dev/null || echo "error")
  
  git reset --hard -q
  git checkout develop -q 2>/dev/null || git checkout main -q
  git branch -D "test/$name" -q 2>/dev/null || true
  
  if [[ "$CONFIDENCE" -ge "$expected_confidence" ]] && [[ "$ACTION" == "$expected_action" ]]; then
    echo -e "   ${GREEN}✅ PASS${NC} (confidence: ${CONFIDENCE}%, action: $ACTION)"
    TEST_RESULTS+=("PASS: $name")
  else
    echo -e "   ${RED}❌ FAIL${NC} (expected: ${expected_confidence}%/${expected_action}, got: ${CONFIDENCE}%/${ACTION})"
    TEST_RESULTS+=("FAIL: $name")
  fi
  echo ""
}

echo -e "${YELLOW}Scenario 1: Backend puro (debe auto-ejecutar)${NC}"
test_scenario "backend-pure" 90 "auto-execute" \
  "apps/backend/src/users/users.service.ts" \
  "apps/backend/src/auth/auth.controller.ts"

echo -e "${YELLOW}Scenario 2: iOS puro (debe auto-ejecutar)${NC}"
test_scenario "ios-pure" 90 "auto-execute" \
  "apps/ios/Sources/App/ContentView.swift" \
  "apps/ios/Sources/App/ViewModel.swift"

echo -e "${YELLOW}Scenario 3: Cross-platform ambiguo (debe preguntar)${NC}"
test_scenario "cross-platform" 70 "ask" \
  "apps/backend/src/utils/helper.ts" \
  "apps/web-app/src/lib/utils.ts"

echo -e "${YELLOW}Scenario 4: Sin contexto claro (debe ignorar)${NC}"
test_scenario "no-context" 0 "ignore" \
  "README.md" \
  ".gitignore"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   📊 Test Results${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

PASS_COUNT=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c "^PASS" || echo "0")
FAIL_COUNT=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c "^FAIL" || echo "0")
TOTAL=${#TEST_RESULTS[@]}

echo -e "${GREEN}✅ Passed: $PASS_COUNT/$TOTAL${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT/$TOTAL${NC}"
echo ""

if [[ $FAIL_COUNT -eq 0 ]]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi

