Feature: iOS AST Intelligence legacy expectation descriptions

  Scenario: Async XCTest expectation scaffolding is detected by semantic function scope
    Given an iOS async XCTest function creates expectation(description:) without modern fulfillment or confirmation
    When Pumuki extracts iOS AST Intelligence facts for PRE_WRITE, PRE_COMMIT or PRE_PUSH
    Then it reports heuristics.ios.testing.legacy-expectation-description.ast
    And it does not report synchronous brownfield XCTest expectation scaffolding for this async migration rule
    And it accepts await fulfillment(of:) or await confirmation flows in the same async function body
