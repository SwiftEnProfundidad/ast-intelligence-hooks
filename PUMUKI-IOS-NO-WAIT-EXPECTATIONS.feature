Feature: iOS async XCTest waits must be enforced by AST Intelligence

  Scenario: Async XCTest functions using legacy waits are detected without blocking sync brownfield waits
    Given an iOS XCTest file contains an async test function
    When the async test function calls wait(for:) or waitForExpectations(timeout:)
    Then Pumuki emits skills.ios.no-wait-for-expectations through the iOS AST Intelligence detector
    And a synchronous brownfield XCTest wait outside async migration scope is not reported by this rule
    And await fulfillment(of:) remains accepted as the modern replacement
