Feature: PUMUKI-INC-131 tracked evidence restage opt-out

  Scenario: PRE_COMMIT respects tracked evidence that was not staged by the developer
    Given a consumer repository has .ai_evidence.json tracked
    And the developer stages only code files for a remediation commit
    When Pumuki evaluates PRE_COMMIT and the gate allows the commit
    Then Pumuki must not add .ai_evidence.json to the index automatically
    And documentation-only commits still restore tracked evidence drift
    And PUMUKI_PRE_COMMIT_ALWAYS_RESTAGE_TRACKED_EVIDENCE=1 preserves the previous restage behavior
