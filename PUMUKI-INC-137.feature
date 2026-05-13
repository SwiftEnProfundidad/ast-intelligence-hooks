Feature: RuralGo staged audit scope and blocking cause priority

  Scenario: A staged iOS slice is not blocked by unrelated baseline debt
    Given a consumer has a staged iOS slice with its tracking document
    When Pumuki audits PRE_COMMIT in gate mode
    Then the audit uses the staged scope instead of the whole repository
    And unrelated baseline findings outside the staged slice do not become actionable blockers
    And a critical skills enforcement gap is reported before any enriched tracking context
