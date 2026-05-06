Feature: PUMUKI-INC-129 RuralGo iOS remediation commits must not be blocked by global skills backlog

  Scenario: PRE_COMMIT allows staged iOS XCTest remediation that removes supported test-quality violations
    Given a brownfield iOS XCTest file previously missed makeSUT and trackForMemoryLeaks
    And the staged version adds makeSUT and trackForMemoryLeaks without introducing new supported findings
    And global skills enforcement still has declarative rules waiting for AST detector coverage
    When Pumuki evaluates PRE_COMMIT
    Then the supported remediation is allowed to commit
    And governance.skills.global-enforcement.incomplete is downgraded to an advisory for that remediation commit
    And system notifications remain disabled when PUMUKI_SYSTEM_NOTIFICATIONS=0 or PUMUKI_NOTIFICATIONS=0
