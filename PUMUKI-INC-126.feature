Feature: PUMUKI-INC-126 remediation progress gate

  Scenario: Allow a staged remediation that removes a supported detector finding
    Given a consumer has a staged iOS change
    And HEAD contains a supported "skills.ios.no-force-unwrap" violation in the staged file
    And the staged version removes that violation without adding new findings
    And global declarative skills enforcement is still incomplete
    When Pumuki evaluates the staged PRE_COMMIT gate
    Then the global enforcement gap is recorded as advisory for this remediation commit
    And the gate allows the commit without a waiver or "--no-verify"

  Scenario: Keep feature work blocked while global skills enforcement is incomplete
    Given a consumer has a staged code change
    And the change does not reduce any supported detector finding from HEAD
    And global declarative skills enforcement is still incomplete
    When Pumuki evaluates the staged PRE_COMMIT gate
    Then Pumuki blocks the gate with "SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_CRITICAL"
