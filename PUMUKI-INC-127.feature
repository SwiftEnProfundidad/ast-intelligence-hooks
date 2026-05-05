Feature: PUMUKI-INC-127 remediation progress advisories do not reblock PRE_WRITE

  Scenario: PRE_WRITE policy threshold ignores non-blocking remediation advisories
    Given a staged remediation fix reduces supported detector findings without adding new findings
    And Pumuki emits remediation progress findings with blocking false
    When the chained PRE_WRITE gate evaluates evidence with block_on_or_above set to INFO
    Then the evidence policy threshold must not convert those advisory findings into a block
    And the real git commit path must match pumuki-pre-commit remediation progress behavior
