Feature: PUMUKI-INC-123 evidence root cause notification

  Scenario: TDD/BDD evidence errors are shown before tracking context
    Given an AI gate blocked event contains EVIDENCE_GATE_BLOCKED and a TDD/BDD evidence error
    And tracking context is available for the repository
    When Pumuki builds the gate blocked notification
    Then the visible cause names the TDD/BDD evidence problem
    And the visible remediation does not instruct the user to fix tracking
