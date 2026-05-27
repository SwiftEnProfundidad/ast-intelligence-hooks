Feature: RuralGo XCTest brownfield quality gate
  Scenario: Green XCTest brownfield slice is not blocked by migration warning
    Given RuralGo has a green XCTest brownfield test slice
    And Pumuki evaluates skills.ios.prefer-swift-testing as a WARN
    When the AI gate evaluates the staged slice
    Then skills.ios.critical-test-quality is not reported as missing
    And the WARN does not become a blocking EVIDENCE_GATE_BLOCKED cause
