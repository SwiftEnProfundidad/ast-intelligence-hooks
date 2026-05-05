Feature: PUMUKI-INC-125 global skills AST enforcement coverage

  Scenario: Declarative hard skill rules without AST detector fail closed in pre hooks
    Given a repository has hard platform skills active for iOS, Android, backend and frontend
    And the runtime AUTO rules for the stage are fully evaluated
    But the global skills registry still contains hard declarative rules without AST detectors
    When Pumuki audits PRE_WRITE, PRE_COMMIT or PRE_PUSH
    Then Pumuki reports auto_runtime_coverage_ratio separately from semantic_enforcement_ratio
    And Pumuki emits SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_CRITICAL
    And Pumuki blocks the stage until every hard skill rule has an AST detector or an explicit gate waiver
