Feature: PUMUKI-INC-059 iOS SOLID enforcement in PRE_WRITE
  Pumuki must block hard iOS skill violations before a consumer persists code.

  Scenario: PRE_WRITE blocks OCP switch over outcome in an iOS coordinator
    Given ios-enterprise-rules are active for a Swift consumer
    When a coordinator introduces a switch over an AppConfigurationOutcome-style outcome
    Then AST Intelligence emits heuristics.ios.solid.ocp.discriminator-switch.ast
    And the mapped ios.solid.ocp.discriminator-switch-branching rule blocks the gate

  Scenario: PRE_WRITE blocks XCTestCase suites mixing responsibilities
    Given ios-enterprise-rules are active for Swift tests
    When one XCTestCase mixes configuration, session, onboarding, permissions, tutorial or splash responsibilities
    Then AST Intelligence emits heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast
    And the mapped ios.solid.srp.presentation-mixed-responsibilities rule blocks the gate
