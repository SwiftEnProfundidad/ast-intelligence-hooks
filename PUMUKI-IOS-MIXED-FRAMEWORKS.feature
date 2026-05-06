Feature: iOS AST Intelligence mixed testing frameworks

  Scenario: XCTestCase files mixed with Swift Testing markers are detected
    Given an iOS test file declares an XCTestCase class
    When the same file also declares Swift Testing markers such as import Testing, @Suite or @Test
    Then Pumuki reports heuristics.ios.testing.mixed-frameworks.ast in PRE_WRITE, PRE_COMMIT and PRE_PUSH
    And it ignores @Test or @Suite text that only appears inside comments or string literals
    And it does not report XCTest-only brownfield files or Swift Testing-only files
