Feature: PUMUKI-INC-130 XCTest brownfield helpers

  Scenario: XCTest helpers and factories are not treated as migrable test suites
    Given a brownfield iOS repository has XCTest helper or factory files
    And those files import XCTest but do not declare XCTestCase suites with test methods
    When Pumuki evaluates PRE_COMMIT skills enforcement
    Then Pumuki must not emit skills.ios.prefer-swift-testing for those helpers
    And Pumuki must not emit governance.skills.ios-test-quality.incomplete for those helpers
    And real XCTestCase suites remain covered by the iOS test quality guard
