Feature: TDD/BDD baseline test detection

  Scenario: Pumuki blocks stale or missing baseline test evidence
    Given a slice has TDD/BDD enforcement enabled
    When the baseline test evidence is missing, stale, or failed
    Then Pumuki blocks the gate before implementation proceeds
    And the evidence explains which baseline test must be refreshed
