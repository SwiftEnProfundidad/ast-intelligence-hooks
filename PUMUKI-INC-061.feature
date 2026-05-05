Feature: PUMUKI-INC-061 actionable policy remediation
  Scenario: Blocked governance notification uses applying policy reconcile
    Given a consumer gate is blocked because policy or skills governance must be reconciled
    When Pumuki renders the blocked notification command
    Then the visible remediation uses policy reconcile with strict apply before revalidation
