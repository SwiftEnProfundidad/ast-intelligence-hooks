Feature: RuralGo XCTest brownfield quality gate
  Scenario: Do not block a green XCTest brownfield slice as missing critical test quality
    Given a consumer iOS slice validated with a green XCTest focal test
    And the evidence evaluates skills.ios.prefer-swift-testing as a WARN for brownfield migration
    When Pumuki evaluates PRE_WRITE and PRE_COMMIT for the staged slice
    Then the skills contract must not report skills.ios.critical-test-quality as missing
    And the WARN must not become a blocking EVIDENCE_GATE_BLOCKED cause
