Feature: PUMUKI-INC-128 RuralGo brownfield XCTest compatibility

  Scenario: XCTest-only brownfield specs do not trigger Swift Testing migration blockers
    Given a RuralGo iOS brownfield test file uses XCTestCase in a .spec.swift suite
    And the file does not import Testing or declare Swift Testing suites
    When Pumuki extracts iOS Swift Testing heuristic facts
    Then Pumuki must not emit "skills.ios.prefer-swift-testing"
    And Pumuki must not emit "skills.ios.no-xctassert"
    And Pumuki must not emit "skills.ios.no-xctunwrap"
    And XCTest quality requirements remain owned by the dedicated iOS test quality guard
